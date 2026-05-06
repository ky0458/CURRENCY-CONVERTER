import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useCurrencyConverter } from '../hooks/useCurrencyConverter';

const formatTime = (seconds?: number) => {
    if (!seconds) return '0 phút';
    const hrs = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    if (hrs > 0) return `${hrs}h ${mins}m`;
    return `${mins} phút`;
};

export const AdminDashboard: React.FC<{ onExit: () => void }> = ({ onExit }) => {
    const { user, isAdmin } = useAuth();
    const { cnyRate } = useCurrencyConverter();
    
    const [users, setUsers] = useState<any[]>([]);
    const [allTags, setAllTags] = useState<any[]>([]);
    const [allNotes, setAllNotes] = useState<any[]>([]);
    const [allStats, setAllStats] = useState<any[]>([]);
    const [allChats, setAllChats] = useState<any[]>([]);
    const [allModels, setAllModels] = useState<any[]>([]);
    
    const [selectedUser, setSelectedUser] = useState<string | null>(null);
    const [userDetails, setUserDetails] = useState<any>(null);
    
    const [loading, setLoading] = useState(false);
    const [loadingDetails, setLoadingDetails] = useState(false);
    const [activeMenu, setActiveMenu] = useState<'account' | 'tags' | 'notes' | 'stats' | 'chats' | 'models'>('account');
    
    const [newModelName, setNewModelName] = useState('');
    const [newModelKey, setNewModelKey] = useState('');

    const [editingModelId, setEditingModelId] = useState<string | null>(null);

    const [searchQuery, setSearchQuery] = useState('');
    
    // Pagination states
    const [pageUsers, setPageUsers] = useState(1);
    const [pageTags, setPageTags] = useState(1);
    const [pageNotes, setPageNotes] = useState(1);
    const [pageStats, setPageStats] = useState(1);
    const [pageChats, setPageChats] = useState(1);
    const [itemsPerPage, setItemsPerPage] = useState(20);
    const [selectedItems, setSelectedItems] = useState<string[]>([]);
    const toggleSelection = (id: string) => setSelectedItems(prev => prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]);
    const toggleAll = (ids: string[]) => setSelectedItems(prev => prev.length === ids.length ? [] : ids);
    const [confirmModal, setConfirmModal] = useState<{ isOpen: boolean, text: string, onConfirm: () => void } | null>(null);

    const [notification, setNotification] = useState<{ message: string, type: 'success' | 'error' } | null>(null);

    const showNotification = (message: string, type: 'success' | 'error' = 'success') => {
        setNotification({ message, type });
        setTimeout(() => setNotification(null), 3000);
    };

    const [isPerPageDropdownOpen, setIsPerPageDropdownOpen] = useState(false);

    const [sortUsers, setSortUsers] = useState<{ key: string, direction: 'asc' | 'desc' } | null>(null);
    const [sortTags, setSortTags] = useState<{ key: string, direction: 'asc' | 'desc' } | null>(null);
    const [sortNotes, setSortNotes] = useState<{ key: string, direction: 'asc' | 'desc' } | null>(null);
    const [sortStats, setSortStats] = useState<{ key: string, direction: 'asc' | 'desc' } | null>(null);
    const [sortChats, setSortChats] = useState<{ key: string, direction: 'asc' | 'desc' } | null>(null);

    const headers = { 'x-admin-uid': user?.uid || '' };

    useEffect(() => {
        setSearchQuery('');
        setSelectedItems([]);
        setPageUsers(1); setPageTags(1); setPageNotes(1); setPageStats(1); setPageChats(1);
    }, [activeMenu]);

    const toggleSort = (type: 'users'|'tags'|'notes'|'stats'|'chats', key: string) => {
        if (type === 'users') {
             setSortUsers(prev => prev?.key === key ? { key, direction: prev.direction === 'asc' ? 'desc' : 'asc' } : { key, direction: 'asc' });
        } else if (type === 'tags') {
            setSortTags(prev => prev?.key === key ? { key, direction: prev.direction === 'asc' ? 'desc' : 'asc' } : { key, direction: 'asc' });
        } else if (type === 'notes') {
            setSortNotes(prev => prev?.key === key ? { key, direction: prev.direction === 'asc' ? 'desc' : 'asc' } : { key, direction: 'asc' });
        } else if (type === 'stats') {
            setSortStats(prev => prev?.key === key ? { key, direction: prev.direction === 'asc' ? 'desc' : 'asc' } : { key, direction: 'asc' });
        } else if (type === 'chats') {
            setSortChats(prev => prev?.key === key ? { key, direction: prev.direction === 'asc' ? 'desc' : 'asc' } : { key, direction: 'asc' });
        }
    };

    const renderSortIcon = (type: 'users'|'tags'|'notes'|'stats'|'chats', key: string) => {
        let sortObj = type === 'users' ? sortUsers : type === 'tags' ? sortTags : type === 'notes' ? sortNotes : type === 'stats' ? sortStats : sortChats;
        if (sortObj?.key !== key) return null;
        return (
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={3} stroke="currentColor" className={`w-3 h-3 inline-block ml-1 transition-transform ${sortObj.direction === 'desc' ? 'rotate-180' : ''}`}>
               <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 15.75l7.5-7.5 7.5 7.5" />
            </svg>
        );
    };

    const filteredUsers = users.filter(u => 
        (u.displayName || '').toLowerCase().includes(searchQuery.toLowerCase()) || 
        (u.email || '').toLowerCase().includes(searchQuery.toLowerCase())
    );
    const sortedUsers = [...filteredUsers].sort((a, b) => {
        if (!sortUsers) return 0;
        if (['appUsageTime', 'lastSeen'].includes(sortUsers.key)) {
            return sortUsers.direction === 'asc' ? (a[sortUsers.key] || 0) - (b[sortUsers.key] || 0) : (b[sortUsers.key] || 0) - (a[sortUsers.key] || 0);
        }
        const valA = String(a[sortUsers.key] || '').toLowerCase();
        const valB = String(b[sortUsers.key] || '').toLowerCase();
        return sortUsers.direction === 'asc' ? valA.localeCompare(valB) : valB.localeCompare(valA);
    });

    const filteredTags = allTags.filter(t => 
        (t.name || '').toLowerCase().includes(searchQuery.toLowerCase()) || 
        (t.userName || '').toLowerCase().includes(searchQuery.toLowerCase())
    );
    const sortedTags = [...filteredTags].sort((a, b) => {
        if (!sortTags) return 0;
        const valA = String(a[sortTags.key] || '').toLowerCase();
        const valB = String(b[sortTags.key] || '').toLowerCase();
        return sortTags.direction === 'asc' ? valA.localeCompare(valB) : valB.localeCompare(valA);
    });

    const filteredNotes = allNotes.filter(n => 
        (n.content || '').toLowerCase().includes(searchQuery.toLowerCase()) || 
        (n.userName || '').toLowerCase().includes(searchQuery.toLowerCase())
    );
    const sortedNotes = [...filteredNotes].sort((a, b) => {
        if (!sortNotes) return 0;
        if (sortNotes.key === 'timestamp') {
            return sortNotes.direction === 'asc' ? (a.timestamp || 0) - (b.timestamp || 0) : (b.timestamp || 0) - (a.timestamp || 0);
        }
        const valA = String(a[sortNotes.key] || '').toLowerCase();
        const valB = String(b[sortNotes.key] || '').toLowerCase();
        return sortNotes.direction === 'asc' ? valA.localeCompare(valB) : valB.localeCompare(valA);
    });

    const filteredStats = allStats.filter(s => 
        (s.userName || '').toLowerCase().includes(searchQuery.toLowerCase()) || 
        (s.userEmail || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
        (s.shareType || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
        (s.note || '').toLowerCase().includes(searchQuery.toLowerCase())
    );
    const sortedStats = [...filteredStats].sort((a, b) => {
        if (!sortStats) return 0;
        if (['timestamp', 'inputSalary', 'totalRevenue', 'netIncome'].includes(sortStats.key)) {
            return sortStats.direction === 'asc' ? (a[sortStats.key] || 0) - (b[sortStats.key] || 0) : (b[sortStats.key] || 0) - (a[sortStats.key] || 0);
        }
        const valA = String(a[sortStats.key] || '').toLowerCase();
        const valB = String(b[sortStats.key] || '').toLowerCase();
        return sortStats.direction === 'asc' ? valA.localeCompare(valB) : valB.localeCompare(valA);
    });

    const filteredChats = allChats.filter(c => 
        (c.userName || '').toLowerCase().includes(searchQuery.toLowerCase()) || 
        (c.title || '').toLowerCase().includes(searchQuery.toLowerCase())
    );
    const sortedChats = [...filteredChats].sort((a, b) => {
        if (!sortChats) return 0;
        if (sortChats.key === 'updatedAt') {
            return sortChats.direction === 'asc' ? new Date(a.updatedAt).getTime() - new Date(b.updatedAt).getTime() : new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime();
        }
        const valA = String(a[sortChats.key] || '').toLowerCase();
        const valB = String(b[sortChats.key] || '').toLowerCase();
        return sortChats.direction === 'asc' ? valA.localeCompare(valB) : valB.localeCompare(valA);
    });

    // Pagination derivations
    const paginatedUsers = sortedUsers.slice((pageUsers - 1) * itemsPerPage, pageUsers * itemsPerPage);
    const paginatedTags = sortedTags.slice((pageTags - 1) * itemsPerPage, pageTags * itemsPerPage);
    const paginatedNotes = sortedNotes.slice((pageNotes - 1) * itemsPerPage, pageNotes * itemsPerPage);
    const paginatedStats = sortedStats.slice((pageStats - 1) * itemsPerPage, pageStats * itemsPerPage);
    const paginatedChats = sortedChats.slice((pageChats - 1) * itemsPerPage, pageChats * itemsPerPage);

    const fetchGlobalData = async () => {
        setLoading(true);
        try {
            const [usersRes, modelsRes, tagsRes, notesRes, statsRes, chatsRes] = await Promise.all([
                fetch('/api/admin/users', { headers }),
                fetch('/api/admin/models', { headers }),
                fetch('/api/admin/all-tags', { headers }),
                fetch('/api/admin/all-notes', { headers }),
                fetch('/api/admin/all-stats', { headers }),
                fetch('/api/admin/all-chats', { headers })
            ]);
            
            if (usersRes.ok) setUsers(await usersRes.json());
            if (modelsRes.ok) setAllModels(await modelsRes.json());
            if (tagsRes.ok) setAllTags(await tagsRes.json());
            if (notesRes.ok) setAllNotes(await notesRes.json());
            if (statsRes.ok) setAllStats(await statsRes.json());
            if (chatsRes.ok) setAllChats(await chatsRes.json());
        } catch (e) {
            console.error("Failed to load admin data", e);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (!isAdmin || !user?.uid) return;
        fetchGlobalData();
    }, [isAdmin, user]);

    const handleSelectUser = async (uid: string) => {
        if (selectedUser === uid) {
            setSelectedUser(null);
            setUserDetails(null);
            return;
        }
        setSelectedUser(uid);
        fetchUserDetails(uid);
    };

    const fetchUserDetails = async (uid: string) => {
        setLoadingDetails(true);
        try {
            const res = await fetch(`/api/admin/user-details/${uid}`, { headers });
            if (res.ok) setUserDetails(await res.json());
        } catch (e) {
            console.error("Failed to fetch user details", e);
        } finally {
            setLoadingDetails(false);
        }
    };

    const toggleLockUser = (uid: string, isCurrentlyLocked: boolean) => {
        const actionText = isCurrentlyLocked ? 'MỞ KHÓA' : 'KHÓA';
        setConfirmModal({
            isOpen: true,
            text: `Bạn có chắc chắn muốn ${actionText} người dùng này không?`,
            onConfirm: async () => {
                try {
                    await fetch(`/api/admin/users/${uid}/lock`, { 
                        method: 'PUT', 
                        headers: { ...headers, 'Content-Type': 'application/json' },
                        body: JSON.stringify({ isLocked: !isCurrentlyLocked })
                    });
                    fetchGlobalData();
                    showNotification(isCurrentlyLocked ? 'Đã mở khóa tài khoản' : 'Đã khóa tài khoản');
                } catch (e) {
                    showNotification('Có lỗi xảy ra', 'error');
                    console.error('Error locking/unlocking user', e);
                }
            }
        });
    };

    const deleteUser = (uid: string) => {
        setConfirmModal({
            isOpen: true,
            text: `Bạn có chắc chắn muốn XÓA tài khoản này không? Hành động này sẽ xoá toàn bộ dữ liệu của người dùng và không thể hoàn tác.`,
            onConfirm: async () => {
                try {
                    await fetch(`/api/admin/users/${uid}`, { method: 'DELETE', headers });
                    fetchGlobalData();
                    showNotification('Đã xóa người dùng thành công');
                } catch (e) {
                    showNotification('Xóa người dùng thất bại', 'error');
                    console.error('Error deleting user', e);
                }
            }
        });
    };

    const deleteChat = (uid: string, sessionId: string) => {
        setConfirmModal({
            isOpen: true,
            text: 'Xoá lịch sử chat này?',
            onConfirm: async () => {
                try {
                    await fetch(`/api/admin/user-details/${uid}/chats/${sessionId}`, { method: 'DELETE', headers });
                    fetchUserDetails(uid);
                    fetchGlobalData();
                    showNotification('Đã xóa lịch sử chat');
                } catch (e) { showNotification('Xóa lịch sử chat thất bại', 'error'); }
            }
        });
    };

    
    const bulkDeleteAction = () => {
        setConfirmModal({
            isOpen: true,
            text: `Bạn có chắc chắn muốn XÓA ${selectedItems.length} mục đã chọn không? Hành động này không thể hoàn tác.`,
            onConfirm: async () => {
                try {
                    for (const item of selectedItems) {
                        if (activeMenu === 'account') {
                            await fetch(`/api/admin/users/${item}`, { method: 'DELETE', headers });
                        } else if (activeMenu === 'tags') {
                            const [uid, tid] = item.split('-');
                            await fetch(`/api/admin/user-details/${uid}/tags/${tid}`, { method: 'DELETE', headers });
                        } else if (activeMenu === 'notes') {
                            const [uid, nid] = item.split('-');
                            await fetch(`/api/admin/user-details/${uid}/notes/${nid}`, { method: 'DELETE', headers });
                        } else if (activeMenu === 'chats') {
                            const [uid, cid] = item.split('-');
                            await fetch(`/api/admin/user-details/${uid}/chats/${cid}`, { method: 'DELETE', headers });
                        } else if (activeMenu === 'stats') {
                            const [uid, sid] = item.split('-');
                            await fetch(`/api/admin/user-details/${uid}/stats/${sid}`, { method: 'DELETE', headers });
                        }
                    }
                    setSelectedItems([]);
                    fetchGlobalData();
                showNotification('Đã xóa hàng loạt thành công');
                } catch (e) {
                    showNotification('Xóa hàng loạt thất bại', 'error');
                    console.error('Lỗi khi xóa hàng loạt:', e);
                }
            }
        });
    };

    const renderPagination = (currentPage: number, setPage: (p: number) => void, totalItems: number) => {
        const totalPages = Math.max(1, Math.ceil(totalItems / itemsPerPage));
        
        return (
            <div className="flex items-center justify-between px-4 py-3 bg-white border-t border-slate-100 sm:px-6 w-full sticky left-0">
                <div className="flex justify-between flex-1 sm:hidden">
                    <button onClick={() => setPage(currentPage - 1)} disabled={currentPage === 1} className="relative inline-flex items-center px-4 py-2 text-sm font-medium text-slate-700 bg-white border border-slate-300 rounded-md hover:bg-slate-50 disabled:opacity-50">Trước</button>
                    <button onClick={() => setPage(currentPage + 1)} disabled={currentPage === totalPages} className="relative ml-3 inline-flex items-center px-4 py-2 text-sm font-medium text-slate-700 bg-white border border-slate-300 rounded-md hover:bg-slate-50 disabled:opacity-50">Sau</button>
                </div>
                <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
                    <div className="flex items-center gap-4">
                        <p className="text-sm text-slate-700">Hiển thị <span className="font-medium">{totalItems === 0 ? 0 : (currentPage - 1) * itemsPerPage + 1}</span> đến <span className="font-medium">{Math.min(currentPage * itemsPerPage, totalItems)}</span> của <span className="font-medium">{totalItems}</span> kết quả</p>
                        <div className="relative">
                            <button 
                                onClick={() => setIsPerPageDropdownOpen(!isPerPageDropdownOpen)}
                                className="flex items-center justify-between min-w-[120px] bg-slate-50 border border-slate-200 hover:bg-slate-100 text-slate-700 text-sm font-medium py-2 px-4 rounded-lg shadow-sm transition-all focus:outline-none focus:ring-2 focus:ring-indigo-100"
                            >
                                <span>{itemsPerPage} / Trang</span>
                                <svg className={`w-4 h-4 ml-2 text-slate-400 transition-transform ${isPerPageDropdownOpen ? 'rotate-180' : ''}`} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
                                </svg>
                            </button>
                            {isPerPageDropdownOpen && (
                                <>
                                    <div className="fixed inset-0 z-10" onClick={() => setIsPerPageDropdownOpen(false)}></div>
                                    <div className="absolute z-[100] bottom-full mb-2 w-full bg-white border border-slate-200 rounded-lg shadow-2xl overflow-hidden animate-fade-in-up origin-bottom-left" style={{ animationDuration: '0.2s' }}>
                                        {[10, 20, 50, 100].map(val => (
                                            <button
                                                key={val}
                                                onClick={() => {
                                                    setItemsPerPage(val);
                                                    setPage(1);
                                                    setIsPerPageDropdownOpen(false);
                                                }}
                                                className={`w-full text-left px-4 py-2 text-sm transition-colors flex items-center justify-between ${itemsPerPage === val ? 'bg-indigo-50 text-indigo-700 font-bold' : 'text-slate-600 hover:bg-slate-50 font-medium'}`}
                                            >
                                                <span>{val} / Trang</span>
                                                {itemsPerPage === val && (
                                                    <svg className="w-4 h-4 text-indigo-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                                                    </svg>
                                                )}
                                            </button>
                                        ))}
                                    </div>
                                </>
                            )}
                        </div>
                    </div>
                    <div>
                        <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px" aria-label="Pagination">
                            <button onClick={() => setPage(currentPage - 1)} disabled={currentPage === 1} className="relative inline-flex items-center px-2 py-2 rounded-l-md border border-slate-300 bg-white text-sm font-medium text-slate-500 hover:bg-slate-50 disabled:opacity-50">
                                <span className="sr-only">Trước</span>
                                <svg className="h-5 w-5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true"><path fillRule="evenodd" d="M12.707 5.293a1 1 0 010 1.414L9.414 10l3.293 3.293a1 1 0 01-1.414 1.414l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 0z" clipRule="evenodd" /></svg>
                            </button>
                            {Array.from({ length: totalPages }, (_, i) => i + 1).map(p => (
                                <button key={p} onClick={() => setPage(p)} className={`relative inline-flex items-center px-4 py-2 border text-sm font-medium ${p === currentPage ? 'z-10 bg-indigo-50 border-indigo-500 text-indigo-600' : 'bg-white border-slate-300 text-slate-500 hover:bg-slate-50'}`}>
                                    {p}
                                </button>
                            ))}
                            <button onClick={() => setPage(currentPage + 1)} disabled={currentPage === totalPages} className="relative inline-flex items-center px-2 py-2 rounded-r-md border border-slate-300 bg-white text-sm font-medium text-slate-500 hover:bg-slate-50 disabled:opacity-50">
                                <span className="sr-only">Sau</span>
                                <svg className="h-5 w-5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true"><path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" /></svg>
                            </button>
                        </nav>
                    </div>
                </div>
            </div>
        );
    };

    const deleteNote = (uid: string, noteId: string) => {
        setConfirmModal({
            isOpen: true,
            text: 'Xoá ghi chú này?',
            onConfirm: async () => {
                try {
                    await fetch(`/api/admin/user-details/${uid}/notes/${noteId}`, { method: 'DELETE', headers });
                    fetchUserDetails(uid);
                    fetchGlobalData();
                    showNotification('Đã xóa ghi chú');
                } catch (e) { showNotification('Xóa ghi chú thất bại', 'error'); }
            }
        });
    };

    const deleteTag = (uid: string, tagId: string) => {
        setConfirmModal({
            isOpen: true,
            text: 'Xoá thẻ ghi chú này?',
            onConfirm: async () => {
                try {
                    await fetch(`/api/admin/user-details/${uid}/tags/${tagId}`, { method: 'DELETE', headers });
                    fetchUserDetails(uid);
                    fetchGlobalData();
                    showNotification('Đã xóa thẻ ghi chú');
                } catch (e) { showNotification('Xóa thẻ thất bại', 'error'); }
            }
        });
    };

    const deleteConversion = (uid: string, conversionId: string) => {
        setConfirmModal({
            isOpen: true,
            text: 'Xoá lịch sử chuyển đổi này?',
            onConfirm: async () => {
                try {
                    await fetch(`/api/admin/user-details/${uid}/conversions/${conversionId}`, { method: 'DELETE', headers });
                    fetchUserDetails(uid);
                    fetchGlobalData();
                    showNotification('Đã xóa chuyển đổi tệ');
                } catch (e) { showNotification('Xóa chuyển đổi tệ thất bại', 'error'); }
            }
        });
    };

    const deleteStat = (uid: string, statId: string) => {
        setConfirmModal({
            isOpen: true,
            text: 'Xoá lịch sử thống kê doanh thu này?',
            onConfirm: async () => {
                try {
                    await fetch(`/api/admin/user-details/${uid}/stats/${statId}`, { method: 'DELETE', headers });
                    fetchUserDetails(uid);
                    fetchGlobalData();
                    showNotification('Đã xóa thống kê');
                } catch (e) { showNotification('Xóa thống kê thất bại', 'error'); }
            }
        });
    };

    const createModel = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newModelName || !newModelKey) return;
        try {
            if (editingModelId) {
                await fetch(`/api/admin/models/${editingModelId}`, {
                    method: 'PUT',
                    headers: { ...headers, 'Content-Type': 'application/json' },
                    body: JSON.stringify({ name: newModelName, modelKey: newModelKey })
                });
                setEditingModelId(null);
            } else {
                await fetch('/api/admin/models', {
                    method: 'POST',
                    headers: { ...headers, 'Content-Type': 'application/json' },
                    body: JSON.stringify({ name: newModelName, modelKey: newModelKey })
                });
            }
            setNewModelName('');
            setNewModelKey('');
            const modelsRes = await fetch('/api/admin/models', { headers });
            if (modelsRes.ok) setAllModels(await modelsRes.json());
        } catch(e) {}
    };

    const handleEditModel = (model: any) => {
        setEditingModelId(model.id);
        setNewModelName(model.name);
        setNewModelKey(model.modelKey);
    };

    const deleteModel = (id: string) => {
        setConfirmModal({
            isOpen: true,
            text: 'Xoá AI model này khỏi hệ thống?',
            onConfirm: async () => {
                try {
                    await fetch(`/api/admin/models/${id}`, { method: 'DELETE', headers });
                    fetchGlobalData();
                } catch (e) {}
            }
        });
    };

    if (!isAdmin) {
        return (
            <div className="flex-1 flex flex-col items-center justify-center p-8 text-center text-rose-500 bg-white">
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-16 h-16 mb-4 opacity-50">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
                <div className="font-bold text-xl mb-4">Bạn không có quyền truy cập trang này.</div>
                <button onClick={onExit} className="px-6 py-2.5 bg-slate-100 text-slate-700 font-bold rounded-full hover:bg-slate-200 transition-colors">Về Trang Chủ</button>
            </div>
        );
    }

    return (
        <div className="flex-1 flex flex-col h-screen overflow-hidden bg-slate-50 relative">
            <header className="h-16 bg-white border-b border-slate-200 px-6 flex items-center justify-between shrink-0 shadow-sm z-30">
                <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-600 to-purple-600 flex items-center justify-center text-white font-bold shadow-md">
                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5">
                            <path fillRule="evenodd" d="M4.5 3.75a3 3 0 0 0-3 3v10.5a3 3 0 0 0 3 3h15a3 3 0 0 0 3-3V6.75a3 3 0 0 0-3-3h-15Zm4.125 3a2.25 2.25 0 1 0 0 4.5 2.25 2.25 0 0 0 0-4.5Zm-3.873 8.703a4.126 4.126 0 0 1 7.746 0 .75.75 0 0 1-.351.92 7.47 7.47 0 0 1-3.522.877 7.47 7.47 0 0 1-3.522-.877.75.75 0 0 1-.351-.92ZM15 8.25a.75.75 0 0 0 0 1.5h3.75a.75.75 0 0 0 0-1.5H15ZM14.25 12a.75.75 0 0 1 .75-.75h3.75a.75.75 0 0 1 0 1.5H15a.75.75 0 0 1-.75-.75Zm.75 2.25a.75.75 0 0 0 0 1.5h3.75a.75.75 0 0 0 0-1.5H15Z" clipRule="evenodd" />
                        </svg>
                    </div>
                    <h1 className="text-xl font-black text-slate-800 tracking-tight">Admin<span className="text-indigo-600">Panel</span></h1>
                </div>
                <div className="flex flex-row items-center gap-4">
                    <div className="flex items-center gap-2">
                         {user?.photoURL ? (
                             <img src={user?.photoURL} alt="Admin avatar" className="w-8 h-8 rounded-full border border-slate-200" />
                         ) : (
                             <div className="w-8 h-8 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-700 font-bold border border-indigo-200">
                                 {user?.displayName ? user.displayName.charAt(0) : 'A'}
                             </div>
                         )}
                         <span className="font-bold text-sm text-slate-700 hidden sm:block">{user?.displayName}</span>
                    </div>
                    <button 
                        onClick={onExit}
                        className="px-4 py-2 bg-slate-100 font-bold text-slate-600 rounded-lg shadow-sm hover:bg-slate-200 hover:text-slate-800 transition-all flex items-center gap-2 text-sm"
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-4 h-4">
                            <path strokeLinecap="round" strokeLinejoin="round" d="m9 15 6-6m0 0-6-6m6 6H3" />
                        </svg>
                        Thoát
                    </button>
                </div>
            </header>

            <div className="flex flex-1 overflow-hidden">
                {/* Sidebar */}
                <div className="w-64 bg-white border-r border-slate-200 py-6 px-4 flex flex-col gap-2 shrink-0 hidden md:flex z-20 overflow-y-auto">
                    <p className="text-xs font-bold text-slate-400 uppercase tracking-widest px-2 mb-2 mt-2">Quản Lý</p>
                    
                    <button 
                        onClick={() => setActiveMenu('account')}
                        className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all font-semibold ${activeMenu === 'account' ? 'bg-indigo-50 text-indigo-700' : 'text-slate-600 hover:bg-slate-50 hover:text-slate-800'}`}
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5 opacity-80"><path fillRule="evenodd" d="M8.25 6.75a3.75 3.75 0 1 1 7.5 0 3.75 3.75 0 0 1-7.5 0ZM15.75 9.75a3 3 0 1 1 6 0 3 3 0 0 1-6 0ZM2.25 9.75a3 3 0 1 1 6 0 3 3 0 0 1-6 0ZM6.31 15.117A6.745 6.745 0 0 1 12 12a6.745 6.745 0 0 1 6.709 7.498.75.75 0 0 1-.372.568A12.696 12.696 0 0 1 12 21.75c-2.305 0-4.47-.612-6.337-1.684a.75.75 0 0 1-.372-.568 6.787 6.787 0 0 1 1.019-4.38Z" clipRule="evenodd" /></svg>
                        Tài Khoản
                    </button>
                    
                    <button 
                        onClick={() => setActiveMenu('tags')}
                        className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all font-semibold ${activeMenu === 'tags' ? 'bg-indigo-50 text-indigo-700' : 'text-slate-600 hover:bg-slate-50 hover:text-slate-800'}`}
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5 opacity-80"><path fillRule="evenodd" d="M5.25 2.25a3 3 0 0 0-3 3v4.318a3 3 0 0 0 .879 2.121l9.58 9.581c.92.92 2.39 1.186 3.548.428a18.849 18.849 0 0 0 5.441-5.44c.758-1.16.492-2.629-.428-3.548l-9.58-9.581a3 3 0 0 0-2.122-.879H5.25ZM6.375 7.5a1.125 1.125 0 1 0 0-2.25 1.125 1.125 0 0 0 0 2.25Z" clipRule="evenodd" /></svg>
                        Thẻ Ghi Chú
                    </button>
                    
                    <button 
                        onClick={() => setActiveMenu('notes')}
                        className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all font-semibold ${activeMenu === 'notes' ? 'bg-indigo-50 text-indigo-700' : 'text-slate-600 hover:bg-slate-50 hover:text-slate-800'}`}
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5 opacity-80"><path fillRule="evenodd" d="M5.625 1.5H9a3.75 3.75 0 0 1 3.75 3.75v1.875c0 1.036.84 1.875 1.875 1.875H16.5a3.75 3.75 0 0 1 3.75 3.75v7.875c0 1.035-.84 1.875-1.875 1.875H5.625a1.875 1.875 0 0 1-1.875-1.875V3.375c0-1.036.84-1.875 1.875-1.875Zm5.845 17.03a.75.75 0 0 0 1.06 0l3-3a.75.75 0 1 0-1.06-1.06l-1.72 1.72V12a.75.75 0 0 0-1.5 0v4.19l-1.72-1.72a.75.75 0 0 0-1.06 1.06l3 3Z" clipRule="evenodd" /><path d="M14.25 5.25a5.23 5.23 0 0 0-1.279-3.434 9.768 9.768 0 0 1 6.963 6.963A5.23 5.23 0 0 0 16.5 7.5h-1.875a.375.375 0 0 1-.375-.375V5.25Z" /></svg>
                        Ghi Chú
                    </button>

                    <button 
                        onClick={() => setActiveMenu('chats')}
                        className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all font-semibold ${activeMenu === 'chats' ? 'bg-indigo-50 text-indigo-700' : 'text-slate-600 hover:bg-slate-50 hover:text-slate-800'}`}
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5 opacity-80"><path fillRule="evenodd" d="M7.5 8.25h9m-9 3H12m-9.75 1.51c0 1.6 1.123 2.994 2.707 3.227 1.129.166 2.27.293 3.423.379.35.026.67.21.865.501L12 21l2.755-4.133a1.14 1.14 0 0 1 .865-.501 48.172 48.172 0 0 0 3.423-.379c1.584-.233 2.707-1.626 2.707-3.228V6.741c0-1.602-1.123-2.995-2.707-3.228A48.394 48.394 0 0 0 12 3c-2.392 0-4.744.175-7.043.513C3.373 3.746 2.25 5.14 2.25 6.741v6.018Z" clipRule="evenodd" /></svg>
                        Lịch sử Chat
                    </button>

                    
                    
                    <button 
                        onClick={() => setActiveMenu('stats')}
                        className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all font-semibold ${activeMenu === 'stats' ? 'bg-indigo-50 text-indigo-700' : 'text-slate-600 hover:bg-slate-50 hover:text-slate-800'}`}
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5 opacity-80"><path d="M18.375 2.25c-1.035 0-1.875.84-1.875 1.875v15.75c0 1.035.84 1.875 1.875 1.875h.75c1.035 0 1.875-.84 1.875-1.875V4.125c0-1.036-.84-1.875-1.875-1.875h-.75ZM9.75 8.625c0-1.036.84-1.875 1.875-1.875h.75c1.036 0 1.875.84 1.875 1.875v11.25c0 1.035-.84 1.875-1.875 1.875h-.75a1.875 1.875 0 0 1-1.875-1.875V8.625ZM3 13.125c0-1.036.84-1.875 1.875-1.875h.75c1.036 0 1.875.84 1.875 1.875v6.75c0 1.035-.84 1.875-1.875 1.875h-.75A1.875 1.875 0 0 1 3 19.875v-6.75Z" /></svg>
                        Thống Kê
                    </button>
                </div>

                {/* Main Content Area */}
                <div className="flex-1 overflow-y-auto p-0 sm:p-0 relative flex flex-col">

                    {selectedItems.length > 0 && (
                        <div className="fixed bottom-8 left-1/2 -translate-x-1/2 bg-slate-800 text-white px-6 py-3 rounded-full flex items-center justify-between gap-6 shadow-2xl z-50 animate-fade-in-up">
                            <span className="font-semibold text-sm">Đã chọn {selectedItems.length} mục</span>
                            <button 
                                onClick={bulkDeleteAction}
                                className="bg-red-500 hover:bg-red-600 text-white text-sm font-bold py-1.5 px-4 rounded-full transition-colors shadow-sm"
                            >
                                Xóa tất cả
                            </button>
                        </div>
                    )}

                    
                    {/* ACCOUNT MENU */}
                    {activeMenu === 'account' && (
                       <div className="w-full h-full animate-fade-in-up flex flex-col">
                            <div className="flex flex-col flex-1 h-full">
                                <div className="p-6 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-slate-50/50">
                                    <div className="flex items-center gap-3">
                                        <h2 className="text-xl font-bold text-slate-800">Quản lý Tài Khoản</h2>
                                        <span className="px-3 py-1 bg-indigo-100 text-indigo-700 text-sm font-bold rounded-full">{sortedUsers.length} Tài khoản</span>
                                    </div>
                                    <input 
                                        type="text" 
                                        placeholder="Tìm kiếm tài khoản..." 
                                        value={searchQuery}
                                        onChange={e => setSearchQuery(e.target.value)}
                                        className="px-4 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-100 outline-none text-sm w-full sm:w-64"
                                    />
                                </div>
                                {loading && users.length === 0 ? <div className="p-8 text-center text-slate-500">Đang tải...</div> : (
                                    <div className="p-0 overflow-x-auto flex-1 flex flex-col justify-between">
                                        {paginatedUsers.length === 0 ? <p className="text-center text-slate-500 my-8">Không tìm thấy tài khoản nào</p> : (
                                            <>
                                            <table className="w-full text-left border-collapse min-w-[800px] border border-slate-200">
                                                <thead>
                                                    <tr className="bg-slate-50/80 border-b border-slate-200 text-xs uppercase tracking-wider text-slate-500">
                                                        <th className="p-4 font-bold border-r border-slate-200 text-center w-12"><input type="checkbox" onChange={(e) => toggleAll(paginatedUsers.map(u => u.uid))} checked={paginatedUsers.length > 0 && selectedItems.length > 0 && selectedItems.length === paginatedUsers.length} /></th>
                                                        <th className="p-4 font-bold border-r border-slate-200 text-center w-12">STT</th>
                                                        <th className="p-4 font-bold border-r border-slate-200 cursor-pointer hover:bg-slate-100" onClick={() => toggleSort('users', 'displayName')}>
                                                            Người Dùng {renderSortIcon('users', 'displayName')}
                                                        </th>
                                                        <th className="p-4 font-bold border-r border-slate-200">Trạng Thái</th>
                                                        <th className="p-4 font-bold border-r border-slate-200 cursor-pointer hover:bg-slate-100" onClick={() => toggleSort('users', 'appUsageTime')}>
                                                            Thời gian sử dụng {renderSortIcon('users', 'appUsageTime')}
                                                        </th>
                                                        <th className="p-4 font-bold border-r border-slate-200 cursor-pointer hover:bg-slate-100" onClick={() => toggleSort('users', 'lastSeen')}>
                                                            Lần cuối online {renderSortIcon('users', 'lastSeen')}
                                                        </th>
                                                        <th className="p-4 font-bold text-right">Thao Tác</th>
                                                    </tr>
                                                </thead>
                                                <tbody className="divide-y divide-slate-100">
                                                    {paginatedUsers.map((u, index) => (
                                                        <React.Fragment key={u.uid}>
                                                            <tr 
                                                                className={`hover:bg-indigo-50/60 cursor-pointer transition-colors ${selectedUser === u.uid ? 'bg-indigo-50/30' : ''}`}
                                                                onClick={() => handleSelectUser(u.uid)}
                                                            >
                                                                <td className="p-4 border-r border-slate-200 text-center" onClick={(e) => e.stopPropagation()}><input type="checkbox" checked={selectedItems.includes(u.uid)} onChange={() => toggleSelection(u.uid)} /></td>
                                                                <td className="p-4 border-r border-slate-200 text-center text-slate-500 font-bold">{(pageUsers - 1) * itemsPerPage + index + 1}</td>
                                                                <td className="p-4 border-r border-slate-200">
                                                                    <div className="flex items-center gap-3">
                                                                        {u.photoURL ? (
                                                                            <img src={u.photoURL} alt="avatar" className="w-10 h-10 rounded-full border border-slate-200 object-cover shadow-sm shrink-0" />
                                                                        ) : (
                                                                            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-slate-200 to-slate-300 flex items-center justify-center text-slate-600 font-bold border border-slate-300 shadow-sm shrink-0">
                                                                                {u.displayName ? u.displayName.charAt(0).toUpperCase() : '?'}
                                                                            </div>
                                                                        )}
                                                                        <div className="flex flex-col max-w-[200px]">
                                                                            <span className="font-bold text-sm text-slate-800 truncate" title={u.displayName}>{u.displayName}</span>
                                                                            <span className="text-xs text-slate-500 truncate" title={u.email}>{u.email}</span>
                                                                        </div>
                                                                    </div>
                                                                </td>
                                                                <td className="p-4 border-r border-slate-200">
                                                                    <div className="flex items-center gap-2">
                                                                        <span className={`w-2.5 h-2.5 rounded-full ${u.status === 'online' ? 'bg-emerald-500' : u.status === 'away' ? 'bg-orange-500' : 'bg-slate-300'}`}></span>
                                                                        <span className="text-xs font-semibold text-slate-600">{u.status === 'online' ? 'Online' : u.status === 'away' ? 'Away' : 'Offline'}</span>
                                                                        {u.isLocked && <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-red-100 text-red-700 ml-1">LOCKED</span>}
                                                                        {u.isAdmin && <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-rose-100 text-rose-700 uppercase tracking-widest ml-1">Admin</span>}
                                                                    </div>
                                                                </td>
                                                                <td className="p-4 border-r border-slate-200">
                                                                    <span className="text-sm font-semibold text-slate-600">⏳ {formatTime(u.appUsageTime)}</span>
                                                                </td>
                                                                <td className="p-4 border-r border-slate-200">
                                                                    <span className="text-xs text-slate-500">{new Date(u.lastSeen || Date.now()).toLocaleString()}</span>
                                                                </td>
                                                                <td className="p-4 text-right flex gap-2 justify-end">
                                                                    <button 
                                                                        onClick={(e) => { e.stopPropagation(); toggleLockUser(u.uid, u.isLocked); }}
                                                                        className={`px-3 py-1.5 text-xs font-bold rounded-lg border transition-all shadow-sm ${u.isLocked ? 'border-indigo-200 bg-indigo-50 text-indigo-600 hover:bg-indigo-100' : 'border-red-200 bg-red-white text-red-600 hover:bg-red-50'}`}
                                                                    >
                                                                        {u.isLocked ? "Mở khóa" : "Khóa"}
                                                                    </button>
                                                                    <button 
                                                                        onClick={(e) => { e.stopPropagation(); deleteUser(u.uid); }}
                                                                        className="px-3 py-1.5 text-xs font-bold rounded-lg border border-red-500 bg-red-500 text-white hover:bg-red-600 transition-all shadow-sm"
                                                                    >
                                                                        Xoá
                                                                    </button>
                                                                </td>
                                                            </tr>
                                                            
                                                            {/* Expanded Details - Chat Sessions and Converts */}
                                                            {selectedUser === u.uid && (
                                                                <tr className="bg-slate-50/50">
                                                                    <td colSpan={5} className="p-0 border-t-0">
                                                                        <div className="px-6 py-6 pb-8 border-t border-slate-100 border-b shadow-inner">
                                                                            {loadingDetails ? (
                                                                                <div className="flex justify-center p-4">
                                                                                    <div className="w-6 h-6 border-2 border-indigo-200 border-t-indigo-600 rounded-full animate-spin"></div>
                                                                                </div>
                                                                            ) : userDetails ? (
                                                                                <div className="flex flex-col gap-6">
                                                                                    {/* Lịch sử Chat AI */}
                                                                                    <div className="bg-white rounded-xl p-4 shadow-sm border border-slate-200">
                                                                                        <h3 className="text-sm font-bold text-slate-700 mb-3 flex items-center gap-2">
                                                                                            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-4 h-4 text-indigo-500"><path strokeLinecap="round" strokeLinejoin="round" d="M7.5 8.25h9m-9 3H12m-9.75 1.51c0 1.6 1.123 2.994 2.707 3.227 1.129.166 2.27.293 3.423.379.35.026.67.21.865.501L12 21l2.755-4.133a1.14 1.14 0 0 1 .865-.501 48.172 48.172 0 0 0 3.423-.379c1.584-.233 2.707-1.626 2.707-3.228V6.741c0-1.602-1.123-2.995-2.707-3.228A48.394 48.394 0 0 0 12 3c-2.392 0-4.744.175-7.043.513C3.373 3.746 2.25 5.14 2.25 6.741v6.018Z" /></svg>
                                                                                            Lịch sử Chat AI ({userDetails.chatSessions.length})
                                                                                        </h3>
                                                                                        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 max-h-[250px] overflow-y-auto pr-2">
                                                                                            {userDetails.chatSessions.length === 0 ? <p className="text-sm text-slate-400">Chưa có lịch sử</p> :
                                                                                                userDetails.chatSessions.map((chat: any) => (
                                                                                                    <div key={chat.id} className="p-3 bg-slate-50 rounded-lg border border-slate-100 flex justify-between items-start">
                                                                                                        <div className="mr-2 overflow-hidden">
                                                                                                            <p className="text-sm font-semibold text-indigo-700 truncate" title={chat.title}>{chat.title || 'Cuộc trò chuyện mới'}</p>
                                                                                                            <div className="flex items-center gap-2 mt-1">
                                                                                                                <span className="text-xs text-slate-500 bg-white px-1.5 py-0.5 rounded border border-slate-200">{chat.messages?.length || 0} tin nhắn</span>
                                                                                                                <span className="text-xs text-slate-400">{new Date(chat.updatedAt).toLocaleDateString()}</span>
                                                                                                            </div>
                                                                                                        </div>
                                                                                                        <button onClick={() => deleteChat(u.uid, chat.id)} className="text-slate-400 hover:text-red-500 transition-colors shrink-0">
                                                                                                            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-4 h-4"><path strokeLinecap="round" strokeLinejoin="round" d="m14.74 9-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 0 1-2.244 2.077H8.084a2.25 2.25 0 0 1-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 0 0-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 0 1 3.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 0 0-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 0 0-7.5 0" /></svg>
                                                                                                        </button>
                                                                                                    </div>
                                                                                                ))
                                                                                            }
                                                                                        </div>
                                                                                    </div>
                                                                                    
                                                                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                                                                        {/* Conversions History (Personal) */}
                                                                                        <div className="bg-white rounded-xl p-4 shadow-sm border border-slate-200">
                                                                                            <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-3">Lịch sử chuyển đổi tệ ({userDetails.convertHistory?.length || 0})</h3>
                                                                                            <div className="flex flex-col gap-2 max-h-[150px] overflow-y-auto pr-2">
                                                                                                {!userDetails.convertHistory || userDetails.convertHistory.length === 0 ? <p className="text-sm text-slate-400">Chưa có dữ liệu</p> :
                                                                                                    userDetails.convertHistory.map((conv: any) => (
                                                                                                        <div key={conv.id} className="p-3 bg-slate-50 rounded-lg border border-slate-100 flex items-center justify-between gap-4">
                                                                                                            <div>
                                                                                                                <p className="text-sm text-slate-700 font-medium">{conv.inputAmount} {'->'} {conv.convertedAmount} {conv.toCurrency?.code}</p>
                                                                                                                <p className="text-xs text-slate-400 mt-1">{new Date(conv.timestamp).toLocaleString()}</p>
                                                                                                            </div>
                                                                                                            <button onClick={() => deleteConversion(u.uid, conv.id)} className="text-red-500 p-1 bg-red-50 rounded-md hover:bg-red-100 shrink-0">
                                                                                                                <span className="text-[10px] font-bold">Xoá</span>
                                                                                                            </button>
                                                                                                        </div>
                                                                                                    ))
                                                                                                }
                                                                                            </div>
                                                                                        </div>
                                                                                        
                                                                                        <div className="bg-white rounded-xl p-4 shadow-sm border border-slate-200">
                                                                                            <p className="text-sm text-slate-500 text-center py-4">Sử dụng các Tab ở Sidebar để duyệt toàn bộ Ghi Chú, Thẻ và Thống kê Doanh thu.</p>
                                                                                        </div>
                                                                                    </div>
                                                                                </div>
                                                                            ) : null}
                                                                        </div>
                                                                    </td>
                                                                </tr>
                                                            )}
                                                        </React.Fragment>
                                                    ))}
                                                </tbody>
                                            </table>
                                            {renderPagination(pageUsers, setPageUsers, sortedUsers.length)}
                                            </>
                                        )}
                                    </div>
                                )}
                            </div>
                       </div> 
                    )}

                    {/* TAGS MENU */}
                    {activeMenu === 'tags' && (
                        <div className="w-full h-full animate-fade-in-up flex flex-col">
                             <div className="flex flex-col flex-1 h-full">
                                <div className="p-6 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-slate-50/50">
                                    <div className="flex items-center gap-3">
                                        <h2 className="text-xl font-bold text-slate-800">Quản lý Thẻ Ghi Chú</h2>
                                        <span className="px-3 py-1 bg-indigo-100 text-indigo-700 text-sm font-bold rounded-full">{allTags.length} Thẻ</span>
                                    </div>
                                    <input 
                                        type="text" 
                                        placeholder="Tìm kiếm thẻ..." 
                                        value={searchQuery}
                                        onChange={e => setSearchQuery(e.target.value)}
                                        className="px-4 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-100 outline-none text-sm w-full sm:w-64"
                                    />
                                </div>
                                <div className="p-0 overflow-x-auto flex-1 flex flex-col justify-between">
                                    {paginatedTags.length === 0 ? <p className="text-center text-slate-500 my-8">Không tìm thấy thẻ ghi chú nào</p> : (
                                        <>
                                        <table className="w-full text-left border-collapse min-w-[800px] border border-slate-200">
                                            <thead>
                                                <tr className="bg-slate-50/80 border-b border-slate-200 text-xs uppercase tracking-wider text-slate-500">
                                                    <th className="p-4 font-bold border-r border-slate-200 text-center w-12"><input type="checkbox" onChange={(e) => toggleAll(paginatedTags.map(t => `${t.userId}-${t.id}`))} checked={paginatedTags.length > 0 && selectedItems.length > 0 && selectedItems.length === paginatedTags.length} /></th>
                                                    <th className="p-4 font-bold border-r border-slate-200 text-center w-12">STT</th>
                                                    <th className="p-4 font-bold border-r border-slate-200 cursor-pointer hover:bg-slate-100" onClick={() => toggleSort('tags', 'userName')}>
                                                        Người Dùng {renderSortIcon('tags', 'userName')}
                                                    </th>
                                                    <th className="p-4 font-bold border-r border-slate-200 cursor-pointer hover:bg-slate-100" onClick={() => toggleSort('tags', 'name')}>
                                                        Tên Thẻ {renderSortIcon('tags', 'name')}
                                                    </th>
                                                    <th className="p-4 font-bold border-r border-slate-200 text-center">Màu Sắc</th>
                                                    <th className="p-4 font-bold text-right">Thao Tác</th>
                                                </tr>
                                            </thead>
                                            <tbody className="divide-y divide-slate-100">
                                                {paginatedTags.map((t: any, index: number) => (
                                                    <tr key={`${t.userId}-${t.id}`} className="hover:bg-indigo-50/60 transition-colors">
                                                        <td className="p-4 border-r border-slate-200 text-center" onClick={(e) => e.stopPropagation()}><input type="checkbox" checked={selectedItems.includes(`${t.userId}-${t.id}`)} onChange={() => toggleSelection(`${t.userId}-${t.id}`)} /></td>
                                                        <td className="p-4 border-r border-slate-200 text-center text-slate-500 font-bold">{(pageTags - 1) * itemsPerPage + index + 1}</td>
                                                        <td className="p-4 border-r border-slate-200">
                                                            <div className="flex flex-col">
                                                                <span className="font-bold text-sm text-slate-700">{t.userName || 'Không rõ'}</span>
                                                            </div>
                                                        </td>
                                                        <td className="p-4 border-r border-slate-200">
                                                            <span className="font-medium text-slate-800">{t.name}</span>
                                                        </td>
                                                        <td className="p-4 border-r border-slate-200 text-center">
                                                            <span className="inline-block w-6 h-6 rounded-md shadow-sm border border-black/10" style={{ backgroundColor: t.color }}></span>
                                                        </td>
                                                        <td className="p-4 text-right">
                                                            <button 
                                                                onClick={() => deleteTag(t.userId, t.id)} 
                                                                className="text-white text-xs font-bold bg-red-500 px-3 py-1.5 rounded-lg shadow-sm hover:bg-red-600 transition-colors"
                                                            >
                                                                Xoá
                                                            </button>
                                                        </td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                        {renderPagination(pageTags, setPageTags, sortedTags.length)}
                                        </>
                                    )}
                                </div>
                            </div>
                        </div>
                    )}

                    {/* NOTES MENU */}
                    {activeMenu === 'notes' && (
                        <div className="w-full h-full animate-fade-in-up flex flex-col">
                            <div className="flex flex-col flex-1 h-full">
                                <div className="p-6 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-slate-50/50">
                                    <div className="flex items-center gap-3">
                                        <h2 className="text-xl font-bold text-slate-800">Quản lý Ghi Chú</h2>
                                        <span className="px-3 py-1 bg-indigo-100 text-indigo-700 text-sm font-bold rounded-full">{allNotes.length} Ghi chú</span>
                                    </div>
                                    <input 
                                        type="text" 
                                        placeholder="Tìm kiếm ghi chú..." 
                                        value={searchQuery}
                                        onChange={e => setSearchQuery(e.target.value)}
                                        className="px-4 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-100 outline-none text-sm w-full sm:w-64"
                                    />
                                </div>
                                <div className="p-0 overflow-x-auto flex-1 flex flex-col justify-between">
                                    {paginatedNotes.length === 0 ? <p className="text-center text-slate-500 my-8">Không tìm thấy ghi chú nào</p> : (
                                        <>
                                        <table className="w-full text-left border-collapse min-w-[800px] border border-slate-200">
                                            <thead>
                                                <tr className="bg-slate-50/80 border-b border-slate-200 text-xs uppercase tracking-wider text-slate-500">
                                                    <th className="p-4 font-bold border-r border-slate-200 text-center w-12"><input type="checkbox" onChange={(e) => toggleAll(paginatedNotes.map(n => `${n.userId}-${n.id}`))} checked={paginatedNotes.length > 0 && selectedItems.length > 0 && selectedItems.length === paginatedNotes.length} /></th>
                                                    <th className="p-4 font-bold border-r border-slate-200 text-center w-12">STT</th>
                                                    <th className="p-4 font-bold w-48 cursor-pointer hover:bg-slate-100" onClick={() => toggleSort('notes', 'userName')}>
                                                        Người Dùng {renderSortIcon('notes', 'userName')}
                                                    </th>
                                                    <th className="p-4 font-bold border-r border-slate-200 cursor-pointer hover:bg-slate-100" onClick={() => toggleSort('notes', 'content')}>
                                                        Nội Dung {renderSortIcon('notes', 'content')}
                                                    </th>
                                                    <th className="p-4 font-bold border-r border-slate-200 w-48">Thẻ</th>
                                                    <th className="p-4 font-bold w-32 cursor-pointer hover:bg-slate-100" onClick={() => toggleSort('notes', 'timestamp')}>
                                                        Thời Gian {renderSortIcon('notes', 'timestamp')}
                                                    </th>
                                                    <th className="p-4 font-bold text-right w-24">Thao Tác</th>
                                                </tr>
                                            </thead>
                                            <tbody className="divide-y divide-slate-100">
                                                {paginatedNotes.map((n: any, index: number) => {
                                                    const currentTag = allTags.find(t => t.id === n.tagId && t.userId === n.userId);
                                                    return (
                                                    <tr key={`${n.userId}-${n.id}`} className="hover:bg-indigo-50/60 transition-colors">
                                                        <td className="p-4 border-r border-slate-200 text-center" onClick={(e) => e.stopPropagation()}><input type="checkbox" checked={selectedItems.includes(`${n.userId}-${n.id}`)} onChange={() => toggleSelection(`${n.userId}-${n.id}`)} /></td>
                                                        <td className="p-4 border-r border-slate-200 text-center text-slate-500 font-bold">{(pageNotes - 1) * itemsPerPage + index + 1}</td>
                                                        <td className="p-4 border-r border-slate-200 align-top">
                                                            <div className="flex flex-col">
                                                                <span className="font-bold text-sm text-slate-700">{n.userName || 'Không rõ'}</span>
                                                            </div>
                                                        </td>
                                                        <td className="p-4 border-r border-slate-200 align-top">
                                                            <p className="text-sm font-medium text-slate-800 whitespace-pre-wrap">{n.content}</p>
                                                        </td>
                                                        <td className="p-4 border-r border-slate-200 align-top">
                                                            {currentTag ? (
                                                                <div className="flex flex-wrap gap-1">
                                                                    <span className="px-2 py-0.5 rounded text-[10px] text-white font-bold shadow-sm" style={{ backgroundColor: currentTag.color }}>{currentTag.name}</span>
                                                                </div>
                                                            ) : <span className="text-xs text-slate-400">Không có thẻ</span>}
                                                        </td>
                                                        <td className="p-4 border-r border-slate-200 align-top text-xs text-slate-500">
                                                            {new Date(n.timestamp).toLocaleString()}
                                                        </td>
                                                        <td className="p-4 border-r border-slate-200 align-top text-right">
                                                            <button 
                                                                onClick={() => deleteNote(n.userId, n.id)} 
                                                                className="text-white text-xs font-bold bg-red-500 px-3 py-1.5 rounded-lg shadow-sm hover:bg-red-600 transition-colors"
                                                            >
                                                                Xoá
                                                            </button>
                                                        </td>
                                                    </tr>
                                                )})}
                                            </tbody>
                                        </table>
                                        {renderPagination(pageNotes, setPageNotes, sortedNotes.length)}
                                        </>
                                    )}
                                </div>
                            </div>
                        </div>
                    )}

                    {/* CHATS MENU */}
                    {activeMenu === 'chats' && (
                        <div className="w-full h-full animate-fade-in-up flex flex-col">
                            <div className="flex flex-col flex-1 h-full">
                                <div className="p-6 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-slate-50/50">
                                    <div className="flex items-center gap-3">
                                        <h2 className="text-xl font-bold text-slate-800">Lịch sử Chat AI</h2>
                                        <span className="px-3 py-1 bg-indigo-100 text-indigo-700 text-sm font-bold rounded-full">{allChats.length} Phiên</span>
                                    </div>
                                    <input 
                                        type="text" 
                                        placeholder="Tìm kiếm tiêu đề/tên..." 
                                        value={searchQuery}
                                        onChange={e => setSearchQuery(e.target.value)}
                                        className="px-4 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-100 outline-none text-sm w-full sm:w-64"
                                    />
                                </div>
                                <div className="p-0 overflow-x-auto flex-1 flex flex-col justify-between">
                                    {paginatedChats.length === 0 ? <p className="text-center text-slate-500 my-8">Chưa có lịch sử chat nào</p> : (
                                        <>
                                        <table className="w-full text-left border-collapse min-w-[800px] border border-slate-200">
                                            <thead>
                                                <tr className="bg-slate-50/80 border-b border-slate-200 text-xs uppercase tracking-wider text-slate-500">
                                                    <th className="p-4 font-bold border-r border-slate-200 text-center w-12"><input type="checkbox" onChange={(e) => toggleAll(paginatedChats.map(c => `${c.userId}-${c.id}`))} checked={paginatedChats.length > 0 && selectedItems.length > 0 && selectedItems.length === paginatedChats.length} /></th>
                                                    <th className="p-4 font-bold border-r border-slate-200 text-center w-12">STT</th>
                                                    <th className="p-4 font-bold border-r border-slate-200 cursor-pointer hover:bg-slate-100" onClick={() => toggleSort('chats', 'userName')}>
                                                        Người Dùng {renderSortIcon('chats', 'userName')}
                                                    </th>
                                                    <th className="p-4 font-bold border-r border-slate-200 cursor-pointer hover:bg-slate-100" onClick={() => toggleSort('chats', 'title')}>
                                                        Tiêu Đề Chat {renderSortIcon('chats', 'title')}
                                                    </th>
                                                    <th className="p-4 font-bold border-r border-slate-200 text-center">Tin Nhắn</th>
                                                    <th className="p-4 font-bold border-r border-slate-200 cursor-pointer hover:bg-slate-100" onClick={() => toggleSort('chats', 'updatedAt')}>
                                                        Cập Nhật {renderSortIcon('chats', 'updatedAt')}
                                                    </th>
                                                    <th className="p-4 font-bold text-right">Thao Tác</th>
                                                </tr>
                                            </thead>
                                            <tbody className="divide-y divide-slate-100">
                                                {paginatedChats.map((c, index) => (
                                                    <tr key={c.id} className="hover:bg-indigo-50/60 transition-colors">
                                                        <td className="p-4 border-r border-slate-200 text-center" onClick={(e) => e.stopPropagation()}><input type="checkbox" checked={selectedItems.includes(`${c.userId}-${c.id}`)} onChange={() => toggleSelection(`${c.userId}-${c.id}`)} /></td>
                                                        <td className="p-4 border-r border-slate-200 text-center text-slate-500 font-bold">{(pageChats - 1) * itemsPerPage + index + 1}</td>
                                                        <td className="p-4 border-r border-slate-200 flex flex-col">
                                                            <span className="font-bold text-sm text-slate-700">{c.userName || 'Không rõ'}</span>
                                                        </td>
                                                        <td className="p-4 border-r border-slate-200">
                                                            <span className="font-medium text-sm text-slate-800">{c.title || 'Chat không tiêu đề'}</span>
                                                        </td>
                                                        <td className="p-4 border-r border-slate-200 text-center">
                                                            <span className="px-2 py-1 bg-slate-100 text-slate-600 rounded text-xs font-bold">{c.messages?.length || 0}</span>
                                                        </td>
                                                        <td className="p-4 border-r border-slate-200 text-xs text-slate-500">
                                                            {new Date(c.updatedAt).toLocaleString()}
                                                        </td>
                                                        <td className="p-4 text-right">
                                                            <button 
                                                                onClick={() => deleteChat(c.userId, c.id)}
                                                                className="text-white text-xs font-bold bg-red-500 px-3 py-1.5 rounded-lg shadow-sm hover:bg-red-600 transition-colors"
                                                            >
                                                                Xoá
                                                            </button>
                                                        </td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                        {renderPagination(pageChats, setPageChats, sortedChats.length)}
                                        </>
                                    )}
                                </div>
                            </div>
                        </div>
                    )}

                    {/* STATS MENU */}
                    {activeMenu === 'stats' && (
                        <div className="w-full h-full animate-fade-in-up flex flex-col">
                            
                            <div className="flex flex-col flex-1 h-full">
                                <div className="p-6 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-slate-50/50">
                                    <h2 className="text-xl font-bold text-slate-800">Tất Cả Thống Kê Doanh Thu</h2>
                                    <input 
                                        type="text" 
                                        placeholder="Tìm kiếm thống kê..." 
                                        value={searchQuery}
                                        onChange={e => setSearchQuery(e.target.value)}
                                        className="px-4 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-100 outline-none text-sm w-full sm:w-64"
                                    />
                                </div>
                                <div className="p-0 overflow-x-auto flex-1 flex flex-col justify-between">
                                    {paginatedStats.length === 0 ? <p className="text-center text-slate-500 my-8">Không tìm thấy dữ liệu thống kê nào</p> : (
                                        <>
                                        <table className="w-full text-left border-collapse min-w-[800px] border border-slate-200">
                                            <thead>
                                                <tr className="bg-slate-50/80 border-b border-slate-200 text-xs uppercase tracking-wider text-slate-500">
                                                    <th className="p-4 font-bold border-r border-slate-200 text-center w-12"><input type="checkbox" onChange={(e) => toggleAll(paginatedStats.map(s => `${s.userId}-${s.id}`))} checked={paginatedStats.length > 0 && selectedItems.length > 0 && selectedItems.length === paginatedStats.length} /></th>
                                                    <th className="p-4 font-bold border-r border-slate-200 text-center w-12">STT</th>
                                                    <th className="p-4 font-bold border-r border-slate-200 cursor-pointer hover:bg-slate-100" onClick={() => toggleSort('stats', 'userName')}>
                                                        Người Dùng {renderSortIcon('stats', 'userName')}
                                                    </th>
                                                    <th className="p-4 font-bold border-r border-slate-200 cursor-pointer hover:bg-slate-100" onClick={() => toggleSort('stats', 'shareType')}>
                                                        Loại {renderSortIcon('stats', 'shareType')}
                                                    </th>
                                                    <th className="p-4 font-bold text-right cursor-pointer hover:bg-slate-100" onClick={() => toggleSort('stats', 'inputSalary')}>
                                                        <div>Lương {renderSortIcon('stats', 'inputSalary')}</div>
                                                        <div className="text-xs font-normal text-slate-500">(VNĐ)</div>
                                                    </th>
                                                    <th className="p-4 font-bold text-right cursor-pointer hover:bg-slate-100" onClick={() => toggleSort('stats', 'totalRevenue')}>
                                                        <div>Tổng Doanh Thu {renderSortIcon('stats', 'totalRevenue')}</div>
                                                        <div className="text-xs font-normal text-slate-500">(VNĐ)</div>
                                                    </th>
                                                    <th className="p-4 font-bold text-right cursor-pointer hover:bg-slate-100" onClick={() => toggleSort('stats', 'netIncome')}>
                                                        <div>Thực Nhận {renderSortIcon('stats', 'netIncome')}</div>
                                                        <div className="text-xs font-normal text-slate-500">(VNĐ)</div>
                                                    </th>
                                                    <th className="p-4 font-bold border-r border-slate-200 cursor-pointer hover:bg-slate-100" onClick={() => toggleSort('stats', 'timestamp')}>
                                                        Thời Gian {renderSortIcon('stats', 'timestamp')}
                                                    </th>
                                                    <th className="p-4 font-bold text-right">Thao Tác</th>
                                                </tr>
                                            </thead>
                                            <tbody className="divide-y divide-slate-100">
                                                {paginatedStats.map((s: any, index: number) => (
                                                    <tr key={`${s.userId}-${s.id}`} className="hover:bg-indigo-50/60 transition-colors">
                                                        <td className="p-4 border-r border-slate-200 text-center" onClick={(e) => e.stopPropagation()}><input type="checkbox" checked={selectedItems.includes(`${s.userId}-${s.id}`)} onChange={() => toggleSelection(`${s.userId}-${s.id}`)} /></td>
                                                        <td className="p-4 border-r border-slate-200 text-center text-slate-500 font-bold">{(pageStats - 1) * itemsPerPage + index + 1}</td>
                                                        <td className="p-4 border-r border-slate-200">
                                                            <div className="flex flex-col">
                                                                <span className="font-bold text-sm text-slate-700">{s.userName || 'Không rõ'}</span>
                                                                <span className="text-xs text-slate-500">{s.userEmail || 'Không rõ'}</span>
                                                            </div>
                                                        </td>
                                                        <td className="p-4 border-r border-slate-200">
                                                            <div className="flex flex-col gap-1 items-start">
                                                                <span className="font-medium text-slate-800 text-sm bg-indigo-50 text-indigo-700 px-2 py-1 rounded inline-block">{s.shareType === 'cv' ? '30%' : s.shareType === 'job' ? '70%' : '100%'}</span>
                                                                {s.note && <span className="text-[10px] text-slate-500 max-w-[150px] truncate" title={s.note}>{s.note}</span>}
                                                            </div>
                                                        </td>
                                                        <td className="p-4 text-right">
                                                            <span className="text-sm text-slate-600">{Number(s.inputSalary || 0).toLocaleString()}</span>
                                                        </td>
                                                        <td className="p-4 text-right">
                                                            <span className="text-sm text-slate-600">{Number(s.totalRevenue || 0).toLocaleString()}</span>
                                                        </td>
                                                        <td className="p-4 text-right">
                                                            <span className="text-sm text-slate-600">{Number(s.netIncome || 0).toLocaleString()}</span>
                                                        </td>
                                                        <td className="p-4 border-r border-slate-200 text-xs text-slate-500">
                                                            {new Date(s.timestamp).toLocaleString()}
                                                        </td>
                                                        <td className="p-4 text-right">
                                                            <button 
                                                                onClick={() => deleteStat(s.userId, s.id)} 
                                                                className="text-white text-xs font-bold bg-red-500 px-3 py-1.5 rounded-lg shadow-sm hover:bg-red-600 transition-colors"
                                                            >
                                                                Xoá
                                                            </button>
                                                        </td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                        {renderPagination(pageStats, setPageStats, sortedStats.length)}
                                        </>
                                    )}
                                </div>
                            </div>

                        </div>
                    )}
                    
                    {/* Toast Notification */}
                    {notification && (
                        <div className={`fixed top-4 left-1/2 -translate-x-1/2 z-[300] px-6 py-3 rounded-xl shadow-lg border animate-fade-in-up flex items-center gap-3 ${notification.type === 'success' ? 'bg-emerald-50 border-emerald-200 text-emerald-800' : 'bg-red-50 border-red-200 text-red-800'}`}>
                            {notification.type === 'success' ? (
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-emerald-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                            ) : (
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                            )}
                            <span className="font-semibold text-sm">{notification.message}</span>
                        </div>
                    )}

                    {confirmModal && (
                        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center z-[200]">
                            <div className="bg-white rounded-2xl p-6 max-w-sm w-full shadow-2xl scale-100 opacity-100 transition-all">
                                <h3 className="font-bold text-lg text-slate-800 mb-2">Xác nhận</h3>
                                <p className="text-slate-600 mb-6">{confirmModal.text}</p>
                                <div className="flex justify-end gap-3">
                                    <button 
                                        onClick={() => setConfirmModal(null)}
                                        className="px-4 py-2 text-slate-600 font-bold hover:bg-slate-100 rounded-xl transition-colors"
                                    >
                                        Hủy
                                    </button>
                                    <button 
                                        onClick={() => {
                                            confirmModal.onConfirm();
                                            setConfirmModal(null);
                                        }}
                                        className="px-4 py-2 bg-red-500 hover:bg-red-600 text-white font-bold rounded-xl shadow-sm transition-colors"
                                    >
                                        Đồng ý
                                    </button>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};
