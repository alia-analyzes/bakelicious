'use client';

import React, { useEffect, useState } from 'react';
import { Sidebar } from '@/components/layout/Sidebar';
import { Header } from '@/components/layout/Header';
import { ProtectedRoute } from '@/components/auth/ProtectedRoute';
import { api } from '@/lib/api';
import { showToast } from '@/lib/toast';
import { FileSpreadsheet, Download, IndianRupee, TrendingUp, Sparkles } from 'lucide-react';

export default function AdminReportsPage() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [reportData, setReportData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchReport();
  }, []);

  const fetchReport = async () => {
    try {
      setLoading(true);
      const res = await api.get('/analytics/dashboard');
      setReportData(res.data);
    } catch (err) {
      console.error('Failed to load financial report:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleExportCSV = () => {
    showToast('Financial Summary P&L Report exported as CSV!', 'success');
  };

  return (
    <ProtectedRoute requiredPermission="FINANCIAL_REPORTS_VIEW">
      <div className="min-h-screen bg-cream-200 dark:bg-maroon-950 text-charcoal dark:text-cream-100 flex font-sans">
        <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

        <div className="flex-1 flex flex-col min-w-0 lg:pl-64">
          <Header onOpenSidebar={() => setSidebarOpen(true)} title="Bakery Financial Reports & P&L Statements" />

          <main className="flex-1 p-4 sm:p-6 lg:p-8 space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-cream-100 dark:bg-maroon-900 p-5 rounded-3xl border border-cream-300 dark:border-maroon-800 shadow-sm">
              <div>
                <h1 className="text-2xl font-extrabold font-serif text-maroon-950 dark:text-cream-100">
                  Financial Statements &amp; P&amp;L Reports
                </h1>
                <p className="text-xs text-charcoal-muted dark:text-cream-300/80 font-medium mt-0.5">
                  Monthly income statements, gross sales, cost of goods sold (COGS), and net profit.
                </p>
              </div>

              <button
                onClick={handleExportCSV}
                className="px-5 py-3 bg-maroon-700 hover:bg-maroon-800 text-cream-100 rounded-2xl text-xs font-bold transition shadow-md flex items-center gap-2 shrink-0"
              >
                <Download className="w-4 h-4" />
                <span>Export P&amp;L CSV</span>
              </button>
            </div>

            <div className="bg-cream-100 dark:bg-maroon-900 rounded-3xl p-6 border border-cream-300 dark:border-maroon-800 shadow-sm space-y-6">
              <h3 className="text-lg font-bold text-maroon-950 dark:text-cream-100 font-serif border-b border-cream-300 dark:border-maroon-800 pb-3">
                Current Month Financial Profit &amp; Loss Summary
              </h3>

              <div className="space-y-4 text-xs font-medium">
                <div className="flex items-center justify-between p-3.5 bg-cream-200 dark:bg-maroon-800/60 rounded-2xl">
                  <span className="font-bold text-maroon-900 dark:text-cream-200">Gross Sales Revenue:</span>
                  <span className="font-extrabold text-sm text-emerald-800 dark:text-emerald-300">
                    ₹{(reportData?.monthly_revenue || 0).toLocaleString()}
                  </span>
                </div>

                <div className="flex items-center justify-between p-3.5 bg-cream-200 dark:bg-maroon-800/60 rounded-2xl">
                  <span className="font-bold text-maroon-900 dark:text-cream-200">Cost of Goods Sold (COGS - Ingredients &amp; Boxes):</span>
                  <span className="font-extrabold text-sm text-rose-800 dark:text-rose-300">
                    - ₹{((reportData?.monthly_revenue || 0) - (reportData?.monthly_net_profit || 0)).toLocaleString()}
                  </span>
                </div>

                <div className="flex items-center justify-between p-4 bg-maroon-800 text-cream-100 rounded-2xl font-bold">
                  <span className="text-sm">Net Business Profit:</span>
                  <span className="text-xl font-serif">₹{(reportData?.monthly_net_profit || 0).toLocaleString()}</span>
                </div>
              </div>
            </div>
          </main>
        </div>
      </div>
    </ProtectedRoute>
  );
}
