const fs = require('fs');
let code = fs.readFileSync('components/AdminDashboard.tsx', 'utf8');

// Add checkbox state
if (!code.includes('selectedItems')) {
    code = code.replace(
        'const [itemsPerPage, setItemsPerPage] = useState(20);',
        'const [itemsPerPage, setItemsPerPage] = useState(20);\n    const [selectedItems, setSelectedItems] = useState<string[]>([]);\n    const toggleSelection = (id: string) => setSelectedItems(prev => prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]);\n    const toggleAll = (ids: string[]) => setSelectedItems(prev => prev.length === ids.length ? [] : ids);'
    );
}

// Ensure all table tags have border
code = code.replaceAll('<table className="w-full text-left border-collapse min-w-[800px]">', '<table className="w-full text-left border-collapse min-w-[800px] border border-slate-200">');
// Revert models table if any since it was div.
// Wait, I will write specific replacements for the headers of the 6 sections.

function replaceTableHeaders(code) {
    // 1. Users
    let usersTh = `<tr className="bg-slate-50/80 border-b border-slate-200 text-xs uppercase tracking-wider text-slate-500">
        <th className="p-4 font-bold border-r border-slate-200 text-center w-12"><input type="checkbox" onChange={(e) => toggleAll(paginatedUsers.map(u => u.uid))} checked={selectedItems.length > 0 && selectedItems.length === paginatedUsers.length} /></th>
        <th className="p-4 font-bold border-r border-slate-200 text-center w-12">STT</th>`;
    code = code.replace(/<tr className="bg-slate-50\/80 border-b border-slate-100 text-xs uppercase tracking-wider text-slate-500">\s*<th className="p-4 font-bold cursor-pointer hover:bg-slate-100" onClick=\{\(\) => toggleSort\('users', 'displayName'\)\}>/m,
        usersTh + `\n<th className="p-4 font-bold border-r border-slate-200 cursor-pointer hover:bg-slate-100" onClick={() => toggleSort('users', 'displayName')}>`
    );

    // 2. Tags
    let tagsTh = `<tr className="bg-slate-50/80 border-b border-slate-200 text-xs uppercase tracking-wider text-slate-500">
        <th className="p-4 font-bold border-r border-slate-200 text-center w-12"><input type="checkbox" onChange={(e) => toggleAll(paginatedTags.map(t => t.id))} checked={selectedItems.length > 0 && selectedItems.length === paginatedTags.length} /></th>
        <th className="p-4 font-bold border-r border-slate-200 text-center w-12">STT</th>`;
    code = code.replace(/<tr className="bg-slate-50\/80 border-b border-slate-100 text-xs uppercase tracking-wider text-slate-500">\s*<th className="p-4 font-bold cursor-pointer hover:bg-slate-100" onClick=\{\(\) => toggleSort\('tags', 'userName'\)\}>/m,
        tagsTh + `\n<th className="p-4 font-bold border-r border-slate-200 cursor-pointer hover:bg-slate-100" onClick={() => toggleSort('tags', 'userName')}>`
    );

    // 3. Notes
    let notesTh = `<tr className="bg-slate-50/80 border-b border-slate-200 text-xs uppercase tracking-wider text-slate-500">
        <th className="p-4 font-bold border-r border-slate-200 text-center w-12"><input type="checkbox" onChange={(e) => toggleAll(paginatedNotes.map(n => n.id))} checked={selectedItems.length > 0 && selectedItems.length === paginatedNotes.length} /></th>
        <th className="p-4 font-bold border-r border-slate-200 text-center w-12">STT</th>`;
    code = code.replace(/<tr className="bg-slate-50\/80 border-b border-slate-100 text-xs uppercase tracking-wider text-slate-500">\s*<th className="p-4 font-bold w-48 cursor-pointer hover:bg-slate-100" onClick=\{\(\) => toggleSort\('notes', 'userName'\)\}>/m,
        notesTh + `\n<th className="p-4 font-bold w-48 border-r border-slate-200 cursor-pointer hover:bg-slate-100" onClick={() => toggleSort('notes', 'userName')}>`
    );

    // 4. Chats
    let chatsTh = `<tr className="bg-slate-50/80 border-b border-slate-200 text-xs uppercase tracking-wider text-slate-500">
        <th className="p-4 font-bold border-r border-slate-200 text-center w-12"><input type="checkbox" onChange={(e) => toggleAll(paginatedChats.map(c => c.id))} checked={selectedItems.length > 0 && selectedItems.length === paginatedChats.length} /></th>
        <th className="p-4 font-bold border-r border-slate-200 text-center w-12">STT</th>`;
    code = code.replace(/<tr className="bg-slate-50\/80 border-b border-slate-100 text-xs uppercase tracking-wider text-slate-500">\s*<th className="p-4 font-bold cursor-pointer hover:bg-slate-100" onClick=\{\(\) => toggleSort\('chats', 'userName'\)\}>/m,
        chatsTh + `\n<th className="p-4 font-bold border-r border-slate-200 cursor-pointer hover:bg-slate-100" onClick={() => toggleSort('chats', 'userName')}>`
    );

    // 5. Stats
    let statsTh = `<tr className="bg-slate-50/80 border-b border-slate-200 text-xs uppercase tracking-wider text-slate-500">
        <th className="p-4 font-bold border-r border-slate-200 text-center w-12"><input type="checkbox" onChange={(e) => toggleAll(paginatedStats.map(s => s.id))} checked={selectedItems.length > 0 && selectedItems.length === paginatedStats.length} /></th>
        <th className="p-4 font-bold border-r border-slate-200 text-center w-12">STT</th>`;
    code = code.replace(/<tr className="bg-slate-50\/80 border-b border-slate-100 text-xs uppercase tracking-wider text-slate-500">\s*<th className="p-4 font-bold cursor-pointer hover:bg-slate-100" onClick=\{\(\) => toggleSort\('stats', 'userName'\)\}>/m,
        statsTh + `\n<th className="p-4 font-bold border-r border-slate-200 cursor-pointer hover:bg-slate-100" onClick={() => toggleSort('stats', 'userName')}>`
    );

    return code;
}

