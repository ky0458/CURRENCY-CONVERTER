
import React, { useState, useRef, useEffect, useLayoutEffect } from 'react';
import { extractTextFromPdf, convertDocxToHtml, translateHtml, getPdfDocument, downloadTranslatedDocument, translatePdfWithLayout, PdfPageOverlay } from '../services/documentService';
import { LANGUAGE_FLAGS } from '../constants';

interface ScanSectionProps {
    theme: string;
}

const LANGUAGES = [
    { code: 'vi', name: 'Tiếng Việt' },
    { code: 'en', name: 'Tiếng Anh' },
    { code: 'zh-CN', name: 'Tiếng Trung (Giản thể)' },
    { code: 'ja', name: 'Tiếng Nhật' },
    { code: 'ko', name: 'Tiếng Hàn' },
    { code: 'fr', name: 'Tiếng Pháp' },
    { code: 'de', name: 'Tiếng Đức' },
    { code: 'ru', name: 'Tiếng Nga' },
];

// --- Helper Component: Auto-Scaling Text ---
const AutoFitText: React.FC<{ text: string, fontSize: number, height: number, width: number }> = ({ text, fontSize, height, width }) => {
    const textRef = useRef<HTMLDivElement>(null);
    const [scale, setScale] = useState(1);

    useLayoutEffect(() => {
        if (textRef.current) {
            textRef.current.style.transform = 'none';
            const naturalWidth = textRef.current.scrollWidth;
            const naturalHeight = textRef.current.scrollHeight;
            
            const availW = width;
            const availH = height;

            const scaleW = naturalWidth > availW ? availW / naturalWidth : 1;
            const scaleH = naturalHeight > availH ? availH / naturalHeight : 1;
            
            // Prefer width scaling but clamp to avoid making text tiny. 
            // Min scale 0.6 ensures readability, if it overflows, overflow:hidden cuts it off cleanly.
            let newScale = Math.min(scaleW, scaleH);
            if (newScale < 0.6) newScale = 0.6; 

            setScale(newScale);
        }
    }, [text, width, height, fontSize]);

    return (
        <div 
            style={{
                width: '100%',
                height: '100%',
                display: 'flex',
                alignItems: 'center', 
                justifyContent: 'flex-start',
                overflow: 'hidden'
            }}
        >
            <div
                ref={textRef}
                style={{
                    fontSize: `${fontSize}px`,
                    lineHeight: 1.1, 
                    whiteSpace: 'nowrap',
                    transform: `scale(${scale})`,
                    transformOrigin: 'left center',
                    fontWeight: 500,
                    fontFamily: 'Arial, sans-serif',
                    color: '#0f172a', // slate-900 for high contrast
                }}
            >
                {text}
            </div>
        </div>
    );
};

