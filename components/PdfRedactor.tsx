import React, { useState, useRef } from 'react';
import * as pdfjsLibModule from 'pdfjs-dist';

const pdfjsLib = (pdfjsLibModule as any).default || pdfjsLibModule;
if (pdfjsLib.GlobalWorkerOptions) {
    pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://unpkg.com/pdfjs-dist@3.11.174/build/pdf.worker.min.js';
}

interface TextBlock {
    id: string;
    text: string;
    xPct: number;
    yPct: number;
    widthPct: number;
    heightPct: number;
    action: 'none' | 'redact' | 'delete';
}

interface PageData {
    pageIndex: number;
    canvasUrl: string;
    width: number;
    height: number;
    blocks: TextBlock[];
}

export const PdfRedactor: React.FC = () => {
    const [pages, setPages] = useState<PageData[]>([]);
    const [fileName, setFileName] = useState('');
    const [isProcessing, setIsProcessing] = useState(false);
    const [originalPdfBytes, setOriginalPdfBytes] = useState<Uint8Array | null>(null);

    const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        setFileName(file.name);
        setIsProcessing(true);
        setPages([]);

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
                
                textContent.items.forEach((item: any, index: number) => {
                    if (!item.str || item.str.trim() === '') return;
                    
                    const tx = item.transform[4];
                    const ty = item.transform[5];
                    const fontHeight = Math.abs(item.transform[3]);
                    const width = item.width || (item.str.length * fontHeight * 0.5);
                    const height = item.height || fontHeight;

                    const [px, py] = viewport.convertToViewportPoint(tx, ty);
                    const topY = py - height;
                    
                    // Add sensible padding in canvas pixels
                    const paddingX = 4;
                    const paddingY = 4;

                    const finalX = px - paddingX;
                    const finalY = topY - paddingY;
                    const finalW = (width * viewport.scale) + (paddingX * 2);
                    const finalH = (height * viewport.scale * 1.5) + (paddingY * 2);

                    // Convert to percentages for robust responsiveness
                    blocks.push({
                        id: `p${i}_b${index}`,
                        text: item.str,
                        xPct: (finalX / viewport.width) * 100,
                        yPct: (finalY / viewport.height) * 100,
                        widthPct: (finalW / viewport.width) * 100,
                        heightPct: (finalH / viewport.height) * 100,
                        action: 'none'
                    });
                });

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

    const toggleAction = (pageIndex: number, blockId: string) => {
        setPages(prev => prev.map(page => {
            if (page.pageIndex !== pageIndex) return page;
            return {
                ...page,
                blocks: page.blocks.map(b => {
                    if (b.id !== blockId) return b;
                    let nextAction: 'none' | 'redact' | 'delete' = 'none';
                    if (b.action === 'none') nextAction = 'redact';
                    else if (b.action === 'redact') nextAction = 'delete';
                    return { ...b, action: nextAction };
                })
            };
        }));
    };

    const handleExport = async () => {
        if (!originalPdfBytes || pages.length === 0) return;
        
        try {
            setIsProcessing(true);
            const { PDFDocument, rgb } = await import('pdf-lib');
            
            const pdfDoc = await PDFDocument.load(originalPdfBytes);
            const pdfPages = pdfDoc.getPages();

            pages.forEach((pageData) => {
                const pdfPage = pdfPages[pageData.pageIndex - 1]; // 0-indexed
                const { width, height } = pdfPage.getSize();

                pageData.blocks.forEach(block => {
                    if (block.action !== 'none') {
                        const isRedact = block.action === 'redact';
                        
                        // Calculate native PDF coordinates from percentages
                        const rectW = (block.widthPct / 100) * width;
                        const rectH = (block.heightPct / 100) * height;
                        const rectX = (block.xPct / 100) * width;
                        const rectTop = (block.yPct / 100) * height;
                        
                        // pdf-lib's Y coordinate starts from the bottom-left
                        const rectY = height - rectTop - rectH;

                        pdfPage.drawRectangle({
                            x: rectX,
                            y: rectY,
                            width: rectW,
                            height: rectH,
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
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
                <div className="flex items-center gap-2">
                    <label className="px-5 py-2.5 bg-indigo-50 text-indigo-600 rounded-xl font-bold hover:bg-indigo-100 transition-colors cursor-pointer flex items-center gap-2 shadow-sm border border-indigo-100 w-full sm:w-auto justify-center">
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75V16.5m-13.5-9L12 3m0 0 4.5 4.5M12 3v13.5" />
                        </svg>
                        Tải lên PDF CV
                        <input 
                            type="file" 
                            onChange={handleFileUpload} 
                            accept=".pdf" 
                            className="hidden" 
                        />
                    </label>
                    {fileName && <span className="text-sm text-slate-600 font-medium truncate max-w-[150px]">{fileName}</span>}
                </div>
                
                {pages.length > 0 && !isProcessing && (
                    <div className="flex items-center gap-4 w-full sm:w-auto">
                        <span className="text-sm text-slate-500 hidden lg:block">
                            💡 Chạm vào khối đứt nét để <strong>Che (Đen)</strong> hoặc <strong>Xóa (Trắng)</strong>
                        </span>
                        <button
                            onClick={handleExport}
                            className="px-5 py-2.5 bg-rose-50 text-rose-600 rounded-xl font-bold hover:bg-rose-100 transition-colors flex items-center gap-2 shadow-sm border border-rose-100 w-full sm:w-auto justify-center"
                        >
                            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75V16.5M16.5 12 12 16.5m0 0L7.5 12m4.5 4.5V3" />
                            </svg>
                            Tải CV Đã Che
                        </button>
                    </div>
                )}
            </div>

            {isProcessing && (
                <div className="py-20 flex flex-col items-center justify-center text-indigo-500 gap-3 bg-white rounded-2xl shadow-sm border border-slate-100">
                    <svg className="animate-spin h-10 w-10 text-indigo-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z"></path>
                    </svg>
                    <span className="font-bold text-sm text-slate-600">Đang xử lý PDF...</span>
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
                                    <div
                                        key={block.id}
                                        data-action={block.action}
                                        className={`absolute cursor-pointer transition-all ${
                                            block.action === 'redact' 
                                                ? 'bg-slate-900 border border-slate-900 shadow-md' 
                                                : block.action === 'delete'
                                                    ? 'bg-white border border-slate-200/50'
                                                    : 'border border-dashed border-indigo-400/70 hover:bg-indigo-400/10 hover:border-indigo-600 backdrop-blur-[1px]'
                                        }`}
                                        style={{
                                            left: `${block.xPct}%`,
                                            top: `${block.yPct}%`,
                                            width: `${block.widthPct}%`,
                                            height: `${block.heightPct}%`,
                                            opacity: block.action === 'none' ? 0.8 : 1,
                                            zIndex: 10,
                                            borderRadius: '2px' // slight rounding for aesthetics
                                        }}
                                        onClick={() => toggleAction(page.pageIndex, block.id)}
                                        title={block.action === 'none' ? 'Chạm để Che (Đen)' : block.action === 'redact' ? 'Chạm để Xóa (Trắng)' : 'Chạm để Hủy'}
                                    >
                                        {block.action === 'none' && (
                                            <span className="opacity-0 hover:opacity-100 absolute -top-8 left-1/2 -translate-x-1/2 bg-slate-800 text-white text-xs px-2 py-1 rounded shadow-lg whitespace-nowrap pointer-events-none z-20">
                                                {block.text}
                                            </span>
                                        )}
                                    </div>
                                ))}
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {!isProcessing && pages.length === 0 && (
                <div className="border-2 border-dashed border-indigo-200 rounded-3xl p-10 sm:p-16 flex flex-col items-center justify-center text-center bg-indigo-50/30">
                    <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center shadow-sm text-indigo-400 mb-4">
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-8 h-8">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 0 0-3.375-3.375h-1.5A1.125 1.125 0 0 1 13.5 7.125v-1.5a3.375 3.375 0 0 0-3.375-3.375H8.25m4.5 4.5v11.25m0 0-3-3m3 3 3-3M14.004 5.25A2.25 2.25 0 0 1 15.75 6Q16.275 6.643 17 7.75" />
                        </svg>
                    </div>
                    <h3 className="text-lg font-bold text-slate-700 mb-1">Bắt đầu che CV</h3>
                    <p className="text-slate-500 text-sm max-w-sm">Tải lên một file PDF để bắt đầu. Hệ thống sẽ tự động nhận diện các đoạn văn bản.</p>
                </div>
            )}
        </div>
    );
};
