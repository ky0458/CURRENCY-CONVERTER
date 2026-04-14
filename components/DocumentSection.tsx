import React, { useState, useRef, useEffect } from 'react';
import * as docx from 'docx-preview';
import html2pdf from 'html2pdf.js';

type DocMode = 'upload' | 'contract' | 'receipt';

export const DocumentSection: React.FC = () => {
    const [mode, setMode] = useState<DocMode>('upload');
    const [fileName, setFileName] = useState<string>('Tai_lieu_moi');
    const [isEditing, setIsEditing] = useState<boolean>(false);
    
    const fileInputRef = useRef<HTMLInputElement>(null);
    const templateInputRef = useRef<HTMLInputElement>(null);
    const editorRef = useRef<HTMLDivElement>(null);
    const styleRef = useRef<HTMLDivElement>(null);
    const containerRef = useRef<HTMLDivElement>(null);

    const [hasContractTemplate, setHasContractTemplate] = useState(false);
    const [hasReceiptTemplate, setHasReceiptTemplate] = useState(false);

    useEffect(() => {
        setHasContractTemplate(!!localStorage.getItem('template_contract'));
        setHasReceiptTemplate(!!localStorage.getItem('template_receipt'));
    }, []);

    const renderDocx = (arrayBuffer: ArrayBuffer) => {
        if (editorRef.current && styleRef.current) {
            editorRef.current.innerHTML = '';
            styleRef.current.innerHTML = '';
            docx.renderAsync(arrayBuffer, editorRef.current, styleRef.current, {
                className: "docx",
                inWrapper: true,
                ignoreWidth: false,
                ignoreHeight: false,
                ignoreFonts: false,
                breakPages: true,
                ignoreLastRenderedPageBreak: false,
                experimental: true,
                trimXmlDeclaration: true,
                debug: false,
            }).then(() => {
                console.log("docx rendered");
            }).catch(err => {
                console.error("Error rendering docx:", err);
                alert("Có lỗi xảy ra khi đọc file Word.");
            });
        }
    };

    const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        setMode('upload');
        setFileName(file.name.replace(/\.[^/.]+$/, ""));
        setIsEditing(true);

        if (file.name.endsWith('.docx')) {
            const reader = new FileReader();
            reader.onload = (event) => {
                const arrayBuffer = event.target?.result as ArrayBuffer;
                setTimeout(() => renderDocx(arrayBuffer), 100);
            };
            reader.readAsArrayBuffer(file);
        } else {
            alert("Vui lòng chọn file .docx");
        }
        
        if (fileInputRef.current) {
            fileInputRef.current.value = '';
        }
    };

    const handleTemplateUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        if (file.name.endsWith('.docx')) {
            const reader = new FileReader();
            reader.onload = (event) => {
                const base64String = (event.target?.result as string).split(',')[1];
                localStorage.setItem(`template_${mode}`, base64String);
                
                if (mode === 'contract') setHasContractTemplate(true);
                if (mode === 'receipt') setHasReceiptTemplate(true);

                const binaryString = window.atob(base64String);
                const len = binaryString.length;
                const bytes = new Uint8Array(len);
                for (let i = 0; i < len; i++) {
                    bytes[i] = binaryString.charCodeAt(i);
                }
                setTimeout(() => renderDocx(bytes.buffer), 100);
            };
            reader.readAsDataURL(file);
        } else {
            alert("Vui lòng chọn file .docx");
        }
        
        if (templateInputRef.current) {
            templateInputRef.current.value = '';
        }
    };

    const loadTemplate = (templateMode: 'contract' | 'receipt') => {
        setMode(templateMode);
        setFileName(templateMode === 'contract' ? 'Hop_dong_mau' : 'Phieu_thu_mau');
        setIsEditing(true);

        const base64String = localStorage.getItem(`template_${templateMode}`);
        if (base64String) {
            const binaryString = window.atob(base64String);
            const len = binaryString.length;
            const bytes = new Uint8Array(len);
            for (let i = 0; i < len; i++) {
                bytes[i] = binaryString.charCodeAt(i);
            }
            setTimeout(() => renderDocx(bytes.buffer), 100);
        } else {
            if (editorRef.current) editorRef.current.innerHTML = '';
            if (styleRef.current) styleRef.current.innerHTML = '';
        }
    };

    const handleExportPDF = () => {
        if (!containerRef.current) return;
        
        const wrapper = containerRef.current.querySelector('.docx-wrapper') as HTMLElement;
        const originalBg = wrapper ? wrapper.style.background : '';
        const originalPadding = wrapper ? wrapper.style.padding : '';
        
        if (wrapper) {
            wrapper.style.background = 'white';
            wrapper.style.padding = '0';
        }

        const opt = {
            margin:       0,
            filename:     `${fileName}.pdf`,
            image:        { type: 'jpeg' as const, quality: 0.98 },
            html2canvas:  { scale: 2, useCORS: true, logging: false },
            jsPDF:        { unit: 'pt', format: 'a4', orientation: 'portrait' as const },
            pagebreak:    { mode: ['css', 'legacy'], elements: '.docx-page' }
        };

        html2pdf().set(opt).from(containerRef.current).save().then(() => {
            if (wrapper) {
                wrapper.style.background = originalBg;
                wrapper.style.padding = originalPadding;
            }
        });
    };

    const handleExportWord = () => {
        if (!editorRef.current || !styleRef.current) return;
        try {
            const clone = editorRef.current.cloneNode(true) as HTMLElement;
            const pages = clone.querySelectorAll('.docx-page');
            
            let pageCSS = '';
            if (pages.length > 0) {
                const firstPage = pages[0] as HTMLElement;
                const width = firstPage.style.width || '595.3pt';
                const minHeight = firstPage.style.minHeight || '841.9pt';
                const paddingTop = firstPage.style.paddingTop || '72.0pt';
                const paddingRight = firstPage.style.paddingRight || '72.0pt';
                const paddingBottom = firstPage.style.paddingBottom || '72.0pt';
                const paddingLeft = firstPage.style.paddingLeft || '72.0pt';
                
                pageCSS = `
                    @page WordSection1 {
                        size: ${width} ${minHeight};
                        margin: ${paddingTop} ${paddingRight} ${paddingBottom} ${paddingLeft};
                        mso-header-margin: 35.4pt;
                        mso-footer-margin: 35.4pt;
                        mso-paper-source: 0;
                    }
                    div.WordSection1 { page: WordSection1; }
                `;
                
                pages.forEach((page, index) => {
                    const p = page as HTMLElement;
                    p.style.padding = '0';
                    p.style.margin = '0';
                    p.style.width = '100%';
                    p.style.minHeight = 'auto';
                    p.style.boxShadow = 'none';
                    
                    if (index > 0) {
                        p.style.pageBreakBefore = 'always';
                        p.insertAdjacentHTML('afterbegin', '<br clear="all" style="page-break-before:always; mso-break-type:page-break" />');
                    }
                });
            }

            const docxElement = clone.querySelector('.docx') || clone;
            const contentHTML = docxElement.innerHTML;

            const header = `
                <html xmlns:o='urn:schemas-microsoft-com:office:office' 
                      xmlns:w='urn:schemas-microsoft-com:office:word' 
                      xmlns='http://www.w3.org/TR/REC-html40'>
                <head>
                    <meta charset='utf-8'>
                    <title>Export HTML to Word</title>
                    ${styleRef.current.innerHTML}
                    <style>
                        ${pageCSS}
                        .docx-wrapper { background: transparent !important; padding: 0 !important; }
                        .docx { box-shadow: none !important; margin: 0 !important; padding: 0 !important; }
                        p { margin: 0; }
                    </style>
                </head>
                <body>
                    <div class="WordSection1">
                        <div class='docx'>
                            ${contentHTML}
                        </div>
                    </div>
                </body>
                </html>
            `;
            
            const source = 'data:application/vnd.ms-word;charset=utf-8,' + encodeURIComponent(header);
            const fileDownload = document.createElement("a");
            document.body.appendChild(fileDownload);
            fileDownload.href = source;
            fileDownload.download = `${fileName}.doc`;
            fileDownload.click();
            document.body.removeChild(fileDownload);
        } catch (error) {
            console.error("Error exporting to Word:", error);
            alert("Có lỗi xảy ra khi xuất file Word.");
        }
    };

    const execCommand = (command: string, value: string | undefined = undefined) => {
        document.execCommand(command, false, value);
        if (editorRef.current) {
            editorRef.current.focus();
        }
    };

    return (
        <div className="bg-white/80 backdrop-blur-xl rounded-3xl p-6 sm:p-8 shadow-xl border border-white/50 animate-fade-in">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
                <div>
                    <h2 className="text-xl font-bold text-slate-800">Trình Chỉnh Sửa Tài Liệu</h2>
                    <p className="text-sm text-slate-500 mt-1">Tải lên file Word hoặc tạo từ mẫu có sẵn.</p>
                </div>
                
                <div className="flex flex-wrap gap-2">
                    <button
                        onClick={() => loadTemplate('contract')}
                        className="px-4 py-2 bg-blue-50 text-blue-600 rounded-xl font-medium hover:bg-blue-100 transition-colors flex items-center gap-2"
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 0 0-3.375-3.375h-1.5A1.125 1.125 0 0 1 13.5 7.125v-1.5a3.375 3.375 0 0 0-3.375-3.375H8.25m2.25 0H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 0 0-9-9Z" />
                        </svg>
                        Hợp đồng
                    </button>
                    <button
                        onClick={() => loadTemplate('receipt')}
                        className="px-4 py-2 bg-amber-50 text-amber-600 rounded-xl font-medium hover:bg-amber-100 transition-colors flex items-center gap-2"
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 18.75a60.07 60.07 0 0 1 15.797 2.101c.727.198 1.453-.342 1.453-1.096V18.75M3.75 4.5v.75A.75.75 0 0 1 3 6h-.75m0 0v-.375c0-.621.504-1.125 1.125-1.125H20.25M2.25 6v9m18-10.5v.75c0 .414.336.75.75.75h.75m-1.5-1.5h.375c.621 0 1.125.504 1.125 1.125v9.75c0 .621-.504 1.125-1.125 1.125h-.375m1.5-1.5H21a.75.75 0 0 0-.75.75v.75m0 0H3.75m0 0h-.375a1.125 1.125 0 0 1-1.125-1.125V15m1.5 1.5v-.75A.75.75 0 0 0 3 15h-.75M15 10.5a3 3 0 1 1-6 0 3 3 0 0 1 6 0Zm3 0h.008v.008H18V10.5Zm-12 0h.008v.008H6V10.5Z" />
                        </svg>
                        Phiếu thu
                    </button>
                    <button
                        onClick={() => fileInputRef.current?.click()}
                        className="px-4 py-2 bg-indigo-50 text-indigo-600 rounded-xl font-medium hover:bg-indigo-100 transition-colors flex items-center gap-2"
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75V16.5m-13.5-9L12 3m0 0 4.5 4.5M12 3v13.5" />
                        </svg>
                        Tải lên
                    </button>
                    <input 
                        type="file" 
                        ref={fileInputRef} 
                        onChange={handleFileUpload} 
                        accept=".docx" 
                        className="hidden" 
                    />

                    {isEditing && (
                        <>
                            <button
                                onClick={handleExportPDF}
                                className="px-4 py-2 bg-rose-50 text-rose-600 rounded-xl font-medium hover:bg-rose-100 transition-colors flex items-center gap-2"
                            >
                                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5">
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 0 0-3.375-3.375h-1.5A1.125 1.125 0 0 1 13.5 7.125v-1.5a3.375 3.375 0 0 0-3.375-3.375H8.25m2.25 0H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 0 0-9-9Z" />
                                </svg>
                                Xuất PDF
                            </button>
                            <button
                                onClick={handleExportWord}
                                className="px-4 py-2 bg-emerald-50 text-emerald-600 rounded-xl font-medium hover:bg-emerald-100 transition-colors flex items-center gap-2"
                            >
                                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5">
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 0 0-3.375-3.375h-1.5A1.125 1.125 0 0 1 13.5 7.125v-1.5a3.375 3.375 0 0 0-3.375-3.375H8.25m2.25 0H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 0 0-9-9Z" />
                                </svg>
                                Xuất Word
                            </button>
                        </>
                    )}
                </div>
            </div>

            {isEditing ? (
                <div className="border border-slate-200 rounded-xl overflow-hidden bg-white flex flex-col">
                    <div className="p-3 border-b border-slate-200 bg-slate-50 flex flex-wrap items-center justify-between gap-4">
                        <div className="flex flex-wrap items-center gap-4">
                            <div className="flex items-center gap-2">
                                <span className="text-sm font-medium text-slate-600">Tên file:</span>
                                <input 
                                    type="text" 
                                    value={fileName}
                                    onChange={(e) => setFileName(e.target.value)}
                                    className="bg-white border border-slate-200 rounded px-2 py-1 text-sm outline-none focus:border-indigo-400"
                                />
                            </div>
                            <div className="h-6 w-px bg-slate-300 mx-2"></div>
                            <div className="flex items-center gap-1">
                                <button onClick={() => execCommand('bold')} className="p-1.5 hover:bg-slate-200 rounded text-slate-700 font-bold" title="In đậm">B</button>
                                <button onClick={() => execCommand('italic')} className="p-1.5 hover:bg-slate-200 rounded text-slate-700 italic" title="In nghiêng">I</button>
                                <button onClick={() => execCommand('underline')} className="p-1.5 hover:bg-slate-200 rounded text-slate-700 underline" title="Gạch chân">U</button>
                                <div className="h-4 w-px bg-slate-300 mx-1"></div>
                                <button onClick={() => execCommand('justifyLeft')} className="p-1.5 hover:bg-slate-200 rounded text-slate-700" title="Căn trái">
                                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-4 h-4"><path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25H12" /></svg>
                                </button>
                                <button onClick={() => execCommand('justifyCenter')} className="p-1.5 hover:bg-slate-200 rounded text-slate-700" title="Căn giữa">
                                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-4 h-4"><path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6.75h16.5M3.75 12h16.5M3.75 17.25h16.5" /></svg>
                                </button>
                                <button onClick={() => execCommand('justifyRight')} className="p-1.5 hover:bg-slate-200 rounded text-slate-700" title="Căn phải">
                                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-4 h-4"><path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6.75h16.5M3.75 12h16.5M12 17.25h8.25" /></svg>
                                </button>
                                <div className="h-4 w-px bg-slate-300 mx-1"></div>
                                <input 
                                    type="color" 
                                    onChange={(e) => execCommand('foreColor', e.target.value)}
                                    className="w-6 h-6 p-0 border-0 rounded cursor-pointer"
                                    title="Màu chữ"
                                />
                                <div className="h-4 w-px bg-slate-300 mx-1"></div>
                                <select 
                                    onChange={(e) => execCommand('fontName', e.target.value)}
                                    className="bg-white border border-slate-200 rounded px-2 py-1 text-sm outline-none focus:border-indigo-400 cursor-pointer"
                                    title="Font chữ"
                                    defaultValue=""
                                >
                                    <option value="" disabled>Chọn Font</option>
                                    <option value="Arial">Arial</option>
                                    <option value="Times New Roman">Times New Roman</option>
                                    <option value="Courier New">Courier New</option>
                                    <option value="Verdana">Verdana</option>
                                    <option value="Georgia">Georgia</option>
                                    <option value="Tahoma">Tahoma</option>
                                    <option value="Trebuchet MS">Trebuchet MS</option>
                                </select>
                            </div>
                        </div>
                        
                        {(mode === 'contract' || mode === 'receipt') && (
                            <div className="flex items-center gap-2">
                                <button 
                                    onClick={() => templateInputRef.current?.click()}
                                    className="text-sm px-3 py-1.5 bg-indigo-100 text-indigo-700 font-medium rounded-lg hover:bg-indigo-200 transition-colors flex items-center gap-1"
                                >
                                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-4 h-4">
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75V16.5m-13.5-9L12 3m0 0 4.5 4.5M12 3v13.5" />
                                    </svg>
                                    Tải lên mẫu mới
                                </button>
                                <input 
                                    type="file" 
                                    ref={templateInputRef} 
                                    onChange={handleTemplateUpload} 
                                    accept=".docx" 
                                    className="hidden" 
                                />
                            </div>
                        )}
                    </div>
                    
                    <div className="bg-gray-100 overflow-y-auto w-full" style={{ height: '85vh' }}>
                        <div ref={containerRef} style={{ minHeight: '100%', position: 'relative' }}>
                            <div ref={styleRef}></div>
                            
                            <div 
                                ref={editorRef}
                                contentEditable={true}
                                suppressContentEditableWarning={true}
                                className="mx-auto outline-none"
                                style={{ minHeight: '100%' }}
                            />
                            
                            {mode !== 'upload' && !localStorage.getItem(`template_${mode}`) && (
                                <div className="absolute inset-0 flex flex-col items-center justify-center text-slate-400 py-20 bg-gray-100 z-10">
                                    <p className="mb-4">Chưa có mẫu nào được lưu.</p>
                                    <button 
                                        onClick={() => templateInputRef.current?.click()}
                                        className="px-4 py-2 bg-indigo-50 text-indigo-600 rounded-xl font-medium hover:bg-indigo-100 transition-colors"
                                    >
                                        Tải lên mẫu .docx
                                    </button>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            ) : (
                <div 
                    className="border-2 border-dashed border-slate-300 rounded-2xl p-12 flex flex-col items-center justify-center text-center bg-slate-50/50 hover:bg-slate-50 transition-colors cursor-pointer"
                    onClick={() => fileInputRef.current?.click()}
                >
                    <div className="w-16 h-16 bg-indigo-100 text-indigo-500 rounded-full flex items-center justify-center mb-4">
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-8 h-8">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 0 0-3.375-3.375h-1.5A1.125 1.125 0 0 1 13.5 7.125v-1.5a3.375 3.375 0 0 0-3.375-3.375H8.25m6.75 12-3-3m0 0-3 3m3-3v6m-1.5-15H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 0 0-9-9Z" />
                        </svg>
                    </div>
                    <h3 className="text-lg font-semibold text-slate-800 mb-1">Tải lên tài liệu của bạn</h3>
                    <p className="text-slate-500 text-sm max-w-sm mb-4">
                        Hỗ trợ định dạng .docx. Bạn có thể chỉnh sửa nội dung, căn lề, đổi màu chữ và xuất ra PDF hoặc Word.
                    </p>
                    <div className="flex gap-3 mt-2" onClick={e => e.stopPropagation()}>
                        <button
                            onClick={() => loadTemplate('contract')}
                            className="px-4 py-2 bg-blue-50 text-blue-600 rounded-xl font-medium hover:bg-blue-100 transition-colors text-sm"
                        >
                            Hợp đồng
                        </button>
                        <button
                            onClick={() => loadTemplate('receipt')}
                            className="px-4 py-2 bg-amber-50 text-amber-600 rounded-xl font-medium hover:bg-amber-100 transition-colors text-sm"
                        >
                            Phiếu thu
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
};
