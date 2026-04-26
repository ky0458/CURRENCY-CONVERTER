import React from 'react';
import { ThemeColor, HeaderStyle } from '../types';
import { ThemeSignboard } from './ThemeSignboard';

interface HeaderProps {
  theme: ThemeColor;
  onShowHistory: () => void;
  headerStyle?: HeaderStyle;
}

export const Header: React.FC<HeaderProps> = ({ theme, headerStyle = 'default' }) => {
  return (
    <div className="relative rounded-t-3xl z-[50]">
      {/* Signboard positioned completely on top of the header */}
      <div className="absolute bottom-full left-0 w-full mb-[-1px] pointer-events-none z-30 flex justify-center">
        <ThemeSignboard style={headerStyle} />
      </div>

      {/* Background Layer */}
      <div className={`absolute inset-0 overflow-hidden transition-colors duration-500 rounded-t-3xl ${['default', 'waves', 'clouds'].includes(headerStyle as string) ? (headerStyle !== 'default' ? 'bg-primary-600' : 'bg-gradient-to-br from-slate-800 via-slate-900 to-black') : ''}`}>
        {headerStyle === 'default' && (
             <>
                 <div className="absolute inset-0 opacity-20 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-blue-400 via-indigo-500 to-transparent mix-blend-screen"></div>
                 <div className="absolute -top-[50%] -left-[10%] w-[120%] h-[120%] rounded-[100%] border-[2px] border-white/5 opacity-30 transform -rotate-12 pointer-events-none"></div>
                 <div className="absolute -bottom-[60%] -right-[10%] w-[120%] h-[120%] rounded-[100%] border-[4px] border-white/5 opacity-20 transform rotate-12 pointer-events-none"></div>
                 <div className="absolute top-[20%] left-[10%] w-2 h-2 bg-blue-300 rounded-full animate-pulse blur-[1px]"></div>
                 <div className="absolute top-[60%] right-[15%] w-3 h-3 bg-indigo-400 rounded-full animate-pulse blur-[2px]" style={{animationDelay: '1s'}}></div>
                 <div className="absolute bottom-[20%] left-[30%] w-1.5 h-1.5 bg-cyan-300 rounded-full animate-pulse blur-[1px]" style={{animationDelay: '2s'}}></div>
             </>
        )}
        {headerStyle === 'waves' && (
             <div className="absolute top-0 left-0 w-full h-full opacity-10">
                <svg className="w-full h-full" viewBox="0 0 1440 320" preserveAspectRatio="none">
                  <path fill="var(--color-primary-800, #1e3a8a)" fillOpacity="1" d="M0,96L480,224L960,32L1440,256L1440,0L960,0L480,0L0,0Z"></path>
                  <path fill="white" fillOpacity="1" d="M0,192L48,197.3C96,203,192,213,288,229.3C384,245,480,267,576,250.7C672,235,768,181,864,181.3C960,181,1056,235,1152,234.7C1248,235,1344,181,1392,154.7L1440,128L1440,0L1392,0C1344,0,1248,0,1152,0C1056,0,960,0,864,0C768,0,672,0,576,0C480,0,384,0,288,0C192,0,96,0,48,0L0,0Z"></path>
                </svg>
             </div>
        )}
        {headerStyle === 'clouds' && (
             <div className="absolute top-0 left-0 w-full h-full opacity-20">
                <svg className="w-full h-full" viewBox="0 0 100 100" preserveAspectRatio="none">
                    <path fill="white" d="M 20 80 Q 20 60 40 60 Q 50 40 70 60 Q 90 60 90 80 Z" />
                    <path fill="white" d="M -10 90 Q -10 70 10 70 Q 20 50 40 70 Q 60 70 60 90 Z" />
                    <path fill="white" d="M 60 100 Q 60 80 80 80 Q 90 60 110 80 Q 130 80 130 100 Z" />
                </svg>
             </div>
        )}
        {headerStyle === 'sunset' && (
             <>
                <div className="absolute inset-0 bg-gradient-to-b from-orange-400 to-pink-500"></div>
                <div className="absolute bottom-[-10%] left-1/2 -translate-x-1/2 w-48 h-48 bg-yellow-300 rounded-full blur-md opacity-90"></div>
                <div className="absolute w-full h-1/2 bottom-0 bg-gradient-to-t from-purple-900/30 to-transparent"></div>
             </>
        )}
        {headerStyle === 'forest' && (
             <>
                <div className="absolute inset-0 bg-gradient-to-b from-green-600 to-emerald-900"></div>
                <div className="absolute bottom-[-10px] left-[10%] w-0 h-0 border-l-[30px] border-r-[30px] border-b-[60px] border-transparent border-b-green-700/80"></div>
                <div className="absolute bottom-[-5px] left-[35%] w-0 h-0 border-l-[40px] border-r-[40px] border-b-[80px] border-transparent border-b-green-800"></div>
                <div className="absolute bottom-[-10px] right-[15%] w-0 h-0 border-l-[35px] border-r-[35px] border-b-[70px] border-transparent border-b-green-700/90"></div>
                <div className="absolute w-2 h-2 bg-yellow-300 rounded-full top-[30%] right-[40%] animate-pulse blur-[1px]"></div>
                <div className="absolute w-3 h-3 bg-yellow-200 rounded-full top-[50%] left-[20%] animate-pulse blur-[2px]" style={{animationDelay: '1s'}}></div>
             </>
        )}
        {headerStyle === 'magic' && (
             <>
                <div className="absolute inset-0 bg-gradient-to-r from-violet-600 to-fuchsia-700"></div>
                <div className="absolute w-full h-full bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-white/20 via-transparent to-transparent opacity-60"></div>
                <div className="absolute top-4 left-8 text-2xl animate-pulse">✨</div>
                <div className="absolute top-6 right-12 text-xl animate-bounce" style={{animationDelay: '0.5s'}}>🌟</div>
                <div className="absolute bottom-4 left-1/3 text-lg animate-pulse" style={{animationDelay: '1.2s'}}>⭐</div>
             </>
        )}
        {headerStyle === 'ocean' && (
             <>
                <div className="absolute inset-0 bg-gradient-to-b from-cyan-500 to-blue-700"></div>
                <div className="absolute bottom-4 left-[15%] w-4 h-4 rounded-full border-2 border-white/50 animate-[ping_3s_infinite]"></div>
                <div className="absolute bottom-8 right-[25%] w-3 h-3 rounded-full border-2 border-white/40 animate-[ping_4s_infinite]" style={{animationDelay: '1s'}}></div>
                <div className="absolute top-[40%] right-[10%] w-12 h-6 bg-blue-300/30 rounded-[100%] rotate-12 flex">
                    <div className="absolute -right-3 top-1 w-0 h-0 border-t-[8px] border-b-[8px] border-l-[12px] border-transparent border-l-blue-300/30"></div>
                </div>
             </>
        )}
        {headerStyle === 'space' && (
             <>
                <div className="absolute inset-0 bg-gradient-to-b from-slate-900 to-indigo-950"></div>
                <div className="absolute w-full h-full bg-[url('data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSI0IiBoZWlnaHQ9IjQiPjxyZWN0IHdpZHRoPSI0IiBoZWlnaHQ9IjQiIGZpbGw9IiNmZmYiIGZpbGwtb3BhY2l0eT0iMC4wNSIvPjwvc3ZnPg==')] opacity-50"></div>
                <div className="absolute top-[20%] left-[10%] w-3 h-3 bg-white rounded-full shadow-[0_0_10px_#fff]"></div>
                <div className="absolute top-[50%] right-[30%] w-1.5 h-1.5 bg-sky-200 rounded-full animate-pulse"></div>
                <div className="absolute bottom-[30%] left-[25%] w-2 h-2 bg-pink-200 rounded-full animate-[ping_5s_infinite]"></div>
                <div className="absolute top-[30%] right-[15%] w-16 h-16 rounded-full bg-gradient-to-br from-orange-400 to-red-600 opacity-80 flex items-center justify-center rotate-12">
                   <div className="w-[120%] h-2 bg-white/30 rounded-full transform -rotate-12 blur-[1px]"></div>
                </div>
             </>
        )}
        {headerStyle === 'default' && (
            <div className="absolute top-0 left-0 w-full h-full opacity-10">
               <svg className="w-full h-full" viewBox="0 0 100 100" preserveAspectRatio="none">
                   <circle cx="0" cy="0" r="40" fill="white" />
                   <circle cx="100" cy="100" r="60" fill="white" />
               </svg>
            </div>
        )}
        {['frog', 'cat', 'panda', 'fox', 'dragon', 'penguin', 'bear', 'rabbit', 'bee', 'whale'].includes(headerStyle as string) && (
            <div className={`absolute inset-0 ${
                headerStyle === 'frog' ? 'bg-[#14532d]' : 
                headerStyle === 'cat' ? 'bg-[#FDBA74]' :
                headerStyle === 'panda' ? 'bg-zinc-800' :
                headerStyle === 'fox' ? 'bg-[#F97316]' :
                headerStyle === 'dragon' ? 'bg-[#EF4444]' :
                headerStyle === 'penguin' ? 'bg-blue-400' :
                headerStyle === 'bear' ? 'bg-amber-700' :
                headerStyle === 'rabbit' ? 'bg-pink-400' :
                headerStyle === 'bee' ? 'bg-yellow-400' :
                'bg-sky-500' // whale
            }`}>
                {headerStyle === 'frog' && (
                    <>
                        {/* Background color override for cuter frog */}
                        <div className="absolute inset-0 bg-[#86efac]"></div>
                        {/* Bụng ếch xanh nhạt */}
                        <div className="absolute -bottom-10 left-1/2 -translate-x-1/2 w-[85%] h-[60%] bg-[#bbf7d0] rounded-t-[100%] opacity-90"></div>
                        {/* Má hồng dễ thương */}
                        <div className="absolute top-[40%] left-[15%] w-12 h-6 bg-pink-400/60 rounded-full blur-[2px]"></div>
                        <div className="absolute top-[40%] right-[15%] w-12 h-6 bg-pink-400/60 rounded-full blur-[2px]"></div>
                        {/* Mũi ếch (2 chấm nhỏ) */}
                        <div className="absolute top-[35%] left-1/2 -translate-x-1/2 flex gap-4">
                            <div className="w-1.5 h-1.5 bg-[#166534] rounded-full opacity-60"></div>
                            <div className="w-1.5 h-1.5 bg-[#166534] rounded-full opacity-60"></div>
                        </div>
                        {/* Miệng ếch cười rộng (hình chữ U) */}
                        <div className="absolute top-[45%] left-1/2 -translate-x-1/2 w-24 h-12 border-b-[6px] border-[#166534] rounded-b-[2rem] shadow-[0_2px_4px_rgba(22,101,52,0.2)]"></div>
                        
                        {/* Các đốm lốm đốm đặc trưng */}
                        <div className="absolute top-[70%] left-[10%] w-8 h-6 bg-[#4ade80] rounded-full opacity-50"></div>
                        <div className="absolute top-[60%] right-[8%] w-10 h-8 bg-[#4ade80] rounded-full opacity-50"></div>
                        <div className="absolute top-[80%] right-[15%] w-6 h-4 bg-[#4ade80] rounded-full opacity-50"></div>
                    </>
                )}
                {headerStyle === 'cat' && (
                    <>
                        {/* Bụng / Lông miệng màu trắng kem */}
                        <div className="absolute bottom-[-20px] left-1/2 -translate-x-1/2 w-[60%] h-24 bg-orange-100 rounded-t-[100%] opacity-90 shadow-[0_-4px_12px_rgba(0,0,0,0.05)]"></div>
                        {/* Vằn hổ trên trán (Tabby stripes) */}
                        <div className="absolute -top-4 left-1/2 -translate-x-1/2 w-6 h-20 bg-orange-700/30 rounded-full"></div>
                        <div className="absolute -top-6 left-[45%] -translate-x-1/2 w-4 h-16 bg-orange-700/30 rounded-full rotate-[-15deg]"></div>
                        <div className="absolute -top-6 right-[45%] translate-x-1/2 w-4 h-16 bg-orange-700/30 rounded-full rotate-[15deg]"></div>
                        {/* Má hồng */}
                        <div className="absolute top-[35%] left-[15%] w-16 h-8 bg-pink-500/50 rounded-full blur-xl"></div>
                        <div className="absolute top-[35%] right-[15%] w-16 h-8 bg-pink-500/50 rounded-full blur-xl"></div>
                        {/* Mũi hồng */}
                        <div className="absolute top-[45%] left-1/2 -translate-x-1/2 w-8 h-5 bg-pink-400 rounded-[100%] shadow-[inset_0_2px_4px_rgba(255,255,255,0.5)]"></div>
                        {/* Miệng */}
                        <div className="absolute top-[50%] left-1/2 -translate-x-1/2 flex gap-1 opacity-80">
                            <div className="w-12 h-10 rounded-full border-b-[6px] border-r-[6px] border-[#c2410c] rotate-45"></div>
                            <div className="w-12 h-10 rounded-full border-b-[6px] border-l-[6px] border-[#c2410c] rotate-[-45deg]"></div>
                        </div>
                        {/* Râu (Whiskers) rõ ràng */}
                        <div className="absolute top-[45%] left-8 w-16 h-1.5 bg-white shadow-sm rotate-[5deg] opacity-80 rounded-full"></div>
                        <div className="absolute top-[55%] left-10 w-14 h-1.5 bg-white shadow-sm rotate-[-5deg] opacity-80 rounded-full"></div>
                        <div className="absolute top-[45%] right-8 w-16 h-1.5 bg-white shadow-sm rotate-[-5deg] opacity-80 rounded-full"></div>
                        <div className="absolute top-[55%] right-10 w-14 h-1.5 bg-white shadow-sm rotate-[5deg] opacity-80 rounded-full"></div>
                        {/* Lục lạc (Bell) ở cổ */}
                        <div className="absolute -bottom-8 left-1/2 -translate-x-1/2 w-16 h-16 bg-yellow-400 rounded-full shadow-lg border-4 border-yellow-600 z-10 flex items-center justify-center">
                            <div className="w-full h-2 bg-yellow-600 absolute top-1/2 -translate-y-1/2"></div>
                            <div className="w-4 h-4 bg-yellow-800 rounded-full absolute bottom-3"></div>
                            <div className="w-1 h-3 bg-yellow-800 absolute bottom-0"></div>
                        </div>
                        {/* Dây đeo cổ */}
                        <div className="absolute bottom-[-10px] left-0 w-full h-6 bg-red-500 shadow-md"></div>
                    </>
                )}
                {headerStyle === 'panda' && (
                    <>
                        {/* Bụng trắng / Mặt */}
                        <div className="absolute bottom-[-20px] left-1/2 -translate-x-1/2 w-[70%] h-32 bg-slate-100 rounded-t-[100%] opacity-95 shadow-[inset_0_-10px_20px_rgba(0,0,0,0.1)]"></div>
                        {/* Vết quầng mắt đen */}
                        <div className="absolute top-[20%] left-[20%] w-24 h-16 bg-zinc-950 rounded-full rotate-[-25deg] shadow-lg"></div>
                        <div className="absolute top-[20%] right-[20%] w-24 h-16 bg-zinc-950 rounded-full rotate-[25deg] shadow-lg"></div>
                        {/* Mắt con ngươi */}
                        <div className="absolute top-[25%] left-[25%] w-6 h-6 bg-white rounded-full flex items-start justify-end pt-1 pr-1"><div className="w-2 h-2 bg-zinc-950 rounded-full"></div></div>
                        <div className="absolute top-[25%] right-[25%] w-6 h-6 bg-white rounded-full flex items-start justify-start pt-1 pl-1"><div className="w-2 h-2 bg-zinc-950 rounded-full"></div></div>
                        {/* Mũi */}
                        <div className="absolute top-[50%] left-1/2 -translate-x-1/2 w-8 h-5 bg-zinc-900 rounded-[100%] shadow-[inset_0_2px_4px_rgba(255,255,255,0.2)]"></div>
                        {/* Miệng */}
                        <div className="absolute top-[55%] left-1/2 -translate-x-1/2 flex gap-1 opacity-80">
                            <div className="w-6 h-6 rounded-full border-b-[4px] border-r-[4px] border-zinc-800 rotate-45"></div>
                            <div className="w-6 h-6 rounded-full border-b-[4px] border-l-[4px] border-zinc-800 rotate-[-45deg]"></div>
                        </div>
                        {/* Lá trúc (Bamboo) */}
                        <div className="absolute bottom-4 left-4 w-12 h-4 bg-green-500 rounded-full rotate-[-45deg] [clip-path:polygon(0_50%,50%_0,100%_50%,50%_100%)] opacity-80"></div>
                        <div className="absolute bottom-0 left-0 w-16 h-4 bg-green-600 rounded-full rotate-[-30deg] [clip-path:polygon(0_50%,50%_0,100%_50%,50%_100%)] opacity-90"></div>
                        
                        <div className="absolute bottom-8 right-4 w-10 h-3 bg-green-500 rounded-full rotate-[45deg] [clip-path:polygon(0_50%,50%_0,100%_50%,50%_100%)] opacity-80"></div>
                        <div className="absolute bottom-2 right-2 w-14 h-4 bg-green-600 rounded-full rotate-[30deg] [clip-path:polygon(0_50%,50%_0,100%_50%,50%_100%)] opacity-90"></div>
                    </>
                )}
                {headerStyle === 'fox' && (
                    <>
                        <div className="absolute bottom-0 left-0 w-1/3 h-[80%] bg-white rounded-tr-full opacity-25 object-cover"></div>
                        <div className="absolute bottom-0 right-0 w-1/3 h-[80%] bg-white rounded-tl-full opacity-25"></div>
                        <div className="absolute top-[60%] left-1/2 -translate-x-1/2 w-8 h-6 bg-[#7c2d12] rounded-full opacity-90"></div>
                        <div className="absolute top-[70%] left-1/2 -translate-x-1/2 w-20 h-10 border-b-[6px] border-[#7c2d12] rounded-b-full opacity-80"></div>
                        {/* whiskers */}
                        <div className="absolute top-[50%] left-10 w-12 h-1.5 bg-[#7c2d12] rotate-[15deg] opacity-40 rounded-full"></div>
                        <div className="absolute top-[50%] right-10 w-12 h-1.5 bg-[#7c2d12] rotate-[-15deg] opacity-40 rounded-full"></div>
                    </>
                )}
                {headerStyle === 'dragon' && (
                    <>
                        <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-[90%] h-1/2 bg-yellow-500 rounded-t-full opacity-30"></div>
                        <div className="absolute top-[30%] left-[15%] w-8 h-8 border-t-8 border-r-8 border-red-900 rotate-[45deg] opacity-50"></div>
                        <div className="absolute top-[30%] right-[15%] w-8 h-8 border-t-8 border-l-8 border-red-900 rotate-[-45deg] opacity-50"></div>
                        <div className="absolute top-[45%] left-[25%] w-6 h-4 bg-red-900 rounded-full opacity-60 rotate-12"></div>
                        <div className="absolute top-[45%] right-[25%] w-6 h-4 bg-red-900 rounded-full opacity-60 rotate-[-12]"></div>
                        <div className="absolute top-[65%] left-1/2 -translate-x-1/2 w-32 h-10 border-b-8 border-red-950 rounded-b-full opacity-70"></div>
                        <div className="absolute top-[70%] left-1/2 -translate-x-[150%] w-4 h-6 border-l-4 border-b-4 border-red-950 rounded-bl-full rotate-12 opacity-60"></div>
                        <div className="absolute top-[70%] left-1/2 translate-x-[50%] w-4 h-6 border-r-4 border-b-4 border-red-950 rounded-br-full rotate-[-12deg] opacity-60"></div>
                    </>
                )}
                {headerStyle === 'penguin' && (
                    <>
                        <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-[60%] h-[90%] bg-white rounded-t-full opacity-90 shadow-[inset_0_-10px_20px_rgba(0,0,0,0.1)]"></div>
                        <div className="absolute top-[40%] left-[30%] w-6 h-6 bg-blue-900 rounded-full"></div>
                        <div className="absolute top-[40%] right-[30%] w-6 h-6 bg-blue-900 rounded-full"></div>
                        {/* beak */}
                        <div className="absolute top-[50%] left-1/2 -translate-x-1/2 w-10 h-8 bg-amber-400 rounded-b-full rounded-t-md shadow-sm border border-amber-500"></div>
                        <div className="absolute top-[48%] left-[20%] w-10 h-5 bg-pink-400/40 rounded-full blur-md"></div>
                        <div className="absolute top-[48%] right-[20%] w-10 h-5 bg-pink-400/40 rounded-full blur-md"></div>
                    </>
                )}
                {headerStyle === 'bear' && (
                    <>
                        <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-[55%] h-[60%] bg-amber-200 rounded-t-[100px] border-t-8 border-x-8 border-amber-800 opacity-90"></div>
                        <div className="absolute top-[50%] left-1/2 -translate-x-1/2 w-10 h-6 bg-amber-900 rounded-[100%] shadow-sm"></div>
                        <div className="absolute top-[60%] left-1/2 -translate-x-1/2 flex gap-1 opacity-90">
                            <div className="w-6 h-8 rounded-full border-b-[5px] border-r-[5px] border-amber-900 rotate-45"></div>
                            <div className="w-6 h-8 rounded-full border-b-[5px] border-l-[5px] border-amber-900 rotate-[-45deg]"></div>
                        </div>
                    </>
                )}
                {headerStyle === 'rabbit' && (
                    <>
                        {/* Tai Thỏ (Ears) */}
                        <div className="absolute -top-[10%] left-[25%] w-12 h-32 bg-pink-100 border-[6px] border-pink-400 rounded-t-[100px] rounded-b-[40px] rotate-[-15deg] shadow-lg"></div>
                        <div className="absolute -top-[10%] right-[25%] w-12 h-32 bg-pink-100 border-[6px] border-pink-400 rounded-t-[100px] rounded-b-[40px] rotate-[15deg] shadow-lg"></div>
                        <div className="absolute top-[5%] left-[28%] w-6 h-16 bg-pink-300 rounded-full rotate-[-15deg] opacity-60"></div>
                        <div className="absolute top-[5%] right-[28%] w-6 h-16 bg-pink-300 rounded-full rotate-[15deg] opacity-60"></div>
                        
                        {/* Bụng / Lông miệng màu trắng */}
                        <div className="absolute bottom-[-10px] left-1/2 -translate-x-1/2 w-[55%] h-[50%] bg-pink-50 rounded-t-[100%] opacity-90 shadow-[0_-4px_10px_rgba(0,0,0,0.05)]"></div>
                        
                        {/* Mắt to */}
                        <div className="absolute top-[35%] left-[25%] w-6 h-8 bg-pink-900 rounded-full flex items-start justify-end pt-1 pr-1"><div className="w-2 h-2 bg-white rounded-full"></div></div>
                        <div className="absolute top-[35%] right-[25%] w-6 h-8 bg-pink-900 rounded-full flex items-start justify-start pt-1 pl-1"><div className="w-2 h-2 bg-white rounded-full"></div></div>

                        {/* Mũi và Miệng */}
                        <div className="absolute top-[55%] left-1/2 -translate-x-1/2 w-5 h-3 bg-pink-600 rounded-[100%] shadow-[inset_0_1px_2px_rgba(255,255,255,0.4)] z-10"></div>
                        <div className="absolute top-[60%] left-1/2 -translate-x-1/2 flex gap-0.5 opacity-80">
                            <div className="w-5 h-6 rounded-full border-b-[4px] border-r-[4px] border-pink-800 rotate-45"></div>
                            <div className="w-5 h-6 rounded-full border-b-[4px] border-l-[4px] border-pink-800 rotate-[-45deg]"></div>
                        </div>
                        
                        {/* Má hồng dạ quang */}
                        <div className="absolute top-[45%] left-[15%] w-10 h-6 bg-pink-500/60 rounded-full blur-md"></div>
                        <div className="absolute top-[45%] right-[15%] w-10 h-6 bg-pink-500/60 rounded-full blur-md"></div>
                    </>
                )}
                {headerStyle === 'bee' && (
                    <>
                        <div className="absolute top-[40%] left-[10%] w-10 h-10 bg-zinc-900 rounded-full flex flex-col justify-center items-center gap-1">
                            <div className="w-4 h-4 bg-white rounded-full place-self-start ml-2"></div>
                        </div>
                        <div className="absolute top-[40%] right-[10%] w-10 h-10 bg-zinc-900 rounded-full flex flex-col justify-center items-center gap-1">
                            <div className="w-4 h-4 bg-white rounded-full place-self-end mr-2"></div>
                        </div>
                        <div className="absolute top-[65%] left-1/2 -translate-x-1/2 w-16 h-8 border-b-[6px] border-zinc-900 rounded-b-full"></div>
                        <div className="absolute top-[50%] left-[25%] w-8 h-4 bg-red-400/50 rounded-full blur-sm"></div>
                        <div className="absolute top-[50%] right-[25%] w-8 h-4 bg-red-400/50 rounded-full blur-sm"></div>
                    </>
                )}
                {headerStyle === 'whale' && (
                    <>
                        <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-[80%] h-12 bg-white rounded-t-full opacity-20"></div>
                        <div className="absolute top-[40%] left-[10%] w-4 h-4 bg-blue-900 rounded-full"></div>
                        <div className="absolute top-[40%] right-[10%] w-4 h-4 bg-blue-900 rounded-full"></div>
                        <div className="absolute top-[55%] left-1/2 -translate-x-1/2 w-24 h-12 border-b-[6px] border-blue-900 rounded-b-full opacity-80"></div>
                        <div className="absolute top-[45%] left-[15%] w-10 h-5 bg-pink-300/40 rounded-full blur-sm"></div>
                        <div className="absolute top-[45%] right-[15%] w-10 h-5 bg-pink-300/40 rounded-full blur-sm"></div>
                    </>
                )}
            </div>
        )}
      </div>
      
      {/* Animal Header Decorators (outside overflow-hidden) */}
      {headerStyle === 'frog' && (
        <>
          <div className="absolute -top-8 left-12 sm:left-16 w-20 h-20 bg-[#86efac] rounded-full flex justify-center items-center shadow-lg z-[-1] border-[4px] border-[#4ade80]">
              <div className="w-14 h-14 bg-white rounded-full flex justify-center items-center shadow-inner">
                  <div className="w-7 h-7 bg-slate-900 rounded-full translate-x-1.5">
                      <div className="w-2.5 h-2.5 bg-white rounded-full mt-1 ml-1"></div>
                  </div>
              </div>
          </div>
          <div className="absolute -top-8 right-12 sm:right-16 w-20 h-20 bg-[#86efac] rounded-full flex justify-center items-center shadow-lg z-[-1] border-[4px] border-[#4ade80]">
              <div className="w-14 h-14 bg-white rounded-full flex justify-center items-center shadow-inner">
                  <div className="w-7 h-7 bg-slate-900 rounded-full -translate-x-1.5">
                      <div className="w-2.5 h-2.5 bg-white rounded-full mt-1 ml-3.5"></div>
                  </div>
              </div>
          </div>
        </>
      )}
      {headerStyle === 'cat' && (
        <>
          <div className="absolute -top-5 left-10 w-12 h-14 bg-[#FDBA74] rotate-[-20deg] [clip-path:polygon(50%_0%,0%_100%,100%_100%)] z-[-1]">
             <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-6 h-8 bg-pink-200 [clip-path:polygon(50%_0%,0%_100%,100%_100%)]"></div>
          </div>
          <div className="absolute -top-5 right-10 w-12 h-14 bg-[#FDBA74] rotate-[20deg] [clip-path:polygon(50%_0%,0%_100%,100%_100%)] z-[-1]">
             <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-6 h-8 bg-pink-200 [clip-path:polygon(50%_0%,0%_100%,100%_100%)]"></div>
          </div>
        </>
      )}
      {headerStyle === 'panda' && (
        <>
          <div className="absolute -top-5 left-8 w-14 h-14 rounded-full bg-slate-800 z-[-1]"></div>
          <div className="absolute -top-5 right-8 w-14 h-14 rounded-full bg-slate-800 z-[-1]"></div>
        </>
      )}
      {headerStyle === 'fox' && (
        <>
          <div className="absolute -top-6 left-8 w-14 h-16 bg-[#F97316] rotate-[-15deg] [clip-path:polygon(50%_0%,0%_100%,100%_100%)] z-[-1]">
             <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-8 h-10 bg-slate-800 [clip-path:polygon(50%_0%,0%_100%,100%_100%)]"></div>
          </div>
          <div className="absolute -top-6 right-8 w-14 h-16 bg-[#F97316] rotate-[15deg] [clip-path:polygon(50%_0%,0%_100%,100%_100%)] z-[-1]">
             <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-8 h-10 bg-slate-800 [clip-path:polygon(50%_0%,0%_100%,100%_100%)]"></div>
          </div>
        </>
      )}
      {headerStyle === 'dragon' && (
        <>
          <div className="absolute -top-6 left-6 w-8 h-16 bg-red-600 rotate-[-30deg] [clip-path:polygon(50%_0%,10%_100%,90%_100%)] z-[-1]"></div>
          <div className="absolute -top-8 left-16 w-8 h-20 bg-red-600 rotate-[-15deg] [clip-path:polygon(50%_0%,10%_100%,90%_100%)] z-[-1]"></div>
          <div className="absolute -top-6 right-6 w-8 h-16 bg-red-600 rotate-[30deg] [clip-path:polygon(50%_0%,10%_100%,90%_100%)] z-[-1]"></div>
          <div className="absolute -top-8 right-16 w-8 h-20 bg-red-600 rotate-[15deg] [clip-path:polygon(50%_0%,10%_100%,90%_100%)] z-[-1]"></div>
        </>
      )}
      {headerStyle === 'penguin' && (
        <>
          <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-[70%] h-1/2 bg-white rounded-t-[100%] opacity-90 z-[-1]"></div>
        </>
      )}
      {headerStyle === 'bear' && (
        <>
          <div className="absolute -top-5 left-10 w-14 h-14 rounded-full bg-amber-700 z-[-1] flex items-center justify-center">
             <div className="w-8 h-8 rounded-full bg-amber-800"></div>
          </div>
          <div className="absolute -top-5 right-10 w-14 h-14 rounded-full bg-amber-700 z-[-1] flex items-center justify-center">
             <div className="w-8 h-8 rounded-full bg-amber-800"></div>
          </div>
        </>
      )}
      {headerStyle === 'rabbit' && (
        <>
          <div className="absolute -top-12 left-12 w-12 h-24 bg-pink-400 rotate-[-15deg] rounded-full z-[-1] border-4 border-pink-400 flex items-center justify-center">
             <div className="w-6 h-16 bg-pink-200 rounded-full"></div>
          </div>
          <div className="absolute -top-12 right-12 w-12 h-24 bg-pink-400 rotate-[15deg] rounded-full z-[-1] border-4 border-pink-400 flex items-center justify-center">
             <div className="w-6 h-16 bg-pink-200 rounded-full"></div>
          </div>
        </>
      )}
      {headerStyle === 'bee' && (
        <>
          <div className="absolute top-4 w-full h-8 bg-zinc-800/80 z-[-1] border-y-4 border-zinc-900"></div>
          <div className="absolute bottom-4 w-full h-8 bg-zinc-800/80 z-[-1] border-y-4 border-zinc-900"></div>
          <div className="absolute -top-4 left-[20%] w-16 h-12 bg-white/40 rounded-full backdrop-blur-sm z-[-2] rotate-[-20deg]"></div>
          <div className="absolute -top-4 right-[20%] w-16 h-12 bg-white/40 rounded-full backdrop-blur-sm z-[-2] rotate-[20deg]"></div>
        </>
      )}
      {headerStyle === 'whale' && (
        <>
          <div className="absolute -top-10 left-1/2 -translate-x-1/2 w-4 h-12 bg-blue-200/60 z-[-1]"></div>
          <div className="absolute -top-12 left-1/2 -translate-x-[70%] w-6 h-4 bg-blue-200/60 rounded-full rotate-[-30deg] z-[-1]"></div>
          <div className="absolute -top-12 left-1/2 -translate-x-[30%] w-6 h-4 bg-blue-200/60 rounded-full rotate-[30deg] z-[-1]"></div>
          <div className="absolute bottom-0 w-full h-4 bg-blue-600/30"></div>
        </>
      )}

      {/* Content Layer */}
      <div className={`relative z-10 text-center ${headerStyle !== 'default' ? 'pt-24 pb-6 sm:pt-28 sm:pb-8' : 'pt-20 pb-4 sm:pt-24 sm:pb-6'}`}>
        
      </div>
    </div>
  );
};