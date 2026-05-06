const fs = require('fs');
let code = fs.readFileSync('components/AdminDashboard.tsx', 'utf8');

// 1. Remove max-w-6xl mx-auto from all menus
code = code.replace(/<div className="max-w-6xl mx-auto animate-fade-in-up">/g, '<div className="w-full h-full animate-fade-in-up flex flex-col">');

// 2. Change p-4 sm:p-8 to no padding or minimal
code = code.replace(/<div className="flex-1 overflow-y-auto p-4 sm:p-8 relative">/, '<div className="flex-1 overflow-y-auto p-0 sm:p-0 relative flex flex-col">');

// 3. Change min-h-[700px] to flex-1 to take up full space
code = code.replace(/<div className="flex flex-col min-h-\[700px\]">/g, '<div className="flex flex-col flex-1 h-full">');

// 4. Update the pagination bottom container to be sticky to bottom if we want it to be always visible, or just keep it as is.
// Let's leave pagination as is, it's already flex-col justify-between and pagination is at the bottom of the table.

fs.writeFileSync('components/AdminDashboard.tsx', code);
