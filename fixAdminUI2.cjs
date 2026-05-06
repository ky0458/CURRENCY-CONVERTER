const fs = require('fs');
let code = fs.readFileSync('components/AdminDashboard.tsx', 'utf8');

// Ensure checkbox is there
if (!code.includes('selectedItems')) {
    code = code.replace(
        'const [itemsPerPage, setItemsPerPage] = useState(20);',
        'const [itemsPerPage, setItemsPerPage] = useState(20);\n    const [selectedItems, setSelectedItems] = useState<string[]>([]);\n    const toggleSelection = (id: string) => setSelectedItems(prev => prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]);\n    const toggleAll = (ids: string[]) => setSelectedItems(prev => prev.length === ids.length ? [] : ids);'
    );
}

// Ensure all table tags have border
code = code.replaceAll('<table className="w-full text-left border-collapse min-w-[800px]">', '<table className="w-full text-left border-collapse min-w-[800px] border border-slate-200">');

// Manually replace headers
// 1. Users
let usersThOriginal = `<tr className="bg-slate-50/80 border-b border-slate-100 text-xs uppercase tracking-wider text-slate-500">
                                                        <th className="p-4 font-bold cursor-pointer hover:bg-slate-100" onClick={() => toggleSort('users', 'displayName')}>`;
let usersThNew = `<tr className="bg-slate-50/80 border-b border-slate-200 text-xs uppercase tracking-wider text-slate-500">
                                                        <th className="p-4 font-bold border-r border-slate-200 text-center w-12"><input type="checkbox" onChange={(e) => toggleAll(paginatedUsers.map(u => u.uid))} checked={selectedItems.length > 0 && selectedItems.length === paginatedUsers.length} /></th>
                                                        <th className="p-4 font-bold border-r border-slate-200 text-center w-12">STT</th>
                                                        <th className="p-4 font-bold cursor-pointer hover:bg-slate-100" onClick={() => toggleSort('users', 'displayName')}>`;
code = code.replace(usersThOriginal, usersThNew);

// 2. Tags
let tagsThOriginal = `<tr className="bg-slate-50/80 border-b border-slate-100 text-xs uppercase tracking-wider text-slate-500">
                                                    <th className="p-4 font-bold cursor-pointer hover:bg-slate-100" onClick={() => toggleSort('tags', 'userName')}>`;
let tagsThNew = `<tr className="bg-slate-50/80 border-b border-slate-200 text-xs uppercase tracking-wider text-slate-500">
                                                    <th className="p-4 font-bold border-r border-slate-200 text-center w-12"><input type="checkbox" onChange={(e) => toggleAll(paginatedTags.map(t => t.id))} checked={selectedItems.length > 0 && selectedItems.length === paginatedTags.length} /></th>
                                                    <th className="p-4 font-bold border-r border-slate-200 text-center w-12">STT</th>
                                                    <th className="p-4 font-bold cursor-pointer hover:bg-slate-100" onClick={() => toggleSort('tags', 'userName')}>`;
code = code.replace(tagsThOriginal, tagsThNew);

// 3. Notes
let notesThOriginal = `<tr className="bg-slate-50/80 border-b border-slate-100 text-xs uppercase tracking-wider text-slate-500">
                                                    <th className="p-4 font-bold w-48 cursor-pointer hover:bg-slate-100" onClick={() => toggleSort('notes', 'userName')}>`;
let notesThNew = `<tr className="bg-slate-50/80 border-b border-slate-200 text-xs uppercase tracking-wider text-slate-500">
                                                    <th className="p-4 font-bold border-r border-slate-200 text-center w-12"><input type="checkbox" onChange={(e) => toggleAll(paginatedNotes.map(n => n.id))} checked={selectedItems.length > 0 && selectedItems.length === paginatedNotes.length} /></th>
                                                    <th className="p-4 font-bold border-r border-slate-200 text-center w-12">STT</th>
                                                    <th className="p-4 font-bold w-48 cursor-pointer hover:bg-slate-100" onClick={() => toggleSort('notes', 'userName')}>`;
code = code.replace(notesThOriginal, notesThNew);