// --- Sub-component: Render PDF Page + Overlays ---
const PdfPageRenderer: React.FC<{ pageIndex: number, overlayData?: PdfPageOverlay, pdfDoc: any, showOverlay: boolean }> = ({ pageIndex, overlayData, pdfDoc, showOverlay }) => {
    const containerRef = useRef<HTMLDivElement>(null);
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const [pageViewport, setPageViewport] = useState<any>(null);
    const [renderRatio, setRenderRatio] = useState(1);
    
    const CANVAS_SCALE = 2.0;

    useEffect(() => {
        let isMounted = true;
        const renderPage = async () => {
            if (!pdfDoc || !canvasRef.current) return;
            
            try {
                const page = await pdfDoc.getPage(pageIndex);
                const vp = page.getViewport({ scale: CANVAS_SCALE });
                const rawVp = page.getViewport({ scale: 1.0 });
                if (isMounted) setPageViewport(rawVp);

                const canvas = canvasRef.current;
                const context = canvas.getContext('2d');
                canvas.height = vp.height;
                canvas.width = vp.width;
                
                if (context) {
                    await page.render({ canvasContext: context, viewport: vp }).promise;
                }
            } catch (e) {
                console.error(`Error rendering page ${pageIndex}`, e);
            }
        };
        renderPage();
        return () => { isMounted = false; };
    }, [pageIndex, pdfDoc]);

    useLayoutEffect(() => {
        if (!containerRef.current || !pageViewport) return;

        const updateRatio = () => {
            if (containerRef.current && pageViewport) {
                const currentWidth = containerRef.current.clientWidth;
                setRenderRatio(currentWidth / pageViewport.width);
            }
        };

        const observer = new ResizeObserver(updateRatio);
        observer.observe(containerRef.current);
        updateRatio();

        return () => observer.disconnect();
    }, [pageViewport]);

    return (
        <div ref={containerRef} className="relative mb-6 shadow-md bg-white w-full border border-slate-200">
            <canvas ref={canvasRef} className="w-full h-auto block" />

            {showOverlay && pageViewport && overlayData && (
                <div className="absolute inset-0 z-10 pointer-events-none">
                    {overlayData.items.map((item, idx) => {
                        // Coordinates: PDF Y is bottom-up.
                        // Calculate Top position. To cover ascenders, subtract height.
                        const pdfTop = pageViewport.height - item.y - item.height; 
                        
                        // Pixel conversion
                        const topPx = pdfTop * renderRatio;
                        const leftPx = (item.x * renderRatio) - 1; // Slight left overlap
                        const widthPx = (item.width * renderRatio) + 3; // Widen slightly
                        const heightPx = (item.height * renderRatio) + 2; // Heighten slightly
                        const fontSizePx = item.fontSize * renderRatio;

                        return (
                            <div
                                key={idx}
                                style={{
                                    position: 'absolute',
                                    top: `${topPx}px`,
                                    left: `${leftPx}px`,
                                    width: `${widthPx}px`, 
                                    height: `${heightPx}px`,
                                    backgroundColor: 'white', // Solid white to erase original
                                    zIndex: 20,
                                    pointerEvents: 'none',
                                    paddingLeft: '2px',
                                    paddingRight: '2px',
                                    display: 'flex',
                                    alignItems: 'center',
                                    overflow: 'hidden',
                                }}
                            >
                                <AutoFitText 
                                    text={item.text} 
                                    fontSize={fontSizePx} 
                                    height={heightPx} 
                                    width={widthPx}
                                />
                            </div>
                        );
                    })}
                </div>
            )}
        </div>
    );
};

