import React, { useState } from 'react';

export interface CopyButtonProps {
  text: string;
  className?: string;
  iconSize?: string;
}

export const CopyButton: React.FC<CopyButtonProps> = ({ 
  text, 
  className = "bg-white border-slate-200 text-slate-500 hover:text-slate-700 hover:border-slate-300",
  iconSize = "w-5 h-5"
}) => {
  const [copied, setCopied] = useState(false);

  const handleCopy = (e: React.MouseEvent) => {
    e.stopPropagation(); // Prevent triggering parent clicks
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <button
      onClick={handleCopy}
      className={`
        w-10 h-10 shrink-0 flex items-center justify-center rounded-xl border transition-all duration-200 active:scale-95 shadow-sm hover:shadow-md
        ${copied 
          ? 'bg-green-50 border-green-200 text-green-600 shadow-none' 
          : className}
      `}
      title={copied ? "Đã sao chép" : "Sao chép"}
    >
      {copied ? (
        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className={iconSize}>
          <path strokeLinecap="round" strokeLinejoin="round" d="m4.5 12.75 6 6 9-13.5" />
        </svg>
      ) : (
        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className={iconSize}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 8.25V6a2.25 2.25 0 0 0-2.25-2.25H6A2.25 2.25 0 0 0 3.75 6v8.25A2.25 2.25 0 0 0 6 16.5h2.25m8.25-8.25H18a2.25 2.25 0 0 1 2.25 2.25V18A2.25 2.25 0 0 1 18 20.25h-7.5A2.25 2.25 0 0 1 8.25 18v-1.5m8.25-8.25h-6a2.25 2.25 0 0 0-2.25 2.25v6" />
        </svg>
      )}
    </button>
  );
};