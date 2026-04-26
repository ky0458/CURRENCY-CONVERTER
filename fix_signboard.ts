import * as fs from 'fs';

let content = fs.readFileSync('components/ThemeSignboard.tsx', 'utf-8');

// The pattern to match all the decorTop blocks inside ThemeSignboard.tsx for animals
const regex = /decorTop = \([\s\S]*?\);\n\s*break;/g;

// I'll manually modify the file by reading / evaluating instead
