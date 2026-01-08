
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

  const [activeTab, setActiveTab] = useState<'convert' | 'calculate' | 'revenue' | 'stats'>('convert');
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
    { value: 'cv', label: 'Có CV (70%)' },
    { value: 'job', label: 'Nắm Job (30%)' }
  ];

  const filteredHistory = useMemo(() => {
    // Only filter for tabs that are NOT 'stats'
    if (activeTab === 'stats') return [];
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
        if (revenueShare === 'cv') shareMultiplier = 0.7;
        else if (revenueShare === 'job') shareMultiplier = 0.3;

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
          setTranslatedJobTitle("Lỗi dịch");
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

  const stageFeeData = useMemo(() => {
    if (activeTab !== 'calculate' || !result || !amount) return null;
    
    const totalFeeSource = parseFloat(amount);
    if (isNaN(totalFeeSource)) return null;

    const stageSource = Math.floor(totalFeeSource / 2);
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
                        activeTab={activeTab} 
                        onTabChange={(tab) => { setActiveTab(tab); resetResult(); setAmount(''); setSalaryAmount(''); setRevenueResult(null); setJobTitle(''); setTranslatedJobTitle(''); }} 
                        theme={theme} 
                    />
                </div>
                
                {activeTab === 'stats' ? (
                   <RevenueStatsSection 
                        records={records}
                        onDeleteRecord={deleteRecord}
                        onDeleteRecords={deleteRecords}
                        onUpdateRecord={updateRecord}
                        formatCurrency={formatCurrency}
                        theme={theme}
                   />
                ) : (
                    <>
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
                        <div className={`w-full md:flex-1 transition-all relative ${activeDropdown === 'FROM' || isRevenueDropdownOpen ? 'z-50' : 'z-20'}`}> 
                            
                            {/* Job Title Translation Section - Only visible in Calculate Tab */}
                            {activeTab === 'calculate' && (
                                <div className="mb-4 animate-fade-in-up flex flex-col gap-1">
                                    <div className={`flex items-center bg-white/70 backdrop-blur-sm border rounded-2xl p-1 shadow-sm transition-all h-[56px]
                                        ${hasBackground ? 'border-white/40 bg-white/80' : 'border-slate-200'}
                                    `}>
                                        <div className="relative flex-1 h-full">
                                            <div className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">
                                                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-5 h-5">
                                                    <path fillRule="evenodd" d="M6 3.75A2.75 2.75 0 0 1 8.75 1h2.5A2.75 2.75 0 0 1 14 3.75v.443c.572.055 1.14.122 1.706.2C17.053 4.582 18 5.75 18 7.07v3.469c0 1.126-.694 2.191-1.83 2.54-1.952.599-4.024.921-6.17.921s-4.219-.322-6.17-.921C2.694 12.73 2 11.665 2 10.539V7.07c0-1.321.947-2.489 2.294-2.676A41.047 41.047 0 0 1 6 4.193V3.75Zm6.5 0v.325a41.622 41.622 0 0 0-5 0V3.75c0-.69.56-1.25 1.25-1.25h2.5c.69 0 1.25.56 1.25 1.25Z" clipRule="evenodd" />
                                                    <path d="M12 8a.75.75 0 0 1 .75.75v1.5a.75.75 0 0 1-1.5 0v-1.5A.75.75 0 0 1 12 8ZM8.75 10a.75.75 0 0 0-1.5 0v1.5a.75.75 0 0 0 1.5 0V10ZM12 13.25a.75.75 0 0 1 .75.75v1.5a.75.75 0 0 1-1.5 0v-1.5A.75.75 0 0 1 .75-.75ZM8.75 15.25a.75.75 0 0 0-1.5 0v1.5a.75.75 0 0 0 1.5 0v-1.5Z" />
                                                </svg>
                                            </div>
                                            <input 
                                                type="text"
                                                className="w-full h-full pl-10 pr-4 bg-transparent outline-none text-slate-800 text-sm font-medium placeholder-slate-400"
                                                placeholder="Nhập tên vị trí (VD: Kế toán)"
                                                value={jobTitle}
                                                onChange={(e) => setJobTitle(e.target.value)}
                                                onKeyDown={(e) => e.key === 'Enter' && handleTranslateJob()}
                                            />
                                        </div>
                                        <div className="w-px h-8 bg-slate-200 mx-1"></div>
                                        {/* Result Area */}
                                        <div className="flex-1 flex items-center justify-between px-3 h-full min-w-[120px] bg-slate-50/50 rounded-r-xl">
                                            {isTranslatingJob ? (
                                                <div className="flex items-center gap-2 text-slate-400">
                                                    <div className="w-4 h-4 border-2 border-slate-300 border-t-primary-500 rounded-full animate-spin"></div>
                                                    <span className="text-xs">Đang dịch...</span>
                                                </div>
                                            ) : (
                                                <div className="flex items-center justify-between w-full">
                                                    <span className={`text-base font-bold truncate ${translatedJobTitle ? 'text-primary-700' : 'text-slate-400 italic font-normal text-xs'}`}>
                                                        {translatedJobTitle || "Tiếng Trung"}
                                                    </span>
                                                    {translatedJobTitle && (
                                                        <button 
                                                            onClick={() => navigator.clipboard.writeText(translatedJobTitle)}
                                                            className="p-1.5 text-slate-400 hover:text-primary-600 hover:bg-white rounded-lg transition-colors ml-2"
                                                            title="Sao chép"
                                                        >
                                                            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-4 h-4">
                                                                <path strokeLinecap="round" strokeLinejoin="round" d="M15.666 3.888A2.25 2.25 0 0 0 13.5 2.25h-3c-1.03 0-1.9.693-2.166 1.638m7.332 0c.055.194.084.4.084.612v0a.75.75 0 0 1-.75.75H9a.75.75 0 0 1-.75-.75v0c0-.212.03-.418.084-.612m7.332 0c.646.049 1.288.11 1.927.184 1.1.128 1.907 1.077 1.907 2.185V19.5a2.25 2.25 0 0 1-2.25 2.25H6.75A2.25 2.25 0 0 1 4.5 19.5V6.257c0-1.108.806-2.057 1.907-2.185a48.208 48.208 0 0 1 1.927-.184" />
                                                            </svg>
                                                        </button>
                                                    )}
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            )}

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
                                    activeTab === 'revenue' ? 'Tính doanh thu' :
                                    activeTab === 'calculate' ? 'Tính toán & Quy đổi' : 'Chuyển đổi ngay'
                                )}
                            </span>
                        </button>
                        
                        {activeTab !== 'revenue' && result && loadingState === LoadingState.SUCCESS && (
                            <div className="flex justify-center -mt-2 animate-fade-in-up relative z-10">
                            <div className="text-xs sm:text-sm font-medium px-4 py-1.5 rounded-full border border-white/60 bg-white/95 backdrop-blur-sm text-slate-500 shadow-sm flex items-center gap-2">
                                <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></span>
                                {formatExchangeRate(result.exchangeRate, fromCurrency.code, toCurrency.code)}
                            </div>
                            </div>
                        )}

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
                                
                                <button 
                                    onClick={handleSaveRevenue}
                                    className="w-full py-3 bg-white/60 hover:bg-white border border-white/60 hover:border-white rounded-2xl text-primary-700 font-bold shadow-sm transition-all flex items-center justify-center gap-2 backdrop-blur-sm group"
                                >
                                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5 group-hover:scale-110 transition-transform">
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M12 10.5v6m3-3H9m4.06-7.19-2.12-2.12a1.5 1.5 0 0 0-1.061-.44H4.5A2.25 2.25 0 0 0 2.25 6v12a2.25 2.25 0 0 0 2.25 2.25h15A2.25 2.25 0 0 0 21.75 18V9a2.25 2.25 0 0 0-2.25-2.25h-5.379a1.5 1.5 0 0 1-1.06-.44Z" />
                                    </svg>
                                    Lưu doanh thu
                                </button>
                            </div>
                        )}
                    </>
                )}
            </div>
          </div>
        </div>
      </div>
      
      <NotesManager />
      
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

const App: React.FC = () => {
    return (
        <AuthProvider>
            <AppContent />
        </AuthProvider>
    );
}

export default App;
