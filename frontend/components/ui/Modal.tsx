'use client';

import React, { useEffect } from 'react';
import { X } from 'lucide-react';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  subtitle?: string;
  children: React.ReactNode;
  maxWidth?: 'sm' | 'md' | 'lg' | 'xl' | '2xl' | '4xl';
}

export const Modal: React.FC<ModalProps> = ({
  isOpen,
  onClose,
  title,
  subtitle,
  children,
  maxWidth = 'xl',
}) => {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    if (isOpen) {
      document.body.style.overflow = 'hidden';
      window.addEventListener('keydown', handleKeyDown);
    }
    return () => {
      document.body.style.overflow = 'auto';
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const maxWidthClasses = {
    sm: 'max-w-sm',
    md: 'max-w-md',
    lg: 'max-w-lg',
    xl: 'max-w-xl',
    '2xl': 'max-w-2xl',
    '4xl': 'max-w-4xl',
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2.5 sm:p-4 bg-maroon-950/75 backdrop-blur-xs overflow-y-auto animate-fadeIn">
      <div
        className={`bg-cream-100 dark:bg-maroon-900 rounded-2xl sm:rounded-3xl shadow-neo-xl border-2 border-maroon-950 dark:border-cream-100 w-full ${maxWidthClasses[maxWidth]} overflow-hidden my-auto max-h-[90dvh] max-h-[90vh] flex flex-col`}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between px-3.5 sm:px-6 py-3 sm:py-4 border-b-2 border-maroon-950/15 dark:border-cream-100/20 bg-cream-50 dark:bg-maroon-950 shrink-0">
          <div className="pr-2 min-w-0">
            <h3 className="text-sm sm:text-lg font-black text-maroon-950 dark:text-cream-100 font-serif truncate">{title}</h3>
            {subtitle && <p className="text-[10px] sm:text-xs text-charcoal-muted dark:text-cream-300/80 font-medium mt-0.5 truncate">{subtitle}</p>}
          </div>
          <button
            onClick={onClose}
            className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl border-2 border-maroon-950/20 dark:border-cream-100/20 text-maroon-950 dark:text-cream-100 hover:border-maroon-950 hover:bg-cream-200 dark:hover:bg-maroon-800 transition shrink-0 shadow-xs active:scale-95 flex items-center justify-center"
            aria-label="Close modal"
          >
            <X className="w-4 h-4 sm:w-5 sm:h-5" />
          </button>
        </div>

        <div className="p-3.5 sm:p-6 overflow-y-auto flex-1 text-charcoal dark:text-cream-100 overscroll-contain">{children}</div>
      </div>
    </div>
  );
};
