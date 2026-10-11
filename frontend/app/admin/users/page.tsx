'use client';

import React, { useEffect, useState } from 'react';
import { Sidebar } from '@/components/layout/Sidebar';
import { Header } from '@/components/layout/Header';
import { ProtectedRoute } from '@/components/auth/ProtectedRoute';
import { api } from '@/lib/api';
import { User, Role, Permission } from '@/types';
import { showToast } from '@/lib/toast';
import {
  UserCheck,
  Plus,
  Search,
  Key,
  UserX,
  ShieldAlert,
  Shield,
  Copy,
  Check,
  Edit2,
  Lock,
  ChevronDown,
  ChevronRight,
  Sparkles,
  Info
} from 'lucide-react';
import { isSuperAdmin } from '@/lib/auth';

export default function AdminUsersPage() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [users, setUsers] = useState<User[]>([]);
  const [roles, setRoles] = useState<Role[]>([]);
  const [permissions, setPermissions] = useState<Permission[]>([]);
  const [loading, setLoading] = useState(true);

  // Filters
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');

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

  // Override permissions: map of code -> 'GRANT' | 'DENY' | 'NONE'
  const [permOverrides, setPermOverrides] = useState<Record<string, 'GRANT' | 'DENY' | 'NONE'>>({});
  const [expandedModules, setExpandedModules] = useState<Record<string, boolean>>({});

  // Credential reveal modal
  const [revealedCreds, setRevealedCreds] = useState<{ email: string; username: string; password: string; role: string } | null>(null);
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
        api.get('/users/permissions')
      ]);
      setUsers(usersRes.data);
      setRoles(rolesRes.data);
      setPermissions(permsRes.data);

      // Expand all modules by default
      const modules: Record<string, boolean> = {};
      permsRes.data.forEach((p: Permission) => {
        modules[p.module] = true;
      });
      setExpandedModules(modules);
    } catch (err) {
      console.error('Failed to load user management data:', err);
      showToast('Failed to load user management data', 'error');
    } finally {
      setLoading(false);
    }
  };

  const fetchUsersOnly = async () => {
    try {
      const res = await api.get('/users');
      setUsers(res.data);
    } catch (err) {
      console.error('Failed to refresh users:', err);
    }
  };

  // Group permissions by module
  const groupedPermissions: Record<string, Permission[]> = {};
  permissions.forEach((p) => {
    if (!groupedPermissions[p.module]) {
      groupedPermissions[p.module] = [];
    }
    groupedPermissions[p.module].push(p);
  });

  const handleOpenAdd = () => {
    setSelectedUser(null);
    setFullName('');
    setUsername('');
    setEmail('');
    setPassword('');
    const defaultRole = roles.find(r => r.name.toLowerCase() === 'baker') || roles[0];
    setSelectedRoleId(defaultRole?.id || '');
    setSelectedRoleName(defaultRole?.name || 'Baker');
    setPermOverrides({});
    setAddModalOpen(true);
  };

  const handleRoleChange = (roleId: number | '') => {
    setSelectedRoleId(roleId);
    const r = roles.find(role => role.id === Number(roleId));
    if (r) {
      setSelectedRoleName(r.name);
    }
  };

  const handleToggleOverride = (permCode: string, targetState: 'GRANT' | 'DENY' | 'NONE') => {
    setPermOverrides(prev => {
      const copy = { ...prev };
      if (copy[permCode] === targetState) {
        delete copy[permCode];
      } else {
        copy[permCode] = targetState;
      }
      return copy;
    });
  };

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!username || !email) {
      showToast('Username and email are required', 'error');
      return;
    }

    try {
      const overridesPayload = Object.entries(permOverrides)
        .filter(([_, effect]) => effect === 'GRANT' || effect === 'DENY')
        .map(([code, effect]) => ({
          permission_code: code,
          effect
        }));

      const res = await api.post('/users', {
        full_name: fullName,
        username,
        email,
        password: password || undefined,
        role_id: selectedRoleId ? Number(selectedRoleId) : undefined,
        permission_overrides: overridesPayload,
        force_password_change: true
      });

      showToast(`User ${username} created successfully!`, 'success');
      setAddModalOpen(false);

      // Show credentials once
      setRevealedCreds({
        email: res.data.user.email,
        username: res.data.user.username,
        password: res.data.temporary_password,
        role: res.data.user.primary_role
      });
      setCredsModalOpen(true);
      fetchUsersOnly();
    } catch (err: any) {
      showToast(err.response?.data?.detail || 'Failed to create user', 'error');
    }
  };

  const handleOpenEdit = (user: User) => {
    setSelectedUser(user);
    setFullName(user.full_name || '');
    setUsername(user.username);
    setEmail(user.email);

    const userRole = roles.find(r => r.name.toLowerCase() === user.primary_role?.toLowerCase() || (user.roles && user.roles.includes(r.name)));
    setSelectedRoleId(userRole?.id || '');
    setSelectedRoleName(user.primary_role || 'Staff');

    // Build existing overrides map
    const existingOverrides: Record<string, 'GRANT' | 'DENY' | 'NONE'> = {};
    if (user.permission_overrides) {
      user.permission_overrides.forEach(ov => {
        existingOverrides[ov.code] = ov.effect;
      });
    }
    setPermOverrides(existingOverrides);
    setEditModalOpen(true);
  };

  const handleUpdateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedUser) return;

    try {
      const overridesPayload = Object.entries(permOverrides)
        .filter(([_, effect]) => effect === 'GRANT' || effect === 'DENY')
        .map(([code, effect]) => ({
          permission_code: code,
          effect
        }));

      await api.put(`/users/${selectedUser.id}`, {
        full_name: fullName,
        username,
        email,
        role_id: selectedRoleId ? Number(selectedRoleId) : undefined,
        permission_overrides: overridesPayload
      });

      showToast(`User ${username} updated successfully!`, 'success');
      setEditModalOpen(false);
      fetchUsersOnly();
    } catch (err: any) {
      showToast(err.response?.data?.detail || 'Failed to update user', 'error');
    }
  };

  const handleToggleUserStatus = async (user: User) => {
    if (user.is_superadmin) {
      showToast('Super Admin / Owner account cannot be disabled!', 'error');
      return;
    }

    const newStatus = !user.is_active;
    const confirmMsg = newStatus
      ? `Reactivate account for ${user.username}?`
      : `Disable account for ${user.username}? All active sessions will be revoked immediately.`;

    if (!confirm(confirmMsg)) return;

    try {
      await api.put(`/users/${user.id}/status`, { is_active: newStatus });
      showToast(`User ${user.username} ${newStatus ? 'enabled' : 'disabled'}.`, 'success');
      fetchUsersOnly();
    } catch (err: any) {
      showToast(err.response?.data?.detail || 'Failed to update user status', 'error');
    }
  };

  const handleOpenReset = (user: User) => {
    setSelectedUser(user);
    setPassword('');
    setResetModalOpen(true);
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedUser) return;

    try {
      const res = await api.post(`/users/${selectedUser.id}/reset-password`, {
        new_password: password || undefined,
        force_password_change: true
      });

      setResetModalOpen(false);
      setRevealedCreds({
        email: selectedUser.email,
        username: selectedUser.username,
        password: res.data.temporary_password,
        role: selectedUser.primary_role || 'Staff'
      });
      setCredsModalOpen(true);
      showToast(`Password reset for ${selectedUser.username}!`, 'success');
    } catch (err: any) {
      showToast(err.response?.data?.detail || 'Failed to reset password', 'error');
    }
  };

  const handleCopyCredentials = () => {
    if (!revealedCreds) return;
    const text = `Bakelicious ERP Login Credentials\nURL: ${window.location.origin}/admin/login\nEmail/Username: ${revealedCreds.email}\nPassword: ${revealedCreds.password}\nRole: ${revealedCreds.role}`;
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
    showToast('Credentials copied to clipboard!', 'success');
  };

  // Helper to check if a permission is inherited from selected role
  const isInheritedFromRole = (permCode: string) => {
    const r = roles.find(role => role.id === Number(selectedRoleId));
    if (!r) return false;
    return r.permissions.some(p => p.code === permCode);
  };

  // Filter users
  const filteredUsers = users.filter((u) => {
    if (statusFilter === 'active' && !u.is_active) return false;
    if (statusFilter === 'disabled' && u.is_active) return false;
    if (roleFilter !== 'all') {
      const uRole = (u.primary_role || u.role || '').toLowerCase();
      if (!uRole.includes(roleFilter.toLowerCase())) return false;
    }
    if (search) {
      const q = search.toLowerCase();
      const match =
        u.username.toLowerCase().includes(q) ||
        u.email.toLowerCase().includes(q) ||
        (u.full_name && u.full_name.toLowerCase().includes(q));
      if (!match) return false;
    }
    return true;
  });

  return (
    <ProtectedRoute requiredPermission="USER_MANAGEMENT_VIEW">
      <div className="min-h-screen bg-cream-200 dark:bg-maroon-950 text-charcoal dark:text-cream-100 flex font-sans">
        <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

        <div className="flex-1 flex flex-col min-w-0 lg:pl-64">
          <Header onOpenSidebar={() => setSidebarOpen(true)} title="Bakery User & Role Management" />

          <main className="flex-1 p-4 sm:p-6 lg:p-8 space-y-6 max-w-7xl mx-auto w-full">
            {/* Top Overview & Actions */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-cream-100 dark:bg-maroon-900 p-6 rounded-3xl border border-cream-300 dark:border-maroon-800 shadow-sm">
              <div>
                <h1 className="text-2xl font-extrabold font-serif text-maroon-950 dark:text-cream-100 flex items-center gap-2.5">
                  <UserCheck className="w-7 h-7 text-maroon-700 dark:text-cream-200" />
                  <span>ERP Staff &amp; Baker Accounts</span>
                </h1>
                <p className="text-xs text-charcoal-muted dark:text-cream-300/80 font-medium mt-1">
                  Manage department administrators, production bakers, role permissions, and GRANT/DENY access overrides.
                </p>
              </div>

              <button
                onClick={handleOpenAdd}
                className="px-5 py-3 bg-maroon-700 hover:bg-maroon-800 text-cream-100 rounded-2xl text-xs font-bold shadow-md transition flex items-center justify-center gap-2 shrink-0"
              >
                <Plus className="w-4 h-4" />
                <span>Add Staff User</span>
              </button>
            </div>

            {/* Quick Stats Banner */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              <div className="bg-cream-100 dark:bg-maroon-900 p-4 rounded-2xl border border-cream-300 dark:border-maroon-800 shadow-xs">
                <span className="text-[10px] font-bold text-charcoal-muted dark:text-cream-300/70 uppercase tracking-wider">Total Accounts</span>
                <p className="text-xl font-black text-maroon-950 dark:text-cream-100 mt-0.5">{users.length}</p>
              </div>
              <div className="bg-cream-100 dark:bg-maroon-900 p-4 rounded-2xl border border-cream-300 dark:border-maroon-800 shadow-xs">
                <span className="text-[10px] font-bold text-charcoal-muted dark:text-cream-300/70 uppercase tracking-wider">Active Bakers</span>
                <p className="text-xl font-black text-emerald-700 dark:text-emerald-400 mt-0.5">
                  {users.filter(u => u.is_active && (u.primary_role?.toLowerCase() === 'baker' || (u.roles && u.roles.some(r => r.toLowerCase() === 'baker')))).length}
                </p>
              </div>
              <div className="bg-cream-100 dark:bg-maroon-900 p-4 rounded-2xl border border-cream-300 dark:border-maroon-800 shadow-xs">
                <span className="text-[10px] font-bold text-charcoal-muted dark:text-cream-300/70 uppercase tracking-wider">Department Admins</span>
                <p className="text-xl font-black text-maroon-700 dark:text-cream-200 mt-0.5">
                  {users.filter(u => u.is_active && !u.is_superadmin && u.primary_role?.toLowerCase() !== 'baker').length}
                </p>
              </div>
              <div className="bg-cream-100 dark:bg-maroon-900 p-4 rounded-2xl border border-cream-300 dark:border-maroon-800 shadow-xs">
                <span className="text-[10px] font-bold text-charcoal-muted dark:text-cream-300/70 uppercase tracking-wider">Disabled Accounts</span>
                <p className="text-xl font-black text-rose-700 dark:text-rose-400 mt-0.5">
                  {users.filter(u => !u.is_active).length}
                </p>
              </div>
            </div>

            {/* Filter Toolbar */}
            <div className="bg-cream-100 dark:bg-maroon-900 p-4 rounded-3xl border border-cream-300 dark:border-maroon-800 shadow-sm flex flex-col md:flex-row items-center gap-3">
              <div className="relative flex-1 w-full">
                <Search className="w-4 h-4 text-charcoal-muted dark:text-cream-400 absolute left-3.5 top-3" />
                <input
                  type="text"
                  placeholder="Search by name, username, or email..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 bg-cream-200 dark:bg-maroon-800 border border-cream-300 dark:border-maroon-700 rounded-xl text-xs font-medium text-maroon-900 dark:text-cream-100 focus:outline-none focus:ring-2 focus:ring-maroon-600"
                />
              </div>

              <div className="flex items-center gap-2.5 w-full md:w-auto">
                <select
                  value={roleFilter}
                  onChange={(e) => setRoleFilter(e.target.value)}
                  className="px-3.5 py-2 bg-cream-200 dark:bg-maroon-800 border border-cream-300 dark:border-maroon-700 rounded-xl text-xs font-bold text-maroon-900 dark:text-cream-100 focus:outline-none"
                >
                  <option value="all">All Roles</option>
                  <option value="super admin">Super Admin (Owner)</option>
                  <option value="content admin">Content Admin</option>
                  <option value="order admin">Order Admin</option>
                  <option value="inventory admin">Inventory Admin</option>
                  <option value="finance admin">Finance Admin</option>
                  <option value="baker">Baker</option>
                </select>

                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="px-3.5 py-2 bg-cream-200 dark:bg-maroon-800 border border-cream-300 dark:border-maroon-700 rounded-xl text-xs font-bold text-maroon-900 dark:text-cream-100 focus:outline-none"
                >
                  <option value="all">All Statuses</option>
                  <option value="active">Active Accounts</option>
                  <option value="disabled">Disabled Accounts</option>
                </select>
              </div>
            </div>

            {/* Users Table */}
            <div className="bg-cream-100 dark:bg-maroon-900 rounded-3xl border border-cream-300 dark:border-maroon-800 shadow-sm overflow-hidden">
              {loading ? (
                <div className="py-20 text-center text-xs font-bold text-charcoal-muted">
                  Loading user accounts...
                </div>
              ) : filteredUsers.length === 0 ? (
                <div className="py-20 text-center text-xs font-bold text-charcoal-muted">
                  No users found matching your filters.
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse text-xs">
                    <thead>
                      <tr className="border-b border-cream-300 dark:border-maroon-800 text-maroon-900 dark:text-cream-200 font-bold uppercase tracking-wider text-[10px] bg-cream-200/50 dark:bg-maroon-800/40">
                        <th className="py-3.5 px-4">User</th>
                        <th className="py-3.5 px-4">Role &amp; Permissions</th>
                        <th className="py-3.5 px-4">Account Status</th>
                        <th className="py-3.5 px-4">Last Activity</th>
                        <th className="py-3.5 px-4 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-cream-300 dark:divide-maroon-800/50 font-medium">
                      {filteredUsers.map((u) => {
                        const isOwner = u.is_superadmin;
                        const roleName = isOwner ? 'Super Admin' : (u.primary_role || 'Staff');
                        const permsCount = u.effective_permissions?.length || 0;

                        return (
                          <tr key={u.id} className="hover:bg-cream-200/40 dark:hover:bg-maroon-800/30 transition">
                            {/* User Identity */}
                            <td className="py-3.5 px-4">
                              <div className="flex items-center gap-3">
                                <div className={`w-9 h-9 rounded-full flex items-center justify-center font-black text-xs shadow-xs ${
                                  isOwner
                                    ? 'bg-amber-100 text-amber-900 dark:bg-amber-900/60 dark:text-amber-200 border border-amber-300 dark:border-amber-700'
                                    : 'bg-maroon-700 text-cream-100 dark:bg-cream-100 dark:text-maroon-900'
                                }`}>
                                  {u.full_name?.charAt(0) || u.username.charAt(0).toUpperCase()}
                                </div>
                                <div>
                                  <div className="flex items-center gap-1.5">
                                    <span className="font-bold text-maroon-950 dark:text-cream-100">
                                      {u.full_name || u.username}
                                    </span>
                                    {isOwner && (
                                      <span className="px-1.5 py-0.2 bg-amber-100 dark:bg-amber-950/80 text-amber-800 dark:text-amber-300 border border-amber-300 dark:border-amber-800 rounded-md text-[9px] font-extrabold uppercase tracking-wide">
                                        Owner
                                      </span>
                                    )}
                                  </div>
                                  <div className="flex items-center gap-2 text-[10px] text-charcoal-muted dark:text-cream-300/70">
                                    <span>@{u.username}</span>
                                    <span>•</span>
                                    <span>{u.email}</span>
                                  </div>
                                </div>
                              </div>
                            </td>

                            {/* Role Badge & Perms */}
                            <td className="py-3.5 px-4">
                              <div className="space-y-1">
                                <span className={`inline-block px-2.5 py-1 rounded-xl text-[10px] font-bold border ${
                                  isOwner
                                    ? 'bg-amber-50 dark:bg-amber-950/60 text-amber-800 dark:text-amber-200 border-amber-200 dark:border-amber-800'
                                    : roleName.toLowerCase() === 'baker'
                                    ? 'bg-emerald-50 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-200 border-emerald-200 dark:border-emerald-800'
                                    : 'bg-cream-200 dark:bg-maroon-800 text-maroon-900 dark:text-cream-100 border-cream-300 dark:border-maroon-700'
                                }`}>
                                  {roleName}
                                </span>
                                <p className="text-[10px] text-charcoal-muted dark:text-cream-300/70 font-medium">
                                  {isOwner ? 'Unrestricted (Full Access)' : `${permsCount} permissions active`}
                                  {u.permission_overrides && u.permission_overrides.length > 0 && (
                                    <span className="ml-1 text-maroon-700 dark:text-cream-200 font-bold">
                                      ({u.permission_overrides.length} custom overrides)
                                    </span>
                                  )}
                                </p>
                              </div>
                            </td>

                            {/* Account Status */}
                            <td className="py-3.5 px-4">
                              {u.is_active ? (
                                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-emerald-100 dark:bg-emerald-950/70 text-emerald-800 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 rounded-xl text-[10px] font-bold">
                                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                                  Active
                                </span>
                              ) : (
                                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-rose-100 dark:bg-rose-950/70 text-rose-800 dark:text-rose-300 border border-rose-200 dark:border-rose-800 rounded-xl text-[10px] font-bold">
                                  <span className="w-1.5 h-1.5 rounded-full bg-rose-500"></span>
                                  Disabled
                                </span>
                              )}
                            </td>

                            {/* Last Activity */}
                            <td className="py-3.5 px-4 text-charcoal-muted dark:text-cream-300/80">
                              <span className="block font-medium">
                                {u.last_login ? new Date(u.last_login).toLocaleDateString() : 'Never logged in'}
                              </span>
                              <span className="text-[10px]">
                                Created {new Date(u.created_at).toLocaleDateString()}
                              </span>
                            </td>

                            {/* Actions */}
                            <td className="py-3.5 px-4 text-right">
                              <div className="flex items-center justify-end gap-1.5">
                                {!isOwner && (
                                  <>
                                    <button
                                      onClick={() => handleOpenEdit(u)}
                                      title="Edit User & Permissions"
                                      className="p-1.5 rounded-xl bg-cream-200 dark:bg-maroon-800 hover:bg-cream-300 dark:hover:bg-maroon-700 text-maroon-900 dark:text-cream-100 transition"
                                    >
                                      <Edit2 className="w-3.5 h-3.5" />
                                    </button>

                                    <button
                                      onClick={() => handleOpenReset(u)}
                                      title="Reset Password"
                                      className="p-1.5 rounded-xl bg-cream-200 dark:bg-maroon-800 hover:bg-cream-300 dark:hover:bg-maroon-700 text-maroon-900 dark:text-cream-100 transition"
                                    >
                                      <Key className="w-3.5 h-3.5" />
                                    </button>

                                    <button
                                      onClick={() => handleToggleUserStatus(u)}
                                      title={u.is_active ? 'Disable User' : 'Enable User'}
                                      className={`p-1.5 rounded-xl transition ${
                                        u.is_active
                                          ? 'bg-rose-50 dark:bg-rose-950/50 hover:bg-rose-100 dark:hover:bg-rose-900 text-rose-700 dark:text-rose-300'
                                          : 'bg-emerald-50 dark:bg-emerald-950/50 hover:bg-emerald-100 dark:hover:bg-emerald-900 text-emerald-700 dark:text-emerald-300'
                                      }`}
                                    >
                                      <UserX className="w-3.5 h-3.5" />
                                    </button>
                                  </>
                                )}
                                {isOwner && (
                                  <span className="text-[10px] font-bold text-amber-700 dark:text-amber-300/80 px-2 py-1 bg-amber-50 dark:bg-amber-950/50 rounded-lg">
                                    Protected
                                  </span>
                                )}
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </main>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* ADD USER MODAL */}
      {/* ========================================================================= */}
      {addModalOpen && (
        <div className="fixed inset-0 z-50 bg-maroon-950/70 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-cream-100 dark:bg-maroon-900 rounded-3xl p-6 border border-cream-300 dark:border-maroon-800 shadow-2xl max-w-2xl w-full my-8 max-h-[90vh] flex flex-col">
            <div className="flex items-center justify-between pb-4 border-b border-cream-300 dark:border-maroon-800">
              <div>
                <h3 className="text-xl font-extrabold font-serif text-maroon-950 dark:text-cream-100 flex items-center gap-2">
                  <UserCheck className="w-5 h-5 text-maroon-700 dark:text-cream-200" />
                  <span>Create New ERP Staff / Baker Account</span>
                </h3>
                <p className="text-xs text-charcoal-muted dark:text-cream-300/80">
                  Assign a predefined role or tailor custom module permissions with GRANT / DENY overrides.
                </p>
              </div>
              <button
                onClick={() => setAddModalOpen(false)}
                className="p-1 rounded-xl text-charcoal-muted hover:text-maroon-900 dark:hover:text-cream-100 text-lg font-bold"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateUser} className="space-y-4 pt-4 flex-1 overflow-y-auto pr-1 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block font-bold text-maroon-900 dark:text-cream-200 mb-1">Full Name</label>
                  <input
                    type="text"
                    placeholder="e.g. Rahul Sharma"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-cream-200 dark:bg-maroon-800 border border-cream-300 dark:border-maroon-700 rounded-xl font-medium text-maroon-900 dark:text-cream-100"
                  />
                </div>

                <div>
                  <label className="block font-bold text-maroon-900 dark:text-cream-200 mb-1">Username *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. baker_rahul"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-cream-200 dark:bg-maroon-800 border border-cream-300 dark:border-maroon-700 rounded-xl font-medium text-maroon-900 dark:text-cream-100"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block font-bold text-maroon-900 dark:text-cream-200 mb-1">Email Address *</label>
                  <input
                    type="email"
                    required
                    placeholder="e.g. rahul@bakelicious.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-cream-200 dark:bg-maroon-800 border border-cream-300 dark:border-maroon-700 rounded-xl font-medium text-maroon-900 dark:text-cream-100"
                  />
                </div>

                <div>
                  <label className="block font-bold text-maroon-900 dark:text-cream-200 mb-1">
                    Initial Password (Optional)
                  </label>
                  <input
                    type="text"
                    placeholder="Leave blank to auto-generate"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-cream-200 dark:bg-maroon-800 border border-cream-300 dark:border-maroon-700 rounded-xl font-medium text-maroon-900 dark:text-cream-100"
                  />
                </div>
              </div>

              {/* Predefined Role Selector */}
              <div>
                <label className="block font-bold text-maroon-900 dark:text-cream-200 mb-1">Primary Role</label>
                <select
                  value={selectedRoleId}
                  onChange={(e) => handleRoleChange(e.target.value ? Number(e.target.value) : '')}
                  className="w-full px-3.5 py-2.5 bg-cream-200 dark:bg-maroon-800 border border-cream-300 dark:border-maroon-700 rounded-xl font-bold text-maroon-900 dark:text-cream-100"
                >
                  {roles.filter(r => !r.is_system_role || r.name !== 'Super Admin').map((r) => (
                    <option key={r.id} value={r.id}>
                      {r.name} — {r.description}
                    </option>
                  ))}
                </select>
              </div>

              {/* Custom Permission Overrides Matrix */}
              <div className="pt-3 border-t border-cream-300 dark:border-maroon-800 space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="font-bold text-sm text-maroon-950 dark:text-cream-100">
                      Permission Overrides Matrix
                    </h4>
                    <p className="text-[11px] text-charcoal-muted dark:text-cream-300/70">
                      Permissions inherited from <strong>{selectedRoleName}</strong> are shown. Use GRANT to add or DENY to block.
                    </p>
                  </div>
                </div>

                <div className="space-y-2 max-h-60 overflow-y-auto p-1">
                  {Object.entries(groupedPermissions).map(([moduleName, perms]) => {
                    const isExpanded = expandedModules[moduleName] !== false;
                    return (
                      <div key={moduleName} className="border border-cream-300 dark:border-maroon-800 rounded-2xl overflow-hidden bg-cream-200/40 dark:bg-maroon-800/30">
                        <button
                          type="button"
                          onClick={() => setExpandedModules(prev => ({ ...prev, [moduleName]: !isExpanded }))}
                          className="w-full px-3.5 py-2 flex items-center justify-between bg-cream-200/80 dark:bg-maroon-800/60 font-bold text-maroon-900 dark:text-cream-100 text-xs"
                        >
                          <span className="uppercase tracking-wider text-[11px]">{moduleName}</span>
                          {isExpanded ? <ChevronDown className="w-3.5 h-3.5" /> : <ChevronRight className="w-3.5 h-3.5" />}
                        </button>

                        {isExpanded && (
                          <div className="p-3 space-y-2 divide-y divide-cream-300/60 dark:divide-maroon-800/40">
                            {perms.map((p) => {
                              const inherited = isInheritedFromRole(p.code);
                              const override = permOverrides[p.code];
                              const isGranted = override === 'GRANT' || (inherited && override !== 'DENY');

                              return (
                                <div key={p.code} className="pt-2 first:pt-0 flex items-center justify-between gap-2">
                                  <div className="min-w-0 pr-2">
                                    <p className="font-bold text-maroon-900 dark:text-cream-100 truncate">{p.name}</p>
                                    <p className="text-[10px] text-charcoal-muted dark:text-cream-300/60 truncate">{p.description}</p>
                                  </div>

                                  <div className="flex items-center gap-1.5 shrink-0">
                                    <button
                                      type="button"
                                      onClick={() => handleToggleOverride(p.code, 'GRANT')}
                                      className={`px-2 py-1 rounded-lg text-[10px] font-bold transition ${
                                        override === 'GRANT'
                                          ? 'bg-emerald-600 text-white shadow-xs'
                                          : inherited && override !== 'DENY'
                                          ? 'bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-700'
                                          : 'bg-cream-200 dark:bg-maroon-800 text-charcoal-muted hover:text-emerald-600'
                                      }`}
                                    >
                                      GRANT
                                    </button>

                                    <button
                                      type="button"
                                      onClick={() => handleToggleOverride(p.code, 'DENY')}
                                      className={`px-2 py-1 rounded-lg text-[10px] font-bold transition ${
                                        override === 'DENY'
                                          ? 'bg-rose-600 text-white shadow-xs'
                                          : 'bg-cream-200 dark:bg-maroon-800 text-charcoal-muted hover:text-rose-600'
                                      }`}
                                    >
                                      DENY
                                    </button>
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>

              <div className="pt-4 border-t border-cream-300 dark:border-maroon-800 flex justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => setAddModalOpen(false)}
                  className="px-4 py-2.5 bg-cream-200 dark:bg-maroon-800 text-charcoal dark:text-cream-200 rounded-xl font-bold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-6 py-2.5 bg-maroon-700 hover:bg-maroon-800 text-cream-100 rounded-xl font-bold shadow-md transition"
                >
                  Create User
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* EDIT USER MODAL */}
      {/* ========================================================================= */}
      {editModalOpen && selectedUser && (
        <div className="fixed inset-0 z-50 bg-maroon-950/70 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-cream-100 dark:bg-maroon-900 rounded-3xl p-6 border border-cream-300 dark:border-maroon-800 shadow-2xl max-w-2xl w-full my-8 max-h-[90vh] flex flex-col">
            <div className="flex items-center justify-between pb-4 border-b border-cream-300 dark:border-maroon-800">
              <div>
                <h3 className="text-xl font-extrabold font-serif text-maroon-950 dark:text-cream-100 flex items-center gap-2">
                  <Edit2 className="w-5 h-5 text-maroon-700 dark:text-cream-200" />
                  <span>Edit User: @{selectedUser.username}</span>
                </h3>
                <p className="text-xs text-charcoal-muted dark:text-cream-300/80">
                  Update personal details, role assignments, or custom GRANT / DENY overrides.
                </p>
              </div>
              <button
                onClick={() => setEditModalOpen(false)}
                className="p-1 rounded-xl text-charcoal-muted hover:text-maroon-900 dark:hover:text-cream-100 text-lg font-bold"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleUpdateUser} className="space-y-4 pt-4 flex-1 overflow-y-auto pr-1 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block font-bold text-maroon-900 dark:text-cream-200 mb-1">Full Name</label>
                  <input
                    type="text"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-cream-200 dark:bg-maroon-800 border border-cream-300 dark:border-maroon-700 rounded-xl font-medium text-maroon-900 dark:text-cream-100"
                  />
                </div>

                <div>
                  <label className="block font-bold text-maroon-900 dark:text-cream-200 mb-1">Username</label>
                  <input
                    type="text"
                    required
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-cream-200 dark:bg-maroon-800 border border-cream-300 dark:border-maroon-700 rounded-xl font-medium text-maroon-900 dark:text-cream-100"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-maroon-900 dark:text-cream-200 mb-1">Email Address</label>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-cream-200 dark:bg-maroon-800 border border-cream-300 dark:border-maroon-700 rounded-xl font-medium text-maroon-900 dark:text-cream-100"
                />
              </div>

              {/* Role */}
              {!selectedUser.is_superadmin && (
                <div>
                  <label className="block font-bold text-maroon-900 dark:text-cream-200 mb-1">Assigned Role</label>
                  <select
                    value={selectedRoleId}
                    onChange={(e) => handleRoleChange(e.target.value ? Number(e.target.value) : '')}
                    className="w-full px-3.5 py-2.5 bg-cream-200 dark:bg-maroon-800 border border-cream-300 dark:border-maroon-700 rounded-xl font-bold text-maroon-900 dark:text-cream-100"
                  >
                    {roles.filter(r => !r.is_system_role || r.name !== 'Super Admin').map((r) => (
                      <option key={r.id} value={r.id}>
                        {r.name} — {r.description}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {/* Permission Overrides Matrix */}
              {!selectedUser.is_superadmin && (
                <div className="pt-3 border-t border-cream-300 dark:border-maroon-800 space-y-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="font-bold text-sm text-maroon-950 dark:text-cream-100">
                        Custom Permission Overrides
                      </h4>
                      <p className="text-[11px] text-charcoal-muted dark:text-cream-300/70">
                        GRANT to allow extra abilities or DENY to restrict abilities inherited from {selectedRoleName}.
                      </p>
                    </div>
                  </div>

                  <div className="space-y-2 max-h-60 overflow-y-auto p-1">
                    {Object.entries(groupedPermissions).map(([moduleName, perms]) => {
                      const isExpanded = expandedModules[moduleName] !== false;
                      return (
                        <div key={moduleName} className="border border-cream-300 dark:border-maroon-800 rounded-2xl overflow-hidden bg-cream-200/40 dark:bg-maroon-800/30">
                          <button
                            type="button"
                            onClick={() => setExpandedModules(prev => ({ ...prev, [moduleName]: !isExpanded }))}
                            className="w-full px-3.5 py-2 flex items-center justify-between bg-cream-200/80 dark:bg-maroon-800/60 font-bold text-maroon-900 dark:text-cream-100 text-xs"
                          >
                            <span className="uppercase tracking-wider text-[11px]">{moduleName}</span>
                            {isExpanded ? <ChevronDown className="w-3.5 h-3.5" /> : <ChevronRight className="w-3.5 h-3.5" />}
                          </button>

                          {isExpanded && (
                            <div className="p-3 space-y-2 divide-y divide-cream-300/60 dark:divide-maroon-800/40">
                              {perms.map((p) => {
                                const inherited = isInheritedFromRole(p.code);
                                const override = permOverrides[p.code];

                                return (
                                  <div key={p.code} className="pt-2 first:pt-0 flex items-center justify-between gap-2">
                                    <div className="min-w-0 pr-2">
                                      <p className="font-bold text-maroon-900 dark:text-cream-100 truncate">{p.name}</p>
                                      <p className="text-[10px] text-charcoal-muted dark:text-cream-300/60 truncate">{p.description}</p>
                                    </div>

                                    <div className="flex items-center gap-1.5 shrink-0">
                                      <button
                                        type="button"
                                        onClick={() => handleToggleOverride(p.code, 'GRANT')}
                                        className={`px-2 py-1 rounded-lg text-[10px] font-bold transition ${
                                          override === 'GRANT'
                                            ? 'bg-emerald-600 text-white shadow-xs'
                                            : inherited && override !== 'DENY'
                                            ? 'bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-700'
                                            : 'bg-cream-200 dark:bg-maroon-800 text-charcoal-muted hover:text-emerald-600'
                                        }`}
                                      >
                                        GRANT
                                      </button>

                                      <button
                                        type="button"
                                        onClick={() => handleToggleOverride(p.code, 'DENY')}
                                        className={`px-2 py-1 rounded-lg text-[10px] font-bold transition ${
                                          override === 'DENY'
                                            ? 'bg-rose-600 text-white shadow-xs'
                                            : 'bg-cream-200 dark:bg-maroon-800 text-charcoal-muted hover:text-rose-600'
                                        }`}
                                      >
                                        DENY
                                      </button>
                                    </div>
                                  </div>
                                );
                              })}
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              <div className="pt-4 border-t border-cream-300 dark:border-maroon-800 flex justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => setEditModalOpen(false)}
                  className="px-4 py-2.5 bg-cream-200 dark:bg-maroon-800 text-charcoal dark:text-cream-200 rounded-xl font-bold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-6 py-2.5 bg-maroon-700 hover:bg-maroon-800 text-cream-100 rounded-xl font-bold shadow-md transition"
                >
                  Save Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* RESET PASSWORD MODAL */}
      {/* ========================================================================= */}
      {resetModalOpen && selectedUser && (
        <div className="fixed inset-0 z-50 bg-maroon-950/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-cream-100 dark:bg-maroon-900 rounded-3xl p-6 border border-cream-300 dark:border-maroon-800 shadow-2xl max-w-md w-full space-y-4 text-xs">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-amber-100 dark:bg-amber-950/80 text-amber-800 dark:text-amber-300 flex items-center justify-center border border-amber-200 dark:border-amber-800">
                <Key className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-maroon-950 dark:text-cream-100 font-serif">
                  Reset Password for @{selectedUser.username}
                </h3>
                <p className="text-[11px] text-charcoal-muted dark:text-cream-300/70">
                  This will generate a temporary password and revoke all current sessions.
                </p>
              </div>
            </div>

            <form onSubmit={handleResetPassword} className="space-y-4 pt-2">
              <div>
                <label className="block font-bold text-maroon-900 dark:text-cream-200 mb-1">
                  New Temporary Password (Optional)
                </label>
                <input
                  type="text"
                  placeholder="Leave empty to auto-generate secure password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-cream-200 dark:bg-maroon-800 border border-cream-300 dark:border-maroon-700 rounded-xl font-medium text-maroon-900 dark:text-cream-100"
                />
              </div>

              <div className="p-3 bg-amber-50 dark:bg-amber-950/50 border border-amber-200 dark:border-amber-800/80 rounded-xl text-amber-900 dark:text-amber-200 text-[11px]">
                <Info className="w-3.5 h-3.5 inline mr-1 text-amber-700" />
                The user will be required to choose a new password upon their next login.
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setResetModalOpen(false)}
                  className="px-4 py-2 bg-cream-200 dark:bg-maroon-800 text-charcoal dark:text-cream-200 rounded-xl font-bold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-maroon-700 hover:bg-maroon-800 text-cream-100 rounded-xl font-bold shadow-md transition"
                >
                  Reset Password
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* REVEAL CREDENTIALS ONCE MODAL */}
      {/* ========================================================================= */}
      {credsModalOpen && revealedCreds && (
        <div className="fixed inset-0 z-50 bg-maroon-950/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-cream-100 dark:bg-maroon-900 rounded-3xl p-6 border border-cream-300 dark:border-maroon-800 shadow-2xl max-w-md w-full space-y-4 text-xs">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-emerald-100 dark:bg-emerald-950/80 text-emerald-800 dark:text-emerald-300 flex items-center justify-center border border-emerald-200 dark:border-emerald-800">
                <Sparkles className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-maroon-950 dark:text-cream-100 font-serif">
                  Temporary User Credentials
                </h3>
                <p className="text-[11px] text-charcoal-muted dark:text-cream-300/70">
                  Please copy and share these credentials securely. The password cannot be retrieved again.
                </p>
              </div>
            </div>

            <div className="p-4 bg-cream-200 dark:bg-maroon-800 rounded-2xl border border-cream-300 dark:border-maroon-700 space-y-2.5 font-mono">
              <div className="flex justify-between items-center text-xs">
                <span className="text-charcoal-muted dark:text-cream-400 font-sans font-bold">Email:</span>
                <span className="font-bold text-maroon-900 dark:text-cream-100">{revealedCreds.email}</span>
              </div>
              <div className="flex justify-between items-center text-xs">
                <span className="text-charcoal-muted dark:text-cream-400 font-sans font-bold">Username:</span>
                <span className="font-bold text-maroon-900 dark:text-cream-100">{revealedCreds.username}</span>
              </div>
              <div className="flex justify-between items-center text-xs">
                <span className="text-charcoal-muted dark:text-cream-400 font-sans font-bold">Role:</span>
                <span className="font-bold text-maroon-700 dark:text-cream-200">{revealedCreds.role}</span>
              </div>
              <div className="flex justify-between items-center text-xs pt-1 border-t border-cream-300 dark:border-maroon-700">
                <span className="text-charcoal-muted dark:text-cream-400 font-sans font-bold">Temporary Password:</span>
                <span className="font-bold text-emerald-700 dark:text-emerald-300 px-2 py-0.5 bg-emerald-50 dark:bg-emerald-950 rounded-lg">
                  {revealedCreds.password}
                </span>
              </div>
            </div>

            <div className="flex items-center justify-between pt-2">
              <button
                onClick={handleCopyCredentials}
                className="px-4 py-2.5 bg-cream-200 dark:bg-maroon-800 hover:bg-cream-300 dark:hover:bg-maroon-700 text-maroon-900 dark:text-cream-100 rounded-xl font-bold transition flex items-center gap-1.5"
              >
                {copied ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4" />}
                <span>{copied ? 'Copied!' : 'Copy Credentials'}</span>
              </button>

              <button
                onClick={() => setCredsModalOpen(false)}
                className="px-5 py-2.5 bg-maroon-700 hover:bg-maroon-800 text-cream-100 rounded-xl font-bold shadow-md transition"
              >
                Done
              </button>
            </div>
          </div>
        </div>
      )}
    </ProtectedRoute>
  );
}
