'use client';

import React, { useEffect, useState } from 'react';
import { PublicHeader } from '@/components/layout/PublicHeader';
import { PublicFooter } from '@/components/layout/PublicFooter';
import { CustomerOrderModal } from '@/components/orders/CustomerOrderModal';
import { api, getImageUrl } from '@/lib/api';
import { Product, Category } from '@/types';
import { Sparkles, Eye, ShoppingBag, X, Search, ArrowRight, Tag } from 'lucide-react';

// Fallback signature showcase items if database has none yet
const FALLBACK_SHOWCASE_CAKES = [
  {
    id: 101,
    name: 'Belgian Dark Truffle Indulgence',
    category: { name: 'Chocolate Decadence' },
    price: 1250,
    description: 'Triple-layer 54% Callebaut dark chocolate sponge enveloped in whipped silk ganache, roasted hazelnut praline, and gold cocoa dusting.',
    image_url: '/images/cakes/belgian-chocolate.jpg',
  },
  {
    id: 102,
    name: 'Pastel Pink Korean Bento Cake',
    category: { name: 'Bento Mini Cakes' },
    price: 480,
    description: 'Chiffon sponge layered with fresh strawberry compote, delicate Swiss buttercream ombre frosting, and custom handwritten celebration piping.',
    image_url: '/images/cakes/bento-pastel-pink.jpg',
  },
  {
    id: 103,
    name: 'Rose Pink 3-Tier Luxury Wedding Centerpiece',
    category: { name: 'Wedding Tiers' },
    price: 6500,
    description: 'Grand 3-tiered wedding centerpiece with Madagascar bourbon vanilla bean crumb, raspberry reduction, and cascading hand-sculpted sugar florals.',
    image_url: '/images/cakes/wedding-hero.jpg',
  },
  {
    id: 104,
    name: 'Classic Red Velvet Cream Cheese Tier',
    category: 'Artisan Florals',
    price: 1350,
    description: 'Traditional crimson cocoa sponge layered with whipped Philadelphia cream cheese frosting, ruby velvet crumb trim, and edible flower petals.',
    image_url: '/images/cakes/red-velvet.jpg',
  },
  {
    id: 105,
    name: 'Bento Floating Art Minimalist Cake',
    category: { name: 'Bento Mini Cakes' },
    price: 520,
    description: 'Modern aesthetic mini bento featuring airy vanilla sponge, salted caramel buttercream filling, and contemporary palette knife texture work.',
    image_url: '/images/cakes/bento-floating.jpg',
  },
  {
    id: 106,
    name: 'Seasonal Fresh Fruit & Vanilla Gateau',
    category: { name: 'Artisan Florals' },
    price: 1150,
    description: 'Featherlight vanilla genoise layered with freshly chopped kiwi, pomegranate arils, seasonal berries, and light vanilla bean custard cream.',
    image_url: '/images/cakes/fresh-fruit.jpg',
  },
  {
    id: 107,
    name: 'Handcrafted Chocolate Fudge Indulgence',
    category: { name: 'Chocolate Decadence' },
    price: 1100,
    description: 'Decadent Dutch-processed dark cocoa sponge drenched in warm fudge glaze, finished with dark chocolate curls and fleur de sel.',
    image_url: '/images/cakes/chocolate-delight.jpg',
  },
  {
    id: 108,
    name: 'Butterscotch Salted Caramel Crunch',
    category: { name: 'Artisan Florals' },
    price: 1050,
    description: 'Golden sponge layered with handcrafted butterscotch crunch, homemade salted caramel drizzle, and velvety brown butter frosting.',
    image_url: '/images/cakes/butterscotch.jpg',
  },
  {
    id: 109,
    name: '3-Tier Floral Cascade Arch Wedding Cake',
    category: { name: 'Wedding Tiers' },
    price: 7200,
    description: 'Showstopper tiered cake with French white chocolate ganache, lemon curd layers, and custom botanical arch detailing for grand banquets.',
    image_url: '/images/cakes/wedding-3tier-floral.jpg',
  }
];

