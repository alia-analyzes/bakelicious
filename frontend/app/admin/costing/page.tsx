'use client';

import React, { useEffect, useState } from 'react';
import { Sidebar } from '@/components/layout/Sidebar';
import { Header } from '@/components/layout/Header';
import { ProtectedRoute } from '@/components/auth/ProtectedRoute';
import { api } from '@/lib/api';
import { Product } from '@/types';
import { AlertTriangle, CheckCircle2, TrendingUp, IndianRupee } from 'lucide-react';

export default function AdminCostingPage() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchProducts();
  }, []);

  const fetchProducts = async () => {
    try {
      setLoading(true);
      const res = await api.get('/products');
      setProducts(res.data);
    } catch (err) {
      console.error('Failed to load costing analysis:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <ProtectedRoute requiredPermission="COSTING_VIEW">
      <div className="min-h-screen bg-cream-200 dark:bg-maroon-950 text-charcoal dark:text-cream-100 flex font-sans">
        <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

        <div className="flex-1 flex flex-col min-w-0 lg:pl-64">
          <Header onOpenSidebar={() => setSidebarOpen(true)} title="Bakery Product Profitability & Costing Analysis" />

          <main className="flex-1 p-4 sm:p-6 lg:p-8 space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-cream-100 dark:bg-maroon-900 p-5 rounded-3xl border border-cream-300 dark:border-maroon-800 shadow-sm">
              <div>
                <h1 className="text-2xl font-extrabold font-serif text-maroon-950 dark:text-cream-100">
                  Costing &amp; Profit Margin Analysis
                </h1>
                <p className="text-xs text-charcoal-muted dark:text-cream-300/80 font-medium mt-0.5">
                  Analyze selling price vs ingredient cost. Automated warning flags for margins below 40%.
                </p>
              </div>
            </div>

            <div className="bg-cream-100 dark:bg-maroon-900 rounded-3xl border border-cream-300 dark:border-maroon-800 shadow-sm overflow-hidden">
              {loading ? (
                <div className="py-20 text-center text-xs font-bold text-charcoal-muted">
                  Loading costing calculations...
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse text-xs">
                    <thead>
                      <tr className="border-b border-cream-300 dark:border-maroon-800 text-maroon-900 dark:text-cream-200 font-bold uppercase tracking-wider text-[10px] bg-cream-200/50 dark:bg-maroon-800/40">
                        <th className="py-3.5 px-4">Product Name</th>
                        <th className="py-3.5 px-4">Category</th>
                        <th className="py-3.5 px-4">Selling Price ₹</th>
                        <th className="py-3.5 px-4">Cost Price ₹</th>
                        <th className="py-3.5 px-4">Profit ₹</th>
                        <th className="py-3.5 px-4">Profit Margin %</th>
                        <th className="py-3.5 px-4">Profitability Health</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-cream-300 dark:divide-maroon-800/50 font-medium">
                      {products.map((p) => {
                        const sPrice = p.price || 0;
                        const cPrice = p.manual_cost || p.calculated_cost || 0;
                        const profit = p.profit || (sPrice - cPrice);
                        const marginNum = p.profit_margin || (sPrice > 0 ? Number(((profit / sPrice) * 100).toFixed(1)) : 0);
                        const isLowMargin = marginNum < 40;

                        return (
                          <tr key={p.id} className="hover:bg-cream-200/40 dark:hover:bg-maroon-800/30 transition">
                            <td className="py-3.5 px-4 font-bold text-maroon-950 dark:text-cream-100 text-sm">
                              {p.name}
                            </td>
                            <td className="py-3.5 px-4">{p.category?.name || 'Gourmet'}</td>
                            <td className="py-3.5 px-4 font-extrabold text-emerald-800 dark:text-emerald-300">₹{sPrice}</td>
                            <td className="py-3.5 px-4 font-bold text-rose-800 dark:text-rose-300">₹{cPrice}</td>
                            <td className="py-3.5 px-4 font-bold text-maroon-900 dark:text-cream-100">₹{profit}</td>
                            <td className="py-3.5 px-4">
                              <span className={`px-2.5 py-1 rounded-full font-bold text-[11px] ${
                                isLowMargin
                                  ? 'bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300'
                                  : 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                              }`}>
                                {marginNum}%
                              </span>
                            </td>
                            <td className="py-3.5 px-4">
                              {isLowMargin ? (
                                <span className="inline-flex items-center gap-1.5 text-rose-700 dark:text-rose-400 font-bold text-[11px]">
                                  <AlertTriangle className="w-3.5 h-3.5" />
                                  <span>Low Margin (&lt; 40%)</span>
                                </span>
                              ) : (
                                <span className="inline-flex items-center gap-1.5 text-emerald-700 dark:text-emerald-300 font-bold text-[11px]">
                                  <CheckCircle2 className="w-3.5 h-3.5" />
                                  <span>Healthy Profit</span>
                                </span>
                              )}
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
