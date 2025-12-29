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
  
  // Manage which dropdown is currently active to handle z-index stacking
  const [activeDropdown, setActiveDropdown] = useState<'FROM' | 'TO' | null>(null);
  
  // Animation state for swap button
  const [isSwapping, setIsSwapping] = useState(false);

  const handleConvert = useCallback(async () => {
    const numAmount = parseFloat(amount);
    if (isNaN(numAmount) || numAmount <= 0) {
      setErrorMsg("Vui lòng nhập số tiền hợp lệ");
      return;
    }

    setLoadingState(LoadingState.LOADING);
    setErrorMsg('');
    setResult(null);

    try {
      const data = await convertCurrencyApi(numAmount, fromCurrency.code, toCurrency.code);
      setResult(data);
      setLoadingState(LoadingState.SUCCESS);
    } catch (err) {
      console.error(err);
      setErrorMsg("Có lỗi xảy ra khi lấy tỷ giá. Vui lòng thử lại.");
      setLoadingState(LoadingState.ERROR);
    }
  }, [amount, fromCurrency, toCurrency]);

  const handleSwap = () => {
    setIsSwapping(true);
    setTimeout(() => setIsSwapping(false), 500); // Reset animation class after 500ms
    
    setFromCurrency(toCurrency);
    setToCurrency(fromCurrency);
    // Clear result on swap to force user to re-convert with new context
    setResult(null); 
    setLoadingState(LoadingState.IDLE);
  };

  const formatCurrency = (val: number, locale: string, currencyCode: string) => {
    try {
        return new Intl.NumberFormat(locale, {
        style: 'currency',
        currency: currencyCode,
        maximumFractionDigits: 2
        }).format(val);
    } catch (e) {
        return `${val} ${currencyCode}`;
    }
  };

  return (
    <div className="min-h-screen bg-slate-100 flex items-center justify-center p-4 font-sans text-slate-800">
      
      <div className="w-full max-w-3xl bg-white rounded-3xl shadow-2xl shadow-slate-200/60 border border-white/50 transition-all duration-500 relative">
        
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-600 via-blue-700 to-indigo-700 p-8 text-center relative overflow-hidden rounded-t-3xl">
          <div className="absolute top-0 left-0 w-full h-full opacity-10">
             <svg className="w-full h-full" viewBox="0 0 100 100" preserveAspectRatio="none">
                 <circle cx="0" cy="0" r="40" fill="white" />
                 <circle cx="100" cy="100" r="60" fill="white" />
             </svg>
          </div>
          
          <div className="relative z-10">
            <h1 className="text-3xl sm:text-4xl font-extrabold text-white mb-2 tracking-tight drop-shadow-sm">VinaChange</h1>
            <p className="text-blue-100 text-sm font-medium bg-white/20 inline-block px-4 py-1 rounded-full backdrop-blur-sm">
                Tỷ giá cập nhật liên tục
            </p>
          </div>
        </div>

        {/* Main Content */}
        <div className="p-6 sm:p-10 space-y-8 relative">
          
          {/* Inputs Section */}
          <div className="flex flex-col gap-1 relative">
            
            {/* Source Currency Row */}
            <div className={`relative transition-all duration-200 ${activeDropdown === 'FROM' ? 'z-30' : 'z-20'}`}> 
                <CurrencyRow
                    label="Bạn gửi đi"
                    amount={amount}
                    currency={fromCurrency}
                    onAmountChange={setAmount}
                    onCurrencyChange={setFromCurrency}
                    isActive={activeDropdown === 'FROM'}
                    onToggleDropdown={() => setActiveDropdown(activeDropdown === 'FROM' ? null : 'FROM')}
                    onCloseDropdown={() => setActiveDropdown(null)}
                />
            </div>

            {/* Floating Swap Button */}
            <div className="relative h-4 z-20 flex items-center justify-center">
               <button
                onClick={handleSwap}
                className={`
                  absolute bg-white p-3 rounded-full shadow-lg border-4 border-slate-100 text-blue-600 
                  hover:text-blue-700 hover:shadow-xl hover:border-white focus:outline-none focus:ring-4 focus:ring-blue-100 
                  transition-all duration-300 transform
                  ${isSwapping ? 'rotate-180 scale-110' : 'hover:-rotate-90 hover:scale-105'}
                `}
                title="Hoán đổi vị trí"
              >
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-6 h-6">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M3 7.5L7.5 3m0 0L12 7.5M7.5 3v13.5m13.5 0L16.5 21m0 0L12 16.5m4.5 4.5V7.5" />
                </svg>
              </button>
            </div>

            {/* Target Currency Row */}
            <div className={`relative transition-all duration-200 ${activeDropdown === 'TO' ? 'z-30' : 'z-10'}`}>
                <CurrencyRow
                    label="Bạn nhận được"
                    amount={result ? result.convertedAmount : ''}
                    currency={toCurrency}
                    onCurrencyChange={setToCurrency}
                    readOnly={true}
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
            className={`w-full py-4 rounded-2xl text-white font-bold text-lg shadow-xl shadow-blue-500/20 transition-all duration-300 transform relative
              ${loadingState === LoadingState.LOADING 
                ? 'bg-slate-400 cursor-not-allowed scale-[0.99]' 
                : 'bg-gradient-to-r from-blue-600 to-indigo-600 hover:shadow-blue-600/40 hover:-translate-y-1 active:scale-[0.98]'
              }`}
          >
            {loadingState === LoadingState.LOADING ? (
              <span className="flex items-center justify-center gap-2">
                <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Đang xử lý...
              </span>
            ) : (
              'Chuyển đổi ngay'
            )}
          </button>

          {/* Error Message */}
          {errorMsg && (
            <div className="animate-bounce p-4 bg-red-50 text-red-600 rounded-xl border border-red-100 text-center text-sm font-semibold shadow-sm">
              {errorMsg}
            </div>
          )}

          {/* Result Section */}
          {result && loadingState === LoadingState.SUCCESS && (
            <div className="animate-fade-in-up space-y-4">
              
              {/* Info Header */}
              <div className="flex justify-between items-center px-2">
                 <div className="text-xs font-bold text-slate-400 uppercase tracking-wider">Chi tiết giao dịch</div>
                 <div className="flex items-center gap-1 text-xs font-medium text-green-600 bg-green-50 px-2 py-1 rounded-md border border-green-100">
                    <span className="relative flex h-2 w-2">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                      <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
                    </span>
                    Tỷ giá: 1 {fromCurrency.code} ≈ {result.exchangeRate} {toCurrency.code}
                 </div>
              </div>

              {/* Result Cards Container */}
              <div className="grid md:grid-cols-2 gap-4">
                  
                  {/* Source Card (Left) */}
                  <div className="bg-slate-50 p-5 rounded-2xl border border-slate-200 flex flex-col justify-between h-full group hover:border-slate-300 transition-colors">
                      <div>
                        <div className="flex items-center gap-2 mb-2 opacity-70">
                            <img src={fromCurrency.flag} alt={fromCurrency.code} className="w-8 h-6 rounded shadow-sm object-cover" />
                            <span className="text-sm font-bold text-slate-500 uppercase">Nguồn tiền</span>
                        </div>
                        <div className="text-2xl sm:text-3xl font-bold text-slate-700 break-words mb-1">
                             {formatCurrency(parseFloat(amount), fromCurrency.locale, fromCurrency.code)}
                        </div>
                      </div>
                      
                      <div className="mt-4 pt-4 border-t border-slate-200">
                           <p className="text-xs font-semibold text-slate-400 mb-1">BẰNG CHỮ</p>
                           <p className="text-slate-600 text-sm italic font-medium leading-relaxed">
                             "{result.textSource}"
                           </p>
                      </div>
                  </div>

                  {/* Target Card (Right - Highlighted) */}
                  <div className="bg-gradient-to-br from-blue-50 to-indigo-50 p-5 rounded-2xl border border-blue-100 shadow-sm flex flex-col justify-between h-full group hover:border-blue-200 transition-colors relative overflow-hidden">
                      {/* Decorative background Icon */}
                      <div className="absolute -right-4 -top-4 text-blue-100 opacity-50 transform rotate-12 group-hover:rotate-0 transition-transform duration-500 pointer-events-none">
                          <svg xmlns="http://www.w3.org/2000/svg" fill="currentColor" viewBox="0 0 24 24" className="w-24 h-24">
                             <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8zm.31-8.86c-1.77-.45-2.34-.94-2.34-1.67 0-.84.79-1.43 2.1-1.43 1.38 0 1.9.66 1.94 1.64h1.71c-.05-1.34-.87-2.57-2.49-2.95V5h-2.93v2.63c-1.71.47-2.77 1.64-2.77 2.81 0 1.7 1.3 2.53 3.53 3.03 1.91.42 2.31.97 2.31 1.72 0 .86-.81 1.5-2.2 1.5-1.54 0-2.17-.79-2.26-1.8H6.6c.11 1.63 1.05 2.72 2.65 3.08V20h2.93v-2.72c1.76-.43 3-1.6 3-2.92 0-1.86-1.5-2.68-3.87-3.22z"/>
                          </svg>
                      </div>

                      <div className="relative z-10">
                        <div className="flex items-center gap-2 mb-2">
                            <img src={toCurrency.flag} alt={toCurrency.code} className="w-8 h-6 rounded shadow-sm object-cover" />
                            <span className="text-sm font-bold text-blue-600 uppercase">Quy đổi được</span>
                        </div>
                        <div className="text-3xl sm:text-4xl font-extrabold text-blue-700 break-words mb-1 tracking-tight">
                             {formatCurrency(result.convertedAmount, toCurrency.locale, toCurrency.code)}
                        </div>
                      </div>
                      
                      <div className="mt-4 pt-4 border-t border-blue-200 relative z-10">
                           <p className="text-xs font-semibold text-blue-400 mb-1">BẰNG CHỮ</p>
                           <p className="text-blue-800 text-base italic font-medium leading-relaxed">
                             "{result.textTarget}"
                           </p>
                      </div>
                  </div>
              </div>
            </div>
          )}

        </div>
      </div>
      
      {/* Footer Info */}
      <div className="fixed bottom-4 text-center w-full pointer-events-none px-4 z-0 hidden sm:block">
          <p className="text-slate-400 text-xs font-medium opacity-70 mix-blend-multiply">
            Powered by VinaChange • Cập nhật lúc {new Date().toLocaleTimeString()}
          </p>
      </div>
    </div>
  );
};

export default App;