code = replaceTableHeaders(code);

// Now apply border-r border-slate-200 to all <th className="...">
code = code.replaceAll('<th className="p-4 font-bold cursor-pointer hover:bg-slate-100"', '<th className="p-4 font-bold border-r border-slate-200 cursor-pointer hover:bg-slate-100"');
code = code.replaceAll('<th className="p-4 font-bold">Trạng Thái</th>', '<th className="p-4 font-bold border-r border-slate-200">Trạng Thái</th>');
code = code.replaceAll('<th className="p-4 font-bold cursor-pointer hover:bg-slate-100"', '<th className="p-4 font-bold border-r border-slate-200 cursor-pointer hover:bg-slate-100"');
code = code.replaceAll('<th className="p-4 font-bold text-center">Màu Sắc</th>', '<th className="p-4 font-bold border-r border-slate-200 text-center">Màu Sắc</th>');
code = code.replaceAll('<th className="p-4 font-bold w-48">Thẻ</th>', '<th className="p-4 font-bold border-r border-slate-200 w-48">Thẻ</th>');
code = code.replaceAll('<th className="p-4 font-bold text-center">Tin Nhắn</th>', '<th className="p-4 font-bold border-r border-slate-200 text-center">Tin Nhắn</th>');

// And text-right Thao Tác: Wait, I will manually replace each one as they might already have been affected.
// Using regex for <th className="p-4 font-bold text-right...>
code = code.replaceAll('<th className="p-4 font-bold text-right w-24">Thao Tác</th>', '<th className="p-4 font-bold w-24 text-right">Thao Tác</th>');

