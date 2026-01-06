
import React from 'react';
import { ThemeColor } from '../types';

interface TabSelectorProps {
  activeTab: 'convert' | 'calculate' | 'revenue';
  onTabChange: (tab: 'convert' | 'calculate' | 'revenue') => void;
  theme: ThemeColor;
}

export const TabSelector: React.FC<TabSelectorProps> = ({ activeTab, onTabChange, theme }) => {
  // Calculate position based on grid column index (0, 1, 2)
  const getTransform = () => {
    switch (activeTab) {
      case 'convert': return 'translateX(0%)';
      case 'calculate': return 'translateX(100%)';
      case 'revenue': return 'translateX(200%)';
      default: return 'translateX(0%)';
    }
  };

  return (
    <div className="bg-white/50 backdrop-blur-sm rounded-xl mb-6 relative shadow-sm border border-white/40 p-1.5">
      <div className="relative grid grid-cols-3 h-10 sm:h-11">
        
        {/* Sliding Background */}
        <div 
          className="absolute top-0 bottom-0 left-0 w-1/3 p-0.5 transition-transform duration-300 ease-in-out"
          style={{ transform: getTransform() }}
        >
            <div className="w-full h-full rounded-lg bg-gradient-to-r from-primary-600 to-primary-500 shadow-md shadow-primary-200"></div>
        </div>

        {/* Buttons */}
        <button
          onClick={() => onTabChange('convert')}
          className={`relative z-10 h-full flex items-center justify-center text-xs sm:text-sm md:text-base font-bold rounded-lg transition-colors duration-200 ${
              activeTab === 'convert' ? 'text-white' : 'text-slate-500 hover:text-slate-800'
          }`}
        >
          Chuyển đổi
        </button>
        <button
          onClick={() => onTabChange('calculate')}
          className={`relative z-10 h-full flex items-center justify-center text-xs sm:text-sm md:text-base font-bold rounded-lg transition-colors duration-200 ${
              activeTab === 'calculate' ? 'text-white' : 'text-slate-500 hover:text-slate-800'
          }`}
        >
          Tính phí
        </button>
         <button
          onClick={() => onTabChange('revenue')}
          className={`relative z-10 h-full flex items-center justify-center text-xs sm:text-sm md:text-base font-bold rounded-lg transition-colors duration-200 ${
              activeTab === 'revenue' ? 'text-white' : 'text-slate-500 hover:text-slate-800'
          }`}
        >
          Tính doanh thu
        </button>
      </div>
    </div>
  );
};
