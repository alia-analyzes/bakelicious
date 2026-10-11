'use client';

import React, { useEffect, useState } from 'react';
import { Sidebar } from '@/components/layout/Sidebar';
import { Header } from '@/components/layout/Header';
import { api } from '@/lib/api';
import { AuditLog } from '@/types';
import { ProtectedRoute } from '@/components/auth/ProtectedRoute';
import { showToast } from '@/lib/toast';
import { ShieldCheck, UserCheck } from 'lucide-react';

export default function AdminAuditLogsPage() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchLogs();
  }, []);

  const fetchLogs = async () => {
    try {
      setLoading(true);
      const res = await api.get('/audit-logs');
      setLogs(res.data);
    } catch (err) {
      showToast('Failed to load audit logs', 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <ProtectedRoute requiredPermission="AUDIT_LOGS_VIEW">
      <div className="min-h-screen bg-cream-200 dark:bg-maroon-950 text-charcoal dark:text-cream-100 flex font-sans">
        <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

        <div className="flex-1 flex flex-col min-w-0 lg:pl-64">
          <Header onOpenSidebar={() => setSidebarOpen(true)} title="Administrative Audit Logs & System Integrity" />

          <main className="flex-1 p-4 sm:p-6 lg:p-8 space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-cream-100 dark:bg-maroon-900 p-5 rounded-3xl border border-cream-300 dark:border-maroon-800 shadow-sm">
              <div>
                <h1 className="text-2xl font-extrabold font-serif text-maroon-950 dark:text-cream-100 flex items-center gap-2">
                  <ShieldCheck className="w-6 h-6 text-maroon-700 dark:text-cream-200" />
                  <span>Security &amp; Audit Logs</span>
                </h1>
                <p className="text-xs text-charcoal-muted dark:text-cream-300/80 font-medium mt-0.5">
                  Immutable record of product creations, price edits, order status updates, and inventory changes.
                </p>
              </div>
            </div>

            <div className="bg-cream-100 dark:bg-maroon-900 rounded-3xl border border-cream-300 dark:border-maroon-800 shadow-sm overflow-hidden">
              {loading ? (
                <div className="py-20 text-center text-xs font-bold text-charcoal-muted">
                  Loading system activity logs...
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse text-xs">
                    <thead>
                      <tr className="border-b border-cream-300 dark:border-maroon-800 text-maroon-900 dark:text-cream-200 font-bold uppercase tracking-wider text-[10px] bg-cream-200/50 dark:bg-maroon-800/40">
                        <th className="py-3.5 px-4">Timestamp</th>
                        <th className="py-3.5 px-4">Action</th>
                        <th className="py-3.5 px-4">Module / Resource</th>
                        <th className="py-3.5 px-4">User</th>
                        <th className="py-3.5 px-4">Details</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-cream-300 dark:divide-maroon-800/50 font-medium">
                      {logs.map((l) => (
                        <tr key={l.id} className="hover:bg-cream-200/40 dark:hover:bg-maroon-800/30 transition">
                          <td className="py-3.5 px-4 font-bold">{new Date(l.created_at).toLocaleString()}</td>
                          <td className="py-3.5 px-4">
                            <span className="px-2.5 py-1 bg-maroon-100 dark:bg-maroon-800 text-maroon-900 dark:text-cream-100 rounded-full font-bold text-[10px] uppercase">
                              {l.action}
                            </span>
                          </td>
                          <td className="py-3.5 px-4 font-bold text-maroon-900 dark:text-cream-200">{l.resource}</td>
                          <td className="py-3.5 px-4 text-charcoal-muted dark:text-cream-300/80">{l.user?.username || 'System Admin'}</td>
                          <td className="py-3.5 px-4 max-w-md font-mono text-[11px] text-charcoal-muted dark:text-cream-300/70 truncate">
                            {JSON.stringify(l.details)}
                          </td>
                        </tr>
                      ))}
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
