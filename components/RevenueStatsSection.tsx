
import React, { useState, useMemo, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { RevenueRecord, ThemeColor } from '../types';
import { useNotes } from '../hooks/useNotes';
import { THEME_COLORS } from '../constants';

interface RevenueStatsSectionProps {
  records: RevenueRecord[];
  onDeleteRecord: (id: string) => void;
  onUpdateRecord: (id: string, updates: Partial<RevenueRecord>) => void;
  formatCurrency: (val: number, locale: string, currencyCode: string) => string;
  theme: ThemeColor;
}

export const RevenueStatsSection: React.FC<RevenueStatsSectionProps> = ({ 
  records, 
  onDeleteRecord, 
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

  // Refs for native pickers
  const monthInputRef = useRef<HTMLInputElement>(null);

  // Modal State
  const [editingId, setEditingId] = useState<string | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [isModalClosing, setIsModalClosing] = useState(false);

  // Edit State
  const [tempNote, setTempNote] = useState('');
  const [tempTagId, setTempTagId] = useState<string>('');
  const modalRef = useRef<HTMLDivElement>(null);

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

  // Removed direct text click handler
  // const openDatePicker = () => { monthInputRef.current?.showPicker(); };

  const getShareLabel = (type: string) => {
     if (type === 'cv') return 'CV (70%)';
     if (type === 'job') return 'Job (30%)';
     return '100%';
  };

  const getTag = (id?: string | null) => tags.find(t => t.id === id);

  // --- Modal Handlers with Animation ---
  const closeModal = () => {
      setIsModalClosing(true);
      setTimeout(() => {
          setEditingId(null);
          setDeleteId(null);
          setIsModalClosing(false);
      }, 300); // Increased duration for smoother exit
  };

  const openEditModal = (record: RevenueRecord) => {
      setEditingId(record.id);
      setTempNote(record.note || '');
      setTempTagId(record.tagId || '');
      setIsModalClosing(false);
  };

  const openDeleteModal = (id: string) => {
      setDeleteId(id);
      setIsModalClosing(false);
  };

  const saveEdit = () => {
      if (editingId) {
          onUpdateRecord(editingId, { note: tempNote, tagId: tempTagId || null });
          closeModal();
      }
  };

  const confirmDelete = () => {
      if (deleteId) {
          onDeleteRecord(deleteId);
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
      if (editingId || deleteId) document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [editingId, deleteId]);

  const displayDateLabel = useMemo(() => {
      const [y, m] = selectedMonth.split('-');
      return `Tháng ${m}/${y}`;
  }, [selectedMonth]);

  return (
    <div className="animate-fade-in-up space-y-6">
       
       {/* Controls - Only Month Picker */}
       <div className="bg-white/60 backdrop-blur-sm p-2 rounded-2xl border border-white/50 shadow-sm flex items-center justify-between gap-2">
            <button onClick={handlePrev} className="p-3 hover:bg-white rounded-xl text-slate-500 transition-colors active:scale-95">
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-5 h-5">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5 8.25 12l7.5-7.5" />
                </svg>
            </button>
            
            <div className="relative group flex-1">
                {/* Disabled click on this container */}
                <div 
                    className="w-full flex flex-col items-center justify-center py-2 rounded-xl cursor-default"
                >
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-0.5">Thời gian</span>
                    <div className="flex items-center gap-2 text-slate-800">
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-4 h-4 text-primary-500">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 0 1 2.25-2.25h13.5A2.25 2.25 0 0 1 21 7.5v11.25m-18 0A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75m-18 0v-7.5A2.25 2.25 0 0 1 5.25 9h13.5A2.25 2.25 0 0 1 21 11.25v7.5" />
                        </svg>
                        <span className="text-xl font-extrabold">{displayDateLabel}</span>
                    </div>
                </div>
            </div>

            <button onClick={handleNext} className="p-3 hover:bg-white rounded-xl text-slate-500 transition-colors active:scale-95">
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-5 h-5">
                    <path strokeLinecap="round" strokeLinejoin="round" d="m8.25 4.5 7.5 7.5-7.5 7.5" />
                </svg>
            </button>
       </div>

       {/* Summary Cards */}
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

       {/* Detail List - Integrated Layout (No Drop Shadow, Flat) */}
       <div className="border-t border-white/50 pt-2 min-h-[300px]">
            <div className="p-2 mb-2 flex justify-between items-center">
                <h3 className="font-bold text-slate-700 uppercase tracking-widest text-xs">Chi tiết ({filteredRecords.length})</h3>
            </div>
            
            <div className="space-y-3 pb-20">
                {filteredRecords.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-12 text-slate-400 gap-2">
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-12 h-12 opacity-50">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 9.776c.112-.017.227-.026.344-.026h15.812c.117 0 .232.009.344.026m-16.5 0a2.25 2.25 0 0 0-1.883 2.542l.857 6a2.25 2.25 0 0 0 2.227 1.932H19.05a2.25 2.25 0 0 0 2.227-1.932l.857-6a2.25 2.25 0 0 0-1.883-2.542m-16.5 0V6A2.25 2.25 0 0 1 6 3.75h3.879a1.5 1.5 0 0 1 1.06.44l2.122 2.12a1.5 1.5 0 0 0 1.06.44H18A2.25 2.25 0 0 1 20.25 6v.776" />
                        </svg>
                        <span className="text-sm">Chưa có dữ liệu</span>
                    </div>
                ) : (
                    <>
                        {filteredRecords.map((record) => {
                            const tag = getTag(record.tagId);
                            // Border color: if tag exists use tag color, else transparent
                            const borderColor = tag ? tag.color : 'transparent';
                            // Badge color: if tag exists use tag color, else use theme color (fallback)
                            const badgeColor = tag ? tag.color : themeHex;

                            return (
                                <div 
                                    key={record.id} 
                                    className="relative rounded-2xl bg-white border border-slate-100 hover:border-slate-300 transition-all group overflow-visible p-3 sm:p-4 flex items-center justify-between gap-3 sm:gap-4"
                                    style={{ 
                                        borderLeftWidth: '6px', 
                                        borderLeftColor: borderColor,
                                        borderColor: tag ? undefined : '#f1f5f9'
                                    }}
                                >
                                    {/* Note Badge - Absolute Positioned */}
                                    {record.note && (
                                        <div 
                                            className="absolute -top-2.5 right-4 px-2 py-0.5 rounded-full text-[10px] font-bold text-white shadow-sm z-10 max-w-[120px] truncate"
                                            style={{ backgroundColor: badgeColor }}
                                        >
                                            {record.note}
                                        </div>
                                    )}

                                    {/* --- LEFT SIDE: Money Info & Date/Type --- */}
                                    {/* Mobile: Flex Col (Stack), Desktop: Flex Row */}
                                    <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 sm:gap-4 flex-1">
                                        
                                        {/* Money Info (Highlighted - GREEN) */}
                                        <div className="flex flex-col items-start gap-1">
                                            <span className="text-[10px] text-emerald-600 font-bold uppercase tracking-wider">Thực nhận</span>
                                            
                                            <div className="px-3 py-1.5 rounded-xl bg-emerald-50 border border-emerald-100 flex items-center gap-2 shadow-sm">
                                                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5 text-emerald-500">
                                                    <path d="M10.464 8.746c.227-.18.497-.311.786-.394v2.795a2.252 2.252 0 0 1-.786-.393c-.394-.313-.546-.681-.546-1.004 0-.324.152-.692.546-1.004ZM12.75 15.662v-2.824c.347.085.664.228.921.421.427.32.579.686.579.991 0 .305-.152.671-.579.991a2.534 2.534 0 0 1-.921.42Z" />
                                                    <path fillRule="evenodd" d="M12 2.25c-5.385 0-9.75 4.365-9.75 9.75s4.365 9.75 9.75 9.75 9.75-4.365 9.75-9.75S17.385 2.25 12 2.25ZM12.75 6a.75.75 0 0 0-1.5 0v.816a3.836 3.836 0 0 0-1.72.756c-.712.566-1.112 1.35-1.112 2.178 0 .829.4 1.612 1.113 2.178.502.4 1.102.647 1.719.756v2.978a2.536 2.536 0 0 1-.921-.421l-.879-.66a.75.75 0 0 0-.9 1.2l.879.66c.533.4 1.169.645 1.821.75V18a.75.75 0 0 0 1.5 0v-.81a4.124 4.124 0 0 0 1.821-.749c.745-.559 1.179-1.344 1.179-2.191 0-.847-.434-1.632-1.179-2.191a4.122 4.122 0 0 0-1.821-.75V8.354c.29.082.559.213.786.393l.415.33a.75.75 0 0 0 .933-1.175l-.415-.33a3.836 3.836 0 0 0-1.719-.755V6Z" clipRule="evenodd" />
                                                </svg>
                                                <span className="text-2xl sm:text-3xl font-black text-emerald-600 tracking-tight leading-none whitespace-nowrap">
                                                    {formatCurrency(record.netIncome, 'vi-VN', 'VND')}
                                                </span>
                                            </div>
                                            
                                            <div className="flex items-center gap-1.5 opacity-80 mt-0.5 ml-1 whitespace-nowrap">
                                                <span className="text-[9px] font-bold text-slate-400 uppercase">Doanh thu:</span>
                                                <span className="text-sm font-bold text-slate-600">
                                                    {formatCurrency(record.totalRevenue, 'vi-VN', 'VND')}
                                                </span>
                                            </div>
                                        </div>

                                        {/* Date & Type */}
                                        <div className="flex flex-col items-start gap-1.5 pl-0 sm:pl-4 border-l-0 sm:border-l border-slate-100">
                                            <div className="flex items-center gap-1 text-slate-400 whitespace-nowrap">
                                                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-3.5 h-3.5 shrink-0">
                                                    <path fillRule="evenodd" d="M5.75 2a.75.75 0 0 1 .75.75V4h7V2.75a.75.75 0 0 1 1.5 0V4h.25A2.75 2.75 0 0 1 18 6.75v8.5A2.75 2.75 0 0 1 15.25 18H4.75A2.75 2.75 0 0 1 2 15.25v-8.5A2.75 2.75 0 0 1 4.75 4H5V2.75A.75.75 0 0 1 5.75 2Zm-1 5.5c-.69 0-1.25.56-1.25 1.25v6.5c0 .69.56 1.25 1.25 1.25h10.5c.69 0 1.25-.56 1.25-1.25v-6.5c0-.69-.56-1.25-1.25-1.25H4.75Z" clipRule="evenodd" />
                                                </svg>
                                                <span className="text-xs font-bold uppercase">
                                                    {new Date(record.timestamp).toLocaleString('vi-VN', { 
                                                        day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' 
                                                    })}
                                                </span>
                                            </div>
                                            <span className={`text-[10px] px-2 py-0.5 rounded font-bold uppercase tracking-wider whitespace-nowrap
                                                ${record.shareType === 'all' ? 'bg-primary-50 text-primary-600' : 
                                                  record.shareType === 'cv' ? 'bg-purple-100 text-purple-600' : 
                                                  'bg-orange-100 text-orange-600'}
                                            `}>
                                                {getShareLabel(record.shareType)}
                                            </span>
                                        </div>
                                    </div>

                                    {/* --- RIGHT SIDE: Buttons (Delete is Red) --- */}
                                    <div className="flex flex-col gap-1.5 border-l border-slate-100 pl-2 sm:pl-3 shrink-0">
                                        <button 
                                            onClick={() => openEditModal(record)}
                                            className="flex items-center justify-center p-2 rounded-lg text-slate-400 hover:bg-indigo-50 hover:text-indigo-600 transition-colors bg-slate-50 border border-slate-100"
                                            title="Ghi chú & Gắn thẻ"
                                        >
                                            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-4 h-4">
                                                <path strokeLinecap="round" strokeLinejoin="round" d="M16.862 4.487 1.687 1.688a1.875 1.875 0 1 1 2.652 2.652L10.582 16.07a4.5 4.5 0 0 1-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 0 1 1.13-1.897l8.932-8.931Zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0 1 15.75 21H5.25A2.25 2.25 0 0 1 3 18.75V8.25A2.25 2.25 0 0 1 5.25 6H10" />
                                            </svg>
                                        </button>
                                        
                                        <button 
                                            onClick={() => openDeleteModal(record.id)}
                                            className="flex items-center justify-center p-2 rounded-lg text-red-400 bg-red-50 hover:bg-red-100 hover:text-red-600 transition-colors border border-red-100"
                                            title="Xóa bản ghi"
                                        >
                                            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-4 h-4">
                                                <path strokeLinecap="round" strokeLinejoin="round" d="m14.74 9-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 0 1-2.244 2.077H8.084a2.25 2.25 0 0 1-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 0 0-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 0 1 3.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 0 0-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 0 0-7.5 0" />
                                            </svg>
                                        </button>
                                    </div>
                                </div>
                            )
                        })}
                    </>
                )}
            </div>
       </div>

       {/* Edit Note Modal - Global Blur */}
       {editingId && createPortal(
           <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4">
                {/* Global Blur Backdrop */}
                <div 
                    className="absolute inset-0 bg-slate-900/60 backdrop-blur-xl transition-opacity duration-300" 
                    onClick={closeModal}
                ></div>
                
                <div 
                    ref={modalRef} 
                    className={`bg-white rounded-2xl shadow-2xl w-full max-w-sm relative z-10 p-5 flex flex-col gap-4 border border-white/60
                        ${isModalClosing ? 'animate-smooth-out' : 'animate-smooth-in'}
                    `}
                    style={{ animationFillMode: 'forwards' }}
                >
                    <h3 className="text-lg font-bold text-slate-800">Thêm ghi chú & Thẻ</h3>
                    
                    <div>
                        <label className="block text-xs font-bold text-slate-500 uppercase mb-2">Chọn thẻ phân loại</label>
                        <div className="flex flex-wrap gap-2">
                            <button
                                onClick={() => setTempTagId('')}
                                className={`px-3 py-1.5 rounded-lg text-xs font-bold border transition-all ${!tempTagId ? 'bg-slate-800 text-white border-slate-800' : 'bg-white border-slate-200 text-slate-500'}`}
                            >
                                Không dùng
                            </button>
                            {tags.map(tag => (
                                <button
                                    key={tag.id}
                                    onClick={() => setTempTagId(tag.id)}
                                    className={`px-3 py-1.5 rounded-lg text-xs font-bold border transition-all flex items-center gap-1.5 ${tempTagId === tag.id ? 'ring-2 ring-offset-1' : ''}`}
                                    style={{ 
                                        backgroundColor: tempTagId === tag.id ? tag.color : 'white',
                                        color: tempTagId === tag.id ? 'white' : 'gray',
                                        borderColor: tag.color,
                                        '--tw-ring-color': tag.color
                                    } as React.CSSProperties}
                                >
                                    {tempTagId !== tag.id && <span className="w-2 h-2 rounded-full" style={{backgroundColor: tag.color}}></span>}
                                    {tag.name}
                                </button>
                            ))}
                        </div>
                    </div>

                    <div>
                        <label className="block text-xs font-bold text-slate-500 uppercase mb-2">Nội dung ghi chú ngắn (Badge)</label>
                        <input 
                            type="text" 
                            className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-white focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 text-sm font-medium transition-all"
                            placeholder="VD: Đã thanh toán..."
                            value={tempNote}
                            onChange={(e) => setTempNote(e.target.value)}
                            maxLength={20} 
                        />
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

       {/* Delete Confirmation Modal - Global Blur */}
       {deleteId && createPortal(
           <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4">
               {/* Global Blur Backdrop */}
               <div 
                    className={`absolute inset-0 bg-slate-900/60 backdrop-blur-xl transition-opacity duration-300 ${isModalClosing ? 'opacity-0' : 'opacity-100'}`} 
                    onClick={closeModal}
               ></div>
               <div 
                    ref={modalRef}
                    className={`bg-white rounded-2xl shadow-2xl p-6 w-full max-w-sm relative z-10 border border-white/60
                        ${isModalClosing ? 'animate-smooth-out' : 'animate-smooth-in'}
                    `}
                    style={{ animationFillMode: 'forwards' }}
               >
                  <div className="text-center mb-6">
                      <div className="w-14 h-14 bg-red-50 rounded-full flex items-center justify-center mx-auto mb-4 text-red-500 ring-4 ring-red-50">
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-7 h-7">
                            <path strokeLinecap="round" strokeLinejoin="round" d="m14.74 9-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 0 1-2.244 2.077H8.084a2.25 2.25 0 0 1-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 0 0-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 0 1 3.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 0 0-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 0 0-7.5 0" />
                        </svg>
                      </div>
                      <h4 className="text-xl font-bold text-slate-800 mb-2">Xóa bản ghi này?</h4>
                      <p className="text-slate-500 text-sm">
                          Hành động này không thể hoàn tác. Dữ liệu doanh thu này sẽ bị xóa vĩnh viễn khỏi thống kê.
                      </p>
                  </div>
                  <div className="flex gap-3">
                      <button 
                        onClick={closeModal}
                        className="flex-1 py-3 rounded-xl font-bold text-slate-600 bg-slate-100 hover:bg-slate-200 transition-colors"
                      >
                          Hủy bỏ
                      </button>
                      <button 
                        onClick={confirmDelete}
                        className="flex-1 py-3 rounded-xl font-bold text-white bg-red-500 hover:bg-red-600 transition-colors shadow-lg shadow-red-200"
                      >
                          Xóa ngay
                      </button>
                  </div>
               </div>
           </div>,
           document.body
       )}
       <style>{`
            @keyframes smoothIn {
                0% { opacity: 0; transform: scale(0.95) translateY(10px); }
                100% { opacity: 1; transform: scale(1) translateY(0); }
            }
            @keyframes smoothOut {
                0% { opacity: 1; transform: scale(1) translateY(0); }
                100% { opacity: 0; transform: scale(0.95) translateY(10px); }
            }
            .animate-smooth-in {
                animation: smoothIn 0.3s cubic-bezier(0.16, 1, 0.3, 1);
            }
            .animate-smooth-out {
                animation: smoothOut 0.2s cubic-bezier(0.16, 1, 0.3, 1);
            }
       `}</style>
    </div>
  );
};
