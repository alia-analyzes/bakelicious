'use client';

import React, { useState } from 'react';
import { PublicHeader } from '@/components/layout/PublicHeader';
import { PublicFooter } from '@/components/layout/PublicFooter';
import { CustomerOrderModal } from '@/components/orders/CustomerOrderModal';
import { Sparkles, Eye, ShoppingBag, X, Heart, ArrowRight } from 'lucide-react';

export default function GalleryPage() {
  const [activeCategory, setActiveCategory] = useState('All');
  const [lightboxImage, setLightboxImage] = useState<any | null>(null);

  // Direct Online Customer Order Modal
  const [orderModalOpen, setOrderModalOpen] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<any | null>(null);

  const galleryItems = [
    {
      id: 1,
      title: 'Rose Pink 3-Tier Luxury Wedding Cake',
      category: 'Wedding Tiers',
      image: '/images/cakes/wedding-hero.jpg',
      flavor: 'Vanilla Raspberry & Belgian White Chocolate Ganache',
      occasion: 'Grand Reception'
    },
    {
      id: 2,
      title: 'Belgian Dark Truffle Celebration Cake',
      category: 'Chocolate Decadence',
      image: '/images/cakes/belgian-chocolate.jpg',
      flavor: '54% Callebaut Ganache & Hazelnut Praline',
      occasion: 'Milestone Birthday'
    },
    {
      id: 3,
      title: 'Pastel Pink Korean Mini Bento Cake',
      category: 'Bento Mini Cakes',
      image: '/images/cakes/bento-pastel-pink.jpg',
      flavor: 'Strawberry Chiffon with Swiss Buttercream Calligraphy',
      occasion: 'Cute Birthday Gift'
    },
    {
      id: 4,
      title: 'Classic Red Velvet Cream Cheese Tier',
      category: 'Artisan Florals',
      image: '/images/cakes/red-velvet.jpg',
      flavor: 'Crimson Cocoa Sponge & Philadelphia Cream Cheese',
      occasion: 'Anniversary Celebration'
    },
    {
      id: 5,
      title: 'Handcrafted Chocolate Fudge Indulgence',
      category: 'Chocolate Decadence',
      image: '/images/cakes/chocolate-delight.jpg',
      flavor: 'Dutch Processed Cocoa Sponge & Dark Chocolate Drip',
      occasion: 'Chocolate Lovers'
    },
    {
      id: 6,
      title: '3-Tier Floral Cascade Wedding Centerpiece',
      category: 'Wedding Tiers',
      image: '/images/cakes/wedding-3tier-floral.jpg',
      flavor: 'Madagascar Bourbon Vanilla & Rosewater Essence',
      occasion: 'Bridal Shower'
    },
    {
      id: 7,
      title: 'Fresh Seasonal Fruit & White Chocolate Gateau',
      category: 'Artisan Florals',
      image: '/images/cakes/fresh-fruit.jpg',
      flavor: 'Kiwi, Pomegranate, Berries & Vanilla Custard',
      occasion: 'Summer Celebration'
    },
    {
      id: 8,
      title: 'Butterscotch Salted Caramel Crunch',
      category: 'Artisan Florals',
      image: '/images/cakes/butterscotch.jpg',
      flavor: 'Praline Crunch & Rich Caramel Buttercream',
      occasion: 'Birthday Party'
    },
    {
      id: 9,
      title: 'Bento Floating Art Minimalist Cake',
      category: 'Bento Mini Cakes',
      image: '/images/cakes/bento-floating.jpg',
      flavor: 'Light Vanilla Bean & Buttercream Ombre',
      occasion: 'Friendship Celebration'
    }
  ];

  const categories = ['All', 'Wedding Tiers', 'Bento Mini Cakes', 'Chocolate Decadence', 'Artisan Florals'];

  const filteredItems = activeCategory === 'All'
    ? galleryItems
    : galleryItems.filter((it) => it.category === activeCategory);

  const handleOrderThisDesign = (item: any) => {
    setSelectedProduct({
      id: 800 + item.id,
      name: item.title,
      price: 1200,
      description: `${item.flavor} (${item.occasion})`,
      image_url: item.image,
    });
    setLightboxImage(null);
    setOrderModalOpen(true);
  };

  return (
    <div className="min-h-screen bg-cream-100 dark:bg-maroon-950 text-charcoal dark:text-cream-100 flex flex-col font-sans selection:bg-maroon-700 selection:text-cream-100">
      <PublicHeader />

      <main className="flex-1 py-12 lg:py-18">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12">
          
          {/* Header */}
          <div className="text-center max-w-2xl mx-auto space-y-3">
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-cream-50 dark:bg-maroon-900 border-2 border-maroon-950 dark:border-cream-100 text-maroon-950 dark:text-cream-100 text-[11px] font-black uppercase tracking-widest shadow-neo-sm">
              <Sparkles className="w-3.5 h-3.5 text-amber-500 fill-amber-500" />
              <span>Celebration Gallery</span>
            </div>

            <h1 className="text-3xl sm:text-5xl font-black text-maroon-950 dark:text-cream-100 font-serif tracking-tight">
              Artisan Cake Showcase
            </h1>

            <p className="text-xs sm:text-sm text-charcoal-muted dark:text-cream-300 font-medium leading-relaxed">
              Explore our past bespoke commissions handcrafted for weddings, birthdays, and private parties across Kolkata. Click any design to inspect details or order a custom variation.
            </p>
          </div>

          {/* Filter Pills (Neo-Brutalist) */}
          <div className="flex items-center justify-center gap-2 flex-wrap pb-2">
            {categories.map((cat) => (
              <button
                key={cat}
                onClick={() => setActiveCategory(cat)}
                className={`px-3 sm:px-4 py-1.5 sm:py-2 rounded-xl text-xs font-serif font-bold transition border-2 ${
                  activeCategory === cat
                    ? 'bg-maroon-700 text-cream-100 border-maroon-950 dark:border-cream-100 shadow-neo-sm'
                    : 'bg-cream-50 dark:bg-maroon-900 text-maroon-950 dark:text-cream-100 border-maroon-950/20 dark:border-cream-100/20 hover:border-maroon-950 hover:bg-cream-100'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>

          {/* Gallery Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5 sm:gap-8">
            {filteredItems.map((item) => (
              <div
                key={item.id}
                onClick={() => setLightboxImage(item)}
                className="group bg-cream-50 dark:bg-maroon-900 rounded-3xl border-2 border-maroon-950/20 dark:border-cream-100/20 hover:border-maroon-950 dark:hover:border-cream-100 shadow-neo-sm hover:shadow-neo hover:-translate-y-1 transition-all overflow-hidden cursor-pointer flex flex-col justify-between"
              >
                <div className="aspect-[4/3] relative overflow-hidden bg-cream-200 dark:bg-maroon-800">
                  <img
                    src={item.image}
                    alt={item.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  />
                  
                  {/* Category Pill Tag */}
                  <span className="absolute top-3 left-3 px-3 py-1 rounded-full bg-cream-100/95 dark:bg-maroon-950/95 border border-maroon-950/30 text-[10px] font-black uppercase tracking-wider text-maroon-950 dark:text-cream-100 shadow-xs">
                    {item.category}
                  </span>

                  {/* Hover Inspect Icon */}
                  <div className="absolute inset-0 bg-maroon-950/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                    <div className="w-11 h-11 rounded-full bg-cream-100 text-maroon-950 border-2 border-maroon-950 shadow-neo-sm flex items-center justify-center transform scale-90 group-hover:scale-100 transition-transform">
                      <Eye className="w-5 h-5" />
                    </div>
                  </div>
                </div>

                <div className="p-4 sm:p-5 space-y-1.5 border-t-2 border-maroon-950/10 dark:border-maroon-800">
                  <h3 className="font-serif font-black text-base text-maroon-950 dark:text-cream-100 group-hover:text-maroon-700 dark:group-hover:text-amber-300 transition-colors">
                    {item.title}
                  </h3>
                  <p className="text-[11px] text-charcoal-muted dark:text-cream-300 line-clamp-1 font-medium">
                    {item.flavor}
                  </p>
                  <div className="pt-2 flex items-center justify-between text-[11px] font-bold text-maroon-700 dark:text-cream-400">
                    <span>{item.occasion}</span>
                    <span className="group-hover:translate-x-1 transition-transform inline-flex items-center gap-1">
                      Inspect &rarr;
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>

        </div>
      </main>

      {/* Lightbox Modal */}
      {lightboxImage && (
        <div
          className="fixed inset-0 z-50 bg-maroon-950/80 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4"
          onClick={() => setLightboxImage(null)}
        >
          <div
            className="bg-cream-50 dark:bg-maroon-900 rounded-3xl border-2 border-maroon-950 dark:border-cream-100 max-w-2xl w-full p-4 sm:p-8 shadow-neo-xl space-y-4 sm:space-y-5 animate-fadeIn relative max-h-[92dvh] max-h-[92vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              onClick={() => setLightboxImage(null)}
              className="absolute top-4 right-4 p-2 rounded-full border-2 border-maroon-950 bg-cream-100 text-maroon-950 shadow-neo-sm hover:scale-105 transition"
            >
              <X className="w-4 h-4" />
            </button>

            <div className="aspect-[4/3] rounded-2xl overflow-hidden border-2 border-maroon-950 relative">
              <img
                src={lightboxImage.image}
                alt={lightboxImage.title}
                className="w-full h-full object-cover"
              />
            </div>

            <div className="space-y-2">
              <span className="text-[10px] uppercase font-bold tracking-widest text-maroon-700 dark:text-cream-300 block">
                {lightboxImage.category} • {lightboxImage.occasion}
              </span>
              <h2 className="text-2xl font-serif font-black text-maroon-950 dark:text-cream-100">
                {lightboxImage.title}
              </h2>
              <p className="text-xs text-charcoal-muted dark:text-cream-300 font-medium">
                <strong>Flavor Specification:</strong> {lightboxImage.flavor}
              </p>
            </div>

            <div className="pt-2 flex flex-col sm:flex-row items-center gap-3">
              <button
                onClick={() => handleOrderThisDesign(lightboxImage)}
                className="w-full sm:w-auto flex-1 py-3.5 bg-maroon-700 hover:bg-maroon-800 text-cream-100 rounded-xl text-xs font-black uppercase tracking-wider border-2 border-maroon-950 shadow-neo hover:shadow-neo-lg transition flex items-center justify-center gap-2"
              >
                <ShoppingBag className="w-4 h-4" />
                <span>Order Custom Variation of this Cake</span>
              </button>

              <button
                onClick={() => setLightboxImage(null)}
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
