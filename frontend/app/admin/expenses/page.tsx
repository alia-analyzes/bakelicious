'use client';

import React, { useEffect, useState } from 'react';
import { Sidebar } from '@/components/layout/Sidebar';
import { Header } from '@/components/layout/Header';
import { ProtectedRoute } from '@/components/auth/ProtectedRoute';
import { api } from '@/lib/api';
import { Expense } from '@/types';
import { Modal } from '@/components/ui/Modal';
import { showToast } from '@/lib/toast';
import { Plus, FileSpreadsheet, Trash2, IndianRupee } from 'lucide-react';

export default function AdminExpensesPage() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [loading, setLoading] = useState(true);

  // Modal
  const [modalOpen, setModalOpen] = useState(false);
  const [category, setCategory] = useState('Ingredients');
  const [amount, setAmount] = useState<number | ''>('');
  const [description, setDescription] = useState('');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);

  const CATEGORIES = ['Ingredients', 'Packaging Supplies', 'Rent & Utilities', 'Salaries & Wages', 'Equipment & Maintenance', 'Marketing & Social Media', 'Misc'];

  useEffect(() => {
    fetchExpenses();
  }, []);

  const fetchExpenses = async () => {
    try {
      setLoading(true);
      const res = await api.get('/expenses');
      setExpenses(res.data);
    } catch (err) {
      console.error('Failed to load expenses:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSaveExpense = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!amount || Number(amount) <= 0) {
      showToast('Please enter a valid expense amount', 'error');
      return;
    }

    try {
      await api.post('/expenses', {
        category,
        amount: Number(amount),
        description,
        expense_date: date
      });
      showToast('Expense recorded!', 'success');
      setModalOpen(false);
      setAmount('');
      setDescription('');
      fetchExpenses();
    } catch (err) {
      showToast('Failed to record expense', 'error');
    }
  };

  const handleDeleteExpense = async (id: number) => {
    if (!confirm('Are you sure you want to delete this expense entry?')) return;
    try {
      await api.delete(`/expenses/${id}`);
      showToast('Expense deleted', 'success');
      fetchExpenses();
    } catch (err) {
      showToast('Failed to delete expense', 'error');
    }
  };

  const totalExpense = expenses.reduce((sum, e) => sum + (e.amount || 0), 0);

  return (
    <ProtectedRoute requiredPermission="EXPENSES_VIEW">
      <div className="min-h-screen bg-cream-200 dark:bg-maroon-950 text-charcoal dark:text-cream-100 flex font-sans">
        <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

        <div className="flex-1 flex flex-col min-w-0 lg:pl-64">
          <Header onOpenSidebar={() => setSidebarOpen(true)} title="Bakery Operational Expenses" />

          <main className="flex-1 p-4 sm:p-6 lg:p-8 space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-cream-100 dark:bg-maroon-900 p-5 rounded-3xl border border-cream-300 dark:border-maroon-800 shadow-sm">
              <div>
                <h1 className="text-2xl font-extrabold font-serif text-maroon-950 dark:text-cream-100">
                  Bakery Expense Tracking
                </h1>
                <p className="text-xs text-charcoal-muted dark:text-cream-300/80 font-medium mt-0.5">
                  Log operational overheads, ingredients purchases, rent, utilities &amp; salaries.
                </p>
              </div>

              <button
                onClick={() => setModalOpen(true)}
                className="px-5 py-3 bg-maroon-700 hover:bg-maroon-800 text-cream-100 rounded-2xl text-xs font-bold transition shadow-md flex items-center gap-2 shrink-0"
              >
                <Plus className="w-4 h-4" />
                <span>Log New Expense</span>
              </button>
            </div>

            {/* Total Summary Card */}
            <div className="bg-cream-100 dark:bg-maroon-900 rounded-3xl p-6 border border-cream-300 dark:border-maroon-800 shadow-sm flex items-center justify-between">
              <div>
                <span className="text-xs font-bold text-charcoal-muted dark:text-cream-300 uppercase tracking-wider block">
                  Total Logged Expenses
                </span>
                <span className="text-3xl font-extrabold text-maroon-950 dark:text-cream-100 font-serif">
                  ₹{totalExpense.toLocaleString()}
                </span>
              </div>
              <div className="w-12 h-12 rounded-2xl bg-rose-100 dark:bg-rose-950 text-rose-800 dark:text-rose-300 flex items-center justify-center font-bold">
                <FileSpreadsheet className="w-6 h-6" />
              </div>
            </div>

            {/* Table */}
            <div className="bg-cream-100 dark:bg-maroon-900 rounded-3xl border border-cream-300 dark:border-maroon-800 shadow-sm overflow-hidden">
              {loading ? (
                <div className="py-20 text-center text-xs font-bold text-charcoal-muted">
                  Loading expenses...
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse text-xs">
                    <thead>
                      <tr className="border-b border-cream-300 dark:border-maroon-800 text-maroon-900 dark:text-cream-200 font-bold uppercase tracking-wider text-[10px] bg-cream-200/50 dark:bg-maroon-800/40">
                        <th className="py-3.5 px-4">Date</th>
                        <th className="py-3.5 px-4">Category</th>
                        <th className="py-3.5 px-4">Description</th>
                        <th className="py-3.5 px-4">Amount</th>
                        <th className="py-3.5 px-4 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-cream-300 dark:divide-maroon-800/50 font-medium">
                      {expenses.map((ex) => (
                        <tr key={ex.id} className="hover:bg-cream-200/40 dark:hover:bg-maroon-800/30 transition">
                          <td className="py-3.5 px-4 font-bold">
                            {new Date(ex.expense_date || ex.created_at).toLocaleDateString()}
                          </td>
                          <td className="py-3.5 px-4 font-bold text-maroon-900 dark:text-cream-200">
                            {ex.category}
                          </td>
                          <td className="py-3.5 px-4 text-charcoal-muted dark:text-cream-300/80">
                            {ex.description || 'General expense'}
                          </td>
                          <td className="py-3.5 px-4 font-extrabold text-rose-800 dark:text-rose-300">
                            ₹{ex.amount}
                          </td>
                          <td className="py-3.5 px-4 text-right">
                            <button
                              onClick={() => handleDeleteExpense(ex.id)}
                              className="p-1.5 text-rose-700 dark:text-rose-400 hover:bg-rose-100 rounded-lg"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
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

      <Modal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        title="Log Bakery Expense"
        subtitle="Record operational costs for profit calculation."
        maxWidth="md"
      >
        <form onSubmit={handleSaveExpense} className="space-y-4 text-xs">
          <div>
            <label className="block font-bold text-maroon-900 mb-1">Expense Category *</label>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="w-full px-3 py-2 bg-cream-100 border border-cream-300 rounded-xl font-medium"
            >
              {CATEGORIES.map((c) => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block font-bold text-maroon-900 mb-1">Amount ₹ *</label>
            <input
              type="number"
              required
              value={amount}
              onChange={(e) => setAmount(Number(e.target.value))}
              placeholder="e.g. 2500"
              className="w-full px-3 py-2 bg-cream-100 border border-cream-300 rounded-xl font-bold text-rose-800"
            />
          </div>

          <div>
            <label className="block font-bold text-maroon-900 mb-1">Date *</label>
            <input
              type="date"
              required
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="w-full px-3 py-2 bg-cream-100 border border-cream-300 rounded-xl font-medium"
            />
          </div>

          <div>
            <label className="block font-bold text-maroon-900 mb-1">Description / Notes</label>
            <textarea
              rows={2}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="e.g. Purchased 50kg Amul Butter & 20kg Heavy Cream"
              className="w-full px-3 py-2 bg-cream-100 border border-cream-300 rounded-xl font-medium"
            />
          </div>

          <div className="flex items-center justify-end gap-3 pt-4 border-t border-cream-300">
            <button
              type="button"
              onClick={() => setModalOpen(false)}
              className="px-4 py-2 bg-cream-200 text-maroon-900 font-bold rounded-xl"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2 bg-maroon-700 hover:bg-maroon-800 text-cream-100 font-bold rounded-xl shadow-md"
            >
              Log Expense
            </button>
          </div>
        </form>
      </Modal>
    </ProtectedRoute>
  );
}
