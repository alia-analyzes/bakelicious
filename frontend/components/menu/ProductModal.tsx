'use client';

import React, { useState, useEffect } from 'react';
import { Modal } from '@/components/ui/Modal';
import { Category, Product } from '@/types';
import { api } from '@/lib/api';
import { showToast } from '@/lib/toast';
import { Upload, X, Image as ImageIcon, Plus, Check } from 'lucide-react';

interface ProductModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  product?: Product | null;
  categories: Category[];
}

export const ProductModal: React.FC<ProductModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  product,
  categories,
}) => {
  const backendUrl = process.env.NEXT_PUBLIC_API_URL?.replace('/api', '') || 'http://localhost:8000';

  const [name, setName] = useState('');
  const [categoryId, setCategoryId] = useState<number | ''>('');
  const [price, setPrice] = useState<number | ''>('');
  const [description, setDescription] = useState('');
  const [prepTimeHours, setPrepTimeHours] = useState<number>(1.0);
  const [size, setSize] = useState('');
  const [sku, setSku] = useState('');
  const [availability, setAvailability] = useState(true);
  const [manualCost, setManualCost] = useState<number | ''>(0);
  const [useManualCost, setUseManualCost] = useState(false);
  const [tagInput, setTagInput] = useState('');
  const [tags, setTags] = useState<string[]>([]);
  const [imageUrl, setImageUrl] = useState<string>('');
  
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (product) {
      setName(product.name);
      setCategoryId(product.category_id);
      setPrice(product.price);
      setDescription(product.description || '');
      setPrepTimeHours(product.prep_time_hours || 1.0);
      setSize(product.size || '');
      setSku(product.sku || '');
      setAvailability(product.availability);
      setManualCost(product.manual_cost || 0);
      setUseManualCost(product.use_manual_cost);
      setTags(product.tags || []);
      setImageUrl(product.image_url || '');
    } else {
      resetForm();
    }
  }, [product, isOpen]);

  const resetForm = () => {
    setName('');
    setCategoryId(categories.length > 0 ? categories[0].id : '');
    setPrice('');
    setDescription('');
    setPrepTimeHours(1.0);
    setSize('');
    setSku('');
    setAvailability(true);
    setManualCost(0);
    setUseManualCost(false);
    setTags([]);
    setImageUrl('');
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const formData = new FormData();
    formData.append('file', file);

    setUploading(true);
    try {
      const res = await api.post('/uploads/image', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      setImageUrl(res.data.image_url);
      showToast('Image uploaded successfully', 'success');
    } catch (err: any) {
      showToast(err.response?.data?.detail || 'Failed to upload image', 'error');
    } finally {
      setUploading(false);
    }
  };

  const handleRemoveImage = () => {
    setImageUrl('');
  };

  const handleAddTag = () => {
    if (tagInput.trim() && !tags.includes(tagInput.trim())) {
      setTags([...tags, tagInput.trim()]);
      setTagInput('');
    }
  };

  const handleRemoveTag = (tagToRemove: string) => {
    setTags(tags.filter((t) => t !== tagToRemove));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !categoryId || price === '') {
      showToast('Please fill in product name, category, and price', 'error');
      return;
    }

    setSaving(true);
    try {
      const payload = {
        name,
        category_id: Number(categoryId),
        price: Number(price),
        description,
        prep_time_hours: Number(prepTimeHours),
        size,
        sku,
        availability,
        manual_cost: Number(manualCost || 0),
        use_manual_cost: useManualCost,
        tags,
        image_url: imageUrl || null,
      };

      if (product) {
        await api.put(`/products/${product.id}`, payload);
        showToast('Product updated successfully', 'success');
      } else {
        await api.post('/products', payload);
        showToast('Product created successfully', 'success');
      }

      onSuccess();
      onClose();
    } catch (err: any) {
      showToast(err.response?.data?.detail || 'Failed to save product', 'error');
    } finally {
      setSaving(false);
    }
  };

  const displayImageUrl = imageUrl
    ? imageUrl.startsWith('http')
      ? imageUrl
      : `${backendUrl}${imageUrl}`
    : null;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={product ? 'Edit Product' : 'Add New Bakery Product'}
      subtitle="CMS Product Editor & Pricing Setup"
      maxWidth="2xl"
    >
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Image Upload Area */}
        <div>
          <label className="block text-xs font-semibold text-slate-700 mb-2">
            Product Image
          </label>
          <div className="flex items-center gap-4">
            <div className="relative w-28 h-28 bg-bakery-50 rounded-2xl border-2 border-dashed border-bakery-300 flex items-center justify-center overflow-hidden shrink-0">
              {displayImageUrl ? (
                <>
                  <img src={displayImageUrl} alt="Preview" className="w-full h-full object-cover" />
                  <button
                    type="button"
                    onClick={handleRemoveImage}
                    className="absolute top-1 right-1 p-1 bg-rose-600 text-white rounded-full hover:bg-rose-700 shadow-md transition"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </>
              ) : (
                <ImageIcon className="w-8 h-8 text-bakery-300" />
              )}
            </div>

            <div className="space-y-2">
              <label className="inline-flex items-center gap-2 px-4 py-2 bg-bakery-600 hover:bg-bakery-700 text-white rounded-xl text-xs font-semibold cursor-pointer transition shadow-sm">
                <Upload className="w-4 h-4" />
                <span>{uploading ? 'Uploading...' : 'Upload New Image'}</span>
                <input
                  type="file"
                  accept="image/jpeg,image/png,image/webp"
                  onChange={handleImageUpload}
                  disabled={uploading}
                  className="hidden"
                />
              </label>
              <p className="text-[11px] text-slate-500">
                Supported: JPG, JPEG, PNG, WEBP (Max 5MB). Live preview enabled.
              </p>
            </div>
          </div>
        </div>

        {/* Basic Fields Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Product Name *
            </label>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Classic Chocolate Fudge Cake"
              className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-bakery-600"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Category *
            </label>
            <select
              required
              value={categoryId}
              onChange={(e) => setCategoryId(Number(e.target.value))}
              className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-bakery-600"
            >
              {categories.map((cat) => (
                <option key={cat.id} value={cat.id}>
                  {cat.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Selling Price (₹) *
            </label>
            <input
              type="number"
              step="0.01"
              required
              value={price}
              onChange={(e) => setPrice(e.target.value === '' ? '' : Number(e.target.value))}
              placeholder="850.00"
              className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-bakery-600 font-bold"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Preparation Time (Hours)
            </label>
            <input
              type="number"
              step="0.5"
              value={prepTimeHours}
              onChange={(e) => setPrepTimeHours(Number(e.target.value))}
              placeholder="2.5"
              className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-bakery-600"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Size / Portion
            </label>
            <input
              type="text"
              value={size}
              onChange={(e) => setSize(e.target.value)}
              placeholder="e.g. 1 kg, Box of 6"
              className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-bakery-600"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              SKU / Code
            </label>
            <input
              type="text"
              value={sku}
              onChange={(e) => setSku(e.target.value)}
              placeholder="BAKE-CAKE-01"
              className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-bakery-600 font-mono"
            />
          </div>
        </div>

        {/* Description */}
        <div>
          <label className="block text-xs font-semibold text-slate-700 mb-1">
            Description
          </label>
          <textarea
            rows={2}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Detailed bakery item description..."
            className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-bakery-600"
          />
        </div>

        {/* Manual Costing Override */}
        <div className="p-4 bg-bakery-50 rounded-2xl border border-bakery-200 space-y-3">
          <div className="flex items-center justify-between">
            <div>
              <span className="text-xs font-bold text-slate-800">Manual Production Cost Override</span>
              <p className="text-[11px] text-slate-500">Override calculated recipe cost manually if needed</p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={useManualCost}
                onChange={(e) => setUseManualCost(e.target.checked)}
                className="sr-only peer"
              />
              <div className="w-9 h-5 bg-slate-300 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-bakery-600"></div>
            </label>
          </div>

          {useManualCost && (
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Manual Cost (₹)
              </label>
              <input
                type="number"
                step="0.01"
                value={manualCost}
                onChange={(e) => setManualCost(e.target.value === '' ? '' : Number(e.target.value))}
                className="w-full px-3.5 py-2 bg-white border border-bakery-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-bakery-600 font-bold"
              />
            </div>
          )}
        </div>

        {/* Tags */}
        <div>
          <label className="block text-xs font-semibold text-slate-700 mb-1">
            Tags (e.g. Best Seller, Eggless)
          </label>
          <div className="flex gap-2 mb-2">
            <input
              type="text"
              value={tagInput}
              onChange={(e) => setTagInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  handleAddTag();
                }
              }}
              placeholder="Add a tag..."
              className="flex-1 px-3.5 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-bakery-600"
            />
            <button
              type="button"
              onClick={handleAddTag}
              className="px-3 py-1.5 bg-slate-200 hover:bg-slate-300 text-slate-700 text-xs font-bold rounded-xl transition"
            >
              Add Tag
            </button>
          </div>

          <div className="flex flex-wrap gap-1.5">
            {tags.map((tag, idx) => (
              <span
                key={idx}
                className="inline-flex items-center gap-1 px-2.5 py-1 bg-bakery-100 text-bakery-800 rounded-lg text-xs font-semibold"
              >
                #{tag}
                <button type="button" onClick={() => handleRemoveTag(tag)}>
                  <X className="w-3 h-3 hover:text-rose-600" />
                </button>
              </span>
            ))}
          </div>
        </div>

        {/* Availability Toggle */}
        <div className="flex items-center justify-between p-3 bg-slate-50 rounded-xl border border-slate-200">
          <span className="text-xs font-bold text-slate-800">Currently Available for Sale</span>
          <label className="relative inline-flex items-center cursor-pointer">
            <input
              type="checkbox"
              checked={availability}
              onChange={(e) => setAvailability(e.target.checked)}
              className="sr-only peer"
            />
            <div className="w-11 h-6 bg-slate-300 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-emerald-600"></div>
          </label>
        </div>

        {/* Form Action Buttons */}
        <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 bg-slate-100 text-slate-700 hover:bg-slate-200 text-xs font-semibold rounded-xl transition"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={saving}
            className="px-5 py-2 bg-bakery-600 hover:bg-bakery-700 text-white text-xs font-bold rounded-xl transition shadow-md shadow-bakery-600/20 disabled:opacity-50"
          >
            {saving ? 'Saving Product...' : product ? 'Save Changes' : 'Create Product'}
          </button>
        </div>
      </form>
    </Modal>
  );
};
