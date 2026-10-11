'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Menu, X, Shield } from 'lucide-react';
import { ThemeToggle } from '@/components/theme/ThemeToggle';

export function PublicHeader() {
  const pathname = usePathname();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const navLinks = [
    { name: 'HOME', href: '/' },
    { name: 'OUR MENU', href: '/menu' },
    { name: 'WEDDING CAKES', href: '/wedding-cakes' },
    { name: 'BENTO CAKES', href: '/bento-cakes' },
    { name: 'CAKE PLATTERS', href: '/cake-platters' },
    { name: 'FEEDBACK', href: '/feedback' },
  ];

  return (
    <header className="sticky top-0 z-50 bg-cream-100/95 dark:bg-maroon-900/95 backdrop-blur-md border-b border-cream-300 dark:border-maroon-800 shadow-sm transition-all">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between">
        
        {/* Brand Logo & Name */}
        <Link href="/" className="flex items-center gap-3 group">
          <div className="w-12 h-12 rounded-full bg-cream-200 dark:bg-maroon-800 border border-cream-300 dark:border-maroon-700 p-1 flex items-center justify-center overflow-hidden shadow-sm group-hover:scale-105 transition-transform">
            <img src="/logo.png" alt="Bakelicious Logo" className="w-full h-full object-contain" />
          </div>
          <div>
            <span className="text-xl font-extrabold text-maroon-900 dark:text-cream-100 tracking-tight font-serif block">Bakelicious</span>
            <span className="text-[10px] uppercase font-bold text-maroon-700 dark:text-cream-300 tracking-widest block font-sans">Artisan Bakery • Kolkata</span>
          </div>
        </Link>

        {/* Desktop Navigation Links */}
        <nav className="hidden lg:flex items-center gap-6 xl:gap-8">
          {navLinks.map((link) => {
            const isActive = pathname === link.href;
            return (
              <Link
                key={link.name}
                href={link.href}
                className={`text-xs font-bold tracking-wider transition-colors relative py-1 ${
                  isActive ? 'text-maroon-900 dark:text-cream-100 font-extrabold' : 'text-charcoal-muted dark:text-cream-300/80 hover:text-maroon-700 dark:hover:text-cream-100'
                }`}
              >
                {link.name}
                {isActive && (
                  <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-maroon-700 dark:bg-cream-200 rounded-full animate-fade-in" />
                )}
              </Link>
            );
          })}
        </nav>

        {/* Far Right: Theme Toggle & Admin Login CTA */}
        <div className="hidden lg:flex items-center gap-3">
          <ThemeToggle />
          <Link
            href="/admin/login"
            className="px-3.5 py-2 bg-cream-200 dark:bg-maroon-800 hover:bg-cream-300 dark:hover:bg-maroon-700 border border-cream-400 dark:border-maroon-600 text-maroon-900 dark:text-cream-100 rounded-xl text-xs font-bold transition flex items-center gap-1.5 shadow-sm"
          >
            <Shield className="w-3.5 h-3.5 text-maroon-700 dark:text-cream-300" />
            <span>Admin Login</span>
          </Link>
        </div>

        {/* Mobile / Tablet Hamburger Button */}
        <button
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          className="lg:hidden p-2.5 rounded-xl text-maroon-900 dark:text-cream-100 hover:bg-cream-200 dark:hover:bg-maroon-800 focus:outline-none transition"
          aria-label="Toggle Navigation Menu"
        >
          {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
        </button>
      </div>

      {/* Mobile & Tablet Drawer Menu */}
      {mobileMenuOpen && (
        <div className="lg:hidden bg-cream-100 dark:bg-maroon-900 border-b border-cream-300 dark:border-maroon-800 px-4 pt-2 pb-6 space-y-3 shadow-lg animate-fadeIn">
          {navLinks.map((link) => {
            const isActive = pathname === link.href;
            return (
              <Link
                key={link.name}
                href={link.href}
                onClick={() => setMobileMenuOpen(false)}
                className={`block px-3.5 py-2.5 rounded-xl text-xs font-bold transition ${
                  isActive
                    ? 'bg-maroon-700 dark:bg-cream-100 text-cream-100 dark:text-maroon-900 font-extrabold shadow-sm'
                    : 'text-maroon-900 dark:text-cream-100 hover:bg-cream-200 dark:hover:bg-maroon-800'
                }`}
              >
                {link.name}
              </Link>
            );
          })}
          <div className="pt-3 border-t border-cream-300 dark:border-maroon-700 flex flex-col gap-2.5">
            <div className="flex items-center justify-between px-1">
              <span className="text-xs font-bold text-maroon-900 dark:text-cream-200">Theme</span>
              <ThemeToggle />
            </div>
            <Link
              href="/admin/login"
              onClick={() => setMobileMenuOpen(false)}
              className="w-full py-3 bg-maroon-700 hover:bg-maroon-800 text-cream-100 rounded-xl text-xs font-bold flex items-center justify-center gap-2 shadow-sm"
            >
              <Shield className="w-4 h-4" />
              <span>Admin Login</span>
            </Link>
          </div>
        </div>
      )}
    </header>
  );
}
