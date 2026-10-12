import React from 'react';
import Link from 'next/link';
import { Heart, MapPin, Phone, Mail, Clock, Shield, Sparkles, ArrowUpRight } from 'lucide-react';

export function PublicFooter() {
  return (
    <footer className="bg-maroon-950 text-cream-200 border-t-4 border-maroon-900 pt-16 pb-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-8 lg:gap-12">
          
          {/* Brand Bio & Stamp */}
          <div className="md:col-span-4 space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-full bg-cream-100 p-1 border-2 border-cream-200 shadow-neo-cream-sm flex items-center justify-center shrink-0">
                <img src="/logo.png" alt="Bakelicious Logo" className="w-full h-full object-contain" />
              </div>
              <div>
                <span className="text-2xl font-serif font-black text-cream-100 block tracking-tight">Bakelicious</span>
                <span className="text-[10px] uppercase font-bold tracking-[0.2em] text-cream-300 block font-sans">Artisan Cake Atelier</span>
              </div>
            </div>
            
            <p className="text-xs text-cream-300/80 leading-relaxed max-w-sm font-medium">
              Kolkata&apos;s premier boutique atelier crafting luxury celebration tiers, artisanal bento creations, and bespoke wedding showstoppers with pure Belgian cocoa and farm-fresh ingredients.
            </p>

            <div className="pt-2 flex items-center gap-2">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-maroon-900 border border-maroon-700 text-[10px] font-bold text-cream-200">
                <Sparkles className="w-3 h-3 text-amber-300" />
                <span>100% Handcrafted • Baked Daily</span>
              </span>
            </div>
          </div>

          {/* Quick Navigation */}
          <div className="md:col-span-3 space-y-3.5">
            <h4 className="text-xs font-bold uppercase tracking-widest text-cream-100 font-serif border-b border-maroon-800 pb-2 inline-block">
              Navigation
            </h4>
            <ul className="space-y-2 text-xs text-cream-300/80 font-medium">
              <li>
                <Link href="/" className="hover:text-cream-100 transition inline-flex items-center gap-1">
                  <span>Home</span>
                </Link>
              </li>
              <li>
                <Link href="/custom-cakes" className="hover:text-cream-100 transition inline-flex items-center gap-1">
                  <span>Custom Cakes Studio</span>
                  <ArrowUpRight className="w-3 h-3 text-amber-400" />
                </Link>
              </li>
              <li>
                <Link href="/about" className="hover:text-cream-100 transition inline-flex items-center gap-1">
                  <span>About Our Atelier</span>
                </Link>
              </li>
              <li>
                <Link href="/gallery" className="hover:text-cream-100 transition inline-flex items-center gap-1">
                  <span>Celebration Gallery</span>
                </Link>
              </li>
              <li>
                <Link href="/contact" className="hover:text-cream-100 transition inline-flex items-center gap-1">
                  <span>Contact &amp; Tastings</span>
                </Link>
              </li>
              <li>
                <Link href="/menu" className="hover:text-cream-100 transition inline-flex items-center gap-1">
                  <span>Full Menu Catalog</span>
                </Link>
              </li>
            </ul>
          </div>

          {/* Bakery Hours */}
          <div className="md:col-span-2 space-y-3.5">
            <h4 className="text-xs font-bold uppercase tracking-widest text-cream-100 font-serif border-b border-maroon-800 pb-2 inline-block">
              Atelier Hours
            </h4>
            <ul className="space-y-2.5 text-xs text-cream-300/80 font-medium">
              <li className="flex items-start gap-2">
                <Clock className="w-3.5 h-3.5 text-amber-400 shrink-0 mt-0.5" />
                <div>
                  <span className="block font-bold text-cream-200">Mon – Sat</span>
                  <span className="text-[11px]">9:00 AM – 9:00 PM</span>
                </div>
              </li>
              <li className="flex items-start gap-2">
                <Clock className="w-3.5 h-3.5 text-amber-400 shrink-0 mt-0.5" />
                <div>
                  <span className="block font-bold text-cream-200">Sunday</span>
                  <span className="text-[11px]">10:00 AM – 8:00 PM</span>
                </div>
              </li>
              <li className="text-[10px] text-cream-400 italic pt-1">
                Advance orders recommended 24 hrs prior.
              </li>
            </ul>
          </div>

          {/* Contact Details */}
          <div className="md:col-span-3 space-y-3.5">
            <h4 className="text-xs font-bold uppercase tracking-widest text-cream-100 font-serif border-b border-maroon-800 pb-2 inline-block">
              Boutique Location
            </h4>
            <div className="p-4 bg-maroon-900/60 border border-maroon-800 rounded-2xl space-y-2.5 text-xs text-cream-300/90 font-medium">
              <div className="flex items-start gap-2">
                <MapPin className="w-3.5 h-3.5 text-amber-400 shrink-0 mt-0.5" />
                <span>Park Street, Kolkata, West Bengal 700016</span>
              </div>
              <div className="flex items-center gap-2">
                <Phone className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                <a href="tel:+919876543210" className="hover:underline">+91 98765 43210</a>
              </div>
              <div className="flex items-center gap-2">
                <Mail className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                <a href="mailto:orders@bakelicious.com" className="hover:underline">orders@bakelicious.com</a>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom Bar with Admin shortcut */}
        <div className="pt-8 border-t-2 border-maroon-900/80 flex flex-col sm:flex-row items-center justify-between text-xs text-cream-400 gap-4">
          <p>© {new Date().getFullYear()} Bakelicious Artisan Bakery. All rights reserved.</p>
          <div className="flex items-center gap-4">
            <Link
              href="/admin/login"
              className="px-3 py-1.5 bg-maroon-900 hover:bg-maroon-800 border border-maroon-700 text-cream-300 hover:text-cream-100 rounded-xl transition flex items-center gap-1.5 font-bold shadow-2xs"
            >
              <Shield className="w-3.5 h-3.5 text-amber-400" />
              <span>Bakery Owner Portal</span>
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
