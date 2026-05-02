import React, { useRef, useEffect, useState, useMemo, ReactNode } from 'react';
import { POPULAR_CURRENCIES as CURRENCY_LIST } from '../constants';
import { Currency, ThemeColor } from '../types';

interface CurrencyRowProps {
  label: string;
  amount: number | string;
  currency: Currency;
  onAmountChange?: (value: string) => void;
  onCurrencyChange: (currency: Currency) => void;
  readOnly?: boolean;
  isActive?: boolean;
  onToggleDropdown?: () => void;
  onCloseDropdown?: () => void;
  inputPlacement?: 'left' | 'right' | 'hidden';
  autoFocus?: boolean;
  theme: ThemeColor;
  headerAction?: ReactNode;
  error?: string; // Prop for error message
  onEnter?: () => void; // New prop for handling Enter key
  hasBackgroundImage?: boolean;
}

export const CurrencyRow: React.FC<CurrencyRowProps> = ({
  label, amount, currency, onAmountChange, onCurrencyChange,
  readOnly = false, isActive = false, onToggleDropdown, onCloseDropdown,
  inputPlacement = 'left', autoFocus = false, headerAction, error, onEnter, hasBackgroundImage
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const amountInputRef = useRef<HTMLInputElement>(null);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    if (autoFocus && amountInputRef.current) {
      amountInputRef.current.focus();
    }
  }, [autoFocus]);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        if (isActive && onCloseDropdown) onCloseDropdown();
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [isActive, onCloseDropdown]);

  useEffect(() => {
    if (isActive) {
      const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) || window.innerWidth < 768;
      
      if (!isMobile) {
        setTimeout(() => searchInputRef.current?.focus(), 50);
      }
    } else {
      setSearchQuery('');
    }
  }, [isActive]);

  const displayCurrencies = useMemo(() => {
    let list = [...CURRENCY_LIST];
    const currentIndex = list.findIndex(c => c.code === currency.code);
    if (currentIndex > -1) {
      const [selected] = list.splice(currentIndex, 1);
      list.unshift(selected);
    }
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      return list.filter((c) => 
        c.code.toLowerCase().includes(query) || 
        c.name.toLowerCase().includes(query)
      );
    }
    return list;
  }, [currency.code, searchQuery]);

  const { groupSeparator, decimalSeparator } = useMemo(() => {
    try {
      const parts = new Intl.NumberFormat(currency.locale).formatToParts(1000.1);
      return {
        groupSeparator: parts.find(p => p.type === 'group')?.value || ',',
        decimalSeparator: parts.find(p => p.type === 'decimal')?.value || '.'
      };
    } catch (e) { return { groupSeparator: ',', decimalSeparator: '.' }; }
  }, [currency.locale]);

  const displayValue = useMemo(() => {
    if (amount === '' || amount === undefined || amount === null) return '';
    const parts = amount.toString().split('.');
    const integerFormatted = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, groupSeparator);
    return parts.length > 1 ? `${integerFormatted}${decimalSeparator}${parts[1]}` : integerFormatted;
  }, [amount, groupSeparator, decimalSeparator]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!onAmountChange) return;
    let value = e.target.value;
    if (value === '') { onAmountChange(''); return; }
    if (decimalSeparator === ',' && value.endsWith('.')) value = value.slice(0, -1) + ',';
    const groupSepRegex = new RegExp(groupSeparator.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g');
    let cleanValue = value.replace(groupSepRegex, '').replace(new RegExp(decimalSeparator.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g'), '.').replace(/[^0-9.]/g, '');
    const parts = cleanValue.split('.');
    if (parts.length > 2) cleanValue = parts[0] + '.' + parts.slice(1).join('');
    onAmountChange(cleanValue);
  };

  const renderSelectorButton = () => (
    <button
      onClick={(e) => { e.stopPropagation(); if (onToggleDropdown) onToggleDropdown(); }}
      className={`flex items-center gap-2 px-2 py-3 sm:px-3 sm:py-4 hover:bg-white/40 transition-colors group outline-none shrink-0
        ${inputPlacement === 'hidden' ? 'w-full justify-between rounded-2xl' : ''}
        ${inputPlacement === 'left' ? 'rounded-r-2xl border-l border-slate-100/50' : ''}
        ${inputPlacement === 'right' ? 'rounded-l-2xl border-r border-slate-100/50' : ''}
      `}
    >
      <div className="flex items-center gap-2">
        <img src={currency.flag} alt={currency.code} className="w-6 h-4 sm:w-7 sm:h-5 object-cover rounded shadow-sm border border-slate-100" />
        <span className="text-base sm:text-lg font-bold text-slate-700 leading-none">{currency.code}</span>
      </div>
      <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={3} stroke="currentColor" className={`w-3 h-3 sm:w-3.5 sm:h-3.5 text-slate-400 transition-transform ${isActive ? `rotate-180 text-primary-500` : ''}`}><path strokeLinecap="round" strokeLinejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5" /></svg>
    </button>
  );

  const renderInput = () => (
    <div className="flex-1 p-2 w-full h-full relative flex items-center">
      <input
        ref={amountInputRef}
        type="text"
        inputMode="decimal"
        value={displayValue}
        onChange={handleInputChange}
        onFocus={(e) => e.target.select()}
        onKeyDown={(e) => {
            if (e.key === 'Enter' && onEnter) {
                e.currentTarget.blur(); // Blur to hide keyboard on mobile
                onEnter();
            }
        }}
        readOnly={readOnly}
        className={`w-full h-full px-2 bg-transparent border-none outline-none transition-colors truncate
            ${error ? 'text-xs sm:text-sm pr-10 text-red-500 font-normal placeholder-red-400' : 'text-xl sm:text-2xl font-bold text-slate-800 placeholder-slate-300'}`}
        placeholder={error || "0"}
        autoComplete="off"
      />
      
      {/* Warning Icon Inside Input */}
      {error && (
        <div className="absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none text-red-500 animate-pulse">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-6 h-6">
                <path fillRule="evenodd" d="M2.25 12c0-5.385 4.365-9.75 9.75-9.75s9.75 4.365 9.75 9.75-4.365 9.75-9.75 9.75S2.25 17.385 2.25 12ZM12 8.25a.75.75 0 0 1 .75.75v3.75a.75.75 0 0 1-1.5 0V9a.75.75 0 0 1 .75-.75Zm0 8.25a.75.75 0 1 0 0-1.5.75.75 0 0 0 0 1.5Z" clipRule="evenodd" />
            </svg>
        </div>
      )}
    </div>
  );

  return (
    <div className="flex flex-col gap-0 w-full" ref={containerRef}>
      {/* Fixed height (h-8 = 32px) ensures alignment regardless of button presence */}
      <div className="flex items-center justify-between ml-1 h-8">
        <label className={`text-[10px] sm:text-xs font-bold uppercase tracking-wide transition-colors ${error ? 'text-red-500' : 'text-slate-500'}`}>
            {label}
        </label>
        {headerAction && <div>{headerAction}</div>}
      </div>
      
      <div onClick={() => !readOnly && !isActive && amountInputRef.current?.focus()}
        className={`
            relative flex items-center border rounded-2xl transition-all h-[60px] sm:h-[66px] cursor-text bg-white/70 backdrop-blur-sm
            ${isActive 
                ? `border-primary-500 ring-2 ring-primary-100 z-50 bg-white` 
                : error 
                    ? 'border-red-500 ring-4 ring-red-50 bg-red-50/10 z-20' 
                    : 'border-slate-200 hover:border-primary-300 hover:bg-white'}
        `}>
        
        {inputPlacement === 'left' && <>{renderInput()}{renderSelectorButton()}</>}
        {inputPlacement === 'right' && <>{renderSelectorButton()}{renderInput()}</>}
        {inputPlacement === 'hidden' && renderSelectorButton()}

        <div className={`absolute top-[calc(100%+8px)] w-full sm:w-72 bg-white rounded-2xl shadow-xl border border-slate-100 overflow-hidden transition-all z-[100] 
            ${inputPlacement === 'right' ? 'left-0 origin-top-left' : 'right-0 origin-top-right'}
            ${isActive ? 'opacity-100 scale-100 visible' : 'opacity-0 scale-95 invisible'}`}>
            <div className="p-3 border-b border-slate-100"><input ref={searchInputRef} type="search" inputMode="search" role="searchbox" autoComplete="off" spellCheck="false" autoCorrect="off" autoCapitalize="none" name="search_currency_q" data-1p-ignore="true" data-lpignore="true" data-form-type="other" className={`w-full px-3 py-2 border rounded-lg bg-slate-50 text-sm outline-none focus:border-primary-500`} placeholder="Tìm kiếm..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} onClick={(e) => e.stopPropagation()} /></div>
            <div className="max-h-64 overflow-y-auto p-1 custom-scrollbar">
              {displayCurrencies.map((c) => (
                <div key={c.code} onClick={(e) => { e.stopPropagation(); onCurrencyChange(c); onCloseDropdown?.(); }} className={`flex items-center gap-3 px-3 py-2.5 rounded-lg cursor-pointer ${c.code === currency.code ? `bg-primary-50 text-primary-700` : 'hover:bg-slate-50'}`}>
                  <img src={c.flag} className="w-6 h-4 object-cover rounded" /><div className="flex flex-col"><span className="text-sm font-bold">{c.code}</span><span className="text-xs opacity-70 truncate max-w-[150px]">{c.name}</span></div>
                  {c.code === currency.code && <div className="ml-auto"><svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={3} stroke="currentColor" className="w-4 h-4"><path strokeLinecap="round" strokeLinejoin="round" d="m4.5 12.75 6 6 9-13.5" /></svg></div>}
                </div>
              ))}
              {displayCurrencies.length === 0 && <div className="p-4 text-center text-sm text-slate-400 italic">Không tìm thấy kết quả</div>}
            </div>
        </div>
      </div>

    </div>
  );
};