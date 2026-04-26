import * as fs from 'fs';
let content = fs.readFileSync('components/ThemeSelector.tsx', 'utf-8');

// remove the end and recreate
content = content.replace(/\n                        <\/div>\n                    <\/div>\n                <\/div>\n            <\/div>\n        <\/div>\n    \);\n};\n$/, '');

content += `
                        </div>
                    </div>
                </div>
            </div>
        </div>
        </div>
    );
};
`;

fs.writeFileSync('components/ThemeSelector.tsx', content, 'utf-8');
console.log('done');
