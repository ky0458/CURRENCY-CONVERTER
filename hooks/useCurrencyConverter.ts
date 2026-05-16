
import { useState, useCallback, useEffect } from 'react';
import { Currency, ConversionResult, LoadingState, ConversionHistoryItem } from '../types';
import { DEFAULT_SOURCE_CURRENCY, DEFAULT_TARGET_CURRENCY } from '../constants';
import { convertCurrencyApi } from '../services/geminiService';
import { useAuth } from '../contexts/AuthContext';

export const useCurrencyConverter = () => {
  const [amount, setAmount] = useState<string>('100000');
  const [fromCurrency, setFromCurrency] = useState<Currency>(DEFAULT_SOURCE_CURRENCY);
  const [toCurrency, setToCurrency] = useState<Currency>(DEFAULT_TARGET_CURRENCY);
  const [loadingState, setLoadingState] = useState<LoadingState>(LoadingState.IDLE);
  const [result, setResult] = useState<ConversionResult | null>(null);
  const [errorMsg, setErrorMsg] = useState<string>('');
  const [isSwapping, setIsSwapping] = useState(false);
  const [history, setHistory] = useState<ConversionHistoryItem[]>([]);
  
  // CNY Rate State
  const [cnyRate, setCnyRateState] = useState<number>(3700);
  const [useCustomCnyRate, setUseCustomCnyRateState] = useState<boolean>(true);
  
  const { user } = useAuth();

  // Load history & Settings
  const loadHistory = useCallback(async (isRefocus = false) => {
      const savedHistory = localStorage.getItem('conversion_history');
      const savedHistoryOwner = localStorage.getItem('conversion_history_owner');
      const currentOwner = user?.uid || 'guest';
      
      const shouldLoadLocalHistory = !savedHistoryOwner || savedHistoryOwner === currentOwner || savedHistoryOwner === 'guest';
      
      let localHistory: ConversionHistoryItem[] = [];
      if (shouldLoadLocalHistory && savedHistory) {
        const parsed = JSON.parse(savedHistory);
        localHistory = parsed.map((item: any) => ({
            ...item,
            type: item.type || 'convert'
        }));
      }

      if (user && user.uid) {
        try {
          const response = await fetch(`/api/convert-history?uid=${user.uid}`, { headers: { 'x-user-uid': user.uid }});
          if (response.ok) {
            const data = await response.json();
            if (data && data.conversions) {
              const dbConversions = data.conversions;
              
              const mergedMap = new Map();
              if (!isRefocus) {
                  localHistory.forEach((i: ConversionHistoryItem) => mergedMap.set(i.id, i));
              }
              dbConversions.forEach((i: ConversionHistoryItem) => mergedMap.set(i.id, i));
              
              const finalHistory = Array.from(mergedMap.values()).sort((a: any, b: any) => b.timestamp - a.timestamp);
              
              setHistory(finalHistory);
              localStorage.setItem('conversion_history', JSON.stringify(finalHistory));
              localStorage.setItem('conversion_history_owner', user.uid);
              
              if (!isRefocus) {
                  fetch('/api/convert-history/conversions', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json', 'x-user-uid': user.uid },
                    body: JSON.stringify({ uid: user.uid, conversions: finalHistory })
                  }).catch(console.error);
              }
              return;
            }
          }
        } catch (err) {
          console.error("Failed to fetch convert history from DB", err);
        }
      }
      setHistory(localHistory);
    }, [user]);

  useEffect(() => {
    const loadSettings = () => {
       const savedRate = localStorage.getItem('cny_custom_rate');
       const savedMode = localStorage.getItem('cny_use_custom_mode');
       if (savedRate) setCnyRateState(parseFloat(savedRate));
       if (savedMode !== null) setUseCustomCnyRateState(savedMode === 'true');
    };
    loadSettings();
    loadHistory();
  }, [loadHistory]);

  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible' && user) {
        loadHistory(true);
      }
    };
    window.addEventListener('visibilitychange', handleVisibilityChange);
    return () => window.removeEventListener('visibilitychange', handleVisibilityChange);
  }, [loadHistory, user]);

  const setCnyRate = (rate: number) => {
      setCnyRateState(rate);
      localStorage.setItem('cny_custom_rate', rate.toString());
  };

  const setUseCustomCnyRate = (useCustom: boolean) => {
      setUseCustomCnyRateState(useCustom);
      localStorage.setItem('cny_use_custom_mode', String(useCustom));
  };

  const saveHistory = async (newHistory: ConversionHistoryItem[]) => {
    setHistory(newHistory);
    localStorage.setItem('conversion_history', JSON.stringify(newHistory));
    if (user && user.uid) {
        localStorage.setItem('conversion_history_owner', user.uid);
    } else {
        localStorage.setItem('conversion_history_owner', 'guest');
    }
    
    if (user && user.uid) {
      try {
        await fetch('/api/convert-history/conversions', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'x-user-uid': user.uid },
          body: JSON.stringify({ uid: user.uid, conversions: newHistory })
        });
      } catch (err) {
        console.error("Failed to sync conversions to DB", err);
      }
    }
  };

  const addToHistory = (
      currentAmount: number, 
      source: Currency, 
      target: Currency, 
      converted: number, 
      type: 'convert' | 'calculate' | 'revenue', 
      originalSalary?: number,
      revenueDetails?: { shareType: 'all' | 'cv' | 'job', stageRevenue: number, totalRevenue: number, isSalesExecutive?: boolean, specialCase?: 'none' | 'sales' | 'senior', salesExecutiveType?: 'with_language' | 'without_language' }
  ) => {
    const newItem: ConversionHistoryItem = {
      id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
      timestamp: Date.now(),
      inputAmount: currentAmount,
      fromCurrency: source,
      toCurrency: target,
      convertedAmount: converted,
      type: type,
      originalSalary: originalSalary,
      revenueDetails: revenueDetails
    };
    
    const existingIndex = history.findIndex(item => 
        item.inputAmount === newItem.inputAmount && 
        item.fromCurrency.code === newItem.fromCurrency.code && 
        item.toCurrency.code === newItem.toCurrency.code &&
        item.type === newItem.type &&
        item.originalSalary === newItem.originalSalary &&
        item.revenueDetails?.shareType === newItem.revenueDetails?.shareType
    );

    let updatedHistory = [...history];

    if (existingIndex > -1) {
        updatedHistory.splice(existingIndex, 1);
    }

    updatedHistory.unshift(newItem);
    updatedHistory = updatedHistory.slice(0, 50); 
    
    saveHistory(updatedHistory);
  };

  const clearHistory = () => {
    saveHistory([]);
  };

  const deleteHistoryItems = (ids: string[]) => {
    const updatedHistory = history.filter(item => !ids.includes(item.id));
    saveHistory(updatedHistory);
  };

  const selectHistoryItem = (item: ConversionHistoryItem) => {
    setAmount(item.inputAmount.toString());
    setFromCurrency(item.fromCurrency);
    setToCurrency(item.toCurrency);
  };

  const resetResult = useCallback(() => {
    setResult(null);
    setErrorMsg('');
    setLoadingState(LoadingState.IDLE);
  }, []);

  const executeConversion = async (currentAmount: number, source: Currency, target: Currency, type: 'convert' | 'calculate' | 'revenue', originalSalary?: number, revenueDetails?: { shareType: 'all' | 'cv' | 'job', stageRevenue: number, totalRevenue: number, isSalesExecutive?: boolean, specialCase?: 'none' | 'sales' | 'senior', salesExecutiveType?: 'with_language' | 'without_language' }) => {
    setLoadingState(LoadingState.LOADING);
    setErrorMsg('');
    
    try {
      // Pass the current CNY settings
      const data = await convertCurrencyApi(currentAmount, source.code, target.code, cnyRate, useCustomCnyRate);
      setResult(data);
      setLoadingState(LoadingState.SUCCESS);
      addToHistory(currentAmount, source, target, data.convertedAmount, type, originalSalary, revenueDetails);
    } catch (err) {
      setErrorMsg("Có lỗi xảy ra khi lấy tỷ giá. Vui lòng thử lại.");
      setLoadingState(LoadingState.ERROR);
      setResult(null); 
    }
  };

  const handleConvert = useCallback((amountOverride?: string, type: 'convert' | 'calculate' | 'revenue' = 'convert', originalSalary?: number, revenueDetails?: { shareType: 'all' | 'cv' | 'job', stageRevenue: number, totalRevenue: number, isSalesExecutive?: boolean, specialCase?: 'none' | 'sales' | 'senior', salesExecutiveType?: 'with_language' | 'without_language' }) => {
    const valueToCheck = amountOverride !== undefined ? amountOverride : amount;
    const numAmount = parseFloat(valueToCheck);

    if (isNaN(numAmount) || numAmount <= 0) {
      setErrorMsg("Vui lòng nhập số tiền hợp lệ");
      return;
    }
    executeConversion(numAmount, fromCurrency, toCurrency, type, originalSalary, revenueDetails);
  }, [amount, fromCurrency, toCurrency, cnyRate, useCustomCnyRate]);

  const handleSwap = (currentType: 'convert' | 'calculate' | 'revenue' = 'convert') => {
    setIsSwapping(true);
    setTimeout(() => setIsSwapping(false), 500); 
    
    const newFrom = toCurrency;
    const newTo = fromCurrency;
    
    setFromCurrency(newFrom);
    setToCurrency(newTo);
    
    if (result) {
        const numAmount = parseFloat(amount);
        if (!isNaN(numAmount) && numAmount > 0) {
            executeConversion(numAmount, newFrom, newTo, currentType);
        } else {
            setResult(null);
        }
    } else {
        setResult(null); 
    }
  };

  return {
    amount, setAmount, fromCurrency, setFromCurrency, toCurrency, setToCurrency,
    loadingState, result, errorMsg, setErrorMsg,
    isSwapping, handleConvert, handleSwap,
    history, clearHistory, deleteHistoryItems, selectHistoryItem, resetResult, addToHistory,
    cnyRate, setCnyRate, useCustomCnyRate, setUseCustomCnyRate
  };
};
