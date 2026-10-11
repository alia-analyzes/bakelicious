'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard,
  UtensilsCrossed,
  ShoppingBag,
  LineChart,
  Users,
  Calendar as CalendarIcon,
  ChefHat,
  Boxes,
  Settings as SettingsIcon,
  FileSpreadsheet,
  LogOut,
  X,
  Home,
  MessageSquare,
  ShieldCheck,
  UserCheck,
  FolderCog
} from 'lucide-react';
import { logout, getStoredUser, hasPermission, hasAnyPermission, isSuperAdmin, isBaker } from '@/lib/auth';
import { User } from '@/types';
import { ThemeToggle } from '@/components/theme/ThemeToggle';

interface SidebarProps {
  isOpen?: boolean;
  onClose?: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ isOpen = false, onClose }) => {
  const pathname = usePathname();
  const [currentUser, setCurrentUser] = useState<User | null>(null);

  useEffect(() => {
    setCurrentUser(getStoredUser());
  }, []);

  const primaryNavAll = [
    {
      name: 'Dashboard',
      href: '/admin/dashboard',
      icon: LayoutDashboard,
      visible: !isBaker() && (isSuperAdmin() || hasAnyPermission(['ANALYTICS_VIEW', 'REVENUE_VIEW', 'ORDERS_VIEW']))
    },
    {
      name: 'Production Queue',
      href: '/admin/production',
      icon: ChefHat,
      visible: hasAnyPermission(['PRODUCTION_VIEW_ALL', 'PRODUCTION_VIEW_OWN', 'PRODUCTION_STATUS_UPDATE'])
    },
    {
      name: 'Products / Menu',
      href: '/admin/products',
      icon: UtensilsCrossed,
      visible: hasPermission('PRODUCTS_VIEW')
    },
    {
      name: 'Categories',
      href: '/admin/categories',
      icon: Boxes,
      visible: hasPermission('CATEGORIES_VIEW')
    },
    {
      name: 'Orders',
      href: '/admin/orders',
      icon: ShoppingBag,
      visible: hasPermission('ORDERS_VIEW')
    },
    {
      name: 'Analytics',
      href: '/admin/analytics',
      icon: LineChart,
      visible: hasPermission('ANALYTICS_VIEW') || hasPermission('REVENUE_VIEW')
    },
  ];

  const supportingNavAll = [
    {
      name: 'Clients',
      href: '/admin/clients',
      icon: Users,
      visible: hasPermission('CLIENTS_VIEW')
    },
    {
      name: 'Calendar',
      href: '/admin/calendar',
      icon: CalendarIcon,
      visible: hasPermission('CALENDAR_VIEW')
    },
    {
      name: 'Inventory',
      href: '/admin/inventory',
      icon: Boxes,
      visible: hasPermission('INVENTORY_VIEW')
    },
    {
      name: 'Recipes',
      href: '/admin/recipes',
      icon: UtensilsCrossed,
      visible: hasPermission('RECIPES_VIEW')
    },
    {
      name: 'Costing',
      href: '/admin/costing',
      icon: LineChart,
      visible: hasPermission('COSTING_VIEW')
    },
    {
      name: 'Expenses',
      href: '/admin/expenses',
      icon: FileSpreadsheet,
      visible: hasPermission('EXPENSES_VIEW')
    },
    {
      name: 'Financial Reports',
      href: '/admin/reports',
      icon: FileSpreadsheet,
      visible: hasPermission('FINANCIAL_REPORTS_VIEW')
    },
    {
      name: 'Feedback CMS',
      href: '/admin/feedback',
      icon: MessageSquare,
      visible: hasPermission('FEEDBACK_VIEW')
    },
    {
      name: 'Media Library',
      href: '/admin/media',
      icon: Boxes,
      visible: hasPermission('MEDIA_VIEW')
    },
    {
      name: 'User Management',
      href: '/admin/users',
      icon: UserCheck,
      visible: hasAnyPermission(['USER_MANAGEMENT_VIEW', 'USER_MANAGEMENT_CREATE'])
    },
    {
      name: 'Role Permissions',
      href: '/admin/roles',
      icon: ShieldCheck,
      visible: hasPermission('ROLE_MANAGEMENT') || isSuperAdmin()
    },
    {
      name: 'Audit Logs',
      href: '/admin/audit-logs',
      icon: FileSpreadsheet,
      visible: hasPermission('AUDIT_LOGS_VIEW')
    },
    {
      name: 'Settings',
      href: '/admin/settings',
      icon: SettingsIcon,
      visible: hasPermission('SETTINGS_VIEW') || isSuperAdmin()
    },
  ];

  const primaryNav = primaryNavAll.filter(item => item.visible);
  const supportingNav = supportingNavAll.filter(item => item.visible);

  const isActive = (path: string) => {
    if (path === '/admin/dashboard') return pathname === '/admin/dashboard';
    return pathname === path || pathname.startsWith(path + '/');
  };

  const userRoleDisplay = currentUser?.is_superadmin
    ? 'Super Admin (Owner)'
    : currentUser?.primary_role || currentUser?.role || 'Staff';

  return (
    <>
      {/* Mobile Backdrop */}
      {isOpen && (
        <div
          className="fixed inset-0 z-40 bg-maroon-900/60 backdrop-blur-sm lg:hidden"
          onClick={onClose}
        />
      )}

      <aside
        className={`fixed top-0 left-0 z-40 h-screen w-64 bg-maroon-700 border-r border-maroon-800/60 shadow-xl flex flex-col justify-between transition-transform duration-300 ease-in-out lg:translate-x-0 ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="flex flex-col h-full overflow-y-auto scrollbar-none">
          {/* Header & Logo */}
          <div className="flex items-center justify-between px-6 py-5 border-b border-maroon-600/40 bg-maroon-800/80">
            <Link href="/" className="flex items-center gap-3" onClick={onClose}>
              <div className="relative w-10 h-10 rounded-full bg-cream-100 p-0.5 shadow-md flex items-center justify-center">
                <img
                  src="/logo.png"
                  alt="Bakelicious Logo"
                  className="w-full h-full object-contain rounded-full"
                  onError={(e) => {
                    (e.target as HTMLElement).style.display = 'none';
                  }}
                />
              </div>
              <div>
                <h1 className="text-xl font-extrabold text-cream-100 tracking-tight leading-none font-serif flex items-center gap-1">
                  Bakelicious
                </h1>
                <span className="text-[10px] text-cream-300/80 font-bold tracking-widest uppercase">
                  Bakery ERP
                </span>
              </div>
            </Link>
            {onClose && (
              <button
                onClick={onClose}
                className="p-1 rounded-lg text-cream-300 hover:text-white lg:hidden"
              >
                <X className="w-5 h-5" />
              </button>
            )}
          </div>

          {/* Navigation Links */}
          <div className="px-4 py-5 space-y-6 flex-1">
            {/* Link back to public site */}
            <div className="px-1 mb-2">
              <Link
                href="/"
                onClick={onClose}
                className="flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-bold text-cream-200 hover:bg-maroon-600/60 transition bg-maroon-800/40 border border-maroon-600/30"
              >
                <Home className="w-4 h-4 text-cream-300" />
                <span>Public Website</span>
              </Link>
            </div>

            {/* Core Operations Nav */}
            {primaryNav.length > 0 && (
              <div>
                <div className="px-3 mb-2 text-[10px] font-bold text-cream-300/70 uppercase tracking-widest">
                  Core Operations
                </div>
                <nav className="space-y-1">
                  {primaryNav.map((item) => {
                    const Icon = item.icon;
                    const active = isActive(item.href);
                    return (
                      <Link
                        key={item.name}
                        href={item.href}
                        onClick={onClose}
                        className={`flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-bold transition duration-200 ${
                          active
                            ? 'bg-cream-100 text-maroon-800 shadow-md shadow-maroon-900/40 font-extrabold'
                            : 'text-cream-200 hover:bg-maroon-600/50 hover:text-white'
                        }`}
                      >
                        <Icon
                          className={`w-4 h-4 transition ${
                            active ? 'text-maroon-700' : 'text-cream-300/80'
                          }`}
                        />
                        <span>{item.name}</span>
                      </Link>
                    );
                  })}
                </nav>
              </div>
            )}

            {/* Management Supporting Nav */}
            {supportingNav.length > 0 && (
              <div>
                <div className="px-3 mb-2 text-[10px] font-bold text-cream-300/70 uppercase tracking-widest">
                  Management Tools
                </div>
                <nav className="space-y-1">
                  {supportingNav.map((item) => {
                    const Icon = item.icon;
                    const active = isActive(item.href);
                    return (
                      <Link
                        key={item.name}
                        href={item.href}
                        onClick={onClose}
                        className={`flex items-center gap-3 px-3.5 py-2 rounded-xl text-xs font-semibold transition duration-200 ${
                          active
                            ? 'bg-cream-100 text-maroon-800 shadow-sm font-extrabold'
                            : 'text-cream-200/90 hover:bg-maroon-600/40 hover:text-white'
                        }`}
                      >
                        <Icon
                          className={`w-4 h-4 transition ${
                            active ? 'text-maroon-700' : 'text-cream-300/70'
                          }`}
                        />
                        <span>{item.name}</span>
                      </Link>
                    );
                  })}
                </nav>
              </div>
            )}
          </div>

          {/* Footer Profile & Role Info */}
          <div className="p-4 border-t border-maroon-600/40 bg-maroon-800/90 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold text-cream-300">Theme</span>
              <ThemeToggle />
            </div>
            <div className="flex items-center justify-between pt-1 border-t border-maroon-700/50">
              <Link href="/admin/profile" className="flex items-center gap-2.5 group overflow-hidden">
                <div className="w-8 h-8 rounded-full bg-cream-100 text-maroon-800 flex items-center justify-center font-black text-xs shadow-sm shrink-0">
                  {currentUser?.full_name?.charAt(0) || currentUser?.username?.charAt(0) || 'B'}
                </div>
                <div className="min-w-0">
                  <p className="text-xs font-bold text-cream-100 group-hover:underline truncate">
                    {currentUser?.full_name || currentUser?.username || 'Bakery Staff'}
                  </p>
                  <span className="inline-block px-1.5 py-0.2 text-[9px] font-bold rounded-md bg-maroon-900/80 text-cream-300 border border-maroon-600/60 truncate max-w-[120px]">
                    {userRoleDisplay}
                  </span>
                </div>
              </Link>
              <button
                onClick={logout}
                title="Sign Out"
                className="p-2 rounded-xl text-cream-300 hover:text-white hover:bg-maroon-600/60 transition shrink-0"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      </aside>
    </>
  );
};
