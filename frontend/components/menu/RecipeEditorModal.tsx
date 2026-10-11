'use client';

import React, { useState, useEffect } from 'react';
import { Modal } from '@/components/ui/Modal';
import { Product, Ingredient, RecipeItem } from '@/types';
import { api } from '@/lib/api';
import { showToast } from '@/lib/toast';
import { Plus, Trash2, Calculator } from 'lucide-react';

interface RecipeEditorModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  product: Product | null;
  ingredients: Ingredient[];
}

export const RecipeEditorModal: React.FC<RecipeEditorModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  product,
  ingredients,
}) => {
  const [recipeItems, setRecipeItems] = useState<{ ingredient_id: number; quantity_required: number; unit: string }[]>([]);
  const [selectedIngredientId, setSelectedIngredientId] = useState<number | ''>('');
  const [requiredQty, setRequiredQty] = useState<number | ''>('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (product && product.recipe && product.recipe.recipe_items) {
      setRecipeItems(
        product.recipe.recipe_items.map((item) => ({
          ingredient_id: item.ingredient_id,
          quantity_required: item.quantity_required,
          unit: item.unit || item.ingredient?.unit || 'kg',
        }))
      );
    } else {
      setRecipeItems([]);
    }
  }, [product, isOpen]);

  const handleAddItem = () => {
    if (!selectedIngredientId || requiredQty === '' || Number(requiredQty) <= 0) return;
    const ing = ingredients.find((i) => i.id === Number(selectedIngredientId));
    if (!ing) return;

    // Check if ingredient already added
    const existingIdx = recipeItems.findIndex((i) => i.ingredient_id === ing.id);
    if (existingIdx >= 0) {
      const updated = [...recipeItems];
      updated[existingIdx].quantity_required = Number(requiredQty);
      setRecipeItems(updated);
    } else {
      setRecipeItems([
        ...recipeItems,
        { ingredient_id: ing.id, quantity_required: Number(requiredQty), unit: ing.unit },
      ]);
    }

    setSelectedIngredientId('');
    setRequiredQty('');
  };

  const handleRemoveItem = (ingredientId: number) => {
    setRecipeItems(recipeItems.filter((i) => i.ingredient_id !== ingredientId));
  };

  const calculateTotalIngredientCost = () => {
    let total = 0;
    for (const item of recipeItems) {
      const ing = ingredients.find((i) => i.id === item.ingredient_id);
      if (ing) {
        total += item.quantity_required * ing.unit_cost;
      }
    }
    return total;
  };

  const handleSubmit = async () => {
    if (!product) return;
    setSaving(true);
    try {
      await api.post('/recipes', {
        product_id: product.id,
        items: recipeItems,
      });
      showToast('Recipe & automatic cost updated successfully', 'success');
      onSuccess();
      onClose();
    } catch (err: any) {
      showToast(err.response?.data?.detail || 'Failed to save recipe', 'error');
    } finally {
      setSaving(false);
    }
  };

  if (!product) return null;

  const totalCost = calculateTotalIngredientCost();
  const sellingPrice = product.price || 0;
  const profit = sellingPrice - totalCost;
  const margin = sellingPrice > 0 ? ((profit / sellingPrice) * 100).toFixed(1) : '0';

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={`Recipe & Costing: ${product.name}`}
      subtitle="Define ingredient quantities per batch for automatic cost calculation"
      maxWidth="2xl"
    >
      <div className="space-y-6">
        {/* Ingredient Selection Add Row */}
        <div className="p-4 bg-bakery-50 rounded-2xl border border-bakery-200 space-y-3">
          <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider">Add Ingredient to Recipe</h4>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <select
              value={selectedIngredientId}
              onChange={(e) => setSelectedIngredientId(Number(e.target.value))}
              className="px-3.5 py-2 bg-white border border-bakery-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-bakery-600"
            >
              <option value="">Select Raw Ingredient...</option>
              {ingredients.map((ing) => (
                <option key={ing.id} value={ing.id}>
                  {ing.name} ({ing.unit}) - ₹{ing.unit_cost}/{ing.unit}
                </option>
              ))}
            </select>

            <input
              type="number"
              step="0.001"
              value={requiredQty}
              onChange={(e) => setRequiredQty(e.target.value === '' ? '' : Number(e.target.value))}
              placeholder="Quantity Required"
              className="px-3.5 py-2 bg-white border border-bakery-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-bakery-600"
            />

            <button
              type="button"
              onClick={handleAddItem}
              className="px-4 py-2 bg-bakery-600 hover:bg-bakery-700 text-white rounded-xl text-xs font-bold transition flex items-center justify-center gap-1 shadow-sm"
            >
              <Plus className="w-4 h-4" />
              <span>Add Ingredient</span>
            </button>
          </div>
        </div>

        {/* Current Recipe Ingredients List */}
        <div>
          <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Recipe Items & Cost Breakdown</h4>
          <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
            {recipeItems.length > 0 ? (
              recipeItems.map((item) => {
                const ing = ingredients.find((i) => i.id === item.ingredient_id);
                const itemCost = ing ? item.quantity_required * ing.unit_cost : 0;
                return (
                  <div
                    key={item.ingredient_id}
                    className="flex items-center justify-between p-3 bg-slate-50 rounded-xl border border-slate-200"
                  >
                    <div>
                      <span className="text-xs font-bold text-slate-900">{ing?.name || 'Ingredient'}</span>
                      <span className="text-xs text-slate-500 ml-2">
                        {item.quantity_required} {item.unit} × ₹{ing?.unit_cost}/{item.unit}
                      </span>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="text-xs font-extrabold text-slate-800">₹{itemCost.toFixed(2)}</span>
                      <button
                        onClick={() => handleRemoveItem(item.ingredient_id)}
                        className="p-1 text-slate-400 hover:text-rose-600 transition"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                );
              })
            ) : (
              <p className="text-xs text-slate-400 text-center py-4">No ingredients added to this recipe yet.</p>
            )}
          </div>
        </div>

        {/* Cost Summary Box */}
        <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-2xl flex items-center justify-between text-xs">
          <div>
            <span className="text-slate-600">Calculated Ingredient Cost: </span>
            <span className="font-extrabold text-slate-900 text-sm">₹{totalCost.toFixed(2)}</span>
          </div>
          <div>
            <span className="text-slate-600">Profit: </span>
            <span className="font-extrabold text-emerald-700 text-sm">₹{profit.toFixed(2)} ({margin}%)</span>
          </div>
        </div>

        {/* Modal Buttons */}
        <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 bg-slate-100 text-slate-700 hover:bg-slate-200 text-xs font-semibold rounded-xl transition"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleSubmit}
            disabled={saving}
            className="px-5 py-2 bg-bakery-600 hover:bg-bakery-700 text-white text-xs font-bold rounded-xl transition shadow-md shadow-bakery-600/20 disabled:opacity-50"
          >
            {saving ? 'Saving Recipe...' : 'Save Recipe'}
          </button>
        </div>
      </div>
    </Modal>
  );
};