export default function GalleryPage() {
  const [cakes, setCakes] = useState<Product[]>([]);
  const [categories, setCategories] = useState<string[]>(['All']);
  const [activeCategory, setActiveCategory] = useState('All');
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);

  // Lightbox & Customer Direct Order Modal
  const [lightboxCake, setLightboxCake] = useState<any | null>(null);
  const [orderModalOpen, setOrderModalOpen] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<any | null>(null);

  useEffect(() => {
    fetchShowcaseData();
  }, []);

  const fetchShowcaseData = async () => {
    try {
      setLoading(true);
      const [prodRes, catRes] = await Promise.all([
        api.get('/products'),
        api.get('/categories').catch(() => ({ data: [] }))
      ]);

      let combinedProducts: Product[] = [];
      const liveProducts: Product[] = Array.isArray(prodRes.data) ? prodRes.data : [];
      combinedProducts = [...liveProducts];

      // Check cached products to include any newly created items immediately
      try {
        const cached = localStorage.getItem('bakelicious_cached_products');
        if (cached) {
          const parsed = JSON.parse(cached);
          if (Array.isArray(parsed)) {
            parsed.forEach((cp: Product) => {
              if (!combinedProducts.some((p) => p.id === cp.id || p.name.toLowerCase() === cp.name.toLowerCase())) {
                combinedProducts.push(cp);
              }
            });
          }
        }
      } catch (e) {}

      // Filter for visible products
      const publicCakes = combinedProducts.filter(
        (p) => p.public_visibility !== false && p.availability !== false
      );

      if (publicCakes.length > 0) {
        setCakes(publicCakes);
        
        // Extract unique category names
        const catNames = new Set<string>();
        publicCakes.forEach((p) => {
          const catName = typeof p.category === 'object' ? p.category?.name : p.category;
          if (catName) catNames.add(catName);
        });
        if (Array.isArray(catRes.data)) {
          catRes.data.forEach((c: Category) => {
            if (c.name) catNames.add(c.name);
          });
        }
        setCategories(['All', ...Array.from(catNames)]);
      } else {
        // Fallback to sample showcase items if backend database is fresh/empty
        setCakes(FALLBACK_SHOWCASE_CAKES as any);
        setCategories(['All', 'Wedding Tiers', 'Bento Mini Cakes', 'Chocolate Decadence', 'Artisan Florals']);
      }
    } catch (err) {
      console.warn('Could not load cakes from API, loading signature showcase fallback:', err);
      try {
        const cached = localStorage.getItem('bakelicious_cached_products');
        if (cached) {
          const parsed = JSON.parse(cached);
          if (Array.isArray(parsed) && parsed.length > 0) {
            const valid = parsed.filter((p: Product) => p.public_visibility !== false);
            setCakes(valid);
            const catNames = new Set<string>();
            valid.forEach((p: Product) => {
              const catName = typeof p.category === 'object' ? p.category?.name : p.category;
              if (catName) catNames.add(catName);
            });
            setCategories(['All', ...Array.from(catNames)]);
            return;
          }
        }
      } catch (e) {}
      setCakes(FALLBACK_SHOWCASE_CAKES as any);
      setCategories(['All', 'Wedding Tiers', 'Bento Mini Cakes', 'Chocolate Decadence', 'Artisan Florals']);
    } finally {
      setLoading(false);
    }
  };

  const filteredCakes = cakes.filter((cake) => {
    // Category match
    if (activeCategory !== 'All') {
      const catName = typeof cake.category === 'object' ? cake.category?.name : (cake.category || '');
      if (catName !== activeCategory) {
        return false;
      }
    }

    // Search query match in description or title
    if (search.trim()) {
      const q = search.toLowerCase();
      const matchName = cake.name?.toLowerCase().includes(q);
      const matchDesc = cake.description?.toLowerCase().includes(q);
      if (!matchName && !matchDesc) return false;
    }

    return true;
  });

  const handleOpenOrder = (cake: any) => {
    setSelectedProduct({
      id: cake.id,
      name: cake.name,
      price: cake.price,
      description: cake.description,
      image_url: cake.image_url,
    });
    setLightboxCake(null);
    setOrderModalOpen(true);
  };

  return (
    <div className="min-h-screen bg-cream-100 dark:bg-maroon-950 text-charcoal dark:text-cream-100 flex flex-col font-sans selection:bg-maroon-700 selection:text-cream-100">
      <PublicHeader />

      <main className="flex-1 py-10 sm:py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-10 sm:space-y-12">
          
          {/* Header Banner */}
          <div className="text-center max-w-2xl mx-auto space-y-3 px-2">
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-cream-50 dark:bg-maroon-900 border-2 border-maroon-950 dark:border-cream-100 text-maroon-950 dark:text-cream-100 text-[10px] sm:text-[11px] font-black uppercase tracking-widest shadow-neo-sm">
              <Sparkles className="w-3.5 h-3.5 text-amber-500 fill-amber-500" />
              <span>Public Cake Showcase</span>
            </div>

            <h1 className="text-3xl sm:text-5xl font-black text-maroon-950 dark:text-cream-100 font-serif tracking-tight">
              Artisan Cake Collection
            </h1>

            <p className="text-xs sm:text-sm text-charcoal-muted dark:text-cream-300 font-medium leading-relaxed">
              Explore freshly crafted cakes with their pricing, imagery, and flavor descriptions. Click any cake to view in full detail or place an order.
            </p>
          </div>

          {/* Search & Filter Controls */}
          <div className="flex flex-col md:flex-row items-center justify-between gap-4 bg-cream-50 dark:bg-maroon-900 p-3.5 sm:p-5 rounded-2xl sm:rounded-3xl border-2 border-maroon-950/20 dark:border-cream-100/20 shadow-neo-sm">
            {/* Search Input */}
            <div className="relative w-full md:w-80">
              <Search className="w-4 h-4 text-charcoal-muted dark:text-cream-400 absolute left-3.5 top-3" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search cakes by description or name..."
                className="w-full pl-10 pr-4 py-2.5 bg-cream-100 dark:bg-maroon-950 border-2 border-maroon-950/20 dark:border-cream-100/20 rounded-xl sm:rounded-2xl text-xs font-medium text-maroon-950 dark:text-cream-100 placeholder:text-charcoal-muted outline-none focus:border-maroon-950 dark:focus:border-cream-100"
              />
            </div>

            {/* Category Filter Pills */}
            <div className="flex items-center gap-2 overflow-x-auto w-full md:w-auto pb-1 md:pb-0 scrollbar-none touch-pan-x">
              {categories.map((cat) => (
                <button
                  key={cat}
                  onClick={() => setActiveCategory(cat)}
                  className={`px-3.5 py-1.5 sm:px-4 sm:py-2 rounded-xl text-xs font-serif font-bold transition shrink-0 border-2 ${
                    activeCategory === cat
                      ? 'bg-maroon-700 text-cream-100 border-maroon-950 dark:border-cream-100 shadow-neo-sm'
                      : 'bg-cream-100 dark:bg-maroon-950 text-maroon-950 dark:text-cream-100 border-maroon-950/20 hover:border-maroon-950 hover:bg-cream-200'
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>
          </div>

          {/* ================= CAKE SHOWCASE GRID ================= */}
          {/* Specifically highlights: Cake Image, Cake Price, and Cake Description */}
          {loading ? (
            <div className="py-24 text-center">
              <div className="inline-block animate-spin rounded-full h-8 w-8 border-4 border-maroon-700 border-t-transparent"></div>
              <p className="text-xs text-charcoal-muted mt-2 font-bold font-serif">Loading cake pictures &amp; details...</p>
            </div>
          ) : filteredCakes.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8">
              {filteredCakes.map((cake) => {
                const imageUrl = getImageUrl(cake.image_url);
                const priceFormatted = Number(cake.price || 0).toLocaleString('en-IN');

                return (
                  <div
                    key={cake.id}
                    onClick={() => setLightboxCake(cake)}
                    className="group bg-cream-50 dark:bg-maroon-900 rounded-3xl border-2 border-maroon-950/20 dark:border-cream-100/20 hover:border-maroon-950 dark:hover:border-cream-100 shadow-neo-sm hover:shadow-neo hover:-translate-y-1 transition-all overflow-hidden cursor-pointer flex flex-col justify-between"
                  >
                    {/* 1. CAKE PICTURE (with prominent price tag) */}
                    <div className="aspect-[4/3] relative overflow-hidden bg-cream-200 dark:bg-maroon-800">
                      <img
                        src={imageUrl}
                        alt={cake.name}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                        onError={(e) => {
                          (e.target as HTMLImageElement).src = '/images/cakes/chocolate-delight.svg';
                        }}
                      />

                      {/* 2. CAKE PRICE BADGE - Prominent, high-contrast, elegant */}
                      <div className="absolute top-3.5 right-3.5 px-3.5 py-1.5 bg-maroon-950 text-cream-100 dark:bg-cream-100 dark:text-maroon-950 border-2 border-cream-100 dark:border-maroon-950 text-xs sm:text-sm font-black rounded-2xl shadow-neo-sm">
                        ₹{priceFormatted}
                      </div>

                      {/* Inspect Overlay on Hover */}
                      <div className="absolute inset-0 bg-maroon-950/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                        <div className="px-4 py-2 rounded-full bg-cream-100 text-maroon-950 border-2 border-maroon-950 shadow-neo-sm text-xs font-black flex items-center gap-1.5 transform scale-90 group-hover:scale-100 transition-transform">
                          <Eye className="w-4 h-4" />
                          <span>Inspect Cake</span>
                        </div>
                      </div>
                    </div>

                    {/* 3. CAKE TITLE & DESCRIPTION */}
                    <div className="p-5 sm:p-6 space-y-3 flex-1 flex flex-col justify-between border-t-2 border-maroon-950/10 dark:border-cream-100/10">
                      <div className="space-y-2">
                        <div className="flex items-center justify-between gap-2">
                          <h3 className="font-serif font-black text-lg text-maroon-950 dark:text-cream-100 group-hover:text-maroon-700 dark:group-hover:text-amber-300 transition-colors line-clamp-1">
                            {cake.name}
                          </h3>
                        </div>

                        {/* DESCRIPTION */}
                        <p className="text-xs text-charcoal-muted dark:text-cream-300 leading-relaxed font-medium line-clamp-3">
                          {cake.description || 'Deliciously handcrafted artisan cake prepared with premium ingredients and exquisite confectionery technique.'}
                        </p>
                      </div>

                      {/* Bottom Price & Order Bar */}
                      <div className="pt-3 border-t border-maroon-950/10 dark:border-maroon-800 flex items-center justify-between">
                        <div className="flex flex-col">
                          <span className="text-[10px] uppercase font-bold tracking-wider text-charcoal-muted dark:text-cream-400">
                            Price
                          </span>
                          <span className="text-base font-black font-serif text-maroon-950 dark:text-cream-100">
                            ₹{priceFormatted}
                          </span>
                        </div>

                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleOpenOrder(cake);
                          }}
                          className="px-4 py-2 bg-maroon-700 hover:bg-maroon-800 text-cream-100 text-xs font-black rounded-xl border-2 border-maroon-950 dark:border-cream-100 shadow-neo-xs hover:shadow-neo transition flex items-center gap-1.5"
                        >
                          <ShoppingBag className="w-3.5 h-3.5" />
                          <span>Order</span>
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="p-16 text-center bg-cream-50 dark:bg-maroon-900 rounded-3xl border-2 border-maroon-950/20">
              <p className="text-sm font-bold text-charcoal-muted dark:text-cream-300 font-serif">
                No cakes found matching &quot;{search}&quot;.
              </p>
            </div>
          )}

        </div>
      </main>

      {/* ================= LIGHTBOX MODAL ================= */}
      {/* Shows full cake picture, price, and complete description */}
      {lightboxCake && (
        <div
          className="fixed inset-0 z-50 bg-maroon-950/80 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4"
          onClick={() => setLightboxCake(null)}
        >
          <div
            className="bg-cream-50 dark:bg-maroon-900 rounded-3xl border-2 border-maroon-950 dark:border-cream-100 max-w-2xl w-full p-4 sm:p-7 shadow-neo-xl space-y-4 sm:space-y-5 animate-fadeIn relative max-h-[92dvh] max-h-[92vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              onClick={() => setLightboxCake(null)}
              className="absolute top-4 right-4 p-2 rounded-full border-2 border-maroon-950 bg-cream-100 text-maroon-950 shadow-neo-sm hover:scale-105 transition z-10"
            >
              <X className="w-4 h-4" />
            </button>

            {/* Cake Image */}
            <div className="aspect-[4/3] rounded-2xl overflow-hidden border-2 border-maroon-950 relative bg-cream-200 dark:bg-maroon-800">
              <img
                src={getImageUrl(lightboxCake.image_url)}
                alt={lightboxCake.name}
                className="w-full h-full object-cover"
                onError={(e) => {
                  (e.target as HTMLImageElement).src = '/images/cakes/chocolate-delight.svg';
                }}
              />
              <div className="absolute top-4 right-14 px-4 py-1.5 bg-maroon-950 text-cream-100 border-2 border-cream-100 text-sm font-black rounded-2xl shadow-neo-sm">
                ₹{Number(lightboxCake.price || 0).toLocaleString('en-IN')}
              </div>
            </div>

            {/* Cake Title, Price & Full Description */}
            <div className="space-y-3">
              <div className="flex items-center justify-between gap-4">
                <h2 className="text-2xl sm:text-3xl font-serif font-black text-maroon-950 dark:text-cream-100">
                  {lightboxCake.name}
                </h2>
                <div className="text-xl sm:text-2xl font-black font-serif text-maroon-700 dark:text-cream-100 shrink-0">
                  ₹{Number(lightboxCake.price || 0).toLocaleString('en-IN')}
                </div>
              </div>

              {/* Complete Description */}
              <div className="p-4 bg-cream-100 dark:bg-maroon-800/60 rounded-2xl border-2 border-maroon-950/15 dark:border-cream-100/15 space-y-1">
                <span className="text-[10px] uppercase font-black tracking-widest text-maroon-700 dark:text-cream-300 block">
                  Cake Description &amp; Flavor Profile
                </span>
                <p className="text-xs sm:text-sm text-charcoal dark:text-cream-100 font-medium leading-relaxed">
                  {lightboxCake.description || 'Deliciously handcrafted artisan cake prepared with premium ingredients and exquisite confectionery technique.'}
                </p>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="pt-2 flex flex-col sm:flex-row items-center gap-3">
              <button
                onClick={() => handleOpenOrder(lightboxCake)}
                className="w-full sm:w-auto flex-1 py-3.5 bg-maroon-700 hover:bg-maroon-800 text-cream-100 rounded-xl text-xs font-black uppercase tracking-wider border-2 border-maroon-950 dark:border-cream-100 shadow-neo hover:shadow-neo-lg transition flex items-center justify-center gap-2"
              >
                <ShoppingBag className="w-4 h-4" />
                <span>Order This Cake</span>
              </button>

              <button
                onClick={() => setLightboxCake(null)}
                className="w-full sm:w-auto px-6 py-3.5 bg-cream-200 text-maroon-950 rounded-xl text-xs font-bold border-2 border-maroon-950"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      <PublicFooter />

      {/* Customer Direct Order Modal */}
      <CustomerOrderModal
        isOpen={orderModalOpen}
        onClose={() => setOrderModalOpen(false)}
        selectedProduct={selectedProduct}
        productsList={[]}
      />
    </div>
  );
}
