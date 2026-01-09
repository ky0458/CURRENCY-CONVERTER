
import React, { useState, useRef, useEffect } from 'react';
import { extractTextFromPdf, extractTextFromDocx, convertDocxToHtml, translateDocumentText, translateHtml, getPdfDocument } from '../services/documentService';
import { LANGUAGE_FLAGS } from '../constants';

interface ScanSectionProps {
    theme: string;
}

const LANGUAGES = [
    { code: 'vi', name: 'Tiếng Việt' },
    { code: 'en', name: 'Tiếng Anh' },
    { code: 'zh-CN', name: 'Tiếng Trung' },
    { code: 'ja', name: 'Tiếng Nhật' },
    { code: 'ko', name: 'Tiếng Hàn' },
    { code: 'fr', name: 'Tiếng Pháp' },
    { code: 'de', name: 'Tiếng Đức' },
    { code: 'ru', name: 'Tiếng Nga' },
];

export const ScanSection: React.FC<ScanSectionProps> = ({ theme }) => {
    const [file, setFile] = useState<File | null>(null);
    const [extractedText, setExtractedText] = useState<string>('');
    const [sourceHtml, setSourceHtml] = useState<string>(''); // For DOCX preview
    const [translatedText, setTranslatedText] = useState<string>(''); // Can be Text or HTML
    const [isProcessing, setIsProcessing] = useState(false);
    const [progress, setProgress] = useState(0);
    
    const [detectedLang, setDetectedLang] = useState<string>('');
    const [targetLang, setTargetLang] = useState<string>('vi');
    const [isDropdownOpen, setIsDropdownOpen] = useState(false);
    
    const [error, setError] = useState<string | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const dropdownRef = useRef<HTMLDivElement>(null);
    
    // PDF Rendering Refs
    const pdfContainerRef = useRef<HTMLDivElement>(null);
    const [pdfNumPages, setPdfNumPages] = useState(0);
    const [pdfProxy, setPdfProxy] = useState<any>(null);

    // Close dropdown on outside click
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

            // Reset state
            setFile(selectedFile);
            setError(null);
            setTranslatedText('');
            setDetectedLang('');
            setExtractedText('');
            setSourceHtml('');
            setPdfProxy(null);
            setPdfNumPages(0);
            setProgress(0);
            
            setIsProcessing(true);
            try {
                let text = '';
                if (fileType === 'application/pdf') {
                    // Extract text for translation (PDF)
                    text = await extractTextFromPdf(selectedFile);
                    
                    // Setup PDF Preview
                    const pdf = await getPdfDocument(selectedFile);
                    setPdfProxy(pdf);
                    setPdfNumPages(pdf.numPages);
                } else {
                    // Extract HTML for Preview & Translation (DOCX)
                    const html = await convertDocxToHtml(selectedFile);
                    setSourceHtml(html);
                    text = await extractTextFromDocx(selectedFile); // Fallback text extraction just in case
                }
                setExtractedText(text);
            } catch (err) {
                console.error(err);
                setError("Lỗi khi đọc file. Vui lòng thử lại file khác.");
            } finally {
                setIsProcessing(false);
            }
        }
    };

    // Render PDF Pages Effect
    useEffect(() => {
        const renderPdfPages = async () => {
            if (!pdfProxy || !pdfContainerRef.current) return;
            
            // Clear container
            pdfContainerRef.current.innerHTML = '';

            for (let i = 1; i <= pdfNumPages; i++) {
                try {
                    const page = await pdfProxy.getPage(i);
                    const scale = 1.2; 
                    const viewport = page.getViewport({ scale });

                    const canvas = document.createElement('canvas');
                    const context = canvas.getContext('2d');
                    canvas.height = viewport.height;
                    canvas.width = viewport.width;
                    
                    // PDF Page Style
                    canvas.style.width = '100%';
                    canvas.style.height = 'auto';
                    canvas.style.marginBottom = '20px';
                    canvas.style.boxShadow = '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)';
                    canvas.style.backgroundColor = 'white';

                    pdfContainerRef.current.appendChild(canvas);

                    const renderContext = {
                        canvasContext: context,
                        viewport: viewport,
                    };
                    await page.render(renderContext).promise;
                } catch (e) {
                    console.error(`Error rendering page ${i}`, e);
                }
            }
        };

        if (pdfProxy && pdfNumPages > 0) {
            renderPdfPages();
        }
    }, [pdfProxy, pdfNumPages]);

    const handleTranslate = async () => {
        if (!file) return;
        setIsProcessing(true);
        setError(null);
        try {
            let result;
            if (file.type.includes('pdf')) {
                // PDF: Text-based translation
                result = await translateDocumentText(extractedText, 'auto', targetLang, (percent) => setProgress(percent));
            } else {
                // DOCX: HTML-based translation (Preserve Layout)
                // Use sourceHtml which contains the original structure
                result = await translateHtml(sourceHtml, 'auto', targetLang, (percent) => setProgress(percent));
            }
            
            setTranslatedText(result.text);
            setDetectedLang(result.detectedLang);
        } catch (err) {
            console.error(err);
            setError("Lỗi khi dịch tài liệu.");
        } finally {
            setIsProcessing(false);
        }
    };

    const handleReset = () => {
        setFile(null);
        setExtractedText('');
        setTranslatedText('');
        setSourceHtml('');
        setPdfProxy(null);
        setError(null);
        setDetectedLang('');
        if (fileInputRef.current) fileInputRef.current.value = '';
    };

    const getLangName = (code: string) => {
        if (!code) return 'Đang phát hiện...';
        const lang = LANGUAGES.find(l => l.code === code);
        if (lang) return lang.name;
        if (code === 'zh') return 'Tiếng Trung';
        return code.toUpperCase();
    };

    const getFlag = (code: string) => LANGUAGE_FLAGS[code] || LANGUAGE_FLAGS['auto'];

    // Helper to render text paragraphs cleanly for Translation (PDF Case) with better formatting
    const renderTranslatedTextContent = (text: string) => {
        if (!text) return null;
        
        // Split by logical paragraphs (double newlines) to form blocks
        const blocks = text.split(/\n\s*\n/);
        
        return (
            <div className="font-sans text-slate-700 leading-relaxed text-base">
                {blocks.map((block, blockIndex) => {
                    if (!block.trim()) return null;
                    const lines = block.split('\n').map(l => l.trim()).filter(l => l);
                    
                    return (
                        <div key={blockIndex} className="mb-5 last:mb-0">
                            {lines.map((line, lineIndex) => {
                                // 1. Detection Logic
                                
                                // Section Headers (Main Categories)
                                const isCVHeader = /^(kinh nghiệm|học vấn|giáo dục|kỹ năng|ngôn ngữ|chứng chỉ|giải thưởng|tóm tắt|liên hệ|thông tin|dự án|hoạt động|sở thích|mục tiêu|người tham chiếu|experience|education|skills|summary|contact|project|reference|work history|employment history|certifications|languages)/i.test(line);
                                const isAllCapsHeader = line.length > 2 && line.length < 50 && line === line.toUpperCase() && /[A-ZÀ-Ỹ]/.test(line);
                                const isHeader = isCVHeader || isAllCapsHeader;

                                // List Items
                                const isListItem = /^[-\u2022\u2023\u25E6\u2043\+]|^\d+\./.test(line);

                                // Meta Info (Dates, Locations, Contacts) - usually in italics or gray
                                const isMetaInfo = /\b((19|20)\d{2}|present|hiện tại|tháng \d|năm \d|jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)\b/i.test(line) 
                                    || /@|www\.|http|\.com/.test(line)
                                    || (line.length < 40 && /\d/.test(line) && (line.includes('-') || line.includes('/')));

                                // Sub-headers (Company Names, Job Titles, University Names)
                                // Heuristic: Short line, Title Case, First line of a block OR follows a header, NOT ending in punctuation
                                const isSubHeader = !isHeader && !isMetaInfo && !isListItem && line.length < 80 && !/[.!?]$/.test(line) && (lineIndex === 0 || isCVHeader);

                                // 2. Rendering Logic

                                if (isHeader) {
                                    return (
                                        <h3 key={lineIndex} className="text-lg font-extrabold text-primary-700 uppercase tracking-wide border-b-2 border-primary-100 pb-1 mb-3 mt-6 first:mt-0">
                                            {line}
                                        </h3>
                                    );
                                }

                                if (isSubHeader) {
                                    return (
                                        <h4 key={lineIndex} className="text-base font-bold text-slate-900 mt-3 mb-1">
                                            {line}
                                        </h4>
                                    );
                                }

                                if (isMetaInfo) {
                                    return (
                                        <div key={lineIndex} className="text-sm text-slate-500 italic font-medium mb-2 flex items-center gap-1.5">
                                            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-3.5 h-3.5 opacity-70">
                                                <path fillRule="evenodd" d="M5.75 2a.75.75 0 0 1 .75.75V4h7V2.75a.75.75 0 0 1 1.5 0V4h.25A2.75 2.75 0 0 1 18 6.75v8.5A2.75 2.75 0 0 1 15.25 18H4.75A2.75 2.75 0 0 1 2 15.25v-8.5A2.75 2.75 0 0 1 4.75 4H5V2.75A.75.75 0 0 1 5.75 2Zm-1 5.5c-.69 0-1.25.56-1.25 1.25v6.5c0 .69.56 1.25 1.25 1.25h10.5c.69 0 1.25-.56 1.25-1.25v-6.5c0-.69-.56-1.25-1.25-1.25H4.75Z" clipRule="evenodd" />
                                            </svg>
                                            {line}
                                        </div>
                                    );
                                }

                                if (isListItem) {
                                    return (
                                        <div key={lineIndex} className="flex items-start gap-3 ml-2 mb-1.5">
                                            <span className="text-primary-500 mt-2.5 w-1.5 h-1.5 rounded-full bg-primary-500 shrink-0 block ring-2 ring-primary-100"></span>
                                            <span className="text-justify leading-relaxed">
                                                {line.replace(/^[-\u2022\u2023\u25E6\u2043\+]\s*/, '').replace(/^\d+\.\s*/, '')}
                                            </span>
                                        </div>
                                    );
                                }

                                return (
                                    <p key={lineIndex} className="mb-2 text-justify leading-relaxed text-slate-700">
                                        {line}
                                    </p>
                                );
                            })}
                        </div>
                    );
                })}
            </div>
        );
    };

    return (
        <div className="animate-fade-in-up space-y-4 pb-24 md:pb-0">
            {/* Upload Area */}
            {!file ? (
                <div 
                    className="border-2 border-dashed border-slate-300 rounded-3xl p-10 flex flex-col items-center justify-center bg-slate-50 hover:bg-white hover:border-primary-400 transition-all cursor-pointer group min-h-[300px]"
                    onClick={() => fileInputRef.current?.click()}
                >
                    <div className="w-20 h-20 bg-white rounded-full flex items-center justify-center shadow-lg shadow-slate-200 mb-6 group-hover:scale-110 transition-transform duration-300">
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-10 h-10 text-primary-500">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 0 0-3.375-3.375h-1.5A1.125 1.125 0 0 1 13.5 7.125v-1.5a3.375 3.375 0 0 0-3.375-3.375H8.25m2.25 0H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 0 0-9-9Z" />
                        </svg>
                    </div>
                    <p className="text-slate-700 font-bold text-xl mb-2">Tải lên tài liệu</p>
                    <p className="text-slate-400 text-sm">Hỗ trợ PDF, DOCX (Tối đa 10MB)</p>
                    <input 
                        type="file" 
                        ref={fileInputRef} 
                        className="hidden" 
                        accept=".pdf,.docx" 
                        onChange={handleFileChange} 
                    />
                    {error && <p className="text-red-500 text-sm font-semibold mt-4 bg-red-50 px-3 py-1 rounded-lg">{error}</p>}
                </div>
            ) : (
                <div className="flex flex-col h-full relative">
                    
                    {/* Controls Bar */}
                    <div className="flex flex-col xl:flex-row items-stretch gap-3 mb-4 bg-white/80 p-3 rounded-2xl border border-white/50 shadow-sm backdrop-blur-md relative z-[60]">
                        
                        <div className="flex items-center gap-3 px-3 py-2 bg-white rounded-xl border border-slate-100 xl:w-1/4 min-w-0">
                            <div className="w-10 h-10 bg-red-50 rounded-lg flex items-center justify-center shrink-0">
                                {file.type.includes('pdf') ? (
                                    <span className="text-xs font-bold text-red-500">PDF</span>
                                ) : (
                                    <span className="text-xs font-bold text-blue-500">DOC</span>
                                )}
                            </div>
                            <div className="min-w-0 flex-1 overflow-hidden">
                                <p className="text-sm font-bold text-slate-700 truncate" title={file.name}>{file.name}</p>
                                <button onClick={handleReset} className="text-[10px] text-slate-400 hover:text-red-500 flex items-center gap-1 transition-colors mt-0.5 whitespace-nowrap">
                                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-3 h-3"><path d="M6.28 5.22a.75.75 0 0 0-1.06 1.06L8.94 10l-3.72 3.72a.75.75 0 1 0 1.06 1.06L10 11.06l3.72 3.72a.75.75 0 1 0 1.06-1.06L11.06 10l3.72-3.72a.75.75 0 0 0-1.06-1.06L10 8.94 6.28 5.22Z" /></svg>
                                    Chọn lại
                                </button>
                            </div>
                        </div>

                        <div className="flex-1 flex flex-col sm:flex-row items-stretch sm:items-center gap-0 bg-white rounded-xl border border-slate-200 overflow-visible shadow-sm relative z-[70]">
                            
                            <div className="flex-1 flex items-center justify-between px-4 py-3 border-b sm:border-b-0 sm:border-r border-slate-100 bg-slate-50/50">
                                <div className="flex flex-col">
                                    <span className="text-[10px] uppercase font-bold text-slate-400 mb-0.5">Ngôn ngữ gốc</span>
                                    <div className="flex items-center gap-2">
                                        <img 
                                            src={detectedLang ? getFlag(detectedLang) : getFlag('auto')} 
                                            className="w-5 h-5 rounded-full object-cover shadow-sm border border-white" 
                                            alt="Source Flag"
                                        />
                                        <span className="text-sm font-bold text-slate-700">
                                            {detectedLang ? getLangName(detectedLang) : 'Tự động phát hiện'}
                                        </span>
                                    </div>
                                </div>
                            </div>

                            <div className="hidden sm:flex items-center justify-center px-2 text-slate-300">
                                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5">
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5 21 12m0 0-7.5 7.5M21 12H3" />
                                </svg>
                            </div>

                            <div className="flex-1 relative" ref={dropdownRef}>
                                <button 
                                    onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                                    className="w-full h-full flex items-center justify-between px-4 py-3 hover:bg-slate-50 transition-colors group text-left"
                                >
                                    <div className="flex flex-col">
                                        <span className="text-[10px] uppercase font-bold text-slate-400 mb-0.5 group-hover:text-primary-500 transition-colors">Dịch sang</span>
                                        <div className="flex items-center gap-2">
                                            <img src={getFlag(targetLang)} className="w-5 h-5 rounded-full object-cover shadow-sm border border-white" alt="Target Flag" />
                                            <span className="text-sm font-bold text-primary-700">{getLangName(targetLang)}</span>
                                        </div>
                                    </div>
                                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className={`w-5 h-5 text-slate-400 transition-transform ${isDropdownOpen ? 'rotate-180' : ''}`}><path fillRule="evenodd" d="M5.23 7.21a.75.75 0 0 1 1.06.02L10 11.168l3.71-3.938a.75.75 0 1 1 1.08 1.04l-4.25 4.5a.75.75 0 0 1-1.08 0l-4.25-4.5a.75.75 0 0 1 .02-1.06Z" clipRule="evenodd" /></svg>
                                </button>
                                
                                {isDropdownOpen && (
                                    <div className="absolute top-full left-0 right-0 mt-2 bg-white rounded-xl shadow-2xl border border-slate-100 overflow-hidden z-[100] animate-fade-in-up ring-1 ring-black/5">
                                        <div className="max-h-64 overflow-y-auto custom-scrollbar p-1">
                                            {LANGUAGES.map(lang => (
                                                <button 
                                                    key={lang.code}
                                                    onClick={() => { setTargetLang(lang.code); setIsDropdownOpen(false); }}
                                                    className={`w-full flex items-center gap-3 px-3 py-3 rounded-lg transition-colors ${targetLang === lang.code ? 'bg-primary-50 text-primary-700' : 'hover:bg-slate-50 text-slate-700'}`}
                                                >
                                                    <img src={getFlag(lang.code)} className="w-6 h-6 rounded-full object-cover shadow-sm border border-slate-100" alt={lang.name} />
                                                    <span className="text-sm font-bold flex-1 text-left">{lang.name}</span>
                                                    {targetLang === lang.code && <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-5 h-5 text-primary-600"><path fillRule="evenodd" d="M16.704 4.153a.75.75 0 0 1 .143 1.052l-8 10.5a.75.75 0 0 1-1.127.075l-4.5-4.5a.75.75 0 0 1 1.06-1.06l3.894 3.893 7.48-9.817a.75.75 0 0 1 1.05-.143Z" clipRule="evenodd" /></svg>}
                                                </button>
                                            ))}
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>

                        <div className="flex items-stretch gap-2 z-50">
                             {!translatedText && (
                                 <button 
                                    onClick={handleTranslate}
                                    disabled={isProcessing || (!extractedText && !file)}
                                    className={`
                                        px-6 py-3 rounded-xl font-bold text-white shadow-lg transition-all transform active:scale-95 flex items-center justify-center gap-2 whitespace-nowrap min-w-[140px] w-full xl:w-auto
                                        ${isProcessing || (!extractedText && !file) 
                                            ? 'bg-slate-300 cursor-not-allowed shadow-none' 
                                            : 'bg-gradient-to-r from-primary-500 to-primary-600 hover:from-primary-600 hover:to-primary-700 shadow-primary-200 hover:-translate-y-0.5'}
                                    `}
                                >
                                    {isProcessing ? (
                                        <>
                                            <svg className="animate-spin h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
                                            <span className="text-sm font-bold">Đang dịch {progress > 0 ? `${progress}%` : ''}</span>
                                        </>
                                    ) : (
                                        <>
                                            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5">
                                                <path fillRule="evenodd" d="M10.5 3.75a6.75 6.75 0 1 0 0 13.5 6.75 6.75 0 0 0 0-13.5ZM2.25 10.5a8.25 8.25 0 1 1 14.59 5.28l4.69 4.69a.75.75 0 1 1-1.06 1.06l-4.69-4.69A8.25 8.25 0 0 1 2.25 10.5Z" clipRule="evenodd" />
                                            </svg>
                                            <span className="text-sm font-bold">Bắt đầu dịch</span>
                                        </>
                                    )}
                                </button>
                             )}
                        </div>
                    </div>

                    {/* Preview Area - VERTICAL LAYOUT */}
                    <div className="flex flex-col gap-8 flex-1 pb-20">
                        
                        {/* 1. Source Preview (Original Format) */}
                        <div className="flex flex-col gap-2">
                            <div className="flex items-center gap-2 mb-1 px-2">
                                <span className="text-xs font-extrabold uppercase text-slate-500 tracking-widest">Bản gốc</span>
                                <div className="h-px flex-1 bg-slate-200"></div>
                            </div>
                            
                            <div className="flex-1 overflow-y-auto custom-scrollbar p-6 flex justify-center bg-slate-100 rounded-2xl border border-slate-200 min-h-[500px] shadow-inner">
                                {/* Page Container */}
                                <div className="w-full max-w-[210mm] transition-transform duration-300 relative">
                                    {file.type === 'application/pdf' ? (
                                        // PDF Preview using Canvas
                                        <div ref={pdfContainerRef} className="flex flex-col items-center w-full min-h-full">
                                            {!pdfNumPages && <div className="mt-20 text-slate-400 font-medium text-sm">Đang tải PDF...</div>}
                                        </div>
                                    ) : (
                                        // DOCX Preview using HTML (Mammoth) - Rendered as a page
                                        <div className="p-8 sm:p-12 w-full bg-white min-h-full shadow-lg border border-slate-100 mx-auto">
                                            {sourceHtml ? (
                                                <div 
                                                    className="prose prose-sm max-w-none text-slate-900 font-serif"
                                                    dangerouslySetInnerHTML={{ __html: sourceHtml }} 
                                                    style={{ fontFamily: '"Times New Roman", Times, serif' }}
                                                />
                                            ) : (
                                                <div className="flex flex-col items-center justify-center h-40 text-slate-400">
                                                     <svg className="animate-spin h-6 w-6 mb-2" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
                                                     <span className="text-xs">Đang tải bản xem trước...</span>
                                                </div>
                                            )}
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>

                        {/* Arrow Divider */}
                        {translatedText && (
                            <div className="flex justify-center -my-2 text-primary-200">
                                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-8 h-8 animate-bounce">
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 13.5 12 21m0 0-7.5-7.5M12 21V3" />
                                </svg>
                            </div>
                        )}

                        {/* 2. Target Preview (Clean Text Format) */}
                        <div className="flex flex-col gap-2">
                            <div className="flex items-center gap-2 mb-1 px-2">
                                <span className="text-xs font-extrabold uppercase text-primary-600 tracking-widest">Bản dịch</span>
                                <div className="h-px flex-1 bg-primary-100"></div>
                            </div>

                            <div className="flex-1 overflow-y-auto custom-scrollbar p-6 flex justify-center bg-slate-100 rounded-2xl border border-primary-100 min-h-[500px] shadow-inner relative">
                                <div className="w-full max-w-[210mm] transition-transform duration-300">
                                    {/* Handle DOCX (HTML) vs PDF (Text) display */}
                                    {translatedText ? (
                                        file?.type.includes('pdf') ? (
                                            // PDF Translation: Clean Sans-Serif Layout
                                            <div className="p-8 sm:p-12 w-full bg-white min-h-[800px] shadow-lg border border-slate-100 mx-auto">
                                                {renderTranslatedTextContent(translatedText)}
                                            </div>
                                        ) : (
                                            // DOCX Translation: Clean HTML Layout without strict font styles
                                            <div className="p-8 sm:p-12 w-full bg-white min-h-[800px] shadow-lg border border-slate-100 mx-auto">
                                                <div 
                                                    className="prose prose-sm max-w-none text-slate-800 font-sans"
                                                    dangerouslySetInnerHTML={{ __html: translatedText }} 
                                                />
                                            </div>
                                        )
                                    ) : (
                                        <div className="h-full min-h-[400px] flex flex-col items-center justify-center text-slate-300 gap-3 opacity-60">
                                            <div className="w-16 h-16 rounded-full bg-slate-200 flex items-center justify-center border border-slate-300">
                                                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-8 h-8">
                                                    <path strokeLinecap="round" strokeLinejoin="round" d="m10.5 21 5.25-11.25L21 21m-9-3h7.5M3 5.621a48.474 48.474 0 0 1 6-.371m0 0c1.12 0 2.233.038 3.334.114M9 5.25V3m3.334 2.364C11.176 10.658 7.69 15.08 3 17.502m9.334-12.138c.896.061 1.785.147 2.666.257m-4.589 8.495a18.023 18.023 0 0 1-3.827-5.802" />
                                                </svg>
                                            </div>
                                            <span className="text-sm font-medium">Bản dịch sẽ hiển thị tại đây</span>
                                        </div>
                                    )}
                                </div>
                                
                                {isProcessing && progress > 0 && (
                                    <div className="absolute inset-0 bg-white/80 backdrop-blur-[2px] flex flex-col items-center justify-center z-20 rounded-2xl">
                                        <div className="w-20 h-20 relative flex items-center justify-center">
                                            <svg className="animate-spin w-full h-full text-primary-500" viewBox="0 0 24 24">
                                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none"></circle>
                                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                            </svg>
                                            <span className="absolute text-xs font-bold text-primary-700">{progress}%</span>
                                        </div>
                                        <p className="text-xs font-bold text-primary-600 mt-3 animate-pulse uppercase tracking-wider">Đang dịch tài liệu...</p>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};
