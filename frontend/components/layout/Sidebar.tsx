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
  FileSpreadsheet,
  LogOut,
  X,
  ExternalLink,
  ChevronDown,
  ChevronRight,
  Calculator,
  Receipt,
  AlertTriangle
} from 'lucide-react';
import { logout, getStoredUser, hasPermission, hasAnyPermission, isSuperAdmin, isBaker } from '@/lib/auth';
import { User } from '@/types';
import { ThemeToggle } from '@/components/theme/ThemeToggle';
import { api } from '@/lib/api';

interface SidebarProps {
  isOpen?: boolean;
  onClose?: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ isOpen = false, onClose }) => {
  const pathname = usePathname();
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [businessReportsOpen, setBusinessReportsOpen] = useState(true);
  const [ordersMenuOpen, setOrdersMenuOpen] = useState(true);
  const [lowStockCount, setLowStockCount] = useState<number>(0);

  useEffect(() => {
    setCurrentUser(getStoredUser());
    checkLowStock();
  }, []);

  const checkLowStock = async () => {
    try {
      const res = await api.get('/ingredients');
      if (Array.isArray(res.data)) {
        const count = res.data.filter((i: any) => Number(i.quantity || 0) <= Number(i.min_stock || 0)).length;
        setLowStockCount(count);
      }
    } catch {
      // Ignore if unauthorized or not logged in yet
    }
  };

  // Workspace Nav: Exactly the 7 items requested
  const workspaceNav = [
    {
      name: 'Dashboard',
      href: '/admin/dashboard',
      icon: LayoutDashboard,
      visible: !isBaker() && (isSuperAdmin() || hasAnyPermission(['ANALYTICS_VIEW', 'REVENUE_VIEW', 'ORDERS_VIEW', 'DASHBOARD_VIEW'])),
      badge: null
    },
    {
      name: 'Orders & Client info',
      href: '/admin/orders',
      icon: ShoppingBag,
      visible: isSuperAdmin() || hasAnyPermission(['ORDERS_VIEW', 'CLIENTS_VIEW', 'ORDERS_CREATE']),
      badge: null,
      subItems: [
        { name: 'All Orders', href: '/admin/orders' },
        { name: 'All Client Details', href: '/admin/clients' }
      ]
    },
    {
      name: 'Production Queue',
      href: '/admin/production',
      icon: ChefHat,
      visible: isSuperAdmin() || hasAnyPermission(['PRODUCTION_VIEW_ALL', 'PRODUCTION_VIEW_OWN', 'PRODUCTION_STATUS_UPDATE', 'PRODUCTION_ASSIGN']),
      badge: null
    },
    {
      name: 'Products & Menu',
      href: '/admin/products',
      icon: UtensilsCrossed,
      visible: isSuperAdmin() || hasAnyPermission(['PRODUCTS_VIEW', 'CATEGORIES_VIEW', 'RECIPES_VIEW', 'PRODUCTS_CREATE']),
      badge: null
    },
    {
      name: 'Calendar',
      href: '/admin/calendar',
      icon: CalendarIcon,
      visible: isSuperAdmin() || hasPermission('CALENDAR_VIEW'),
      badge: null
    },
    {
      name: 'Employees',
      href: '/admin/employees',
      icon: Users,
      visible: isSuperAdmin() || hasAnyPermission(['USER_MANAGEMENT_VIEW', 'USER_MANAGEMENT_CREATE', 'ROLE_MANAGEMENT']),
      badge: null
    },
    {
      name: 'Inventory',
      href: '/admin/inventory',
      icon: Boxes,
      visible: isSuperAdmin() || hasPermission('INVENTORY_VIEW'),
      badge: lowStockCount > 0 ? `${lowStockCount} Low` : null
    },
  ].filter(item => item.visible);

  // Business & Reports Nav (Collapsible): Exactly the 4 items requested
  const businessReportsNav = [
    {
      name: 'Analytics',
      href: '/admin/analytics',
      icon: LineChart,
      visible: isSuperAdmin() || hasAnyPermission(['ANALYTICS_VIEW', 'REVENUE_VIEW'])
    },
    {
      name: 'Costing',
      href: '/admin/costing',
      icon: Calculator,
      visible: isSuperAdmin() || hasPermission('COSTING_VIEW')
    },
    {
      name: 'Expenses',
      href: '/admin/expenses',
      icon: Receipt,
      visible: isSuperAdmin() || hasPermission('EXPENSES_VIEW')
    },
    {
      name: 'Financial Reports',
      href: '/admin/reports',
      icon: FileSpreadsheet,
      visible: isSuperAdmin() || hasPermission('FINANCIAL_REPORTS_VIEW')
    },
  ].filter(item => item.visible);

  const isActive = (path: string) => {
    if (path === '/admin/dashboard') return pathname === '/admin/dashboard';
    if (path === '/admin/orders') {
      return pathname === '/admin/orders' || pathname.startsWith('/admin/orders/') || pathname === '/admin/clients' || pathname.startsWith('/admin/clients/');
    }
    if (path === '/admin/employees') {
      return pathname === '/admin/employees' || pathname.startsWith('/admin/employees/') || pathname === '/admin/users' || pathname === '/admin/roles';
    }
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
            <Link href="/admin/dashboard" className="flex items-center gap-3" onClick={onClose}>
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
                  Bakery Admin
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
            {/* ================= SECTION 1: PUBLIC WEBSITE ================= */}
            <div>
              <div className="px-3 mb-2 text-[10px] font-bold text-cream-300/70 uppercase tracking-widest">
                Public Website
              </div>
              <Link
                href="/"
                target="_blank"
                rel="noopener noreferrer"
                onClick={onClose}
                className="flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-bold text-cream-100 hover:text-white bg-maroon-800/60 hover:bg-maroon-600/70 border border-maroon-600/40 shadow-sm transition group"
              >
                <div className="flex items-center gap-2.5">
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
                  <span>Public Website</span>
                </div>
                <ExternalLink className="w-3.5 h-3.5 text-cream-300 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
              </Link>
            </div>

            {/* ================= SECTION 2: WORKSPACE ================= */}
            {workspaceNav.length > 0 && (
              <div>
                <div className="px-3 mb-2 text-[10px] font-bold text-cream-300/70 uppercase tracking-widest">
                  Workspace
                </div>
                <nav className="space-y-1">
                  {workspaceNav.map((item, index) => {
                    const Icon = item.icon;
                    const active = isActive(item.href);
                    return (
                      <div key={item.name} className="space-y-1">
                        {item.subItems ? (
                          <div
                            className={`flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-bold transition duration-200 ${
                              active
                                ? 'bg-cream-100 text-maroon-800 shadow-md shadow-maroon-900/40 font-extrabold'
                                : 'text-cream-200 hover:bg-maroon-600/50 hover:text-white'
                            }`}
                          >
                            <Link
                              href={item.href}
                              onClick={(e) => {
                                if (active) {
                                  // Clicking active item toggles collapse
                                  setOrdersMenuOpen(!ordersMenuOpen);
                                } else {
                                  setOrdersMenuOpen(true);
                                }
                                onClose?.();
                              }}
                              className="flex-1 flex items-center gap-3 cursor-pointer select-none"
                            >
                              <span className="text-[10px] opacity-60 w-3 font-mono">{index + 1}.</span>
                              <Icon
                                className={`w-4 h-4 transition ${
                                  active ? 'text-maroon-700' : 'text-cream-300/80'
                                }`}
                              />
                              <span>{item.name}</span>
                            </Link>

                            <button
                              type="button"
                              onClick={(e) => {
                                e.preventDefault();
                                e.stopPropagation();
                                setOrdersMenuOpen(!ordersMenuOpen);
                              }}
                              className={`p-1 rounded-md transition ${
                                active
                                  ? 'text-maroon-800 hover:bg-maroon-200/60'
                                  : 'text-cream-300 hover:text-white hover:bg-maroon-600/60'
                              }`}
                              title={ordersMenuOpen ? 'Collapse sub-menu' : 'Expand sub-menu'}
                              aria-label="Toggle Orders & Client info sub-menu"
                            >
                              {ordersMenuOpen ? (
                                <ChevronDown className="w-4 h-4 transition-transform duration-200" />
                              ) : (
                                <ChevronRight className="w-4 h-4 transition-transform duration-200" />
                              )}
                            </button>
                          </div>
                        ) : (
                          <Link
                            href={item.href}
                            onClick={onClose}
                            className={`flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-bold transition duration-200 ${
                              active
                                ? 'bg-cream-100 text-maroon-800 shadow-md shadow-maroon-900/40 font-extrabold'
                                : 'text-cream-200 hover:bg-maroon-600/50 hover:text-white'
                            }`}
                          >
                            <div className="flex items-center gap-3">
                              <span className="text-[10px] opacity-60 w-3 font-mono">{index + 1}.</span>
                              <Icon
                                className={`w-4 h-4 transition ${
                                  active ? 'text-maroon-700' : 'text-cream-300/80'
                                }`}
                              />
                              <span>{item.name}</span>
                            </div>
                            {item.badge && (
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[9px] font-extrabold bg-rose-500 text-white shadow-xs animate-pulse">
                                <AlertTriangle className="w-2.5 h-2.5" />
                                {item.badge}
                              </span>
                            )}
                          </Link>
                        )}

                        {item.subItems && ordersMenuOpen && (
                          <div className="pl-6 pr-1 py-0.5 space-y-1 transition-all duration-200">
                            {item.subItems.map((sub) => {
                              const isSubActive = pathname === sub.href;
                              return (
                                <Link
                                  key={sub.name}
                                  href={sub.href}
                                  onClick={onClose}
                                  className={`flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs transition ${
                                    isSubActive
                                      ? 'bg-maroon-900/80 text-cream-100 font-extrabold border border-maroon-500/60 shadow-xs'
                                      : 'text-cream-300/80 hover:bg-maroon-600/40 hover:text-white font-medium'
                                  }`}
                                >
                                  <span className={`w-1.5 h-1.5 rounded-full ${isSubActive ? 'bg-amber-400' : 'bg-cream-300/40'}`}></span>
                                  <span>{sub.name}</span>
                                </Link>
                              );
                            })}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </nav>
              </div>
            )}

            {/* ================= SECTION 3: BUSINESS & REPORTS (COLLAPSIBLE) ================= */}
            {businessReportsNav.length > 0 && (
              <div>
                <button
                  type="button"
                  onClick={() => setBusinessReportsOpen(!businessReportsOpen)}
                  className="w-full flex items-center justify-between px-3 py-1.5 text-[10px] font-bold text-cream-300/80 hover:text-white uppercase tracking-widest transition"
                >
                  <span>Business &amp; Reports</span>
                  {businessReportsOpen ? (
                    <ChevronDown className="w-3.5 h-3.5 text-cream-300" />
                  ) : (
                    <ChevronRight className="w-3.5 h-3.5 text-cream-300" />
                  )}
                </button>

                {businessReportsOpen && (
                  <nav className="mt-1 space-y-1 pl-1">
                    {businessReportsNav.map((item) => {
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
                )}
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
