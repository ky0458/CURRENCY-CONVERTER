
import * as pdfjsLibModule from 'pdfjs-dist';
import mammoth from 'mammoth';

// Handle ESM default export interop for pdfjs-dist
const pdfjsLib = (pdfjsLibModule as any).default || pdfjsLibModule;

// Config Worker for PDF.js
if (pdfjsLib.GlobalWorkerOptions) {
    pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://unpkg.com/pdfjs-dist@3.11.174/build/pdf.worker.min.js';
}

export const getPdfDocument = async (file: File) => {
    const arrayBuffer = await file.arrayBuffer();
    return pdfjsLib.getDocument({ data: arrayBuffer }).promise;
};

// --- PDF OVERLAY TYPES ---
export interface PdfOverlayItem {
    text: string;
    originalText: string;
    x: number; // PDF Unit
    y: number; // PDF Unit (Baseline)
    width: number;
    height: number;
    fontSize: number;
    fontName: string;
    color?: string;
}

export interface PdfPageOverlay {
    pageIndex: number;
    width: number;
    height: number;
    items: PdfOverlayItem[];
}

const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

// --- TRANSLATION CORE ---

const translateBatch = async (texts: string[], sourceLang: string, targetLang: string): Promise<string[]> => {
    if (texts.length === 0) return [];
    
    const nonEmptyIndices: number[] = [];
    const textsToTranslate: string[] = [];
    
    texts.forEach((t, i) => {
        if (t && t.trim().length > 0) {
            nonEmptyIndices.push(i);
            textsToTranslate.push(t);
        }
    });

    if (textsToTranslate.length === 0) return texts;

    try {
        // Use a complex delimiter to avoid conflict with normal text
        const DELIMITER = ' ||| '; 
        const combinedText = textsToTranslate.join(DELIMITER);
        
        const encodedText = encodeURIComponent(combinedText);
        const sl = sourceLang === 'auto' ? 'auto' : sourceLang;
        const tl = targetLang;
        
        const url = `https://translate.googleapis.com/translate_a/single?client=gtx&sl=${sl}&tl=${tl}&dt=t&q=${encodedText}`;
        
        const response = await fetch(url);
        
        if (!response.ok) {
            console.warn("Translation API returned error status:", response.status);
            return texts; 
        }

        const data = await response.json();
        
        let fullTranslatedString = '';
        if (data && data[0]) {
             fullTranslatedString = data[0].map((part: any) => part[0]).join('');
        }

        const splitRegex = /\s*\|\|\|\s*/;
        const results = fullTranslatedString.split(splitRegex);
        
        const finalResults = [...texts];
        nonEmptyIndices.forEach((originalIndex, i) => {
            // If result is missing (API cut off), keep original
            if (results[i] !== undefined) {
                finalResults[originalIndex] = results[i].trim();
            }
        });

        return finalResults;
    } catch (e) {
        console.error("Translation batch error", e);
        return texts; 
    }
};

// --- PDF LAYOUT PRESERVING TRANSLATION ---

export const translatePdfWithLayout = async (
    file: File,
    sourceLang: string = 'auto',
    targetLang: string = 'vi',
    onProgress?: (percent: number) => void
): Promise<{ overlays: PdfPageOverlay[], detectedLang: string, fullText: string }> => {
    const pdf = await getPdfDocument(file);
    const totalPages = pdf.numPages;
    const allOverlays: PdfPageOverlay[] = [];
    let fullTranslatedText = '';
    
    for (let i = 1; i <= totalPages; i++) {
        const page = await pdf.getPage(i);
        const viewport = page.getViewport({ scale: 1.0 });
        const textContent = await page.getTextContent();
        
        // 1. Enhanced Clustering Logic
        const items = textContent.items.map((item: any) => ({
            str: item.str,
            x: item.transform[4],
            y: item.transform[5],
            w: item.width,
            h: item.height || Math.abs(item.transform[3]),
            fontName: item.fontName,
            transform: item.transform
        })).filter(it => it.str.trim().length > 0);

        // Sort: Top-Down (Y desc), then Left-Right (X asc)
        items.sort((a, b) => {
            const yDiff = Math.abs(a.y - b.y);
            // Strict tolerance for Y alignment (30% of height)
            if (yDiff < Math.max(a.h, b.h) * 0.3) {
                return a.x - b.x;
            }
            return b.y - a.y;
        });

        const lines: { 
            y: number, 
            h: number, 
            minX: number, 
            maxX: number, 
            items: typeof items 
        }[] = [];

        let currentLine: typeof lines[0] | null = null;

        for (const item of items) {
            if (!currentLine) {
                currentLine = { 
                    y: item.y, 
                    h: item.h, 
                    minX: item.x, 
                    maxX: item.x + item.w, 
                    items: [item] 
                };
                continue;
            }

            // Vertical overlap check
            const verticalDist = Math.abs(item.y - currentLine.y);
            const tolerance = Math.max(item.h, currentLine.h) * 0.5;

            if (verticalDist < tolerance) {
                // Horizontal gap check (Column detection)
                // If gap > 4x font height, assume separate column -> New Block
                const gap = item.x - currentLine.maxX;
                if (gap > Math.max(item.h, 10) * 4) {
                    lines.push(currentLine);
                    currentLine = { 
                        y: item.y, 
                        h: item.h, 
                        minX: item.x, 
                        maxX: item.x + item.w, 
                        items: [item] 
                    };
                } else {
                    // Merge into current line
                    currentLine.items.push(item);
                    currentLine.h = Math.max(currentLine.h, item.h);
                    currentLine.minX = Math.min(currentLine.minX, item.x);
                    currentLine.maxX = Math.max(currentLine.maxX, item.x + item.w);
                }
            } else {
                // New Line
                lines.push(currentLine);
                currentLine = { 
                    y: item.y, 
                    h: item.h, 
                    minX: item.x, 
                    maxX: item.x + item.w, 
                    items: [item] 
                };
            }
        }
        if (currentLine) lines.push(currentLine);

        // 2. Prepare text
        const lineTextsToTranslate = lines.map(line => {
            let str = "";
            let lastEnd = line.items[0].x;
            line.items.forEach((it, idx) => {
                if (idx > 0) {
                    const gap = it.x - lastEnd;
                    if (gap > it.h * 0.3) str += " ";
                }
                str += it.str;
                lastEnd = it.x + it.w;
            });
            return str;
        });

        // 3. Batch Translate (Safe Batch Size)
        const translatedLines: string[] = [];
        const BATCH_SIZE = 6; // Low batch size for accuracy
        
        for (let j = 0; j < lineTextsToTranslate.length; j += BATCH_SIZE) {
            const batch = lineTextsToTranslate.slice(j, j + BATCH_SIZE);
            if (j > 0) await delay(400); // More delay for reliability
            
            const translatedBatch = await translateBatch(batch, sourceLang, targetLang);
            
            // Fallback for length mismatch
            if (translatedBatch.length !== batch.length) {
                translatedLines.push(...batch); 
            } else {
                translatedLines.push(...translatedBatch);
            }
            
            if (onProgress) {
                const pageProgress = ((i - 1) / totalPages) * 100;
                const batchProgress = (j / lineTextsToTranslate.length) * (100 / totalPages);
                onProgress(Math.min(99, Math.round(pageProgress + batchProgress)));
            }
        }

        // 4. Create Overlays
        const pageOverlays: PdfOverlayItem[] = [];
        
        lines.forEach((line, index) => {
            const originalText = lineTextsToTranslate[index];
            const translatedText = translatedLines[index] || originalText;
            fullTranslatedText += translatedText + '\n';

            const width = line.maxX - line.minX;
            // Height calculation: Ensure it covers ascenders. 
            // Typically font bounding box is ~1.2 * font size
            const adjustedHeight = line.h * 1.3; 

            pageOverlays.push({
                text: translatedText,
                originalText: originalText,
                x: line.minX,
                y: line.y,
                width: width,
                height: adjustedHeight,
                fontSize: line.h,
                fontName: line.items[0].fontName
            });
        });

        allOverlays.push({
            pageIndex: i,
            width: viewport.width,
            height: viewport.height,
            items: pageOverlays
        });
    }

    if (onProgress) onProgress(100);
    return { overlays: allOverlays, detectedLang: 'auto', fullText: fullTranslatedText };
};