// 4. Chats
let chatsThOriginal = `<tr className="bg-slate-50/80 border-b border-slate-100 text-xs uppercase tracking-wider text-slate-500">
                                                    <th className="p-4 font-bold cursor-pointer hover:bg-slate-100" onClick={() => toggleSort('chats', 'userName')}>`;
let chatsThNew = `<tr className="bg-slate-50/80 border-b border-slate-200 text-xs uppercase tracking-wider text-slate-500">
                                                    <th className="p-4 font-bold border-r border-slate-200 text-center w-12"><input type="checkbox" onChange={(e) => toggleAll(paginatedChats.map(c => c.id))} checked={selectedItems.length > 0 && selectedItems.length === paginatedChats.length} /></th>
                                                    <th className="p-4 font-bold border-r border-slate-200 text-center w-12">STT</th>
                                                    <th className="p-4 font-bold cursor-pointer hover:bg-slate-100" onClick={() => toggleSort('chats', 'userName')}>`;
code = code.replace(chatsThOriginal, chatsThNew);

// 5. Stats
let statsThOriginal = `<tr className="bg-slate-50/80 border-b border-slate-100 text-xs uppercase tracking-wider text-slate-500">
                                                    <th className="p-4 font-bold cursor-pointer hover:bg-slate-100" onClick={() => toggleSort('stats', 'userName')}>`;
let statsThNew = `<tr className="bg-slate-50/80 border-b border-slate-200 text-xs uppercase tracking-wider text-slate-500">
                                                    <th className="p-4 font-bold border-r border-slate-200 text-center w-12"><input type="checkbox" onChange={(e) => toggleAll(paginatedStats.map(s => s.id))} checked={selectedItems.length > 0 && selectedItems.length === paginatedStats.length} /></th>
                                                    <th className="p-4 font-bold border-r border-slate-200 text-center w-12">STT</th>
                                                    <th className="p-4 font-bold cursor-pointer hover:bg-slate-100" onClick={() => toggleSort('stats', 'userName')}>`;
code = code.replace(statsThOriginal, statsThNew);


// Tबॉडी REPLACEMENTS
// 1. Users
let usersTbOriginal = ` {paginatedUsers.map(u => (
                                                        <React.Fragment key={u.uid}>
                                                            <tr 
                                                                className={\`hover:bg-slate-50/80 cursor-pointer transition-colors \${selectedUser === u.uid ? 'bg-indigo-50/30' : ''}\`}
                                                                onClick={() => handleSelectUser(u.uid)}
                                                            >
                                                                <td className="p-4">`;
let usersTbNew = ` {paginatedUsers.map((u, index) => (
                                                        <React.Fragment key={u.uid}>
                                                            <tr 
                                                                className={\`hover:bg-slate-50/80 cursor-pointer transition-colors \${selectedUser === u.uid ? 'bg-indigo-50/30' : ''}\`}
                                                                onClick={() => handleSelectUser(u.uid)}
                                                            >
                                                                <td className="p-4 border-r border-slate-200 text-center" onClick={(e) => e.stopPropagation()}><input type="checkbox" checked={selectedItems.includes(u.uid)} onChange={() => toggleSelection(u.uid)} /></td>
                                                                <td className="p-4 border-r border-slate-200 text-center text-slate-500 font-bold">{(pageUsers - 1) * itemsPerPage + index + 1}</td>
                                                                <td className="p-4 border-r border-slate-200">`;
code = code.replace(usersTbOriginal, usersTbNew);

// 2. Tags
let tagsTbOriginal = `{paginatedTags.map((t: any) => (
                                                    <tr key={\`\${t.userId}-\${t.id}\`} className="hover:bg-slate-50/50 transition-colors">
                                                        <td className="p-4">`;
let tagsTbNew = `{paginatedTags.map((t: any, index: number) => (
                                                    <tr key={\`\${t.userId}-\${t.id}\`} className="hover:bg-slate-50/50 transition-colors">
                                                        <td className="p-4 border-r border-slate-200 text-center" onClick={(e) => e.stopPropagation()}><input type="checkbox" checked={selectedItems.includes(t.id)} onChange={() => toggleSelection(t.id)} /></td>
                                                        <td className="p-4 border-r border-slate-200 text-center text-slate-500 font-bold">{(pageTags - 1) * itemsPerPage + index + 1}</td>
                                                        <td className="p-4 border-r border-slate-200">`;
