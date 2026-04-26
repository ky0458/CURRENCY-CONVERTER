import * as fs from 'fs';

let content = fs.readFileSync('App.tsx', 'utf-8');

// The default button style fallback
content = content.replace(
  ": 'bg-gradient-to-r from-primary-600 to-primary-800 hover:-translate-y-1 active:scale-[0.98]')",
  ": 'bg-gradient-to-b from-slate-800 to-slate-900 border border-slate-700 shadow-[0_8px_20px_-5px_rgba(0,0,0,0.5),inset_0_1px_1px_rgba(255,255,255,0.1)] hover:-translate-y-1 hover:shadow-[0_12px_25px_-5px_rgba(0,0,0,0.6),inset_0_1px_1px_rgba(255,255,255,0.2)] hover:from-slate-700 hover:to-slate-800 active:scale-[0.98] active:translate-y-0 text-white')"
);

// Animal Button Decorators replacement
const decoratorsOld = `                    {/* Animal Button Decorators */}
                    {appStyles.button === 'frog' && (
                        <>
                            <div className="absolute -top-3 left-[15%] w-8 h-6 bg-[#14532d] border-[3px] border-[#064e3b] rounded-t-full z-[-1]"></div>
                            <div className="absolute -top-3 right-[15%] w-8 h-6 bg-[#14532d] border-[3px] border-[#064e3b] rounded-t-full z-[-1]"></div>
                            <div className="absolute -top-[2px] left-[18%] w-3 h-3 bg-white rounded-full z-10 pointer-events-none flex items-center justify-center"><div className="w-1 h-1 bg-slate-900 rounded-full mb-0.5 ml-0.5"></div></div>
                            <div className="absolute -top-[2px] right-[22%] w-3 h-3 bg-white rounded-full z-10 pointer-events-none flex items-center justify-center"><div className="w-1 h-1 bg-slate-900 rounded-full mb-0.5 -ml-0.5"></div></div>
                            <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-[85%] h-6 bg-gradient-to-t from-[#65a30d] to-[#84cc16] border-t-[4px] border-[#4d7c0f] rounded-t-full opacity-90 shadow-[inset_0_2px_4px_rgba(0,0,0,0.1)] overflow-hidden"></div>
                            <div className="absolute top-[40%] left-[10%] w-8 h-4 bg-pink-500/40 rounded-full blur-md"></div>
                            <div className="absolute top-[40%] right-[10%] w-8 h-4 bg-pink-500/40 rounded-full blur-md"></div>
                            <div className="absolute bottom-1 left-1/2 -translate-x-1/2 w-8 h-4 border-b-[4px] border-[#022c22] rounded-b-full opacity-85 pointer-events-none"></div>
                        </>
                    )}
                    {appStyles.button === 'cat' && (
                        <>
                            <div className="absolute -top-3 left-[10%] w-6 h-6 bg-[#FDBA74] border-[3px] border-[#EA580C] rotate-[-25deg] [clip-path:polygon(50%_0%,0%_100%,100%_100%)] z-[-1] pointer-events-none"></div>
                            <div className="absolute -top-3 right-[10%] w-6 h-6 bg-[#FDBA74] border-[3px] border-[#EA580C] rotate-[25deg] [clip-path:polygon(50%_0%,0%_100%,100%_100%)] z-[-1] pointer-events-none"></div>
                        </>
                    )}
                    {appStyles.button === 'panda' && (
                        <>
                            <div className="absolute -top-4 left-[10%] w-8 h-8 bg-zinc-900 rounded-full z-[-1] pointer-events-none"></div>
                            <div className="absolute -top-4 right-[10%] w-8 h-8 bg-zinc-900 rounded-full z-[-1] pointer-events-none"></div>
                        </>
                    )}
                    {appStyles.button === 'fox' && (
                        <>
                            <div className="absolute -top-4 left-[12%] w-8 h-8 bg-[#C2410C] rotate-[-15deg] [clip-path:polygon(50%_0%,0%_100%,100%_100%)] z-[-1] pointer-events-none"></div>
                            <div className="absolute -top-4 right-[12%] w-8 h-8 bg-[#C2410C] rotate-[15deg] [clip-path:polygon(50%_0%,0%_100%,100%_100%)] z-[-1] pointer-events-none"></div>
                        </>
                    )}
                    {appStyles.button === 'dragon' && (
                        <>
                            <div className="absolute -top-3 left-1/4 w-6 h-6 bg-red-800 rotate-45 z-[-1] pointer-events-none"></div>
                            <div className="absolute -top-4 left-1/2 -translate-x-1/2 w-8 h-8 bg-red-900 rotate-45 z-[-1] pointer-events-none"></div>
                            <div className="absolute -top-3 right-1/4 w-6 h-6 bg-red-800 rotate-45 z-[-1] pointer-events-none"></div>
                            <div className="absolute opacity-20 w-full h-full inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-yellow-500 to-transparent pointer-events-none"></div>
                        </>
                    )}
                    {appStyles.button === 'penguin' && (
                        <>
                            <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-[70%] h-1/2 bg-white rounded-t-full z-0 pointer-events-none"></div>
                        </>
                    )}
                    {appStyles.button === 'bear' && (
                        <>
                            <div className="absolute -top-3 left-[15%] w-8 h-8 bg-amber-800 rounded-full z-[-1] pointer-events-none bg-amber-800"></div>
                            <div className="absolute -top-3 right-[15%] w-8 h-8 bg-amber-800 rounded-full z-[-1] pointer-events-none bg-amber-800"></div>
                        </>
                    )}
                    {appStyles.button === 'rabbit' && (
                        <>
                            <div className="absolute -top-8 left-[20%] w-6 h-12 bg-pink-500 rounded-full rotate-[-15deg] z-[-1] pointer-events-none flex items-center justify-center border-2 border-pink-600"><div className="w-3 h-8 bg-pink-200 rounded-full"></div></div>
                            <div className="absolute -top-8 right-[20%] w-6 h-12 bg-pink-500 rounded-full rotate-[15deg] z-[-1] pointer-events-none flex items-center justify-center border-2 border-pink-600"><div className="w-3 h-8 bg-pink-200 rounded-full"></div></div>
                        </>
                    )}
                    {appStyles.button === 'bee' && (
                        <>
                            <div className="absolute inset-0 bg-[repeating-linear-gradient(90deg,transparent,transparent_20px,rgba(0,0,0,0.15)_20px,rgba(0,0,0,0.15)_40px)] pointer-events-none"></div>
                            <div className="absolute -top-4 left-[25%] w-8 h-6 bg-white/40 rotate-[-30deg] rounded-full z-[-1] pointer-events-none border border-white/60 backdrop-blur-sm"></div>
                            <div className="absolute -top-4 right-[25%] w-8 h-6 bg-white/40 rotate-[30deg] rounded-full z-[-1] pointer-events-none border border-white/60 backdrop-blur-sm"></div>
                        </>
                    )}
                    {appStyles.button === 'whale' && (
                        <>
                            <div className="absolute -top-4 left-1/2 -translate-x-1/2 w-2 h-6 bg-sky-200/80 z-[-1] pointer-events-none"></div>
                            <div className="absolute -top-5 left-1/2 -translate-x-[80%] w-4 h-3 bg-sky-200/80 rounded-full rotate-[-30deg] z-[-1] pointer-events-none"></div>
                            <div className="absolute -top-5 left-1/2 -translate-x-[20%] w-4 h-3 bg-sky-200/80 rounded-full rotate-[30deg] z-[-1] pointer-events-none"></div>
                            <div className="absolute bottom-0 left-0 w-full h-2 bg-sky-600/50 pointer-events-none"></div>
                        </>
                    )}`;

