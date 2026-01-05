import React, { useState } from 'react';
import { ConversionHistoryItem } from '../types';

interface HistorySectionProps {
  history: ConversionHistoryItem[];
  onSelect: (item: ConversionHistoryItem) => void;
  onClear: () => void;
  onDeleteItems: (ids: string[]) => void;
  formatCurrency: (val: number, locale: string, currencyCode: string) => string;
  onClose?: () => void;
}

export const HistorySection: React.FC<HistorySectionProps> = ({ history, onSelect, onClear, onDeleteItems, formatCurrency, onClose }) => {
  const [isSelectionMode, setIsSelectionMode] = useState(false);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [confirmDelete, setConfirmDelete] = useState<{ isOpen: boolean, idsToDelete: string[], isAll: boolean }>({ 
    isOpen: false, idsToDelete: [], isAll: false 
  });

  const toggleSelectionMode = () => {
    setIsSelectionMode(!isSelectionMode);
    setSelectedIds(new Set());
  };

  const handleCheckboxChange = (id: string) => {
    const newSelected = new Set(selectedIds);
    if (newSelected.has(id)) {
      newSelected.delete(id);
    } else {
      newSelected.add(id);
    }
    setSelectedIds(newSelected);
  };

  const handleDeleteSelected = () => {
    if (selectedIds.size === 0) return;
    setConfirmDelete({
        isOpen: true,
        idsToDelete: Array.from(selectedIds),
        isAll: false
    });
  };

  const handleDeleteSingle = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setConfirmDelete({
        isOpen: true,
        idsToDelete: [id],
        isAll: false
    });
  };

  const handleClearAll = () => {
    setConfirmDelete({
        isOpen: true,
        idsToDelete: [],
        isAll: true
    });
  };

  const performDelete = () => {
    if (confirmDelete.isAll) {
        // Only clear visible items (filtered by filteredHistory from parent)
        const ids = history.map(h => h.id);
        onDeleteItems(ids);
        setIsSelectionMode(false);
    } else {
        onDeleteItems(confirmDelete.idsToDelete);
        const newSelected = new Set(selectedIds);
        confirmDelete.idsToDelete.forEach(id => newSelected.delete(id));
        setSelectedIds(newSelected);
        
        if (isSelectionMode && newSelected.size === 0 && history.length === confirmDelete.idsToDelete.length) {
             setIsSelectionMode(false);
        }
    }
    setConfirmDelete({ isOpen: false, idsToDelete: [], isAll: false });
  };

  const formatDate = (timestamp: number) => {
      return new Date(timestamp).toLocaleString('vi-VN', { hour: '2-digit', minute: '2-digit', day: '2-digit', month: '2-digit' });
  };

  return (
    <div className="w-full flex flex-col h-full relative bg-slate-50">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-slate-200 bg-white sticky top-0 z-20 shadow-sm">
        {isSelectionMode ? (
            <div className="flex items-center gap-3">
                <button onClick={toggleSelectionMode} className="text-slate-600 font-bold hover:text-slate-900 bg-slate-100 px-3 py-1 rounded-lg">Hủy</button>
                <span className="text-sm font-medium text-slate-500">Đã chọn <span className="text-slate-900 font-bold">{selectedIds.size}</span></span>
            </div>
        ) : (
             <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2">
                Lịch sử
                <span className="text-xs font-normal text-slate-400 bg-slate-100 px-2 py-0.5 rounded-full">{history.length}</span>
            </h3>
        )}

        <div className="flex items-center gap-2">
            {!isSelectionMode && history.length > 0 && (
                <button 
                    onClick={toggleSelectionMode}
                    className="text-primary-600 bg-primary-50 hover:bg-primary-100 p-2 sm:px-3 sm:py-2 rounded-lg transition-colors border border-primary-100 flex items-center gap-1.5"
                    title="Chọn nhiều"
                >
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75 11.25 15 15 9.75M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
                    </svg>
                    <span className="hidden sm:inline text-xs font-bold">Chọn nhiều</span>
                </button>
            )}
            {!isSelectionMode && history.length > 0 && (
                <button 
                onClick={handleClearAll} 
                className="text-xs text-red-500 hover:text-red-600 font-bold hover:bg-red-50 px-3 py-2 rounded-lg transition-colors border border-transparent hover:border-red-100"
                title="Xóa tất cả"
                >
                    Xóa hết
                </button>
            )}
            
            <button onClick={onClose} className="p-2 rounded-full hover:bg-slate-100 text-slate-400 hover:text-slate-600 transition-colors ml-1">
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" />
                </svg>
            </button>
        </div>
      </div>
      
      {/* List */}
      {history.length === 0 ? (
          <div className="flex-1 flex flex-col items-center justify-center py-20 text-slate-400 gap-4">
              <div className="w-20 h-20 bg-slate-100 rounded-full flex items-center justify-center">
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1} stroke="currentColor" className="w-10 h-10 text-slate-300">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
                </svg>
              </div>
              <span className="text-base font-medium text-slate-500">Chưa có lịch sử nào.</span>
          </div>
      ) : (
        <div className="flex-1 overflow-y-auto custom-scrollbar p-3 pb-24 sm:p-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {history.map(item => {
                    const isCalculate = item.type === 'calculate';
                    // If calculation type and originalSalary exists, show it. Otherwise show inputAmount (fee or convert amount)
                    const displayAmount = (isCalculate && item.originalSalary) ? item.originalSalary : item.inputAmount;
                    const displayLabel = isCalculate ? "Mức lương" : "Số tiền gốc";

                    return (
                        <div key={item.id} 
                            onClick={() => {
                                if (isSelectionMode) {
                                    handleCheckboxChange(item.id);
                                } else {
                                    onSelect(item); 
                                }
                            }} 
                            className={`
                                relative overflow-hidden rounded-xl border transition-all cursor-pointer group flex items-stretch
                                ${isSelectionMode && selectedIds.has(item.id) 
                                    ? 'bg-primary-50 border-primary-500 ring-1 ring-primary-500' 
                                    : 'bg-white border-slate-200 hover:border-primary-300 hover:shadow-md'}
                            `}
                        >
                            {isSelectionMode && (
                                <div className="w-12 flex items-center justify-center border-r border-slate-100/50 bg-slate-50/50">
                                    <div className={`w-5 h-5 rounded border flex items-center justify-center transition-colors ${selectedIds.has(item.id) ? 'bg-primary-600 border-primary-600' : 'border-slate-300 bg-white'}`}>
                                        {selectedIds.has(item.id) && (
                                            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-3.5 h-3.5 text-white">
                                                <path fillRule="evenodd" d="M16.704 4.153a.75.75 0 0 1 .143 1.052l-8 10.5a.75.75 0 0 1-1.127.075l-4.5-4.5a.75.75 0 0 1 1.06-1.06l3.894 3.893 7.48-9.817a.75.75 0 0 1 1.05-.143Z" clipRule="evenodd" />
                                            </svg>
                                        )}
                                    </div>
                                </div>
                            )}

                            <div className="flex-1 p-3 sm:p-4 flex flex-col gap-3">
                                {/* Top Row: Type Badge and Date */}
                                <div className="flex items-center justify-between">
                                    <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-md ${isCalculate ? 'bg-purple-100 text-purple-600' : 'bg-blue-100 text-blue-600'}`}>
                                        {isCalculate ? 'Tính phí' : 'Chuyển đổi'}
                                    </span>
                                    <span className="text-xs text-slate-400 font-medium">{formatDate(item.timestamp)}</span>
                                </div>

                                {/* Middle Row: Hero Input Amount (EMPHASIZED) */}
                                <div className="flex flex-col">
                                    <span className="text-[10px] uppercase font-bold text-slate-400 mb-0.5">{displayLabel}</span>
                                    <div className="flex items-center gap-2">
                                        <img src={item.fromCurrency.flag} className="w-6 h-4 rounded shadow-sm object-cover" alt="" />
                                        <span className="text-xl sm:text-2xl font-extrabold text-slate-800 tracking-tight leading-none">
                                            {formatCurrency(displayAmount, item.fromCurrency.locale, item.fromCurrency.code)}
                                        </span>
                                    </div>
                                    {/* For Calculation, show the calculated fee below the salary */}
                                    {isCalculate && (
                                        <div className="flex items-center gap-1 mt-1 text-slate-500">
                                            <span className="text-[10px] uppercase font-bold bg-slate-100 px-1.5 py-0.5 rounded text-slate-500">Phí dịch vụ</span>
                                            <span className="text-xs font-bold">{formatCurrency(item.inputAmount, item.fromCurrency.locale, item.fromCurrency.code)}</span>
                                        </div>
                                    )}
                                </div>
                            </div>

                            {!isSelectionMode && (
                                <button
                                    onClick={(e) => handleDeleteSingle(item.id, e)}
                                    className="w-12 flex items-center justify-center text-slate-300 hover:text-red-500 hover:bg-red-50 transition-all border-l border-slate-100 group-hover:border-slate-200"
                                    title="Xóa"
                                >
                                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
                                        <path strokeLinecap="round" strokeLinejoin="round" d="m14.74 9-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 0 1-2.244 2.077H8.084a2.25 2.25 0 0 1-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 0 0-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 0 1 3.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 0 0-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 0 0-7.5 0" />
                                    </svg>
                                </button>
                            )}
                        </div>
                    );
                })}
            </div>
        </div>
      )}

      {/* Floating Action Button for Selection Mode */}
      {isSelectionMode && (
          <div className="absolute bottom-0 left-0 right-0 p-4 bg-white border-t border-slate-200 shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.05)] z-30">
              <button
                onClick={handleDeleteSelected}
                disabled={selectedIds.size === 0}
                className={`w-full py-3.5 rounded-xl font-bold text-white shadow-lg transition-all flex items-center justify-center gap-2 ${
                    selectedIds.size > 0 
                    ? 'bg-red-500 hover:bg-red-600 active:scale-[0.98]' 
                    : 'bg-slate-300 cursor-not-allowed'
                }`}
              >
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5">
                    <path strokeLinecap="round" strokeLinejoin="round" d="m14.74 9-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 0 1-2.244 2.077H8.084a2.25 2.25 0 0 1-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 0 0-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 0 1 3.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 0 0-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 0 0-7.5 0" />
                  </svg>
                  Xóa {selectedIds.size} mục đã chọn
              </button>
          </div>
      )}

      {/* Confirmation Modal */}
      {confirmDelete.isOpen && (
          <div className="absolute inset-0 z-[60] flex items-center justify-center p-4">
              <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-[2px]" onClick={() => setConfirmDelete({ ...confirmDelete, isOpen: false })}></div>
              <div className="bg-white rounded-2xl shadow-2xl p-6 w-full max-w-sm relative z-10 animate-pulse-soft">
                  <div className="text-center mb-6">
                      <div className="w-14 h-14 bg-red-50 rounded-full flex items-center justify-center mx-auto mb-4 text-red-500 ring-4 ring-red-50">
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-7 h-7">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126ZM12 15.75h.007v.008H12v-.008Z" />
                        </svg>
                      </div>
                      <h4 className="text-xl font-bold text-slate-800 mb-2">Xác nhận xóa</h4>
                      <p className="text-slate-500">
                          {confirmDelete.isAll 
                            ? "Toàn bộ lịch sử sẽ bị xóa vĩnh viễn và không thể khôi phục." 
                            : `Bạn có chắc chắn muốn xóa ${confirmDelete.idsToDelete.length} mục đã chọn không?`}
                      </p>
                  </div>
                  <div className="flex gap-3">
                      <button 
                        onClick={() => setConfirmDelete({ ...confirmDelete, isOpen: false })}
                        className="flex-1 py-3 rounded-xl font-bold text-slate-600 bg-slate-100 hover:bg-slate-200 transition-colors"
                      >
                          Hủy bỏ
                      </button>
                      <button 
                        onClick={performDelete}
                        className="flex-1 py-3 rounded-xl font-bold text-white bg-red-500 hover:bg-red-600 transition-colors shadow-lg shadow-red-200"
                      >
                          Xóa ngay
                      </button>
                  </div>
              </div>
          </div>
      )}
    </div>
  );
};