const fs = require('fs');
let code = fs.readFileSync('components/AdminDashboard.tsx', 'utf8');

const sIdx = code.indexOf(`{/* MODELS MENU */}`);
if (sIdx !== -1) {
    const eIdx = code.indexOf(`{/* STATS MENU */}`);
    if (eIdx !== -1) {
        code = code.substring(0, sIdx) + code.substring(eIdx);
    }
}

code = code.replace(/transition-colors transition-colors/g, 'transition-colors');

fs.writeFileSync('components/AdminDashboard.tsx', code);
