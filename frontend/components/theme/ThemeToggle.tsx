'use client';

import React from 'react';
import { useTheme } from './ThemeContext';
import { Sun, Moon } from 'lucide-react';

export function ThemeToggle({ className = '' }: { className?: string }) {
  const { theme, toggleTheme } = useTheme();

  return (
    <button
      onClick={toggleTheme}
      type="button"
      className={`p-2 rounded-xl border transition-all flex items-center gap-1.5 text-xs font-bold ${
        theme === 'dark'
          ? 'bg-maroon-800 text-cream-100 border-maroon-600 hover:bg-maroon-700'
          : 'bg-cream-100 text-maroon-900 border-cream-300 hover:bg-cream-200 shadow-sm'
      } ${className}`}
      title={`Switch to ${theme === 'light' ? 'Dark' : 'Light'} Theme`}
      aria-label="Toggle Theme"
    >
      {theme === 'dark' ? (
        <>
          <Sun className="w-4 h-4 text-amber-300" />
          <span className="hidden sm:inline">Light Mode</span>
        </>
      ) : (
        <>
          <Moon className="w-4 h-4 text-maroon-700" />
          <span className="hidden sm:inline">Dark Mode</span>
        </>
      )}
    </button>
  );
}
