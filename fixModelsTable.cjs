const fs = require('fs');
let code = fs.readFileSync('components/AdminDashboard.tsx', 'utf8');

// Replace the models list with a table
const modelsListRegex = /<div className="divide-y divide-slate-100 flex-1 overflow-y-auto content-start">[\s\S]*?\{allModels\.length === 0 && <div className="p-8 text-center text-slate-500">Chưa có custom model nào<\/div>\}[\s\S]*?<\/div>/;

const newTable = `<div className="flex-1 overflow-x-auto relative">
                                    {allModels.length === 0 ? <p className="text-center text-slate-500 my-8">Chưa có custom model nào</p> : (
                                        <table className="w-full text-left border-collapse min-w-[800px] border border-slate-200">
                                            <thead>
                                                <tr className="bg-slate-50/80 border-b border-slate-200 text-xs uppercase tracking-wider text-slate-500">
                                                    <th className="p-4 font-bold border-r border-slate-200 text-center w-12"><input type="checkbox" onChange={(e) => toggleAll(allModels.map(m => m.id))} checked={allModels.length > 0 && selectedItems.length > 0 && selectedItems.length === allModels.length} /></th>
                                                    <th className="p-4 font-bold border-r border-slate-200 text-center w-12">STT</th>
                                                    <th className="p-4 font-bold border-r border-slate-200">Tên Tùy Chỉnh</th>
                                                    <th className="p-4 font-bold border-r border-slate-200">Key Tích Hợp (model ID)</th>
                                                    <th className="p-4 font-bold text-right">Thao Tác</th>
                                                </tr>
                                            </thead>
                                            <tbody className="divide-y divide-slate-100">
                                                {allModels.map((m: any, index: number) => (
                                                    <tr key={m.id} className="hover:bg-slate-50/50 transition-colors">
                                                        <td className="p-4 border-r border-slate-200 text-center" onClick={(e) => e.stopPropagation()}><input type="checkbox" checked={selectedItems.includes(m.id)} onChange={() => toggleSelection(m.id)} /></td>
                                                        <td className="p-4 border-r border-slate-200 text-center text-slate-500 font-bold">{index + 1}</td>
                                                        <td className="p-4 border-r border-slate-200 font-bold text-slate-800">{m.name}</td>
                                                        <td className="p-4 border-r border-slate-200 font-mono text-sm text-slate-500">{m.modelKey}</td>
                                                        <td className="p-4 text-right">
                                                            <button 
                                                                onClick={() => handleEditModel(m)}
                                                                className="text-white text-xs font-bold bg-indigo-500 px-3 py-1.5 rounded-lg shadow-sm hover:bg-indigo-600 transition-colors mr-2"
                                                            >
                                                                Sửa
                                                            </button>
                                                            <button 
                                                                onClick={() => deleteModel(m.id)}
                                                                className="text-white text-xs font-bold bg-red-500 px-3 py-1.5 rounded-lg shadow-sm hover:bg-red-600 transition-colors"
                                                            >
                                                                Xoá
                                                            </button>
                                                        </td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    )}
                                </div>`;

code = code.replace(modelsListRegex, newTable);

fs.writeFileSync('components/AdminDashboard.tsx', code);
