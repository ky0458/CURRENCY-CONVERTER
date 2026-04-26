import * as fs from 'fs';
let content = fs.readFileSync('components/ThemeSelector.tsx', 'utf-8');

// remove everything from the end up to the last `)}`
content = content.replace(/\n                        <\/div>\n                    <\/div>\n                <\/div>\n            <\/div>\n        <\/div>\n        <\/div>\n    \);\n};\n$/, '');

content += `
                        </div>
                    </div>
                </div>
            </div>
        </div>,
        document.body
      )}
    </div>
  );
};
`;

fs.writeFileSync('components/ThemeSelector.tsx', content, 'utf-8');
console.log('done');