// Add STT and Checkbox to TBODY
// 1. Users
code = code.replace(/<tbody className="divide-y divide-slate-100">\s*\{paginatedUsers\.map\((u[^]*?)=>\s*\(\s*<React\.Fragment key=\{u\.uid\}>\s*<tr\s*className=\{\`hover:bg-slate-50\/80 cursor-pointer transition-colors \$\{selectedUser === u\.uid \? 'bg-indigo-50\/30' : ''\}\`\}\s*onClick=\{\(\) => handleSelectUser\(u\.uid\)\}\s*>/m,
    function(match, p1) {
        let indexParam = p1.includes(',') ? p1 : `${p1}, index`;
        if(!p1.includes(',')) match = match.replace(`(${p1})`, `(${p1}, index)`);
        return match + `\n<td className="p-4 border-r border-slate-200 text-center" onClick={(e) => e.stopPropagation()}><input type="checkbox" checked={selectedItems.includes(u.uid)} onChange={() => toggleSelection(u.uid)} /></td>\n<td className="p-4 border-r border-slate-200 text-center text-slate-500 font-bold">{(pageUsers - 1) * itemsPerPage + index + 1}</td>`;
    }
);

// 2. Tags
code = code.replace(/<tbody className="divide-y divide-slate-100">\s*\{paginatedTags\.map\(\(t[^]*?)=>\s*\(\s*<tr key=\{`\$\{t\.userId\}-\$\{t\.id\}`\}\s*className="hover:bg-slate-50\/50 transition-colors">/m,
    function(match, p1) {
        let indexParam = p1.includes(',') ? p1 : `${p1}, index`;
        if(!p1.includes(',')) match = match.replace(`(${p1})`, `(${p1}, index: number)`);
        return match + `\n<td className="p-4 border-r border-slate-200 text-center" onClick={(e) => e.stopPropagation()}><input type="checkbox" checked={selectedItems.includes(t.id)} onChange={() => toggleSelection(t.id)} /></td>\n<td className="p-4 border-r border-slate-200 text-center text-slate-500 font-bold">{(pageTags - 1) * itemsPerPage + index + 1}</td>`;
    }
);

// 3. Notes
code = code.replace(/<tbody className="divide-y divide-slate-100">\s*\{paginatedNotes\.map\(\(n[^]*?)=>\s*\{\s*const currentTag = allTags.find\(.*?userId === n\.userId\);\s*return \(\s*<tr key=\{`\$\{n\.userId\}-\$\{n\.id\}`\}\s*className="hover:bg-slate-50\/50 transition-colors">/m,
    function(match, p1) {
        let indexParam = p1.includes(',') ? p1 : `${p1}, index`;
        if(!p1.includes(',')) match = match.replace(`(${p1})`, `(${p1}, index: number)`);
        return match + `\n<td className="p-4 border-r border-slate-200 text-center" onClick={(e) => e.stopPropagation()}><input type="checkbox" checked={selectedItems.includes(n.id)} onChange={() => toggleSelection(n.id)} /></td>\n<td className="p-4 border-r border-slate-200 text-center text-slate-500 font-bold">{(pageNotes - 1) * itemsPerPage + index + 1}</td>`;
    }
);

// 4. Chats
code = code.replace(/<tbody className="divide-y divide-slate-100">\s*\{paginatedChats\.map\((c[^]*?)=>\s*\(\s*<tr key=\{c\.id\} className="hover:bg-slate-50\/50 transition-colors">/m,
    function(match, p1) {
        let indexParam = p1.includes(',') ? p1 : `${p1}, index`;
        if(!p1.includes(',')) match = match.replace(`(${p1})`, `(${p1}, index)`);
        return match + `\n<td className="p-4 border-r border-slate-200 text-center" onClick={(e) => e.stopPropagation()}><input type="checkbox" checked={selectedItems.includes(c.id)} onChange={() => toggleSelection(c.id)} /></td>\n<td className="p-4 border-r border-slate-200 text-center text-slate-500 font-bold">{(pageChats - 1) * itemsPerPage + index + 1}</td>`;
    }
);

// 5. Stats
code = code.replace(/<tbody className="divide-y divide-slate-100">\s*\{paginatedStats\.map\(\(s[^]*?)=>\s*\(\s*<tr key=\{`\$\{s\.userId\}-\$\{s\.id\}`\} className="hover:bg-slate-50\/50 transition-colors">/m,
    function(match, p1) {
        let indexParam = p1.includes(',') ? p1 : `${p1}, index`;
        if(!p1.includes(',')) match = match.replace(`(${p1})`, `(${p1}, index: number)`);
        return match + `\n<td className="p-4 border-r border-slate-200 text-center" onClick={(e) => e.stopPropagation()}><input type="checkbox" checked={selectedItems.includes(s.id)} onChange={() => toggleSelection(s.id)} /></td>\n<td className="p-4 border-r border-slate-200 text-center text-slate-500 font-bold">{(pageStats - 1) * itemsPerPage + index + 1}</td>`;
    }
);

// Make all <td className="p-4..."> have border-r border-slate-200
code = code.replace(/<td className="p-4/g, '<td className="p-4 border-r border-slate-200');

// Fix border on last td (Thao Tac) to not have border-r
code = code.replace(/<td className="p-4 border-r border-slate-200 text-right"/g, '<td className="p-4 text-right"');

fs.writeFileSync('components/AdminDashboard.tsx', code);
