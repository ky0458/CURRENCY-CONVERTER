const fs = require('fs');
let code = fs.readFileSync('components/AdminDashboard.tsx', 'utf8');

const modelsListOrig = `<div className="divide-y divide-slate-100 flex-1 overflow-y-auto content-start">
                                    {allModels.map(m => (
                                        <div key={m.id} className="p-6 flex justify-between items-center hover:bg-slate-50/50 transition-colors">
                                            <div>
                                                <h3 className="font-bold text-slate-800">{m.name}</h3>
                                                <p className="text-sm text-slate-500 font-mono mt-1">{m.modelKey}</p>
                                            </div>
                                            <div className="flex items-center gap-2">
                                                <button 
                                                    onClick={() => handleEditModel(m)}
                                                    className="text-indigo-600 p-2 bg-indigo-50 rounded-xl hover:bg-indigo-100 shrink-0 transition-colors"
                                                    title="Sửa"
                                                >
                                                    <span className="text-xs font-bold px-2">Sửa</span>
                                                </button>
                                                <button 
                                                    onClick={() => deleteModel(m.id)}
                                                    className="text-red-500 p-2 bg-red-50 rounded-xl hover:bg-red-100 shrink-0 transition-colors"
                                                    title="Xoá"
                                                >
                                                    <span className="text-xs font-bold px-2">Xoá</span>
                                                </button>
                                            </div>
                                        </div>
                                    ))}
                                </div>`;

const modelsTableNew = `<div className="p-0 overflow-x-auto flex-1 flex flex-col justify-between">
                                    <table className="w-full text-left border-collapse min-w-[800px] border border-slate-200">
                                        <thead>
                                            <tr className="bg-slate-50/80 border-b border-slate-200 text-xs uppercase tracking-wider text-slate-500">
                                                <th className="p-4 font-bold border-r border-slate-200 text-center w-12"><input type="checkbox" onChange={(e) => toggleAll(allModels.map(m => m.id))} checked={selectedItems.length > 0 && selectedItems.length === allModels.length} /></th>
                                                <th className="p-4 font-bold border-r border-slate-200 text-center w-12">STT</th>
                                                <th className="p-4 font-bold border-r border-slate-200">Tên Hiển Thị</th>
                                                <th className="p-4 font-bold border-r border-slate-200">Model Key</th>
                                                <th className="p-4 font-bold text-right w-32">Thao Tác</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-slate-100">
                                            {allModels.map((m, index) => (
                                                <tr key={m.id} className="hover:bg-slate-50/50 transition-colors">
                                                    <td className="p-4 border-r border-slate-200 text-center"><input type="checkbox" checked={selectedItems.includes(m.id)} onChange={() => toggleSelection(m.id)} /></td>
                                                    <td className="p-4 border-r border-slate-200 text-center text-slate-500 font-bold">{index + 1}</td>
                                                    <td className="p-4 border-r border-slate-200 font-bold text-slate-800">{m.name}</td>
                                                    <td className="p-4 border-r border-slate-200 text-sm text-slate-500 font-mono">{m.modelKey}</td>
                                                    <td className="p-4 text-right">
                                                        <div className="flex justify-end gap-2">
                                                            <button 
                                                                onClick={() => handleEditModel(m)}
                                                                className="text-indigo-600 p-2 bg-indigo-50 rounded-xl hover:bg-indigo-100 shrink-0 transition-colors"
                                                                title="Sửa"
                                                            >
                                                                <span className="text-xs font-bold px-2">Sửa</span>
                                                            </button>
                                                            <button 
                                                                onClick={() => deleteModel(m.id)}
                                                                className="text-red-500 p-2 bg-red-50 rounded-xl hover:bg-red-100 shrink-0 transition-colors"
                                                                title="Xoá"
                                                            >
                                                                <span className="text-xs font-bold px-2">Xoá</span>
                                                            </button>
                                                        </div>
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>`;

code = code.replace(modelsListOrig, modelsTableNew);

fs.writeFileSync('components/AdminDashboard.tsx', code);
