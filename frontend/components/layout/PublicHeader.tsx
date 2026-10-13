'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Menu, X, ShoppingBag, Shield, Sparkles } from 'lucide-react';
import { ThemeToggle } from '@/components/theme/ThemeToggle';

export function PublicHeader() {
  const pathname = usePathname();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 25);
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    handleScroll();
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Public navigation matching exact requirements
  const navLinks = [
    { name: 'Home', href: '/' },
    { name: 'Custom Cakes', href: '/custom-cakes' },
    { name: 'About Us', href: '/about' },
    { name: 'Gallery', href: '/gallery' },
    { name: 'Contact', href: '/contact' },
  ];

  return (
    <>
      <header
        className={`fixed top-0 left-0 right-0 z-50 w-full bg-cream-100/95 dark:bg-maroon-950/95 backdrop-blur-md border-b-2 border-maroon-950/20 dark:border-maroon-800 transition-all duration-500 ease-[cubic-bezier(0.16,1,0.3,1)] ${
          isScrolled ? 'py-2 sm:py-2.5 shadow-md' : 'py-3.5 sm:py-4.5 lg:py-5 shadow-sm'
        }`}
      >
        <div className="w-full max-w-[1600px] mx-auto px-4 sm:px-8 lg:px-12 flex items-center justify-between">
          
          {/* Brand Logo & Editorial Wordmark: BIG at top, remains clearly visible and prominent when scrolling down */}
          <Link
            href="/"
            className="flex items-center gap-3 sm:gap-4 group select-none relative z-20 shrink-0"
            aria-label="Bakelicious Home"
          >
          <div
            className={`rounded-full border-2 sm:border-3 border-maroon-950 dark:border-cream-100 bg-cream-50 dark:bg-maroon-900 flex items-center justify-center overflow-hidden transition-all duration-500 ease-[cubic-bezier(0.16,1,0.3,1)] group-hover:scale-105 group-hover:rotate-2 shrink-0 ${
              isScrolled
                ? 'w-13 h-13 sm:w-15 sm:h-15 lg:w-16 lg:h-16 p-1 shadow-neo-sm translate-y-0'
                : 'w-22 h-22 sm:w-26 sm:h-26 lg:w-30 lg:h-30 xl:w-32 xl:h-32 p-1.5 sm:p-2 shadow-neo-md sm:shadow-neo-lg translate-y-1 sm:translate-y-3 lg:translate-y-4'
            }`}
          >
            <img
              src="/logo.png"
              alt="Bakelicious Artisan Bakery Logo"
              className="w-full h-full object-contain transition-transform duration-500"
            />
          </div>

          <div className="flex flex-col transition-all duration-500 ease-[cubic-bezier(0.16,1,0.3,1)]">
            <span
              className={`font-serif font-black tracking-tight text-maroon-950 dark:text-cream-100 uppercase transition-all duration-500 ease-[cubic-bezier(0.16,1,0.3,1)] ${
                isScrolled ? 'text-lg sm:text-xl lg:text-2xl' : 'text-xl sm:text-2xl lg:text-3xl'
              }`}
            >
              Bakelicious
            </span>
            <span
              className={`tracking-[0.22em] uppercase font-bold text-maroon-700 dark:text-cream-300 block font-sans transition-all duration-500 ${
                isScrolled ? 'text-[8px] sm:text-[9px] -mt-0.5' : 'text-[9px] sm:text-[11px] mt-0'
              }`}
            >
              Artisan Atelier • Estd 2023
            </span>
          </div>
        </Link>

        {/* Desktop Navigation Links with Editorial Separators */}
        <nav className="hidden lg:flex items-center gap-1 xl:gap-2">
          {navLinks.map((link, idx) => {
            const isActive = pathname === link.href;
            return (
              <React.Fragment key={link.name}>
                <Link
                  href={link.href}
                  className={`px-3.5 py-1.5 text-xs tracking-wider transition-all duration-150 font-serif ${
                    isActive
                      ? 'text-maroon-950 dark:text-cream-100 font-extrabold border-b-2 border-maroon-950 dark:border-cream-100 -mb-0.5'
                      : 'text-maroon-900/80 dark:text-cream-300/80 hover:text-maroon-950 dark:hover:text-cream-100 font-bold hover:-translate-y-0.5'
                  }`}
                >
                  {link.name}
                </Link>
                {idx < navLinks.length - 1 && (
                  <span className="text-maroon-900/30 dark:text-cream-400/30 text-xs select-none">
                    |
                  </span>
                )}
              </React.Fragment>
            );
          })}
        </nav>

        {/* Far Right: Neo-Brutalist Order CTA, Theme Toggle & Admin Shortcut */}
        <div className="hidden lg:flex items-center gap-3">
          <ThemeToggle />

          <Link
            href="/custom-cakes"
            className="px-4 py-2 bg-maroon-700 hover:bg-maroon-800 text-cream-100 text-xs font-bold uppercase tracking-wider rounded-xl border-2 border-maroon-950 dark:border-cream-200 shadow-neo-sm hover:shadow-neo hover:-translate-x-0.5 hover:-translate-y-0.5 active:translate-x-0 active:translate-y-0 transition-all flex items-center gap-1.5"
          >
            <Sparkles className="w-3.5 h-3.5 text-amber-300" />
            <span>Order Now</span>
          </Link>

          <Link
            href="/admin/login"
            className="p-2 bg-cream-200 dark:bg-maroon-900 hover:bg-cream-300 dark:hover:bg-maroon-800 border-2 border-maroon-950/40 dark:border-cream-200/40 text-maroon-950 dark:text-cream-100 rounded-xl transition shadow-xs"
            title="Admin Dashboard"
            aria-label="Admin Portal"
          >
            <Shield className="w-4 h-4" />
          </Link>
        </div>

        {/* Mobile / Tablet Hamburger Button */}
        <div className="lg:hidden flex items-center gap-2">
          <ThemeToggle />
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="p-2 rounded-xl border-2 border-maroon-950 dark:border-cream-100 bg-cream-200 dark:bg-maroon-900 text-maroon-950 dark:text-cream-100 shadow-neo-sm hover:shadow-neo transition active:translate-x-0 active:translate-y-0"
            aria-label="Toggle Navigation Menu"
          >
            {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {/* Mobile Drawer Menu (Neo-Brutalist) */}
      {mobileMenuOpen && (
        <div className="lg:hidden border-t-2 border-maroon-950 dark:border-maroon-800 bg-cream-100 dark:bg-maroon-950 px-4 pt-4 pb-6 space-y-2.5 shadow-xl animate-fadeIn mt-2">
          {navLinks.map((link) => {
            const isActive = pathname === link.href;
            return (
              <Link
                key={link.name}
                href={link.href}
                onClick={() => setMobileMenuOpen(false)}
                className={`block px-4 py-2.5 rounded-xl text-xs font-bold font-serif transition border-2 ${
                  isActive
                    ? 'bg-maroon-700 text-cream-100 border-maroon-950 shadow-neo-sm font-extrabold'
                    : 'bg-cream-200 dark:bg-maroon-900 text-maroon-950 dark:text-cream-100 border-maroon-950/20 dark:border-maroon-800 hover:border-maroon-950'
                }`}
              >
                {link.name}
              </Link>
            );
          })}

          <div className="pt-3 border-t-2 border-maroon-950/20 dark:border-maroon-800 flex flex-col gap-2">
            <Link
              href="/custom-cakes"
              onClick={() => setMobileMenuOpen(false)}
              className="w-full py-3 bg-maroon-700 hover:bg-maroon-800 text-cream-100 rounded-xl text-xs font-bold uppercase tracking-wider text-center border-2 border-maroon-950 shadow-neo-sm flex items-center justify-center gap-2"
            >
              <Sparkles className="w-4 h-4 text-amber-300" />
              <span>Order Custom Cake</span>
            </Link>

            <Link
              href="/admin/login"
              onClick={() => setMobileMenuOpen(false)}
              className="w-full py-2.5 bg-cream-200 dark:bg-maroon-900 text-maroon-950 dark:text-cream-100 rounded-xl text-xs font-bold text-center border-2 border-maroon-950/40 flex items-center justify-center gap-2"
            >
              <Shield className="w-3.5 h-3.5" />
              <span>Admin Portal</span>
            </Link>
          </div>
        </div>
      )}
      </header>

      {/* Dynamic spacer matching fixed header height so content is never covered */}
      <div
        className={`w-full transition-all duration-300 pointer-events-none select-none ${
          isScrolled ? 'h-18 sm:h-20 lg:h-22' : 'h-24 sm:h-28 lg:h-32'
        }`}
        aria-hidden="true"
      />
    </>
  );
}
