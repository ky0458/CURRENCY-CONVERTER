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
        setHistory(JSON.parse(savedHistory));
      }
    } catch (e) {
      console.error("Failed to load history", e);
    }
  }, []);

  const saveHistory = (newHistory: ConversionHistoryItem[]) => {
    setHistory(newHistory);
    localStorage.setItem('conversion_history', JSON.stringify(newHistory));
  };

  const addToHistory = (currentAmount: number, source: Currency, target: Currency, converted: number) => {
    const newItem: ConversionHistoryItem = {
      id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
      timestamp: Date.now(),
      inputAmount: currentAmount,
      fromCurrency: source,
      toCurrency: target,
      convertedAmount: converted
    };
    
    // Avoid duplicates: if the latest item is identical, don't add
    if (history.length > 0) {
        const latest = history[0];
        if (latest.inputAmount === newItem.inputAmount && 
            latest.fromCurrency.code === newItem.fromCurrency.code && 
            latest.toCurrency.code === newItem.toCurrency.code) {
            return;
        }
    }

    const updatedHistory = [newItem, ...history].slice(0, 20); // Limit to 20 items
    saveHistory(updatedHistory);
  };

  const clearHistory = () => {
    saveHistory([]);
  };

  const selectHistoryItem = (item: ConversionHistoryItem) => {
    setAmount(item.inputAmount.toString());
    setFromCurrency(item.fromCurrency);
    setToCurrency(item.toCurrency);
    executeConversion(item.inputAmount, item.fromCurrency, item.toCurrency);
  };

  const resetResult = useCallback(() => {
    setResult(null);
    setErrorMsg('');
    setLoadingState(LoadingState.IDLE);
  }, []);

  const executeConversion = async (currentAmount: number, source: Currency, target: Currency) => {
    setLoadingState(LoadingState.LOADING);
    setErrorMsg('');
    
    try {
      const data = await convertCurrencyApi(currentAmount, source.code, target.code);
      setResult(data);
      setLoadingState(LoadingState.SUCCESS);
      
      // Add to history on success
      addToHistory(currentAmount, source, target, data.convertedAmount);
    } catch (err) {
      setErrorMsg("Có lỗi xảy ra khi lấy tỷ giá. Vui lòng thử lại.");
      setLoadingState(LoadingState.ERROR);
      setResult(null); 
    }
  };

  const handleConvert = useCallback((amountOverride?: string) => {
    const valueToCheck = amountOverride !== undefined ? amountOverride : amount;
    const numAmount = parseFloat(valueToCheck);

    if (isNaN(numAmount) || numAmount <= 0) {
      setErrorMsg("Vui lòng nhập số tiền hợp lệ");
      return;
    }
    executeConversion(numAmount, fromCurrency, toCurrency);
  }, [amount, fromCurrency, toCurrency]);

  const handleSwap = () => {
    setIsSwapping(true);
    setTimeout(() => setIsSwapping(false), 500); 
    
    const newFrom = toCurrency;
    const newTo = fromCurrency;
    
    setFromCurrency(newFrom);
    setToCurrency(newTo);
    
    // If we have a result visible, we want to recalculate immediately to show the swapped result
    // But if there is no result (user was typing), we just swap positions without calculating.
    if (result) {
        const numAmount = parseFloat(amount);
        if (!isNaN(numAmount) && numAmount > 0) {
            executeConversion(numAmount, newFrom, newTo);
        } else {
            setResult(null);
        }
    } else {
        // Just swap, do not convert yet as per requirement "only convert when button is pressed"
        // unless a result was already there.
        setResult(null); 
    }
  };

  return {
    amount, setAmount, fromCurrency, setFromCurrency, toCurrency, setToCurrency,
    loadingState, result, errorMsg, isSwapping, handleConvert, handleSwap,
    history, clearHistory, selectHistoryItem, resetResult
  };
};