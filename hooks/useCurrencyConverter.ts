
import { useState, useCallback, useEffect } from 'react';
import { Currency, ConversionResult, LoadingState, ConversionHistoryItem } from '../types';
import { DEFAULT_SOURCE_CURRENCY, DEFAULT_TARGET_CURRENCY } from '../constants';
import { convertCurrencyApi } from '../services/geminiService';
import { useAuth } from '../contexts/AuthContext';
import { db } from '../firebase';
import { doc, setDoc, onSnapshot } from 'firebase/firestore';

export const useCurrencyConverter = () => {
  const [amount, setAmount] = useState<string>('100000');
  const [fromCurrency, setFromCurrency] = useState<Currency>(DEFAULT_SOURCE_CURRENCY);
  const [toCurrency, setToCurrency] = useState<Currency>(DEFAULT_TARGET_CURRENCY);
  const [loadingState, setLoadingState] = useState<LoadingState>(LoadingState.IDLE);
  const [result, setResult] = useState<ConversionResult | null>(null);
  const [errorMsg, setErrorMsg] = useState<string>('');
  const [isSwapping, setIsSwapping] = useState(false);
  const [history, setHistory] = useState<ConversionHistoryItem[]>([]);
  
  const { user } = useAuth();

  // Load & Sync history logic
  useEffect(() => {
    let unsubscribe = () => {};

    if (user) {
        // LOGGED IN: Real-time listener
        const docRef = doc(db, "users", user.uid);
        unsubscribe = onSnapshot(docRef, (docSnap) => {
            if (docSnap.exists()) {
                const data = docSnap.data();
                if (data.history) {
                    setHistory(data.history);
                }
            } else {
                // New user document or empty
                // Optional: Migrate local storage if needed, or start fresh
            }
        }, (error) => {
            console.error("Firestore history sync error:", error);
        });
    } else {
        // GUEST: Load from LocalStorage
        try {
          const savedHistory = localStorage.getItem('conversion_history');
          if (savedHistory) {
            const parsed = JSON.parse(savedHistory);
            const migrated = parsed.map((item: any) => ({
                ...item,
                type: item.type || 'convert'
            }));
            setHistory(migrated);
          } else {
            setHistory([]);
          }
        } catch (e) {
          console.error("Failed to load history from LocalStorage", e);
        }
    }

    return () => unsubscribe();
  }, [user]);

  const saveHistory = async (newHistory: ConversionHistoryItem[]) => {
    // Optimistic update for UI
    setHistory(newHistory);
    
    if (user) {
      // Save to Firestore
      try {
        const docRef = doc(db, "users", user.uid);
        // Use setDoc with merge to avoid overwriting Notes/Tags
        await setDoc(docRef, { history: newHistory }, { merge: true });
      } catch (e) {
        console.error("Failed to save history to Firestore", e);
      }
    } else {
      // Save to LocalStorage
      localStorage.setItem('conversion_history', JSON.stringify(newHistory));
    }
  };

  const addToHistory = (
      currentAmount: number, 
      source: Currency, 
      target: Currency, 
      converted: number, 
      type: 'convert' | 'calculate' | 'revenue', 
      originalSalary?: number,
      revenueDetails?: { shareType: 'all' | 'cv' | 'job', stageRevenue: number, totalRevenue: number }
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
    
    // Check for duplicates to avoid spamming history with same calculation
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
    updatedHistory = updatedHistory.slice(0, 50); // Keep last 50 items
    
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

  const executeConversion = async (currentAmount: number, source: Currency, target: Currency, type: 'convert' | 'calculate' | 'revenue', originalSalary?: number) => {
    setLoadingState(LoadingState.LOADING);
    setErrorMsg('');
    
    try {
      const data = await convertCurrencyApi(currentAmount, source.code, target.code);
      setResult(data);
      setLoadingState(LoadingState.SUCCESS);
      addToHistory(currentAmount, source, target, data.convertedAmount, type, originalSalary);
    } catch (err) {
      setErrorMsg("Có lỗi xảy ra khi lấy tỷ giá. Vui lòng thử lại.");
      setLoadingState(LoadingState.ERROR);
      setResult(null); 
    }
  };

  const handleConvert = useCallback((amountOverride?: string, type: 'convert' | 'calculate' | 'revenue' = 'convert', originalSalary?: number) => {
    const valueToCheck = amountOverride !== undefined ? amountOverride : amount;
    const numAmount = parseFloat(valueToCheck);

    if (isNaN(numAmount) || numAmount <= 0) {
      setErrorMsg("Vui lòng nhập số tiền hợp lệ");
      return;
    }
    executeConversion(numAmount, fromCurrency, toCurrency, type, originalSalary);
  }, [amount, fromCurrency, toCurrency]);

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
    history, clearHistory, deleteHistoryItems, selectHistoryItem, resetResult, addToHistory
  };
};
