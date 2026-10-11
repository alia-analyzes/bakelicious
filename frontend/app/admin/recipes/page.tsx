'use client';

import React, { useEffect, useState } from 'react';
import { Sidebar } from '@/components/layout/Sidebar';
import { Header } from '@/components/layout/Header';
import { ProtectedRoute } from '@/components/auth/ProtectedRoute';
import { api } from '@/lib/api';
import { Product, Ingredient } from '@/types';
import { showToast } from '@/lib/toast';
import { UtensilsCrossed, Plus, Trash2, IndianRupee, Sparkles, CheckCircle2 } from 'lucide-react';

export default function AdminRecipesPage() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [products, setProducts] = useState<Product[]>([]);
  const [ingredients, setIngredients] = useState<Ingredient[]>([]);
  const [selectedProductId, setSelectedProductId] = useState<number | ''>('');
  const [recipeItems, setRecipeItems] = useState<Array<{ ingredient_id: number; quantity: number }>>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [pRes, iRes] = await Promise.all([
        api.get('/products'),
        api.get('/ingredients')
      ]);
      setProducts(pRes.data);
      setIngredients(iRes.data);
      if (pRes.data.length > 0) {
        setSelectedProductId(pRes.data[0].id);
        loadProductRecipe(pRes.data[0]);
      }
    } catch (err) {
      console.error('Failed to load recipe data:', err);
    } finally {
      setLoading(false);
    }
  };

  const loadProductRecipe = (p: Product) => {
    if (p.recipe?.items) {
      setRecipeItems(p.recipe.items.map((i: any) => ({ ingredient_id: i.ingredient_id, quantity: i.quantity || i.quantity_required || 0 })));
    } else {
      setRecipeItems([
        { ingredient_id: ingredients[0]?.id || 1, quantity: 0.5 },
        { ingredient_id: ingredients[1]?.id || 2, quantity: 0.2 }
      ]);
    }
  };

  const handleProductSelect = (id: number) => {
    setSelectedProductId(id);
    const found = products.find((p) => p.id === id);
    if (found) loadProductRecipe(found);
  };

  const handleAddIngredientRow = () => {
    if (ingredients.length === 0) return;
    setRecipeItems([...recipeItems, { ingredient_id: ingredients[0].id, quantity: 0.1 }]);
  };

  const handleRemoveRow = (index: number) => {
    setRecipeItems(recipeItems.filter((_, i) => i !== index));
  };

  const handleItemChange = (index: number, field: string, val: any) => {
    const updated = [...recipeItems];
    updated[index] = { ...updated[index], [field]: Number(val) };
    setRecipeItems(updated);
  };

  // Calculate live recipe cost
  const totalRecipeCost = recipeItems.reduce((sum, item) => {
    const ing = ingredients.find((i) => i.id === item.ingredient_id);
    const unitCost = ing?.unit_cost || 0;
    return sum + unitCost * (item.quantity || 0);
  }, 0);

  const activeProduct = products.find((p) => p.id === selectedProductId);

  const handleSaveRecipe = async () => {
    if (!selectedProductId) return;
    try {
      await api.put(`/products/${selectedProductId}`, {
        recipe: { items: recipeItems },
        calculated_cost: totalRecipeCost,
        use_manual_cost: false
      });
      showToast('Recipe & calculated ingredient cost saved!', 'success');
      fetchData();
    } catch (err) {
      showToast('Failed to save recipe', 'error');
    }
  };

  return (
    <ProtectedRoute requiredPermission="RECIPES_VIEW">
      <div className="min-h-screen bg-cream-200 dark:bg-maroon-950 text-charcoal dark:text-cream-100 flex font-sans">
        <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

        <div className="flex-1 flex flex-col min-w-0 lg:pl-64">
          <Header onOpenSidebar={() => setSidebarOpen(true)} title="Cake Recipe Builder & Ingredient Costing" />

          <main className="flex-1 p-4 sm:p-6 lg:p-8 space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-cream-100 dark:bg-maroon-900 p-5 rounded-3xl border border-cream-300 dark:border-maroon-800 shadow-sm">
              <div>
                <h1 className="text-2xl font-extrabold font-serif text-maroon-950 dark:text-cream-100">
                  Recipe &amp; Formulation Management
                </h1>
                <p className="text-xs text-charcoal-muted dark:text-cream-300/80 font-medium mt-0.5">
                  Build cake recipes, link inventory ingredients, and calculate automatic recipe costs.
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
              {/* Product Selector */}
              <div className="lg:col-span-4 bg-cream-100 dark:bg-maroon-900 p-5 rounded-3xl border border-cream-300 dark:border-maroon-800 shadow-sm space-y-3">
                <h3 className="text-base font-bold text-maroon-950 dark:text-cream-100 font-serif">
                  Select Cake / Product
                </h3>
                <div className="space-y-2 max-h-[60vh] overflow-y-auto pr-1">
                  {products.map((p) => (
                    <button
                      key={p.id}
                      onClick={() => handleProductSelect(p.id)}
                      className={`w-full text-left p-3 rounded-2xl border transition flex items-center justify-between ${
                        selectedProductId === p.id
                          ? 'bg-maroon-700 text-cream-100 border-maroon-800 shadow-sm'
                          : 'bg-cream-200 dark:bg-maroon-800/60 border-cream-300 dark:border-maroon-700 hover:bg-cream-300'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl overflow-hidden bg-cream-300 shrink-0">
                          <img src={p.image_url || '/images/cakes/chocolate-delight.jpg'} alt={p.name} className="w-full h-full object-cover" />
                        </div>
                        <div>
                          <span className="font-bold text-xs block truncate max-w-[150px]">{p.name}</span>
                          <span className="text-[10px] opacity-80">Selling ₹{p.price}</span>
                        </div>
                      </div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Recipe Builder */}
              <div className="lg:col-span-8 bg-cream-100 dark:bg-maroon-900 p-6 rounded-3xl border border-cream-300 dark:border-maroon-800 shadow-sm space-y-6">
                {activeProduct ? (
                  <>
                    <div className="flex items-center justify-between border-b border-cream-300 dark:border-maroon-800 pb-4">
                      <div>
                        <h2 className="text-xl font-extrabold text-maroon-950 dark:text-cream-100 font-serif">
                          Recipe: {activeProduct.name}
                        </h2>
                        <p className="text-xs text-charcoal-muted dark:text-cream-300/80 font-medium">
                          Link raw ingredients to auto-compute total ingredient cost per cake.
                        </p>
                      </div>

                      <div className="p-3 bg-cream-200 dark:bg-maroon-800 rounded-2xl text-right">
                        <span className="text-[10px] text-charcoal-muted dark:text-cream-300 block font-bold uppercase">Calculated Cost</span>
                        <span className="text-xl font-extrabold text-maroon-900 dark:text-cream-100 font-serif">₹{totalRecipeCost.toFixed(2)}</span>
                      </div>
                    </div>

                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <h4 className="font-bold text-xs text-maroon-900 dark:text-cream-200">Ingredients Formulation List</h4>
                        <button
                          onClick={handleAddIngredientRow}
                          className="text-xs text-maroon-700 dark:text-cream-200 font-bold hover:underline flex items-center gap-1"
                        >
                          <Plus className="w-3.5 h-3.5" />
                          <span>Add Ingredient</span>
                        </button>
                      </div>

                      <div className="space-y-2">
                        {recipeItems.map((item, idx) => {
                          const matchedIng = ingredients.find((i) => i.id === item.ingredient_id);
                          const lineCost = (matchedIng?.unit_cost || 0) * (item.quantity || 0);

                          return (
                            <div key={idx} className="flex items-center gap-3 bg-cream-200 dark:bg-maroon-800/80 p-3 rounded-2xl border border-cream-300 dark:border-maroon-700 text-xs">
                              <select
                                value={item.ingredient_id}
                                onChange={(e) => handleItemChange(idx, 'ingredient_id', e.target.value)}
                                className="flex-1 px-3 py-2 bg-cream-100 dark:bg-maroon-900 border border-cream-300 dark:border-maroon-700 rounded-xl font-medium text-maroon-900 dark:text-cream-100"
                              >
                                {ingredients.map((ing) => (
                                  <option key={ing.id} value={ing.id}>
                                    {ing.name} (₹{ing.unit_cost}/{ing.unit})
                                  </option>
                                ))}
                              </select>

                              <div className="w-32 flex items-center gap-1">
                                <input
                                  type="number"
                                  step="0.05"
                                  value={item.quantity}
                                  onChange={(e) => handleItemChange(idx, 'quantity', e.target.value)}
                                  className="w-20 px-2.5 py-2 bg-cream-100 dark:bg-maroon-900 border border-cream-300 dark:border-maroon-700 rounded-xl font-bold text-center text-maroon-900 dark:text-cream-100"
                                />
                                <span className="text-[11px] text-charcoal-muted font-bold">{matchedIng?.unit || 'kg'}</span>
                              </div>

                              <div className="w-24 text-right font-bold text-maroon-900 dark:text-cream-100">
                                ₹{lineCost.toFixed(2)}
                              </div>

                              <button
                                onClick={() => handleRemoveRow(idx)}
                                className="p-2 text-rose-700 dark:text-rose-400 hover:bg-rose-100 dark:hover:bg-rose-950 rounded-xl"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                          );
                        })}
                      </div>
                    </div>

                    <div className="pt-4 border-t border-cream-300 dark:border-maroon-800 flex items-center justify-between">
                      <div className="text-xs text-charcoal-muted font-medium">
                        Selling Price: <strong className="text-emerald-800 dark:text-emerald-300">₹{activeProduct.price}</strong> | Margin: <strong className="text-maroon-900 dark:text-cream-100">{(((activeProduct.price - totalRecipeCost) / activeProduct.price) * 100).toFixed(1)}%</strong>
                      </div>

                      <button
                        onClick={handleSaveRecipe}
                        className="px-6 py-3 bg-maroon-700 hover:bg-maroon-800 text-cream-100 font-bold rounded-2xl text-xs shadow-md transition"
                      >
                        Save Recipe &amp; Update Costing
                      </button>
                    </div>
                  </>
                ) : (
                  <div className="py-20 text-center text-xs font-bold text-charcoal-muted">
                    Select a product from the left to edit its recipe.
                  </div>
                )}
              </div>
            </div>
          </main>
        </div>
      </div>
    </ProtectedRoute>
  );
}
