'use client';

import React, { useEffect, useState } from 'react';
import { Sidebar } from '@/components/layout/Sidebar';
import { Header } from '@/components/layout/Header';
import { ProtectedRoute } from '@/components/auth/ProtectedRoute';
import { Modal } from '@/components/ui/Modal';
import { api } from '@/lib/api';
import { User, Role, Permission } from '@/types';
import { showToast } from '@/lib/toast';
import { isSuperAdmin } from '@/lib/auth';
import {
  Users,
  Plus,
  Search,
  Key,
  ShieldCheck,
  Shield,
  Copy,
  Check,
  Edit2,
  Lock,
  ChevronDown,
  ChevronRight,
  Sparkles,
  CheckCircle2,
  XCircle,
  Eye,
  EyeOff,
  LayoutDashboard,
  ShoppingBag,
  ChefHat,
  UtensilsCrossed,
  Calendar,
  Boxes,
  LineChart,
  Receipt,
  FileSpreadsheet
} from 'lucide-react';

// Friendly website sections for access control
const WEBSITE_SECTIONS = [
  {
    id: 'dashboard',
    title: 'Dashboard & Metrics',
    description: 'Overview KPIs, daily revenue, active orders & low-stock alerts',
    icon: LayoutDashboard,
    permissionCodes: ['ANALYTICS_VIEW', 'REVENUE_VIEW', 'ORDERS_VIEW']
  },
  {
    id: 'orders',
    title: 'Orders & Client info',
    description: 'Manage customer orders, customization requests & client directory',
    icon: ShoppingBag,
    permissionCodes: ['ORDERS_VIEW', 'ORDERS_CREATE', 'ORDERS_STATUS_UPDATE', 'CLIENTS_VIEW']
  },
  {
    id: 'production',
    title: 'Production Queue',
    description: 'Kanban baking stages (Preparing, Baking, Decorating, Ready)',
    icon: ChefHat,
    permissionCodes: ['PRODUCTION_VIEW_ALL', 'PRODUCTION_STATUS_UPDATE', 'PRODUCTION_ASSIGN']
  },
  {
    id: 'products',
    title: 'Products, Menu & Recipes',
    description: 'Artisan cake catalog, menu categories & ingredient formulations',
    icon: UtensilsCrossed,
    permissionCodes: ['PRODUCTS_VIEW', 'PRODUCTS_CREATE', 'CATEGORIES_VIEW', 'RECIPES_VIEW']
  },
  {
    id: 'calendar',
    title: 'Calendar & Delivery Schedule',
    description: 'Delivery dates, pickup times & baking schedules',
    icon: Calendar,
    permissionCodes: ['CALENDAR_VIEW']
  },
  {
    id: 'employees',
    title: 'Employees & Access Control',
    description: 'Manage staff accounts, credentials & website permissions',
    icon: Users,
    permissionCodes: ['USER_MANAGEMENT_VIEW', 'USER_MANAGEMENT_CREATE', 'ROLE_MANAGEMENT']
  },
  {
    id: 'inventory',
    title: 'Inventory & Supplies',
    description: 'Stock tracking, low-stock reminders & ingredients ledger',
    icon: Boxes,
    permissionCodes: ['INVENTORY_VIEW']
  },
  {
    id: 'analytics_reports',
    title: 'Analytics & Financial Reports',
    description: 'Profit/loss curves, sales trends & downloadable PDF/CSV reports',
    icon: LineChart,
    permissionCodes: ['ANALYTICS_VIEW', 'FINANCIAL_REPORTS_VIEW']
  },
  {
    id: 'costing_expenses',
    title: 'Costing & Expenses',
    description: 'Automated recipe costing, overheads & daily bakery expenses',
    icon: Receipt,
    permissionCodes: ['COSTING_VIEW', 'EXPENSES_VIEW']
  }
];

