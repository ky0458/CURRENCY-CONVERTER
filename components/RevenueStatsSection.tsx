
import React, { useState, useMemo, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { RevenueRecord, ThemeColor } from '../types';
import { useNotes } from '../hooks/useNotes';
import { THEME_COLORS } from '../constants';

interface RevenueStatsSectionProps {
  records: RevenueRecord[];
  onDeleteRecord: (id: string) => void;
  onDeleteRecords?: (ids: string[]) => void;
  onUpdateRecord: (id: string, updates: Partial<RevenueRecord>) => void;
  formatCurrency: (val: number, locale: string, currencyCode: string) => string;
  theme: ThemeColor;
}

const BADGE_COLORS = [
  '#ef4444', // Red
  '#f97316', // Orange
  '#f59e0b', // Amber
  '#84cc16', // Lime
  '#10b981', // Emerald
  '#06b6d4', // Cyan
  '#3b82f6', // Blue
  '#6366f1', // Indigo
  '#8b5cf6', // Violet
  '#d946ef', // Fuchsia
  '#f43f5e', // Rose
  '#64748b', // Slate
];

export const RevenueStatsSection: React.FC<RevenueStatsSectionProps> = ({ 
  records, 
  onDeleteRecord,
  onDeleteRecords,
  onUpdateRecord,
  formatCurrency, 
  theme 
}) => {
  const { tags } = useNotes();
  
  // Get Theme Hex for fallback
  const themeHex = useMemo(() => THEME_COLORS.find(t => t.id === theme)?.hex || '#2563eb', [theme]);
  
  // Date State - Only Month
  const today = new Date();
  const [selectedMonth, setSelectedMonth] = useState<string>(`${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}`); // YYYY-MM

  // Modal State
  const [editingId, setEditingId] = useState<string | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [isModalClosing, setIsModalClosing] = useState(false);

  // Edit State
  const [tempNote, setTempNote] = useState('');
  const [tempBadgeColor, setTempBadgeColor] = useState<string>(''); 
  const modalRef = useRef<HTMLDivElement>(null);

  // --- SELECTION STATE ---
  const [isSelectionMode, setIsSelectionMode] = useState(false);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [confirmBatchDelete, setConfirmBatchDelete] = useState(false);

  // Gesture Refs
  const longPressTimerRef = useRef<number | null>(null);
  const isDragSelectingRef = useRef(false);
  const startPosRef = useRef<{ x: number, y: number } | null>(null);
  const selectionSetRef = useRef<Set<string>>(new Set());

  // Sync ref with state
  useEffect(() => {
      selectionSetRef.current = selectedIds;
  }, [selectedIds]);

  const [showAllList, setShowAllList] = useState(false);

  // Filter Logic - Only Month
  const filteredRecords = useMemo(() => {
      return records.filter(r => {
          const rDate = new Date(r.timestamp);
          const rMonth = `${rDate.getFullYear()}-${String(rDate.getMonth() + 1).padStart(2, '0')}`;
          return rMonth === selectedMonth;
      }).sort((a, b) => b.timestamp - a.timestamp);
  }, [records, selectedMonth]);

  // Calculations
  const totalRevenue = filteredRecords.reduce((sum, r) => sum + r.totalRevenue, 0);
  const totalNetIncome = filteredRecords.reduce((sum, r) => sum + r.netIncome, 0);

  // Handlers
  const handlePrev = () => {
      const [y, m] = selectedMonth.split('-').map(Number);
      let newM = m - 1;
      let newY = y;
      if (newM < 1) { newM = 12; newY -= 1; }
      setSelectedMonth(`${newY}-${String(newM).padStart(2, '0')}`);
  };

  const handleNext = () => {
      const [y, m] = selectedMonth.split('-').map(Number);
      let newM = m + 1;
      let newY = y;
      if (newM > 12) { newM = 1; newY += 1; }
      setSelectedMonth(`${newY}-${String(newM).padStart(2, '0')}`);
  };

  const getShareLabel = (type: string) => {
     if (type === 'job') return 'Nắm Job (70%)';
     if (type === 'cv') return 'Có CV (30%)';
     return '100%';
  };

  const getTag = (id?: string | null) => tags.find(t => t.id === id);

  // --- Modal Handlers ---
  const closeModal = () => {
      setIsModalClosing(true);
      setTimeout(() => {
          setEditingId(null);
          setDeleteId(null);
          setConfirmBatchDelete(false);
          setIsModalClosing(false);
      }, 300); 
  };

  const openEditModal = (record: RevenueRecord) => {
      if (isSelectionMode) return;
      setEditingId(record.id);
      setTempNote(record.note || '');
      const existingTag = getTag(record.tagId);
      setTempBadgeColor(record.badgeColor || existingTag?.color || themeHex);
      setIsModalClosing(false);
  };

  const saveEdit = () => {
      if (editingId) {
          onUpdateRecord(editingId, { note: tempNote, badgeColor: tempBadgeColor });
          closeModal();
      }
  };

  const confirmDelete = () => {
      if (deleteId) {
          onDeleteRecord(deleteId);
          closeModal();
      }
  };

  const confirmBatchDeleteAction = () => {
      if (onDeleteRecords && selectedIds.size > 0) {
          onDeleteRecords(Array.from(selectedIds));
          setIsSelectionMode(false);
          setSelectedIds(new Set());
          closeModal();
      }
  };

  // Close modal on outside click
  useEffect(() => {
      const handleClickOutside = (event: MouseEvent) => {
          if (modalRef.current && !modalRef.current.contains(event.target as Node)) {
              closeModal();
          }
      };
      if (editingId || deleteId || confirmBatchDelete) document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [editingId, deleteId, confirmBatchDelete]);

  // --- GESTURE LOGIC: Long Press & Selection ---
  const handlePointerDown = (e: React.PointerEvent, id: string) => {
      if (isSelectionMode) return; // Already selecting, click handler manages toggle

      startPosRef.current = { x: e.clientX, y: e.clientY };
      
      longPressTimerRef.current = window.setTimeout(() => {
          setIsSelectionMode(true);
          setSelectedIds(new Set([id]));
          isDragSelectingRef.current = true;
          if (navigator.vibrate) navigator.vibrate(50);
      }, 500); 
  };

  const handleItemClick = (record: RevenueRecord) => {
      if (isSelectionMode) {
          const newSelected = new Set(selectedIds);
          if (newSelected.has(record.id)) {
              newSelected.delete(record.id);
          } else {
              newSelected.add(record.id);
          }
          setSelectedIds(newSelected);
          
          if (newSelected.size === 0) {
              setIsSelectionMode(false);
          }
      } 
  };

  useEffect(() => {
    const handleGlobalPointerMove = (e: PointerEvent) => {
        if (longPressTimerRef.current && startPosRef.current && !isDragSelectingRef.current) {
            const moveX = Math.abs(e.clientX - startPosRef.current.x);
            const moveY = Math.abs(e.clientY - startPosRef.current.y);
            if (moveX > 10 || moveY > 10) {
                clearTimeout(longPressTimerRef.current);
                longPressTimerRef.current = null;
                startPosRef.current = null;
            }
        }

        if (isDragSelectingRef.current) {
            e.preventDefault(); 
            const element = document.elementFromPoint(e.clientX, e.clientY);
            const item = element?.closest('[data-record-id]');
            
            if (item) {
                const id = item.getAttribute('data-record-id');
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

  const displayDateLabel = useMemo(() => {
      const [y, m] = selectedMonth.split('-');
      return `Tháng ${m}/${y}`;
  }, [selectedMonth]);

  useEffect(() => {
      setShowAllList(false);
  }, [selectedMonth]);

  const displayedRecords = useMemo(() => {
      if (isSelectionMode) return filteredRecords; // Always show all when selecting
      return showAllList ? filteredRecords : filteredRecords.slice(0, 3);
  }, [filteredRecords, showAllList, isSelectionMode]);

  return (
    <div className="animate-fade-in-up space-y-6 relative pb-20">
       
       {/* Header Controls */}
       <div className="flex items-center justify-between mb-4">
            {isSelectionMode ? (
                <div className="flex items-center gap-3 w-full bg-slate-800 text-white p-3 rounded-2xl animate-fade-in-up shadow-lg">
                    <button onClick={() => { setIsSelectionMode(false); setSelectedIds(new Set()); }} className="px-3 py-1 bg-white/20 rounded-lg hover:bg-white/30 font-bold text-xs">Hủy</button>
                    <span className="font-bold text-sm flex-1 text-center">Đã chọn {selectedIds.size} mục</span>
                    <button onClick={() => setSelectedIds(new Set(filteredRecords.map(r => r.id)))} className="text-xs font-bold text-blue-200 hover:text-white">Tất cả</button>
                </div>
            ) : (
               <h3 className="text-sm font-extrabold text-slate-400 uppercase tracking-widest px-1">Lịch sử thống kê ({filteredRecords.length})</h3>
            )}
       </div>

       {/* Month Picker */}
       {!isSelectionMode && (
           <div className="bg-white/60 backdrop-blur-sm p-2 rounded-2xl border border-white/50 shadow-sm flex items-center justify-between gap-2">
                <button onClick={handlePrev} className="p-3 hover:bg-white rounded-xl text-slate-500 transition-colors active:scale-95">
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-5 h-5">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5 8.25 12l7.5-7.5" />
                    </svg>
                </button>
                
                <div className="flex flex-col items-center justify-center cursor-default">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-0.5">Thời gian</span>
                    <span className="text-xl font-extrabold text-slate-800">{displayDateLabel}</span>
                </div>

                <button onClick={handleNext} className="p-3 hover:bg-white rounded-xl text-slate-500 transition-colors active:scale-95">
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-5 h-5">
                        <path strokeLinecap="round" strokeLinejoin="round" d="m8.25 4.5 7.5 7.5-7.5 7.5" />
                    </svg>
                </button>
           </div>
       )}

       {/* Summary Cards */}
       {!isSelectionMode && (
           <div className="grid grid-cols-2 gap-4">
                <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-100 shadow-sm relative overflow-hidden group">
                    <div className="absolute top-0 right-0 p-2 opacity-10 group-hover:opacity-20 transition-opacity">
                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-12 h-12 text-emerald-600"><path fillRule="evenodd" d="M12 2.25c-5.385 0-9.75 4.365-9.75 9.75s4.365 9.75 9.75 9.75 9.75-4.365 9.75-9.75S17.385 2.25 12 2.25ZM9 7.5A.75.75 0 0 0 9 9h1.5c.98 0 1.773.804 1.773 1.773 0 .969-.794 1.773-1.773 1.773H9A.75.75 0 0 0 9 14h1.5a3.273 3.273 0 0 0 3.273-3.273c0-1.816-1.457-3.273-3.273-3.273H9Z" clipRule="evenodd" /></svg>
                    </div>
                    <span className="text-xs font-bold text-emerald-600 uppercase tracking-wide block mb-1">Thực nhận (49%)</span>
                    <span className="text-xl sm:text-2xl font-extrabold text-emerald-700 block truncate">
                        {formatCurrency(totalNetIncome, 'vi-VN', 'VND')}
                    </span>
                </div>
                <div className="p-4 rounded-2xl bg-blue-50 border border-blue-100 shadow-sm relative overflow-hidden group">
                    <div className="absolute top-0 right-0 p-2 opacity-10 group-hover:opacity-20 transition-opacity">
                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-12 h-12 text-blue-600"><path d="M12 7.5a2.25 2.25 0 1 0 0 4.5 2.25 2.25 0 0 0 0-4.5Z" /><path fillRule="evenodd" d="M1.5 4.875C1.5 3.839 2.34 3 3.375 3h17.25c1.035 0 1.875.84 1.875 1.875v9.75c0 1.036-.84 1.875-1.875 1.875H3.375A1.875 1.875 0 0 1 1.5 14.625v-9.75ZM8.25 9.75a3.75 3.75 0 1 1 7.5 0 3.75 3.75 0 0 1-7.5 0ZM18.75 9a.75.75 0 0 0-.75.75v.008c0 .414.336.75.75.75h.008a.75.75 0 0 0 .75-.75V9.75a.75.75 0 0 0-.75-.75h-.008ZM4.5 9.75A.75.75 0 0 1 5.25 9h.008a.75.75 0 0 1 .75.75v.008a.75.75 0 0 1-.75.75H5.25a.75.75 0 0 1-.75-.75V9.75Z" clipRule="evenodd" /><path d="M2.25 18a.75.75 0 0 0 0 1.5c5.4 0 10.63.722 15.6 2.075 1.19.324 2.4-.558 2.4-1.82V18.75a.75.75 0 0 0-.75-.75H2.25Z" /></svg>
                    </div>
                    <span className="text-xs font-bold text-blue-600 uppercase tracking-wide block mb-1">Tổng doanh thu</span>
                    <span className="text-xl sm:text-2xl font-extrabold text-blue-700 block truncate">
                        {formatCurrency(totalRevenue, 'vi-VN', 'VND')}
                    </span>
                </div>
           </div>
       )}

       {/* Detail List */}
       <div className="space-y-3 max-h-[350px] overflow-y-auto pr-1 custom-scrollbar">
            {filteredRecords.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12 text-slate-400 gap-2">
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-12 h-12 opacity-50">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 9.776c.112-.017.227-.026.344-.026h15.812c.117 0 .232.009.344.026m-16.5 0a2.25 2.25 0 0 0-1.883 2.542l.857 6a2.25 2.25 0 0 0 2.227 1.932H19.05a2.25 2.25 0 0 0 2.227-1.932l.857-6a2.25 2.25 0 0 0-1.883-2.542m-16.5 0V6A2.25 2.25 0 0 1 6 3.75h3.879a1.5 1.5 0 0 1 1.06.44l2.122 2.12a1.5 1.5 0 0 0 1.06.44H18A2.25 2.25 0 0 1 20.25 6v.776" />
                    </svg>
                    <span className="text-sm">Chưa có dữ liệu</span>
                </div>
            ) : (
                <>
                    {displayedRecords.map((record) => {
                        const tag = getTag(record.tagId);
                        const finalColor = record.badgeColor || (tag ? tag.color : themeHex);
                        const stageRevenue = Math.floor(record.totalRevenue / 2);
                        const isSelected = selectedIds.has(record.id);

                        return (
                            <div 
                                key={record.id}
                                data-record-id={record.id}
                                onPointerDown={(e) => handlePointerDown(e, record.id)}
                                onClick={() => handleItemClick(record)}
                                className={`
                                    relative rounded-2xl transition-all duration-200 p-3 sm:p-4 border touch-manipulation select-none
                                    ${isSelectionMode && isSelected 
                                        ? 'bg-primary-50 border-primary-500 shadow-md ring-1 ring-primary-500 transform scale-[1.01]' 
                                        : 'bg-white border-slate-100 hover:border-slate-300 hover:shadow-sm'}
                                `}
                            >
                                {/* Selection Checkbox */}
                                {isSelectionMode && (
                                    <div className="absolute top-4 right-4 z-10 pointer-events-none">
                                        <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center transition-colors ${isSelected ? 'bg-primary-600 border-primary-600' : 'bg-white border-slate-300'}`}>
                                            {isSelected && (
                                                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4 text-white">
                                                    <path fillRule="evenodd" d="M16.704 4.153a.75.75 0 0 1 .143 1.052l-8 10.5a.75.75 0 0 1-1.127.075l-4.5-4.5a.75.75 0 0 1 1.06-1.06l3.894 3.893 7.48-9.817a.75.75 0 0 1 1.05-.143Z" clipRule="evenodd" />
                                                </svg>
                                            )}
                                        </div>
                                    </div>
                                )}

                                <div className="flex items-stretch gap-3 sm:gap-4">
                                    {/* Main Content Layout */}
                                    <div className="flex-1 flex flex-col gap-3">
                                        
                                        {/* Row 1: Badges + Date */}
                                        <div className="flex justify-between items-start gap-2">
                                            <div className="flex items-center gap-2 flex-wrap">
                                                {record.note && (
                                                    <span 
                                                        className="px-2 py-0.5 rounded text-[10px] font-bold text-white shadow-sm truncate max-w-[150px]"
                                                        style={{ backgroundColor: finalColor }}
                                                    >
                                                        {record.note}
                                                    </span>
                                                )}
                                                <span className={`text-[9px] px-1.5 py-0.5 rounded border font-bold uppercase tracking-wider ${
                                                    record.shareType === 'all' ? 'bg-slate-50 text-slate-500 border-slate-100' : 
                                                    record.shareType === 'job' ? 'bg-purple-50 text-purple-600 border-purple-100' : 
                                                    'bg-orange-50 text-orange-600 border-orange-100'
                                                }`}>
                                                    {getShareLabel(record.shareType)}
                                                </span>
                                            </div>
                                            <span className="text-[10px] font-semibold text-slate-400 bg-slate-50 px-2 py-0.5 rounded-full whitespace-nowrap shrink-0">
                                                {new Date(record.timestamp).toLocaleString('vi-VN', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' })}
                                            </span>
                                        </div>

                                        {/* Row 2: Money Blocks (Optimized for Mobile/Desktop) */}
                                        <div className="flex flex-col sm:flex-row gap-3 items-stretch">
                                            
                                            {/* Block 1: Net Income (Highlighted) */}
                                            <div className="flex-1 bg-gradient-to-br from-emerald-50 to-teal-50 border border-emerald-100 rounded-xl p-3 flex flex-col justify-center relative overflow-hidden group/money">
                                                <div className="absolute top-0 right-0 p-2 opacity-5 group-hover/money:opacity-10 transition-opacity">
                                                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-16 h-16 text-emerald-600"><path d="M12 7.5a2.25 2.25 0 1 0 0 4.5 2.25 2.25 0 0 0 0-4.5Z" /><path fillRule="evenodd" d="M1.5 4.875C1.5 3.839 2.34 3 3.375 3h17.25c1.035 0 1.875.84 1.875 1.875v9.75c0 1.036-.84 1.875-1.875 1.875H3.375A1.875 1.875 0 0 1 1.5 14.625v-9.75ZM8.25 9.75a3.75 3.75 0 1 1 7.5 0 3.75 3.75 0 0 1-7.5 0ZM18.75 9a.75.75 0 0 0-.75.75v.008c0 .414.336.75.75.75h.008a.75.75 0 0 0 .75-.75V9.75a.75.75 0 0 0-.75-.75h-.008ZM4.5 9.75A.75.75 0 0 1 5.25 9h.008a.75.75 0 0 1 .75.75v.008a.75.75 0 0 1-.75.75H5.25a.75.75 0 0 1-.75-.75V9.75Z" clipRule="evenodd" /><path d="M2.25 18a.75.75 0 0 0 0 1.5c5.4 0 10.63.722 15.6 2.075 1.19.324 2.4-.558 2.4-1.82V18.75a.75.75 0 0 0-.75-.75H2.25Z" /></svg>
                                                </div>
                                                <span className="text-[10px] text-emerald-600 font-bold uppercase tracking-wider mb-0.5 relative z-10">Thực nhận</span>
                                                <div className="text-2xl sm:text-3xl font-black text-emerald-600 tracking-tight relative z-10 leading-none">
                                                    {formatCurrency(record.netIncome, 'vi-VN', 'VND')}
                                                </div>
                                            </div>

                                            {/* Block 2: Details */}
                                            <div className="flex flex-row sm:flex-col gap-2 sm:w-1/3 min-w-[120px]">
                                                <div className="flex-1 bg-slate-50 rounded-xl p-2 border border-slate-100 flex flex-col justify-center px-3">
                                                    <span className="text-[9px] text-slate-400 font-bold uppercase">Doanh thu</span>
                                                    <span className="text-sm font-bold text-slate-700">{formatCurrency(record.totalRevenue, 'vi-VN', 'VND')}</span>
                                                </div>
                                                <div className="flex-1 bg-slate-50 rounded-xl p-2 border border-slate-100 flex flex-col justify-center px-3">
                                                    <span className="text-[9px] text-slate-400 font-bold uppercase">Giai đoạn</span>
                                                    <span className="text-sm font-bold text-slate-700">{formatCurrency(stageRevenue, 'vi-VN', 'VND')}</span>
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Action Buttons (Visible only when not in selection mode) */}
                                    {!isSelectionMode && (
                                        <div className="flex flex-col justify-center gap-2 border-l border-slate-100 pl-3 shrink-0">
                                            <button 
                                                onClick={(e) => { e.stopPropagation(); openEditModal(record); }}
                                                className="w-9 h-9 flex items-center justify-center rounded-xl bg-slate-50 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 transition-colors border border-slate-100 hover:border-indigo-100"
                                                title="Ghi chú"
                                            >
                                                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-4 h-4">
                                                    <path strokeLinecap="round" strokeLinejoin="round" d="m16.862 4.487 1.687-1.688a1.875 1.875 0 1 1 2.652 2.652L10.582 16.07a4.5 4.5 0 0 1-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 0 1 1.13-1.897l8.932-8.931Zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0 1 15.75 21H5.25A2.25 2.25 0 0 1 3 18.75V8.25A2.25 2.25 0 0 1 5.25 6H10" />
                                                </svg>
                                            </button>
                                            
                                            <button 
                                                onClick={(e) => { e.stopPropagation(); setDeleteId(record.id); }}
                                                className="w-9 h-9 flex items-center justify-center rounded-xl bg-slate-50 text-slate-400 hover:text-red-600 hover:bg-red-50 transition-colors border border-slate-100 hover:border-red-100"
                                                title="Xóa bản ghi"
                                            >
                                                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-4 h-4">
                                                    <path strokeLinecap="round" strokeLinejoin="round" d="m14.74 9-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 0 1-2.244 2.077H8.084a2.25 2.25 0 0 1-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 0 0-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 0 1 3.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 0 0-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 0 0-7.5 0" />
                                                </svg>
                                            </button>
                                        </div>
                                    )}
                                </div>
                            </div>
                        )
                    })}
                    
                    {!isSelectionMode && filteredRecords.length > 3 && (
                        <div className="pt-2">
                            <button 
                                onClick={() => setShowAllList(!showAllList)}
                                className="w-full py-3 bg-white border border-slate-200 rounded-xl text-sm font-bold text-slate-500 hover:text-slate-700 hover:bg-slate-50 transition-colors flex items-center justify-center gap-2 shadow-sm active:scale-95"
                            >
                                {showAllList ? (
                                    <>
                                        Thu gọn
                                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4"><path fillRule="evenodd" d="M14.77 12.79a.75.75 0 01-1.06-.02L10 8.832 6.29 12.77a.75.75 0 11-1.08-1.04l4.25-4.5a.75.75 0 011.08 0l4.25 4.5a.75.75 0 01-.02 1.06z" clipRule="evenodd" /></svg>
                                    </>
                                ) : (
                                    <>
                                        Xem tất cả {filteredRecords.length} bản ghi
                                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4"><path fillRule="evenodd" d="M5.23 7.21a.75.75 0 011.06.02L10 11.168l3.71-3.938a.75.75 0 111.08 1.04l-4.25 4.5a.75.75 0 01-1.08 0l-4.25-4.5a.75.75 0 01.02-1.06z" clipRule="evenodd" /></svg>
                                    </>
                                )}
                            </button>
                        </div>
                    )}
                </>
            )}
       </div>

       <p className="text-xs text-slate-300 text-center italic opacity-60 mt-4 pb-4">Giữ lì vào mục để chọn nhiều và xóa</p>

       {/* Floating Selection Bar */}
       {isSelectionMode && (
           <div className="fixed bottom-4 left-4 right-4 z-50 animate-slide-in-down flex justify-center pointer-events-none">
               <div className="bg-white rounded-2xl shadow-[0_10px_40px_-10px_rgba(0,0,0,0.2)] border border-slate-100 p-2 flex items-center gap-2 pointer-events-auto max-w-sm w-full">
                   <button 
                        onClick={() => setConfirmBatchDelete(true)}
                        disabled={selectedIds.size === 0}
                        className="flex-1 bg-red-500 hover:bg-red-600 text-white font-bold py-3 rounded-xl shadow-md transition-all active:scale-95 flex items-center justify-center gap-2"
                   >
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5">
                            <path strokeLinecap="round" strokeLinejoin="round" d="m14.74 9-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 0 1-2.244 2.077H8.084a2.25 2.25 0 0 1-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 0 0-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 0 1 3.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 0 0-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 0 0-7.5 0" />
                        </svg>
                        Xóa ({selectedIds.size})
                   </button>
               </div>
           </div>
       )}

       {/* Edit Modal */}
       {editingId && createPortal(
           <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4">
                <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-xl transition-opacity duration-300" onClick={closeModal}></div>
                <div ref={modalRef} className={`bg-white rounded-2xl shadow-2xl w-full max-w-sm relative z-10 p-5 flex flex-col gap-4 border border-white/60 ${isModalClosing ? 'animate-smooth-out' : 'animate-smooth-in'}`} style={{ animationFillMode: 'forwards' }}>
                    <div className="flex justify-between items-center">
                        <h3 className="text-lg font-bold text-slate-800">Chỉnh sửa ghi chú</h3>
                        <button onClick={() => setDeleteId(editingId)} className="text-red-500 bg-red-50 hover:bg-red-100 p-2 rounded-lg transition-colors"><svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-4 h-4"><path strokeLinecap="round" strokeLinejoin="round" d="m14.74 9-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 0 1-2.244 2.077H8.084a2.25 2.25 0 0 1-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 0 0-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 0 1 3.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 0 0-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 0 0-7.5 0" /></svg></button>
                    </div>
                    <div>
                        <label className="block text-xs font-bold text-slate-500 uppercase mb-2">Màu ghi chú</label>
                        <div className="grid grid-cols-6 gap-3">
                            {BADGE_COLORS.map(color => (
                                <button key={color} onClick={() => setTempBadgeColor(color)} className={`w-10 h-10 rounded-full cursor-pointer transition-transform hover:scale-110 flex items-center justify-center shadow-sm ${tempBadgeColor === color ? 'ring-2 ring-offset-2 ring-slate-400 scale-110' : 'border border-black/5'}`} style={{ backgroundColor: color }}>
                                    {tempBadgeColor === color && <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={3} stroke="currentColor" className="w-4 h-4 text-white drop-shadow-md"><path strokeLinecap="round" strokeLinejoin="round" d="m4.5 12.75 6 6 9-13.5" /></svg>}
                                </button>
                            ))}
                        </div>
                    </div>
                    <div>
                        <label className="block text-xs font-bold text-slate-500 uppercase mb-2">Nội dung (Badge)</label>
                        <input type="text" className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-white focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 text-sm font-medium transition-all" placeholder="VD: Đã thanh toán..." value={tempNote} onChange={(e) => setTempNote(e.target.value)} maxLength={20} />
                        <p className="text-[10px] text-slate-400 mt-1 text-right">{tempNote.length}/20 ký tự</p>
                    </div>
                    <div className="flex gap-3 mt-2">
                        <button onClick={closeModal} className="flex-1 py-3 rounded-xl bg-slate-100 font-bold text-slate-600 hover:bg-slate-200">Hủy</button>
                        <button onClick={saveEdit} className="flex-1 py-3 rounded-xl bg-primary-600 font-bold text-white hover:bg-primary-700 shadow-lg shadow-primary-200">Lưu</button>
                    </div>
                </div>
           </div>,
           document.body
       )}

       {/* Confirm Batch Delete Modal */}
       {(deleteId || confirmBatchDelete) && createPortal(
           <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4">
               <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-xl transition-opacity duration-300" onClick={closeModal}></div>
               <div className={`bg-white rounded-2xl shadow-2xl p-6 w-full max-w-sm relative z-10 border border-white/60 ${isModalClosing ? 'animate-smooth-out' : 'animate-smooth-in'}`} style={{ animationFillMode: 'forwards' }}>
                  <div className="text-center mb-6">
                      <div className="w-14 h-14 bg-red-50 rounded-full flex items-center justify-center mx-auto mb-4 text-red-500 ring-4 ring-red-50">
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-7 h-7"><path strokeLinecap="round" strokeLinejoin="round" d="m14.74 9-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 0 1-2.244 2.077H8.084a2.25 2.25 0 0 1-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 0 0-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 0 1 3.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 0 0-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 0 0-7.5 0" /></svg>
                      </div>
                      <h4 className="text-xl font-bold text-slate-800 mb-2">{confirmBatchDelete ? `Xóa ${selectedIds.size} mục đã chọn?` : 'Xóa bản ghi này?'}</h4>
                      <p className="text-slate-500 text-sm">Hành động này không thể hoàn tác. Dữ liệu sẽ bị xóa vĩnh viễn.</p>
                  </div>
                  <div className="flex gap-3">
                      <button onClick={closeModal} className="flex-1 py-3 rounded-xl font-bold text-slate-600 bg-slate-100 hover:bg-slate-200 transition-colors">Hủy bỏ</button>
                      <button onClick={confirmBatchDelete ? confirmBatchDeleteAction : confirmDelete} className="flex-1 py-3 rounded-xl font-bold text-white bg-red-500 hover:bg-red-600 transition-colors shadow-lg shadow-red-200">Xóa ngay</button>
                  </div>
               </div>
           </div>,
           document.body
       )}
       <style>{`
            @keyframes smoothIn { 0% { opacity: 0; transform: scale(0.95) translateY(10px); } 100% { opacity: 1; transform: scale(1) translateY(0); } }
            @keyframes smoothOut { 0% { opacity: 1; transform: scale(1) translateY(0); } 100% { opacity: 0; transform: scale(0.95) translateY(10px); } }
            .animate-smooth-in { animation: smoothIn 0.3s cubic-bezier(0.16, 1, 0.3, 1); }
            .animate-smooth-out { animation: smoothOut 0.2s cubic-bezier(0.16, 1, 0.3, 1); }
       `}</style>
    </div>
  );
};
