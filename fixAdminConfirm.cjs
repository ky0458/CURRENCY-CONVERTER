const fs = require('fs');

let code = fs.readFileSync('components/AdminDashboard.tsx', 'utf8');

// 1. Add confirm dialog state
code = code.replace(
    "const [itemsPerPage, setItemsPerPage] = useState(20);",
    "const [itemsPerPage, setItemsPerPage] = useState(20);\n    const [confirmModal, setConfirmModal] = useState<{ isOpen: boolean, text: string, onConfirm: () => void } | null>(null);"
);

// 2. Add confirm dialog UI at the bottom before closing div
const modalUI = `
            {confirmModal?.isOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm animate-fade-in">
                    <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm overflow-hidden animate-scale-up">
                        <div className="p-6">
                            <h3 className="text-lg font-bold text-slate-800 mb-2">Xác nhận</h3>
                            <p className="text-slate-600 text-sm">{confirmModal.text}</p>
                        </div>
                        <div className="p-4 bg-slate-50 flex justify-end gap-3 border-t border-slate-100">
                            <button 
                                onClick={() => setConfirmModal(null)}
                                className="px-4 py-2 bg-white border border-slate-200 text-slate-600 rounded-xl hover:bg-slate-50 font-bold text-sm transition-colors"
                            >
                                Hủy
                            </button>
                            <button 
                                onClick={() => {
                                    confirmModal.onConfirm();
                                    setConfirmModal(null);
                                }}
                                className="px-4 py-2 bg-red-600 text-white rounded-xl hover:bg-red-700 font-bold text-sm shadow-sm transition-colors"
                            >
                                Đồng ý
                            </button>
                        </div>
                    </div>
                </div>
            )}
`;

code = code.replace('</div>\n    );\n};\n\nexport default AdminDashboard;', modalUI + '\n        </div>\n    );\n};\n\nexport default AdminDashboard;');

fs.writeFileSync('components/AdminDashboard.tsx', code);
