import * as fs from 'fs';

let content = fs.readFileSync('components/ThemeSelector.tsx', 'utf-8');

// 1. Rename tab
content = content.replace(
  "{ id: 'header', label: 'Thanh tiêu đề' },",
  "{ id: 'header', label: 'Chủ đề' },"
);

// Remove button tab
content = content.replace(
  "                                { id: 'button', label: 'Nút thao tác' },\n",
  ""
);

// Remove the whole activeTab === 'button' section
const buttonStart = content.indexOf("{/* Button Styles */}");
if (buttonStart !== -1) {
    const nextSectionStart = content.indexOf("{/* User Bubble Styles */}");
    content = content.slice(0, buttonStart) + content.slice(nextSectionStart);
}

// 2. Change `onStyleChange({ header: 'xxx' })` to `onStyleChange({ header: 'xxx', button: 'xxx' })`
const styleMap: Record<string, string> = {
  'default': 'default',
  'waves': '3d',
  'clouds': 'bubble',
  'sunset': 'glow',
  'forest': 'leaf',
  'magic': 'magic_wand',
  'ocean': 'diamond',
  'space': 'rocket',
  'frog': 'frog',
  'cat': 'cat',
  'panda': 'panda',
  'fox': 'fox',
  'dragon': 'dragon',
  'penguin': 'penguin',
  'bear': 'bear',
  'rabbit': 'rabbit',
  'bee': 'bee',
  'whale': 'whale'
};

for (const [header, button] of Object.entries(styleMap)) {
    content = content.replace(
        new RegExp("onStyleChange\\(\\{ header: '" + header + "' \\}\\)", "g"),
        "onStyleChange({ header: '" + header + "', button: '" + button + "' })"
    );
}

// 3. Fix scale on mobile for header previews
content = content.replace(
  /className=\{`(.*?)relative overflow-hidden w-full h-24 rounded-xl border-2 transition-all(.*?)`\}/g,
  'className={`$1relative overflow-hidden w-full h-[70px] sm:h-24 rounded-xl border-2 transition-all group $2`}'
);

content = content.replace(
  /<div className="absolute inset-x-2 top-4 bottom-2 /g,
  '<div className="absolute inset-x-0 top-0 bottom-6 sm:inset-x-2 sm:top-4 sm:bottom-2 transform scale-[0.6] sm:scale-100 origin-center pointer-events-none -translate-y-2 sm:translate-y-0"><div className="absolute inset-0 sm:inset-x-0 sm:top-0 sm:bottom-0 '
);

content = content.replace(
  /<div className="absolute inset-x-0 bottom-0 py-0\.5 /g,
  '</div><div className="absolute inset-x-0 bottom-0 py-0.5 '
);

fs.writeFileSync('components/ThemeSelector.tsx', content, 'utf-8');
console.log('done');
