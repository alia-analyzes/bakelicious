'use client';

import React, { useEffect, useState } from 'react';
import { Sidebar } from '@/components/layout/Sidebar';
import { Header } from '@/components/layout/Header';
import { ProtectedRoute } from '@/components/auth/ProtectedRoute';
import { api } from '@/lib/api';
import { showToast } from '@/lib/toast';
import { Upload, Image as ImageIcon, Trash2, Copy, Check } from 'lucide-react';

export default function AdminMediaPage() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [copiedUrl, setCopiedUrl] = useState<string | null>(null);

  // Sample media gallery
  const [images, setImages] = useState<string[]>([
    '/images/cakes/belgian-chocolate.jpg',
    '/images/cakes/vanilla-berry.jpg',
    '/images/cakes/red-velvet.jpg',
    '/images/cakes/mango-delight.jpg',
    '/images/cakes/bento-heart.jpg',
    '/images/cakes/wedding-grace.jpg'
  ]);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const formData = new FormData();
    formData.append('file', file);

    try {
      setUploading(true);
      const res = await api.post('/uploads/image', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      setImages([res.data.image_url, ...images]);
      showToast('Image uploaded to Bakery Media Library!', 'success');
    } catch (err: any) {
      showToast(err.response?.data?.detail || 'Failed to upload image', 'error');
    } finally {
      setUploading(false);
    }
  };

  const handleCopyUrl = (url: string) => {
    navigator.clipboard.writeText(url);
    setCopiedUrl(url);
    showToast('Image URL copied to clipboard!', 'success');
    setTimeout(() => setCopiedUrl(null), 2000);
  };

  return (
    <ProtectedRoute requiredPermission="MEDIA_VIEW">
      <div className="min-h-screen bg-cream-200 dark:bg-maroon-950 text-charcoal dark:text-cream-100 flex font-sans">
        <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

        <div className="flex-1 flex flex-col min-w-0 lg:pl-64">
          <Header onOpenSidebar={() => setSidebarOpen(true)} title="Bakery Media Library & Cake Assets" />

          <main className="flex-1 p-4 sm:p-6 lg:p-8 space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-cream-100 dark:bg-maroon-900 p-5 rounded-3xl border border-cream-300 dark:border-maroon-800 shadow-sm">
              <div>
                <h1 className="text-2xl font-extrabold font-serif text-maroon-950 dark:text-cream-100">
                  Media &amp; Image Assets Library
                </h1>
                <p className="text-xs text-charcoal-muted dark:text-cream-300/80 font-medium mt-0.5">
                  Upload photos of custom cakes, pastries, and social media reviews.
                </p>
              </div>

              <label className="px-5 py-3 bg-maroon-700 hover:bg-maroon-800 text-cream-100 rounded-2xl text-xs font-bold transition shadow-md flex items-center gap-2 cursor-pointer shrink-0">
                <Upload className="w-4 h-4" />
                <span>{uploading ? 'Uploading...' : 'Upload New Media'}</span>
                <input
                  type="file"
                  accept="image/jpeg,image/png,image/webp"
                  onChange={handleFileUpload}
                  disabled={uploading}
                  className="hidden"
                />
              </label>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
              {images.map((img, idx) => (
                <div
                  key={idx}
                  className="group relative bg-cream-100 dark:bg-maroon-900 rounded-2xl overflow-hidden border border-cream-300 dark:border-maroon-800 shadow-sm aspect-square"
                >
                  <img src={img} alt={`Media ${idx}`} className="w-full h-full object-cover group-hover:scale-105 transition" />
                  <div className="absolute inset-0 bg-maroon-950/60 opacity-0 group-hover:opacity-100 transition flex items-center justify-center gap-2">
                    <button
                      onClick={() => handleCopyUrl(img)}
                      className="p-2 bg-cream-100 text-maroon-900 rounded-xl hover:bg-cream-200"
                      title="Copy Image Path"
                    >
                      {copiedUrl === img ? <Check className="w-4 h-4 text-emerald-700" /> : <Copy className="w-4 h-4" />}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </main>
        </div>
      </div>
    </ProtectedRoute>
  );
}
