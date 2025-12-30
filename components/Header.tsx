import React from 'react';
import { ThemeColor } from '../types';

interface HeaderProps {
  theme: ThemeColor;
  onShowHistory: () => void;
}

export const Header: React.FC<HeaderProps> = ({ theme }) => {
  return (
    <div className="relative rounded-t-3xl z-[50]">
      {/* Background Layer: Handles gradient, clipping of decorations (SVG), and border radius */}
      <div className={`absolute inset-0 bg-gradient-to-r from-primary-600 to-primary-800 overflow-hidden rounded-t-3xl transition-colors duration-500`}>
        <div className="absolute top-0 left-0 w-full h-full opacity-10">
           <svg className="w-full h-full" viewBox="0 0 100 100" preserveAspectRatio="none">
               <circle cx="0" cy="0" r="40" fill="white" />
               <circle cx="100" cy="100" r="60" fill="white" />
           </svg>
        </div>
      </div>
      
      {/* Content Layer */}
      <div className="relative z-10 p-6 sm:p-8 text-center">
        <div className="relative z-10">
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white mb-2 tracking-tight drop-shadow-sm pr-0">Máy Đổi Tiền Của Gia Hân</h1>
          <div className="inline-flex items-center gap-2 text-white/90 text-xs sm:text-sm font-medium bg-white/20 px-3 py-1 rounded-full backdrop-blur-md">
             <span className="w-2 h-2 rounded-full bg-green-400 animate-pulse"></span>
             Tỷ giá cập nhật liên tục
          </div>
        </div>
      </div>
    </div>
  );
};