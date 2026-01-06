import React from 'react';
import { ThemeColor } from '../types';

interface TabSelectorProps {
  activeTab: 'convert' | 'calculate' | 'revenue';
  onTabChange: (tab: 'convert' | 'calculate' | 'revenue') => void;
  theme: ThemeColor;
}

export const TabSelector: React.FC<TabSelectorProps> = ({ activeTab, onTabChange, theme }) => {
  const getLeftPosition = () => {
    switch (activeTab) {
      case 'convert': return '0.375rem';
      case 'calculate': return 'calc(33.33% + 0.1875rem)';
      case 'revenue': return 'calc(66.66% + 0.1875rem)'; // adjusted for 3 tabs
      default: return '0.375rem';
    }
  };

  return (
    <div className="flex p-1.5 bg-white/50 backdrop-blur-sm rounded-xl mb-6 relative">
      <div 
        className="absolute top-1.5 bottom-1.5 rounded-lg bg-white shadow-sm ring-1 ring-black/5 transition-all duration-300 ease-in-out"
        style={{
            left: getLeftPosition(),
            width: 'calc(33.33% - 0.5rem)'
        }}
      />
      <button
        onClick={() => onTabChange('convert')}
        className={`flex-1 relative z-10 py-2.5 text-xs sm:text-sm md:text-base font-bold text-center rounded-lg transition-colors duration-300 ${
            activeTab === 'convert' ? 'text-primary-700' : 'text-slate-500 hover:text-slate-700'
        }`}
      >
        Chuyển đổi
      </button>
      <button
        onClick={() => onTabChange('calculate')}
        className={`flex-1 relative z-10 py-2.5 text-xs sm:text-sm md:text-base font-bold text-center rounded-lg transition-colors duration-300 ${
            activeTab === 'calculate' ? 'text-primary-700' : 'text-slate-500 hover:text-slate-700'
        }`}
      >
        Tính phí
      </button>
       <button
        onClick={() => onTabChange('revenue')}
        className={`flex-1 relative z-10 py-2.5 text-xs sm:text-sm md:text-base font-bold text-center rounded-lg transition-colors duration-300 ${
            activeTab === 'revenue' ? 'text-primary-700' : 'text-slate-500 hover:text-slate-700'
        }`}
      >
        Tính doanh thu
      </button>
    </div>
  );
};