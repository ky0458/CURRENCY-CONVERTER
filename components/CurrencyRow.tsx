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
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);
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

  // --- FORMATTING LOGIC START ---
  
  // 1. Get separators based on locale (e.g. vi-VN uses '.' for group, ',' for decimal)
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

  // 2. Format the display value (Raw "1000.5" -> Display "1.000,5" for VND)
  const displayValue = useMemo(() => {
    if (amount === '' || amount === undefined || amount === null) return '';
    if (isNaN(Number(amount)) && !amount.toString().endsWith('.')) return amount.toString(); // Fallback
    
    const strAmount = amount.toString();
    const parts = strAmount.split('.');
    const integerPart = parts[0];
    const decimalPart = parts.length > 1 ? parts[1] : null;

    // Add group separators to integer part
    // Escape special regex chars like '.' if used as separator
    const escapedGroupSep = groupSeparator === '.' ? '\\.' : groupSeparator;
    const integerFormatted = integerPart.replace(/\B(?=(\d{3})+(?!\d))/g, groupSeparator);

    if (decimalPart !== null) {
      return `${integerFormatted}${decimalSeparator}${decimalPart}`;
    }
    return integerFormatted;
  }, [amount, groupSeparator, decimalSeparator]);

  // 3. Handle User Input (Display "1.000,5" -> Raw "1000.5")
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!onAmountChange) return;

    let value = e.target.value;

    // Allow clearing
    if (value === '') {
      onAmountChange('');
      return;
    }

    // Escape separators for regex
    const escapedGroupSep = groupSeparator.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const escapedDecimalSep = decimalSeparator.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

    // Remove all group separators
    const rawNoGroups = value.replace(new RegExp(escapedGroupSep, 'g'), '');
    
    // Replace localized decimal separator with standard dot
    const normalized = rawNoGroups.replace(new RegExp(escapedDecimalSep), '.');

    // Validate: only numbers and one dot allowed
    if (/^\d*\.?\d*$/.test(normalized)) {
      onAmountChange(normalized);
    }
  };

  return (
    <div className="flex flex-col gap-1.5" ref={containerRef}>
      <label className="text-xs font-bold text-slate-500 uppercase tracking-wide ml-1">{label}</label>
      
      {/* Unified Container */}
      <div 
        className={`relative flex items-center bg-slate-50 border rounded-2xl transition-all duration-300
          ${isActive ? 'border-blue-500 ring-2 ring-blue-100 bg-white z-50' : 'border-slate-200 hover:border-blue-300'}
          ${readOnly ? 'bg-slate-50/80' : 'bg-white'}
        `}
      >
        
        {/* Input Area (Left) */}
        <div className="flex-1 p-2">
           <input
            type="text" // Changed from number to text for formatting
            inputMode="decimal"
            value={displayValue}
            onChange={handleInputChange}
            readOnly={readOnly}
            className={`w-full h-12 px-2 bg-transparent border-none outline-none text-3xl font-bold placeholder-slate-300
              ${readOnly ? 'text-slate-600 cursor-default' : 'text-slate-800'}
            `}
            placeholder="0"
            autoComplete="off"
          />
        </div>

        {/* Divider */}
        <div className="w-px h-10 bg-slate-200 mx-1"></div>

        {/* Currency Selector Trigger (Right) */}
        <button
          onClick={onToggleDropdown}
          className="flex items-center gap-2 px-4 py-4 m-1 rounded-xl hover:bg-slate-100 transition-colors group outline-none focus:bg-slate-100"
        >
          <img 
            src={currency.flag} 
            alt={currency.code} 
            className="w-7 h-5 object-cover rounded shadow-sm border border-slate-100 group-hover:scale-110 transition-transform"
          />
          <span className="text-xl font-bold text-slate-700">{currency.code}</span>
          <svg 
            xmlns="http://www.w3.org/2000/svg" 
            fill="none" 
            viewBox="0 0 24 24" 
            strokeWidth={3} 
            stroke="currentColor" 
            className={`w-4 h-4 text-slate-400 transition-transform duration-300 ${isActive ? 'rotate-180 text-blue-500' : ''}`}
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5" />
          </svg>
        </button>

        {/* Dropdown Menu */}
        <div 
          className={`absolute right-0 top-[calc(100%+8px)] w-full sm:w-80 bg-white rounded-2xl shadow-2xl border border-slate-100 overflow-hidden transition-all duration-200 flex flex-col z-[100]
            ${isActive ? 'opacity-100 scale-100 translate-y-0 visible' : 'opacity-0 scale-95 -translate-y-2 invisible pointer-events-none'}
          `}
        >
            {/* Sticky Search Header */}
            <div className="p-3 bg-white border-b border-slate-100">
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                </div>
                <input
                  ref={searchInputRef}
                  type="text"
                  className="block w-full pl-10 pr-3 py-2.5 border border-slate-200 rounded-xl bg-slate-50 text-slate-700 placeholder-slate-400 focus:outline-none focus:bg-white focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 sm:text-sm transition-all"
                  placeholder="Tìm kiếm tiền tệ..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
            </div>

            {/* Scrollable List */}
            <div className="max-h-64 overflow-y-auto custom-scrollbar p-1.5 space-y-1">
              {filteredCurrencies.length > 0 ? (
                filteredCurrencies.map((c) => (
                  <div
                    key={c.code}
                    onClick={() => { 
                        onCurrencyChange(c); 
                        if (onCloseDropdown) onCloseDropdown(); 
                    }}
                    className={`flex items-center gap-3 px-3 py-3 rounded-xl cursor-pointer transition-all duration-200
                      ${c.code === currency.code ? 'bg-blue-50 border border-blue-100' : 'hover:bg-slate-50 border border-transparent'}
                    `}
                  >
                      <img 
                        src={c.flag} 
                        alt={c.code} 
                        className="w-8 h-6 object-cover rounded shadow-sm border border-slate-100"
                      />
                      <div className="flex flex-col flex-1 min-w-0">
                        <div className="flex justify-between items-center">
                            <span className={`font-bold text-base ${c.code === currency.code ? 'text-blue-700' : 'text-slate-700'}`}>{c.code}</span>
                            {c.code === currency.code && (
                              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-5 h-5 text-blue-600">
                                <path fillRule="evenodd" d="M16.704 4.153a.75.75 0 01.143 1.052l-8 10.5a.75.75 0 01-1.127.075l-4.5-4.5a.75.75 0 011.06-1.06l3.894 3.893 7.48-9.817a.75.75 0 011.05-.143z" clipRule="evenodd" />
                              </svg>
                            )}
                        </div>
                        <span className="text-xs font-medium text-slate-500 truncate">{c.name}</span>
                      </div>
                  </div>
                ))
              ) : (
                <div className="py-8 text-center">
                  <p className="text-slate-400 text-sm">Không tìm thấy "{searchQuery}"</p>
                </div>
              )}
            </div>
        </div>
      </div>
    </div>
  );
};