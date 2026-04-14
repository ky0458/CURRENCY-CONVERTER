import React, { useState, useRef } from 'react';
import mammoth from 'mammoth';
import html2pdf from 'html2pdf.js';
import Editor from 'react-simple-wysiwyg';

export const DocumentSection: React.FC = () => {
    const [htmlContent, setHtmlContent] = useState<string>('');
    const [fileName, setFileName] = useState<string>('Tai_lieu_moi');
    const [isEditing, setIsEditing] = useState<boolean>(false);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        setFileName(file.name.replace(/\.[^/.]+$/, "")); // Remove extension

        if (file.name.endsWith('.docx')) {
            const reader = new FileReader();
            reader.onload = async (event) => {
                const arrayBuffer = event.target?.result as ArrayBuffer;
                try {
                    const result = await mammoth.convertToHtml({ arrayBuffer });
                    setHtmlContent(result.value);
                    setIsEditing(true);
                } catch (error) {
                    console.error("Error converting docx:", error);
                    alert("Có lỗi xảy ra khi đọc file Word.");
                }
            };
            reader.readAsArrayBuffer(file);
        } else {
            alert("Vui lòng chọn file .docx");
        }
        
        if (fileInputRef.current) {
            fileInputRef.current.value = '';
        }
    };

    const handleExportPDF = () => {
        const element = document.createElement('div');
        element.innerHTML = htmlContent;
        // Add some basic styling for PDF export
        element.style.padding = '20px';
        element.style.fontFamily = 'Times New Roman, serif';
        element.style.fontSize = '12pt';
        element.style.lineHeight = '1.5';

        const opt = {
            margin:       10,
            filename:     `${fileName}.pdf`,
            image:        { type: 'jpeg', quality: 0.98 },
            html2canvas:  { scale: 2 },
            jsPDF:        { unit: 'mm', format: 'a4', orientation: 'portrait' }
        };

        html2pdf().set(opt).from(element).save();
    };

    const handleExportWord = () => {
        try {
            const header = "<html xmlns:o='urn:schemas-microsoft-com:office:office' xmlns:w='urn:schemas-microsoft-com:office:word' xmlns='http://www.w3.org/TR/REC-html40'><head><meta charset='utf-8'><title>Export HTML to Word</title></head><body>";
            const footer = "</body></html>";
            const sourceHTML = header + htmlContent + footer;
            
            const source = 'data:application/vnd.ms-word;charset=utf-8,' + encodeURIComponent(sourceHTML);
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

    return (
        <div className="bg-white/80 backdrop-blur-xl rounded-3xl p-6 sm:p-8 shadow-xl border border-white/50 animate-fade-in">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
                <div>
                    <h2 className="text-xl font-bold text-slate-800">Trình Chỉnh Sửa Tài Liệu</h2>
                    <p className="text-sm text-slate-500 mt-1">Tải lên file Word (.docx) để chỉnh sửa và xuất ra PDF/Word.</p>
                </div>
                
                <div className="flex flex-wrap gap-2">
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
                <div className="border border-slate-200 rounded-xl overflow-hidden bg-white">
                    <div className="p-3 border-b border-slate-200 bg-slate-50 flex items-center gap-2">
                        <span className="text-sm font-medium text-slate-600">Tên file:</span>
                        <input 
                            type="text" 
                            value={fileName}
                            onChange={(e) => setFileName(e.target.value)}
                            className="bg-white border border-slate-200 rounded px-2 py-1 text-sm outline-none focus:border-indigo-400"
                        />
                    </div>
                    <div className="min-h-[500px]">
                        <Editor 
                            value={htmlContent} 
                            onChange={(e) => setHtmlContent(e.target.value)} 
                            containerProps={{ style: { height: '500px', overflowY: 'auto' } }}
                        />
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
                    <p className="text-slate-500 text-sm max-w-sm">
                        Hỗ trợ định dạng .docx. Bạn có thể chỉnh sửa nội dung, căn lề, đổi màu chữ và xuất ra PDF hoặc Word.
                    </p>
                </div>
            )}
        </div>
    );
};
