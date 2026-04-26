import * as fs from 'fs';

const content = fs.readFileSync('components/ThemeSelector.tsx', 'utf-8');
const pattern = /<span className="absolute bottom-[0-1] right-2 text-(?:\[10px\]|xs) font-bold text-[^>]+>(.*?)<\/span>/g;
const replacement = '<div className="absolute inset-x-0 bottom-0 py-0.5 bg-white/95 backdrop-blur border-t border-white/50 flex justify-center items-center z-20"><span className="text-[10.5px] font-black text-slate-800 uppercase tracking-widest">$1</span></div>';
const newContent = content.replace(pattern, replacement);

fs.writeFileSync('components/ThemeSelector.tsx', newContent, 'utf-8');
console.log("Updated labels!");
