import React, { useState, useCallback, useRef, useEffect } from 'react';
import * as pdfjsLibModule from 'pdfjs-dist';

const pdfjsLib = (pdfjsLibModule as any).default || pdfjsLibModule;
if (pdfjsLib.GlobalWorkerOptions) {
    pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://unpkg.com/pdfjs-dist@3.11.174/build/pdf.worker.min.js';
}

type ActionType = 'none' | 'redact' | 'delete';

interface TextBlock {
    id: string;
    text: string;
    xPct: number;
    yPct: number;
    widthPct: number;
    heightPct: number;
    rawX: number;
    rawY: number;
    rawW: number;
    rawH: number;
}

interface PageData {
    pageIndex: number;
    canvasUrl: string;
    width: number;
    height: number;
    blocks: TextBlock[];
}

const PdfBlock = React.memo(({ 
    block, 
    initialAction = 'none',
    onActionChange 
}: { 
    block: TextBlock; 
    initialAction?: ActionType;
    onActionChange: (id: string, action: ActionType) => void;
}) => {
    const [action, setAction] = useState<ActionType>(initialAction);

    const handleToggle = useCallback(() => {
        setAction(prev => {
            let next: ActionType = 'none';
            if (prev === 'none') next = 'redact';
            else if (prev === 'redact') next = 'delete';
            
            // Notify parent without triggering global re-render
            onActionChange(block.id, next);
            return next;
        });
    }, [block.id, onActionChange]);

    let actionClasses = '';
    if (action === 'redact') {
        actionClasses = 'bg-slate-900 border-transparent opacity-100';
    } else if (action === 'delete') {
        actionClasses = 'bg-white border-white opacity-100';
    } else {
        actionClasses = 'border-dashed border-indigo-400/60 hover:bg-slate-900/10 hover:border-indigo-600 opacity-60 hover:opacity-100';
    }

    return (
        <div
            data-action={action}
            className={`absolute cursor-pointer border rounded-sm touch-manipulation ${actionClasses}`}
            style={{
                left: `${block.xPct}%`,
                top: `${block.yPct}%`,
                width: `${block.widthPct}%`,
                height: `${block.heightPct}%`,
                zIndex: 10
            }}
            onClick={handleToggle}
            title={action === 'none' ? 'Chạm để Che (Đen)' : action === 'redact' ? 'Chạm để Xóa (Trắng)' : 'Chạm để Hủy'}
        >
            {action === 'none' && (
                <span className="hidden md:block opacity-0 hover:opacity-100 absolute -top-7 left-1/2 -translate-x-1/2 bg-slate-800/90 text-white text-[10px] px-2 py-0.5 rounded shadow whitespace-nowrap pointer-events-none z-20">
                    {block.text}
                </span>
            )}
        </div>
    );
});

const isSensitiveData = (text: string): boolean => {
    const str = text.trim();
    const strippedStr = str.replace(/\s+/g, '');
    
    // 1. Valid Email 
    const emailRegex = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/i;
    if (emailRegex.test(str) || emailRegex.test(strippedStr)) return true;
    
    // 2. Global Phone Number Standard (+XX, (+XX), 00XX, or 0 followed by 8-11 digits)
    const phoneRegex = /(?:(?:(?:\+|\(\+?|00)\d{1,4}\)?)|0)[1-9](?:[\s.-]*\d){7,11}\b/;
    const phoneRegexStripped = /(?:(?:(?:\+|\(\+?|00)\d{1,4}\)?)|0)[1-9]\d{7,11}/;
    if (phoneRegex.test(str) || phoneRegexStripped.test(strippedStr)) return true;
    
    // 3. Social & Career links (LinkedIn, Github)
    const linkRegex = /(?:linkedin\.com\/in\/|github\.com\/)[a-zA-Z0-9_-]+/i;
    if (linkRegex.test(str) || linkRegex.test(strippedStr)) return true;
    
    return false;
};

