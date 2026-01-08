
import React, { useState, useRef, useEffect } from 'react';
import { useNotes } from '../hooks/useNotes';
import { NoteStatus } from '../types';
import { useAuth } from '../contexts/AuthContext';
import { messaging, db } from '../firebase';
import { getToken } from 'firebase/messaging';
import { doc, setDoc, collection } from 'firebase/firestore';

const PRESET_COLORS = [
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

// Simple Loading Spinner
const LoadingSpinner = () => (
  <div className="flex flex-col items-center justify-center h-48 animate-fade-in-up">
    <div className="w-8 h-8 border-4 border-indigo-100 border-t-indigo-600 rounded-full animate-spin mb-3"></div>
    <span className="text-xs font-semibold text-indigo-400 uppercase tracking-wider animate-pulse">Đang tải...</span>
  </div>
);

export const NotesManager: React.FC = () => {
  const { notes, tags, isLoading, addNote, updateNoteStatus, deleteNote, deleteNotes, addTag, deleteTag, toggleTagPin, setNoteReminder } = useNotes();
  const { user, showNotification } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const [isClosing, setIsClosing] = useState(false); // Modal closing state
  
  // View Mode: 'list' (default), 'add-note', 'add-tag' (now acts as Manage Tags)
  const [viewMode, setViewMode] = useState<'list' | 'add-note' | 'add-tag'>('list');
  const [isSubViewClosing, setIsSubViewClosing] = useState(false); // Sub-view closing state
  
  // Filters
  const [activeTab, setActiveTab] = useState<string>('all'); 
  const [activeStatusFilter, setActiveStatusFilter] = useState<NoteStatus | 'all'>('all');
  const [isFiltering, setIsFiltering] = useState(false); // Artificial loading state for smoother UX
  
  // Selection & Delete State (Notes)
  const [isSelectionMode, setIsSelectionMode] = useState(false);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [confirmDelete, setConfirmDelete] = useState<{ isOpen: boolean, ids: string[] }>({ isOpen: false, ids: [] });

  // Delete State (Tags)
  const [tagToDelete, setTagToDelete] = useState<string | null>(null);

  // Reminder State
  const [reminderModal, setReminderModal] = useState<{ isOpen: boolean, noteId: string | null, content: string }>({ 
      isOpen: false, noteId: null, content: '' 
  });
  const [reminderTime, setReminderTime] = useState('');
  const [isScheduling, setIsScheduling] = useState(false);
  
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

  // --- DRAGGABLE BUTTON STATE ---
  const [btnPos, setBtnPos] = useState({ x: 20, y: typeof window !== 'undefined' ? window.innerHeight - 150 : 500 });
  const isDraggingBtn = useRef(false);
  const btnDragOffset = useRef({ x: 0, y: 0 });
  const btnDragStartPos = useRef({ x: 0, y: 0 });
  const hasMovedBtn = useRef(false);

  // Effect to trigger spinner on filter change
  useEffect(() => {
    if (isOpen && viewMode === 'list') {
        setIsFiltering(true);
        const timer = setTimeout(() => {
            setIsFiltering(false);
        }, 300); // 300ms delay for visual feedback
        return () => clearTimeout(timer);
    }
  }, [activeTab, activeStatusFilter, isOpen, viewMode]);

  useEffect(() => {
      // Initial position adjustment to avoid server/client mismatch
      setBtnPos({ x: 30, y: window.innerHeight - 120 });
  }, []);

  // Button Drag Handlers
  const handleBtnPointerDown = (e: React.PointerEvent) => {
    isDraggingBtn.current = true;
    hasMovedBtn.current = false;
    btnDragStartPos.current = { x: e.clientX, y: e.clientY };
    btnDragOffset.current = {
        x: e.clientX - btnPos.x,
        y: e.clientY - btnPos.y
    };
    e.currentTarget.setPointerCapture(e.pointerId);
  };

  const handleBtnPointerMove = (e: React.PointerEvent) => {
    if (!isDraggingBtn.current) return;
    e.preventDefault();
    const newX = e.clientX - btnDragOffset.current.x;
    const newY = e.clientY - btnDragOffset.current.y;
    if (!hasMovedBtn.current) {
        const dist = Math.hypot(e.clientX - btnDragStartPos.current.x, e.clientY - btnDragStartPos.current.y);
        if (dist > 6) hasMovedBtn.current = true;
    }
    if (hasMovedBtn.current) {
        setBtnPos({ x: newX, y: newY });
    }
  };

  const handleBtnPointerUp = (e: React.PointerEvent) => {
    if (!isDraggingBtn.current) return;
    isDraggingBtn.current = false;
    e.currentTarget.releasePointerCapture(e.pointerId);
    if (hasMovedBtn.current) {
        const screenWidth = window.innerWidth;
        const screenHeight = window.innerHeight;
        const buttonWidth = 56; // w-14
        let finalY = Math.max(20, Math.min(screenHeight - 80, btnPos.y));
        let finalX = btnPos.x;
        const midPoint = screenWidth / 2;
        if (btnPos.x + buttonWidth / 2 < midPoint) {
            finalX = 20; 
        } else {
            finalX = screenWidth - buttonWidth - 20;
        }
        setBtnPos({ x: finalX, y: finalY });
    }
  };

  const handleBtnClick = (e: React.MouseEvent) => {
      e.stopPropagation();
      if (hasMovedBtn.current) return;
      if (isOpen) handleClose();
      else setIsOpen(true);
  };

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

  useEffect(() => {
      selectionSetRef.current = selectedIds;
  }, [selectedIds]);

  const filteredNotes = notes.filter(n => {
      const matchesTag = activeTab === 'all' || n.tagId === activeTab;
      const matchesStatus = activeStatusFilter === 'all' || n.status === activeStatusFilter;
      return matchesTag && matchesStatus;
  });

  const getTag = (id: string | null) => tags.find(t => t.id === id);

  const handleClose = () => {
    setIsClosing(true);
    setTimeout(() => {
        setIsOpen(false);
        setIsClosing(false);
        setIsSelectionMode(false);
        setViewMode('list'); 
    }, 300);
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
  };

  const handleRequestDeleteTag = (id: string) => {
      setTagToDelete(id);
  };

  const confirmTagDeletion = () => {
      if (tagToDelete) {
          deleteTag(tagToDelete);
          if (activeTab === tagToDelete) setActiveTab('all');
          setTagToDelete(null);
      }
  };

  // Reminder Logic
  const handleOpenReminder = (note: {id: string, content: string}, e: React.MouseEvent) => {
      e.stopPropagation();
      setReminderModal({
          isOpen: true,
          noteId: note.id,
          content: note.content
      });
      // Default to 1 hour from now
      const now = new Date();
      now.setHours(now.getHours() + 1);
      
      const isoString = new Date(now.getTime() - (now.getTimezoneOffset() * 60000)).toISOString().slice(0, 16);
      setReminderTime(isoString);
  };

  const handleScheduleReminder = async () => {
      if (!reminderTime || !reminderModal.noteId) return;
      
      setIsScheduling(true);

      const targetTime = new Date(reminderTime).getTime();
      const now = Date.now();
      const delay = targetTime - now;

      if (delay <= 0) {
          showNotification("Vui lòng chọn thời gian trong tương lai.", "error");
          setIsScheduling(false);
          return;
      }

      if (!user) {
          showNotification("Vui lòng đăng nhập để sử dụng tính năng thông báo nâng cao.", "info");
          setIsScheduling(false);
          return;
      }

      try {
          // 1. Request Browser Permission
          let permission = Notification.permission;
          if (permission !== 'granted') {
              permission = await Notification.requestPermission();
          }

          if (permission !== 'granted') {
              showNotification("Bạn cần cấp quyền thông báo cho trình duyệt.", "error");
              setIsScheduling(false);
              return;
          }

          // 2. Get FCM Token
          // Use Env Var or Fallback to a placeholder that user must replace
          const vapidKey = process.env.KEY_PAIR || 'BG6fDLu4EwKMdoatFiKXcJOeT8BLhRUxkgsfkK2VKiYeh4Ol1KFRffpq5-x5lcH1hMtB7GS3pdpA2N6KtP7SIg4';
          
          if (vapidKey === 'YOUR_VAPID_KEY_HERE') {
              console.warn("VAPID Key is missing. Notifications might fail.");
          }

          const currentToken = await getToken(messaging, { 
              vapidKey: vapidKey 
          }).catch((err) => {
              console.error('An error occurred while retrieving token. ', err);
              // Handle specific error for missing key
              if (err.code === 'messaging/invalid-vapid-key') {
                  throw new Error("Cấu hình VAPID Key không hợp lệ.");
              }
              throw new Error("Không thể lấy token thông báo. Vui lòng kiểm tra cài đặt mạng.");
          });

          if (!currentToken) {
              throw new Error("Không tìm thấy token thông báo.");
          }

          // 3. Save Schedule to Firestore
          // FIX: Save under 'users/{uid}/scheduled_notifications' instead of root 'scheduled_notifications'
          // This avoids "Missing or insufficient permissions" error due to default Firestore security rules.
          const notificationRef = doc(db, 'users', user.uid, 'scheduled_notifications', reminderModal.noteId);
          
          await setDoc(notificationRef, {
             userId: user.uid,
             noteId: reminderModal.noteId,
             content: reminderModal.content,
             remindAt: targetTime,
             fcmToken: currentToken,
             status: 'pending',
             createdAt: Date.now()
          });

          // 4. Update Local/Firestore Note State
          setNoteReminder(reminderModal.noteId, targetTime);

          showNotification(`Đã đặt lịch! Hệ thống sẽ thông báo vào ${new Date(reminderTime).toLocaleString('vi-VN')}.`, "success");
          setReminderModal({ ...reminderModal, isOpen: false });

      } catch (error: any) {
          console.error("Scheduling Error:", error);
          const msg = error.code === 'permission-denied' 
            ? "Lỗi quyền truy cập Database (Firestore Rule)." 
            : (error.message || "Lỗi không xác định");
          showNotification(`Lỗi khi đặt lịch: ${msg}`, "error");
      } finally {
          setIsScheduling(false);
      }
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
      if (isSelectionMode) return;

      startPosRef.current = { x: e.clientX, y: e.clientY };
      longPressTimerRef.current = window.setTimeout(() => {
          setIsSelectionMode(true);
          setSelectedIds(new Set([id]));
          isDragSelectingRef.current = true;
          if (navigator.vibrate) navigator.vibrate(50);
      }, 500); 
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
            const noteItem = element?.closest('[data-note-id]');
            if (noteItem) {
                const noteId = noteItem.getAttribute('data-note-id');
                if (noteId && !selectionSetRef.current.has(noteId)) {
                    setSelectedIds(prev => new Set(prev).add(noteId));
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

  const handleDeleteClick = (ids: string[]) => {
      setConfirmDelete({ isOpen: true, ids });
  };

  const performDelete = () => {
      deleteNotes(confirmDelete.ids);
      setConfirmDelete({ isOpen: false, ids: [] });
      if (isSelectionMode) {
          setSelectedIds(new Set());
          if (filteredNotes.length === confirmDelete.ids.length) {
               setIsSelectionMode(false);
          }
      }
  };

  const statusConfig: Record<NoteStatus, { label: string, badgeClass: string, icon: React.ReactNode, color: string }> = {
    incomplete: { 
      label: 'Chưa xong', 
      badgeClass: 'text-red-600 bg-red-50',
      icon: <div className="w-2 h-2 rounded-full bg-current" />,
      color: '#ef4444' 
    },
    attention: { 
      label: 'Chú ý', 
      badgeClass: 'text-amber-600 bg-amber-50',
      icon: <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-3 h-3"><path fillRule="evenodd" d="M18 10a8 8 0 1 1-16 0 8 8 0 0 1 16 0Zm-8-5a.75.75 0 0 1 .75.75v4.5a.75.75 0 0 1-1.5 0v-4.5A.75.75 0 0 1 10 5Zm0 10a1 1 0 1 0 0-2 1 1 0 0 0 0 2Z" clipRule="evenodd" /></svg>,
      color: '#f59e0b' 
    },
    completed: { 
      label: 'Hoàn thành', 
      badgeClass: 'text-emerald-600 bg-emerald-50',
      icon: <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-3 h-3"><path fillRule="evenodd" d="M16.704 4.153a.75.75 0 0 1 .143 1.052l-8 10.5a.75.75 0 0 1-1.127.075l-4.5-4.5a.75.75 0 0 1 1.06-1.06l3.894 3.893 7.48-9.817a.75.75 0 0 1 1.05-.143Z" clipRule="evenodd" /></svg>,
      color: '#10b981'
    },
    skipped: { 
      label: 'Bỏ qua', 
      badgeClass: 'text-slate-500 bg-slate-100',
      icon: <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-3 h-3"><path d="M6.28 5.22a.75.75 0 0 0-1.06 1.06L8.94 10l-3.72 3.72a.75.75 0 1 0 1.06 1.06L10 11.06l3.72 3.72a.75.75 0 1 0 1.06-1.06L11.06 10l3.72-3.72a.75.75 0 0 0-1.06-1.06L10 8.94 6.28 5.22Z" /></svg>,
      color: '#64748b' 
    },
  };

  const renderHeader = () => (
    <div className="flex items-center justify-between p-5 border-b border-slate-100 bg-white/50 backdrop-blur-md shrink-0">
        <div className="flex items-center gap-3">
            {viewMode !== 'list' && (
                <button 
                    onClick={handleBackToMain}
                    className="p-2 -ml-2 rounded-full hover:bg-slate-100 text-slate-400 hover:text-slate-600 transition-colors"
                >
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-5 h-5">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5 8.25 12l7.5-7.5" />
                    </svg>
                </button>
            )}
            <h3 className="text-xl font-extrabold text-slate-800 tracking-tight">
                {viewMode === 'list' ? 'Ghi chú của bạn' : 
                 viewMode === 'add-note' ? 'Thêm ghi chú' : 'Quản lý thẻ phân loại'}
            </h3>
        </div>

        <div className="flex items-center gap-2">
            {viewMode === 'list' && !isSelectionMode && (
                <>
                    <button 
                        onClick={() => setViewMode('add-tag')}
                        className="p-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-600 transition-colors flex items-center gap-2 px-4"
                        title="Quản lý thẻ"
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M9.568 3H5.25A2.25 2.25 0 0 0 3 5.25v4.318c0 .597.237 1.17.659 1.591l9.581 9.581c.699.699 1.78.872 2.607.33a18.095 18.095 0 0 0 5.223-5.223c.542-.827.369-1.908-.33-2.607L11.16 3.66A2.25 2.25 0 0 0 9.568 3Z" />
                            <path strokeLinecap="round" strokeLinejoin="round" d="M6 6h.008v.008H6V6Z" />
                        </svg>
                        <span className="hidden sm:inline text-sm font-bold">Quản lý thẻ</span>
                    </button>
                    <button 
                        onClick={() => setViewMode('add-note')}
                        className="py-2.5 px-4 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white shadow-lg shadow-indigo-200 transition-all active:scale-95 flex items-center gap-2"
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-5 h-5">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
                        </svg>
                        <span className="text-sm font-bold hidden sm:inline">Viết ghi chú</span>
                    </button>
                </>
            )}
             {isSelectionMode && (
                <button 
                    onClick={toggleSelectionMode}
                    className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-600 text-sm font-bold transition-colors"
                >
                    Hủy chọn
                </button>
            )}
            
            <div className="w-px h-6 bg-slate-200 mx-1"></div>

            <button 
                onClick={handleClose}
                className="p-2 rounded-full hover:bg-slate-100 text-slate-400 hover:text-slate-600 transition-colors"
            >
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-6 h-6">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" />
                </svg>
            </button>
        </div>
    </div>
  );

  return (
    <>
      <style>{`
        .hide-scrollbar::-webkit-scrollbar {
          display: none;
        }
        .hide-scrollbar {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }
      `}</style>
      
      {/* Draggable Trigger Button */}
      <div 
        className="fixed z-[60] touch-none select-none cursor-pointer"
        style={{ 
            left: btnPos.x, 
            top: btnPos.y,
            transition: isDraggingBtn.current ? 'none' : 'all 0.4s cubic-bezier(0.18, 0.89, 0.32, 1.28)'
        }}
        onClick={handleBtnClick}
        onPointerDown={handleBtnPointerDown}
        onPointerMove={handleBtnPointerMove}
        onPointerUp={handleBtnPointerUp}
      >
        <button
          className={`w-14 h-14 rounded-full shadow-2xl flex items-center justify-center transition-transform duration-200 active:scale-95 border-2 border-white/50 backdrop-blur-md pointer-events-none
            ${isOpen ? 'bg-slate-800 text-white rotate-90 scale-90' : 'bg-gradient-to-br from-indigo-500 to-purple-600 text-white'}
          `}
          type="button"
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

      {/* Main Modal */}
      {isOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
             <div 
                className={`absolute inset-0 bg-black/40 backdrop-blur-sm transition-opacity duration-300 ${isClosing ? 'opacity-0' : 'opacity-100 animate-fade-in-up'}`}
                onClick={handleClose}
            />
             
             <div 
                className={`bg-white/95 backdrop-blur-xl w-full max-w-lg md:max-w-5xl rounded-3xl shadow-2xl overflow-hidden flex flex-col relative z-10 origin-center border border-white/60
                    ${isClosing ? 'animate-fade-out-down' : 'animate-fade-in-up'}
                `}
                style={{
                    maxHeight: '85dvh',
                    height: window.innerWidth >= 768 ? '85vh' : undefined,
                    animationDuration: '0.3s'
                }}
             >
                {renderHeader()}

                <div className="flex-1 overflow-hidden flex flex-col min-h-0 relative" ref={scrollContainerRef}>
                    {/* View: Add Tag */}
                    {viewMode === 'add-tag' && (
                        <div className={`p-5 flex flex-col gap-6 overflow-y-auto custom-scrollbar ${isSubViewClosing ? 'animate-fade-out-down' : 'animate-fade-in-up'}`}>
                            <div className="max-w-3xl mx-auto w-full">
                                <h4 className="text-sm font-extrabold text-slate-800 uppercase tracking-wide mb-4">Tạo thẻ mới</h4>
                                <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100">
                                    <div className="mb-4">
                                        <label className="block text-xs font-bold text-slate-500 uppercase mb-2">Tên thẻ</label>
                                        <input type="text" className="w-full text-sm px-4 py-3 rounded-xl border border-slate-200 focus:outline-none focus:border-indigo-500 bg-white transition-all" value={newTagName} onChange={(e) => setNewTagName(e.target.value)} autoFocus />
                                    </div>
                                    <div>
                                        <label className="block text-xs font-bold text-slate-500 uppercase mb-3">Màu nhận diện</label>
                                        <div className="flex flex-col gap-4">
                                            <div className="grid grid-cols-6 sm:grid-cols-8 gap-3">
                                                {PRESET_COLORS.map(color => (
                                                    <button key={color} onClick={() => setNewTagColor(color)} className={`w-10 h-10 rounded-full cursor-pointer transition-transform hover:scale-110 flex items-center justify-center shadow-sm ${newTagColor === color ? 'ring-2 ring-offset-2 ring-slate-400 scale-110' : 'border border-black/5'}`} style={{ backgroundColor: color }}>
                                                        {newTagColor === color && <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={3} stroke="currentColor" className="w-4 h-4 text-white drop-shadow-md"><path strokeLinecap="round" strokeLinejoin="round" d="m4.5 12.75 6 6 9-13.5" /></svg>}
                                                    </button>
                                                ))}
                                                <div className="relative w-10 h-10 rounded-full cursor-pointer overflow-hidden border border-slate-200 shadow-sm transition-transform hover:scale-110 group">
                                                    <div className="w-full h-full bg-gradient-to-br from-red-500 via-green-500 to-blue-500 opacity-80" />
                                                    <input type="color" className="absolute inset-0 w-[200%] h-[200%] opacity-0 cursor-pointer -top-1/2 -left-1/2 p-0 m-0" value={newTagColor} onChange={(e) => setNewTagColor(e.target.value)} />
                                                </div>
                                            </div>
                                            <div className="flex items-center gap-3 mt-1 pt-3 border-t border-slate-200/50">
                                                <button onClick={handleCreateTag} className="flex-1 py-3 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-bold rounded-xl transition-colors shadow-lg shadow-indigo-200">Tạo ngay</button>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                            <div className="w-full h-px bg-slate-100"></div>
                             <div className="max-w-3xl mx-auto w-full pb-6">
                                <h4 className="text-sm font-extrabold text-slate-800 uppercase tracking-wide mb-4">Danh sách thẻ ({tags.length})</h4>
                                <div className="flex flex-col gap-2">
                                    {tags.map(tag => (
                                        <div key={tag.id} className="flex items-center justify-between p-3 rounded-xl border border-slate-100 bg-white hover:shadow-sm transition-all">
                                             <div className="flex items-center gap-3">
                                                    <div className="w-6 h-6 rounded-full border border-slate-100 shadow-sm" style={{ backgroundColor: tag.color }}></div>
                                                    <span className="font-bold text-slate-700">{tag.name}</span>
                                                    {tag.isPinned && <span className="bg-slate-100 text-slate-500 text-[10px] uppercase font-bold px-2 py-0.5 rounded">Đã ghim</span>}
                                            </div>
                                            <div className="flex items-center gap-1">
                                                <button onClick={() => toggleTagPin(tag.id)} className={`p-2 rounded-lg transition-colors ${tag.isPinned ? 'text-indigo-600 bg-indigo-50' : 'text-slate-400 hover:bg-slate-100'}`}><svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4"><path fillRule="evenodd" d="M11.47 2.47a.75.75 0 0 1 1.06 0l4.5 4.5a.75.75 0 0 1-1.06 1.06l-4.5-4.5a.75.75 0 0 1 0-1.06Zm-5 5a.75.75 0 0 1 1.06 0l4.5 4.5a.75.75 0 0 1 1.06 1.06l-4.5-4.5a.75.75 0 0 1 0-1.06Z" clipRule="evenodd" /></svg></button>
                                                <button onClick={() => handleRequestDeleteTag(tag.id)} className="p-2 rounded-lg text-slate-400 hover:text-red-500 hover:bg-red-50 transition-colors"><svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4"><path fillRule="evenodd" d="M8.75 1A2.75 2.75 0 0 0 6 3.75v.443c-.795.077-1.584.176-2.365.298a.75.75 0 1 0 .23 1.482l.149-.022.841 10.518A2.75 2.75 0 0 0 7.596 19h4.807a2.75 2.75 0 0 0 2.742-2.53l.841-10.52.149.023a.75.75 0 0 0 .23-1.482A41.03 41.03 0 0 0 14 4.193V3.75A2.75 2.75 0 0 0 11.25 1h-2.5ZM10 4c.84 0 1.673.025 2.5.075V3.75c0-.69-.56-1.25-1.25-1.25h-2.5c-.69 0-1.25.56-1.25 1.25v.325C8.327 4.025 9.16 4 10 4ZM8.58 7.72a.75.75 0 0 0-1.5.06l.3 7.5a.75.75 0 1 0 1.5-.06l-.3-7.5Zm4.34.06a.75.75 0 1 0-1.5-.06l-.3 7.5a.75.75 0 0 0 1.5.06l.3-7.5Z" clipRule="evenodd" /></svg></button>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                             </div>
                        </div>
                    )}

                    {viewMode === 'add-note' && (
                        <div className={`p-5 flex flex-col gap-5 flex-1 h-full overflow-y-auto custom-scrollbar ${isSubViewClosing ? 'animate-fade-out-down' : 'animate-fade-in-up'}`}>
                           <div className="max-w-3xl mx-auto w-full h-full flex flex-col">
                                <div className="flex-1 flex flex-col gap-2 min-h-[200px]">
                                    <label className="block text-xs font-bold text-slate-500 uppercase">Nội dung ghi chú</label>
                                    <textarea className="w-full flex-1 bg-slate-50 border border-slate-200 rounded-xl p-4 text-sm focus:outline-none focus:border-indigo-500 focus:bg-white transition-all resize-none shadow-inner" placeholder="Nhập nội dung ghi chú của bạn..." value={newNoteContent} onChange={(e) => setNewNoteContent(e.target.value)} autoFocus />
                                </div>
                                <div className="relative shrink-0 mt-4" ref={tagDropdownRef}>
                                    <label className="block text-xs font-bold text-slate-500 uppercase mb-2">Phân loại thẻ</label>
                                    <button onClick={() => setIsTagDropdownOpen(!isTagDropdownOpen)} className={`w-full flex items-center justify-between px-4 py-3 rounded-xl border bg-white transition-all ${isTagDropdownOpen ? 'border-indigo-500 ring-2 ring-indigo-50' : 'border-slate-200 hover:border-slate-300'}`}>
                                        {selectedTagForNewNote ? <div className="flex items-center gap-2"><span className="w-3 h-3 rounded-full" style={{ backgroundColor: getTag(selectedTagForNewNote)?.color }}></span><span className="text-sm font-semibold text-slate-700">{getTag(selectedTagForNewNote)?.name}</span></div> : <span className="text-sm text-slate-400">Chọn thẻ...</span>}
                                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-4 h-4 text-slate-400"><path strokeLinecap="round" strokeLinejoin="round" d="m19.5 8.25-7.5 7.5-7.5-7.5" /></svg>
                                    </button>
                                    {isTagDropdownOpen && (
                                        <div className="absolute bottom-full left-0 w-full mb-2 bg-white rounded-xl shadow-xl border border-slate-100 overflow-hidden z-20 animate-fade-in-up">
                                            <div className="max-h-40 overflow-y-auto custom-scrollbar p-1">
                                                <button onClick={() => { setSelectedTagForNewNote(''); setIsTagDropdownOpen(false); }} className="w-full text-left px-3 py-2 text-sm text-slate-600 hover:bg-slate-50 rounded-lg font-medium">Mặc định (Không thẻ)</button>
                                                {tags.map(tag => (
                                                    <button key={tag.id} onClick={() => { setSelectedTagForNewNote(tag.id); setIsTagDropdownOpen(false); }} className="w-full flex items-center gap-2 px-3 py-2 hover:bg-slate-50 rounded-lg transition-colors">
                                                        <span className="w-3 h-3 rounded-full shrink-0" style={{ backgroundColor: tag.color }}></span>
                                                        <span className="text-sm font-semibold text-slate-700">{tag.name}</span>
                                                    </button>
                                                ))}
                                            </div>
                                        </div>
                                    )}
                                </div>
                                <div className="flex gap-3 mt-4 shrink-0">
                                    <button onClick={handleBackToMain} className="flex-1 py-3.5 bg-slate-100 hover:bg-slate-200 text-slate-600 text-sm font-bold rounded-xl transition-colors">Hủy</button>
                                    <button onClick={handleAddNote} disabled={!newNoteContent.trim()} className={`flex-1 py-3.5 text-white text-sm font-bold rounded-xl transition-colors shadow-lg ${newNoteContent.trim() ? 'bg-indigo-600 hover:bg-indigo-700 shadow-indigo-200' : 'bg-slate-300 cursor-not-allowed'}`}>Lưu ghi chú</button>
                                </div>
                           </div>
                        </div>
                    )}

                    {/* --- VIEW: LIST --- */}
                    {viewMode === 'list' && (
                        <div className="flex flex-col h-full overflow-hidden animate-fade-in-up bg-slate-50/50">
                            {/* Filter Container */}
                            <div className="bg-white border-b border-slate-100 shadow-[0_4px_20px_-10px_rgba(0,0,0,0.05)] shrink-0 z-20 pt-3 pb-3">
                                {/* ... Tags Filter ... */}
                                <div className="px-4 pb-1 pt-1 overflow-x-auto hide-scrollbar flex items-center gap-3 snap-x snap-mandatory scroll-pl-4 select-none touch-pan-x">
                                    <button onClick={() => setActiveTab('all')} className={`snap-start shrink-0 h-9 px-6 rounded-full text-xs font-bold transition-all duration-300 flex items-center justify-center ${activeTab === 'all' ? 'bg-slate-800 text-white shadow-lg shadow-slate-200 scale-100 ring-2 ring-slate-800 ring-offset-2' : 'bg-white text-slate-500 border border-slate-200 hover:border-slate-300 hover:text-slate-700 hover:bg-slate-50'}`}>Tất cả</button>
                                    <div className="w-px h-6 bg-slate-200 shrink-0 mx-1"></div>
                                    {tags.map(tag => {
                                        const isActive = activeTab === tag.id;
                                        return (
                                            <div key={tag.id} className={`snap-start shrink-0 h-9 flex items-center rounded-full transition-all duration-300 group overflow-hidden ${isActive ? 'bg-white shadow-md ring-2 ring-offset-2 ring-white scale-100' : 'bg-white border border-slate-200 hover:border-slate-300 hover:bg-slate-50'}`} style={isActive ? { borderColor: tag.color, '--tw-ring-color': tag.color } as React.CSSProperties : {}}>
                                                <button onClick={() => setActiveTab(tag.id)} className={`px-4 h-full flex items-center gap-2 text-xs font-bold transition-colors ${isActive ? 'text-white' : 'text-slate-600'}`} style={{ backgroundColor: isActive ? tag.color : 'transparent' }}>
                                                    {!isActive && <span className="w-2 h-2 rounded-full" style={{ backgroundColor: tag.color }}></span>}{tag.name}
                                                    {tag.isPinned && <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className={`w-3 h-3 ${isActive ? 'text-white/80' : 'text-slate-400'}`}><path fillRule="evenodd" d="M11.47 2.47a.75.75 0 0 1 1.06 0l4.5 4.5a.75.75 0 0 1-1.06 1.06l-4.5-4.5a.75.75 0 0 1 0-1.06Z" clipRule="evenodd" /></svg>}
                                                </button>
                                                {isActive && <div className="flex items-center h-full" style={{ backgroundColor: tag.color }}><div className="h-4 w-px bg-white/30"></div><button onClick={(e) => { e.stopPropagation(); toggleTagPin(tag.id); }} className="h-full px-2.5 flex items-center justify-center hover:bg-black/10 transition-colors text-white" title={tag.isPinned ? "Bỏ ghim" : "Ghim"}>{tag.isPinned ? <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-3.5 h-3.5"><path fillRule="evenodd" d="M10 2c-1.716 0-3.408.106-5.07.31C3.806 2.45 3 3.414 3 4.517V17.25a.75.75 0 0 0 1.075.676L10 15.082l5.925 2.844A.75.75 0 0 0 17 17.25V4.517c0-1.103-.806-2.068-1.93-2.207A41.403 41.403 0 0 0 10 2Z" clipRule="evenodd" /></svg> : <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-3.5 h-3.5 opacity-80"><path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m9-.75a9 9 0 1 1-18 0 9 9 0 0 1 18 0Zm-9 3.75h.008v.008H12v-.008Z" /><path strokeLinecap="round" strokeLinejoin="round" d="m15 11.25-3-3m0 0-3 3m3-3v7.5" /></svg>}</button></div>}
                                            </div>
                                        )
                                    })}
                                </div>
                                {/* ... Status Filter ... */}
                                <div className="px-4 py-3 overflow-x-auto hide-scrollbar flex items-center gap-2 snap-x snap-mandatory scroll-pl-4 select-none touch-pan-x">
                                     <button onClick={() => setActiveStatusFilter('all')} className={`snap-start shrink-0 px-4 py-2 rounded-full text-[10px] font-bold uppercase tracking-wider transition-all border ${activeStatusFilter === 'all' ? 'bg-slate-800 border-slate-800 text-white shadow-md scale-100 ring-2 ring-slate-800 ring-offset-1' : 'bg-white border-transparent text-slate-400 hover:bg-slate-50 hover:text-slate-600'}`}>Tất cả trạng thái</button>
                                     {(Object.entries(statusConfig) as [NoteStatus, typeof statusConfig[NoteStatus]][]).map(([status, config]) => {
                                        const isActive = activeStatusFilter === status;
                                        return (
                                            <button key={status} onClick={() => setActiveStatusFilter(status)} className={`snap-start shrink-0 px-3 py-2 rounded-full text-[11px] font-bold transition-all border shrink-0 flex items-center gap-1.5 ${isActive ? 'shadow-md ring-2 ring-offset-1 scale-100' : 'bg-white hover:bg-slate-50 border-transparent'}`} style={{ backgroundColor: isActive ? config.color : 'white', borderColor: isActive ? config.color : 'transparent', color: isActive ? 'white' : config.color, boxShadow: isActive ? `0 4px 12px -2px ${config.color}60` : 'none', '--tw-ring-color': config.color } as React.CSSProperties}><span className={isActive ? '' : 'opacity-100'}>{config.icon}</span>{config.label}</button>
                                        )
                                    })}
                                </div>
                            </div>

                            {/* Notes List */}
                            <div className="flex-1 overflow-y-auto p-4 custom-scrollbar bg-slate-50/30 pb-20">
                                {isLoading || isFiltering ? (
                                    <LoadingSpinner />
                                ) : filteredNotes.length === 0 ? (
                                    <div className="h-full flex flex-col items-center justify-center text-slate-400 opacity-60 min-h-[200px] animate-fade-in-up">
                                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-12 h-12 mb-2"><path strokeLinecap="round" strokeLinejoin="round" d="m16.862 4.487 1.687-1.688a1.875 1.875 0 1 1 2.652 2.652L10.582 16.07a4.5 4.5 0 0 1-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 0 1 1.13-1.897l8.932-8.931Zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0 1 15.75 21H5.25A2.25 2.25 0 0 1 3 18.75V8.25A2.25 2.25 0 0 1 5.25 6H10" /></svg>
                                        <span className="text-sm font-medium">Chưa có ghi chú nào</span>
                                        <p className="text-xs text-slate-400 mt-2 text-center px-4">Giữ lì vào ghi chú để chọn nhiều</p>
                                    </div>
                                ) : (
                                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 auto-rows-min">
                                        {filteredNotes.map((note, index) => {
                                            const tag = getTag(note.tagId);
                                            const status = statusConfig[note.status];
                                            const isSelected = selectedIds.has(note.id);
                                            const isAllTab = activeTab === 'all';
                                            const statusColor = status.color;
                                            const tagColor = tag ? tag.color : '#e2e8f0';

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
                                                        rounded-2xl border-l-[6px] border group transition-all relative overflow-hidden flex items-stretch touch-manipulation select-none h-full animate-fade-in-up
                                                        ${isSelectionMode ? 'cursor-pointer hover:shadow-lg' : 'hover:shadow-[0_8px_30px_rgb(0,0,0,0.12)]'}
                                                        ${isSelectionMode && isSelected ? 'bg-indigo-50 border-indigo-500 ring-2 ring-indigo-500 shadow-md' : 'bg-white shadow-[0_4px_20px_-4px_rgba(0,0,0,0.1)]'}
                                                    `}
                                                    style={{ animationDelay: `${index * 50}ms`, ...(isSelectionMode && isSelected ? {} : { borderLeftColor: statusColor, borderTopColor: tagColor, borderRightColor: tagColor, borderBottomColor: tagColor }) }}
                                                >
                                                    {isSelectionMode && (
                                                        <div className="w-12 flex items-center justify-center border-r border-slate-100/50 bg-white/40 shrink-0">
                                                            <div className={`w-5 h-5 rounded-md border flex items-center justify-center transition-all ${isSelected ? 'bg-indigo-600 border-indigo-600' : 'bg-white border-slate-300'}`}>
                                                                {isSelected && <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-3.5 h-3.5 text-white"><path fillRule="evenodd" d="M16.704 4.153a.75.75 0 0 1 .143 1.052l-8 10.5a.75.75 0 0 1-1.127.075l-4.5-4.5a.75.75 0 0 1 1.06-1.06l3.894 3.893 7.48-9.817a.75.75 0 0 1 1.05-.143Z" clipRule="evenodd" /></svg>}
                                                            </div>
                                                        </div>
                                                    )}
                                                    
                                                    {!isSelectionMode && isAllTab && tag && (
                                                        <div className="absolute top-0 right-0 px-3 py-1.5 rounded-bl-xl rounded-tr-2xl text-[9px] font-bold text-white shadow-sm z-[5] pointer-events-none opacity-90" style={{ backgroundColor: tag.color }}>{tag.name}</div>
                                                    )}

                                                    <div className="flex-1 p-4 flex flex-col h-full">
                                                        <div className="flex justify-between items-start mb-2 relative z-10">
                                                            <div className="flex items-center gap-2">
                                                                {tag && !isAllTab && <span className="text-[10px] px-2 py-0.5 rounded-md font-bold text-white shadow-sm" style={{ backgroundColor: tag.color }}>{tag.name}</span>}
                                                                <span className="text-[10px] text-slate-400 font-semibold bg-slate-50 px-1.5 rounded">{new Date(note.timestamp).toLocaleTimeString('vi-VN', {hour: '2-digit', minute:'2-digit', day: '2-digit', month: '2-digit'})}</span>
                                                            </div>
                                                            {/* Reminder Indicator */}
                                                            {note.reminderTime && (
                                                                <div className="absolute top-0 right-0 flex items-center gap-1 bg-yellow-50 text-yellow-600 px-2 py-0.5 rounded-full border border-yellow-100 shadow-sm animate-pulse-soft" style={{marginRight: isAllTab && tag ? '5rem' : '0'}}>
                                                                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-3 h-3">
                                                                        <path d="M10 2a6 6 0 0 0-6 6v3.586l-.707.707A1 1 0 0 0 4 14h12a1 1 0 0 0 .707-1.707L16 11.586V8a6 6 0 0 0-6-6Z" />
                                                                        <path d="M12.28 16a2.5 2.5 0 0 1-4.56 0h4.56Z" />
                                                                    </svg>
                                                                    <span className="text-[9px] font-bold">
                                                                        {new Date(note.reminderTime).toLocaleTimeString('vi-VN', {hour: '2-digit', minute:'2-digit'})}
                                                                    </span>
                                                                </div>
                                                            )}
                                                        </div>
                                                        
                                                        <p className="text-sm text-slate-800 font-medium mb-3 whitespace-pre-wrap leading-relaxed relative z-10 flex-1">{note.content}</p>

                                                        <div className={`flex gap-1 overflow-x-auto no-scrollbar-on-mobile pb-1 relative z-10 mt-auto mb-2 ${isSelectionMode ? 'pointer-events-none opacity-60' : ''}`}>
                                                            {(Object.keys(statusConfig) as NoteStatus[]).map((s) => (
                                                                <button key={s} onClick={(e) => { e.stopPropagation(); updateNoteStatus(note.id, s); }} className={`flex items-center gap-1.5 px-2 py-1.5 rounded-lg text-[10px] font-bold border transition-all whitespace-nowrap ${note.status === s ? `${statusConfig[s].badgeClass} border-transparent shadow-sm ring-1 ring-black/5` : 'bg-slate-50 border-transparent text-slate-400 hover:bg-slate-100 hover:text-slate-600'}`}>{note.status === s ? statusConfig[s].icon : null}{statusConfig[s].label}</button>
                                                            ))}
                                                        </div>

                                                        {!isSelectionMode && (
                                                            <div className="flex items-center justify-end gap-3 pt-2 border-t border-slate-100/60 mt-auto">
                                                                <button onClick={(e) => handleOpenReminder(note, e)} className="flex items-center gap-1.5 text-[10px] font-bold text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 px-2 py-1.5 rounded-lg transition-colors group/reminder" title="Hẹn giờ nhắc nhở">
                                                                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-4 h-4"><path strokeLinecap="round" strokeLinejoin="round" d="M14.857 17.082a23.848 23.848 0 0 0 5.454-1.31A8.967 8.967 0 0 1 18 9.75V9A6 6 0 0 0 6 9v.75a8.967 8.967 0 0 1-2.312 6.022c1.733.64 3.56 1.085 5.455 1.31m5.714 0a24.255 24.255 0 0 1-5.714 0m5.714 0a3 3 0 1 1-5.714 0" /></svg>
                                                                    <span className="hidden group-hover/reminder:inline">Nhắc nhở</span>
                                                                </button>
                                                                <button onClick={(e) => { e.stopPropagation(); handleDeleteClick([note.id]); }} className="flex items-center gap-1.5 text-[10px] font-bold text-slate-400 hover:text-red-600 hover:bg-red-50 px-2 py-1.5 rounded-lg transition-colors group/delete" title="Xóa ghi chú">
                                                                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-4 h-4"><path strokeLinecap="round" strokeLinejoin="round" d="m14.74 9-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 0 1-2.244 2.077H8.084a2.25 2.25 0 0 1-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 0 0-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 0 1 3.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 0 0-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 0 0-7.5 0" /></svg>
                                                                    <span className="hidden group-hover/delete:inline">Xóa</span>
                                                                </button>
                                                            </div>
                                                        )}
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </div>
                                )}
                            </div>
                            {isSelectionMode && (
                                <div className="absolute bottom-0 left-0 right-0 p-4 bg-white border-t border-slate-200 shadow-lg z-30 animate-fade-in-up">
                                    <button onClick={() => handleDeleteClick(Array.from(selectedIds))} disabled={selectedIds.size === 0} className={`w-full py-3.5 rounded-xl font-bold text-white shadow-lg transition-all flex items-center justify-center gap-2 ${selectedIds.size > 0 ? 'bg-red-500 hover:bg-red-600 active:scale-[0.98]' : 'bg-slate-300 cursor-not-allowed'}`}>
                                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5"><path strokeLinecap="round" strokeLinejoin="round" d="m14.74 9-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 0 1-2.244 2.077H8.084a2.25 2.25 0 0 1-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 0 0-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 0 1 3.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 0 0-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 0 0-7.5 0" /></svg>
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
      
      {/* Delete Confirmation Modal (NOTES) - Same as before */}
      {confirmDelete.isOpen && (
          <div className="fixed inset-0 z-[110] flex items-center justify-center p-4">
              <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-[2px]" onClick={() => setConfirmDelete({ ...confirmDelete, isOpen: false })}></div>
              <div className="bg-white rounded-2xl shadow-2xl p-6 w-full max-w-sm relative z-10 animate-pulse-soft">
                  <div className="text-center mb-6">
                      <div className="w-14 h-14 bg-red-50 rounded-full flex items-center justify-center mx-auto mb-4 text-red-500 ring-4 ring-red-50"><svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-7 h-7"><path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126ZM12 15.75h.007v.008H12v-.008Z" /></svg></div>
                      <h4 className="text-xl font-bold text-slate-800 mb-2">Xác nhận xóa</h4>
                      <p className="text-slate-500">{confirmDelete.ids.length > 1 ? `Bạn có chắc chắn muốn xóa ${confirmDelete.ids.length} ghi chú đã chọn không?` : "Bạn có chắc chắn muốn xóa ghi chú này không?"}</p>
                  </div>
                  <div className="flex gap-3">
                      <button onClick={() => setConfirmDelete({ ...confirmDelete, isOpen: false })} className="flex-1 py-3 rounded-xl font-bold text-slate-600 bg-slate-100 hover:bg-slate-200 transition-colors">Hủy bỏ</button>
                      <button onClick={performDelete} className="flex-1 py-3 rounded-xl font-bold text-white bg-red-500 hover:bg-red-600 transition-colors shadow-lg shadow-red-200">Xóa ngay</button>
                  </div>
              </div>
          </div>
      )}

      {/* Delete Confirmation Modal (TAGS) - Same as before */}
      {tagToDelete && (
          <div className="fixed inset-0 z-[120] flex items-center justify-center p-4">
              <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-[2px]" onClick={() => setTagToDelete(null)}></div>
              <div className="bg-white rounded-2xl shadow-2xl p-6 w-full max-w-sm relative z-10 animate-pulse-soft">
                  <div className="text-center mb-6">
                      <div className="w-14 h-14 bg-amber-50 rounded-full flex items-center justify-center mx-auto mb-4 text-amber-500 ring-4 ring-amber-50"><svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-7 h-7"><path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m9-.75a9 9 0 1 1-18 0 9 9 0 0 1 18 0Zm-9 3.75h.008v.008H12v-.008Z" /><path strokeLinecap="round" strokeLinejoin="round" d="m15 11.25-3-3m0 0-3 3m3-3v7.5" /></svg></div>
                      <h4 className="text-xl font-bold text-slate-800 mb-2">Xóa thẻ phân loại?</h4>
                      <p className="text-slate-500 text-sm">Thẻ <strong>"{getTag(tagToDelete)?.name}"</strong> sẽ bị xóa vĩnh viễn. Các ghi chú thuộc thẻ này sẽ không bị xóa nhưng sẽ mất phân loại.</p>
                  </div>
                  <div className="flex gap-3">
                      <button onClick={() => setTagToDelete(null)} className="flex-1 py-3 rounded-xl font-bold text-slate-600 bg-slate-100 hover:bg-slate-200 transition-colors">Hủy bỏ</button>
                      <button onClick={confirmTagDeletion} className="flex-1 py-3 rounded-xl font-bold text-white bg-red-500 hover:bg-red-600 transition-colors shadow-lg shadow-red-200">Xóa thẻ</button>
                  </div>
              </div>
          </div>
      )}

      {/* Reminder Modal */}
      {reminderModal.isOpen && (
           <div className="fixed inset-0 z-[120] flex items-center justify-center p-4">
               <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-[2px]" onClick={() => setReminderModal({ ...reminderModal, isOpen: false })}></div>
               <div className="bg-white rounded-2xl shadow-2xl p-6 w-full max-w-sm relative z-10 animate-pulse-soft">
                   <div className="flex items-center gap-3 mb-4">
                       <div className="w-10 h-10 rounded-full bg-indigo-50 flex items-center justify-center text-indigo-600">
                           <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-6 h-6"><path strokeLinecap="round" strokeLinejoin="round" d="M14.857 17.082a23.848 23.848 0 0 0 5.454-1.31A8.967 8.967 0 0 1 18 9.75V9A6 6 0 0 0 6 9v.75a8.967 8.967 0 0 1-2.312 6.022c1.733.64 3.56 1.085 5.455 1.31m5.714 0a24.255 24.255 0 0 1-5.714 0m5.714 0a3 3 0 1 1-5.714 0" /></svg>
                       </div>
                       <h4 className="text-lg font-bold text-slate-800">Đặt nhắc nhở</h4>
                   </div>
                   
                   <div className="space-y-4">
                       <div>
                           <label className="block text-xs font-bold text-slate-500 uppercase mb-2">Nội dung nhắc nhở</label>
                           <textarea className="w-full px-3 py-2 border border-slate-200 rounded-xl bg-slate-50 text-sm focus:outline-none focus:border-indigo-500 resize-none h-20" value={reminderModal.content} onChange={(e) => setReminderModal({...reminderModal, content: e.target.value})} />
                       </div>
                       <div>
                           <label className="block text-xs font-bold text-slate-500 uppercase mb-2">Thời gian thông báo</label>
                           <input type="datetime-local" className="w-full px-3 py-2 border border-slate-200 rounded-xl bg-white text-sm focus:outline-none focus:border-indigo-500" value={reminderTime} onChange={(e) => setReminderTime(e.target.value)} />
                           <p className="text-[10px] text-slate-400 mt-1 italic">* Ứng dụng cần được cấp quyền thông báo.</p>
                           <p className="text-[10px] text-slate-400 italic mt-0.5">* Cần đăng nhập để sử dụng tính năng thông báo nền.</p>
                       </div>
                   </div>

                   <div className="flex gap-3 mt-6">
                       <button onClick={() => setReminderModal({ ...reminderModal, isOpen: false })} className="flex-1 py-3 rounded-xl font-bold text-slate-600 bg-slate-100 hover:bg-slate-200 transition-colors">Hủy</button>
                       <button 
                            onClick={handleScheduleReminder} 
                            disabled={isScheduling}
                            className={`flex-1 py-3 rounded-xl font-bold text-white transition-colors shadow-lg shadow-indigo-200 flex items-center justify-center gap-2 ${isScheduling ? 'bg-indigo-400 cursor-wait' : 'bg-indigo-600 hover:bg-indigo-700'}`}
                       >
                           {isScheduling && <div className="w-4 h-4 border-2 border-white/50 border-t-white rounded-full animate-spin"></div>}
                           Đặt lịch
                       </button>
                   </div>
               </div>
           </div>
      )}
    </>
  );
};
