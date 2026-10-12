'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { PublicHeader } from '@/components/layout/PublicHeader';
import { PublicFooter } from '@/components/layout/PublicFooter';
import { CustomerOrderModal } from '@/components/orders/CustomerOrderModal';
import { api, getImageUrl } from '@/lib/api';
import { Product, Feedback as FeedbackType } from '@/types';
import { showToast } from '@/lib/toast';
import { ArrowRight, Sparkles, Heart, Star, ShoppingBag, Shield, CheckCircle2, Phone } from 'lucide-react';

export default function PublicHomepage() {
  const [featuredProducts, setFeaturedProducts] = useState<Product[]>([]);
  const [testimonials, setTestimonials] = useState<FeedbackType[]>([]);
  const [loading, setLoading] = useState(true);

  // Direct Online Customer Order Modal
  const [orderModalOpen, setOrderModalOpen] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);

  useEffect(() => {
    fetchHomeData();
  }, []);

  const fetchHomeData = async () => {
    try {
      setLoading(true);
      const [prodRes, fbRes] = await Promise.all([
        api.get('/products'),
        api.get('/feedback')
      ]);
      setFeaturedProducts(prodRes.data.slice(0, 6));
      setTestimonials(fbRes.data.slice(0, 3));
    } catch (err) {
      console.error('Failed to load homepage data:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenEnquiry = (prod?: Product) => {
    setSelectedProduct(prod || null);
    setOrderModalOpen(true);
  };

  return (
    <div className="min-h-screen bg-cream-200 text-charcoal flex flex-col font-sans">
      <PublicHeader />

      <main className="flex-1">
        {/* ================= HERO SECTION ================= */}
        <section className="relative overflow-hidden bg-cream-100 py-16 lg:py-24 border-b border-cream-300">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">

              {/* LEFT SIDE: Brand Message & CTAs */}
              <div className="lg:col-span-6 space-y-6 text-center lg:text-left">
                <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-cream-200 border border-cream-300 text-maroon-800 text-xs font-bold shadow-sm">
                  <Sparkles className="w-3.5 h-3.5 text-maroon-600 animate-pulse" />
                  <span>Kolkata&apos;s Premier Gourmet Bakery</span>
                </div>

                <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold text-maroon-950 font-serif leading-[1.15] tracking-tight">
                  Where Every Celebration Begins With Cake.
                </h1>

                <p className="text-base sm:text-lg text-charcoal-muted max-w-xl mx-auto lg:mx-0 font-medium leading-relaxed">
                  Handcrafted cakes, thoughtful details, and sweet moments made especially for you.
                </p>

                <div className="flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-4 pt-2">
                  <Link
                    href="/menu"
                    className="w-full sm:w-auto px-8 py-3.5 bg-maroon-700 hover:bg-maroon-800 text-cream-100 rounded-2xl text-sm font-bold transition shadow-lg shadow-maroon-700/25 flex items-center justify-center gap-2"
                  >
                    <span>Explore Our Cakes</span>
                    <ArrowRight className="w-4 h-4" />
                  </Link>

                  <button
                    onClick={() => handleOpenEnquiry()}
                    className="w-full sm:w-auto px-8 py-3.5 bg-cream-200 hover:bg-cream-300 border border-cream-400 text-maroon-900 rounded-2xl text-sm font-bold transition flex items-center justify-center gap-2 shadow-sm"
                  >
                    <Phone className="w-4 h-4 text-maroon-600" />
                    <span>Order / Enquire</span>
                  </button>
                </div>

                {/* Trust Badges */}
                <div className="pt-6 grid grid-cols-3 gap-4 border-t border-cream-300 text-center lg:text-left">
                  <div>
                    <span className="block text-lg font-bold text-maroon-900 font-serif">100% Fresh</span>
                    <span className="text-[11px] text-charcoal-muted font-medium">Baked Fresh Daily</span>
                  </div>
                  <div>
                    <span className="block text-lg font-bold text-maroon-900 font-serif">Belgian Cocoa</span>
                    <span className="text-[11px] text-charcoal-muted font-medium">Imported Ingredients</span>
                  </div>
                  <div>
                    <span className="block text-lg font-bold text-maroon-900 font-serif">Custom Design</span>
                    <span className="text-[11px] text-charcoal-muted font-medium">Tailored for You</span>
                  </div>
                </div>
              </div>

              {/* RIGHT SIDE: Artistic Cake Composition (NO FAKE PRODUCT CARD) */}
              <div className="lg:col-span-6 relative flex justify-center items-center">
                {/* Soft Cream Background Glow */}
                <div className="absolute inset-0 bg-gradient-to-tr from-cream-300/40 via-cream-200/50 to-maroon-100/30 rounded-full filter blur-3xl -z-10" />

                {/* Cake Photography Composition Container */}
                <div className="relative w-full max-w-md lg:max-w-none aspect-square flex items-center justify-center p-4">

                  {/* Main Celebration Wedding Cake Image */}
                  <div className="relative z-10 w-4/5 rounded-3xl overflow-hidden shadow-2xl border-4 border-cream-100 group">
                    <img
                      src="/images/cakes/wedding-hero.jpg"
                      alt="Bakelicious Signature Tier Wedding Cake"
                      className="w-full h-auto object-cover transform group-hover:scale-105 transition-transform duration-700"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-maroon-950/60 via-transparent to-transparent opacity-80" />
                    <div className="absolute bottom-4 left-4 right-4 text-cream-100 p-2">
                      <span className="text-[10px] uppercase font-bold tracking-widest text-cream-300 block font-sans">Handcrafted Signature</span>
                      <span className="text-base font-bold font-serif block">Rose Pink 3-Tier Wedding Cake</span>
                    </div>
                  </div>

                  {/* Floating Bento Cake Image */}
                  <div className="absolute top-2 sm:top-4 left-0 sm:-left-2 z-20 w-32 sm:w-48 rounded-2xl overflow-hidden shadow-xl border-4 border-cream-100 rotate-[-6deg] hover:rotate-0 transition-transform duration-300">
                    <img
                      src="/images/cakes/bento-floating.jpg"
                      alt="Bakelicious Mini Bento Cake"
                      className="w-full h-auto object-cover"
                    />
                    <div className="p-1.5 sm:p-2 bg-cream-100 text-center">
                      <span className="text-[10px] sm:text-[11px] font-bold text-maroon-900 font-serif block">Mini Bento Cake</span>
                    </div>
                  </div>

                  {/* Decorative Subtle Stamp */}
                  <div className="absolute bottom-4 sm:bottom-6 right-0 sm:right-2 z-20 w-20 h-20 sm:w-28 sm:h-28 rounded-full bg-maroon-700 text-cream-100 p-2 sm:p-3 shadow-lg border-2 border-cream-200 flex flex-col items-center justify-center text-center rotate-12">
                    <Heart className="w-4 h-4 sm:w-5 sm:h-5 text-cream-200 fill-cream-200 mb-0.5" />
                    <span className="text-[9px] sm:text-[10px] font-bold tracking-tight uppercase">Made With</span>
                    <span className="text-[10px] sm:text-xs font-serif font-bold">Pure Love</span>
                  </div>

                </div>
              </div>

            </div>
          </div>
        </section>

        {/* ================= CATEGORIES SHOWCASE ================= */}
        <section className="py-16 bg-cream-200">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-10">
            <div className="text-center max-w-2xl mx-auto space-y-2">
              <h2 className="text-3xl font-extrabold text-maroon-950 font-serif">Explore Our Cake Collections</h2>
              <p className="text-xs sm:text-sm text-charcoal-muted font-medium">
                From delicate individual bento cakes to grand multi-tiered wedding showstoppers.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">

              {/* Category 1: Our Menu */}
              <Link href="/menu" className="group bg-cream-100 rounded-3xl p-6 border border-cream-300 shadow-sm hover:shadow-md transition space-y-4">
                <div className="aspect-square rounded-2xl overflow-hidden border border-cream-300 relative">
                  <img src="/images/cakes/chocolate-delight.jpg" alt="Our Menu" className="w-full h-full object-cover group-hover:scale-105 transition duration-500" />
                </div>
                <div>
                  <h3 className="font-bold text-maroon-900 text-lg font-serif group-hover:text-maroon-700 transition">Our Menu Catalog</h3>
                  <p className="text-xs text-charcoal-muted mt-1 font-medium">Browse our full range of gourmet cakes, platters &amp; desserts.</p>
                </div>
              </Link>

              {/* Category 2: Bento Cakes */}
              <Link href="/bento-cakes" className="group bg-cream-100 rounded-3xl p-6 border border-cream-300 shadow-sm hover:shadow-md transition space-y-4">
                <div className="aspect-square rounded-2xl overflow-hidden border border-cream-300 relative">
                  <img src="/images/cakes/bento-pastel-pink.jpg" alt="Bento Cakes" className="w-full h-full object-cover group-hover:scale-105 transition duration-500" />
                </div>
                <div>
                  <h3 className="font-bold text-maroon-900 text-lg font-serif group-hover:text-maroon-700 transition">Bento Cakes</h3>
                  <p className="text-xs text-charcoal-muted mt-1 font-medium">Cute 4-inch mini bento cakes with custom hand-lettered messages.</p>
                </div>
              </Link>

              {/* Category 3: Wedding Cakes */}
              <Link href="/wedding-cakes" className="group bg-cream-100 rounded-3xl p-6 border border-cream-300 shadow-sm hover:shadow-md transition space-y-4">
                <div className="aspect-square rounded-2xl overflow-hidden border border-cream-300 relative">
                  <img src="/images/cakes/wedding-3tier-floral.jpg" alt="Wedding Cakes" className="w-full h-full object-cover group-hover:scale-105 transition duration-500" />
                </div>
                <div>
                  <h3 className="font-bold text-maroon-900 text-lg font-serif group-hover:text-maroon-700 transition">Wedding Cakes</h3>
                  <p className="text-xs text-charcoal-muted mt-1 font-medium">3-Tier cakes, spacer tier designs &amp; floral wedding centerpieces.</p>
                </div>
              </Link>

              {/* Category 4: Customer Feedback */}
              <Link href="/feedback" className="group bg-cream-100 rounded-3xl p-6 border border-cream-300 shadow-sm hover:shadow-md transition space-y-4">
                <div className="aspect-square rounded-2xl opacity-90 overflow-hidden border border-cream-300 relative bg-maroon-900 text-cream-100 p-6 flex flex-col justify-between">
                  <div className="flex items-center gap-1 text-amber-300 text-sm">
                    <Star className="w-4 h-4 fill-amber-300" />
                    <Star className="w-4 h-4 fill-amber-300" />
                    <Star className="w-4 h-4 fill-amber-300" />
                    <Star className="w-4 h-4 fill-amber-300" />
                    <Star className="w-4 h-4 fill-amber-300" />
                  </div>
                  <p className="text-xs italic leading-relaxed text-cream-200">
                    &quot;Bakelicious made our wedding cake dream come true! Absolutely delicious!&quot;
                  </p>
                  <span className="text-[11px] font-bold text-cream-300 block">— Verified Buyers</span>
                </div>
                <div>
                  <h3 className="font-bold text-maroon-900 text-lg font-serif group-hover:text-maroon-700 transition">Customer Love</h3>
                  <p className="text-xs text-charcoal-muted mt-1 font-medium">Read verified customer reviews &amp; WhatsApp feedback screenshots.</p>
                </div>
              </Link>

            </div>
          </div>
        </section>

        {/* ================= FEATURED SIGNATURE CAKES ================= */}
        <section className="py-16 bg-cream-100 border-y border-cream-300">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-10">
            <div className="flex flex-col sm:flex-row items-start sm:items-end justify-between gap-4">
              <div>
                <span className="text-xs uppercase font-bold text-maroon-700 tracking-widest block font-sans">Crafted With Passion</span>
                <h2 className="text-3xl font-extrabold text-maroon-950 font-serif">Featured Bakery Creations</h2>
              </div>
              <Link href="/menu" className="text-xs font-bold text-maroon-800 hover:text-maroon-950 flex items-center gap-1">
                <span>View Full Menu</span>
                <ArrowRight className="w-4 h-4" />
              </Link>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
              {featuredProducts.map((prod) => (
                <div
                  key={prod.id}
                  className="bg-cream-200/80 rounded-3xl border border-cream-300 p-5 space-y-4 hover:shadow-lg transition flex flex-col justify-between"
                >
                  <div className="space-y-3">
                    <div className="aspect-[4/3] rounded-2xl overflow-hidden border border-cream-300 relative bg-cream-100">
                      <img
                        src={getImageUrl(prod.image_url)}
                        alt={prod.name}
                        className="w-full h-full object-cover"
                      />
                      <span className="absolute top-3 right-3 px-3 py-1 bg-maroon-800/90 text-cream-100 text-xs font-bold rounded-full shadow-sm">
                        ₹{prod.price}
                      </span>
                    </div>

                    <div>
                      <span className="text-[10px] uppercase font-bold text-maroon-700 tracking-wider">
                        {prod.category?.name || 'Gourmet Cake'}
                      </span>
                      <h3 className="font-bold text-maroon-950 text-base font-serif mt-0.5">{prod.name}</h3>
                      <p className="text-xs text-charcoal-muted line-clamp-2 mt-1 font-medium leading-relaxed">
                        {prod.description}
                      </p>
                    </div>
                  </div>

                  <button
                    onClick={() => handleOpenEnquiry(prod)}
                    className="w-full py-2.5 bg-cream-100 hover:bg-maroon-700 hover:text-cream-100 text-maroon-900 border border-cream-300 text-xs font-bold rounded-xl transition flex items-center justify-center gap-2 shadow-sm"
                  >
                    <ShoppingBag className="w-4 h-4" />
                    <span>Enquire &amp; Order</span>
                  </button>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ================= CUSTOM CAKE CTA SECTION ================= */}
        <section className="py-16 bg-cream-200">
          <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="bg-maroon-950 text-cream-100 rounded-3xl p-8 sm:p-12 shadow-xl relative overflow-hidden flex flex-col md:flex-row items-center justify-between gap-8 border border-maroon-900">

              <div className="space-y-4 text-center md:text-left max-w-xl">
                <span className="px-3 py-1 bg-maroon-800 text-cream-200 text-xs font-bold rounded-full inline-block">
                  Custom Orders Accepted
                </span>
                <h2 className="text-3xl sm:text-4xl font-extrabold font-serif text-cream-100">
                  Have Something Special In Mind?
                </h2>
                <p className="text-xs sm:text-sm text-cream-300/90 leading-relaxed font-medium">
                  Whether it&apos;s a specific theme, flavor combination, or Pinterest design reference, our master bakers will create it for you.
                </p>
              </div>

              <button
                onClick={() => handleOpenEnquiry()}
                className="px-8 py-4 bg-cream-100 hover:bg-cream-200 text-maroon-950 font-bold rounded-2xl text-xs sm:text-sm transition shadow-lg shrink-0 flex items-center gap-2"
              >
                <Sparkles className="w-4 h-4 text-maroon-700" />
                <span>Create Your Custom Cake</span>
              </button>

            </div>
          </div>
        </section>
      </main>

      <PublicFooter />

      {/* Direct Online Customer Order Modal */}
      <CustomerOrderModal
        isOpen={orderModalOpen}
        onClose={() => setOrderModalOpen(false)}
        selectedProduct={selectedProduct}
        productsList={featuredProducts}
      />
    </div>
  );
}
