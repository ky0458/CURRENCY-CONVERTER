import { useState, useCallback, useEffect } from 'react';
import { Currency, ConversionResult, LoadingState, ConversionHistoryItem } from '../types';
import { DEFAULT_SOURCE_CURRENCY, DEFAULT_TARGET_CURRENCY } from '../constants';
import { convertCurrencyApi } from '../services/geminiService';

export const useCurrencyConverter = () => {
  const [amount, setAmount] = useState<string>('100000');
  const [fromCurrency, setFromCurrency] = useState<Currency>(DEFAULT_SOURCE_CURRENCY);
  const [toCurrency, setToCurrency] = useState<Currency>(DEFAULT_TARGET_CURRENCY);
  const [loadingState, setLoadingState] = useState<LoadingState>(LoadingState.IDLE);
  const [result, setResult] = useState<ConversionResult | null>(null);
  const [errorMsg, setErrorMsg] = useState<string>('');
  const [isSwapping, setIsSwapping] = useState(false);
  const [history, setHistory] = useState<ConversionHistoryItem[]>([]);

  // Load history from local storage on mount
  useEffect(() => {
    try {
      const savedHistory = localStorage.getItem('conversion_history');
      if (savedHistory) {
        const parsed = JSON.parse(savedHistory);
        // Migration support for old data without 'type'
        const migrated = parsed.map((item: any) => ({
            ...item,
            type: item.type || 'convert'
        }));
        setHistory(migrated);
      }
    } catch (e) {
      console.error("Failed to load history", e);
    }
  }, []);

  const saveHistory = (newHistory: ConversionHistoryItem[]) => {
    setHistory(newHistory);
    localStorage.setItem('conversion_history', JSON.stringify(newHistory));
  };

  const addToHistory = (currentAmount: number, source: Currency, target: Currency, converted: number, type: 'convert' | 'calculate', originalSalary?: number) => {
    const newItem: ConversionHistoryItem = {
      id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
      timestamp: Date.now(),
      inputAmount: currentAmount,
      fromCurrency: source,
      toCurrency: target,
      convertedAmount: converted,
      type: type,
      originalSalary: originalSalary
    };
    
    // Check if an identical conversion exists (Same Input, Source, Target, Type AND Original Salary)
    const existingIndex = history.findIndex(item => 
        item.inputAmount === newItem.inputAmount && 
        item.fromCurrency.code === newItem.fromCurrency.code && 
        item.toCurrency.code === newItem.toCurrency.code &&
        item.type === newItem.type &&
        item.originalSalary === newItem.originalSalary
    );

    let updatedHistory = [...history];

    if (existingIndex > -1) {
        // Remove the existing item so the new one can go to the top
        updatedHistory.splice(existingIndex, 1);
    }

    // Add new item to the beginning
    updatedHistory.unshift(newItem);
    
    // Limit to 50 items total (can be filtered later)
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
    // Note: We don't auto-execute here because the App component might need to switch tabs first. 
    // The App component handles the logic of calling executeConversion if needed.
  };

  const resetResult = useCallback(() => {
    setResult(null);
    setErrorMsg('');
    setLoadingState(LoadingState.IDLE);
  }, []);

  const executeConversion = async (currentAmount: number, source: Currency, target: Currency, type: 'convert' | 'calculate', originalSalary?: number) => {
    setLoadingState(LoadingState.LOADING);
    setErrorMsg('');
    
    try {
      const data = await convertCurrencyApi(currentAmount, source.code, target.code);
      setResult(data);
      setLoadingState(LoadingState.SUCCESS);
      
      // Add to history on success
      addToHistory(currentAmount, source, target, data.convertedAmount, type, originalSalary);
    } catch (err) {
      setErrorMsg("Có lỗi xảy ra khi lấy tỷ giá. Vui lòng thử lại.");
      setLoadingState(LoadingState.ERROR);
      setResult(null); 
    }
  };

  const handleConvert = useCallback((amountOverride?: string, type: 'convert' | 'calculate' = 'convert', originalSalary?: number) => {
    const valueToCheck = amountOverride !== undefined ? amountOverride : amount;
    const numAmount = parseFloat(valueToCheck);

    if (isNaN(numAmount) || numAmount <= 0) {
      setErrorMsg("Vui lòng nhập số tiền hợp lệ");
      return;
    }
    executeConversion(numAmount, fromCurrency, toCurrency, type, originalSalary);
  }, [amount, fromCurrency, toCurrency]);

  const handleSwap = (currentType: 'convert' | 'calculate' = 'convert') => {
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
    loadingState, result, errorMsg, isSwapping, handleConvert, handleSwap,
    history, clearHistory, deleteHistoryItems, selectHistoryItem, resetResult
  };
};