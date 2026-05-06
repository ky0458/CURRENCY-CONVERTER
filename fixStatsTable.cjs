const fs = require('fs');
let code = fs.readFileSync('components/AdminDashboard.tsx', 'utf8');

// Replace headers
code = code.replace(
    /<th className="p-4 font-bold text-right cursor-pointer hover:bg-slate-100" onClick=\{\(\) => toggleSort\('stats', 'inputSalary'\)\}>\s*Doanh Thu Tệ \{renderSortIcon\('stats', 'inputSalary'\)\}\s*<\/th>\s*<th className="p-4 font-bold text-right cursor-pointer hover:bg-slate-100" onClick=\{\(\) => toggleSort\('stats', 'netIncome'\)\}>\s*Doanh Thu VNĐ \{renderSortIcon\('stats', 'netIncome'\)\}\s*<\/th>/,
    `<th className="p-4 font-bold text-right cursor-pointer hover:bg-slate-100" onClick={() => toggleSort('stats', 'inputSalary')}>
                                                        Lương {renderSortIcon('stats', 'inputSalary')}
                                                    </th>
                                                    <th className="p-4 font-bold text-right cursor-pointer hover:bg-slate-100" onClick={() => toggleSort('stats', 'totalRevenue')}>
                                                        Tổng Doanh Thu {renderSortIcon('stats', 'totalRevenue')}
                                                    </th>
                                                    <th className="p-4 font-bold text-right cursor-pointer hover:bg-slate-100" onClick={() => toggleSort('stats', 'netIncome')}>
                                                        Thực Nhận {renderSortIcon('stats', 'netIncome')}
                                                    </th>`
);

// Replace cells
const cellsRegex = /<td className="p-4 text-right">\s*<span className="font-bold text-slate-600">\{Number\(s\.inputSalary \|\| 0\)\.toLocaleString\(\)\} CNY<\/span>\s*<\/td>\s*<td className="p-4 text-right">\s*<span className="font-bold text-orange-600">\{Number\(s\.totalRevenue \|\| s\.inputSalary \|\| 0\)\.toLocaleString\(\)\} CNY<\/span>\s*<\/td>\s*<td className="p-4 text-right">\s*<span className="font-bold text-emerald-600">\{Number\(s\.netIncome \|\| 0\)\.toLocaleString\(\)\} VNĐ<\/span>\s*<\/td>/;

code = code.replace(cellsRegex, `<td className="p-4 text-right">
                                                            <span className="text-sm text-slate-600">{Number(s.inputSalary || 0).toLocaleString()} VNĐ</span>
                                                        </td>
                                                        <td className="p-4 text-right">
                                                            <span className="text-sm text-slate-600">{Number(s.totalRevenue || 0).toLocaleString()} VNĐ</span>
                                                        </td>
                                                        <td className="p-4 text-right">
                                                            <span className="text-sm text-slate-600">{Number(s.netIncome || 0).toLocaleString()} VNĐ</span>
                                                        </td>`);

const sortRegex = /if \(\['timestamp', 'inputSalary', 'netIncome'\]\.includes\(sortStats\.key\)\)/;

code = code.replace(sortRegex, "if (['timestamp', 'inputSalary', 'totalRevenue', 'netIncome'].includes(sortStats.key))");

fs.writeFileSync('components/AdminDashboard.tsx', code);
