'use client';

import React, { useEffect, useState } from 'react';
import { PublicHeader } from '@/components/layout/PublicHeader';
import { PublicFooter } from '@/components/layout/PublicFooter';
import { CustomerOrderModal } from '@/components/orders/CustomerOrderModal';
import { api, getImageUrl } from '@/lib/api';
import { Product, Category } from '@/types';
import { Search, ShoppingBag, Sparkles, ArrowRight } from 'lucide-react';

export default function PublicMenuPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);

  // Search & Filters
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');

  // Customer Direct Order Modal
  const [orderModalOpen, setOrderModalOpen] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);

  useEffect(() => {
    fetchPublicMenu();
  }, []);

  const fetchPublicMenu = async () => {
    try {
      setLoading(true);
      const [prodRes, catRes] = await Promise.all([
        api.get('/products?available_only=true'),
        api.get('/categories')
      ]);
      setProducts(prodRes.data);
      setCategories(catRes.data);
    } catch (err) {
      console.error('Failed to load menu:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenEnquiry = (prod: Product) => {
    setSelectedProduct(prod);
    setOrderModalOpen(true);
  };

  const filteredProducts = products.filter((p) => {
    if (selectedCategory !== 'all') {
      const catId = parseInt(selectedCategory, 10);
      if (!isNaN(catId)) {
        if (p.category_id !== catId) return false;
      } else {
        const catName = p.category?.name.toLowerCase() || '';
        if (!catName.includes(selectedCategory.toLowerCase())) return false;
      }
    }

    if (search.trim()) {
      const q = search.toLowerCase();
      const matchName = p.name.toLowerCase().includes(q);
      const matchDesc = p.description?.toLowerCase().includes(q) || false;
      if (!matchName && !matchDesc) return false;
    }
    return true;
  });

  return (
    <div className="min-h-screen bg-cream-100 dark:bg-maroon-950 text-charcoal dark:text-cream-100 flex flex-col font-sans selection:bg-maroon-700 selection:text-cream-100">
      <PublicHeader />

      <main className="flex-1 py-12 lg:py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-10">
          
          {/* Header Banner */}
          <div className="text-center max-w-2xl mx-auto space-y-3">
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-cream-50 dark:bg-maroon-900 border-2 border-maroon-950 dark:border-cream-100 text-maroon-950 dark:text-cream-100 text-[11px] font-black uppercase tracking-widest shadow-neo-sm">
              <Sparkles className="w-3.5 h-3.5 text-amber-500 fill-amber-500" />
              <span>Full Atelier Menu</span>
            </div>

            <h1 className="text-3xl sm:text-5xl font-black text-maroon-950 dark:text-cream-100 font-serif tracking-tight">
              Our Bakery Menu Catalog
            </h1>
            <p className="text-xs sm:text-sm text-charcoal-muted dark:text-cream-300 font-medium">
              Explore freshly baked cakes, artisanal bento creations, tiered centerpieces, and gourmet desserts.
            </p>
          </div>

          {/* Search & Category Filter Pills (Neo-Brutalist) */}
          <div className="bg-cream-50 dark:bg-maroon-900 p-4 sm:p-5 rounded-3xl border-2 border-maroon-950/20 dark:border-cream-100/20 shadow-neo-sm flex flex-col md:flex-row items-center justify-between gap-4">
            
            {/* Search Input */}
            <div className="relative w-full md:w-80">
              <Search className="w-4 h-4 text-charcoal-muted dark:text-cream-400 absolute left-3.5 top-3" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search cakes by name or flavor..."
                className="w-full pl-10 pr-4 py-2.5 bg-cream-100 dark:bg-maroon-950 border-2 border-maroon-950/20 dark:border-cream-100/20 rounded-2xl text-xs font-medium text-maroon-950 dark:text-cream-100 placeholder:text-charcoal-muted outline-none focus:border-maroon-950"
              />
            </div>

            {/* Category Filter Pills */}
            <div className="flex items-center gap-2 overflow-x-auto w-full md:w-auto pb-1 md:pb-0 scrollbar-none">
              <button
                onClick={() => setSelectedCategory('all')}
                className={`px-4 py-2 rounded-xl text-xs font-serif font-bold transition shrink-0 border-2 ${
                  selectedCategory === 'all'
                    ? 'bg-maroon-700 text-cream-100 border-maroon-950 shadow-neo-sm'
                    : 'bg-cream-100 dark:bg-maroon-950 text-maroon-950 dark:text-cream-100 border-maroon-950/20 hover:border-maroon-950'
                }`}
              >
                All Cakes
              </button>
              {categories.map((cat) => (
                <button
                  key={cat.id}
                  onClick={() => setSelectedCategory(String(cat.id))}
                  className={`px-4 py-2 rounded-xl text-xs font-serif font-bold transition shrink-0 border-2 ${
                    selectedCategory === String(cat.id)
                      ? 'bg-maroon-700 text-cream-100 border-maroon-950 shadow-neo-sm'
                      : 'bg-cream-100 dark:bg-maroon-950 text-maroon-950 dark:text-cream-100 border-maroon-950/20 hover:border-maroon-950'
                  }`}
                >
                  {cat.name}
                </button>
              ))}
            </div>

          </div>

          {/* Product Grid */}
          {loading ? (
            <div className="py-24 text-center">
              <div className="inline-block animate-spin rounded-full h-8 w-8 border-4 border-maroon-700 border-t-transparent"></div>
              <p className="text-xs text-charcoal-muted mt-2 font-bold">Loading artisan cakes...</p>
            </div>
          ) : filteredProducts.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {filteredProducts.map((prod) => (
                <div
                  key={prod.id}
                  className="bg-cream-50 dark:bg-maroon-900 rounded-3xl border-2 border-maroon-950/20 dark:border-cream-100/20 hover:border-maroon-950 dark:hover:border-cream-100 p-5 space-y-4 shadow-neo-sm hover:shadow-neo hover:-translate-y-1 transition-all flex flex-col justify-between group"
                >
                  <div className="space-y-3">
                    <div className="aspect-[4/3] rounded-2xl overflow-hidden border-2 border-maroon-950/15 dark:border-cream-100/20 relative bg-cream-200 dark:bg-maroon-800">
                      <img
                        src={getImageUrl(prod.image_url)}
                        alt={prod.name}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                      />
                      <span className="absolute top-2.5 right-2.5 px-3 py-1 bg-maroon-950 text-cream-100 border border-cream-200 text-xs font-black rounded-xl shadow-xs">
                        ₹{prod.price}
                      </span>
                    </div>

                    <div>
                      <span className="text-[10px] uppercase font-bold text-maroon-700 dark:text-cream-300 tracking-wider">
                        {prod.category?.name || 'Gourmet Cake'}
                      </span>
                      <h3 className="font-bold text-maroon-950 dark:text-cream-100 text-base font-serif mt-0.5 group-hover:text-maroon-700 dark:group-hover:text-amber-300 transition-colors">
                        {prod.name}
                      </h3>
                      <p className="text-xs text-charcoal-muted dark:text-cream-300/80 line-clamp-2 mt-1 font-medium leading-relaxed">
                        {prod.description}
                      </p>
                    </div>

                    {prod.sizes && prod.sizes.length > 0 && (
                      <div className="pt-2 border-t border-maroon-950/10 dark:border-maroon-800 space-y-1 text-[11px]">
                        <span className="font-bold text-maroon-950 dark:text-cream-200 block">Available Sizes:</span>
                        <div className="flex flex-wrap gap-1">
                          {prod.sizes.map((s: any, idx: number) => (
                            <span key={idx} className="px-2 py-0.5 bg-cream-100 dark:bg-maroon-950 text-maroon-950 dark:text-cream-200 rounded-md font-medium border border-maroon-950/20 text-[10px]">
                              {typeof s === 'string' ? s : `${s.size} — ₹${s.selling_price}`}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>

                  <button
                    onClick={() => handleOpenEnquiry(prod)}
                    className="w-full py-3 bg-maroon-700 hover:bg-maroon-800 text-cream-100 text-xs font-black uppercase tracking-wider rounded-xl border-2 border-maroon-950 dark:border-cream-100 shadow-neo-sm hover:shadow-neo hover:-translate-x-0.5 hover:-translate-y-0.5 active:translate-x-0 active:translate-y-0 transition-all flex items-center justify-center gap-2"
                  >
                    <span>Order Now</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}
            </div>
          ) : (
            <div className="p-16 text-center bg-cream-50 dark:bg-maroon-900 rounded-3xl border-2 border-maroon-950/20">
              <p className="text-sm font-bold text-charcoal-muted dark:text-cream-300 font-serif">
                No cakes found matching &quot;{search}&quot;.
              </p>
              <button
                onClick={() => { setSearch(''); setSelectedCategory('all'); }}
                className="mt-3 px-4 py-2 bg-maroon-700 text-cream-100 rounded-xl text-xs font-bold border-2 border-maroon-950 shadow-neo-sm"
              >
                Reset Filters
              </button>
            </div>
          )}

        </div>
      </main>

      <PublicFooter />

      {/* Customer Direct Order Modal */}
      <CustomerOrderModal
        isOpen={orderModalOpen}
        onClose={() => setOrderModalOpen(false)}
        selectedProduct={selectedProduct}
        productsList={products}
      />
    </div>
  );
}
