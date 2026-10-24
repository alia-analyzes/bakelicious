'use client';

import React, { useEffect, useState } from 'react';
import { Menu, Plus, User, ShieldCheck } from 'lucide-react';
import Link from 'next/link';
import { getStoredUser, isSuperAdmin, hasPermission } from '@/lib/auth';
import { User as UserType } from '@/types';

interface HeaderProps {
  onToggleSidebar?: () => void;
  onOpenSidebar?: () => void;
  onMenuClick?: () => void;
  title?: string;
}

export const Header: React.FC<HeaderProps> = ({ onToggleSidebar, onOpenSidebar, onMenuClick, title = 'Dashboard' }) => {
  const handleSidebar = onOpenSidebar || onToggleSidebar || onMenuClick || (() => {});
  const [currentUser, setCurrentUser] = useState<UserType | null>(null);

  useEffect(() => {
    setCurrentUser(getStoredUser());
  }, []);

  const roleName = currentUser?.is_superadmin
    ? 'Super Admin'
    : currentUser?.primary_role || currentUser?.role || 'Staff';

  return (
    <header className="sticky top-0 z-30 bg-cream-100/95 dark:bg-maroon-950/95 backdrop-blur-md border-b-2 border-maroon-950 dark:border-cream-100/20 px-4 lg:px-8 py-3.5 flex items-center justify-between shadow-neo-sm transition-colors">
      <div className="flex items-center gap-3 sm:gap-4 min-w-0">
        <button
          onClick={handleSidebar}
          className="p-2 rounded-xl border-2 border-maroon-950 dark:border-cream-100 bg-cream-50 dark:bg-maroon-900 text-maroon-950 dark:text-cream-100 shadow-neo-xs btn-tactile lg:hidden transition shrink-0"
          aria-label="Open sidebar"
        >
          <Menu className="w-5 h-5" />
        </button>
        <div className="min-w-0">
          <h2 className="text-base sm:text-xl font-black text-maroon-950 dark:text-cream-100 tracking-tight font-serif truncate">
            {title}
          </h2>
        </div>
      </div>

      <div className="flex items-center gap-2 sm:gap-3 shrink-0">
        {currentUser && (
          <Link
            href="/admin/profile"
            className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-cream-50 dark:bg-maroon-900 border-2 border-maroon-950 dark:border-cream-100/40 shadow-neo-xs hover:shadow-neo-sm btn-tactile transition"
          >
            <div className="w-6 h-6 rounded-lg border border-maroon-950 dark:border-cream-100 bg-maroon-700 text-cream-100 flex items-center justify-center text-[10px] font-black">
              {currentUser.full_name?.charAt(0) || currentUser.username?.charAt(0) || 'U'}
            </div>
            <div className="hidden sm:block text-left">
              <span className="block text-[11px] font-black text-maroon-950 dark:text-cream-100 leading-tight">
                {currentUser.full_name || currentUser.username}
              </span>
              <span className="block text-[9px] font-bold text-maroon-700 dark:text-cream-300 leading-none">
                {roleName}
              </span>
            </div>
          </Link>
        )}

        {hasPermission('ORDERS_CREATE') && (
          <Link
            href="/admin/orders"
            className="hidden md:inline-flex items-center gap-1.5 px-3.5 py-2 bg-maroon-700 hover:bg-maroon-800 text-cream-100 rounded-xl text-xs font-black uppercase tracking-wider border-2 border-maroon-950 dark:border-cream-100 shadow-neo-sm btn-tactile transition duration-200"
          >
            <Plus className="w-4 h-4" />
            <span>New Order</span>
          </Link>
        )}
      </div>
    </header>
  );
};
