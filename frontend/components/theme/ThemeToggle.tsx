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
      className={`px-3 py-1.5 rounded-xl border-2 transition-all flex items-center gap-1.5 text-xs font-bold ${
        theme === 'dark'
          ? 'bg-maroon-700 text-cream-100 border-cream-100 hover:bg-maroon-950 shadow-neo-sm'
          : 'bg-cream-100 text-maroon-950 border-maroon-950 hover:bg-maroon-700 hover:text-cream-100 shadow-neo-sm'
      } ${className}`}
      title={`Switch to ${theme === 'light' ? 'Dark' : 'Light'} Theme`}
      aria-label="Toggle Theme"
    >
      {theme === 'dark' ? (
        <>
          <Sun className="w-4 h-4 text-cream-100" />
          <span className="hidden sm:inline">Light Mode</span>
        </>
      ) : (
        <>
          <Moon className="w-4 h-4 text-maroon-950 group-hover:text-cream-100" />
          <span className="hidden sm:inline">Dark Mode</span>
        </>
      )}
    </button>
  );
}
