'use client';

import React, { useEffect, useState } from 'react';
import { Sidebar } from '@/components/layout/Sidebar';
import { Header } from '@/components/layout/Header';
import { ProtectedRoute } from '@/components/auth/ProtectedRoute';
import { api } from '@/lib/api';
import { Role, Permission } from '@/types';
import { showToast } from '@/lib/toast';
import {
  ShieldCheck,
  Plus,
  Edit2,
  Trash2,
  Shield,
  Check,
  Users,
  ChevronDown,
  ChevronRight,
  Info
} from 'lucide-react';

export default function AdminRolesPage() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [roles, setRoles] = useState<Role[]>([]);
  const [permissions, setPermissions] = useState<Permission[]>([]);
  const [loading, setLoading] = useState(true);

  // Modals
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [selectedRole, setSelectedRole] = useState<Role | null>(null);

  // Form
  const [roleName, setRoleName] = useState('');
  const [roleDescription, setRoleDescription] = useState('');
  const [selectedPermCodes, setSelectedPermCodes] = useState<string[]>([]);
  const [expandedModules, setExpandedModules] = useState<Record<string, boolean>>({});

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [rolesRes, permsRes] = await Promise.all([
        api.get('/roles'),
        api.get('/users/permissions')
      ]);
      setRoles(rolesRes.data);
      setPermissions(permsRes.data);

      const modules: Record<string, boolean> = {};
      permsRes.data.forEach((p: Permission) => {
        modules[p.module] = true;
      });
      setExpandedModules(modules);
    } catch (err) {
      console.error('Failed to load roles/permissions:', err);
      showToast('Failed to load roles data', 'error');
    } finally {
      setLoading(false);
    }
  };

  const groupedPermissions: Record<string, Permission[]> = {};
  permissions.forEach((p) => {
    if (!groupedPermissions[p.module]) {
      groupedPermissions[p.module] = [];
    }
    groupedPermissions[p.module].push(p);
  });

  const handleOpenCreate = () => {
    setSelectedRole(null);
    setRoleName('');
    setRoleDescription('');
    setSelectedPermCodes([]);
    setCreateModalOpen(true);
  };

  const handleTogglePerm = (code: string) => {
    setSelectedPermCodes(prev =>
      prev.includes(code) ? prev.filter(c => c !== code) : [...prev, code]
    );
  };

  const handleToggleModuleAll = (moduleName: string) => {
    const modulePerms = groupedPermissions[moduleName] || [];
    const moduleCodes = modulePerms.map(p => p.code);
    const allSelected = moduleCodes.every(c => selectedPermCodes.includes(c));

    if (allSelected) {
      setSelectedPermCodes(prev => prev.filter(c => !moduleCodes.includes(c)));
    } else {
      setSelectedPermCodes(prev => Array.from(new Set([...prev, ...moduleCodes])));
    }
  };

  const handleCreateRole = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!roleName) {
      showToast('Role name is required', 'error');
      return;
    }

    try {
      await api.post('/roles', {
        name: roleName,
        description: roleDescription,
        permission_codes: selectedPermCodes
      });
      showToast(`Custom role '${roleName}' created successfully!`, 'success');
      setCreateModalOpen(false);
      fetchData();
    } catch (err: any) {
      showToast(err.response?.data?.detail || 'Failed to create role', 'error');
    }
  };

  const handleOpenEdit = (role: Role) => {
    setSelectedRole(role);
    setRoleName(role.name);
    setRoleDescription(role.description || '');
    setSelectedPermCodes(role.permissions.map(p => p.code));
    setEditModalOpen(true);
  };

  const handleUpdateRole = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedRole) return;

    try {
      await api.put(`/roles/${selectedRole.id}`, {
        name: roleName,
        description: roleDescription,
        permission_codes: selectedPermCodes
      });
      showToast(`Role '${roleName}' updated successfully!`, 'success');
      setEditModalOpen(false);
      fetchData();
    } catch (err: any) {
      showToast(err.response?.data?.detail || 'Failed to update role', 'error');
    }
  };

  const handleDeleteRole = async (role: Role) => {
    if (role.is_system_role) {
      showToast('System roles cannot be deleted', 'error');
      return;
    }

    if (!confirm(`Are you sure you want to delete custom role '${role.name}'?`)) return;

    try {
      await api.delete(`/roles/${role.id}`);
      showToast(`Role '${role.name}' deleted.`, 'success');
      fetchData();
    } catch (err: any) {
      showToast(err.response?.data?.detail || 'Failed to delete role', 'error');
    }
  };

  return (
    <ProtectedRoute requiredPermission="ROLE_MANAGEMENT">
      <div className="min-h-screen bg-cream-200 dark:bg-maroon-950 text-charcoal dark:text-cream-100 flex font-sans">
        <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

        <div className="flex-1 flex flex-col min-w-0 lg:pl-64">
          <Header onOpenSidebar={() => setSidebarOpen(true)} title="ERP Role & Permission Configurations" />

          <main className="flex-1 p-3.5 sm:p-6 lg:p-8 space-y-5 sm:space-y-6 max-w-6xl mx-auto w-full min-w-0">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-cream-100 dark:bg-maroon-900 p-4 sm:p-6 rounded-2xl sm:rounded-3xl border border-cream-300 dark:border-maroon-800 shadow-sm">
              <div>
                <h1 className="text-2xl font-extrabold font-serif text-maroon-950 dark:text-cream-100 flex items-center gap-2.5">
                  <ShieldCheck className="w-7 h-7 text-maroon-700 dark:text-cream-200" />
                  <span>Roles &amp; Permission Schemes</span>
                </h1>
                <p className="text-xs text-charcoal-muted dark:text-cream-300/80 font-medium mt-1">
                  Define predefined roles and customize access control policies for kitchen staff, managers, and finance.
                </p>
              </div>

              <button
                onClick={handleOpenCreate}
                className="px-5 py-3 bg-maroon-700 hover:bg-maroon-800 text-cream-100 rounded-2xl text-xs font-bold shadow-md transition flex items-center justify-center gap-2 shrink-0 w-full sm:w-auto"
              >
                <Plus className="w-4 h-4" />
                <span>Create Custom Role</span>
              </button>
            </div>

            {/* Roles Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-5">
              {loading ? (
                <div className="col-span-full py-20 text-center text-xs font-bold text-charcoal-muted">
                  Loading roles...
                </div>
              ) : (
                roles.map((r) => {
                  const isOwner = r.name === 'Super Admin';
                  return (
                    <div
                      key={r.id}
                      className="bg-cream-100 dark:bg-maroon-900 rounded-3xl p-5 border border-cream-300 dark:border-maroon-800 shadow-sm flex flex-col justify-between space-y-4 hover:border-maroon-600/40 transition"
                    >
                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <span className={`px-2 py-0.5 rounded-lg text-[9px] font-extrabold uppercase tracking-wider ${
                            isOwner
                              ? 'bg-amber-100 dark:bg-amber-950 text-amber-800 dark:text-amber-300 border border-amber-300 dark:border-amber-700'
                              : r.is_system_role
                              ? 'bg-maroon-100 dark:bg-maroon-800 text-maroon-900 dark:text-cream-200'
                              : 'bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300'
                          }`}>
                            {r.is_system_role ? 'Built-in Role' : 'Custom Role'}
                          </span>

                          <span className="flex items-center gap-1 text-[10px] font-bold text-charcoal-muted dark:text-cream-300/70">
                            <Users className="w-3.5 h-3.5" />
                            <span>{r.user_count || 0} user(s)</span>
                          </span>
                        </div>

                        <h3 className="text-lg font-black text-maroon-950 dark:text-cream-100 font-serif">
                          {r.name}
                        </h3>
                        <p className="text-xs text-charcoal-muted dark:text-cream-300/80 font-medium line-clamp-2">
                          {r.description || 'No description provided.'}
                        </p>
                      </div>

                      <div className="space-y-3 pt-3 border-t border-cream-300 dark:border-maroon-800">
                        <div className="flex items-center justify-between text-xs">
                          <span className="font-bold text-maroon-900 dark:text-cream-200">
                            {r.permissions.length} permissions
                          </span>
                          <div className="flex items-center gap-1.5">
                            {!isOwner && (
                              <button
                                onClick={() => handleOpenEdit(r)}
                                className="p-1.5 rounded-xl bg-cream-200 dark:bg-maroon-800 hover:bg-cream-300 dark:hover:bg-maroon-700 text-maroon-900 dark:text-cream-100 transition"
                                title="Edit Role Permissions"
                              >
                                <Edit2 className="w-3.5 h-3.5" />
                              </button>
                            )}

                            {!r.is_system_role && (
                              <button
                                onClick={() => handleDeleteRole(r)}
                                className="p-1.5 rounded-xl bg-rose-50 dark:bg-rose-950/50 hover:bg-rose-100 text-rose-700 dark:text-rose-300 transition"
                                title="Delete Custom Role"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </main>
        </div>
      </div>

      {/* CREATE / EDIT ROLE MODAL */}
      {(createModalOpen || editModalOpen) && (
        <div className="fixed inset-0 z-50 bg-maroon-950/70 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-cream-100 dark:bg-maroon-900 rounded-2xl sm:rounded-3xl p-4 sm:p-6 border border-cream-300 dark:border-maroon-800 shadow-2xl max-w-2xl w-full my-4 sm:my-8 max-h-[90dvh] flex flex-col">
            <div className="flex items-center justify-between pb-4 border-b border-cream-300 dark:border-maroon-800">
              <div>
                <h3 className="text-xl font-extrabold font-serif text-maroon-950 dark:text-cream-100 flex items-center gap-2">
                  <ShieldCheck className="w-5 h-5 text-maroon-700 dark:text-cream-200" />
                  <span>{createModalOpen ? 'Create Custom Role' : `Edit Role: ${selectedRole?.name}`}</span>
                </h3>
                <p className="text-xs text-charcoal-muted dark:text-cream-300/80">
                  Select permissions to bundle into this role policy.
                </p>
              </div>
              <button
                onClick={() => {
                  setCreateModalOpen(false);
                  setEditModalOpen(false);
                }}
                className="p-2 min-w-[36px] min-h-[36px] flex items-center justify-center rounded-xl text-charcoal-muted hover:text-maroon-900 dark:hover:text-cream-100 text-lg font-bold"
              >
                ✕
              </button>
            </div>

            <form onSubmit={createModalOpen ? handleCreateRole : handleUpdateRole} className="space-y-4 pt-4 flex-1 overflow-y-auto pr-1 text-xs">
              <div>
                <label className="block font-bold text-maroon-900 dark:text-cream-200 mb-1">Role Name *</label>
                <input
                  type="text"
                  required
                  disabled={editModalOpen && selectedRole?.is_system_role}
                  value={roleName}
                  onChange={(e) => setRoleName(e.target.value)}
                  placeholder="e.g. Quality Assurance Inspector"
                  className="w-full px-3.5 py-2.5 bg-cream-200 dark:bg-maroon-800 border border-cream-300 dark:border-maroon-700 rounded-xl font-medium text-maroon-900 dark:text-cream-100 disabled:opacity-60"
                />
              </div>

              <div>
                <label className="block font-bold text-maroon-900 dark:text-cream-200 mb-1">Role Description</label>
                <textarea
                  rows={2}
                  value={roleDescription}
                  onChange={(e) => setRoleDescription(e.target.value)}
                  placeholder="Briefly describe what duties this role handles..."
                  className="w-full px-3.5 py-2.5 bg-cream-200 dark:bg-maroon-800 border border-cream-300 dark:border-maroon-700 rounded-xl font-medium text-maroon-900 dark:text-cream-100"
                />
              </div>

              {/* Permissions Checkbox Matrix */}
              <div className="pt-3 border-t border-cream-300 dark:border-maroon-800 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-sm text-maroon-950 dark:text-cream-100">
                    Included Module Permissions ({selectedPermCodes.length} selected)
                  </span>
                </div>

                <div className="space-y-2 max-h-72 overflow-y-auto p-1">
                  {Object.entries(groupedPermissions).map(([moduleName, perms]) => {
                    const isExpanded = expandedModules[moduleName] !== false;
                    const moduleCodes = perms.map(p => p.code);
                    const allSelected = moduleCodes.every(c => selectedPermCodes.includes(c));

                    return (
                      <div key={moduleName} className="border border-cream-300 dark:border-maroon-800 rounded-2xl overflow-hidden bg-cream-200/40 dark:bg-maroon-800/30">
                        <div className="px-3.5 py-2 flex items-center justify-between bg-cream-200/80 dark:bg-maroon-800/60">
                          <button
                            type="button"
                            onClick={() => setExpandedModules(prev => ({ ...prev, [moduleName]: !isExpanded }))}
                            className="flex items-center gap-2 font-bold text-maroon-900 dark:text-cream-100 text-xs"
                          >
                            {isExpanded ? <ChevronDown className="w-3.5 h-3.5" /> : <ChevronRight className="w-3.5 h-3.5" />}
                            <span className="uppercase tracking-wider text-[11px]">{moduleName}</span>
                          </button>

                          <button
                            type="button"
                            onClick={() => handleToggleModuleAll(moduleName)}
                            className="text-[10px] font-bold text-maroon-700 dark:text-cream-200 hover:underline"
                          >
                            {allSelected ? 'Deselect All' : 'Select All'}
                          </button>
                        </div>

                        {isExpanded && (
                          <div className="p-3 grid grid-cols-1 sm:grid-cols-2 gap-2">
                            {perms.map((p) => {
                              const checked = selectedPermCodes.includes(p.code);
                              return (
                                <label
                                  key={p.code}
                                  className={`flex items-start gap-2.5 p-2 rounded-xl border cursor-pointer transition ${
                                    checked
                                      ? 'bg-cream-100 dark:bg-maroon-800 border-maroon-600/50 shadow-xs'
                                      : 'border-transparent hover:bg-cream-200/50 dark:hover:bg-maroon-800/40'
                                  }`}
                                >
                                  <input
                                    type="checkbox"
                                    checked={checked}
                                    onChange={() => handleTogglePerm(p.code)}
                                    className="mt-0.5 rounded border-cream-400 text-maroon-700 focus:ring-maroon-500"
                                  />
                                  <div className="min-w-0">
                                    <p className="font-bold text-maroon-900 dark:text-cream-100 leading-tight">{p.name}</p>
                                    <p className="text-[10px] text-charcoal-muted dark:text-cream-300/60 leading-tight mt-0.5 line-clamp-1">{p.description}</p>
                                  </div>
                                </label>
                              );
                            })}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>

              <div className="pt-4 border-t border-cream-300 dark:border-maroon-800 flex flex-col-reverse sm:flex-row items-stretch sm:items-center justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => {
                    setCreateModalOpen(false);
                    setEditModalOpen(false);
                  }}
                  className="px-4 py-2.5 bg-cream-200 dark:bg-maroon-800 text-charcoal dark:text-cream-200 rounded-xl font-bold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-6 py-2.5 bg-maroon-700 hover:bg-maroon-800 text-cream-100 rounded-xl font-bold shadow-md transition"
                >
                  {createModalOpen ? 'Create Role' : 'Save Changes'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </ProtectedRoute>
  );
}
