'use client';

import React, { useEffect, useState } from 'react';
import { Sidebar } from '@/components/layout/Sidebar';
import { Header } from '@/components/layout/Header';
import { Modal } from '@/components/ui/Modal';
import { ProtectedRoute } from '@/components/auth/ProtectedRoute';
import { api } from '@/lib/api';
import { Category } from '@/types';
import { showToast } from '@/lib/toast';
import { Plus, Edit, Trash2, Boxes } from 'lucide-react';

export default function AdminCategoriesPage() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);

  // Modal State
  const [modalOpen, setModalOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');

  useEffect(() => {
    fetchCategories();
  }, []);

  const fetchCategories = async () => {
    try {
      setLoading(true);
      const res = await api.get('/categories');
      setCategories(res.data);
    } catch (err) {
      console.error('Failed to load categories:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenAdd = () => {
    setEditingCategory(null);
    setName('');
    setDescription('');
    setModalOpen(true);
  };

  const handleOpenEdit = (c: Category) => {
    setEditingCategory(c);
    setName(c.name);
    setDescription(c.description || '');
    setModalOpen(true);
  };

  const handleSaveCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      showToast('Category name is required', 'error');
      return;
    }

    try {
      if (editingCategory) {
        await api.put(`/categories/${editingCategory.id}`, { name, description });
        showToast('Category updated!', 'success');
      } else {
        await api.post('/categories', { name, description });
        showToast(`Category "${name}" created & available in ERP catalog!`, 'success');
      }
      setModalOpen(false);
      fetchCategories();
    } catch (err: any) {
      showToast(err.response?.data?.detail || 'Failed to save category', 'error');
    }
  };

  const handleDeleteCategory = async (id: number) => {
    if (!confirm('Are you sure you want to delete this category?')) return;
    try {
      await api.delete(`/categories/${id}`);
      showToast('Category removed', 'success');
      fetchCategories();
    } catch (err) {
      showToast('Failed to delete category', 'error');
    }
  };

  return (
    <ProtectedRoute requiredPermission="CATEGORIES_VIEW">
      <div className="min-h-screen bg-cream-200 dark:bg-maroon-950 text-charcoal dark:text-cream-100 flex font-sans">
        <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

        <div className="flex-1 flex flex-col min-w-0 lg:pl-64">
          <Header onOpenSidebar={() => setSidebarOpen(true)} title="Category Management" />

          <main className="flex-1 p-3.5 sm:p-6 lg:p-8 space-y-5 sm:space-y-6 min-w-0">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-cream-100 dark:bg-maroon-900 p-4 sm:p-5 rounded-2xl sm:rounded-3xl border border-cream-300 dark:border-maroon-800 shadow-sm">
              <div>
                <h1 className="text-2xl font-extrabold font-serif text-maroon-950 dark:text-cream-100">
                  Dynamic Bakery Categories
                </h1>
                <p className="text-xs text-charcoal-muted dark:text-cream-300/80 font-medium mt-0.5">
                  Create and update product categories. Categorize cakes, desserts, and bakery items.
                </p>
              </div>

              <button
                onClick={handleOpenAdd}
                className="px-5 py-3 bg-maroon-700 hover:bg-maroon-800 text-cream-100 rounded-2xl text-xs font-bold transition shadow-md flex items-center justify-center gap-2 shrink-0 w-full sm:w-auto"
              >
                <Plus className="w-4 h-4" />
                <span>Add Category</span>
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
              {loading ? (
                <div className="col-span-full py-12 text-center text-xs font-bold text-charcoal-muted">
                  Loading categories...
                </div>
              ) : (
                categories.map((c) => (
                  <div
                    key={c.id}
                    className="bg-cream-100 dark:bg-maroon-900 rounded-2xl sm:rounded-3xl border border-cream-300 dark:border-maroon-800 p-4 sm:p-6 space-y-3.5 sm:space-y-4 shadow-sm hover:shadow-md transition flex flex-col justify-between"
                  >
                    <div className="space-y-2">
                      <div className="w-10 h-10 rounded-2xl bg-cream-200 dark:bg-maroon-800 text-maroon-700 dark:text-cream-200 flex items-center justify-center font-bold">
                        <Boxes className="w-5 h-5" />
                      </div>
                      <h3 className="text-lg font-bold text-maroon-950 dark:text-cream-100 font-serif">
                        {c.name}
                      </h3>
                      <p className="text-xs text-charcoal-muted dark:text-cream-300/80 leading-relaxed font-medium">
                        {c.description || 'Bakelicious artisanal category.'}
                      </p>
                    </div>

                    <div className="flex items-center justify-between pt-3 border-t border-cream-300 dark:border-maroon-800">
                      <span className="text-[11px] text-emerald-800 dark:text-emerald-300 font-bold">
                        ✓ Active in Catalog
                      </span>
                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => handleOpenEdit(c)}
                          className="p-2 min-w-[36px] min-h-[36px] flex items-center justify-center rounded-xl text-maroon-700 dark:text-cream-200 hover:bg-cream-200 dark:hover:bg-maroon-800 transition"
                          title="Edit Category"
                        >
                          <Edit className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDeleteCategory(c.id)}
                          className="p-2 min-w-[36px] min-h-[36px] flex items-center justify-center rounded-xl text-rose-700 dark:text-rose-400 hover:bg-rose-100 dark:hover:bg-rose-950 transition"
                          title="Delete Category"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </main>
        </div>
      </div>

      <Modal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editingCategory ? `Edit Category: ${editingCategory.name}` : 'Add New Category'}
        subtitle="This category will organize products across the ERP catalog."
        maxWidth="md"
      >
        <form onSubmit={handleSaveCategory} className="space-y-4 text-xs">
          <div>
            <label className="block font-bold text-maroon-900 mb-1">Category Name *</label>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Photo Cakes, Designer Cakes"
              className="w-full px-3.5 py-2 bg-cream-100 border border-cream-300 rounded-xl font-medium focus:outline-none"
            />
          </div>

          <div>
            <label className="block font-bold text-maroon-900 mb-1">Description</label>
            <textarea
              rows={3}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Short description of this cake category..."
              className="w-full px-3.5 py-2 bg-cream-100 border border-cream-300 rounded-xl font-medium focus:outline-none"
            />
          </div>

          <div className="flex flex-col-reverse sm:flex-row items-stretch sm:items-center justify-end gap-2.5 sm:gap-3 pt-4 border-t border-cream-300 dark:border-maroon-800">
            <button
              type="button"
              onClick={() => setModalOpen(false)}
              className="px-4 py-2.5 bg-cream-200 dark:bg-maroon-800 text-maroon-900 dark:text-cream-200 font-bold rounded-xl transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2.5 bg-maroon-700 hover:bg-maroon-800 text-cream-100 font-bold rounded-xl shadow-md transition"
            >
              Save Category
            </button>
          </div>
        </form>
      </Modal>
    </ProtectedRoute>
  );
}
