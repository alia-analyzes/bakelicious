'use client';

import React, { useEffect, useState } from 'react';
import { Sidebar } from '@/components/layout/Sidebar';
import { Header } from '@/components/layout/Header';
import { api } from '@/lib/api';
import { Ingredient, InventoryTransaction } from '@/types';
import { IngredientModal } from '@/components/inventory/IngredientModal';
import { StockAdjustmentModal } from '@/components/inventory/StockAdjustmentModal';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { ProtectedRoute } from '@/components/auth/ProtectedRoute';
import { showToast } from '@/lib/toast';
import { Plus, Search, AlertTriangle, Boxes, Edit, Trash2, History, CheckCircle2 } from 'lucide-react';

export default function AdminInventoryPage() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [ingredients, setIngredients] = useState<Ingredient[]>([]);
  const [transactions, setTransactions] = useState<InventoryTransaction[]>([]);
  const [search, setSearch] = useState('');
  const [onlyLowStock, setOnlyLowStock] = useState(false);
  const [activeTab, setActiveTab] = useState<'stock' | 'history'>('stock');
  const [loading, setLoading] = useState(true);

  // Modals
  const [ingModalOpen, setIngModalOpen] = useState(false);
  const [editingIng, setEditingIng] = useState<Ingredient | null>(null);

  const [adjustModalOpen, setAdjustModalOpen] = useState(false);
  const [adjustIng, setAdjustIng] = useState<Ingredient | null>(null);

  useEffect(() => {
    fetchInventoryData();
  }, []);

  const fetchInventoryData = async () => {
    try {
      setLoading(true);
      const [ingRes, transRes] = await Promise.all([
        api.get('/ingredients'),
        api.get('/inventory/transactions')
      ]);

      setIngredients(ingRes.data);
      setTransactions(transRes.data);
    } catch (err) {
      showToast('Failed to load inventory data', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleOpenAdd = () => {
    setEditingIng(null);
    setIngModalOpen(true);
  };

  const handleOpenEdit = (ing: Ingredient) => {
    setEditingIng(ing);
    setIngModalOpen(true);
  };

  const handleOpenAdjust = (ing: Ingredient) => {
    setAdjustIng(ing);
    setAdjustModalOpen(true);
  };

  const handleDeleteIngredient = async (id: number) => {
    if (!confirm('Are you sure you want to delete this ingredient?')) return;
    try {
      await api.delete(`/ingredients/${id}`);
      showToast('Ingredient removed', 'success');
      fetchInventoryData();
    } catch (err) {
      showToast('Failed to delete ingredient', 'error');
    }
  };

  const lowStockCount = ingredients.filter((i) => Number(i.quantity) <= Number(i.min_stock)).length;

  const filteredIngredients = ingredients.filter((ing) => {
    if (onlyLowStock && Number(ing.quantity) > Number(ing.min_stock)) {
      return false;
    }
    if (!search.trim()) return true;
    const q = search.toLowerCase();
    return (
      ing.name.toLowerCase().includes(q) ||
      ing.category.toLowerCase().includes(q) ||
      (ing.supplier && ing.supplier.toLowerCase().includes(q))
    );
  });

  return (
    <ProtectedRoute requiredPermission="INVENTORY_VIEW">
      <div className="min-h-screen bg-cream-200 dark:bg-maroon-950 text-charcoal dark:text-cream-100 flex font-sans">
        <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

        <div className="flex-1 flex flex-col min-w-0 lg:pl-64">
          <Header onOpenSidebar={() => setSidebarOpen(true)} title="Bakery Ingredient & Stock Inventory" />

          <main className="flex-1 p-3.5 sm:p-6 lg:p-8 space-y-5 sm:space-y-6 min-w-0">
            {/* Header Action Bar */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4 bg-cream-100 dark:bg-maroon-900 p-4 sm:p-5 rounded-3xl border border-cream-300 dark:border-maroon-800 shadow-sm">
              <div>
                <h1 className="text-2xl font-extrabold font-serif text-maroon-950 dark:text-cream-100">
                  Inventory &amp; Supplies Management
                </h1>
                <p className="text-xs text-charcoal-muted dark:text-cream-300/80 font-medium mt-0.5">
                  Track flour, cocoa, dairy, fondant, cake boards &amp; packaging supplies.
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-2 sm:gap-3 w-full sm:w-auto">
                <button
                  onClick={handleOpenAdd}
                  className="px-5 py-3 bg-maroon-700 hover:bg-maroon-800 text-cream-100 rounded-2xl text-xs font-bold transition shadow-md flex items-center gap-2"
                >
                  <Plus className="w-4 h-4" />
                  <span>Add Ingredient / Supply</span>
                </button>
              </div>
            </div>

            {/* Low Stock Reminder Banner */}
            {lowStockCount > 0 && (
              <div className="p-4 bg-rose-50 dark:bg-rose-950/80 border border-rose-300 dark:border-rose-800 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs shadow-sm">
                <div className="flex flex-wrap items-center gap-2 sm:gap-3 w-full sm:w-auto">
                  <div className="w-10 h-10 rounded-xl bg-rose-200 dark:bg-rose-900 text-rose-800 dark:text-rose-200 flex items-center justify-center shrink-0">
                    <AlertTriangle className="w-5 h-5 text-rose-700 dark:text-rose-300 animate-pulse" />
                  </div>
                  <div>
                    <span className="font-extrabold text-rose-900 dark:text-rose-200 text-sm block">
                      ⚠️ Stock Alert: {lowStockCount} items at or below minimum threshold!
                    </span>
                    <span className="text-rose-800 dark:text-rose-300 font-medium">
                      Reorder required immediately to prevent baking and production interruptions.
                    </span>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => {
                    setOnlyLowStock(!onlyLowStock);
                    setActiveTab('stock');
                  }}
                  className={`px-4 py-2 rounded-xl text-xs font-bold transition shrink-0 shadow-xs ${
                    onlyLowStock
                      ? 'bg-rose-800 text-white'
                      : 'bg-rose-600 hover:bg-rose-700 text-white'
                  }`}
                >
                  {onlyLowStock ? 'Show All Items' : `Filter to ${lowStockCount} Low Stock Items`}
                </button>
              </div>
            )}

            {/* Search & Tabs */}
            <div className="bg-cream-100 dark:bg-maroon-900 p-4 rounded-3xl border border-cream-300 dark:border-maroon-800 shadow-sm flex flex-col md:flex-row items-center justify-between gap-4">
              <div className="relative w-full md:w-80">
                <Search className="w-4 h-4 text-charcoal-muted dark:text-cream-400 absolute left-3.5 top-3" />
                <input
                  type="text"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Search ingredient, category, supplier..."
                  className="w-full pl-10 pr-4 py-2.5 bg-cream-200 dark:bg-maroon-800 border border-cream-300 dark:border-maroon-700 rounded-2xl text-xs font-medium text-maroon-900 dark:text-cream-100 focus:outline-none"
                />
              </div>

              <div className="flex items-center gap-1.5 sm:gap-2 overflow-x-auto w-full md:w-auto pb-1 md:pb-0 scrollbar-none">
                <button
                  onClick={() => {
                    setOnlyLowStock(false);
                    setActiveTab('stock');
                  }}
                  className={`px-4 py-2 rounded-2xl text-xs font-bold transition flex items-center gap-1.5 ${
                    activeTab === 'stock' && !onlyLowStock
                      ? 'bg-maroon-700 text-cream-100'
                      : 'bg-cream-200 dark:bg-maroon-800 text-charcoal dark:text-cream-200'
                  }`}
                >
                  <Boxes className="w-3.5 h-3.5" />
                  <span>All Stock ({ingredients.length})</span>
                </button>

                {lowStockCount > 0 && (
                  <button
                    onClick={() => {
                      setOnlyLowStock(!onlyLowStock);
                      setActiveTab('stock');
                    }}
                    className={`px-4 py-2 rounded-2xl text-xs font-bold transition flex items-center gap-1.5 ${
                      onlyLowStock
                        ? 'bg-rose-700 text-white shadow-sm'
                        : 'bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300'
                    }`}
                  >
                    <AlertTriangle className="w-3.5 h-3.5" />
                    <span>Low Stock Only ({lowStockCount})</span>
                  </button>
                )}

                <button
                  onClick={() => setActiveTab('history')}
                  className={`px-4 py-2 rounded-2xl text-xs font-bold transition flex items-center gap-1.5 ${
                    activeTab === 'history'
                      ? 'bg-maroon-700 text-cream-100'
                      : 'bg-cream-200 dark:bg-maroon-800 text-charcoal dark:text-cream-200'
                  }`}
                >
                  <History className="w-3.5 h-3.5" />
                  <span>Stock Movement Logs</span>
                </button>
              </div>
            </div>

            {/* Inventory Table */}
            {activeTab === 'stock' ? (
              <div className="bg-cream-100 dark:bg-maroon-900 rounded-3xl border border-cream-300 dark:border-maroon-800 shadow-sm overflow-hidden">
                {loading ? (
                  <div className="py-20 text-center text-xs font-bold text-charcoal-muted">
                    Loading inventory stock...
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse text-xs min-w-[700px]">
                      <thead>
                        <tr className="border-b border-cream-300 dark:border-maroon-800 text-maroon-900 dark:text-cream-200 font-bold uppercase tracking-wider text-[10px] bg-cream-200/50 dark:bg-maroon-800/40">
                          <th className="py-3.5 px-4">Item Name</th>
                          <th className="py-3.5 px-4">Category</th>
                          <th className="py-3.5 px-4">In Stock</th>
                          <th className="py-3.5 px-4">Unit Cost</th>
                          <th className="py-3.5 px-4">Reorder Level</th>
                          <th className="py-3.5 px-4">Supplier</th>
                          <th className="py-3.5 px-4">Status</th>
                          <th className="py-3.5 px-4 text-right">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-cream-300 dark:divide-maroon-800/50 font-medium">
                        {filteredIngredients.map((ing) => {
                          const isLow = ing.quantity <= ing.min_stock;
                          return (
                            <tr key={ing.id} className="hover:bg-cream-200/40 dark:hover:bg-maroon-800/30 transition">
                              <td className="py-3.5 px-4 font-bold text-maroon-950 dark:text-cream-100">
                                {ing.name}
                              </td>
                              <td className="py-3.5 px-4">{ing.category}</td>
                              <td className="py-3.5 px-4 font-extrabold text-sm text-maroon-900 dark:text-cream-100">
                                {ing.quantity} {ing.unit}
                              </td>
                              <td className="py-3.5 px-4 font-bold">₹{ing.unit_cost}/{ing.unit}</td>
                              <td className="py-3.5 px-4 text-charcoal-muted">{ing.min_stock} {ing.unit}</td>
                              <td className="py-3.5 px-4">{ing.supplier || 'Local Supplier'}</td>
                              <td className="py-3.5 px-4">
                                {isLow ? (
                                  <span className="px-2.5 py-1 bg-rose-100 dark:bg-rose-950 text-rose-800 dark:text-rose-300 rounded-full font-bold text-[11px] inline-flex items-center gap-1">
                                    <AlertTriangle className="w-3 h-3" />
                                    <span>LOW STOCK</span>
                                  </span>
                                ) : (
                                  <span className="px-2.5 py-1 bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300 rounded-full font-bold text-[11px] inline-flex items-center gap-1">
                                    <CheckCircle2 className="w-3 h-3" />
                                    <span>IN STOCK</span>
                                  </span>
                                )}
                              </td>
                              <td className="py-3.5 px-4 text-right space-x-1">
                                <button
                                  onClick={() => handleOpenAdjust(ing)}
                                  className="px-2.5 py-1 bg-cream-200 dark:bg-maroon-800 hover:bg-cream-300 text-maroon-900 dark:text-cream-100 rounded-lg text-[11px] font-bold"
                                >
                                  Adjust
                                </button>
                                <button
                                  onClick={() => handleOpenEdit(ing)}
                                  className="p-1.5 text-maroon-700 dark:text-cream-200 hover:bg-cream-200 rounded-lg"
                                >
                                  <Edit className="w-4 h-4" />
                                </button>
                                <button
                                  onClick={() => handleDeleteIngredient(ing.id)}
                                  className="p-1.5 text-rose-700 dark:text-rose-400 hover:bg-rose-100 rounded-lg"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </button>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            ) : (
              <div className="bg-cream-100 dark:bg-maroon-900 rounded-3xl border border-cream-300 dark:border-maroon-800 p-6 shadow-sm overflow-hidden">
                <h3 className="text-base font-bold text-maroon-950 dark:text-cream-100 font-serif mb-4">
                  Recent Stock In / Deductions
                </h3>
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse text-xs min-w-[700px]">
                    <thead>
                      <tr className="border-b border-cream-300 dark:border-maroon-800 font-bold text-maroon-900 dark:text-cream-200 uppercase text-[10px]">
                        <th className="py-3 px-4">Date</th>
                        <th className="py-3 px-4">Ingredient</th>
                        <th className="py-3 px-4">Type</th>
                        <th className="py-3 px-4">Qty Change</th>
                        <th className="py-3 px-4">Notes</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-cream-300 dark:divide-maroon-800/50">
                      {transactions.map((t) => (
                        <tr key={t.id}>
                          <td className="py-3 px-4">{new Date(t.created_at).toLocaleString()}</td>
                          <td className="py-3 px-4 font-bold">{t.ingredient?.name || 'Item'}</td>
                          <td className="py-3 px-4">
                            <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                              t.transaction_type === 'RESTOCK' ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'
                            }`}>
                              {t.transaction_type}
                            </span>
                          </td>
                          <td className="py-3 px-4 font-bold">{t.quantity_change > 0 ? `+${t.quantity_change}` : t.quantity_change}</td>
                          <td className="py-3 px-4 text-charcoal-muted">{t.notes || '—'}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </main>
        </div>
      </div>

      <IngredientModal
        isOpen={ingModalOpen}
        onClose={() => setIngModalOpen(false)}
        ingredient={editingIng}
        onSuccess={fetchInventoryData}
      />

      <StockAdjustmentModal
        isOpen={adjustModalOpen}
        onClose={() => setAdjustModalOpen(false)}
        ingredient={adjustIng}
        onSuccess={fetchInventoryData}
      />
    </ProtectedRoute>
  );
}
