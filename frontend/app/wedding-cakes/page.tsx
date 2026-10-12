'use client';

import React, { useEffect, useState } from 'react';
import { PublicHeader } from '@/components/layout/PublicHeader';
import { PublicFooter } from '@/components/layout/PublicFooter';
import { Modal } from '@/components/ui/Modal';
import { api, getImageUrl } from '@/lib/api';
import { Product } from '@/types';
import { showToast } from '@/lib/toast';
import { Heart, Sparkles, Phone, ArrowRight, CheckCircle2, ShoppingBag } from 'lucide-react';

export default function WeddingCakesPage() {
  const [weddingCakes, setWeddingCakes] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  // Enquiry Modal
  const [enquiryModalOpen, setEnquiryModalOpen] = useState(false);
  const [selectedCake, setSelectedCake] = useState<Product | null>(null);
  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [weddingDate, setWeddingDate] = useState('');
  const [tierDetails, setTierDetails] = useState('');

  useEffect(() => {
    fetchWeddingCakes();
  }, []);

  const fetchWeddingCakes = async () => {
    try {
      setLoading(true);
      const res = await api.get('/products');
      const filtered = res.data.filter((p: Product) => 
        p.category?.name.includes('Wedding') || 
        p.name.includes('Tier') || 
        p.tags?.includes('Wedding')
      );
      setWeddingCakes(filtered.length > 0 ? filtered : [
        {
          id: 601,
          name: 'Rose Pink 3-Tier Luxury Wedding Cake',
          price: 5500,
          description: '3-tier handcrafted vanilla raspberry sponge with delicate rose pink buttercream ombre and edible 24k gold leaf.',
          image_url: '/images/cakes/wedding-hero.jpg',
          category: { name: 'Wedding Tiers' }
        },
        {
          id: 602,
          name: 'Floral Cascade Tier Centerpiece',
          price: 4800,
          description: 'Multi-tiered centerpiece adorned with sugar orchids, Belgian white chocolate ganache, and pearl beading.',
          image_url: '/images/cakes/wedding-3tier-floral.jpg',
          category: { name: 'Wedding Tiers' }
        }
      ]);
    } catch (err) {
      console.error('Failed to load wedding cakes:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenEnquiry = (cake?: Product) => {
    setSelectedCake(cake || null);
    setEnquiryModalOpen(true);
  };

  const handleSendEnquiry = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!customerName || !customerPhone) {
      showToast('Please enter your name and phone number', 'error');
      return;
    }

    try {
      await api.post('/orders/public', {
        customer_name: customerName,
        customer_phone: customerPhone,
        delivery_address: 'Kolkata Wedding Venue Delivery',
        delivery_date: weddingDate || new Date().toISOString().split('T')[0],
        special_instructions: `Wedding Cake Inquiry: ${selectedCake?.name || 'Custom Tier'}. Venue/Tier Notes: ${tierDetails || 'None'}`,
        total_amount: selectedCake?.price || 4800,
        items: []
      });
      showToast('Wedding inquiry submitted! Opening WhatsApp...', 'success');
    } catch (err) {
      // Proceed to WhatsApp fallback
    }

    const msg = `Hello Bakelicious Wedding Concierge! I would like to book a consultation for wedding cake: ${selectedCake?.name || 'Custom Tier'}. Name: ${customerName}, Phone: ${customerPhone}, Wedding Date: ${weddingDate}. Tier/Theme Notes: ${tierDetails || 'None'}`;
    const whatsappUrl = `https://wa.me/919876543210?text=${encodeURIComponent(msg)}`;
    window.open(whatsappUrl, '_blank');
    setEnquiryModalOpen(false);
  };

  return (
    <div className="min-h-screen bg-cream-100 dark:bg-maroon-950 text-charcoal dark:text-cream-100 flex flex-col font-sans selection:bg-maroon-700 selection:text-cream-100">
      <PublicHeader />

      <main className="flex-1">
        {/* Wedding Hero Header */}
        <section className="bg-cream-100 dark:bg-maroon-950 py-16 border-b-2 border-maroon-950/20 dark:border-maroon-800">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center space-y-3 max-w-2xl">
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-cream-50 dark:bg-maroon-900 border-2 border-maroon-950 dark:border-cream-100 text-maroon-950 dark:text-cream-100 text-[11px] font-black uppercase tracking-widest shadow-neo-sm">
              <Sparkles className="w-3.5 h-3.5 text-amber-500 fill-amber-500" />
              <span>Bespoke Wedding Cake Atelier</span>
            </div>
            <h1 className="text-3xl sm:text-5xl font-black font-serif text-maroon-950 dark:text-cream-100">
              Luxury Wedding &amp; Tier Cakes
            </h1>
            <p className="text-xs sm:text-sm text-charcoal-muted dark:text-cream-300 font-medium leading-relaxed">
              Grand multi-tiered cakes, floating spacer tiers, handcrafted sugar florals, and custom flavor formulations tailored for your grand reception in Kolkata.
            </p>
          </div>
        </section>

        {/* Wedding Cakes Grid */}
        <section className="py-16 bg-cream-100 dark:bg-maroon-950">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-10">
            {loading ? (
              <div className="py-20 text-center">
                <div className="inline-block animate-spin rounded-full h-8 w-8 border-4 border-maroon-700 border-t-transparent"></div>
                <p className="text-xs text-charcoal-muted mt-2 font-bold">Loading wedding collection...</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
                {weddingCakes.map((cake) => (
                  <div
                    key={cake.id}
                    className="bg-cream-50 dark:bg-maroon-900 rounded-3xl border-2 border-maroon-950/20 dark:border-cream-100/20 hover:border-maroon-950 dark:hover:border-cream-100 p-6 space-y-4 shadow-neo-sm hover:shadow-neo hover:-translate-y-1 transition-all flex flex-col justify-between group"
                  >
                    <div className="space-y-3">
                      <div className="aspect-[4/3] rounded-2xl overflow-hidden border-2 border-maroon-950/15 dark:border-cream-100/20 relative bg-cream-200 dark:bg-maroon-800">
                        <img
                          src={getImageUrl(cake.image_url, '/images/cakes/wedding-hero.jpg')}
                          alt={cake.name}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                        />
                        <span className="absolute top-2.5 right-2.5 px-3 py-1 bg-maroon-950 text-cream-100 border border-cream-200 text-xs font-black rounded-xl shadow-xs">
                          From ₹{cake.price}
                        </span>
                      </div>

                      <div>
                        <span className="text-[10px] uppercase font-bold text-maroon-700 dark:text-cream-300 tracking-wider">
                          Wedding Tier • Custom Portions
                        </span>
                        <h3 className="font-bold text-maroon-950 dark:text-cream-100 text-lg font-serif mt-0.5 group-hover:text-maroon-700 dark:group-hover:text-amber-300 transition-colors">
                          {cake.name}
                        </h3>
                        <p className="text-xs text-charcoal-muted dark:text-cream-300/80 line-clamp-3 mt-1 font-medium leading-relaxed">
                          {cake.description}
                        </p>
                      </div>

                      <div className="p-3 bg-cream-100 dark:bg-maroon-950 rounded-xl border-2 border-maroon-950/15 text-[11px] text-maroon-950 dark:text-cream-200 space-y-1 font-medium">
                        <div className="flex items-center gap-1.5">
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400 shrink-0" />
                          <span>Venue delivery &amp; table setup included</span>
                        </div>
                        <div className="flex items-center gap-1.5">
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400 shrink-0" />
                          <span>Complimentary pre-event tasting box</span>
                        </div>
                      </div>
                    </div>

                    <button
                      onClick={() => handleOpenEnquiry(cake)}
                      className="w-full py-3 bg-maroon-700 hover:bg-maroon-800 text-cream-100 text-xs font-black uppercase tracking-wider rounded-xl border-2 border-maroon-950 dark:border-cream-100 shadow-neo-sm hover:shadow-neo hover:-translate-x-0.5 hover:-translate-y-0.5 active:translate-x-0 active:translate-y-0 transition-all flex items-center justify-center gap-2"
                    >
                      <Sparkles className="w-4 h-4 text-amber-300" />
                      <span>Book Wedding Tasting &amp; Quote</span>
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </section>
      </main>

      <PublicFooter />

      {/* Wedding Consultation Modal */}
      <Modal
        isOpen={enquiryModalOpen}
        onClose={() => setEnquiryModalOpen(false)}
        title={selectedCake ? `Enquiry: ${selectedCake.name}` : 'Bespoke Wedding Cake Consultation'}
        subtitle="Book a tasting session or discuss bespoke tier requirements"
        maxWidth="md"
      >
        <form onSubmit={handleSendEnquiry} className="space-y-4 text-xs font-medium">
          <div>
            <label className="block font-bold text-maroon-950 dark:text-cream-200 mb-1">Your Name *</label>
            <input
              type="text"
              required
              value={customerName}
              onChange={(e) => setCustomerName(e.target.value)}
              placeholder="e.g. Ananya & Arjun"
              className="w-full p-2.5 bg-cream-100 dark:bg-maroon-950 border-2 border-maroon-950/20 dark:border-cream-100/20 rounded-xl outline-none focus:border-maroon-950"
            />
          </div>

          <div>
            <label className="block font-bold text-maroon-950 dark:text-cream-200 mb-1">Phone Number (WhatsApp) *</label>
            <input
              type="tel"
              required
              value={customerPhone}
              onChange={(e) => setCustomerPhone(e.target.value)}
              placeholder="+91 98765 43210"
              className="w-full p-2.5 bg-cream-100 dark:bg-maroon-950 border-2 border-maroon-950/20 dark:border-cream-100/20 rounded-xl outline-none focus:border-maroon-950"
            />
          </div>

          <div>
            <label className="block font-bold text-maroon-950 dark:text-cream-200 mb-1">Wedding / Reception Date</label>
            <input
              type="date"
              value={weddingDate}
              onChange={(e) => setWeddingDate(e.target.value)}
              className="w-full p-2.5 bg-cream-100 dark:bg-maroon-950 border-2 border-maroon-950/20 dark:border-cream-100/20 rounded-xl outline-none"
            />
          </div>

          <div>
            <label className="block font-bold text-maroon-950 dark:text-cream-200 mb-1">Guest Count &amp; Aesthetic Theme</label>
            <textarea
              rows={3}
              value={tierDetails}
              onChange={(e) => setTierDetails(e.target.value)}
              placeholder="e.g. 150 guests, floral pastel theme with edible gold leaf, eggless vanilla & Belgian truffle layers..."
              className="w-full p-2.5 bg-cream-100 dark:bg-maroon-950 border-2 border-maroon-950/20 dark:border-cream-100/20 rounded-xl outline-none focus:border-maroon-950"
            />
          </div>

          <div className="pt-3 border-t-2 border-maroon-950/15 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={() => setEnquiryModalOpen(false)}
              className="px-4 py-2.5 bg-cream-200 dark:bg-maroon-800 text-maroon-950 dark:text-cream-100 font-bold rounded-xl border-2 border-maroon-950/20"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-6 py-2.5 bg-emerald-700 hover:bg-emerald-800 text-white font-black rounded-xl border-2 border-maroon-950 shadow-neo-sm hover:shadow-neo transition flex items-center gap-2"
            >
              <Phone className="w-4 h-4" />
              <span>Connect with Wedding Concierge</span>
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
