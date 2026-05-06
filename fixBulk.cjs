const fs = require('fs');
let code = fs.readFileSync('components/AdminDashboard.tsx', 'utf8');

// 1. Remove Models AI button from Sidebar
code = code.replace(/<button[^>]*onClick=\{\(\) => setActiveMenu\('models'\)\}[^>]*>[\s\S]*?<\/button>/, '');

// 2. Remove Content for Models AI
const modelsContentRegex = /\{\/\* MODELS MENU \*\/\}\s*\{activeMenu === 'models' && \([\s\S]*?\}\)\}/;
code = code.replace(modelsContentRegex, '');

// 3. Improve row hover effects
code = code.replace(/hover:bg-slate-50\/80/g, 'hover:bg-indigo-50/60');
code = code.replace(/hover:bg-slate-50\/50/g, 'hover:bg-indigo-50/60 transition-colors');
code = code.replace(/<tr key=\{u.uid\} className="border-b border-slate-100 hover:bg-slate-50\/50">/g, '<tr key={u.uid} className="border-b border-slate-100 hover:bg-indigo-50/60 transition-colors cursor-pointer">');

// 4. Implement Bulk Actions
const bulkDeleteFunction = `
    const bulkDeleteAction = () => {
        setConfirmModal({
            isOpen: true,
            text: \`Bạn có chắc chắn muốn XÓA \${selectedItems.length} mục đã chọn không? Hành động này không thể hoàn tác.\`,
            onConfirm: async () => {
                try {
                    for (const item of selectedItems) {
                        if (activeMenu === 'account') {
                            await fetch(\`/api/admin/users/\${item}\`, { method: 'DELETE', headers });
                        } else if (activeMenu === 'tags') {
                            const [uid, tid] = item.split('-');
                            await fetch(\`/api/admin/user-details/\${uid}/tags/\${tid}\`, { method: 'DELETE', headers });
                        } else if (activeMenu === 'notes') {
                            const [uid, nid] = item.split('-');
                            await fetch(\`/api/admin/user-details/\${uid}/notes/\${nid}\`, { method: 'DELETE', headers });
                        } else if (activeMenu === 'chats') {
                            const [uid, cid] = item.split('-');
                            await fetch(\`/api/admin/user-details/\${uid}/chats/\${cid}\`, { method: 'DELETE', headers });
                        } else if (activeMenu === 'stats') {
                            const [uid, sid] = item.split('-');
                            await fetch(\`/api/admin/user-details/\${uid}/stats/\${sid}\`, { method: 'DELETE', headers });
                        }
                    }
                    setSelectedItems([]);
                    fetchGlobalData();
                } catch (e) {
                    console.error('Lỗi khi xóa hàng loạt:', e);
                }
            }
        });
    };
`;

code = code.replace(/const renderPagination =/, bulkDeleteFunction + '\n    const renderPagination =');

// 5. Add Bulk Action floating bar
const bulkActionBar = `
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
`;

code = code.replace(/(<div className="flex-1 overflow-y-auto p-0 sm:p-0 relative flex flex-col">)/, `$1\n${bulkActionBar}`);

fs.writeFileSync('components/AdminDashboard.tsx', code);
