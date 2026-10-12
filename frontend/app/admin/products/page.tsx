'use client';

import React, { useEffect, useState } from 'react';
import { Sidebar } from '@/components/layout/Sidebar';
import { Header } from '@/components/layout/Header';
import { Modal } from '@/components/ui/Modal';
import { ProtectedRoute } from '@/components/auth/ProtectedRoute';
import { api, getImageUrl } from '@/lib/api';
import { Product, Category, Ingredient, RecipeItem } from '@/types';
import { showToast } from '@/lib/toast';
import { hasPermission, isSuperAdmin } from '@/lib/auth';
import {
  Plus,
  Search,
  Upload,
  Edit,
  Trash2,
  CheckCircle2,
  XCircle,
  Sparkles,
  IndianRupee,
  UtensilsCrossed,
  Image as ImageIcon,
  Tag,
  BookOpen,
  Boxes,
  ChefHat,
  Clock,
  Layers,
  ArrowRight
} from 'lucide-react';

export default function AdminProductsPage() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<'products' | 'categories'>('products');
  
  // Data states
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [ingredients, setIngredients] = useState<Ingredient[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selectedCategoryFilter, setSelectedCategoryFilter] = useState<string>('all');

  // Product Form Modal
  const [modalOpen, setModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [uploadingImage, setUploadingImage] = useState(false);

  // Form Fields
  const [name, setName] = useState('');
  const [categoryId, setCategoryId] = useState<number | ''>('');
  const [sku, setSku] = useState('');
  const [description, setDescription] = useState('');
  const [sellingPrice, setSellingPrice] = useState<number | ''>('');
  const [costPrice, setCostPrice] = useState<number | ''>('');
  const [prepTimeHours, setPrepTimeHours] = useState<number>(1.0);
  const [size, setSize] = useState('1 Pound');
  const [availability, setAvailability] = useState(true);
  const [publicVisibility, setPublicVisibility] = useState(true);
  const [featured, setFeatured] = useState(false);
  const [imageUrl, setImageUrl] = useState('');
  const [tagsInput, setTagsInput] = useState('Best Seller, Fresh');
  const [sizesList, setSizesList] = useState<Array<{ size: string; selling_price: number; cost_price: number }>>([
    { size: '1 Pound', selling_price: 1050, cost_price: 650 },
    { size: '2 Pound', selling_price: 1900, cost_price: 1150 }
  ]);

  // Recipe View / Edit Modal for clicked cake
  const [recipeModalOpen, setRecipeModalOpen] = useState(false);
  const [selectedCakeForRecipe, setSelectedCakeForRecipe] = useState<Product | null>(null);
  const [recipeItems, setRecipeItems] = useState<Array<{ ingredient_id: number; quantity: number; unit?: string }>>([]);
  const [recipeNotes, setRecipeNotes] = useState<string>('');
  const [isEditingRecipe, setIsEditingRecipe] = useState(false);
  const [savingRecipe, setSavingRecipe] = useState(false);

  // Category Modal
  const [catModalOpen, setCatModalOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [catName, setCatName] = useState('');
  const [catDescription, setCatDescription] = useState('');

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [prodRes, catRes, ingRes] = await Promise.all([
        api.get('/products?include_erp=true'),
        api.get('/categories'),
        api.get('/ingredients').catch(() => ({ data: [] }))
      ]);
      setProducts(prodRes.data);
      setCategories(catRes.data);
      setIngredients(ingRes.data);
      if (catRes.data.length > 0 && !categoryId) {
        setCategoryId(catRes.data[0].id);
      }
    } catch (err) {
      console.error('Failed to load products/categories:', err);
    } finally {
      setLoading(false);
    }
  };

  // Click on a cake to view its recipe
  const handleOpenRecipe = async (product: Product) => {
    setSelectedCakeForRecipe(product);
    setIsEditingRecipe(false);
    setRecipeModalOpen(true);

    try {
      // Try to fetch full recipe from backend
      const res = await api.get(`/recipes/product/${product.id}`);
      if (res.data) {
        const items = res.data.recipe_items || res.data.items || [];
        setRecipeItems(items.map((it: any) => ({
          ingredient_id: it.ingredient_id,
          quantity: Number(it.quantity_required || it.quantity || 0),
          unit: it.unit || ''
        })));
        setRecipeNotes(res.data.notes || product.description || '');
        return;
      }
    } catch {
      // Fallback: check product.recipe or initialize standard ingredients
      if (product.recipe && (product.recipe as any).items) {
        const items = (product.recipe as any).items;
        setRecipeItems(items.map((it: any) => ({
          ingredient_id: it.ingredient_id,
          quantity: Number(it.quantity || it.quantity_required || 0),
          unit: it.unit || ''
        })));
        setRecipeNotes((product.recipe as any).notes || product.description || '');
      } else if (ingredients.length > 0) {
        // Sample standard recipe template for bakery
        setRecipeItems([
          { ingredient_id: ingredients[0]?.id || 1, quantity: 0.5, unit: ingredients[0]?.unit || 'kg' },
          { ingredient_id: ingredients[1]?.id || 2, quantity: 0.25, unit: ingredients[1]?.unit || 'kg' }
        ]);
        setRecipeNotes(`Standard artisan formulation for ${product.name}. Bake at 180°C for 35 minutes.`);
      } else {
        setRecipeItems([]);
        setRecipeNotes(product.description || '');
      }
    }
  };

  const handleSaveRecipe = async () => {
    if (!selectedCakeForRecipe) return;
    try {
      setSavingRecipe(true);
      await api.post('/recipes', {
        product_id: selectedCakeForRecipe.id,
        items: recipeItems.map(it => ({
          ingredient_id: it.ingredient_id,
          quantity_required: Number(it.quantity),
          unit: it.unit || ingredients.find(ing => ing.id === it.ingredient_id)?.unit || 'units'
        })),
        notes: recipeNotes
      });

      // Also update product's calculated cost
      const calcCost = recipeItems.reduce((acc, it) => {
        const ing = ingredients.find(i => i.id === it.ingredient_id);
        return acc + (Number(it.quantity) * Number(ing?.unit_cost || 0));
      }, 0);

      await api.put(`/products/${selectedCakeForRecipe.id}`, {
        calculated_cost: calcCost,
        use_manual_cost: false
      });

      showToast(`Recipe for "${selectedCakeForRecipe.name}" updated successfully!`, 'success');
      setIsEditingRecipe(false);
      fetchData();
    } catch (err: any) {
      showToast(err.response?.data?.detail || 'Failed to save recipe', 'error');
    } finally {
      setSavingRecipe(false);
    }
  };

  const handleAddRecipeIngredient = () => {
    if (ingredients.length === 0) return;
    setRecipeItems([
      ...recipeItems,
      { ingredient_id: ingredients[0].id, quantity: 0.1, unit: ingredients[0].unit }
    ]);
  };

  const handleRemoveRecipeIngredient = (index: number) => {
    setRecipeItems(recipeItems.filter((_, i) => i !== index));
  };

  // Product CRUD
  const handleOpenAdd = () => {
    setEditingProduct(null);
    setName('');
    setCategoryId(categories[0]?.id || '');
    setSku(`BK-PROD-${Date.now().toString().slice(-4)}`);
    setDescription('');
    setSellingPrice(1050);
    setCostPrice(650);
    setPrepTimeHours(2.5);
    setSize('1 Pound');
    setAvailability(true);
    setPublicVisibility(true);
    setFeatured(false);
    setImageUrl('/images/cakes/belgian-chocolate.jpg');
    setTagsInput('Best Seller, Artisan');
    setSizesList([
      { size: '1 Pound', selling_price: 1050, cost_price: 650 },
      { size: '2 Pound', selling_price: 1900, cost_price: 1150 }
    ]);
    setModalOpen(true);
  };

  const handleOpenEdit = (p: Product) => {
    setEditingProduct(p);
    setName(p.name);
    setCategoryId(p.category_id);
    setSku(p.sku || '');
    setDescription(p.description || '');
    setSellingPrice(p.price);
    setCostPrice(p.manual_cost || p.calculated_cost || 0);
    setPrepTimeHours(p.prep_time_hours || 1.0);
    setSize(p.size || '1 Pound');
    setAvailability(p.availability);
    setPublicVisibility(p.public_visibility !== false);
    setFeatured(p.featured || false);
    setImageUrl(p.image_url || '');
    setTagsInput((p.tags || []).join(', '));
    if (p.sizes && Array.isArray(p.sizes) && p.sizes.length > 0) {
      setSizesList(p.sizes);
    } else {
      setSizesList([
        { size: p.size || '1 Pound', selling_price: p.price, cost_price: p.manual_cost || 650 }
      ]);
    }
    setModalOpen(true);
  };

  const handleSaveProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !categoryId || sellingPrice === '') {
      showToast('Name, Category, and Selling Price are required', 'error');
      return;
    }

    const payload = {
      name,
      category_id: Number(categoryId),
      sku: sku || undefined,
      description: description || undefined,
      price: Number(sellingPrice),
      size,
      manual_cost: costPrice !== '' ? Number(costPrice) : undefined,
      use_manual_cost: costPrice !== '',
      prep_time_hours: prepTimeHours,
      availability,
      public_visibility: publicVisibility,
      featured,
      image_url: imageUrl || undefined,
      tags: tagsInput.split(',').map((t) => t.trim()).filter(Boolean),
      sizes: sizesList
    };

    try {
      if (editingProduct) {
        await api.put(`/products/${editingProduct.id}`, payload);
        showToast('Product updated successfully!', 'success');
      } else {
        await api.post('/products', payload);
        showToast('New product created!', 'success');
      }
      setModalOpen(false);
      fetchData();
    } catch (err: any) {
      showToast(err.response?.data?.detail || 'Failed to save product', 'error');
    }
  };

  const handleDeleteProduct = async (id: number) => {
    if (!confirm('Are you sure you want to delete this product?')) return;
    try {
      await api.delete(`/products/${id}`);
      showToast('Product removed', 'success');
      fetchData();
    } catch (err) {
      showToast('Failed to delete product', 'error');
    }
  };

  // Category CRUD
  const handleOpenAddCategory = () => {
    setEditingCategory(null);
    setCatName('');
    setCatDescription('');
    setCatModalOpen(true);
  };

  const handleOpenEditCategory = (c: Category) => {
    setEditingCategory(c);
    setCatName(c.name);
    setCatDescription(c.description || '');
    setCatModalOpen(true);
  };

  const handleSaveCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!catName.trim()) {
      showToast('Category name is required', 'error');
      return;
    }

    try {
      if (editingCategory) {
        await api.put(`/categories/${editingCategory.id}`, {
          name: catName,
          description: catDescription
        });
        showToast('Category updated!', 'success');
      } else {
        await api.post('/categories', {
          name: catName,
          description: catDescription
        });
        showToast(`Category "${catName}" added!`, 'success');
      }
      setCatModalOpen(false);
      fetchData();
    } catch (err: any) {
      showToast(err.response?.data?.detail || 'Failed to save category', 'error');
    }
  };

  const handleDeleteCategory = async (id: number) => {
    if (!confirm('Are you sure you want to delete this category?')) return;
    try {
      await api.delete(`/categories/${id}`);
      showToast('Category deleted', 'success');
      fetchData();
    } catch (err) {
      showToast('Failed to delete category', 'error');
    }
  };

  // Filtering
  const filteredProducts = products.filter((p) => {
    if (selectedCategoryFilter !== 'all' && String(p.category_id) !== selectedCategoryFilter) {
      return false;
    }
    if (search.trim()) {
      const q = search.toLowerCase();
      const matchName = p.name.toLowerCase().includes(q);
      const matchSku = p.sku ? p.sku.toLowerCase().includes(q) : false;
      if (!matchName && !matchSku) return false;
    }
    return true;
  });

  const canCreate = isSuperAdmin() || hasPermission('PRODUCTS_CREATE');
  const canEdit = isSuperAdmin() || hasPermission('PRODUCTS_EDIT');
  const canDelete = isSuperAdmin() || hasPermission('PRODUCTS_DELETE');
  const canViewCost = isSuperAdmin() || hasPermission('COSTING_VIEW');

  return (
    <ProtectedRoute requiredPermission="PRODUCTS_VIEW">
      <div className="min-h-screen bg-cream-200 dark:bg-maroon-950 text-charcoal dark:text-cream-100 flex font-sans">
        <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

        <div className="flex-1 flex flex-col min-w-0 lg:pl-64">
          <Header onOpenSidebar={() => setSidebarOpen(true)} title="Products & Menu Management" />

          <main className="flex-1 p-4 sm:p-6 lg:p-8 space-y-6">
            {/* Header Action Bar */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-cream-100 dark:bg-maroon-900 p-5 rounded-3xl border border-cream-300 dark:border-maroon-800 shadow-sm">
              <div>
                <h1 className="text-2xl font-extrabold font-serif text-maroon-950 dark:text-cream-100">
                  Products &amp; Bakery Menu
                </h1>
                <p className="text-xs text-charcoal-muted dark:text-cream-300/80 font-medium mt-0.5">
                  Manage artisan cakes, menu categories, recipe ingredient costs, and baker specifications.
                </p>
              </div>

              {/* Top Sub-Navigation Tabs */}
              <div className="flex items-center gap-2">
                <div className="bg-cream-200 dark:bg-maroon-800 p-1 rounded-2xl flex items-center border border-cream-300 dark:border-maroon-700">
                  <button
                    onClick={() => setActiveTab('products')}
                    className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-1.5 ${
                      activeTab === 'products'
                        ? 'bg-maroon-700 text-cream-100 shadow-sm'
                        : 'text-charcoal-muted dark:text-cream-300 hover:text-maroon-900'
                    }`}
                  >
                    <UtensilsCrossed className="w-3.5 h-3.5" />
                    <span>Cakes &amp; Products ({products.length})</span>
                  </button>
                  <button
                    onClick={() => setActiveTab('categories')}
                    className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-1.5 ${
                      activeTab === 'categories'
                        ? 'bg-maroon-700 text-cream-100 shadow-sm'
                        : 'text-charcoal-muted dark:text-cream-300 hover:text-maroon-900'
                    }`}
                  >
                    <Boxes className="w-3.5 h-3.5" />
                    <span>Menu Categories ({categories.length})</span>
                  </button>
                </div>

                {activeTab === 'products' && canCreate && (
                  <button
                    onClick={handleOpenAdd}
                    className="px-4 py-2.5 bg-maroon-700 hover:bg-maroon-800 text-cream-100 rounded-2xl text-xs font-bold transition shadow-md flex items-center gap-1.5 shrink-0"
                  >
                    <Plus className="w-4 h-4" />
                    <span>Add Cake</span>
                  </button>
                )}

                {activeTab === 'categories' && canCreate && (
                  <button
                    onClick={handleOpenAddCategory}
                    className="px-4 py-2.5 bg-maroon-700 hover:bg-maroon-800 text-cream-100 rounded-2xl text-xs font-bold transition shadow-md flex items-center gap-1.5 shrink-0"
                  >
                    <Plus className="w-4 h-4" />
                    <span>Add Category</span>
                  </button>
                )}
              </div>
            </div>

            {/* TAB 1: CAKES & PRODUCTS */}
            {activeTab === 'products' && (
              <div className="space-y-6">
                {/* Filter & Search Bar */}
                <div className="bg-cream-100 dark:bg-maroon-900 p-4 rounded-3xl border border-cream-300 dark:border-maroon-800 shadow-sm flex flex-col md:flex-row items-center justify-between gap-4">
                  <div className="relative w-full md:w-80">
                    <Search className="w-4 h-4 text-charcoal-muted dark:text-cream-400 absolute left-3.5 top-3" />
                    <input
                      type="text"
                      value={search}
                      onChange={(e) => setSearch(e.target.value)}
                      placeholder="Search cakes by name, SKU..."
                      className="w-full pl-10 pr-4 py-2.5 bg-cream-200 dark:bg-maroon-800 border border-cream-300 dark:border-maroon-700 rounded-2xl text-xs font-medium text-maroon-900 dark:text-cream-100 focus:outline-none"
                    />
                  </div>

                  <div className="flex items-center gap-2 overflow-x-auto w-full md:w-auto pb-1 md:pb-0">
                    <button
                      onClick={() => setSelectedCategoryFilter('all')}
                      className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition shrink-0 ${
                        selectedCategoryFilter === 'all'
                          ? 'bg-maroon-700 text-cream-100'
                          : 'bg-cream-200 dark:bg-maroon-800 text-charcoal dark:text-cream-200'
                      }`}
                    >
                      All Categories
                    </button>
                    {categories.map((cat) => (
                      <button
                        key={cat.id}
                        onClick={() => setSelectedCategoryFilter(String(cat.id))}
                        className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition shrink-0 ${
                          selectedCategoryFilter === String(cat.id)
                            ? 'bg-maroon-700 text-cream-100'
                            : 'bg-cream-200 dark:bg-maroon-800 text-charcoal dark:text-cream-200'
                        }`}
                      >
                        {cat.name}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Helper notice */}
                <div className="p-3.5 bg-amber-50 dark:bg-amber-950/60 border border-amber-200 dark:border-amber-800 rounded-2xl flex items-center justify-between text-xs text-amber-900 dark:text-amber-200">
                  <div className="flex items-center gap-2 font-medium">
                    <BookOpen className="w-4 h-4 text-amber-700 dark:text-amber-400 shrink-0" />
                    <span><strong>Pro Tip:</strong> Click on any cake below to view its formulation, ingredients, and recipe instructions!</span>
                  </div>
                </div>

                {/* Products Table */}
                <div className="bg-cream-100 dark:bg-maroon-900 rounded-3xl border border-cream-300 dark:border-maroon-800 shadow-sm overflow-hidden">
                  {loading ? (
                    <div className="py-20 text-center text-xs font-bold text-charcoal-muted">
                      Loading products...
                    </div>
                  ) : filteredProducts.length > 0 ? (
                    <div className="overflow-x-auto">
                      <table className="w-full text-left border-collapse text-xs">
                        <thead>
                          <tr className="border-b border-cream-300 dark:border-maroon-800 text-maroon-900 dark:text-cream-200 font-bold uppercase tracking-wider text-[10px] bg-cream-200/50 dark:bg-maroon-800/40">
                            <th className="py-3.5 px-4">Cake / Product</th>
                            <th className="py-3.5 px-4">Category</th>
                            <th className="py-3.5 px-4">Selling Price</th>
                            {canViewCost && <th className="py-3.5 px-4">Ingredient Cost</th>}
                            <th className="py-3.5 px-4">Recipe</th>
                            <th className="py-3.5 px-4">Status</th>
                            <th className="py-3.5 px-4 text-right">Actions</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-cream-300 dark:divide-maroon-800/50 font-medium">
                          {filteredProducts.map((p) => {
                            const cost = p.calculated_cost || p.manual_cost || 0;
                            const cat = categories.find((c) => c.id === p.category_id);
                            return (
                              <tr
                                key={p.id}
                                className="hover:bg-cream-200/40 dark:hover:bg-maroon-800/30 transition cursor-pointer"
                                onClick={() => handleOpenRecipe(p)}
                              >
                                <td className="py-3.5 px-4">
                                  <div className="flex items-center gap-3">
                                    <div className="w-12 h-12 rounded-xl bg-cream-200 dark:bg-maroon-800 border border-cream-300 dark:border-maroon-700 overflow-hidden shrink-0 flex items-center justify-center">
                                      {p.image_url ? (
                                        <img
                                          src={getImageUrl(p.image_url)}
                                          alt={p.name}
                                          className="w-full h-full object-cover"
                                          onError={(e) => {
                                            (e.target as HTMLElement).style.display = 'none';
                                          }}
                                        />
                                      ) : (
                                        <ImageIcon className="w-5 h-5 text-charcoal-muted" />
                                      )}
                                    </div>
                                    <div>
                                      <div className="flex items-center gap-2">
                                        <span className="font-bold text-maroon-950 dark:text-cream-100 text-sm hover:underline">
                                          {p.name}
                                        </span>
                                        {p.featured && (
                                          <span className="px-1.5 py-0.5 bg-amber-100 text-amber-900 border border-amber-300 rounded-md text-[9px] font-extrabold uppercase">
                                            Featured
                                          </span>
                                        )}
                                      </div>
                                      <div className="flex items-center gap-2 text-[10px] text-charcoal-muted dark:text-cream-300/70 mt-0.5">
                                        <span>SKU: {p.sku || 'N/A'}</span>
                                        <span>•</span>
                                        <span>Default: {p.size || '1 Pound'}</span>
                                      </div>
                                    </div>
                                  </div>
                                </td>

                                <td className="py-3.5 px-4">
                                  <span className="inline-block px-2.5 py-1 bg-cream-200 dark:bg-maroon-800 text-maroon-900 dark:text-cream-100 border border-cream-300 dark:border-maroon-700 rounded-xl text-[10px] font-bold">
                                    {cat?.name || 'Uncategorized'}
                                  </span>
                                </td>

                                <td className="py-3.5 px-4 font-extrabold text-maroon-950 dark:text-cream-100 text-sm">
                                  ₹{p.price}
                                </td>

                                {canViewCost && (
                                  <td className="py-3.5 px-4 font-bold text-charcoal-muted dark:text-cream-300">
                                    ₹{cost.toFixed(2)}
                                  </td>
                                )}

                                <td className="py-3.5 px-4" onClick={(e) => e.stopPropagation()}>
                                  <button
                                    onClick={() => handleOpenRecipe(p)}
                                    className="px-2.5 py-1.5 rounded-xl bg-amber-100 dark:bg-amber-950 text-amber-900 dark:text-amber-200 hover:bg-amber-200 border border-amber-300 dark:border-amber-800 text-xs font-bold transition flex items-center gap-1 shadow-2xs"
                                  >
                                    <BookOpen className="w-3.5 h-3.5 text-amber-700" />
                                    <span>View Recipe</span>
                                  </button>
                                </td>

                                <td className="py-3.5 px-4">
                                  {p.availability ? (
                                    <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-800 dark:text-emerald-300">
                                      <CheckCircle2 className="w-3.5 h-3.5" />
                                      Available
                                    </span>
                                  ) : (
                                    <span className="inline-flex items-center gap-1 text-[10px] font-bold text-rose-800 dark:text-rose-300">
                                      <XCircle className="w-3.5 h-3.5" />
                                      Sold Out
                                    </span>
                                  )}
                                </td>

                                <td className="py-3.5 px-4 text-right" onClick={(e) => e.stopPropagation()}>
                                  <div className="flex items-center justify-end gap-1.5">
                                    {canEdit && (
                                      <button
                                        onClick={() => handleOpenEdit(p)}
                                        title="Edit Cake"
                                        className="p-1.5 rounded-xl bg-cream-200 dark:bg-maroon-800 hover:bg-cream-300 dark:hover:bg-maroon-700 text-maroon-900 dark:text-cream-100 transition"
                                      >
                                        <Edit className="w-3.5 h-3.5" />
                                      </button>
                                    )}
                                    {canDelete && (
                                      <button
                                        onClick={() => handleDeleteProduct(p.id)}
                                        title="Delete Cake"
                                        className="p-1.5 rounded-xl bg-cream-200 dark:bg-maroon-800 hover:bg-rose-100 hover:text-rose-700 transition"
                                      >
                                        <Trash2 className="w-3.5 h-3.5" />
                                      </button>
                                    )}
                                  </div>
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  ) : (
                    <div className="py-16 text-center text-xs font-bold text-charcoal-muted">
                      No cakes found matching your criteria.
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* TAB 2: MENU CATEGORIES */}
            {activeTab === 'categories' && (
              <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                  {categories.map((c) => {
                    const cakesCount = products.filter((p) => p.category_id === c.id).length;
                    return (
                      <div
                        key={c.id}
                        className="bg-cream-100 dark:bg-maroon-900 p-5 rounded-3xl border border-cream-300 dark:border-maroon-800 shadow-sm flex flex-col justify-between space-y-4"
                      >
                        <div>
                          <div className="flex items-center justify-between">
                            <span className="w-8 h-8 rounded-xl bg-maroon-100 dark:bg-maroon-800 text-maroon-800 dark:text-cream-100 flex items-center justify-center font-bold">
                              <Boxes className="w-4 h-4" />
                            </span>
                            <span className="px-2 py-0.5 bg-cream-200 dark:bg-maroon-800 rounded-lg text-[10px] font-bold text-maroon-900 dark:text-cream-200">
                              {cakesCount} Cakes
                            </span>
                          </div>
                          <h3 className="text-base font-extrabold text-maroon-950 dark:text-cream-100 font-serif mt-3">
                            {c.name}
                          </h3>
                          <p className="text-xs text-charcoal-muted dark:text-cream-300/80 font-medium mt-1 line-clamp-2">
                            {c.description || 'No description provided.'}
                          </p>
                        </div>

                        <div className="flex items-center justify-between pt-3 border-t border-cream-200 dark:border-maroon-800">
                          <button
                            onClick={() => {
                              setSelectedCategoryFilter(String(c.id));
                              setActiveTab('products');
                            }}
                            className="text-xs font-bold text-maroon-700 dark:text-cream-300 hover:underline flex items-center gap-1"
                          >
                            <span>View cakes</span>
                            <ArrowRight className="w-3 h-3" />
                          </button>

                          <div className="flex items-center gap-1.5">
                            <button
                              onClick={() => handleOpenEditCategory(c)}
                              className="p-1.5 rounded-lg bg-cream-200 dark:bg-maroon-800 hover:bg-cream-300 dark:hover:bg-maroon-700 text-maroon-900 dark:text-cream-100 transition"
                            >
                              <Edit className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => handleDeleteCategory(c.id)}
                              className="p-1.5 rounded-lg bg-cream-200 dark:bg-maroon-800 hover:bg-rose-100 hover:text-rose-700 transition"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </main>
        </div>
      </div>

      {/* ================= MODAL: CAKE RECIPE & BAKER GUIDE ================= */}
      <Modal
        isOpen={recipeModalOpen}
        onClose={() => setRecipeModalOpen(false)}
        title={selectedCakeForRecipe ? `Recipe: ${selectedCakeForRecipe.name}` : 'Cake Recipe'}
        subtitle="Formulation, ingredient breakdown, and kitchen baking instructions"
        maxWidth="lg"
      >
        {selectedCakeForRecipe && (
          <div className="space-y-5 text-xs">
            {/* Cake Summary Card */}
            <div className="p-4 bg-cream-200 dark:bg-maroon-800 rounded-2xl flex flex-col sm:flex-row items-center gap-4 border border-cream-300 dark:border-maroon-700">
              <div className="w-16 h-16 rounded-xl bg-cream-100 overflow-hidden shrink-0 border border-cream-300 flex items-center justify-center">
                {selectedCakeForRecipe.image_url ? (
                  <img
                    src={getImageUrl(selectedCakeForRecipe.image_url)}
                    alt={selectedCakeForRecipe.name}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <ChefHat className="w-8 h-8 text-maroon-800" />
                )}
              </div>
              <div className="flex-1 text-center sm:text-left space-y-1">
                <div className="flex items-center justify-center sm:justify-start gap-2">
                  <h3 className="text-base font-extrabold text-maroon-950 dark:text-cream-100 font-serif">
                    {selectedCakeForRecipe.name}
                  </h3>
                  <span className="px-2 py-0.5 rounded-md bg-maroon-700 text-cream-100 text-[10px] font-bold">
                    {selectedCakeForRecipe.size || '1 Pound'}
                  </span>
                </div>
                <div className="flex flex-wrap items-center justify-center sm:justify-start gap-3 text-[11px] text-charcoal-muted dark:text-cream-300">
                  <span>Selling Price: <strong className="text-emerald-700 dark:text-emerald-300">₹{selectedCakeForRecipe.price}</strong></span>
                  <span>•</span>
                  <span>Prep Time: <strong>{selectedCakeForRecipe.prep_time_hours || 1.5} hrs</strong></span>
                </div>
              </div>

              {!isEditingRecipe && (
                <button
                  onClick={() => setIsEditingRecipe(true)}
                  className="px-3.5 py-2 bg-maroon-700 hover:bg-maroon-800 text-cream-100 rounded-xl font-bold shadow-sm transition flex items-center gap-1.5"
                >
                  <Edit className="w-3.5 h-3.5" />
                  <span>Edit Recipe</span>
                </button>
              )}
            </div>

            {/* Recipe Ingredients Breakdown */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h4 className="font-extrabold text-sm text-maroon-900 dark:text-cream-100 flex items-center gap-1.5">
                  <UtensilsCrossed className="w-4 h-4 text-maroon-700" />
                  <span>Required Ingredients &amp; Quantities</span>
                </h4>
                {isEditingRecipe && (
                  <button
                    onClick={handleAddRecipeIngredient}
                    className="px-3 py-1.5 bg-cream-300 dark:bg-maroon-700 text-maroon-900 dark:text-cream-100 rounded-xl font-bold transition flex items-center gap-1"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Add Ingredient</span>
                  </button>
                )}
              </div>

              <div className="bg-cream-100 dark:bg-maroon-900 rounded-2xl border border-cream-300 dark:border-maroon-800 overflow-hidden">
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="bg-cream-200/60 dark:bg-maroon-800 text-maroon-900 dark:text-cream-200 font-bold text-[10px] uppercase border-b border-cream-300 dark:border-maroon-700">
                      <th className="py-2.5 px-3">Ingredient</th>
                      <th className="py-2.5 px-3">Quantity Required</th>
                      <th className="py-2.5 px-3">Unit</th>
                      <th className="py-2.5 px-3">Estimated Cost</th>
                      {isEditingRecipe && <th className="py-2.5 px-3 text-right">Remove</th>}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-cream-200 dark:divide-maroon-800 font-medium">
                    {recipeItems.map((item, idx) => {
                      const ing = ingredients.find((i) => i.id === item.ingredient_id);
                      const unitCost = ing?.unit_cost || 0;
                      const subCost = unitCost * Number(item.quantity || 0);

                      return (
                        <tr key={idx} className="hover:bg-cream-200/40 dark:hover:bg-maroon-800/40">
                          <td className="py-2.5 px-3 font-bold text-maroon-950 dark:text-cream-100">
                            {isEditingRecipe ? (
                              <select
                                value={item.ingredient_id}
                                onChange={(e) => {
                                  const updated = [...recipeItems];
                                  const selectedId = Number(e.target.value);
                                  const selectedIng = ingredients.find(i => i.id === selectedId);
                                  updated[idx] = {
                                    ...updated[idx],
                                    ingredient_id: selectedId,
                                    unit: selectedIng?.unit || updated[idx].unit
                                  };
                                  setRecipeItems(updated);
                                }}
                                className="w-full px-2 py-1 bg-cream-200 dark:bg-maroon-800 border border-cream-300 dark:border-maroon-700 rounded-lg text-xs"
                              >
                                {ingredients.map((ingItem) => (
                                  <option key={ingItem.id} value={ingItem.id}>
                                    {ingItem.name} ({ingItem.unit})
                                  </option>
                                ))}
                              </select>
                            ) : (
                              ing?.name || `Ingredient #${item.ingredient_id}`
                            )}
                          </td>

                          <td className="py-2.5 px-3 font-bold">
                            {isEditingRecipe ? (
                              <input
                                type="number"
                                step="0.01"
                                min="0"
                                value={item.quantity}
                                onChange={(e) => {
                                  const updated = [...recipeItems];
                                  updated[idx] = { ...updated[idx], quantity: Number(e.target.value) };
                                  setRecipeItems(updated);
                                }}
                                className="w-24 px-2 py-1 bg-cream-200 dark:bg-maroon-800 border border-cream-300 dark:border-maroon-700 rounded-lg text-xs"
                              />
                            ) : (
                              item.quantity
                            )}
                          </td>

                          <td className="py-2.5 px-3 text-charcoal-muted dark:text-cream-300 font-mono">
                            {item.unit || ing?.unit || 'unit'}
                          </td>

                          <td className="py-2.5 px-3 font-extrabold text-emerald-800 dark:text-emerald-300">
                            ₹{subCost.toFixed(2)}
                          </td>

                          {isEditingRecipe && (
                            <td className="py-2.5 px-3 text-right">
                              <button
                                onClick={() => handleRemoveRecipeIngredient(idx)}
                                className="p-1 rounded-lg hover:bg-rose-100 text-rose-700"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </td>
                          )}
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Baking Notes / Kitchen Instructions */}
            <div className="space-y-2">
              <label className="font-extrabold text-sm text-maroon-900 dark:text-cream-100 flex items-center gap-1.5">
                <ChefHat className="w-4 h-4 text-maroon-700" />
                <span>Baker Notes &amp; Preparation Instructions</span>
              </label>
              {isEditingRecipe ? (
                <textarea
                  rows={4}
                  value={recipeNotes}
                  onChange={(e) => setRecipeNotes(e.target.value)}
                  placeholder="e.g. Preheat oven to 180°C. Whip egg whites until stiff peaks. Fold dry ingredients gently..."
                  className="w-full p-3 bg-cream-100 dark:bg-maroon-800 border border-cream-300 dark:border-maroon-700 rounded-xl text-xs font-medium focus:outline-none"
                />
              ) : (
                <div className="p-3.5 bg-cream-100 dark:bg-maroon-900 rounded-xl border border-cream-300 dark:border-maroon-800 text-xs font-medium text-charcoal dark:text-cream-200 leading-relaxed whitespace-pre-line">
                  {recipeNotes || 'No specific preparation instructions noted for this cake yet.'}
                </div>
              )}
            </div>

            {/* Action Buttons */}
            <div className="flex items-center justify-end gap-3 pt-3 border-t border-cream-300 dark:border-maroon-800">
              {isEditingRecipe ? (
                <>
                  <button
                    type="button"
                    onClick={() => setIsEditingRecipe(false)}
                    className="px-4 py-2 bg-cream-200 dark:bg-maroon-800 font-bold rounded-xl"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    disabled={savingRecipe}
                    onClick={handleSaveRecipe}
                    className="px-5 py-2 bg-emerald-700 hover:bg-emerald-800 text-white font-bold rounded-xl shadow-md flex items-center gap-2"
                  >
                    <CheckCircle2 className="w-4 h-4" />
                    <span>{savingRecipe ? 'Saving...' : 'Save Recipe & Costing'}</span>
                  </button>
                </>
              ) : (
                <button
                  type="button"
                  onClick={() => setRecipeModalOpen(false)}
                  className="px-5 py-2 bg-maroon-700 text-cream-100 font-bold rounded-xl"
                >
                  Close
                </button>
              )}
            </div>
          </div>
        )}
      </Modal>

      {/* ================= MODAL: PRODUCT CREATE / EDIT ================= */}
      <Modal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editingProduct ? `Edit ${editingProduct.name}` : 'Add New Artisan Product'}
        subtitle="Manage product info, size variations, and menu availability"
        maxWidth="lg"
      >
        <form onSubmit={handleSaveProduct} className="space-y-4 text-xs">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block font-bold text-maroon-900 dark:text-cream-100 mb-1">Product Name *</label>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Belgian Truffle Cake"
                className="w-full px-3.5 py-2 bg-cream-100 dark:bg-maroon-800 border border-cream-300 dark:border-maroon-700 rounded-xl font-medium focus:outline-none"
              />
            </div>

            <div>
              <label className="block font-bold text-maroon-900 dark:text-cream-100 mb-1">Menu Category *</label>
              <select
                required
                value={categoryId}
                onChange={(e) => setCategoryId(Number(e.target.value))}
                className="w-full px-3.5 py-2 bg-cream-100 dark:bg-maroon-800 border border-cream-300 dark:border-maroon-700 rounded-xl font-medium focus:outline-none"
              >
                {categories.map((c) => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block font-bold text-maroon-900 dark:text-cream-100 mb-1">Selling Price (₹) *</label>
              <input
                type="number"
                required
                min="0"
                value={sellingPrice}
                onChange={(e) => setSellingPrice(e.target.value ? Number(e.target.value) : '')}
                className="w-full px-3.5 py-2 bg-cream-100 dark:bg-maroon-800 border border-cream-300 dark:border-maroon-700 rounded-xl font-bold text-emerald-800 dark:text-emerald-300 focus:outline-none"
              />
            </div>

            <div>
              <label className="block font-bold text-maroon-900 dark:text-cream-100 mb-1">Estimated Cost (₹)</label>
              <input
                type="number"
                min="0"
                value={costPrice}
                onChange={(e) => setCostPrice(e.target.value ? Number(e.target.value) : '')}
                className="w-full px-3.5 py-2 bg-cream-100 dark:bg-maroon-800 border border-cream-300 dark:border-maroon-700 rounded-xl font-medium focus:outline-none"
              />
            </div>

            <div>
              <label className="block font-bold text-maroon-900 dark:text-cream-100 mb-1">Default Size</label>
              <input
                type="text"
                value={size}
                onChange={(e) => setSize(e.target.value)}
                placeholder="1 Pound / 500g"
                className="w-full px-3.5 py-2 bg-cream-100 dark:bg-maroon-800 border border-cream-300 dark:border-maroon-700 rounded-xl font-medium focus:outline-none"
              />
            </div>
          </div>

          <div>
            <label className="block font-bold text-maroon-900 dark:text-cream-100 mb-1">Description</label>
            <textarea
              rows={2}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Flavors, cocoa origin, allergy info..."
              className="w-full px-3.5 py-2 bg-cream-100 dark:bg-maroon-800 border border-cream-300 dark:border-maroon-700 rounded-xl font-medium focus:outline-none"
            />
          </div>

          <div className="flex items-center gap-6 pt-2">
            <label className="flex items-center gap-2 cursor-pointer font-bold text-maroon-900 dark:text-cream-100">
              <input
                type="checkbox"
                checked={availability}
                onChange={(e) => setAvailability(e.target.checked)}
                className="rounded text-maroon-700 w-4 h-4"
              />
              <span>Available in Stock</span>
            </label>

            <label className="flex items-center gap-2 cursor-pointer font-bold text-maroon-900 dark:text-cream-100">
              <input
                type="checkbox"
                checked={featured}
                onChange={(e) => setFeatured(e.target.checked)}
                className="rounded text-maroon-700 w-4 h-4"
              />
              <span>Featured on Homepage</span>
            </label>
          </div>

          <div className="flex items-center justify-end gap-3 pt-4 border-t border-cream-300 dark:border-maroon-800">
            <button
              type="button"
              onClick={() => setModalOpen(false)}
              className="px-4 py-2 bg-cream-200 dark:bg-maroon-800 font-bold rounded-xl"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2 bg-maroon-700 hover:bg-maroon-800 text-cream-100 font-bold rounded-xl shadow-md"
            >
              {editingProduct ? 'Save Changes' : 'Create Product'}
            </button>
          </div>
        </form>
      </Modal>

      {/* ================= MODAL: CATEGORY CREATE / EDIT ================= */}
      <Modal
        isOpen={catModalOpen}
        onClose={() => setCatModalOpen(false)}
        title={editingCategory ? `Edit Category: ${editingCategory.name}` : 'Add New Category'}
        subtitle="Manage bakery menu categories"
        maxWidth="md"
      >
        <form onSubmit={handleSaveCategory} className="space-y-4 text-xs">
          <div>
            <label className="block font-bold text-maroon-900 dark:text-cream-100 mb-1">Category Name *</label>
            <input
              type="text"
              required
              value={catName}
              onChange={(e) => setCatName(e.target.value)}
              placeholder="e.g. Bento Cakes, Wedding Cakes, Pastries"
              className="w-full px-3.5 py-2 bg-cream-100 dark:bg-maroon-800 border border-cream-300 dark:border-maroon-700 rounded-xl font-medium focus:outline-none"
            />
          </div>

          <div>
            <label className="block font-bold text-maroon-900 dark:text-cream-100 mb-1">Description</label>
            <textarea
              rows={3}
              value={catDescription}
              onChange={(e) => setCatDescription(e.target.value)}
              placeholder="Category overview and characteristics..."
              className="w-full px-3.5 py-2 bg-cream-100 dark:bg-maroon-800 border border-cream-300 dark:border-maroon-700 rounded-xl font-medium focus:outline-none"
            />
          </div>

          <div className="flex items-center justify-end gap-3 pt-4 border-t border-cream-300 dark:border-maroon-800">
            <button
              type="button"
              onClick={() => setCatModalOpen(false)}
              className="px-4 py-2 bg-cream-200 dark:bg-maroon-800 font-bold rounded-xl"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2 bg-maroon-700 hover:bg-maroon-800 text-cream-100 font-bold rounded-xl shadow-md"
            >
              {editingCategory ? 'Update Category' : 'Create Category'}
            </button>
          </div>
        </form>
      </Modal>
    </ProtectedRoute>
  );
}
