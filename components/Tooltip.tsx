import React, { useState, useRef, useEffect, ReactNode } from 'react';

interface TooltipProps {
  content: string;
  children: ReactNode;
  position?: 'top' | 'bottom' | 'left' | 'right';
}

export const Tooltip: React.FC<TooltipProps> = ({ content, children, position = 'top' }) => {
  const [isVisible, setIsVisible] = useState(false);
  const timerRef = useRef<number | null>(null);

  const handleMouseEnter = () => {
    // Only show on hover if device supports hover (desktop)
    if (window.matchMedia('(hover: hover)').matches) {
      setIsVisible(true);
    }
  };

  const handleMouseLeave = () => {
    if (window.matchMedia('(hover: hover)').matches) {
      setIsVisible(false);
    }
  };

  const handleTouchStart = () => {
    timerRef.current = window.setTimeout(() => {
      setIsVisible(true);
    }, 500); // 500ms long press
  };

  const clearTimer = () => {
     if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
  };

  const handleTouchEnd = () => {
    clearTimer();
    setIsVisible(false);
  };

  // Cleanup
  useEffect(() => {
    return () => clearTimer();
  }, []);

  return (
    <div 
      className={`relative flex items-center ${isVisible ? 'z-[60]' : 'z-auto'}`}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
      onTouchMove={handleTouchEnd} // Cancel on scroll
      onTouchCancel={handleTouchEnd}
    >
      {children}
      {isVisible && (
        <div className={`
          absolute px-2 py-1 text-xs font-bold text-white bg-slate-800 rounded shadow-lg whitespace-nowrap pointer-events-none transition-opacity min-w-max animate-fade-in-up
          ${position === 'top' ? 'bottom-full left-1/2 transform -translate-x-1/2 mb-2' : ''}
          ${position === 'bottom' ? 'top-full left-1/2 transform -translate-x-1/2 mt-2' : ''}
          ${position === 'left' ? 'right-full top-1/2 transform -translate-y-1/2 mr-2' : ''}
          ${position === 'right' ? 'left-full top-1/2 transform -translate-y-1/2 ml-2' : ''}
        `}
        style={{ animationDuration: '0.2s' }}
        >
          {content}
          <div className={`
             absolute w-2 h-2 bg-slate-800 transform rotate-45
             ${position === 'top' ? 'top-full left-1/2 -translate-x-1/2 -mt-1' : ''}
             ${position === 'bottom' ? 'bottom-full left-1/2 -translate-x-1/2 -mb-1' : ''}
             ${position === 'left' ? 'left-full top-1/2 -translate-y-1/2 -ml-1' : ''}
             ${position === 'right' ? 'right-full top-1/2 -translate-y-1/2 -mr-1' : ''}
          `}></div>
        </div>
      )}
    </div>
  );
};