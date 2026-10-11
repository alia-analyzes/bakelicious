'use client';

import React, { useEffect, useState } from 'react';
import { Sidebar } from '@/components/layout/Sidebar';
import { Header } from '@/components/layout/Header';
import { Modal } from '@/components/ui/Modal';
import { ProtectedRoute } from '@/components/auth/ProtectedRoute';
import { api, getImageUrl } from '@/lib/api';
import { Product, Category } from '@/types';
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
  Tag
} from 'lucide-react';

export default function AdminProductsPage() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
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

  // Multi-size Manager
  const [sizesList, setSizesList] = useState<Array<{ size: string; selling_price: number; cost_price: number }>>([
    { size: '1 Pound', selling_price: 1050, cost_price: 650 },
    { size: '2 Pound', selling_price: 1900, cost_price: 1150 }
  ]);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [prodRes, catRes] = await Promise.all([
        api.get('/products?include_erp=true'),
        api.get('/categories')
      ]);
      setProducts(prodRes.data);
      setCategories(catRes.data);
      if (catRes.data.length > 0 && !categoryId) {
        setCategoryId(catRes.data[0].id);
      }
    } catch (err) {
      console.error('Failed to load products/categories:', err);
    } finally {
      setLoading(false);
    }
  };

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
    setSizesList(p.sizes || [
      { size: '1 Pound', selling_price: p.price, cost_price: p.manual_cost || 0 }
    ]);
    setModalOpen(true);
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const formData = new FormData();
    formData.append('file', file);

    try {
      setUploadingImage(true);
      const res = await api.post('/uploads/image', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      setImageUrl(res.data.image_url);
      showToast('Product image uploaded successfully!', 'success');
    } catch (err: any) {
      showToast(err.response?.data?.detail || 'Failed to upload image', 'error');
    } finally {
      setUploadingImage(false);
    }
  };

  const handleAddSizeRow = () => {
    setSizesList([...sizesList, { size: '3 Pound', selling_price: 2700, cost_price: 1650 }]);
  };

  const handleRemoveSizeRow = (index: number) => {
    setSizesList(sizesList.filter((_, i) => i !== index));
  };

  const handleSizeChange = (index: number, field: string, val: any) => {
    const updated = [...sizesList];
    updated[index] = { ...updated[index], [field]: val };
    setSizesList(updated);
  };

  const handleSaveProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !categoryId || sellingPrice === '') {
      showToast('Please fill in required product fields', 'error');
      return;
    }

    const payload = {
      name,
      category_id: Number(categoryId),
      sku: sku || undefined,
      description,
      price: Number(sellingPrice),
      manual_cost: Number(costPrice || 0),
      use_manual_cost: true,
      prep_time_hours: Number(prepTimeHours),
      size,
      availability,
      public_visibility: publicVisibility,
      featured,
      tags: tagsInput.split(',').map((t) => t.trim()).filter(Boolean),
      sizes: sizesList,
      image_url: imageUrl
    };

    try {
      if (editingProduct) {
        await api.put(`/products/${editingProduct.id}`, payload);
        showToast('Product updated in ERP & Public site!', 'success');
      } else {
        await api.post('/products', payload);
        showToast('New product created & available publicly!', 'success');
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
      showToast('Product deleted from ERP', 'success');
      fetchData();
    } catch (err) {
      showToast('Failed to delete product', 'error');
    }
  };

  const filteredProducts = products.filter((p) => {
    if (selectedCategoryFilter !== 'all' && String(p.category_id) !== selectedCategoryFilter) {
      return false;
    }
    if (search.trim()) {
      const q = search.toLowerCase();
      return (
        p.name.toLowerCase().includes(q) ||
        (p.description && p.description.toLowerCase().includes(q)) ||
        (p.sku && p.sku.toLowerCase().includes(q))
      );
    }
    return true;
  });

  const canViewCost = isSuperAdmin() || hasPermission('PRODUCT_COST_VIEW') || hasPermission('FINANCIAL_REPORTS_VIEW');
  const canEditCost = isSuperAdmin() || hasPermission('PRODUCT_COST_EDIT');
  const canCreate = isSuperAdmin() || hasPermission('PRODUCTS_CREATE');
  const canEdit = isSuperAdmin() || hasPermission('PRODUCTS_EDIT');
  const canDelete = isSuperAdmin() || hasPermission('PRODUCTS_DELETE');

  return (
    <ProtectedRoute requiredPermission="PRODUCTS_VIEW">
      <div className="min-h-screen bg-cream-200 dark:bg-maroon-950 text-charcoal dark:text-cream-100 flex font-sans">
        <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

        <div className="flex-1 flex flex-col min-w-0 lg:pl-64">
          <Header onOpenSidebar={() => setSidebarOpen(true)} title="ERP Product & Menu CMS" />

          <main className="flex-1 p-4 sm:p-6 lg:p-8 space-y-6">
            {/* Header Action Bar */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-cream-100 dark:bg-maroon-900 p-5 rounded-3xl border border-cream-300 dark:border-maroon-800 shadow-sm">
              <div>
                <h1 className="text-2xl font-extrabold font-serif text-maroon-950 dark:text-cream-100">
                  Bakery Products &amp; Catalog
                </h1>
                <p className="text-xs text-charcoal-muted dark:text-cream-300/80 font-medium mt-0.5">
                  Manage products, cost prices, profit margins, and public availability.
                </p>
              </div>

              {canCreate && (
                <button
                  onClick={handleOpenAdd}
                  className="px-5 py-3 bg-maroon-700 hover:bg-maroon-800 text-cream-100 rounded-2xl text-xs font-bold transition shadow-md flex items-center gap-2 shrink-0"
                >
                  <Plus className="w-4 h-4" />
                  <span>Add Product</span>
                </button>
              )}
            </div>

            {/* Filter Bar */}
            <div className="bg-cream-100 dark:bg-maroon-900 p-4 rounded-3xl border border-cream-300 dark:border-maroon-800 shadow-sm flex flex-col md:flex-row items-center justify-between gap-4">
              <div className="relative w-full md:w-80">
                <Search className="w-4 h-4 text-charcoal-muted dark:text-cream-400 absolute left-3.5 top-3" />
                <input
                  type="text"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Search products by name, SKU..."
                  className="w-full pl-10 pr-4 py-2.5 bg-cream-200 dark:bg-maroon-800 border border-cream-300 dark:border-maroon-700 rounded-2xl text-xs font-medium text-maroon-900 dark:text-cream-100 focus:outline-none"
                />
              </div>

              <div className="flex items-center gap-2 overflow-x-auto w-full md:w-auto pb-1 md:pb-0">
                <button
                  onClick={() => setSelectedCategoryFilter('all')}
                  className={`px-4 py-2 rounded-2xl text-xs font-bold transition shrink-0 ${
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
                    className={`px-4 py-2 rounded-2xl text-xs font-bold transition shrink-0 ${
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

            {/* Products Table */}
            <div className="bg-cream-100 dark:bg-maroon-900 rounded-3xl border border-cream-300 dark:border-maroon-800 shadow-sm overflow-hidden">
              {loading ? (
                <div className="py-20 text-center text-xs font-bold text-charcoal-muted">
                  Loading products...
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse text-xs">
                    <thead>
                      <tr className="border-b border-cream-300 dark:border-maroon-800 text-maroon-900 dark:text-cream-200 font-bold uppercase tracking-wider text-[10px] bg-cream-200/50 dark:bg-maroon-800/40">
                        <th className="py-3.5 px-4">Product</th>
                        <th className="py-3.5 px-4">Category</th>
                        <th className="py-3.5 px-4">Selling Price</th>
                        {canViewCost && <th className="py-3.5 px-4">Cost Price</th>}
                        {canViewCost && <th className="py-3.5 px-4">Profit</th>}
                        {canViewCost && <th className="py-3.5 px-4">Margin %</th>}
                        <th className="py-3.5 px-4">Status</th>
                        {(canEdit || canDelete) && <th className="py-3.5 px-4 text-right">Actions</th>}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-cream-300 dark:divide-maroon-800/50 font-medium">
                      {filteredProducts.map((p) => {
                        const sPrice = p.price || 0;
                        const cPrice = p.manual_cost || p.calculated_cost || 0;
                        const profit = p.profit || (sPrice - cPrice);
                        const margin = p.profit_margin || (sPrice > 0 ? ((profit / sPrice) * 100).toFixed(1) : 0);

                        return (
                          <tr key={p.id} className="hover:bg-cream-200/40 dark:hover:bg-maroon-800/30 transition">
                            <td className="py-3.5 px-4">
                              <div className="flex items-center gap-3">
                                <div className="w-12 h-12 rounded-xl overflow-hidden border border-cream-300 dark:border-maroon-700 bg-cream-200 shrink-0">
                                  <img
                                    src={getImageUrl(p.image_url)}
                                    alt={p.name}
                                    className="w-full h-full object-cover"
                                  />
                                </div>
                                <div>
                                  <span className="font-bold text-maroon-950 dark:text-cream-100 text-sm block">
                                    {p.name}
                                  </span>
                                  <span className="text-[10px] text-charcoal-muted dark:text-cream-300/70 font-mono">
                                    SKU: {p.sku || 'N/A'} {p.featured ? '• ⭐ Featured' : ''}
                                  </span>
                                </div>
                              </div>
                            </td>
                            <td className="py-3.5 px-4 text-maroon-900 dark:text-cream-200 font-bold">
                              {p.category?.name || 'Gourmet'}
                            </td>
                            <td className="py-3.5 px-4 font-bold text-emerald-800 dark:text-emerald-300">
                              ₹{sPrice}
                            </td>
                            {canViewCost && (
                              <td className="py-3.5 px-4 font-bold text-rose-800 dark:text-rose-300">
                                ₹{cPrice}
                              </td>
                            )}
                            {canViewCost && (
                              <td className="py-3.5 px-4 font-bold text-maroon-900 dark:text-cream-100">
                                ₹{profit}
                              </td>
                            )}
                            {canViewCost && (
                              <td className="py-3.5 px-4">
                                <span className="px-2.5 py-1 bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300 rounded-full font-bold text-[11px]">
                                  {margin}%
                                </span>
                              </td>
                            )}
                            <td className="py-3.5 px-4">
                              {p.availability ? (
                                <span className="inline-flex items-center gap-1 text-emerald-800 dark:text-emerald-300 font-bold text-[11px]">
                                  <CheckCircle2 className="w-3.5 h-3.5" />
                                  <span>Public</span>
                                </span>
                              ) : (
                                <span className="inline-flex items-center gap-1 text-charcoal-muted dark:text-cream-400 font-bold text-[11px]">
                                  <XCircle className="w-3.5 h-3.5" />
                                  <span>Draft</span>
                                </span>
                              )}
                            </td>
                            {(canEdit || canDelete) && (
                              <td className="py-3.5 px-4 text-right space-x-2">
                                {canEdit && (
                                  <button
                                    onClick={() => handleOpenEdit(p)}
                                    className="p-2 rounded-xl text-maroon-700 dark:text-cream-200 hover:bg-cream-200 dark:hover:bg-maroon-800 transition"
                                    title="Edit Product"
                                  >
                                    <Edit className="w-4 h-4" />
                                  </button>
                                )}
                                {canDelete && (
                                  <button
                                    onClick={() => handleDeleteProduct(p.id)}
                                    className="p-2 rounded-xl text-rose-700 dark:text-rose-400 hover:bg-rose-100 dark:hover:bg-rose-950 transition"
                                    title="Delete Product"
                                  >
                                    <Trash2 className="w-4 h-4" />
                                  </button>
                                )}
                              </td>
                            )}
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </main>
        </div>
      </div>

      {/* Add / Edit Product Modal */}
      <Modal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editingProduct ? `Edit ERP Product: ${editingProduct.name}` : 'Add New Bakery Product'}
        subtitle="Manage selling price, internal cost, sizes, and public visibility."
        maxWidth="lg"
      >
        <form onSubmit={handleSaveProduct} className="space-y-4 text-xs">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block font-bold text-maroon-900 mb-1">Product Name *</label>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Belgian Chocolate Truffle Cake"
                className="w-full px-3 py-2 bg-cream-100 border border-cream-300 rounded-xl font-medium"
              />
            </div>

            <div>
              <label className="block font-bold text-maroon-900 mb-1">Category *</label>
              <select
                required
                value={categoryId}
                onChange={(e) => setCategoryId(Number(e.target.value))}
                className="w-full px-3 py-2 bg-cream-100 border border-cream-300 rounded-xl font-medium"
              >
                {categories.map((c) => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block font-bold text-maroon-900 mb-1">Selling Price (Public) ₹ *</label>
              <input
                type="number"
                required
                value={sellingPrice}
                onChange={(e) => setSellingPrice(Number(e.target.value))}
                placeholder="1050"
                className="w-full px-3 py-2 bg-cream-100 border border-cream-300 rounded-xl font-medium text-emerald-800 font-bold"
              />
            </div>

            <div>
              <label className="block font-bold text-maroon-900 mb-1">Cost Price (Internal ERP) ₹</label>
              <input
                type="number"
                value={costPrice}
                onChange={(e) => setCostPrice(Number(e.target.value))}
                placeholder="650"
                className="w-full px-3 py-2 bg-cream-100 border border-cream-300 rounded-xl font-medium text-rose-800 font-bold"
              />
            </div>

            <div>
              <label className="block font-bold text-maroon-900 mb-1">Estimated Profit ₹</label>
              <div className="px-3 py-2 bg-cream-200 border border-cream-300 rounded-xl font-bold text-maroon-900">
                ₹{sellingPrice !== '' && costPrice !== '' ? (Number(sellingPrice) - Number(costPrice)) : 0}
              </div>
            </div>
          </div>

          {/* Product Image Uploader */}
          <div className="p-4 bg-cream-200 rounded-2xl border border-cream-300 space-y-3">
            <label className="block font-bold text-maroon-900">Product Image Upload</label>
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 rounded-xl overflow-hidden border border-cream-300 bg-cream-100 shrink-0">
                {imageUrl ? (
                  <img src={getImageUrl(imageUrl)} alt="Preview" className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-charcoal-muted">
                    <ImageIcon className="w-6 h-6" />
                  </div>
                )}
              </div>

              <div className="space-y-1 flex-1">
                <input
                  type="file"
                  accept="image/jpeg,image/png,image/webp"
                  onChange={handleImageUpload}
                  disabled={uploadingImage}
                  className="text-xs text-charcoal-muted file:mr-4 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-xs file:font-bold file:bg-maroon-700 file:text-cream-100 hover:file:bg-maroon-800 cursor-pointer"
                />
                <p className="text-[10px] text-charcoal-muted">Supported: JPG, JPEG, PNG, WEBP (Max 5MB)</p>
              </div>
            </div>
          </div>

          {/* Sizes & Multi-option Pricing */}
          <div className="p-4 bg-cream-200 rounded-2xl border border-cream-300 space-y-3">
            <div className="flex items-center justify-between">
              <label className="font-bold text-maroon-900">Available Sizes / Weights</label>
              <button
                type="button"
                onClick={handleAddSizeRow}
                className="text-xs text-maroon-700 font-bold hover:underline flex items-center gap-1"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Add Size Option</span>
              </button>
            </div>

            <div className="space-y-2">
              {sizesList.map((sz, idx) => (
                <div key={idx} className="flex items-center gap-2 bg-cream-100 p-2.5 rounded-xl border border-cream-300">
                  <input
                    type="text"
                    placeholder="Size name e.g. 1 Pound"
                    value={sz.size}
                    onChange={(e) => handleSizeChange(idx, 'size', e.target.value)}
                    className="flex-1 px-2.5 py-1.5 bg-cream-200 border border-cream-300 rounded-lg text-xs font-medium"
                  />
                  <input
                    type="number"
                    placeholder="Selling Price ₹"
                    value={sz.selling_price}
                    onChange={(e) => handleSizeChange(idx, 'selling_price', Number(e.target.value))}
                    className="w-28 px-2.5 py-1.5 bg-cream-200 border border-cream-300 rounded-lg text-xs font-bold text-emerald-800"
                  />
                  <input
                    type="number"
                    placeholder="Cost Price ₹"
                    value={sz.cost_price}
                    onChange={(e) => handleSizeChange(idx, 'cost_price', Number(e.target.value))}
                    className="w-28 px-2.5 py-1.5 bg-cream-200 border border-cream-300 rounded-lg text-xs font-bold text-rose-800"
                  />
                  <button
                    type="button"
                    onClick={() => handleRemoveSizeRow(idx)}
                    className="p-1.5 text-rose-700 hover:bg-rose-100 rounded-lg"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block font-bold text-maroon-900 mb-1">SKU</label>
              <input
                type="text"
                value={sku}
                onChange={(e) => setSku(e.target.value)}
                className="w-full px-3 py-2 bg-cream-100 border border-cream-300 rounded-xl font-mono text-xs"
              />
            </div>

            <div>
              <label className="block font-bold text-maroon-900 mb-1">Preparation Time (Hours)</label>
              <input
                type="number"
                step="0.5"
                value={prepTimeHours}
                onChange={(e) => setPrepTimeHours(Number(e.target.value))}
                className="w-full px-3 py-2 bg-cream-100 border border-cream-300 rounded-xl font-medium"
              />
            </div>
          </div>

          <div>
            <label className="block font-bold text-maroon-900 mb-1">Product Description</label>
            <textarea
              rows={3}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Rich Belgian chocolate sponge layered with ganache..."
              className="w-full px-3 py-2 bg-cream-100 border border-cream-300 rounded-xl font-medium"
            />
          </div>

          <div className="flex flex-wrap items-center gap-6 pt-2">
            <label className="flex items-center gap-2 cursor-pointer font-bold text-maroon-900">
              <input
                type="checkbox"
                checked={publicVisibility}
                onChange={(e) => setPublicVisibility(e.target.checked)}
                className="w-4 h-4 rounded text-maroon-700"
              />
              <span>Public Visibility (Visible on Website)</span>
            </label>

            <label className="flex items-center gap-2 cursor-pointer font-bold text-maroon-900">
              <input
                type="checkbox"
                checked={availability}
                onChange={(e) => setAvailability(e.target.checked)}
                className="w-4 h-4 rounded text-maroon-700"
              />
              <span>In Stock / Available</span>
            </label>

            <label className="flex items-center gap-2 cursor-pointer font-bold text-maroon-900">
              <input
                type="checkbox"
                checked={featured}
                onChange={(e) => setFeatured(e.target.checked)}
                className="w-4 h-4 rounded text-maroon-700"
              />
              <span>Feature on Homepage</span>
            </label>
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
              Save Product &amp; Update Public Site
            </button>
          </div>
        </form>
      </Modal>
    </ProtectedRoute>
  );
}
