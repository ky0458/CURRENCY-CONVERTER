
import React, { useState, useEffect, useMemo, useRef } from 'react';
import { createPortal } from 'react-dom';
import { CurrencyRow } from './components/CurrencyRow';
import { Header } from './components/Header';
import { SwapButton } from './components/SwapButton';
import { ResultSection } from './components/ResultSection';
import { DenominationSelector } from './components/DenominationSelector';
import { HistorySection } from './components/HistorySection';
import { ThemeSelector } from './components/ThemeSelector';
import { TabSelector } from './components/TabSelector';
import { NotesManager } from './components/NotesManager';
import { UserMenu } from './components/UserMenu';
import { useCurrencyConverter } from './hooks/useCurrencyConverter';
import { useRevenueTracker } from './hooks/useRevenueTracker';
import { RevenueStatsSection } from './components/RevenueStatsSection';
import { LoadingState, ThemeColor, Currency, ConversionHistoryItem } from './types';
import { THEME_COLORS, DEFAULT_SOURCE_CURRENCY } from './constants';
import { generatePalette, extractDominantColor, compressImage } from './utils/themeUtils';
import { getReadFunction } from './utils/currencyTextFormatter';
import { CopyButton } from './components/CopyButton';
// Import useAuth to access notification state
import { useAuth, AuthProvider } from './contexts/AuthContext';
import { translateJobTitle } from './services/geminiService';

const ToastNotification = () => {
    const { notification, closeNotification } = useAuth();

    if (!notification) return null;

    const styles = {
        success: { 
            bg: 'bg-emerald-500', 
            shadow: 'shadow-emerald-900/20',
            icon: (
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={3} stroke="currentColor" className="w-5 h-5 text-white">
                    <path strokeLinecap="round" strokeLinejoin="round" d="m4.5 12.75 6 6 9-13.5" />
                </svg>
            )
        },
        error: { 
            bg: 'bg-rose-500', 
            shadow: 'shadow-rose-900/20',
            icon: (
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={3} stroke="currentColor" className="w-5 h-5 text-white">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m9-.75a9 9 0 1 1-18 0 9 9 0 0 1 18 0Zm-9 3.75h.008v.008H12v-.008Z" />
                </svg>
            )
        },
        info: { 
            bg: 'bg-slate-800', 
            shadow: 'shadow-slate-900/20',
            icon: (
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-5 h-5 text-white">
                    <path strokeLinecap="round" strokeLinejoin="round" d="m11.25 11.25.041-.02a.75.75 0 0 1 1.063.852l-.708 2.836a.75.75 0 0 0 1.063.853l.041-.021M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
                </svg>
            )
        }
    };

    const currentStyle = styles[notification.type];

    return createPortal(
        <div className="fixed top-0 left-0 right-0 z-[10000] flex justify-center px-4 pt-4 sm:pt-8 pointer-events-none">
            <div className={`
                pointer-events-auto 
                flex items-start gap-3.5 p-4 pr-12
                rounded-2xl shadow-2xl ${currentStyle.shadow}
                backdrop-blur-xl bg-opacity-95 
                border border-white/10 ring-1 ring-black/5
                w-full max-w-sm sm:max-w-md
                animate-slide-in-down 
                text-white
                ${currentStyle.bg}
            `}>
                <div className="shrink-0 pt-0.5">
                    <div className="p-1.5 bg-white/20 rounded-full">
                        {currentStyle.icon}
                    </div>
                </div>
                <div className="flex-1">
                    <p className="text-sm sm:text-base font-semibold leading-snug text-white/95 break-words">
                        {notification.message}
                    </p>
                </div>
                <button 
                    onClick={closeNotification} 
                    className="absolute top-2 right-2 p-2 hover:bg-white/20 rounded-xl transition-colors text-white/70 hover:text-white"
                >
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-4 h-4">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" />
                    </svg>
                </button>
            </div>
        </div>,
        document.body
    );
};

