'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
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
  ArrowRight,
  ExternalLink,
  Eye,
  EyeOff,
  Check,
  RefreshCw,
  Camera,
  Grid
} from 'lucide-react';

// Preset high-quality bakery cake photos for instant 1-click selection
const PRESET_CAKE_IMAGES = [
  { name: 'Belgian Dark Truffle Indulgence', url: '/images/cakes/belgian-chocolate.jpg', category: 'Chocolate' },
  { name: 'Pastel Pink Korean Bento Cake', url: '/images/cakes/bento-pastel-pink.jpg', category: 'Bento Cakes' },
  { name: 'Bento Floating Art Minimalist', url: '/images/cakes/bento-floating.jpg', category: 'Bento Cakes' },
  { name: 'Handcrafted Chocolate Fudge', url: '/images/cakes/chocolate-delight.jpg', category: 'Chocolate' },
  { name: 'Classic Red Velvet Cream Cheese', url: '/images/cakes/red-velvet.jpg', category: 'Artisan Florals' },
  { name: 'Rose Pink 3-Tier Luxury Wedding', url: '/images/cakes/wedding-hero.jpg', category: 'Wedding Tiers' },
  { name: 'Wedding 3-Tier Floral Arch', url: '/images/cakes/wedding-3tier-floral.jpg', category: 'Wedding Tiers' },
  { name: 'Classic White Pearl Wedding', url: '/images/cakes/wedding-classic-white.jpg', category: 'Wedding Tiers' },
  { name: 'Seasonal Fresh Fruit Gateau', url: '/images/cakes/fresh-fruit.jpg', category: 'Fresh Fruit' },
  { name: 'Butterscotch Salted Caramel', url: '/images/cakes/butterscotch.jpg', category: 'Artisan Florals' },
  { name: 'Vanilla Celebration Cake', url: '/images/cakes/vanilla-celebration.jpg', category: 'Classic Cakes' },
  { name: 'Artisan Celebration Platter', url: '/images/cakes/cake-platter-1.jpg', category: 'Platters' }
];

