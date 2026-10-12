'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { PublicHeader } from '@/components/layout/PublicHeader';
import { PublicFooter } from '@/components/layout/PublicFooter';
import { CustomerOrderModal } from '@/components/orders/CustomerOrderModal';
import { api, getImageUrl } from '@/lib/api';
import { Product, Feedback as FeedbackType } from '@/types';
import {
  ArrowRight,
  Sparkles,
  Heart,
  Star,
  ShoppingBag,
  Shield,
  CheckCircle2,
  Phone,
  Clock,
  Cake,
  Gift,
  Award,
  Truck
} from 'lucide-react';

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
      setFeaturedProducts(prodRes.data.slice(0, 8));
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

  // Fallback signature items if database is freshly seeded
  const fallbackProducts = [
    {
      id: 901,
      name: 'Chocolate Indulgence',
      price: 1200,
      description: 'Layers of rich dark chocolate sponge smothered in silky Belgian ganache and chocolate curls.',
      image_url: '/images/cakes/chocolate-delight.jpg',
      category: { name: 'Signature Cakes' }
    },
    {
      id: 902,
      name: 'Vanilla Rose Dream',
      price: 1100,
      description: 'Airy vanilla chiffon layered with organic rosewater cream and fresh seasonal berry compote.',
      image_url: '/images/cakes/vanilla-celebration.jpg',
      category: { name: 'Artisan Tiers' }
    },
    {
      id: 903,
      name: 'Red Velvet Delight',
      price: 1300,
      description: 'Classic velvety crimson cocoa cake with smooth Philadelphia cream cheese frosting.',
      image_url: '/images/cakes/red-velvet.jpg',
      category: { name: 'Classic Cakes' }
    },
    {
      id: 904,
      name: 'Belgian Chocolate Truffle',
      price: 1400,
      description: 'Decadent pure 54% Callebaut chocolate mousse with crisp hazelnut praline core.',
      image_url: '/images/cakes/belgian-chocolate.jpg',
      category: { name: 'Gourmet Treats' }
    }
  ];

  const displayedProducts = featuredProducts.length > 0 ? featuredProducts : fallbackProducts;

  // Categories matching user's exact reference screenshot
  const categories = [
    {
      title: 'Birthday Cakes',
      subtitle: 'Make Birthdays Special',
      icon: '🎂',
      href: '/menu?category=Birthday'
    },
    {
      title: 'Anniversary Cakes',
      subtitle: 'Celebrate Your Love',
      icon: '💖',
      href: '/menu?category=Anniversary'
    },
    {
      title: 'Cupcakes',
      subtitle: 'Small Bites, Big Joy',
      icon: '🧁',
      href: '/menu?category=Cupcakes'
    },
    {
      title: 'Cookies',
      subtitle: 'Freshly Baked Treats',
      icon: '🍪',
      href: '/menu?category=Cookies'
    },
    {
      title: 'Custom Cakes',
      subtitle: 'Your Dream, Our Passion',
      icon: '✨',
      href: '/custom-cakes'
    }
  ];

  return (
    <div className="min-h-screen bg-cream-100 dark:bg-maroon-950 text-charcoal dark:text-cream-100 flex flex-col font-sans selection:bg-maroon-700 selection:text-cream-100">
      <PublicHeader />

      <main className="flex-1">
        {/* ================= HERO SECTION (NEO-BRUTALIST EDITORIAL) ================= */}
        <section className="relative overflow-hidden bg-cream-100 dark:bg-maroon-950 pt-10 pb-16 lg:pt-16 lg:pb-24 border-b-2 border-maroon-950/20 dark:border-maroon-800">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-14 items-center">

              {/* LEFT SIDE: Editorial Typography & Bold Actions */}
              <div className="lg:col-span-7 space-y-6 text-center lg:text-left">
                
                {/* Eyebrow Pill */}
                <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-cream-50 dark:bg-maroon-900 border-2 border-maroon-950 dark:border-cream-100 text-maroon-950 dark:text-cream-100 text-[11px] font-black uppercase tracking-widest shadow-neo-sm">
                  <Sparkles className="w-3.5 h-3.5 text-amber-500 fill-amber-500 animate-pulse" />
                  <span>Welcome to Bakelicious • Estd 2023</span>
                </div>

                {/* Main Headline */}
                <div className="space-y-2">
                  <h1 className="text-4xl sm:text-5xl lg:text-6xl font-black text-maroon-950 dark:text-cream-100 font-serif leading-[1.12] tracking-tight">
                    Custom Cakes for Every <br />
                    <span className="italic font-normal text-maroon-700 dark:text-amber-300">Special Moment</span> ♡
                  </h1>
                </div>

                {/* Description */}
                <p className="text-sm sm:text-base text-charcoal-muted dark:text-cream-200/90 max-w-xl mx-auto lg:mx-0 font-medium leading-relaxed">
                  From birthdays to milestones, we bake your sweetest memories with pure Belgian cocoa, farm-fresh ingredients, and bespoke artisan craftsmanship.
                </p>

                {/* Action Buttons */}
                <div className="flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-4 pt-3">
                  <Link
                    href="/custom-cakes"
                    className="w-full sm:w-auto px-8 py-4 bg-maroon-700 hover:bg-maroon-800 text-cream-100 rounded-2xl text-xs sm:text-sm font-black uppercase tracking-wider border-2 border-maroon-950 dark:border-cream-100 shadow-neo hover:shadow-neo-lg hover:-translate-x-0.5 hover:-translate-y-0.5 active:translate-x-0 active:translate-y-0 active:shadow-neo-sm transition-all flex items-center justify-center gap-2.5"
                  >
                    <span>Order Now</span>
                    <ArrowRight className="w-4 h-4" />
                  </Link>

                  <Link
                    href="/menu"
                    className="w-full sm:w-auto px-8 py-4 bg-cream-50 dark:bg-maroon-900 hover:bg-cream-200 dark:hover:bg-maroon-800 text-maroon-950 dark:text-cream-100 rounded-2xl text-xs sm:text-sm font-black uppercase tracking-wider border-2 border-maroon-950 dark:border-cream-100 shadow-neo hover:shadow-neo-lg hover:-translate-x-0.5 hover:-translate-y-0.5 active:translate-x-0 active:translate-y-0 active:shadow-neo-sm transition-all flex items-center justify-center gap-2"
                  >
                    <span>Explore Our Menu</span>
                  </Link>
                </div>

                {/* Three Trust Markers */}
                <div className="pt-6 grid grid-cols-3 gap-3 border-t-2 border-maroon-950/15 dark:border-maroon-800/60 text-center lg:text-left max-w-lg mx-auto lg:mx-0">
                  <div className="p-2">
                    <span className="block text-base sm:text-lg font-black text-maroon-950 dark:text-cream-100 font-serif">100% Fresh</span>
                    <span className="text-[10px] text-charcoal-muted dark:text-cream-300 font-bold uppercase tracking-wider">Baked Daily</span>
                  </div>
                  <div className="p-2 border-x-2 border-maroon-950/15 dark:border-maroon-800/60">
                    <span className="block text-base sm:text-lg font-black text-maroon-950 dark:text-cream-100 font-serif">Belgian Cocoa</span>
                    <span className="text-[10px] text-charcoal-muted dark:text-cream-300 font-bold uppercase tracking-wider">Callebaut 54%</span>
                  </div>
                  <div className="p-2">
                    <span className="block text-base sm:text-lg font-black text-maroon-950 dark:text-cream-100 font-serif">Custom Atelier</span>
                    <span className="text-[10px] text-charcoal-muted dark:text-cream-300 font-bold uppercase tracking-wider">Bespoke Tiers</span>
                  </div>
                </div>

              </div>

              {/* RIGHT SIDE: Framed Cake Art (Strictly contained; Neo-Brutalist offset frame) */}
              <div className="lg:col-span-5 relative flex justify-center items-center">
                
                {/* Background Shadow Block Accent */}
                <div className="w-full max-w-md relative">
                  
                  {/* Decorative Hand-lettered Stamp */}
                  <div className="absolute -top-4 -right-3 sm:-right-4 z-20 px-3.5 py-2 rounded-2xl bg-cream-50 dark:bg-maroon-900 border-2 border-maroon-950 dark:border-cream-100 shadow-neo-sm rotate-6 flex items-center gap-1.5 text-xs font-serif font-black text-maroon-950 dark:text-cream-100">
                    <span>Life is Sweeter with Cake ♡</span>
                  </div>

                  {/* Main Cake Photography Container */}
                  <div className="w-full aspect-square rounded-3xl overflow-hidden border-2 border-maroon-950 dark:border-cream-100 bg-cream-50 dark:bg-maroon-900 shadow-neo-lg relative group">
                    <img
                      src="/images/cakes/wedding-hero.jpg"
                      alt="Bakelicious Signature Artisan Cake"
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
                    />
                    
                    {/* Bottom Editorial Caption */}
                    <div className="absolute bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-maroon-950/90 via-maroon-950/50 to-transparent text-cream-100">
                      <span className="text-[10px] uppercase font-bold tracking-[0.2em] text-cream-300 block font-sans">
                        Artisan Signature Tier
                      </span>
                      <span className="text-base font-serif font-bold block">
                        Raspberry Buttercream &amp; Rose Petals
                      </span>
                    </div>
                  </div>

                  {/* Offset Badge */}
                  <div className="absolute -bottom-4 -left-3 sm:-left-4 z-20 px-4 py-2.5 rounded-2xl bg-maroon-700 text-cream-100 border-2 border-maroon-950 dark:border-cream-100 shadow-neo-sm -rotate-3 flex items-center gap-2">
                    <Heart className="w-4 h-4 fill-cream-100 text-cream-100 shrink-0" />
                    <div>
                      <span className="text-[9px] uppercase font-bold tracking-widest block text-cream-300 font-sans">Handcrafted</span>
                      <span className="text-xs font-serif font-bold block">Made with Love</span>
                    </div>
                  </div>

                </div>
              </div>

            </div>
          </div>
        </section>

        {/* ================= CATEGORIES SECTION (MATCHING SCREENSHOT) ================= */}
        <section className="py-14 bg-cream-50 dark:bg-maroon-900/60 border-b-2 border-maroon-950/20 dark:border-maroon-800">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
            
            <div className="text-center max-w-xl mx-auto space-y-1">
              <span className="text-[11px] font-black uppercase tracking-[0.2em] text-maroon-700 dark:text-cream-300 font-sans block">
                Artisan Collections
              </span>
              <h2 className="text-2xl sm:text-3xl font-black text-maroon-950 dark:text-cream-100 font-serif">
                Explore Bakery Categories
              </h2>
            </div>

            {/* 5-Card Grid matching exact categories in screenshot */}
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4 sm:gap-6">
              {categories.map((cat) => (
                <Link
                  key={cat.title}
                  href={cat.href}
                  className="group bg-cream-100 dark:bg-maroon-900 rounded-2xl p-5 border-2 border-maroon-950/20 dark:border-cream-100/20 hover:border-maroon-950 dark:hover:border-cream-100 shadow-neo-sm hover:shadow-neo hover:-translate-y-1 transition-all text-center flex flex-col items-center justify-between space-y-3"
                >
                  <div className="w-14 h-14 rounded-full bg-cream-50 dark:bg-maroon-800 border-2 border-maroon-950/20 dark:border-cream-200/20 flex items-center justify-center text-2xl shadow-xs group-hover:scale-110 transition-transform">
                    {cat.icon}
                  </div>
                  <div>
                    <h3 className="font-serif font-black text-maroon-950 dark:text-cream-100 text-sm sm:text-base group-hover:text-maroon-700 dark:group-hover:text-amber-300 transition-colors">
                      {cat.title}
                    </h3>
                    <p className="text-[11px] text-charcoal-muted dark:text-cream-300/80 font-medium mt-0.5">
                      {cat.subtitle}
                    </p>
                  </div>
                </Link>
              ))}
            </div>

          </div>
        </section>

        {/* ================= FEATURED PRODUCT CARDS (NEO-BRUTALIST EDITORIAL) ================= */}
        <section className="py-16 lg:py-20 bg-cream-100 dark:bg-maroon-950 border-b-2 border-maroon-950/20 dark:border-maroon-800">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12">
            
            <div className="flex flex-col sm:flex-row items-start sm:items-end justify-between gap-4 border-b-2 border-maroon-950/15 dark:border-maroon-800 pb-5">
              <div>
                <span className="text-[11px] font-black uppercase tracking-[0.2em] text-maroon-700 dark:text-cream-300 font-sans block">
                  Freshly Baked Creations
                </span>
                <h2 className="text-3xl sm:text-4xl font-black text-maroon-950 dark:text-cream-100 font-serif">
                  Signature Cakes
                </h2>
              </div>

              <Link
                href="/menu"
                className="px-4 py-2 bg-cream-50 dark:bg-maroon-900 text-maroon-950 dark:text-cream-100 text-xs font-black uppercase tracking-wider rounded-xl border-2 border-maroon-950 dark:border-cream-100 shadow-neo-sm hover:shadow-neo hover:-translate-x-0.5 hover:-translate-y-0.5 transition-all flex items-center gap-1.5"
              >
                <span>View Full Menu</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>

            {/* Product Cards Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {displayedProducts.map((prod) => (
                <div
                  key={prod.id}
                  className="bg-cream-50 dark:bg-maroon-900 rounded-3xl border-2 border-maroon-950/20 dark:border-cream-100/20 hover:border-maroon-950 dark:hover:border-cream-100 p-4 sm:p-5 flex flex-col justify-between shadow-neo-sm hover:shadow-neo hover:-translate-y-1 transition-all space-y-4 group"
                >
                  <div className="space-y-3">
                    {/* Cake Image Container */}
                    <div className="aspect-square rounded-2xl overflow-hidden border-2 border-maroon-950/15 dark:border-cream-100/20 bg-cream-200 dark:bg-maroon-800 relative">
                      <img
                        src={getImageUrl(prod.image_url)}
                        alt={prod.name}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                      />
                      <span className="absolute top-2.5 right-2.5 px-3 py-1 bg-maroon-950 text-cream-100 border border-cream-200 text-xs font-black rounded-xl shadow-xs">
                        ₹{prod.price}
                      </span>
                    </div>

                    {/* Cake Title & Details */}
                    <div>
                      <span className="text-[10px] uppercase font-bold text-maroon-700 dark:text-cream-300 tracking-wider">
                        {prod.category?.name || 'Gourmet Selection'}
                      </span>
                      <h3 className="font-serif font-black text-maroon-950 dark:text-cream-100 text-base mt-0.5 group-hover:text-maroon-700 dark:group-hover:text-amber-300 transition-colors">
                        {prod.name}
                      </h3>
                      <p className="text-xs text-charcoal-muted dark:text-cream-300/80 line-clamp-2 mt-1 font-medium leading-relaxed">
                        {prod.description}
                      </p>
                    </div>
                  </div>

                  {/* Order Button */}
                  <button
                    onClick={() => handleOpenEnquiry(prod)}
                    className="w-full py-3 bg-maroon-700 hover:bg-maroon-800 text-cream-100 text-xs font-black uppercase tracking-wider rounded-xl border-2 border-maroon-950 dark:border-cream-100 shadow-neo-sm hover:shadow-neo hover:-translate-x-0.5 hover:-translate-y-0.5 active:translate-x-0 active:translate-y-0 active:shadow-xs transition-all flex items-center justify-center gap-2"
                  >
                    <span>Order Now</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}
            </div>

          </div>
        </section>

        {/* ================= WHY CHOOSE US: THE BAKELICIOUS DIFFERENCE ================= */}
        <section className="py-16 bg-maroon-950 text-cream-100 border-b-2 border-maroon-900">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12">
            
            <div className="text-center max-w-2xl mx-auto space-y-2">
              <span className="text-[11px] font-black uppercase tracking-[0.25em] text-cream-300 font-sans block">
                Why Choose Us
              </span>
              <h2 className="text-3xl sm:text-4xl font-black font-serif text-cream-100">
                The Bakelicious Difference
              </h2>
              <p className="text-xs sm:text-sm text-cream-300/80 font-serif italic">
                Let&apos;s Bake with Love ♡
              </p>
            </div>

            {/* 4 Feature Pillars matching screenshot */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              
              <div className="p-6 rounded-2xl border-2 border-maroon-800 bg-maroon-900/60 shadow-neo-dark hover:-translate-y-1 transition-all space-y-3 text-center flex flex-col items-center">
                <div className="w-14 h-14 rounded-full bg-cream-100 text-maroon-950 border-2 border-cream-200 flex items-center justify-center shadow-xs">
                  <Award className="w-6 h-6 text-maroon-800" />
                </div>
                <h3 className="font-serif font-black text-cream-100 text-base">Premium Ingredients</h3>
                <p className="text-xs text-cream-300/80 font-medium leading-relaxed">
                  Imported Belgian cocoa, dairy churned pure butter, Madagascar bourbon vanilla beans.
                </p>
              </div>

              <div className="p-6 rounded-2xl border-2 border-maroon-800 bg-maroon-900/60 shadow-neo-dark hover:-translate-y-1 transition-all space-y-3 text-center flex flex-col items-center">
                <div className="w-14 h-14 rounded-full bg-cream-100 text-maroon-950 border-2 border-cream-200 flex items-center justify-center shadow-xs">
                  <Cake className="w-6 h-6 text-maroon-800" />
                </div>
                <h3 className="font-serif font-black text-cream-100 text-base">Custom Designs</h3>
                <p className="text-xs text-cream-300/80 font-medium leading-relaxed">
                  Your vision, meticulously brought to life by master bakers and sugar florists.
                </p>
              </div>

              <div className="p-6 rounded-2xl border-2 border-maroon-800 bg-maroon-900/60 shadow-neo-dark hover:-translate-y-1 transition-all space-y-3 text-center flex flex-col items-center">
                <div className="w-14 h-14 rounded-full bg-cream-100 text-maroon-950 border-2 border-cream-200 flex items-center justify-center shadow-xs">
                  <Heart className="w-6 h-6 text-maroon-800" />
                </div>
                <h3 className="font-serif font-black text-cream-100 text-base">Freshly Baked</h3>
                <p className="text-xs text-cream-300/80 font-medium leading-relaxed">
                  Every order is mixed, baked, and frosted fresh on the day of delivery.
                </p>
              </div>

              <div className="p-6 rounded-2xl border-2 border-maroon-800 bg-maroon-900/60 shadow-neo-dark hover:-translate-y-1 transition-all space-y-3 text-center flex flex-col items-center">
                <div className="w-14 h-14 rounded-full bg-cream-100 text-maroon-950 border-2 border-cream-200 flex items-center justify-center shadow-xs">
                  <Truck className="w-6 h-6 text-maroon-800" />
                </div>
                <h3 className="font-serif font-black text-cream-100 text-base">On-Time Delivery</h3>
                <p className="text-xs text-cream-300/80 font-medium leading-relaxed">
                  Carefully handled temperature-controlled delivery across all Kolkata locations.
                </p>
              </div>

            </div>

          </div>
        </section>

        {/* ================= TESTIMONIALS SECTION ================= */}
        <section className="py-16 bg-cream-100 dark:bg-maroon-900/40 border-b-2 border-maroon-950/20 dark:border-maroon-800">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-10">
            
            <div className="text-center max-w-xl mx-auto space-y-1">
              <span className="text-[11px] font-black uppercase tracking-[0.2em] text-maroon-700 dark:text-cream-300 font-sans block">
                Customer Love
              </span>
              <h2 className="text-3xl font-black text-maroon-950 dark:text-cream-100 font-serif">
                Words from Sweet Celebrations
              </h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              
              <div className="p-6 rounded-3xl bg-cream-50 dark:bg-maroon-900 border-2 border-maroon-950/20 dark:border-cream-100/20 shadow-neo-sm space-y-4 flex flex-col justify-between">
                <div className="space-y-3">
                  <div className="flex items-center gap-1 text-amber-500">
                    {[...Array(5)].map((_, i) => (
                      <Star key={i} className="w-4 h-4 fill-amber-500" />
                    ))}
                  </div>
                  <p className="text-xs sm:text-sm text-charcoal dark:text-cream-200 font-medium leading-relaxed italic">
                    &quot;Bakelicious created our 3-tier anniversary wedding cake. The rose pink ombre with edible gold leaf was breathtaking and tasted divine!&quot;
                  </p>
                </div>
                <div className="border-t border-maroon-950/10 dark:border-maroon-800 pt-3">
                  <span className="font-serif font-black text-maroon-950 dark:text-cream-100 text-sm block">Ananya Sen</span>
                  <span className="text-[10px] text-charcoal-muted dark:text-cream-300 font-bold uppercase tracking-wider">Salt Lake, Kolkata</span>
                </div>
              </div>

              <div className="p-6 rounded-3xl bg-cream-50 dark:bg-maroon-900 border-2 border-maroon-950/20 dark:border-cream-100/20 shadow-neo-sm space-y-4 flex flex-col justify-between">
                <div className="space-y-3">
                  <div className="flex items-center gap-1 text-amber-500">
                    {[...Array(5)].map((_, i) => (
                      <Star key={i} className="w-4 h-4 fill-amber-500" />
                    ))}
                  </div>
                  <p className="text-xs sm:text-sm text-charcoal dark:text-cream-200 font-medium leading-relaxed italic">
                    &quot;The Belgian Chocolate Truffle cake was ordered for my husband&apos;s birthday. Rich, moist and not overly sweet. Everyone asked where it was from!&quot;
                  </p>
                </div>
                <div className="border-t border-maroon-950/10 dark:border-maroon-800 pt-3">
                  <span className="font-serif font-black text-maroon-950 dark:text-cream-100 text-sm block">Neha Roy</span>
                  <span className="text-[10px] text-charcoal-muted dark:text-cream-300 font-bold uppercase tracking-wider">Ballygunge, Kolkata</span>
                </div>
              </div>

              <div className="p-6 rounded-3xl bg-cream-50 dark:bg-maroon-900 border-2 border-maroon-950/20 dark:border-cream-100/20 shadow-neo-sm space-y-4 flex flex-col justify-between">
                <div className="space-y-3">
                  <div className="flex items-center gap-1 text-amber-500">
                    {[...Array(5)].map((_, i) => (
                      <Star key={i} className="w-4 h-4 fill-amber-500" />
                    ))}
                  </div>
                  <p className="text-xs sm:text-sm text-charcoal dark:text-cream-200 font-medium leading-relaxed italic">
                    &quot;The 4-inch mini bento cake with custom handwritten Korean lettering was adorable and arrived in pristine packaging on time!&quot;
                  </p>
                </div>
                <div className="border-t border-maroon-950/10 dark:border-maroon-800 pt-3">
                  <span className="font-serif font-black text-maroon-950 dark:text-cream-100 text-sm block">Priya Patel</span>
                  <span className="text-[10px] text-charcoal-muted dark:text-cream-300 font-bold uppercase tracking-wider">New Town, Kolkata</span>
                </div>
              </div>

            </div>

          </div>
        </section>

        {/* ================= CUSTOM CAKE BANNER CTA ================= */}
        <section className="py-16 bg-cream-100 dark:bg-maroon-950">
          <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="bg-maroon-950 text-cream-100 rounded-3xl p-8 sm:p-12 border-2 border-maroon-900 shadow-neo-lg relative overflow-hidden flex flex-col md:flex-row items-center justify-between gap-8">
              
              <div className="space-y-3 text-center md:text-left max-w-xl">
                <span className="px-3 py-1 bg-maroon-800 text-cream-200 text-xs font-bold rounded-full inline-block border border-maroon-700">
                  Custom Orders Studio
                </span>
                <h2 className="text-3xl sm:text-4xl font-black font-serif text-cream-100">
                  Have a Dream Cake in Mind?
                </h2>
                <p className="text-xs sm:text-sm text-cream-300/90 leading-relaxed font-medium">
                  Whether it&apos;s a Pinterest reference, tier design, specific theme, or customized flavor combination, our atelier will craft it to perfection.
                </p>
              </div>

              <Link
                href="/custom-cakes"
                className="px-8 py-4 bg-cream-50 hover:bg-cream-100 text-maroon-950 font-black rounded-2xl text-xs sm:text-sm uppercase tracking-wider border-2 border-maroon-950 shadow-neo hover:shadow-neo-lg hover:-translate-x-0.5 hover:-translate-y-0.5 transition-all shrink-0 flex items-center gap-2"
              >
                <Sparkles className="w-4 h-4 text-maroon-700" />
                <span>Design Custom Cake</span>
              </Link>

            </div>
          </div>
        </section>
      </main>

      <PublicFooter />

      {/* Customer Direct Order Modal */}
      <CustomerOrderModal
        isOpen={orderModalOpen}
        onClose={() => setOrderModalOpen(false)}
        selectedProduct={selectedProduct}
        productsList={featuredProducts.length > 0 ? featuredProducts : (displayedProducts as any)}
      />
    </div>
  );
}
