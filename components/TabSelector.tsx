import React from 'react';
import { ThemeColor } from '../types';

interface TabSelectorProps {
  activeTab: 'convert' | 'calculate';
  onTabChange: (tab: 'convert' | 'calculate') => void;
  theme: ThemeColor;
}

export const TabSelector: React.FC<TabSelectorProps> = ({ activeTab, onTabChange, theme }) => {
  return (
    <div className="flex p-1.5 bg-slate-100 rounded-xl mb-6 relative">
      <div 
        className="absolute top-1.5 bottom-1.5 rounded-lg bg-white shadow-sm transition-all duration-300 ease-in-out"
        style={{
            left: activeTab === 'convert' ? '0.375rem' : '50%',
            width: 'calc(50% - 0.375rem)'
        }}
      />
      <button
        onClick={() => onTabChange('convert')}
        className={`flex-1 relative z-10 py-2.5 text-sm sm:text-base font-bold text-center rounded-lg transition-colors ${
            activeTab === 'convert' ? 'text-slate-800' : 'text-slate-500 hover:text-slate-700'
        }`}
      >
        Chuyển đổi tiền
      </button>
      <button
        onClick={() => onTabChange('calculate')}
        className={`flex-1 relative z-10 py-2.5 text-sm sm:text-base font-bold text-center rounded-lg transition-colors ${
            activeTab === 'calculate' ? 'text-slate-800' : 'text-slate-500 hover:text-slate-700'
        }`}
      >
        Tính phí dịch vụ
      </button>
    </div>
  );
};