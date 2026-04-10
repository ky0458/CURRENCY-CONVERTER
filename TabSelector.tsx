
import React from 'react';
import { ThemeColor } from '../types';

interface TabSelectorProps {
  activeTab: 'convert' | 'calculate';
  onTabChange: (tab: 'convert' | 'calculate') => void;
  theme: ThemeColor;
}

export const TabSelector: React.FC<TabSelectorProps> = ({ activeTab, onTabChange, theme }) => {
  // Calculate position based on grid column index (0, 1)
  const getTransform = () => {
    switch (activeTab) {
      case 'convert': return 'translateX(0%)';
      case 'calculate': return 'translateX(100%)';
      default: return 'translateX(0%)';
    }
  };

  return (
    <div className="bg-white/50 backdrop-blur-sm rounded-xl mb-6 relative shadow-sm border border-white/40 p-1.5 overflow-hidden">
      <div className="relative grid grid-cols-2 h-10 sm:h-11">
        
        {/* Sliding Background - Width 1/2 */}
        <div 
          className="absolute top-0 bottom-0 left-0 w-1/2 p-0.5 transition-transform duration-300 ease-in-out"
          style={{ transform: getTransform() }}
        >
            <div className="w-full h-full rounded-lg bg-gradient-to-r from-primary-600 to-primary-500 shadow-md shadow-primary-200"></div>
        </div>

        {/* Buttons */}
        <button
          onClick={() => onTabChange('convert')}
          className={`relative z-10 h-full flex items-center justify-center text-[10px] sm:text-xs md:text-sm font-bold rounded-lg transition-colors duration-200 ${
              activeTab === 'convert' ? 'text-white' : 'text-slate-500 hover:text-slate-800'
          }`}
        >
          Quy đổi
        </button>
        <button
          onClick={() => onTabChange('calculate')}
          className={`relative z-10 h-full flex items-center justify-center text-[10px] sm:text-xs md:text-sm font-bold rounded-lg transition-colors duration-200 ${
              activeTab === 'calculate' ? 'text-white' : 'text-slate-500 hover:text-slate-800'
          }`}
        >
          Tính phí & Doanh thu
        </button>
      </div>
    </div>
  );
};
