import React from 'react';
import Link from 'next/link';
import { Heart, MapPin, Phone, Mail, Clock, Shield } from 'lucide-react';

export function PublicFooter() {
  return (
    <footer className="bg-maroon-950 text-cream-200 border-t border-maroon-900 pt-16 pb-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          
          {/* Brand Bio */}
          <div className="space-y-4 md:col-span-1">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-cream-100 p-1 flex items-center justify-center">
                <img src="/logo.png" alt="Bakelicious Logo" className="w-full h-full object-contain" />
              </div>
              <span className="text-xl font-serif font-extrabold text-cream-100">Bakelicious</span>
            </div>
            <p className="text-xs text-cream-300/80 leading-relaxed">
              Kolkata&apos;s premier boutique bakery crafting luxury wedding cakes, artisanal bento creations, and bespoke desserts with passion.
            </p>
          </div>

          {/* Quick Navigation */}
          <div className="space-y-3">
            <h4 className="text-xs font-bold uppercase tracking-widest text-cream-100 font-serif">Quick Navigation</h4>
            <ul className="space-y-2 text-xs text-cream-300/80">
              <li><Link href="/" className="hover:text-cream-100 transition">Home</Link></li>
              <li><Link href="/menu" className="hover:text-cream-100 transition">Our Menu Catalog</Link></li>
              <li><Link href="/wedding-cakes" className="hover:text-cream-100 transition">Wedding &amp; Tier Cakes</Link></li>
              <li><Link href="/bento-cakes" className="hover:text-cream-100 transition">Bento Cakes</Link></li>
              <li><Link href="/cake-platters" className="hover:text-cream-100 transition">Cake Platters</Link></li>
              <li><Link href="/feedback" className="hover:text-cream-100 transition">Customer Testimonials</Link></li>
            </ul>
          </div>

          {/* Bakery Hours */}
          <div className="space-y-3">
            <h4 className="text-xs font-bold uppercase tracking-widest text-cream-100 font-serif">Store Hours</h4>
            <ul className="space-y-2 text-xs text-cream-300/80">
              <li className="flex items-center gap-2">
                <Clock className="w-3.5 h-3.5 text-maroon-400 shrink-0" />
                <span>Mon – Sat: 9:00 AM – 9:00 PM</span>
              </li>
              <li className="flex items-center gap-2">
                <Clock className="w-3.5 h-3.5 text-maroon-400 shrink-0" />
                <span>Sunday: 10:00 AM – 8:00 PM</span>
              </li>
              <li className="text-[11px] text-cream-400 italic pt-1">
                Advance custom orders required 24 hours prior.
              </li>
            </ul>
          </div>

          {/* Contact Details */}
          <div className="space-y-3">
            <h4 className="text-xs font-bold uppercase tracking-widest text-cream-100 font-serif">Boutique Contact</h4>
            <ul className="space-y-2.5 text-xs text-cream-300/80">
              <li className="flex items-start gap-2">
                <MapPin className="w-3.5 h-3.5 text-maroon-400 shrink-0 mt-0.5" />
                <span>Park Street, Kolkata, West Bengal 700016</span>
              </li>
              <li className="flex items-center gap-2">
                <Phone className="w-3.5 h-3.5 text-maroon-400 shrink-0" />
                <span>+91 98765 43210</span>
              </li>
              <li className="flex items-center gap-2">
                <Mail className="w-3.5 h-3.5 text-maroon-400 shrink-0" />
                <span>orders@bakelicious.com</span>
              </li>
            </ul>
          </div>
        </div>

        <div className="pt-8 border-t border-maroon-900 flex flex-col sm:flex-row items-center justify-between text-xs text-cream-400 gap-4">
          <p>© {new Date().getFullYear()} Bakelicious Bakery. All rights reserved.</p>
          <div className="flex items-center gap-4">
            <Link href="/admin/login" className="hover:text-cream-100 transition flex items-center gap-1">
              <Shield className="w-3 h-3 text-maroon-400" />
              <span>Admin Login</span>
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