const AppContent: React.FC = () => {
  const {
    amount, setAmount, fromCurrency, setFromCurrency, toCurrency, setToCurrency,
    loadingState, result, errorMsg, setErrorMsg, isSwapping, handleConvert, handleSwap,
    history, clearHistory, deleteHistoryItems, selectHistoryItem, resetResult, addToHistory
  } = useCurrencyConverter();

  const { records, addRecord, updateRecord, deleteRecord, deleteRecords } = useRevenueTracker();
  const { showNotification } = useAuth();
  
  const [activeDropdown, setActiveDropdown] = useState<'FROM' | 'TO' | null>(null);
  const [theme, setTheme] = useState<ThemeColor>('blue');
  const [showHistory, setShowHistory] = useState(false);
  const [isClosingHistory, setIsClosingHistory] = useState(false);
  
  const [backgroundImage, setBackgroundImage] = useState<string | null>(null);

  const [activeTab, setActiveTab] = useState<'convert' | 'calculate' | 'revenue'>('convert');
  const [salaryAmount, setSalaryAmount] = useState<string>('');
  const [calcType, setCalcType] = useState<'probation' | 'official'>('official');
  
  const [revenueShare, setRevenueShare] = useState<'all' | 'cv' | 'job'>('all');
  const [isRevenueDropdownOpen, setIsRevenueDropdownOpen] = useState(false);
  const revenueDropdownRef = useRef<HTMLDivElement>(null);

  // Job Translation State
  const [jobTitle, setJobTitle] = useState('');
  const [translatedJobTitle, setTranslatedJobTitle] = useState('');
  const [isTranslatingJob, setIsTranslatingJob] = useState(false);

  const [revenueResult, setRevenueResult] = useState<{
      totalRevenue: number;
      stageRevenue: number;
      netIncome: number;
  } | null>(null);

  const revenueOptions = [
    { value: 'all', label: 'Tất cả (100%)' },
    { value: 'job', label: 'Nắm job (70%)' },
    { value: 'cv', label: 'Có CV (30%)' }
  ];

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
          const base64String = await compressImage(file);
          
          setBackgroundImage(base64String);
          
          try {
              localStorage.setItem('app_bg', base64String);
          } catch (e) {
              console.error("LocalStorage quota exceeded", e);
              alert("Ảnh nền quá lớn để lưu tự động. Ảnh sẽ chỉ hiển thị trong phiên làm việc hiện tại.");
          }
          
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
    setRevenueResult(null); 
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
      }, 300); 
  };

  const handleHistorySelect = (item: ConversionHistoryItem) => {
    selectHistoryItem(item);
    
    // Switch active tab to match history item type
    if (item.type === 'calculate') {
        setActiveTab('calculate');
    } else if (item.type === 'revenue') {
        setActiveTab('revenue');
    } else {
        setActiveTab('convert');
    }

    if (item.type === 'calculate' && item.originalSalary) {
        setSalaryAmount(item.originalSalary.toString());
        // Use item.type explicitly instead of activeTab to ensure type safety
        handleConvert(item.inputAmount.toString(), item.type, item.originalSalary);
    } 
    else if (item.type === 'revenue' && item.revenueDetails) {
        setSalaryAmount(item.inputAmount.toString());
        setRevenueShare(item.revenueDetails.shareType);
        setRevenueResult({
            totalRevenue: item.revenueDetails.totalRevenue,
            stageRevenue: item.revenueDetails.stageRevenue,
            netIncome: item.convertedAmount
        });
    }
    else {
        // Use item.type explicitly instead of activeTab to ensure type safety
        handleConvert(item.inputAmount.toString(), item.type);
    }
    
    handleCloseHistory();
  };

  const handleSwapClick = () => {
    // Only applicable for convert type
    if (activeTab === 'convert') {
        handleSwap(activeTab);
    }
  };

  const onCalculateAndConvert = () => {
    if (activeTab === 'revenue') {
        const salary = parseFloat(salaryAmount.replace(/,/g, ''));
        if (isNaN(salary) || salary <= 0) {
             setRevenueResult(null);
             setErrorMsg("Vui lòng nhập số tiền hợp lệ");
             return;
        }
        
        setErrorMsg(""); // Clear error if valid

        const feeMultiplier = calcType === 'probation' ? 0.75 : 0.60;
        const baseRevenue = Math.floor(salary * feeMultiplier);

        let shareMultiplier = 1;
        // Adjusted logic: Job = 70%, CV = 30%
        if (revenueShare === 'job') shareMultiplier = 0.7;
        else if (revenueShare === 'cv') shareMultiplier = 0.3;

        const totalRevenue = Math.floor(baseRevenue * shareMultiplier);

        const stageRevenue = Math.floor(totalRevenue / 2);
        const netIncome = Math.floor(totalRevenue * 0.49);

        setRevenueResult({
            totalRevenue,
            stageRevenue,
            netIncome
        });

        addToHistory(
            salary,
            DEFAULT_SOURCE_CURRENCY, 
            DEFAULT_SOURCE_CURRENCY, 
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
        const salary = parseFloat(salaryAmount.replace(/,/g, ''));
        if (isNaN(salary) || salary <= 0) {
            handleConvert('0', activeTab); 
            return;
        }
        const multiplier = calcType === 'probation' ? 0.75 : 0.60;
        const fee = Math.floor(salary * multiplier);
        setAmount(fee.toString()); 
        handleConvert(fee.toString(), activeTab, salary); 
    } else if (activeTab === 'convert') {
        handleConvert(amount, activeTab); 
    }
  };

  const handleSaveRevenue = () => {
     if (!revenueResult) return;
     const salary = parseFloat(salaryAmount.replace(/,/g, ''));
     addRecord(salary, revenueShare, revenueResult.totalRevenue, revenueResult.netIncome);
     showNotification('Đã lưu vào bảng thống kê!', 'success');
  };

  const handleTranslateJob = async () => {
      if (!jobTitle.trim()) return;
      setIsTranslatingJob(true);
      try {
          const result = await translateJobTitle(jobTitle);
          setTranslatedJobTitle(result);
      } catch (error) {
          console.error(error);
          setTranslatedJobTitle("Lỗi cấu hình");
      } finally {
          setIsTranslatingJob(false);
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

  const calculationData = useMemo(() => {
    if (activeTab !== 'calculate' || !result || !amount) return null;
    
    const totalSource = parseFloat(amount);
    if (isNaN(totalSource)) return null;

    const totalTarget = result.convertedAmount;

    // Stage Calculation (50%)
    const stageSource = Math.floor(totalSource / 2);
    // Note: Re-calculate stage target based on rate to ensure accuracy, or derived from totalTarget/2? 
    // Using rate is safer for rounding consistency with display.
    const stageTarget = Math.ceil(stageSource * result.exchangeRate);

    return {
        total: {
            source: totalSource,
            target: totalTarget,
            textSource: getReadFunction(fromCurrency.code, totalSource),
            textTarget: getReadFunction(toCurrency.code, totalTarget)
        },
        stage: {
            source: stageSource,
            target: stageTarget,
            textSource: getReadFunction(fromCurrency.code, stageSource),
            textTarget: getReadFunction(toCurrency.code, stageTarget)
        }
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
      <ToastNotification />

      {/* GLOBAL FIXED CONTROLS */}
      <div className="fixed top-3 right-3 sm:top-5 sm:right-6 z-[100] flex items-center gap-3 animate-fade-in-up">
        <UserMenu hasBackgroundImage={hasBackground} theme={theme} />
        <ThemeSelector 
            currentTheme={theme} 
            onThemeChange={handleThemeChange} 
            onBackgroundUpload={handleBackgroundUpload}
            onRemoveBackground={handleRemoveBackground}
            currentBackground={backgroundImage}
        />
      </div>

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

      <div className="flex-1 flex items-center justify-center p-3 sm:p-4 pt-16 sm:pt-20 relative z-20">
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
          {hasBackground && <div className="absolute inset-0 bg-black/5 z-0 pointer-events-none rounded-3xl"></div>}
          
          <div className="relative z-10">
            <Header theme={theme} onShowHistory={() => {}} />

            <div className="p-4 sm:p-8 space-y-6 relative flex-1">
                
                <div className="animate-fade-in-up" style={{ animationDelay: '100ms' }}>
                    <TabSelector 
                        activeTab={activeTab as any} 
                        onTabChange={(tab) => { setActiveTab(tab); resetResult(); setAmount(''); setSalaryAmount(''); setRevenueResult(null); setJobTitle(''); setTranslatedJobTitle(''); }} 
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

                {/* Job Translation Section - Refined for "Single Line" look on Desktop */}
                {activeTab === 'calculate' && (
                    <div className="animate-fade-in-up w-full">
                        <div className="flex items-center justify-between mb-2 px-1">
                            <label className={`text-[10px] sm:text-xs font-bold uppercase tracking-wide transition-colors flex items-center gap-1 ${hasBackground ? 'text-white/90 drop-shadow-sm' : 'text-slate-500'}`}>
                                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-3 h-3">
                                    <path fillRule="evenodd" d="M10 18a8 8 0 1 0 0-16 8 8 0 0 0 0 16ZM6.75 9.25a.75.75 0 0 0 0 1.5h6.5a.75.75 0 0 0 0-1.5h-6.5Z" clipRule="evenodd" />
                                </svg>
                                Hỗ trợ dịch thuật
                            </label>
                        </div>
                        
                        <div className={`
                            flex flex-col md:flex-row items-stretch md:items-center w-full rounded-2xl transition-all duration-300 overflow-hidden
                            ${hasBackground 
                                ? 'bg-white/80 backdrop-blur-xl border border-white/40 shadow-lg shadow-black/5' 
                                : 'bg-white border border-slate-200 shadow-sm hover:shadow-md hover:border-primary-200'}
                        `}>
                            {/* Input Area */}
                            <div className="flex-1 flex items-center p-2 sm:p-2.5 gap-2 w-full md:w-auto">
                                <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-xl bg-primary-50 text-primary-600 flex items-center justify-center shrink-0 border border-primary-100">
                                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4 sm:w-5 sm:h-5">
                                        <path strokeLinecap="round" strokeLinejoin="round" d="m21 21-5.197-5.197m0 0A7.5 7.5 0 1 0 5.196 5.196a7.5 7.5 0 0 0 10.607 10.607Z" />
                                    </svg>
                                </div>
                                
                                <div className="flex-1 relative h-full flex items-center">
                                    <input 
                                        type="text"
                                        className="w-full bg-transparent border-none outline-none text-slate-700 font-semibold placeholder:text-slate-400 placeholder:font-normal text-sm sm:text-base"
                                        placeholder="Nhập tên vị trí (VD: Kế toán)"
                                        value={jobTitle}
                                        onChange={(e) => setJobTitle(e.target.value)}
                                        onKeyDown={(e) => e.key === 'Enter' && handleTranslateJob()}
                                    />
                                        {jobTitle && (
                                        <button 
                                            onClick={() => { setJobTitle(''); setTranslatedJobTitle(''); }}
                                            className="absolute right-0 p-1 text-slate-300 hover:text-slate-500 rounded-full hover:bg-slate-100 transition-colors"
                                        >
                                            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4">
                                                <path d="M6.28 5.22a.75.75 0 0 0-1.06 1.06L8.94 10l-3.72 3.72a.75.75 0 1 0 1.06 1.06L10 11.06l3.72 3.72a.75.75 0 1 0 1.06-1.06L11.06 10l3.72-3.72a.75.75 0 0 0-1.06-1.06L10 8.94 6.28 5.22Z" />
                                            </svg>
                                        </button>
                                    )}
                                </div>

                                <button 
                                    onClick={handleTranslateJob}
                                    disabled={!jobTitle.trim() || isTranslatingJob}
                                    className={`
                                        h-8 sm:h-10 px-3 sm:px-4 rounded-xl font-bold text-xs sm:text-sm transition-all flex items-center gap-2 shadow-sm shrink-0
                                        ${!jobTitle.trim() || isTranslatingJob
                                            ? 'bg-slate-100 text-slate-400 cursor-not-allowed shadow-none' 
                                            : 'bg-primary-600 text-white hover:bg-primary-700 active:scale-95 shadow-primary-200'}
                                    `}
                                >
                                    {isTranslatingJob ? (
                                        <svg className="animate-spin h-4 w-4 text-slate-300" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
                                    ) : (
                                        <>Dịch</>
                                    )}
                                </button>
                            </div>

                            {/* Divider: Horizontal on mobile, Vertical on desktop */}
                            <div className="h-px w-full md:w-px md:h-10 bg-slate-100 mx-0 md:mx-0"></div>

                            {/* Result Area */}
                            <div className={`
                                flex-1 p-2 sm:p-2.5 flex items-center justify-between transition-colors duration-300 min-w-0 md:min-w-[250px] w-full md:w-auto h-full
                                ${translatedJobTitle ? 'bg-primary-50/20' : 'bg-slate-50/50'}
                            `}>
                                <div className="flex flex-col justify-center px-2 min-w-0 flex-1">
                                    <span className="text-[9px] sm:text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-0.5">Tiếng Trung</span>
                                    {isTranslatingJob ? (
                                        <div className="h-5 w-24 bg-slate-200 rounded animate-pulse"></div>
                                    ) : (
                                        <span className={`text-sm sm:text-base font-bold truncate block ${translatedJobTitle ? 'text-primary-700' : 'text-slate-400 italic font-normal'}`}>
                                            {translatedJobTitle || "..."}
                                        </span>
                                    )}
                                </div>

                                {translatedJobTitle && (
                                    <button 
                                        onClick={() => {
                                            navigator.clipboard.writeText(translatedJobTitle);
                                            showNotification('Đã sao chép tên vị trí!', 'success');
                                        }}
                                        className="w-8 h-8 sm:w-10 sm:h-10 flex items-center justify-center rounded-xl text-primary-500 hover:bg-white hover:shadow-sm transition-all bg-white/50 shrink-0 ml-2 border border-transparent hover:border-slate-100"
                                        title="Sao chép"
                                    >
                                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-4 h-4 sm:w-5 sm:h-5">
                                            <path strokeLinecap="round" strokeLinejoin="round" d="M15.666 3.888A2.25 2.25 0 0 0 13.5 2.25h-3c-1.03 0-1.9.693-2.166 1.638m7.332 0c.055.194.084.4.084.612v0a.75.75 0 0 1-.75.75H9a.75.75 0 0 1-.75-.75v0c0-.212.03-.418.084-.612m7.332 0c.646.049 1.288.11 1.927.184 1.1.128 1.907 1.077 1.907 2.185V19.5a2.25 2.25 0 0 1-2.25 2.25H6.75A2.25 2.25 0 0 1 4.5 19.5V6.257c0-1.108.806-2.057 1.907-2.185a48.208 48.208 0 0 1 1.927-.184" />
                                        </svg>
                                    </button>
                                )}
                            </div>
                        </div>
                    </div>
                )}

                <div className="flex flex-col md:flex-row items-center md:items-start relative gap-3 md:gap-4">
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
                                <label className={`flex-1 flex items-center justify-center gap-2 px-3 rounded-2xl border cursor-pointer transition-all h-[60px] sm:h-[66px]
                                    ${calcType === 'official' 
                                        ? 'bg-primary-50 border-primary-500 text-primary-700 font-bold' 
                                        : hasBackground ? 'bg-white/80 border-white/40 text-slate-700 hover:bg-white' : 'bg-white/90 border-slate-200 text-slate-600 hover:bg-white'}`}>
                                    <input type="radio" name="calcType" value="official" checked={calcType === 'official'} onChange={() => setCalcType('official')} className="hidden" />
                                    <div className={`w-4 h-4 rounded-full border flex items-center justify-center shrink-0 ${calcType === 'official' ? 'border-primary-500' : 'border-slate-300'}`}>
                                        {calcType === 'official' && <div className="w-2 h-2 rounded-full bg-primary-500" />}
                                    </div>
                                    <div className="flex flex-col sm:flex-row items-center gap-0.5 sm:gap-2 leading-tight">
                                        <span className="text-sm">Chính thức</span>
                                        <span className="text-[10px] sm:text-xs opacity-70 font-normal">(60%)</span>
                                    </div>
                                </label>

                                <label className={`flex-1 flex items-center justify-center gap-2 px-3 rounded-2xl border cursor-pointer transition-all h-[60px] sm:h-[66px]
                                    ${calcType === 'probation' 
                                        ? 'bg-primary-50 border-primary-500 text-primary-700 font-bold' 
                                        : hasBackground ? 'bg-white/80 border-white/40 text-slate-700 hover:bg-white' : 'bg-white/90 border-slate-200 text-slate-600 hover:bg-white'}`}>
                                    <input type="radio" name="calcType" value="probation" checked={calcType === 'probation'} onChange={() => setCalcType('probation')} className="hidden" />
                                    <div className={`w-4 h-4 rounded-full border flex items-center justify-center shrink-0 ${calcType === 'probation' ? 'border-primary-500' : 'border-slate-300'}`}>
                                        {calcType === 'probation' && <div className="w-2 h-2 rounded-full bg-primary-500" />}
                                    </div>
                                    <div className="flex flex-col sm:flex-row items-center gap-0.5 sm:gap-2 leading-tight">
                                        <span className="text-sm">Thử việc</span>
                                        <span className="text-[10px] sm:text-xs opacity-70 font-normal">(75%)</span>
                                    </div>
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
                            <span>
                                {activeTab === 'convert' ? 'Chuyển đổi' : activeTab === 'calculate' ? 'Tính phí & Quy đổi' : 'Tính doanh thu'}
                            </span>
                        )}
                    </span>
                </button>

                {(result && activeTab !== 'revenue') && (
                    <ResultSection 
                        result={result} 
                        fromCurrency={fromCurrency} 
                        toCurrency={toCurrency} 
                        inputAmount={amount}
                        calculationData={calculationData}
                        formatCurrency={formatCurrency}
                        theme={theme}
                        hasBackgroundImage={hasBackground}
                    />
                )}

                {activeTab === 'revenue' && (
                     <>
                        {revenueResult && (
                             <div className="animate-fade-in-up pt-4">
                                <div className="bg-gradient-to-br from-emerald-50 to-teal-50 rounded-2xl p-0.5 shadow-lg border border-emerald-100">
                                    <div className="bg-white/80 backdrop-blur-md rounded-[14px] p-5 relative overflow-hidden">
                                        
                                        {/* Decorative Background */}
                                        <div className="absolute top-0 right-0 p-6 opacity-5 pointer-events-none">
                                             <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-32 h-32 text-emerald-600"><path d="M10.464 8.746c.227-.18.497-.311.786-.394v2.795a2.252 2.252 0 0 1-.786-.393c-.394-.313-.546-.681-.546-1.004 0-.324.152-.692.546-1.004ZM12.75 15.662v-2.824c.347.085.664.228.921.421.427.32.579.686.579.991 0 .305-.152.671-.579.991a2.534 2.534 0 0 1-.921.42Z" /><path fillRule="evenodd" d="M12 2.25c-5.385 0-9.75 4.365-9.75 9.75s4.365 9.75 9.75 9.75 9.75-4.365 9.75-9.75S17.385 2.25 12 2.25ZM12.75 6a.75.75 0 0 0-1.5 0v.816a3.836 3.836 0 0 0-1.72.756c-.712.566-1.112 1.35-1.112 2.178 0 .829.4 1.612 1.113 2.178.502.4 1.102.647 1.719.756v2.978a2.536 2.536 0 0 1-.921-.421l-.879-.66a.75.75 0 0 0-.9 1.2l.879.66c.533.4 1.169.645 1.821.75V18a.75.75 0 0 0 1.5 0v-.81a4.124 4.124 0 0 0 1.821-.749c.745-.559 1.179-1.344 1.179-2.191 0-.847-.434-1.632-1.179-2.191a4.122 4.122 0 0 0-1.821-.75V8.354c.29.082.559.213.786.393l.415.33a.75.75 0 0 0 .933-1.175l-.415-.33a3.836 3.836 0 0 0-1.719-.755V6Z" clipRule="evenodd" /></svg>
                                        </div>
                                        
                                        <div className="relative z-10 text-center mb-5">
                                            <p className="text-[10px] font-extrabold text-emerald-600/70 uppercase tracking-widest mb-1">KẾT QUẢ TÍNH TOÁN</p>
                                            
                                            <p className="text-sm font-semibold text-slate-500 mb-1">Doanh thu thực nhận</p>
                                            <div className="text-4xl sm:text-5xl font-black text-emerald-600 tracking-tighter drop-shadow-sm">
                                                {formatCurrency(revenueResult.netIncome, 'vi-VN', 'VND')}
                                            </div>
                                        </div>

                                        <div className="relative z-10 grid grid-cols-2 gap-3 mb-5">
                                            <div className="bg-white/60 p-3 rounded-xl border border-emerald-100 flex flex-col items-center justify-center text-center">
                                                <span className="text-[10px] font-bold text-slate-400 uppercase">Doanh thu tổng</span>
                                                <span className="text-lg font-bold text-slate-700">{formatCurrency(revenueResult.totalRevenue, 'vi-VN', 'VND')}</span>
                                            </div>
                                            <div className="bg-white/60 p-3 rounded-xl border border-emerald-100 flex flex-col items-center justify-center text-center">
                                                 <span className="text-[10px] font-bold text-slate-400 uppercase">Doanh thu mỗi giai đoạn</span>
                                                 <span className="text-lg font-bold text-slate-700">{formatCurrency(revenueResult.stageRevenue, 'vi-VN', 'VND')}</span>
                                            </div>
                                        </div>

                                        <div className="pt-2 flex justify-center relative z-10">
                                            <button 
                                                onClick={handleSaveRevenue}
                                                className="w-full py-3 bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-bold rounded-xl shadow-lg shadow-emerald-200 transition-all active:scale-95 flex items-center justify-center gap-2"
                                            >
                                                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-4 h-4">
                                                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 16.5V9.75m0 0 3 3m-3-3-3 3M6.75 19.5a4.5 4.5 0 0 1-1.41-8.775 5.25 5.25 0 0 1 10.233-2.33 3 3 0 0 1 3.758 3.848A3.752 3.752 0 0 1 18 19.5H6.75Z" />
                                                </svg>
                                                Lưu vào bảng thống kê bên dưới
                                            </button>
                                        </div>
                                    </div>
                                </div>
                             </div>
                        )}

                        {/* Merged Stats Section */}
                        <div className="mt-8 pt-6 border-t border-slate-200/50">
                             <RevenueStatsSection 
                                records={records}
                                onDeleteRecord={deleteRecord}
                                onDeleteRecords={deleteRecords}
                                onUpdateRecord={updateRecord}
                                formatCurrency={formatCurrency}
                                theme={theme}
                             />
                        </div>
                     </>
                )}

            </div>
            
            {/* History Panel - Absolute Positioned over Content */}
            {showHistory && (
                <div 
                    className={`absolute inset-0 z-50 rounded-3xl overflow-hidden bg-slate-50 transition-all duration-300 origin-top
                    ${isClosingHistory ? 'animate-fade-out-down opacity-0' : 'animate-fade-in-up opacity-100'}`}
                >
                    <HistorySection
                        history={filteredHistory}
                        onSelect={handleHistorySelect}
                        onClear={clearHistory}
                        onDeleteItems={deleteHistoryItems}
                        formatCurrency={formatCurrency}
                        onClose={handleCloseHistory}
                    />
                </div>
            )}
          </div>
        </div>
      </div>
      
      {/* Notes Manager Button/UI */}
      <NotesManager />
    </div>
  );
};

const App = () => {
    return (
        <AuthProvider>
            <AppContent />
        </AuthProvider>
    );
};

export default App;
