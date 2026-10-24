'use client';

import React, { useEffect, useState } from 'react';
import { PublicHeader } from '@/components/layout/PublicHeader';
import { PublicFooter } from '@/components/layout/PublicFooter';
import { CustomerOrderModal } from '@/components/orders/CustomerOrderModal';
import { api, getImageUrl } from '@/lib/api';
import { Product, Category } from '@/types';
import { Sparkles, Eye, ShoppingBag, X, Search, ArrowRight, Tag, Heart } from 'lucide-react';

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
    category: { name: 'Artisan Florals' },
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

export default function CakeShowcasePage() {
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

      // Filter for public and available products
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
    if (activeCategory !== 'All') {
      const cakeCat = typeof cake.category === 'object' ? cake.category?.name : cake.category;
      if (cakeCat !== activeCategory) {
        return false;
      }
    }

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
              Artisan Cake Showcase
            </h1>

            <p className="text-xs sm:text-sm text-charcoal-muted dark:text-cream-300 font-medium leading-relaxed">
              Explore freshly crafted cakes with their pricing, imagery, and flavor descriptions. Click any cake to view in full detail or place an order.
            </p>
          </div>

          {/* Search & Filter Controls */}
          <div className="bg-cream-50 dark:bg-maroon-900 p-3.5 sm:p-5 rounded-2xl sm:rounded-3xl border-2 border-maroon-950/20 dark:border-cream-100/20 shadow-neo-sm flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3 sm:gap-4">
            
            {/* Search Input */}
            <div className="relative w-full md:w-80">
              <Search className="w-4 h-4 text-charcoal-muted dark:text-cream-400 absolute left-3.5 top-3" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search cakes by name or description..."
                className="w-full pl-10 pr-4 py-2.5 bg-cream-100 dark:bg-maroon-950 border-2 border-maroon-950/20 dark:border-cream-100/20 rounded-xl sm:rounded-2xl text-xs font-medium text-maroon-950 dark:text-cream-100 placeholder:text-charcoal-muted outline-none focus:border-maroon-950 transition"
              />
            </div>

            {/* Category Filter Pills */}
            <div className="flex items-center gap-2 overflow-x-auto w-full md:w-auto pb-1.5 md:pb-0 scrollbar-none touch-pan-x">
              {categories.map((cat) => (
                <button
                  key={cat}
                  onClick={() => setActiveCategory(cat)}
                  className={`px-3.5 py-1.5 sm:px-4 sm:py-2 rounded-xl text-xs font-serif font-bold transition shrink-0 border-2 ${
                    activeCategory === cat
                      ? 'bg-maroon-700 text-cream-100 border-maroon-950 shadow-neo-sm'
                      : 'bg-cream-100 dark:bg-maroon-950 text-maroon-950 dark:text-cream-100 border-maroon-950/20 hover:border-maroon-950'
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>

          </div>

          {/* Showcase Visual Card Grid */}
          {loading ? (
            <div className="p-16 text-center text-charcoal-muted dark:text-cream-300 font-bold font-serif animate-pulse">
              Loading Cake Showcase...
            </div>
          ) : filteredCakes.length === 0 ? (
            <div className="p-16 text-center bg-cream-50 dark:bg-maroon-900 rounded-3xl border-2 border-maroon-950/20 space-y-3">
              <p className="text-sm font-bold text-charcoal-muted dark:text-cream-300 font-serif">
                No cakes found matching &ldquo;{search}&rdquo;.
              </p>
              <button
                onClick={() => { setSearch(''); setActiveCategory('All'); }}
                className="px-4 py-2 bg-maroon-700 text-cream-100 rounded-xl text-xs font-bold shadow-neo-sm"
              >
                Reset Filters
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8">
              {filteredCakes.map((cake) => {
                const categoryName = typeof cake.category === 'object' ? cake.category?.name : cake.category;
                const formattedPrice = `₹${Number(cake.price || 0).toLocaleString()}`;

                return (
                  <div
                    key={cake.id}
                    className="card-alive rounded-3xl bg-cream-50 dark:bg-maroon-900 border-2 border-maroon-950 dark:border-cream-100/30 shadow-neo-sm hover:shadow-neo transition-all duration-300 overflow-hidden flex flex-col justify-between group"
                  >
                    {/* Image Area with Zoom & Hover Actions */}
                    <div
                      className="relative aspect-[4/3] overflow-hidden bg-cream-200 dark:bg-maroon-950 cursor-pointer"
                      onClick={() => setLightboxCake(cake)}
                    >
                      <img
                        src={getImageUrl(cake.image_url)}
                        alt={cake.name}
                        className="w-full h-full object-cover group-hover:scale-108 transition-transform duration-700 ease-[cubic-bezier(0.16,1,0.3,1)]"
                        loading="lazy"
                      />

                      {/* Top Badges */}
                      <div className="absolute top-3 left-3 right-3 flex items-center justify-between gap-2 pointer-events-none">
                        <span className="px-3 py-1 rounded-full bg-cream-100/90 dark:bg-maroon-950/90 text-maroon-950 dark:text-cream-100 text-[10px] font-black uppercase tracking-wider backdrop-blur-xs border border-maroon-950/20 shadow-xs">
                          {categoryName || 'Signature Cake'}
                        </span>
                        
                        <div className="w-8 h-8 rounded-full bg-cream-100/90 dark:bg-maroon-950/90 border border-maroon-950/20 shadow-xs flex items-center justify-center text-maroon-950 dark:text-cream-100 group-hover:scale-110 transition-transform">
                          <Eye className="w-4 h-4" />
                        </div>
                      </div>

                      {/* Price Tag Anchored to Bottom Right */}
                      <div className="absolute bottom-3 right-3 px-3.5 py-1.5 rounded-xl bg-maroon-700 text-cream-100 font-serif font-black text-sm sm:text-base border-2 border-maroon-950 dark:border-cream-100 shadow-neo-sm">
                        {formattedPrice}
                      </div>
                    </div>

                    {/* Content Section: Name & Description */}
                    <div className="p-5 sm:p-6 space-y-4 flex-1 flex flex-col justify-between">
                      <div className="space-y-2">
                        <h3 className="font-serif font-black text-lg sm:text-xl text-maroon-950 dark:text-cream-100 leading-snug group-hover:text-maroon-700 dark:group-hover:text-amber-300 transition-colors">
                          {cake.name}
                        </h3>

                        <p className="text-xs sm:text-sm text-charcoal-muted dark:text-cream-200/90 leading-relaxed font-medium line-clamp-3">
                          {cake.description || 'Handcrafted signature cake baked with finest Belgian cocoa and farm-fresh ingredients.'}
                        </p>
                      </div>

                      {/* Footer Actions */}
                      <div className="pt-4 border-t-2 border-maroon-950/10 dark:border-cream-100/10 flex items-center gap-3">
                        <button
                          onClick={() => setLightboxCake(cake)}
                          className="flex-1 py-2.5 px-4 bg-cream-100 dark:bg-maroon-800 hover:bg-cream-200 dark:hover:bg-maroon-700 text-maroon-950 dark:text-cream-100 text-xs font-bold rounded-xl border border-maroon-950/20 transition flex items-center justify-center gap-1.5"
                        >
                          <Eye className="w-3.5 h-3.5" />
                          <span>View Details</span>
                        </button>

                        <button
                          onClick={() => handleOpenOrder(cake)}
                          className="flex-1 py-2.5 px-4 bg-maroon-700 hover:bg-maroon-800 text-cream-100 text-xs font-black uppercase tracking-wider rounded-xl border-2 border-maroon-950 dark:border-cream-100 shadow-neo-sm hover:shadow-neo transition-all flex items-center justify-center gap-1.5"
                        >
                          <span>Order Now</span>
                          <ArrowRight className="w-3.5 h-3.5" />
                        </button>
                      </div>

                    </div>

                  </div>
                );
              })}
            </div>
          )}

        </div>
      </main>

      {/* ================= LIGHTBOX MODAL ================= */}
      {lightboxCake && (
        <div
          className="fixed inset-0 z-50 bg-maroon-950/80 backdrop-blur-md flex items-center justify-center p-4 sm:p-6 animate-fade-in"
          onClick={() => setLightboxCake(null)}
        >
          <div
            className="w-full max-w-2xl bg-cream-50 dark:bg-maroon-900 rounded-3xl border-3 border-maroon-950 dark:border-cream-100 shadow-2xl overflow-hidden animate-scale-up"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Full Photo */}
            <div className="relative aspect-video sm:aspect-[16/10] bg-cream-200 dark:bg-maroon-950 overflow-hidden">
              <img
                src={getImageUrl(lightboxCake.image_url)}
                alt={lightboxCake.name}
                className="w-full h-full object-cover"
              />

              <button
                onClick={() => setLightboxCake(null)}
                className="absolute top-4 right-4 w-9 h-9 rounded-full bg-cream-100/90 dark:bg-maroon-900/90 text-maroon-950 dark:text-cream-100 flex items-center justify-center border-2 border-maroon-950 shadow-md hover:scale-110 transition"
              >
                <X className="w-5 h-5" />
              </button>

              <div className="absolute bottom-4 left-4 right-4 flex items-center justify-between pointer-events-none">
                <span className="px-3.5 py-1.5 rounded-full bg-cream-100/95 dark:bg-maroon-950/95 text-maroon-950 dark:text-cream-100 text-xs font-black uppercase tracking-wider border border-maroon-950/20 shadow-sm">
                  {typeof lightboxCake.category === 'object' ? lightboxCake.category?.name : lightboxCake.category || 'Specialty'}
                </span>

                <span className="px-4 py-2 rounded-2xl bg-maroon-700 text-cream-100 font-serif font-black text-lg border-2 border-maroon-950 dark:border-cream-100 shadow-neo-sm">
                  ₹{Number(lightboxCake.price || 0).toLocaleString()}
                </span>
              </div>
            </div>

            {/* Description & Action */}
            <div className="p-6 sm:p-8 space-y-6">
              <div className="space-y-2">
                <h2 className="text-2xl sm:text-3xl font-black font-serif text-maroon-950 dark:text-cream-100">
                  {lightboxCake.name}
                </h2>
                <p className="text-sm text-charcoal dark:text-cream-200 leading-relaxed font-medium">
                  {lightboxCake.description || 'Prepared fresh on the celebration day with 100% pure dairy and premium ingredients.'}
                </p>
              </div>

              <div className="pt-4 border-t-2 border-maroon-950/15 dark:border-cream-100/15 flex flex-col sm:flex-row items-center justify-between gap-4">
                <div className="flex items-center gap-2 text-xs text-charcoal-muted dark:text-cream-300 font-bold">
                  <Sparkles className="w-4 h-4 text-amber-500" />
                  <span>Custom sizes and eggless options available</span>
                </div>

                <button
                  onClick={() => handleOpenOrder(lightboxCake)}
                  className="w-full sm:w-auto px-8 py-3.5 bg-maroon-700 hover:bg-maroon-800 text-cream-100 font-black text-xs uppercase tracking-wider rounded-2xl border-2 border-maroon-950 dark:border-cream-100 shadow-neo btn-tactile flex items-center justify-center gap-2"
                >
                  <ShoppingBag className="w-4 h-4" />
                  <span>Order This Cake</span>
                </button>
              </div>
            </div>

          </div>
        </div>
      )}

      {/* Customer Direct Order Modal */}
      <CustomerOrderModal
        isOpen={orderModalOpen}
        onClose={() => setOrderModalOpen(false)}
        preselectedProduct={selectedProduct}
      />

      <PublicFooter />
    </div>
  );
}
