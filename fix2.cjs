const fs = require('fs');
let code = fs.readFileSync('App.tsx', 'utf8');

const regex = /<RevenueStatsSection[\s\S]*?\/>\s*<\/div>\s*<\/>\s*\)}/g;

code = code.replace(regex, (match) => {
    return match + '\n                        </>\n                    )}\n';
});

fs.writeFileSync('App.tsx', code);
