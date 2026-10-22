'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { Sidebar } from '@/components/layout/Sidebar';
import { Header } from '@/components/layout/Header';
import { Modal } from '@/components/ui/Modal';
import { ProtectedRoute } from '@/components/auth/ProtectedRoute';
import { api, getImageUrl } from '@/lib/api';
import { Product, Category } from '@/types';
import { showToast } from '@/lib/toast';
import {
  Plus,
  Search,
  Upload,
  Edit,
  Trash2,
  CheckCircle2,
  Sparkles,
  IndianRupee,
  Image as ImageIcon,
  ExternalLink,
  Eye,
  EyeOff,
  Check,
  Camera,
  Grid,
  Filter
} from 'lucide-react';

// Preset bakery photography collection for instant 1-click selection
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

export default function AdminCakeShowcasePage() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  
  // Data states
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selectedCategoryFilter, setSelectedCategoryFilter] = useState<string>('all');
  const [visibilityFilter, setVisibilityFilter] = useState<'all' | 'public' | 'hidden'>('all');

  // Modal State
  const [modalOpen, setModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [presetPickerOpen, setPresetPickerOpen] = useState(false);

  // Form Fields
  const [name, setName] = useState('');
  const [categoryId, setCategoryId] = useState<number | ''>('');
  const [description, setDescription] = useState('');
  const [sellingPrice, setSellingPrice] = useState<number | ''>('');
  const [availability, setAvailability] = useState(true);
  const [publicVisibility, setPublicVisibility] = useState(true);
  const [featured, setFeatured] = useState(false);
  const [imageUrl, setImageUrl] = useState('/images/cakes/belgian-chocolate.jpg');
  const [tagsInput, setTagsInput] = useState('Best Seller, Fresh, Eggless');

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [prodRes, catRes] = await Promise.all([
        api.get('/products'),
        api.get('/categories')
      ]);
      setProducts(prodRes.data);
      setCategories(catRes.data);
    } catch (err: any) {
      showToast(err.response?.data?.detail || 'Failed to load showcase data', 'error');
    } finally {
      setLoading(false);
    }
  };

  // Quick visibility toggle directly from card
  const handleToggleVisibility = async (product: Product, e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      const nextVis = product.public_visibility === false ? true : false;
      await api.put(`/products/${product.id}`, { public_visibility: nextVis });
      setProducts(prev => prev.map(p => p.id === product.id ? { ...p, public_visibility: nextVis } : p));
      showToast(`"${product.name}" is now ${nextVis ? 'Public on Showcase' : 'Hidden from Showcase'}!`, 'success');
    } catch (err: any) {
      showToast('Failed to update public status', 'error');
    }
  };

  // Open Add Modal
  const handleOpenAdd = () => {
    setEditingProduct(null);
    setName('');
    setCategoryId(categories[0]?.id || '');
    setDescription('');
    setSellingPrice('');
    setAvailability(true);
    setPublicVisibility(true);
    setFeatured(false);
    setImageUrl(PRESET_CAKE_IMAGES[0].url);
    setTagsInput('Best Seller, Fresh, 100% Eggless');
    setPresetPickerOpen(false);
    setModalOpen(true);
  };

  // Open Edit Modal
  const handleOpenEdit = (p: Product) => {
    setEditingProduct(p);
    setName(p.name);
    setCategoryId(p.category_id || p.category?.id || '');
    setDescription(p.description || '');
    setSellingPrice(Number(p.price || 0));
    setAvailability(p.availability !== false);
    setPublicVisibility(p.public_visibility !== false);
    setFeatured(Boolean(p.featured));
    setImageUrl(p.image_url || PRESET_CAKE_IMAGES[0].url);
    setTagsInput(Array.isArray(p.tags) ? p.tags.join(', ') : '');
    setPresetPickerOpen(false);
    setModalOpen(true);
  };

  // Upload local device image
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      showToast('Please upload a valid image file (JPG, PNG, WEBP)', 'error');
      return;
    }

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
      if (res.data?.url) {
        setImageUrl(res.data.url);
        showToast('Cake picture uploaded successfully!', 'success');
      }
    } catch (err: any) {
      showToast(err.response?.data?.detail || 'Failed to upload photo', 'error');
    } finally {
      setUploadingImage(false);
    }
  };

  // Save or Update Cake
  const handleSaveProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !categoryId || sellingPrice === '') {
      showToast('Name, Category, and Selling Price are required', 'error');
      return;
    }

    const payload = {
      name: name.trim(),
      category_id: Number(categoryId),
      description: description.trim() || undefined,
      price: Number(sellingPrice),
      availability,
      public_visibility: publicVisibility,
      featured,
      image_url: imageUrl || undefined,
      tags: tagsInput.split(',').map((t) => t.trim()).filter(Boolean)
    };

    try {
      if (editingProduct) {
        await api.put(`/products/${editingProduct.id}`, payload);
        showToast('Cake showcase item updated successfully!', 'success');
      } else {
        await api.post('/products', payload);
        showToast('New cake added to showcase!', 'success');
      }
      setModalOpen(false);
      fetchData();
    } catch (err: any) {
      showToast(err.response?.data?.detail || 'Failed to save cake item', 'error');
    }
  };

  // Delete Cake
  const handleDeleteProduct = async (id: number) => {
    if (!confirm('Are you sure you want to delete this cake from the showcase?')) return;
    try {
      await api.delete(`/products/${id}`);
      showToast('Cake removed from showcase', 'success');
      fetchData();
    } catch (err) {
      showToast('Failed to delete cake', 'error');
    }
  };

  // Filtered products
  const filteredProducts = products.filter((p) => {
    const matchesSearch =
      p.name.toLowerCase().includes(search.toLowerCase()) ||
      (p.description && p.description.toLowerCase().includes(search.toLowerCase())) ||
      (p.category?.name && p.category.name.toLowerCase().includes(search.toLowerCase()));

    const matchesCategory =
      selectedCategoryFilter === 'all' ||
      String(p.category_id) === selectedCategoryFilter ||
      String(p.category?.id) === selectedCategoryFilter;

    const matchesVisibility =
      visibilityFilter === 'all' ||
      (visibilityFilter === 'public' && p.public_visibility !== false) ||
      (visibilityFilter === 'hidden' && p.public_visibility === false);

    return matchesSearch && matchesCategory && matchesVisibility;
  });

  return (
    <ProtectedRoute>
      <div className="flex h-screen bg-cream-100 dark:bg-maroon-950 font-sans antialiased text-charcoal dark:text-cream-100 overflow-hidden">
        <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

        <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
          <Header onMenuClick={() => setSidebarOpen(true)} title="Cake Showcase Management" />

          <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8 space-y-6">
            
            {/* Top Showcase Banner with Live Link */}
            <div className="bg-cream-50 dark:bg-maroon-900/80 p-5 sm:p-6 rounded-3xl border-2 border-maroon-950/20 dark:border-cream-100/20 shadow-neo-sm flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
              <div className="space-y-1">
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-cream-200 dark:bg-maroon-800 text-maroon-900 dark:text-cream-200 text-xs font-black uppercase tracking-wider border border-maroon-950/20">
                  <Sparkles className="w-3.5 h-3.5 text-amber-500 fill-amber-500" />
                  <span>Public Showcase Controller</span>
                </div>
                <h2 className="text-2xl sm:text-3xl font-black font-serif text-maroon-950 dark:text-cream-100 tracking-tight">
                  Cake Showcase &amp; Public Gallery CMS
                </h2>
                <p className="text-xs sm:text-sm text-charcoal-muted dark:text-cream-300 font-medium max-w-2xl">
                  Upload cake photos, set customer prices, and craft detailed flavor descriptions. All active items sync instantly to your customer-facing Public Showcase page.
                </p>
              </div>

              <div className="flex items-center gap-2.5 shrink-0 w-full sm:w-auto">
                <Link
                  href="/gallery"
                  target="_blank"
                  className="px-4 py-2.5 bg-cream-100 dark:bg-maroon-800 hover:bg-cream-200 dark:hover:bg-maroon-700 text-maroon-950 dark:text-cream-100 text-xs font-black uppercase tracking-wider rounded-2xl border-2 border-maroon-950/30 dark:border-cream-100/30 shadow-neo-sm transition flex items-center gap-1.5"
                >
                  <span>View Public Page</span>
                  <ExternalLink className="w-3.5 h-3.5 text-maroon-600 dark:text-amber-300" />
                </Link>

                <button
                  onClick={handleOpenAdd}
                  className="px-5 py-2.5 bg-maroon-700 hover:bg-maroon-800 text-cream-100 rounded-2xl text-xs font-black uppercase tracking-wider transition shadow-neo btn-tactile flex items-center gap-2 shrink-0 border-2 border-maroon-950 dark:border-cream-100"
                >
                  <Plus className="w-4 h-4" />
                  <span>Add Cake Picture</span>
                </button>
              </div>
            </div>

            {/* Filter & Search Bar */}
            <div className="bg-cream-50 dark:bg-maroon-900/60 p-4 rounded-2xl border-2 border-maroon-950/20 dark:border-cream-100/20 shadow-neo-sm flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-3">
              {/* Search */}
              <div className="relative flex-1 max-w-md">
                <Search className="w-4 h-4 text-charcoal-muted dark:text-cream-400 absolute left-3.5 top-3" />
                <input
                  type="text"
                  placeholder="Search showcase by cake title or description..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 bg-cream-100 dark:bg-maroon-950 border-2 border-maroon-950/20 dark:border-cream-100/20 rounded-xl text-xs font-medium text-maroon-950 dark:text-cream-100 placeholder:text-charcoal-muted outline-none focus:border-maroon-950"
                />
              </div>

              {/* Category & Status Filter Pills */}
              <div className="flex flex-wrap items-center gap-2">
                {/* Visibility Filter */}
                <div className="flex items-center gap-1 bg-cream-100 dark:bg-maroon-950 p-1 rounded-xl border border-maroon-950/20 text-xs font-bold">
                  <button
                    onClick={() => setVisibilityFilter('all')}
                    className={`px-2.5 py-1 rounded-lg transition ${
                      visibilityFilter === 'all'
                        ? 'bg-maroon-700 text-cream-100'
                        : 'text-charcoal-muted dark:text-cream-300'
                    }`}
                  >
                    All ({products.length})
                  </button>
                  <button
                    onClick={() => setVisibilityFilter('public')}
                    className={`px-2.5 py-1 rounded-lg transition flex items-center gap-1 ${
                      visibilityFilter === 'public'
                        ? 'bg-emerald-600 text-white'
                        : 'text-charcoal-muted dark:text-cream-300'
                    }`}
                  >
                    <Eye className="w-3 h-3" />
                    <span>Public</span>
                  </button>
                  <button
                    onClick={() => setVisibilityFilter('hidden')}
                    className={`px-2.5 py-1 rounded-lg transition flex items-center gap-1 ${
                      visibilityFilter === 'hidden'
                        ? 'bg-amber-600 text-white'
                        : 'text-charcoal-muted dark:text-cream-300'
                    }`}
                  >
                    <EyeOff className="w-3 h-3" />
                    <span>Hidden</span>
                  </button>
                </div>

                {/* Category Dropdown */}
                <select
                  value={selectedCategoryFilter}
                  onChange={(e) => setSelectedCategoryFilter(e.target.value)}
                  className="px-3 py-2 bg-cream-100 dark:bg-maroon-950 border-2 border-maroon-950/20 dark:border-cream-100/20 rounded-xl text-xs font-serif font-bold text-maroon-950 dark:text-cream-100 outline-none"
                >
                  <option value="all">All Categories</option>
                  {categories.map((cat) => (
                    <option key={cat.id} value={String(cat.id)}>
                      {cat.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Showcase Visual Card Grid */}
            {loading ? (
              <div className="p-16 text-center text-charcoal-muted font-bold font-serif animate-pulse">
                Loading Cake Showcase...
              </div>
            ) : filteredProducts.length === 0 ? (
              <div className="p-16 text-center bg-cream-50 dark:bg-maroon-900 rounded-3xl border-2 border-maroon-950/20 space-y-4">
                <Camera className="w-12 h-12 text-maroon-700 mx-auto opacity-40" />
                <h3 className="text-xl font-bold font-serif text-maroon-950 dark:text-cream-100">
                  No cakes found in showcase
                </h3>
                <p className="text-xs text-charcoal-muted dark:text-cream-300 max-w-md mx-auto">
                  Click &ldquo;Add Cake Picture&rdquo; to upload photos and configure cake pricing and details.
                </p>
                <button
                  onClick={handleOpenAdd}
                  className="px-5 py-2.5 bg-maroon-700 text-cream-100 rounded-xl text-xs font-bold uppercase tracking-wider shadow-neo-sm"
                >
                  Add Your First Showcase Cake
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-6">
                {filteredProducts.map((p) => {
                  const isVisible = p.public_visibility !== false;
                  return (
                    <div
                      key={p.id}
                      className="bg-cream-50 dark:bg-maroon-900/80 rounded-3xl border-2 border-maroon-950 dark:border-cream-100/30 shadow-neo-sm hover:shadow-neo transition-all duration-300 flex flex-col justify-between overflow-hidden group"
                    >
                      {/* Photo Container */}
                      <div className="relative aspect-square overflow-hidden bg-cream-200 dark:bg-maroon-950">
                        <img
                          src={getImageUrl(p.image_url)}
                          alt={p.name}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                        />

                        {/* Top Badges */}
                        <div className="absolute top-2.5 left-2.5 right-2.5 flex items-center justify-between gap-1.5 pointer-events-none">
                          <span className="px-2.5 py-1 rounded-full bg-cream-100/90 dark:bg-maroon-950/90 text-maroon-950 dark:text-cream-100 text-[10px] font-black uppercase tracking-wider backdrop-blur-xs border border-maroon-950/20 shadow-xs">
                            {p.category?.name || 'Artisan Cake'}
                          </span>

                          <button
                            type="button"
                            onClick={(e) => handleToggleVisibility(p, e)}
                            className={`pointer-events-auto px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider flex items-center gap-1 shadow-xs transition ${
                              isVisible
                                ? 'bg-emerald-600 text-white hover:bg-emerald-700'
                                : 'bg-amber-600 text-white hover:bg-amber-700'
                            }`}
                            title="Click to toggle public showcase visibility"
                          >
                            {isVisible ? <Eye className="w-3 h-3" /> : <EyeOff className="w-3 h-3" />}
                            <span>{isVisible ? 'Public' : 'Hidden'}</span>
                          </button>
                        </div>

                        {/* Price Badge on Photo */}
                        <div className="absolute bottom-2.5 right-2.5 px-3 py-1.5 rounded-xl bg-maroon-700 text-cream-100 font-serif font-black text-sm border-2 border-maroon-950 dark:border-cream-100 shadow-neo-sm">
                          ₹{Number(p.price || 0).toLocaleString()}
                        </div>
                      </div>

                      {/* Card Content */}
                      <div className="p-4 space-y-3 flex-1 flex flex-col justify-between">
                        <div className="space-y-1.5">
                          <h3 className="font-serif font-black text-maroon-950 dark:text-cream-100 text-base leading-snug line-clamp-1">
                            {p.name}
                          </h3>
                          <p className="text-xs text-charcoal-muted dark:text-cream-300 line-clamp-2 leading-relaxed font-medium">
                            {p.description || 'Delicate layers of artisan sponge and silky buttercream frosting.'}
                          </p>
                        </div>

                        {/* Action Buttons */}
                        <div className="pt-2 border-t-2 border-maroon-950/10 dark:border-cream-100/10 flex items-center justify-between gap-2">
                          <button
                            onClick={() => handleOpenEdit(p)}
                            className="flex-1 py-2 px-3 bg-cream-100 dark:bg-maroon-800 hover:bg-cream-200 dark:hover:bg-maroon-700 text-maroon-950 dark:text-cream-100 rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 border border-maroon-950/20"
                          >
                            <Edit className="w-3.5 h-3.5 text-maroon-700 dark:text-cream-200" />
                            <span>Edit Cake</span>
                          </button>

                          <button
                            onClick={() => handleDeleteProduct(p.id)}
                            className="p-2 text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/50 rounded-xl border border-rose-200 dark:border-rose-800 transition"
                            title="Delete cake"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

          </main>
        </div>

        {/* ================= MODAL: ADD / EDIT CAKE SHOWCASE ================= */}
        <Modal
          isOpen={modalOpen}
          onClose={() => setModalOpen(false)}
          title={editingProduct ? 'Edit Showcase Cake' : 'Add Cake to Public Showcase'}
          size="xl"
        >
          <form onSubmit={handleSaveProduct} className="space-y-5">
            
            {/* Top Grid: Photo Uploader & Live Card Preview */}
            <div className="grid grid-cols-1 md:grid-cols-12 gap-5 p-4 rounded-2xl bg-cream-200/60 dark:bg-maroon-950/50 border-2 border-maroon-950/20 dark:border-cream-100/20">
              
              {/* Picture Selection Column */}
              <div className="md:col-span-7 space-y-3">
                <label className="block text-xs font-black uppercase tracking-wider text-maroon-950 dark:text-cream-100">
                  Cake Picture (HD Photo)
                </label>

                {/* Upload Buttons */}
                <div className="flex flex-wrap items-center gap-2">
                  <label className="cursor-pointer px-3.5 py-2 bg-maroon-700 hover:bg-maroon-800 text-cream-100 rounded-xl text-xs font-bold transition flex items-center gap-1.5 shadow-sm">
                    <Upload className="w-3.5 h-3.5" />
                    <span>{uploadingImage ? 'Uploading...' : 'Upload Device Photo'}</span>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleFileUpload}
                      className="hidden"
                      disabled={uploadingImage}
                    />
                  </label>

                  <button
                    type="button"
                    onClick={() => setPresetPickerOpen(!presetPickerOpen)}
                    className="px-3.5 py-2 bg-cream-100 dark:bg-maroon-800 hover:bg-cream-200 text-maroon-950 dark:text-cream-100 rounded-xl text-xs font-bold transition flex items-center gap-1.5 border border-maroon-950/20"
                  >
                    <Camera className="w-3.5 h-3.5 text-amber-500" />
                    <span>Choose Bakery Preset</span>
                  </button>
                </div>

                {/* Preset Drawer */}
                {presetPickerOpen && (
                  <div className="p-3 bg-cream-100 dark:bg-maroon-900 rounded-xl border-2 border-maroon-950/20 space-y-2 max-h-48 overflow-y-auto">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-charcoal-muted block">
                      Bakery Photoshoot Gallery (Click to apply)
                    </span>
                    <div className="grid grid-cols-3 gap-2">
                      {PRESET_CAKE_IMAGES.map((preset, idx) => (
                        <div
                          key={idx}
                          onClick={() => {
                            setImageUrl(preset.url);
                            if (!name) setName(preset.name);
                            setPresetPickerOpen(false);
                          }}
                          className={`cursor-pointer rounded-lg overflow-hidden border-2 transition relative aspect-square group ${
                            imageUrl === preset.url ? 'border-maroon-700 ring-2 ring-maroon-500' : 'border-maroon-950/20'
                          }`}
                        >
                          <img src={preset.url} alt={preset.name} className="w-full h-full object-cover group-hover:scale-105" />
                          <span className="absolute bottom-0 inset-x-0 p-1 bg-maroon-950/80 text-[9px] text-cream-100 truncate text-center font-bold">
                            {preset.name}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Direct Image URL input */}
                <div>
                  <span className="text-[10px] text-charcoal-muted dark:text-cream-300 font-bold block mb-1">
                    Or Enter Image URL:
                  </span>
                  <input
                    type="text"
                    value={imageUrl}
                    onChange={(e) => setImageUrl(e.target.value)}
                    placeholder="/images/cakes/your-cake.jpg"
                    className="w-full px-3 py-2 bg-cream-100 dark:bg-maroon-900 border border-maroon-950/20 rounded-xl text-xs font-mono text-maroon-950 dark:text-cream-100"
                  />
                </div>
              </div>

              {/* Live Preview Column */}
              <div className="md:col-span-5 flex flex-col justify-center items-center p-3 bg-cream-100 dark:bg-maroon-900 rounded-2xl border-2 border-dashed border-maroon-950/30 text-center space-y-2">
                <span className="text-[10px] font-black uppercase tracking-wider text-charcoal-muted dark:text-cream-300">
                  Live Public Card Preview
                </span>
                <div className="w-36 aspect-square rounded-2xl overflow-hidden border-2 border-maroon-950 relative shadow-sm">
                  <img src={getImageUrl(imageUrl)} alt="Preview" className="w-full h-full object-cover" />
                  <span className="absolute bottom-1 right-1 px-2 py-0.5 rounded-lg bg-maroon-700 text-cream-100 font-serif font-black text-xs">
                    ₹{Number(sellingPrice || 0).toLocaleString()}
                  </span>
                </div>
                <span className="text-xs font-serif font-bold text-maroon-950 dark:text-cream-100 truncate max-w-full">
                  {name || 'Cake Title'}
                </span>
              </div>

            </div>

            {/* Core Info Fields */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Cake Name */}
              <div className="space-y-1">
                <label className="block text-xs font-bold text-maroon-950 dark:text-cream-100">
                  Cake Title / Name <span className="text-rose-600">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Belgian Dark Truffle Indulgence"
                  className="w-full px-3.5 py-2.5 bg-cream-100 dark:bg-maroon-950 border-2 border-maroon-950/20 dark:border-cream-100/20 rounded-xl text-xs font-serif font-bold text-maroon-950 dark:text-cream-100 outline-none"
                />
              </div>

              {/* Category */}
              <div className="space-y-1">
                <label className="block text-xs font-bold text-maroon-950 dark:text-cream-100">
                  Menu Category <span className="text-rose-600">*</span>
                </label>
                <select
                  required
                  value={categoryId}
                  onChange={(e) => setCategoryId(Number(e.target.value))}
                  className="w-full px-3.5 py-2.5 bg-cream-100 dark:bg-maroon-950 border-2 border-maroon-950/20 dark:border-cream-100/20 rounded-xl text-xs font-serif font-bold text-maroon-950 dark:text-cream-100 outline-none"
                >
                  <option value="">Select Category</option>
                  {categories.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* Selling Price */}
              <div className="space-y-1">
                <label className="block text-xs font-bold text-maroon-950 dark:text-cream-100">
                  Customer Price (₹) <span className="text-rose-600">*</span>
                </label>
                <div className="relative">
                  <IndianRupee className="w-3.5 h-3.5 text-charcoal-muted absolute left-3 top-3" />
                  <input
                    type="number"
                    step="0.01"
                    required
                    value={sellingPrice}
                    onChange={(e) => setSellingPrice(e.target.value === '' ? '' : Number(e.target.value))}
                    placeholder="1250.00"
                    className="w-full pl-9 pr-4 py-2.5 bg-cream-100 dark:bg-maroon-950 border-2 border-maroon-950/20 dark:border-cream-100/20 rounded-xl text-xs font-bold text-maroon-950 dark:text-cream-100 outline-none"
                  />
                </div>
              </div>

              {/* Tags */}
              <div className="space-y-1">
                <label className="block text-xs font-bold text-maroon-950 dark:text-cream-100">
                  Tags (Comma-separated)
                </label>
                <input
                  type="text"
                  value={tagsInput}
                  onChange={(e) => setTagsInput(e.target.value)}
                  placeholder="Eggless, Best Seller, Belgian Ganache"
                  className="w-full px-3.5 py-2.5 bg-cream-100 dark:bg-maroon-950 border-2 border-maroon-950/20 dark:border-cream-100/20 rounded-xl text-xs font-medium text-maroon-950 dark:text-cream-100 outline-none"
                />
              </div>
            </div>

            {/* Customer Description */}
            <div className="space-y-1">
              <label className="block text-xs font-bold text-maroon-950 dark:text-cream-100">
                Customer Flavor &amp; Recipe Description
              </label>
              <textarea
                rows={3}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Describe layers, cocoa origin, buttercream fillings, and occasion recommendations shown on the public page..."
                className="w-full px-3.5 py-2.5 bg-cream-100 dark:bg-maroon-950 border-2 border-maroon-950/20 dark:border-cream-100/20 rounded-xl text-xs font-medium text-maroon-950 dark:text-cream-100 outline-none"
              />
            </div>

            {/* Toggles */}
            <div className="flex flex-wrap items-center gap-6 p-4 rounded-xl bg-cream-100 dark:bg-maroon-900 border border-maroon-950/20">
              <label className="flex items-center gap-2 cursor-pointer text-xs font-bold text-maroon-950 dark:text-cream-100">
                <input
                  type="checkbox"
                  checked={publicVisibility}
                  onChange={(e) => setPublicVisibility(e.target.checked)}
                  className="w-4 h-4 accent-maroon-700 rounded"
                />
                <span>Show on Public Showcase Page</span>
              </label>

              <label className="flex items-center gap-2 cursor-pointer text-xs font-bold text-maroon-950 dark:text-cream-100">
                <input
                  type="checkbox"
                  checked={availability}
                  onChange={(e) => setAvailability(e.target.checked)}
                  className="w-4 h-4 accent-maroon-700 rounded"
                />
                <span>In-Stock / Available to Order</span>
              </label>
            </div>

            {/* Modal Actions */}
            <div className="flex items-center justify-end gap-3 pt-4 border-t-2 border-maroon-950/15">
              <button
                type="button"
                onClick={() => setModalOpen(false)}
                className="px-5 py-2.5 bg-cream-200 dark:bg-maroon-800 text-maroon-900 dark:text-cream-200 rounded-xl text-xs font-bold"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-6 py-2.5 bg-maroon-700 hover:bg-maroon-800 text-cream-100 rounded-xl text-xs font-black uppercase tracking-wider shadow-neo btn-tactile border-2 border-maroon-950 dark:border-cream-100"
              >
                {editingProduct ? 'Save Changes' : 'Publish to Showcase'}
              </button>
            </div>

          </form>
        </Modal>

      </div>
    </ProtectedRoute>
  );
}
