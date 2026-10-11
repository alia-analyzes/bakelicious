'use client';

import React, { useEffect, useState } from 'react';
import { Sidebar } from '@/components/layout/Sidebar';
import { Header } from '@/components/layout/Header';
import { ProtectedRoute } from '@/components/auth/ProtectedRoute';
import { api } from '@/lib/api';
import { showToast } from '@/lib/toast';
import { User, Permission } from '@/types';
import { getStoredUser, isSuperAdmin } from '@/lib/auth';
import {
  User as UserIcon,
  Lock,
  Save,
  Shield,
  CheckCircle2,
  XCircle,
  Key,
  Laptop,
  Check
} from 'lucide-react';

export default function AdminProfilePage() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [permissions, setPermissions] = useState<Permission[]>([]);
  const [loading, setLoading] = useState(true);

  // Password state
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [changingPassword, setChangingPassword] = useState(false);

  useEffect(() => {
    fetchProfileAndPermissions();
  }, []);

  const fetchProfileAndPermissions = async () => {
    try {
      setLoading(true);
      const [meRes, permsRes] = await Promise.all([
        api.get('/auth/me'),
        api.get('/users/permissions').catch(() => ({ data: [] }))
      ]);
      setCurrentUser(meRes.data);
      setPermissions(permsRes.data);
      if (typeof window !== 'undefined') {
        localStorage.setItem('user', JSON.stringify(meRes.data));
      }
    } catch (err) {
      console.error('Failed to load profile data:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentPassword) {
      showToast('Please enter your current password', 'error');
      return;
    }
    if (!newPassword || newPassword !== confirmPassword) {
      showToast('New passwords do not match!', 'error');
      return;
    }
    if (newPassword.length < 6) {
      showToast('New password must be at least 6 characters long', 'error');
      return;
    }

    try {
      setChangingPassword(true);
      await api.post('/auth/change-password', {
        current_password: currentPassword,
        new_password: newPassword
      });
      showToast('Password updated successfully!', 'success');
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      fetchProfileAndPermissions();
    } catch (err: any) {
      showToast(err.response?.data?.detail || 'Failed to update password', 'error');
    } finally {
      setChangingPassword(false);
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

  const hasPerm = (code: string) => {
    if (currentUser?.is_superadmin) return true;
    return currentUser?.effective_permissions?.includes(code) || false;
  };

  const roleDisplay = currentUser?.is_superadmin
    ? 'Super Admin (Owner)'
    : currentUser?.primary_role || currentUser?.role || 'Staff';

  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-cream-200 dark:bg-maroon-950 text-charcoal dark:text-cream-100 flex font-sans">
        <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

        <div className="flex-1 flex flex-col min-w-0 lg:pl-64">
          <Header onOpenSidebar={() => setSidebarOpen(true)} title="My Bakery ERP Account & Permissions" />

          <main className="flex-1 p-4 sm:p-6 lg:p-8 space-y-6 max-w-5xl mx-auto w-full">
            {/* Header banner */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-cream-100 dark:bg-maroon-900 p-6 rounded-3xl border border-cream-300 dark:border-maroon-800 shadow-sm">
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 rounded-full bg-maroon-700 dark:bg-cream-100 text-cream-100 dark:text-maroon-900 flex items-center justify-center text-xl font-black shadow-md shrink-0">
                  {currentUser?.full_name?.charAt(0) || currentUser?.username?.charAt(0) || 'U'}
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h1 className="text-xl sm:text-2xl font-extrabold font-serif text-maroon-950 dark:text-cream-100">
                      {currentUser?.full_name || currentUser?.username || 'User Profile'}
                    </h1>
                    <span className="px-2 py-0.5 bg-maroon-100 dark:bg-maroon-800 text-maroon-900 dark:text-cream-200 border border-maroon-300 dark:border-maroon-700 rounded-lg text-[10px] font-bold">
                      {roleDisplay}
                    </span>
                  </div>
                  <p className="text-xs text-charcoal-muted dark:text-cream-300/80 font-medium mt-0.5">
                    @{currentUser?.username} • {currentUser?.email}
                  </p>
                </div>
              </div>

              {currentUser?.force_password_change && (
                <div className="px-3.5 py-2 bg-amber-50 dark:bg-amber-950/80 border border-amber-300 dark:border-amber-700 text-amber-900 dark:text-amber-200 rounded-2xl text-xs font-bold flex items-center gap-2">
                  <Key className="w-4 h-4 text-amber-700" />
                  <span>Please change your temporary password below</span>
                </div>
              )}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Account Details & Password Form */}
              <div className="lg:col-span-1 space-y-6">
                <div className="bg-cream-100 dark:bg-maroon-900 p-6 rounded-3xl border border-cream-300 dark:border-maroon-800 shadow-sm space-y-4 text-xs font-medium">
                  <h3 className="text-sm font-bold text-maroon-950 dark:text-cream-100 font-serif border-b border-cream-300 dark:border-maroon-800 pb-2">
                    Account Overview
                  </h3>

                  <div className="space-y-2.5">
                    <div>
                      <span className="text-[10px] text-charcoal-muted dark:text-cream-300/70 font-bold uppercase tracking-wider block">Username</span>
                      <span className="font-bold text-maroon-900 dark:text-cream-100">@{currentUser?.username}</span>
                    </div>

                    <div>
                      <span className="text-[10px] text-charcoal-muted dark:text-cream-300/70 font-bold uppercase tracking-wider block">Email Address</span>
                      <span className="font-bold text-maroon-900 dark:text-cream-100">{currentUser?.email}</span>
                    </div>

                    <div>
                      <span className="text-[10px] text-charcoal-muted dark:text-cream-300/70 font-bold uppercase tracking-wider block">Primary Role</span>
                      <span className="font-bold text-maroon-700 dark:text-cream-200">{roleDisplay}</span>
                    </div>

                    <div>
                      <span className="text-[10px] text-charcoal-muted dark:text-cream-300/70 font-bold uppercase tracking-wider block">Account Status</span>
                      <span className="inline-flex items-center gap-1.5 text-emerald-700 dark:text-emerald-400 font-bold">
                        <span className="w-2 h-2 rounded-full bg-emerald-500"></span> Active &amp; Verified
                      </span>
                    </div>
                  </div>
                </div>

                {/* Change Password Form */}
                <form onSubmit={handleChangePassword} className="bg-cream-100 dark:bg-maroon-900 p-6 rounded-3xl border border-cream-300 dark:border-maroon-800 shadow-sm space-y-4 text-xs font-medium">
                  <h3 className="text-sm font-bold text-maroon-950 dark:text-cream-100 font-serif border-b border-cream-300 dark:border-maroon-800 pb-2 flex items-center gap-1.5">
                    <Lock className="w-4 h-4 text-maroon-700 dark:text-cream-200" />
                    <span>Change Password</span>
                  </h3>

                  <div>
                    <label className="block font-bold text-maroon-900 dark:text-cream-200 mb-1">Current Password</label>
                    <input
                      type="password"
                      required
                      value={currentPassword}
                      onChange={(e) => setCurrentPassword(e.target.value)}
                      placeholder="••••••••"
                      className="w-full px-3.5 py-2.5 bg-cream-200 dark:bg-maroon-800 border border-cream-300 dark:border-maroon-700 rounded-xl font-medium text-maroon-900 dark:text-cream-100"
                    />
                  </div>

                  <div>
                    <label className="block font-bold text-maroon-900 dark:text-cream-200 mb-1">New Password</label>
                    <input
                      type="password"
                      required
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      placeholder="Min 6 characters"
                      className="w-full px-3.5 py-2.5 bg-cream-200 dark:bg-maroon-800 border border-cream-300 dark:border-maroon-700 rounded-xl font-medium text-maroon-900 dark:text-cream-100"
                    />
                  </div>

                  <div>
                    <label className="block font-bold text-maroon-900 dark:text-cream-200 mb-1">Confirm New Password</label>
                    <input
                      type="password"
                      required
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      placeholder="Repeat new password"
                      className="w-full px-3.5 py-2.5 bg-cream-200 dark:bg-maroon-800 border border-cream-300 dark:border-maroon-700 rounded-xl font-medium text-maroon-900 dark:text-cream-100"
                    />
                  </div>

                  <div className="pt-2 border-t border-cream-300 dark:border-maroon-800 flex justify-end">
                    <button
                      type="submit"
                      disabled={changingPassword}
                      className="px-5 py-2.5 bg-maroon-700 hover:bg-maroon-800 text-cream-100 font-bold rounded-xl shadow-md transition disabled:opacity-50"
                    >
                      {changingPassword ? 'Updating...' : 'Update Password'}
                    </button>
                  </div>
                </form>
              </div>

              {/* Read-Only My Permissions Matrix */}
              <div className="lg:col-span-2 bg-cream-100 dark:bg-maroon-900 p-6 rounded-3xl border border-cream-300 dark:border-maroon-800 shadow-sm space-y-4">
                <div className="flex items-center justify-between border-b border-cream-300 dark:border-maroon-800 pb-3">
                  <div>
                    <h3 className="text-base font-bold text-maroon-950 dark:text-cream-100 font-serif flex items-center gap-2">
                      <Shield className="w-5 h-5 text-maroon-700 dark:text-cream-200" />
                      <span>My Effective Permissions</span>
                    </h3>
                    <p className="text-xs text-charcoal-muted dark:text-cream-300/80">
                      Summary of permissions currently assigned to your account.
                    </p>
                  </div>

                  <span className="text-xs font-bold px-3 py-1 bg-cream-200 dark:bg-maroon-800 rounded-xl border border-cream-300 dark:border-maroon-700 text-maroon-900 dark:text-cream-100">
                    {currentUser?.is_superadmin ? 'All Permissions Active' : `${currentUser?.effective_permissions?.length || 0} Granted`}
                  </span>
                </div>

                <div className="space-y-4 max-h-[600px] overflow-y-auto pr-1">
                  {Object.entries(groupedPermissions).map(([moduleName, perms]) => (
                    <div key={moduleName} className="border border-cream-300/80 dark:border-maroon-800/80 rounded-2xl overflow-hidden bg-cream-200/40 dark:bg-maroon-800/20">
                      <div className="px-4 py-2 bg-cream-200/80 dark:bg-maroon-800/60 font-bold text-xs text-maroon-900 dark:text-cream-100 uppercase tracking-wider">
                        {moduleName}
                      </div>

                      <div className="p-3 grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                        {perms.map((p) => {
                          const granted = hasPerm(p.code);
                          return (
                            <div
                              key={p.code}
                              className={`p-2 rounded-xl flex items-center justify-between gap-2 border ${
                                granted
                                  ? 'bg-emerald-50/60 dark:bg-emerald-950/30 border-emerald-200 dark:border-emerald-900/60 text-emerald-900 dark:text-emerald-200'
                                  : 'bg-cream-100 dark:bg-maroon-900/40 border-cream-300/40 dark:border-maroon-800/40 text-charcoal-muted dark:text-cream-400/50 opacity-60'
                              }`}
                            >
                              <div className="min-w-0">
                                <p className="font-bold truncate">{p.name}</p>
                                <p className="text-[10px] text-charcoal-muted dark:text-cream-300/60 truncate">{p.description}</p>
                              </div>

                              <div className="shrink-0">
                                {granted ? (
                                  <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                                ) : (
                                  <XCircle className="w-4 h-4 text-rose-400 dark:text-rose-600" />
                                )}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </main>
        </div>
      </div>
    </ProtectedRoute>
  );
}