code = code.replace(tagsTbOriginal, tagsTbNew);

// 3. Notes
let notesTbOriginal = `{paginatedNotes.map((n: any) => {
                                                    const currentTag = allTags.find(t => t.id === n.tagId && t.userId === n.userId);
                                                    return (
                                                    <tr key={\`\${n.userId}-\${n.id}\`} className="hover:bg-slate-50/50 transition-colors">
                                                        <td className="p-4 align-top">`;
let notesTbNew = `{paginatedNotes.map((n: any, index: number) => {
                                                    const currentTag = allTags.find(t => t.id === n.tagId && t.userId === n.userId);
                                                    return (
                                                    <tr key={\`\${n.userId}-\${n.id}\`} className="hover:bg-slate-50/50 transition-colors">
                                                        <td className="p-4 border-r border-slate-200 text-center" onClick={(e) => e.stopPropagation()}><input type="checkbox" checked={selectedItems.includes(n.id)} onChange={() => toggleSelection(n.id)} /></td>
                                                        <td className="p-4 border-r border-slate-200 text-center text-slate-500 font-bold">{(pageNotes - 1) * itemsPerPage + index + 1}</td>
                                                        <td className="p-4 border-r border-slate-200 align-top">`;
code = code.replace(notesTbOriginal, notesTbNew);

// 4. Chats
let chatsTbOriginal = `{paginatedChats.map(c => (
                                                    <tr key={c.id} className="hover:bg-slate-50/50 transition-colors">
                                                        <td className="p-4 flex flex-col">`;
let chatsTbNew = `{paginatedChats.map((c, index) => (
                                                    <tr key={c.id} className="hover:bg-slate-50/50 transition-colors">
                                                        <td className="p-4 border-r border-slate-200 text-center" onClick={(e) => e.stopPropagation()}><input type="checkbox" checked={selectedItems.includes(c.id)} onChange={() => toggleSelection(c.id)} /></td>
                                                        <td className="p-4 border-r border-slate-200 text-center text-slate-500 font-bold">{(pageChats - 1) * itemsPerPage + index + 1}</td>
                                                        <td className="p-4 border-r border-slate-200 flex flex-col">`;
code = code.replace(chatsTbOriginal, chatsTbNew);

// 5. Stats
let statsTbOriginal = `{paginatedStats.map((s: any) => (
                                                    <tr key={\`\${s.userId}-\${s.id}\`} className="hover:bg-slate-50/50 transition-colors">
                                                        <td className="p-4">`;
let statsTbNew = `{paginatedStats.map((s: any, index: number) => (
                                                    <tr key={\`\${s.userId}-\${s.id}\`} className="hover:bg-slate-50/50 transition-colors">
                                                        <td className="p-4 border-r border-slate-200 text-center" onClick={(e) => e.stopPropagation()}><input type="checkbox" checked={selectedItems.includes(s.id)} onChange={() => toggleSelection(s.id)} /></td>
                                                        <td className="p-4 border-r border-slate-200 text-center text-slate-500 font-bold">{(pageStats - 1) * itemsPerPage + index + 1}</td>
                                                        <td className="p-4 border-r border-slate-200">`;
code = code.replace(statsTbOriginal, statsTbNew);


// Fix TH borders
code = code.replaceAll('<th className="p-4 font-bold cursor-pointer hover:bg-slate-100"', '<th className="p-4 font-bold border-r border-slate-200 cursor-pointer hover:bg-slate-100"');
code = code.replaceAll('<th className="p-4 font-bold">Trạng Thái</th>', '<th className="p-4 font-bold border-r border-slate-200">Trạng Thái</th>');
code = code.replaceAll('<th className="p-4 font-bold text-center">Màu Sắc</th>', '<th className="p-4 font-bold border-r border-slate-200 text-center">Màu Sắc</th>');
code = code.replaceAll('<th className="p-4 font-bold w-48">Thẻ</th>', '<th className="p-4 font-bold border-r border-slate-200 w-48">Thẻ</th>');
code = code.replaceAll('<th className="p-4 font-bold text-center">Tin Nhắn</th>', '<th className="p-4 font-bold border-r border-slate-200 text-center">Tin Nhắn</th>');


