'use client';

import React, { useEffect, useState } from 'react';
import { Sidebar } from '@/components/layout/Sidebar';
import { Header } from '@/components/layout/Header';
import { api } from '@/lib/api';
import { AnalyticsOverview } from '@/types';
import { ProtectedRoute } from '@/components/auth/ProtectedRoute';
import { showToast } from '@/lib/toast';
import {
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  ResponsiveContainer,
  Legend
} from 'recharts';
import { Download, FileText, BarChart3, TrendingUp, IndianRupee } from 'lucide-react';

export default function AdminAnalyticsPage() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [period, setPeriod] = useState('this_month');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [data, setData] = useState<AnalyticsOverview | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchAnalyticsData();
  }, [period]);

  const fetchAnalyticsData = async () => {
    try {
      setLoading(true);
      let url = `/analytics/overview?period=${period}`;
      if (period === 'custom' && startDate && endDate) {
        url += `&start_date=${startDate}&end_date=${endDate}`;
      }
      const res = await api.get(url);
      setData(res.data);
    } catch (err) {
      showToast('Failed to load analytics data', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleApplyCustomFilter = () => {
    if (!startDate || !endDate) {
      showToast('Please select both start and end dates', 'error');
      return;
    }
    fetchAnalyticsData();
  };

  const COLORS = ['#7A1F3D', '#9E2A2B', '#E07A5F', '#3D405B', '#81B29A', '#F2CC8F'];

  return (
    <ProtectedRoute requiredAnyPermission={['ANALYTICS_VIEW', 'REVENUE_VIEW']}>
      <div className="min-h-screen bg-cream-200 dark:bg-maroon-950 text-charcoal dark:text-cream-100 flex font-sans">
        <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

        <div className="flex-1 flex flex-col min-w-0 lg:pl-64">
          <Header onOpenSidebar={() => setSidebarOpen(true)} title="Bakery Analytics & Financial Insights" />

          <main className="flex-1 p-3.5 sm:p-6 lg:p-8 space-y-5 sm:space-y-6 min-w-0">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-cream-100 dark:bg-maroon-900 p-4 sm:p-5 rounded-2xl sm:rounded-3xl border border-cream-300 dark:border-maroon-800 shadow-sm">
              <div>
                <h1 className="text-xl sm:text-2xl font-extrabold font-serif text-maroon-950 dark:text-cream-100">
                  Business Analytics &amp; Reports
                </h1>
                <p className="text-xs text-charcoal-muted dark:text-cream-300/80 font-medium mt-0.5">
                  Revenue, profit margins, top-selling cakes, and sales performance charts.
                </p>
              </div>

              {/* Period Selector */}
              <div className="flex items-center gap-1.5 sm:gap-2 bg-cream-200 dark:bg-maroon-800 p-1.5 rounded-2xl border border-cream-300 dark:border-maroon-700 overflow-x-auto max-w-full">
                <button
                  onClick={() => setPeriod('today')}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition ${
                    period === 'today' ? 'bg-maroon-700 text-cream-100' : 'text-maroon-900 dark:text-cream-200'
                  }`}
                >
                  Today
                </button>
                <button
                  onClick={() => setPeriod('this_week')}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition ${
                    period === 'this_week' ? 'bg-maroon-700 text-cream-100' : 'text-maroon-900 dark:text-cream-200'
                  }`}
                >
                  This Week
                </button>
                <button
                  onClick={() => setPeriod('this_month')}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition ${
                    period === 'this_month' ? 'bg-maroon-700 text-cream-100' : 'text-maroon-900 dark:text-cream-200'
                  }`}
                >
                  This Month
                </button>
              </div>
            </div>

            {/* Financial Overview Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5 sm:gap-5">
              <div className="bg-cream-100 dark:bg-maroon-900 p-4 sm:p-5 rounded-2xl sm:rounded-3xl border border-cream-300 dark:border-maroon-800 shadow-sm space-y-2">
                <span className="text-xs font-bold text-charcoal-muted dark:text-cream-300 uppercase">Total Revenue</span>
                <p className="text-2xl sm:text-3xl font-extrabold text-maroon-950 dark:text-cream-100 font-serif truncate">
                  ₹{(data?.total_revenue || 0).toLocaleString()}
                </p>
              </div>

              <div className="bg-cream-100 dark:bg-maroon-900 p-4 sm:p-5 rounded-2xl sm:rounded-3xl border border-cream-300 dark:border-maroon-800 shadow-sm space-y-2">
                <span className="text-xs font-bold text-charcoal-muted dark:text-cream-300 uppercase">Estimated Profit</span>
                <p className="text-2xl sm:text-3xl font-extrabold text-emerald-800 dark:text-emerald-300 font-serif truncate">
                  ₹{(data?.total_profit || 0).toLocaleString()}
                </p>
              </div>

              <div className="bg-cream-100 dark:bg-maroon-900 p-4 sm:p-5 rounded-2xl sm:rounded-3xl border border-cream-300 dark:border-maroon-800 shadow-sm space-y-2">
                <span className="text-xs font-bold text-charcoal-muted dark:text-cream-300 uppercase">Profit Margin</span>
                <p className="text-2xl sm:text-3xl font-extrabold text-maroon-950 dark:text-cream-100 font-serif truncate">
                  {(data?.profit_margin || 0)}%
                </p>
              </div>

              <div className="bg-cream-100 dark:bg-maroon-900 p-4 sm:p-5 rounded-2xl sm:rounded-3xl border border-cream-300 dark:border-maroon-800 shadow-sm space-y-2">
                <span className="text-xs font-bold text-charcoal-muted dark:text-cream-300 uppercase">Total Orders</span>
                <p className="text-2xl sm:text-3xl font-extrabold text-maroon-950 dark:text-cream-100 font-serif truncate">
                  {data?.orders_count || 0}
                </p>
              </div>
            </div>

            {/* Charts Section */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 sm:gap-8">
              <div className="lg:col-span-8 bg-cream-100 dark:bg-maroon-900 p-4 sm:p-6 rounded-2xl sm:rounded-3xl border border-cream-300 dark:border-maroon-800 shadow-sm space-y-4">
                <h3 className="text-lg font-bold text-maroon-950 dark:text-cream-100 font-serif">
                  Daily Revenue Trajectory
                </h3>
                <div className="h-64 w-full pt-4">
                  {data?.trend && data.trend.length > 0 ? (
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={data.trend}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#F3E6D5" opacity={0.5} />
                        <XAxis dataKey="date" stroke="#806F6F" fontSize={10} />
                        <YAxis stroke="#806F6F" fontSize={10} />
                        <Tooltip />
                        <Line type="monotone" dataKey="revenue" stroke="#7A1F3D" strokeWidth={3} dot={{ r: 4 }} />
                      </LineChart>
                    </ResponsiveContainer>
                  ) : (
                    <div className="h-full flex items-center justify-center text-xs text-charcoal-muted">
                      No sales data available for this range.
                    </div>
                  )}
                </div>
              </div>

              <div className="lg:col-span-4 bg-cream-100 dark:bg-maroon-900 p-4 sm:p-6 rounded-2xl sm:rounded-3xl border border-cream-300 dark:border-maroon-800 shadow-sm space-y-4">
                <h3 className="text-lg font-bold text-maroon-950 dark:text-cream-100 font-serif">
                  Top Best-Selling Cakes
                </h3>
                <div className="space-y-3">
                  {data?.top_products && data.top_products.length > 0 ? (
                    data.top_products.map((tp, idx) => (
                      <div key={idx} className="flex items-center justify-between gap-2 p-3 bg-cream-200 dark:bg-maroon-800/60 rounded-2xl">
                        <span className="font-bold text-xs text-maroon-900 dark:text-cream-100 truncate">{tp.name}</span>
                        <span className="text-xs font-extrabold text-emerald-800 dark:text-emerald-300 shrink-0">₹{tp.revenue} ({tp.sales_count} sales)</span>
                      </div>
                    ))
                  ) : (
                    <div className="text-xs text-charcoal-muted py-8 text-center">Top products show on order activity</div>
                  )}
                </div>
              </div>
            </div>
          </main>
        </div>
      </div>
    </ProtectedRoute>
  );
}
