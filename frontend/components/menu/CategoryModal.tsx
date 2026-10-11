'use client';

import React, { useState } from 'react';
import { Modal } from '@/components/ui/Modal';
import { Category } from '@/types';
import { api } from '@/lib/api';
import { showToast } from '@/lib/toast';
import { Plus, Trash2 } from 'lucide-react';

interface CategoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  categories: Category[];
}

export const CategoryModal: React.FC<CategoryModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  categories,
}) => {
  const [newCatName, setNewCatName] = useState('');
  const [description, setDescription] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCatName.trim()) return;

    setSubmitting(true);
    try {
      await api.post('/categories', { name: newCatName.trim(), description });
      showToast('Category created successfully', 'success');
      setNewCatName('');
      setDescription('');
      onSuccess();
    } catch (err: any) {
      showToast(err.response?.data?.detail || 'Failed to create category', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (catId: number) => {
    try {
      await api.delete(`/categories/${catId}`);
      showToast('Category deleted successfully', 'success');
      onSuccess();
    } catch (err: any) {
      showToast(err.response?.data?.detail || 'Failed to delete category', 'error');
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Bakery Category CMS Manager"
      subtitle="Organize products into categories"
      maxWidth="md"
    >
      <div className="space-y-6">
        {/* Create Category Form */}
        <form onSubmit={handleCreate} className="p-4 bg-bakery-50 rounded-2xl border border-bakery-200 space-y-3">
          <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider">Add New Category</h4>
          <input
            type="text"
            required
            value={newCatName}
            onChange={(e) => setNewCatName(e.target.value)}
            placeholder="e.g. Custom Cakes, Tartlets"
            className="w-full px-3.5 py-2 bg-white border border-bakery-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-bakery-600"
          />
          <input
            type="text"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Short category description..."
            className="w-full px-3.5 py-2 bg-white border border-bakery-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-bakery-600"
          />
          <button
            type="submit"
            disabled={submitting}
            className="w-full py-2 bg-bakery-600 hover:bg-bakery-700 text-white rounded-xl text-xs font-bold transition shadow-sm"
          >
            {submitting ? 'Adding Category...' : 'Add Category'}
          </button>
        </form>

        {/* Existing Categories List */}
        <div>
          <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Existing Categories</h4>
          <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
            {categories.map((cat) => (
              <div
                key={cat.id}
                className="flex items-center justify-between p-3 bg-slate-50 rounded-xl border border-slate-200"
              >
                <div>
                  <p className="text-xs font-bold text-slate-900">{cat.name}</p>
                  {cat.description && <p className="text-[11px] text-slate-500">{cat.description}</p>}
                </div>
                <button
                  onClick={() => handleDelete(cat.id)}
                  className="p-1 text-slate-400 hover:text-rose-600 transition"
                  title="Delete Category"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>
        </div>
      </div>
    </Modal>
  );
};
