
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
                <div className="p-6 overflow-y-auto space-y-8 flex-1">
                    
                    {/* Colors & Background */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
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
                         <div className="flex overflow-x-auto hide-scrollbar gap-2 mb-6 pb-2 border-b border-slate-100">
                             {[
                                 { id: 'header', label: 'Thanh tiêu đề' },
                                 { id: 'button', label: 'Nút thao tác' },
                                 { id: 'userBubble', label: 'Hộp thoại (Bạn)' },
                                 { id: 'aiBubble', label: 'Hộp thoại (AI)' }
                             ].map(tab => (
                                 <button
                                     key={tab.id}
                                     onClick={() => setActiveTab(tab.id as any)}
                                     className={`px-4 py-2 rounded-full text-xs font-bold whitespace-nowrap transition-all ${activeTab === tab.id ? 'bg-primary-500 text-white shadow-md' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}
                                 >
                                     {tab.label}
                                 </button>
                             ))}
                         </div>

                         <div className="grid grid-cols-2 md:grid-cols-4 gap-4 sm:gap-6 pb-4">
                            
                            {/* Header Styles */}
                            {activeTab === 'header' && (
                                <>
                                    <button onClick={() => onStyleChange({ header: 'default' })} className={`relative overflow-hidden w-full h-24 rounded-xl border-2 transition-all ${appStyles.header === 'default' ? 'border-primary-500 ring-4 ring-primary-500/20 shadow-md' : 'border-slate-200 hover:border-slate-300'}`}>
                                        <div className="absolute inset-0 bg-primary-600"></div>
                                        <span className="absolute bottom-1 right-2 text-xs font-bold text-white/90">Mặc định</span>
                                    </button>
                                    <button onClick={() => onStyleChange({ header: 'waves' })} className={`relative overflow-hidden w-full h-24 rounded-xl border-2 transition-all ${appStyles.header === 'waves' ? 'border-primary-500 ring-4 ring-primary-500/20 shadow-md' : 'border-slate-200 hover:border-slate-300'}`}>
                                        <div className="absolute inset-0 bg-gradient-to-r from-primary-500 to-indigo-600"></div>
                                        <svg className="absolute bottom-0 w-full" viewBox="0 0 1440 320" xmlns="http://www.w3.org/2000/svg" preserveAspectRatio="none" style={{height:'40px'}}><path fill="rgba(255,255,255,0.4)" fillOpacity="1" d="M0,192L48,192C96,192,192,192,288,176C384,160,480,128,576,133.3C672,139,768,181,864,197.3C960,213,1056,203,1152,186.7C1248,171,1344,149,1392,138.7L1440,128L1440,320L1392,320C1344,320,1248,320,1152,320C1056,320,960,320,864,320C768,320,672,320,576,320C480,320,384,320,288,320C192,320,96,320,48,320L0,320Z"></path></svg>
                                        <span className="absolute bottom-1 right-2 text-xs font-bold text-white/90">Lượn sóng</span>
                                    </button>
                                    <button onClick={() => onStyleChange({ header: 'clouds' })} className={`relative overflow-hidden w-full h-24 rounded-xl border-2 transition-all ${appStyles.header === 'clouds' ? 'border-primary-500 ring-4 ring-primary-500/20 shadow-md' : 'border-slate-200 hover:border-slate-300'}`}>
                                        <div className="absolute inset-0 bg-sky-400"></div>
                                        <div className="absolute w-8 h-8 bg-white/40 rounded-full -top-2 left-2"></div>
                                        <div className="absolute w-12 h-12 bg-white/40 rounded-full -top-4 left-6"></div>
                                        <div className="absolute w-8 h-8 bg-white/40 rounded-full top-2 left-12"></div>
                                        <span className="absolute bottom-1 right-2 text-xs font-bold text-white/90 drop-shadow-md">Đám mây</span>
                                    </button>
                                    <button onClick={() => onStyleChange({ header: 'sunset' })} className={`relative overflow-hidden w-full h-24 rounded-xl border-2 transition-all ${appStyles.header === 'sunset' ? 'border-primary-500 ring-4 ring-primary-500/20 shadow-md' : 'border-slate-200 hover:border-slate-300'}`}>
                                        <div className="absolute inset-0 bg-gradient-to-b from-orange-400 to-pink-500"></div>
                                        <div className="absolute bottom-[-20%] left-1/2 -translate-x-1/2 w-20 h-20 bg-yellow-300 rounded-full blur-[2px] opacity-80"></div>
                                        <span className="absolute bottom-1 right-2 text-xs font-bold text-white/90 drop-shadow-md">Hoàng hôn</span>
                                    </button>
                                    <button onClick={() => onStyleChange({ header: 'forest' })} className={`relative overflow-hidden w-full h-24 rounded-xl border-2 transition-all ${appStyles.header === 'forest' ? 'border-primary-500 ring-4 ring-primary-500/20 shadow-md' : 'border-slate-200 hover:border-slate-300'}`}>
                                        <div className="absolute inset-0 bg-gradient-to-b from-green-600 to-emerald-800"></div>
                                        <div className="absolute bottom-[-5px] left-2 w-0 h-0 border-l-[10px] border-r-[10px] border-b-[20px] border-transparent border-b-green-700/80"></div>
                                        <div className="absolute bottom-[-2px] left-6 w-0 h-0 border-l-[15px] border-r-[15px] border-b-[30px] border-transparent border-b-green-800"></div>
                                        <span className="absolute bottom-1 right-2 text-xs font-bold text-white/90 drop-shadow-md">Rừng xanh</span>
                                    </button>
                                    <button onClick={() => onStyleChange({ header: 'magic' })} className={`relative overflow-hidden w-full h-24 rounded-xl border-2 transition-all ${appStyles.header === 'magic' ? 'border-primary-500 ring-4 ring-primary-500/20 shadow-md' : 'border-slate-200 hover:border-slate-300'}`}>
                                        <div className="absolute inset-0 bg-gradient-to-r from-violet-600 to-fuchsia-700"></div>
                                        <div className="absolute top-2 left-4 text-xs">✨</div>
                                        <div className="absolute top-6 right-8 text-xs">🌟</div>
                                        <span className="absolute bottom-1 right-2 text-xs font-bold text-white/90 drop-shadow-md">Phép thuật</span>
                                    </button>
                                    <button onClick={() => onStyleChange({ header: 'ocean' })} className={`relative overflow-hidden w-full h-24 rounded-xl border-2 transition-all ${appStyles.header === 'ocean' ? 'border-primary-500 ring-4 ring-primary-500/20 shadow-md' : 'border-slate-200 hover:border-slate-300'}`}>
                                        <div className="absolute inset-0 bg-gradient-to-b from-cyan-500 to-blue-700"></div>
                                        <div className="absolute bottom-2 left-4 w-2 h-2 rounded-full border-2 border-white/50"></div>
                                        <div className="absolute top-1/2 right-6 w-6 h-3 bg-blue-300/30 rounded-[100%] rotate-12"></div>
                                        <span className="absolute bottom-1 right-2 text-xs font-bold text-white/90 drop-shadow-md">Đại dương</span>
                                    </button>
                                    <button onClick={() => onStyleChange({ header: 'space' })} className={`relative overflow-hidden w-full h-24 rounded-xl border-2 transition-all ${appStyles.header === 'space' ? 'border-primary-500 ring-4 ring-primary-500/20 shadow-md' : 'border-slate-200 hover:border-slate-300'}`}>
                                        <div className="absolute inset-0 bg-gradient-to-b from-slate-900 to-indigo-950"></div>
                                        <div className="absolute top-3 left-4 w-1.5 h-1.5 bg-white rounded-full shadow-[0_0_4px_#fff]"></div>
                                        <div className="absolute top-4 right-6 w-8 h-8 rounded-full bg-gradient-to-br from-orange-400 to-red-600 opacity-80 flex items-center justify-center rotate-12">
                                           <div className="w-[120%] h-1 bg-white/30 rounded-full transform -rotate-12 blur-[1px]"></div>
                                        </div>
                                        <span className="absolute bottom-1 right-2 text-xs font-bold text-white/90 drop-shadow-md">Vũ trụ</span>
                                    </button>
                                    <button onClick={() => onStyleChange({ header: 'frog' })} className={`relative overflow-hidden w-full h-24 rounded-xl border-2 transition-all ${appStyles.header === 'frog' ? 'border-primary-500 ring-4 ring-primary-500/20 shadow-md' : 'border-slate-200 hover:border-slate-300'}`}>
                                        <div className="absolute inset-0 bg-[#14532d]"></div>
                                        <div className="absolute top-2 left-6 w-6 h-6 rounded-full bg-[#14532d] border-2 border-white shadow-sm flex items-center justify-center z-10">
                                            <div className="w-4 h-4 bg-white rounded-full flex items-end justify-center"><div className="w-2 h-2 bg-slate-900 rounded-full mb-0.5 ml-1"></div></div>
                                        </div>
                                        <div className="absolute top-2 right-6 w-6 h-6 rounded-full bg-[#14532d] border-2 border-white shadow-sm flex items-center justify-center z-10">
                                            <div className="w-4 h-4 bg-white rounded-full flex items-end justify-center"><div className="w-2 h-2 bg-slate-900 rounded-full mb-0.5 -ml-1"></div></div>
                                        </div>
                                        <div className="absolute bottom-[-10px] left-1/2 -translate-x-1/2 w-[80%] h-12 bg-gradient-to-t from-[#65a30d] to-[#84cc16] border-t-[4px] border-[#4d7c0f] rounded-t-full opacity-90 shadow-[inset_0_2px_4px_rgba(0,0,0,0.1)]"></div>
                                        <div className="absolute top-[40%] left-1/2 -translate-x-1/2 w-12 h-6 border-b-[4px] border-[#022c22] rounded-b-full opacity-85"></div>
                                        <div className="absolute top-[30%] left-[10%] w-8 h-4 bg-pink-500/40 rounded-full blur-md"></div>
                                        <div className="absolute top-[30%] right-[10%] w-8 h-4 bg-pink-500/40 rounded-full blur-md"></div>
                                        <span className="absolute bottom-1 right-2 text-xs font-bold text-white/90 drop-shadow-md z-20">Ếch xanh</span>
                                    </button>
                                    <button onClick={() => onStyleChange({ header: 'cat' })} className={`relative overflow-hidden w-full h-24 rounded-xl border-2 transition-all ${appStyles.header === 'cat' ? 'border-primary-500 ring-4 ring-primary-500/20 shadow-md' : 'border-slate-200 hover:border-slate-300'}`}>
                                        <div className="absolute inset-0 bg-[#FDBA74]"></div>
                                        <div className="absolute top-0 left-6 w-4 h-6 bg-[#f97316] rotate-[-20deg] [clip-path:polygon(50%_0%,0%_100%,100%_100%)]"></div>
                                        <div className="absolute top-0 right-6 w-4 h-6 bg-[#f97316] rotate-[20deg] [clip-path:polygon(50%_0%,0%_100%,100%_100%)]"></div>
                                        <div className="absolute top-[40%] left-1/2 -translate-x-1/2 w-4 h-2 bg-[#ea580c] rounded-full opacity-80"></div>
                                        <div className="absolute top-[50%] left-1/2 -translate-x-1/2 flex gap-0.5 opacity-60">
                                            <div className="w-6 h-6 rounded-full border-b-[4px] border-r-[4px] border-[#ea580c] rotate-45"></div>
                                            <div className="w-6 h-6 rounded-full border-b-[4px] border-l-[4px] border-[#ea580c] rotate-[-45deg]"></div>
                                        </div>
                                        <div className="absolute top-[30%] left-[10%] w-10 h-5 bg-pink-400/40 rounded-full blur-md"></div>
                                        <div className="absolute top-[30%] right-[10%] w-10 h-5 bg-pink-400/40 rounded-full blur-md"></div>
                                        <span className="absolute bottom-1 right-2 text-xs font-bold text-white/90 drop-shadow-md z-10">Mèo vàng</span>
                                    </button>
                                    <button onClick={() => onStyleChange({ header: 'panda' })} className={`relative overflow-hidden w-full h-24 rounded-xl border-2 transition-all ${appStyles.header === 'panda' ? 'border-primary-500 ring-4 ring-primary-500/20 shadow-md' : 'border-slate-200 hover:border-slate-300'}`}>
                                        <div className="absolute inset-0 bg-zinc-800"></div>
                                        <div className="absolute top-1 left-4 w-6 h-6 rounded-full bg-black"></div>
                                        <div className="absolute top-1 right-4 w-6 h-6 rounded-full bg-black"></div>
                                        <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-[80%] h-[70%] bg-white rounded-t-full opacity-30"></div>
                                        <div className="absolute top-[20%] left-[20%] w-10 h-8 bg-zinc-900 rounded-full blur-[2px]"></div>
                                        <div className="absolute top-[20%] right-[20%] w-10 h-8 bg-zinc-900 rounded-full blur-[2px]"></div>
                                        <span className="absolute bottom-1 right-2 text-xs font-bold text-white/90 drop-shadow-md z-10">Gấu trúc</span>
                                    </button>
                                    <button onClick={() => onStyleChange({ header: 'fox' })} className={`relative overflow-hidden w-full h-24 rounded-xl border-2 transition-all ${appStyles.header === 'fox' ? 'border-primary-500 ring-4 ring-primary-500/20 shadow-md' : 'border-slate-200 hover:border-slate-300'}`}>
                                        <div className="absolute inset-0 bg-[#F97316]"></div>
                                        <div className="absolute top-0 left-4 w-5 h-6 bg-[#C2410C] rotate-[-15deg] [clip-path:polygon(50%_0%,0%_100%,100%_100%)]"></div>
                                        <div className="absolute top-0 right-4 w-5 h-6 bg-[#C2410C] rotate-[15deg] [clip-path:polygon(50%_0%,0%_100%,100%_100%)]"></div>
                                        <div className="absolute bottom-0 left-0 w-[40%] h-[80%] bg-white rounded-tr-full opacity-30"></div>
                                        <div className="absolute bottom-0 right-0 w-[40%] h-[80%] bg-white rounded-tl-full opacity-30"></div>
                                        <span className="absolute bottom-1 right-2 text-xs font-bold text-white/90 drop-shadow-md z-10">Cáo</span>
                                    </button>
                                    <button onClick={() => onStyleChange({ header: 'dragon' })} className={`relative overflow-hidden w-full h-24 rounded-xl border-2 transition-all ${appStyles.header === 'dragon' ? 'border-primary-500 ring-4 ring-primary-500/20 shadow-md' : 'border-slate-200 hover:border-slate-300'}`}>
                                        <div className="absolute inset-0 bg-red-600"></div>
                                        <div className="absolute top-2 left-4 w-3 h-6 bg-red-700 rotate-[-30deg] [clip-path:polygon(50%_0%,10%_100%,90%_100%)]"></div>
                                        <div className="absolute top-1 left-8 w-3 h-8 bg-red-700 rotate-[-15deg] [clip-path:polygon(50%_0%,10%_100%,90%_100%)]"></div>
                                        <div className="absolute top-2 right-4 w-3 h-6 bg-red-700 rotate-[30deg] [clip-path:polygon(50%_0%,10%_100%,90%_100%)]"></div>
                                        <div className="absolute top-1 right-8 w-3 h-8 bg-red-700 rotate-[15deg] [clip-path:polygon(50%_0%,10%_100%,90%_100%)]"></div>
                                        <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-[80%] h-1/2 bg-yellow-500 rounded-t-full opacity-30"></div>
                                        <span className="absolute bottom-1 right-2 text-xs font-bold text-white/90 drop-shadow-md z-10">Rồng</span>
                                    </button>
                                    <button onClick={() => onStyleChange({ header: 'penguin' })} className={`relative overflow-hidden w-full h-24 rounded-xl border-2 transition-all ${appStyles.header === 'penguin' ? 'border-primary-500 ring-4 ring-primary-500/20 shadow-md' : 'border-slate-200 hover:border-slate-300'}`}>
                                        <div className="absolute inset-0 bg-blue-400"></div>
                                        <div className="absolute bottom-[-10px] left-1/2 -translate-x-1/2 w-16 h-12 bg-white rounded-t-[100%] opacity-90"></div>
                                        <div className="absolute top-[30%] left-[30%] w-3 h-3 bg-blue-900 rounded-full"></div>
                                        <div className="absolute top-[30%] right-[30%] w-3 h-3 bg-blue-900 rounded-full"></div>
                                        <div className="absolute top-[45%] left-1/2 -translate-x-1/2 w-6 h-4 bg-amber-400 rounded-b-full rounded-t-sm shadow-sm border border-amber-500"></div>
                                        <span className="absolute bottom-1 right-2 text-xs font-bold text-white/90 drop-shadow-md z-10">Cánh cụt</span>
                                    </button>
                                    <button onClick={() => onStyleChange({ header: 'bear' })} className={`relative overflow-hidden w-full h-24 rounded-xl border-2 transition-all ${appStyles.header === 'bear' ? 'border-primary-500 ring-4 ring-primary-500/20 shadow-md' : 'border-slate-200 hover:border-slate-300'}`}>
                                        <div className="absolute inset-0 bg-amber-700"></div>
                                        <div className="absolute top-2 left-4 w-6 h-6 rounded-full bg-amber-800"></div>
                                        <div className="absolute top-2 right-4 w-6 h-6 rounded-full bg-amber-800"></div>
                                        <div className="absolute bottom-[-10px] left-1/2 -translate-x-1/2 w-16 h-12 bg-amber-200 rounded-t-full border-t-4 border-amber-800 opacity-90"></div>
                                        <div className="absolute top-[50%] left-1/2 -translate-x-1/2 w-4 h-2 bg-amber-900 rounded-[100%] shadow-sm"></div>
                                        <span className="absolute bottom-1 right-2 text-xs font-bold text-white/90 drop-shadow-md z-10">Gấu nâu</span>
                                    </button>
                                    <button onClick={() => onStyleChange({ header: 'rabbit' })} className={`relative overflow-hidden w-full h-24 rounded-xl border-2 transition-all ${appStyles.header === 'rabbit' ? 'border-primary-500 ring-4 ring-primary-500/20 shadow-md' : 'border-slate-200 hover:border-slate-300'}`}>
                                        <div className="absolute inset-0 bg-pink-400"></div>
                                        <div className="absolute -top-2 left-6 w-4 h-10 bg-pink-200 border-2 border-pink-500 rounded-full rotate-[-15deg]"></div>
                                        <div className="absolute -top-2 right-6 w-4 h-10 bg-pink-200 border-2 border-pink-500 rounded-full rotate-[15deg]"></div>
                                        <div className="absolute bottom-[-10px] left-1/2 -translate-x-1/2 w-12 h-8 bg-white rounded-t-full opacity-30"></div>
                                        <div className="absolute top-[40%] left-[20%] w-6 h-4 bg-pink-200/50 rounded-full blur-md"></div>
                                        <div className="absolute top-[40%] right-[20%] w-6 h-4 bg-pink-200/50 rounded-full blur-md"></div>
                                        <span className="absolute bottom-1 right-2 text-xs font-bold text-white/90 drop-shadow-md z-10">Thỏ hồng</span>
                                    </button>
                                    <button onClick={() => onStyleChange({ header: 'bee' })} className={`relative overflow-hidden w-full h-24 rounded-xl border-2 transition-all ${appStyles.header === 'bee' ? 'border-primary-500 ring-4 ring-primary-500/20 shadow-md' : 'border-slate-200 hover:border-slate-300'}`}>
                                        <div className="absolute inset-0 bg-yellow-400"></div>
                                        <div className="absolute top-4 w-full h-4 bg-zinc-800/80"></div>
                                        <div className="absolute bottom-4 w-full h-4 bg-zinc-800/80"></div>
                                        <div className="absolute top-1 left-[15%] w-6 h-4 bg-white/40 rounded-full backdrop-blur-sm rotate-[-20deg]"></div>
                                        <div className="absolute top-1 right-[15%] w-6 h-4 bg-white/40 rounded-full backdrop-blur-sm rotate-[20deg]"></div>
                                        <span className="absolute bottom-1 right-2 text-xs font-bold text-slate-800 drop-shadow-md z-10">Ong vàng</span>
                                    </button>
                                    <button onClick={() => onStyleChange({ header: 'whale' })} className={`relative overflow-hidden w-full h-24 rounded-xl border-2 transition-all ${appStyles.header === 'whale' ? 'border-primary-500 ring-4 ring-primary-500/20 shadow-md' : 'border-slate-200 hover:border-slate-300'}`}>
                                        <div className="absolute inset-0 bg-sky-500"></div>
                                        <div className="absolute top-2 left-1/2 -translate-x-1/2 w-2 h-8 bg-blue-200/60"></div>
                                        <div className="absolute top-0 left-1/2 -translate-x-3 w-3 h-2 bg-blue-200/60 rounded-full rotate-[-30deg]"></div>
                                        <div className="absolute top-0 left-1/2 translate-x-3 w-3 h-2 bg-blue-200/60 rounded-full rotate-[30deg]"></div>
                                        <div className="absolute bottom-[-10px] left-1/2 -translate-x-1/2 w-[80%] h-12 bg-white rounded-t-full opacity-20"></div>
                                        <span className="absolute bottom-1 right-2 text-xs font-bold text-white/90 drop-shadow-md z-10">Cá voi</span>
                                    </button>
                                </>
                            )}

                            {/* Button Styles */}
                            {activeTab === 'button' && (
                                <>
                                    <button onClick={() => onStyleChange({ button: 'default' })} className={`relative overflow-visible w-full h-24 rounded-xl border-2 transition-all flex items-center justify-center bg-slate-50 ${appStyles.button === 'default' ? 'border-primary-500 ring-4 ring-primary-500/20 shadow-md' : 'border-slate-200 hover:border-slate-300'}`}>
                                        <div className="px-6 py-3 rounded-xl text-white text-[13px] font-bold bg-gradient-to-r from-primary-600 to-primary-800 shadow-sm">Thao tác</div>
                                        <span className="absolute bottom-1 right-2 text-xs font-bold text-slate-400">Mặc định</span>
                                    </button>
                                    <button onClick={() => onStyleChange({ button: '3d' })} className={`relative overflow-visible w-full h-24 rounded-xl border-2 transition-all flex items-center justify-center bg-slate-50 ${appStyles.button === '3d' ? 'border-primary-500 ring-4 ring-primary-500/20 shadow-md' : 'border-slate-200 hover:border-slate-300'}`}>
                                        <div className="px-6 py-3 rounded-xl text-white text-[13px] font-bold bg-primary-600 border-b-4 border-primary-800 -translate-y-0.5" style={{boxShadow: '0 4px 0 0 var(--tw-border-opacity)'}}>Thao tác</div>
                                        <span className="absolute bottom-1 right-2 text-xs font-bold text-slate-400">Nổi 3D</span>
                                    </button>
                                    <button onClick={() => onStyleChange({ button: 'glow' })} className={`relative overflow-visible w-full h-24 rounded-xl border-2 transition-all flex items-center justify-center bg-slate-50 ${appStyles.button === 'glow' ? 'border-primary-500 ring-4 ring-primary-500/20 shadow-md' : 'border-slate-200 hover:border-slate-300'}`}>
                                        <div className="px-6 py-3 rounded-xl text-white text-[13px] font-bold bg-primary-500 shadow-[0_0_15px_rgba(59,130,246,0.5)]">Thao tác</div>
                                        <span className="absolute bottom-1 right-2 text-xs font-bold text-slate-400">Glow</span>
                                    </button>
                                    <button onClick={() => onStyleChange({ button: 'leaf' })} className={`relative overflow-visible w-full h-24 rounded-xl border-2 transition-all flex items-center justify-center bg-slate-50 ${appStyles.button === 'leaf' ? 'border-primary-500 ring-4 ring-primary-500/20 shadow-md' : 'border-slate-200 hover:border-slate-300'}`}>
                                        <div className="px-6 py-3 text-white text-[13px] font-bold bg-green-600 shadow-[0_4px_0_theme(colors.green.800)] rounded-tl-[4px] rounded-br-[4px] rounded-tr-[16px] rounded-bl-[16px] relative">
                                            <div className="absolute -top-1.5 -right-1.5 w-4 h-4 bg-green-500 rotate-45 pointer-events-none"></div>
                                            Thao tác
                                        </div>
                                        <span className="absolute bottom-1 right-2 text-xs font-bold text-slate-400">Chiếc lá</span>
                                    </button>
                                    <button onClick={() => onStyleChange({ button: 'diamond' })} className={`relative overflow-visible w-full h-24 rounded-xl border-2 transition-all flex items-center justify-center bg-slate-50 ${appStyles.button === 'diamond' ? 'border-primary-500 ring-4 ring-primary-500/20 shadow-md' : 'border-slate-200 hover:border-slate-300'}`}>
                                        <div className="px-6 py-3 text-white text-[13px] font-bold bg-cyan-500 shadow-[0_0_10px_theme(colors.cyan.400)] [clip-path:polygon(10%_0,90%_0,100%_50%,90%_100%,10%_100%,0_50%)] relative">
                                            <div className="absolute inset-x-0 top-0 h-1/2 bg-white/20 pointer-events-none"></div>
                                            Thao tác
                                        </div>
                                        <span className="absolute bottom-1 right-2 text-xs font-bold text-slate-400">Kim cương</span>
                                    </button>
                                    <button onClick={() => onStyleChange({ button: 'magic_wand' })} className={`relative overflow-visible w-full h-24 rounded-xl border-2 transition-all flex items-center justify-center bg-slate-50 ${appStyles.button === 'magic_wand' ? 'border-primary-500 ring-4 ring-primary-500/20 shadow-md' : 'border-slate-200 hover:border-slate-300'}`}>
                                        <div className="px-6 py-3 rounded-xl text-white text-[13px] font-bold bg-gradient-to-r from-violet-600 to-fuchsia-600 ring-2 ring-purple-300 ring-offset-1 shadow-sm">
                                            Thao tác
                                        </div>
                                        <span className="absolute bottom-1 right-2 text-xs font-bold text-slate-400">Đũa thần</span>
                                    </button>
                                    <button onClick={() => onStyleChange({ button: 'bubble' })} className={`relative overflow-visible w-full h-24 rounded-xl border-2 transition-all flex items-center justify-center bg-slate-50 ${appStyles.button === 'bubble' ? 'border-primary-500 ring-4 ring-primary-500/20 shadow-md' : 'border-slate-200 hover:border-slate-300'}`}>
                                        <div className="px-6 py-3 rounded-full text-white text-[13px] font-bold bg-sky-400 shadow-[inset_0_-2px_4px_rgba(0,0,0,0.2),_0_4px_8px_rgba(56,189,248,0.4)] relative">
                                            <div className="absolute top-1 left-2 w-4 h-1.5 bg-white/40 rounded-full rotate-[-20deg]"></div>
                                            Thao tác
                                        </div>
                                        <span className="absolute bottom-1 right-2 text-xs font-bold text-slate-400">Bong bóng</span>
                                    </button>
                                    <button onClick={() => onStyleChange({ button: 'rocket' })} className={`relative overflow-visible w-full h-24 rounded-xl border-2 transition-all flex items-center justify-center bg-slate-50 ${appStyles.button === 'rocket' ? 'border-primary-500 ring-4 ring-primary-500/20 shadow-md' : 'border-slate-200 hover:border-slate-300'}`}>
                                        <div className="px-6 py-3 rounded-t-[16px] rounded-b-sm text-white text-[13px] font-bold bg-red-500 shadow-[0_5px_0_theme(colors.red.700)] relative">
                                            <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-3 h-1.5 bg-yellow-400 rounded-b-full shadow-[0_2px_4px_theme(colors.orange.500)]"></div>
                                            Thao tác
                                        </div>
                                        <span className="absolute bottom-1 right-2 text-xs font-bold text-slate-400">Tên lửa</span>
                                    </button>
                                    <button onClick={() => onStyleChange({ button: 'frog' })} className={`relative overflow-visible w-full h-24 rounded-xl border-2 transition-all flex items-center justify-center bg-slate-50 ${appStyles.button === 'frog' ? 'border-primary-500 ring-4 ring-primary-500/20 shadow-md' : 'border-slate-200 hover:border-slate-300'}`}>
                                        <div className="px-6 py-3 rounded-[24px] border-[2.5px] border-[#064e3b] text-white text-[13px] font-bold bg-[#14532d] shadow-[0_4px_0_theme(colors.emerald.950)] relative overflow-hidden">
                                            <div className="absolute -top-2 left-[15%] w-5 h-4 bg-[#14532d] border-[2px] border-[#064e3b] rounded-t-full z-[-1]"></div>
                                            <div className="absolute -top-2 right-[15%] w-5 h-4 bg-[#14532d] border-[2px] border-[#064e3b] rounded-t-full z-[-1]"></div>
                                            <div className="absolute -top-[2px] left-[18%] w-2 h-2 bg-white rounded-full z-10 pointer-events-none flex items-center justify-center"><div className="w-[3px] h-[3px] bg-slate-900 rounded-full mb-[1px] ml-[1px]"></div></div>
                                            <div className="absolute -top-[2px] right-[20%] w-2 h-2 bg-white rounded-full z-10 pointer-events-none flex items-center justify-center"><div className="w-[3px] h-[3px] bg-slate-900 rounded-full mb-[1px] -ml-[1px]"></div></div>
                                            <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-[80%] h-4 bg-gradient-to-t from-[#65a30d] to-[#84cc16] border-t-[3px] border-[#4d7c0f] rounded-t-full opacity-90 shadow-[inset_0_1px_2px_rgba(0,0,0,0.1)] pointer-events-none"></div>
                                            <div className="absolute top-[40%] left-[10%] w-6 h-3 bg-pink-500/40 rounded-full blur-sm pointer-events-none"></div>
                                            <div className="absolute top-[40%] right-[10%] w-6 h-3 bg-pink-500/40 rounded-full blur-sm pointer-events-none"></div>
                                            <span className="relative z-10">Thao tác</span>
                                        </div>
                                        <span className="absolute bottom-1 right-2 text-xs font-bold text-slate-400">Ếch xanh</span>
                                    </button>
                                    <button onClick={() => onStyleChange({ button: 'cat' })} className={`relative overflow-visible w-full h-24 rounded-xl border-2 transition-all flex items-center justify-center bg-slate-50 ${appStyles.button === 'cat' ? 'border-primary-500 ring-4 ring-primary-500/20 shadow-md' : 'border-slate-200 hover:border-slate-300'}`}>
                                        <div className="px-6 py-3 rounded-[12px] border-2 border-[#EA580C] text-slate-900 text-[13px] font-bold bg-[#FDBA74] relative">
                                            <div className="absolute -top-2 left-[10%] w-4 h-4 bg-[#FDBA74] border-[2px] border-[#EA580C] rotate-[-25deg] [clip-path:polygon(50%_0%,0%_100%,100%_100%)] z-[-1]"></div>
                                            <div className="absolute -top-2 right-[10%] w-4 h-4 bg-[#FDBA74] border-[2px] border-[#EA580C] rotate-[25deg] [clip-path:polygon(50%_0%,0%_100%,100%_100%)] z-[-1]"></div>
                                            Thao tác
                                        </div>
                                        <span className="absolute bottom-1 right-2 text-xs font-bold text-slate-400">Mèo vàng</span>
                                    </button>
                                    <button onClick={() => onStyleChange({ button: 'panda' })} className={`relative overflow-visible w-full h-24 rounded-xl border-2 transition-all flex items-center justify-center bg-slate-50 ${appStyles.button === 'panda' ? 'border-primary-500 ring-4 ring-primary-500/20 shadow-md' : 'border-slate-200 hover:border-slate-300'}`}>
                                        <div className="px-6 py-3 rounded-[20px] border-2 border-zinc-900 text-white text-[13px] font-bold bg-zinc-800 shadow-[0_4px_0_theme(colors.zinc.900)] relative">
                                            <div className="absolute -top-3 left-[10%] w-5 h-5 bg-zinc-900 rounded-full z-[-1]"></div>
                                            <div className="absolute -top-3 right-[10%] w-5 h-5 bg-zinc-900 rounded-full z-[-1]"></div>
                                            Thao tác
                                        </div>
                                        <span className="absolute bottom-1 right-2 text-xs font-bold text-slate-400">Gấu trúc</span>
                                    </button>
                                    <button onClick={() => onStyleChange({ button: 'fox' })} className={`relative overflow-visible w-full h-24 rounded-xl border-2 transition-all flex items-center justify-center bg-slate-50 ${appStyles.button === 'fox' ? 'border-primary-500 ring-4 ring-primary-500/20 shadow-md' : 'border-slate-200 hover:border-slate-300'}`}>
                                        <div className="px-6 py-3 rounded-[12px] border-2 border-[#C2410C] text-white text-[13px] font-bold bg-[#F97316] shadow-[0_4px_0_theme(colors.orange.800)] relative">
                                            <div className="absolute -top-2 left-[10%] w-4 h-4 bg-[#C2410C] rotate-[-15deg] [clip-path:polygon(50%_0%,0%_100%,100%_100%)] z-[-1]"></div>
                                            <div className="absolute -top-2 right-[10%] w-4 h-4 bg-[#C2410C] rotate-[15deg] [clip-path:polygon(50%_0%,0%_100%,100%_100%)] z-[-1]"></div>
                                            Thao tác
                                        </div>
                                        <span className="absolute bottom-1 right-2 text-xs font-bold text-slate-400">Cáo</span>
                                    </button>
                                    <button onClick={() => onStyleChange({ button: 'dragon' })} className={`relative overflow-visible w-full h-24 rounded-xl border-2 transition-all flex items-center justify-center bg-slate-50 ${appStyles.button === 'dragon' ? 'border-primary-500 ring-4 ring-primary-500/20 shadow-md' : 'border-slate-200 hover:border-slate-300'}`}>
                                        <div className="px-6 py-3 border-2 border-red-900 text-white text-[13px] font-bold bg-red-600 [clip-path:polygon(5%_0%,95%_0%,100%_50%,95%_100%,5%_100%,0%_50%)] relative">
                                            Thao tác
                                        </div>
                                        <span className="absolute bottom-1 right-2 text-xs font-bold text-slate-400">Rồng</span>
                                    </button>
                                    <button onClick={() => onStyleChange({ button: 'penguin' })} className={`relative overflow-visible w-full h-24 rounded-xl border-2 transition-all flex items-center justify-center bg-slate-50 ${appStyles.button === 'penguin' ? 'border-primary-500 ring-4 ring-primary-500/20 shadow-md' : 'border-slate-200 hover:border-slate-300'}`}>
                                        <div className="px-6 py-3 rounded-[24px] border-2 border-blue-600 text-white text-[13px] font-bold bg-blue-400 shadow-[0_4px_0_theme(colors.blue.600)] relative overflow-hidden">
                                            <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-[70%] h-1/2 bg-white rounded-t-full"></div>
                                            <span className="relative z-10">Thao tác</span>
                                        </div>
                                        <span className="absolute bottom-1 right-2 text-xs font-bold text-slate-400">Cánh cụt</span>
                                    </button>
                                    <button onClick={() => onStyleChange({ button: 'bear' })} className={`relative overflow-visible w-full h-24 rounded-xl border-2 transition-all flex items-center justify-center bg-slate-50 ${appStyles.button === 'bear' ? 'border-primary-500 ring-4 ring-primary-500/20 shadow-md' : 'border-slate-200 hover:border-slate-300'}`}>
                                        <div className="px-6 py-3 rounded-[16px] border-2 border-amber-900 text-amber-50 text-[13px] font-bold bg-amber-700 shadow-[0_4px_0_theme(colors.amber.900)] relative">
                                            <div className="absolute -top-2 left-[10%] w-4 h-4 bg-amber-800 rounded-full z-[-1]"></div>
                                            <div className="absolute -top-2 right-[10%] w-4 h-4 bg-amber-800 rounded-full z-[-1]"></div>
                                            Thao tác
                                        </div>
                                        <span className="absolute bottom-1 right-2 text-xs font-bold text-slate-400">Gấu nâu</span>
                                    </button>
                                    <button onClick={() => onStyleChange({ button: 'rabbit' })} className={`relative overflow-visible w-full h-24 rounded-xl border-2 transition-all flex items-center justify-center bg-slate-50 ${appStyles.button === 'rabbit' ? 'border-primary-500 ring-4 ring-primary-500/20 shadow-md' : 'border-slate-200 hover:border-slate-300'}`}>
                                        <div className="px-6 py-3 rounded-[24px] border-2 border-pink-600 text-white text-[13px] font-bold bg-pink-400 shadow-[0_4px_0_theme(colors.pink.600)] relative">
                                            <div className="absolute -top-4 left-[20%] w-3 h-6 bg-pink-500 border-2 border-pink-600 rounded-full rotate-[-15deg] z-[-1] flex items-center justify-center"><div className="w-1.5 h-3 bg-pink-200 rounded-full"></div></div>
                                            <div className="absolute -top-4 right-[20%] w-3 h-6 bg-pink-500 border-2 border-pink-600 rounded-full rotate-[15deg] z-[-1] flex items-center justify-center"><div className="w-1.5 h-3 bg-pink-200 rounded-full"></div></div>
                                            Thao tác
                                        </div>
                                        <span className="absolute bottom-1 right-2 text-xs font-bold text-slate-400">Thỏ hồng</span>
                                    </button>
                                    <button onClick={() => onStyleChange({ button: 'bee' })} className={`relative overflow-visible w-full h-24 rounded-xl border-2 transition-all flex items-center justify-center bg-slate-50 ${appStyles.button === 'bee' ? 'border-primary-500 ring-4 ring-primary-500/20 shadow-md' : 'border-slate-200 hover:border-slate-300'}`}>
                                        <div className="px-6 py-3 rounded-[20px] border-2 border-yellow-600 text-slate-900 text-[13px] font-bold bg-yellow-400 shadow-[0_4px_0_theme(colors.yellow.600)] relative overflow-hidden">
                                            <div className="absolute inset-0 bg-[repeating-linear-gradient(90deg,transparent,transparent_8px,rgba(0,0,0,0.15)_8px,rgba(0,0,0,0.15)_16px)] pointer-events-none"></div>
                                            <span className="relative z-10">Thao tác</span>
                                        </div>
                                        <span className="absolute bottom-1 right-2 text-xs font-bold text-slate-400">Ong vàng</span>
                                    </button>
                                    <button onClick={() => onStyleChange({ button: 'whale' })} className={`relative overflow-visible w-full h-24 rounded-xl border-2 transition-all flex items-center justify-center bg-slate-50 ${appStyles.button === 'whale' ? 'border-primary-500 ring-4 ring-primary-500/20 shadow-md' : 'border-slate-200 hover:border-slate-300'}`}>
                                        <div className="px-6 py-3 rounded-[20px] border-2 border-sky-700 text-white text-[13px] font-bold bg-sky-500 shadow-[0_4px_0_theme(colors.sky.700)] relative overflow-hidden">
                                            <div className="absolute bottom-0 left-0 w-full h-1.5 bg-sky-600/50"></div>
                                            <span className="relative z-10">Thao tác</span>
                                        </div>
                                        <span className="absolute bottom-1 right-2 text-xs font-bold text-slate-400">Cá voi</span>
                                    </button>
                                </>
                            )}
                            
                            {/* Bubble Styles */}
                            {(activeTab === 'userBubble' || activeTab === 'aiBubble') && (
                                <>
                                    <button onClick={() => onStyleChange({ [activeTab]: 'default' })} className={`relative w-full h-28 rounded-xl border-2 transition-all flex flex-col justify-center bg-slate-50 ${appStyles[activeTab] === 'default' ? 'border-primary-500 ring-4 ring-primary-500/20 shadow-md' : 'border-slate-200 hover:border-slate-300'}`}>
                                        <div className="relative mt-0 mb-4 z-10 w-full flex justify-center px-2">
                                            <div className={`${activeTab === 'userBubble' ? 'bg-indigo-600 text-white rounded-l-xl rounded-tr-xl' : 'bg-white border border-slate-200 text-slate-800 rounded-r-lg rounded-tl-lg'} text-xs px-4 py-2 shadow-sm`}>{activeTab === 'userBubble' ? 'Nội dung...' : 'AI trả lời...'}</div>
                                        </div>
                                        <div className="absolute bottom-1.5 left-1/2 -translate-x-1/2 text-[11px] font-bold text-slate-400 w-full text-center">Mặc định</div>
                                    </button>

                                    <button onClick={() => onStyleChange({ [activeTab]: 'frog' })} className={`relative w-full h-28 rounded-xl border-2 transition-all flex flex-col justify-center bg-slate-50 ${appStyles[activeTab] === 'frog' ? 'border-primary-500 ring-4 ring-primary-500/20 shadow-md' : 'border-slate-200 hover:border-slate-300'}`}>
                                        <div className="relative mt-0 mb-4 z-10 w-full flex justify-center px-2">
                                            <div className="relative mt-3 w-4/5">
                                                <div className="absolute -top-3 left-4 w-5 h-5 bg-[#14532d] border-[1.5px] border-white rounded-full flex items-end justify-center z-10"><div className="w-2.5 h-2.5 bg-white rounded-full flex items-end justify-center mb-0.5"><div className="w-1 h-1 bg-slate-900 rounded-full mb-px" /></div></div>
                                                <div className="absolute -top-3 right-4 w-5 h-5 bg-[#14532d] border-[1.5px] border-white rounded-full flex items-end justify-center z-10"><div className="w-2.5 h-2.5 bg-white rounded-full flex items-end justify-center mb-0.5"><div className="w-1 h-1 bg-slate-900 rounded-full mb-px" /></div></div>
                                                <div className="bg-[#14532d] text-white text-xs px-4 py-2 rounded-[20px] shadow-[0_3px_0_theme(colors.emerald.950)] border-b-[3px] border-[#064e3b] leading-relaxed w-full text-center relative overflow-hidden">
                                                    <div className="absolute -bottom-3 left-1/2 -translate-x-1/2 w-16 h-8 bg-gradient-to-t from-[#65a30d] to-[#84cc16] border-t-[3px] border-[#4d7c0f] rounded-t-full opacity-90 shadow-[inset_0_2px_4px_rgba(0,0,0,0.1)]"></div>
                                                    <div className="absolute top-[30%] left-[5%] w-6 h-3 bg-pink-500/40 rounded-full blur-[3px]"></div>
                                                    <div className="absolute top-[30%] right-[5%] w-6 h-3 bg-pink-500/40 rounded-full blur-[3px]"></div>
                                                    <span className="relative z-10">Ếch xanh</span>
                                                </div>
                                            </div>
                                        </div>
                                        <div className="absolute bottom-1.5 left-1/2 -translate-x-1/2 text-[11px] font-bold text-slate-400 w-full text-center">Ếch xanh</div>
                                    </button>

                                    <button onClick={() => onStyleChange({ [activeTab]: 'cat' })} className={`relative w-full h-28 rounded-xl border-2 transition-all flex flex-col justify-center bg-slate-50 ${appStyles[activeTab] === 'cat' ? 'border-primary-500 ring-4 ring-primary-500/20 shadow-md' : 'border-slate-200 hover:border-slate-300'}`}>
                                        <div className="relative mt-0 mb-4 z-10 w-full flex justify-center px-2">
                                            <div className="relative mt-2">
                                                <div className="absolute -top-2 left-2 w-0 h-0 border-l-[6px] border-r-[6px] border-b-[8px] border-transparent border-b-[#fcd34d] rotate-[-20deg]"></div>
                                                <div className="absolute -top-2 right-2 w-0 h-0 border-l-[6px] border-r-[6px] border-b-[8px] border-transparent border-b-[#fcd34d] rotate-[20deg]"></div>
                                                <div className="bg-[#fcd34d] text-slate-800 font-medium text-xs px-4 py-2 rounded-[12px] shadow-sm border-b-[3px] border-amber-600 leading-relaxed max-w-[120px] text-left">Meow mèo</div>
                                            </div>
                                        </div>
                                        <div className="absolute bottom-1.5 left-1/2 -translate-x-1/2 text-[11px] font-bold text-slate-400 w-full text-center">Mèo con</div>
                                    </button>

                                    <button onClick={() => onStyleChange({ [activeTab]: 'dog' })} className={`relative w-full h-28 rounded-xl border-2 transition-all flex flex-col justify-center bg-slate-50 ${appStyles[activeTab] === 'dog' ? 'border-primary-500 ring-4 ring-primary-500/20 shadow-md' : 'border-slate-200 hover:border-slate-300'}`}>
                                        <div className="relative mt-0 mb-4 z-10 w-full flex justify-center px-2">
                                            <div className="relative mt-2">
                                                <div className="absolute -top-2 -left-1 w-3 h-5 bg-[#d97706] rounded-full rotate-[-45deg]"></div>
                                                <div className="absolute -top-2 -right-1 w-3 h-5 bg-[#d97706] rounded-full rotate-[45deg]"></div>
                                                <div className="bg-[#fbbf24] text-amber-900 font-medium text-xs px-4 py-2 rounded-[12px] shadow-sm border-b-[3px] border-amber-700 leading-relaxed max-w-[120px] text-left">Gâu gâu</div>
                                            </div>
                                        </div>
                                        <div className="absolute bottom-1.5 left-1/2 -translate-x-1/2 text-[11px] font-bold text-slate-400 w-full text-center">Chó Shiba</div>
                                    </button>

                                    <button onClick={() => onStyleChange({ [activeTab]: 'penguin' })} className={`relative w-full h-28 rounded-xl border-2 transition-all flex flex-col justify-center bg-slate-50 ${appStyles[activeTab] === 'penguin' ? 'border-primary-500 ring-4 ring-primary-500/20 shadow-md' : 'border-slate-200 hover:border-slate-300'}`}>
                                        <div className="relative mt-0 mb-4 z-10 w-full flex justify-center px-2">
                                            <div className="relative mt-2">
                                                <div className="bg-[#1e293b] text-white font-medium text-xs px-4 py-2 rounded-[12px] shadow-sm border-b-[3px] border-blue-500 leading-relaxed max-w-[120px] text-left">Cánh cụt nhỏ</div>
                                                <div className="absolute -bottom-1 left-2 w-3 h-2 bg-orange-500 rounded-full"></div>
                                                <div className="absolute -bottom-1 right-2 w-3 h-2 bg-orange-500 rounded-full"></div>
                                            </div>
                                        </div>
                                        <div className="absolute bottom-1.5 left-1/2 -translate-x-1/2 text-[11px] font-bold text-slate-400 w-full text-center">Chim Cánh Cụt</div>
                                    </button>

                                    <button onClick={() => onStyleChange({ [activeTab]: 'bear' })} className={`relative w-full h-28 rounded-xl border-2 transition-all flex flex-col justify-center bg-slate-50 ${appStyles[activeTab] === 'bear' ? 'border-primary-500 ring-4 ring-primary-500/20 shadow-md' : 'border-slate-200 hover:border-slate-300'}`}>
                                        <div className="relative mt-0 mb-4 z-10 w-full flex justify-center px-2">
                                            <div className="relative mt-2">
                                                <div className="absolute -top-2 left-1 w-4 h-4 bg-[#78350f] rounded-full"></div>
                                                <div className="absolute -top-2 right-1 w-4 h-4 bg-[#78350f] rounded-full"></div>
                                                <div className="bg-[#92400e] text-orange-50 font-medium text-xs px-4 py-2 rounded-[12px] shadow-sm border-b-[3px] border-[#451a03] leading-relaxed max-w-[120px] text-left">Gấu nâu đây</div>
                                            </div>
                                        </div>
                                        <div className="absolute bottom-1.5 left-1/2 -translate-x-1/2 text-[11px] font-bold text-slate-400 w-full text-center">Gấu Béo</div>
                                    </button>

                                    <button onClick={() => onStyleChange({ [activeTab]: 'rabbit' })} className={`relative w-full h-28 rounded-xl border-2 transition-all flex flex-col justify-center bg-slate-50 ${appStyles[activeTab] === 'rabbit' ? 'border-primary-500 ring-4 ring-primary-500/20 shadow-md' : 'border-slate-200 hover:border-slate-300'}`}>
                                        <div className="relative mt-0 mb-4 z-10 w-full flex justify-center px-2">
                                            <div className="relative mt-2">
                                                <div className="absolute -top-4 left-3 w-2.5 h-6 bg-pink-100 border border-slate-200 rounded-t-full rotate-[-15deg]"></div>
                                                <div className="absolute -top-4 right-3 w-2.5 h-6 bg-pink-100 border border-slate-200 rounded-t-full rotate-[15deg]"></div>
                                                <div className="bg-white text-slate-700 font-medium text-xs px-4 py-2 rounded-[12px] shadow-sm border border-slate-200 border-b-[3px] border-b-slate-300 leading-relaxed max-w-[120px] text-left">Thỏ nhảy</div>
                                            </div>
                                        </div>
                                        <div className="absolute bottom-1.5 left-1/2 -translate-x-1/2 text-[11px] font-bold text-slate-400 w-full text-center">Thỏ Trắng</div>
                                    </button>

                                    <button onClick={() => onStyleChange({ [activeTab]: 'koala' })} className={`relative w-full h-28 rounded-xl border-2 transition-all flex flex-col justify-center bg-slate-50 ${appStyles[activeTab] === 'koala' ? 'border-primary-500 ring-4 ring-primary-500/20 shadow-md' : 'border-slate-200 hover:border-slate-300'}`}>
                                        <div className="relative mt-0 mb-4 z-10 w-full flex justify-center px-2">
                                            <div className="relative mt-2">
                                                <div className="absolute -top-1 -left-2 w-5 h-5 bg-slate-400 rounded-full"></div>
                                                <div className="absolute -top-1 -right-2 w-5 h-5 bg-slate-400 rounded-full"></div>
                                                <div className="bg-slate-300 text-slate-800 font-medium text-xs px-4 py-2 rounded-[12px] shadow-sm border-b-[3px] border-slate-500 leading-relaxed max-w-[120px] text-left z-10 relative">Ngủ khò khò</div>
                                            </div>
                                        </div>
                                        <div className="absolute bottom-1.5 left-1/2 -translate-x-1/2 text-[11px] font-bold text-slate-400 w-full text-center">Koala</div>
                                    </button>

                                    <button onClick={() => onStyleChange({ [activeTab]: 'duck' })} className={`relative w-full h-28 rounded-xl border-2 transition-all flex flex-col justify-center bg-slate-50 ${appStyles[activeTab] === 'duck' ? 'border-primary-500 ring-4 ring-primary-500/20 shadow-md' : 'border-slate-200 hover:border-slate-300'}`}>
                                        <div className="relative mt-0 mb-4 z-10 w-full flex justify-center px-2">
                                            <div className="relative mt-2">
                                                <div className="absolute top-1/2 -left-2 transform -translate-y-1/2 w-3 h-2 bg-orange-400 rounded-l-full"></div>
                                                <div className="bg-[#fef08a] text-yellow-900 font-medium text-xs px-4 py-2 rounded-[12px] shadow-sm border-b-[3px] border-yellow-500 leading-relaxed max-w-[120px] text-left">Cạp cạp!</div>
                                            </div>
                                        </div>
                                        <div className="absolute bottom-1.5 left-1/2 -translate-x-1/2 text-[11px] font-bold text-slate-400 w-full text-center">Vịt Con</div>
                                    </button>

                                    <button onClick={() => onStyleChange({ [activeTab]: 'capybara' })} className={`relative w-full h-28 rounded-xl border-2 transition-all flex flex-col justify-center bg-slate-50 ${appStyles[activeTab] === 'capybara' ? 'border-primary-500 ring-4 ring-primary-500/20 shadow-md' : 'border-slate-200 hover:border-slate-300'}`}>
                                        <div className="relative mt-0 mb-4 z-10 w-full flex justify-center px-2">
                                            <div className="relative mt-2">
                                                <div className="absolute -top-4 left-4 w-10 h-5 bg-[#C69C6D] rounded-t-full flex items-center justify-center">
                                                    <div className="absolute top-1 left-2 w-1.5 h-1.5 bg-slate-800 rounded-full"></div>
                                                    <div className="absolute top-1 right-2 w-1.5 h-1.5 bg-slate-800 rounded-full"></div>
                                                    <div className="absolute -top-1 left-0 w-2.5 h-2.5 bg-[#a37e54] rounded-full"></div>
                                                    <div className="absolute -top-1 right-0 w-2.5 h-2.5 bg-[#a37e54] rounded-full"></div>
                                                    <div className="absolute top-2 w-2 h-1 bg-pink-300 rounded-full"></div>
                                                </div>
                                                <div className="bg-[#FFD6E4] text-slate-800 border-2 border-pink-200 font-medium text-xs px-4 py-2 rounded-xl rounded-tl-none shadow-sm relative leading-relaxed max-w-[120px] text-left z-10 w-full">
                                                    <span className="absolute -left-1.5 top-0 text-xs rotate-12">💖</span>
                                                    Capybara!
                                                </div>
                                            </div>
                                        </div>
                                        <div className="absolute bottom-1.5 left-1/2 -translate-x-1/2 text-[11px] font-bold text-slate-400 w-full text-center">Capybara</div>
                                    </button>

                                    <button onClick={() => onStyleChange({ [activeTab]: 'robot' })} className={`relative w-full h-28 rounded-xl border-2 transition-all flex flex-col justify-center bg-slate-50 ${appStyles[activeTab] === 'robot' ? 'border-primary-500 ring-4 ring-primary-500/20 shadow-md' : 'border-slate-200 hover:border-slate-300'}`}>
                                        <div className="relative mt-0 mb-4 z-10 w-full flex justify-center px-2">
                                            <div className="relative mt-2">
                                                <div className="absolute -top-2 left-4 w-4 h-4 bg-slate-300 rounded-sm border border-slate-400 flex items-center justify-center"><div className="w-1.5 h-1.5 bg-red-500 rounded-full animate-pulse"></div></div>
                                                <div className="bg-slate-800 text-green-400 border border-slate-700 font-mono text-xs px-4 py-2 rounded-lg shadow-sm leading-relaxed max-w-[120px] text-left">010011...</div>
                                            </div>
                                        </div>
                                        <div className="absolute bottom-1.5 left-1/2 -translate-x-1/2 text-[11px] font-bold text-slate-400 w-full text-center">Robot</div>
                                    </button>

                                    <button onClick={() => onStyleChange({ [activeTab]: 'alien' })} className={`relative w-full h-28 rounded-xl border-2 transition-all flex flex-col justify-center bg-slate-50 ${appStyles[activeTab] === 'alien' ? 'border-primary-500 ring-4 ring-primary-500/20 shadow-md' : 'border-slate-200 hover:border-slate-300'}`}>
                                        <div className="relative mt-0 mb-4 z-10 w-full flex justify-center px-2">
                                            <div className="relative mt-2">
                                                <div className="absolute -top-3 left-4 w-5 h-5 bg-lime-400 rounded-t-full flex items-center gap-1 justify-center"><div className="w-1 h-1 bg-black rounded-full"></div><div className="w-1 h-1 bg-black rounded-full"></div></div>
                                                <div className="bg-lime-900 text-lime-400 font-mono text-xs px-4 py-2 rounded-[12px] rounded-tl-none shadow-sm border border-lime-700 leading-relaxed max-w-[120px] text-left">👽 Chào bạn</div>
                                            </div>
                                        </div>
                                        <div className="absolute bottom-1.5 left-1/2 -translate-x-1/2 text-[11px] font-bold text-slate-400 w-full text-center">Alien</div>
                                    </button>

                                    <button onClick={() => onStyleChange({ [activeTab]: 'dinosaur' })} className={`relative w-full h-28 rounded-xl border-2 transition-all flex flex-col justify-center bg-slate-50 ${appStyles[activeTab] === 'dinosaur' ? 'border-primary-500 ring-4 ring-primary-500/20 shadow-md' : 'border-slate-200 hover:border-slate-300'}`}>
                                        <div className="relative mt-0 mb-4 z-10 w-full flex justify-center px-2">
                                            <div className="relative mt-2">
                                                <div className="absolute -top-2 left-2 w-3 h-3 bg-emerald-600 rounded-t-md rotate-[-45deg]"></div>
                                                <div className="absolute -top-2 left-6 w-3 h-3 bg-emerald-600 rounded-t-md rotate-[-45deg]"></div>
                                                <div className="bg-emerald-100 text-emerald-900 font-medium text-xs px-4 py-2 rounded-xl shadow-sm border-2 border-emerald-500 leading-relaxed max-w-[120px] text-left">Grừ grừ...</div>
                                            </div>
                                        </div>
                                        <div className="absolute bottom-1.5 left-1/2 -translate-x-1/2 text-[11px] font-bold text-slate-400 w-full text-center">Khủng Long</div>
                                    </button>

                                    <button onClick={() => onStyleChange({ [activeTab]: 'unicorn' })} className={`relative w-full h-28 rounded-xl border-2 transition-all flex flex-col justify-center bg-slate-50 ${appStyles[activeTab] === 'unicorn' ? 'border-primary-500 ring-4 ring-primary-500/20 shadow-md' : 'border-slate-200 hover:border-slate-300'}`}>
                                        <div className="relative mt-0 mb-4 z-10 w-full flex justify-center px-2">
                                            <div className="relative mt-2">
                                                <div className="absolute -top-4 left-4 w-0 h-0 border-l-[4px] border-r-[4px] border-b-[12px] border-transparent border-b-yellow-400"></div>
                                                <div className="bg-gradient-to-r from-pink-100 via-purple-100 to-blue-100 text-purple-900 font-medium text-xs px-4 py-2 rounded-xl shadow-sm border border-purple-200 leading-relaxed max-w-[120px] text-left">Phép thuật 🌈</div>
                                            </div>
                                        </div>
                                        <div className="absolute bottom-1.5 left-1/2 -translate-x-1/2 text-[11px] font-bold text-slate-400 w-full text-center">Kỳ Lân</div>
                                    </button>

                                    <button onClick={() => onStyleChange({ [activeTab]: 'ghost' })} className={`relative w-full h-28 rounded-xl border-2 transition-all flex flex-col justify-center bg-slate-50 ${appStyles[activeTab] === 'ghost' ? 'border-primary-500 ring-4 ring-primary-500/20 shadow-md' : 'border-slate-200 hover:border-slate-300'}`}>
                                        <div className="relative mt-0 mb-4 z-10 w-full flex justify-center px-2">
                                            <div className="relative mt-2">
                                                <div className="bg-slate-100 text-slate-800 font-medium text-xs px-4 py-2 rounded-t-xl rounded-bl-sm rounded-br-3xl shadow-sm border border-slate-200 leading-relaxed max-w-[120px] text-left">Ú òa! 👻</div>
                                                <div className="absolute -bottom-2 left-2 w-2 h-2 bg-slate-100 rounded-full"></div>
                                            </div>
                                        </div>
                                        <div className="absolute bottom-1.5 left-1/2 -translate-x-1/2 text-[11px] font-bold text-slate-400 w-full text-center">Ma Ú Òa</div>
                                    </button>

                                    <button onClick={() => onStyleChange({ [activeTab]: 'ninja' })} className={`relative w-full h-28 rounded-xl border-2 transition-all flex flex-col justify-center bg-slate-50 ${appStyles[activeTab] === 'ninja' ? 'border-primary-500 ring-4 ring-primary-500/20 shadow-md' : 'border-slate-200 hover:border-slate-300'}`}>
                                        <div className="relative mt-0 mb-4 z-10 w-full flex justify-center px-2">
                                            <div className="relative mt-2">
                                                <div className="absolute -top-1 left-4 w-12 h-2 bg-red-500 transform -skew-x-12"></div>
                                                <div className="bg-slate-900 text-slate-200 font-medium text-xs px-4 py-2 rounded-xl shadow-sm border border-slate-700 leading-relaxed max-w-[120px] text-left z-10 relative">Ẩn thân 🥷</div>
                                            </div>
                                        </div>
                                        <div className="absolute bottom-1.5 left-1/2 -translate-x-1/2 text-[11px] font-bold text-slate-400 w-full text-center">Ninja Rùa</div>
                                    </button>

                                    <button onClick={() => onStyleChange({ [activeTab]: 'dragon' })} className={`relative w-full h-28 rounded-xl border-2 transition-all flex flex-col justify-center bg-slate-50 ${appStyles[activeTab] === 'dragon' ? 'border-primary-500 ring-4 ring-primary-500/20 shadow-md' : 'border-slate-200 hover:border-slate-300'}`}>
                                        <div className="relative mt-0 mb-4 z-10 w-full flex justify-center px-2">
                                            <div className="relative mt-2">
                                                <div className="absolute -top-3 left-3 w-4 h-5 bg-red-600 rounded-t-full rotate-[-20deg]"></div>
                                                <div className="absolute -top-3 left-6 w-4 h-5 bg-red-600 rounded-t-full rotate-[20deg]"></div>
                                                <div className="bg-orange-100 text-red-900 font-medium text-xs px-4 py-2 rounded-xl shadow-sm border-2 border-red-500 leading-relaxed max-w-[120px] text-left z-10 relative">Phun lửa 🔥</div>
                                            </div>
                                        </div>
                                        <div className="absolute bottom-1.5 left-1/2 -translate-x-1/2 text-[11px] font-bold text-slate-400 w-full text-center">Rồng Nhỏ</div>
                                    </button>

                                    <button onClick={() => onStyleChange({ [activeTab]: 'fox' })} className={`relative w-full h-28 rounded-xl border-2 transition-all flex flex-col justify-center bg-slate-50 ${appStyles[activeTab] === 'fox' ? 'border-primary-500 ring-4 ring-primary-500/20 shadow-md' : 'border-slate-200 hover:border-slate-300'}`}>
                                        <div className="relative mt-0 mb-4 z-10 w-full flex justify-center px-2">
                                            <div className="relative mt-2">
                                                <div className="absolute -top-3 -left-1 w-0 h-0 border-l-[6px] border-r-[6px] border-b-[12px] border-transparent border-b-orange-600 rotate-[-25deg]"></div>
                                                <div className="absolute -top-3 -right-1 w-0 h-0 border-l-[6px] border-r-[6px] border-b-[12px] border-transparent border-b-orange-600 rotate-[25deg]"></div>
                                                <div className="bg-orange-500 text-white font-medium text-xs px-4 py-2 rounded-[14px] shadow-sm border-b-[3px] border-orange-700 leading-relaxed max-w-[120px] text-left z-10 relative">Cáo nhỏ 🦊</div>
                                            </div>
                                        </div>
                                        <div className="absolute bottom-1.5 left-1/2 -translate-x-1/2 text-[11px] font-bold text-slate-400 w-full text-center">Cáo Nhỏ</div>
                                    </button>

                                    <button onClick={() => onStyleChange({ [activeTab]: 'panda' })} className={`relative w-full h-28 rounded-xl border-2 transition-all flex flex-col justify-center bg-slate-50 ${appStyles[activeTab] === 'panda' ? 'border-primary-500 ring-4 ring-primary-500/20 shadow-md' : 'border-slate-200 hover:border-slate-300'}`}>
                                        <div className="relative mt-0 mb-4 z-10 w-full flex justify-center px-2">
                                            <div className="relative mt-2">
                                                <div className="absolute -top-2 left-1 w-5 h-5 bg-slate-800 rounded-full"></div>
                                                <div className="absolute -top-2 right-1 w-5 h-5 bg-slate-800 rounded-full"></div>
                                                <div className="bg-white text-slate-800 font-medium text-xs px-4 py-2 rounded-2xl shadow-sm border-[2px] border-slate-800 leading-relaxed max-w-[120px] text-left z-10 relative">Gấu trúc 🐼</div>
                                            </div>
                                        </div>
                                        <div className="absolute bottom-1.5 left-1/2 -translate-x-1/2 text-[11px] font-bold text-slate-400 w-full text-center">Gấu Trúc</div>
                                    </button>

                                    <button onClick={() => onStyleChange({ [activeTab]: 'hamster' })} className={`relative w-full h-28 rounded-xl border-2 transition-all flex flex-col justify-center bg-slate-50 ${appStyles[activeTab] === 'hamster' ? 'border-primary-500 ring-4 ring-primary-500/20 shadow-md' : 'border-slate-200 hover:border-slate-300'}`}>
                                        <div className="relative mt-0 mb-4 z-10 w-full flex justify-center px-2">
                                            <div className="relative mt-2">
                                                <div className="absolute -top-2 left-2 w-4 h-4 bg-amber-200 rounded-full"></div>
                                                <div className="absolute -top-2 right-2 w-4 h-4 bg-amber-200 rounded-full"></div>
                                                <div className="bg-amber-100 text-amber-900 font-medium text-xs px-4 py-2 rounded-3xl shadow-sm border-[2px] border-amber-300 leading-relaxed max-w-[120px] text-left z-10 relative">Hamster 🐹</div>
                                            </div>
                                        </div>
                                        <div className="absolute bottom-1.5 left-1/2 -translate-x-1/2 text-[11px] font-bold text-slate-400 w-full text-center">Hamster</div>
                                    </button>

                                    <button onClick={() => onStyleChange({ [activeTab]: 'owl' })} className={`relative w-full h-28 rounded-xl border-2 transition-all flex flex-col justify-center bg-slate-50 ${appStyles[activeTab] === 'owl' ? 'border-primary-500 ring-4 ring-primary-500/20 shadow-md' : 'border-slate-200 hover:border-slate-300'}`}>
                                        <div className="relative mt-0 mb-4 z-10 w-full flex justify-center px-2">
                                            <div className="relative mt-2">
                                                <div className="absolute -top-2 left-2 w-0 h-0 border-l-[4px] border-r-[4px] border-b-[8px] border-transparent border-b-[#451a03]"></div>
                                                <div className="absolute -top-2 right-2 w-0 h-0 border-l-[4px] border-r-[4px] border-b-[8px] border-transparent border-b-[#451a03]"></div>
                                                <div className="bg-[#78350f] text-[#fef3c7] font-medium text-xs px-4 py-2 rounded-[14px] shadow-sm border-b-[3px] border-[#451a03] leading-relaxed max-w-[120px] text-left z-10 relative">Cú mèo 🦉</div>
                                            </div>
                                        </div>
                                        <div className="absolute bottom-1.5 left-1/2 -translate-x-1/2 text-[11px] font-bold text-slate-400 w-full text-center">Cú Mèo</div>
                                    </button>

                                    <button onClick={() => onStyleChange({ [activeTab]: 'sloth' })} className={`relative w-full h-28 rounded-xl border-2 transition-all flex flex-col justify-center bg-slate-50 ${appStyles[activeTab] === 'sloth' ? 'border-primary-500 ring-4 ring-primary-500/20 shadow-md' : 'border-slate-200 hover:border-slate-300'}`}>
                                        <div className="relative mt-0 mb-4 z-10 w-full flex justify-center px-2">
                                            <div className="relative mt-2">
                                                <div className="absolute -top-1 left-2 w-8 h-4 bg-[#a1a1aa] rounded-t-full"></div>
                                                <div className="bg-[#d4d4d8] text-slate-800 font-medium text-xs px-4 py-2 rounded-2xl shadow-sm border-b-[3px] border-[#a1a1aa] leading-relaxed max-w-[120px] text-left z-10 relative">Lười quá 🦥</div>
                                            </div>
                                        </div>
                                        <div className="absolute bottom-1.5 left-1/2 -translate-x-1/2 text-[11px] font-bold text-slate-400 w-full text-center">Lười Bay</div>
                                    </button>

                                    <button onClick={() => onStyleChange({ [activeTab]: 'otter' })} className={`relative w-full h-28 rounded-xl border-2 transition-all flex flex-col justify-center bg-slate-50 ${appStyles[activeTab] === 'otter' ? 'border-primary-500 ring-4 ring-primary-500/20 shadow-md' : 'border-slate-200 hover:border-slate-300'}`}>
                                        <div className="relative mt-0 mb-4 z-10 w-full flex justify-center px-2">
                                            <div className="relative mt-2">
                                                <div className="absolute -top-2 left-1 w-3 h-3 bg-[#52525b] rounded-full"></div>
                                                <div className="absolute -top-2 right-1 w-3 h-3 bg-[#52525b] rounded-full"></div>
                                                <div className="bg-[#71717a] text-white font-medium text-xs px-4 py-2 rounded-[16px] shadow-sm border-b-[3px] border-[#3f3f46] leading-relaxed max-w-[120px] text-left z-10 relative">Rái cá 🦦</div>
                                            </div>
                                        </div>
                                        <div className="absolute bottom-1.5 left-1/2 -translate-x-1/2 text-[11px] font-bold text-slate-400 w-full text-center">Rái Cá</div>
                                    </button>

                                    <button onClick={() => onStyleChange({ [activeTab]: 'turtle' })} className={`relative w-full h-28 rounded-xl border-2 transition-all flex flex-col justify-center bg-slate-50 ${appStyles[activeTab] === 'turtle' ? 'border-primary-500 ring-4 ring-primary-500/20 shadow-md' : 'border-slate-200 hover:border-slate-300'}`}>
                                        <div className="relative mt-0 mb-4 z-10 w-full flex justify-center px-2">
                                            <div className="relative mt-2">
                                                <div className="absolute -top-2 left-6 w-5 h-5 bg-[#166534] rounded-t-full"></div>
                                                <div className="bg-[#22c55e] text-[#14532d] font-medium text-xs px-4 py-2 rounded-[16px] shadow-sm border-[2px] border-[#16a34a] leading-relaxed max-w-[120px] text-left z-10 relative">Rùa biển 🐢</div>
                                            </div>
                                        </div>
                                        <div className="absolute bottom-1.5 left-1/2 -translate-x-1/2 text-[11px] font-bold text-slate-400 w-full text-center">Rùa Biển</div>
                                    </button>

                                    <button onClick={() => onStyleChange({ [activeTab]: 'bee' })} className={`relative w-full h-28 rounded-xl border-2 transition-all flex flex-col justify-center bg-slate-50 ${appStyles[activeTab] === 'bee' ? 'border-primary-500 ring-4 ring-primary-500/20 shadow-md' : 'border-slate-200 hover:border-slate-300'}`}>
                                        <div className="relative mt-0 mb-4 z-10 w-full flex justify-center px-2">
                                            <div className="relative mt-2">
                                                <div className="absolute -top-3 left-3 w-1.5 h-3.5 bg-slate-900 rounded-full rotate-[-30deg]"></div>
                                                <div className="absolute -top-3 right-3 w-1.5 h-3.5 bg-slate-900 rounded-full rotate-[30deg]"></div>
                                                <div className="bg-[#fde047] text-slate-900 font-medium text-xs px-4 py-2 rounded-2xl shadow-sm border-[2px] border-[#eab308] border-dashed leading-relaxed max-w-[120px] text-left z-10 relative">Ong mật 🐝</div>
                                            </div>
                                        </div>
                                        <div className="absolute bottom-1.5 left-1/2 -translate-x-1/2 text-[11px] font-bold text-slate-400 w-full text-center">Ong Mật</div>
                                    </button>

                                    <button onClick={() => onStyleChange({ [activeTab]: 'whale' })} className={`relative w-full h-28 rounded-xl border-2 transition-all flex flex-col justify-center bg-slate-50 ${appStyles[activeTab] === 'whale' ? 'border-primary-500 ring-4 ring-primary-500/20 shadow-md' : 'border-slate-200 hover:border-slate-300'}`}>
                                        <div className="relative mt-0 mb-4 z-10 w-full flex justify-center px-2">
                                            <div className="relative mt-2">
                                                <div className="absolute -top-4 left-6 w-1 h-4 bg-sky-200"></div>
                                                <div className="absolute -top-4 left-4 w-1 h-3 bg-sky-300 rotate-[-30deg]"></div>
                                                <div className="absolute -top-4 left-8 w-1 h-3 bg-sky-300 rotate-[30deg]"></div>
                                                <div className="bg-[#0ea5e9] text-white font-medium text-xs px-4 py-2 rounded-[20px] shadow-sm border-b-[4px] border-[#0284c7] leading-relaxed max-w-[120px] text-left z-10 relative">Cá voi 🐳</div>
                                            </div>
                                        </div>
                                        <div className="absolute bottom-1.5 left-1/2 -translate-x-1/2 text-[11px] font-bold text-slate-400 w-full text-center">Cá Voi</div>
                                    </button>

                                    <button onClick={() => onStyleChange({ [activeTab]: 'octopus' })} className={`relative w-full h-28 rounded-xl border-2 transition-all flex flex-col justify-center bg-slate-50 ${appStyles[activeTab] === 'octopus' ? 'border-primary-500 ring-4 ring-primary-500/20 shadow-md' : 'border-slate-200 hover:border-slate-300'}`}>
                                        <div className="relative mt-0 mb-4 z-10 w-full flex justify-center px-2">
                                            <div className="relative mt-2">
                                                <div className="bg-[#c084fc] text-white font-medium text-xs px-4 py-2 rounded-t-[20px] shadow-sm border border-[#a855f7] leading-relaxed max-w-[120px] text-left z-10 relative">Bạch tuộc 🐙</div>
                                                <div className="flex gap-1 justify-center mt-[-1px]">
                                                    <div className="w-2 h-4 bg-[#c084fc] rounded-b-full"></div>
                                                    <div className="w-2 h-3 bg-[#c084fc] rounded-b-full"></div>
                                                    <div className="w-2 h-4 bg-[#c084fc] rounded-b-full"></div>
                                                </div>
                                            </div>
                                        </div>
                                        <div className="absolute bottom-1.5 left-1/2 -translate-x-1/2 text-[11px] font-bold text-slate-400 w-full text-center">Bạch Tuộc</div>
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

