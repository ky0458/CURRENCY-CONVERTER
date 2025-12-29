import React, { useRef, useEffect, useState, useMemo } from 'react';
import { POPULAR_CURRENCIES as CURRENCY_LIST } from '../constants';
import { Currency } from '../types';

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
  inputPlacement?: 'left' | 'right' | 'hidden'; // Control layout
}

export const CurrencyRow: React.FC<CurrencyRowProps> = ({
  label,
  amount,
  currency,
  onAmountChange,
  onCurrencyChange,
  readOnly = false,
  isActive = false,
  onToggleDropdown,
  onCloseDropdown,
  inputPlacement = 'left',
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const amountInputRef = useRef<HTMLInputElement>(null);
  const [searchQuery, setSearchQuery] = useState('');

  // Handle clicking outside to close dropdown
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        if (isActive && onCloseDropdown) {
          onCloseDropdown();
        }
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isActive, onCloseDropdown]);

  // Focus search input when dropdown opens
  useEffect(() => {
    if (isActive) {
      setTimeout(() => {
        searchInputRef.current?.focus();
      }, 50);
    } else {
      const timeout = setTimeout(() => setSearchQuery(''), 300);
      return () => clearTimeout(timeout);
    }
  }, [isActive]);

  const filteredCurrencies = CURRENCY_LIST.filter((c) => 
    c.code.toLowerCase().includes(searchQuery.toLowerCase()) || 
    c.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // --- FORMATTING LOGIC ---
  const { groupSeparator, decimalSeparator } = useMemo(() => {
    try {
      const parts = new Intl.NumberFormat(currency.locale).formatToParts(1000.1);
      return {
        groupSeparator: parts.find(p => p.type === 'group')?.value || ',',
        decimalSeparator: parts.find(p => p.type === 'decimal')?.value || '.'
      };
    } catch (e) {
      return { groupSeparator: ',', decimalSeparator: '.' };
    }
  }, [currency.locale]);

  const displayValue = useMemo(() => {
    if (amount === '' || amount === undefined || amount === null) return '';
    
    const strAmount = amount.toString();
    const parts = strAmount.split('.');
    const integerPart = parts[0];
    const decimalPart = parts.length > 1 ? parts[1] : null;

    // Apply thousands separator to the integer part
    const integerFormatted = integerPart.replace(/\B(?=(\d{3})+(?!\d))/g, groupSeparator);

    if (decimalPart !== null) {
      return `${integerFormatted}${decimalSeparator}${decimalPart}`;
    }
    return integerFormatted;
  }, [amount, groupSeparator, decimalSeparator]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!onAmountChange) return;
    let value = e.target.value;

    if (value === '') {
      onAmountChange('');
      return;
    }

    // Helper to escape regex special characters
    const escapeRegex = (string: string) => string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

    // UX Improvement: If the locale uses ',' as decimal separator (like Vietnam),
    // but the user types '.', assume they mean the decimal separator.
    if (decimalSeparator === ',' && value.endsWith('.')) {
         value = value.slice(0, -1) + ',';
    }

    // 1. Remove all group separators
    const groupSepRegex = new RegExp(escapeRegex(groupSeparator), 'g');
    let cleanValue = value.replace(groupSepRegex, '');

    // 2. Replace localized decimal separator with standard dot '.'
    const decimalSepRegex = new RegExp(escapeRegex(decimalSeparator), 'g');
    cleanValue = cleanValue.replace(decimalSepRegex, '.');

    // 3. Remove any non-numeric characters (except the single dot)
    cleanValue = cleanValue.replace(/[^0-9.]/g, '');

    // 4. Ensure only one dot exists
    const parts = cleanValue.split('.');
    if (parts.length > 2) {
      cleanValue = parts[0] + '.' + parts.slice(1).join('');
    }

    onAmountChange(cleanValue);
  };

  // --- RENDER HELPERS (JSX Logic moved inside return to avoid re-mounting bugs) ---

  const renderSelectorButton = () => (
    <button
      onClick={(e) => {
        e.stopPropagation(); // Prevent focusing input when clicking button
        if (onToggleDropdown) onToggleDropdown();
      }}
      className={`flex items-center gap-2 px-2 py-3 sm:px-3 sm:py-4 hover:bg-slate-50 transition-colors group outline-none shrink-0
        ${inputPlacement === 'hidden' ? 'w-full justify-between rounded-2xl' : ''}
        ${inputPlacement === 'left' ? 'rounded-r-2xl border-l border-slate-100' : ''}
        ${inputPlacement === 'right' ? 'rounded-l-2xl border-r border-slate-100' : ''}
      `}
    >
      <div className="flex items-center gap-2">
        <img 
          src={currency.flag} 
          alt={currency.code} 
          className="w-6 h-4 sm:w-7 sm:h-5 object-cover rounded shadow-sm border border-slate-100 group-hover:scale-110 transition-transform"
        />
        <div className="flex flex-col items-start">
            <span className="text-base sm:text-lg font-bold text-slate-700 leading-none">{currency.code}</span>
        </div>
      </div>
      
      <svg 
        xmlns="http://www.w3.org/2000/svg" 
        fill="none" 
        viewBox="0 0 24 24" 
        strokeWidth={3} 
        stroke="currentColor" 
        className={`w-3 h-3 sm:w-3.5 sm:h-3.5 text-slate-400 transition-transform duration-300 ${isActive ? 'rotate-180 text-blue-500' : ''}`}
      >
        <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5" />
      </svg>
    </button>
  );

  const renderInput = () => (
    <div className="flex-1 p-2 w-full h-full">
      <input
        ref={amountInputRef}
        type="text"
        inputMode="decimal"
        value={displayValue}
        onChange={handleInputChange}
        readOnly={readOnly}
        className={`w-full h-full px-2 bg-transparent border-none outline-none text-xl sm:text-2xl font-bold placeholder-slate-300 text-slate-800
           ${readOnly ? 'cursor-default' : ''}
           text-left
        `}
        placeholder="0"
        autoComplete="off"
      />
    </div>
  );

  return (
    <div className="flex flex-col gap-1.5 w-full" ref={containerRef}>
      <label className="text-[10px] sm:text-xs font-bold text-slate-500 uppercase tracking-wide ml-1">{label}</label>
      
      {/* Container - Click to focus input */}
      <div 
        onClick={() => {
            if (!readOnly && !isActive) {
                amountInputRef.current?.focus();
            }
        }}
        className={`relative flex items-center bg-white border rounded-2xl transition-all duration-300 h-[60px] sm:h-[66px] cursor-text
          ${isActive 
            ? 'border-blue-500 ring-2 ring-blue-100 z-50' 
            : 'border-slate-200 hover:border-blue-300'}
          ${readOnly ? 'opacity-90 cursor-default' : ''}
        `}
      >
        {/* Render Order based on Placement */}
        {inputPlacement === 'left' && <>{renderInput()}{renderSelectorButton()}</>}
        {inputPlacement === 'right' && <>{renderSelectorButton()}{renderInput()}</>}
        {inputPlacement === 'hidden' && renderSelectorButton()}

        {/* Dropdown Menu */}
        <div 
          className={`absolute top-[calc(100%+8px)] w-full sm:w-72 bg-white rounded-2xl shadow-xl border border-slate-100 overflow-hidden transition-all duration-200 flex flex-col z-[100]
            ${isActive ? 'opacity-100 scale-100 translate-y-0 visible' : 'opacity-0 scale-95 -translate-y-2 invisible pointer-events-none'}
            ${inputPlacement === 'right' ? 'left-0' : 'right-0'}
          `}
        >
            {/* Search */}
            <div className="p-3 bg-white border-b border-slate-100">
              <input
                ref={searchInputRef}
                type="text"
                className="block w-full px-3 py-2 border border-slate-200 rounded-lg bg-slate-50 text-slate-700 placeholder-slate-400 focus:outline-none focus:bg-white focus:border-blue-500 text-sm"
                placeholder="Tìm kiếm..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onClick={(e) => e.stopPropagation()} 
              />
            </div>

            {/* List */}
            <div className="max-h-64 overflow-y-auto custom-scrollbar p-1">
              {filteredCurrencies.length > 0 ? (
                filteredCurrencies.map((c) => (
                  <div
                    key={c.code}
                    onClick={(e) => { 
                        e.stopPropagation();
                        onCurrencyChange(c); 
                        if (onCloseDropdown) onCloseDropdown(); 
                    }}
                    className={`flex items-center gap-3 px-3 py-2.5 rounded-lg cursor-pointer transition-colors
                      ${c.code === currency.code ? 'bg-blue-50 text-blue-700' : 'hover:bg-slate-50 text-slate-700'}
                    `}
                  >
                      <img src={c.flag} alt={c.code} className="w-6 h-4 object-cover rounded shadow-sm" />
                      <div className="flex flex-col">
                        <span className="text-sm font-bold">{c.code}</span>
                        <span className="text-xs opacity-70 truncate max-w-[150px]">{c.name}</span>
                      </div>
                  </div>
                ))
              ) : (
                <div className="py-4 text-center text-slate-400 text-xs">Không tìm thấy</div>
              )}
            </div>
        </div>
      </div>
    </div>
  );
};