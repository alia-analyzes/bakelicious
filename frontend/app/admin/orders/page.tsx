'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { Sidebar } from '@/components/layout/Sidebar';
import { Header } from '@/components/layout/Header';
import { api } from '@/lib/api';
import { Order, Client, Product } from '@/types';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { OrderModal } from '@/components/orders/OrderModal';
import { Modal } from '@/components/ui/Modal';
import { ProtectedRoute } from '@/components/auth/ProtectedRoute';
import { showToast } from '@/lib/toast';
import {
  Plus,
  Search,
  Users,
  Calendar,
  ChefHat,
  CheckCircle2,
  Truck,
  RefreshCw,
  ShoppingBag,
  MessageSquare,
  Phone,
  Mail,
  MapPin,
  Clock,
  Sparkles,
  ArrowRight,
  ArrowUpDown
} from 'lucide-react';

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
  const [sortOption, setSortOption] = useState<'recent' | 'delivery_recent' | 'delivery_upcoming'>('recent');

  // Modals
  const [orderModalOpen, setOrderModalOpen] = useState(false);
  const [selectedOrderDetails, setSelectedOrderDetails] = useState<Order | null>(null);

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
      if (selectedOrderDetails && selectedOrderDetails.id === orderId) {
        setSelectedOrderDetails(prev => prev ? { ...prev, order_status: nextStatus as any } : null);
      }
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
      const matchCustom = (ord.special_instructions || '').toLowerCase().includes(q);
      if (!matchNum && !matchClient && !matchPhone && !matchCustom) return false;
    }
    return true;
  });

  // Sort orders: Recent date first by default
  const sortedOrders = [...filteredOrders].sort((a, b) => {
    if (sortOption === 'delivery_recent') {
      const dateA = new Date(a.delivery_date).getTime();
      const dateB = new Date(b.delivery_date).getTime();
      if (dateB !== dateA) return dateB - dateA;
    } else if (sortOption === 'delivery_upcoming') {
      const dateA = new Date(a.delivery_date).getTime();
      const dateB = new Date(b.delivery_date).getTime();
      if (dateA !== dateB) return dateA - dateB;
    } else {
      // Default 'recent': Most recent placed / created date first
      const dateA = new Date(a.order_date || a.created_at || a.delivery_date).getTime();
      const dateB = new Date(b.order_date || b.created_at || b.delivery_date).getTime();
      if (dateB !== dateA) return dateB - dateA;
    }
    return b.id - a.id;
  });

  return (
    <ProtectedRoute requiredPermission="ORDERS_VIEW">
      <div className="min-h-screen bg-cream-200 dark:bg-maroon-950 text-charcoal dark:text-cream-100 flex font-sans">
        <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

        <div className="flex-1 flex flex-col min-w-0 lg:pl-64">
          <Header onOpenSidebar={() => setSidebarOpen(true)} title="All Bakery Orders" />

          <main className="flex-1 p-3.5 sm:p-6 lg:p-8 space-y-5 sm:space-y-6 min-w-0">
            {/* Header Action Bar */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4 bg-cream-100 dark:bg-maroon-900 p-4 sm:p-5 rounded-3xl border border-cream-300 dark:border-maroon-800 shadow-sm">
              <div>
                <h1 className="text-2xl font-extrabold font-serif text-maroon-950 dark:text-cream-100">
                  All Bakery Orders
                </h1>
                <p className="text-xs text-charcoal-muted dark:text-cream-300/80 font-medium mt-0.5">
                  Live order pipeline, customer customization notes &amp; delivery schedules.
                </p>
              </div>

              {/* Action Buttons */}
              <div className="flex flex-wrap sm:flex-nowrap items-center gap-2 sm:gap-2.5 w-full sm:w-auto">
                <Link
                  href="/admin/clients"
                  className="px-4 py-2.5 bg-cream-200 dark:bg-maroon-800 hover:bg-cream-300 dark:hover:bg-maroon-700 text-maroon-900 dark:text-cream-100 border border-cream-300 dark:border-maroon-700 rounded-2xl text-xs font-bold transition flex items-center gap-1.5 shadow-2xs"
                >
                  <Users className="w-4 h-4 text-maroon-700 dark:text-cream-300" />
                  <span>View All Client Details ({clients.length}) &rarr;</span>
                </Link>

                <button
                  onClick={() => setOrderModalOpen(true)}
                  className="px-4 py-2.5 bg-maroon-700 hover:bg-maroon-800 text-cream-100 rounded-2xl text-xs font-bold transition shadow-md flex items-center gap-1.5 shrink-0"
                >
                  <Plus className="w-4 h-4" />
                  <span>New Order</span>
                </button>
              </div>
            </div>

            {/* Search, Status Filters & Sort Option */}
            <div className="bg-cream-100 dark:bg-maroon-900 p-3.5 sm:p-4 rounded-3xl border border-cream-300 dark:border-maroon-800 shadow-sm flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-3 sm:gap-4">
              <div className="flex flex-col sm:flex-row items-center gap-3 w-full lg:w-auto">
                <div className="relative w-full sm:w-72">
                  <Search className="w-4 h-4 text-charcoal-muted dark:text-cream-400 absolute left-3.5 top-3" />
                  <input
                    type="text"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    placeholder="Search order #, customer, custom notes..."
                    className="w-full pl-10 pr-4 py-2 bg-cream-200 dark:bg-maroon-800 border border-cream-300 dark:border-maroon-700 rounded-2xl text-xs font-medium text-maroon-900 dark:text-cream-100 focus:outline-none"
                  />
                </div>

                {/* Sort Option (Recent Date First by default) */}
                <div className="flex items-center gap-1.5 w-full sm:w-auto">
                  <span className="text-[10px] font-extrabold text-charcoal-muted dark:text-cream-300 uppercase tracking-wider shrink-0 flex items-center gap-1">
                    <ArrowUpDown className="w-3.5 h-3.5 text-amber-500" /> Sort:
                  </span>
                  <select
                    value={sortOption}
                    onChange={(e) => setSortOption(e.target.value as any)}
                    className="w-full sm:w-auto px-3 py-2 bg-cream-200 dark:bg-maroon-800 border border-cream-300 dark:border-maroon-700 rounded-2xl text-xs font-bold text-maroon-900 dark:text-cream-100 focus:outline-none shadow-2xs"
                  >
                    <option value="recent">⚡ Recent Date First (Newest Placed)</option>
                    <option value="delivery_recent">📅 Recent Delivery Schedule First</option>
                    <option value="delivery_upcoming">⏰ Earliest Delivery Schedule First</option>
                  </select>
                </div>
              </div>

              <div className="flex items-center gap-1.5 overflow-x-auto w-full lg:w-auto pb-1 lg:pb-0">
                <button
                  onClick={() => setSelectedStatus('all')}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition shrink-0 ${
                    selectedStatus === 'all'
                      ? 'bg-maroon-700 text-cream-100 shadow-xs'
                      : 'bg-cream-200 dark:bg-maroon-800 text-charcoal dark:text-cream-200 hover:bg-cream-300'
                  }`}
                >
                  All ({orders.length})
                </button>

                {ORDER_STATUSES.map((st) => (
                  <button
                    key={st}
                    onClick={() => setSelectedStatus(st)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold transition shrink-0 ${
                      selectedStatus === st
                        ? 'bg-maroon-700 text-cream-100 shadow-xs'
                        : 'bg-cream-200 dark:bg-maroon-800 text-charcoal dark:text-cream-200 hover:bg-cream-300'
                    }`}
                  >
                    {st.replace('_', ' ')}
                  </button>
                ))}
              </div>
            </div>

            {/* Orders Pipeline Table */}
            <div className="bg-cream-100 dark:bg-maroon-900 rounded-3xl border border-cream-300 dark:border-maroon-800 shadow-sm overflow-hidden">
              {loading ? (
                <div className="py-20 text-center text-xs font-bold text-charcoal-muted">
                  Loading orders pipeline...
                </div>
              ) : sortedOrders.length > 0 ? (
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse text-xs min-w-[780px]">
                    <thead>
                      <tr className="border-b border-cream-300 dark:border-maroon-800 text-maroon-900 dark:text-cream-200 font-bold uppercase tracking-wider text-[10px] bg-cream-200/50 dark:bg-maroon-800/40">
                        <th className="py-3.5 px-4">Order #</th>
                        <th className="py-3.5 px-4">Customer &amp; Phone</th>
                        <th className="py-3.5 px-4">Cake / Items</th>
                        <th className="py-3.5 px-4">Customization &amp; Notes</th>
                        <th className="py-3.5 px-4">Date &amp; Schedule</th>
                        <th className="py-3.5 px-4">Amount</th>
                        <th className="py-3.5 px-4">Status</th>
                        <th className="py-3.5 px-4 text-right">Update Stage</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-cream-300 dark:divide-maroon-800/50 font-medium">
                      {sortedOrders.map((ord) => (
                        <tr
                          key={ord.id}
                          className="hover:bg-cream-200/40 dark:hover:bg-maroon-800/30 transition cursor-pointer"
                          onClick={() => setSelectedOrderDetails(ord)}
                        >
                          <td className="py-3.5 px-4 font-bold text-maroon-950 dark:text-cream-100">
                            <span className="hover:underline">{ord.order_number}</span>
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
                                  <div key={idx} className="text-[11px] font-semibold">
                                    • {it.quantity}x {it.product?.name || 'Cake'} ({it.size_override || '1 Pound'})
                                  </div>
                                ))}
                              </div>
                            ) : (
                              <span className="text-[11px] text-charcoal-muted italic">
                                Custom Artisan Cake
                              </span>
                            )}
                          </td>

                          {/* Customer Customization & Comments prominently shown */}
                          <td className="py-3.5 px-4 max-w-sm">
                            {ord.special_instructions ? (
                              <div className="p-2 bg-amber-50 dark:bg-amber-950/70 border border-amber-200 dark:border-amber-800/80 rounded-xl">
                                <span className="text-[9px] font-extrabold uppercase tracking-wide text-amber-800 dark:text-amber-300 block">
                                  🎨 Customization Request:
                                </span>
                                <p className="text-[11px] text-amber-950 dark:text-amber-100 font-medium line-clamp-2">
                                  {ord.special_instructions}
                                </p>
                              </div>
                            ) : ord.notes ? (
                              <p className="text-[11px] text-charcoal-muted line-clamp-2">
                                {ord.notes}
                              </p>
                            ) : (
                              <span className="text-[10px] text-charcoal-muted/60">Standard order</span>
                            )}
                          </td>

                          <td className="py-3.5 px-4">
                            <div className="space-y-1">
                              <div className="flex items-center gap-1.5 font-bold text-maroon-950 dark:text-cream-100">
                                <Calendar className="w-3.5 h-3.5 text-maroon-600 dark:text-cream-400 shrink-0" />
                                <span>
                                  {new Date(ord.order_date || ord.created_at || ord.delivery_date).toLocaleDateString('en-GB')}
                                </span>
                                <span className="text-[9px] px-1.5 py-0.5 rounded-md bg-amber-100 dark:bg-amber-900/60 text-amber-900 dark:text-amber-200 uppercase font-extrabold tracking-wider">
                                  Placed
                                </span>
                              </div>
                              <div className="text-[11px] text-charcoal-muted dark:text-cream-300/80 flex items-center gap-1.5 font-medium">
                                <Clock className="w-3 h-3 text-charcoal-muted dark:text-cream-400 shrink-0" />
                                <span>
                                  Delivery: <strong className="text-maroon-900 dark:text-cream-100">{new Date(ord.delivery_date).toLocaleDateString('en-GB')}</strong> ({ord.delivery_time || '12:00 PM'})
                                </span>
                              </div>
                            </div>
                          </td>

                          <td className="py-3.5 px-4 font-extrabold text-emerald-800 dark:text-emerald-300">
                            ₹{ord.final_amount}
                          </td>

                          <td className="py-3.5 px-4">
                            <StatusBadge status={ord.order_status} />
                          </td>

                          <td className="py-3.5 px-4 text-right" onClick={(e) => e.stopPropagation()}>
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
                <div className="p-16 text-center text-xs font-bold text-charcoal-muted">
                  No orders match the selected filter.
                </div>
              )}
            </div>
          </main>
        </div>
      </div>

      {/* ================= MODAL: ORDER DETAILS & CUSTOMIZATION ================= */}
      <Modal
        isOpen={Boolean(selectedOrderDetails)}
        onClose={() => setSelectedOrderDetails(null)}
        title={selectedOrderDetails ? `Order Details: ${selectedOrderDetails.order_number}` : 'Order Info'}
        subtitle="Full customer order profile, customization notes & delivery timeline"
        maxWidth="lg"
      >
        {selectedOrderDetails && (
          <div className="space-y-4 text-xs">
            {/* Customer Header Info */}
            <div className="p-4 bg-cream-200 dark:bg-maroon-800 rounded-2xl flex flex-col sm:flex-row items-center justify-between gap-4 border border-cream-300 dark:border-maroon-700">
              <div className="space-y-1">
                <span className="text-[10px] font-bold text-maroon-700 dark:text-cream-300 uppercase">Customer Profile</span>
                <h3 className="text-base font-extrabold text-maroon-950 dark:text-cream-100">
                  {selectedOrderDetails.client?.name || 'Customer'}
                </h3>
                <div className="flex items-center gap-3 text-xs text-charcoal-muted dark:text-cream-300">
                  <span className="flex items-center gap-1 font-mono">
                    <Phone className="w-3.5 h-3.5 text-maroon-700" />
                    {selectedOrderDetails.client?.phone || 'N/A'}
                  </span>
                  {selectedOrderDetails.client?.email && (
                    <span className="flex items-center gap-1">
                      <Mail className="w-3.5 h-3.5 text-maroon-700" />
                      {selectedOrderDetails.client?.email}
                    </span>
                  )}
                </div>
              </div>

              {selectedOrderDetails.client?.phone && (
                <a
                  href={`https://wa.me/${selectedOrderDetails.client.phone.replace(/[^0-9]/g, '')}?text=${encodeURIComponent(`Hello ${selectedOrderDetails.client.name}, regarding your Bakelicious order ${selectedOrderDetails.order_number}...`)}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-4 py-2 bg-emerald-700 hover:bg-emerald-800 text-white font-bold rounded-xl shadow-sm flex items-center gap-1.5 shrink-0"
                >
                  <Phone className="w-3.5 h-3.5" />
                  <span>Chat on WhatsApp</span>
                </a>
              )}
            </div>

            {/* CUSTOMIZATION & SPECIAL INSTRUCTIONS (Highlighted) */}
            <div className="p-4 bg-amber-50 dark:bg-amber-950/80 border border-amber-300 dark:border-amber-700 rounded-2xl space-y-2">
              <div className="flex items-center gap-2 text-amber-900 dark:text-amber-200 font-extrabold text-xs">
                <Sparkles className="w-4 h-4 text-amber-700" />
                <span>CUSTOMER CUSTOMIZATION &amp; SPECIAL REQUIREMENTS</span>
              </div>
              <p className="text-xs text-amber-950 dark:text-amber-100 font-semibold leading-relaxed whitespace-pre-line bg-white/70 dark:bg-black/30 p-3 rounded-xl border border-amber-200 dark:border-amber-800">
                {selectedOrderDetails.special_instructions || selectedOrderDetails.notes || 'No custom notes provided.'}
              </p>
            </div>

            {/* Items Ordered */}
            <div className="space-y-2">
              <h4 className="font-extrabold text-xs text-maroon-900 dark:text-cream-100 uppercase">Items Ordered</h4>
              <div className="bg-cream-100 dark:bg-maroon-900 rounded-xl border border-cream-300 dark:border-maroon-800 p-3 space-y-2">
                {selectedOrderDetails.items && selectedOrderDetails.items.length > 0 ? (
                  selectedOrderDetails.items.map((it, idx) => (
                    <div key={idx} className="flex items-center justify-between text-xs py-1 border-b border-cream-200 dark:border-maroon-800 last:border-0">
                      <div>
                        <span className="font-bold text-maroon-950 dark:text-cream-100">
                          {it.quantity}x {it.product?.name || 'Artisan Cake'}
                        </span>
                        <span className="ml-2 text-charcoal-muted">({it.size_override || '1 Pound'})</span>
                      </div>
                      <span className="font-extrabold text-emerald-800 dark:text-emerald-300">
                        ₹{it.subtotal || it.unit_price}
                      </span>
                    </div>
                  ))
                ) : (
                  <p className="text-xs text-charcoal-muted">Custom bakery item</p>
                )}
              </div>
            </div>

            {/* Delivery & Financials Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="p-3 bg-cream-100 dark:bg-maroon-900 rounded-xl border border-cream-300 dark:border-maroon-800 space-y-1">
                <span className="text-[10px] font-bold text-charcoal-muted uppercase">Delivery Schedule &amp; Address</span>
                <p className="font-bold text-maroon-900 dark:text-cream-100">
                  {new Date(selectedOrderDetails.delivery_date).toLocaleDateString()} at {selectedOrderDetails.delivery_time || '12:00 PM'}
                </p>
                <p className="text-charcoal-muted text-[11px]">
                  {selectedOrderDetails.delivery_address || 'Bakery Counter Pickup'}
                </p>
              </div>

              <div className="p-3 bg-cream-100 dark:bg-maroon-900 rounded-xl border border-cream-300 dark:border-maroon-800 space-y-1">
                <span className="text-[10px] font-bold text-charcoal-muted uppercase">Financial Summary</span>
                <div className="flex justify-between font-extrabold text-xs">
                  <span>Total Amount:</span>
                  <span className="text-emerald-800 dark:text-emerald-300">₹{selectedOrderDetails.final_amount}</span>
                </div>
                <div className="flex justify-between text-[11px] text-charcoal-muted">
                  <span>Payment Status:</span>
                  <span className="font-bold text-maroon-900 dark:text-cream-100">{selectedOrderDetails.payment_status}</span>
                </div>
              </div>
            </div>

            {/* Status Changer Footer */}
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 pt-3 border-t border-cream-300 dark:border-maroon-800">
              <div className="flex items-center gap-2">
                <span className="font-bold">Current Stage:</span>
                <select
                  value={selectedOrderDetails.order_status.toUpperCase()}
                  onChange={(e) => handleUpdateStatus(selectedOrderDetails.id, e.target.value)}
                  className="px-3 py-1.5 bg-cream-200 dark:bg-maroon-800 border border-cream-300 dark:border-maroon-700 rounded-xl text-xs font-bold text-maroon-900 dark:text-cream-100"
                >
                  {ORDER_STATUSES.map((st) => (
                    <option key={st} value={st}>{st.replace('_', ' ')}</option>
                  ))}
                </select>
              </div>

              <button
                type="button"
                onClick={() => setSelectedOrderDetails(null)}
                className="px-5 py-2 bg-maroon-700 text-cream-100 font-bold rounded-xl"
              >
                Close
              </button>
            </div>
          </div>
        )}
      </Modal>

      {/* Modal: Create Order */}
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
