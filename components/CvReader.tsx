import React, { useState, useRef } from 'react';
import { createPortal } from 'react-dom';
import ReactMarkdown from 'react-markdown';
import { readCvContent } from '../services/geminiService';
import { PdfViewer } from './PdfViewer';

export const CvReader: React.FC = () => {
    const [cvFiles, setCvFiles] = useState<File[]>([]);
    const [jdFile, setJdFile] = useState<File | null>(null);
    const [isProcessing, setIsProcessing] = useState(false);
    const [result, setResult] = useState<string>('');
    const [error, setError] = useState<string>('');
    const [previewFile, setPreviewFile] = useState<{url: string, name: string, type: string} | null>(null);
    
    const cvInputRef = useRef<HTMLInputElement>(null);
    const jdInputRef = useRef<HTMLInputElement>(null);

    const convertFileToBase64 = (file: File): Promise<string> => {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.readAsDataURL(file);
            reader.onload = () => resolve(reader.result as string);
            reader.onerror = error => reject(error);
        });
    };

    const handleCvUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const files = Array.from(e.target.files || []);
        if (files.length === 0) return;

        const validFiles = files.filter(file => file.type === 'application/pdf' || file.type.startsWith('image/'));
        if (validFiles.length !== files.length) {
            setError('Có file không hợp lệ. CV chỉ hỗ trợ file PDF hoặc file ảnh (JPG, PNG).');
            return;
        }

        const newFiles = [...cvFiles, ...validFiles].slice(0, 5);
        if (cvFiles.length + validFiles.length > 5) {
            setError('Chỉ cho phép phân tích tối đa 5 CV cùng lúc. Các file dư sẽ bị bỏ qua.');
        } else {
            setError('');
        }

        setCvFiles(newFiles);
        setResult(''); // Clear previous result when a new CV is uploaded
        if (cvInputRef.current) cvInputRef.current.value = '';
    };

    const removeCv = (index: number) => {
        const newFiles = [...cvFiles];
        newFiles.splice(index, 1);
        setCvFiles(newFiles);
    };

    const handleJdUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        if (file.type !== 'application/pdf' && !file.type.startsWith('image/') && file.type !== 'text/plain') {
            setError('JD chỉ hỗ trợ file PDF, văn bản tĩnh (.txt), hoặc file ảnh (JPG, PNG).');
            return;
        }

        setJdFile(file);
        setError('');
        setResult(''); // Clear previous result when a new JD is uploaded
    };

    const handleProcess = async () => {
        if (cvFiles.length === 0) {
            setError('Vui lòng tải lên ít nhất 1 CV để tiếp tục.');
            return;
        }

        setError('');
        setIsProcessing(true);

        try {
            const cvDataArray = await Promise.all(
                cvFiles.map(async (file) => ({
                    base64: await convertFileToBase64(file),
                    mimeType: file.type,
                    filename: file.name
                }))
            );
            
            let jdData: { base64?: string; mimeType?: string; text?: string } | undefined;

            if (jdFile) {
                if (jdFile.type === 'text/plain') {
                    const text = await jdFile.text();
                    jdData = { text };
                } else {
                    const jdBase64 = await convertFileToBase64(jdFile);
                    jdData = { base64: jdBase64, mimeType: jdFile.type };
                }
            }

            const summary = await readCvContent(cvDataArray, jdData);
            if (summary.trim() === "ERROR_INVALID_CONTENT_ALL") {
                setError('Nội dung tải lên không phải là CV hoặc JD hợp lệ để phân tích.');
                setResult('');
                setIsProcessing(false);
                return;
            }
            setResult(summary);
        } catch (err) {
            console.error(err);
            setError('Có lỗi xảy ra trong quá trình đọc và phân tích.');
        } finally {
            setIsProcessing(false);
        }
    };

    const openPreview = (file: File) => {
        const url = URL.createObjectURL(file);
        setPreviewFile({ url, name: file.name, type: file.type });
    };

    const closePreview = () => {
        if (previewFile) {
            URL.revokeObjectURL(previewFile.url);
        }
        setPreviewFile(null);
    };

    return (
        <div className="flex flex-col gap-4 w-full animate-fade-in relative">
            {/* Header / Upload Section */}
            <div className="flex flex-col gap-3 w-full">
                <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3 bg-white p-2 sm:p-2.5 rounded-2xl border border-slate-200/80 shadow-sm w-full">
                    
                    {/* Upload Status Area */}
                    <div className="flex flex-col md:flex-row flex-wrap items-center gap-2 w-full lg:w-auto">
                        {/* CVs Status */}
                        {cvFiles.length === 0 ? (
                            <div className="flex items-center gap-2 px-3 py-2.5 bg-slate-50/80 text-slate-700 rounded-xl border border-slate-100/80 text-sm font-medium flex-1 justify-between w-full md:w-1/2 lg:w-auto shadow-inner min-w-0">
                                <div className="flex items-center gap-2 shrink overflow-hidden">
                                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-4 h-4 shrink-0 text-slate-400">
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 0 0-3.375-3.375h-1.5A1.125 1.125 0 0 1 13.5 7.125v-1.5a3.375 3.375 0 0 0-3.375-3.375H8.25m3 12h9m-9-3h9m-9-3h9m-9-3h9" />
                                    </svg>
                                    <span className="truncate">Chưa có CV</span>
                                </div>
                                <div className="flex items-center gap-1.5 shrink-0 ml-auto">
                                    <button 
                                        onClick={() => cvInputRef.current?.click()} 
                                        className="flex items-center justify-center p-1.5 sm:px-3 sm:py-1.5 bg-white hover:bg-slate-50 text-indigo-600 rounded-lg border border-slate-200/60 shadow-sm transition-colors focus:outline-none focus:ring-2 focus:ring-indigo-500/30 shrink-0"
                                        title="Tải CV"
                                    >
                                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-4 h-4 sm:w-3.5 sm:h-3.5">
                                            <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75V16.5m-13.5-9L12 3m0 0 4.5 4.5M12 3v13.5" />
                                        </svg>
                                        <span className="hidden sm:inline text-[11px] sm:text-xs font-bold uppercase tracking-wide shrink-0 ml-1.5">
                                            Tải CV
                                        </span>
                                    </button>
                                </div>
                            </div>
                        ) : (
                            <>
                                {cvFiles.map((file, idx) => (
                                    <div key={idx} className="flex items-center gap-2 px-3 py-2.5 bg-slate-50/80 text-slate-700 rounded-xl border border-slate-100/80 text-sm font-medium flex-1 justify-between w-full md:w-[48%] lg:w-auto shadow-inner min-w-[200px]">
                                        <div className="flex items-center gap-2 shrink overflow-hidden">
                                            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-4 h-4 shrink-0 text-emerald-500">
                                                <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75 11.25 15 15 9.75M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
                                            </svg>
                                            <span 
                                                className="truncate block cursor-pointer hover:text-indigo-600 hover:underline transition-all" 
                                                title={`Xem chi tiết ${file.name}`}
                                                onClick={() => openPreview(file)}
                                            >
                                                {file.name}
                                            </span>
                                        </div>
                                        <div className="flex items-center gap-1.5 shrink-0 ml-auto">
                                            <button 
                                                onClick={(e) => { e.stopPropagation(); removeCv(idx); }}
                                                className="flex items-center justify-center p-1.5 sm:px-2.5 sm:py-1.5 bg-white hover:bg-red-50 text-slate-400 hover:text-red-500 rounded-lg border border-slate-200/60 shadow-sm transition-colors focus:outline-none focus:ring-2 focus:ring-red-500/30 shrink-0"
                                                title="Xóa CV"
                                            >
                                                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-4 h-4">
                                                    <path strokeLinecap="round" strokeLinejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0" />
                                                </svg>
                                            </button>
                                        </div>
                                    </div>
                                ))}
                                {cvFiles.length < 5 && (
                                    <button 
                                        onClick={() => cvInputRef.current?.click()} 
                                        className="flex items-center justify-center p-2 bg-white hover:bg-slate-50 text-indigo-600 rounded-xl border border-dashed border-indigo-200/80 shadow-sm transition-colors focus:outline-none focus:ring-2 focus:ring-indigo-500/30 shrink-0"
                                        title="Tải thêm CV"
                                    >
                                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5">
                                            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
                                        </svg>
                                    </button>
                                )}
                            </>
                        )}
                        
                        {/* JD Status */}
                        <div className="flex items-center gap-2 px-3 py-2.5 bg-slate-50/80 text-slate-700 rounded-xl border border-slate-100/80 text-sm font-medium flex-1 justify-between w-full md:w-1/2 lg:w-auto shadow-inner min-w-0">
                            <div className="flex items-center gap-2 shrink overflow-hidden">
                                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className={`w-4 h-4 shrink-0 ${jdFile ? 'text-emerald-500' : 'text-slate-400'}`}>
                                    {jdFile ? (
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75 11.25 15 15 9.75M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
                                    ) : (
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 0 0-3.375-3.375h-1.5A1.125 1.125 0 0 1 13.5 7.125v-1.5a3.375 3.375 0 0 0-3.375-3.375H8.25m3 12h9m-9-3h9m-9-3h9m-9-3h9" />
                                    )}
                                </svg>
                                {jdFile ? (
                                    <span 
                                        className="truncate block cursor-pointer hover:text-indigo-600 hover:underline transition-all" 
                                        title={`Xem chi tiết ${jdFile.name}`}
                                        onClick={() => openPreview(jdFile)}
                                    >
                                        {jdFile.name}
                                    </span>
                                ) : (
                                    <span className="truncate">Chưa có JD</span>
                                )}
                            </div>
                            <div className="flex items-center gap-1.5 shrink-0 ml-auto">
                                <button 
                                    onClick={() => jdInputRef.current?.click()} 
                                    className="flex items-center justify-center p-1.5 sm:px-3 sm:py-1.5 bg-white hover:bg-slate-50 text-indigo-600 rounded-lg border border-slate-200/60 shadow-sm transition-colors focus:outline-none focus:ring-2 focus:ring-indigo-500/30 shrink-0"
                                    title={jdFile ? 'Thay đổi JD' : 'Tải JD'}
                                >
                                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-4 h-4 sm:w-3.5 sm:h-3.5">
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75V16.5m-13.5-9L12 3m0 0 4.5 4.5M12 3v13.5" />
                                    </svg>
                                    <span className="hidden sm:inline text-[11px] sm:text-xs font-bold uppercase tracking-wide shrink-0 ml-1.5">
                                        {jdFile ? 'Thay đổi' : 'Tải JD'}
                                    </span>
                                </button>
                                {jdFile && (
                                    <button 
                                        onClick={(e) => { e.stopPropagation(); setJdFile(null); }}
                                        className="flex items-center justify-center p-1.5 sm:px-2.5 sm:py-1.5 bg-white hover:bg-red-50 text-slate-400 hover:text-red-500 rounded-lg border border-slate-200/60 shadow-sm transition-colors focus:outline-none focus:ring-2 focus:ring-red-500/30 shrink-0"
                                        title="Xóa JD"
                                    >
                                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-4 h-4">
                                            <path strokeLinecap="round" strokeLinejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0" />
                                        </svg>
                                    </button>
                                )}
                            </div>
                        </div>
                    </div>
                    
                    {/* Right Box: Action */}
                    <div className="flex items-center gap-2 w-full lg:w-auto lg:ml-auto">
                        <button
                            onClick={handleProcess}
                            disabled={cvFiles.length === 0 || isProcessing}
                            className={`flex-1 lg:flex-none px-5 py-2.5 rounded-xl text-sm font-semibold transition-colors flex items-center justify-center gap-2 shadow-md ${cvFiles.length === 0 || isProcessing ? 'bg-slate-200 text-slate-400 cursor-not-allowed' : 'bg-slate-900 text-white hover:bg-slate-800'}`}
                        >
                           <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-4 h-4">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904 9 18.75l-.813-2.846a4.5 4.5 0 0 0-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 0 0 3.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 0 0 3.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 0 0-3.09 3.09ZM18.259 8.715 18 9.75l-.259-1.035a3.375 3.375 0 0 0-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 0 0 2.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 0 0 2.456 2.456L21.75 6l-1.035.259a3.375 3.375 0 0 0-2.456 2.456ZM16.894 20.567 16.5 21.75l-.394-1.183a2.25 2.25 0 0 0-1.423-1.423L13.5 18.75l1.183-.394a2.25 2.25 0 0 0 1.423-1.423l.394-1.183.394 1.183a2.25 2.25 0 0 0 1.423 1.423l1.183.394-1.183.394a2.25 2.25 0 0 0-1.423 1.423Z" />
                           </svg>
                            <span>{jdFile ? 'Phân tích & So sánh' : 'Phân tích CV'}</span>
                        </button>
                    </div>

                    <input 
                        type="file" 
                        ref={cvInputRef} 
                        className="hidden" 
                        accept="application/pdf,image/*" 
                        multiple
                        onChange={handleCvUpload}
                    />
                    <input 
                        type="file" 
                        ref={jdInputRef} 
                        className="hidden" 
                        accept="application/pdf,image/*,text/plain" 
                        onChange={handleJdUpload}
                    />
                </div>

                {/* Instructions Box */}
                {!isProcessing && (
                    <div className="flex items-start sm:items-center gap-3 bg-indigo-50/70 border border-indigo-100/70 p-3.5 rounded-2xl text-indigo-900 text-sm w-full relative">
                        <div className="bg-white text-indigo-500 p-2 rounded-full shrink-0 shadow-sm border border-indigo-100/50">
                            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-4 h-4">
                                <path strokeLinecap="round" strokeLinejoin="round" d="m11.25 11.25.041-.02a.75.75 0 0 1 1.063.852l-.708 2.836a.75.75 0 0 0 1.063.853l.041-.021M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Zm-9-3.75h.008v.008H12V8.25Z" />
                            </svg>
                        </div>
                        <div className="leading-relaxed">
                            <strong>Hướng dẫn:</strong> Tải lên <strong>CV</strong> để tóm tắt nhanh kinh nghiệm làm việc và ngoại ngữ. Bạn có thể tải thêm <strong>JD</strong> (Tùy chọn) để AI so sánh độ khớp (<strong>%</strong>) và nhận xét ưu/nhược điểm so với yêu cầu.
                        </div>
                    </div>
                )}
            </div>

            {error && (
                <div className="p-4 bg-red-50 text-red-600 rounded-xl text-sm border border-red-100">
                    {error}
                </div>
            )}

            {isProcessing && (
                <div className="py-20 flex flex-col items-center justify-center gap-6 bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden relative">
                    <div className="absolute inset-0 bg-gradient-to-r from-transparent via-indigo-50/30 to-transparent -translate-x-full animate-shimmer"></div>
                    <div className="relative">
                        <div className="w-16 h-16 border-4 border-indigo-100 border-t-indigo-600 rounded-full animate-spin"></div>
                        <div className="absolute inset-0 flex items-center justify-center">
                            <div className="w-6 h-6 bg-indigo-500 rounded-full animate-pulse"></div>
                        </div>
                    </div>
                    <div className="flex flex-col items-center gap-2">
                        <span className="font-bold text-base text-slate-700">Đang phân tích chuyên sâu dữ liệu...</span>
                        <span className="text-sm text-slate-500 animate-pulse">Vui lòng chờ trong giây lát</span>
                    </div>
                </div>
            )}

            {!isProcessing && cvFiles.length === 0 && !result && (
                <div className="border-2 border-dashed border-indigo-200 rounded-3xl p-10 sm:p-16 flex flex-col items-center justify-center text-center bg-indigo-50/30">
                    <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center shadow-sm text-indigo-400 mb-4 cursor-pointer hover:bg-indigo-50 transition-colors" onClick={() => cvInputRef.current?.click()}>
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-8 h-8">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 0 0-3.375-3.375h-1.5A1.125 1.125 0 0 1 13.5 7.125v-1.5a3.375 3.375 0 0 0-3.375-3.375H8.25m4.5 4.5v11.25m0 0-3-3m3 3 3-3M14.004 5.25A2.25 2.25 0 0 1 15.75 6Q16.275 6.643 17 7.75" />
                        </svg>
                    </div>
                    <h3 className="text-lg font-bold text-slate-700 mb-1">Bắt đầu phân tích</h3>
                    <p className="text-slate-500 text-sm max-w-sm">Tải lên ít nhất một file CV (PDF/Hình ảnh) để AI có thể giúp bạn tóm tắt nhanh.</p>
                </div>
            )}

            {result && !isProcessing && (
                <div className="bg-white border text-[15px] border-slate-200 shadow-sm rounded-2xl p-5 md:p-8 mt-2">
                    <div className="prose prose-slate max-w-none prose-p:leading-relaxed prose-headings:text-slate-800 prose-li:my-1">
                        <ReactMarkdown 
                            components={{
                                h1: ({node, ...props}) => <h1 className="text-lg sm:text-xl font-black text-indigo-700 uppercase tracking-tight border-b-2 border-indigo-100 pb-3 mb-5 mt-8 first:mt-0 flex items-center gap-2" {...props} />,
                                strong: ({node, ...props}) => {
                                    const isLabel = props.children && typeof props.children === 'string' && props.children.endsWith(':');
                                    return <strong className={`font-bold ${isLabel ? 'text-indigo-900' : 'text-slate-900'}`} {...props} />;
                                }
                            }}
                        >
                            {result}
                        </ReactMarkdown>
                    </div>
                </div>
            )}

            {previewFile && createPortal(
                <div 
                    className="fixed inset-0 z-[99999] flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-0 sm:p-4 md:p-8 transition-all duration-300"
                    onClick={closePreview}
                >
                    <div 
                        className="bg-white shadow-2xl w-full h-full sm:h-[90vh] sm:max-h-[900px] sm:max-w-5xl sm:rounded-[2rem] flex flex-col animate-spring-up overflow-hidden"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <div className="flex items-center justify-between p-3 sm:p-5 border-b border-slate-100 bg-slate-50/50 backdrop-blur-md">
                            <h3 className="font-bold text-slate-800 flex items-center gap-2 truncate pr-4 text-sm sm:text-base">
                                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5 text-indigo-600 shrink-0">
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 0 0-3.375-3.375h-1.5A1.125 1.125 0 0 1 13.5 7.125v-1.5a3.375 3.375 0 0 0-3.375-3.375H8.25m3 12h9m-9-3h9m-9-3h9m-9-3h9" />
                                </svg>
                                <span className="truncate">{previewFile.name}</span>
                            </h3>
                            <button 
                                onClick={closePreview}
                                className="p-1.5 sm:p-2 bg-white hover:bg-red-50 text-slate-400 hover:text-red-500 rounded-lg sm:rounded-xl transition-colors border border-slate-200 hover:border-red-200 shrink-0"
                            >
                                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-4 h-4 sm:w-5 sm:h-5">
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" />
                                </svg>
                            </button>
                        </div>
                        <div className="flex-1 bg-slate-100/50 relative w-full h-full overflow-hidden">
                            {previewFile.type === 'application/pdf' ? (
                                <PdfViewer file={previewFile.url} />
                            ) : previewFile.type.startsWith('image/') ? (
                                <div className="w-full h-full overflow-auto hide-scrollbar flex items-center justify-center p-4">
                                    <img 
                                        src={previewFile.url} 
                                        alt={previewFile.name} 
                                        className="max-w-full object-contain rounded-lg shadow-sm bg-white pattern-checkered"
                                        style={{ maxHeight: 'calc(100vh - 8rem)' }}
                                    />
                                </div>
                            ) : (
                                <iframe 
                                    src={previewFile.url}
                                    className="w-full h-full border-none bg-white p-4"
                                    title={previewFile.name}
                                />
                            )}
                        </div>
                    </div>
                </div>,
                document.body
            )}
        </div>
    );
};
