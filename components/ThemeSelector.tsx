
import React, { useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { ThemeColor, AppStyles, HeaderStyle, ButtonStyle, UserBubbleStyle, AIBubbleStyle } from '../types';
import { THEME_COLORS } from '../constants';

interface ThemeSelectorProps {
  currentTheme: ThemeColor;
  onThemeChange: (theme: ThemeColor) => void;
  onBackgroundUpload?: (file: File) => void;
  onRemoveBackground?: () => void;
  currentBackground?: string | null;
  appStyles: AppStyles;
  onStyleChange: (updates: Partial<AppStyles>) => void;
}

export const ThemeSelector: React.FC<ThemeSelectorProps> = ({ 
  currentTheme, 
  onThemeChange, 
  onBackgroundUpload,
  onRemoveBackground,
  currentBackground,
  appStyles,
  onStyleChange
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<'header' | 'button' | 'userBubble' | 'aiBubble'>('header');
  const containerRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const renderBubblePreview = (style: string, isUser: boolean) => {
    const content = <div className="text-[9px] font-medium">{isUser ? 'Oh!' : 'Chào bạn!'}</div>;
    if (style === 'default') {
        return (
            <div className={`px-2 py-1 ${isUser ? 'bg-primary-500 text-white rounded-xl rounded-tr-sm' : 'bg-white border border-slate-200 text-slate-800 rounded-xl rounded-tl-sm'} shadow-sm`}>
                {content}
            </div>
        );
    }
    if (style === 'frog') return (
                                                    <div className="relative mt-1">
                                                        <div className="absolute -top-4 left-2 w-6 h-4 bg-[#86efac] border-[2px] border-[#4ade80] rounded-full flex justify-center items-center z-10"><div className="w-5 h-5 bg-white rounded-full flex justify-center items-center"><div className="w-2.5 h-2.5 bg-slate-900 rounded-full translate-x-[1px]"><div className="w-1 h-1 bg-white rounded-full mt-[1px] ml-[1px]"></div></div></div></div>
                                                        <div className="absolute -top-4 right-2 w-6 h-4 bg-[#86efac] border-[2px] border-[#4ade80] rounded-full flex justify-center items-center z-10"><div className="w-5 h-5 bg-white rounded-full flex justify-center items-center"><div className="w-2.5 h-2.5 bg-slate-900 rounded-full -translate-x-[1px]"><div className="w-1 h-1 bg-white rounded-full mt-[1px] ml-[1px]"></div></div></div></div>
                                                        <div className="bg-[#86efac] text-[#064e3b] font-medium border-b-[4px] border-[#4ade80] px-2 py-1 rounded-xl shadow-sm relative overflow-hidden">
                                                            <div className="absolute -bottom-4 left-1/2 -translate-x-1/2 w-3/4 h-4 bg-[#bbf7d0] rounded-t-[100%] pointer-events-none"></div>
                                                            <div className="absolute top-[30%] left-[5%] w-5 h-2.5 bg-pink-400/50 rounded-full blur-[1px]"></div>
                                                            <div className="absolute top-[30%] right-[5%] w-5 h-2.5 bg-pink-400/50 rounded-full blur-[1px]"></div>
                                                            <div className="relative z-10">{content}</div>
                                                        </div>
                                                    </div>
                                                );
    if (style === 'cat') return (
                                                    <div className="relative mt-1">
                                                        <div className="absolute -top-4 left-2 w-0 h-0 border-l-[12px] border-r-[12px] border-b-[16px] border-transparent border-b-[#fcd34d] rotate-[-25deg] z-10"><div className="absolute -left-[4px] top-[4px] w-0 h-0 border-l-[4px] border-r-[4px] border-b-[6px] border-transparent border-b-pink-300"></div></div>
                                                        <div className="absolute -top-4 right-2 w-0 h-0 border-l-[12px] border-r-[12px] border-b-[16px] border-transparent border-b-[#fcd34d] rotate-[25deg] z-10"><div className="absolute -left-[4px] top-[4px] w-0 h-0 border-l-[4px] border-r-[4px] border-b-[6px] border-transparent border-b-pink-300"></div></div>
                                                        <div className="bg-[#fcd34d] text-slate-800 font-medium border-b-[4px] border-amber-500 px-2 py-1 rounded-xl shadow-sm relative overflow-hidden">
                                                            <div className="absolute top-[20%] left-[5%] w-6 h-3 bg-pink-400/40 rounded-full blur-[1px]"></div>
                                                            <div className="absolute top-[20%] right-[5%] w-6 h-3 bg-pink-400/40 rounded-full blur-[1px]"></div>
                                                            <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 w-4 h-3 bg-pink-300 rounded-t-full border-[1.5px] border-amber-600 border-b-0"></div>
                                                            <div className="relative z-10">{content}</div>
                                                        </div>
                                                    </div>
                                                );
    if (style === 'dog') return (
                                                    <div className="relative mt-1">
                                                        <div className="absolute -top-3 -left-2 w-5 h-4 bg-[#d97706] rounded-full rotate-[-45deg]"></div>
                                                        <div className="absolute -top-3 -right-2 w-5 h-4 bg-[#d97706] rounded-full rotate-[45deg]"></div>
                                                        <div className={`px-2 py-1 rounded-xl text-[9px] shadow-sm bg-[#fbbf24] text-amber-900 border-b-4 border-amber-700`}>{content}</div>
                                                    </div>
                                                );
    if (style === 'penguin') return (
                                                    <div className="relative mt-1">
                                                        <div className="absolute -top-3 left-1/2 -translate-x-1/2 w-0 h-0 border-l-[8px] border-r-[8px] border-t-[12px] border-transparent border-t-orange-500 z-20 hover:scale-110 transition-transform origin-top"></div>
                                                        <div className="bg-slate-800 text-white font-medium border-[3px] border-slate-900 border-b-[5px] px-2 py-1 rounded-xl shadow-sm relative overflow-hidden z-10">
                                                            <div className="absolute inset-x-4 top-0 bottom-0 bg-white rounded-t-[100%] opacity-15 pointer-events-none"></div>
                                                            <div className="absolute top-[30%] left-[8%] w-5 h-2.5 bg-pink-400/40 rounded-full blur-[1px]"></div>
                                                            <div className="absolute top-[30%] right-[8%] w-5 h-2.5 bg-pink-400/40 rounded-full blur-[1px]"></div>
                                                            <div className="relative z-10">{content}</div>
                                                        </div>
                                                    </div>
                                                );
    if (style === 'bear') return (
                                                    <div className="relative mt-1">
                                                        <div className="absolute -top-3 left-2 w-7 h-7 bg-amber-700 rounded-full border-[2px] border-amber-900 z-0"><div className="absolute inset-1 bg-amber-900/40 rounded-full pointer-events-none"></div></div>
                                                        <div className="absolute -top-3 right-2 w-7 h-7 bg-amber-700 rounded-full border-[2px] border-amber-900 z-0"><div className="absolute inset-1 bg-amber-900/40 rounded-full pointer-events-none"></div></div>
                                                        <div className="bg-amber-100 text-amber-900 font-medium border-b-[4px] border-[2px] border-amber-700 px-2 py-1 rounded-xl shadow-sm relative overflow-hidden z-10">
                                                            <div className="absolute top-[30%] left-[8%] w-5 h-2.5 bg-pink-400/30 rounded-full blur-[1px]"></div>
                                                            <div className="absolute top-[30%] right-[8%] w-5 h-2.5 bg-pink-400/30 rounded-full blur-[1px]"></div>
                                                            <div className="relative z-10">{content}</div>
                                                        </div>
                                                    </div>
                                                );
    if (style === 'rabbit') return (
                                                    <div className="relative mt-1">
                                                        <div className="absolute -top-7 left-5 w-4 h-10 bg-pink-100 border-2 border-slate-200 rounded-t-full rotate-[-15deg]"></div>
                                                        <div className="absolute -top-7 right-5 w-4 h-10 bg-pink-100 border-2 border-slate-200 rounded-t-full rotate-[15deg]"></div>
                                                        <div className={`px-2 py-1 rounded-xl text-[9px] shadow-sm bg-white text-slate-700 border-2 border-slate-200 border-b-4 border-b-slate-300`}>{content}</div>
                                                    </div>
                                                );
    if (style === 'koala') return (
                                                    <div className="relative mt-1">
                                                        <div className="absolute -top-2 -left-3 w-6 h-4 bg-slate-400 rounded-full"></div>
                                                        <div className="absolute -top-2 -right-3 w-6 h-4 bg-slate-400 rounded-full"></div>
                                                        <div className={`px-2 py-1 rounded-xl text-[9px] shadow-sm bg-slate-300 text-slate-800 border-b-4 border-slate-500 z-10 relative`}>{content}</div>
                                                    </div>
                                                );
    if (style === 'duck') return (
                                                    <div className="relative">
                                                        <div className="absolute top-1/2 -left-2 transform -translate-y-1/2 w-6 h-4 bg-orange-400 rounded-l-full"></div>
                                                        <div className={`px-2 py-1 rounded-xl text-[9px] shadow-sm bg-[#fef08a] text-yellow-900 border-b-4 border-yellow-500`}>{content}</div>
                                                    </div>
                                                );
    if (style === 'capybara') return (
                                                    <div className="relative mt-1">
                                                        <div className="absolute -top-4 left-2 w-6 h-4 bg-[#C69C6D] rounded-t-full flex items-center justify-center">
                                                            <div className="absolute top-1 left-2 w-1.5 h-1.5 bg-slate-800 rounded-full"></div>
                                                            <div className="absolute top-1 right-2 w-1.5 h-1.5 bg-slate-800 rounded-full"></div>
                                                            <div className="absolute -top-1 left-0 w-2.5 h-2.5 bg-[#a37e54] rounded-full"></div>
                                                            <div className="absolute -top-1 right-0 w-2.5 h-2.5 bg-[#a37e54] rounded-full"></div>
                                                            <div className="absolute top-2 w-2 h-1 bg-pink-300 rounded-full"></div>
                                                        </div>
                                                        <div className={`px-2 py-1 rounded-xl text-[9px] shadow-sm bg-[#FFD6E4] text-slate-800 border-2 border-pink-200 relative`}>
                                                            <span className="absolute -left-1.5 top-2 text-xl rotate-12">💖</span>
                                                            <span className="absolute -right-2 bottom-1 text-xl -rotate-12">✨</span>
                                                            {content}
                                                        </div>
                                                    </div>
                                                );
    if (style === 'robot') return (
                                                    <div className="relative mt-1">
                                                        <div className="absolute -top-2 left-6 w-4 h-4 bg-slate-300 rounded-md border border-slate-400 flex items-center justify-center"><div className="w-1.5 h-1.5 bg-red-500 rounded-full animate-pulse"></div></div>
                                                        <div className={`px-2 py-1 rounded-xl text-[9px] shadow-sm bg-slate-800 text-green-400 border border-slate-700 font-mono`}>{content}</div>
                                                    </div>
                                                );
    if (style === 'alien') return (
                                                    <div className="relative mt-1">
                                                        <div className="absolute -top-3 left-6 w-6 h-4 bg-lime-400 rounded-t-full flex items-center gap-1 justify-center"><div className="w-1.5 h-1.5 bg-black rounded-full"></div><div className="w-1.5 h-1.5 bg-black rounded-full"></div></div>
                                                        <div className={`px-2 py-1 rounded-xl rounded-tl-none text-[9px] shadow-sm bg-lime-900 text-lime-400 border border-lime-700 font-mono`}>{content}</div>
                                                    </div>
                                                );
    if (style === 'dinosaur') return (
                                                    <div className="relative mt-1">
                                                        <div className="absolute -top-2 left-2 w-4 h-4 bg-emerald-600 rounded-t-md rotate-[-45deg]"></div>
                                                        <div className="absolute -top-2 left-10 w-4 h-4 bg-emerald-600 rounded-t-md rotate-[-45deg]"></div>
                                                        <div className={`px-2 py-1 rounded-xl text-[9px] shadow-sm bg-emerald-100 text-emerald-900 border-2 border-emerald-500`}>{content}</div>
                                                    </div>
                                                );
    if (style === 'unicorn') return (
                                                    <div className="relative mt-1">
                                                        <div className="absolute -top-5 left-6 w-0 h-0 border-l-[6px] border-r-[6px] border-b-[16px] border-transparent border-b-yellow-400"></div>
                                                        <div className={`px-2 py-1 rounded-xl text-[9px] shadow-sm bg-gradient-to-r from-pink-100 via-purple-100 to-blue-100 text-purple-900 border border-purple-200`}>{content}</div>
                                                    </div>
                                                );
    if (style === 'ghost') return (
                                                    <div className="relative mt-1">
                                                        <div className={`px-2 py-1 rounded-t-2xl rounded-bl-sm rounded-br-3xl text-[9px] shadow-sm bg-slate-100 text-slate-800 border border-slate-200`}>{content}</div>
                                                        <div className="absolute -bottom-3 left-2 w-3 h-3 bg-slate-100 rounded-full"></div>
                                                    </div>
                                                );
    if (style === 'ninja') return (
                                                    <div className="relative mt-1">
                                                        <div className="absolute -top-1 left-6 w-16 h-3 bg-red-500 transform -skew-x-12"></div>
                                                        <div className={`px-2 py-1 rounded-xl text-[9px] shadow-sm bg-slate-900 text-slate-200 border border-slate-700 z-10 relative`}>{content}</div>
                                                    </div>
                                                );
    if (style === 'dragon') return (
                                                    <div className="relative mt-1">
                                                        <div className="absolute -top-4 left-2 w-5 h-4 bg-red-600 rounded-t-full rotate-[-20deg]"></div>
                                                        <div className="absolute -top-4 left-8 w-5 h-4 bg-red-600 rounded-t-full rotate-[20deg]"></div>
                                                        <div className={`px-2 py-1 rounded-xl text-[9px] shadow-sm bg-orange-100 text-red-900 border-2 border-red-500 z-10 relative`}>{content}</div>
                                                    </div>
                                                );
    if (style === 'fox') return (
                                                    <div className="relative mt-1">
                                                        <div className="absolute -top-3 -left-1 w-0 h-0 border-l-[6px] border-r-[6px] border-b-[12px] border-transparent border-b-orange-600 rotate-[-25deg]"></div>
                                                        <div className="absolute -top-3 -right-1 w-0 h-0 border-l-[6px] border-r-[6px] border-b-[12px] border-transparent border-b-orange-600 rotate-[25deg]"></div>
                                                        <div className={`px-2 py-1 rounded-xl text-[9px] shadow-sm bg-orange-500 text-white border-b-4 border-orange-700 z-10 relative`}>{content}</div>
                                                    </div>
                                                );
    if (style === 'panda') return (
                                                    <div className="relative mt-1">
                                                        <div className="absolute -top-4 left-3 w-7 h-4 bg-zinc-800 rounded-full rotate-[-25deg] border-[2px] border-zinc-900 shadow-sm z-0"></div>
                                                        <div className="absolute -top-4 right-3 w-7 h-4 bg-zinc-800 rounded-full rotate-[25deg] border-[2px] border-zinc-900 shadow-sm z-0"></div>
                                                        <div className="bg-white text-slate-800 font-medium border-[3px] border-zinc-800 border-b-[5px] px-2 py-1 rounded-xl shadow-sm relative overflow-hidden z-10">
                                                            <div className="absolute top-[30%] left-[8%] w-5 h-2.5 bg-pink-300/40 rounded-full blur-[1px]"></div>
                                                            <div className="absolute top-[30%] right-[8%] w-5 h-2.5 bg-pink-300/40 rounded-full blur-[1px]"></div>
                                                            <div className="relative z-10">{content}</div>
                                                        </div>
                                                    </div>
                                                );
    if (style === 'hamster') return (
                                                    <div className="relative mt-1">
                                                        <div className="absolute -top-3 left-2 w-5 h-5 bg-amber-200 rounded-full"></div>
                                                        <div className="absolute -top-3 right-2 w-5 h-5 bg-amber-200 rounded-full"></div>
                                                        <div className={`px-2 py-1 rounded-xl text-[9px] shadow-sm bg-amber-100 text-amber-900 border-2 border-amber-300 z-10 relative`}>{content}</div>
                                                    </div>
                                                );
    if (style === 'owl') return (
                                                    <div className="relative mt-1">
                                                        <div className="absolute -top-3 left-2 w-0 h-0 border-l-[6px] border-r-[6px] border-b-[10px] border-transparent border-b-[#451a03]"></div>
                                                        <div className="absolute -top-3 right-2 w-0 h-0 border-l-[6px] border-r-[6px] border-b-[10px] border-transparent border-b-[#451a03]"></div>
                                                        <div className={`px-2 py-1 rounded-xl text-[9px] shadow-sm bg-[#78350f] text-[#fef3c7] border-b-4 border-[#451a03] z-10 relative`}>{content}</div>
                                                    </div>
                                                );
    if (style === 'sloth') return (
                                                    <div className="relative mt-1">
                                                        <div className="absolute -top-2 left-3 w-10 h-4 bg-[#a1a1aa] rounded-t-full"></div>
                                                        <div className={`px-2 py-1 rounded-xl text-[9px] shadow-sm bg-[#d4d4d8] text-slate-800 border-b-4 border-[#a1a1aa] z-10 relative`}>{content}</div>
                                                    </div>
                                                );
    if (style === 'otter') return (
                                                    <div className="relative mt-1">
                                                        <div className="absolute -top-3 left-2 w-4 h-4 bg-[#52525b] rounded-full"></div>
                                                        <div className="absolute -top-3 right-2 w-4 h-4 bg-[#52525b] rounded-full"></div>
                                                        <div className={`px-2 py-1 rounded-xl text-[9px] shadow-sm bg-[#71717a] text-white border-b-4 border-[#3f3f46] z-10 relative`}>{content}</div>
                                                    </div>
                                                );
    if (style === 'turtle') return (
                                                    <div className="relative mt-1">
                                                        <div className="absolute -top-2 left-6 w-6 h-4 bg-[#166534] rounded-t-full"></div>
                                                        <div className={`px-2 py-1 rounded-xl text-[9px] shadow-sm bg-[#22c55e] text-[#14532d] border-4 border-[#16a34a] z-10 relative`}>{content}</div>
                                                    </div>
                                                );
    if (style === 'bee') return (
                                                    <div className="relative mt-1">
                                                        <div className="absolute -top-4 left-2 w-2 h-4 bg-slate-900 rounded-full rotate-[-30deg]"></div>
                                                        <div className="absolute -top-4 right-2 w-2 h-4 bg-slate-900 rounded-full rotate-[30deg]"></div>
                                                        <div className={`px-2 py-1 rounded-xl text-[9px] shadow-sm bg-[#fde047] text-slate-900 border-4 border-[#eab308] border-dashed z-10 relative`}>{content}</div>
                                                    </div>
                                                );
    if (style === 'whale') return (
                                                    <div className="relative mt-1">
                                                        <div className="absolute -top-5 left-8 w-1 h-5 bg-sky-200"></div>
                                                        <div className="absolute -top-5 left-5 w-1 h-4 bg-sky-300 rotate-[-30deg]"></div>
                                                        <div className="absolute -top-5 left-11 w-1 h-4 bg-sky-300 rotate-[30deg]"></div>
                                                        <div className={`px-2 py-1 rounded-xl text-[9px] shadow-sm bg-[#0ea5e9] text-white border-b-4 border-[#0284c7] z-10 relative`}>{content}</div>
                                                    </div>
                                                );
    if (style === 'octopus') return (
        <div className="relative mt-2">
            <div className={`px-2 py-1 rounded-t-[20px] text-[9px] shadow-sm bg-[#c084fc] text-white border border-[#a855f7] z-10 relative`}>{content}</div>
            <div className="flex gap-2 justify-center mt-[-1px]">
                <div className="w-2 h-3 bg-[#c084fc] rounded-b-full"></div>
                <div className="w-2 h-2 bg-[#c084fc] rounded-b-full"></div>
                <div className="w-2 h-3 bg-[#c084fc] rounded-b-full"></div>
            </div>
        </div>
    );
    return <div className="px-2 py-1 bg-slate-200 rounded-xl text-[9px]">{content}</div>;
  };


  const handleCustomColor = (e: React.ChangeEvent<HTMLInputElement>) => {
    onThemeChange(e.target.value);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0] && onBackgroundUpload) {
        onBackgroundUpload(e.target.files[0]);
    }
  };

  const isPreset = THEME_COLORS.some(t => t.id === currentTheme);

  return (
    <div className="relative" ref={containerRef}>
        <button
          onClick={() => setIsOpen(true)}
          className={`
            w-10 h-10 rounded-full backdrop-blur-md transition-all duration-300 flex items-center justify-center group border
            ${currentBackground 
                ? 'bg-white/20 hover:bg-white/30 text-white shadow-lg shadow-black/5 border-white/20' 
                : 'bg-white text-primary-600 hover:bg-primary-50 hover:text-primary-700 shadow-md hover:shadow-xl hover:-translate-y-0.5 border-transparent'}
          `}
          title="Tùy chỉnh giao diện"
        >
          <div className="w-6 h-6 rounded-full flex items-center justify-center" style={{ backgroundColor: isPreset ? 'transparent' : currentTheme, color: isPreset ? 'currentColor' : '#fff' }}>
             {isPreset ? (
               <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" 
                className={`w-5 h-5 transition-transform group-hover:rotate-45 duration-500 ${currentBackground ? 'text-white' : ''}`}
               >
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9.53 16.122a3 3 0 0 0-5.78 1.128 2.25 2.25 0 0 1-2.4 2.245 4.5 4.5 0 0 0 8.4-2.245c0-.399-.078-.78-.22-1.128Zm0 0a15.998 15.998 0 0 0 3.38-3.81m-9 3.81c5.26 0 9.43-6.38 9.43-11.233 0-1.847-1.428-2.618-2.585-1.928-1.157.69-2.015 2.15-2.015 3.35 0 .237-.038.468-.11.685a16.036 16.036 0 0 1-3.722 3.882c-1.257 1.056-2.023 2.189-2.023 3.35 0 1.203.774 2.25 1.95 2.915Z" />
               </svg>
             ) : (
                <div className="w-full h-full rounded-full ring-2 ring-white shadow-sm" style={{ backgroundColor: currentTheme }} />
             )}
          </div>
        </button>

      {isOpen && createPortal(
        <div className="fixed inset-0 z-[10000] flex items-center justify-center p-4 sm:p-6 overflow-hidden">
            {/* Backdrop */}
            <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm transition-opacity" onClick={() => setIsOpen(false)}></div>
            
            {/* Modal */}
            <div className="relative bg-white w-full max-w-lg sm:max-w-2xl lg:max-w-3xl rounded-3xl shadow-2xl overflow-hidden flex flex-col h-[90vh] sm:h-auto sm:max-h-[90vh] animate-scale-in m-4">
                {/* Modal Header */}
                <div className="px-6 py-5 border-b border-slate-100 flex items-center justify-between bg-slate-50/50 sticky top-0 z-10 hidden sm:flex">
                    <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2">
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5 text-primary-500">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M9.53 16.122a3 3 0 0 0-5.78 1.128 2.25 2.25 0 0 1-2.4 2.245 4.5 4.5 0 0 0 8.4-2.245c0-.399-.078-.78-.22-1.128Zm0 0a15.998 15.998 0 0 0 3.38-3.81m-9 3.81c5.26 0 9.43-6.38 9.43-11.233 0-1.847-1.428-2.618-2.585-1.928-1.157.69-2.015 2.15-2.015 3.35 0 .237-.038.468-.11.685a16.036 16.036 0 0 1-3.722 3.882c-1.257 1.056-2.023 2.189-2.023 3.35 0 1.203.774 2.25 1.95 2.915Z" />
                        </svg>
                        Tùy chỉnh giao diện
                    </h2>
                    <button onClick={() => setIsOpen(false)} className="p-2 rounded-full hover:bg-slate-200 text-slate-500 transition-colors">
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" />
                        </svg>
                    </button>
                </div>
                
                {/* Mobile Header with Drag Handle */}
                <div className="flex flex-col items-center pt-3 pb-4 sm:hidden bg-white sticky top-0 z-10 border-b border-slate-100">
                    <div className="w-12 h-1.5 bg-slate-200 rounded-full mb-3"></div>
                    <div className="w-full px-6 flex justify-between items-center">
                        <h2 className="text-xl font-bold text-slate-800">Tùy chỉnh giao diện</h2>
                        <button onClick={() => setIsOpen(false)} className="p-2 rounded-full hover:bg-slate-100 text-slate-500">
                            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" />
                            </svg>
                        </button>
                    </div>
                </div>

                {/* Modal Body */}
                <div className="p-4 sm:p-6 overflow-y-auto space-y-6 sm:space-y-8 flex-1">
                    
                    {/* Colors & Background */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 sm:gap-8">
                        {/* Section: Colors */}
                        <div>
                            <div className="flex items-center justify-between mb-3">
                                <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wider">Màu Tông</h3>
                                {!isPreset && <span className="text-[10px] bg-slate-100 text-slate-500 px-2 py-1 rounded-md font-mono font-bold">{currentTheme}</span>}
                            </div>
                            <div className="grid grid-cols-5 sm:grid-cols-4 gap-3 bg-slate-50 p-4 rounded-2xl border border-slate-100">
                                {THEME_COLORS.map((theme) => (
                                <button
                                    key={theme.id}
                                    onClick={() => onThemeChange(theme.id)}
                                    className={`aspect-square rounded-full flex items-center justify-center transition-all hover:scale-110 shadow-sm relative group ${
                                    currentTheme === theme.id ? 'ring-4 ring-offset-2 scale-110' : 'hover:shadow-md'
                                    }`}
                                    style={{ backgroundColor: theme.hex, '--tw-ring-color': theme.hex } as React.CSSProperties}
                                    title={theme.name}
                                >
                                    {currentTheme === theme.id && (
                                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={3} stroke="currentColor" className="w-4 h-4 text-white drop-shadow-md">
                                        <path strokeLinecap="round" strokeLinejoin="round" d="m4.5 12.75 6 6 9-13.5" />
                                    </svg>
                                    )}
                                </button>
                                ))}
                                
                                <div className={`relative aspect-square rounded-full flex items-center justify-center cursor-pointer transition-all hover:scale-110 shadow-sm border border-slate-200 bg-white overflow-hidden group ${!isPreset ? 'ring-4 ring-offset-2 ring-slate-800 scale-110' : ''}`}>
                                    <div className="w-full h-full bg-gradient-to-br from-red-400 via-green-400 to-blue-400 opacity-80" />
                                    <input 
                                        type="color" 
                                        className="absolute inset-0 w-[200%] h-[200%] opacity-0 cursor-pointer top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 p-0 m-0"
                                        value={isPreset ? '#2563eb' : currentTheme}
                                        onChange={handleCustomColor}
                                        title="Chọn màu tùy ý"
                                    />
                                    {!isPreset && (
                                        <div className="absolute inset-0 flex items-center justify-center pointer-events-none bg-black/20">
                                             <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={3} stroke="currentColor" className="w-4 h-4 text-white drop-shadow-md">
                                                <path strokeLinecap="round" strokeLinejoin="round" d="m4.5 12.75 6 6 9-13.5" />
                                            </svg>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>

                        {/* Section: Background */}
                        <div>
                            <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wider mb-3">Hình nền</h3>
                            <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100 h-[104px] sm:h-auto sm:aspect-video flex items-center justify-center overflow-hidden relative group">
                                {currentBackground ? (
                                    <>
                                        <img src={currentBackground} alt="Current background" className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" />
                                        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-3 backdrop-blur-[2px]">
                                            <button 
                                                onClick={() => fileInputRef.current?.click()}
                                                className="p-3 bg-white/20 backdrop-blur-md rounded-full text-white hover:bg-white hover:text-primary-600 transition-colors shadow-lg"
                                                title="Thay đổi ảnh"
                                            >
                                                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5">
                                                    <path strokeLinecap="round" strokeLinejoin="round" d="m2.25 15.75 5.159-5.159a2.25 2.25 0 0 1 3.182 0l5.159 5.159m-1.5-1.5 1.409-1.409a2.25 2.25 0 0 1 3.182 0l2.909 2.909m-18 3.75h16.5a1.5 1.5 0 0 0 1.5-1.5V6a1.5 1.5 0 0 0-1.5-1.5H3.75A1.5 1.5 0 0 0 2.25 6v12a1.5 1.5 0 0 0 1.5 1.5Zm10.5-11.25h.008v.008h-.008V8.25Zm.375 0a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Z" />
                                                </svg>
                                            </button>
                                            <button 
                                                onClick={onRemoveBackground}
                                                className="p-3 bg-red-500/80 backdrop-blur-md rounded-full text-white hover:bg-red-600 transition-colors shadow-lg"
                                                title="Xóa hình nền"
                                            >
                                                 <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5">
                                                    <path strokeLinecap="round" strokeLinejoin="round" d="m14.74 9-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 0 1-2.244 2.077H8.084a2.25 2.25 0 0 1-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 0 0-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 0 1 3.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 0 0-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 0 0-7.5 0" />
                                                </svg>
                                            </button>
                                        </div>
                                    </>
                                ) : (
                                    <button 
                                        onClick={() => fileInputRef.current?.click()}
                                        className="w-full h-full border-2 border-dashed border-slate-200 hover:border-primary-400 hover:bg-white transition-all flex flex-col items-center justify-center gap-2 group cursor-pointer rounded-xl"
                                    >
                                        <div className="w-10 h-10 rounded-full bg-white border border-slate-200 flex items-center justify-center text-slate-400 group-hover:text-primary-500 group-hover:scale-110 shadow-sm transition-all">
                                            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5">
                                                <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75V16.5m-13.5-9L12 3m0 0 4.5 4.5M12 3v13.5" />
                                            </svg>
                                        </div>
                                        <span className="text-xs font-bold text-slate-500 group-hover:text-primary-600">Chọn ảnh nền</span>
                                    </button>
                                )}
                                <input type="file" ref={fileInputRef} accept="image/*" className="hidden" onChange={handleFileChange} />
                            </div>
                        </div>
                    </div>

                    <hr className="border-slate-100 mt-2" />

                    {/* Section: Elements Sub-Styles */}
                    <div className="flex flex-col h-full mt-0">
                         <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wider mb-4">Các thành phần UI</h3>
                         
                         {/* Tabs */}
                         <div className="flex flex-wrap gap-2 sm:gap-3 mb-6 pb-4 border-b border-slate-100">
                             {[
                                 { id: 'header', label: 'Chủ đề' },
                                  { id: 'userBubble', label: 'Hộp thoại (Bạn)' },
                                 { id: 'aiBubble', label: 'Hộp thoại (AI)' }
                             ].map(tab => (
                                 <button
                                     key={tab.id}
                                     onClick={() => setActiveTab(tab.id as any)}
                                     className={`px-4 xl:px-5 py-2.5 rounded-xl text-xs sm:text-sm text-center font-bold transition-all flex-1 min-w-[calc(50%-0.5rem)] sm:min-w-0 sm:flex-none ${activeTab === tab.id ? 'bg-primary-500 text-white shadow-[0_4px_12px_rgba(0,0,0,0.15)] ring-2 ring-primary-500 ring-offset-1' : 'bg-slate-100 text-slate-600 hover:bg-slate-200 border border-slate-200'}`}
                                 >
                                     {tab.label}
                                 </button>
                             ))}
                         </div>

                         <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-6 pb-12 sm:pb-4">
                            
                            {/* Header Styles */}
                            {activeTab === 'header' && (
                                <>

                                    <button onClick={() => onStyleChange({ header: 'default', button: 'default' })} className={`relative overflow-hidden w-full h-[70px] sm:h-24 rounded-xl border-2 transition-all group  ${appStyles.header === 'default' ? 'border-primary-500 ring-4 ring-primary-500/20 shadow-md' : 'border-slate-200 hover:border-slate-300'}`}>
                                        <div className="absolute inset-x-0 top-0 bottom-6 sm:inset-x-2 sm:top-4 sm:bottom-2 transform scale-[0.6] sm:scale-100 origin-center pointer-events-none -translate-y-2 sm:translate-y-0"><div className="absolute inset-0 sm:inset-x-0 sm:top-0 sm:bottom-0 bg-[#fef3c7] border-2 border-amber-700 rounded-lg flex items-center justify-center">
                                            <div className="w-10 h-0.5 bg-amber-700/20"></div>
                                        </div>
                                        <div className="absolute top-2 left-6 w-1 h-6 bg-amber-800 shadow-[inset_1px_0_2px_rgba(0,0,0,0.3)]"></div><div className="absolute top-2 right-6 w-1 h-6 bg-amber-800 shadow-[inset_1px_0_2px_rgba(0,0,0,0.3)]"></div>
                                        </div><div className="absolute inset-x-0 bottom-0 py-0.5 bg-white/95 backdrop-blur border-t border-white/50 flex justify-center items-center z-20"><span className="text-[10.5px] font-black text-slate-800 uppercase tracking-widest">Mặc định</span></div>
                                    </button>
                                    
                                    <button onClick={() => onStyleChange({ header: 'waves', button: '3d' })} className={`relative overflow-hidden w-full h-[70px] sm:h-24 rounded-xl border-2 transition-all group  ${appStyles.header === 'waves' ? 'border-primary-500 ring-4 ring-primary-500/20 shadow-md' : 'border-slate-200 hover:border-slate-300'}`}>
                                        <div className="absolute inset-x-0 top-0 bottom-6 sm:inset-x-2 sm:top-4 sm:bottom-2 transform scale-[0.6] sm:scale-100 origin-center pointer-events-none -translate-y-2 sm:translate-y-0"><div className="absolute inset-0 sm:inset-x-0 sm:top-0 sm:bottom-0 bg-blue-100 border-[2px] border-blue-500 rounded-lg flex items-center justify-center">
                                            <div className="absolute -top-3 left-1/2 -translate-x-1/2 flex items-center justify-center gap-1"><div className="w-5 h-5 bg-blue-400 rounded-full flex flex-col items-center justify-center"><div className="w-2.5 h-0.5 bg-blue-800 rounded-full mt-1"></div></div></div>
                                        </div>
                                        <div className="absolute top-2 left-6 w-1 h-6 bg-blue-600 shadow-[inset_1px_0_2px_rgba(0,0,0,0.3)]"></div><div className="absolute top-2 right-6 w-1 h-6 bg-blue-600 shadow-[inset_1px_0_2px_rgba(0,0,0,0.3)]"></div>
                                        </div><div className="absolute inset-x-0 bottom-0 py-0.5 bg-white/95 backdrop-blur border-t border-white/50 flex justify-center items-center z-20"><span className="text-[10.5px] font-black text-slate-800 uppercase tracking-widest">Lượn sóng</span></div>
                                    </button>
                                    
                                    <button onClick={() => onStyleChange({ header: 'clouds', button: 'bubble' })} className={`relative overflow-hidden w-full h-[70px] sm:h-24 rounded-xl border-2 transition-all group  ${appStyles.header === 'clouds' ? 'border-primary-500 ring-4 ring-primary-500/20 shadow-md' : 'border-slate-200 hover:border-slate-300'}`}>
                                        <div className="absolute inset-x-0 top-0 bottom-6 sm:inset-x-2 sm:top-4 sm:bottom-2 transform scale-[0.6] sm:scale-100 origin-center pointer-events-none -translate-y-2 sm:translate-y-0"><div className="absolute inset-0 sm:inset-x-0 sm:top-0 sm:bottom-0 bg-white border-2 border-sky-300 rounded-3xl flex flex-col items-center justify-center pb-2">
                                            <div className="absolute -top-3 left-1/2 -translate-x-1/2 w-12 h-6 bg-white rounded-t-full flex justify-center items-end gap-1"><div className="w-1.5 h-0.5 bg-slate-800 rounded-full rotate-12"></div><div className="w-1.5 h-0.5 bg-slate-800 rounded-full -rotate-12"></div></div>
                                        </div>
                                        <div className="absolute top-2 left-6 w-1 h-6 bg-slate-300 shadow-[inset_1px_0_2px_rgba(0,0,0,0.3)]"></div><div className="absolute top-2 right-6 w-1 h-6 bg-slate-300 shadow-[inset_1px_0_2px_rgba(0,0,0,0.3)]"></div>
                                        </div><div className="absolute inset-x-0 bottom-0 py-0.5 bg-white/95 backdrop-blur border-t border-white/50 flex justify-center items-center z-20"><span className="text-[10.5px] font-black text-slate-800 uppercase tracking-widest">Đám mây</span></div>
                                    </button>

                                    <button onClick={() => onStyleChange({ header: 'sunset', button: 'glow' })} className={`relative overflow-hidden w-full h-[70px] sm:h-24 rounded-xl border-2 transition-all group  ${appStyles.header === 'sunset' ? 'border-primary-500 ring-4 ring-primary-500/20 shadow-md' : 'border-slate-200 hover:border-slate-300'}`}>
                                        <div className="absolute inset-x-0 top-0 bottom-6 sm:inset-x-2 sm:top-4 sm:bottom-2 transform scale-[0.6] sm:scale-100 origin-center pointer-events-none -translate-y-2 sm:translate-y-0"><div className="absolute inset-0 sm:inset-x-0 sm:top-0 sm:bottom-0 bg-gradient-to-r from-orange-100 to-rose-100 border-[2px] border-orange-500 rounded-lg flex items-center justify-center">
                                            <div className="absolute -top-3 left-1/2 -translate-x-1/2 w-6 h-6 bg-yellow-400 rounded-full border border-orange-400 flex flex-col items-center justify-center pt-0.5"><div className="flex gap-1"><div className="w-1 h-1 bg-orange-800 rounded-full"></div><div className="w-1 h-1 bg-orange-800 rounded-full"></div></div><div className="w-2 h-0.5 mt-0.5 bg-orange-800 rounded-full"></div></div>
                                        </div>
                                        <div className="absolute top-2 left-6 w-1 h-6 bg-orange-800 shadow-[inset_1px_0_2px_rgba(0,0,0,0.3)]"></div><div className="absolute top-2 right-6 w-1 h-6 bg-orange-800 shadow-[inset_1px_0_2px_rgba(0,0,0,0.3)]"></div>
                                        </div><div className="absolute inset-x-0 bottom-0 py-0.5 bg-white/95 backdrop-blur border-t border-white/50 flex justify-center items-center z-20"><span className="text-[10.5px] font-black text-slate-800 uppercase tracking-widest">Hoàng hôn</span></div>
                                    </button>

                                    <button onClick={() => onStyleChange({ header: 'forest', button: 'leaf' })} className={`relative overflow-hidden w-full h-[70px] sm:h-24 rounded-xl border-2 transition-all group  ${appStyles.header === 'forest' ? 'border-primary-500 ring-4 ring-primary-500/20 shadow-md' : 'border-slate-200 hover:border-slate-300'}`}>
                                        <div className="absolute inset-x-0 top-0 bottom-6 sm:inset-x-2 sm:top-4 sm:bottom-2 transform scale-[0.6] sm:scale-100 origin-center pointer-events-none -translate-y-2 sm:translate-y-0"><div className="absolute inset-0 sm:inset-x-0 sm:top-0 sm:bottom-0 bg-[#dcfce7] border-[2px] border-green-600 rounded-lg flex items-center justify-center">
                                            <div className="absolute -top-3 -left-2 w-8 h-8 bg-green-500 rounded-full border-[2px] border-green-700 flex flex-col items-center justify-center pt-0.5"><div className="flex gap-1"><div className="w-1 h-1 bg-green-900 rounded-full"></div><div className="w-1 h-1 bg-green-900 rounded-full"></div></div><div className="w-1.5 h-0.5 bg-green-800 rounded-full mt-0.5"></div></div>
                                        </div>
                                        <div className="absolute top-2 left-6 w-1 h-6 bg-green-800 shadow-[inset_1px_0_2px_rgba(0,0,0,0.3)]"></div><div className="absolute top-2 right-6 w-1 h-6 bg-green-800 shadow-[inset_1px_0_2px_rgba(0,0,0,0.3)]"></div>
                                        </div><div className="absolute inset-x-0 bottom-0 py-0.5 bg-white/95 backdrop-blur border-t border-white/50 flex justify-center items-center z-20"><span className="text-[10.5px] font-black text-slate-800 uppercase tracking-widest">Rừng xanh</span></div>
                                    </button>

                                    <button onClick={() => onStyleChange({ header: 'magic', button: 'magic_wand' })} className={`relative overflow-hidden w-full h-[70px] sm:h-24 rounded-xl border-2 transition-all group  ${appStyles.header === 'magic' ? 'border-primary-500 ring-4 ring-primary-500/20 shadow-md' : 'border-slate-200 hover:border-slate-300'}`}>
                                        <div className="absolute inset-x-0 top-0 bottom-6 sm:inset-x-2 sm:top-4 sm:bottom-2 transform scale-[0.6] sm:scale-100 origin-center pointer-events-none -translate-y-2 sm:translate-y-0"><div className="absolute inset-0 sm:inset-x-0 sm:top-0 sm:bottom-0 bg-purple-100 border-[2px] border-purple-500 rounded-lg flex items-center justify-center">
                                            <div className="absolute -top-4 right-1 flex flex-col items-center"><div className="w-0 h-0 border-l-[6px] border-r-[6px] border-b-[12px] border-transparent border-b-indigo-500"></div><div className="w-5 h-1.5 bg-indigo-600 rounded-full -mt-1"></div></div>
                                        </div>
                                        <div className="absolute top-2 left-6 w-1 h-6 bg-purple-800 shadow-[inset_1px_0_2px_rgba(0,0,0,0.3)]"></div><div className="absolute top-2 right-6 w-1 h-6 bg-purple-800 shadow-[inset_1px_0_2px_rgba(0,0,0,0.3)]"></div>
                                        </div><div className="absolute inset-x-0 bottom-0 py-0.5 bg-white/95 backdrop-blur border-t border-white/50 flex justify-center items-center z-20"><span className="text-[10.5px] font-black text-slate-800 uppercase tracking-widest">Phép thuật</span></div>
                                    </button>

                                    <button onClick={() => onStyleChange({ header: 'ocean', button: 'diamond' })} className={`relative overflow-hidden w-full h-[70px] sm:h-24 rounded-xl border-2 transition-all group  ${appStyles.header === 'ocean' ? 'border-primary-500 ring-4 ring-primary-500/20 shadow-md' : 'border-slate-200 hover:border-slate-300'}`}>
                                        <div className="absolute inset-x-0 top-0 bottom-6 sm:inset-x-2 sm:top-4 sm:bottom-2 transform scale-[0.6] sm:scale-100 origin-center pointer-events-none -translate-y-2 sm:translate-y-0"><div className="absolute inset-0 sm:inset-x-0 sm:top-0 sm:bottom-0 bg-teal-50 border-[2px] border-teal-500 rounded-lg flex items-center justify-center">
                                            <div className="absolute -top-3 left-1/2 -translate-x-1/2 w-8 h-4 bg-teal-400 rounded-t-full border-[2px] border-b-0 border-teal-600 flex justify-center items-center gap-1 pt-0.5"><div className="w-1 h-1 bg-teal-900 rounded-full"></div><div className="w-1 h-1 bg-teal-900 rounded-full"></div></div>
                                        </div>
                                        <div className="absolute top-2 left-6 w-1 h-6 bg-teal-700 shadow-[inset_1px_0_2px_rgba(0,0,0,0.3)]"></div><div className="absolute top-2 right-6 w-1 h-6 bg-teal-700 shadow-[inset_1px_0_2px_rgba(0,0,0,0.3)]"></div>
                                        </div><div className="absolute inset-x-0 bottom-0 py-0.5 bg-white/95 backdrop-blur border-t border-white/50 flex justify-center items-center z-20"><span className="text-[10.5px] font-black text-slate-800 uppercase tracking-widest">Đại dương</span></div>
                                    </button>

                                    <button onClick={() => onStyleChange({ header: 'space', button: 'rocket' })} className={`relative overflow-hidden w-full h-[70px] sm:h-24 rounded-xl border-2 transition-all group  ${appStyles.header === 'space' ? 'border-primary-500 ring-4 ring-primary-500/20 shadow-md' : 'border-slate-200 hover:border-slate-300'}`}>
                                        <div className="absolute inset-x-0 top-0 bottom-6 sm:inset-x-2 sm:top-4 sm:bottom-2 transform scale-[0.6] sm:scale-100 origin-center pointer-events-none -translate-y-2 sm:translate-y-0"><div className="absolute inset-0 sm:inset-x-0 sm:top-0 sm:bottom-0 bg-slate-800 border-[2px] border-indigo-400 rounded-lg flex items-center justify-center">
                                            <div className="absolute -top-3 left-1/2 -translate-x-1/2 w-8 h-5 bg-slate-300 rounded-t-full border-[2px] border-slate-500 flex justify-center items-center gap-1 pt-1"><div className="w-1 h-2 bg-slate-800 rounded-full"></div><div className="w-1 h-2 bg-slate-800 rounded-full"></div></div>
                                        </div>
                                        <div className="absolute top-2 left-6 w-1 h-6 bg-slate-600 shadow-[inset_1px_0_2px_rgba(0,0,0,0.3)]"></div><div className="absolute top-2 right-6 w-1 h-6 bg-slate-600 shadow-[inset_1px_0_2px_rgba(0,0,0,0.3)]"></div>
                                        </div><div className="absolute inset-x-0 bottom-0 py-0.5 bg-white/95 backdrop-blur border-t border-white/50 flex justify-center items-center z-20"><span className="text-[10.5px] font-black text-slate-800 uppercase tracking-widest">Vũ trụ</span></div>
                                    </button>

                                    <button onClick={() => onStyleChange({ header: 'frog', button: 'frog' })} className={`relative overflow-hidden w-full h-[70px] sm:h-24 rounded-xl border-2 transition-all group  ${appStyles.header === 'frog' ? 'border-primary-500 ring-4 ring-primary-500/20 shadow-md' : 'border-slate-200 hover:border-slate-300'}`}>
                                        <div className="absolute inset-x-0 top-0 bottom-6 sm:inset-x-2 sm:top-4 sm:bottom-2 transform scale-[0.6] sm:scale-100 origin-center pointer-events-none -translate-y-2 sm:translate-y-0"><div className="absolute inset-0 sm:inset-x-0 sm:top-0 sm:bottom-0 bg-[#86efac] border-[2px] border-[#4ade80] rounded-[1rem] flex items-center justify-center">
                                            <div className="absolute -top-3 left-2 w-6 h-6 bg-[#86efac] rounded-full border-[2px] border-[#4ade80] flex justify-center items-center z-[-1]"><div className="w-4 h-4 bg-white rounded-full flex justify-center items-center"><div className="w-2 h-2 bg-slate-900 rounded-full translate-x-[1px]"></div></div></div>
                                            <div className="absolute -top-3 right-2 w-6 h-6 bg-[#86efac] rounded-full border-[2px] border-[#4ade80] flex justify-center items-center z-[-1]"><div className="w-4 h-4 bg-white rounded-full flex justify-center items-center"><div className="w-2 h-2 bg-slate-900 rounded-full -translate-x-[1px]"></div></div></div>
                                            <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-3/4 h-2/5 bg-[#bbf7d0] rounded-t-[100%]"></div>
                                        </div>
                                        <div className="absolute top-2 left-4 w-2 h-1.5 bg-pink-400/60 rounded-full blur-[1px]"></div><div className="absolute top-2 right-4 w-2 h-1.5 bg-pink-400/60 rounded-full blur-[1px]"></div>
                                        </div><div className="absolute inset-x-0 bottom-0 py-0.5 bg-white/95 backdrop-blur border-t border-white/50 flex justify-center items-center z-20"><span className="text-[10.5px] font-black text-slate-800 uppercase tracking-widest">Ếch xanh</span></div>
                                    </button>

                                    <button onClick={() => onStyleChange({ header: 'cat', button: 'cat' })} className={`relative overflow-hidden w-full h-[70px] sm:h-24 rounded-xl border-2 transition-all group  ${appStyles.header === 'cat' ? 'border-primary-500 ring-4 ring-primary-500/20 shadow-md' : 'border-slate-200 hover:border-slate-300'}`}>
                                        <div className="absolute inset-x-0 top-0 bottom-6 sm:inset-x-2 sm:top-4 sm:bottom-2 transform scale-[0.6] sm:scale-100 origin-center pointer-events-none -translate-y-2 sm:translate-y-0"><div className="absolute inset-0 sm:inset-x-0 sm:top-0 sm:bottom-0 bg-amber-100 border-[2px] border-amber-600 rounded-lg flex items-center justify-center">
                                            <div className="absolute -top-2 left-3 w-0 h-0 border-l-[6px] border-r-[6px] border-b-[10px] border-transparent border-b-amber-500 rotate-[-15deg]"></div>
                                            <div className="absolute -top-2 right-3 w-0 h-0 border-l-[6px] border-r-[6px] border-b-[10px] border-transparent border-b-amber-500 rotate-[15deg]"></div>
                                            <div className="absolute top-1.5 flex gap-3"><div className="w-1.5 h-1.5 bg-amber-900 rounded-full"></div><div className="w-1.5 h-1.5 bg-amber-900 rounded-full"></div></div>
                                            <div className="absolute top-3 w-1.5 h-1 border-b-[2px] border-amber-900 rounded-b-full"></div>
                                        </div>
                                        <div className="absolute top-2 left-6 w-1 h-6 bg-amber-800 shadow-[inset_1px_0_2px_rgba(0,0,0,0.3)]"></div><div className="absolute top-2 right-6 w-1 h-6 bg-amber-800 shadow-[inset_1px_0_2px_rgba(0,0,0,0.3)]"></div>
                                        </div><div className="absolute inset-x-0 bottom-0 py-0.5 bg-white/95 backdrop-blur border-t border-white/50 flex justify-center items-center z-20"><span className="text-[10.5px] font-black text-slate-800 uppercase tracking-widest">Mèo vàng</span></div>
                                    </button>

                                    <button onClick={() => onStyleChange({ header: 'panda', button: 'panda' })} className={`relative overflow-hidden w-full h-[70px] sm:h-24 rounded-xl border-2 transition-all group  ${appStyles.header === 'panda' ? 'border-primary-500 ring-4 ring-primary-500/20 shadow-md' : 'border-slate-200 hover:border-slate-300'}`}>
                                        <div className="absolute inset-x-0 top-0 bottom-6 sm:inset-x-2 sm:top-4 sm:bottom-2 transform scale-[0.6] sm:scale-100 origin-center pointer-events-none -translate-y-2 sm:translate-y-0"><div className="absolute inset-0 sm:inset-x-0 sm:top-0 sm:bottom-0 bg-white border-[2px] border-slate-800 rounded-[1rem] flex items-center justify-center">
                                            <div className="flex gap-2 mb-2"><div className="w-3 h-2 bg-slate-800 rounded-full flex items-center justify-center rotate-12"><div className="w-1 h-1 bg-white rounded-full"></div></div><div className="w-3 h-2 bg-slate-800 rounded-full flex items-center justify-center -rotate-12"><div className="w-1 h-1 bg-white rounded-full"></div></div></div>
                                        </div>
                                        <div className="absolute top-2 left-6 w-1 h-6 bg-slate-700 shadow-[inset_1px_0_2px_rgba(0,0,0,0.3)]"></div><div className="absolute top-2 right-6 w-1 h-6 bg-slate-700 shadow-[inset_1px_0_2px_rgba(0,0,0,0.3)]"></div>
                                        </div><div className="absolute inset-x-0 bottom-0 py-0.5 bg-white/95 backdrop-blur border-t border-white/50 flex justify-center items-center z-20"><span className="text-[10.5px] font-black text-slate-800 uppercase tracking-widest">Gấu trúc</span></div>
                                    </button>

                                    <button onClick={() => onStyleChange({ header: 'fox', button: 'fox' })} className={`relative overflow-hidden w-full h-[70px] sm:h-24 rounded-xl border-2 transition-all group  ${appStyles.header === 'fox' ? 'border-primary-500 ring-4 ring-primary-500/20 shadow-md' : 'border-slate-200 hover:border-slate-300'}`}>
                                        <div className="absolute inset-x-0 top-0 bottom-6 sm:inset-x-2 sm:top-4 sm:bottom-2 transform scale-[0.6] sm:scale-100 origin-center pointer-events-none -translate-y-2 sm:translate-y-0"><div className="absolute inset-0 sm:inset-x-0 sm:top-0 sm:bottom-0 bg-orange-100 border-[2px] border-orange-600 rounded-lg flex items-center justify-center">
                                            <div className="absolute -top-2 left-2 w-0 h-0 border-l-[6px] border-r-[6px] border-b-[10px] border-transparent border-b-orange-600 rotate-[-20deg]"></div>
                                            <div className="absolute -top-2 right-2 w-0 h-0 border-l-[6px] border-r-[6px] border-b-[10px] border-transparent border-b-orange-600 rotate-[20deg]"></div>
                                            <div className="absolute top-1.5 flex gap-4"><div className="w-1.5 h-1.5 bg-orange-900 rounded-full"></div><div className="w-1.5 h-1.5 bg-orange-900 rounded-full"></div></div>
                                            <div className="absolute top-3 w-1.5 h-1.5 bg-orange-900 rounded-full"></div>
                                        </div>
                                        <div className="absolute top-2 left-6 w-1 h-6 bg-orange-800 shadow-[inset_1px_0_2px_rgba(0,0,0,0.3)]"></div><div className="absolute top-2 right-6 w-1 h-6 bg-orange-800 shadow-[inset_1px_0_2px_rgba(0,0,0,0.3)]"></div>
                                        </div><div className="absolute inset-x-0 bottom-0 py-0.5 bg-white/95 backdrop-blur border-t border-white/50 flex justify-center items-center z-20"><span className="text-[10.5px] font-black text-slate-800 uppercase tracking-widest">Cáo nhỏ</span></div>
                                    </button>

                                    <button onClick={() => onStyleChange({ header: 'dragon', button: 'dragon' })} className={`relative overflow-hidden w-full h-[70px] sm:h-24 rounded-xl border-2 transition-all group  ${appStyles.header === 'dragon' ? 'border-primary-500 ring-4 ring-primary-500/20 shadow-md' : 'border-slate-200 hover:border-slate-300'}`}>
                                        <div className="absolute inset-x-0 top-0 bottom-6 sm:inset-x-2 sm:top-4 sm:bottom-2 transform scale-[0.6] sm:scale-100 origin-center pointer-events-none -translate-y-2 sm:translate-y-0"><div className="absolute inset-0 sm:inset-x-0 sm:top-0 sm:bottom-0 bg-red-100 border-[2px] border-red-600 rounded-lg flex items-center justify-center">
                                        </div>
                                        <div className="absolute top-2 left-6 w-1 h-6 bg-red-800 shadow-[inset_1px_0_2px_rgba(0,0,0,0.3)]"></div><div className="absolute top-2 right-6 w-1 h-6 bg-red-800 shadow-[inset_1px_0_2px_rgba(0,0,0,0.3)]"></div>
                                        </div><div className="absolute inset-x-0 bottom-0 py-0.5 bg-white/95 backdrop-blur border-t border-white/50 flex justify-center items-center z-20"><span className="text-[10.5px] font-black text-slate-800 uppercase tracking-widest">Rồng nhỏ</span></div>
                                    </button>

                                    <button onClick={() => onStyleChange({ header: 'penguin', button: 'penguin' })} className={`relative overflow-hidden w-full h-[70px] sm:h-24 rounded-xl border-2 transition-all group  ${appStyles.header === 'penguin' ? 'border-primary-500 ring-4 ring-primary-500/20 shadow-md' : 'border-slate-200 hover:border-slate-300'}`}>
                                        <div className="absolute inset-x-0 top-0 bottom-6 sm:inset-x-2 sm:top-4 sm:bottom-2 transform scale-[0.6] sm:scale-100 origin-center pointer-events-none -translate-y-2 sm:translate-y-0"><div className="absolute inset-0 sm:inset-x-0 sm:top-0 sm:bottom-0 bg-slate-800 border-[2px] border-slate-900 rounded-lg flex items-center justify-center overflow-hidden">
                                            <div className="absolute inset-x-2 top-0 bottom-0 bg-white rounded-t-full"></div>
                                            <div className="absolute -top-1 left-1/2 -translate-x-1/2 w-0 h-0 border-l-[5px] border-r-[5px] border-t-[8px] border-transparent border-t-orange-500 z-10"></div>
                                            <div className="absolute top-1 flex gap-4 z-10"><div className="w-1.5 h-1.5 bg-slate-800 rounded-full"></div><div className="w-1.5 h-1.5 bg-slate-800 rounded-full"></div></div>
                                        </div>
                                        <div className="absolute top-2 left-6 w-1 h-6 bg-slate-700 shadow-[inset_1px_0_2px_rgba(0,0,0,0.3)] z-0"></div><div className="absolute top-2 right-6 w-1 h-6 bg-slate-700 shadow-[inset_1px_0_2px_rgba(0,0,0,0.3)] z-0"></div>
                                        </div><div className="absolute inset-x-0 bottom-0 py-0.5 bg-white/95 backdrop-blur border-t border-white/50 flex justify-center items-center z-20"><span className="text-[10.5px] font-black text-slate-800 uppercase tracking-widest">Cánh cụt</span></div>
                                    </button>

                                    <button onClick={() => onStyleChange({ header: 'bear', button: 'bear' })} className={`relative overflow-hidden w-full h-[70px] sm:h-24 rounded-xl border-2 transition-all group  ${appStyles.header === 'bear' ? 'border-primary-500 ring-4 ring-primary-500/20 shadow-md' : 'border-slate-200 hover:border-slate-300'}`}>
                                        <div className="absolute inset-x-0 top-0 bottom-6 sm:inset-x-2 sm:top-4 sm:bottom-2 transform scale-[0.6] sm:scale-100 origin-center pointer-events-none -translate-y-2 sm:translate-y-0"><div className="absolute inset-0 sm:inset-x-0 sm:top-0 sm:bottom-0 bg-amber-100 border-[2px] border-amber-700 rounded-lg flex items-center justify-center">
                                            <div className="absolute -top-2 left-2 w-4 h-4 bg-amber-700 rounded-full"></div>
                                            <div className="absolute -top-2 right-2 w-4 h-4 bg-amber-700 rounded-full"></div>
                                            <div className="z-10 absolute top-1.5 flex gap-3"><div className="w-1.5 h-1.5 bg-amber-900 rounded-full"></div><div className="w-1.5 h-1.5 bg-amber-900 rounded-full"></div></div>
                                            <div className="absolute top-0 w-8 h-4 bg-amber-200 rounded-b-full border-[2px] border-amber-400 flex justify-center"><div className="absolute bottom-[2px] w-1.5 h-1 bg-amber-950 rounded-b-full"></div></div>
                                        </div>
                                        <div className="absolute top-2 left-6 w-1 h-6 bg-amber-900 shadow-[inset_1px_0_2px_rgba(0,0,0,0.3)]"></div><div className="absolute top-2 right-6 w-1 h-6 bg-amber-900 shadow-[inset_1px_0_2px_rgba(0,0,0,0.3)]"></div>
                                        </div><div className="absolute inset-x-0 bottom-0 py-0.5 bg-white/95 backdrop-blur border-t border-white/50 flex justify-center items-center z-20"><span className="text-[10.5px] font-black text-slate-800 uppercase tracking-widest">Gấu mập</span></div>
                                    </button>

                                    <button onClick={() => onStyleChange({ header: 'rabbit', button: 'rabbit' })} className={`relative overflow-hidden w-full h-[70px] sm:h-24 rounded-xl border-2 transition-all group  ${appStyles.header === 'rabbit' ? 'border-primary-500 ring-4 ring-primary-500/20 shadow-md' : 'border-slate-200 hover:border-slate-300'}`}>
                                        <div className="absolute inset-x-0 top-0 bottom-6 sm:inset-x-2 sm:top-4 sm:bottom-2 transform scale-[0.6] sm:scale-100 origin-center pointer-events-none -translate-y-2 sm:translate-y-0"><div className="absolute inset-0 sm:inset-x-0 sm:top-0 sm:bottom-0 bg-pink-50 border-[2px] border-pink-400 rounded-lg flex items-center justify-center">
                                        </div>
                                        <div className="absolute top-2 left-6 w-1 h-6 bg-pink-600 shadow-[inset_1px_0_2px_rgba(0,0,0,0.3)]"></div><div className="absolute top-2 right-6 w-1 h-6 bg-pink-600 shadow-[inset_1px_0_2px_rgba(0,0,0,0.3)]"></div>
                                        </div><div className="absolute inset-x-0 bottom-0 py-0.5 bg-white/95 backdrop-blur border-t border-white/50 flex justify-center items-center z-20"><span className="text-[10.5px] font-black text-slate-800 uppercase tracking-widest">Thỏ trắng</span></div>
                                    </button>

                                    <button onClick={() => onStyleChange({ header: 'bee', button: 'bee' })} className={`relative overflow-hidden w-full h-[70px] sm:h-24 rounded-xl border-2 transition-all group  ${appStyles.header === 'bee' ? 'border-primary-500 ring-4 ring-primary-500/20 shadow-md' : 'border-slate-200 hover:border-slate-300'}`}>
                                        <div className="absolute inset-x-0 top-0 bottom-6 sm:inset-x-2 sm:top-4 sm:bottom-2 transform scale-[0.6] sm:scale-100 origin-center pointer-events-none -translate-y-2 sm:translate-y-0"><div className="absolute inset-0 sm:inset-x-0 sm:top-0 sm:bottom-0 bg-yellow-200 border-[2px] border-yellow-600 rounded-lg flex items-center justify-center">
                                            <div className="absolute -top-2 left-1/2 -translate-x-2 w-0.5 h-4 bg-slate-800 rotate-[-30deg]"></div><div className="absolute -top-2 left-1/2 translate-x-1 w-0.5 h-4 bg-slate-800 rotate-[30deg]"></div>
                                            <div className="absolute left-[30%] top-0 bottom-0 w-2 bg-slate-800 opacity-20"></div><div className="absolute left-[70%] top-0 bottom-0 w-2 bg-slate-800 opacity-20"></div>
                                        </div>
                                        <div className="absolute top-2 left-6 w-1 h-6 bg-yellow-800 shadow-[inset_1px_0_2px_rgba(0,0,0,0.3)]"></div><div className="absolute top-2 right-6 w-1 h-6 bg-yellow-800 shadow-[inset_1px_0_2px_rgba(0,0,0,0.3)]"></div>
                                        </div><div className="absolute inset-x-0 bottom-0 py-0.5 bg-white/95 backdrop-blur border-t border-white/50 flex justify-center items-center z-20"><span className="text-[10.5px] font-black text-slate-800 uppercase tracking-widest">Ong mật</span></div>
                                    </button>

                                    <button onClick={() => onStyleChange({ header: 'whale', button: 'whale' })} className={`relative overflow-hidden w-full h-[70px] sm:h-24 rounded-xl border-2 transition-all group  ${appStyles.header === 'whale' ? 'border-primary-500 ring-4 ring-primary-500/20 shadow-md' : 'border-slate-200 hover:border-slate-300'}`}>
                                        <div className="absolute inset-x-0 top-0 bottom-6 sm:inset-x-2 sm:top-4 sm:bottom-2 transform scale-[0.6] sm:scale-100 origin-center pointer-events-none -translate-y-2 sm:translate-y-0"><div className="absolute inset-0 sm:inset-x-0 sm:top-0 sm:bottom-0 bg-sky-100 border-[2px] border-sky-500 rounded-lg flex items-center justify-center">
                                            <div className="absolute -top-4 left-1/2 -translate-x-1/2 flex flex-col items-center"><div className="w-1.5 h-2 bg-sky-500 rounded-t-full"></div><div className="w-10 h-2 bg-sky-400 rounded-t-full"></div></div>
                                            <div className="absolute top-1 flex gap-4"><div className="w-1.5 h-1.5 rounded-full bg-blue-900"></div><div className="w-1.5 h-1.5 rounded-full bg-blue-900"></div></div>
                                        </div>
                                        <div className="absolute top-2 left-6 w-1 h-6 bg-sky-700 shadow-[inset_1px_0_2px_rgba(0,0,0,0.3)]"></div><div className="absolute top-2 right-6 w-1 h-6 bg-sky-700 shadow-[inset_1px_0_2px_rgba(0,0,0,0.3)]"></div>
                                        </div><div className="absolute inset-x-0 bottom-0 py-0.5 bg-white/95 backdrop-blur border-t border-white/50 flex justify-center items-center z-20"><span className="text-[10.5px] font-black text-slate-800 uppercase tracking-widest">Cá voi</span></div>
                                    </button>

                                </>
                            )}
                            {activeTab === 'userBubble' && (
                                <>
                                    <button onClick={() => onStyleChange({ userBubble: 'default' })} className={`relative overflow-hidden w-full h-[70px] sm:h-24 rounded-xl border-2 transition-all group ${appStyles.userBubble === 'default' ? 'border-primary-500 ring-4 ring-primary-500/20 shadow-md' : 'border-slate-200 hover:border-slate-300'}`}>
                                        <div className="absolute inset-x-0 top-0 bottom-6 flex items-center justify-center bg-slate-50 overflow-hidden">
                                            {renderBubblePreview('default', true)}
                                        </div>
                                        <div className="absolute inset-x-0 bottom-0 py-0.5 bg-white border-t border-slate-100 flex justify-center items-center"><span className="text-[10.5px] font-black text-slate-800 uppercase tracking-widest">Mặc định</span></div>
                                    </button>
                                    <button onClick={() => onStyleChange({ userBubble: 'frog' })} className={`relative overflow-hidden w-full h-[70px] sm:h-24 rounded-xl border-2 transition-all group ${appStyles.userBubble === 'frog' ? 'border-primary-500 ring-4 ring-primary-500/20 shadow-md' : 'border-slate-200 hover:border-slate-300'}`}>
                                        <div className="absolute inset-x-0 top-0 bottom-6 flex items-center justify-center bg-slate-50 overflow-hidden">
                                            {renderBubblePreview('frog', true)}
                                        </div>
                                        <div className="absolute inset-x-0 bottom-0 py-0.5 bg-white border-t border-slate-100 flex justify-center items-center"><span className="text-[10.5px] font-black text-slate-800 uppercase tracking-widest">Ếch xanh</span></div>
                                    </button>
                                    <button onClick={() => onStyleChange({ userBubble: 'cat' })} className={`relative overflow-hidden w-full h-[70px] sm:h-24 rounded-xl border-2 transition-all group ${appStyles.userBubble === 'cat' ? 'border-primary-500 ring-4 ring-primary-500/20 shadow-md' : 'border-slate-200 hover:border-slate-300'}`}>
                                        <div className="absolute inset-x-0 top-0 bottom-6 flex items-center justify-center bg-slate-50 overflow-hidden">
                                            {renderBubblePreview('cat', true)}
                                        </div>
                                        <div className="absolute inset-x-0 bottom-0 py-0.5 bg-white border-t border-slate-100 flex justify-center items-center"><span className="text-[10.5px] font-black text-slate-800 uppercase tracking-widest">Mèo vàng</span></div>
                                    </button>
                                    <button onClick={() => onStyleChange({ userBubble: 'dog' })} className={`relative overflow-hidden w-full h-[70px] sm:h-24 rounded-xl border-2 transition-all group ${appStyles.userBubble === 'dog' ? 'border-primary-500 ring-4 ring-primary-500/20 shadow-md' : 'border-slate-200 hover:border-slate-300'}`}>
                                        <div className="absolute inset-x-0 top-0 bottom-6 flex items-center justify-center bg-slate-50 overflow-hidden">
                                            {renderBubblePreview('dog', true)}
                                        </div>
                                        <div className="absolute inset-x-0 bottom-0 py-0.5 bg-white border-t border-slate-100 flex justify-center items-center"><span className="text-[10.5px] font-black text-slate-800 uppercase tracking-widest">Cún con</span></div>
                                    </button>
                                    <button onClick={() => onStyleChange({ userBubble: 'penguin' })} className={`relative overflow-hidden w-full h-[70px] sm:h-24 rounded-xl border-2 transition-all group ${appStyles.userBubble === 'penguin' ? 'border-primary-500 ring-4 ring-primary-500/20 shadow-md' : 'border-slate-200 hover:border-slate-300'}`}>
                                        <div className="absolute inset-x-0 top-0 bottom-6 flex items-center justify-center bg-slate-50 overflow-hidden">
                                            {renderBubblePreview('penguin', true)}
                                        </div>
                                        <div className="absolute inset-x-0 bottom-0 py-0.5 bg-white border-t border-slate-100 flex justify-center items-center"><span className="text-[10.5px] font-black text-slate-800 uppercase tracking-widest">Cánh cụt</span></div>
                                    </button>
                                    <button onClick={() => onStyleChange({ userBubble: 'bear' })} className={`relative overflow-hidden w-full h-[70px] sm:h-24 rounded-xl border-2 transition-all group ${appStyles.userBubble === 'bear' ? 'border-primary-500 ring-4 ring-primary-500/20 shadow-md' : 'border-slate-200 hover:border-slate-300'}`}>
                                        <div className="absolute inset-x-0 top-0 bottom-6 flex items-center justify-center bg-slate-50 overflow-hidden">
                                            {renderBubblePreview('bear', true)}
                                        </div>
                                        <div className="absolute inset-x-0 bottom-0 py-0.5 bg-white border-t border-slate-100 flex justify-center items-center"><span className="text-[10.5px] font-black text-slate-800 uppercase tracking-widest">Gấu nâu</span></div>
                                    </button>
                                    <button onClick={() => onStyleChange({ userBubble: 'rabbit' })} className={`relative overflow-hidden w-full h-[70px] sm:h-24 rounded-xl border-2 transition-all group ${appStyles.userBubble === 'rabbit' ? 'border-primary-500 ring-4 ring-primary-500/20 shadow-md' : 'border-slate-200 hover:border-slate-300'}`}>
                                        <div className="absolute inset-x-0 top-0 bottom-6 flex items-center justify-center bg-slate-50 overflow-hidden">
                                            {renderBubblePreview('rabbit', true)}
                                        </div>
                                        <div className="absolute inset-x-0 bottom-0 py-0.5 bg-white border-t border-slate-100 flex justify-center items-center"><span className="text-[10.5px] font-black text-slate-800 uppercase tracking-widest">Thỏ trắng</span></div>
                                    </button>
                                    <button onClick={() => onStyleChange({ userBubble: 'koala' })} className={`relative overflow-hidden w-full h-[70px] sm:h-24 rounded-xl border-2 transition-all group ${appStyles.userBubble === 'koala' ? 'border-primary-500 ring-4 ring-primary-500/20 shadow-md' : 'border-slate-200 hover:border-slate-300'}`}>
                                        <div className="absolute inset-x-0 top-0 bottom-6 flex items-center justify-center bg-slate-50 overflow-hidden">
                                            {renderBubblePreview('koala', true)}
                                        </div>
                                        <div className="absolute inset-x-0 bottom-0 py-0.5 bg-white border-t border-slate-100 flex justify-center items-center"><span className="text-[10.5px] font-black text-slate-800 uppercase tracking-widest">Gấu koala</span></div>
                                    </button>
                                    <button onClick={() => onStyleChange({ userBubble: 'duck' })} className={`relative overflow-hidden w-full h-[70px] sm:h-24 rounded-xl border-2 transition-all group ${appStyles.userBubble === 'duck' ? 'border-primary-500 ring-4 ring-primary-500/20 shadow-md' : 'border-slate-200 hover:border-slate-300'}`}>
                                        <div className="absolute inset-x-0 top-0 bottom-6 flex items-center justify-center bg-slate-50 overflow-hidden">
                                            {renderBubblePreview('duck', true)}
                                        </div>
                                        <div className="absolute inset-x-0 bottom-0 py-0.5 bg-white border-t border-slate-100 flex justify-center items-center"><span className="text-[10.5px] font-black text-slate-800 uppercase tracking-widest">Vịt con</span></div>
                                    </button>
                                    <button onClick={() => onStyleChange({ userBubble: 'capybara' })} className={`relative overflow-hidden w-full h-[70px] sm:h-24 rounded-xl border-2 transition-all group ${appStyles.userBubble === 'capybara' ? 'border-primary-500 ring-4 ring-primary-500/20 shadow-md' : 'border-slate-200 hover:border-slate-300'}`}>
                                        <div className="absolute inset-x-0 top-0 bottom-6 flex items-center justify-center bg-slate-50 overflow-hidden">
                                            {renderBubblePreview('capybara', true)}
                                        </div>
                                        <div className="absolute inset-x-0 bottom-0 py-0.5 bg-white border-t border-slate-100 flex justify-center items-center"><span className="text-[10.5px] font-black text-slate-800 uppercase tracking-widest">Capybara</span></div>
                                    </button>
                                    <button onClick={() => onStyleChange({ userBubble: 'robot' })} className={`relative overflow-hidden w-full h-[70px] sm:h-24 rounded-xl border-2 transition-all group ${appStyles.userBubble === 'robot' ? 'border-primary-500 ring-4 ring-primary-500/20 shadow-md' : 'border-slate-200 hover:border-slate-300'}`}>
                                        <div className="absolute inset-x-0 top-0 bottom-6 flex items-center justify-center bg-slate-50 overflow-hidden">
                                            {renderBubblePreview('robot', true)}
                                        </div>
                                        <div className="absolute inset-x-0 bottom-0 py-0.5 bg-white border-t border-slate-100 flex justify-center items-center"><span className="text-[10.5px] font-black text-slate-800 uppercase tracking-widest">Robot</span></div>
                                    </button>
                                    <button onClick={() => onStyleChange({ userBubble: 'alien' })} className={`relative overflow-hidden w-full h-[70px] sm:h-24 rounded-xl border-2 transition-all group ${appStyles.userBubble === 'alien' ? 'border-primary-500 ring-4 ring-primary-500/20 shadow-md' : 'border-slate-200 hover:border-slate-300'}`}>
                                        <div className="absolute inset-x-0 top-0 bottom-6 flex items-center justify-center bg-slate-50 overflow-hidden">
                                            {renderBubblePreview('alien', true)}
                                        </div>
                                        <div className="absolute inset-x-0 bottom-0 py-0.5 bg-white border-t border-slate-100 flex justify-center items-center"><span className="text-[10.5px] font-black text-slate-800 uppercase tracking-widest">Người ngoài hành tinh</span></div>
                                    </button>
                                    <button onClick={() => onStyleChange({ userBubble: 'dinosaur' })} className={`relative overflow-hidden w-full h-[70px] sm:h-24 rounded-xl border-2 transition-all group ${appStyles.userBubble === 'dinosaur' ? 'border-primary-500 ring-4 ring-primary-500/20 shadow-md' : 'border-slate-200 hover:border-slate-300'}`}>
                                        <div className="absolute inset-x-0 top-0 bottom-6 flex items-center justify-center bg-slate-50 overflow-hidden">
                                            {renderBubblePreview('dinosaur', true)}
                                        </div>
                                        <div className="absolute inset-x-0 bottom-0 py-0.5 bg-white border-t border-slate-100 flex justify-center items-center"><span className="text-[10.5px] font-black text-slate-800 uppercase tracking-widest">Khủng long</span></div>
                                    </button>
                                    <button onClick={() => onStyleChange({ userBubble: 'unicorn' })} className={`relative overflow-hidden w-full h-[70px] sm:h-24 rounded-xl border-2 transition-all group ${appStyles.userBubble === 'unicorn' ? 'border-primary-500 ring-4 ring-primary-500/20 shadow-md' : 'border-slate-200 hover:border-slate-300'}`}>
                                        <div className="absolute inset-x-0 top-0 bottom-6 flex items-center justify-center bg-slate-50 overflow-hidden">
                                            {renderBubblePreview('unicorn', true)}
                                        </div>
                                        <div className="absolute inset-x-0 bottom-0 py-0.5 bg-white border-t border-slate-100 flex justify-center items-center"><span className="text-[10.5px] font-black text-slate-800 uppercase tracking-widest">Kỳ lân</span></div>
                                    </button>
                                    <button onClick={() => onStyleChange({ userBubble: 'ghost' })} className={`relative overflow-hidden w-full h-[70px] sm:h-24 rounded-xl border-2 transition-all group ${appStyles.userBubble === 'ghost' ? 'border-primary-500 ring-4 ring-primary-500/20 shadow-md' : 'border-slate-200 hover:border-slate-300'}`}>
                                        <div className="absolute inset-x-0 top-0 bottom-6 flex items-center justify-center bg-slate-50 overflow-hidden">
                                            {renderBubblePreview('ghost', true)}
                                        </div>
                                        <div className="absolute inset-x-0 bottom-0 py-0.5 bg-white border-t border-slate-100 flex justify-center items-center"><span className="text-[10.5px] font-black text-slate-800 uppercase tracking-widest">Ma nhỏ</span></div>
                                    </button>
                                    <button onClick={() => onStyleChange({ userBubble: 'ninja' })} className={`relative overflow-hidden w-full h-[70px] sm:h-24 rounded-xl border-2 transition-all group ${appStyles.userBubble === 'ninja' ? 'border-primary-500 ring-4 ring-primary-500/20 shadow-md' : 'border-slate-200 hover:border-slate-300'}`}>
                                        <div className="absolute inset-x-0 top-0 bottom-6 flex items-center justify-center bg-slate-50 overflow-hidden">
                                            {renderBubblePreview('ninja', true)}
                                        </div>
                                        <div className="absolute inset-x-0 bottom-0 py-0.5 bg-white border-t border-slate-100 flex justify-center items-center"><span className="text-[10.5px] font-black text-slate-800 uppercase tracking-widest">Ninja</span></div>
                                    </button>
                                    <button onClick={() => onStyleChange({ userBubble: 'dragon' })} className={`relative overflow-hidden w-full h-[70px] sm:h-24 rounded-xl border-2 transition-all group ${appStyles.userBubble === 'dragon' ? 'border-primary-500 ring-4 ring-primary-500/20 shadow-md' : 'border-slate-200 hover:border-slate-300'}`}>
                                        <div className="absolute inset-x-0 top-0 bottom-6 flex items-center justify-center bg-slate-50 overflow-hidden">
                                            {renderBubblePreview('dragon', true)}
                                        </div>
                                        <div className="absolute inset-x-0 bottom-0 py-0.5 bg-white border-t border-slate-100 flex justify-center items-center"><span className="text-[10.5px] font-black text-slate-800 uppercase tracking-widest">Rồng lửa</span></div>
                                    </button>
                                    <button onClick={() => onStyleChange({ userBubble: 'fox' })} className={`relative overflow-hidden w-full h-[70px] sm:h-24 rounded-xl border-2 transition-all group ${appStyles.userBubble === 'fox' ? 'border-primary-500 ring-4 ring-primary-500/20 shadow-md' : 'border-slate-200 hover:border-slate-300'}`}>
                                        <div className="absolute inset-x-0 top-0 bottom-6 flex items-center justify-center bg-slate-50 overflow-hidden">
                                            {renderBubblePreview('fox', true)}
                                        </div>
                                        <div className="absolute inset-x-0 bottom-0 py-0.5 bg-white border-t border-slate-100 flex justify-center items-center"><span className="text-[10.5px] font-black text-slate-800 uppercase tracking-widest">Cáo nhỏ</span></div>
                                    </button>
                                    <button onClick={() => onStyleChange({ userBubble: 'panda' })} className={`relative overflow-hidden w-full h-[70px] sm:h-24 rounded-xl border-2 transition-all group ${appStyles.userBubble === 'panda' ? 'border-primary-500 ring-4 ring-primary-500/20 shadow-md' : 'border-slate-200 hover:border-slate-300'}`}>
                                        <div className="absolute inset-x-0 top-0 bottom-6 flex items-center justify-center bg-slate-50 overflow-hidden">
                                            {renderBubblePreview('panda', true)}
                                        </div>
                                        <div className="absolute inset-x-0 bottom-0 py-0.5 bg-white border-t border-slate-100 flex justify-center items-center"><span className="text-[10.5px] font-black text-slate-800 uppercase tracking-widest">Gấu trúc</span></div>
                                    </button>
                                    <button onClick={() => onStyleChange({ userBubble: 'hamster' })} className={`relative overflow-hidden w-full h-[70px] sm:h-24 rounded-xl border-2 transition-all group ${appStyles.userBubble === 'hamster' ? 'border-primary-500 ring-4 ring-primary-500/20 shadow-md' : 'border-slate-200 hover:border-slate-300'}`}>
                                        <div className="absolute inset-x-0 top-0 bottom-6 flex items-center justify-center bg-slate-50 overflow-hidden">
                                            {renderBubblePreview('hamster', true)}
                                        </div>
                                        <div className="absolute inset-x-0 bottom-0 py-0.5 bg-white border-t border-slate-100 flex justify-center items-center"><span className="text-[10.5px] font-black text-slate-800 uppercase tracking-widest">Chuột Hamster</span></div>
                                    </button>
                                    <button onClick={() => onStyleChange({ userBubble: 'owl' })} className={`relative overflow-hidden w-full h-[70px] sm:h-24 rounded-xl border-2 transition-all group ${appStyles.userBubble === 'owl' ? 'border-primary-500 ring-4 ring-primary-500/20 shadow-md' : 'border-slate-200 hover:border-slate-300'}`}>
                                        <div className="absolute inset-x-0 top-0 bottom-6 flex items-center justify-center bg-slate-50 overflow-hidden">
                                            {renderBubblePreview('owl', true)}
                                        </div>
                                        <div className="absolute inset-x-0 bottom-0 py-0.5 bg-white border-t border-slate-100 flex justify-center items-center"><span className="text-[10.5px] font-black text-slate-800 uppercase tracking-widest">Cú mèo</span></div>
                                    </button>
                                    <button onClick={() => onStyleChange({ userBubble: 'sloth' })} className={`relative overflow-hidden w-full h-[70px] sm:h-24 rounded-xl border-2 transition-all group ${appStyles.userBubble === 'sloth' ? 'border-primary-500 ring-4 ring-primary-500/20 shadow-md' : 'border-slate-200 hover:border-slate-300'}`}>
                                        <div className="absolute inset-x-0 top-0 bottom-6 flex items-center justify-center bg-slate-50 overflow-hidden">
                                            {renderBubblePreview('sloth', true)}
                                        </div>
                                        <div className="absolute inset-x-0 bottom-0 py-0.5 bg-white border-t border-slate-100 flex justify-center items-center"><span className="text-[10.5px] font-black text-slate-800 uppercase tracking-widest">Lười</span></div>
                                    </button>
                                    <button onClick={() => onStyleChange({ userBubble: 'otter' })} className={`relative overflow-hidden w-full h-[70px] sm:h-24 rounded-xl border-2 transition-all group ${appStyles.userBubble === 'otter' ? 'border-primary-500 ring-4 ring-primary-500/20 shadow-md' : 'border-slate-200 hover:border-slate-300'}`}>
                                        <div className="absolute inset-x-0 top-0 bottom-6 flex items-center justify-center bg-slate-50 overflow-hidden">
                                            {renderBubblePreview('otter', true)}
                                        </div>
                                        <div className="absolute inset-x-0 bottom-0 py-0.5 bg-white border-t border-slate-100 flex justify-center items-center"><span className="text-[10.5px] font-black text-slate-800 uppercase tracking-widest">Rái cá</span></div>
                                    </button>
                                    <button onClick={() => onStyleChange({ userBubble: 'turtle' })} className={`relative overflow-hidden w-full h-[70px] sm:h-24 rounded-xl border-2 transition-all group ${appStyles.userBubble === 'turtle' ? 'border-primary-500 ring-4 ring-primary-500/20 shadow-md' : 'border-slate-200 hover:border-slate-300'}`}>
                                        <div className="absolute inset-x-0 top-0 bottom-6 flex items-center justify-center bg-slate-50 overflow-hidden">
                                            {renderBubblePreview('turtle', true)}
                                        </div>
                                        <div className="absolute inset-x-0 bottom-0 py-0.5 bg-white border-t border-slate-100 flex justify-center items-center"><span className="text-[10.5px] font-black text-slate-800 uppercase tracking-widest">Rùa biển</span></div>
                                    </button>
                                    <button onClick={() => onStyleChange({ userBubble: 'bee' })} className={`relative overflow-hidden w-full h-[70px] sm:h-24 rounded-xl border-2 transition-all group ${appStyles.userBubble === 'bee' ? 'border-primary-500 ring-4 ring-primary-500/20 shadow-md' : 'border-slate-200 hover:border-slate-300'}`}>
                                        <div className="absolute inset-x-0 top-0 bottom-6 flex items-center justify-center bg-slate-50 overflow-hidden">
                                            {renderBubblePreview('bee', true)}
                                        </div>
                                        <div className="absolute inset-x-0 bottom-0 py-0.5 bg-white border-t border-slate-100 flex justify-center items-center"><span className="text-[10.5px] font-black text-slate-800 uppercase tracking-widest">Ong mật</span></div>
                                    </button>
                                    <button onClick={() => onStyleChange({ userBubble: 'whale' })} className={`relative overflow-hidden w-full h-[70px] sm:h-24 rounded-xl border-2 transition-all group ${appStyles.userBubble === 'whale' ? 'border-primary-500 ring-4 ring-primary-500/20 shadow-md' : 'border-slate-200 hover:border-slate-300'}`}>
                                        <div className="absolute inset-x-0 top-0 bottom-6 flex items-center justify-center bg-slate-50 overflow-hidden">
                                            {renderBubblePreview('whale', true)}
                                        </div>
                                        <div className="absolute inset-x-0 bottom-0 py-0.5 bg-white border-t border-slate-100 flex justify-center items-center"><span className="text-[10.5px] font-black text-slate-800 uppercase tracking-widest">Cá voi</span></div>
                                    </button>
                                    <button onClick={() => onStyleChange({ userBubble: 'octopus' })} className={`relative overflow-hidden w-full h-[70px] sm:h-24 rounded-xl border-2 transition-all group ${appStyles.userBubble === 'octopus' ? 'border-primary-500 ring-4 ring-primary-500/20 shadow-md' : 'border-slate-200 hover:border-slate-300'}`}>
                                        <div className="absolute inset-x-0 top-0 bottom-6 flex items-center justify-center bg-slate-50 overflow-hidden">
                                            {renderBubblePreview('octopus', true)}
                                        </div>
                                        <div className="absolute inset-x-0 bottom-0 py-0.5 bg-white border-t border-slate-100 flex justify-center items-center"><span className="text-[10.5px] font-black text-slate-800 uppercase tracking-widest">Bạch tuộc</span></div>
                                    </button>
                                </>
                            )}
                            {activeTab === 'aiBubble' && (
                                <>
                                    <button onClick={() => onStyleChange({ aiBubble: 'default' })} className={`relative overflow-hidden w-full h-[70px] sm:h-24 rounded-xl border-2 transition-all group ${appStyles.aiBubble === 'default' ? 'border-primary-500 ring-4 ring-primary-500/20 shadow-md' : 'border-slate-200 hover:border-slate-300'}`}>
                                        <div className="absolute inset-x-0 top-0 bottom-6 flex items-center justify-center bg-slate-50 overflow-hidden">
                                            {renderBubblePreview('default', false)}
                                        </div>
                                        <div className="absolute inset-x-0 bottom-0 py-0.5 bg-white border-t border-slate-100 flex justify-center items-center"><span className="text-[10.5px] font-black text-slate-800 uppercase tracking-widest">Mặc định</span></div>
                                    </button>
                                    <button onClick={() => onStyleChange({ aiBubble: 'frog' })} className={`relative overflow-hidden w-full h-[70px] sm:h-24 rounded-xl border-2 transition-all group ${appStyles.aiBubble === 'frog' ? 'border-primary-500 ring-4 ring-primary-500/20 shadow-md' : 'border-slate-200 hover:border-slate-300'}`}>
                                        <div className="absolute inset-x-0 top-0 bottom-6 flex items-center justify-center bg-slate-50 overflow-hidden">
                                            {renderBubblePreview('frog', false)}
                                        </div>
                                        <div className="absolute inset-x-0 bottom-0 py-0.5 bg-white border-t border-slate-100 flex justify-center items-center"><span className="text-[10.5px] font-black text-slate-800 uppercase tracking-widest">Ếch xanh</span></div>
                                    </button>
                                    <button onClick={() => onStyleChange({ aiBubble: 'cat' })} className={`relative overflow-hidden w-full h-[70px] sm:h-24 rounded-xl border-2 transition-all group ${appStyles.aiBubble === 'cat' ? 'border-primary-500 ring-4 ring-primary-500/20 shadow-md' : 'border-slate-200 hover:border-slate-300'}`}>
                                        <div className="absolute inset-x-0 top-0 bottom-6 flex items-center justify-center bg-slate-50 overflow-hidden">
                                            {renderBubblePreview('cat', false)}
                                        </div>
                                        <div className="absolute inset-x-0 bottom-0 py-0.5 bg-white border-t border-slate-100 flex justify-center items-center"><span className="text-[10.5px] font-black text-slate-800 uppercase tracking-widest">Mèo vàng</span></div>
                                    </button>
                                    <button onClick={() => onStyleChange({ aiBubble: 'dog' })} className={`relative overflow-hidden w-full h-[70px] sm:h-24 rounded-xl border-2 transition-all group ${appStyles.aiBubble === 'dog' ? 'border-primary-500 ring-4 ring-primary-500/20 shadow-md' : 'border-slate-200 hover:border-slate-300'}`}>
                                        <div className="absolute inset-x-0 top-0 bottom-6 flex items-center justify-center bg-slate-50 overflow-hidden">
                                            {renderBubblePreview('dog', false)}
                                        </div>
                                        <div className="absolute inset-x-0 bottom-0 py-0.5 bg-white border-t border-slate-100 flex justify-center items-center"><span className="text-[10.5px] font-black text-slate-800 uppercase tracking-widest">Cún con</span></div>
                                    </button>
                                    <button onClick={() => onStyleChange({ aiBubble: 'penguin' })} className={`relative overflow-hidden w-full h-[70px] sm:h-24 rounded-xl border-2 transition-all group ${appStyles.aiBubble === 'penguin' ? 'border-primary-500 ring-4 ring-primary-500/20 shadow-md' : 'border-slate-200 hover:border-slate-300'}`}>
                                        <div className="absolute inset-x-0 top-0 bottom-6 flex items-center justify-center bg-slate-50 overflow-hidden">
                                            {renderBubblePreview('penguin', false)}
                                        </div>
                                        <div className="absolute inset-x-0 bottom-0 py-0.5 bg-white border-t border-slate-100 flex justify-center items-center"><span className="text-[10.5px] font-black text-slate-800 uppercase tracking-widest">Cánh cụt</span></div>
                                    </button>
                                    <button onClick={() => onStyleChange({ aiBubble: 'bear' })} className={`relative overflow-hidden w-full h-[70px] sm:h-24 rounded-xl border-2 transition-all group ${appStyles.aiBubble === 'bear' ? 'border-primary-500 ring-4 ring-primary-500/20 shadow-md' : 'border-slate-200 hover:border-slate-300'}`}>
                                        <div className="absolute inset-x-0 top-0 bottom-6 flex items-center justify-center bg-slate-50 overflow-hidden">
                                            {renderBubblePreview('bear', false)}
                                        </div>
                                        <div className="absolute inset-x-0 bottom-0 py-0.5 bg-white border-t border-slate-100 flex justify-center items-center"><span className="text-[10.5px] font-black text-slate-800 uppercase tracking-widest">Gấu nâu</span></div>
                                    </button>
                                    <button onClick={() => onStyleChange({ aiBubble: 'rabbit' })} className={`relative overflow-hidden w-full h-[70px] sm:h-24 rounded-xl border-2 transition-all group ${appStyles.aiBubble === 'rabbit' ? 'border-primary-500 ring-4 ring-primary-500/20 shadow-md' : 'border-slate-200 hover:border-slate-300'}`}>
                                        <div className="absolute inset-x-0 top-0 bottom-6 flex items-center justify-center bg-slate-50 overflow-hidden">
                                            {renderBubblePreview('rabbit', false)}
                                        </div>
                                        <div className="absolute inset-x-0 bottom-0 py-0.5 bg-white border-t border-slate-100 flex justify-center items-center"><span className="text-[10.5px] font-black text-slate-800 uppercase tracking-widest">Thỏ trắng</span></div>
                                    </button>
                                    <button onClick={() => onStyleChange({ aiBubble: 'koala' })} className={`relative overflow-hidden w-full h-[70px] sm:h-24 rounded-xl border-2 transition-all group ${appStyles.aiBubble === 'koala' ? 'border-primary-500 ring-4 ring-primary-500/20 shadow-md' : 'border-slate-200 hover:border-slate-300'}`}>
                                        <div className="absolute inset-x-0 top-0 bottom-6 flex items-center justify-center bg-slate-50 overflow-hidden">
                                            {renderBubblePreview('koala', false)}
                                        </div>
                                        <div className="absolute inset-x-0 bottom-0 py-0.5 bg-white border-t border-slate-100 flex justify-center items-center"><span className="text-[10.5px] font-black text-slate-800 uppercase tracking-widest">Gấu koala</span></div>
                                    </button>
                                    <button onClick={() => onStyleChange({ aiBubble: 'duck' })} className={`relative overflow-hidden w-full h-[70px] sm:h-24 rounded-xl border-2 transition-all group ${appStyles.aiBubble === 'duck' ? 'border-primary-500 ring-4 ring-primary-500/20 shadow-md' : 'border-slate-200 hover:border-slate-300'}`}>
                                        <div className="absolute inset-x-0 top-0 bottom-6 flex items-center justify-center bg-slate-50 overflow-hidden">
                                            {renderBubblePreview('duck', false)}
                                        </div>
                                        <div className="absolute inset-x-0 bottom-0 py-0.5 bg-white border-t border-slate-100 flex justify-center items-center"><span className="text-[10.5px] font-black text-slate-800 uppercase tracking-widest">Vịt con</span></div>
                                    </button>
                                    <button onClick={() => onStyleChange({ aiBubble: 'capybara' })} className={`relative overflow-hidden w-full h-[70px] sm:h-24 rounded-xl border-2 transition-all group ${appStyles.aiBubble === 'capybara' ? 'border-primary-500 ring-4 ring-primary-500/20 shadow-md' : 'border-slate-200 hover:border-slate-300'}`}>
                                        <div className="absolute inset-x-0 top-0 bottom-6 flex items-center justify-center bg-slate-50 overflow-hidden">
                                            {renderBubblePreview('capybara', false)}
                                        </div>
                                        <div className="absolute inset-x-0 bottom-0 py-0.5 bg-white border-t border-slate-100 flex justify-center items-center"><span className="text-[10.5px] font-black text-slate-800 uppercase tracking-widest">Capybara</span></div>
                                    </button>
                                    <button onClick={() => onStyleChange({ aiBubble: 'robot' })} className={`relative overflow-hidden w-full h-[70px] sm:h-24 rounded-xl border-2 transition-all group ${appStyles.aiBubble === 'robot' ? 'border-primary-500 ring-4 ring-primary-500/20 shadow-md' : 'border-slate-200 hover:border-slate-300'}`}>
                                        <div className="absolute inset-x-0 top-0 bottom-6 flex items-center justify-center bg-slate-50 overflow-hidden">
                                            {renderBubblePreview('robot', false)}
                                        </div>
                                        <div className="absolute inset-x-0 bottom-0 py-0.5 bg-white border-t border-slate-100 flex justify-center items-center"><span className="text-[10.5px] font-black text-slate-800 uppercase tracking-widest">Robot</span></div>
                                    </button>
                                    <button onClick={() => onStyleChange({ aiBubble: 'alien' })} className={`relative overflow-hidden w-full h-[70px] sm:h-24 rounded-xl border-2 transition-all group ${appStyles.aiBubble === 'alien' ? 'border-primary-500 ring-4 ring-primary-500/20 shadow-md' : 'border-slate-200 hover:border-slate-300'}`}>
                                        <div className="absolute inset-x-0 top-0 bottom-6 flex items-center justify-center bg-slate-50 overflow-hidden">
                                            {renderBubblePreview('alien', false)}
                                        </div>
                                        <div className="absolute inset-x-0 bottom-0 py-0.5 bg-white border-t border-slate-100 flex justify-center items-center"><span className="text-[10.5px] font-black text-slate-800 uppercase tracking-widest">Người ngoài hành tinh</span></div>
                                    </button>
                                    <button onClick={() => onStyleChange({ aiBubble: 'dinosaur' })} className={`relative overflow-hidden w-full h-[70px] sm:h-24 rounded-xl border-2 transition-all group ${appStyles.aiBubble === 'dinosaur' ? 'border-primary-500 ring-4 ring-primary-500/20 shadow-md' : 'border-slate-200 hover:border-slate-300'}`}>
                                        <div className="absolute inset-x-0 top-0 bottom-6 flex items-center justify-center bg-slate-50 overflow-hidden">
                                            {renderBubblePreview('dinosaur', false)}
                                        </div>
                                        <div className="absolute inset-x-0 bottom-0 py-0.5 bg-white border-t border-slate-100 flex justify-center items-center"><span className="text-[10.5px] font-black text-slate-800 uppercase tracking-widest">Khủng long</span></div>
                                    </button>
                                    <button onClick={() => onStyleChange({ aiBubble: 'unicorn' })} className={`relative overflow-hidden w-full h-[70px] sm:h-24 rounded-xl border-2 transition-all group ${appStyles.aiBubble === 'unicorn' ? 'border-primary-500 ring-4 ring-primary-500/20 shadow-md' : 'border-slate-200 hover:border-slate-300'}`}>
                                        <div className="absolute inset-x-0 top-0 bottom-6 flex items-center justify-center bg-slate-50 overflow-hidden">
                                            {renderBubblePreview('unicorn', false)}
                                        </div>
                                        <div className="absolute inset-x-0 bottom-0 py-0.5 bg-white border-t border-slate-100 flex justify-center items-center"><span className="text-[10.5px] font-black text-slate-800 uppercase tracking-widest">Kỳ lân</span></div>
                                    </button>
                                    <button onClick={() => onStyleChange({ aiBubble: 'ghost' })} className={`relative overflow-hidden w-full h-[70px] sm:h-24 rounded-xl border-2 transition-all group ${appStyles.aiBubble === 'ghost' ? 'border-primary-500 ring-4 ring-primary-500/20 shadow-md' : 'border-slate-200 hover:border-slate-300'}`}>
                                        <div className="absolute inset-x-0 top-0 bottom-6 flex items-center justify-center bg-slate-50 overflow-hidden">
                                            {renderBubblePreview('ghost', false)}
                                        </div>
                                        <div className="absolute inset-x-0 bottom-0 py-0.5 bg-white border-t border-slate-100 flex justify-center items-center"><span className="text-[10.5px] font-black text-slate-800 uppercase tracking-widest">Ma nhỏ</span></div>
                                    </button>
                                    <button onClick={() => onStyleChange({ aiBubble: 'ninja' })} className={`relative overflow-hidden w-full h-[70px] sm:h-24 rounded-xl border-2 transition-all group ${appStyles.aiBubble === 'ninja' ? 'border-primary-500 ring-4 ring-primary-500/20 shadow-md' : 'border-slate-200 hover:border-slate-300'}`}>
                                        <div className="absolute inset-x-0 top-0 bottom-6 flex items-center justify-center bg-slate-50 overflow-hidden">
                                            {renderBubblePreview('ninja', false)}
                                        </div>
                                        <div className="absolute inset-x-0 bottom-0 py-0.5 bg-white border-t border-slate-100 flex justify-center items-center"><span className="text-[10.5px] font-black text-slate-800 uppercase tracking-widest">Ninja</span></div>
                                    </button>
                                    <button onClick={() => onStyleChange({ aiBubble: 'dragon' })} className={`relative overflow-hidden w-full h-[70px] sm:h-24 rounded-xl border-2 transition-all group ${appStyles.aiBubble === 'dragon' ? 'border-primary-500 ring-4 ring-primary-500/20 shadow-md' : 'border-slate-200 hover:border-slate-300'}`}>
                                        <div className="absolute inset-x-0 top-0 bottom-6 flex items-center justify-center bg-slate-50 overflow-hidden">
                                            {renderBubblePreview('dragon', false)}
                                        </div>
                                        <div className="absolute inset-x-0 bottom-0 py-0.5 bg-white border-t border-slate-100 flex justify-center items-center"><span className="text-[10.5px] font-black text-slate-800 uppercase tracking-widest">Rồng lửa</span></div>
                                    </button>
                                    <button onClick={() => onStyleChange({ aiBubble: 'fox' })} className={`relative overflow-hidden w-full h-[70px] sm:h-24 rounded-xl border-2 transition-all group ${appStyles.aiBubble === 'fox' ? 'border-primary-500 ring-4 ring-primary-500/20 shadow-md' : 'border-slate-200 hover:border-slate-300'}`}>
                                        <div className="absolute inset-x-0 top-0 bottom-6 flex items-center justify-center bg-slate-50 overflow-hidden">
                                            {renderBubblePreview('fox', false)}
                                        </div>
                                        <div className="absolute inset-x-0 bottom-0 py-0.5 bg-white border-t border-slate-100 flex justify-center items-center"><span className="text-[10.5px] font-black text-slate-800 uppercase tracking-widest">Cáo nhỏ</span></div>
                                    </button>
                                    <button onClick={() => onStyleChange({ aiBubble: 'panda' })} className={`relative overflow-hidden w-full h-[70px] sm:h-24 rounded-xl border-2 transition-all group ${appStyles.aiBubble === 'panda' ? 'border-primary-500 ring-4 ring-primary-500/20 shadow-md' : 'border-slate-200 hover:border-slate-300'}`}>
                                        <div className="absolute inset-x-0 top-0 bottom-6 flex items-center justify-center bg-slate-50 overflow-hidden">
                                            {renderBubblePreview('panda', false)}
                                        </div>
                                        <div className="absolute inset-x-0 bottom-0 py-0.5 bg-white border-t border-slate-100 flex justify-center items-center"><span className="text-[10.5px] font-black text-slate-800 uppercase tracking-widest">Gấu trúc</span></div>
                                    </button>
                                    <button onClick={() => onStyleChange({ aiBubble: 'hamster' })} className={`relative overflow-hidden w-full h-[70px] sm:h-24 rounded-xl border-2 transition-all group ${appStyles.aiBubble === 'hamster' ? 'border-primary-500 ring-4 ring-primary-500/20 shadow-md' : 'border-slate-200 hover:border-slate-300'}`}>
                                        <div className="absolute inset-x-0 top-0 bottom-6 flex items-center justify-center bg-slate-50 overflow-hidden">
                                            {renderBubblePreview('hamster', false)}
                                        </div>
                                        <div className="absolute inset-x-0 bottom-0 py-0.5 bg-white border-t border-slate-100 flex justify-center items-center"><span className="text-[10.5px] font-black text-slate-800 uppercase tracking-widest">Chuột Hamster</span></div>
                                    </button>
                                    <button onClick={() => onStyleChange({ aiBubble: 'owl' })} className={`relative overflow-hidden w-full h-[70px] sm:h-24 rounded-xl border-2 transition-all group ${appStyles.aiBubble === 'owl' ? 'border-primary-500 ring-4 ring-primary-500/20 shadow-md' : 'border-slate-200 hover:border-slate-300'}`}>
                                        <div className="absolute inset-x-0 top-0 bottom-6 flex items-center justify-center bg-slate-50 overflow-hidden">
                                            {renderBubblePreview('owl', false)}
                                        </div>
                                        <div className="absolute inset-x-0 bottom-0 py-0.5 bg-white border-t border-slate-100 flex justify-center items-center"><span className="text-[10.5px] font-black text-slate-800 uppercase tracking-widest">Cú mèo</span></div>
                                    </button>
                                    <button onClick={() => onStyleChange({ aiBubble: 'sloth' })} className={`relative overflow-hidden w-full h-[70px] sm:h-24 rounded-xl border-2 transition-all group ${appStyles.aiBubble === 'sloth' ? 'border-primary-500 ring-4 ring-primary-500/20 shadow-md' : 'border-slate-200 hover:border-slate-300'}`}>
                                        <div className="absolute inset-x-0 top-0 bottom-6 flex items-center justify-center bg-slate-50 overflow-hidden">
                                            {renderBubblePreview('sloth', false)}
                                        </div>
                                        <div className="absolute inset-x-0 bottom-0 py-0.5 bg-white border-t border-slate-100 flex justify-center items-center"><span className="text-[10.5px] font-black text-slate-800 uppercase tracking-widest">Lười</span></div>
                                    </button>
                                    <button onClick={() => onStyleChange({ aiBubble: 'otter' })} className={`relative overflow-hidden w-full h-[70px] sm:h-24 rounded-xl border-2 transition-all group ${appStyles.aiBubble === 'otter' ? 'border-primary-500 ring-4 ring-primary-500/20 shadow-md' : 'border-slate-200 hover:border-slate-300'}`}>
                                        <div className="absolute inset-x-0 top-0 bottom-6 flex items-center justify-center bg-slate-50 overflow-hidden">
                                            {renderBubblePreview('otter', false)}
                                        </div>
                                        <div className="absolute inset-x-0 bottom-0 py-0.5 bg-white border-t border-slate-100 flex justify-center items-center"><span className="text-[10.5px] font-black text-slate-800 uppercase tracking-widest">Rái cá</span></div>
                                    </button>
                                    <button onClick={() => onStyleChange({ aiBubble: 'turtle' })} className={`relative overflow-hidden w-full h-[70px] sm:h-24 rounded-xl border-2 transition-all group ${appStyles.aiBubble === 'turtle' ? 'border-primary-500 ring-4 ring-primary-500/20 shadow-md' : 'border-slate-200 hover:border-slate-300'}`}>
                                        <div className="absolute inset-x-0 top-0 bottom-6 flex items-center justify-center bg-slate-50 overflow-hidden">
                                            {renderBubblePreview('turtle', false)}
                                        </div>
                                        <div className="absolute inset-x-0 bottom-0 py-0.5 bg-white border-t border-slate-100 flex justify-center items-center"><span className="text-[10.5px] font-black text-slate-800 uppercase tracking-widest">Rùa biển</span></div>
                                    </button>
                                    <button onClick={() => onStyleChange({ aiBubble: 'bee' })} className={`relative overflow-hidden w-full h-[70px] sm:h-24 rounded-xl border-2 transition-all group ${appStyles.aiBubble === 'bee' ? 'border-primary-500 ring-4 ring-primary-500/20 shadow-md' : 'border-slate-200 hover:border-slate-300'}`}>
                                        <div className="absolute inset-x-0 top-0 bottom-6 flex items-center justify-center bg-slate-50 overflow-hidden">
                                            {renderBubblePreview('bee', false)}
                                        </div>
                                        <div className="absolute inset-x-0 bottom-0 py-0.5 bg-white border-t border-slate-100 flex justify-center items-center"><span className="text-[10.5px] font-black text-slate-800 uppercase tracking-widest">Ong mật</span></div>
                                    </button>
                                    <button onClick={() => onStyleChange({ aiBubble: 'whale' })} className={`relative overflow-hidden w-full h-[70px] sm:h-24 rounded-xl border-2 transition-all group ${appStyles.aiBubble === 'whale' ? 'border-primary-500 ring-4 ring-primary-500/20 shadow-md' : 'border-slate-200 hover:border-slate-300'}`}>
                                        <div className="absolute inset-x-0 top-0 bottom-6 flex items-center justify-center bg-slate-50 overflow-hidden">
                                            {renderBubblePreview('whale', false)}
                                        </div>
                                        <div className="absolute inset-x-0 bottom-0 py-0.5 bg-white border-t border-slate-100 flex justify-center items-center"><span className="text-[10.5px] font-black text-slate-800 uppercase tracking-widest">Cá voi</span></div>
                                    </button>
                                    <button onClick={() => onStyleChange({ aiBubble: 'octopus' })} className={`relative overflow-hidden w-full h-[70px] sm:h-24 rounded-xl border-2 transition-all group ${appStyles.aiBubble === 'octopus' ? 'border-primary-500 ring-4 ring-primary-500/20 shadow-md' : 'border-slate-200 hover:border-slate-300'}`}>
                                        <div className="absolute inset-x-0 top-0 bottom-6 flex items-center justify-center bg-slate-50 overflow-hidden">
                                            {renderBubblePreview('octopus', false)}
                                        </div>
                                        <div className="absolute inset-x-0 bottom-0 py-0.5 bg-white border-t border-slate-100 flex justify-center items-center"><span className="text-[10.5px] font-black text-slate-800 uppercase tracking-widest">Bạch tuộc</span></div>
                                    </button>
                                </>
                            )}

                        </div>
                    </div>
                </div>
            </div>
        </div>,
        document.body
      )}
    </div>
  );
};

