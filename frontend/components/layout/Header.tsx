'use client';

import React, { useEffect, useState } from 'react';
import { Menu, Plus, User, ShieldCheck } from 'lucide-react';
import Link from 'next/link';
import { getStoredUser, isSuperAdmin, hasPermission } from '@/lib/auth';
import { User as UserType } from '@/types';

interface HeaderProps {
  onToggleSidebar?: () => void;
  onOpenSidebar?: () => void;
  title?: string;
}

export const Header: React.FC<HeaderProps> = ({ onToggleSidebar, onOpenSidebar, title = 'Dashboard' }) => {
  const handleSidebar = onOpenSidebar || onToggleSidebar || (() => {});
  const [currentUser, setCurrentUser] = useState<UserType | null>(null);

  useEffect(() => {
    setCurrentUser(getStoredUser());
  }, []);

  const roleName = currentUser?.is_superadmin
    ? 'Super Admin'
    : currentUser?.primary_role || currentUser?.role || 'Staff';

  return (
    <header className="sticky top-0 z-30 bg-cream-100/90 dark:bg-maroon-900/90 backdrop-blur-md border-b border-cream-300 dark:border-maroon-800 px-4 lg:px-8 py-3.5 flex items-center justify-between shadow-xs transition-colors">
      <div className="flex items-center gap-3 sm:gap-4 min-w-0">
        <button
          onClick={handleSidebar}
          className="p-2 rounded-xl text-maroon-800 dark:text-cream-100 hover:bg-cream-200 dark:hover:bg-maroon-800 lg:hidden transition shrink-0"
          aria-label="Open sidebar"
        >
          <Menu className="w-6 h-6" />
        </button>
        <div className="min-w-0">
          <h2 className="text-base sm:text-lg font-bold text-maroon-900 dark:text-cream-100 tracking-tight font-serif truncate">
            {title}
          </h2>
        </div>
      </div>

      <div className="flex items-center gap-2 sm:gap-3 shrink-0">
        {currentUser && (
          <Link
            href="/admin/profile"
            className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-cream-200/80 dark:bg-maroon-800/60 border border-cream-300 dark:border-maroon-700/60 hover:bg-cream-300/80 dark:hover:bg-maroon-700/60 transition"
          >
            <div className="w-6 h-6 rounded-full bg-maroon-700 dark:bg-cream-100 text-cream-100 dark:text-maroon-900 flex items-center justify-center text-[10px] font-black">
              {currentUser.full_name?.charAt(0) || currentUser.username?.charAt(0) || 'U'}
            </div>
            <div className="hidden sm:block text-left">
              <span className="block text-[11px] font-bold text-maroon-900 dark:text-cream-100 leading-tight">
                {currentUser.full_name || currentUser.username}
              </span>
              <span className="block text-[9px] font-semibold text-charcoal-muted dark:text-cream-300/70 leading-none">
                {roleName}
              </span>
            </div>
          </Link>
        )}

        {hasPermission('ORDERS_CREATE') && (
          <Link
            href="/admin/orders"
            className="hidden md:inline-flex items-center gap-1.5 px-3.5 py-2 bg-maroon-700 hover:bg-maroon-800 text-cream-100 rounded-xl text-xs font-bold shadow-sm transition duration-200"
          >
            <Plus className="w-4 h-4" />
            <span>New Order</span>
          </Link>
        )}
      </div>
    </header>
  );
};
