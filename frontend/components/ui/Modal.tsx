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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-maroon-950/70 backdrop-blur-sm overflow-y-auto animate-fadeIn">
      <div
        className={`bg-cream-100 dark:bg-maroon-900 rounded-3xl shadow-neo-xl border-2 border-maroon-950 dark:border-cream-100 w-full ${maxWidthClasses[maxWidth]} overflow-hidden my-auto max-h-[92vh] flex flex-col`}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between px-4 sm:px-6 py-3.5 sm:py-4 border-b-2 border-maroon-950/15 dark:border-cream-100/20 bg-cream-50 dark:bg-maroon-950">
          <div className="pr-2">
            <h3 className="text-base sm:text-lg font-black text-maroon-950 dark:text-cream-100 font-serif">{title}</h3>
            {subtitle && <p className="text-[11px] sm:text-xs text-charcoal-muted dark:text-cream-300/80 font-medium mt-0.5">{subtitle}</p>}
          </div>
          <button
            onClick={onClose}
            className="p-1.5 sm:p-2 rounded-xl border-2 border-maroon-950/20 dark:border-cream-100/20 text-maroon-950 dark:text-cream-100 hover:border-maroon-950 hover:bg-cream-200 dark:hover:bg-maroon-800 transition shrink-0 shadow-xs active:translate-x-0"
            aria-label="Close modal"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-4 sm:p-6 overflow-y-auto flex-1 text-charcoal dark:text-cream-100">{children}</div>
      </div>
    </div>
  );
};
