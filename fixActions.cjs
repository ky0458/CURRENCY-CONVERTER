const fs = require('fs');
let code = fs.readFileSync('components/AdminDashboard.tsx', 'utf8');

// Add deleteUser function
const toggleLockStr = `    const toggleLockUser = (uid: string, isCurrentlyLocked: boolean) => {
        const actionText = isCurrentlyLocked ? 'MỞ KHÓA' : 'KHÓA';
        setConfirmModal({
            isOpen: true,
            text: \`Bạn có chắc chắn muốn \${actionText} người dùng này không?\`,
            onConfirm: async () => {
                try {
                    await fetch(\`/api/admin/users/\${uid}/lock\`, { 
                        method: 'PUT', 
                        headers: { ...headers, 'Content-Type': 'application/json' },
                        body: JSON.stringify({ isLocked: !isCurrentlyLocked })
                    });
                    fetchGlobalData();
                } catch (e) {
                    console.error('Error locking/unlocking user', e);
                }
            }
        });
    };`;

const newFunctions = `    const toggleLockUser = (uid: string, isCurrentlyLocked: boolean) => {
        const actionText = isCurrentlyLocked ? 'MỞ KHÓA' : 'KHÓA';
        setConfirmModal({
            isOpen: true,
            text: \`Bạn có chắc chắn muốn \${actionText} người dùng này không?\`,
            onConfirm: async () => {
                try {
                    await fetch(\`/api/admin/users/\${uid}/lock\`, { 
                        method: 'PUT', 
                        headers: { ...headers, 'Content-Type': 'application/json' },
                        body: JSON.stringify({ isLocked: !isCurrentlyLocked })
                    });
                    fetchGlobalData();
                } catch (e) {
                    console.error('Error locking/unlocking user', e);
                }
            }
        });
    };

    const deleteUser = (uid: string) => {
        setConfirmModal({
            isOpen: true,
            text: \`Bạn có chắc chắn muốn XÓA tài khoản này không? Hành động này sẽ xoá toàn bộ dữ liệu của người dùng và không thể hoàn tác.\`,
            onConfirm: async () => {
                try {
                    await fetch(\`/api/admin/users/\${uid}\`, { 
                        method: 'DELETE', 
                        headers
                    });
                    fetchGlobalData();
                } catch (e) {
                    console.error('Error deleting user', e);
                }
            }
        });
    };`;

code = code.replace(toggleLockStr, newFunctions);

// Add delete button next to lock button
const buttonsRegex = /<td className="p-4 text-right">\s*<button\s*onClick=\{\(e\) => \{ e\.stopPropagation\(\); toggleLockUser\(([\s\S]*?)\); \}\}\s*className=\{`px-3 py-1\.5 text-xs font-bold rounded-lg border transition-all shadow-sm \$\{([\s\S]*?)\}`\}\s*>\s*\{([\s\S]*?)\}\s*<\/button>\s*<\/td>/;

const newButtons = `<td className="p-4 text-right flex gap-2 justify-end">
                                                                    <button 
                                                                        onClick={(e) => { e.stopPropagation(); toggleLockUser(u.uid, u.isLocked); }}
                                                                        className={\`px-3 py-1.5 text-xs font-bold rounded-lg border transition-all shadow-sm \${u.isLocked ? 'border-indigo-200 bg-indigo-50 text-indigo-600 hover:bg-indigo-100' : 'border-red-200 bg-red-white text-red-600 hover:bg-red-50'}\`}
                                                                    >
                                                                        {u.isLocked ? "Mở khóa" : "Khóa"}
                                                                    </button>
                                                                    <button 
                                                                        onClick={(e) => { e.stopPropagation(); deleteUser(u.uid); }}
                                                                        className="px-3 py-1.5 text-xs font-bold rounded-lg border border-red-500 bg-red-500 text-white hover:bg-red-600 transition-all shadow-sm"
                                                                    >
                                                                        Xoá
                                                                    </button>
                                                                </td>`;

code = code.replace(buttonsRegex, newButtons);

// Make sure Modal is added at the end
const endDiv = `                    )}
                </div>
            </div>`;
const modalCode = `                    {confirmModal && (
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
            </div>`;

code = code.replace(endDiv, modalCode);

fs.writeFileSync('components/AdminDashboard.tsx', code);