export default function AdminEmployeesPage() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<'employees' | 'roles'>('employees');

  const [users, setUsers] = useState<User[]>([]);
  const [roles, setRoles] = useState<Role[]>([]);
  const [permissions, setPermissions] = useState<Permission[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  // Modals
  const [addModalOpen, setAddModalOpen] = useState(false);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [resetModalOpen, setResetModalOpen] = useState(false);
  const [credsModalOpen, setCredsModalOpen] = useState(false);

  // Form states
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [fullName, setFullName] = useState('');
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [selectedRoleId, setSelectedRoleId] = useState<number | ''>('');
  const [selectedRoleName, setSelectedRoleName] = useState<string>('Baker');

  // Website section access toggles (sectionId -> boolean)
  const [sectionAccess, setSectionAccess] = useState<Record<string, boolean>>({
    dashboard: true,
    orders: true,
    production: true,
    products: true,
    calendar: true,
    employees: false,
    inventory: true,
    analytics_reports: false,
    costing_expenses: false
  });

  // Credential reveal modal
  const [revealedCreds, setRevealedCreds] = useState<{
    name: string;
    email: string;
    username: string;
    password?: string;
    role: string;
    loginUrl: string;
  } | null>(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    fetchInitialData();
  }, []);

  const fetchInitialData = async () => {
    try {
      setLoading(true);
      const [usersRes, rolesRes, permsRes] = await Promise.all([
        api.get('/users'),
        api.get('/roles'),
        api.get('/users/permissions').catch(() => ({ data: [] }))
      ]);
      setUsers(usersRes.data);
      setRoles(rolesRes.data);
      setPermissions(permsRes.data);
    } catch (err) {
      console.error('Failed to load employee data:', err);
      showToast('Failed to load employee records', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleOpenAdd = () => {
    setSelectedUser(null);
    setFullName('');
    setUsername('');
    setEmail('');
    setPassword('Bakery@2026');
    const defaultRole = roles.find((r) => r.name.toLowerCase() === 'baker') || roles[0];
    setSelectedRoleId(defaultRole?.id || '');
    setSelectedRoleName(defaultRole?.name || 'Baker');

    // Default section access for staff
    setSectionAccess({
      dashboard: true,
      orders: true,
      production: true,
      products: true,
      calendar: true,
      employees: false,
      inventory: true,
      analytics_reports: false,
      costing_expenses: false
    });
    setAddModalOpen(true);
  };

  const handleOpenEdit = (u: User) => {
    setSelectedUser(u);
    setFullName(u.full_name || '');
    setUsername(u.username);
    setEmail(u.email);

    const userRole = roles.find((r) =>
      u.roles?.includes(r.name) || r.name === u.primary_role || r.name === u.role
    ) || roles[0];

    setSelectedRoleId(userRole?.id || '');
    setSelectedRoleName(userRole?.name || 'Staff');

    // Determine section access based on user's effective permissions & overrides
    const userPerms = new Set(u.effective_permissions || []);
    const newSectionAccess: Record<string, boolean> = {};

    WEBSITE_SECTIONS.forEach((sec) => {
      // If user is superadmin, they have full access
      if (u.is_superadmin) {
        newSectionAccess[sec.id] = true;
      } else {
        // Has access if user has at least one permission from the section
        newSectionAccess[sec.id] = sec.permissionCodes.some((code) => userPerms.has(code));
      }
    });

    setSectionAccess(newSectionAccess);
    setEditModalOpen(true);
  };

  // Convert section access choices to GRANT / DENY overrides
  const computePermissionOverrides = () => {
    const overrides: Array<{ permission_code: string; effect: 'GRANT' | 'DENY' }> = [];

    WEBSITE_SECTIONS.forEach((sec) => {
      const isAllowed = sectionAccess[sec.id];
      sec.permissionCodes.forEach((code) => {
        overrides.push({
          permission_code: code,
          effect: isAllowed ? 'GRANT' : 'DENY'
        });
      });
    });

    return overrides;
  };

  const handleCreateEmployee = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!username || !email) {
      showToast('Username and email are required', 'error');
      return;
    }

    try {
      const overridesPayload = computePermissionOverrides();
      const res = await api.post('/users', {
        full_name: fullName || undefined,
        username,
        email,
        password: password || undefined,
        role_id: selectedRoleId ? Number(selectedRoleId) : undefined,
        role_name: selectedRoleName || undefined,
        is_active: true,
        force_password_change: false,
        permission_overrides: overridesPayload
      });

      const tempPassword = res.data.temporary_password || password;

      setRevealedCreds({
        name: fullName || username,
        email,
        username,
        password: tempPassword,
        role: selectedRoleName,
        loginUrl: typeof window !== 'undefined' ? `${window.location.origin}/admin/login` : 'http://localhost:3000/admin/login'
      });

      setAddModalOpen(false);
      setCredsModalOpen(true);
      showToast(`Employee "${fullName || username}" created!`, 'success');
      fetchInitialData();
    } catch (err: any) {
      showToast(err.response?.data?.detail || 'Failed to create employee', 'error');
    }
  };

  const handleUpdateEmployee = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedUser) return;

    try {
      const overridesPayload = computePermissionOverrides();
      await api.put(`/users/${selectedUser.id}`, {
        full_name: fullName || undefined,
        username,
        email,
        role_id: selectedRoleId ? Number(selectedRoleId) : undefined,
        role_name: selectedRoleName || undefined,
        permission_overrides: overridesPayload
      });

      showToast(`Employee "${fullName || username}" access updated!`, 'success');
      setEditModalOpen(false);
      fetchInitialData();
    } catch (err: any) {
      showToast(err.response?.data?.detail || 'Failed to update employee', 'error');
    }
  };

  // Open password reset
  const handleOpenReset = (u: User) => {
    setSelectedUser(u);
    setPassword('');
    setResetModalOpen(true);
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedUser) return;

    try {
      const res = await api.post(`/users/${selectedUser.id}/reset-password`, {
        new_password: password.trim() ? password.trim() : undefined,
        send_email_notification: false
      });

      setRevealedCreds({
        name: selectedUser.full_name || selectedUser.username,
        email: selectedUser.email,
        username: selectedUser.username,
        password: res.data.temporary_password,
        role: selectedUser.primary_role || selectedUser.role || 'Staff',
        loginUrl: typeof window !== 'undefined' ? `${window.location.origin}/admin/login` : 'http://localhost:3000/admin/login'
      });

      setResetModalOpen(false);
      setCredsModalOpen(true);
      showToast('Password updated successfully!', 'success');
    } catch (err: any) {
      showToast(err.response?.data?.detail || 'Failed to reset password', 'error');
    }
  };

  const handleToggleUserStatus = async (u: User) => {
    if (u.is_superadmin) {
      showToast('Super Admin / Owner account cannot be disabled', 'error');
      return;
    }

    const nextState = !u.is_active;
    const actionLabel = nextState ? 'enable' : 'disable';
    if (!confirm(`Are you sure you want to ${actionLabel} account for ${u.username}?`)) return;

    try {
      await api.put(`/users/${u.id}/status`, { is_active: nextState });
      showToast(`Account ${nextState ? 'enabled' : 'disabled'} successfully`, 'success');
      fetchInitialData();
    } catch (err: any) {
      showToast(err.response?.data?.detail || 'Failed to update status', 'error');
    }
  };

  const handleCopyCredentials = () => {
    if (!revealedCreds) return;
    const text = `Bakelicious ERP Employee Login Credentials:\nName: ${revealedCreds.name}\nLogin ID / Username: ${revealedCreds.username}\nEmail: ${revealedCreds.email}\nPassword: ${revealedCreds.password}\nPortal Link: ${revealedCreds.loginUrl}`;
    navigator.clipboard.writeText(text);
    setCopied(true);
    showToast('Login credentials copied to clipboard!', 'success');
    setTimeout(() => setCopied(false), 2500);
  };

  const filteredUsers = users.filter((u) => {
    if (!search.trim()) return true;
    const q = search.toLowerCase();
    return (
      u.username.toLowerCase().includes(q) ||
      u.email.toLowerCase().includes(q) ||
      (u.full_name && u.full_name.toLowerCase().includes(q)) ||
      (u.role && u.role.toLowerCase().includes(q))
    );
  });

  return (
    <ProtectedRoute requiredPermission="USER_MANAGEMENT_VIEW">
      <div className="min-h-screen bg-cream-200 dark:bg-maroon-950 text-charcoal dark:text-cream-100 flex font-sans">
        <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

        <div className="flex-1 flex flex-col min-w-0 lg:pl-64">
          <Header onOpenSidebar={() => setSidebarOpen(true)} title="Bakery Employees & Access Control" />

          <main className="flex-1 p-3.5 sm:p-6 lg:p-8 space-y-5 sm:space-y-6 min-w-0">
            {/* Action Bar */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-cream-100 dark:bg-maroon-900 p-5 rounded-3xl border border-cream-300 dark:border-maroon-800 shadow-sm">
              <div>
                <h1 className="text-2xl font-extrabold font-serif text-maroon-950 dark:text-cream-100">
                  Employees &amp; Staff Access
                </h1>
                <p className="text-xs text-charcoal-muted dark:text-cream-300/80 font-medium mt-0.5">
                  Manage employee login details, passwords, and give/restrict access to different parts of the website.
                </p>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={handleOpenAdd}
                  className="px-5 py-3 bg-maroon-700 hover:bg-maroon-800 text-cream-100 rounded-2xl text-xs font-bold transition shadow-md flex items-center gap-2 shrink-0"
                >
                  <Plus className="w-4 h-4" />
                  <span>Add Employee</span>
                </button>
              </div>
            </div>

            {/* Search Bar */}
            <div className="bg-cream-100 dark:bg-maroon-900 p-4 rounded-3xl border border-cream-300 dark:border-maroon-800 shadow-sm flex items-center justify-between">
              <div className="relative w-full md:w-80">
                <Search className="w-4 h-4 text-charcoal-muted dark:text-cream-400 absolute left-3.5 top-3" />
                <input
                  type="text"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Search employees by name, username, email..."
                  className="w-full pl-10 pr-4 py-2.5 bg-cream-200 dark:bg-maroon-800 border border-cream-300 dark:border-maroon-700 rounded-2xl text-xs font-medium text-maroon-900 dark:text-cream-100 focus:outline-none"
                />
              </div>

              <div className="text-xs font-bold text-charcoal-muted dark:text-cream-300">
                Total Staff: <strong>{users.length}</strong>
              </div>
            </div>

            {/* Employees Table */}
            <div className="bg-cream-100 dark:bg-maroon-900 rounded-3xl border border-cream-300 dark:border-maroon-800 shadow-sm overflow-hidden">
              {loading ? (
                <div className="py-20 text-center text-xs font-bold text-charcoal-muted">
                  Loading employee records...
                </div>
              ) : filteredUsers.length > 0 ? (
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse text-xs min-w-[720px]">
                    <thead>
                      <tr className="border-b border-cream-300 dark:border-maroon-800 text-maroon-900 dark:text-cream-200 font-bold uppercase tracking-wider text-[10px] bg-cream-200/50 dark:bg-maroon-800/40">
                        <th className="py-3.5 px-4">Employee Details</th>
                        <th className="py-3.5 px-4">Login Details &amp; ID</th>
                        <th className="py-3.5 px-4">Role &amp; Status</th>
                        <th className="py-3.5 px-4">Website Section Access</th>
                        <th className="py-3.5 px-4 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-cream-300 dark:divide-maroon-800/50 font-medium">
                      {filteredUsers.map((u) => {
                        const isOwner = u.is_superadmin;
                        const roleName = isOwner ? 'Super Admin (Owner)' : u.primary_role || u.role || 'Staff';
                        const userPerms = new Set(u.effective_permissions || []);

                        return (
                          <tr key={u.id} className="hover:bg-cream-200/40 dark:hover:bg-maroon-800/30 transition">
                            {/* Employee Details */}
                            <td className="py-3.5 px-4">
                              <div className="flex items-center gap-3">
                                <div
                                  className={`w-9 h-9 rounded-full flex items-center justify-center font-black text-xs shadow-xs ${
                                    isOwner
                                      ? 'bg-amber-100 text-amber-900 dark:bg-amber-900/60 dark:text-amber-200 border border-amber-300'
                                      : 'bg-maroon-700 text-cream-100'
                                  }`}
                                >
                                  {u.full_name?.charAt(0) || u.username.charAt(0).toUpperCase()}
                                </div>
                                <div>
                                  <div className="flex items-center gap-1.5">
                                    <span className="font-bold text-maroon-950 dark:text-cream-100 text-sm">
                                      {u.full_name || u.username}
                                    </span>
                                    {isOwner && (
                                      <span className="px-1.5 py-0.2 bg-amber-100 text-amber-900 border border-amber-300 rounded-md text-[9px] font-extrabold uppercase">
                                        Owner
                                      </span>
                                    )}
                                  </div>
                                  <span className="text-[10px] text-charcoal-muted">
                                    Joined: {new Date(u.created_at).toLocaleDateString()}
                                  </span>
                                </div>
                              </div>
                            </td>

                            {/* Login Details & ID */}
                            <td className="py-3.5 px-4">
                              <div className="space-y-1">
                                <div className="font-mono text-xs font-bold text-maroon-900 dark:text-cream-100 flex items-center gap-1">
                                  <span>Username:</span>
                                  <code className="bg-cream-200 dark:bg-maroon-800 px-1.5 py-0.5 rounded text-[11px]">
                                    {u.username}
                                  </code>
                                </div>
                                <div className="text-[11px] text-charcoal-muted dark:text-cream-300 font-mono">
                                  {u.email}
                                </div>
                              </div>
                            </td>

                            {/* Role & Status */}
                            <td className="py-3.5 px-4">
                              <div className="space-y-1">
                                <span
                                  className={`inline-block px-2.5 py-0.5 rounded-xl text-[10px] font-bold border ${
                                    isOwner
                                      ? 'bg-amber-50 text-amber-900 border-amber-300'
                                      : roleName.toLowerCase() === 'baker'
                                      ? 'bg-emerald-50 text-emerald-800 border-emerald-300'
                                      : 'bg-cream-200 text-maroon-900 border-cream-300'
                                  }`}
                                >
                                  {roleName}
                                </span>
                                <div>
                                  {u.is_active ? (
                                    <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-700">
                                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                                      Active
                                    </span>
                                  ) : (
                                    <span className="inline-flex items-center gap-1 text-[10px] font-bold text-rose-700">
                                      <span className="w-1.5 h-1.5 rounded-full bg-rose-500"></span>
                                      Disabled
                                    </span>
                                  )}
                                </div>
                              </div>
                            </td>

                            {/* Accessible Website Sections */}
                            <td className="py-3.5 px-4 max-w-sm">
                              {isOwner ? (
                                <span className="inline-block px-2 py-1 bg-amber-100 text-amber-900 text-[10px] font-bold rounded-lg border border-amber-300">
                                  ★ Full Unrestricted Website Access
                                </span>
                              ) : (
                                <div className="flex flex-wrap gap-1">
                                  {WEBSITE_SECTIONS.map((sec) => {
                                    const hasAccess = sec.permissionCodes.some((code) => userPerms.has(code));
                                    if (!hasAccess) return null;
                                    return (
                                      <span
                                        key={sec.id}
                                        className="px-2 py-0.5 bg-cream-200 dark:bg-maroon-800 text-maroon-900 dark:text-cream-100 border border-cream-300 dark:border-maroon-700 rounded-md text-[9px] font-semibold"
                                      >
                                        {sec.title.split('&')[0].trim()}
                                      </span>
                                    );
                                  })}
                                </div>
                              )}
                            </td>

                            {/* Actions */}
                            <td className="py-3.5 px-4 text-right">
                              <div className="flex items-center justify-end gap-1.5">
                                {!isOwner && (
                                  <>
                                    <button
                                      onClick={() => handleOpenEdit(u)}
                                      title="Give / Edit Website Section Access"
                                      className="px-2.5 py-1.5 rounded-xl bg-maroon-700 text-cream-100 hover:bg-maroon-800 text-xs font-bold transition flex items-center gap-1 shadow-2xs"
                                    >
                                      <ShieldCheck className="w-3.5 h-3.5" />
                                      <span>Edit Access</span>
                                    </button>

                                    <button
                                      onClick={() => handleOpenReset(u)}
                                      title="Reset / Set Password"
                                      className="p-1.5 rounded-xl bg-cream-200 dark:bg-maroon-800 hover:bg-cream-300 dark:hover:bg-maroon-700 text-maroon-900 dark:text-cream-100 transition"
                                    >
                                      <Key className="w-3.5 h-3.5" />
                                    </button>

                                    <button
                                      onClick={() => handleToggleUserStatus(u)}
                                      title={u.is_active ? 'Disable Account' : 'Enable Account'}
                                      className={`p-1.5 rounded-xl transition ${
                                        u.is_active
                                          ? 'hover:bg-rose-100 hover:text-rose-700 text-charcoal-muted'
                                          : 'hover:bg-emerald-100 hover:text-emerald-700 text-rose-600'
                                      }`}
                                    >
                                      {u.is_active ? <XCircle className="w-3.5 h-3.5" /> : <CheckCircle2 className="w-3.5 h-3.5" />}
                                    </button>
                                  </>
                                )}
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="p-16 text-center text-xs font-bold text-charcoal-muted">
                  No employees found matching your criteria.
                </div>
              )}
            </div>
          </main>
        </div>
      </div>

      {/* ================= MODAL: ADD EMPLOYEE ================= */}
      <Modal
        isOpen={addModalOpen}
        onClose={() => setAddModalOpen(false)}
        title="Add New Bakery Employee"
        subtitle="Create login details and give access to different parts of the website"
        maxWidth="xl"
      >
        <form onSubmit={handleCreateEmployee} className="space-y-5 text-xs">
          {/* Step 1: Employee & Login Details */}
          <div className="space-y-3">
            <h4 className="font-extrabold text-sm text-maroon-900 dark:text-cream-100 uppercase tracking-wide">
              1. Employee Profile &amp; Login Details
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div>
                <label className="block font-bold text-maroon-900 dark:text-cream-100 mb-1">Full Name</label>
                <input
                  type="text"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="e.g. Rahul Sen"
                  className="w-full px-3.5 py-2 bg-cream-100 dark:bg-maroon-800 border border-cream-300 dark:border-maroon-700 rounded-xl font-medium focus:outline-none"
                />
              </div>

              <div>
                <label className="block font-bold text-maroon-900 dark:text-cream-100 mb-1">Email (Login ID) *</label>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="rahul@bakelicious.com"
                  className="w-full px-3.5 py-2 bg-cream-100 dark:bg-maroon-800 border border-cream-300 dark:border-maroon-700 rounded-xl font-medium focus:outline-none"
                />
              </div>

              <div>
                <label className="block font-bold text-maroon-900 dark:text-cream-100 mb-1">Username *</label>
                <input
                  type="text"
                  required
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="rahul_baker"
                  className="w-full px-3.5 py-2 bg-cream-100 dark:bg-maroon-800 border border-cream-300 dark:border-maroon-700 rounded-xl font-medium focus:outline-none"
                />
              </div>

              <div>
                <label className="block font-bold text-maroon-900 dark:text-cream-100 mb-1">Initial Password *</label>
                <input
                  type="text"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Set login password"
                  className="w-full px-3.5 py-2 bg-cream-100 dark:bg-maroon-800 border border-cream-300 dark:border-maroon-700 rounded-xl font-bold text-maroon-900 dark:text-cream-100 focus:outline-none"
                />
              </div>
            </div>

            <div>
              <label className="block font-bold text-maroon-900 dark:text-cream-100 mb-1">Primary Role</label>
              <select
                value={selectedRoleId}
                onChange={(e) => {
                  const val = Number(e.target.value);
                  setSelectedRoleId(val);
                  const found = roles.find((r) => r.id === val);
                  if (found) setSelectedRoleName(found.name);
                }}
                className="w-full px-3.5 py-2 bg-cream-100 dark:bg-maroon-800 border border-cream-300 dark:border-maroon-700 rounded-xl font-bold focus:outline-none"
              >
                {roles.filter((r) => !r.name.toLowerCase().includes('super')).map((r) => (
                  <option key={r.id} value={r.id}>
                    {r.name} - {r.description}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Step 2: GIVE ACCESS TO DIFFERENT PART OF THE WEBSITE */}
          <div className="space-y-3 pt-3 border-t border-cream-300 dark:border-maroon-800">
            <div className="flex items-center justify-between">
              <div>
                <h4 className="font-extrabold text-sm text-maroon-900 dark:text-cream-100 uppercase tracking-wide flex items-center gap-1.5">
                  <ShieldCheck className="w-4 h-4 text-maroon-700" />
                  <span>2. Website Section Access Control</span>
                </h4>
                <p className="text-[11px] text-charcoal-muted">
                  Check which parts of the admin website this employee is allowed to view and manage.
                </p>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => {
                    const allTrue: Record<string, boolean> = {};
                    WEBSITE_SECTIONS.forEach((s) => (allTrue[s.id] = true));
                    setSectionAccess(allTrue);
                  }}
                  className="text-[10px] font-bold text-maroon-700 dark:text-cream-300 hover:underline"
                >
                  Grant All
                </button>
                <span>•</span>
                <button
                  type="button"
                  onClick={() => {
                    const allFalse: Record<string, boolean> = {};
                    WEBSITE_SECTIONS.forEach((s) => (allFalse[s.id] = false));
                    setSectionAccess(allFalse);
                  }}
                  className="text-[10px] font-bold text-rose-700 hover:underline"
                >
                  Revoke All
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
              {WEBSITE_SECTIONS.map((sec) => {
                const Icon = sec.icon;
                const isEnabled = sectionAccess[sec.id] || false;

                return (
                  <div
                    key={sec.id}
                    onClick={() => setSectionAccess((prev) => ({ ...prev, [sec.id]: !prev[sec.id] }))}
                    className={`p-3 rounded-2xl border transition cursor-pointer flex items-start gap-3 ${
                      isEnabled
                        ? 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-300 dark:border-emerald-700'
                        : 'bg-cream-100 dark:bg-maroon-900/60 border-cream-300 dark:border-maroon-800 opacity-60'
                    }`}
                  >
                    <input
                      type="checkbox"
                      checked={isEnabled}
                      onChange={() => {}} // Handled by parent div
                      className="mt-0.5 rounded text-emerald-600 w-4 h-4"
                    />
                    <div className="flex-1">
                      <div className="flex items-center gap-1.5 font-bold text-xs text-maroon-950 dark:text-cream-100">
                        <Icon className={`w-3.5 h-3.5 ${isEnabled ? 'text-emerald-700' : 'text-charcoal-muted'}`} />
                        <span>{sec.title}</span>
                      </div>
                      <p className="text-[10px] text-charcoal-muted dark:text-cream-300/80 mt-0.5">
                        {sec.description}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="flex items-center justify-end gap-3 pt-4 border-t border-cream-300 dark:border-maroon-800">
            <button
              type="button"
              onClick={() => setAddModalOpen(false)}
              className="px-4 py-2 bg-cream-200 dark:bg-maroon-800 font-bold rounded-xl"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2 bg-maroon-700 hover:bg-maroon-800 text-cream-100 font-bold rounded-xl shadow-md"
            >
              Create Employee &amp; Set Access
            </button>
          </div>
        </form>
      </Modal>

      {/* ================= MODAL: EDIT ACCESS ================= */}
      <Modal
        isOpen={editModalOpen}
        onClose={() => setEditModalOpen(false)}
        title={selectedUser ? `Edit Access: ${selectedUser.full_name || selectedUser.username}` : 'Edit Employee'}
        subtitle="Configure website section permissions and role assignments"
        maxWidth="xl"
      >
        <form onSubmit={handleUpdateEmployee} className="space-y-5 text-xs">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <div>
              <label className="block font-bold text-maroon-900 dark:text-cream-100 mb-1">Full Name</label>
              <input
                type="text"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                className="w-full px-3.5 py-2 bg-cream-100 dark:bg-maroon-800 border border-cream-300 dark:border-maroon-700 rounded-xl font-medium focus:outline-none"
              />
            </div>

            <div>
              <label className="block font-bold text-maroon-900 dark:text-cream-100 mb-1">Email</label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-3.5 py-2 bg-cream-100 dark:bg-maroon-800 border border-cream-300 dark:border-maroon-700 rounded-xl font-medium focus:outline-none"
              />
            </div>

            <div>
              <label className="block font-bold text-maroon-900 dark:text-cream-100 mb-1">Role</label>
              <select
                value={selectedRoleId}
                onChange={(e) => {
                  const val = Number(e.target.value);
                  setSelectedRoleId(val);
                  const found = roles.find((r) => r.id === val);
                  if (found) setSelectedRoleName(found.name);
                }}
                className="w-full px-3.5 py-2 bg-cream-100 dark:bg-maroon-800 border border-cream-300 dark:border-maroon-700 rounded-xl font-bold focus:outline-none"
              >
                {roles.filter((r) => !r.name.toLowerCase().includes('super')).map((r) => (
                  <option key={r.id} value={r.id}>
                    {r.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Section Access Toggles */}
          <div className="space-y-3 pt-3 border-t border-cream-300 dark:border-maroon-800">
            <h4 className="font-extrabold text-sm text-maroon-900 dark:text-cream-100 uppercase tracking-wide flex items-center gap-1.5">
              <ShieldCheck className="w-4 h-4 text-maroon-700" />
              <span>Give or Revoke Access to Different Parts of Website</span>
            </h4>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
              {WEBSITE_SECTIONS.map((sec) => {
                const Icon = sec.icon;
                const isEnabled = sectionAccess[sec.id] || false;

                return (
                  <div
                    key={sec.id}
                    onClick={() => setSectionAccess((prev) => ({ ...prev, [sec.id]: !prev[sec.id] }))}
                    className={`p-3 rounded-2xl border transition cursor-pointer flex items-start gap-3 ${
                      isEnabled
                        ? 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-300 dark:border-emerald-700'
                        : 'bg-cream-100 dark:bg-maroon-900/60 border-cream-300 dark:border-maroon-800 opacity-60'
                    }`}
                  >
                    <input
                      type="checkbox"
                      checked={isEnabled}
                      onChange={() => {}}
                      className="mt-0.5 rounded text-emerald-600 w-4 h-4"
                    />
                    <div className="flex-1">
                      <div className="flex items-center gap-1.5 font-bold text-xs text-maroon-950 dark:text-cream-100">
                        <Icon className={`w-3.5 h-3.5 ${isEnabled ? 'text-emerald-700' : 'text-charcoal-muted'}`} />
                        <span>{sec.title}</span>
                      </div>
                      <p className="text-[10px] text-charcoal-muted dark:text-cream-300/80 mt-0.5">
                        {sec.description}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="flex items-center justify-end gap-3 pt-4 border-t border-cream-300 dark:border-maroon-800">
            <button
              type="button"
              onClick={() => setEditModalOpen(false)}
              className="px-4 py-2 bg-cream-200 dark:bg-maroon-800 font-bold rounded-xl"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2 bg-maroon-700 hover:bg-maroon-800 text-cream-100 font-bold rounded-xl shadow-md"
            >
              Save Website Access
            </button>
          </div>
        </form>
      </Modal>

      {/* ================= MODAL: RESET PASSWORD ================= */}
      <Modal
        isOpen={resetModalOpen}
        onClose={() => setResetModalOpen(false)}
        title={selectedUser ? `Reset Password: ${selectedUser.username}` : 'Reset Password'}
        subtitle="Set a new password or leave blank to auto-generate a secure password"
        maxWidth="md"
      >
        <form onSubmit={handleResetPassword} className="space-y-4 text-xs">
          <div>
            <label className="block font-bold text-maroon-900 dark:text-cream-100 mb-1">New Password</label>
            <input
              type="text"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="e.g. SecretBaker@123 (or leave empty for auto-generate)"
              className="w-full px-3.5 py-2.5 bg-cream-100 dark:bg-maroon-800 border border-cream-300 dark:border-maroon-700 rounded-xl font-bold text-maroon-900 dark:text-cream-100 focus:outline-none"
            />
          </div>

          <div className="flex items-center justify-end gap-3 pt-4 border-t border-cream-300 dark:border-maroon-800">
            <button
              type="button"
              onClick={() => setResetModalOpen(false)}
              className="px-4 py-2 bg-cream-200 dark:bg-maroon-800 font-bold rounded-xl"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2 bg-maroon-700 hover:bg-maroon-800 text-cream-100 font-bold rounded-xl shadow-md"
            >
              Set New Password
            </button>
          </div>
        </form>
      </Modal>

      {/* ================= MODAL: LOGIN CREDENTIALS REVEAL ================= */}
      <Modal
        isOpen={credsModalOpen}
        onClose={() => setCredsModalOpen(false)}
        title="Employee Login Details"
        subtitle="Copy and share these credentials with the employee"
        maxWidth="md"
      >
        {revealedCreds && (
          <div className="space-y-4 text-xs">
            <div className="p-4 bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-300 dark:border-emerald-700 rounded-2xl space-y-3">
              <div className="flex items-center gap-2 text-emerald-900 dark:text-emerald-200 font-extrabold text-sm">
                <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                <span>Credentials Ready for Employee</span>
              </div>

              <div className="space-y-2 font-mono text-xs bg-white/80 dark:bg-black/40 p-3 rounded-xl border border-emerald-200 dark:border-emerald-800">
                <div className="flex justify-between">
                  <span className="text-charcoal-muted">Employee Name:</span>
                  <span className="font-bold">{revealedCreds.name}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-charcoal-muted">Login ID / Username:</span>
                  <span className="font-bold text-maroon-900 dark:text-cream-100">{revealedCreds.username}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-charcoal-muted">Login Email:</span>
                  <span className="font-bold">{revealedCreds.email}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-charcoal-muted">Password:</span>
                  <span className="font-extrabold text-emerald-700 dark:text-emerald-300 text-sm">
                    {revealedCreds.password}
                  </span>
                </div>
                <div className="flex justify-between border-t border-cream-200 dark:border-maroon-800 pt-1">
                  <span className="text-charcoal-muted">Admin Login URL:</span>
                  <span className="text-[11px] underline truncate">{revealedCreds.loginUrl}</span>
                </div>
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 pt-3 border-t border-cream-300 dark:border-maroon-800">
              <button
                type="button"
                onClick={handleCopyCredentials}
                className="px-5 py-2.5 bg-emerald-700 hover:bg-emerald-800 text-white font-bold rounded-xl shadow-md flex items-center gap-2"
              >
                {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                <span>{copied ? 'Copied to Clipboard!' : 'Copy Login Details'}</span>
              </button>
              <button
                type="button"
                onClick={() => setCredsModalOpen(false)}
                className="px-5 py-2.5 bg-maroon-700 text-cream-100 font-bold rounded-xl"
              >
                Done
              </button>
            </div>
          </div>
        )}
      </Modal>
    </ProtectedRoute>
  );
}