export default function AdminProductsPage() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<'showcase' | 'products' | 'categories'>('products');
  
  // Data states
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [ingredients, setIngredients] = useState<Ingredient[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selectedCategoryFilter, setSelectedCategoryFilter] = useState<string>('all');

  // Product Form Modal (Add / Edit Cake with Photo & Details)
  const [modalOpen, setModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [presetPickerOpen, setPresetPickerOpen] = useState(false);

  // Form Fields
  const [name, setName] = useState('');
  const [categoryId, setCategoryId] = useState<number | ''>('');
  const [sku, setSku] = useState('');
  const [description, setDescription] = useState('');
  const [sellingPrice, setSellingPrice] = useState<number | ''>('');
  const [costPrice, setCostPrice] = useState<number | ''>('');
  const [prepTimeHours, setPrepTimeHours] = useState<number>(1.5);
  const [size, setSize] = useState('1 Pound');
  const [availability, setAvailability] = useState(true);
  const [publicVisibility, setPublicVisibility] = useState(true);
  const [featured, setFeatured] = useState(false);
  const [imageUrl, setImageUrl] = useState('/images/cakes/belgian-chocolate.jpg');
  const [tagsInput, setTagsInput] = useState('Best Seller, Fresh, Eggless');
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
      showToast('Could not load products. Please check connection.', 'error');
    } finally {
      setLoading(false);
    }
  };

  // Image Upload via API
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      showToast('Image size exceeds 5MB limit', 'error');
      return;
    }

    const formData = new FormData();
    formData.append('file', file);

    try {
      setUploadingImage(true);
      const res = await api.post('/uploads/image', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      if (res.data?.image_url) {
        setImageUrl(res.data.image_url);
        showToast('Cake picture uploaded successfully!', 'success');
      }
    } catch (err: any) {
      console.error('Upload failed:', err);
      showToast(err.response?.data?.detail || 'Failed to upload cake picture', 'error');
    } finally {
      setUploadingImage(false);
    }
  };

  // Quick toggle for catalog active visibility
  const handleTogglePublicVisibility = async (product: Product, e?: React.MouseEvent) => {
    e?.stopPropagation();
    const currentVis = product.public_visibility !== false;
    const newVis = !currentVis;
    try {
      await api.put(`/products/${product.id}`, {
        public_visibility: newVis
      });
      setProducts((prev) =>
        prev.map((p) => (p.id === product.id ? { ...p, public_visibility: newVis } : p))
      );
      showToast(
        newVis ? `"${product.name}" is now active in catalog!` : `"${product.name}" deactivated in catalog.`,
        'success'
      );
    } catch (err: any) {
      showToast(err.response?.data?.detail || 'Failed to update visibility', 'error');
    }
  };

  // Quick toggle for availability
  const handleToggleAvailability = async (product: Product, e?: React.MouseEvent) => {
    e?.stopPropagation();
    const newAvail = !product.availability;
    try {
      await api.put(`/products/${product.id}`, {
        availability: newAvail
      });
      setProducts((prev) =>
        prev.map((p) => (p.id === product.id ? { ...p, availability: newAvail } : p))
      );
      showToast(
        newAvail ? `"${product.name}" marked in stock.` : `"${product.name}" marked out of stock.`,
        'success'
      );
    } catch (err: any) {
      showToast(err.response?.data?.detail || 'Failed to update stock status', 'error');
    }
  };

  // Open Recipe Modal
  const handleOpenRecipe = async (product: Product) => {
    setSelectedCakeForRecipe(product);
    setIsEditingRecipe(false);
    setRecipeModalOpen(true);

    try {
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
      if (product.recipe && (product.recipe as any).items) {
        const items = (product.recipe as any).items;
        setRecipeItems(items.map((it: any) => ({
          ingredient_id: it.ingredient_id,
          quantity: Number(it.quantity || it.quantity_required || 0),
          unit: it.unit || ''
        })));
        setRecipeNotes((product.recipe as any).notes || product.description || '');
      } else if (ingredients.length > 0) {
        setRecipeItems([
          { ingredient_id: ingredients[0]?.id || 1, quantity: 0.5, unit: ingredients[0]?.unit || 'kg' },
          { ingredient_id: ingredients[1]?.id || 2, quantity: 0.25, unit: ingredients[1]?.unit || 'kg' }
        ]);
        setRecipeNotes(`Artisan formulation for ${product.name}. Bake at 180°C for 35 minutes.`);
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
    setSellingPrice(1150);
    setCostPrice(580);
    setPrepTimeHours(2.0);
    setSize('1 Pound');
    setAvailability(true);
    setPublicVisibility(true);
    setFeatured(false);
    setImageUrl('/images/cakes/belgian-chocolate.jpg');
    setTagsInput('Best Seller, Artisan, Eggless');
    setSizesList([
      { size: '1 Pound', selling_price: 1150, cost_price: 580 },
      { size: '2 Pound', selling_price: 2100, cost_price: 1100 }
    ]);
    setModalOpen(true);
  };

  const handleOpenEdit = (p: Product, e?: React.MouseEvent) => {
    e?.stopPropagation();
    setEditingProduct(p);
    setName(p.name);
    setCategoryId(p.category_id);
    setSku(p.sku || '');
    setDescription(p.description || '');
    setSellingPrice(p.price);
    setCostPrice(p.manual_cost || p.calculated_cost || 0);
    setPrepTimeHours(p.prep_time_hours || 1.5);
    setSize(p.size || '1 Pound');
    setAvailability(p.availability);
    setPublicVisibility(p.public_visibility !== false);
    setFeatured(p.featured || false);
    setImageUrl(p.image_url || '/images/cakes/belgian-chocolate.jpg');
    setTagsInput((p.tags || []).join(', '));
    if (p.sizes && Array.isArray(p.sizes) && p.sizes.length > 0) {
      setSizesList(p.sizes);
    } else {
      setSizesList([
        { size: p.size || '1 Pound', selling_price: p.price, cost_price: p.manual_cost || 580 }
      ]);
    }
    setModalOpen(true);
  };

  const handleSaveProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !categoryId || sellingPrice === '') {
      showToast('Cake Name, Menu Category, and Selling Price are required', 'error');
      return;
    }

    const payload = {
      name: name.trim(),
      category_id: Number(categoryId),
      sku: sku || undefined,
      description: description.trim() || undefined,
      price: Number(sellingPrice),
      size: size || '1 Pound',
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
        showToast('Cake details and photo updated!', 'success');
      } else {
        await api.post('/products', payload);
        showToast('New cake added to showcase and bakery menu!', 'success');
      }
      setModalOpen(false);
      fetchData();
    } catch (err: any) {
      showToast(err.response?.data?.detail || 'Failed to save product', 'error');
    }
  };

  const handleDeleteProduct = async (id: number, e?: React.MouseEvent) => {
    e?.stopPropagation();
    if (!confirm('Are you sure you want to delete this product from the ERP catalog?')) return;
    try {
      await api.delete(`/products/${id}`);
      showToast('Product removed from catalog', 'success');
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
      const matchDesc = p.description ? p.description.toLowerCase().includes(q) : false;
      const matchSku = p.sku ? p.sku.toLowerCase().includes(q) : false;
      if (!matchName && !matchDesc && !matchSku) return false;
    }
    return true;
  });

  const canCreate = isSuperAdmin() || hasPermission('PRODUCTS_CREATE');
  const canEdit = isSuperAdmin() || hasPermission('PRODUCTS_EDIT');
  const canDelete = isSuperAdmin() || hasPermission('PRODUCTS_DELETE');
  const canViewCost = isSuperAdmin() || hasPermission('COSTING_VIEW');

  // Stats
  const visibleCount = products.filter((p) => p.public_visibility !== false).length;
  const inStockCount = products.filter((p) => p.availability !== false).length;

  return (
    <ProtectedRoute requiredPermission="PRODUCTS_VIEW">
      <div className="min-h-screen bg-cream-200 dark:bg-maroon-950 text-charcoal dark:text-cream-100 flex font-sans">
        <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

        <div className="flex-1 flex flex-col min-w-0 lg:pl-64">
          <Header onOpenSidebar={() => setSidebarOpen(true)} title="Products & Recipes" />

          <main className="flex-1 p-3.5 sm:p-6 lg:p-8 space-y-6">
            
            {/* Top Action Bar with Neo-Brutalist Header */}
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 bg-cream-100 dark:bg-maroon-900 p-4 sm:p-6 rounded-3xl border-2 border-maroon-950/20 dark:border-cream-100/20 shadow-neo-sm">
              <div className="space-y-1">
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-cream-50 dark:bg-maroon-950 border border-maroon-950/20 dark:border-cream-100/20 text-[10px] font-black uppercase tracking-wider text-maroon-900 dark:text-cream-100">
                  <Sparkles className="w-3 h-3 text-amber-500 fill-amber-500" />
                  <span>Bakery ERP Catalog System</span>
                </div>
                <h1 className="text-xl sm:text-2xl lg:text-3xl font-black font-serif text-maroon-950 dark:text-cream-100 tracking-tight">
                  Products &amp; Master Recipes Catalog
                </h1>
                <p className="text-xs text-charcoal-muted dark:text-cream-300 font-medium">
                  Manage bakery products, custom recipes, sizes, prices, and cost breakdowns.
                </p>
              </div>

              {/* Action Buttons: Add Product */}
              <div className="flex items-center gap-2 sm:gap-3 flex-wrap">
                {canCreate && (
                  <button
                    onClick={handleOpenAdd}
                    className="px-5 py-2.5 bg-maroon-700 hover:bg-maroon-800 text-cream-100 rounded-2xl text-xs font-black uppercase tracking-wider transition border-2 border-maroon-950 dark:border-cream-100 shadow-neo hover:shadow-neo-lg hover:-translate-x-0.5 hover:-translate-y-0.5 active:translate-x-0 active:translate-y-0 flex items-center gap-2 shrink-0"
                  >
                    <Plus className="w-4 h-4" />
                    <span>Add New Product</span>
                  </button>
                )}
              </div>
            </div>

            {/* Navigation Tabs (Neo-Brutalist) */}
            <div className="flex items-center gap-2 border-b-2 border-maroon-950/20 dark:border-cream-100/20 pb-3 overflow-x-auto scrollbar-none">
              <button
                onClick={() => setActiveTab('showcase')}
                className={`px-4 sm:px-5 py-2.5 rounded-2xl text-xs font-black transition flex items-center gap-2 shrink-0 border-2 ${
                  activeTab === 'showcase'
                    ? 'bg-maroon-700 text-cream-100 border-maroon-950 dark:border-cream-100 shadow-neo-sm'
                    : 'bg-cream-100 dark:bg-maroon-900 text-maroon-950 dark:text-cream-100 border-maroon-950/20 hover:border-maroon-950'
                }`}
              >
                <Grid className="w-4 h-4" />
                <span>Product Catalog &amp; Photos ({products.length})</span>
              </button>

              <button
                onClick={() => setActiveTab('products')}
                className={`px-4 sm:px-5 py-2.5 rounded-2xl text-xs font-black transition flex items-center gap-2 shrink-0 border-2 ${
                  activeTab === 'products'
                    ? 'bg-maroon-700 text-cream-100 border-maroon-950 dark:border-cream-100 shadow-neo-sm'
                    : 'bg-cream-100 dark:bg-maroon-900 text-maroon-950 dark:text-cream-100 border-maroon-950/20 hover:border-maroon-950'
                }`}
              >
                <UtensilsCrossed className="w-4 h-4" />
                <span>All Products &amp; Recipe Costing ({products.length})</span>
              </button>

              <button
                onClick={() => setActiveTab('categories')}
                className={`px-4 sm:px-5 py-2.5 rounded-2xl text-xs font-black transition flex items-center gap-2 shrink-0 border-2 ${
                  activeTab === 'categories'
                    ? 'bg-maroon-700 text-cream-100 border-maroon-950 dark:border-cream-100 shadow-neo-sm'
                    : 'bg-cream-100 dark:bg-maroon-900 text-maroon-950 dark:text-cream-100 border-maroon-950/20 hover:border-maroon-950'
                }`}
              >
                <Boxes className="w-4 h-4" />
                <span>Menu Categories ({categories.length})</span>
              </button>
            </div>

            {/* ================= TAB 1: PRODUCT CATALOG & PHOTOS ================= */}
            {activeTab === 'showcase' && (
              <div className="space-y-6">
                
                {/* Stats & Overview Pills */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
                  <div className="bg-cream-100 dark:bg-maroon-900 p-4 rounded-2xl border-2 border-maroon-950/15 dark:border-cream-100/15 shadow-neo-xs">
                    <span className="text-[10px] uppercase font-bold text-charcoal-muted dark:text-cream-300">Total Products</span>
                    <div className="text-xl sm:text-2xl font-black font-serif text-maroon-950 dark:text-cream-100 mt-0.5">
                      {products.length}
                    </div>
                  </div>

                  <div className="bg-cream-100 dark:bg-maroon-900 p-4 rounded-2xl border-2 border-maroon-950/15 dark:border-cream-100/15 shadow-neo-xs">
                    <span className="text-[10px] uppercase font-bold text-charcoal-muted dark:text-cream-300">Active in Catalog</span>
                    <div className="text-xl sm:text-2xl font-black font-serif text-emerald-700 dark:text-emerald-400 mt-0.5 flex items-center gap-1.5">
                      <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse"></span>
                      <span>{visibleCount}</span>
                    </div>
                  </div>

                  <div className="bg-cream-100 dark:bg-maroon-900 p-4 rounded-2xl border-2 border-maroon-950/15 dark:border-cream-100/15 shadow-neo-xs">
                    <span className="text-[10px] uppercase font-bold text-charcoal-muted dark:text-cream-300">In Stock Ready</span>
                    <div className="text-xl sm:text-2xl font-black font-serif text-maroon-900 dark:text-cream-100 mt-0.5">
                      {inStockCount}
                    </div>
                  </div>

                  <div className="bg-cream-100 dark:bg-maroon-900 p-4 rounded-2xl border-2 border-maroon-950/15 dark:border-cream-100/15 shadow-neo-xs">
                    <span className="text-[10px] uppercase font-bold text-charcoal-muted dark:text-cream-300">Categories</span>
                    <div className="text-xl sm:text-2xl font-black font-serif text-maroon-900 dark:text-cream-100 mt-0.5">
                      {categories.length}
                    </div>
                  </div>
                </div>

                {/* Filter and Search Bar */}
                <div className="bg-cream-100 dark:bg-maroon-900 p-3.5 sm:p-5 rounded-3xl border-2 border-maroon-950/15 dark:border-cream-100/15 shadow-neo-sm flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4">
                  <div className="relative w-full md:w-80">
                    <Search className="w-4 h-4 text-charcoal-muted dark:text-cream-400 absolute left-3.5 top-3" />
                    <input
                      type="text"
                      value={search}
                      onChange={(e) => setSearch(e.target.value)}
                      placeholder="Search cakes by name, description..."
                      className="w-full pl-10 pr-4 py-2.5 bg-cream-200 dark:bg-maroon-800 border-2 border-maroon-950/20 dark:border-cream-100/20 rounded-2xl text-xs font-medium text-maroon-900 dark:text-cream-100 outline-none focus:border-maroon-950"
                    />
                  </div>

                  <div className="flex items-center gap-2 overflow-x-auto w-full md:w-auto pb-1 md:pb-0 scrollbar-none touch-pan-x">
                    <button
                      onClick={() => setSelectedCategoryFilter('all')}
                      className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition shrink-0 border-2 ${
                        selectedCategoryFilter === 'all'
                          ? 'bg-maroon-700 text-cream-100 border-maroon-950 shadow-neo-xs'
                          : 'bg-cream-200 dark:bg-maroon-800 text-charcoal dark:text-cream-200 border-maroon-950/20'
                      }`}
                    >
                      All Cakes ({products.length})
                    </button>
                    {categories.map((cat) => (
                      <button
                        key={cat.id}
                        onClick={() => setSelectedCategoryFilter(String(cat.id))}
                        className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition shrink-0 border-2 ${
                          selectedCategoryFilter === String(cat.id)
                            ? 'bg-maroon-700 text-cream-100 border-maroon-950 shadow-neo-xs'
                            : 'bg-cream-200 dark:bg-maroon-800 text-charcoal dark:text-cream-200 border-maroon-950/20'
                        }`}
                      >
                        {cat.name}
                      </button>
                    ))}
                  </div>
                </div>

                {/* CAKE SHOWCASE CARDS GRID */}
                {loading ? (
                  <div className="py-24 text-center">
                    <div className="inline-block animate-spin rounded-full h-8 w-8 border-4 border-maroon-700 border-t-transparent"></div>
                    <p className="text-xs text-charcoal-muted mt-2 font-bold font-serif">Loading cake pictures...</p>
                  </div>
                ) : filteredProducts.length > 0 ? (
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5 sm:gap-6">
                    {filteredProducts.map((p) => {
                      const cat = categories.find((c) => c.id === p.category_id);
                      const isPublic = p.public_visibility !== false;

                      return (
                        <div
                          key={p.id}
                          className="bg-cream-100 dark:bg-maroon-900 rounded-3xl border-2 border-maroon-950/20 dark:border-cream-100/20 hover:border-maroon-950 dark:hover:border-cream-100 shadow-neo-sm hover:shadow-neo transition-all overflow-hidden flex flex-col justify-between group"
                        >
                          <div>
                            {/* Cake Picture with Price Badge & Public Status */}
                            <div className="aspect-[4/3] relative overflow-hidden bg-cream-200 dark:bg-maroon-800 border-b-2 border-maroon-950/15 dark:border-cream-100/15">
                              <img
                                src={getImageUrl(p.image_url)}
                                alt={p.name}
                                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                                onError={(e) => {
                                  (e.target as HTMLImageElement).src = '/images/cakes/chocolate-delight.svg';
                                }}
                              />

                              {/* Price Tag */}
                              <div className="absolute top-2.5 right-2.5 px-3 py-1 bg-maroon-950 text-cream-100 border border-cream-200 text-xs font-black rounded-xl shadow-xs">
                                ₹{Number(p.price || 0).toLocaleString('en-IN')}
                              </div>

                              {/* Public Visibility Badge */}
                              <button
                                onClick={(e) => handleTogglePublicVisibility(p, e)}
                                className={`absolute top-2.5 left-2.5 px-2.5 py-1 rounded-xl text-[10px] font-black border transition shadow-xs flex items-center gap-1 ${
                                  isPublic
                                    ? 'bg-emerald-600 text-white border-emerald-800'
                                    : 'bg-charcoal/80 text-cream-200 border-charcoal'
                                }`}
                                title="Click to toggle active status in catalog"
                              >
                                {isPublic ? <Eye className="w-3 h-3" /> : <EyeOff className="w-3 h-3" />}
                                <span>{isPublic ? 'Active' : 'Inactive'}</span>
                              </button>
                            </div>

                            {/* Cake Details */}
                            <div className="p-4 sm:p-5 space-y-2.5">
                              <div>
                                <span className="text-[10px] uppercase font-bold text-maroon-700 dark:text-cream-300 tracking-wider">
                                  {cat?.name || 'Artisan Cake'}
                                </span>
                                <h3 className="font-serif font-black text-base text-maroon-950 dark:text-cream-100 mt-0.5 line-clamp-1">
                                  {p.name}
                                </h3>
                              </div>

                              {/* Customer Description */}
                              <p className="text-xs text-charcoal-muted dark:text-cream-300/80 font-medium leading-relaxed line-clamp-2">
                                {p.description || 'No description provided yet. Click Edit to add description.'}
                              </p>

                              {/* Tags */}
                              {p.tags && p.tags.length > 0 && (
                                <div className="flex flex-wrap gap-1 pt-1">
                                  {p.tags.slice(0, 3).map((t, idx) => (
                                    <span
                                      key={idx}
                                      className="px-2 py-0.5 bg-cream-200 dark:bg-maroon-800 text-maroon-950 dark:text-cream-200 rounded-md text-[9px] font-bold border border-maroon-950/15"
                                    >
                                      {t}
                                    </span>
                                  ))}
                                </div>
                              )}
                            </div>
                          </div>

                          {/* Card Footer / Action Buttons */}
                          <div className="p-4 pt-0 space-y-2">
                            <div className="flex items-center gap-2 pt-2 border-t border-maroon-950/10 dark:border-maroon-800">
                              <button
                                onClick={(e) => handleOpenEdit(p, e)}
                                className="flex-1 py-2 bg-maroon-700 hover:bg-maroon-800 text-cream-100 text-xs font-black rounded-xl border border-maroon-950 shadow-neo-2xs transition flex items-center justify-center gap-1.5"
                              >
                                <Edit className="w-3.5 h-3.5" />
                                <span>Edit Details</span>
                              </button>

                              <button
                                onClick={(e) => handleToggleAvailability(p, e)}
                                className={`px-2.5 py-2 rounded-xl text-xs font-bold border transition ${
                                  p.availability
                                    ? 'bg-emerald-100 text-emerald-900 border-emerald-300 hover:bg-emerald-200'
                                    : 'bg-rose-100 text-rose-900 border-rose-300 hover:bg-rose-200'
                                }`}
                                title={p.availability ? 'Mark Out of Stock' : 'Mark In Stock'}
                              >
                                {p.availability ? 'In Stock' : 'Out'}
                              </button>

                              {canDelete && (
                                <button
                                  onClick={(e) => handleDeleteProduct(p.id, e)}
                                  className="p-2 bg-cream-200 dark:bg-maroon-800 hover:bg-rose-100 hover:text-rose-700 rounded-xl border border-maroon-950/20 text-charcoal-muted transition"
                                  title="Delete Cake"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              )}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <div className="p-16 text-center bg-cream-100 dark:bg-maroon-900 rounded-3xl border-2 border-maroon-950/20">
                    <ImageIcon className="w-10 h-10 text-charcoal-muted mx-auto mb-2 opacity-50" />
                    <p className="text-sm font-bold text-charcoal-muted dark:text-cream-300 font-serif">
                      No cakes found matching &quot;{search}&quot;.
                    </p>
                    <button
                      onClick={handleOpenAdd}
                      className="mt-4 px-4 py-2 bg-maroon-700 text-cream-100 text-xs font-bold rounded-xl shadow-neo-sm"
                    >
                      Add First Cake
                    </button>
                  </div>
                )}
              </div>
            )}

            {/* ================= TAB 2: ERP PRODUCTS & RECIPE COSTING ================= */}
            {activeTab === 'products' && (
              <div className="space-y-6">
                {/* Search Bar */}
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

                {/* Table */}
                <div className="bg-cream-100 dark:bg-maroon-900 rounded-3xl border border-cream-300 dark:border-maroon-800 shadow-sm overflow-hidden">
                  <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse text-xs">
                      <thead>
                        <tr className="border-b border-cream-300 dark:border-maroon-800 text-maroon-900 dark:text-cream-200 font-bold uppercase tracking-wider text-[10px] bg-cream-200/50 dark:bg-maroon-800/40">
                          <th className="py-3.5 px-4">Cake / Product</th>
                          <th className="py-3.5 px-4">Category</th>
                          <th className="py-3.5 px-4">Selling Price</th>
                          {canViewCost && <th className="py-3.5 px-4">Ingredient Cost</th>}
                          <th className="py-3.5 px-4">Public Status</th>
                          <th className="py-3.5 px-4">Recipe</th>
                          <th className="py-3.5 px-4 text-right">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-cream-300 dark:divide-maroon-800/50 font-medium">
                        {filteredProducts.map((p) => {
                          const cost = p.calculated_cost || p.manual_cost || 0;
                          const cat = categories.find((c) => c.id === p.category_id);
                          const isPublic = p.public_visibility !== false;

                          return (
                            <tr
                              key={p.id}
                              className="hover:bg-cream-200/40 dark:hover:bg-maroon-800/30 transition cursor-pointer"
                              onClick={() => handleOpenRecipe(p)}
                            >
                              <td className="py-3.5 px-4">
                                <div className="flex items-center gap-3">
                                  <div className="w-12 h-12 rounded-xl bg-cream-200 dark:bg-maroon-800 border border-cream-300 dark:border-maroon-700 overflow-hidden shrink-0 flex items-center justify-center">
                                    <img
                                      src={getImageUrl(p.image_url)}
                                      alt={p.name}
                                      className="w-full h-full object-cover"
                                      onError={(e) => {
                                        (e.target as HTMLImageElement).src = '/images/cakes/chocolate-delight.svg';
                                      }}
                                    />
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

                              <td className="py-3.5 px-4">
                                <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold ${
                                  isPublic
                                    ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                                    : 'bg-stone-100 text-stone-700 border border-stone-300'
                                }`}>
                                  {isPublic ? '● Active' : '○ Inactive'}
                                </span>
                              </td>

                              <td className="py-3.5 px-4" onClick={(e) => e.stopPropagation()}>
                                <button
                                  onClick={() => handleOpenRecipe(p)}
                                  className="px-2.5 py-1.5 rounded-xl bg-amber-100 dark:bg-amber-950 text-amber-900 dark:text-amber-200 hover:bg-amber-200 border border-amber-300 dark:border-amber-800 text-xs font-bold transition flex items-center gap-1 shadow-2xs"
                                >
                                  <BookOpen className="w-3.5 h-3.5 text-amber-700" />
                                  <span>View Recipe</span>
                                </button>
                              </td>

                              <td className="py-3.5 px-4 text-right" onClick={(e) => e.stopPropagation()}>
                                <div className="flex items-center justify-end gap-1.5">
                                  <button
                                    onClick={(e) => handleOpenEdit(p, e)}
                                    className="p-1.5 rounded-lg hover:bg-cream-300 dark:hover:bg-maroon-700 text-maroon-900 dark:text-cream-100"
                                    title="Edit Product"
                                  >
                                    <Edit className="w-4 h-4" />
                                  </button>
                                  {canDelete && (
                                    <button
                                      onClick={(e) => handleDeleteProduct(p.id, e)}
                                      className="p-1.5 rounded-lg hover:bg-rose-100 dark:hover:bg-rose-950/50 text-rose-700"
                                      title="Delete Product"
                                    >
                                      <Trash2 className="w-4 h-4" />
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
                </div>
              </div>
            )}

            {/* ================= TAB 3: CATEGORIES ================= */}
            {activeTab === 'categories' && (
              <div className="space-y-6">
                <div className="flex items-center justify-between">
                  <h3 className="font-serif font-black text-lg text-maroon-950 dark:text-cream-100">
                    Menu Categories ({categories.length})
                  </h3>
                  {canCreate && (
                    <button
                      onClick={handleOpenAddCategory}
                      className="px-4 py-2 bg-maroon-700 text-cream-100 text-xs font-bold rounded-xl shadow-neo-sm flex items-center gap-1.5"
                    >
                      <Plus className="w-4 h-4" />
                      <span>Add Category</span>
                    </button>
                  )}
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {categories.map((c) => (
                    <div
                      key={c.id}
                      className="bg-cream-100 dark:bg-maroon-900 p-5 rounded-2xl border-2 border-maroon-950/20 dark:border-cream-100/20 shadow-neo-sm space-y-2 flex flex-col justify-between"
                    >
                      <div>
                        <h4 className="font-bold text-maroon-950 dark:text-cream-100 text-base font-serif">
                          {c.name}
                        </h4>
                        <p className="text-xs text-charcoal-muted dark:text-cream-300 mt-1 line-clamp-2">
                          {c.description || 'No description entered.'}
                        </p>
                      </div>

                      <div className="pt-3 border-t border-maroon-950/10 flex items-center justify-end gap-2">
                        {canEdit && (
                          <button
                            onClick={() => handleOpenEditCategory(c)}
                            className="p-1.5 rounded-lg hover:bg-cream-200 text-maroon-900 dark:text-cream-100"
                          >
                            <Edit className="w-3.5 h-3.5" />
                          </button>
                        )}
                        {canDelete && (
                          <button
                            onClick={() => handleDeleteCategory(c.id)}
                            className="p-1.5 rounded-lg hover:bg-rose-100 text-rose-700"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

          </main>
        </div>
      </div>

      {/* ================= MODAL: ADD / EDIT PRODUCT WITH PHOTO & DETAILS ================= */}
      <Modal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editingProduct ? `Edit Product: ${editingProduct.name}` : 'Add Product (Photo, Price & Details)'}
        subtitle="Manage product photo, selling price, descriptions, and catalog status"
        maxWidth="4xl"
      >
        <form onSubmit={handleSaveProduct} className="space-y-5 text-xs p-1">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            
            {/* LEFT COLUMN: PRODUCT PICTURE & PREVIEW (5 cols) */}
            <div className="lg:col-span-5 space-y-4">
              <div>
                <label className="block font-black text-maroon-900 dark:text-cream-100 mb-1.5 uppercase tracking-wider text-[11px]">
                  Product Picture *
                </label>

                {/* Picture Preview Frame */}
                <div className="aspect-[4/3] rounded-2xl overflow-hidden border-2 border-maroon-950 dark:border-cream-100 bg-cream-200 dark:bg-maroon-800 relative group shadow-neo-sm">
                  <img
                    src={getImageUrl(imageUrl)}
                    alt="Cake Preview"
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      (e.target as HTMLImageElement).src = '/images/cakes/chocolate-delight.svg';
                    }}
                  />
                  {uploadingImage && (
                    <div className="absolute inset-0 bg-maroon-950/70 flex flex-col items-center justify-center text-cream-100 gap-2">
                      <RefreshCw className="w-6 h-6 animate-spin text-amber-400" />
                      <span className="text-xs font-bold">Uploading photo...</span>
                    </div>
                  )}

                  {/* Price Tag Overlay on Preview */}
                  {sellingPrice !== '' && (
                    <div className="absolute top-2.5 right-2.5 px-3 py-1 bg-maroon-950 text-cream-100 border border-cream-200 text-xs font-black rounded-xl shadow-xs">
                      ₹{Number(sellingPrice).toLocaleString('en-IN')}
                    </div>
                  )}
                </div>
              </div>

              {/* Upload Controls */}
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  {/* File Upload Button */}
                  <label className="flex-1 py-2.5 px-3 bg-maroon-700 hover:bg-maroon-800 text-cream-100 font-bold rounded-xl border border-maroon-950 text-center cursor-pointer transition shadow-neo-2xs flex items-center justify-center gap-1.5">
                    <Camera className="w-3.5 h-3.5" />
                    <span>{uploadingImage ? 'Uploading...' : 'Upload Device Photo'}</span>
                    <input
                      type="file"
                      accept="image/jpeg,image/png,image/webp"
                      onChange={handleFileUpload}
                      disabled={uploadingImage}
                      className="hidden"
                    />
                  </label>

                  {/* Preset Photos Picker Button */}
                  <button
                    type="button"
                    onClick={() => setPresetPickerOpen(true)}
                    className="py-2.5 px-3 bg-cream-200 dark:bg-maroon-800 text-maroon-950 dark:text-cream-100 font-bold rounded-xl border border-maroon-950/20 hover:border-maroon-950 text-center transition flex items-center justify-center gap-1.5 shrink-0"
                    title="Choose from standard bakery photoshoot library"
                  >
                    <ImageIcon className="w-3.5 h-3.5" />
                    <span>Sample Photos</span>
                  </button>
                </div>

                {/* Direct Image URL input */}
                <div>
                  <input
                    type="text"
                    value={imageUrl}
                    onChange={(e) => setImageUrl(e.target.value)}
                    placeholder="Or enter image URL path (/images/cakes/...)"
                    className="w-full px-3 py-1.5 bg-cream-100 dark:bg-maroon-800 border border-maroon-950/20 rounded-xl text-[11px] font-mono text-charcoal dark:text-cream-200 outline-none"
                  />
                </div>
              </div>

              {/* LIVE CATALOG PREVIEW CARD */}
              <div className="p-3 bg-cream-50 dark:bg-maroon-950 rounded-2xl border-2 border-dashed border-maroon-950/20 dark:border-cream-100/20 space-y-1.5">
                <span className="text-[10px] uppercase font-black tracking-widest text-maroon-700 dark:text-cream-300 block">
                  Product Card Preview
                </span>
                <p className="text-[11px] font-bold text-maroon-950 dark:text-cream-100">
                  {name || 'Product Title'} • ₹{sellingPrice || '0'}
                </p>
                <p className="text-[10px] text-charcoal-muted dark:text-cream-300/80 line-clamp-2 italic">
                  &ldquo;{description || 'Product description will show here in the catalog...'}&rdquo;
                </p>
              </div>
            </div>

            {/* RIGHT COLUMN: CAKE DETAILS & PRICING (7 cols) */}
            <div className="lg:col-span-7 space-y-3.5">
              
              {/* Name & Category */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-maroon-900 dark:text-cream-100 mb-1">
                    Product Name / Title *
                  </label>
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="e.g. Belgian Dark Truffle Cake"
                    className="w-full px-3.5 py-2 bg-cream-100 dark:bg-maroon-800 border-2 border-maroon-950/20 rounded-xl font-bold text-maroon-950 dark:text-cream-100 outline-none focus:border-maroon-950"
                  />
                </div>

                <div>
                  <label className="block font-bold text-maroon-900 dark:text-cream-100 mb-1">
                    Menu Category *
                  </label>
                  <select
                    required
                    value={categoryId}
                    onChange={(e) => setCategoryId(Number(e.target.value))}
                    className="w-full px-3.5 py-2 bg-cream-100 dark:bg-maroon-800 border-2 border-maroon-950/20 rounded-xl font-bold text-maroon-950 dark:text-cream-100 outline-none focus:border-maroon-950"
                  >
                    {categories.map((c) => (
                      <option key={c.id} value={c.id}>{c.name}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Price & Cost */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block font-bold text-maroon-900 dark:text-cream-100 mb-1">
                    Selling Price (₹) *
                  </label>
                  <input
                    type="number"
                    required
                    min="0"
                    value={sellingPrice}
                    onChange={(e) => setSellingPrice(e.target.value ? Number(e.target.value) : '')}
                    placeholder="1200"
                    className="w-full px-3.5 py-2 bg-cream-100 dark:bg-maroon-800 border-2 border-maroon-950/20 rounded-xl font-black text-emerald-700 dark:text-emerald-400 text-sm outline-none focus:border-maroon-950"
                  />
                  <span className="text-[10px] text-charcoal-muted">Base selling price</span>
                </div>

                <div>
                  <label className="block font-bold text-maroon-900 dark:text-cream-100 mb-1">
                    Estimated Cost (₹)
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={costPrice}
                    onChange={(e) => setCostPrice(e.target.value ? Number(e.target.value) : '')}
                    placeholder="650"
                    className="w-full px-3.5 py-2 bg-cream-100 dark:bg-maroon-800 border-2 border-maroon-950/20 rounded-xl font-medium outline-none focus:border-maroon-950"
                  />
                  <span className="text-[10px] text-charcoal-muted">For bakery margins</span>
                </div>

                <div>
                  <label className="block font-bold text-maroon-900 dark:text-cream-100 mb-1">
                    Default Size
                  </label>
                  <input
                    type="text"
                    value={size}
                    onChange={(e) => setSize(e.target.value)}
                    placeholder="1 Pound / 250g Bento"
                    className="w-full px-3.5 py-2 bg-cream-100 dark:bg-maroon-800 border-2 border-maroon-950/20 rounded-xl font-medium outline-none focus:border-maroon-950"
                  />
                  <span className="text-[10px] text-charcoal-muted">e.g. 1 Pound, 500g</span>
                </div>
              </div>

              {/* CAKE DESCRIPTION */}
              <div>
                <label className="block font-bold text-maroon-900 dark:text-cream-100 mb-1">
                  Product Description * <span className="font-normal text-charcoal-muted text-[10px]">(Product &amp; flavor notes)</span>
                </label>
                <textarea
                  rows={3}
                  required
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Describe the layers, sponge flavor, ganache type, occasion suitability, and craftsmanship (e.g. 54% Callebaut dark chocolate sponge layered with whipped silk ganache)..."
                  className="w-full px-3.5 py-2.5 bg-cream-100 dark:bg-maroon-800 border-2 border-maroon-950/20 rounded-xl font-medium leading-relaxed text-maroon-950 dark:text-cream-100 outline-none focus:border-maroon-950"
                />
              </div>

              {/* Tags & Prep Time */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-maroon-900 dark:text-cream-100 mb-1">
                    Tags (comma separated)
                  </label>
                  <input
                    type="text"
                    value={tagsInput}
                    onChange={(e) => setTagsInput(e.target.value)}
                    placeholder="100% Eggless, Best Seller, Belgian Ganache"
                    className="w-full px-3.5 py-2 bg-cream-100 dark:bg-maroon-800 border-2 border-maroon-950/20 rounded-xl font-medium outline-none"
                  />
                </div>

                <div>
                  <label className="block font-bold text-maroon-900 dark:text-cream-100 mb-1">
                    Prep Time (Hours)
                  </label>
                  <input
                    type="number"
                    step="0.5"
                    min="0.5"
                    value={prepTimeHours}
                    onChange={(e) => setPrepTimeHours(Number(e.target.value))}
                    className="w-full px-3.5 py-2 bg-cream-100 dark:bg-maroon-800 border-2 border-maroon-950/20 rounded-xl font-medium outline-none"
                  />
                </div>
              </div>

              {/* Visibility and Availability Switches */}
              <div className="p-3 bg-cream-50 dark:bg-maroon-950 rounded-2xl border border-maroon-950/15 space-y-2">
                <label className="flex items-center gap-2.5 cursor-pointer font-bold text-maroon-900 dark:text-cream-100">
                  <input
                    type="checkbox"
                    checked={publicVisibility}
                    onChange={(e) => setPublicVisibility(e.target.checked)}
                    className="rounded text-maroon-700 w-4 h-4"
                  />
                  <div>
                    <span>Active in Product Catalog</span>
                    <span className="block text-[10px] text-charcoal-muted font-normal">
                      When enabled, this product is active for orders, invoices, and production recipes.
                    </span>
                  </div>
                </label>

                <div className="flex items-center gap-6 pt-1 border-t border-maroon-950/10">
                  <label className="flex items-center gap-2 cursor-pointer font-bold text-maroon-900 dark:text-cream-100 text-xs">
                    <input
                      type="checkbox"
                      checked={availability}
                      onChange={(e) => setAvailability(e.target.checked)}
                      className="rounded text-maroon-700 w-4 h-4"
                    />
                    <span>Available in Stock</span>
                  </label>

                  <label className="flex items-center gap-2 cursor-pointer font-bold text-maroon-900 dark:text-cream-100 text-xs">
                    <input
                      type="checkbox"
                      checked={featured}
                      onChange={(e) => setFeatured(e.target.checked)}
                      className="rounded text-maroon-700 w-4 h-4"
                    />
                    <span>Featured Product</span>
                  </label>
                </div>
              </div>

            </div>
          </div>

          {/* Modal Footer Buttons */}
          <div className="flex items-center justify-end gap-3 pt-4 border-t-2 border-maroon-950/15 dark:border-cream-100/15">
            <button
              type="button"
              onClick={() => setModalOpen(false)}
              className="px-5 py-2.5 bg-cream-200 dark:bg-maroon-800 font-bold rounded-xl text-maroon-950 dark:text-cream-100 border border-maroon-950/20"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-6 py-2.5 bg-maroon-700 hover:bg-maroon-800 text-cream-100 font-black rounded-xl border-2 border-maroon-950 dark:border-cream-100 shadow-neo hover:shadow-neo-lg transition"
            >
              {editingProduct ? 'Save Changes' : 'Add Product to Catalog'}
            </button>
          </div>
        </form>
      </Modal>

      {/* ================= MODAL: PRESET BAKERY PHOTO PICKER ================= */}
      <Modal
        isOpen={presetPickerOpen}
        onClose={() => setPresetPickerOpen(false)}
        title="Select from Bakery Sample Photos"
        subtitle="Click any photo to immediately use it for this cake"
        maxWidth="2xl"
      >
        <div className="space-y-4">
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3 max-h-[60vh] overflow-y-auto p-1">
            {PRESET_CAKE_IMAGES.map((preset, idx) => (
              <div
                key={idx}
                onClick={() => {
                  setImageUrl(preset.url);
                  setPresetPickerOpen(false);
                  showToast(`Selected "${preset.name}"`, 'success');
                }}
                className={`group cursor-pointer rounded-2xl overflow-hidden border-2 transition-all p-1.5 space-y-1.5 ${
                  imageUrl === preset.url
                    ? 'border-maroon-700 bg-maroon-50 dark:bg-maroon-950 shadow-neo-sm ring-2 ring-maroon-700'
                    : 'border-maroon-950/15 bg-cream-50 dark:bg-maroon-900 hover:border-maroon-950'
                }`}
              >
                <div className="aspect-square rounded-xl overflow-hidden bg-cream-200 dark:bg-maroon-800">
                  <img
                    src={preset.url}
                    alt={preset.name}
                    className="w-full h-full object-cover group-hover:scale-105 transition"
                  />
                </div>
                <div className="text-[10px] font-bold text-maroon-950 dark:text-cream-100 truncate px-1">
                  {preset.name}
                </div>
              </div>
            ))}
          </div>

          <div className="flex justify-end pt-2 border-t border-maroon-950/10">
            <button
              type="button"
              onClick={() => setPresetPickerOpen(false)}
              className="px-4 py-2 bg-cream-200 dark:bg-maroon-800 font-bold rounded-xl text-xs"
            >
              Close
            </button>
          </div>
        </div>
      </Modal>

      {/* ================= MODAL: RECIPE VIEW & EDIT ================= */}
      <Modal
        isOpen={recipeModalOpen}
        onClose={() => setRecipeModalOpen(false)}
        title={selectedCakeForRecipe ? `Recipe Formulation: ${selectedCakeForRecipe.name}` : 'Recipe Formulation'}
        subtitle="Manage ingredient proportions, quantities, and baking instructions"
        maxWidth="2xl"
      >
        {selectedCakeForRecipe && (
          <div className="space-y-4 text-xs">
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
                              className="w-full px-2 py-1 bg-cream-200 dark:bg-maroon-800 border border-cream-300 rounded-lg text-xs"
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
                              className="w-24 px-2 py-1 bg-cream-200 dark:bg-maroon-800 border rounded-lg text-xs"
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

            {/* Baking Notes */}
            <div className="space-y-1">
              <label className="font-extrabold text-xs text-maroon-900 dark:text-cream-100 flex items-center gap-1.5">
                <ChefHat className="w-4 h-4 text-maroon-700" />
                <span>Baker Notes &amp; Preparation Instructions</span>
              </label>
              {isEditingRecipe ? (
                <textarea
                  rows={4}
                  value={recipeNotes}
                  onChange={(e) => setRecipeNotes(e.target.value)}
                  className="w-full p-3 bg-cream-100 dark:bg-maroon-800 border border-cream-300 rounded-xl text-xs font-medium focus:outline-none"
                />
              ) : (
                <div className="p-3 bg-cream-100 dark:bg-maroon-900 rounded-xl border border-cream-300 text-xs font-medium text-charcoal dark:text-cream-200 leading-relaxed whitespace-pre-line">
                  {recipeNotes || 'No specific preparation instructions noted for this cake yet.'}
                </div>
              )}
            </div>

            {/* Actions */}
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
                <>
                  <button
                    type="button"
                    onClick={() => setIsEditingRecipe(true)}
                    className="px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white font-bold rounded-xl"
                  >
                    Edit Recipe
                  </button>
                  <button
                    type="button"
                    onClick={() => setRecipeModalOpen(false)}
                    className="px-5 py-2 bg-maroon-700 text-cream-100 font-bold rounded-xl"
                  >
                    Close
                  </button>
                </>
              )}
            </div>
          </div>
        )}
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
