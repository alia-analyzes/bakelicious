'use client';

import React from 'react';
import Link from 'next/link';
import { PublicHeader } from '@/components/layout/PublicHeader';
import { PublicFooter } from '@/components/layout/PublicFooter';
import { Sparkles, Heart, Award, Cake, ArrowRight, ShieldCheck, Clock, Check } from 'lucide-react';

export default function AboutUsPage() {
  const values = [
    {
      title: 'Pure Belgian Cocoa',
      desc: 'We strictly bake with authentic Callebaut 54% and 70% Belgian chocolate, never vegetable compound.',
      icon: '🍫'
    },
    {
      title: 'Small Batch & Fresh',
      desc: 'No freezing days in advance. Every sponge is hand-whipped and baked on the day of your celebration.',
      icon: '🔥'
    },
    {
      title: 'Artisan Sugar Detailing',
      desc: 'Edible gold leaf, handcrafted sugar florals, and hand-piped Korean buttercream calligraphy.',
      icon: '🎨'
    },
    {
      title: '100% Eggless Mastery',
      desc: 'Our proprietary eggless sponge formulas achieve unbelievable fluffiness, moisture, and depth of flavor.',
      icon: '🌱'
    }
  ];

  return (
    <div className="min-h-screen bg-cream-100 dark:bg-maroon-950 text-charcoal dark:text-cream-100 flex flex-col font-sans selection:bg-maroon-700 selection:text-cream-100">
      <PublicHeader />

      <main className="flex-1 py-12 lg:py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-16 lg:space-y-24">

          {/* Section 1: Editorial Atelier Hero */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-14 items-center">
            
            <div className="lg:col-span-7 space-y-6 text-center lg:text-left">
              <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-cream-50 dark:bg-maroon-900 border-2 border-maroon-950 dark:border-cream-100 text-maroon-950 dark:text-cream-100 text-[11px] font-black uppercase tracking-widest shadow-neo-sm">
                <Sparkles className="w-3.5 h-3.5 text-amber-500 fill-amber-500" />
                <span>Our Heritage &amp; Philosophy</span>
              </div>

              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-black text-maroon-950 dark:text-cream-100 font-serif leading-[1.15]">
                Crafting Sweet Memories, <br />
                <span className="italic font-normal text-maroon-700 dark:text-amber-300">One Cake at a Time</span>.
              </h1>

              <p className="text-sm sm:text-base text-charcoal-muted dark:text-cream-300 font-medium leading-relaxed max-w-xl mx-auto lg:mx-0">
                Founded in 2023 in the cultural heart of Kolkata, Bakelicious was born from a desire to elevate celebration cakes from standard confections into edible works of art.
              </p>

              <div className="pt-2 flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-4">
                <Link
                  href="/custom-cakes"
                  className="px-8 py-4 bg-maroon-700 hover:bg-maroon-800 text-cream-100 rounded-2xl text-xs sm:text-sm font-black uppercase tracking-wider border-2 border-maroon-950 dark:border-cream-100 shadow-neo hover:shadow-neo-lg hover:-translate-x-0.5 hover:-translate-y-0.5 transition-all flex items-center gap-2"
                >
                  <span>Commission a Cake</span>
                  <ArrowRight className="w-4 h-4" />
                </Link>
                <Link
                  href="/gallery"
                  className="px-8 py-4 bg-cream-50 dark:bg-maroon-900 text-maroon-950 dark:text-cream-100 rounded-2xl text-xs sm:text-sm font-black uppercase tracking-wider border-2 border-maroon-950 dark:border-cream-100 shadow-neo hover:shadow-neo-lg hover:-translate-x-0.5 hover:-translate-y-0.5 transition-all"
                >
                  <span>View Our Work</span>
                </Link>
              </div>
            </div>

            {/* Framed Editorial Visual */}
            <div className="lg:col-span-5 relative flex justify-center">
              <div className="w-full max-w-md aspect-[4/5] rounded-3xl overflow-hidden border-2 border-maroon-950 dark:border-cream-100 bg-cream-50 dark:bg-maroon-900 shadow-neo-lg relative group">
                <img
                  src="/images/cakes/wedding-3tier-floral.jpg"
                  alt="Bakelicious Atelier Cake Design"
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-maroon-950/80 via-transparent to-transparent" />
                <div className="absolute bottom-4 left-4 right-4 text-cream-100">
                  <span className="text-[10px] uppercase font-bold tracking-[0.2em] text-cream-300 block font-sans">
                    Artisan Atelier • Kolkata
                  </span>
                  <span className="text-base font-serif font-bold block">
                    Hand-piped Floral Tier with Gold Leaf
                  </span>
                </div>
              </div>
            </div>

          </div>

          {/* Section 2: Four Core Artisan Standards */}
          <div className="space-y-10">
            <div className="text-center max-w-xl mx-auto space-y-2">
              <span className="text-[11px] font-black uppercase tracking-[0.2em] text-maroon-700 dark:text-cream-300 font-sans block">
                The Standard We Keep
              </span>
              <h2 className="text-3xl sm:text-4xl font-black text-maroon-950 dark:text-cream-100 font-serif">
                Uncompromising Quality
              </h2>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {values.map((v) => (
                <div
                  key={v.title}
                  className="p-6 rounded-3xl bg-cream-50 dark:bg-maroon-900 border-2 border-maroon-950/20 dark:border-cream-100/20 shadow-neo-sm hover:shadow-neo hover:-translate-y-1 transition-all space-y-3"
                >
                  <span className="text-3xl block">{v.icon}</span>
                  <h3 className="font-serif font-black text-maroon-950 dark:text-cream-100 text-lg">
                    {v.title}
                  </h3>
                  <p className="text-xs text-charcoal-muted dark:text-cream-300 leading-relaxed font-medium">
                    {v.desc}
                  </p>
                </div>
              ))}
            </div>
          </div>

          {/* Section 3: Story Narrative Section */}
          <div className="bg-cream-50 dark:bg-maroon-900/60 rounded-3xl border-2 border-maroon-950 dark:border-cream-100 p-8 sm:p-14 shadow-neo-lg grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
            
            <div className="lg:col-span-8 space-y-4">
              <span className="text-[11px] font-black uppercase tracking-widest text-maroon-700 dark:text-cream-300 font-sans block">
                From Kitchen to Atelier
              </span>
              <h2 className="text-2xl sm:text-3xl font-black font-serif text-maroon-950 dark:text-cream-100">
                A Sweet Journey Driven by Art &amp; Flavor
              </h2>
              <div className="space-y-3 text-xs sm:text-sm text-charcoal-muted dark:text-cream-200/90 leading-relaxed font-medium">
                <p>
                  Bakelicious started with a single oven and an obsession: to make celebration cakes that taste every bit as good as they look. While mainstream bakeries relied on pre-mixes and artificial whipped toppings, we committed to traditional pastry methods: folding real dairy butter, whipping silky French ganaches, and simmering our own fruit compotes from scratch.
                </p>
                <p>
                  Today, we are trusted by hundreds of families across Kolkata for their most precious milestones: first birthdays, dream weddings, silver anniversaries, and spontaneous weekend dessert cravings.
                </p>
              </div>
            </div>

            <div className="lg:col-span-4 flex flex-col items-center justify-center p-6 bg-cream-100 dark:bg-maroon-950 rounded-2xl border-2 border-maroon-950/20 text-center space-y-3 shadow-neo-sm">
              <span className="text-4xl font-serif font-black text-maroon-950 dark:text-cream-100">500+</span>
              <span className="text-xs font-bold uppercase tracking-wider text-maroon-700 dark:text-cream-300">
                Celebrations Made Sweeter in 2026
              </span>
              <div className="w-12 h-0.5 bg-maroon-950/20 dark:bg-cream-100/20" />
              <p className="text-[11px] text-charcoal-muted dark:text-cream-400 italic">
                Rated 4.9/5 by dessert lovers across South &amp; North Kolkata.
              </p>
            </div>

          </div>

        </div>
      </main>

      <PublicFooter />
    </div>
  );
}
