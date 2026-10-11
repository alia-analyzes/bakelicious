'use client';

import React, { useEffect, useState } from 'react';
import { Sidebar } from '@/components/layout/Sidebar';
import { Header } from '@/components/layout/Header';
import { api } from '@/lib/api';
import { DashboardSummary, Order, Production } from '@/types';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { ProtectedRoute } from '@/components/auth/ProtectedRoute';
import {
  ShoppingBag,
  IndianRupee,
  Clock,
  AlertTriangle,
  TrendingUp,
  ChefHat,
  ArrowUpRight,
  Sparkles,
  Calendar,
  DollarSign
} from 'lucide-react';
import Link from 'next/link';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid
} from 'recharts';

export default function AdminDashboardPage() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [summary, setSummary] = useState<DashboardSummary | null>(null);
  const [todaysOrders, setTodaysOrders] = useState<Order[]>([]);
  const [productionTasks, setProductionTasks] = useState<Production[]>([]);
  const [chartData, setChartData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      const [sumRes, ordersRes, prodRes, overviewRes] = await Promise.allSettled([
        api.get('/analytics/dashboard'),
        api.get('/orders'),
        api.get('/production'),
        api.get('/analytics/overview?period=this_month')
      ]);

      if (sumRes.status === 'fulfilled') setSummary(sumRes.value.data);
      if (ordersRes.status === 'fulfilled') setTodaysOrders(ordersRes.value.data.slice(0, 5));
      if (prodRes.status === 'fulfilled') setProductionTasks(prodRes.value.data.slice(0, 5));
      if (overviewRes.status === 'fulfilled') setChartData(overviewRes.value.data.trend || []);
    } catch (err) {
      console.error('Failed to load dashboard:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <ProtectedRoute requiredAnyPermission={['ANALYTICS_VIEW', 'REVENUE_VIEW', 'ORDERS_VIEW']}>
      <div className="min-h-screen bg-cream-200 dark:bg-maroon-950 text-charcoal dark:text-cream-100 flex font-sans">
        <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

        <div className="flex-1 flex flex-col min-w-0 lg:pl-64">
          <Header onOpenSidebar={() => setSidebarOpen(true)} title="Bakery Business ERP Dashboard" />

          <main className="flex-1 p-4 sm:p-6 lg:p-8 space-y-8">
            {/* Top Overview Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
              
              {/* Today's Orders */}
              <div className="bg-cream-100 dark:bg-maroon-900 rounded-3xl p-5 border border-cream-300 dark:border-maroon-800 shadow-sm space-y-3 hover:shadow-md transition">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-extrabold text-charcoal-muted dark:text-cream-300 uppercase tracking-widest">
                    Today&apos;s Orders
                  </span>
                  <div className="w-10 h-10 rounded-2xl bg-blue-100 dark:bg-blue-950 text-blue-800 dark:text-blue-300 flex items-center justify-center shadow-xs">
                    <ShoppingBag className="w-5 h-5" />
                  </div>
                </div>
                <div>
                  <div className="text-3xl sm:text-4xl font-black text-maroon-950 dark:text-cream-100 font-sans tracking-tight">
                    {summary?.today_orders_count ?? summary?.todays_orders_count ?? 0}
                  </div>
                  <p className="text-xs text-charcoal-muted dark:text-cream-300/80 font-semibold mt-1">
                    Orders received today
                  </p>
                </div>
              </div>

              {/* Today's Revenue */}
              <div className="bg-cream-100 dark:bg-maroon-900 rounded-3xl p-5 border border-cream-300 dark:border-maroon-800 shadow-sm space-y-3 hover:shadow-md transition">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-extrabold text-charcoal-muted dark:text-cream-300 uppercase tracking-widest">
                    Today&apos;s Revenue
                  </span>
                  <div className="w-10 h-10 rounded-2xl bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300 flex items-center justify-center shadow-xs">
                    <IndianRupee className="w-5 h-5" />
                  </div>
                </div>
                <div>
                  <div className="text-3xl sm:text-4xl font-black text-maroon-950 dark:text-cream-100 font-sans tracking-tight">
                    ₹{(summary?.today_revenue ?? summary?.todays_revenue ?? 0).toLocaleString('en-IN')}
                  </div>
                  <p className="text-xs text-emerald-800 dark:text-emerald-400 font-bold mt-1 flex items-center gap-1">
                    <TrendingUp className="w-3.5 h-3.5" />
                    <span>Real-time earnings</span>
                  </p>
                </div>
              </div>

              {/* Monthly Revenue */}
              <div className="bg-cream-100 dark:bg-maroon-900 rounded-3xl p-5 border border-cream-300 dark:border-maroon-800 shadow-sm space-y-3 hover:shadow-md transition">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-extrabold text-charcoal-muted dark:text-cream-300 uppercase tracking-widest">
                    Monthly Revenue
                  </span>
                  <div className="w-10 h-10 rounded-2xl bg-amber-100 dark:bg-amber-950 text-amber-800 dark:text-amber-300 flex items-center justify-center shadow-xs">
                    <TrendingUp className="w-5 h-5" />
                  </div>
                </div>
                <div>
                  <div className="text-3xl sm:text-4xl font-black text-maroon-950 dark:text-cream-100 font-sans tracking-tight">
                    ₹{(summary?.monthly_revenue || 0).toLocaleString('en-IN')}
                  </div>
                  <p className="text-xs text-charcoal-muted dark:text-cream-300/80 font-semibold mt-1">
                    This month total sales
                  </p>
                </div>
              </div>

              {/* Monthly Net Profit */}
              <div className="bg-cream-100 dark:bg-maroon-900 rounded-3xl p-5 border border-cream-300 dark:border-maroon-800 shadow-sm space-y-3 hover:shadow-md transition">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-extrabold text-charcoal-muted dark:text-cream-300 uppercase tracking-widest">
                    Monthly Net Profit
                  </span>
                  <div className="w-10 h-10 rounded-2xl bg-purple-100 dark:bg-purple-950 text-purple-800 dark:text-purple-300 flex items-center justify-center shadow-xs">
                    <Sparkles className="w-5 h-5" />
                  </div>
                </div>
                <div>
                  <div className="text-3xl sm:text-4xl font-black text-maroon-950 dark:text-cream-100 font-sans tracking-tight">
                    ₹{(summary?.monthly_net_profit ?? summary?.monthly_profit ?? summary?.net_profit ?? 0).toLocaleString('en-IN')}
                  </div>
                  <p className="text-xs text-purple-800 dark:text-purple-300 font-bold mt-1">
                    Margin: {(summary?.monthly_profit_margin || 0)}%
                  </p>
                </div>
              </div>

            </div>

            {/* Middle Section: Chart & Operational Queues */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
              
              {/* Revenue & Profit Trend Chart */}
              <div className="lg:col-span-8 bg-cream-100 dark:bg-maroon-900 rounded-3xl p-6 border border-cream-300 dark:border-maroon-800 shadow-sm space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-lg font-bold text-maroon-950 dark:text-cream-100 font-serif">
                      Revenue Trend Overview
                    </h3>
                    <p className="text-xs text-charcoal-muted dark:text-cream-300/80 font-medium">
                      Daily income trajectory for the current month.
                    </p>
                  </div>
                  <Link
                    href="/admin/analytics"
                    className="text-xs font-bold text-maroon-700 dark:text-cream-200 hover:underline flex items-center gap-1"
                  >
                    <span>View Analytics</span>
                    <ArrowUpRight className="w-3.5 h-3.5" />
                  </Link>
                </div>

                <div className="h-64 w-full pt-4">
                  {chartData.length > 0 ? (
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart data={chartData}>
                        <defs>
                          <linearGradient id="colorRev" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#7A1F3D" stopOpacity={0.8}/>
                            <stop offset="95%" stopColor="#7A1F3D" stopOpacity={0}/>
                          </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" stroke="#F3E6D5" opacity={0.5} />
                        <XAxis dataKey="date" stroke="#806F6F" fontSize={10} />
                        <YAxis stroke="#806F6F" fontSize={10} />
                        <Tooltip />
                        <Area type="monotone" dataKey="revenue" stroke="#7A1F3D" fillOpacity={1} fill="url(#colorRev)" />
                      </AreaChart>
                    </ResponsiveContainer>
                  ) : (
                    <div className="h-full flex items-center justify-center text-xs text-charcoal-muted font-medium">
                      Chart data available upon order activity
                    </div>
                  )}
                </div>
              </div>

              {/* Status Alert Queue */}
              <div className="lg:col-span-4 bg-cream-100 dark:bg-maroon-900 rounded-3xl p-6 border border-cream-300 dark:border-maroon-800 shadow-sm space-y-4 flex flex-col justify-between">
                <div className="space-y-4">
                  <h3 className="text-lg font-bold text-maroon-950 dark:text-cream-100 font-serif">
                    Operational Alerts
                  </h3>

                  <div className="space-y-3">
                    <div className="p-3.5 bg-amber-50 dark:bg-amber-950/60 border border-amber-200 dark:border-amber-800 rounded-2xl flex items-center gap-3">
                      <Clock className="w-5 h-5 text-amber-700 dark:text-amber-400 shrink-0" />
                      <div>
                        <span className="block text-xs font-bold text-amber-900 dark:text-amber-200">
                          {summary?.pending_orders_count || 0} Pending Orders
                        </span>
                        <span className="text-[11px] text-amber-800 dark:text-amber-300 font-medium">Requires baker confirmation</span>
                      </div>
                    </div>

                    <div className="p-3.5 bg-maroon-50 dark:bg-maroon-800/60 border border-maroon-200 dark:border-maroon-700 rounded-2xl flex items-center gap-3">
                      <ChefHat className="w-5 h-5 text-maroon-700 dark:text-cream-200 shrink-0" />
                      <div>
                        <span className="block text-xs font-bold text-maroon-950 dark:text-cream-100">
                          {summary?.in_production_count || 0} In Production Queue
                        </span>
                        <span className="text-[11px] text-maroon-800 dark:text-cream-300 font-medium">Baking &amp; decorating</span>
                      </div>
                    </div>

                    {summary?.low_stock_count ? (
                      <div className="p-3.5 bg-rose-50 dark:bg-rose-950/60 border border-rose-200 dark:border-rose-800 rounded-2xl flex items-center gap-3">
                        <AlertTriangle className="w-5 h-5 text-rose-700 dark:text-rose-400 shrink-0" />
                        <div>
                          <span className="block text-xs font-bold text-rose-900 dark:text-rose-200">
                            {summary.low_stock_count} Low Stock Ingredients
                          </span>
                          <span className="text-[11px] text-rose-800 dark:text-rose-300 font-medium">Reorder needed from supplier</span>
                        </div>
                      </div>
                    ) : null}
                  </div>
                </div>

                <div className="pt-4 border-t border-cream-300 dark:border-maroon-800">
                  <Link
                    href="/admin/orders"
                    className="w-full py-2.5 bg-maroon-700 hover:bg-maroon-800 text-cream-100 rounded-xl text-xs font-bold transition flex items-center justify-center gap-2 shadow-sm"
                  >
                    <span>Manage Orders Pipeline</span>
                    <ArrowUpRight className="w-4 h-4" />
                  </Link>
                </div>
              </div>

            </div>

            {/* Recent Orders Table */}
            <div className="bg-cream-100 dark:bg-maroon-900 rounded-3xl p-6 border border-cream-300 dark:border-maroon-800 shadow-sm space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-bold text-maroon-950 dark:text-cream-100 font-serif">
                    Recent Orders Queue
                  </h3>
                  <p className="text-xs text-charcoal-muted dark:text-cream-300/80 font-medium">
                    Latest customer bookings placed online or in-store.
                  </p>
                </div>
                <Link
                  href="/admin/orders"
                  className="text-xs font-bold text-maroon-700 dark:text-cream-200 hover:underline"
                >
                  View All Orders
                </Link>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="border-b border-cream-300 dark:border-maroon-800 text-maroon-900 dark:text-cream-200 font-bold uppercase tracking-wider text-[10px]">
                      <th className="py-3 px-4">Order #</th>
                      <th className="py-3 px-4">Customer</th>
                      <th className="py-3 px-4">Delivery Date</th>
                      <th className="py-3 px-4">Amount</th>
                      <th className="py-3 px-4">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-cream-300 dark:divide-maroon-800/50 font-medium">
                    {todaysOrders.map((ord) => (
                      <tr key={ord.id} className="hover:bg-cream-200/50 dark:hover:bg-maroon-800/40 transition">
                        <td className="py-3 px-4 font-bold text-maroon-900 dark:text-cream-100">{ord.order_number}</td>
                        <td className="py-3 px-4">{ord.client?.name || 'Customer'}</td>
                        <td className="py-3 px-4">{new Date(ord.delivery_date).toLocaleDateString()}</td>
                        <td className="py-3 px-4 font-bold">₹{ord.final_amount}</td>
                        <td className="py-3 px-4">
                          <StatusBadge status={ord.order_status} />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

          </main>
        </div>
      </div>
    </ProtectedRoute>
  );
}
