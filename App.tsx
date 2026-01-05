import React, { useState, useEffect, useMemo } from 'react';
import { CurrencyRow } from './components/CurrencyRow';
import { Header } from './components/Header';
import { SwapButton } from './components/SwapButton';
import { ResultSection } from './components/ResultSection';
import { DenominationSelector } from './components/DenominationSelector';
import { HistorySection } from './components/HistorySection';
import { ThemeSelector } from './components/ThemeSelector';
import { TabSelector } from './components/TabSelector';
import { useCurrencyConverter } from './hooks/useCurrencyConverter';
import { LoadingState, ThemeColor, Currency, ConversionHistoryItem } from './types';
import { Tooltip } from './components/Tooltip';
import { THEME_COLORS } from './constants';
import { generatePalette } from './utils/themeUtils';
import { getReadFunction } from './utils/currencyTextFormatter';
import { CopyButton } from './components/CopyButton';

const App: React.FC = () => {
  const {
    amount, setAmount, fromCurrency, setFromCurrency, toCurrency, setToCurrency,
    loadingState, result, errorMsg, isSwapping, handleConvert, handleSwap,
    history, clearHistory, deleteHistoryItems, selectHistoryItem, resetResult
  } = useCurrencyConverter();
  
  const [activeDropdown, setActiveDropdown] = useState<'FROM' | 'TO' | null>(null);
  const [theme, setTheme] = useState<ThemeColor>('blue');
  const [showHistory, setShowHistory] = useState(false);
  
  // New States for Calculation Mode
  const [activeTab, setActiveTab] = useState<'convert' | 'calculate'>('convert');
  const [salaryAmount, setSalaryAmount] = useState<string>('');
  const [calcType, setCalcType] = useState<'probation' | 'official'>('official');

  // Filter history based on active tab
  const filteredHistory = useMemo(() => {
    return history.filter(item => item.type === activeTab);
  }, [history, activeTab]);

  // Apply theme palette to CSS variables
  useEffect(() => {
    const applyTheme = (colorIdOrHex: string) => {
      let hex = colorIdOrHex;
      const preset = THEME_COLORS.find(t => t.id === colorIdOrHex);
      if (preset) hex = preset.hex;
      
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
    
    let hex = newTheme;
    const preset = THEME_COLORS.find(t => t.id === newTheme);
    if (preset) hex = preset.hex;
    
    const palette = generatePalette(hex);
    Object.entries(palette).forEach(([shade, value]) => {
      document.documentElement.style.setProperty(`--color-primary-${shade}`, value);
    });
  };

  const handleAmountChange = (val: string) => {
    if (activeTab === 'calculate') {
        setSalaryAmount(val);
    } else {
        setAmount(val);
    }
    resetResult();
  };

  const handleFromChange = (currency: Currency) => {
    setFromCurrency(currency);
    resetResult();
  };

  const handleToChange = (currency: Currency) => {
    setToCurrency(currency);
    resetResult();
  };

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

  const handleHistorySelect = (item: ConversionHistoryItem) => {
    // Since we filter history, we know the item belongs to the active tab
    selectHistoryItem(item);
    
    if (item.type === 'calculate' && item.originalSalary) {
        setSalaryAmount(item.originalSalary.toString());
        // Trigger conversion with the fee (inputAmount) and pass salary
        handleConvert(item.inputAmount.toString(), activeTab, item.originalSalary);
    } else {
        handleConvert(item.inputAmount.toString(), activeTab);
    }
    
    setShowHistory(false);
  };

  const handleSwapClick = () => {
    handleSwap(activeTab);
  };

  // Wrapper for calculation logic
  const onCalculateAndConvert = () => {
    if (activeTab === 'calculate') {
        const salary = parseFloat(salaryAmount.replace(/,/g, ''));
        if (isNaN(salary) || salary <= 0) {
            handleConvert('0', activeTab); 
            return;
        }
        const multiplier = calcType === 'probation' ? 0.75 : 0.60;
        const fee = Math.floor(salary * multiplier);
        setAmount(fee.toString()); // Sync state
        handleConvert(fee.toString(), activeTab, salary); // Trigger conversion with calculated fee and ORIGINAL SALARY
    } else {
        handleConvert(amount, activeTab);
    }
  };

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

  // Calculate Stage Fee Values (only available when result is present)
  const stageFeeData = useMemo(() => {
    if (activeTab !== 'calculate' || !result || !amount) return null;
    
    const totalFeeSource = parseFloat(amount);
    if (isNaN(totalFeeSource)) return null;

    const stageSource = Math.floor(totalFeeSource / 2);
    // Calculate target using the same rate logic
    const stageTarget = Math.ceil(stageSource * result.exchangeRate);

    const formattedSource = formatCurrency(stageSource, fromCurrency.locale, fromCurrency.code);
    const formattedTarget = formatCurrency(stageTarget, toCurrency.locale, toCurrency.code);

    return {
        source: stageSource,
        target: stageTarget,
        formattedSource,
        formattedTarget,
        textSource: getReadFunction(fromCurrency.code, stageSource),
        textTarget: getReadFunction(toCurrency.code, stageTarget)
    };
  }, [activeTab, result, amount, fromCurrency, toCurrency]);

  return (
    <div className={`min-h-screen bg-slate-100 font-sans text-slate-800 selection:bg-primary-200 flex flex-col relative`}>
      
      <div className="fixed top-3 right-3 sm:top-5 sm:right-5 z-[100] animate-fade-in-up">
        <ThemeSelector currentTheme={theme} onThemeChange={handleThemeChange} />
      </div>

      <div className="flex-1 flex items-center justify-center p-3 sm:p-4 relative z-10">
        <div className="w-full max-w-5xl bg-white rounded-3xl shadow-xl shadow-slate-200/60 border border-white/50 relative flex flex-col my-2 mb-8">
          
          <Header theme={theme} onShowHistory={() => {}} />

          <div className="p-4 sm:p-8 space-y-6 relative flex-1">
            
            <div className="animate-fade-in-up" style={{ animationDelay: '100ms' }}>
                <TabSelector activeTab={activeTab} onTabChange={(tab) => { setActiveTab(tab); resetResult(); setAmount(''); setSalaryAmount(''); }} theme={theme} />
            </div>
            
            {activeTab === 'convert' && (
                <div className="animate-fade-in-up" style={{ animationDelay: '150ms' }}>
                <DenominationSelector 
                    currency={fromCurrency} 
                    onSelect={handleDenominationSelect} 
                    currentAmount={amount}
                    theme={theme}
                />
                </div>
            )}

            <div className="flex flex-col md:flex-row items-center md:items-start relative z-20 gap-3 md:gap-4">
              <div className={`w-full md:flex-1 transition-all ${activeDropdown === 'FROM' ? 'z-50' : 'z-20'}`}> 
                  <CurrencyRow
                      key={activeTab} // Force remount and auto-focus when tab changes
                      label={activeTab === 'calculate' ? "Nhập mức lương" : "Nhập số tiền cần đổi"}
                      amount={activeTab === 'calculate' ? salaryAmount : amount}
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
                      onEnter={onCalculateAndConvert}
                  />

                  {/* Calculation Options */}
                  {activeTab === 'calculate' && (
                      <div className="mt-3 flex gap-3 animate-fade-in-up">
                          {/* Official Salary (Default) on Left */}
                          <label className={`flex-1 flex items-center justify-center gap-2 p-3 rounded-xl border cursor-pointer transition-all ${calcType === 'official' ? 'bg-primary-50 border-primary-500 text-primary-700 font-bold' : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'}`}>
                              <input type="radio" name="calcType" value="official" checked={calcType === 'official'} onChange={() => setCalcType('official')} className="hidden" />
                              <div className={`w-4 h-4 rounded-full border flex items-center justify-center ${calcType === 'official' ? 'border-primary-500' : 'border-slate-300'}`}>
                                  {calcType === 'official' && <div className="w-2 h-2 rounded-full bg-primary-500" />}
                              </div>
                              <span>Chính thức (60%)</span>
                          </label>

                           {/* Probation Salary on Right */}
                          <label className={`flex-1 flex items-center justify-center gap-2 p-3 rounded-xl border cursor-pointer transition-all ${calcType === 'probation' ? 'bg-primary-50 border-primary-500 text-primary-700 font-bold' : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'}`}>
                              <input type="radio" name="calcType" value="probation" checked={calcType === 'probation'} onChange={() => setCalcType('probation')} className="hidden" />
                              <div className={`w-4 h-4 rounded-full border flex items-center justify-center ${calcType === 'probation' ? 'border-primary-500' : 'border-slate-300'}`}>
                                  {calcType === 'probation' && <div className="w-2 h-2 rounded-full bg-primary-500" />}
                              </div>
                              <span>Thử việc (75%)</span>
                          </label>
                      </div>
                  )}
              </div>

              {activeTab === 'convert' && (
                <div className="md:mt-12 z-30 shrink-0">
                    <SwapButton onClick={handleSwapClick} isSwapping={isSwapping} theme={theme} />
                </div>
              )}

              <div className={`w-full md:flex-1 transition-all ${activeDropdown === 'TO' ? 'z-50' : 'z-20'}`}>
                  <CurrencyRow
                      label={activeTab === 'calculate' ? "Quy đổi phí sang" : "Quy đổi sang"}
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
                  onClick={onCalculateAndConvert}
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
                      ) : (activeTab === 'calculate' ? 'Tính toán & Quy đổi' : 'Chuyển đổi ngay')}
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

            {/* Total Fee Section */}
            {result && loadingState === LoadingState.SUCCESS && (
                <>
                   {activeTab === 'calculate' && (
                        <div className="flex items-center gap-2 animate-fade-in-up mt-2">
                             <div className="h-px bg-slate-200 flex-1"></div>
                             <span className="text-sm font-extrabold text-slate-400 uppercase tracking-widest">Phí dịch vụ tổng</span>
                             <div className="h-px bg-slate-200 flex-1"></div>
                        </div>
                   )}
                   <ResultSection 
                      result={result} 
                      fromCurrency={fromCurrency} 
                      toCurrency={toCurrency} 
                      inputAmount={amount}
                      formatCurrency={formatCurrency}
                      theme={theme}
                   />
                </>
            )}

            {/* Detailed Stage Fee Breakdown */}
            {activeTab === 'calculate' && stageFeeData && loadingState === LoadingState.SUCCESS && (
                <div className="animate-fade-in-up pt-2">
                    <div className="flex items-center gap-2 mb-4">
                        <div className="h-px bg-slate-200 flex-1"></div>
                        <span className="text-sm font-extrabold text-slate-400 uppercase tracking-widest">Phí mỗi giai đoạn (50%)</span>
                        <div className="h-px bg-slate-200 flex-1"></div>
                    </div>
                    
                    <div className="grid md:grid-cols-2 gap-4">
                        {/* Stage Fee - Source */}
                        <div className="p-4 rounded-2xl border border-slate-200 bg-slate-50/50 flex flex-col justify-between">
                            <div>
                                <div className="flex items-center gap-2 mb-2 opacity-70">
                                    <img src={fromCurrency.flag} alt={fromCurrency.code} className="w-6 h-4 rounded shadow-sm object-cover" />
                                    <span className="text-xs font-bold uppercase text-slate-500">{fromCurrency.code}</span>
                                </div>
                                <div className="flex items-start justify-between gap-3">
                                    <div className="text-xl sm:text-2xl font-bold text-slate-700">
                                        {stageFeeData.formattedSource}
                                    </div>
                                    <CopyButton text={stageFeeData.formattedSource} />
                                </div>
                            </div>
                            <div className="mt-3 pt-3 border-t border-slate-200">
                                <p className="text-sm italic font-medium text-slate-600 leading-relaxed">{stageFeeData.textSource}</p>
                            </div>
                        </div>

                        {/* Stage Fee - Target */}
                        <div className="p-4 rounded-2xl border border-primary-100 bg-primary-50/30 flex flex-col justify-between">
                            <div>
                                <div className="flex items-center gap-2 mb-2">
                                    <img src={toCurrency.flag} alt={toCurrency.code} className="w-6 h-4 rounded shadow-sm object-cover" />
                                    <span className="text-xs font-bold uppercase text-primary-500">{toCurrency.code}</span>
                                </div>
                                <div className="flex items-start justify-between gap-3">
                                    <div className="text-xl sm:text-2xl font-bold text-primary-700">
                                        {stageFeeData.formattedTarget}
                                    </div>
                                    <CopyButton 
                                        text={stageFeeData.formattedTarget} 
                                        className="bg-white border-primary-200 text-primary-500 hover:text-primary-700 hover:border-primary-300"
                                    />
                                </div>
                            </div>
                            <div className="mt-3 pt-3 border-t border-primary-200/50">
                                <p className="text-sm italic font-medium text-primary-800 leading-relaxed">{stageFeeData.textTarget}</p>
                            </div>
                        </div>
                    </div>
                </div>
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
             <div className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl relative z-10 overflow-hidden animate-fade-in-up flex flex-col max-h-[85vh]">
                <div className="p-0 flex-1 overflow-hidden flex flex-col">
                   <HistorySection 
                        history={filteredHistory} 
                        onSelect={handleHistorySelect} 
                        onClear={clearHistory}
                        onDeleteItems={deleteHistoryItems}
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