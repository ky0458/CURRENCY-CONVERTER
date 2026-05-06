const fs = require('fs');
let code = fs.readFileSync('components/AdminDashboard.tsx', 'utf8');

// Fix dropdown CSS to open upwards or guarantee z-index without clip
code = code.replace(
    'className="absolute z-20 mt-1 w-full bg-white border border-slate-200 rounded-lg shadow-lg overflow-hidden animate-fade-in-up origin-top-left"',
    'className="absolute z-[100] bottom-full mb-2 w-full bg-white border border-slate-200 rounded-lg shadow-2xl overflow-hidden animate-fade-in-up origin-bottom-left"'
);

// We need to also allow it to overflow if it opens downwards?
// The parent has "overflow-x-auto flex-1 flex flex-col justify-between"
// We can change it to visible if needed, but since it's a table wrapper, overflow-x-auto is required for the table.
// Wait, the pagination is UNDER the overflow-x-auto? 
// No, the pagination is INSIDE the overflow wrapper in my previous code!
// Let's see: `className="p-0 overflow-x-auto flex-1 flex flex-col justify-between"`
// The table is inside, and then pagination is at the bottom.
// If we open upwards `bottom-full mb-2`, it will be inside the wrapper, but since the wrapper is tall enough (min-h-500 or flex-1), it should be fully visible!

fs.writeFileSync('components/AdminDashboard.tsx', code);
