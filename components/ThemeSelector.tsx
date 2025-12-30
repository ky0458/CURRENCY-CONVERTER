import React, { useState, useRef, useEffect } from 'react';
import { ThemeColor } from '../types';
import { THEME_COLORS } from '../constants';
import { Tooltip } from './Tooltip';

interface ThemeSelectorProps {
  currentTheme: ThemeColor;
  onThemeChange: (theme: ThemeColor) => void;
}

export const ThemeSelector: React.FC<ThemeSelectorProps> = ({ currentTheme, onThemeChange }) => {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

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

  const isPreset = THEME_COLORS.some(t => t.id === currentTheme);

  return (
    <div className="relative" ref={containerRef}>
      <Tooltip content="Đổi màu chủ đề" position="left">
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="w-9 h-9 rounded-full bg-white text-slate-600 shadow-md hover:shadow-lg hover:scale-105 transition-all flex items-center justify-center border border-slate-200 group"
        >
          <div className="w-5 h-5 rounded-full" style={{ backgroundColor: isPreset ? 'transparent' : currentTheme, color: currentTheme }}>
             {isPreset ? (
               <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-full h-full p-0.5">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9.53 16.122a3 3 0 0 0-5.78 1.128 2.25 2.25 0 0 1-2.4 2.245 4.5 4.5 0 0 0 8.4-2.245c0-.399-.078-.78-.22-1.128Zm0 0a15.998 15.998 0 0 0 3.38-3.81m-9 3.81c5.26 0 9.43-6.38 9.43-11.233 0-1.847-1.428-2.618-2.585-1.928-1.157.69-2.015 2.15-2.015 3.35 0 .237-.038.468-.11.685a16.036 16.036 0 0 1-3.722 3.882c-1.257 1.056-2.023 2.189-2.023 3.35 0 1.203.774 2.25 1.95 2.915Z" />
               </svg>
             ) : (
                <div className="w-full h-full rounded-full ring-1 ring-slate-200" style={{ backgroundColor: currentTheme }} />
             )}
          </div>
        </button>
      </Tooltip>

      {isOpen && (
        <div className="absolute right-0 top-[calc(100%+8px)] bg-white rounded-xl shadow-xl border border-slate-100 p-3 min-w-[200px] z-[100] animate-fade-in-up origin-top-right">
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2 px-1">Màu giao diện</p>
          <div className="grid grid-cols-4 gap-2 mb-3">
            {THEME_COLORS.map((theme) => (
              <button
                key={theme.id}
                onClick={() => {
                  onThemeChange(theme.id);
                  setIsOpen(false);
                }}
                className={`w-8 h-8 rounded-full flex items-center justify-center transition-transform hover:scale-110 ring-2 ring-offset-1 ${
                  currentTheme === theme.id ? 'ring-slate-400 scale-110' : 'ring-transparent'
                }`}
                style={{ backgroundColor: theme.hex }}
                title={theme.name}
              >
                {currentTheme === theme.id && (
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={3} stroke="currentColor" className="w-4 h-4 text-white">
                    <path strokeLinecap="round" strokeLinejoin="round" d="m4.5 12.75 6 6 9-13.5" />
                  </svg>
                )}
              </button>
            ))}
          </div>
          
          <div className="pt-2 border-t border-slate-100">
             <div className="relative w-full h-9 rounded-lg overflow-hidden border border-slate-200 cursor-pointer hover:border-primary-400 transition-colors shadow-sm group bg-slate-50 flex items-center px-2 gap-2">
                <div className="w-5 h-5 rounded-full border border-slate-200 shadow-sm shrink-0" style={{ backgroundColor: isPreset ? '#2563eb' : currentTheme }}></div>
                <span className="text-[10px] font-bold text-slate-500 group-hover:text-primary-600">Tự chọn màu...</span>
                <input 
                    type="color" 
                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                    value={isPreset ? '#2563eb' : currentTheme}
                    onChange={handleCustomColor}
                />
             </div>
          </div>
        </div>
      )}
    </div>
  );
};