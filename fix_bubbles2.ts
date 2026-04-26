import * as fs from 'fs';
let content = fs.readFileSync('components/ThemeSelector.tsx', 'utf-8');

// The replacement that incorrectly got pasted inside THEME_COLORS map
const toRemoveFrom = content.indexOf(`        \n                            )}\n\n                            {activeTab === 'userBubble' && (`);
const toRemoveTo = content.indexOf(`                                </>\n                            )}\n                                </button>\n                                ))} `); // Let's check exactly where `</button>  ))} ` is

// I need to be more precise.
