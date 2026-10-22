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
    { name: 'Cake Showcase', href: '/showcase' },
    { name: 'Custom Cakes', href: '/custom-cakes' },
    { name: 'About Us', href: '/about' },
    { name: 'Gallery', href: '/gallery' },
    { name: 'Contact', href: '/contact' },
  ];

  return (
    <>
      <header
        className={`fixed top-0 left-0 right-0 z-50 w-full bg-cream-100/95 dark:bg-maroon-950/95 backdrop-blur-md border-b-2 border-maroon-950/20 dark:border-maroon-800 transition-all duration-300 ease-out ${
          isScrolled ? 'py-2 sm:py-2.5 shadow-md' : 'py-2.5 sm:py-3.5 lg:py-4 shadow-sm'
        }`}
      >
        <div className="w-full max-w-[1600px] mx-auto px-3 sm:px-6 lg:px-12 flex items-center justify-between gap-2">
          
          {/* Brand Logo & Editorial Wordmark: Fluid scaling across all screens */}
          <Link
            href="/"
            className="flex items-center gap-2 sm:gap-3.5 group select-none relative z-20 shrink-0 min-w-0"
            aria-label="Bakelicious Home"
          >
            <div
              className={`rounded-full border-2 sm:border-3 border-maroon-950 dark:border-cream-100 bg-cream-50 dark:bg-maroon-900 flex items-center justify-center overflow-hidden transition-all duration-300 group-hover:scale-105 shrink-0 ${
                isScrolled
                  ? 'w-10 h-10 sm:w-12 sm:h-12 lg:w-14 lg:h-14 p-1 shadow-neo-sm'
                  : 'w-12 h-12 sm:w-16 sm:h-16 lg:w-20 lg:h-20 p-1 sm:p-1.5 shadow-neo-sm sm:shadow-neo'
              }`}
            >
              <img
                src="/logo.svg"
                alt="Bakelicious Logo"
                className="w-full h-full object-contain"
              />
            </div>

            <div className="flex flex-col min-w-0">
              <span
                className={`font-serif font-black tracking-tight text-maroon-950 dark:text-cream-100 uppercase transition-all duration-300 truncate ${
                  isScrolled ? 'text-base sm:text-xl lg:text-2xl' : 'text-lg sm:text-2xl lg:text-3xl'
                }`}
              >
                Bakelicious
              </span>
              <span
                className={`tracking-[0.18em] sm:tracking-[0.22em] uppercase font-bold text-maroon-700 dark:text-cream-300 font-sans transition-all duration-300 truncate ${
                  isScrolled ? 'text-[7px] sm:text-[9px] -mt-0.5' : 'text-[8px] sm:text-[10px] mt-0'
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
                    className={`px-3 py-1.5 text-xs tracking-wider transition-all duration-150 font-serif whitespace-nowrap ${
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
          <div className="hidden lg:flex items-center gap-2.5 xl:gap-3 shrink-0">
            <ThemeToggle />

            <Link
              href="/custom-cakes"
              className="px-3.5 xl:px-4 py-2 bg-maroon-700 hover:bg-maroon-800 text-cream-100 text-xs font-bold uppercase tracking-wider rounded-xl border-2 border-maroon-950 dark:border-cream-200 shadow-neo-sm hover:shadow-neo hover:-translate-x-0.5 hover:-translate-y-0.5 active:translate-x-0 active:translate-y-0 transition-all flex items-center gap-1.5 whitespace-nowrap"
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

          {/* Mobile / Tablet Actions */}
          <div className="lg:hidden flex items-center gap-1.5 sm:gap-2 shrink-0">
            <Link
              href="/custom-cakes"
              className="px-2.5 py-1.5 bg-maroon-700 text-cream-100 text-[10px] sm:text-xs font-bold uppercase tracking-wider rounded-lg border-2 border-maroon-950 shadow-neo-sm flex items-center gap-1 sm:hidden"
            >
              <Sparkles className="w-3 h-3 text-amber-300" />
              <span>Order</span>
            </Link>
            <ThemeToggle />
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 rounded-xl border-2 border-maroon-950 dark:border-cream-100 bg-cream-200 dark:bg-maroon-900 text-maroon-950 dark:text-cream-100 shadow-neo-sm hover:shadow-neo transition active:scale-95"
              aria-label="Toggle Navigation Menu"
            >
              {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>

        {/* Mobile Drawer Menu (Neo-Brutalist with Backdrop) */}
        {mobileMenuOpen && (
          <div className="lg:hidden border-t-2 border-maroon-950 dark:border-maroon-800 bg-cream-100 dark:bg-maroon-950 px-4 pt-3 pb-6 space-y-2 shadow-2xl animate-fadeIn max-h-[85vh] overflow-y-auto">
            {navLinks.map((link) => {
              const isActive = pathname === link.href;
              return (
                <Link
                  key={link.name}
                  href={link.href}
                  onClick={() => setMobileMenuOpen(false)}
                  className={`block px-4 py-3 rounded-xl text-xs sm:text-sm font-bold font-serif transition border-2 min-h-[44px] flex items-center ${
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
                className="w-full py-3 bg-maroon-700 hover:bg-maroon-800 text-cream-100 rounded-xl text-xs sm:text-sm font-bold uppercase tracking-wider text-center border-2 border-maroon-950 shadow-neo-sm flex items-center justify-center gap-2 min-h-[44px]"
              >
                <Sparkles className="w-4 h-4 text-amber-300" />
                <span>Order Custom Cake</span>
              </Link>

              <Link
                href="/admin/login"
                onClick={() => setMobileMenuOpen(false)}
                className="w-full py-2.5 bg-cream-200 dark:bg-maroon-900 text-maroon-950 dark:text-cream-100 rounded-xl text-xs sm:text-sm font-bold text-center border-2 border-maroon-950/40 flex items-center justify-center gap-2 min-h-[44px]"
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
          isScrolled ? 'h-16 sm:h-20' : 'h-20 sm:h-24 lg:h-28'
        }`}
        aria-hidden="true"
      />
    </>
  );
}
