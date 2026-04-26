import * as fs from 'fs';
let content = fs.readFileSync('components/Header.tsx', 'utf-8');

// Replace the mangled frog block
content = content.replace(
    /}\)-\[-12deg\]"><\/div>\n                    <\/>\n                \)}\n                \{headerStyle === 'cat' && \(/g,
    "                )}\n                {headerStyle === 'cat' && ("
);

content = content.replace(
    /                          \{headerStyle === 'frog' && \(/g,
    "                {headerStyle === 'frog' && ("
);

fs.writeFileSync('components/Header.tsx', content, 'utf-8');
console.log('done');