// --- HTML TRANSLATION (DOCX) ---

export const translateHtml = async (
    html: string,
    sourceLang: string = 'auto', 
    targetLang: string = 'vi',
    onProgress?: (percent: number) => void
): Promise<{ text: string, detectedLang: string }> => {
    const parser = new DOMParser();
    const doc = parser.parseFromString(html, 'text/html');
    
    const walker = doc.createTreeWalker(doc.body, NodeFilter.SHOW_TEXT, {
        acceptNode: (node) => {
            if (node.parentElement && ['SCRIPT', 'STYLE', 'NOSCRIPT'].includes(node.parentElement.tagName)) return NodeFilter.FILTER_REJECT;
            if (!node.textContent || node.textContent.trim().length < 1) return NodeFilter.FILTER_SKIP;
            return NodeFilter.FILTER_ACCEPT;
        }
    });
    
    const textNodes: Node[] = [];
    let node;
    while(node = walker.nextNode()) {
        textNodes.push(node);
    }

    const textValues = textNodes.map(n => n.textContent || '');
    const BATCH_SIZE = 20;
    
    for (let i = 0; i < textValues.length; i += BATCH_SIZE) {
        const batchTexts = textValues.slice(i, i + BATCH_SIZE);
        const batchNodes = textNodes.slice(i, i + BATCH_SIZE);
        
        if (i > 0) await delay(150);

        const translatedBatch = await translateBatch(batchTexts, sourceLang, targetLang);
        
        batchNodes.forEach((node, idx) => {
            if (translatedBatch[idx]) {
                node.textContent = translatedBatch[idx];
            }
        });

        if (onProgress) onProgress(Math.round(((i + BATCH_SIZE) / textValues.length) * 100));
    }

    return { text: doc.body.innerHTML, detectedLang: 'auto' };
};

// --- HELPERS ---

export const convertDocxToHtml = async (file: File): Promise<string> => {
    const arrayBuffer = await file.arrayBuffer();
    const result = await mammoth.convertToHtml({ arrayBuffer });
    return result.value;
};

export const extractTextFromPdf = async (file: File): Promise<string> => {
    return "";
};

export const downloadTranslatedDocument = (content: string, fileName: string) => {
    let htmlContent = content;
    if (!content.trim().startsWith('<')) {
         htmlContent = content.split('\n').map(p => `<p>${p}</p>`).join('');
    }
    
    const header = "<html xmlns:o='urn:schemas-microsoft-com:office:office' xmlns:w='urn:schemas-microsoft-com:office:word' xmlns='http://www.w3.org/TR/REC-html40'><head><meta charset='utf-8'></head><body>";
    const footer = "</body></html>";
    const sourceHTML = header + htmlContent + footer;

    const source = 'data:application/vnd.ms-word;charset=utf-8,' + encodeURIComponent(sourceHTML);
    const fileDownload = document.createElement("a");
    document.body.appendChild(fileDownload);
    fileDownload.href = source;
    fileDownload.download = `Translated_${fileName}.doc`;
    fileDownload.click();
    document.body.removeChild(fileDownload);
};
