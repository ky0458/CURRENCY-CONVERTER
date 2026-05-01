import React, { useState, useRef, useEffect } from 'react';
import * as docx from 'docx-preview';
import html2pdf from 'html2pdf.js';
import { PdfRedactor } from './PdfRedactor';
import { CvReader } from './CvReader';

type DocMode = 'redact_cv' | 'read_cv';

export const DocumentSection: React.FC = () => {
    const [mode, setMode] = useState<DocMode>('redact_cv');
    
    return (
        <div className="bg-white/80 backdrop-blur-xl rounded-3xl p-6 sm:p-8 shadow-xl border border-white/50 animate-fade-in relative">
            <div className="flex flex-col gap-4 mb-6">
                <div>
                    <h2 className="text-xl font-bold text-slate-800">Che CV - Phân tích CV & So sánh độ phù hợp với JD</h2>
                </div>
                
                <div className="grid grid-cols-2 sm:flex sm:flex-row flex-wrap w-full sm:w-fit bg-slate-100/80 p-1.5 rounded-2xl gap-1">
                    <button
                        onClick={() => setMode('redact_cv')}
                        className={`px-2 py-2 sm:px-4 sm:py-2.5 rounded-xl font-semibold text-xs sm:text-sm transition-all duration-200 flex flex-col sm:flex-row items-center justify-center gap-1 sm:gap-2 ${mode === 'redact_cv' ? 'bg-white text-purple-600 shadow-sm ring-1 ring-slate-200/50 scale-[1.02]' : 'text-slate-500 hover:text-slate-700 hover:bg-slate-200/50'}`}
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-5 h-5 sm:w-4 sm:h-4">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h3.75M9 15h3.75M9 18h3.75m3 .75H18a2.25 2.25 0 0 0 2.25-2.25V6.108c0-1.135-.845-2.098-1.976-2.192a48.424 48.424 0 0 0-1.123-.08m-5.801 0c-.065.21-.1.433-.1.664 0 .414.336.75.75.75h4.5a.75.75 0 0 0 .75-.75 2.25 2.25 0 0 0-.1-.664m-5.8 0A2.251 2.251 0 0 1 13.5 2.25H15c1.012 0 1.867.668 2.15 1.586m-5.8 0c-.376.023-.75.05-1.124.08C9.095 4.01 8.25 4.973 8.25 6.108V8.25m0 0H4.875c-.621 0-1.125.504-1.125 1.125v11.25c0 .621.504 1.125 1.125 1.125h9.75c.621 0 1.125-.504 1.125-1.125V8.25ZM6.75 8.25h.75m-.75 3h.75m-.75 3h.75m-.75 3h.75" />
                        </svg>
                        <span>Che CV</span>
                    </button>

                    <button
                        onClick={() => setMode('read_cv')}
                        className={`px-2 py-2 sm:px-4 sm:py-2.5 rounded-xl font-semibold text-xs sm:text-sm transition-all duration-200 flex flex-col sm:flex-row items-center justify-center gap-1 sm:gap-2 ${mode === 'read_cv' ? 'bg-white text-emerald-600 shadow-sm ring-1 ring-slate-200/50 scale-[1.02]' : 'text-slate-500 hover:text-slate-700 hover:bg-slate-200/50'}`}
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-5 h-5 sm:w-4 sm:h-4">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M12 21v-8.25M15.75 21v-8.25M8.25 21v-8.25M3 9l9-6 9 6m-1.5 12V10.332A48.36 48.36 0 0 0 12 9.75c-2.551 0-5.056.2-7.5.582V21M3 21h18M12 6.75h.008v.008H12V6.75Z" />
                        </svg>
                        <span>Đọc CV</span>
                    </button>
                </div>
            </div>

            {mode === 'redact_cv' ? (
                <PdfRedactor />
            ) : (
                <CvReader />
            )}
        </div>
    );
};
