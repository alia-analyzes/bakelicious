'use client';

import React, { useState, useEffect } from 'react';
import { Modal } from '@/components/ui/Modal';
import { Ingredient } from '@/types';
import { api } from '@/lib/api';
import { showToast } from '@/lib/toast';

interface IngredientModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  ingredient?: Ingredient | null;
}

export const IngredientModal: React.FC<IngredientModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  ingredient,
}) => {
  const [name, setName] = useState('');
  const [category, setCategory] = useState('Flour');
  const [quantity, setQuantity] = useState<number | ''>(0);
  const [unit, setUnit] = useState('kg');
  const [minStock, setMinStock] = useState<number | ''>(5.0);
  const [unitCost, setUnitCost] = useState<number | ''>(0);
  const [supplier, setSupplier] = useState('');
  const [saving, setSaving] = useState(false);

  const UNITS = ['kg', 'g', 'litre', 'ml', 'pcs', 'box', 'packet', 'dozen'];
  const CATEGORIES = ['Flour', 'Sugar', 'Dairy', 'Chocolate', 'Packaging', 'General'];

  useEffect(() => {
    if (ingredient) {
      setName(ingredient.name);
      setCategory(ingredient.category || 'General');
      setQuantity(ingredient.quantity);
      setUnit(ingredient.unit || 'kg');
      setMinStock(ingredient.min_stock);
      setUnitCost(ingredient.unit_cost);
      setSupplier(ingredient.supplier || '');
    } else {
      setName('');
      setCategory('Flour');
      setQuantity(0);
      setUnit('kg');
      setMinStock(5.0);
      setUnitCost(0);
      setSupplier('');
    }
  }, [ingredient, isOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    setSaving(true);
    try {
      const payload = {
        name,
        category,
        quantity: Number(quantity || 0),
        unit,
        min_stock: Number(minStock || 0),
        unit_cost: Number(unitCost || 0),
        supplier,
      };

      if (ingredient) {
        await api.put(`/ingredients/${ingredient.id}`, payload);
        showToast('Ingredient updated successfully', 'success');
      } else {
        await api.post('/ingredients', payload);
        showToast('Ingredient added successfully', 'success');
      }

      onSuccess();
      onClose();
    } catch (err: any) {
      showToast(err.response?.data?.detail || 'Failed to save ingredient', 'error');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={ingredient ? 'Edit Raw Ingredient' : 'Add Raw Material Ingredient'}
      subtitle="Track stock levels, minimum stock alerts, and unit purchase cost"
      maxWidth="md"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-xs font-semibold text-slate-700 mb-1">Ingredient Name *</label>
          <input
            type="text"
            required
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g. All Purpose Flour, Unsalted Butter"
            className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none"
          />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Category</label>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none"
            >
              {CATEGORIES.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Unit of Measurement</label>
            <select
              value={unit}
              onChange={(e) => setUnit(e.target.value)}
              className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none font-semibold"
            >
              {UNITS.map((u) => (
                <option key={u} value={u}>
                  {u}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Current Stock</label>
            <input
              type="number"
              step="0.001"
              value={quantity}
              onChange={(e) => setQuantity(e.target.value === '' ? '' : Number(e.target.value))}
              className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Min Stock Threshold</label>
            <input
              type="number"
              step="0.001"
              value={minStock}
              onChange={(e) => setMinStock(e.target.value === '' ? '' : Number(e.target.value))}
              className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Unit Cost (₹)</label>
            <input
              type="number"
              step="0.01"
              value={unitCost}
              onChange={(e) => setUnitCost(e.target.value === '' ? '' : Number(e.target.value))}
              className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold text-bakery-600 focus:outline-none"
            />
          </div>
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-700 mb-1">Supplier Name</label>
          <input
            type="text"
            value={supplier}
            onChange={(e) => setSupplier(e.target.value)}
            placeholder="e.g. Local Wholesale Dairy"
            className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none"
          />
        </div>

        <div className="flex flex-col-reverse sm:flex-row items-stretch sm:items-center justify-end gap-2.5 sm:gap-3 pt-4 border-t border-slate-100 dark:border-maroon-800">
          <button
            type="button"
            onClick={onClose}
            className="w-full sm:w-auto px-4 py-2 bg-slate-100 dark:bg-maroon-800 text-slate-700 dark:text-cream-200 text-xs font-semibold rounded-xl"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={saving}
            className="w-full sm:w-auto px-5 py-2 bg-bakery-600 hover:bg-bakery-700 text-white text-xs font-bold rounded-xl shadow-md disabled:opacity-50"
          >
            {saving ? 'Saving...' : ingredient ? 'Save Changes' : 'Add Ingredient'}
          </button>
        </div>
      </form>
    </Modal>
  );
};
