import React, { useState, useEffect } from 'react';
import { CurrencyRow } from './components/CurrencyRow';
import { Header } from './components/Header';
import { SwapButton } from './components/SwapButton';
import { ResultSection } from './components/ResultSection';
import { DenominationSelector } from './components/DenominationSelector';
import { HistorySection } from './components/HistorySection';
import { ThemeSelector } from './components/ThemeSelector';
import { useCurrencyConverter } from './hooks/useCurrencyConverter';
import { LoadingState, ThemeColor, Currency } from './types';
import { Tooltip } from './components/Tooltip';
import { THEME_COLORS } from './constants';
import { generatePalette } from './utils/themeUtils';

const App: React.FC = () => {
  const {
    amount, setAmount, fromCurrency, setFromCurrency, toCurrency, setToCurrency,
    loadingState, result, errorMsg, isSwapping, handleConvert, handleSwap,
    history, clearHistory, selectHistoryItem, resetResult
  } = useCurrencyConverter();
  
  const [activeDropdown, setActiveDropdown] = useState<'FROM' | 'TO' | null>(null);
  const [theme, setTheme] = useState<ThemeColor>('blue');
  const [showHistory, setShowHistory] = useState(false);

  // Apply theme palette to CSS variables
  useEffect(() => {
    const applyTheme = (colorIdOrHex: string) => {
      let hex = colorIdOrHex;
      // If it's a preset ID (e.g. 'blue'), find the hex
      const preset = THEME_COLORS.find(t => t.id === colorIdOrHex);
      if (preset) {
        hex = preset.hex;
      }
      
      // Generate shades
      const palette = generatePalette(hex);
      const root = document.documentElement;
      
      Object.entries(palette).forEach(([shade, value]) => {
        root.style.setProperty(`--color-primary-${shade}`, value);
      });
    };

    const savedTheme = localStorage.getItem('app_theme');
    if (savedTheme) {
      setTheme(savedTheme);
      applyTheme(savedTheme);
    } else {
      applyTheme('blue');
    }
  }, []);

  const handleThemeChange = (newTheme: ThemeColor) => {
    setTheme(newTheme);
    localStorage.setItem('app_theme', newTheme);
    
    // Apply immediately
    let hex = newTheme;
    const preset = THEME_COLORS.find(t => t.id === newTheme);
    if (preset) hex = preset.hex;
    
    const palette = generatePalette(hex);
    Object.entries(palette).forEach(([shade, value]) => {
      document.documentElement.style.setProperty(`--color-primary-${shade}`, value);
    });
  };

  // Wrapper to reset result when amount changes manually
  const handleAmountChange = (val: string) => {
    setAmount(val);
    resetResult(); // Hide result on input change
  };

  // Wrapper to reset result when currency changes
  const handleFromChange = (currency: Currency) => {
    setFromCurrency(currency);
    resetResult();
  };

  const handleToChange = (currency: Currency) => {
    setToCurrency(currency);
    resetResult();
  };

  // Just set amount, do NOT convert immediately
  const handleDenominationSelect = (newAmount: string) => {
    handleAmountChange(newAmount);
  };

  const formatCurrency = (val: number, locale: string, currencyCode: string) => {
    try {
        if (isNaN(val)) return `0 ${currencyCode}`;
        return new Intl.NumberFormat(locale, {
          style: 'currency',
          currency: currencyCode,
          maximumFractionDigits: 0,
          minimumFractionDigits: 0
        }).format(val);
    } catch (e) { return `${val} ${currencyCode}`; }
  };

  const formatExchangeRate = (rate: number, from: string, to: string) => {
     const precision = rate < 0.01 ? 6 : 4;
     const formattedRate = new Intl.NumberFormat('en-US', { maximumFractionDigits: precision }).format(rate);
     return `1 ${from} ≈ ${formattedRate} ${to}`;
  };

  const handleHistorySelect = (item: any) => {
    selectHistoryItem(item);
    setShowHistory(false);
  };

  // Render the history icon button to be placed in the CurrencyRow
  const renderHistoryButton = (
    <Tooltip content="Xem lịch sử chuyển đổi" position="bottom">
      <button 
          onClick={() => setShowHistory(true)}
          className={`flex items-center gap-1.5 text-xs font-bold text-primary-600 hover:text-primary-700 bg-primary-50 hover:bg-primary-100 px-2 py-1 rounded-md transition-all`}
      >
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-3.5 h-3.5">
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
          </svg>
          Lịch sử
      </button>
    </Tooltip>
  );

  return (
    <div className={`min-h-screen bg-slate-100 font-sans text-slate-800 selection:bg-primary-200 flex flex-col relative`}>
      
      {/* Floating Theme Selector - Fixed Top Right */}
      <div className="fixed top-3 right-3 sm:top-5 sm:right-5 z-[100] animate-fade-in-up">
        <ThemeSelector currentTheme={theme} onThemeChange={handleThemeChange} />
      </div>

      <div className="flex-1 flex items-center justify-center p-3 sm:p-4 relative z-10">
        <div className="w-full max-w-5xl bg-white rounded-3xl shadow-xl shadow-slate-200/60 border border-white/50 relative flex flex-col my-2 mb-8">
          
          <Header theme={theme} onShowHistory={() => {}} />

          <div className="p-4 sm:p-8 space-y-6 relative flex-1">
            
            <div className="animate-fade-in-up" style={{ animationDelay: '100ms' }}>
              <DenominationSelector 
                currency={fromCurrency} 
                onSelect={handleDenominationSelect} 
                currentAmount={amount}
                theme={theme}
              />
            </div>

            <div className="flex flex-col md:flex-row items-center md:items-start relative z-20 gap-3 md:gap-4">
              <div className={`w-full md:flex-1 transition-all ${activeDropdown === 'FROM' ? 'z-50' : 'z-20'}`}> 
                  <CurrencyRow
                      label="Nhập số tiền cần đổi"
                      amount={amount}
                      currency={fromCurrency}
                      onAmountChange={handleAmountChange}
                      onCurrencyChange={handleFromChange}
                      inputPlacement="left"
                      autoFocus={true}
                      isActive={activeDropdown === 'FROM'}
                      onToggleDropdown={() => setActiveDropdown(activeDropdown === 'FROM' ? null : 'FROM')}
                      onCloseDropdown={() => setActiveDropdown(null)}
                      theme={theme}
                      headerAction={renderHistoryButton}
                      error={errorMsg}
                  />
              </div>

              <div className="md:mt-12 z-30 shrink-0">
                 <SwapButton onClick={handleSwap} isSwapping={isSwapping} theme={theme} />
              </div>

              <div className={`w-full md:flex-1 transition-all ${activeDropdown === 'TO' ? 'z-50' : 'z-20'}`}>
                  <CurrencyRow
                      label="Quy đổi sang"
                      amount=""
                      currency={toCurrency}
                      onCurrencyChange={handleToChange}
                      inputPlacement="hidden"
                      isActive={activeDropdown === 'TO'}
                      onToggleDropdown={() => setActiveDropdown(activeDropdown === 'TO' ? null : 'TO')}
                      onCloseDropdown={() => setActiveDropdown(null)}
                      theme={theme}
                  />
              </div>
            </div>

            <Tooltip content="Cập nhật tỷ giá mới nhất và tính toán" position="bottom">
                <button
                  onClick={() => handleConvert()}
                  disabled={loadingState === LoadingState.LOADING}
                  className={`w-full py-3.5 sm:py-4 rounded-2xl text-white font-bold text-base sm:text-lg shadow-xl transition-all transform mt-4
                    ${loadingState === LoadingState.LOADING 
                      ? 'bg-slate-400 cursor-not-allowed opacity-80' 
                      : `bg-gradient-to-r from-primary-600 to-primary-800 hover:-translate-y-1 active:scale-[0.98]`
                    }`}
                >
                  <span className="flex items-center justify-center gap-2">
                      {loadingState === LoadingState.LOADING ? (
                        <>
                          <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                          </svg>
                          Đang xử lý...
                        </>
                      ) : 'Chuyển đổi ngay'}
                  </span>
                </button>
            </Tooltip>
            
             {result && loadingState === LoadingState.SUCCESS && (
                <div className="flex justify-center -mt-2 animate-fade-in-up">
                   <div className="text-xs sm:text-sm font-medium px-4 py-1.5 rounded-full border border-slate-200 bg-white text-slate-500 shadow-sm flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></span>
                      {formatExchangeRate(result.exchangeRate, fromCurrency.code, toCurrency.code)}
                   </div>
                </div>
             )}

            {/* Error message removed from here as it is now inside CurrencyRow */}

            {result && loadingState === LoadingState.SUCCESS && (
               <ResultSection 
                  result={result} 
                  fromCurrency={fromCurrency} 
                  toCurrency={toCurrency} 
                  inputAmount={amount}
                  formatCurrency={formatCurrency}
                  theme={theme}
               />
            )}
          </div>
        </div>
      </div>
      
      {/* Simple Dark Footer */}
      <footer className="w-full bg-slate-900 text-slate-400 py-6 mt-auto">
        <div className="container mx-auto px-4 text-center">
            <p className="font-semibold text-slate-300 mb-1 tracking-wide text-sm">Powered by ZiQi</p>
            <p className="text-xs opacity-60">Lasted update: {new Date().toLocaleDateString('vi-VN')} </p>
        </div>
      </footer>

      {showHistory && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
             <div className="absolute inset-0 bg-black/40 backdrop-blur-sm transition-opacity animate-fade-in-up" onClick={() => setShowHistory(false)} style={{animationDuration: '0.2s'}} />
             <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md relative z-10 overflow-hidden animate-fade-in-up flex flex-col max-h-[80vh]">
                <div className="p-4 flex-1 overflow-hidden flex flex-col">
                   <HistorySection 
                        history={history} 
                        onSelect={handleHistorySelect} 
                        onClear={clearHistory}
                        formatCurrency={formatCurrency}
                        onClose={() => setShowHistory(false)}
                   />
                </div>
             </div>
        </div>
      )}
    </div>
  );
};

export default App;