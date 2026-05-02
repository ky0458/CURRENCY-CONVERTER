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
    viewport: any;
}

const PdfBlock = React.memo(({ 
    block, 
    initialAction = 'none',
    onActionChange,
    onDeleteBlock
}: { 
    block: TextBlock; 
    initialAction?: ActionType;
    onActionChange: (id: string, action: ActionType) => void;
    onDeleteBlock?: (id: string) => void;
}) => {
    const [action, setAction] = useState<ActionType>(initialAction);
    const timerRef = useRef<NodeJS.Timeout | null>(null);
    const isLongPressActive = useRef(false);

    const handleToggle = useCallback((e: React.MouseEvent) => {
        if (timerRef.current) clearTimeout(timerRef.current);
        if (isLongPressActive.current) return;

        setAction(prev => {
            let next: ActionType = 'none';
            if (prev === 'none') next = 'redact';
            else if (prev === 'redact') next = 'delete';
            
            // Notify parent without triggering global re-render
            onActionChange(block.id, next);
            return next;
        });
    }, [block.id, onActionChange]);

    const handlePointerDown = (e: React.PointerEvent) => {
        isLongPressActive.current = false;
        timerRef.current = setTimeout(() => {
            isLongPressActive.current = true;
            if (onDeleteBlock) {
                onDeleteBlock(block.id);
            }
        }, 500); // 500ms long press
    };

    const handlePointerCancel = () => {
        if (timerRef.current) clearTimeout(timerRef.current);
    };

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
            className={`absolute cursor-pointer border rounded-[2px] touch-manipulation pdf-block ${actionClasses}`}
            style={{
                left: `${block.xPct}%`,
                top: `${block.yPct}%`,
                width: `${block.widthPct}%`,
                height: `${block.heightPct}%`,
                zIndex: 10
            }}
            onPointerDown={handlePointerDown}
            onPointerUp={handlePointerCancel}
            onPointerLeave={handlePointerCancel}
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
    const [isManualMode, setIsManualMode] = useState<boolean>(false);
    const [ocrProgress, setOcrProgress] = useState<string>('');
    const [manualHistory, setManualHistory] = useState<string[]>([]);

    const [drawingState, setDrawingState] = useState<{
        isDrawing: boolean;
        pageIndex: number | null;
        startX: number;
        startY: number;
        currentX: number;
        currentY: number;
    }>({ isDrawing: false, pageIndex: null, startX: 0, startY: 0, currentX: 0, currentY: 0 });

    // Instead of state that triggers global re-render, we track actions in a mutable ref
    const blockActionsRef = useRef<Record<string, ActionType>>({});

    const undoLastManualBlock = () => {
        setManualHistory(prev => {
            if (prev.length === 0) return prev;
            const lastId = prev[prev.length - 1];
            
            setPages(currentPages => currentPages.map(p => ({
                ...p,
                blocks: p.blocks.filter(b => b.id !== lastId)
            })));
            
            delete blockActionsRef.current[lastId];
            return prev.slice(0, -1);
        });
    };

    const handleDeleteBlock = useCallback((id: string) => {
        if (!id.includes('manual_')) return;
        setPages(currentPages => currentPages.map(p => ({
            ...p,
            blocks: p.blocks.filter(b => b.id !== id)
        })));
        delete blockActionsRef.current[id];
        setManualHistory(prev => prev.filter(manualId => manualId !== id));
    }, []);

    const handlePdfMouseDown = (e: React.PointerEvent<HTMLDivElement>, pageIndex: number) => {
        if (!isManualMode) return;
        if ((e.target as HTMLElement).closest('.pdf-block')) return;
        
        const rect = e.currentTarget.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;
        
        setDrawingState({
            isDrawing: true,
            pageIndex,
            startX: x,
            startY: y,
            currentX: x,
            currentY: y,
        });
    };

    const handlePdfMouseMove = (e: React.PointerEvent<HTMLDivElement>, pageIndex: number) => {
        if (!drawingState.isDrawing || drawingState.pageIndex !== pageIndex) return;
        const rect = e.currentTarget.getBoundingClientRect();
        const x = Math.max(0, Math.min(e.clientX - rect.left, rect.width));
        const y = Math.max(0, Math.min(e.clientY - rect.top, rect.height));
        setDrawingState(prev => ({ ...prev, currentX: x, currentY: y }));
    };

    const handlePdfMouseUp = (e: React.PointerEvent<HTMLDivElement>, pageIndex: number) => {
        if (!drawingState.isDrawing || drawingState.pageIndex !== pageIndex) return;
        
        const rect = e.currentTarget.getBoundingClientRect();
        const xList = [drawingState.startX, drawingState.currentX];
        const yList = [drawingState.startY, drawingState.currentY];
        const minX = Math.min(...xList);
        const maxX = Math.max(...xList);
        const minY = Math.min(...yList);
        const maxY = Math.max(...yList);
        
        const width = maxX - minX;
        const height = maxY - minY;
        
        if (width > 5 && height > 5) {
            const page = pages.find(p => p.pageIndex === pageIndex + 1); // pageIndex prop is 0-based idx, pdf is 1-based
            if (page) {
                const xPct = (minX / rect.width) * 100;
                const yPct = (minY / rect.height) * 100;
                const widthPct = (width / rect.width) * 100;
                const heightPct = (height / rect.height) * 100;

                // For point mapping, we assume rect is mapping exactly to page's viewport width/height
                const mappedMinX = (minX / rect.width) * page.width;
                const mappedMinY = (minY / rect.height) * page.height;
                const mappedMaxX = (maxX / rect.width) * page.width;
                const mappedMaxY = (maxY / rect.height) * page.height;

                const pt1 = page.viewport.convertToPdfPoint(mappedMinX, mappedMinY);
                const pt2 = page.viewport.convertToPdfPoint(mappedMaxX, mappedMinY);
                const pt3 = page.viewport.convertToPdfPoint(mappedMaxX, mappedMaxY);
                const pt4 = page.viewport.convertToPdfPoint(mappedMinX, mappedMaxY);

                const xs = [pt1[0], pt2[0], pt3[0], pt4[0]];
                const ys = [pt1[1], pt2[1], pt3[1], pt4[1]];

                const rawX = Math.min(...xs);
                const rawY = Math.min(...ys);
                const rawW = Math.max(...xs) - rawX;
                const rawH = Math.max(...ys) - rawY;

                const blockId = `p${pageIndex + 1}_manual_${Date.now()}`;
                blockActionsRef.current[blockId] = 'redact';

                const newBlock: TextBlock = {
                    id: blockId,
                    text: 'Thủ công',
                    xPct, yPct, widthPct, heightPct,
                    rawX, rawY, rawW, rawH
                };

                setPages(prev => prev.map(p => 
                    p.pageIndex === pageIndex + 1 ? { ...p, blocks: [...p.blocks, newBlock] } : p
                ));
                setManualHistory(prev => [...prev, blockId]);
            }
        }
        setDrawingState(prev => ({ ...prev, isDrawing: false, pageIndex: null }));
    };

    const redactManualDocx = async (replacement: string = '[ĐÃ XÓA]', reRender: boolean = true, explicitSelectionText: string = '') => {
        if (!docxBlob) return;
        const textToRedact = explicitSelectionText || window.getSelection()?.toString().trim();
        if (!textToRedact) return;

        if (reRender) setIsProcessing(true);
        try {
            const arrayBuffer = await docxBlob.arrayBuffer();
            const JSZip = (await import('jszip')).default;
            const zip = await JSZip.loadAsync(arrayBuffer);
            
            // Escape special chars
            const escapeRegExp = (string: string) => {
                return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
            };
            const pattern = new RegExp(escapeRegExp(textToRedact), 'gi');

            const processXmlFile = async (filePath: string) => {
                const f = zip.file(filePath);
                if (f) {
                    let xmlContent = await f.async('string');
                    xmlContent = xmlContent.replace(/(<w:t[^/>]*>)([^<]*)(<\/w:t>)/gi, (match, p1, p2, p3) => {
                        let text = p2;
                        text = text.replace(pattern, replacement);
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
            
            if (reRender) {
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
                            console.error("docx-preview manual redact error:", renderError);
                        }
                    }
                }, 100);
            }
        } catch (err) {
            console.error("Manual redact logic error:", err);
            if (reRender) {
                alert("Có lỗi xảy ra khi xóa nội dung.");
                setIsProcessing(false);
            }
        }
    };

    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (!docxBlob) return;
            const selection = window.getSelection();
            const text = selection?.toString().trim();
            if (!selection || !text || text.length === 0) return;
            
            // Check if selection is within docxRef
            if (docxContainerRef.current && !docxContainerRef.current.contains(selection.anchorNode)) {
                return;
            }

            if (e.key === 'Backspace' || e.key === 'Delete') {
                e.preventDefault();
                
                // Call redactManualDocx WITHOUT triggering a re-render
                redactManualDocx(' ', false, text);
                
                // Immediately delete from the DOM manually so it looks like it instantly vanished
                const range = selection.getRangeAt(0);
                range.deleteContents();
            }
        };

        document.addEventListener('keydown', handleKeyDown);
        return () => document.removeEventListener('keydown', handleKeyDown);
    }, [docxBlob]);

    const processPdfBuffer = async (arrayBuffer: ArrayBuffer) => {
        try {
            setIsProcessing(true);
            setPages([]);
            setDocxBlob(null);
            blockActionsRef.current = {};
            
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

                // Extract annotations to catch hyperlinked graphical objects/icons
                try {
                    const annotations = await page.getAnnotations();
                    annotations.forEach((annot: any, aIndex: number) => {
                        if (annot.subtype === 'Link' && annot.url) {
                            const urlStr = annot.url;
                            let isSensitive = false;
                            
                            if (/^mailto:/i.test(urlStr)) isSensitive = true;
                            if (/^tel:/i.test(urlStr)) isSensitive = true;
                            if (isSensitiveData(urlStr)) isSensitive = true;

                            if (isSensitive) {
                                const [rectX0, rectY0, rectX1, rectY1] = annot.rect;
                                const rawX = Math.min(rectX0, rectX1);
                                const rawY = Math.min(rectY0, rectY1);
                                const rawW = Math.abs(rectX1 - rectX0);
                                const rawH = Math.abs(rectY1 - rectY0);

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

                                const blockId = `p${i}_annot_${aIndex}`;
                                blockActionsRef.current[blockId] = 'redact';

                                blocks.push({
                                    id: blockId,
                                    text: urlStr.replace(/^mailto:/i, '').replace(/^tel:/i, ''),
                                    xPct: (minX / viewport.width) * 100,
                                    yPct: (minY / viewport.height) * 100,
                                    widthPct: ((maxX - minX) / viewport.width) * 100,
                                    heightPct: ((maxY - minY) / viewport.height) * 100,
                                    rawX,
                                    rawY,
                                    rawW,
                                    rawH
                                });
                            }
                        }
                    });
                } catch (err) {
                    console.log("Could not process annotations", err);
                }
                
                // Use OCR if the page has no extractable text items
                if (validItems.length === 0 && context) {
                    setOcrProgress(`Đang quét ảnh trang ${i}/${pdf.numPages}...`);
                    try {
                        const Tesseract = await import('tesseract.js');
                        const { data } = (await Tesseract.recognize(canvas, 'vie+eng', {
                            logger: m => {
                                if (m.status === 'recognizing text') {
                                    setOcrProgress(`Đang quét ảnh trang ${i}/${pdf.numPages} (${Math.round(m.progress * 100)}%)`);
                                }
                            }
                        })) as any;

                        if (data && data.words) {
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
                        }
                    } catch (e) {
                         console.error("OCR Error:", e);
                    }
                    setOcrProgress('');
                } 
                
                if (validItems.length > 0) {
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
                    blocks: blocks,
                    viewport: viewport
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

    const processImageFile = async (file: File) => {
        try {
            setIsProcessing(true);
            setPages([]);
            setDocxBlob(null);
            blockActionsRef.current = {};

            const img = new Image();
            img.src = URL.createObjectURL(file);
            await new Promise<void>((resolve, reject) => {
                img.onload = () => resolve();
                img.onerror = reject;
            });

            const canvas = document.createElement('canvas');
            canvas.width = img.naturalWidth;
            canvas.height = img.naturalHeight;
            const ctx = canvas.getContext('2d');
            if (ctx) {
                ctx.drawImage(img, 0, 0);
            }

            const blocks: TextBlock[] = [];
            setOcrProgress('Đang quét thông tin từ ảnh...');
            
            try {
                const Tesseract = await import('tesseract.js');
                const { data } = (await Tesseract.recognize(canvas, 'vie+eng', {
                    logger: m => {
                        if (m.status === 'recognizing text') {
                            setOcrProgress(`Đang quét ảnh (${Math.round(m.progress * 100)}%)`);
                        }
                    }
                })) as any;

                if (data && data.words) {
                    data.words.forEach((word: any, wIndex: number) => {
                        const str = word.text;
                        if (!str || str.trim() === '') return;
                        
                        // Mock viewport conversion for images (1:1)
                        const xPct = (word.bbox.x0 / canvas.width) * 100;
                        const yPct = (word.bbox.y0 / canvas.height) * 100;
                        const widthPct = ((word.bbox.x1 - word.bbox.x0) / canvas.width) * 100;
                        const heightPct = ((word.bbox.y1 - word.bbox.y0) / canvas.height) * 100;

                        const blockId = `p1_ocr_${wIndex}`;
                        if (isSensitiveData(str)) {
                            blockActionsRef.current[blockId] = 'redact';
                        }

                        blocks.push({
                            id: blockId,
                            text: str,
                            xPct, yPct, widthPct, heightPct,
                            rawX: word.bbox.x0,
                            rawY: word.bbox.y0,
                            rawW: word.bbox.x1 - word.bbox.x0,
                            rawH: word.bbox.y1 - word.bbox.y0
                        });
                    });
                }
            } catch (e) {
                console.error("OCR Error on image:", e);
            }

            setOcrProgress('');
            setPages([{
                pageIndex: 1,
                canvasUrl: canvas.toDataURL('image/jpeg', 0.95),
                width: canvas.width,
                height: canvas.height,
                blocks: blocks,
                viewport: {
                    convertToPdfPoint: (x: number, y: number) => [x, y], // mock for images
                    convertToViewportPoint: (x: number, y: number) => [x, y]
                }
            }]);
            URL.revokeObjectURL(img.src);
        } catch (error) {
            console.error("Error processing image:", error);
            alert("Có lỗi khi xử lý ảnh.");
        } finally {
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

        if (file.type.startsWith('image/')) {
            await processImageFile(file);
            return;
        }

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
            await processPdfBuffer(arrayBuffer);
        } catch (error) {
            console.error("Error starting PDF process:", error);
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
            link.download = `ĐÃ CHE_${fileName}`;
            link.click();
            URL.revokeObjectURL(url);
            return;
        }

        if (pages.length === 0) return;
        
        try {
            setIsProcessing(true);
            const { PDFDocument } = await import('pdf-lib');
            const newPdfDoc = await PDFDocument.create();

            for (const pageData of pages) {
                // Create a canvas to draw the base image + redactions
                const canvas = document.createElement('canvas');
                canvas.width = pageData.width;
                canvas.height = pageData.height;
                const ctx = canvas.getContext('2d');
                if (!ctx) continue;

                // Load the base JPEG image which was generated perfectly without redactions
                const img = new Image();
                await new Promise<void>((resolve, reject) => {
                    img.onload = () => resolve();
                    img.onerror = reject;
                    img.src = pageData.canvasUrl;
                });
                
                // Draw the original page
                ctx.drawImage(img, 0, 0, canvas.width, canvas.height);

                // Draw redactions on top
                pageData.blocks.forEach(block => {
                    const action = blockActionsRef.current[block.id] || 'none';
                    if (action !== 'none') {
                        ctx.fillStyle = action === 'redact' ? 'black' : 'white';
                        
                        const x = (block.xPct / 100) * canvas.width;
                        const y = (block.yPct / 100) * canvas.height;
                        const w = (block.widthPct / 100) * canvas.width;
                        const h = (block.heightPct / 100) * canvas.height;
                        
                        if ((ctx as any).roundRect) {
                            ctx.beginPath();
                            (ctx as any).roundRect(x, y, w, h, 2);
                            ctx.fill();
                        } else {
                            ctx.fillRect(x, y, w, h);
                        }
                    }
                });

                // Convert flattened canvas to JPEG
                const base64Jpeg = canvas.toDataURL('image/jpeg', 0.95);
                const response = await fetch(base64Jpeg);
                const jpegBytes = await response.arrayBuffer();
                
                // Embed into new PDF
                const embeddedImage = await newPdfDoc.embedJpg(jpegBytes);
                const pdfPage = newPdfDoc.addPage([pageData.width, pageData.height]);
                
                pdfPage.drawImage(embeddedImage, {
                    x: 0,
                    y: 0,
                    width: pageData.width,
                    height: pageData.height,
                });
            }

            const pdfBytes = await newPdfDoc.save();
            const blob = new Blob([pdfBytes], { type: 'application/pdf' });
            
            const url = URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = url;
            link.download = `ĐÃ CHE_${fileName.replace(/\.[^/.]+$/, "")}.pdf`;
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
                                accept=".pdf,.docx,image/*" 
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
                                <span className="hidden sm:inline">Tải CV Đã Che</span>
                                <span className="sm:hidden">Tải về</span>
                            </button>
                        )}
                    </div>
                </div>

                {pages.length > 0 && !isProcessing && (
                    <div className="flex items-center flex-wrap gap-3 px-2 py-1">
                        <div className="flex items-center gap-3">
                            <button 
                                type="button"
                                onClick={() => setIsManualMode(!isManualMode)}
                                className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-indigo-600 focus:ring-offset-2 ${isManualMode ? 'bg-indigo-600' : 'bg-slate-200'}`}
                                role="switch"
                                aria-checked={isManualMode}
                            >
                                <span
                                    aria-hidden="true"
                                    className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${isManualMode ? 'translate-x-5' : 'translate-x-0'}`}
                                />
                            </button>
                            <span className="text-sm font-semibold text-slate-700 cursor-pointer select-none" onClick={() => setIsManualMode(!isManualMode)}>
                                <span className="hidden sm:inline">Bật tính năng che thủ công (Kéo thả trên trang)</span>
                                <span className="sm:hidden">Bật che thủ công</span>
                            </span>
                        </div>

                        {isManualMode && (
                            <button 
                                onClick={undoLastManualBlock}
                                disabled={manualHistory.length === 0}
                                className={`ml-auto sm:ml-4 flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${manualHistory.length > 0 ? 'bg-indigo-50 text-indigo-700 hover:bg-indigo-100 cursor-pointer' : 'bg-slate-50 text-slate-400 cursor-not-allowed'}`}
                            >
                                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-4 h-4">
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 15 3 9m0 0 6-6M3 9h12a6 6 0 0 1 0 12h-3" />
                                </svg>
                                <span>Hoàn tác</span>
                            </button>
                        )}
                    </div>
                )}

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
                                <span> Để che thêm thủ công, hãy <strong>bôi đen văn bản</strong> trên màn hình và nhấn phím <strong>Delete</strong> hoặc <strong>Backspace</strong> để xóa!</span>
                            ) : (
                                <span>  {isManualMode ? <span><strong>Kéo thả trên trang</strong> để che thủ công. <strong>Nhấn giữ</strong> (0.5s) vùng vừa vẽ để xóa.</span> : "Bật 'che thủ công' để tự vẽ vùng che đen."}</span>
                            )}
                        </div>
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
                            className="bg-white shadow-md rounded-[2px] w-full min-h-[A4] text-black outline-none"
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
                                className="relative bg-white shadow-md rounded-[2px] overflow-hidden w-full transition-all hover:shadow-lg ring-1 ring-slate-900/5 select-none" 
                                style={{ aspectRatio: `${page.width} / ${page.height}`, touchAction: isManualMode ? 'none' : 'auto' }}
                                onPointerDown={(e) => handlePdfMouseDown(e, idx)}
                                onPointerMove={(e) => handlePdfMouseMove(e, idx)}
                                onPointerUp={(e) => handlePdfMouseUp(e, idx)}
                                onPointerLeave={(e) => handlePdfMouseUp(e, idx)}
                            >
                                <img src={page.canvasUrl} alt={`Page ${idx + 1}`} className="absolute top-0 left-0 w-full h-full object-contain pointer-events-none" />
                                
                                {drawingState.isDrawing && drawingState.pageIndex === idx && (
                                    <div 
                                        className="absolute border-2 border-black bg-black/40 z-50 pointer-events-none rounded-[2px]"
                                        style={{
                                            left: `${Math.min(drawingState.startX, drawingState.currentX)}px`,
                                            top: `${Math.min(drawingState.startY, drawingState.currentY)}px`,
                                            width: `${Math.abs(drawingState.currentX - drawingState.startX)}px`,
                                            height: `${Math.abs(drawingState.currentY - drawingState.startY)}px`,
                                        }}
                                    />
                                )}

                                {page.blocks.map(block => (
                                    <PdfBlock
                                        key={block.id}
                                        block={block}
                                        initialAction={blockActionsRef.current[block.id] || 'none'}
                                        onActionChange={handleActionChange}
                                        onDeleteBlock={handleDeleteBlock}
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
                    <p className="text-slate-500 text-sm max-w-sm">Tải lên file PDF, Word (.docx) hoặc hình ảnh (JPG, PNG) để bắt đầu. Hệ thống sẽ tự động nhận diện thông tin nhạy cảm.</p>
                </div>
            )}
        </div>
    );
};
