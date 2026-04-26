import * as fs from 'fs';
let content = fs.readFileSync('components/ThemeSelector.tsx', 'utf-8');

// The file ends at line 381. Let's make sure it closes nicely.
content += `
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
