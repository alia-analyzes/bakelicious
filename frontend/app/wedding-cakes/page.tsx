'use client';

import React, { useEffect, useState } from 'react';
import { PublicHeader } from '@/components/layout/PublicHeader';
import { PublicFooter } from '@/components/layout/PublicFooter';
import { Modal } from '@/components/ui/Modal';
import { api, getImageUrl } from '@/lib/api';
import { Product } from '@/types';
import { showToast } from '@/lib/toast';
import { Heart, Sparkles, Phone, ArrowRight, CheckCircle2 } from 'lucide-react';

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
      // Filter wedding & tier cakes
      const filtered = res.data.filter((p: Product) => 
        p.category?.name.includes('Wedding') || 
        p.name.includes('Tier') || 
        p.tags?.includes('Wedding')
      );
      setWeddingCakes(filtered);
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
        phone: customerPhone,
        product_id: selectedCake?.id || null,
        delivery_date: weddingDate || null,
        special_instructions: `Wedding Cake Order. Tiers & Details: ${tierDetails || 'None'}`
      });
      showToast('Wedding cake enquiry saved in system!', 'success');
    } catch (err) {
      console.error('Failed to submit wedding enquiry:', err);
    }

    const msg = `Hello Bakelicious! I would like to enquire about a Wedding Cake: ${selectedCake?.name || 'Bespoke Wedding Cake'}. Name: ${customerName}, Phone: ${customerPhone}, Wedding Date: ${weddingDate || 'TBD'}. Details: ${tierDetails || 'None'}`;
    const whatsappUrl = `https://wa.me/919876543210?text=${encodeURIComponent(msg)}`;
    window.open(whatsappUrl, '_blank');
    setEnquiryModalOpen(false);
  };

  return (
    <div className="min-h-screen bg-cream-200 text-charcoal flex flex-col font-sans">
      <PublicHeader />

      <main className="flex-1">
        {/* Wedding Hero Banner */}
        <section className="bg-maroon-950 text-cream-100 py-16 lg:py-24 border-b border-maroon-900 relative overflow-hidden">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center space-y-4 max-w-3xl">
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-maroon-800 text-cream-200 text-xs font-bold shadow-sm">
              <Heart className="w-3.5 h-3.5 fill-cream-200 text-cream-200" />
              <span>Bespoke Kolkata Wedding Confectionery</span>
            </div>
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold font-serif text-cream-100 tracking-tight">
              Bespoke Wedding &amp; Tier Cakes
            </h1>
            <p className="text-xs sm:text-sm text-cream-300/90 leading-relaxed font-medium">
              Handcrafted 3-tier grand centerpieces, acrylic spacer tier designs, floral cascades, and ring stand wedding cakes designed to make your special day unforgettable.
            </p>
            <div className="pt-2">
              <button
                onClick={() => handleOpenEnquiry()}
                className="px-8 py-3.5 bg-cream-100 hover:bg-cream-200 text-maroon-950 rounded-2xl text-xs sm:text-sm font-bold shadow-lg transition inline-flex items-center gap-2"
              >
                <Sparkles className="w-4 h-4 text-maroon-700" />
                <span>Book Wedding Consultation</span>
              </button>
            </div>
          </div>
        </section>

        {/* Wedding Features */}
        <section className="py-12 bg-cream-100 border-b border-cream-300">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 grid grid-cols-1 md:grid-cols-3 gap-6 text-center">
            <div className="p-6 bg-cream-200/60 rounded-3xl border border-cream-300 space-y-2">
              <span className="text-base font-bold text-maroon-900 font-serif block">Handcrafted Sugar Florals</span>
              <p className="text-xs text-charcoal-muted font-medium">Edible sugar orchids, rose petals &amp; 24k gold leaf foil accents.</p>
            </div>
            <div className="p-6 bg-cream-200/60 rounded-3xl border border-cream-300 space-y-2">
              <span className="text-base font-bold text-maroon-900 font-serif block">Acrylic Spacer Tiers</span>
              <p className="text-xs text-charcoal-muted font-medium">Modern floating tier stands &amp; floral ring frame cake structures.</p>
            </div>
            <div className="p-6 bg-cream-200/60 rounded-3xl border border-cream-300 space-y-2">
              <span className="text-base font-bold text-maroon-900 font-serif block">Safe Venue Setup</span>
              <p className="text-xs text-charcoal-muted font-medium">Professional temperature-controlled delivery &amp; venue assembly in Kolkata.</p>
            </div>
          </div>
        </section>

        {/* Wedding Cakes Gallery */}
        <section className="py-16 bg-cream-200">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-10">
            <div className="text-center max-w-xl mx-auto space-y-2">
              <h2 className="text-3xl font-extrabold text-maroon-950 font-serif">Wedding Cake Portfolio</h2>
              <p className="text-xs sm:text-sm text-charcoal-muted font-medium">
                Each wedding cake is customized in weight, tier counts, colors, and flavor combinations.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {weddingCakes.map((cake) => (
                <div
                  key={cake.id}
                  className="bg-cream-100 rounded-3xl border border-cream-300 p-6 space-y-4 shadow-sm hover:shadow-md transition flex flex-col justify-between"
                >
                  <div className="space-y-4">
                    <div className="aspect-[4/3] rounded-2xl overflow-hidden border border-cream-300 relative bg-cream-200">
                      <img
                        src={getImageUrl(cake.image_url, '/images/cakes/wedding-hero.jpg')}
                        alt={cake.name}
                        className="w-full h-full object-cover"
                      />
                      <span className="absolute top-3 right-3 px-3.5 py-1 bg-maroon-800 text-cream-100 text-xs font-bold rounded-full shadow-sm">
                        ₹{cake.price}
                      </span>
                    </div>

                    <div>
                      <span className="text-[10px] uppercase font-bold text-maroon-700 tracking-wider">
                        {cake.size || 'Multi-Tier'}
                      </span>
                      <h3 className="font-bold text-maroon-950 text-lg font-serif mt-0.5">{cake.name}</h3>
                      <p className="text-xs text-charcoal-muted mt-1.5 leading-relaxed font-medium">
                        {cake.description}
                      </p>
                    </div>

                    <ul className="space-y-1.5 text-xs text-charcoal-muted pt-2 border-t border-cream-300 font-medium">
                      <li className="flex items-center gap-2">
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-800" />
                        <span>Custom Sugar Flowers &amp; Color Scheme</span>
                      </li>
                      <li className="flex items-center gap-2">
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-800" />
                        <span>Flavours: Belgian Chocolate, Red Velvet, Vanilla Fruit</span>
                      </li>
                    </ul>
                  </div>

                  <button
                    onClick={() => handleOpenEnquiry(cake)}
                    className="w-full py-3 bg-maroon-700 hover:bg-maroon-800 text-cream-100 text-xs font-bold rounded-xl transition flex items-center justify-center gap-2 shadow-sm mt-4"
                  >
                    <Heart className="w-4 h-4 fill-cream-100" />
                    <span>Enquire &amp; Reserve Date</span>
                  </button>
                </div>
              ))}
            </div>
          </div>
        </section>
      </main>

      <PublicFooter />

      {/* Wedding Enquiry Modal */}
      <Modal
        isOpen={enquiryModalOpen}
        onClose={() => setEnquiryModalOpen(false)}
        title={selectedCake ? `Wedding Cake Enquiry: ${selectedCake.name}` : 'Bespoke Wedding Cake Enquiry'}
        subtitle="Schedule a wedding cake consultation with Bakelicious Kolkata."
        maxWidth="md"
      >
        <form onSubmit={handleSendEnquiry} className="space-y-4 text-xs">
          <div>
            <label className="block font-bold text-maroon-900 mb-1">Bride / Groom / Contact Name *</label>
            <input
              type="text"
              required
              value={customerName}
              onChange={(e) => setCustomerName(e.target.value)}
              placeholder="e.g. Ananya & Vikram"
              className="w-full px-3.5 py-2 bg-cream-100 border border-cream-300 rounded-xl font-medium focus:outline-none"
            />
          </div>

          <div>
            <label className="block font-bold text-maroon-900 mb-1">Phone Number (WhatsApp) *</label>
            <input
              type="text"
              required
              value={customerPhone}
              onChange={(e) => setCustomerPhone(e.target.value)}
              placeholder="+91 98765 43210"
              className="w-full px-3.5 py-2 bg-cream-100 border border-cream-300 rounded-xl font-medium focus:outline-none"
            />
          </div>

          <div>
            <label className="block font-bold text-maroon-900 mb-1">Wedding / Reception Date</label>
            <input
              type="date"
              value={weddingDate}
              onChange={(e) => setWeddingDate(e.target.value)}
              className="w-full px-3.5 py-2 bg-cream-100 border border-cream-300 rounded-xl font-medium focus:outline-none"
            />
          </div>

          <div>
            <label className="block font-bold text-maroon-900 mb-1">Tier Count, Theme Colors &amp; Venue Details</label>
            <textarea
              rows={3}
              value={tierDetails}
              onChange={(e) => setTierDetails(e.target.value)}
              placeholder="e.g. 3-Tier cake in rose pink, 100 guests, delivery at ITC Royal Bengal"
              className="w-full px-3.5 py-2 bg-cream-100 border border-cream-300 rounded-xl font-medium focus:outline-none"
            />
          </div>

          <div className="flex items-center justify-end gap-3 pt-4 border-t border-cream-300">
            <button
              type="button"
              onClick={() => setEnquiryModalOpen(false)}
              className="px-4 py-2 bg-cream-200 text-maroon-900 font-bold rounded-xl"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2 bg-maroon-700 hover:bg-maroon-800 text-cream-100 font-bold rounded-xl shadow-md flex items-center gap-2"
            >
              <Phone className="w-3.5 h-3.5" />
              <span>Send Wedding Enquiry via WhatsApp</span>
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
