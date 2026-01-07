
import React, { useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { useAuth } from '../contexts/AuthContext';
import { Tooltip } from './Tooltip';
import { ThemeColor } from '../types';

interface UserMenuProps {
  hasBackgroundImage?: boolean;
  theme?: ThemeColor;
}

export const UserMenu: React.FC<UserMenuProps> = ({ hasBackgroundImage = false, theme = '#2563eb' }) => {
  const { user, loginGoogle, logout } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
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

  const handleLogoutClick = () => {
      setIsOpen(false);
      setShowLogoutConfirm(true);
  };

  const confirmLogout = () => {
      logout();
      setShowLogoutConfirm(false);
  };

  // Modern Styles:
  // - Has Background: Glassmorphism
  // - No Background: Gradient Primary Color (Solid) for high contrast and modern look
  const buttonClass = hasBackgroundImage
    ? "bg-white/20 backdrop-blur-md text-white hover:bg-white/30 shadow-lg shadow-black/5 border border-white/20"
    : "bg-gradient-to-r from-primary-500 to-primary-600 text-white hover:from-primary-600 hover:to-primary-700 shadow-lg shadow-primary-500/30 hover:shadow-primary-500/50 hover:-translate-y-0.5 border-transparent";

  return (
    <>
      <div className="relative" ref={containerRef}>
        {!user ? (
          <>
            <Tooltip content="Đăng nhập để đồng bộ dữ liệu" position="bottom">
              <button
                onClick={() => setIsOpen(!isOpen)}
                className={`h-10 pl-1.5 pr-4 rounded-full font-bold text-xs sm:text-sm transition-all duration-300 flex items-center gap-2 group active:scale-95 border ${buttonClass}`}
              >
                <div className={`p-1.5 rounded-full transition-colors ${hasBackgroundImage ? 'bg-white/20' : 'bg-white/20'}`}>
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-3.5 h-3.5 text-white">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 1 1-7.5 0 3.75 3.75 0 0 1 7.5 0ZM4.501 20.118a7.5 7.5 0 0 1 14.998 0A17.933 17.933 0 0 1 12 21.75c-2.676 0-5.216-.584-7.499-1.632Z" />
                    </svg>
                </div>
                <span className="hidden sm:inline tracking-wide font-extrabold text-shadow-sm">Đăng nhập</span>
              </button>
            </Tooltip>

            {isOpen && (
              <div className="absolute right-0 top-[calc(100%+12px)] bg-white/95 backdrop-blur-2xl rounded-2xl shadow-[0_20px_60px_-15px_rgba(0,0,0,0.15)] border border-white/60 p-2 w-[240px] z-[100] animate-fade-in-up origin-top-right ring-1 ring-black/5">
                
                {/* Title Section */}
                <div className="px-3 py-2 border-b border-slate-100 mb-1">
                    <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-widest">Đăng nhập với</span>
                </div>

                <div className="p-1 space-y-1">
                    <button
                    onClick={() => { loginGoogle(); setIsOpen(false); }}
                    className="w-full flex items-center gap-3 px-3 py-3 hover:bg-slate-50 rounded-xl transition-all text-slate-700 font-bold text-sm group relative overflow-hidden"
                    >
                    <div className="w-7 h-7 flex items-center justify-center bg-white rounded-full p-1 border border-slate-200 group-hover:border-slate-300 transition-colors shadow-sm relative z-10">
                        <svg viewBox="0 0 24 24" className="w-full h-full"><path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/><path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/><path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/><path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/></svg>
                    </div>
                    <span className="relative z-10">Google</span>
                    </button>
                </div>
              </div>
            )}
          </>
        ) : (
          <>
            <button
              onClick={() => setIsOpen(!isOpen)}
              className={`w-10 h-10 rounded-full p-0.5 transition-all duration-300 overflow-hidden flex items-center justify-center border
                ${hasBackgroundImage 
                  ? 'bg-white/20 backdrop-blur-md hover:bg-white/30 text-white shadow-lg shadow-black/5 border-white/20' 
                  : 'bg-white hover:bg-primary-50 text-primary-600 shadow-md hover:shadow-xl hover:-translate-y-0.5 border-transparent'}`}
            >
              {user.photoURL ? (
                  <img src={user.photoURL} alt={user.displayName || "User"} className="w-full h-full rounded-full object-cover ring-2 ring-white/50" />
              ) : (
                  <div 
                    className={`w-full h-full rounded-full flex items-center justify-center font-bold text-sm
                      ${hasBackgroundImage ? 'text-white' : 'text-primary-600 bg-primary-50'}`}
                  >
                      {user.displayName ? user.displayName.charAt(0).toUpperCase() : "U"}
                  </div>
              )}
            </button>

            {isOpen && (
              <div className="absolute right-0 top-[calc(100%+12px)] bg-white/95 backdrop-blur-2xl rounded-2xl shadow-[0_20px_60px_-15px_rgba(0,0,0,0.15)] border border-white/60 p-2 w-[240px] z-[100] animate-fade-in-up origin-top-right ring-1 ring-black/5">
                <div className="px-3 py-3 border-b border-slate-100 mb-1">
                    <p className="text-sm font-bold text-slate-800 truncate">{user.displayName || "Người dùng"}</p>
                    <p className="text-xs text-slate-400 truncate">{user.email}</p>
                </div>
                
                <button
                    onClick={handleLogoutClick}
                    className="w-full flex items-center gap-2 px-3 py-2.5 hover:bg-red-50 text-red-500 rounded-xl transition-colors font-medium text-sm mt-1 group"
                  >
                    <div className="p-1.5 bg-red-100 rounded-full group-hover:bg-red-200 transition-colors">
                      <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-3.5 h-3.5">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 9V5.25A2.25 2.25 0 0 0 13.5 3h-6a2.25 2.25 0 0 0-2.25 2.25v13.5A2.25 2.25 0 0 0 7.5 21h6a2.25 2.25 0 0 0 2.25-2.25V15M12 9l-3 3m0 0 3 3m-3-3h12.75" />
                      </svg>
                    </div>
                    Đăng xuất
                </button>
              </div>
            )}
          </>
        )}
      </div>

      {/* Logout Confirmation Modal using Portal to avoid stacking context issues and center on screen */}
      {showLogoutConfirm && createPortal(
          <div className="fixed inset-0 z-[10001] flex items-center justify-center p-4">
              <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-[2px]" onClick={() => setShowLogoutConfirm(false)}></div>
              <div className="bg-white rounded-3xl shadow-2xl p-6 w-[90%] max-w-sm relative z-10 animate-scale-in border border-white/50">
                  <div className="text-center mb-8 mt-2">
                      <div className="w-16 h-16 bg-red-50 rounded-full flex items-center justify-center mx-auto mb-5 text-red-500 ring-8 ring-red-50/50 shadow-sm">
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-8 h-8">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 9V5.25A2.25 2.25 0 0 0 13.5 3h-6a2.25 2.25 0 0 0-2.25 2.25v13.5A2.25 2.25 0 0 0 7.5 21h6a2.25 2.25 0 0 0 2.25-2.25V15M12 9l-3 3m0 0 3 3m-3-3h12.75" />
                        </svg>
                      </div>
                      <h4 className="text-xl font-extrabold text-slate-800 mb-2">Đăng xuất?</h4>
                      <p className="text-slate-500 font-medium text-sm px-4">
                          Bạn có chắc chắn muốn đăng xuất khỏi tài khoản không?
                      </p>
                  </div>
                  <div className="flex flex-col sm:flex-row gap-3">
                      <button 
                        onClick={() => setShowLogoutConfirm(false)}
                        className="flex-1 py-3.5 rounded-2xl font-bold text-slate-600 bg-slate-100 hover:bg-slate-200 transition-colors active:scale-95"
                      >
                          Hủy bỏ
                      </button>
                      <button 
                        onClick={confirmLogout}
                        className="flex-1 py-3.5 rounded-2xl font-bold text-white bg-red-500 hover:bg-red-600 transition-colors shadow-lg shadow-red-200 active:scale-95"
                      >
                          Đăng xuất
                      </button>
                  </div>
              </div>
          </div>,
          document.body
      )}
    </>
  );
};
