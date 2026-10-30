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

  // Lock body scroll and listen for escape key when mobile drawer is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
      const handleKeyDown = (e: KeyboardEvent) => {
        if (e.key === 'Escape' && onClose) {
          onClose();
        }
      };
      window.addEventListener('keydown', handleKeyDown);
      return () => {
        document.body.style.overflow = '';
        window.removeEventListener('keydown', handleKeyDown);
      };
    } else {
      document.body.style.overflow = '';
    }
  }, [isOpen, onClose]);

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

  // Workspace Nav: Exactly the items requested
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
      name: 'Products & Recipes',
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
      name: 'Invoice Generator',
      href: '/admin/receipts',
      icon: Receipt,
      visible: isSuperAdmin() || hasAnyPermission(['ORDERS_VIEW', 'ORDERS_CREATE', 'CALENDAR_VIEW']) || true,
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

  // Business & Reports Nav (Collapsible)
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
          className="fixed inset-0 z-40 bg-maroon-900/60 backdrop-blur-sm lg:hidden transition-opacity"
          onClick={onClose}
          aria-hidden="true"
        />
      )}

      <aside
        className={`fixed top-0 left-0 z-40 h-[100dvh] h-screen w-64 max-w-[85vw] bg-cream-100 dark:bg-maroon-950 border-r-2 border-maroon-950 dark:border-cream-100/30 shadow-2xl flex flex-col justify-between transition-transform duration-300 ease-in-out lg:translate-x-0 ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
        aria-label="Navigation sidebar"
      >
        <div className="flex flex-col h-full overflow-y-auto overscroll-contain scrollbar-none">
          {/* Header & Logo with Neo-Brutalism */}
          <div className="flex items-center justify-between px-4 sm:px-5 py-3.5 sm:py-4 border-b-2 border-maroon-950 dark:border-cream-100/20 bg-cream-50 dark:bg-maroon-900 shrink-0">
            <Link href="/admin/dashboard" className="flex items-center gap-3 select-none min-w-0" onClick={onClose}>
              <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-2xl bg-cream-50 dark:bg-maroon-800 border-2 border-maroon-950 dark:border-cream-100 p-1 shadow-neo-sm flex items-center justify-center shrink-0">
                <img
                  src="/logo.svg"
                  alt="Bakelicious Logo"
                  className="w-full h-full object-contain"
                  onError={(e) => {
                    (e.target as HTMLElement).style.display = 'none';
                  }}
                />
              </div>
              <div className="min-w-0">
                <h1 className="text-lg sm:text-xl font-black text-maroon-950 dark:text-cream-100 tracking-tight leading-none font-serif truncate">
                  Bakelicious
                </h1>
                <span className="text-[9px] sm:text-[10px] text-maroon-700 dark:text-cream-300 font-black tracking-widest uppercase truncate block">
                  Bakery Admin
                </span>
              </div>
            </Link>
            {onClose && (
              <button
                onClick={onClose}
                className="p-2 min-w-[36px] min-h-[36px] rounded-xl border-2 border-maroon-950 dark:border-cream-100 bg-cream-200 dark:bg-maroon-800 text-maroon-950 dark:text-cream-100 lg:hidden shadow-neo-xs btn-tactile shrink-0 flex items-center justify-center"
                aria-label="Close sidebar"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>

          {/* Navigation Links */}
          <div className="px-3 py-3.5 space-y-4 flex-1">

            {/* ================= SECTION 2: WORKSPACE ================= */}
            {workspaceNav.length > 0 && (
              <div>
                <div className="px-2 mb-1.5 text-[10px] font-black text-maroon-950/70 dark:text-cream-300/70 uppercase tracking-widest">
                  Workspace
                </div>
                <nav className="space-y-1.5">
                  {workspaceNav.map((item, index) => {
                    const Icon = item.icon;
                    const active = isActive(item.href);
                    return (
                      <div key={item.name} className="space-y-1">
                        {item.subItems ? (
                          <div
                            className={`flex items-center justify-between px-3 py-2 rounded-xl text-xs font-bold transition duration-200 border-2 ${
                              active
                                ? 'bg-maroon-700 text-cream-100 border-maroon-950 dark:border-cream-100 shadow-neo-sm font-black'
                                : 'bg-cream-50 dark:bg-maroon-900/60 text-maroon-950 dark:text-cream-100 border-maroon-950/20 dark:border-maroon-800 hover:border-maroon-950 hover:shadow-neo-xs'
                            }`}
                          >
                            <Link
                              href={item.href}
                              onClick={(e) => {
                                if (active) {
                                  setOrdersMenuOpen(!ordersMenuOpen);
                                } else {
                                  setOrdersMenuOpen(true);
                                }
                                onClose?.();
                              }}
                              className="flex-1 flex items-center gap-2.5 cursor-pointer select-none min-w-0"
                            >
                              <span className="text-[10px] opacity-60 w-3 font-mono font-black shrink-0">{index + 1}.</span>
                              <Icon className="w-4 h-4 shrink-0" />
                              <span className="truncate">{item.name}</span>
                            </Link>

                            <button
                              type="button"
                              onClick={(e) => {
                                e.preventDefault();
                                e.stopPropagation();
                                setOrdersMenuOpen(!ordersMenuOpen);
                              }}
                              className={`p-1.5 rounded-lg transition shrink-0 ${
                                active
                                  ? 'text-cream-100 hover:bg-maroon-800'
                                  : 'text-maroon-950 dark:text-cream-300 hover:bg-cream-200 dark:hover:bg-maroon-800'
                              }`}
                              title={ordersMenuOpen ? 'Collapse sub-menu' : 'Expand sub-menu'}
                              aria-label="Toggle Orders & Client info sub-menu"
                            >
                              {ordersMenuOpen ? (
                                <ChevronDown className="w-3.5 h-3.5" />
                              ) : (
                                <ChevronRight className="w-3.5 h-3.5" />
                              )}
                            </button>
                          </div>
                        ) : (
                          <Link
                            href={item.href}
                            onClick={onClose}
                            className={`flex items-center justify-between px-3 py-2 rounded-xl text-xs font-bold transition duration-200 border-2 ${
                              active
                                ? 'bg-maroon-700 text-cream-100 border-maroon-950 dark:border-cream-100 shadow-neo-sm font-black'
                                : 'bg-cream-50 dark:bg-maroon-900/60 text-maroon-950 dark:text-cream-100 border-maroon-950/20 dark:border-maroon-800 hover:border-maroon-950 hover:shadow-neo-xs'
                            }`}
                          >
                            <div className="flex items-center gap-2.5 min-w-0">
                              <span className="text-[10px] opacity-60 w-3 font-mono font-black shrink-0">{index + 1}.</span>
                              <Icon className="w-4 h-4 shrink-0" />
                              <span className="truncate">{item.name}</span>
                            </div>
                            {item.badge && (
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[9px] font-black bg-rose-600 text-cream-100 border border-maroon-950 shadow-xs animate-pulse shrink-0">
                                <AlertTriangle className="w-2.5 h-2.5" />
                                {item.badge}
                              </span>
                            )}
                          </Link>
                        )}

                        {item.subItems && ordersMenuOpen && (
                          <div className="pl-4 pr-1 py-1 space-y-1 bg-cream-200 dark:bg-maroon-900/80 rounded-xl border-2 border-maroon-950/15 dark:border-cream-100/15 mt-1">
                            {item.subItems.map((sub) => {
                              const isSubActive = pathname === sub.href;
                              return (
                                <Link
                                  key={sub.name}
                                  href={sub.href}
                                  onClick={onClose}
                                  className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-bold transition border ${
                                    isSubActive
                                      ? 'bg-maroon-700 text-cream-100 border-maroon-950 font-black shadow-neo-xs'
                                      : 'text-maroon-950 dark:text-cream-200 border-transparent hover:border-maroon-950/40 hover:bg-cream-100 dark:hover:bg-maroon-800'
                                  }`}
                                >
                                  <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${isSubActive ? 'bg-amber-300' : 'bg-maroon-950/30 dark:bg-cream-300/40'}`}></span>
                                  <span className="truncate">{sub.name}</span>
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
                  className="w-full flex items-center justify-between px-3 py-2 rounded-xl text-[10px] font-black text-maroon-950 dark:text-cream-100 bg-cream-50 dark:bg-maroon-900/60 border-2 border-maroon-950/20 dark:border-maroon-800 hover:border-maroon-950 uppercase tracking-widest transition shadow-xs"
                >
                  <span>Business &amp; Reports</span>
                  {businessReportsOpen ? (
                    <ChevronDown className="w-3.5 h-3.5 text-maroon-700 dark:text-cream-300 shrink-0" />
                  ) : (
                    <ChevronRight className="w-3.5 h-3.5 text-maroon-700 dark:text-cream-300 shrink-0" />
                  )}
                </button>

                {businessReportsOpen && (
                  <nav className="mt-1.5 space-y-1 pl-1">
                    {businessReportsNav.map((item) => {
                      const Icon = item.icon;
                      const active = isActive(item.href);
                      return (
                        <Link
                          key={item.name}
                          href={item.href}
                          onClick={onClose}
                          className={`flex items-center gap-2.5 px-3 py-1.5 rounded-xl text-xs font-bold transition border-2 ${
                            active
                              ? 'bg-maroon-700 text-cream-100 border-maroon-950 dark:border-cream-100 shadow-neo-sm font-black'
                              : 'bg-cream-50 dark:bg-maroon-900/60 text-maroon-950 dark:text-cream-100 border-maroon-950/20 dark:border-maroon-800 hover:border-maroon-950 hover:shadow-neo-xs'
                          }`}
                        >
                          <Icon className="w-4 h-4 shrink-0" />
                          <span className="truncate">{item.name}</span>
                        </Link>
                      );
                    })}
                  </nav>
                )}
              </div>
            )}
          </div>

          {/* Footer Profile & Role Info (Neo-Brutalist) */}
          <div className="p-3.5 border-t-2 border-maroon-950 dark:border-cream-100/20 bg-cream-50 dark:bg-maroon-900 space-y-2.5 shrink-0">
            <div className="flex items-center justify-between px-1">
              <span className="text-[10px] font-black uppercase tracking-wider text-maroon-950 dark:text-cream-200">Theme</span>
              <ThemeToggle />
            </div>
            <div className="flex items-center justify-between pt-2 border-t-2 border-maroon-950/15 dark:border-maroon-800">
              <Link href="/admin/profile" onClick={onClose} className="flex items-center gap-2.5 group overflow-hidden flex-1 min-w-0 pr-2">
                <div className="w-8 h-8 rounded-xl border-2 border-maroon-950 dark:border-cream-100 bg-cream-200 dark:bg-maroon-800 text-maroon-950 dark:text-cream-100 flex items-center justify-center font-black text-xs shadow-neo-xs shrink-0">
                  {currentUser?.full_name?.charAt(0) || currentUser?.username?.charAt(0) || 'B'}
                </div>
                <div className="min-w-0">
                  <p className="text-xs font-black text-maroon-950 dark:text-cream-100 group-hover:underline truncate">
                    {currentUser?.full_name || currentUser?.username || 'Bakery Staff'}
                  </p>
                  <span className="inline-block px-1.5 py-0.5 text-[8px] font-black rounded-md bg-cream-200 dark:bg-maroon-950 text-maroon-950 dark:text-cream-200 border border-maroon-950/40 truncate max-w-[110px]">
                    {userRoleDisplay}
                  </span>
                </div>
              </Link>
              <button
                onClick={logout}
                title="Sign Out"
                className="p-2 min-w-[36px] min-h-[36px] rounded-xl border-2 border-maroon-950 dark:border-cream-100 bg-cream-200 dark:bg-maroon-800 text-maroon-950 dark:text-cream-100 shadow-neo-xs btn-tactile shrink-0 flex items-center justify-center active:scale-95"
              >
                <LogOut className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </div>
      </aside>
    </>
  );
};
