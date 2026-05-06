const fs = require('fs');
let code = fs.readFileSync('components/AdminDashboard.tsx', 'utf8');

// Clear selectedItems when activeMenu changes
code = code.replace(
    /useEffect\(\(\) => \{\s*setSearchQuery\(''\);\s*setPageUsers\(1\); setPageTags\(1\); setPageNotes\(1\); setPageStats\(1\); setPageChats\(1\);\s*\}, \[activeMenu\]\);/,
    "useEffect(() => {\n        setSearchQuery('');\n        setSelectedItems([]);\n        setPageUsers(1); setPageTags(1); setPageNotes(1); setPageStats(1); setPageChats(1);\n    }, [activeMenu]);"
);

// Tags
code = code.replace(
    /toggleAll\(paginatedTags\.map\(t => t\.id\)\)/g,
    'toggleAll(paginatedTags.map(t => `${t.userId}-${t.id}`))'
);
code = code.replace(
    /checked=\{selectedItems\.length > 0 && selectedItems\.length === paginatedTags\.length\}/g,
    'checked={paginatedTags.length > 0 && selectedItems.length > 0 && selectedItems.length === paginatedTags.length}'
);
code = code.replace(
    /checked=\{selectedItems\.includes\(t\.id\)\}/g,
    'checked={selectedItems.includes(`${t.userId}-${t.id}`)}'
);
code = code.replace(
    /toggleSelection\(t\.id\)/g,
    'toggleSelection(`${t.userId}-${t.id}`)'
);

// Notes
code = code.replace(
    /toggleAll\(paginatedNotes\.map\(n => n\.id\)\)/g,
    'toggleAll(paginatedNotes.map(n => `${n.userId}-${n.id}`))'
);
code = code.replace(
    /checked=\{selectedItems\.length > 0 && selectedItems\.length === paginatedNotes\.length\}/g,
    'checked={paginatedNotes.length > 0 && selectedItems.length > 0 && selectedItems.length === paginatedNotes.length}'
);
code = code.replace(
    /checked=\{selectedItems\.includes\(n\.id\)\}/g,
    'checked={selectedItems.includes(`${n.userId}-${n.id}`)}'
);
code = code.replace(
    /toggleSelection\(n\.id\)/g,
    'toggleSelection(`${n.userId}-${n.id}`)'
);

// Chats
code = code.replace(
    /toggleAll\(paginatedChats\.map\(c => c\.id\)\)/g,
    'toggleAll(paginatedChats.map(c => `${c.userId}-${c.id}`))'
);
code = code.replace(
    /checked=\{selectedItems\.length > 0 && selectedItems\.length === paginatedChats\.length\}/g,
    'checked={paginatedChats.length > 0 && selectedItems.length > 0 && selectedItems.length === paginatedChats.length}'
);
code = code.replace(
    /checked=\{selectedItems\.includes\(c\.id\)\}/g,
    'checked={selectedItems.includes(`${c.userId}-${c.id}`)}'
);
code = code.replace(
    /toggleSelection\(c\.id\)/g,
    'toggleSelection(`${c.userId}-${c.id}`)'
);

// Stats
code = code.replace(
    /toggleAll\(paginatedStats\.map\(s => s\.id\)\)/g,
    'toggleAll(paginatedStats.map(s => `${s.userId}-${s.id}`))'
);
code = code.replace(
    /checked=\{selectedItems\.length > 0 && selectedItems\.length === paginatedStats\.length\}/g,
    'checked={paginatedStats.length > 0 && selectedItems.length > 0 && selectedItems.length === paginatedStats.length}'
);
code = code.replace(
    /checked=\{selectedItems\.includes\(s\.id\)\}/g,
    'checked={selectedItems.includes(`${s.userId}-${s.id}`)}'
);
code = code.replace(
    /toggleSelection\(s\.id\)/g,
    'toggleSelection(`${s.userId}-${s.id}`)'
);

// Users (Ensure toggleAll is fixed for when list is empty)
code = code.replace(
    /checked=\{selectedItems\.length > 0 && selectedItems\.length === paginatedUsers\.length\}/g,
    'checked={paginatedUsers.length > 0 && selectedItems.length > 0 && selectedItems.length === paginatedUsers.length}'
);

// Models
code = code.replace(
    /checked=\{selectedItems\.length > 0 && selectedItems\.length === allModels\.length\}/g,
    'checked={allModels.length > 0 && selectedItems.length > 0 && selectedItems.length === allModels.length}'
);

fs.writeFileSync('components/AdminDashboard.tsx', code);
