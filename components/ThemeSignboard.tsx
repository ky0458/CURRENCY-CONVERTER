import React from 'react';
import { HeaderStyle } from '../types';

interface ThemeSignboardProps {
  style: HeaderStyle;
}

export const ThemeSignboard: React.FC<ThemeSignboardProps> = ({ style }) => {
  let bg = 'bg-[#fef3c7]';
  let border = 'border-amber-700';
  let text = 'text-amber-900';
  let poles = 'bg-amber-800 border-amber-950';
  let decorTop = null;
  let decorInside = null;
  let boardRounding = 'rounded-xl';

  switch (style) {
    case 'waves':
      bg = 'bg-blue-100'; border = 'border-blue-500'; text = 'text-blue-900'; poles = 'bg-blue-600 border-blue-800';
      decorTop = (
        <div className="absolute -top-3 left-1/2 -translate-x-1/2 flex gap-2">
            <div className="w-8 h-8 bg-blue-400 rounded-full flex items-center justify-center opacity-80"><div className="w-4 h-1 bg-blue-900 rounded-full mt-2"></div></div>
            <div className="w-6 h-6 bg-blue-300 rounded-full mt-2 flex items-center justify-center opacity-70"><div className="w-2 h-0.5 bg-blue-800 rounded-full mt-1"></div></div>
        </div>
      );
      break;
    case 'clouds':
      bg = 'bg-white'; border = 'border-sky-300'; text = 'text-sky-800'; poles = 'bg-slate-300 border-slate-400';
      boardRounding = 'rounded-3xl';
      decorTop = (
        <div className="absolute -top-4 left-1/2 -translate-x-1/2 w-40 h-10 bg-white rounded-t-full flex justify-center items-end pb-1 gap-4 z-20">
           <div className="w-3 h-1 bg-slate-800 rounded-full rotate-12"></div>
           <div className="w-3 h-1 bg-slate-800 rounded-full -rotate-12"></div>
           <div className="absolute top-3 left-1/2 -translate-x-1/2 w-2 h-1 bg-pink-300 rounded-full"></div>
        </div>
      );
      break;
    case 'sunset':
      bg = 'bg-gradient-to-r from-orange-100 to-rose-100'; border = 'border-orange-500'; text = 'text-rose-900'; poles = 'bg-orange-800 border-orange-950';
      decorTop = (
        <div className="absolute -top-6 left-1/2 -translate-x-1/2 w-12 h-12 bg-yellow-400 rounded-full border-2 border-orange-400 z-0 flex items-center justify-center gap-1.5 shadow-[0_0_15px_rgba(250,204,21,0.5)]">
           <div className="w-1.5 h-1.5 bg-orange-800 rounded-full mb-1"></div>
           <div className="w-1.5 h-1.5 bg-orange-800 rounded-full mb-1"></div>
           <div className="absolute bottom-2.5 w-3 h-1 bg-orange-800 rounded-full"></div>
        </div>
      );
      break;
    case 'forest':
      bg = 'bg-[#dcfce7]'; border = 'border-green-600'; text = 'text-green-900'; poles = 'bg-green-800 border-green-900';
      decorTop = (
        <div className="absolute -top-4 -left-4 w-12 h-12 bg-green-500 rounded-full border-[3px] border-green-700 flex flex-col items-center justify-center pt-1 z-20 shadow-md">
            <div className="flex gap-2 mb-1"><div className="w-1.5 h-1.5 bg-green-900 rounded-full"></div><div className="w-1.5 h-1.5 bg-green-900 rounded-full"></div></div>
            <div className="w-2 h-1.5 bg-green-800 rounded-full"></div>
        </div>
      );
      break;
    case 'magic':
      bg = 'bg-purple-100'; border = 'border-purple-500'; text = 'text-purple-900'; poles = 'bg-purple-800 border-purple-950';
      decorTop = (
        <div className="absolute -top-8 right-2 flex flex-col items-center z-20">
            <div className="w-0 h-0 border-l-[12px] border-r-[12px] border-b-[24px] border-transparent border-b-indigo-500"></div>
            <div className="w-10 h-3 bg-indigo-600 rounded-full -mt-2 shadow-md"></div>
        </div>
      );
      decorInside = (
          <div className="absolute right-4 top-2 text-xl animate-pulse">✨</div>
      );
      break;
    case 'ocean':
      bg = 'bg-teal-50'; border = 'border-teal-500'; text = 'text-teal-900'; poles = 'bg-teal-700 border-teal-900';
      decorTop = (
        <div className="absolute -top-5 left-1/2 -translate-x-1/2 bg-teal-400 w-16 h-10 rounded-t-full border-[3px] border-teal-600 border-b-0 flex justify-center pt-2 gap-3 z-20">
           <div className="w-1.5 h-1.5 bg-teal-900 rounded-full"></div>
           <div className="w-1.5 h-1.5 bg-teal-900 rounded-full"></div>
           <div className="absolute top-4 w-2 h-1 bg-teal-800 rounded-full"></div>
        </div>
      );
      break;
    case 'space':
      bg = 'bg-slate-800'; border = 'border-indigo-400'; text = 'text-indigo-50'; poles = 'bg-slate-600 border-slate-700';
      decorTop = (
        <div className="absolute -top-6 left-1/2 -translate-x-1/2 w-16 h-10 bg-slate-300 rounded-t-full border-[3px] border-slate-500 flex justify-center pt-3 gap-4 z-20 shadow-[0_0_15px_rgba(129,140,248,0.4)]">
           <div className="w-2 h-4 bg-slate-800 rounded-full"></div>
           <div className="w-2 h-4 bg-slate-800 rounded-full"></div>
        </div>
      );
      decorInside = (
          <div className="absolute left-2 top-2 text-indigo-300 text-sm animate-pulse">✦</div>
      );
      break;
    case 'frog':
      bg = 'bg-[#86efac]'; border = 'border-[#4ade80]'; text = 'text-green-900'; poles = 'bg-green-800 border-green-950';
      decorTop = (
        <>
            <div className="absolute -top-5 left-6 sm:left-10 w-12 h-10 bg-[#86efac] rounded-t-full border-[3px] border-[#4ade80] flex justify-center items-center pt-1 z-0 shadow-sm overflow-hidden">
                <div className="w-6 h-6 bg-white rounded-full flex justify-center items-center mb-1">
                    <div className="w-3 h-3 bg-slate-900 rounded-full translate-x-0.5">
                        <div className="w-1 h-1 bg-white rounded-full ml-0.5 mt-0.5"></div>
                    </div>
                </div>
            </div>
            <div className="absolute -top-5 right-6 sm:right-10 w-12 h-10 bg-[#86efac] rounded-t-full border-[3px] border-[#4ade80] flex justify-center items-center pt-1 z-0 shadow-sm overflow-hidden">
                <div className="w-6 h-6 bg-white rounded-full flex justify-center items-center mb-1">
                    <div className="w-3 h-3 bg-slate-900 rounded-full -translate-x-0.5">
                        <div className="w-1 h-1 bg-white rounded-full ml-1 mt-0.5"></div>
                    </div>
                </div>
            </div>
        </>
      );
      decorInside = (
          <div className="absolute top-2 left-1/2 -translate-x-1/2 flex flex-col items-center z-20 pointer-events-none">
              <div className="flex gap-6 mb-1">
                  <div className="w-1.5 h-1 bg-[#166534] rounded-full"></div>
                  <div className="w-1.5 h-1 bg-[#166534] rounded-full"></div>
              </div>
              <div className="w-6 h-3 border-b-2 border-[#166534] rounded-b-full"></div>
              <div className="absolute top-2 left-[-40px] w-4 h-2 bg-pink-400/50 rounded-full blur-[1px]"></div>
              <div className="absolute top-2 right-[-40px] w-4 h-2 bg-pink-400/50 rounded-full blur-[1px]"></div>
          </div>
      );
      break;
    case 'cat':
      bg = 'bg-amber-100'; border = 'border-amber-600'; text = 'text-amber-900'; poles = 'bg-amber-800 border-amber-950';
      decorTop = (
        <>
            <div className="absolute -top-3 left-6 w-0 h-0 border-l-[10px] border-r-[10px] border-b-[16px] border-transparent border-b-amber-500 rotate-[-15deg] z-10"></div>
            <div className="absolute -top-3 right-6 w-0 h-0 border-l-[10px] border-r-[10px] border-b-[16px] border-transparent border-b-amber-500 rotate-[15deg] z-10"></div>
        </>
      );
      decorInside = (
          <div className="absolute top-2 left-1/2 -translate-x-1/2 flex flex-col items-center z-20 pointer-events-none">
              <div className="flex gap-8 mb-1">
                  <div className="w-2.5 h-2.5 bg-amber-900 rounded-full"></div>
                  <div className="w-2.5 h-2.5 bg-amber-900 rounded-full"></div>
              </div>
              <div className="w-3 h-2 border-b-[3px] border-amber-900 rounded-b-full"></div>
          </div>
      );
      break;
    case 'panda':
      bg = 'bg-white'; border = 'border-slate-800'; text = 'text-slate-900'; poles = 'bg-slate-700 border-slate-900';
      boardRounding = 'rounded-[2rem]';
      decorInside = (
        <div className="absolute top-1 left-1/2 -translate-x-1/2 flex gap-12 z-20">
             <div className="w-6 h-4 bg-slate-800 rounded-full flex items-center justify-center rotate-12"><div className="w-1.5 h-1.5 bg-white rounded-full"></div></div>
             <div className="w-6 h-4 bg-slate-800 rounded-full flex items-center justify-center -rotate-12"><div className="w-1.5 h-1.5 bg-white rounded-full"></div></div>
             <div className="absolute top-3 left-1/2 -translate-x-1/2 w-3 h-1.5 bg-slate-800 rounded-full"></div>
        </div>
      );
      break;
    case 'fox':
      bg = 'bg-orange-100'; border = 'border-orange-600'; text = 'text-orange-900'; poles = 'bg-orange-800 border-orange-950';
      decorTop = (
        <>
            <div className="absolute -top-3 left-4 w-0 h-0 border-l-[10px] border-r-[10px] border-b-[16px] border-transparent border-b-orange-600 rotate-[-20deg] z-10"></div>
            <div className="absolute -top-3 right-4 w-0 h-0 border-l-[10px] border-r-[10px] border-b-[16px] border-transparent border-b-orange-600 rotate-[20deg] z-10"></div>
        </>
      );
      decorInside = (
          <div className="absolute top-2 left-1/2 -translate-x-1/2 flex flex-col items-center z-20 pointer-events-none">
              <div className="flex gap-10 mb-1">
                  <div className="w-2.5 h-2.5 bg-orange-900 rounded-full"></div>
                  <div className="w-2.5 h-2.5 bg-orange-900 rounded-full"></div>
              </div>
              <div className="w-2.5 h-2.5 bg-orange-900 rounded-full"></div>
          </div>
      );
      break;
    case 'dragon':
      bg = 'bg-red-100'; border = 'border-red-600'; text = 'text-red-900'; poles = 'bg-red-800 border-red-950';
      decorInside = (
          <div className="absolute top-1 left-1/2 -translate-x-1/2 flex gap-8 z-20">
             <div className="w-2 h-0.5 bg-red-800 rounded-full"></div>
             <div className="w-3 h-1.5 bg-red-400 rounded-full mt-2"></div>
             <div className="w-2 h-0.5 bg-red-800 rounded-full"></div>
             <div className="absolute top-1 left-1/2 -translate-x-1/2 w-8 h-8 rounded-full border-b-[3px] border-red-500"></div>
          </div>
      );
      break;
    case 'penguin':
      bg = 'bg-slate-800'; border = 'border-slate-900'; text = 'text-slate-900'; poles = 'bg-slate-700 border-slate-900';
      decorInside = (
        <>
          <div className="absolute inset-x-4 top-0 bottom-0 bg-white rounded-t-full z-0"></div>
          <div className="absolute top-2 left-1/2 -translate-x-1/2 flex gap-8 z-20 pointer-events-none">
              <div className="w-2 h-2 bg-slate-800 rounded-full"></div>
              <div className="w-2 h-2 bg-slate-800 rounded-full"></div>
              <div className="absolute top-2.5 left-1/2 -translate-x-1/2 w-3 h-2 bg-yellow-400 rounded-full"></div>
          </div>
        </>
      );
      break;
    case 'bear':
      bg = 'bg-amber-100'; border = 'border-amber-700'; text = 'text-amber-950'; poles = 'bg-amber-900 border-yellow-900';
      decorInside = (
         <div className="absolute top-0 left-1/2 -translate-x-1/2 w-12 h-6 bg-amber-200 rounded-b-full border-[3px] border-amber-400 flex justify-center z-20"><div className="w-3 h-2 bg-amber-950 rounded-b-full mt-1"></div></div>
      );
      break;
    case 'rabbit':
      bg = 'bg-pink-50'; border = 'border-pink-400'; text = 'text-pink-900'; poles = 'bg-pink-600 border-pink-700';
      break;
    case 'bee':
      bg = 'bg-yellow-200'; border = 'border-yellow-600'; text = 'text-yellow-900'; poles = 'bg-yellow-800 border-yellow-950';
      decorInside = (
          <>
            <div className="absolute left-[20%] top-0 bottom-0 w-3 bg-slate-800 opacity-20"></div>
            <div className="absolute left-[50%] top-0 bottom-0 w-3 bg-slate-800 opacity-20"></div>
            <div className="absolute left-[80%] top-0 bottom-0 w-3 bg-slate-800 opacity-20"></div>
          </>
      );
      break;
    case 'whale':
      bg = 'bg-sky-100'; border = 'border-sky-500'; text = 'text-sky-900'; poles = 'bg-sky-700 border-sky-900';
      decorInside = (
         <div className="absolute top-3 left-1/2 -translate-x-1/2 flex gap-12 z-20">
             <div className="w-1.5 h-1.5 bg-blue-900 rounded-full"></div>
             <div className="w-1.5 h-1.5 bg-blue-900 rounded-full"></div>
             <div className="absolute top-1 left-1/2 -translate-x-1/2 w-4 h-2 rounded-b-full border-b-2 border-blue-900"></div>
         </div>
      );
      break;
    default:
      decorInside = (
        <>
          {/* Wood texture lines */}
          <div className="absolute top-2 left-0 w-full h-[1px] bg-amber-700/20 z-0"></div>
          <div className="absolute top-5 left-0 w-full h-[1px] bg-amber-700/10 z-0"></div>
          <div className="absolute bottom-3 left-0 w-full h-[1px] bg-amber-700/20 z-0"></div>
        </>
      );
      break;
  }

  return (
    <div className="relative flex flex-col items-center drop-shadow-xl hover:-translate-y-1 transition-transform duration-300 pointer-events-auto pb-1.5 sm:pb-2.5">
      {/* Wooden poles overlapping behind the board up to the bottom of the wrapper */}
      <div className="flex justify-between w-[50%] sm:w-[55%] absolute top-2 bottom-0 z-10 pointer-events-none">
          <div className={`w-3.5 sm:w-4 h-full ${poles} border-x border-b shadow-[inset_2px_0_4px_rgba(0,0,0,0.3)] rounded-b-sm`}></div>
          <div className={`w-3.5 sm:w-4 h-full ${poles} border-x border-b shadow-[inset_2px_0_4px_rgba(0,0,0,0.3)] rounded-b-sm`}></div>
      </div>
      
      {/* The board */}
      <div className={`relative ${bg} border-[3px] ${border} ${boardRounding} px-6 pt-6 pb-4 sm:px-12 md:px-16 sm:pt-7 sm:pb-4.5 shadow-lg overflow-hidden z-20 w-max max-w-[290px] sm:maxw-none min-w-[270px] sm:min-w-[420px] md:min-w-[480px] flex flex-col items-center min-h-[70px] sm:min-h-[85px] mt-1`}>
          {decorInside}
          
          {/* Nails */}
          <div className="absolute top-2 left-3 w-1.5 h-1.5 rounded-full bg-black/20 shadow-[inset_0_1px_1px_rgba(255,255,255,0.4)] z-20 hidden sm:block"></div>
          <div className="absolute top-2 right-3 w-1.5 h-1.5 rounded-full bg-black/20 shadow-[inset_0_1px_1px_rgba(255,255,255,0.4)] z-20 hidden sm:block"></div>
          <div className="absolute bottom-2 left-3 w-1.5 h-1.5 rounded-full bg-black/20 shadow-[inset_0_1px_1px_rgba(255,255,255,0.4)] z-20"></div>
          <div className="absolute bottom-2 right-3 w-1.5 h-1.5 rounded-full bg-black/20 shadow-[inset_0_1px_1px_rgba(255,255,255,0.4)] z-20"></div>
          
          <h1 className={`relative z-30 ${text} mb-1.5 tracking-tight whitespace-nowrap text-[15px] sm:text-lg md:text-xl font-black uppercase ${!['penguin', 'space', 'clouds', 'panda'].includes(style) ? '[text-shadow:0_1px_1px_rgba(255,255,255,0.6)]' : ''}`}>Máy Đổi Tiền Của Gia Hân</h1>
          
          <div className={`inline-flex items-center gap-1.5 text-[10px] sm:text-[11px] font-bold ${text} opacity-95 relative z-30 max-w-full bg-white/20 px-3 py-1 rounded-full border ${border.replace('border-', 'border-').replace(/-\d00$/, '-400/30')} shadow-sm`}>
             <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse shadow-[0_0_8px_#4ade80]"></span>
             <span className="truncate">Tỷ giá cập nhật liên tục</span>
          </div>
      </div>
      
      {/* Decorations on top of the board */}
      {decorTop}
    </div>
  );
};
