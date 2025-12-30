
import React from 'react';
import { ThemeColor } from '../types';

interface SwapButtonProps {
  onClick: () => void;
  isSwapping: boolean;
  theme: ThemeColor;
}

export const SwapButton: React.FC<SwapButtonProps> = ({ onClick, isSwapping }) => {
  return (
    <div className="flex items-center justify-center pointer-events-none">
        <button
            onClick={onClick}
            className={`
                pointer-events-auto
                flex-shrink-0 w-12 h-12 rounded-full shadow-lg 
                bg-white text-primary-600 
                border-[5px] border-white
                hover:bg-primary-50 hover:text-primary-700 hover:border-primary-50
                transition-all duration-300 transform flex items-center justify-center
                ${isSwapping ? `animate-swap-spin bg-primary-50` : `hover:scale-110 hover:shadow-primary-200/50`}
                focus:outline-none focus:ring-2 focus:ring-primary-500/30
            `}
            title="Hoán đổi vị trí"
        >
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-5 h-5 sm:w-6 sm:h-6 transform rotate-90 md:rotate-0 transition-transform duration-300">
                <path strokeLinecap="round" strokeLinejoin="round" d="M7.5 21 3 16.5m0 0L7.5 12M3 16.5h13.5m0-13.5L21 7.5m0 0L16.5 12M21 7.5H7.5" />
            </svg>
        </button>
    </div>
  );
};