const fs = require('fs');
let code = fs.readFileSync('components/AdminDashboard.tsx', 'utf-8');

// Replace standard <select> with a custom dropdown
const selectHtml = `<div className="relative group">
                            <select 
                                value={itemsPerPage} 
                                onChange={(e) => {
                                    setItemsPerPage(Number(e.target.value));
                                    setPage(1);
                                }}
                                className="appearance-none border border-slate-200 rounded-lg text-sm py-2 pl-4 pr-10 outline-none bg-slate-50 text-slate-700 focus:ring-2 focus:ring-indigo-100 hover:bg-slate-100 transition-all cursor-pointer shadow-sm font-medium"
                            >
                                <option value={10}>10 / Trang</option>
                                <option value={20}>20 / Trang</option>
                                <option value={50}>50 / Trang</option>
                                <option value={100}>100 / Trang</option>
                            </select>
                            <div className="absolute inset-y-0 right-0 flex items-center px-3 pointer-events-none text-slate-400 group-hover:text-indigo-500 transition-colors">
                                <svg className="w-4 h-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
                                </svg>
                            </div>
                        </div>`;

const customDropdownHtml = `<div className="relative">
                            <button 
                                onClick={() => setIsPerPageDropdownOpen(!isPerPageDropdownOpen)}
                                className="flex items-center justify-between min-w-[120px] bg-slate-50 border border-slate-200 hover:bg-slate-100 text-slate-700 text-sm font-medium py-2 px-4 rounded-lg shadow-sm transition-all focus:outline-none focus:ring-2 focus:ring-indigo-100"
                            >
                                <span>{itemsPerPage} / Trang</span>
                                <svg className={\`w-4 h-4 ml-2 text-slate-400 transition-transform \${isPerPageDropdownOpen ? 'rotate-180' : ''}\`} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
                                </svg>
                            </button>
                            {isPerPageDropdownOpen && (
                                <>
                                    <div className="fixed inset-0 z-10" onClick={() => setIsPerPageDropdownOpen(false)}></div>
                                    <div className="absolute z-20 mt-1 w-full bg-white border border-slate-200 rounded-lg shadow-lg overflow-hidden animate-fade-in-up origin-top-left" style={{ animationDuration: '0.2s' }}>
                                        {[10, 20, 50, 100].map(val => (
                                            <button
                                                key={val}
                                                onClick={() => {
                                                    setItemsPerPage(val);
                                                    setPage(1);
                                                    setIsPerPageDropdownOpen(false);
                                                }}
                                                className={\`w-full text-left px-4 py-2 text-sm transition-colors flex items-center justify-between \${itemsPerPage === val ? 'bg-indigo-50 text-indigo-700 font-bold' : 'text-slate-600 hover:bg-slate-50 font-medium'}\`}
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
                        </div>`;

code = code.replace(selectHtml, customDropdownHtml);

if (code.includes('const [isPerPageDropdownOpen')) {
    // already there
} else {
    code = code.replace('const [itemsPerPage, setItemsPerPage] = useState(20);', 'const [itemsPerPage, setItemsPerPage] = useState(20);\n    const [isPerPageDropdownOpen, setIsPerPageDropdownOpen] = useState(false);');
}

// Remove containers around data
// Looking at earlier outputs:
// <div className="bg-white rounded-3xl shadow-sm border border-slate-200 overflow-hidden flex flex-col min-h-[700px]">
// We'll replace it with:
// <div className="flex flex-col min-h-[700px]">
code = code.replaceAll('<div className="bg-white rounded-3xl shadow-sm border border-slate-200 overflow-hidden flex flex-col min-h-[700px]">', '<div className="flex flex-col min-h-[700px]">');

// Also remove for models: mb-6
// 858: <div className="bg-white rounded-3xl shadow-sm border border-slate-200 overflow-hidden mb-6">
code = code.replaceAll('<div className="bg-white rounded-3xl shadow-sm border border-slate-200 overflow-hidden mb-6">', '<div className="mb-6">');

// There is one exception maybe: the Cấu hình AI Models (tab Models) and Thống kê (tab Stats)
// Stats tab:
// 963: <div className="bg-white rounded-3xl shadow-sm border border-slate-200 overflow-hidden flex flex-col min-h-[700px]">
// Also maybe the 2 grid items in Stats?
// 951: <div className="bg-white rounded-3xl p-6 shadow-sm border border-slate-200 relative overflow-hidden">
// The user prompt specifically says: "Loại bỏ Toàn bộ các container (nền trắng) bao bọc danh sách dữ liệu (Tài Khoản, Thẻ Ghi Chú, Ghi Chú, Lịch sử Chat, Cấu hình AI Models và Thống kê) ở tất cả các tab hiện tại."
// Wait, the lists inside the containers... if we just remove the bg-white rounded-3xl shadow-sm and border, we should be fine.

// Let's also check if there are other such containers:
code = code.replaceAll('<div className="bg-white rounded-3xl p-6 shadow-sm border border-slate-200 relative overflow-hidden">', '<div className="p-6 relative overflow-hidden">');

// For the Models tab, there is also: 
// <div className="bg-white rounded-3xl shadow-sm border border-slate-200 overflow-hidden"> 
// Oh wait, did my update.cjs already change that one?
code = code.replaceAll('<div className="bg-white rounded-3xl shadow-sm border border-slate-200 overflow-hidden">', '<div>');

fs.writeFileSync('components/AdminDashboard.tsx', code);