// Fix Stats TH Doanh thu to show exactly as requested
let statsInputSalaryOrig = `<th className="p-4 font-bold border-r border-slate-200 text-right cursor-pointer hover:bg-slate-100" onClick={() => toggleSort('stats', 'inputSalary')}>
                                                        Doanh Thu Tệ {renderSortIcon('stats', 'inputSalary')}
                                                    </th>`;
let statsInputSalaryNew = `<th className="p-4 font-bold border-r border-slate-200 text-right cursor-pointer hover:bg-slate-100" onClick={() => toggleSort('stats', 'inputSalary')}>
                                                        Lương Phụ Trách {renderSortIcon('stats', 'inputSalary')}
                                                    </th>
                                                    <th className="p-4 font-bold border-r border-slate-200 text-right cursor-pointer hover:bg-slate-100" onClick={() => toggleSort('stats', 'totalRevenue')}>
                                                        Doanh Thu Tệ {renderSortIcon('stats', 'totalRevenue')}
                                                    </th>`;
code = code.replace(statsInputSalaryOrig, statsInputSalaryNew);

let statsNetIncomeOrig = `<th className="p-4 font-bold border-r border-slate-200 text-right cursor-pointer hover:bg-slate-100" onClick={() => toggleSort('stats', 'netIncome')}>
                                                        Doanh Thu VNĐ {renderSortIcon('stats', 'netIncome')}
                                                    </th>`;
let statsNetIncomeNew = `<th className="p-4 font-bold border-r border-slate-200 text-right cursor-pointer hover:bg-slate-100" onClick={() => toggleSort('stats', 'netIncome')}>
                                                        Thu Nhập VNĐ {renderSortIcon('stats', 'netIncome')}
                                                    </th>`;
code = code.replace(statsNetIncomeOrig, statsNetIncomeNew);

// Add td for totalRevenue in Stats TBODY
let statsNetIncomeTdOrig = `<td className="p-4 text-right">
                                                            <span className="font-bold text-orange-600">{Number(s.inputSalary || 0).toLocaleString()} CNY</span>
                                                        </td>`;
let statsNetIncomeTdNew = `<td className="p-4 border-r border-slate-200 text-right">
                                                            <span className="font-bold text-slate-600">{Number(s.inputSalary || 0).toLocaleString()} CNY</span>
                                                        </td>
                                                        <td className="p-4 border-r border-slate-200 text-right">
                                                            <span className="font-bold text-orange-600">{Number(s.totalRevenue || s.inputSalary || 0).toLocaleString()} CNY</span>
                                                        </td>`;
code = code.replace(statsNetIncomeTdOrig, statsNetIncomeTdNew);


// Fix borders on rest of TDs
code = code.replace(/<td className="p-4/g, '<td className="p-4 border-r border-slate-200');

// But some might have been doubled or Thao Tac shouldn't have border right.
code = code.replace(/border-r border-slate-200 border-r border-slate-200/g, 'border-r border-slate-200');

// Remove border right on the last TH and TD
code = code.replace(/<th className="p-4 font-bold border-r border-slate-200 text-right/g, '<th className="p-4 font-bold text-right');
code = code.replace(/<th className="p-4 font-bold border-r border-slate-200 w-24 text-right">Thao Tác<\/th>/g, '<th className="p-4 font-bold w-24 text-right">Thao Tác</th>');
code = code.replace(/<th className="p-4 font-bold border-r border-slate-200 text-right w-24">Thao Tác<\/th>/g, '<th className="p-4 font-bold text-right w-24">Thao Tác</th>');

// Fix the last TD Thao Tac
// Inside users:
code = code.replace(/<td className="p-4 border-r border-slate-200 text-right">/g, '<td className="p-4 text-right">');

fs.writeFileSync('components/AdminDashboard.tsx', code);
