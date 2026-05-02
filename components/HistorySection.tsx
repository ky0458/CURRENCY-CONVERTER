import React, { useState, useRef, useEffect } from 'react';
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

  // Gesture Selection Refs
  const longPressTimerRef = useRef<number | null>(null);
  const isDragSelectingRef = useRef(false);
  const startPosRef = useRef<{ x: number, y: number } | null>(null);
  const selectionSetRef = useRef<Set<string>>(new Set());

  // Sync ref with state
  useEffect(() => {
      selectionSetRef.current = selectedIds;
  }, [selectedIds]);

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

  // --- GESTURE LOGIC: Long Press & Drag ---
  const handlePointerDown = (e: React.PointerEvent, id: string) => {
      if (confirmDelete.isOpen) return;
      
      // If already in selection mode, let the click handler deal with toggling
      if (isSelectionMode) return;

      startPosRef.current = { x: e.clientX, y: e.clientY };
      
      longPressTimerRef.current = window.setTimeout(() => {
          // Long press triggered!
          setIsSelectionMode(true);
          setSelectedIds(new Set([id]));
          isDragSelectingRef.current = true;
          
          // Haptic feedback if available
          if (navigator.vibrate) navigator.vibrate(50);
      }, 500); // 500ms long press
  };

  useEffect(() => {
    const handleGlobalPointerMove = (e: PointerEvent) => {
        // 1. Check if we should cancel long press due to scrolling
        if (longPressTimerRef.current && startPosRef.current && !isDragSelectingRef.current) {
            const moveX = Math.abs(e.clientX - startPosRef.current.x);
            const moveY = Math.abs(e.clientY - startPosRef.current.y);
            // If moved more than 10px, it's a scroll or random move, cancel long press
            if (moveX > 10 || moveY > 10) {
                clearTimeout(longPressTimerRef.current);
                longPressTimerRef.current = null;
                startPosRef.current = null;
            }
        }

        // 2. Handle Drag Selection (Selecting items while dragging)
        if (isDragSelectingRef.current) {
            e.preventDefault(); // Prevent scrolling while drag-selecting
            
            // Find element under pointer
            const element = document.elementFromPoint(e.clientX, e.clientY);
            const historyItem = element?.closest('[data-history-id]');
            
            if (historyItem) {
                const id = historyItem.getAttribute('data-history-id');
                if (id && !selectionSetRef.current.has(id)) {
                     setSelectedIds(prev => new Set(prev).add(id));
                     if (navigator.vibrate) navigator.vibrate(10);
                }
            }
        }
    };

    const handleGlobalPointerUp = () => {
        if (longPressTimerRef.current) {
            clearTimeout(longPressTimerRef.current);
            longPressTimerRef.current = null;
        }
        startPosRef.current = null;
        isDragSelectingRef.current = false;
    };

    window.addEventListener('pointermove', handleGlobalPointerMove, { passive: false });
    window.addEventListener('pointerup', handleGlobalPointerUp);
    window.addEventListener('pointercancel', handleGlobalPointerUp);

    return () => {
        window.removeEventListener('pointermove', handleGlobalPointerMove);
        window.removeEventListener('pointerup', handleGlobalPointerUp);
        window.removeEventListener('pointercancel', handleGlobalPointerUp);
    };
  }, []);
  // ------------------------------------------

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

  const getShareLabel = (shareType?: 'all' | 'cv' | 'job') => {
      if (shareType === 'cv') return 'Có CV (70%)';
      if (shareType === 'job') return 'Nắm Job (30%)';
      return 'Tất cả (100%)';
  };

  return (
    <div className="w-full flex flex-col h-full max-h-full relative bg-slate-50 min-h-0">
      {/* Header */}
      <div className="flex items-center justify-between p-4 pt-[max(1rem,env(safe-area-inset-top))] sm:pt-4 border-b border-slate-200 bg-white sticky top-0 z-20 shadow-sm shrink-0">
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
            {/* Explicit Select button removed, gesture is now the way */}
            
            {!isSelectionMode && history.length > 0 && (
                <button 
                onClick={handleClearAll} 
                className="text-xs text-red-500 hover:text-red-600 font-bold hover:bg-red-50 px-3 py-2 rounded-lg transition-colors border border-transparent hover:border-red-100"
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
          <div className="flex-1 flex flex-col items-center justify-center py-20 text-slate-400 gap-4 min-h-0">
              <div className="w-20 h-20 bg-slate-100 rounded-full flex items-center justify-center">
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1} stroke="currentColor" className="w-10 h-10 text-slate-300">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
                </svg>
              </div>
              <span className="text-base font-medium text-slate-500">Chưa có lịch sử nào.</span>
          </div>
      ) : (
        <div className="flex-1 overflow-y-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] p-3 pb-4 sm:p-4 min-h-0 overscroll-contain touch-pan-y">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {history.map(item => {
                    const isCalculate = item.type === 'calculate';
                    const isRevenue = item.type === 'revenue';
                    
                    // Logic to display content based on type
                    let displayLabel = "Số tiền gốc";
                    let displayAmount = item.inputAmount;
                    let typeLabel = "Chuyển đổi";
                    let typeColor = "bg-blue-100 text-blue-600";

                    // Determine special case for calculations
                    let specialCase = 'none';
                    if (isCalculate || isRevenue) {
                        specialCase = item.revenueDetails?.specialCase || (item.revenueDetails?.isSalesExecutive ? 'sales' : 'none');
                    }
                    
                    if (isCalculate) {
                        displayLabel = specialCase === 'sales' ? "Phí dịch vụ" : "Mức lương";
                        displayAmount = item.originalSalary || item.inputAmount;
                        typeLabel = specialCase === 'sales' ? "NVKD" : specialCase === 'senior' ? "Cấp cao" : "Tính phí";
                        typeColor = specialCase === 'sales' ? "bg-orange-100 text-orange-600" : specialCase === 'senior' ? "bg-rose-100 text-rose-600" : "bg-purple-100 text-purple-600";
                    } else if (isRevenue) {
                        displayLabel = "Mức lương";
                        displayAmount = item.originalSalary || item.inputAmount; // stored as salary for revenue
                        typeLabel = "Doanh thu";
                        typeColor = "bg-emerald-100 text-emerald-600";
                    }

                    return (
                        <div key={item.id} 
                            data-history-id={item.id}
                            onPointerDown={(e) => handlePointerDown(e, item.id)}
                            onClick={() => {
                                if (isSelectionMode) {
                                    handleCheckboxChange(item.id);
                                } else {
                                    onSelect(item); 
                                }
                            }} 
                            className={`
                                relative overflow-hidden rounded-xl border transition-all cursor-pointer group flex items-stretch touch-manipulation select-none
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
                                    <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-md ${typeColor}`}>
                                        {typeLabel}
                                    </span>
                                    <span className="text-xs text-slate-400 font-medium">{formatDate(item.timestamp)}</span>
                                </div>

                                {/* Middle Row: Hero Input Amount */}
                                <div className="flex flex-col">
                                    <span className="text-[10px] uppercase font-bold text-slate-400 mb-0.5">{displayLabel}</span>
                                    <div className="flex items-center gap-2">
                                        <img src={item.fromCurrency.flag} className="w-6 h-4 rounded shadow-sm object-cover" alt="" />
                                        <span className="text-xl sm:text-2xl font-extrabold text-slate-800 tracking-tight leading-none">
                                            {formatCurrency(displayAmount, item.fromCurrency.locale, item.fromCurrency.code)}
                                        </span>
                                    </div>
                                    
                                    {/* Sub details based on type */}
                                    {isCalculate && specialCase !== 'sales' && (
                                        <div className="flex items-center gap-1 mt-1 text-slate-500">
                                            <span className="text-[10px] uppercase font-bold bg-slate-100 px-1.5 py-0.5 rounded text-slate-500">Phí dịch vụ</span>
                                            <span className="text-xs font-bold">{formatCurrency(item.inputAmount, item.fromCurrency.locale, item.fromCurrency.code)}</span>
                                        </div>
                                    )}

                                    {isRevenue && item.revenueDetails && (
                                        <div className="flex flex-col gap-1 mt-2 p-2 bg-slate-50 rounded-lg border border-slate-100">
                                            <div className="flex justify-between items-center">
                                                <span className="text-[10px] text-slate-500 font-bold uppercase">{getShareLabel(item.revenueDetails.shareType)}</span>
                                            </div>
                                            <div className="flex items-center justify-between">
                                                 <span className="text-[10px] uppercase font-bold text-slate-400">Thực nhận</span>
                                                 <span className="text-sm font-bold text-primary-600">{formatCurrency(item.convertedAmount, 'vi-VN', 'VND')}</span>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </div>

                            {!isSelectionMode && (
                                <button
                                    onClick={(e) => handleDeleteSingle(item.id, e)}
                                    className="w-12 flex items-center justify-center text-slate-300 hover:text-red-500 hover:bg-red-50 transition-all border-l border-slate-100 group-hover:border-slate-200"
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
            
            <p className="text-xs text-slate-400 mt-6 text-center italic opacity-60">Giữ lì vào lịch sử để chọn nhiều</p>
        </div>
      )}

      {/* Floating Action Button for Selection Mode */}
      {isSelectionMode && (
          <div className="absolute bottom-0 left-0 right-0 p-4 bg-white border-t border-slate-200 shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.05)] z-30 animate-fade-in-up">
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