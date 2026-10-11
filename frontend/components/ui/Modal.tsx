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
        className={`bg-cream-100 dark:bg-maroon-900 rounded-3xl shadow-2xl border border-cream-300 dark:border-maroon-800 w-full ${maxWidthClasses[maxWidth]} overflow-hidden my-auto max-h-[92vh] flex flex-col`}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between px-4 sm:px-6 py-3.5 sm:py-4 border-b border-cream-300 dark:border-maroon-800 bg-cream-200 dark:bg-maroon-800/80">
          <div className="pr-2">
            <h3 className="text-base sm:text-lg font-bold text-maroon-950 dark:text-cream-100 font-serif">{title}</h3>
            {subtitle && <p className="text-[11px] sm:text-xs text-charcoal-muted dark:text-cream-300/80 font-medium mt-0.5">{subtitle}</p>}
          </div>
          <button
            onClick={onClose}
            className="p-1.5 sm:p-2 rounded-xl text-charcoal-muted dark:text-cream-300 hover:text-maroon-900 dark:hover:text-cream-100 hover:bg-cream-300 dark:hover:bg-maroon-700 transition shrink-0"
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
