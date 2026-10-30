'use client';

import React, { useEffect, useState } from 'react';
import { Sidebar } from '@/components/layout/Sidebar';
import { Header } from '@/components/layout/Header';
import { api } from '@/lib/api';
import { Production, BakerSummary } from '@/types';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { ProtectedRoute } from '@/components/auth/ProtectedRoute';
import { showToast } from '@/lib/toast';
import {
  ChefHat,
  CheckCircle2,
  Clock,
  UserCheck,
  AlertTriangle,
  Flame,
  Sparkles,
  Calendar,
  Filter,
  ArrowRight,
  Info
} from 'lucide-react';
import { getStoredUser, hasPermission, isBaker, isSuperAdmin } from '@/lib/auth';

export default function AdminProductionPage() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [tasks, setTasks] = useState<Production[]>([]);
  const [bakers, setBakers] = useState<BakerSummary[]>([]);
  const [loading, setLoading] = useState(true);

  // Filters
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [filterBakerId, setFilterBakerId] = useState<string>('all');
  const [filterPriority, setFilterPriority] = useState<string>('all');

  const currentUser = getStoredUser();
  const userIsBaker = isBaker();
  const canAssign = isSuperAdmin() || hasPermission('PRODUCTION_ASSIGN');

  const STAGES = ['Not Started', 'Preparing', 'Baking', 'Decorating', 'Quality Check', 'Ready', 'Completed'];
  const PRIORITIES = ['Normal', 'High', 'Urgent'];

  useEffect(() => {
    fetchInitialData();
  }, []);

  const fetchInitialData = async () => {
    try {
      setLoading(true);
      const [tasksRes, bakersRes] = await Promise.all([
        api.get('/production'),
        api.get('/users/bakers').catch(() => ({ data: [] }))
      ]);
      setTasks(tasksRes.data);
      setBakers(bakersRes.data);
    } catch (err) {
      showToast('Failed to load production tasks', 'error');
    } finally {
      setLoading(false);
    }
  };

  const fetchTasksOnly = async () => {
    try {
      const res = await api.get('/production');
      setTasks(res.data);
    } catch (err) {
      console.error('Failed to refresh tasks:', err);
    }
  };

  const handleUpdateTaskStatus = async (taskId: number, newStatus: string) => {
    try {
      await api.put(`/production/${taskId}`, { status: newStatus });
      showToast(`Baking stage updated to ${newStatus}`, 'success');
      fetchTasksOnly();
    } catch (err: any) {
      showToast(err.response?.data?.detail || 'Failed to update baking stage', 'error');
    }
  };

  const handleAssignBaker = async (taskId: number, bakerId: string) => {
    try {
      await api.put(`/production/${taskId}/assign`, {
        assigned_to_id: bakerId ? Number(bakerId) : null
      });
      showToast('Baker assignment updated', 'success');
      fetchTasksOnly();
    } catch (err: any) {
      showToast(err.response?.data?.detail || 'Failed to assign baker', 'error');
    }
  };

  const handleUpdatePriority = async (taskId: number, priority: string) => {
    try {
      await api.put(`/production/${taskId}/assign`, {
        priority
      });
      showToast(`Task priority set to ${priority}`, 'success');
      fetchTasksOnly();
    } catch (err: any) {
      showToast(err.response?.data?.detail || 'Failed to set priority', 'error');
    }
  };

  const filteredTasks = tasks.filter((t) => {
    if (filterStatus !== 'all' && t.status !== filterStatus) return false;
    if (filterBakerId !== 'all') {
      if (filterBakerId === 'unassigned' && t.assigned_to_id !== null) return false;
      if (filterBakerId !== 'unassigned' && String(t.assigned_to_id) !== filterBakerId) return false;
    }
    if (filterPriority !== 'all' && t.priority !== filterPriority) return false;
    return true;
  });

  // Calculate statistics
  const today = new Date().toDateString();
  const todaysTasks = tasks.filter(t => new Date(t.production_date).toDateString() === today || new Date(t.delivery_date).toDateString() === today);
  const inProgressTasks = tasks.filter(t => ['Preparing', 'Baking', 'Decorating', 'Quality Check'].includes(t.status));
  const readyTasks = tasks.filter(t => t.status === 'Ready');

  return (
    <ProtectedRoute requiredAnyPermission={['PRODUCTION_VIEW_ALL', 'PRODUCTION_VIEW_OWN', 'PRODUCTION_STATUS_UPDATE']}>
      <div className="min-h-screen bg-cream-200 dark:bg-maroon-950 text-charcoal dark:text-cream-100 flex font-sans">
        <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

        <div className="flex-1 flex flex-col min-w-0 lg:pl-64">
          <Header onOpenSidebar={() => setSidebarOpen(true)} title={userIsBaker ? "Baker Kitchen Workspace" : "Kitchen Baking Queue & Assignments"} />

          <main className="flex-1 p-3.5 sm:p-6 lg:p-8 space-y-5 sm:space-y-6 max-w-7xl mx-auto w-full min-w-0">
            {/* Header banner */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-cream-100 dark:bg-maroon-900 p-6 rounded-3xl border border-cream-300 dark:border-maroon-800 shadow-sm">
              <div>
                <h1 className="text-2xl font-extrabold font-serif text-maroon-950 dark:text-cream-100 flex items-center gap-2.5">
                  <ChefHat className="w-7 h-7 text-maroon-700 dark:text-cream-200" />
                  <span>{userIsBaker ? `Baker Workspace: ${currentUser?.full_name || currentUser?.username}` : 'Kitchen Baking Queue'}</span>
                </h1>
                <p className="text-xs text-charcoal-muted dark:text-cream-300/80 font-medium mt-1">
                  {userIsBaker
                    ? "Manage your assigned cake preparation, baking, decorating, and quality check stages."
                    : "Track live baking stages, assign tasks to staff bakers, and ensure on-time delivery schedules."}
                </p>
              </div>
            </div>

            {/* Baker Dashboard Summary Cards */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 sm:gap-4">
              <div className="bg-cream-100 dark:bg-maroon-900 p-4 rounded-2xl border border-cream-300 dark:border-maroon-800 shadow-xs">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-bold text-charcoal-muted dark:text-cream-300/70 uppercase tracking-wider">
                    {userIsBaker ? "My Tasks Today" : "Today's Queue"}
                  </span>
                  <Calendar className="w-4 h-4 text-maroon-600 dark:text-cream-300" />
                </div>
                <p className="text-2xl font-black text-maroon-950 dark:text-cream-100 mt-1">{todaysTasks.length}</p>
              </div>

              <div className="bg-cream-100 dark:bg-maroon-900 p-4 rounded-2xl border border-cream-300 dark:border-maroon-800 shadow-xs">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-bold text-charcoal-muted dark:text-cream-300/70 uppercase tracking-wider">In Progress</span>
                  <Flame className="w-4 h-4 text-amber-500" />
                </div>
                <p className="text-2xl font-black text-amber-600 dark:text-amber-400 mt-1">{inProgressTasks.length}</p>
              </div>

              <div className="bg-cream-100 dark:bg-maroon-900 p-4 rounded-2xl border border-cream-300 dark:border-maroon-800 shadow-xs">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-bold text-charcoal-muted dark:text-cream-300/70 uppercase tracking-wider">Ready for Pickup</span>
                  <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                </div>
                <p className="text-2xl font-black text-emerald-600 dark:text-emerald-400 mt-1">{readyTasks.length}</p>
              </div>

              <div className="bg-cream-100 dark:bg-maroon-900 p-4 rounded-2xl border border-cream-300 dark:border-maroon-800 shadow-xs">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-bold text-charcoal-muted dark:text-cream-300/70 uppercase tracking-wider">Total Active</span>
                  <Clock className="w-4 h-4 text-charcoal-muted dark:text-cream-300" />
                </div>
                <p className="text-2xl font-black text-maroon-700 dark:text-cream-200 mt-1">
                  {tasks.filter(t => t.status !== 'Completed').length}
                </p>
              </div>
            </div>

            {/* Filter Toolbar */}
            <div className="bg-cream-100 dark:bg-maroon-900 p-4 rounded-3xl border border-cream-300 dark:border-maroon-800 shadow-sm flex flex-wrap items-center gap-3">
              {/* Stage Filter Buttons */}
              <div className="flex items-center gap-1.5 overflow-x-auto w-full pb-1 sm:pb-0">
                <button
                  onClick={() => setFilterStatus('all')}
                  className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition shrink-0 ${
                    filterStatus === 'all'
                      ? 'bg-maroon-700 text-cream-100 shadow-xs'
                      : 'bg-cream-200 dark:bg-maroon-800 text-charcoal dark:text-cream-200'
                  }`}
                >
                  All ({tasks.length})
                </button>
                {STAGES.map((st) => (
                  <button
                    key={st}
                    onClick={() => setFilterStatus(st)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold transition shrink-0 ${
                      filterStatus === st
                        ? 'bg-maroon-700 text-cream-100 shadow-xs'
                        : 'bg-cream-200 dark:bg-maroon-800 text-charcoal dark:text-cream-200'
                    }`}
                  >
                    {st}
                  </button>
                ))}
              </div>

              {/* Baker & Priority Selectors (for managers) */}
              {!userIsBaker && (
                <div className="flex items-center gap-2 pt-2 border-t border-cream-300 dark:border-maroon-800 w-full sm:w-auto sm:border-0 sm:pt-0">
                  <select
                    value={filterBakerId}
                    onChange={(e) => setFilterBakerId(e.target.value)}
                    className="px-3 py-1.5 bg-cream-200 dark:bg-maroon-800 border border-cream-300 dark:border-maroon-700 rounded-xl text-xs font-bold text-maroon-900 dark:text-cream-100 focus:outline-none"
                  >
                    <option value="all">All Bakers</option>
                    <option value="unassigned">Unassigned</option>
                    {bakers.map((b) => (
                      <option key={b.id} value={String(b.id)}>
                        {b.full_name || b.username} ({b.active_tasks_count} active)
                      </option>
                    ))}
                  </select>

                  <select
                    value={filterPriority}
                    onChange={(e) => setFilterPriority(e.target.value)}
                    className="px-3 py-1.5 bg-cream-200 dark:bg-maroon-800 border border-cream-300 dark:border-maroon-700 rounded-xl text-xs font-bold text-maroon-900 dark:text-cream-100 focus:outline-none"
                  >
                    <option value="all">All Priorities</option>
                    <option value="Normal">Normal</option>
                    <option value="High">High</option>
                    <option value="Urgent">Urgent 🔥</option>
                  </select>
                </div>
              )}
            </div>

            {/* Production Tasks List / Table */}
            <div className="bg-cream-100 dark:bg-maroon-900 rounded-3xl border border-cream-300 dark:border-maroon-800 shadow-sm overflow-hidden">
              {loading ? (
                <div className="py-20 text-center text-xs font-bold text-charcoal-muted">
                  Loading kitchen baking schedule...
                </div>
              ) : filteredTasks.length === 0 ? (
                <div className="py-20 text-center text-xs font-bold text-charcoal-muted">
                  No production tasks found.
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse text-xs min-w-[700px]">
                    <thead>
                      <tr className="border-b border-cream-300 dark:border-maroon-800 text-maroon-900 dark:text-cream-200 font-bold uppercase tracking-wider text-[10px] bg-cream-200/50 dark:bg-maroon-800/40">
                        <th className="py-3.5 px-4">Task / Priority</th>
                        <th className="py-3.5 px-4">Order Items &amp; Notes</th>
                        <th className="py-3.5 px-4">Delivery Deadline</th>
                        <th className="py-3.5 px-4">Assigned Baker</th>
                        <th className="py-3.5 px-4">Stage</th>
                        <th className="py-3.5 px-4 text-right">Advance Stage</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-cream-300 dark:divide-maroon-800/50 font-medium">
                      {filteredTasks.map((t) => {
                        const isHighOrUrgent = t.priority === 'High' || t.priority === 'Urgent';
                        const currentStageIdx = STAGES.indexOf(t.status);
                        const nextStage = currentStageIdx >= 0 && currentStageIdx < STAGES.length - 1 ? STAGES[currentStageIdx + 1] : null;

                        return (
                          <tr key={t.id} className="hover:bg-cream-200/40 dark:hover:bg-maroon-800/30 transition">
                            {/* Task ID & Priority */}
                            <td className="py-3.5 px-4">
                              <div className="space-y-1">
                                <span className="font-bold text-maroon-950 dark:text-cream-100 block">
                                  #TASK-{t.id}
                                </span>
                                {canAssign ? (
                                  <select
                                    value={t.priority || 'Normal'}
                                    onChange={(e) => handleUpdatePriority(t.id, e.target.value)}
                                    className={`px-2 py-0.5 rounded-lg text-[9px] font-extrabold uppercase tracking-wide border ${
                                      t.priority === 'Urgent'
                                        ? 'bg-rose-100 dark:bg-rose-950 text-rose-800 dark:text-rose-200 border-rose-300'
                                        : t.priority === 'High'
                                        ? 'bg-amber-100 dark:bg-amber-950 text-amber-800 dark:text-amber-200 border-amber-300'
                                        : 'bg-cream-200 dark:bg-maroon-800 text-charcoal-muted border-cream-300 dark:border-maroon-700'
                                    }`}
                                  >
                                    {PRIORITIES.map(p => (
                                      <option key={p} value={p}>{p}</option>
                                    ))}
                                  </select>
                                ) : (
                                  <span className={`inline-block px-2 py-0.5 rounded-lg text-[9px] font-extrabold uppercase tracking-wide border ${
                                    t.priority === 'Urgent'
                                      ? 'bg-rose-100 dark:bg-rose-950 text-rose-800 dark:text-rose-200 border-rose-300'
                                      : t.priority === 'High'
                                      ? 'bg-amber-100 dark:bg-amber-950 text-amber-800 dark:text-amber-200 border-amber-300'
                                      : 'bg-cream-200 dark:bg-maroon-800 text-charcoal-muted border-cream-300 dark:border-maroon-700'
                                  }`}>
                                    {t.priority || 'Normal'}
                                  </span>
                                )}
                              </div>
                            </td>

                            {/* Order Details & Notes */}
                            <td className="py-3.5 px-4 max-w-xs">
                              <div className="space-y-0.5">
                                <span className="font-bold text-maroon-900 dark:text-cream-100 block">
                                  {t.order?.order_number || 'Order'}
                                </span>
                                <div className="text-[11px] text-charcoal dark:text-cream-200">
                                  {t.order?.items && t.order.items.map((it, idx) => (
                                    <span key={idx} className="block">
                                      • {it.quantity}x {it.product?.name || 'Cake'} ({it.size_override || it.product?.size || '1 Pound'})
                                    </span>
                                  ))}
                                </div>
                                {(t.order?.special_instructions || t.notes) && (
                                  <p className="text-[10px] text-amber-900 dark:text-amber-200 bg-amber-50 dark:bg-amber-950/80 px-2.5 py-1.5 rounded-lg mt-1 border border-amber-300 dark:border-amber-700 font-medium">
                                    <strong>🎨 Customization:</strong> {t.order?.special_instructions || t.notes}
                                  </p>
                                )}
                              </div>
                            </td>

                            {/* Deadline */}
                            <td className="py-3.5 px-4">
                              <span className="font-bold block text-maroon-900 dark:text-cream-100">
                                {new Date(t.delivery_date).toLocaleDateString()}
                              </span>
                              <span className="text-[10px] text-charcoal-muted dark:text-cream-300/70">
                                {t.order?.delivery_time || '12:00 PM'}
                              </span>
                            </td>

                            {/* Assigned Baker */}
                            <td className="py-3.5 px-4">
                              {canAssign ? (
                                <select
                                  value={t.assigned_to_id ? String(t.assigned_to_id) : ''}
                                  onChange={(e) => handleAssignBaker(t.id, e.target.value)}
                                  className="px-2.5 py-1.5 bg-cream-200 dark:bg-maroon-800 border border-cream-300 dark:border-maroon-700 rounded-xl text-xs font-bold text-maroon-900 dark:text-cream-100 focus:outline-none max-w-[150px]"
                                >
                                  <option value="">Unassigned</option>
                                  {bakers.map((b) => (
                                    <option key={b.id} value={String(b.id)}>
                                      {b.full_name || b.username}
                                    </option>
                                  ))}
                                </select>
                              ) : (
                                <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-xl text-xs font-bold ${
                                  t.assigned_baker
                                    ? 'bg-cream-200 dark:bg-maroon-800 text-maroon-900 dark:text-cream-100 border border-cream-300 dark:border-maroon-700'
                                    : 'bg-rose-50 dark:bg-rose-950 text-rose-700 dark:text-rose-300'
                                }`}>
                                  <UserCheck className="w-3.5 h-3.5" />
                                  {t.assigned_baker?.full_name || t.assigned_baker?.username || 'Unassigned'}
                                </span>
                              )}
                            </td>

                            {/* Current Stage */}
                            <td className="py-3.5 px-4">
                              <StatusBadge status={t.status} />
                            </td>

                            {/* Action: Next Stage Button or Select */}
                            <td className="py-3.5 px-4 text-right">
                              <div className="flex items-center justify-end gap-2">
                                {nextStage && nextStage !== 'Completed' && (
                                  <button
                                    onClick={() => handleUpdateTaskStatus(t.id, nextStage)}
                                    className="px-3 py-1.5 bg-maroon-700 hover:bg-maroon-800 text-cream-100 rounded-xl text-xs font-bold shadow-xs transition flex items-center gap-1 shrink-0"
                                  >
                                    <span>{nextStage}</span>
                                    <ArrowRight className="w-3 h-3" />
                                  </button>
                                )}

                                <select
                                  value={t.status}
                                  onChange={(e) => handleUpdateTaskStatus(t.id, e.target.value)}
                                  className="px-2 py-1.5 bg-cream-200 dark:bg-maroon-800 border border-cream-300 dark:border-maroon-700 rounded-xl text-xs font-bold text-maroon-900 dark:text-cream-100 focus:outline-none"
                                >
                                  {STAGES.map((st) => (
                                    <option key={st} value={st}>{st}</option>
                                  ))}
                                </select>
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
    </ProtectedRoute>
  );
}
