import React, { useState, useCallback } from 'react';
import { CurrencyRow } from './components/CurrencyRow';
import { convertCurrencyApi } from './services/geminiService';
import { POPULAR_CURRENCIES, DEFAULT_SOURCE_CURRENCY, DEFAULT_TARGET_CURRENCY } from './constants';
import { ConversionResult, LoadingState, Currency } from './types';

const App: React.FC = () => {
  const [amount, setAmount] = useState<string>('100000');
  const [fromCurrency, setFromCurrency] = useState<Currency>(DEFAULT_SOURCE_CURRENCY);
  const [toCurrency, setToCurrency] = useState<Currency>(DEFAULT_TARGET_CURRENCY);
  
  const [loadingState, setLoadingState] = useState<LoadingState>(LoadingState.IDLE);
  const [result, setResult] = useState<ConversionResult | null>(null);
  const [errorMsg, setErrorMsg] = useState<string>('');
  
  // UI State
  const [activeDropdown, setActiveDropdown] = useState<'FROM' | 'TO' | null>(null);
  const [isSwapping, setIsSwapping] = useState(false);

  // Core logic
  const executeConversion = async (currentAmount: number, source: Currency, target: Currency) => {
    setLoadingState(LoadingState.LOADING);
    setErrorMsg('');
    setResult(null);

    try {
      const data = await convertCurrencyApi(currentAmount, source.code, target.code);
      setResult(data);
      setLoadingState(LoadingState.SUCCESS);
    } catch (err) {
      console.error(err);
      setErrorMsg("Có lỗi xảy ra khi lấy tỷ giá. Vui lòng thử lại.");
      setLoadingState(LoadingState.ERROR);
    }
  };

  const handleConvert = useCallback(() => {
    const numAmount = parseFloat(amount);
    if (isNaN(numAmount) || numAmount <= 0) {
      setErrorMsg("Vui lòng nhập số tiền hợp lệ");
      return;
    }
    executeConversion(numAmount, fromCurrency, toCurrency);
  }, [amount, fromCurrency, toCurrency]);

  const handleSwap = () => {
    setIsSwapping(true);
    setTimeout(() => setIsSwapping(false), 500); 
    
    // Swap currencies
    const newFrom = toCurrency;
    const newTo = fromCurrency;

    setFromCurrency(newFrom);
    setToCurrency(newTo);

    // Auto-trigger if we have valid input
    const numAmount = parseFloat(amount);
    if (!isNaN(numAmount) && numAmount > 0) {
        executeConversion(numAmount, newFrom, newTo);
    }
  };

  const formatCurrency = (val: number, locale: string, currencyCode: string) => {
    try {
        return new Intl.NumberFormat(locale, {
        style: 'currency',
        currency: currencyCode,
        maximumFractionDigits: 0,
        minimumFractionDigits: 0
        }).format(val);
    } catch (e) {
        return `${val} ${currencyCode}`;
    }
  };

  const formatExchangeRate = (rate: number, from: string, to: string) => {
     const precision = rate < 0.01 ? 6 : 4;
     const formattedRate = new Intl.NumberFormat('en-US', { maximumFractionDigits: precision }).format(rate);
     return `1 ${from} ≈ ${formattedRate} ${to}`;
  };

  return (
    <div className="min-h-screen bg-slate-100 flex items-center justify-center p-3 sm:p-4 font-sans text-slate-800">
      
      <div className="w-full max-w-5xl bg-white rounded-3xl shadow-xl shadow-slate-200/60 border border-white/50 relative flex flex-col my-2 sm:my-0">
        
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-600 via-blue-700 to-indigo-700 p-6 sm:p-8 text-center relative overflow-hidden rounded-t-3xl">
          <div className="absolute top-0 left-0 w-full h-full opacity-10">
             <svg className="w-full h-full" viewBox="0 0 100 100" preserveAspectRatio="none">
                 <circle cx="0" cy="0" r="40" fill="white" />
                 <circle cx="100" cy="100" r="60" fill="white" />
             </svg>
          </div>
          
          <div className="relative z-10">
            <h1 className="text-2xl sm:text-3xl font-extrabold text-white mb-2 tracking-tight drop-shadow-sm">Máy Đổi Tiền Của Gia Hân♎️</h1>
            <div className="inline-flex items-center gap-2 text-white/90 text-xs sm:text-sm font-medium bg-white/20 px-3 py-1 rounded-full backdrop-blur-md">
               <span className="w-2 h-2 rounded-full bg-green-400 animate-pulse"></span>
               Tỷ giá cập nhật liên tục
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="p-4 sm:p-8 space-y-6 relative flex-1">
          
          {/* Main Input Row */}
          <div className="flex flex-col md:flex-row items-center gap-3 sm:gap-4 relative z-20">
            
            {/* Left: Amount Input & Source Currency (Input Left, Selector Right) */}
            <div className={`relative flex-[3] w-full transition-all duration-200 ${activeDropdown === 'FROM' ? 'z-50' : 'z-20'}`}> 
                <CurrencyRow
                    label="Nhập số tiền cần đổi"
                    amount={amount}
                    currency={fromCurrency}
                    onAmountChange={setAmount}
                    onCurrencyChange={setFromCurrency}
                    inputPlacement="left"
                    isActive={activeDropdown === 'FROM'}
                    onToggleDropdown={() => setActiveDropdown(activeDropdown === 'FROM' ? null : 'FROM')}
                    onCloseDropdown={() => setActiveDropdown(null)}
                />
            </div>

            {/* Middle: Swap Button */}
            {/* Rotate icon 90deg on mobile to indicate vertical swap */}
            <button
                onClick={handleSwap}
                className={`
                    flex-shrink-0 w-10 h-10 sm:w-12 sm:h-12 rounded-full shadow-lg border-2 bg-white border-blue-100 text-blue-600 hover:bg-blue-50 hover:border-blue-300 transition-all duration-300 transform flex items-center justify-center
                    ${isSwapping ? 'animate-swap-spin text-blue-700 bg-blue-50' : 'hover:scale-110'}
                    focus:outline-none focus:ring-4 focus:ring-blue-500/30
                    z-30 -my-2 md:my-0
                `}
                title="Hoán đổi vị trí"
            >
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-5 h-5 sm:w-6 sm:h-6 transform rotate-90 md:rotate-0 transition-transform">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M7.5 21 3 16.5m0 0L7.5 12M3 16.5h13.5m0-13.5L21 7.5m0 0L16.5 12M21 7.5H7.5" />
                </svg>
            </button>

            {/* Right: Target Currency (Selector Only) */}
            <div className={`relative flex-[2] w-full transition-all duration-200 ${activeDropdown === 'TO' ? 'z-50' : 'z-20'}`}>
                <CurrencyRow
                    label="Quy đổi sang"
                    amount=""
                    currency={toCurrency}
                    onCurrencyChange={setToCurrency}
                    inputPlacement="hidden" // Selector Only
                    isActive={activeDropdown === 'TO'}
                    onToggleDropdown={() => setActiveDropdown(activeDropdown === 'TO' ? null : 'TO')}
                    onCloseDropdown={() => setActiveDropdown(null)}
                />
            </div>
          </div>

          {/* Action Button */}
          <button
            onClick={handleConvert}
            disabled={loadingState === LoadingState.LOADING}
            className={`w-full py-3.5 sm:py-4 rounded-2xl text-white font-bold text-base sm:text-lg shadow-xl shadow-blue-500/20 transition-all duration-300 transform relative overflow-hidden mt-2
              ${loadingState === LoadingState.LOADING 
                ? 'bg-slate-400 cursor-not-allowed opacity-80' 
                : 'bg-gradient-to-r from-blue-600 to-indigo-600 hover:-translate-y-1 active:scale-[0.98]'
              }`}
          >
             <div className="absolute inset-0 bg-white/10 hover:bg-transparent transition-colors"></div>
             <span className="relative z-10 flex items-center justify-center gap-2">
                {loadingState === LoadingState.LOADING ? (
                  <>
                    <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Đang xử lý...
                  </>
                ) : (
                  'Chuyển đổi ngay'
                )}
             </span>
          </button>
          
           {/* Exchange Rate Display */}
           {result && loadingState === LoadingState.SUCCESS && (
              <div className="flex justify-center -mt-2 animate-fade-in-up">
                 <div className="text-xs sm:text-sm font-medium px-4 py-1.5 rounded-full border border-slate-200 bg-white text-slate-500 shadow-sm flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></span>
                    {formatExchangeRate(result.exchangeRate, fromCurrency.code, toCurrency.code)}
                 </div>
              </div>
           )}

          {/* Error Message */}
          {errorMsg && (
            <div className="animate-bounce p-4 bg-red-50 text-red-600 rounded-xl border border-red-100 text-center text-sm font-semibold shadow-sm">
              {errorMsg}
            </div>
          )}

          {/* Result Section (Original Design) */}
          {result && loadingState === LoadingState.SUCCESS && (
            <div className="animate-fade-in-up space-y-4 pt-2">
              <div className="grid md:grid-cols-2 gap-4">
                  {/* Source Card */}
                  <div className="p-4 sm:p-5 rounded-2xl border border-slate-200 bg-slate-50 flex flex-col justify-between h-full group hover:border-slate-300 transition-colors">
                      <div>
                        <div className="flex items-center gap-2 mb-2 opacity-70">
                            <img src={fromCurrency.flag} alt={fromCurrency.code} className="w-6 h-4 sm:w-8 sm:h-6 rounded shadow-sm object-cover" />
                            <span className="text-xs sm:text-sm font-bold uppercase text-slate-500">Nguồn tiền</span>
                        </div>
                        <div className="text-xl sm:text-2xl md:text-3xl font-bold break-words mb-1 text-slate-700">
                             {formatCurrency(parseFloat(amount), fromCurrency.locale, fromCurrency.code)}
                        </div>
                      </div>
                      <div className="mt-4 pt-4 border-t border-slate-200">
                           <p className="text-[10px] sm:text-xs font-semibold mb-1 text-slate-400">BẰNG CHỮ</p>
                           <p className="text-sm italic font-medium leading-relaxed text-slate-600">
                             {result.textSource}
                           </p>
                      </div>
                  </div>

                  {/* Target Card */}
                  <div className="p-4 sm:p-5 rounded-2xl border border-blue-100 bg-gradient-to-br from-blue-50 to-indigo-50 shadow-sm flex flex-col justify-between h-full group hover:border-blue-200 transition-colors relative overflow-hidden">
                      {/* Decorative Icon */}
                      <div className="absolute -right-4 -top-4 opacity-50 transform rotate-12 group-hover:rotate-0 transition-transform duration-500 pointer-events-none text-blue-100">
                          <svg xmlns="http://www.w3.org/2000/svg" fill="currentColor" viewBox="0 0 24 24" className="w-24 h-24">
                             <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8zm.31-8.86c-1.77-.45-2.34-.94-2.34-1.67 0-.84.79-1.43 2.1-1.43 1.38 0 1.9.66 1.94 1.64h1.71c-.05-1.34-.87-2.57-2.49-2.95V5h-2.93v2.63c-1.71.47-2.77 1.64-2.77 2.81 0 1.7 1.3 2.53 3.53 3.03 1.91.42 2.31.97 2.31 1.72 0 .86-.81 1.5-2.2 1.5-1.54 0-2.17-.79-2.26-1.8H6.6c.11 1.63 1.05 2.72 2.65 3.08V20h2.93v-2.72c1.76-.43 3-1.6 3-2.92 0-1.86-1.5-2.68-3.87-3.22z"/>
                          </svg>
                      </div>

                      <div className="relative z-10">
                        <div className="flex items-center gap-2 mb-2">
                            <img src={toCurrency.flag} alt={toCurrency.code} className="w-6 h-4 sm:w-8 sm:h-6 rounded shadow-sm object-cover" />
                            <span className="text-xs sm:text-sm font-bold text-blue-500 uppercase">Quy đổi được</span>
                        </div>
                        <div className="text-2xl sm:text-3xl md:text-4xl font-extrabold text-blue-700 break-words mb-1 tracking-tight">
                             {formatCurrency(result.convertedAmount, toCurrency.locale, toCurrency.code)}
                        </div>
                      </div>
                      
                      <div className="mt-4 pt-4 border-t border-blue-200 relative z-10">
                           <p className="text-[10px] sm:text-xs font-semibold text-blue-400 mb-1">BẰNG CHỮ</p>
                           <p className="text-base italic font-medium leading-relaxed text-blue-800">
                             {result.textTarget}
                           </p>
                      </div>
                  </div>
              </div>
            </div>
          )}

        </div>
      </div>
      
      {/* Footer Info */}
      <div className="fixed bottom-4 text-center w-full pointer-events-none px-4 z-0 hidden sm:block text-slate-400">
          <p className="text-xs font-medium opacity-70 mix-blend-multiply">
            Powered by VinaChange
          </p>
      </div>
    </div>
  );
};

export default App;