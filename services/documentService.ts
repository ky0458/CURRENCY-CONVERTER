
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

export const extractTextFromPdf = async (file: File): Promise<string> => {
    const pdf = await getPdfDocument(file);
    let fullText = '';

    for (let i = 1; i <= pdf.numPages; i++) {
        const page = await pdf.getPage(i);
        const textContent = await page.getTextContent();
        
        // Improve layout preservation by checking Y position gaps
        let lastY = -1;
        let pageText = '';
        
        for (const item of textContent.items as any[]) {
            if (lastY !== -1 && Math.abs(item.transform[5] - lastY) > 10) {
                 pageText += '\n'; // Add newline if Y difference implies new line
            } else if (lastY !== -1) {
                 pageText += ' '; // Add space for items on same line
            }
            pageText += item.str;
            lastY = item.transform[5];
        }
        
        fullText += pageText + '\n\n';
    }

    return fullText;
};

export const extractTextFromDocx = async (file: File): Promise<string> => {
    const arrayBuffer = await file.arrayBuffer();
    const result = await mammoth.extractRawText({ arrayBuffer: arrayBuffer });
    return result.value;
};

export const convertDocxToHtml = async (file: File): Promise<string> => {
    const arrayBuffer = await file.arrayBuffer();
    const result = await mammoth.convertToHtml({ arrayBuffer: arrayBuffer });
    return result.value;
};

// Return type for chunk translation
interface ChunkResult {
    translatedText: string;
    detectedSource?: string;
}

// Helper function to translate a single chunk
const translateChunk = async (text: string, sourceLang: string, targetLang: string): Promise<ChunkResult> => {
    if (!text.trim()) return { translatedText: '' };
    try {
        const encodedText = encodeURIComponent(text.trim());
        const sl = sourceLang === 'auto' ? 'auto' : sourceLang;
        const tl = targetLang;
        
        const url = `https://translate.googleapis.com/translate_a/single?client=gtx&sl=${sl}&tl=${tl}&dt=t&q=${encodedText}`;
        
        const response = await fetch(url);
        if (!response.ok) return { translatedText: text }; 

        const data = await response.json();
        // data[0] contains translated sentences
        // data[2] usually contains detected language code (e.g., 'en', 'vi')
        if (data && data[0]) {
             const translatedText = data[0].map((part: any) => part[0]).join('');
             const detectedSource = data[2];
             return { translatedText, detectedSource };
        }
        return { translatedText: text };
    } catch (e) {
        console.error("Translation chunk error", e);
        return { translatedText: text };
    }
};

export interface TranslationResult {
    text: string;
    detectedLang: string;
}

export const translateDocumentText = async (
    text: string, 
    sourceLang: string = 'auto', 
    targetLang: string = 'vi',
    onProgress?: (percent: number) => void
): Promise<TranslationResult> => {
    const CHUNK_SIZE = 2000;
    // Split by paragraphs to preserve structure
    // We split by double newline to identify paragraphs
    const paragraphs = text.split(/\n\s*\n/);
    
    let chunks: string[] = [];
    let currentChunk = '';

    for (const para of paragraphs) {
        if ((currentChunk + para).length > CHUNK_SIZE) {
            chunks.push(currentChunk);
            currentChunk = para + '\n\n';
        } else {
            currentChunk += para + '\n\n';
        }
    }
    if (currentChunk.trim()) chunks.push(currentChunk);

    let translatedText = '';
    let detectedLang = sourceLang;
    const totalChunks = chunks.length;

    for (let i = 0; i < totalChunks; i++) {
        const chunk = chunks[i];
        if (!chunk.trim()) continue;
        
        const result = await translateChunk(chunk, sourceLang, targetLang);
        translatedText += result.translatedText + '\n\n'; 
        
        if (i === 0 && result.detectedSource) {
            detectedLang = result.detectedSource;
        }

        if (onProgress) {
            onProgress(Math.round(((i + 1) / totalChunks) * 100));
        }
    }

    return { text: translatedText.trim(), detectedLang };
};

export const translateHtml = async (
    html: string,
    sourceLang: string = 'auto', 
    targetLang: string = 'vi',
    onProgress?: (percent: number) => void
): Promise<TranslationResult> => {
    const parser = new DOMParser();
    const doc = parser.parseFromString(html, 'text/html');
    const walker = doc.createTreeWalker(doc.body, NodeFilter.SHOW_TEXT, null);
    
    const textNodes: Node[] = [];
    let node;
    while(node = walker.nextNode()) {
        if(node.textContent && node.textContent.trim().length > 0) {
            textNodes.push(node);
        }
    }

    const SEPARATOR = ' ||| ';
    const CHUNK_SIZE = 1500;
    
    let batchNodes: Node[] = [];
    let batchText = '';
    const batches: { nodes: Node[], text: string }[] = [];

    for (const n of textNodes) {
        const text = n.textContent || '';
        if (batchText.length + text.length + SEPARATOR.length > CHUNK_SIZE && batchNodes.length > 0) {
            batches.push({ nodes: [...batchNodes], text: batchText });
            batchNodes = [];
            batchText = '';
        }
        batchText += (batchText ? SEPARATOR : '') + text;
        batchNodes.push(n);
    }
    if (batchNodes.length > 0) batches.push({ nodes: batchNodes, text: batchText });

    let detectedLang = sourceLang;
    const total = batches.length;

    for (let i = 0; i < total; i++) {
        const { nodes, text } = batches[i];
        const res = await translateChunk(text, sourceLang, targetLang);
        
        if (i === 0 && res.detectedSource) detectedLang = res.detectedSource;

        // Split result by separator, allowing for flexible spacing
        const translatedParts = res.translatedText.split(/\s*\|\|\|\s*/);

        nodes.forEach((n, idx) => {
            if (translatedParts[idx] !== undefined) {
                n.textContent = translatedParts[idx].trim();
            }
        });

        if (onProgress) onProgress(Math.round(((i + 1) / total) * 100));
    }

    return { text: doc.body.innerHTML, detectedLang };
};

export const downloadTranslatedDocument = (content: string, fileName: string) => {
    let htmlContent = content;
    
    // Check if content is likely HTML (starts with tag) or Plain Text
    if (!content.trim().startsWith('<')) {
         // Convert plain text to paragraphs
         htmlContent = content
            .split('\n\n')
            .map(para => `<p style="margin-bottom: 12pt; line-height: 1.5; font-family: 'Times New Roman', serif; font-size: 12pt;">${para.replace(/\n/g, '<br>')}</p>`)
            .join('');
    } else {
        // Wrap existing HTML in a styling div
        htmlContent = `<div style="font-family: 'Times New Roman', serif; font-size: 12pt; line-height: 1.5;">${content}</div>`;
    }

    const header = "<html xmlns:o='urn:schemas-microsoft-com:office:office' " +
        "xmlns:w='urn:schemas-microsoft-com:office:word' " +
        "xmlns='http://www.w3.org/TR/REC-html40'>" +
        "<head><meta charset='utf-8'><title>Document</title></head><body>";
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
