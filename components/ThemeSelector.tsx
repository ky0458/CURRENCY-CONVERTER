
import React, { useState, useRef, useEffect } from 'react';
import { ThemeColor } from '../types';
import { THEME_COLORS } from '../constants';

interface ThemeSelectorProps {
  currentTheme: ThemeColor;
  onThemeChange: (theme: ThemeColor) => void;
  onBackgroundUpload?: (file: File) => void;
  onRemoveBackground?: () => void;
  currentBackground?: string | null;
}

export const ThemeSelector: React.FC<ThemeSelectorProps> = ({ 
  currentTheme, 
  onThemeChange, 
  onBackgroundUpload,
  onRemoveBackground,
  currentBackground
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

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
          onClick={() => setIsOpen(!isOpen)}
          className={`
            w-10 h-10 rounded-full backdrop-blur-md transition-all duration-300 flex items-center justify-center group border
            ${currentBackground 
                ? 'bg-white/20 hover:bg-white/30 text-white shadow-lg shadow-black/5 border-white/20' 
                : 'bg-white text-primary-600 hover:bg-primary-50 hover:text-primary-700 shadow-md hover:shadow-xl hover:-translate-y-0.5 border-transparent'}
          `}
        >
          <div className="w-6 h-6 rounded-full flex items-center justify-center" style={{ backgroundColor: isPreset ? 'transparent' : currentTheme, color: isPreset ? 'currentColor' : '#fff' }}>
             {isPreset ? (
               <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" 
                className={`w-5 h-5 transition-transform group-hover:rotate-45 duration-500 ${currentBackground ? 'text-white' : ''}`}
                // No inline color needed here, currentColor will pick up text-primary-600
               >
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9.53 16.122a3 3 0 0 0-5.78 1.128 2.25 2.25 0 0 1-2.4 2.245 4.5 4.5 0 0 0 8.4-2.245c0-.399-.078-.78-.22-1.128Zm0 0a15.998 15.998 0 0 0 3.38-3.81m-9 3.81c5.26 0 9.43-6.38 9.43-11.233 0-1.847-1.428-2.618-2.585-1.928-1.157.69-2.015 2.15-2.015 3.35 0 .237-.038.468-.11.685a16.036 16.036 0 0 1-3.722 3.882c-1.257 1.056-2.023 2.189-2.023 3.35 0 1.203.774 2.25 1.95 2.915Z" />
               </svg>
             ) : (
                <div className="w-full h-full rounded-full ring-2 ring-white shadow-sm" style={{ backgroundColor: currentTheme }} />
             )}
          </div>
        </button>

      {isOpen && (
        <div className="fixed right-3 top-[70px] sm:absolute sm:right-0 sm:top-[calc(100%+12px)] bg-white/95 backdrop-blur-2xl rounded-2xl shadow-[0_20px_60px_-15px_rgba(0,0,0,0.15)] border border-white/60 p-4 w-[280px] sm:w-[320px] z-[100] animate-fade-in-up sm:origin-top-right ring-1 ring-black/5">
          
          {/* Section 1: Colors */}
          <div className="mb-5">
            <div className="flex items-center justify-between mb-3 px-1">
                <p className="text-[10px] font-extrabold text-slate-400 uppercase tracking-widest">Màu chủ đạo</p>
                {!isPreset && <span className="text-[10px] bg-slate-100 text-slate-500 px-1.5 py-0.5 rounded font-mono font-bold">{currentTheme}</span>}
            </div>
            
            <div className="grid grid-cols-5 gap-3">
                {THEME_COLORS.map((theme) => (
                <button
                    key={theme.id}
                    onClick={() => onThemeChange(theme.id)}
                    className={`aspect-square rounded-full flex items-center justify-center transition-all hover:scale-110 shadow-sm relative group ${
                    currentTheme === theme.id ? 'ring-2 ring-offset-2 ring-slate-400 scale-110' : 'hover:shadow-md'
                    }`}
                    style={{ backgroundColor: theme.hex }}
                    title={theme.name}
                >
                    {currentTheme === theme.id && (
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={3} stroke="currentColor" className="w-3.5 h-3.5 text-white">
                        <path strokeLinecap="round" strokeLinejoin="round" d="m4.5 12.75 6 6 9-13.5" />
                    </svg>
                    )}
                </button>
                ))}
                
                {/* Custom Color Picker Button */}
                <div className={`relative aspect-square rounded-full flex items-center justify-center cursor-pointer transition-all hover:scale-110 shadow-sm border border-slate-200 bg-white overflow-hidden group ${!isPreset ? 'ring-2 ring-offset-2 ring-slate-400' : ''}`}>
                    <div className="w-full h-full bg-gradient-to-br from-red-400 via-green-400 to-blue-400 opacity-80" />
                    <input 
                        type="color" 
                        className="absolute inset-0 w-[200%] h-[200%] opacity-0 cursor-pointer top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 p-0 m-0"
                        value={isPreset ? '#2563eb' : currentTheme}
                        onChange={handleCustomColor}
                        title="Chọn màu tùy ý"
                    />
                    {!isPreset && (
                        <div className="absolute inset-0 flex items-center justify-center pointer-events-none bg-black/10">
                             <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={3} stroke="currentColor" className="w-3.5 h-3.5 text-white drop-shadow-md">
                                <path strokeLinecap="round" strokeLinejoin="round" d="m4.5 12.75 6 6 9-13.5" />
                            </svg>
                        </div>
                    )}
                     <div className="absolute inset-0 bg-white/20 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none"></div>
                </div>
            </div>
          </div>
          
          <div className="w-full h-px bg-slate-100 mb-4"></div>

          {/* Section 2: Background Image */}
          <div>
             <p className="text-[10px] font-extrabold text-slate-400 uppercase tracking-widest mb-3 px-1">Hình nền ứng dụng</p>
             
             {currentBackground ? (
                 <div className="relative w-full aspect-video rounded-xl overflow-hidden group border border-slate-200 shadow-sm ring-1 ring-black/5">
                     <img src={currentBackground} alt="Current background" className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" />
                     <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2 backdrop-blur-[2px]">
                        <button 
                            onClick={() => fileInputRef.current?.click()}
                            className="p-2 bg-white/20 backdrop-blur-md rounded-full text-white hover:bg-white hover:text-primary-600 transition-colors shadow-lg"
                            title="Thay đổi ảnh"
                        >
                            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-4 h-4">
                                <path strokeLinecap="round" strokeLinejoin="round" d="m2.25 15.75 5.159-5.159a2.25 2.25 0 0 1 3.182 0l5.159 5.159m-1.5-1.5 1.409-1.409a2.25 2.25 0 0 1 3.182 0l2.909 2.909m-18 3.75h16.5a1.5 1.5 0 0 0 1.5-1.5V6a1.5 1.5 0 0 0-1.5-1.5H3.75A1.5 1.5 0 0 0 2.25 6v12a1.5 1.5 0 0 0 1.5 1.5Zm10.5-11.25h.008v.008h-.008V8.25Zm.375 0a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Z" />
                            </svg>
                        </button>
                        <button 
                            onClick={onRemoveBackground}
                            className="p-2 bg-red-500/80 backdrop-blur-md rounded-full text-white hover:bg-red-600 transition-colors shadow-lg"
                            title="Xóa hình nền"
                        >
                             <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-4 h-4">
                                <path strokeLinecap="round" strokeLinejoin="round" d="m14.74 9-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 0 1-2.244 2.077H8.084a2.25 2.25 0 0 1-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 0 0-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 0 1 3.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 0 0-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 0 0-7.5 0" />
                            </svg>
                        </button>
                     </div>
                 </div>
             ) : (
                <button 
                    onClick={() => fileInputRef.current?.click()}
                    className="w-full h-24 rounded-xl border-2 border-dashed border-slate-200 hover:border-primary-400 hover:bg-primary-50 transition-all flex flex-col items-center justify-center gap-2 group cursor-pointer bg-slate-50/50"
                >
                    <div className="w-8 h-8 rounded-full bg-white border border-slate-200 flex items-center justify-center text-slate-400 group-hover:text-primary-500 shadow-sm transition-colors">
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-4 h-4">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75V16.5m-13.5-9L12 3m0 0 4.5 4.5M12 3v13.5" />
                        </svg>
                    </div>
                    <span className="text-xs font-bold text-slate-500 group-hover:text-primary-600">Tải ảnh lên</span>
                </button>
             )}
             
             {/* Hidden Input */}
             <input 
                type="file" 
                ref={fileInputRef}
                accept="image/*"
                className="hidden"
                onChange={handleFileChange}
            />
            {currentBackground && (
                <p className="text-[10px] text-slate-400 italic mt-2 text-center opacity-80">
                    Màu sắc ứng dụng đã được trích xuất tự động.
                </p>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
