'use client';

import React, { useEffect, useState } from 'react';
import { Sidebar } from '@/components/layout/Sidebar';
import { Header } from '@/components/layout/Header';
import { api } from '@/lib/api';
import { Order, Client, Product } from '@/types';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { OrderModal } from '@/components/orders/OrderModal';
import { ProtectedRoute } from '@/components/auth/ProtectedRoute';
import { showToast } from '@/lib/toast';
import { Plus, Search, Users, Calendar, ChefHat, CheckCircle2, Truck, RefreshCw } from 'lucide-react';
import Link from 'next/link';

const ORDER_STATUSES = [
  'RECEIVED',
  'CONFIRMED',
  'PREPARING',
  'BAKING',
  'DECORATING',
  'READY',
  'OUT_FOR_DELIVERY',
  'DELIVERED',
  'CANCELLED'
];

export default function AdminOrdersPage() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [orders, setOrders] = useState<Order[]>([]);
  const [clients, setClients] = useState<Client[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  // Filters & Search
  const [search, setSearch] = useState('');
  const [selectedStatus, setSelectedStatus] = useState<string>('all');

  // Modal
  const [orderModalOpen, setOrderModalOpen] = useState(false);

  useEffect(() => {
    fetchOrdersData();
  }, []);

  const fetchOrdersData = async () => {
    try {
      setLoading(true);
      const [ordRes, clientRes, prodRes] = await Promise.all([
        api.get('/orders'),
        api.get('/clients'),
        api.get('/products')
      ]);

      setOrders(ordRes.data);
      setClients(clientRes.data);
      setProducts(prodRes.data);
    } catch (err) {
      console.error('Failed to load orders:', err);
      showToast('Failed to load order records', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateStatus = async (orderId: number, nextStatus: string) => {
    try {
      await api.put(`/orders/${orderId}/status`, { order_status: nextStatus });
      showToast(`Order status updated to ${nextStatus}`, 'success');
      fetchOrdersData();
    } catch (err: any) {
      showToast(err.response?.data?.detail || 'Failed to update order status', 'error');
    }
  };

  const filteredOrders = orders.filter((ord) => {
    if (selectedStatus !== 'all' && ord.order_status.toUpperCase() !== selectedStatus.toUpperCase()) {
      return false;
    }
    if (search.trim()) {
      const q = search.toLowerCase();
      const matchNum = ord.order_number.toLowerCase().includes(q);
      const matchClient = ord.client?.name.toLowerCase().includes(q) || false;
      const matchPhone = ord.client?.phone.includes(q) || false;
      if (!matchNum && !matchClient && !matchPhone) return false;
    }
    return true;
  });

  return (
    <ProtectedRoute requiredPermission="ORDERS_VIEW">
      <div className="min-h-screen bg-cream-200 dark:bg-maroon-950 text-charcoal dark:text-cream-100 flex font-sans">
        <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

        <div className="flex-1 flex flex-col min-w-0 lg:pl-64">
          <Header onOpenSidebar={() => setSidebarOpen(true)} title="Bakery Orders Pipeline Management" />

          <main className="flex-1 p-4 sm:p-6 lg:p-8 space-y-6">
            {/* Action Bar */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-cream-100 dark:bg-maroon-900 p-5 rounded-3xl border border-cream-300 dark:border-maroon-800 shadow-sm">
              <div>
                <h1 className="text-2xl font-extrabold font-serif text-maroon-950 dark:text-cream-100">
                  Customer Orders Pipeline
                </h1>
                <p className="text-xs text-charcoal-muted dark:text-cream-300/80 font-medium mt-0.5">
                  Track website enquiries, confirm orders, manage baking &amp; delivery statuses.
                </p>
              </div>

              <div className="flex items-center gap-3">
                <button
                  onClick={fetchOrdersData}
                  className="p-3 bg-cream-200 dark:bg-maroon-800 hover:bg-cream-300 dark:hover:bg-maroon-700 text-maroon-900 dark:text-cream-100 rounded-2xl text-xs font-bold transition shadow-sm"
                  title="Refresh Orders"
                >
                  <RefreshCw className="w-4 h-4" />
                </button>

                <button
                  onClick={() => setOrderModalOpen(true)}
                  className="px-5 py-3 bg-maroon-700 hover:bg-maroon-800 text-cream-100 rounded-2xl text-xs font-bold transition shadow-md flex items-center gap-2"
                >
                  <Plus className="w-4 h-4" />
                  <span>New Manual Order</span>
                </button>
              </div>
            </div>

            {/* Filter Tabs */}
            <div className="bg-cream-100 dark:bg-maroon-900 p-4 rounded-3xl border border-cream-300 dark:border-maroon-800 shadow-sm space-y-3">
              <div className="relative w-full max-w-sm">
                <Search className="w-4 h-4 text-charcoal-muted dark:text-cream-400 absolute left-3.5 top-3" />
                <input
                  type="text"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Search by order #, customer name or phone..."
                  className="w-full pl-10 pr-4 py-2.5 bg-cream-200 dark:bg-maroon-800 border border-cream-300 dark:border-maroon-700 rounded-2xl text-xs font-medium text-maroon-900 dark:text-cream-100 focus:outline-none"
                />
              </div>

              <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
                <button
                  onClick={() => setSelectedStatus('all')}
                  className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition shrink-0 ${
                    selectedStatus === 'all'
                      ? 'bg-maroon-700 text-cream-100'
                      : 'bg-cream-200 dark:bg-maroon-800 text-charcoal dark:text-cream-200'
                  }`}
                >
                  All Statuses ({orders.length})
                </button>

                {ORDER_STATUSES.map((st) => (
                  <button
                    key={st}
                    onClick={() => setSelectedStatus(st)}
                    className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition shrink-0 ${
                      selectedStatus === st
                        ? 'bg-maroon-700 text-cream-100'
                        : 'bg-cream-200 dark:bg-maroon-800 text-charcoal dark:text-cream-200'
                    }`}
                  >
                    {st.replace('_', ' ')}
                  </button>
                ))}
              </div>
            </div>

            {/* Orders Table */}
            <div className="bg-cream-100 dark:bg-maroon-900 rounded-3xl border border-cream-300 dark:border-maroon-800 shadow-sm overflow-hidden">
              {loading ? (
                <div className="py-20 text-center text-xs font-bold text-charcoal-muted">
                  Loading order pipeline...
                </div>
              ) : filteredOrders.length > 0 ? (
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse text-xs">
                    <thead>
                      <tr className="border-b border-cream-300 dark:border-maroon-800 text-maroon-900 dark:text-cream-200 font-bold uppercase tracking-wider text-[10px] bg-cream-200/50 dark:bg-maroon-800/40">
                        <th className="py-3.5 px-4">Order #</th>
                        <th className="py-3.5 px-4">Customer &amp; Phone</th>
                        <th className="py-3.5 px-4">Items / Details</th>
                        <th className="py-3.5 px-4">Delivery Date</th>
                        <th className="py-3.5 px-4">Final Amount</th>
                        <th className="py-3.5 px-4">Status</th>
                        <th className="py-3.5 px-4 text-right">Update Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-cream-300 dark:divide-maroon-800/50 font-medium">
                      {filteredOrders.map((ord) => (
                        <tr key={ord.id} className="hover:bg-cream-200/40 dark:hover:bg-maroon-800/30 transition">
                          <td className="py-3.5 px-4 font-bold text-maroon-950 dark:text-cream-100">
                            {ord.order_number}
                          </td>
                          <td className="py-3.5 px-4">
                            <span className="font-bold block text-maroon-900 dark:text-cream-100">
                              {ord.client?.name || 'Customer'}
                            </span>
                            <span className="text-[10px] text-charcoal-muted dark:text-cream-300/70 font-mono">
                              {ord.client?.phone || 'N/A'}
                            </span>
                          </td>
                          <td className="py-3.5 px-4 max-w-xs">
                            {ord.items && ord.items.length > 0 ? (
                              <div className="space-y-0.5">
                                {ord.items.map((it, idx) => (
                                  <div key={idx} className="text-[11px]">
                                    • {it.quantity}x {it.product?.name || 'Cake'} ({it.size_override || '1 Pound'})
                                  </div>
                                ))}
                              </div>
                            ) : (
                              <span className="text-[11px] text-charcoal-muted font-italic">
                                {ord.special_instructions || ord.notes || 'Web Enquiry'}
                              </span>
                            )}
                          </td>
                          <td className="py-3.5 px-4 font-bold">
                            {new Date(ord.delivery_date).toLocaleDateString()}
                          </td>
                          <td className="py-3.5 px-4 font-extrabold text-emerald-800 dark:text-emerald-300">
                            ₹{ord.final_amount}
                          </td>
                          <td className="py-3.5 px-4">
                            <StatusBadge status={ord.order_status} />
                          </td>
                          <td className="py-3.5 px-4 text-right">
                            <select
                              value={ord.order_status.toUpperCase()}
                              onChange={(e) => handleUpdateStatus(ord.id, e.target.value)}
                              className="px-2.5 py-1.5 bg-cream-200 dark:bg-maroon-800 border border-cream-300 dark:border-maroon-700 rounded-xl text-xs font-bold text-maroon-900 dark:text-cream-100 focus:outline-none"
                            >
                              {ORDER_STATUSES.map((st) => (
                                <option key={st} value={st}>
                                  {st.replace('_', ' ')}
                                </option>
                              ))}
                            </select>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="p-12 text-center text-xs font-bold text-charcoal-muted">
                  No orders match the selected filter.
                </div>
              )}
            </div>
          </main>
        </div>
      </div>

      <OrderModal
        isOpen={orderModalOpen}
        onClose={() => setOrderModalOpen(false)}
        clients={clients}
        products={products}
        onOrderCreated={fetchOrdersData}
      />
    </ProtectedRoute>
  );
}
