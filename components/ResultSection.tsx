import React from 'react';
import { ConversionResult, Currency, ThemeColor } from '../types';
import { CopyButton } from './CopyButton';

interface ResultSectionProps {
  result: ConversionResult;
  fromCurrency: Currency;
  toCurrency: Currency;
  inputAmount: string;
  formatCurrency: (val: number, locale: string, currencyCode: string) => string;
  theme: ThemeColor;
}

export const ResultSection: React.FC<ResultSectionProps> = ({ result, fromCurrency, toCurrency, inputAmount, formatCurrency }) => {
  // Safe parsing to avoid NaN display
  const safeInputAmount = React.useMemo(() => {
    const parsed = parseFloat(inputAmount);
    return isNaN(parsed) ? 0 : parsed;
  }, [inputAmount]);

  const formattedSource = formatCurrency(safeInputAmount, fromCurrency.locale, fromCurrency.code);
  const formattedTarget = formatCurrency(result.convertedAmount, toCurrency.locale, toCurrency.code);

  return (
    <div className="animate-fade-in-up space-y-4 pt-2">
      <div className="grid md:grid-cols-2 gap-4">
        {/* Source Currency Card */}
        <div className="p-4 sm:p-5 rounded-2xl border border-white/50 bg-white/60 backdrop-blur-sm flex flex-col justify-between h-full group/card">
            <div>
              <div className="flex items-center gap-2 mb-2 opacity-70">
                  <img src={fromCurrency.flag} alt={fromCurrency.code} className="w-6 h-4 sm:w-8 sm:h-6 rounded shadow-sm object-cover" />
                  <span className="text-xs sm:text-sm font-bold uppercase text-slate-500">Nguồn tiền</span>
              </div>
              <div className="flex items-start justify-between gap-3">
                <div className="text-xl sm:text-2xl md:text-3xl font-bold break-words mb-1 text-slate-700 leading-tight">
                    {formattedSource}
                </div>
                <CopyButton text={formattedSource} />
              </div>
            </div>
            <div className="mt-4 pt-4 border-t border-slate-200/50">
                 <div className="flex items-center justify-between mb-2">
                    <p className="text-[10px] sm:text-xs font-semibold text-slate-400 uppercase">Bằng chữ</p>
                    <CopyButton 
                        text={result.textSource} 
                        className="bg-white/80 border-slate-200 text-slate-400 hover:text-slate-600 hover:border-slate-300"
                    />
                 </div>
                 <p className="text-sm italic font-medium text-slate-600 leading-relaxed min-h-[1.5rem]">{result.textSource}</p>
            </div>
        </div>

        {/* Target Currency Card */}
        <div className={`p-4 sm:p-5 rounded-2xl border border-primary-100/50 bg-gradient-to-br from-primary-50/70 to-white/70 backdrop-blur-sm shadow-sm flex flex-col justify-between h-full relative overflow-hidden group/card`}>
            <div className={`absolute -right-4 -top-4 opacity-10 text-primary-900 pointer-events-none`}>
                <svg xmlns="http://www.w3.org/2000/svg" fill="currentColor" viewBox="0 0 24 24" className="w-24 h-24"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8zm.31-8.86c-1.77-.45-2.34-.94-2.34-1.67 0-.84.79-1.43 2.1-1.43 1.38 0 1.9.66 1.94 1.64h1.71c-.05-1.34-.87-2.57-2.49-2.95V5h-2.93v2.63c-1.71.47-2.77 1.64-2.77 2.81 0 1.7 1.3 2.53 3.53 3.03 1.91.42 2.31.97 2.31 1.72 0 .86-.81 1.5-2.2 1.5-1.54 0-2.17-.79-2.26-1.8H6.6c.11 1.63 1.05 2.72 2.65 3.08V20h2.93v-2.72c1.76-.43 3-1.6 3-2.92 0-1.86-1.5-2.68-3.87-3.22z"/></svg>
            </div>
            <div className="relative z-10">
              <div className="flex items-center gap-2 mb-2">
                  <img src={toCurrency.flag} alt={toCurrency.code} className="w-6 h-4 sm:w-8 sm:h-6 rounded shadow-sm object-cover" />
                  <span className={`text-xs sm:text-sm font-bold text-primary-500 uppercase`}>Quy đổi được</span>
              </div>
              <div className="flex items-start justify-between gap-3">
                <div className={`text-2xl sm:text-3xl md:text-4xl font-extrabold text-primary-700 break-words mb-1 tracking-tight leading-tight`}>
                    {formattedTarget}
                </div>
                <CopyButton 
                  text={formattedTarget} 
                  className="bg-white/80 border-primary-200 text-primary-500 hover:text-primary-700 hover:border-primary-300"
                />
              </div>
            </div>
            <div className={`mt-4 pt-4 border-t border-primary-200/50 relative z-10`}>
                 <div className="flex items-center justify-between mb-2">
                    <p className={`text-[10px] sm:text-xs font-semibold text-primary-400 uppercase`}>Bằng chữ</p>
                    <CopyButton 
                      text={result.textTarget}
                      className="bg-white/80 border-primary-100 text-primary-400 hover:text-primary-600 hover:border-primary-200"
                    />
                 </div>
                 <p className={`text-base italic font-bold text-primary-800 leading-relaxed min-h-[1.5rem]`}>{result.textTarget}</p>
            </div>
        </div>
      </div>
    </div>
  );
};