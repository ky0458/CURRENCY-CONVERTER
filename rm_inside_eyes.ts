import * as fs from 'fs';
let content = fs.readFileSync('components/Header.tsx', 'utf-8');

const regex = /\{\/\* 2 con mắt khổng lồ.*?\*\/\}.*?(?=\{\/\* Má hồng dễ thương \*\/\})/s;
content = content.replace(regex, '');

fs.writeFileSync('components/Header.tsx', content, 'utf-8');
console.log('done');