const decoratorsNew = `                    {/* Animal Button Decorators */}
                    {appStyles.button === 'frog' && (
                        <>
                            <div className="absolute -top-[14px] left-[15%] w-9 h-7 bg-[#166534] border-[3px] border-[#14532d] shadow-[inset_0_2px_4px_rgba(255,255,255,0.2)] rounded-t-full z-[-1]"></div>
                            <div className="absolute -top-[14px] right-[15%] w-9 h-7 bg-[#166534] border-[3px] border-[#14532d] shadow-[inset_0_2px_4px_rgba(255,255,255,0.2)] rounded-t-full z-[-1]"></div>
                            <div className="absolute -top-[4px] left-[18%] w-4 h-4 bg-white rounded-full z-10 pointer-events-none flex items-center justify-center shadow-[inset_0_-1px_2px_rgba(0,0,0,0.3)]"><div className="w-1.5 h-1.5 bg-slate-900 rounded-full mb-0.5 ml-0.5 shadow-[0_0_2px_rgba(255,255,255,0.5)]"><div className="w-0.5 h-0.5 bg-white rounded-full ml-0.5"></div></div></div>
                            <div className="absolute -top-[4px] right-[21%] w-4 h-4 bg-white rounded-full z-10 pointer-events-none flex items-center justify-center shadow-[inset_0_-1px_2px_rgba(0,0,0,0.3)]"><div className="w-1.5 h-1.5 bg-slate-900 rounded-full mb-0.5 -ml-0.5 shadow-[0_0_2px_rgba(255,255,255,0.5)]"><div className="w-0.5 h-0.5 bg-white rounded-full mr-0.5"></div></div></div>
                            <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-[85%] h-7 bg-gradient-to-t from-[#84cc16] to-[#a3e635] shadow-[inset_0_3px_5px_rgba(255,255,255,0.4),0_-2px_4px_rgba(0,0,0,0.1)] rounded-t-[40px] opacity-95 pointer-events-none"></div>
                            <div className="absolute top-[40%] left-[10%] w-8 h-4 bg-pink-500/50 rounded-full blur-[3px] pointer-events-none"></div>
                            <div className="absolute top-[40%] right-[10%] w-8 h-4 bg-pink-500/50 rounded-full blur-[3px] pointer-events-none"></div>
                        </>
                    )}
                    {appStyles.button === 'cat' && (
                        <>
                            <div className="absolute -top-4 left-[10%] w-8 h-8 bg-[#FDBA74] border-[3px] border-[#C2410C] rotate-[-25deg] [clip-path:polygon(50%_0%,0%_100%,100%_100%)] z-[-1] pointer-events-none flex justify-center items-end pb-1"><div className="w-3 h-3 bg-pink-300 [clip-path:polygon(50%_0%,0%_100%,100%_100%)]"></div></div>
                            <div className="absolute -top-4 right-[10%] w-8 h-8 bg-[#FDBA74] border-[3px] border-[#C2410C] rotate-[25deg] [clip-path:polygon(50%_0%,0%_100%,100%_100%)] z-[-1] pointer-events-none flex justify-center items-end pb-1"><div className="w-3 h-3 bg-pink-300 [clip-path:polygon(50%_0%,0%_100%,100%_100%)]"></div></div>
                            <div className="absolute top-[35%] left-[8%] w-5 h-2.5 bg-pink-400/40 rounded-full blur-[2px] pointer-events-none"></div>
                            <div className="absolute top-[35%] right-[8%] w-5 h-2.5 bg-pink-400/40 rounded-full blur-[2px] pointer-events-none"></div>
                            <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-6 h-6 bg-white/30 rounded-t-full pointer-events-none"></div>
                        </>
                    )}
                    {appStyles.button === 'panda' && (
                        <>
                            <div className="absolute -top-5 left-[10%] w-10 h-10 bg-zinc-900 border-[2px] border-zinc-950 rounded-full z-[-1] pointer-events-none flex justify-center items-center"><div className="w-6 h-6 bg-zinc-800 rounded-full shadow-[inset_0_2px_4px_rgba(255,255,255,0.1)]"></div></div>
                            <div className="absolute -top-5 right-[10%] w-10 h-10 bg-zinc-900 border-[2px] border-zinc-950 rounded-full z-[-1] pointer-events-none flex justify-center items-center"><div className="w-6 h-6 bg-zinc-800 rounded-full shadow-[inset_0_2px_4px_rgba(255,255,255,0.1)]"></div></div>
                            <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-[70%] h-3.5 bg-white/10 rounded-t-[20px] pointer-events-none"></div>
                            <div className="absolute top-[40%] left-[12%] w-7 h-3.5 bg-pink-400/20 rounded-full blur-[2px] pointer-events-none"></div>
                            <div className="absolute top-[40%] right-[12%] w-7 h-3.5 bg-pink-400/20 rounded-full blur-[2px] pointer-events-none"></div>
                        </>
                    )}
                    {appStyles.button === 'fox' && (
                        <>
                            <div className="absolute -top-5 left-[12%] w-9 h-10 bg-[#ea580c] rotate-[-15deg] [clip-path:polygon(50%_0%,0%_100%,100%_100%)] z-[-1] pointer-events-none flex justify-center items-end pb-1.5"><div className="w-4 h-4 bg-zinc-900 [clip-path:polygon(50%_0%,0%_100%,100%_100%)]"></div></div>
                            <div className="absolute -top-5 right-[12%] w-9 h-10 bg-[#ea580c] rotate-[15deg] [clip-path:polygon(50%_0%,0%_100%,100%_100%)] z-[-1] pointer-events-none flex justify-center items-end pb-1.5"><div className="w-4 h-4 bg-zinc-900 [clip-path:polygon(50%_0%,0%_100%,100%_100%)]"></div></div>
                            <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-[60%] h-4 bg-white/40 rounded-t-full pointer-events-none border-t border-white/50"></div>
                        </>
                    )}
                    {appStyles.button === 'dragon' && (
                        <>
                            <div className="absolute -top-4 left-[20%] w-6 h-8 bg-red-800 border-[2px] border-red-950 rotate-[-15deg] [clip-path:polygon(50%_0%,0%_100%,100%_100%)] z-[-1] pointer-events-none"></div>
                            <div className="absolute -top-5 left-1/2 -translate-x-1/2 w-8 h-10 bg-red-900 border-[2px] border-red-950 [clip-path:polygon(50%_0%,0%_100%,100%_100%)] z-[-1] pointer-events-none shadow-xl"></div>
                            <div className="absolute -top-4 right-[20%] w-6 h-8 bg-red-800 border-[2px] border-red-950 rotate-[15deg] [clip-path:polygon(50%_0%,0%_100%,100%_100%)] z-[-1] pointer-events-none"></div>
                            <div className="absolute opacity-30 w-full h-full inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-yellow-400 to-transparent pointer-events-none mix-blend-overlay"></div>
                            <div className="absolute bottom-0 inset-x-0 h-4 flex justify-between px-6 pointer-events-none"><div className="w-3 h-3 bg-yellow-500 rounded-t-full"></div><div className="w-3 h-3 bg-yellow-500 rounded-t-full"></div></div>
                        </>
                    )}
                    {appStyles.button === 'penguin' && (
                        <>
                            <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-[75%] h-[60%] bg-white rounded-t-full z-0 pointer-events-none shadow-[inset_0_4px_10px_rgba(0,0,0,0.05)] border-t-[3px] border-white/60"></div>
                            <div className="absolute -top-2 left-1/2 -translate-x-1/2 w-8 h-4 bg-yellow-500 rounded-b-full border-[2px] border-yellow-600 shadow-md"></div>
                            <div className="absolute top-[35%] left-[18%] w-5 h-2.5 bg-pink-300/60 rounded-full blur-[2px] z-10 pointer-events-none"></div>
                            <div className="absolute top-[35%] right-[18%] w-5 h-2.5 bg-pink-300/60 rounded-full blur-[2px] z-10 pointer-events-none"></div>
                        </>
                    )}
                    {appStyles.button === 'bear' && (
                        <>
                            <div className="absolute -top-4 left-[15%] w-10 h-10 bg-amber-700 border-[3px] border-amber-900 shadow-[inset_0_2px_4px_rgba(255,255,255,0.2)] rounded-full z-[-1] pointer-events-none flex justify-center items-center"><div className="w-5 h-5 bg-amber-800 rounded-full"></div></div>
                            <div className="absolute -top-4 right-[15%] w-10 h-10 bg-amber-700 border-[3px] border-amber-900 shadow-[inset_0_2px_4px_rgba(255,255,255,0.2)] rounded-full z-[-1] pointer-events-none flex justify-center items-center"><div className="w-5 h-5 bg-amber-800 rounded-full"></div></div>
                            <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-[55%] h-5 bg-[#fef3c7]/30 border-t border-amber-100/20 rounded-t-[24px] pointer-events-none mix-blend-screen"></div>
                        </>
                    )}
                    {appStyles.button === 'rabbit' && (
                        <>
                            <div className="absolute -top-10 left-[20%] w-8 h-14 bg-pink-400 rounded-t-full rotate-[-12deg] z-[-1] pointer-events-none flex items-center justify-center border-[3px] border-pink-600 shadow-[inset_0_2px_5px_rgba(255,255,255,0.5)]"><div className="w-4 h-9 bg-pink-200 rounded-full translate-y-1 block"></div></div>
                            <div className="absolute -top-10 right-[20%] w-8 h-14 bg-pink-400 rounded-t-full rotate-[12deg] z-[-1] pointer-events-none flex items-center justify-center border-[3px] border-pink-600 shadow-[inset_0_2px_5px_rgba(255,255,255,0.5)]"><div className="w-4 h-9 bg-pink-200 rounded-full translate-y-1 block"></div></div>
                            <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-6 h-4 bg-white/40 rounded-t-full pointer-events-none"></div>
                        </>
                    )}
                    {appStyles.button === 'bee' && (
                        <>
                            <div className="absolute inset-0 bg-[repeating-linear-gradient(90deg,transparent,transparent_20px,rgba(0,0,0,0.15)_20px,rgba(0,0,0,0.15)_40px)] pointer-events-none rounded-[20px]"></div>
                            <div className="absolute -top-5 left-[22%] w-10 h-8 bg-sky-100/70 rotate-[-25deg] rounded-t-full rounded-bl-full z-[-1] pointer-events-none border-[2px] border-sky-300 backdrop-blur-sm shadow-sm origin-bottom-right"></div>
                            <div className="absolute -top-5 right-[22%] w-10 h-8 bg-sky-100/70 rotate-[25deg] rounded-t-full rounded-br-full z-[-1] pointer-events-none border-[2px] border-sky-300 backdrop-blur-sm shadow-sm origin-bottom-left"></div>
                        </>
                    )}
                    {appStyles.button === 'whale' && (
                        <>
                            <div className="absolute -top-5 left-1/2 -translate-x-1/2 w-3 h-8 bg-gradient-to-t from-sky-400 to-sky-100/80 z-[-1] pointer-events-none rounded-t-full border-t border-white shadow-[0_0_8px_rgba(255,255,255,0.8)]"></div>
                            <div className="absolute -top-7 left-1/2 -translate-x-[90%] w-5 h-4 bg-sky-100/90 rounded-full rotate-[-40deg] z-[-1] pointer-events-none border border-sky-200 shadow-sm"></div>
                            <div className="absolute -top-7 left-1/2 -translate-x-[10%] w-5 h-4 bg-sky-100/90 rounded-full rotate-[40deg] z-[-1] pointer-events-none border border-sky-200 shadow-sm"></div>
                            <div className="absolute bottom-0 left-0 w-full h-3 bg-white/30 pointer-events-none rounded-b-[20px]"></div>
                            <div className="absolute bottom-3 left-1/2 -translate-x-1/2 w-[90%] h-0.5 bg-sky-700/30 rounded-full"></div>
                        </>
                    )}`;

if (content.includes(decoratorsOld)) {
    content = content.replace(decoratorsOld, decoratorsNew);
    fs.writeFileSync('App.tsx', content, 'utf-8');
    console.log("Updated App.tsx successfully!");
} else {
    console.log("Could not find decorators block in App.tsx!");
}
