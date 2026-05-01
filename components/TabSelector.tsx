
import React from 'react';
import { ThemeColor, ButtonStyle } from '../types';

interface TabSelectorProps {
  activeTab: 'cv' | 'calculate' | 'convert';
  onTabChange: (tab: 'cv' | 'calculate' | 'convert') => void;
  theme: ThemeColor;
  buttonStyle?: ButtonStyle;
}

export const TabSelector: React.FC<TabSelectorProps> = ({ activeTab, onTabChange, theme, buttonStyle = 'default' }) => {
  // Calculate position based on grid column index (0, 1, 2)
  const getTransform = () => {
    switch (activeTab) {
      case 'cv': return 'translateX(0%)';
      case 'calculate': return 'translateX(100%)';
      case 'convert': return 'translateX(200%)';
      default: return 'translateX(0%)';
    }
  };

  const activeTabClassConfig = {
    bgClass: 'bg-gradient-to-r from-primary-600 to-primary-500 shadow-md shadow-primary-200',
    textClass: 'text-white'
  };

  if (buttonStyle === 'frog') {
    activeTabClassConfig.bgClass = 'bg-green-100 shadow-md border-b-2 border-r-2 border-green-600 shadow-green-900/20';
    activeTabClassConfig.textClass = 'text-green-900 font-bold';
  } else if (buttonStyle === 'cat') {
    activeTabClassConfig.bgClass = 'bg-[#FDBA74] shadow-md border-b-2 border-[#EA580C]';
    activeTabClassConfig.textClass = 'text-slate-900';
  } else if (buttonStyle === 'panda') {
    activeTabClassConfig.bgClass = 'bg-zinc-800 shadow-md border-b-2 border-zinc-900';
  } else if (buttonStyle === 'fox') {
    activeTabClassConfig.bgClass = 'bg-[#F97316] shadow-md border-b-2 border-[#C2410C]';
  } else if (buttonStyle === 'dragon') {
    activeTabClassConfig.bgClass = 'bg-red-600 shadow-md border-b-2 border-red-900 !rounded-none [clip-path:polygon(5%_0%,95%_0%,100%_50%,95%_100%,5%_100%,0%_50%)]';
  } else if (buttonStyle === 'penguin') {
    activeTabClassConfig.bgClass = 'bg-blue-400 shadow-md border-b-2 border-blue-600 !rounded-full';
  } else if (buttonStyle === 'bear') {
    activeTabClassConfig.bgClass = 'bg-amber-700 shadow-md border-b-2 border-amber-900';
  } else if (buttonStyle === 'rabbit') {
    activeTabClassConfig.bgClass = 'bg-pink-400 shadow-md border-b-2 border-pink-500';
  } else if (buttonStyle === 'bee') {
    activeTabClassConfig.bgClass = 'bg-yellow-400 shadow-md border-b-2 border-yellow-600';
    activeTabClassConfig.textClass = 'text-slate-900';
  } else if (buttonStyle === 'whale') {
    activeTabClassConfig.bgClass = 'bg-sky-500 shadow-md border-b-2 border-sky-700';
  } else if (buttonStyle === '3d') {
      activeTabClassConfig.bgClass = 'bg-primary-600 border-b-[3px] border-primary-800 shadow-md';
  } else if (buttonStyle === 'glow') {
      activeTabClassConfig.bgClass = 'bg-primary-600 shadow-[0_0_15px_-3px] shadow-primary-500';
  } else if (buttonStyle === 'leaf') {
      activeTabClassConfig.bgClass = 'bg-green-600 rounded-tl-sm rounded-br-sm rounded-tr-xl rounded-bl-xl shadow-md border-b-[3px] border-green-800';
  } else if (buttonStyle === 'diamond') {
      activeTabClassConfig.bgClass = 'bg-cyan-500 !rounded-none [clip-path:polygon(5%_0,95%_0,100%_50%,95%_100%,5%_100%,0_50%)] shadow-md border-b-2 border-cyan-600';
  } else if (buttonStyle === 'magic_wand') {
      activeTabClassConfig.bgClass = 'bg-gradient-to-r from-violet-600 to-fuchsia-600 shadow-md ring-2 ring-purple-300';
  } else if (buttonStyle === 'bubble') {
      activeTabClassConfig.bgClass = 'bg-sky-400 shadow-[inset_0_-2px_4px_rgba(0,0,0,0.2),_0_4px_8px_rgba(56,189,248,0.4)] !rounded-full';
  } else if (buttonStyle === 'rocket') {
      activeTabClassConfig.bgClass = 'bg-slate-800 !rounded-t-2xl !rounded-b shadow-[0_4px_0_theme(colors.slate.900)] border border-indigo-400/30';
      activeTabClassConfig.textClass = 'text-indigo-100';
  }

  return (
    <div className="bg-white/50 backdrop-blur-sm rounded-xl mb-6 relative shadow-sm border border-white/40 p-1.5 overflow-hidden">
      <div className="relative grid grid-cols-3 h-10 sm:h-11">
        
        {/* Sliding Background - Width 1/3 */}
        <div 
          className="absolute top-0 bottom-0 left-0 w-1/3 p-0.5 transition-transform duration-300 ease-in-out"
          style={{ transform: getTransform() }}
        >
            <div className={`w-full h-full rounded-lg ${activeTabClassConfig.bgClass}`}></div>
        </div>

        {/* Buttons */}
        <button
          onClick={() => onTabChange('cv')}
          className={`relative z-10 h-full flex items-center justify-center text-[10px] sm:text-xs md:text-sm font-bold rounded-lg transition-colors duration-200 ${
              activeTab === 'cv' ? activeTabClassConfig.textClass : 'text-slate-500 hover:text-slate-800'
          }`}
        >
          CV
        </button>
        <button
          onClick={() => onTabChange('calculate')}
          className={`relative z-10 h-full flex items-center justify-center text-[10px] sm:text-xs md:text-sm font-bold rounded-lg transition-colors duration-200 ${
              activeTab === 'calculate' ? activeTabClassConfig.textClass : 'text-slate-500 hover:text-slate-800'
          }`}
        >
          Phí & Doanh thu
        </button>
        <button
          onClick={() => onTabChange('convert')}
          className={`relative z-10 h-full flex items-center justify-center text-[10px] sm:text-xs md:text-sm font-bold rounded-lg transition-colors duration-200 ${
              activeTab === 'convert' ? activeTabClassConfig.textClass : 'text-slate-500 hover:text-slate-800'
          }`}
        >
          Quy đổi
        </button>
      </div>
    </div>
  );
};

