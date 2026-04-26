import * as fs from 'fs';

let content = fs.readFileSync('components/ThemeSelector.tsx', 'utf-8');

// fix default button
content = content.replace(
  '<div className="px-6 py-3 rounded-xl text-white text-[13px] font-bold bg-gradient-to-r from-primary-600 to-primary-800 shadow-sm">Thao tác</div>',
  '<div className="px-6 py-3 rounded-[12px] text-white text-[13px] font-bold bg-gradient-to-b from-slate-800 to-slate-900 border border-slate-700 shadow-[0_4px_10px_-2px_rgba(0,0,0,0.5),inset_0_1px_1px_rgba(255,255,255,0.1)]">Thao tác</div>'
);

// fix panda button preview
content = content.replace(
  `<div className="px-6 py-3 rounded-[20px] border-2 border-zinc-900 text-white text-[13px] font-bold bg-zinc-800 shadow-[0_4px_0_theme(colors.zinc.900)] relative">
                                            <div className="absolute -top-3 left-[10%] w-5 h-5 bg-zinc-900 rounded-full z-[-1]"></div>
                                            <div className="absolute -top-3 right-[10%] w-5 h-5 bg-zinc-900 rounded-full z-[-1]"></div>
                                            Thao tác
                                        </div>`,
  `<div className="px-6 py-3 rounded-[20px] border-2 border-zinc-950 text-white text-[13px] font-bold bg-zinc-800 shadow-[0_4px_0_theme(colors.zinc.900)] relative z-10">
                                            <div className="absolute -top-3 left-[10%] w-6 h-6 bg-zinc-900 border-[1.5px] border-zinc-950 rounded-full z-[-1] flex justify-center items-center"><div className="w-3.5 h-3.5 bg-zinc-800 rounded-full shadow-[inset_0_1px_2px_rgba(255,255,255,0.1)]"></div></div>
                                            <div className="absolute -top-3 right-[10%] w-6 h-6 bg-zinc-900 border-[1.5px] border-zinc-950 rounded-full z-[-1] flex justify-center items-center"><div className="w-3.5 h-3.5 bg-zinc-800 rounded-full shadow-[inset_0_1px_2px_rgba(255,255,255,0.1)]"></div></div>
                                            <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-[70%] h-2.5 bg-white/10 rounded-t-[10px] pointer-events-none"></div>
                                            <div className="absolute top-[40%] left-[12%] w-4 h-2 bg-pink-400/20 rounded-full blur-[1px] pointer-events-none"></div>
                                            <div className="absolute top-[40%] right-[12%] w-4 h-2 bg-pink-400/20 rounded-full blur-[1px] pointer-events-none"></div>
                                            Thao tác
                                        </div>`
);

// fix cat button preview
content = content.replace(
  `<div className="px-6 py-3 rounded-[12px] border-2 border-[#EA580C] text-slate-900 text-[13px] font-bold bg-[#FDBA74] relative">
                                            <div className="absolute -top-2 left-[10%] w-4 h-4 bg-[#FDBA74] border-[2px] border-[#EA580C] rotate-[-25deg] [clip-path:polygon(50%_0%,0%_100%,100%_100%)] z-[-1]"></div>
                                            <div className="absolute -top-2 right-[10%] w-4 h-4 bg-[#FDBA74] border-[2px] border-[#EA580C] rotate-[25deg] [clip-path:polygon(50%_0%,0%_100%,100%_100%)] z-[-1]"></div>
                                            Thao tác
                                        </div>`,
  `<div className="px-6 py-3 rounded-[16px] border-[2px] border-[#C2410C] text-slate-900 text-[13px] font-bold bg-[#FDBA74] shadow-md relative z-10">
                                            <div className="absolute -top-3 left-[10%] w-5 h-5 bg-[#FDBA74] border-[2px] border-[#C2410C] rotate-[-25deg] [clip-path:polygon(50%_0%,0%_100%,100%_100%)] z-[-1] flex justify-center items-end pb-0.5"><div className="w-2 h-2 bg-pink-300 [clip-path:polygon(50%_0%,0%_100%,100%_100%)]"></div></div>
                                            <div className="absolute -top-3 right-[10%] w-5 h-5 bg-[#FDBA74] border-[2px] border-[#C2410C] rotate-[25deg] [clip-path:polygon(50%_0%,0%_100%,100%_100%)] z-[-1] flex justify-center items-end pb-0.5"><div className="w-2 h-2 bg-pink-300 [clip-path:polygon(50%_0%,0%_100%,100%_100%)]"></div></div>
                                            <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-4 h-4 bg-white/30 rounded-t-full pointer-events-none"></div>
                                            <div className="absolute top-[35%] left-[8%] w-3 h-1.5 bg-pink-400/40 rounded-full blur-[1px] pointer-events-none"></div>
                                            <div className="absolute top-[35%] right-[8%] w-3 h-1.5 bg-pink-400/40 rounded-full blur-[1px] pointer-events-none"></div>
                                            Thao tác
                                        </div>`
);


fs.writeFileSync('components/ThemeSelector.tsx', content, 'utf-8');
console.log('Update button previews done.');
