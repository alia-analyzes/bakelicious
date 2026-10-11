'use client';

import React, { useState } from 'react';
import { Modal } from '@/components/ui/Modal';
import { Ingredient } from '@/types';
import { api } from '@/lib/api';
import { showToast } from '@/lib/toast';

interface StockAdjustmentModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  ingredient: Ingredient | null;
}

export const StockAdjustmentModal: React.FC<StockAdjustmentModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  ingredient,
}) => {
  const [type, setType] = useState('PURCHASE');
  const [quantityChange, setQuantityChange] = useState<number | ''>('');
  const [notes, setNotes] = useState('');
  const [saving, setSaving] = useState(false);

  const TYPES = [
    { label: 'Purchase (Add Stock)', value: 'PURCHASE', sign: 1 },
    { label: 'Manual Adjustment (Add)', value: 'ADJUSTMENT_ADD', sign: 1 },
    { label: 'Manual Adjustment (Deduct)', value: 'ADJUSTMENT_SUB', sign: -1 },
    { label: 'Wastage / Spoilage', value: 'WASTAGE', sign: -1 },
    { label: 'Supplier Return', value: 'RETURN', sign: -1 },
  ];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!ingredient || quantityChange === '' || Number(quantityChange) === 0) return;

    let finalChange = Math.abs(Number(quantityChange));
    if (['ADJUSTMENT_SUB', 'WASTAGE', 'RETURN'].includes(type)) {
      finalChange = -finalChange;
    }

    setSaving(true);
    try {
      await api.post('/inventory/adjust', {
        ingredient_id: ingredient.id,
        type: type.replace('_ADD', '').replace('_SUB', ''),
        quantity_change: finalChange,
        notes,
      });
      showToast('Stock transaction recorded successfully', 'success');
      onSuccess();
      onClose();
    } catch (err: any) {
      showToast(err.response?.data?.detail || 'Failed to record stock change', 'error');
    } finally {
      setSaving(false);
    }
  };

  if (!ingredient) return null;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={`Adjust Stock: ${ingredient.name}`}
      subtitle={`Current Available Stock: ${ingredient.quantity} ${ingredient.unit}`}
      maxWidth="sm"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-xs font-semibold text-slate-700 mb-1">Transaction Type</label>
          <select
            value={type}
            onChange={(e) => setType(e.target.value)}
            className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none font-semibold"
          >
            {TYPES.map((t) => (
              <option key={t.value} value={t.value}>
                {t.label}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-700 mb-1">
            Quantity Amount ({ingredient.unit})
          </label>
          <input
            type="number"
            step="0.001"
            required
            value={quantityChange}
            onChange={(e) => setQuantityChange(e.target.value === '' ? '' : Number(e.target.value))}
            placeholder={`e.g. 5 ${ingredient.unit}`}
            className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold focus:outline-none"
          />
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-700 mb-1">Notes / Invoice #</label>
          <input
            type="text"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Reason for adjustment..."
            className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none"
          />
        </div>

        <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 bg-slate-100 text-slate-700 text-xs font-semibold rounded-xl"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={saving}
            className="px-5 py-2 bg-bakery-600 text-white text-xs font-bold rounded-xl shadow-md"
          >
            {saving ? 'Recording...' : 'Record Transaction'}
          </button>
        </div>
      </form>
    </Modal>
  );
};
