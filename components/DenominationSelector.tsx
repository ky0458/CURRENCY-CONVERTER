import React from 'react';
import { DENOMINATIONS } from '../constants';
import { Currency, ThemeColor } from '../types';
import { Tooltip } from './Tooltip';

interface DenominationSelectorProps {
  currency: Currency;
  onSelect: (amount: string) => void;
  currentAmount: string;
  theme: ThemeColor;
}

export const DenominationSelector: React.FC<DenominationSelectorProps> = ({ currency, onSelect, currentAmount }) => {
  const options = DENOMINATIONS[currency.code] || DENOMINATIONS['DEFAULT'];

  const formatLabel = (value: number) => {
    return new Intl.NumberFormat(currency.locale, {
      maximumFractionDigits: 0,
    }).format(value);
  };

  return (
    <div className="w-full">
      <div className="flex items-center gap-2 mb-1 ml-1">
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className={`w-4 h-4 text-primary-500`}>
          <path fillRule="evenodd" d="M12 2.25c-5.385 0-9.75 4.365-9.75 9.75s4.365 9.75 9.75 9.75 9.75-4.365 9.75-9.75S17.385 2.25 12 2.25ZM9 9a.75.75 0 0 0 0 1.5h1.5V12a.75.75 0 0 0 1.5 0v-1.5H13.5a.75.75 0 0 0 0-1.5H12V7.5a.75.75 0 0 0-1.5 0V9H9ZM12 18.75a.75.75 0 0 0 .75-.75V15a.75.75 0 0 0-1.5 0v3a.75.75 0 0 0 .75.75Z" clipRule="evenodd" />
        </svg>
        <Tooltip content="Chọn nhanh số tiền mẫu" position="right">
           <span className="text-xs font-bold text-slate-500 uppercase tracking-wider cursor-help">Chọn nhanh mệnh giá</span>
        </Tooltip>
      </div>
      {/* Added pt-9 to allow space for top tooltips within the overflow container and negative margin to balance layout */}
      <div className="flex gap-2 overflow-x-auto pb-3 pt-9 -mt-8 custom-scrollbar no-scrollbar-on-mobile items-end">
        {options.map((val) => {
          const valStr = val.toString();
          const isSelected = currentAmount === valStr;
          return (
            <Tooltip key={val} content={`Đặt số tiền là ${formatLabel(val)}`}>
                <button
                onClick={() => onSelect(valStr)}
                className={`
                    flex-shrink-0 px-4 py-2 rounded-xl text-sm font-bold transition-all border
                    ${isSelected 
                    ? `bg-primary-600 border-primary-600 text-white shadow-md shadow-primary-200 scale-105` 
                    : `bg-white border-slate-200 text-slate-600 hover:border-primary-300 hover:text-primary-600 hover:bg-primary-50`}
                `}
                >
                {formatLabel(val)}
                </button>
            </Tooltip>
          );
        })}
      </div>
      <style>{`
        @media (max-width: 640px) {
          .no-scrollbar-on-mobile::-webkit-scrollbar {
            display: none;
          }
          .no-scrollbar-on-mobile {
            -ms-overflow-style: none;
            scrollbar-width: none;
          }
        }
      `}</style>
    </div>
  );
};