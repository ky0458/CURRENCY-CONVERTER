
import React, { useState, useRef, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { Tooltip } from './Tooltip';

interface UserMenuProps {
  hasBackgroundImage?: boolean;
}

export const UserMenu: React.FC<UserMenuProps> = ({ hasBackgroundImage = false }) => {
  const { user, loginGoogle, loginFacebook, logout } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const buttonBaseClass = hasBackgroundImage
    ? "bg-white/20 backdrop-blur-md border-white/40 text-white hover:bg-white/30 shadow-black/10"
    : "bg-white/90 backdrop-blur-md border-slate-200 text-slate-600 hover:bg-white hover:text-primary-600 hover:border-primary-200 shadow-slate-200/50";

  if (!user) {
    return (
      <div className="relative" ref={containerRef}>
        <Tooltip content="Đăng nhập để đồng bộ" position="bottom">
          <button
            onClick={() => setIsOpen(!isOpen)}
            className={`h-10 px-4 rounded-full shadow-lg border font-bold text-xs sm:text-sm transition-all flex items-center gap-2 group ${buttonBaseClass}`}
          >
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className={`w-4 h-4 ${hasBackgroundImage ? 'text-white/90 group-hover:text-white' : 'text-slate-400 group-hover:text-primary-500'}`}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 1 1-7.5 0 3.75 3.75 0 0 1 7.5 0ZM4.501 20.118a7.5 7.5 0 0 1 14.998 0A17.933 17.933 0 0 1 12 21.75c-2.676 0-5.216-.584-7.499-1.632Z" />
            </svg>
            <span className="hidden sm:inline">Đăng nhập</span>
          </button>
        </Tooltip>

        {isOpen && (
          <div className="absolute right-0 top-[calc(100%+8px)] bg-white/95 backdrop-blur-xl rounded-2xl shadow-2xl border border-white/50 p-2 w-[220px] z-[100] animate-fade-in-up origin-top-right">
            <div className="p-2 text-xs text-slate-400 font-semibold uppercase tracking-wider text-center border-b border-slate-100 mb-2">
              Chọn phương thức
            </div>
            <button
              onClick={() => { loginGoogle(); setIsOpen(false); }}
              className="w-full flex items-center gap-3 px-3 py-2.5 hover:bg-slate-50 rounded-xl transition-colors text-slate-700 font-medium text-sm mb-1"
            >
              <div className="w-5 h-5 flex items-center justify-center bg-white rounded-full p-0.5 border border-slate-100">
                <svg viewBox="0 0 24 24" className="w-full h-full"><path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/><path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/><path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/><path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/></svg>
              </div>
              Tiếp tục với Google
            </button>
            <button
              onClick={() => { loginFacebook(); setIsOpen(false); }}
              className="w-full flex items-center gap-3 px-3 py-2.5 hover:bg-slate-50 rounded-xl transition-colors text-slate-700 font-medium text-sm"
            >
              <div className="w-5 h-5 flex items-center justify-center bg-[#1877F2] rounded-full text-white">
                <svg viewBox="0 0 24 24" fill="currentColor" className="w-3 h-3"><path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/></svg>
              </div>
              Tiếp tục với Facebook
            </button>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="relative" ref={containerRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`w-10 h-10 rounded-full p-0.5 shadow-lg border hover:scale-105 transition-all overflow-hidden ${buttonBaseClass}`}
      >
        {user.photoURL ? (
            <img src={user.photoURL} alt={user.displayName || "User"} className="w-full h-full rounded-full object-cover" />
        ) : (
            <div className={`w-full h-full rounded-full flex items-center justify-center font-bold text-sm ${hasBackgroundImage ? 'bg-white/20 text-white' : 'bg-primary-100 text-primary-600'}`}>
                {user.displayName ? user.displayName.charAt(0).toUpperCase() : "U"}
            </div>
        )}
      </button>

      {isOpen && (
        <div className="absolute right-0 top-[calc(100%+8px)] bg-white/95 backdrop-blur-xl rounded-2xl shadow-2xl border border-white/50 p-2 w-[240px] z-[100] animate-fade-in-up origin-top-right">
           <div className="px-3 py-3 border-b border-slate-100 mb-1">
              <p className="text-sm font-bold text-slate-800 truncate">{user.displayName || "Người dùng"}</p>
              <p className="text-xs text-slate-400 truncate">{user.email}</p>
           </div>
           
           <button
              onClick={() => { logout(); setIsOpen(false); }}
              className="w-full flex items-center gap-2 px-3 py-2.5 hover:bg-red-50 text-red-500 rounded-xl transition-colors font-medium text-sm"
            >
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-4 h-4">
                <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 9V5.25A2.25 2.25 0 0 0 13.5 3h-6a2.25 2.25 0 0 0-2.25 2.25v13.5A2.25 2.25 0 0 0 7.5 21h6a2.25 2.25 0 0 0 2.25-2.25V15M12 9l-3 3m0 0 3 3m-3-3h12.75" />
              </svg>
              Đăng xuất
           </button>
        </div>
      )}
    </div>
  );
};