export const ScanSection: React.FC<ScanSectionProps> = ({ theme }) => {
    const [file, setFile] = useState<File | null>(null);
    
    // Result State
    const [translatedHtml, setTranslatedHtml] = useState<string>('');
    const [pdfOverlays, setPdfOverlays] = useState<PdfPageOverlay[]>([]); 
    const [fullTranslatedText, setFullTranslatedText] = useState<string>('');
    
    const [isProcessing, setIsProcessing] = useState(false);
    const [progress, setProgress] = useState(0);
    
    const [viewState, setViewState] = useState<'upload' | 'ready' | 'result'>('upload');
    const [viewMode, setViewMode] = useState<'original' | 'translated'>('translated');

    const [detectedLang, setDetectedLang] = useState<string>('');
    const [targetLang, setTargetLang] = useState<string>('vi');
    const [isDropdownOpen, setIsDropdownOpen] = useState(false);
    
    const [error, setError] = useState<string | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const dropdownRef = useRef<HTMLDivElement>(null);
    
    // PDF State
    const [pdfNumPages, setPdfNumPages] = useState(0);
    const [pdfProxy, setPdfProxy] = useState<any>(null);

    // Initial DOCX Source (HTML)
    const [sourceHtml, setSourceHtml] = useState<string>(''); 

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setIsDropdownOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            const selectedFile = e.target.files[0];
            const fileType = selectedFile.type;
            const validTypes = ['application/pdf', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'];

            if (!validTypes.includes(fileType)) {
                setError("Chỉ hỗ trợ file PDF hoặc DOCX (Word).");
                return;
            }

            setFile(selectedFile);
            setError(null);
            setTranslatedHtml('');
            setPdfOverlays([]);
            setDetectedLang('');
            setSourceHtml('');
            setPdfProxy(null);
            setPdfNumPages(0);
            setProgress(0);
            setViewState('ready');
            
            setIsProcessing(true);
            try {
                if (fileType === 'application/pdf') {
                    const pdf = await getPdfDocument(selectedFile);
                    setPdfProxy(pdf);
                    setPdfNumPages(pdf.numPages);
                } else {
                    const html = await convertDocxToHtml(selectedFile);
                    setSourceHtml(html);
                }
            } catch (err) {
                console.error(err);
                setError("Lỗi khi đọc file. Vui lòng thử lại.");
                setViewState('upload');
            } finally {
                setIsProcessing(false);
            }
        }
    };

    const handleTranslate = async () => {
        if (!file) return;
        setIsProcessing(true);
        setError(null);
        setProgress(5);
        try {
            if (file.type.includes('pdf')) {
                const result = await translatePdfWithLayout(file, 'auto', targetLang, (p) => setProgress(p));
                setPdfOverlays(result.overlays);
                setDetectedLang(result.detectedLang);
                setFullTranslatedText(result.fullText);
            } else {
                const result = await translateHtml(sourceHtml, 'auto', targetLang, (p) => setProgress(p));
                setTranslatedHtml(result.text);
                setDetectedLang(result.detectedLang);
                setFullTranslatedText(result.text); 
            }
            
            setViewState('result');
            setViewMode('translated');
        } catch (err) {
            console.error(err);
            setError("Lỗi khi dịch tài liệu. Vui lòng thử lại sau.");
        } finally {
            setIsProcessing(false);
        }
    };

    const handleReset = () => {
        setFile(null);
        setTranslatedHtml('');
        setPdfOverlays([]);
        setSourceHtml('');
        setPdfProxy(null);
        setError(null);
        setDetectedLang('');
        setViewState('upload');
        setViewMode('translated');
        if (fileInputRef.current) fileInputRef.current.value = '';
    };

    const handleDownload = () => {
        if (!file) return;
        downloadTranslatedDocument(fullTranslatedText, file.name);
    };

    const getLangName = (code: string) => {
        if (!code) return 'Phát hiện ngôn ngữ';
        const lang = LANGUAGES.find(l => l.code === code);
        return lang ? lang.name : code.toUpperCase();
    };

    return (
        <div className="animate-fade-in-up flex flex-col h-full bg-slate-50 -m-4 sm:-m-8 rounded-b-3xl min-h-[600px]">
            {/* 1. Header Bar */}
            <div className="bg-white border-b border-slate-200 px-4 sm:px-8 py-3 flex items-center justify-between shadow-[0_2px_4px_rgba(0,0,0,0.02)] z-30 sticky top-0">
                <div className="flex items-center gap-4 flex-1">
                    <div className="flex items-center gap-2 text-slate-600 font-bold text-sm sm:text-base">
                        <span>{detectedLang ? getLangName(detectedLang) : 'Phát hiện ngôn ngữ'}</span>
                    </div>
                    <div className="text-slate-300">
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5 21 12m0 0-7.5 7.5M21 12H3" />
                        </svg>
                    </div>
                    <div className="relative" ref={dropdownRef}>
                        <button 
                            onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                            className="flex items-center gap-2 text-primary-600 font-bold text-sm sm:text-base hover:bg-primary-50 px-3 py-1.5 rounded-lg transition-colors"
                        >
                            <span>{getLangName(targetLang)}</span>
                            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className={`w-4 h-4 transition-transform ${isDropdownOpen ? 'rotate-180' : ''}`}><path fillRule="evenodd" d="M5.23 7.21a.75.75 0 0 1 1.06.02L10 11.168l3.71-3.938a.75.75 0 1 1 1.08 1.04l-4.25 4.5a.75.75 0 0 1-1.08 0l-4.25-4.5a.75.75 0 0 1 .02-1.06Z" clipRule="evenodd" /></svg>
                        </button>
                        {isDropdownOpen && (
                            <div className="absolute top-full left-0 mt-2 w-56 bg-white rounded-xl shadow-xl border border-slate-100 overflow-hidden z-[100] animate-fade-in-up">
                                <div className="max-h-64 overflow-y-auto custom-scrollbar p-1">
                                    {LANGUAGES.map(lang => (
                                        <button 
                                            key={lang.code}
                                            onClick={() => { setTargetLang(lang.code); setIsDropdownOpen(false); }}
                                            className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors ${targetLang === lang.code ? 'bg-primary-50 text-primary-700' : 'hover:bg-slate-50 text-slate-700'}`}
                                        >
                                            <span className="text-sm font-bold flex-1 text-left">{lang.name}</span>
                                            {targetLang === lang.code && <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4 text-primary-600"><path fillRule="evenodd" d="M16.704 4.153a.75.75 0 0 1 .143 1.052l-8 10.5a.75.75 0 0 1-1.127.075l-4.5-4.5a.75.75 0 0 1 1.06-1.06l3.894 3.893 7.48-9.817a.75.75 0 0 1 1.05-.143Z" clipRule="evenodd" /></svg>}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>
                </div>
                {viewState !== 'upload' && (
                    <button onClick={handleReset} className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-full transition-colors" title="Đóng">
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-6 h-6">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" />
                        </svg>
                    </button>
                )}
            </div>

            {/* 2. Main Content Area */}
            <div className="flex-1 relative flex flex-col justify-center items-center w-full overflow-hidden bg-slate-100">
                {/* VIEW 1: UPLOAD */}
                {viewState === 'upload' && (
                    <div className="w-full max-w-2xl px-6 animate-fade-in-up">
                        <div 
                            className="border-2 border-dashed border-slate-300 rounded-3xl p-12 flex flex-col items-center justify-center bg-white hover:border-primary-400 hover:bg-primary-50/10 transition-all cursor-pointer group shadow-sm"
                            onClick={() => fileInputRef.current?.click()}
                        >
                            <div className="w-24 h-24 bg-primary-50 rounded-full flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300 text-primary-500">
                                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-10 h-10">
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 0 0-3.375-3.375h-1.5A1.125 1.125 0 0 1 13.5 7.125v-1.5a3.375 3.375 0 0 0-3.375-3.375H8.25m2.25 0H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 0 0-9-9Z" />
                                </svg>
                            </div>
                            <p className="text-xl sm:text-2xl font-bold text-slate-700 mb-2 text-center">Chọn tài liệu</p>
                            <p className="text-slate-400 text-sm font-medium mb-6 text-center">Tải lên tệp .pdf hoặc .docx</p>
                            <button className="px-6 py-3 bg-primary-600 hover:bg-primary-700 text-white font-bold rounded-full shadow-lg shadow-primary-200 transition-all transform active:scale-95">
                                Tìm trên máy tính
                            </button>
                            <input type="file" ref={fileInputRef} className="hidden" accept=".pdf,.docx" onChange={handleFileChange} />
                        </div>
                        {error && <p className="text-red-500 text-sm font-semibold mt-4 text-center bg-red-50 py-2 rounded-lg">{error}</p>}
                    </div>
                )}

                {/* VIEW 2: READY */}
                {viewState === 'ready' && file && (
                    <div className="flex flex-col items-center animate-fade-in-up gap-6 p-6">
                        <div className="w-24 h-24 bg-white rounded-2xl shadow-lg border border-slate-100 flex items-center justify-center text-slate-700">
                            {file.type.includes('pdf') ? (
                                <span className="font-bold text-2xl text-red-500">PDF</span>
                            ) : (
                                <span className="font-bold text-2xl text-blue-500">DOC</span>
                            )}
                        </div>
                        <div className="text-center">
                            <h3 className="text-lg font-bold text-slate-800 mb-1">{file.name}</h3>
                            <p className="text-sm text-slate-400">{(file.size / 1024 / 1024).toFixed(2)} MB</p>
                        </div>
                        <div className="flex flex-col gap-3 w-full sm:w-auto">
                            <button 
                                onClick={handleTranslate}
                                disabled={isProcessing}
                                className={`px-10 py-3.5 bg-primary-600 hover:bg-primary-700 text-white font-bold rounded-full shadow-xl shadow-primary-200 transition-all transform hover:-translate-y-1 active:scale-95 flex items-center justify-center gap-3 ${isProcessing ? 'opacity-80 cursor-wait' : ''}`}
                            >
                                {isProcessing ? (
                                    <>
                                        <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
                                        <span>Đang dịch {progress > 0 ? `${progress}%` : '...'}</span>
                                    </>
                                ) : (
                                    <>Dịch tài liệu</>
                                )}
                            </button>
                            {isProcessing && <p className="text-xs text-slate-400 text-center animate-pulse">Quá trình này có thể mất vài giây</p>}
                        </div>
                    </div>
                )}

                {/* VIEW 3: RESULT */}
                {viewState === 'result' && (
                    <div className="w-full h-full flex flex-col bg-slate-100 animate-fade-in-up">
                        <div className="h-14 bg-white border-b border-slate-200 flex items-center justify-between px-4 shrink-0 shadow-sm z-20 gap-2">
                            <div className="flex bg-slate-100 rounded-lg p-1">
                                <button 
                                    onClick={() => setViewMode('original')}
                                    className={`px-3 sm:px-4 py-1.5 rounded-md text-sm font-bold transition-all ${viewMode === 'original' ? 'bg-white text-slate-800 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                                >
                                    Bản gốc
                                </button>
                                <button 
                                    onClick={() => setViewMode('translated')}
                                    className={`px-3 sm:px-4 py-1.5 rounded-md text-sm font-bold transition-all ${viewMode === 'translated' ? 'bg-white text-primary-700 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                                >
                                    Bản dịch
                                </button>
                            </div>
                            
                            <div className="flex items-center gap-2">
                                <button
                                    onClick={handleTranslate}
                                    disabled={isProcessing}
                                    className="hidden sm:flex items-center gap-1.5 px-3 py-2 text-slate-600 hover:text-primary-600 hover:bg-slate-50 rounded-lg text-sm font-bold transition-colors"
                                >
                                    {isProcessing ? (
                                        <svg className="animate-spin h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
                                    ) : (
                                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-4 h-4"><path strokeLinecap="round" strokeLinejoin="round" d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0 3.181 3.183a8.25 8.25 0 0 0 13.803-3.7M4.031 9.865a8.25 8.25 0 0 1 13.803-3.7l3.181 3.182m0-4.991v4.99" /></svg>
                                    )}
                                    Dịch lại
                                </button>

                                <button 
                                    onClick={handleDownload}
                                    className="flex items-center gap-2 px-4 py-2 bg-primary-600 hover:bg-primary-700 text-white rounded-lg font-bold text-sm transition-colors shadow-sm"
                                >
                                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-4 h-4">
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75V16.5M16.5 12 12 16.5m0 0L7.5 12m4.5 4.5V3" />
                                    </svg>
                                    <span className="hidden sm:inline">Tải xuống</span>
                                </button>
                            </div>
                        </div>

                        {/* Progress Bar overlay for Re-translation */}
                        {isProcessing && viewState === 'result' && (
                            <div className="absolute top-14 left-0 w-full h-1 bg-slate-200 overflow-hidden z-30">
                                <div className="h-full bg-primary-500 transition-all duration-300" style={{ width: `${progress}%` }}></div>
                            </div>
                        )}

                        <div className="flex-1 overflow-y-auto custom-scrollbar p-4 sm:p-8 flex justify-center">
                            <div className="w-full max-w-[210mm] min-h-[800px] transition-all duration-300 relative">
                                
                                {/* PDF RENDERER (Supports Overlay) */}
                                {file?.type.includes('pdf') ? (
                                    <div className="flex flex-col items-center w-full">
                                        {Array.from({ length: pdfNumPages }, (_, i) => i + 1).map((pageNum) => (
                                            <PdfPageRenderer 
                                                key={pageNum} 
                                                pageIndex={pageNum} 
                                                overlayData={pdfOverlays.find(p => p.pageIndex === pageNum)}
                                                pdfDoc={pdfProxy}
                                                showOverlay={viewMode === 'translated'}
                                            />
                                        ))}
                                    </div>
                                ) : (
                                    /* DOCX RENDERER (HTML) */
                                    <div className="bg-white shadow-lg p-8 sm:p-12 min-h-full">
                                        <div className={`${viewMode === 'original' ? 'block' : 'hidden'} prose prose-sm max-w-none font-serif`} 
                                             dangerouslySetInnerHTML={{ __html: sourceHtml }} />
                                        
                                        <div className={`${viewMode === 'translated' ? 'block' : 'hidden'} prose prose-sm max-w-none font-serif`} 
                                             dangerouslySetInnerHTML={{ __html: translatedHtml }} />
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};