export const PdfRedactor: React.FC = () => {
    const [pages, setPages] = useState<PageData[]>([]);
    const [fileName, setFileName] = useState('');
    const [isProcessing, setIsProcessing] = useState(false);
    const [originalPdfBytes, setOriginalPdfBytes] = useState<Uint8Array | null>(null);
    
    // Docx states
    const [docxBlob, setDocxBlob] = useState<Blob | null>(null);
    const docxContainerRef = useRef<HTMLDivElement>(null);
    const [selectionText, setSelectionText] = useState("");
    const [selectionPos, setSelectionPos] = useState({ x: 0, y: 0 });
    const [showTooltip, setShowTooltip] = useState(false);
    const [ocrProgress, setOcrProgress] = useState<string>('');

    // Instead of state that triggers global re-render, we track actions in a mutable ref
    const blockActionsRef = useRef<Record<string, ActionType>>({});

    // Handle mouse up for DOCX redaction tooltip
    const handleMouseUp = useCallback(() => {
        if (!docxBlob) return;
        const selection = window.getSelection();
        const text = selection?.toString().trim();
        if (text && text.length > 0 && selection && selection.rangeCount > 0) {
            const range = selection.getRangeAt(0);
            const rect = range.getBoundingClientRect();
            // Position above the selection
            setSelectionPos({
                x: rect.left + rect.width / 2,
                y: rect.top + window.scrollY - 10
            });
            setSelectionText(text);
            setShowTooltip(true);
        } else {
            setShowTooltip(false);
        }
    }, [docxBlob]);

    useEffect(() => {
        document.addEventListener('mouseup', handleMouseUp);
        return () => document.removeEventListener('mouseup', handleMouseUp);
    }, [handleMouseUp]);

    const redactManualDocx = async () => {
        if (!docxBlob || !selectionText) return;
        setIsProcessing(true);
        setShowTooltip(false);
        try {
            const arrayBuffer = await docxBlob.arrayBuffer();
            const JSZip = (await import('jszip')).default;
            const zip = await JSZip.loadAsync(arrayBuffer);
            
            // Escape special chars from selectionText
            const escapeRegExp = (string: string) => {
                return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
            };
            const pattern = new RegExp(escapeRegExp(selectionText), 'gi');

            const processXmlFile = async (filePath: string) => {
                const f = zip.file(filePath);
                if (f) {
                    let xmlContent = await f.async('string');
                    xmlContent = xmlContent.replace(/(<w:t[^/>]*>)([^<]*)(<\/w:t>)/gi, (match, p1, p2, p3) => {
                        let text = p2;
                        text = text.replace(pattern, '[ĐÃ XÓA]');
                        return p1 + text + p3;
                    });
                    zip.file(filePath, xmlContent);
                }
            };

            await processXmlFile("word/document.xml");
            for (const [name, fileObj] of Object.entries(zip.files)) {
                if ((name.startsWith("word/header") || name.startsWith("word/footer")) && name.endsWith(".xml")) {
                    await processXmlFile(name);
                }
            }

            const newBlob = await zip.generateAsync({ 
                type: 'blob',
                mimeType: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
            });
            setDocxBlob(newBlob);
            setIsProcessing(false);
            
            // Wait for re-render
            setTimeout(async () => {
                if (docxContainerRef.current) {
                    const docx = await import('docx-preview');
                    docxContainerRef.current.innerHTML = '';
                    try {
                        await docx.renderAsync(await newBlob.arrayBuffer(), docxContainerRef.current, docxContainerRef.current, {
                            className: "docx",
                            inWrapper: true,
                            ignoreWidth: false,
                            ignoreHeight: false,
                            ignoreFonts: false,
                            breakPages: true,
                            useBase64URL: true
                        });
                    } catch (renderError) {
                        console.error("docx-preview manual redact error:", renderError);
                    }
                }
            }, 100);
        } catch (err) {
            console.error("Manual redact logic error:", err);
            alert("Có lỗi xảy ra khi xóa nội dung.");
            setIsProcessing(false);
        }
    };

    const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        setFileName(file.name);
        setIsProcessing(true);
        setPages([]);
        setDocxBlob(null);
        blockActionsRef.current = {};

        if (file.name.toLowerCase().endsWith('.docx')) {
            try {
                const arrayBuffer = await file.arrayBuffer();
                const JSZip = (await import('jszip')).default;
                const zip = await JSZip.loadAsync(arrayBuffer);
                
                const processXmlFile = async (filePath: string) => {
                    const f = zip.file(filePath);
                    if (f) {
                        let xmlContent = await f.async('string');
                        // Replace URLs and emails safely in text nodes
                        xmlContent = xmlContent.replace(/(<w:t[^/>]*>)([^<]*)(<\/w:t>)/gi, (match, p1, p2, p3) => {
                            let text = p2;
                            text = text.replace(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/gi, '[EMAIL ĐÃ XÓA]');
                            text = text.replace(/(?:(?:(?:\+|\(\+?|00)\d{1,4}\)?)|0)[1-9](?:[\s.-]*\d){7,11}\b/g, '[SĐT ĐÃ XÓA]');
                            text = text.replace(/(?:linkedin\.com\/in\/|github\.com\/)[a-zA-Z0-9_-]+/gi, '[LIÊN KẾT ĐÃ XÓA]');
                            text = text.replace(/https?:\/\/(?:www\.)?[-a-zA-Z0-9@:%._\+~#=]{1,256}\.[a-zA-Z0-9()]{1,6}\b(?:[-a-zA-Z0-9()@:%_\+.~#?&//=]*)/gi, '[LIÊN KẾT ĐÃ XÓA]');
                            return p1 + text + p3;
                        });

                        // Specifically target Hyperlink relationships in .rels files to prevent URI errors
                        if (filePath.endsWith('.rels')) {
                            xmlContent = xmlContent.replace(/(<Relationship[^>]*Type="[^"]*relationships\/hyperlink"[^>]*Target=")([^"]+)("[^>]*\/>)/gi, (match, p1, p2, p3) => {
                                return p1 + 'https://hidden.link' + p3;
                            });
                        }

                        zip.file(filePath, xmlContent);
                    }
                };

                await processXmlFile("word/document.xml");
                for (const [name, fileObj] of Object.entries(zip.files)) {
                    if ((name.startsWith("word/header") || name.startsWith("word/footer")) && name.endsWith(".xml")) {
                        await processXmlFile(name);
                    }
                    if (name.startsWith("word/_rels/") && name.endsWith(".rels")) {
                        await processXmlFile(name);
                    }
                }

                const newBlob = await zip.generateAsync({ 
                    type: 'blob',
                    mimeType: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
                });
                setDocxBlob(newBlob);
                setIsProcessing(false);
                
                setTimeout(async () => {
                    if (docxContainerRef.current) {
                        const docx = await import('docx-preview');
                        docxContainerRef.current.innerHTML = '';
                        try {
                            await docx.renderAsync(await newBlob.arrayBuffer(), docxContainerRef.current, docxContainerRef.current, {
                                className: "docx",
                                inWrapper: true,
                                ignoreWidth: false,
                                ignoreHeight: false,
                                ignoreFonts: false,
                                breakPages: true,
                                useBase64URL: true
                            });
                        } catch (renderError) {
                            console.error("docx-preview render error:", renderError);
                        }
                    }
                }, 100);
            } catch (err) {
                console.error("Docx parse error:", err);
                alert("Có lỗi khi che CV Docx.");
                setIsProcessing(false);
            }
            return;
        }

        try {
            const arrayBuffer = await file.arrayBuffer();
            // Create a completely separate copy for pdf-lib to ensure it's not modified/detached by pdfjs
            setOriginalPdfBytes(new Uint8Array(arrayBuffer.slice(0)));
            
            // Provide a separate copy for pdf.js
            const loadingTask = pdfjsLib.getDocument({ data: new Uint8Array(arrayBuffer.slice(0)) });
            const pdf = await loadingTask.promise;
            
            const processedPages: PageData[] = [];

            for (let i = 1; i <= pdf.numPages; i++) {
                const page = await pdf.getPage(i);
                const viewport = page.getViewport({ scale: 2.0 }); // High resolution for canvas
                
                const canvas = document.createElement('canvas');
                const context = canvas.getContext('2d');
                canvas.width = viewport.width;
                canvas.height = viewport.height;
                
                if (context) {
                    await page.render({
                        canvasContext: context,
                        viewport: viewport
                    }).promise;
                }

                const textContent = await page.getTextContent();
                const blocks: TextBlock[] = [];
                
                const validItems = textContent.items.filter((item: any) => item.str && item.str.trim() !== '');
                
                // Fallback to OCR if the page has no extractable text items
                if (validItems.length === 0 && context) {
                    setOcrProgress(`Đang quét ảnh trang ${i}/${pdf.numPages}...`);
                    try {
                        const Tesseract = await import('tesseract.js');
                        const { data } = await Tesseract.recognize(canvas, 'vie+eng', {
                            logger: m => {
                                if (m.status === 'recognizing text') {
                                    setOcrProgress(`Đang quét ảnh trang ${i}/${pdf.numPages} (${Math.round(m.progress * 100)}%)`);
                                }
                            }
                        });

                        data.words.forEach((word: any, wIndex: number) => {
                            const str = word.text;
                            if (!str || str.trim() === '') return;
                            
                            const pt0 = viewport.convertToPdfPoint(word.bbox.x0, word.bbox.y0);
                            const pt1 = viewport.convertToPdfPoint(word.bbox.x1, word.bbox.y1);
                            
                            const rawX = Math.min(pt0[0], pt1[0]);
                            const rawW = Math.abs(pt1[0] - pt0[0]);
                            const rawY = Math.min(pt0[1], pt1[1]);
                            const rawH = Math.abs(pt1[1] - pt0[1]);
                            
                            const xPct = (word.bbox.x0 / viewport.width) * 100;
                            const yPct = (word.bbox.y0 / viewport.height) * 100;
                            const widthPct = ((word.bbox.x1 - word.bbox.x0) / viewport.width) * 100;
                            const heightPct = ((word.bbox.y1 - word.bbox.y0) / viewport.height) * 100;

                            const blockId = `p${i}_ocr_${wIndex}`;
                            if (isSensitiveData(str)) {
                                blockActionsRef.current[blockId] = 'redact';
                            }

                            blocks.push({
                                id: blockId,
                                text: str,
                                xPct, yPct, widthPct, heightPct,
                                rawX, rawY, rawW, rawH
                            });
                        });
                    } catch (e) {
                         console.error("OCR Error:", e);
                    }
                    setOcrProgress('');
                } else {
                    // Sort to read top-to-bottom, left-to-right (PDF origin is bottom-left)
                    validItems.sort((a: any, b: any) => {
                        const yDiff = b.transform[5] - a.transform[5]; // Descending Y
                        const maxFontHeight = Math.max(Math.abs(a.transform[3] || 10), Math.abs(b.transform[3] || 10));
                        if (Math.abs(yDiff) > maxFontHeight * 0.5) return yDiff;
                        return a.transform[4] - b.transform[4]; // Ascending X
                    });

                    const mergedItems: Array<any> = [];
                    let currentLine: any = null;

                    validItems.forEach((item: any) => {
                        const tx = item.transform[4];
                        const ty = item.transform[5];
                        const fontHeight = Math.abs(item.transform[3]);
                        const width = item.width || (item.str.length * fontHeight * 0.5);

                        if (!currentLine) {
                            currentLine = {
                                str: item.str,
                                tx: tx,
                                ty: ty,
                                fontHeight: fontHeight,
                                minTx: tx,
                                maxTx: tx + width,
                                originalItems: [item]
                            };
                        } else {
                            const isSameLine = Math.abs(currentLine.ty - ty) <= currentLine.fontHeight * 0.5;
                            const txGap = tx - currentLine.maxTx;
                            const maxGap = Math.max(15, currentLine.fontHeight * 1.5);
                            const minGap = Math.min(-5, -currentLine.fontHeight * 0.5);
                            const isClose = txGap <= maxGap && txGap >= minGap; // Allow gaps up to proportional font height

                            if (isSameLine && isClose) {
                                // Merge with optional space if gap is large enough
                                const separator = txGap > currentLine.fontHeight * 0.2 ? ' ' : '';
                                currentLine.str += separator + item.str;
                                currentLine.maxTx = Math.max(currentLine.maxTx, tx + width);
                                currentLine.originalItems.push(item);
                            } else {
                                mergedItems.push(currentLine);
                                currentLine = {
                                    str: item.str,
                                    tx: tx,
                                    ty: ty,
                                    fontHeight: fontHeight,
                                    minTx: tx,
                                    maxTx: tx + width,
                                    originalItems: [item]
                                };
                            }
                        }
                    });
                    
                    if (currentLine) {
                        mergedItems.push(currentLine);
                    }

                    mergedItems.forEach((item: any, index: number) => {
                        const width = item.maxTx - item.minTx;
                        const paddingX = 2;
                        const paddingY = 2;

                        const rawX = item.minTx - paddingX;
                        const rawY = item.ty - (item.fontHeight * 0.25) - paddingY; // Adjusting for descender
                        const rawW = width + (paddingX * 2);
                        const rawH = (item.fontHeight * 1.25) + (paddingY * 2); // Expanding to cover high ascenders

                        // Using the raw corner coordinates to calculate the viewport mapping 
                        const pt1 = viewport.convertToViewportPoint(rawX, rawY);
                        const pt2 = viewport.convertToViewportPoint(rawX + rawW, rawY);
                        const pt3 = viewport.convertToViewportPoint(rawX + rawW, rawY + rawH);
                        const pt4 = viewport.convertToViewportPoint(rawX, rawY + rawH);

                        const xs = [pt1[0], pt2[0], pt3[0], pt4[0]];
                        const ys = [pt1[1], pt2[1], pt3[1], pt4[1]];

                        const minX = Math.min(...xs);
                        const maxX = Math.max(...xs);
                        const minY = Math.min(...ys);
                        const maxY = Math.max(...ys);

                        const blockId = `p${i}_b${index}`;
                        if (isSensitiveData(item.str)) {
                            blockActionsRef.current[blockId] = 'redact';
                        }

                        blocks.push({
                            id: blockId,
                            text: item.str,
                            xPct: (minX / viewport.width) * 100,
                            yPct: (minY / viewport.height) * 100,
                            widthPct: ((maxX - minX) / viewport.width) * 100,
                            heightPct: ((maxY - minY) / viewport.height) * 100,
                            rawX,
                            rawY,
                            rawW,
                            rawH
                        });
                    });
                }

                processedPages.push({
                    pageIndex: i,
                    canvasUrl: canvas.toDataURL('image/jpeg', 0.95),
                    width: viewport.width,
                    height: viewport.height,
                    blocks: blocks
                });
            }

            setPages(processedPages);
        } catch (error) {
            console.error("Error parsing PDF:", error);
            alert("Có lỗi xảy ra khi đọc file PDF.");
        } finally {
            setIsProcessing(false);
        }
    };

    const handleActionChange = useCallback((blockId: string, action: ActionType) => {
        blockActionsRef.current[blockId] = action;
    }, []);

    const handleExport = async () => {
        if (docxBlob) {
            const url = URL.createObjectURL(docxBlob);
            const link = document.createElement('a');
            link.href = url;
            link.download = `Che_CV_${fileName}`;
            link.click();
            URL.revokeObjectURL(url);
            return;
        }

        if (!originalPdfBytes || pages.length === 0) return;
        
        try {
            setIsProcessing(true);
            // Dynamic import to keep initial bundle size smaller
            const { PDFDocument, rgb, PDFName } = await import('pdf-lib');
            
            const pdfDoc = await PDFDocument.load(originalPdfBytes);
            const pdfPages = pdfDoc.getPages();

            pages.forEach((pageData) => {
                const pdfPage = pdfPages[pageData.pageIndex - 1]; // 0-indexed

                // 1. Process annotations to remove clickable links under redacted blocks
                const activeBlocks = pageData.blocks.filter(block => (blockActionsRef.current[block.id] || 'none') !== 'none');
                
                if (activeBlocks.length > 0) {
                    const annots = (pdfPage.node as any).Annots();
                    if (annots && typeof annots.size === 'function' && typeof annots.remove === 'function') {
                        // Iterate backwards to safely remove array items
                        for (let i = annots.size() - 1; i >= 0; i--) {
                            try {
                                const annot = annots.lookup(i);
                                if (annot && typeof annot.lookup === 'function') {
                                    const subtype = annot.lookup(PDFName.of('Subtype'));
                                    if (subtype && typeof subtype.asString === 'function' && subtype.asString() === '/Link') {
                                        const rect = annot.lookup(PDFName.of('Rect'));
                                        if (rect && typeof rect.size === 'function' && rect.size() === 4) {
                                            const getNum = (idx: number) => {
                                                const val = rect.lookup(idx);
                                                return (val && typeof val.asNumber === 'function') ? val.asNumber() : null;
                                            };
                                            const llx = getNum(0);
                                            const lly = getNum(1);
                                            const urx = getNum(2);
                                            const ury = getNum(3);

                                            if (llx !== null && lly !== null && urx !== null && ury !== null) {
                                                let shouldRemove = false;
                                                for (const block of activeBlocks) {
                                                    const b_llx = block.rawX;
                                                    const b_lly = block.rawY;
                                                    const b_urx = block.rawX + block.rawW;
                                                    const b_ury = block.rawY + block.rawH;

                                                    const overlapX = Math.max(llx, b_llx) < Math.min(urx, b_urx);
                                                    const overlapY = Math.max(lly, b_lly) < Math.min(ury, b_ury);

                                                    if (overlapX && overlapY) {
                                                        shouldRemove = true;
                                                        break;
                                                    }
                                                }
                                                if (shouldRemove) {
                                                    annots.remove(i);
                                                }
                                            }
                                        }
                                    }
                                }
                            } catch (e) {
                                console.warn("Quietly skipping annotation processing for index", i);
                            }
                        }
                    }
                }

                // 2. Draw visual rectangles
                pageData.blocks.forEach(block => {
                    const action = blockActionsRef.current[block.id] || 'none';
                    if (action !== 'none') {
                        const isRedact = action === 'redact';
                        
                        // Instead of trying to guess coordinates from viewport percentages interacting with PDF Rotation and CropBox,
                        // we directly use the raw PDF device space coordinates that perfectly map to pdf-lib's system.
                        pdfPage.drawRectangle({
                            x: block.rawX,
                            y: block.rawY,
                            width: block.rawW,
                            height: block.rawH,
                            color: isRedact ? rgb(0, 0, 0) : rgb(1, 1, 1),
                        });
                    }
                });
            });

            const pdfBytes = await pdfDoc.save();
            const blob = new Blob([pdfBytes], { type: 'application/pdf' });
            const url = URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = url;
            link.download = `Che_CV_${fileName}`;
            link.click();
            URL.revokeObjectURL(url);
            
            setIsProcessing(false);
        } catch (error) {
            console.error("Lỗi xuất PDF:", error);
            alert("Không thể xuất PDF. Vui lòng thử lại.");
            setIsProcessing(false);
        }
    };

    return (
        <div className="flex flex-col gap-4 w-full">
            <div className="flex flex-col gap-3 w-full">
                <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-3 bg-white p-2 sm:p-2.5 rounded-2xl border border-slate-200/80 shadow-sm w-full">
                    {/* Left Box: File Name */}
                    <div className="flex flex-row items-center min-w-0 w-full xl:w-auto">
                        {fileName ? (
                            <div className="flex items-center gap-2 px-3 py-2.5 bg-slate-50/80 text-slate-700 rounded-xl border border-slate-100/80 text-sm font-medium w-full sm:w-auto min-w-0 shadow-inner flex-1 sm:flex-none">
                                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-4 h-4 text-slate-400 shrink-0">
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 0 0-3.375-3.375h-1.5A1.125 1.125 0 0 1 13.5 7.125v-1.5a3.375 3.375 0 0 0-3.375-3.375H8.25m3 12h9m-9-3h9m-9-3h9m-9-3h9" />
                                </svg>
                                <span className="truncate max-w-[120px] sm:max-w-[180px] lg:max-w-[250px]" title={fileName}>{fileName}</span>
                            </div>
                        ) : (
                            <div className="px-3 py-2.5 text-sm font-medium text-slate-400">
                                Chưa có tệp nào
                            </div>
                        )}
                    </div>
                    
                    {/* Right Box: Action */}
                    <div className="flex items-center gap-2 w-full xl:w-auto xl:ml-auto">
                        <label className="shrink-0 w-full xl:w-auto px-4 py-2.5 bg-indigo-50 text-indigo-700 rounded-xl text-sm font-semibold hover:bg-indigo-100 transition-colors cursor-pointer text-center flex items-center justify-center gap-2 border border-indigo-100/50 shadow-sm flex-1 xl:flex-none">
                            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-4 h-4">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75V16.5m-13.5-9L12 3m0 0 4.5 4.5M12 3v13.5" />
                            </svg>
                            <span className="hidden sm:inline">Tải lên CV</span>
                            <span className="sm:hidden">Tải tệp CV</span>
                            <input 
                                type="file" 
                                onChange={handleFileUpload} 
                                accept=".pdf,.docx" 
                                className="hidden" 
                            />
                        </label>
                        {(pages.length > 0 || docxBlob) && !isProcessing && (
                            <button
                                onClick={handleExport}
                                className="flex-1 lg:flex-none px-5 py-2.5 bg-slate-900 text-white rounded-xl text-sm font-semibold hover:bg-slate-800 transition-colors flex items-center justify-center gap-2 shadow-md"
                            >
                                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-4 h-4">
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75V16.5M16.5 12 12 16.5m0 0L7.5 12m4.5 4.5V3" />
                                </svg>
                                Tải CV Đã Che
                            </button>
                        )}
                    </div>
                </div>

                {/* Instructions Box - Always visible across platforms nicely */}
                {(pages.length > 0 || docxBlob) && !isProcessing && (
                    <div className="flex items-start sm:items-center gap-3 bg-emerald-50/70 border border-emerald-100/70 p-3.5 rounded-2xl text-emerald-900 text-sm w-full relative">
                        <div className="bg-white text-emerald-500 p-2 rounded-full shrink-0 shadow-sm border border-emerald-100/50">
                            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-4 h-4">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M12 18v-5.25m0 0a6.01 6.01 0 0 0 1.5-.189m-1.5.189a6.01 6.01 0 0 1-1.5-.189m3.75 7.478a12.06 12.06 0 0 1-4.5 0m3.75 2.383a14.406 14.406 0 0 1-3 0M14.25 18v-.192c0-.983.658-1.82 1.508-2.316a7.5 7.5 0 1 0-7.517 0c.85.496 1.509 1.333 1.509 2.316V18" />
                            </svg>
                        </div>
                        <div className="leading-relaxed">
                            <strong>Tự động (AI):</strong> Hệ thống đã tự nhận diện và ẩn sửa <strong>SĐT, Email, Link</strong>! 
                            {docxBlob ? (
                                <span> Để che thêm thủ công, hãy <strong>bôi đen văn bản</strong> và chọn <strong>"Che nội dung này"</strong>. Tệp bạn tải về sẽ giữ nguyên bố cục Word gốc.</span>
                            ) : (
                                <span> Chạm 1 lần vào đoạn bất kỳ khác để <strong>Che (Đen)</strong>, chạm lần 2 để <strong>Xóa (Trắng)</strong>, và chạm lần 3 để hủy chọn.</span>
                            )}
                        </div>
                    </div>
                )}
                
                {showTooltip && docxBlob && (
                    <div 
                        className="fixed z-50 transform -translate-x-1/2 -translate-y-full mb-2 bg-slate-900 text-white px-3 py-1.5 rounded-lg shadow-lg cursor-pointer hover:bg-slate-800 transition-colors"
                        style={{ left: selectionPos.x, top: selectionPos.y }}
                        onClick={redactManualDocx}
                    >
                        Che nội dung này
                    </div>
                )}
            </div>

            {isProcessing && (
                <div className="py-20 flex flex-col items-center justify-center text-indigo-500 gap-3 bg-white rounded-2xl shadow-sm border border-slate-100">
                    <svg className="animate-spin h-10 w-10 text-indigo-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z"></path>
                    </svg>
                    <span className="font-bold text-sm text-slate-600">Đang xử lý tài liệu...</span>
                    {ocrProgress && <span className="text-xs text-slate-500 mt-1 font-medium">{ocrProgress}</span>}
                </div>
            )}

            {!isProcessing && docxBlob && (
                <div 
                    className="bg-slate-200/50 p-2 sm:p-5 rounded-2xl overflow-auto custom-scrollbar shadow-inner docx-content-reset"
                    style={{ maxHeight: '75vh' }}
                >
                    <div className="flex flex-col items-center mx-auto w-full max-w-4xl relative">
                        <div 
                            ref={docxContainerRef}
                            className="bg-white shadow-md rounded-sm w-full min-h-[A4] text-black"
                            style={{ padding: '0 2rem' }}
                        ></div>
                    </div>
                </div>
            )}

            {!isProcessing && pages.length > 0 && (
                <div className="bg-slate-200/50 p-2 sm:p-5 rounded-2xl overflow-auto custom-scrollbar shadow-inner" style={{ maxHeight: '75vh' }}>
                    <div className="flex flex-col items-center mx-auto w-full max-w-4xl gap-6">
                        {pages.map((page, idx) => (
                            <div 
                                key={idx} 
                                className="relative bg-white shadow-md rounded-sm overflow-hidden w-full transition-all hover:shadow-lg ring-1 ring-slate-900/5" 
                                style={{ aspectRatio: `${page.width} / ${page.height}` }}
                            >
                                <img src={page.canvasUrl} alt={`Page ${idx + 1}`} className="absolute top-0 left-0 w-full h-full object-contain pointer-events-none" />
                                
                                {page.blocks.map(block => (
                                    <PdfBlock
                                        key={block.id}
                                        block={block}
                                        initialAction={blockActionsRef.current[block.id] || 'none'}
                                        onActionChange={handleActionChange}
                                    />
                                ))}
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {!isProcessing && pages.length === 0 && !docxBlob && (
                <div className="border-2 border-dashed border-indigo-200 rounded-3xl p-10 sm:p-16 flex flex-col items-center justify-center text-center bg-indigo-50/30">
                    <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center shadow-sm text-indigo-400 mb-4">
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-8 h-8">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 0 0-3.375-3.375h-1.5A1.125 1.125 0 0 1 13.5 7.125v-1.5a3.375 3.375 0 0 0-3.375-3.375H8.25m4.5 4.5v11.25m0 0-3-3m3 3 3-3M14.004 5.25A2.25 2.25 0 0 1 15.75 6Q16.275 6.643 17 7.75" />
                        </svg>
                    </div>
                    <h3 className="text-lg font-bold text-slate-700 mb-1">Bắt đầu che CV</h3>
                    <p className="text-slate-500 text-sm max-w-sm">Tải lên một file PDF hoặc Word (.docx) để bắt đầu. Hệ thống sẽ tự động nhận diện thông tin nhạy cảm.</p>
                </div>
            )}
        </div>
    );
};
