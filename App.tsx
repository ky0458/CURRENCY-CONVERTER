import React, { useState, useEffect, useMemo, useRef } from 'react';
import { CurrencyRow } from './components/CurrencyRow';
import { Header } from './components/Header';
import { SwapButton } from './components/SwapButton';
import { ResultSection } from './components/ResultSection';
import { DenominationSelector } from './components/DenominationSelector';
import { HistorySection } from './components/HistorySection';
import { ThemeSelector } from './components/ThemeSelector';
import { TabSelector } from './components/TabSelector';
import { NotesManager } from './components/NotesManager';
import { useCurrencyConverter } from './hooks/useCurrencyConverter';
import { LoadingState, ThemeColor, Currency, ConversionHistoryItem } from './types';
import { THEME_COLORS, DEFAULT_SOURCE_CURRENCY } from './constants';
import { generatePalette, extractDominantColor, compressImage } from './utils/themeUtils';
import { getReadFunction } from './utils/currencyTextFormatter';
import { CopyButton } from './components/CopyButton';

const App: React.FC = () => {
  const {
    amount, setAmount, fromCurrency, setFromCurrency, toCurrency, setToCurrency,
    loadingState, result, errorMsg, isSwapping, handleConvert, handleSwap,
    history, clearHistory, deleteHistoryItems, selectHistoryItem, resetResult, addToHistory
  } = useCurrencyConverter();
  
  const [activeDropdown, setActiveDropdown] = useState<'FROM' | 'TO' | null>(null);
  const [theme, setTheme] = useState<ThemeColor>('blue');
  const [showHistory, setShowHistory] = useState(false);
  const [isClosingHistory, setIsClosingHistory] = useState(false); // New state for history closing animation
  
  // Background Image State
  const [backgroundImage, setBackgroundImage] = useState<string | null>(null);

  // States for Calculation & Revenue Mode
  const [activeTab, setActiveTab] = useState<'convert' | 'calculate' | 'revenue'>('convert');
  const [salaryAmount, setSalaryAmount] = useState<string>('');
  const [calcType, setCalcType] = useState<'probation' | 'official'>('official');
  
  // New State for Revenue Options
  const [revenueShare, setRevenueShare] = useState<'all' | 'cv' | 'job'>('all');
  const [isRevenueDropdownOpen, setIsRevenueDropdownOpen] = useState(false);
  const revenueDropdownRef = useRef<HTMLDivElement>(null);

  const [revenueResult, setRevenueResult] = useState<{
      totalRevenue: number;
      stageRevenue: number;
      netIncome: number;
  } | null>(null);

  const revenueOptions = [
    { value: 'all', label: 'Tất cả (100%)' },
    { value: 'cv', label: 'Có CV (70%)' },
    { value: 'job', label: 'Nắm Job (30%)' }
  ];

  // Filter history based on active tab
  const filteredHistory = useMemo(() => {
    return history.filter(item => item.type === activeTab);
  }, [history, activeTab]);

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

  // Initial load of theme and background
  useEffect(() => {
    const savedTheme = localStorage.getItem('app_theme');
    const savedBg = localStorage.getItem('app_bg');
    
    if (savedBg) {
        setBackgroundImage(savedBg);
    }

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
    applyTheme(newTheme);
  };

  const handleBackgroundUpload = async (file: File) => {
      if (!file) return;

      try {
          // Compress image to avoid LocalStorage quota limit
          const base64String = await compressImage(file);
          
          setBackgroundImage(base64String);
          
          try {
              localStorage.setItem('app_bg', base64String);
          } catch (e) {
              console.error("LocalStorage quota exceeded", e);
              alert("Ảnh nền quá lớn để lưu tự động. Ảnh sẽ chỉ hiển thị trong phiên làm việc hiện tại.");
          }
          
          // Auto extract color and set theme
          try {
              const dominantColor = await extractDominantColor(base64String);
              setTheme(dominantColor);
              localStorage.setItem('app_theme', dominantColor);
              applyTheme(dominantColor);
          } catch (e) {
              console.error("Could not extract color", e);
          }
      } catch (error) {
          console.error("Error processing background image", error);
          alert("Có lỗi xảy ra khi xử lý ảnh.");
      }
  };

  const handleRemoveBackground = () => {
    setBackgroundImage(null);
    localStorage.removeItem('app_bg');
  };

  // Handle click outside for Revenue Dropdown
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
        if (revenueDropdownRef.current && !revenueDropdownRef.current.contains(event.target as Node)) {
            setIsRevenueDropdownOpen(false);
        }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleAmountChange = (val: string) => {
    if (activeTab === 'calculate' || activeTab === 'revenue') {
        setSalaryAmount(val);
    } else {
        setAmount(val);
    }
    resetResult();
    setRevenueResult(null); // Reset revenue result on input change
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

  const handleCloseHistory = () => {
      setIsClosingHistory(true);
      setTimeout(() => {
          setShowHistory(false);
          setIsClosingHistory(false);
      }, 300); // 300ms matches standard CSS transition time
  };

  const handleHistorySelect = (item: ConversionHistoryItem) => {
    selectHistoryItem(item);
    
    if (item.type === 'calculate' && item.originalSalary) {
        setSalaryAmount(item.originalSalary.toString());
        handleConvert(item.inputAmount.toString(), activeTab, item.originalSalary);
    } 
    else if (item.type === 'revenue' && item.revenueDetails) {
        setSalaryAmount(item.inputAmount.toString());
        setRevenueShare(item.revenueDetails.shareType);
        // Recalculate directly to show result
        setRevenueResult({
            totalRevenue: item.revenueDetails.totalRevenue,
            stageRevenue: item.revenueDetails.stageRevenue,
            netIncome: item.convertedAmount
        });
    }
    else {
        handleConvert(item.inputAmount.toString(), activeTab);
    }
    
    handleCloseHistory();
  };

  const handleSwapClick = () => {
    handleSwap(activeTab as 'convert' | 'calculate');
  };

  // Main Calculation Logic
  const onCalculateAndConvert = () => {
    if (activeTab === 'revenue') {
        // Revenue Logic
        const salary = parseFloat(salaryAmount.replace(/,/g, ''));
        if (isNaN(salary) || salary <= 0) {
             setRevenueResult(null);
             return;
        }

        // 1. Calculate Base Fee (Revenue) from Salary
        const feeMultiplier = calcType === 'probation' ? 0.75 : 0.60;
        const baseRevenue = Math.floor(salary * feeMultiplier);

        // 2. Apply Revenue Share Option
        let shareMultiplier = 1;
        if (revenueShare === 'cv') shareMultiplier = 0.7;
        else if (revenueShare === 'job') shareMultiplier = 0.3;

        const totalRevenue = Math.floor(baseRevenue * shareMultiplier);

        // 3. Calculate Derived Values
        const stageRevenue = Math.floor(totalRevenue / 2);
        const netIncome = Math.floor(totalRevenue * 0.49);

        setRevenueResult({
            totalRevenue,
            stageRevenue,
            netIncome
        });

        // Add to history
        addToHistory(
            salary,
            DEFAULT_SOURCE_CURRENCY, // Assume VND
            DEFAULT_SOURCE_CURRENCY, // Assume VND
            netIncome,
            'revenue',
            undefined,
            {
                shareType: revenueShare,
                stageRevenue: stageRevenue,
                totalRevenue: totalRevenue
            }
        );

    } else if (activeTab === 'calculate') {
        // Calculate Fee Logic
        const salary = parseFloat(salaryAmount.replace(/,/g, ''));
        if (isNaN(salary) || salary <= 0) {
            handleConvert('0', activeTab); 
            return;
        }
        const multiplier = calcType === 'probation' ? 0.75 : 0.60;
        const fee = Math.floor(salary * multiplier);
        setAmount(fee.toString()); // Sync state
        handleConvert(fee.toString(), activeTab, salary); // Trigger conversion
    } else {
        // Standard Convert Logic
        handleConvert(amount, activeTab);
    }
  };

  const renderHistoryButton = (
    <button 
        onClick={() => setShowHistory(true)}
        className={`flex items-center gap-1.5 text-xs font-bold hover:text-primary-700 px-2 py-1 rounded-md transition-all 
        ${backgroundImage ? 'text-primary-600 bg-white/90' : 'text-primary-600 bg-primary-50 hover:bg-primary-100'}`}
    >
        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-3.5 h-3.5">
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
        </svg>
        Lịch sử
    </button>
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

  const vietNamFlagUrl = "https://flagcdn.com/w80/vn.png";
  const hasBackground = !!backgroundImage;

  return (
    <div 
        className={`min-h-screen font-sans text-slate-800 selection:bg-primary-200 flex flex-col relative transition-all duration-500`}
        style={{
            backgroundColor: backgroundImage ? 'transparent' : '#f1f5f9',
            backgroundImage: backgroundImage ? `url(${backgroundImage})` : 'none',
            backgroundSize: 'cover',
            backgroundPosition: 'center',
            backgroundAttachment: 'fixed',
            backgroundRepeat: 'no-repeat'
        }}
    >
      
      {/* 1. Global Blurred Background */}
      <div 
        className="fixed inset-0 z-0 transition-all duration-500 bg-slate-100"
        style={{
            backgroundImage: backgroundImage ? `url(${backgroundImage})` : 'none',
            backgroundSize: 'cover',
            backgroundPosition: 'center',
            backgroundAttachment: 'fixed',
            filter: backgroundImage ? 'blur(20px) brightness(0.9)' : 'none',
            transform: 'scale(1.05)'
        }}
      />

      <div className="fixed top-3 right-3 sm:top-5 sm:right-5 z-[100] animate-fade-in-up">
        <ThemeSelector 
            currentTheme={theme} 
            onThemeChange={handleThemeChange} 
            onBackgroundUpload={handleBackgroundUpload}
            onRemoveBackground={handleRemoveBackground}
            currentBackground={backgroundImage}
        />
      </div>

      <div className="flex-1 flex items-center justify-center p-3 sm:p-4 relative z-20">
        {/* 2. Main Card with Optimized Border/Background */}
        <div 
            className={`w-full max-w-5xl rounded-3xl relative flex flex-col my-2 mb-8 transition-all duration-300 shadow-2xl
            ${!hasBackground 
                ? 'bg-white/95 backdrop-blur-sm border border-white/60 shadow-slate-900/10' 
                : 'border border-white/10 ring-1 ring-white/20 shadow-black/20'}`} 
            style={{
                backgroundImage: hasBackground ? `url(${backgroundImage})` : 'none',
                backgroundSize: 'cover',
                backgroundPosition: 'center',
            }}
        >
          {/* Internal overlay */}
          {hasBackground && <div className="absolute inset-0 bg-black/5 z-0 pointer-events-none rounded-3xl"></div>}
          
          <div className="relative z-10">
            <Header theme={theme} onShowHistory={() => {}} />

            <div className="p-4 sm:p-8 space-y-6 relative flex-1">
                
                <div className="animate-fade-in-up" style={{ animationDelay: '100ms' }}>
                    <TabSelector 
                        activeTab={activeTab} 
                        onTabChange={(tab) => { setActiveTab(tab); resetResult(); setAmount(''); setSalaryAmount(''); setRevenueResult(null); }} 
                        theme={theme} 
                    />
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

                <div className="flex flex-col md:flex-row items-center md:items-start relative gap-3 md:gap-4">
                {/* 
                    Z-Index Logic Fixed: 
                    If FROM is active OR Revenue Dropdown is open, it gets z-50 to stack above the button.
                    Otherwise, it sits at z-20.
                */}
                <div className={`w-full md:flex-1 transition-all relative ${activeDropdown === 'FROM' || isRevenueDropdownOpen ? 'z-50' : 'z-20'}`}> 
                    <CurrencyRow
                        key={activeTab}
                        label={activeTab === 'convert' ? "Nhập số tiền cần đổi" : "Nhập mức lương"}
                        amount={activeTab === 'convert' ? amount : salaryAmount}
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
                        hasBackgroundImage={hasBackground}
                    />

                    {(activeTab === 'calculate' || activeTab === 'revenue') && (
                        <div className="mt-3 flex gap-3 animate-fade-in-up">
                            {/* Official Salary */}
                            <label className={`flex-1 flex items-center justify-center gap-2 px-3 rounded-2xl border cursor-pointer transition-all h-[60px] sm:h-[66px]
                                ${calcType === 'official' 
                                    ? 'bg-primary-50 border-primary-500 text-primary-700 font-bold' 
                                    : hasBackground ? 'bg-white/80 border-white/40 text-slate-700 hover:bg-white' : 'bg-white/90 border-slate-200 text-slate-600 hover:bg-white'}`}>
                                <input type="radio" name="calcType" value="official" checked={calcType === 'official'} onChange={() => setCalcType('official')} className="hidden" />
                                <div className={`w-4 h-4 rounded-full border flex items-center justify-center ${calcType === 'official' ? 'border-primary-500' : 'border-slate-300'}`}>
                                    {calcType === 'official' && <div className="w-2 h-2 rounded-full bg-primary-500" />}
                                </div>
                                <span>Chính thức (60%)</span>
                            </label>

                            {/* Probation Salary */}
                            <label className={`flex-1 flex items-center justify-center gap-2 px-3 rounded-2xl border cursor-pointer transition-all h-[60px] sm:h-[66px]
                                ${calcType === 'probation' 
                                    ? 'bg-primary-50 border-primary-500 text-primary-700 font-bold' 
                                    : hasBackground ? 'bg-white/80 border-white/40 text-slate-700 hover:bg-white' : 'bg-white/90 border-slate-200 text-slate-600 hover:bg-white'}`}>
                                <input type="radio" name="calcType" value="probation" checked={calcType === 'probation'} onChange={() => setCalcType('probation')} className="hidden" />
                                <div className={`w-4 h-4 rounded-full border flex items-center justify-center ${calcType === 'probation' ? 'border-primary-500' : 'border-slate-300'}`}>
                                    {calcType === 'probation' && <div className="w-2 h-2 rounded-full bg-primary-500" />}
                                </div>
                                <span>Thử việc (75%)</span>
                            </label>
                        </div>
                    )}

                    {activeTab === 'revenue' && (
                        <div className="mt-4 animate-fade-in-up" style={{ animationDelay: '100ms' }}>
                            <div className="flex flex-col gap-1.5 w-full" ref={revenueDropdownRef}>
                                <label className={`text-[10px] sm:text-xs font-bold uppercase tracking-wide ml-1 transition-colors ${hasBackground ? 'text-white/90 drop-shadow-sm' : 'text-slate-500'}`}>
                                    Tùy chọn tỷ lệ
                                </label>
                                <div className="relative group">
                                    <button
                                        onClick={() => setIsRevenueDropdownOpen(!isRevenueDropdownOpen)}
                                        className={`relative w-full border text-slate-800 text-left text-base sm:text-lg font-bold py-4 px-4 pr-12 rounded-2xl transition-all h-[60px] sm:h-[66px] flex items-center backdrop-blur-md
                                        ${isRevenueDropdownOpen 
                                            ? 'border-primary-500 ring-2 ring-primary-100 z-50 bg-white' 
                                            : hasBackground 
                                                ? 'bg-white/80 border-white/40 hover:bg-white' 
                                                : 'bg-white/90 border-slate-200 hover:border-primary-300 hover:bg-white'}`}
                                    >
                                        {revenueOptions.find(o => o.value === revenueShare)?.label}
                                        <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-4 text-slate-400">
                                            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={3} stroke="currentColor" className={`w-4 h-4 transition-transform ${isRevenueDropdownOpen ? 'rotate-180 text-primary-500' : ''}`}>
                                                <path strokeLinecap="round" strokeLinejoin="round" d="m19.5 8.25-7.5 7.5-7.5-7.5" />
                                            </svg>
                                        </div>
                                    </button>
                                    
                                    {isRevenueDropdownOpen && (
                                        <div className="absolute top-[calc(100%+8px)] w-full bg-white rounded-2xl shadow-xl border border-slate-100 overflow-hidden transition-all z-[100] animate-fade-in-up">
                                            <div className="p-1">
                                                {revenueOptions.map((option) => (
                                                    <div 
                                                        key={option.value}
                                                        onClick={() => {
                                                            setRevenueShare(option.value as any);
                                                            setIsRevenueDropdownOpen(false);
                                                        }}
                                                        className={`flex items-center justify-between px-4 py-3 rounded-xl cursor-pointer transition-colors ${revenueShare === option.value ? 'bg-primary-50 text-primary-700' : 'hover:bg-slate-50 text-slate-700'}`}
                                                    >
                                                        <span className="font-bold">{option.label}</span>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    )}
                </div>

                {activeTab === 'convert' && (
                    <div className="md:mt-12 z-30 shrink-0 relative">
                        <SwapButton onClick={handleSwapClick} isSwapping={isSwapping} theme={theme} />
                    </div>
                )}

                {activeTab !== 'revenue' && (
                    <div className={`w-full md:flex-1 transition-all relative ${activeDropdown === 'TO' ? 'z-50' : 'z-20'}`}>
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
                            hasBackgroundImage={hasBackground}
                        />
                    </div>
                )}
                </div>

                <button
                    onClick={onCalculateAndConvert}
                    disabled={loadingState === LoadingState.LOADING}
                    className={`w-full py-3.5 sm:py-4 rounded-2xl text-white font-bold text-base sm:text-lg shadow-xl transition-all transform mt-4 relative z-20
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
                        ) : (
                            activeTab === 'revenue' ? 'Tính doanh thu' :
                            activeTab === 'calculate' ? 'Tính toán & Quy đổi' : 'Chuyển đổi ngay'
                        )}
                    </span>
                </button>
                
                {/* Exchange Rate Badge */}
                {activeTab !== 'revenue' && result && loadingState === LoadingState.SUCCESS && (
                    <div className="flex justify-center -mt-2 animate-fade-in-up relative z-10">
                    <div className="text-xs sm:text-sm font-medium px-4 py-1.5 rounded-full border border-white/60 bg-white/95 backdrop-blur-sm text-slate-500 shadow-sm flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></span>
                        {formatExchangeRate(result.exchangeRate, fromCurrency.code, toCurrency.code)}
                    </div>
                    </div>
                )}

                {/* --- RESULTS SECTIONS --- */}
                {activeTab !== 'revenue' && result && loadingState === LoadingState.SUCCESS && (
                    <>
                    {activeTab === 'calculate' && (
                            <div className="flex items-center gap-2 animate-fade-in-up mt-2">
                                <div className="h-px bg-slate-200/50 flex-1"></div>
                                <span className={`text-sm font-extrabold uppercase tracking-widest drop-shadow-sm ${hasBackground ? 'text-white drop-shadow-sm' : 'text-slate-500'}`}>Phí dịch vụ tổng</span>
                                <div className="h-px bg-slate-200/50 flex-1"></div>
                            </div>
                    )}
                    <ResultSection 
                        result={result} 
                        fromCurrency={fromCurrency} 
                        toCurrency={toCurrency} 
                        inputAmount={amount}
                        formatCurrency={formatCurrency}
                        theme={theme}
                        hasBackgroundImage={hasBackground}
                    />
                    </>
                )}

                {activeTab === 'calculate' && stageFeeData && loadingState === LoadingState.SUCCESS && (
                    <div className="animate-fade-in-up pt-2">
                        <div className="flex items-center gap-2 mb-4">
                            <div className="h-px bg-slate-200/50 flex-1"></div>
                            <span className={`text-sm font-extrabold uppercase tracking-widest drop-shadow-sm ${hasBackground ? 'text-white drop-shadow-sm' : 'text-slate-500'}`}>Phí mỗi giai đoạn (50%)</span>
                            <div className="h-px bg-slate-200/50 flex-1"></div>
                        </div>
                        
                        <div className="grid md:grid-cols-2 gap-4">
                            {/* Stage Fee Cards - Optimized Borders */}
                            <div className={`p-4 rounded-2xl flex flex-col justify-between shadow-lg backdrop-blur-md ${hasBackground ? 'bg-white/80 border border-white/40' : 'bg-white/95 border border-white/50'}`}>
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
                                <div className="mt-3 pt-3 border-t border-slate-200/50">
                                    <div className="flex items-center justify-between mb-1">
                                        <span className="text-[10px] font-bold uppercase text-slate-400">Bằng chữ</span>
                                        <CopyButton text={stageFeeData.textSource} className="bg-white/80 border-slate-200 text-slate-400 hover:text-slate-600 hover:border-slate-300"/>
                                    </div>
                                    <p className="text-sm italic font-medium text-slate-600 leading-relaxed">{stageFeeData.textSource}</p>
                                </div>
                            </div>

                            <div className={`p-4 rounded-2xl flex flex-col justify-between shadow-lg backdrop-blur-md ${hasBackground ? 'bg-primary-50/80 border border-primary-100/40' : 'bg-primary-50/95 border border-primary-100/50'}`}>
                                <div>
                                    <div className="flex items-center gap-2 mb-2">
                                        <img src={toCurrency.flag} alt={toCurrency.code} className="w-6 h-4 rounded shadow-sm object-cover" />
                                        <span className="text-xs font-bold uppercase text-primary-500">{toCurrency.code}</span>
                                    </div>
                                    <div className="flex items-start justify-between gap-3">
                                        <div className="text-xl sm:text-2xl font-bold text-primary-700">
                                            {stageFeeData.formattedTarget}
                                        </div>
                                        <CopyButton text={stageFeeData.formattedTarget} className="bg-white/80 border-primary-200 text-primary-500 hover:text-primary-700 hover:border-primary-300"/>
                                    </div>
                                </div>
                                <div className="mt-3 pt-3 border-t border-primary-200/50">
                                    <div className="flex items-center justify-between mb-1">
                                        <span className="text-[10px] font-bold uppercase text-primary-400">Bằng chữ</span>
                                        <CopyButton text={stageFeeData.textTarget} className="bg-white/80 border-primary-200 text-primary-500 hover:text-primary-700 hover:border-primary-300"/>
                                    </div>
                                    <p className="text-sm italic font-medium text-primary-800 leading-relaxed">{stageFeeData.textTarget}</p>
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {activeTab === 'revenue' && revenueResult && (
                    <div className="animate-fade-in-up space-y-4 pt-2">
                        <div className="flex items-center gap-2 mt-2 mb-4">
                            <div className="h-px bg-slate-200/50 flex-1"></div>
                            <span className={`text-sm font-extrabold uppercase tracking-widest drop-shadow-sm ${hasBackground ? 'text-white drop-shadow-sm' : 'text-slate-500'}`}>Kết quả tính doanh thu</span>
                            <div className="h-px bg-slate-200/50 flex-1"></div>
                        </div>

                        <div className={`p-5 rounded-3xl backdrop-blur-md shadow-lg flex flex-col gap-6 ${hasBackground ? 'bg-white/80 border border-white/40' : 'bg-white/95 border border-white/50'}`}>
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                    <div className="p-2 bg-slate-50 rounded-lg border border-slate-100">
                                        <img src={vietNamFlagUrl} alt="VND" className="w-6 h-4 rounded shadow-sm object-cover" />
                                    </div>
                                    <div>
                                        <span className="text-xs font-bold uppercase text-slate-400 block mb-0.5">Doanh thu tổng</span>
                                        <span className="text-[10px] font-semibold text-primary-600 bg-primary-50 px-2 py-0.5 rounded-full">
                                            {revenueShare === 'all' ? '100%' : revenueShare === 'cv' ? '70%' : '30%'}
                                        </span>
                                    </div>
                                </div>
                                <div className="flex flex-col items-end gap-1">
                                    <span className="text-xl sm:text-2xl font-bold text-slate-800">
                                        {formatCurrency(revenueResult.totalRevenue, 'vi-VN', 'VND')}
                                    </span>
                                </div>
                            </div>

                            <div className="w-full h-px bg-slate-200/50"></div>

                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                    <div className="p-2 bg-slate-50 rounded-lg border border-slate-100">
                                        <img src={vietNamFlagUrl} alt="VND" className="w-6 h-4 rounded shadow-sm object-cover" />
                                    </div>
                                    <div>
                                        <span className="text-xs font-bold uppercase text-slate-400 block mb-0.5">Doanh thu mỗi giai đoạn</span>
                                        <span className="text-[10px] font-semibold text-primary-600 bg-primary-50 px-2 py-0.5 rounded-full">
                                            50%
                                        </span>
                                    </div>
                                </div>
                                <div className="flex flex-col items-end gap-1">
                                    <span className="text-xl sm:text-2xl font-bold text-slate-800">
                                        {formatCurrency(revenueResult.stageRevenue, 'vi-VN', 'VND')}
                                    </span>
                                </div>
                            </div>
                        </div>

                        <div className="p-6 rounded-3xl bg-gradient-to-br from-primary-600 to-primary-800 shadow-lg shadow-primary-200 relative overflow-hidden group transform hover:scale-[1.01] transition-transform duration-300">
                            <div className="absolute top-0 right-0 p-4 opacity-10">
                                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-24 h-24 text-white">
                                    <path d="M12 7.5a2.25 2.25 0 1 0 0 4.5 2.25 2.25 0 0 0 0-4.5Z" />
                                    <path fillRule="evenodd" d="M1.5 4.875C1.5 3.839 2.34 3 3.375 3h17.25c1.035 0 1.875.84 1.875 1.875v9.75c0 1.036-.84 1.875-1.875 1.875H3.375A1.875 1.875 0 0 1 1.5 14.625v-9.75ZM8.25 9.75a3.75 3.75 0 1 1 7.5 0 3.75 3.75 0 0 1-7.5 0ZM18.75 9a.75.75 0 0 0-.75.75v.008c0 .414.336.75.75.75h.008a.75.75 0 0 0 .75-.75V9.75a.75.75 0 0 0-.75-.75h-.008ZM4.5 9.75A.75.75 0 0 1 5.25 9h.008a.75.75 0 0 1 .75.75v.008a.75.75 0 0 1-.75.75H5.25a.75.75 0 0 1-.75-.75V9.75Z" clipRule="evenodd" />
                                    <path d="M2.25 18a.75.75 0 0 0 0 1.5c5.4 0 10.63.722 15.6 2.075 1.19.324 2.4-.558 2.4-1.82V18.75a.75.75 0 0 0-.75-.75H2.25Z" />
                                </svg>
                            </div>

                            <div className="relative z-10 flex flex-col items-center text-center">
                                <div className="flex items-center gap-2 mb-2 bg-white/10 px-3 py-1 rounded-full backdrop-blur-sm">
                                    <img src={vietNamFlagUrl} alt="VND" className="w-5 h-3.5 rounded shadow-sm object-cover" />
                                    <span className="text-xs font-bold uppercase text-white/90 tracking-widest">Thu nhập thực nhận (49%)</span>
                                </div>
                                
                                <div className="my-2">
                                    <span className="text-3xl sm:text-4xl md:text-5xl font-extrabold text-white tracking-tight">
                                        {formatCurrency(revenueResult.netIncome, 'vi-VN', 'VND')}
                                    </span>
                                </div>
                            </div>
                        </div>
                    </div>
                )}
            </div>
          </div>
        </div>
      </div>
      
      {/* 3. Floating Notes Manager */}
      <NotesManager />
      
      {/* Footer */}
      <footer className="w-full bg-slate-900/80 backdrop-blur text-slate-400 py-6 mt-auto relative z-10">
        <div className="container mx-auto px-4 text-center">
            <p className="font-semibold text-slate-300 mb-1 tracking-wide text-sm">Powered by ZiQi</p>
            <p className="text-xs opacity-60">Lasted update: {new Date().toLocaleDateString('vi-VN')} </p>
        </div>
      </footer>

      {showHistory && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
             <div 
                className={`absolute inset-0 bg-black/40 backdrop-blur-sm transition-opacity duration-300 ${isClosingHistory ? 'opacity-0' : 'opacity-100 animate-fade-in-up'}`} 
                onClick={handleCloseHistory}
            />
             <div className={`bg-white rounded-2xl shadow-2xl w-full max-w-4xl relative z-10 overflow-hidden flex flex-col max-h-[85vh] 
                ${isClosingHistory ? 'animate-fade-out-down' : 'animate-fade-in-up'}`}
             >
                <div className="p-0 flex-1 overflow-hidden flex flex-col min-h-0">
                   <HistorySection 
                        history={filteredHistory} 
                        onSelect={handleHistorySelect} 
                        onClear={clearHistory} 
                        onDeleteItems={deleteHistoryItems}
                        formatCurrency={formatCurrency}
                        onClose={handleCloseHistory}
                   />
                </div>
             </div>
        </div>
      )}
    </div>
  );
};

export default App;