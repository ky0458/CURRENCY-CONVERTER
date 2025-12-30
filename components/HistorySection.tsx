
import React from 'react';
import { ConversionHistoryItem } from '../types';

interface HistorySectionProps {
  history: ConversionHistoryItem[];
  onSelect: (item: ConversionHistoryItem) => void;
  onClear: () => void;
  formatCurrency: (val: number, locale: string, currencyCode: string) => string;
  onClose?: () => void;
}

export const HistorySection: React.FC<HistorySectionProps> = ({ history, onSelect, onClear, formatCurrency, onClose }) => {
  return (
    <div className="w-full flex flex-col h-full">
      <div className="flex items-center justify-between mb-4 px-1 pb-2 border-b border-slate-100">
        <h3 className="text-lg font-bold text-slate-700 flex items-center gap-2">
            Lịch sử chuyển đổi
        </h3>
        <div className="flex items-center gap-3">
            {history.length > 0 && (
                <button 
                onClick={onClear} 
                className="text-xs text-red-500 hover:text-red-600 font-bold hover:bg-red-50 px-3 py-1.5 rounded-lg transition-colors flex items-center gap-1"
                title="Xóa tất cả"
                >
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4">
                    <path strokeLinecap="round" strokeLinejoin="round" d="m14.74 9-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 0 1-2.244 2.077H8.084a2.25 2.25 0 0 1-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 0 0-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 0 1 3.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 0 0-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 0 0-7.5 0" />
                    </svg>
                    Xóa hết
                </button>
            )}
            <button onClick={onClose} className="p-1 rounded-full hover:bg-slate-100 text-slate-400 hover:text-slate-600 transition-colors">
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" />
                </svg>
            </button>
        </div>
      </div>
      
      {history.length === 0 ? (
          <div className="flex-1 flex flex-col items-center justify-center py-10 text-slate-400 gap-3">
              <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center">
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1} stroke="currentColor" className="w-8 h-8 text-slate-300">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
                </svg>
              </div>
              <span className="text-sm italic">Chưa có lịch sử chuyển đổi nào.</span>
          </div>
      ) : (
        <div className="flex-1 overflow-y-auto custom-scrollbar pr-2 space-y-2 max-h-[50vh]">
            {history.map(item => (
                <div key={item.id} onClick={() => { onSelect(item); if(onClose) onClose(); }} className="bg-white p-3 sm:p-4 rounded-xl border border-slate-100 shadow-sm hover:shadow-md hover:border-primary-300 hover:bg-primary-50 cursor-pointer transition-all flex items-center justify-between group">
                    <div className="flex flex-col w-full gap-1">
                        <div className="flex items-center gap-2 text-sm sm:text-base font-bold text-slate-700 flex-wrap">
                            <div className="flex items-center gap-1.5 min-w-0">
                                <img src={item.fromCurrency.flag} alt="" className="w-5 h-3.5 rounded shadow-sm object-cover" />
                                <span className="truncate">{formatCurrency(item.inputAmount, item.fromCurrency.locale, item.fromCurrency.code)}</span>
                            </div>
                            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-4 h-4 text-slate-300">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5 21 12m0 0-7.5 7.5M21 12H3" />
                            </svg>
                            <div className="flex items-center gap-1.5 min-w-0">
                                <img src={item.toCurrency.flag} alt="" className="w-5 h-3.5 rounded shadow-sm object-cover" />
                                <span className="text-primary-600 truncate">{formatCurrency(item.convertedAmount, item.toCurrency.locale, item.toCurrency.code)}</span>
                            </div>
                        </div>
                        <div className="text-xs text-slate-400">
                            {new Date(item.timestamp).toLocaleString('vi-VN', { hour: '2-digit', minute: '2-digit', day: '2-digit', month: '2-digit', year: 'numeric' })}
                        </div>
                    </div>
                    <div className="text-slate-300 group-hover:text-primary-500 transition-colors pl-2">
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5">
                          <path strokeLinecap="round" strokeLinejoin="round" d="m8.25 4.5 7.5 7.5-7.5 7.5" />
                        </svg>
                    </div>
                </div>
            ))}
        </div>
      )}
    </div>
  );
};
