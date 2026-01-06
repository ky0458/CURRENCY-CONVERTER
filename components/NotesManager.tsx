import React, { useState, useRef, useEffect, useCallback } from 'react';
import { useNotes } from '../hooks/useNotes';
import { NoteStatus, NoteTag } from '../types';

export const NotesManager: React.FC = () => {
  const { notes, tags, addNote, updateNoteStatus, deleteNote, deleteNotes, addTag, deleteTag, toggleTagPin } = useNotes();
  const [isOpen, setIsOpen] = useState(false);
  const [isClosing, setIsClosing] = useState(false); // Modal closing state
  
  // View Mode: 'list' (default), 'add-note', 'add-tag'
  const [viewMode, setViewMode] = useState<'list' | 'add-note' | 'add-tag'>('list');
  const [isSubViewClosing, setIsSubViewClosing] = useState(false); // Sub-view closing state
  const [activeTab, setActiveTab] = useState<string>('all'); 
  
  // Selection & Delete State
  const [isSelectionMode, setIsSelectionMode] = useState(false);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [confirmDelete, setConfirmDelete] = useState<{ isOpen: boolean, ids: string[] }>({ isOpen: false, ids: [] });
  
  // Gesture Selection Refs
  const longPressTimerRef = useRef<number | null>(null);
  const isDragSelectingRef = useRef(false);
  const startPosRef = useRef<{ x: number, y: number } | null>(null);
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const selectionSetRef = useRef<Set<string>>(new Set()); // Mirror state for ref access in event handlers
  
  // Add Note State
  const [newNoteContent, setNewNoteContent] = useState('');
  const [selectedTagForNewNote, setSelectedTagForNewNote] = useState<string>('');
  const [isTagDropdownOpen, setIsTagDropdownOpen] = useState(false);
  const tagDropdownRef = useRef<HTMLDivElement>(null);
  
  // Create Tag State
  const [newTagName, setNewTagName] = useState('');
  const [newTagColor, setNewTagColor] = useState('#3b82f6');

  // Handle outside click for Tag Dropdown
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
        if (tagDropdownRef.current && !tagDropdownRef.current.contains(event.target as Node)) {
            setIsTagDropdownOpen(false);
        }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Sync ref with state
  useEffect(() => {
      selectionSetRef.current = selectedIds;
  }, [selectedIds]);

  const filteredNotes = activeTab === 'all' 
    ? notes 
    : notes.filter(n => n.tagId === activeTab);

  const getTag = (id: string | null) => tags.find(t => t.id === id);

  const handleClose = () => {
    setIsClosing(true);
    setTimeout(() => {
        setIsOpen(false);
        setIsClosing(false);
        setIsSelectionMode(false);
        // Reset view mode on close if desired, or keep state. 
        // Resetting to list ensures fresh start next open.
        setViewMode('list'); 
    }, 300); // Match animation duration
  };

  const handleBackToMain = () => {
    setIsSubViewClosing(true);
    setTimeout(() => {
        setViewMode('list');
        setIsSubViewClosing(false);
    }, 300);
  };

  const handleAddNote = () => {
    if (!newNoteContent.trim()) return;
    addNote(newNoteContent, selectedTagForNewNote || null);
    setNewNoteContent('');
    setSelectedTagForNewNote('');
    handleBackToMain();
  };

  const handleCreateTag = () => {
    if (!newTagName.trim()) return;
    addTag(newTagName, newTagColor);
    setNewTagName('');
    setNewTagColor('#3b82f6');
    handleBackToMain();
  };

  // Selection Logic
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
      if (viewMode !== 'list' || confirmDelete.isOpen) return;
      
      // If already in selection mode, let the click handler deal with toggling
      // But we still track pointer for potential drag-select extension (optional, keeping simple for now)
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
            const noteItem = element?.closest('[data-note-id]');
            
            if (noteItem) {
                const noteId = noteItem.getAttribute('data-note-id');
                if (noteId && !selectionSetRef.current.has(noteId)) {
                    // Add to selection
                    setSelectedIds(prev => new Set(prev).add(noteId));
                    if (navigator.vibrate) navigator.vibrate(10); // Tiny feedback
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

  const handleDeleteClick = (ids: string[]) => {
      setConfirmDelete({ isOpen: true, ids });
  };

  const performDelete = () => {
      deleteNotes(confirmDelete.ids);
      setConfirmDelete({ isOpen: false, ids: [] });
      
      // If we were in selection mode, clear selection
      if (isSelectionMode) {
          setSelectedIds(new Set());
          if (filteredNotes.length === confirmDelete.ids.length) {
               setIsSelectionMode(false);
          }
      }
  };

  // Config màu sắc
  const statusConfig: Record<NoteStatus, { label: string, badgeClass: string, borderClass: string, containerClass: string, icon: React.ReactNode }> = {
    incomplete: { 
      label: 'Chưa xong', 
      badgeClass: 'text-red-600 bg-red-100',
      borderClass: 'border-red-500', 
      containerClass: 'bg-red-50/30',
      icon: <div className="w-2 h-2 rounded-full bg-red-500" />
    },
    attention: { 
      label: 'Chú ý', 
      badgeClass: 'text-amber-600 bg-amber-100',
      borderClass: 'border-amber-500', 
      containerClass: 'bg-amber-50/30',
      icon: <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-3 h-3 text-amber-500"><path fillRule="evenodd" d="M18 10a8 8 0 1 1-16 0 8 8 0 0 1 16 0Zm-8-5a.75.75 0 0 1 .75.75v4.5a.75.75 0 0 1-1.5 0v-4.5A.75.75 0 0 1 10 5Zm0 10a1 1 0 1 0 0-2 1 1 0 0 0 0 2Z" clipRule="evenodd" /></svg>
    },
    completed: { 
      label: 'Hoàn thành', 
      badgeClass: 'text-emerald-600 bg-emerald-100',
      borderClass: 'border-emerald-500', 
      containerClass: 'bg-emerald-50/30',
      icon: <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-3 h-3 text-emerald-500"><path fillRule="evenodd" d="M16.704 4.153a.75.75 0 0 1 .143 1.052l-8 10.5a.75.75 0 0 1-1.127.075l-4.5-4.5a.75.75 0 0 1 1.06-1.06l3.894 3.893 7.48-9.817a.75.75 0 0 1 1.05-.143Z" clipRule="evenodd" /></svg>
    },
    skipped: { 
      label: 'Bỏ qua', 
      badgeClass: 'text-slate-500 bg-slate-200',
      borderClass: 'border-slate-400', 
      containerClass: 'bg-slate-100/50 opacity-75',
      icon: <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-3 h-3 text-slate-500"><path d="M6.28 5.22a.75.75 0 0 0-1.06 1.06L8.94 10l-3.72 3.72a.75.75 0 1 0 1.06 1.06L10 11.06l3.72 3.72a.75.75 0 1 0 1.06-1.06L11.06 10l3.72-3.72a.75.75 0 0 0-1.06-1.06L10 8.94 6.28 5.22Z" /></svg>
    },
  };

  const renderHeader = () => (
    <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between bg-white/80 backdrop-blur-md sticky top-0 z-20 shrink-0 rounded-t-3xl">
        {isSelectionMode ? (
            <div className="flex items-center gap-3">
                <button 
                    onClick={toggleSelectionMode} 
                    className="p-1 px-3 bg-slate-100 rounded-lg text-xs font-bold text-slate-600 hover:bg-slate-200 transition-colors"
                >
                    Hủy
                </button>
                <h3 className="font-extrabold text-slate-800 text-lg">
                    Đã chọn {selectedIds.size}
                </h3>
            </div>
        ) : (
            <div className="flex items-center gap-3">
                {viewMode !== 'list' && (
                    <button onClick={handleBackToMain} className="p-1 -ml-2 rounded-full hover:bg-slate-100 text-slate-500 transition-colors">
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-5 h-5">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5 8.25 12l7.5-7.5" />
                        </svg>
                    </button>
                )}
                <h3 className="font-extrabold text-slate-800 text-lg flex items-center gap-2">
                    {viewMode === 'list' && <>Ghi chú <span className="text-xs font-normal bg-slate-200 text-slate-600 px-2 py-0.5 rounded-full">{notes.length}</span></>}
                    {viewMode === 'add-note' && 'Thêm ghi chú'}
                    {viewMode === 'add-tag' && 'Thêm thẻ mới'}
                </h3>
            </div>
        )}
        
        <div className="flex items-center gap-2">
            {!isSelectionMode && viewMode === 'list' && (
                <>
                <button 
                    onClick={() => setViewMode('add-tag')}
                    className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-indigo-600 bg-indigo-50 hover:bg-indigo-100 rounded-lg transition-colors border border-indigo-100 whitespace-nowrap"
                    title="Quản lý phân loại"
                >
                   <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-3.5 h-3.5">
                        <path d="M12.232 4.232a2.5 2.5 0 0 1 3.536 3.536l-1.225 1.224a.75.75 0 0 0 1.061 1.06l1.224-1.224a4 4 0 0 0-5.656-5.656l-3 3a4 4 0 0 0 .225 5.865.75.75 0 0 0 .977-1.138 2.5 2.5 0 0 1-.142-3.667l3-3Z" />
                        <path d="M11.603 7.963a.75.75 0 0 0-.977 1.138 2.5 2.5 0 0 1 .142 3.667l-3 3a2.5 2.5 0 0 1-3.536-3.536l1.225-1.224a.75.75 0 0 0-1.061-1.06l-1.224 1.224a4 4 0 1 0 5.656 5.656l3-3a4 4 0 0 0-.225-5.865Z" />
                   </svg>
                   <span>Phân loại</span>
                </button>
                <button 
                    onClick={() => setViewMode('add-note')}
                    className="flex items-center gap-1.5 px-3 py-1.5 text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg shadow-md shadow-indigo-200 transition-colors text-xs font-bold whitespace-nowrap"
                    title="Viết ghi chú mới"
                >
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-3.5 h-3.5">
                        <path d="M10.75 4.75a.75.75 0 0 0-1.5 0v4.5h-4.5a.75.75 0 0 0 0 1.5h4.5v4.5a.75.75 0 0 0 1.5 0v-4.5h4.5a.75.75 0 0 0 0-1.5h-4.5v-4.5Z" />
                    </svg>
                    <span>Viết ghi chú</span>
                </button>
                </>
            )}
            
            <button 
                onClick={handleClose}
                className="p-1.5 rounded-full hover:bg-slate-100 text-slate-400 hover:text-red-500 transition-colors ml-1"
            >
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-5 h-5">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" />
                </svg>
            </button>
        </div>
    </div>
  );

  return (
    <>
      {/* Floating Trigger Button */}
      <div className="fixed bottom-6 left-6 z-[60]">
        <button
          onClick={() => {
              if(isOpen) handleClose();
              else setIsOpen(true);
          }}
          className={`w-14 h-14 rounded-full shadow-2xl flex items-center justify-center transition-all duration-300 hover:scale-110 active:scale-95 border-2 border-white/50 backdrop-blur-md
            ${isOpen ? 'bg-slate-800 text-white rotate-90 scale-90' : 'bg-gradient-to-br from-indigo-500 to-purple-600 text-white animate-bounce-slow'}
          `}
        >
          {isOpen ? (
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-6 h-6">
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" />
            </svg>
          ) : (
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-7 h-7">
               <path strokeLinecap="round" strokeLinejoin="round" d="m16.862 4.487 1.687-1.688a1.875 1.875 0 1 1 2.652 2.652L10.582 16.07a4.5 4.5 0 0 1-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 0 1 1.13-1.897l8.932-8.931Zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0 1 15.75 21H5.25A2.25 2.25 0 0 1 3 18.75V8.25A2.25 2.25 0 0 1 5.25 6H10" />
            </svg>
          )}
        </button>
      </div>

      {/* Centered Modal Overlay */}
      {isOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
             {/* Backdrop */}
             <div 
                className={`absolute inset-0 bg-black/40 backdrop-blur-sm transition-opacity duration-300 ${isClosing ? 'opacity-0' : 'opacity-100 animate-fade-in-up'}`}
                onClick={handleClose}
            />
             
             {/* Modal Content */}
             <div 
                className={`bg-white/95 backdrop-blur-xl w-full max-w-lg rounded-3xl shadow-2xl overflow-hidden flex flex-col relative z-10 origin-center border border-white/60
                    ${isClosing ? 'animate-fade-out-down' : 'animate-fade-in-up'}
                `}
                style={{
                    maxHeight: '85dvh', // Dynamic height for mobile keyboards
                    animationDuration: '0.3s'
                }}
             >
                {renderHeader()}

                <div className="flex-1 overflow-hidden flex flex-col min-h-0 relative" ref={scrollContainerRef}>
                    {/* --- VIEW: ADD TAG --- */}
                    {viewMode === 'add-tag' && (
                        <div className={`p-5 flex flex-col gap-4 overflow-y-auto custom-scrollbar ${isSubViewClosing ? 'animate-fade-out-down' : 'animate-fade-in-up'}`}>
                            <div>
                                <label className="block text-xs font-bold text-slate-500 uppercase mb-2">Tên thẻ mới</label>
                                <input 
                                    type="text" 
                                    placeholder="Ví dụ: Mua sắm, Deadline..." 
                                    className="w-full text-sm px-4 py-3 rounded-xl border border-slate-200 focus:outline-none focus:border-indigo-500 bg-slate-50 focus:bg-white transition-all"
                                    value={newTagName}
                                    onChange={(e) => setNewTagName(e.target.value)}
                                    autoFocus
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-slate-500 uppercase mb-2">Chọn màu nhận diện</label>
                                <div className="flex items-center gap-3">
                                    <input 
                                        type="color" 
                                        className="w-14 h-14 rounded-xl cursor-pointer border-2 border-white shadow-sm"
                                        value={newTagColor}
                                        onChange={(e) => setNewTagColor(e.target.value)}
                                    />
                                    <span className="text-sm font-mono bg-slate-100 px-3 py-1 rounded text-slate-600">{newTagColor}</span>
                                </div>
                            </div>
                            <div className="mt-4 flex gap-3 pb-2">
                                <button 
                                    onClick={handleBackToMain}
                                    className="flex-1 py-3.5 bg-slate-100 hover:bg-slate-200 text-slate-600 text-sm font-bold rounded-xl transition-colors"
                                >
                                    Hủy
                                </button>
                                <button 
                                    onClick={handleCreateTag}
                                    className="flex-1 py-3.5 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-bold rounded-xl transition-colors shadow-lg shadow-indigo-200"
                                >
                                    Tạo thẻ
                                </button>
                            </div>
                        </div>
                    )}

                    {/* --- VIEW: ADD NOTE --- */}
                    {viewMode === 'add-note' && (
                        <div className={`p-5 flex flex-col gap-5 flex-1 h-full overflow-y-auto custom-scrollbar ${isSubViewClosing ? 'animate-fade-out-down' : 'animate-fade-in-up'}`}>
                            {/* Flex-col with gap ensures label and textarea don't overlap */}
                            <div className="flex-1 flex flex-col gap-2 min-h-[150px]">
                                <label className="block text-xs font-bold text-slate-500 uppercase">Nội dung ghi chú</label>
                                <textarea 
                                    className="w-full flex-1 bg-slate-50 border border-slate-200 rounded-xl p-4 text-sm focus:outline-none focus:border-indigo-500 focus:bg-white transition-all resize-none shadow-inner"
                                    placeholder="Nhập nội dung ghi chú của bạn..."
                                    value={newNoteContent}
                                    onChange={(e) => setNewNoteContent(e.target.value)}
                                    autoFocus
                                />
                            </div>
                            
                            {/* Custom Tag Dropdown */}
                            <div className="relative shrink-0" ref={tagDropdownRef}>
                                <label className="block text-xs font-bold text-slate-500 uppercase mb-2">Phân loại thẻ</label>
                                <button
                                    onClick={() => setIsTagDropdownOpen(!isTagDropdownOpen)}
                                    className={`w-full flex items-center justify-between px-4 py-3 rounded-xl border bg-white transition-all ${isTagDropdownOpen ? 'border-indigo-500 ring-2 ring-indigo-50' : 'border-slate-200 hover:border-slate-300'}`}
                                >
                                    {selectedTagForNewNote ? (
                                        <div className="flex items-center gap-2">
                                            <span className="w-3 h-3 rounded-full" style={{ backgroundColor: getTag(selectedTagForNewNote)?.color }}></span>
                                            <span className="text-sm font-semibold text-slate-700">{getTag(selectedTagForNewNote)?.name}</span>
                                        </div>
                                    ) : (
                                        <span className="text-sm text-slate-400">Chọn thẻ...</span>
                                    )}
                                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-4 h-4 text-slate-400">
                                        <path strokeLinecap="round" strokeLinejoin="round" d="m19.5 8.25-7.5 7.5-7.5-7.5" />
                                    </svg>
                                </button>

                                {isTagDropdownOpen && (
                                    <div className="absolute bottom-full left-0 w-full mb-2 bg-white rounded-xl shadow-xl border border-slate-100 overflow-hidden z-20 animate-fade-in-up">
                                        <div className="max-h-40 overflow-y-auto custom-scrollbar p-1">
                                            <button
                                                onClick={() => { setSelectedTagForNewNote(''); setIsTagDropdownOpen(false); }}
                                                className="w-full text-left px-3 py-2 text-sm text-slate-600 hover:bg-slate-50 rounded-lg font-medium"
                                            >
                                                Mặc định (Không thẻ)
                                            </button>
                                            {tags.map(tag => (
                                                <button
                                                    key={tag.id}
                                                    onClick={() => { setSelectedTagForNewNote(tag.id); setIsTagDropdownOpen(false); }}
                                                    className="w-full flex items-center gap-2 px-3 py-2 hover:bg-slate-50 rounded-lg transition-colors"
                                                >
                                                    <span className="w-3 h-3 rounded-full shrink-0" style={{ backgroundColor: tag.color }}></span>
                                                    <span className="text-sm font-semibold text-slate-700">{tag.name}</span>
                                                </button>
                                            ))}
                                        </div>
                                    </div>
                                )}
                            </div>

                            <div className="flex gap-3 mt-2 shrink-0">
                                <button 
                                    onClick={handleBackToMain}
                                    className="flex-1 py-3.5 bg-slate-100 hover:bg-slate-200 text-slate-600 text-sm font-bold rounded-xl transition-colors"
                                >
                                    Hủy
                                </button>
                                <button 
                                    onClick={handleAddNote}
                                    disabled={!newNoteContent.trim()}
                                    className={`flex-1 py-3.5 text-white text-sm font-bold rounded-xl transition-colors shadow-lg
                                        ${newNoteContent.trim() ? 'bg-indigo-600 hover:bg-indigo-700 shadow-indigo-200' : 'bg-slate-300 cursor-not-allowed'}
                                    `}
                                >
                                    Lưu ghi chú
                                </button>
                            </div>
                        </div>
                    )}

                    {/* --- VIEW: LIST --- */}
                    {viewMode === 'list' && (
                        <div className="flex flex-col h-full overflow-hidden animate-fade-in-up">
                            {/* Filter Tabs */}
                            <div className="px-5 py-3 flex gap-2 overflow-x-auto custom-scrollbar no-scrollbar-on-mobile border-b border-slate-100/50 bg-slate-50/50 shrink-0">
                                <button
                                    onClick={() => setActiveTab('all')}
                                    className={`px-4 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all shadow-sm
                                        ${activeTab === 'all' 
                                            ? 'bg-slate-800 text-white shadow-md transform scale-105' 
                                            : 'bg-white text-slate-500 hover:bg-slate-50 border border-slate-100'}
                                    `}
                                >
                                    Tất cả
                                </button>
                                {tags.map(tag => (
                                    <div 
                                        key={tag.id} 
                                        className={`
                                            flex items-center rounded-xl border shadow-sm transition-all overflow-hidden relative
                                            ${activeTab === tag.id ? 'border-transparent shadow-md transform scale-105' : 'bg-white border-slate-100 hover:border-slate-200'}
                                        `}
                                        style={{ 
                                            backgroundColor: activeTab === tag.id ? tag.color : 'white',
                                            color: activeTab === tag.id ? 'white' : undefined,
                                        }}
                                    >
                                        <button
                                            onClick={() => setActiveTab(tag.id)}
                                            className={`pl-3 pr-3 py-2 text-xs font-bold whitespace-nowrap flex items-center gap-1.5 h-full ${activeTab !== tag.id ? 'text-slate-600' : ''}`}
                                        >
                                            <span className={`w-1.5 h-1.5 rounded-full ${activeTab === tag.id ? 'bg-white' : ''}`} style={{ backgroundColor: activeTab === tag.id ? undefined : tag.color }} />
                                            {tag.name}
                                        </button>
                                        
                                        {/* Actions - Only visible when active */}
                                        {activeTab === tag.id && (
                                            <div className="flex items-center h-full">
                                                <div className="h-4 w-px bg-white/30"></div>
                                                <button 
                                                    onClick={(e) => { e.stopPropagation(); toggleTagPin(tag.id); }}
                                                    className="px-2 py-2 h-full flex items-center justify-center transition-colors hover:bg-black/10"
                                                    title={tag.isPinned ? "Bỏ ghim" : "Ghim thẻ"}
                                                >
                                                    {tag.isPinned ? (
                                                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-3.5 h-3.5">
                                                            <path fillRule="evenodd" d="M11.47 2.47a.75.75 0 0 1 1.06 0l4.5 4.5a.75.75 0 0 1-1.06 1.06l-4.5-4.5a.75.75 0 0 1 0-1.06Zm-5 5a.75.75 0 0 1 1.06 0l4.5 4.5a.75.75 0 0 1-1.06 1.06l-4.5-4.5a.75.75 0 0 1 0-1.06Z" clipRule="evenodd" />
                                                            <path d="M14.75 12.25a.75.75 0 0 0 0 1.5H16v2.25h-2.25a.75.75 0 0 0 0 1.5H16v2.5a.75.75 0 0 0 1.5 0v-2.5h2.25a.75.75 0 0 0 0-1.5H17.5V13.75h2.25a.75.75 0 0 0 0-1.5H14.75Z" opacity="0" /> 
                                                            <path fillRule="evenodd" d="M9.702 3.86a.75.75 0 0 1 .493 1.018l-1.082 3.093 5.925 5.925 3.093-1.082a.75.75 0 0 1 .937.937l-1.383 4.84a.75.75 0 0 1-1.05.474l-3.37-1.444-2.298 2.298a.75.75 0 0 1-1.06 0l-1.061-1.061a.75.75 0 0 1 0-1.061l2.298-2.298-1.444-3.37a.75.75 0 0 1 .474-1.05l4.84-1.383a.75.75 0 0 1 .494-1.018Z" clipRule="evenodd" />
                                                        </svg>
                                                    ) : (
                                                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-3.5 h-3.5 opacity-60">
                                                            <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m9-.75a9 9 0 1 1-18 0 9 9 0 0 1 18 0Zm-9 3.75h.008v.008H12v-.008Z" /> 
                                                            <path strokeLinecap="round" strokeLinejoin="round" d="m15 11.25-3-3m0 0-3 3m3-3v7.5" />
                                                        </svg>
                                                    )}
                                                </button>
                                                
                                                <div className="h-4 w-px bg-white/30"></div>
                                                <button 
                                                    onClick={(e) => { e.stopPropagation(); deleteTag(tag.id); }}
                                                    className="px-2 py-2 h-full flex items-center justify-center hover:bg-black/10 transition-colors"
                                                    title="Xóa thẻ"
                                                >
                                                    <span className="text-white font-bold leading-none text-sm">&times;</span>
                                                </button>
                                            </div>
                                        )}
                                    </div>
                                ))}
                            </div>

                            {/* Notes List */}
                            <div className="flex-1 overflow-y-auto p-4 space-y-3 custom-scrollbar bg-slate-50/30 pb-20">
                                {filteredNotes.length === 0 ? (
                                    <div className="h-full flex flex-col items-center justify-center text-slate-400 opacity-60 min-h-[200px]">
                                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-12 h-12 mb-2">
                                            <path strokeLinecap="round" strokeLinejoin="round" d="m16.862 4.487 1.687-1.688a1.875 1.875 0 1 1 2.652 2.652L10.582 16.07a4.5 4.5 0 0 1-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 0 1 1.13-1.897l8.932-8.931Zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0 1 15.75 21H5.25A2.25 2.25 0 0 1 3 18.75V8.25A2.25 2.25 0 0 1 5.25 6H10" />
                                        </svg>
                                        <span className="text-sm font-medium">Chưa có ghi chú nào</span>
                                        <p className="text-xs text-slate-400 mt-2 text-center px-4">Giữ lì vào ghi chú để chọn nhiều</p>
                                    </div>
                                ) : (
                                    filteredNotes.map(note => {
                                        const tag = getTag(note.tagId);
                                        const status = statusConfig[note.status];
                                        const isSelected = selectedIds.has(note.id);
                                        const isAllTab = activeTab === 'all';
                                        
                                        return (
                                            <div 
                                                key={note.id} 
                                                data-note-id={note.id}
                                                onPointerDown={(e) => handlePointerDown(e, note.id)}
                                                onClick={() => {
                                                    if (isSelectionMode) {
                                                        handleCheckboxChange(note.id);
                                                    }
                                                }}
                                                className={`
                                                    rounded-2xl shadow-sm border border-l-[6px] group transition-all relative overflow-hidden flex items-stretch touch-manipulation select-none
                                                    ${isSelectionMode 
                                                        ? 'cursor-pointer hover:shadow-md' 
                                                        : 'hover:shadow-md'}
                                                    ${isSelectionMode && isSelected 
                                                        ? 'bg-indigo-50 border-l-indigo-500 border-indigo-200' 
                                                        : `${status.borderClass} ${status.containerClass} bg-white border-t-white/40 border-r-white/40 border-b-white/40`}
                                                `}
                                            >
                                                {/* Selection Checkbox Area */}
                                                {isSelectionMode && (
                                                    <div className="w-12 flex items-center justify-center border-r border-slate-100/50 bg-white/40">
                                                        <div className={`w-5 h-5 rounded-md border flex items-center justify-center transition-all ${isSelected ? 'bg-indigo-600 border-indigo-600' : 'bg-white border-slate-300'}`}>
                                                            {isSelected && (
                                                                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-3.5 h-3.5 text-white">
                                                                    <path fillRule="evenodd" d="M16.704 4.153a.75.75 0 0 1 .143 1.052l-8 10.5a.75.75 0 0 1-1.127.075l-4.5-4.5a.75.75 0 0 1 1.06-1.06l3.894 3.893 7.48-9.817a.75.75 0 0 1 1.05-.143Z" clipRule="evenodd" />
                                                                </svg>
                                                            )}
                                                        </div>
                                                    </div>
                                                )}
                                                
                                                {/* Category Badge for 'All' view */}
                                                {!isSelectionMode && isAllTab && tag && (
                                                    <div 
                                                        className="absolute top-0 right-0 px-3 py-1.5 rounded-bl-xl rounded-tr-2xl text-[9px] font-bold text-white shadow-sm z-[5] pointer-events-none"
                                                        style={{ backgroundColor: tag.color }}
                                                    >
                                                        {tag.name}
                                                    </div>
                                                )}

                                                <div className="flex-1 p-3">
                                                    {/* Tag & Time */}
                                                    <div className="flex justify-between items-start mb-2 relative z-10">
                                                        <div className="flex items-center gap-2">
                                                            {tag && !isAllTab && (
                                                                <span 
                                                                    className="text-[10px] px-2 py-0.5 rounded-md font-bold text-white shadow-sm" 
                                                                    style={{ backgroundColor: tag.color }}
                                                                >
                                                                    {tag.name}
                                                                </span>
                                                            )}
                                                            <span className="text-[10px] text-slate-400 font-semibold bg-white/50 px-1.5 rounded">
                                                                {new Date(note.timestamp).toLocaleTimeString('vi-VN', {hour: '2-digit', minute:'2-digit', day: '2-digit', month: '2-digit'})}
                                                            </span>
                                                        </div>
                                                        
                                                        {/* Single Delete Button (Only when not in selection mode) */}
                                                        {!isSelectionMode && (
                                                            <button 
                                                                onClick={(e) => { e.stopPropagation(); handleDeleteClick([note.id]); }}
                                                                className={`text-slate-300 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity bg-white/80 p-1 rounded-full hover:bg-red-50 ${isAllTab ? 'mt-5 mr-1' : ''}`}
                                                                title="Xóa ghi chú"
                                                            >
                                                                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4"><path d="M6.28 5.22a.75.75 0 0 0-1.06 1.06L8.94 10l-3.72 3.72a.75.75 0 1 0 1.06 1.06L10 11.06l3.72 3.72a.75.75 0 1 0 1.06-1.06L11.06 10l3.72-3.72a.75.75 0 0 0-1.06-1.06L10 8.94 6.28 5.22Z" /></svg>
                                                            </button>
                                                        )}
                                                    </div>
                                                    
                                                    <p className="text-sm text-slate-800 font-medium mb-3 whitespace-pre-wrap leading-relaxed relative z-10">
                                                        {note.content}
                                                    </p>

                                                    {/* Status Actions (Disabled in selection mode) */}
                                                    <div className={`flex gap-1 overflow-x-auto no-scrollbar-on-mobile pb-1 relative z-10 ${isSelectionMode ? 'pointer-events-none opacity-60' : ''}`}>
                                                        {(Object.keys(statusConfig) as NoteStatus[]).map((s) => (
                                                            <button
                                                                key={s}
                                                                onClick={(e) => { e.stopPropagation(); updateNoteStatus(note.id, s); }}
                                                                className={`
                                                                    flex items-center gap-1 px-2 py-1 rounded-lg text-[10px] font-bold border transition-all whitespace-nowrap
                                                                    ${note.status === s 
                                                                        ? `${statusConfig[s].badgeClass} border-transparent shadow-sm ring-1 ring-black/5` 
                                                                        : 'bg-white/60 border-transparent text-slate-400 hover:bg-white hover:text-slate-600'}
                                                                `}
                                                            >
                                                                {note.status === s ? statusConfig[s].icon : null}
                                                                {statusConfig[s].label}
                                                            </button>
                                                        ))}
                                                    </div>
                                                </div>
                                            </div>
                                        );
                                    })
                                )}
                            </div>
                            
                            {/* Floating Bulk Delete Action */}
                            {isSelectionMode && (
                                <div className="absolute bottom-0 left-0 right-0 p-4 bg-white border-t border-slate-200 shadow-lg z-30 animate-fade-in-up">
                                    <button
                                        onClick={() => handleDeleteClick(Array.from(selectedIds))}
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
                                        Xóa {selectedIds.size} ghi chú
                                    </button>
                                </div>
                            )}
                        </div>
                    )}
                </div>
             </div>
        </div>
      )}
      
      {/* Delete Confirmation Modal */}
      {confirmDelete.isOpen && (
          <div className="fixed inset-0 z-[110] flex items-center justify-center p-4">
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
                          {confirmDelete.ids.length > 1 
                              ? `Bạn có chắc chắn muốn xóa ${confirmDelete.ids.length} ghi chú đã chọn không?`
                              : "Bạn có chắc chắn muốn xóa ghi chú này không?"
                          }
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
    </>
  );
};