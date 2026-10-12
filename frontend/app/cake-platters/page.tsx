'use client';

import React, { useEffect, useState } from 'react';
import { PublicHeader } from '@/components/layout/PublicHeader';
import { PublicFooter } from '@/components/layout/PublicFooter';
import { Modal } from '@/components/ui/Modal';
import { api, getImageUrl } from '@/lib/api';
import { Product } from '@/types';
import { showToast } from '@/lib/toast';
import { Sparkles, Phone, ShoppingBag, Utensils, Heart } from 'lucide-react';

export default function CakePlattersPage() {
  const [platters, setPlatters] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  // Enquiry Modal
  const [enquiryModalOpen, setEnquiryModalOpen] = useState(false);
  const [selectedPlatter, setSelectedPlatter] = useState<Product | null>(null);
  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [deliveryDate, setDeliveryDate] = useState('');
  const [platterNotes, setPlatterNotes] = useState('');

  useEffect(() => {
    fetchPlatters();
  }, []);

  const fetchPlatters = async () => {
    try {
      setLoading(true);
      const res = await api.get('/products');
      const filtered = res.data.filter((p: Product) => 
        p.category?.name.includes('Platter') || 
        p.name.includes('Platter') || 
        p.tags?.includes('Platter')
      );
      setPlatters(filtered.length > 0 ? filtered : [
        {
          id: 701,
          name: 'Signature High Tea Dessert Platter',
          price: 1800,
          description: 'An assortment of 12 luxury dessert bites: mini Belgian chocolate mousse cups, French macarons, and mini berry tarts.',
          image_url: '/images/cakes/cake-platter-1.jpg',
          category: { name: 'Party Platters' }
        },
        {
          id: 702,
          name: 'Artisan Petite Gateau Platter',
          price: 2400,
          description: '16-piece gourmet selection of handcrafted mini entremets, red velvet bonbons, and pistachio financier cakes.',
          image_url: '/images/cakes/cake-platter-2.jpg',
          category: { name: 'Party Platters' }
        }
      ]);
    } catch (err) {
      console.error('Failed to load cake platters:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenEnquiry = (platter?: Product) => {
    setSelectedPlatter(platter || null);
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
        delivery_address: 'Kolkata Event Delivery',
        delivery_date: deliveryDate || new Date().toISOString().split('T')[0],
        special_instructions: `Platter Order: ${selectedPlatter?.name || 'Party Platter'}. Notes: ${platterNotes || 'Standard gourmet variety'}`,
        total_amount: selectedPlatter?.price || 1800,
        items: []
      });
      showToast('Platter request logged! Opening WhatsApp...', 'success');
    } catch (err) {
      // Proceed to WhatsApp fallback
    }

    const msg = `Hello Bakelicious! I'd like to order a Dessert Platter: ${selectedPlatter?.name || 'Party Platter'}. Name: ${customerName}, Phone: ${customerPhone}, Date: ${deliveryDate || 'Flexible'}. Event Notes: ${platterNotes || 'Standard'}`;
    const whatsappUrl = `https://wa.me/919876543210?text=${encodeURIComponent(msg)}`;
    window.open(whatsappUrl, '_blank');
    setEnquiryModalOpen(false);
  };

  return (
    <div className="min-h-screen bg-cream-100 dark:bg-maroon-950 text-charcoal dark:text-cream-100 flex flex-col font-sans selection:bg-maroon-700 selection:text-cream-100">
      <PublicHeader />

      <main className="flex-1">
        {/* Platters Hero Header */}
        <section className="bg-cream-100 dark:bg-maroon-950 py-16 border-b-2 border-maroon-950/20 dark:border-maroon-800">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center space-y-3 max-w-2xl">
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-cream-50 dark:bg-maroon-900 border-2 border-maroon-950 dark:border-cream-100 text-maroon-950 dark:text-cream-100 text-[11px] font-black uppercase tracking-widest shadow-neo-sm">
              <Sparkles className="w-3.5 h-3.5 text-amber-500 fill-amber-500" />
              <span>Gourmet Celebration Platters</span>
            </div>
            <h1 className="text-3xl sm:text-5xl font-black font-serif text-maroon-950 dark:text-cream-100">
              Luxury Dessert Platters
            </h1>
            <p className="text-xs sm:text-sm text-charcoal-muted dark:text-cream-300 font-medium leading-relaxed">
              Curated sharing platters of mini gateaux, macarons, tartlets, and brownies perfect for high teas, corporate gifting, and intimate family celebrations.
            </p>
          </div>
        </section>

        {/* Platters Grid */}
        <section className="py-16 bg-cream-100 dark:bg-maroon-950">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-10">
            {loading ? (
              <div className="py-20 text-center">
                <div className="inline-block animate-spin rounded-full h-8 w-8 border-4 border-maroon-700 border-t-transparent"></div>
                <p className="text-xs text-charcoal-muted mt-2 font-bold">Loading dessert platters...</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
                {platters.map((platter) => (
                  <div
                    key={platter.id}
                    className="bg-cream-50 dark:bg-maroon-900 rounded-3xl border-2 border-maroon-950/20 dark:border-cream-100/20 hover:border-maroon-950 dark:hover:border-cream-100 p-6 space-y-4 shadow-neo-sm hover:shadow-neo hover:-translate-y-1 transition-all flex flex-col justify-between group"
                  >
                    <div className="space-y-3">
                      <div className="aspect-[4/3] rounded-2xl overflow-hidden border-2 border-maroon-950/15 dark:border-cream-100/20 relative bg-cream-200 dark:bg-maroon-800">
                        <img
                          src={getImageUrl(platter.image_url, '/images/cakes/cake-platter-1.jpg')}
                          alt={platter.name}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                        />
                        <span className="absolute top-2.5 right-2.5 px-3 py-1 bg-maroon-950 text-cream-100 border border-cream-200 text-xs font-black rounded-xl shadow-xs">
                          ₹{platter.price}
                        </span>
                      </div>

                      <div>
                        <span className="text-[10px] uppercase font-bold text-maroon-700 dark:text-cream-300 tracking-wider">
                          Dessert Platter • Serves 8-12
                        </span>
                        <h3 className="font-bold text-maroon-950 dark:text-cream-100 text-lg font-serif mt-0.5 group-hover:text-maroon-700 dark:group-hover:text-amber-300 transition-colors">
                          {platter.name}
                        </h3>
                        <p className="text-xs text-charcoal-muted dark:text-cream-300/80 line-clamp-3 mt-1 font-medium leading-relaxed">
                          {platter.description}
                        </p>
                      </div>

                      <div className="p-3 bg-cream-100 dark:bg-maroon-950 rounded-xl border-2 border-maroon-950/15 text-[11px] text-maroon-950 dark:text-cream-200 font-medium">
                        🎁 Arrives in luxury ribbon-tied presentation box with tasting guide
                      </div>
                    </div>

                    <button
                      onClick={() => handleOpenEnquiry(platter)}
                      className="w-full py-3 bg-maroon-700 hover:bg-maroon-800 text-cream-100 text-xs font-black uppercase tracking-wider rounded-xl border-2 border-maroon-950 dark:border-cream-100 shadow-neo-sm hover:shadow-neo hover:-translate-x-0.5 hover:-translate-y-0.5 active:translate-x-0 active:translate-y-0 transition-all flex items-center justify-center gap-2"
                    >
                      <ShoppingBag className="w-4 h-4" />
                      <span>Order Dessert Platter</span>
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </section>
      </main>

      <PublicFooter />

      {/* Platter Order Modal */}
      <Modal
        isOpen={enquiryModalOpen}
        onClose={() => setEnquiryModalOpen(false)}
        title={selectedPlatter ? `Order ${selectedPlatter.name}` : 'Order Dessert Platter'}
        subtitle="Luxury sharing platters and corporate gifting boxes"
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
              placeholder="e.g. Rahul Sharma"
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
            <label className="block font-bold text-maroon-950 dark:text-cream-200 mb-1">Required Event Date</label>
            <input
              type="date"
              value={deliveryDate}
              onChange={(e) => setDeliveryDate(e.target.value)}
              className="w-full p-2.5 bg-cream-100 dark:bg-maroon-950 border-2 border-maroon-950/20 dark:border-cream-100/20 rounded-xl outline-none"
            />
          </div>

          <div>
            <label className="block font-bold text-maroon-950 dark:text-cream-200 mb-1">Gifting Ribbon or Allergen Notes</label>
            <textarea
              rows={3}
              value={platterNotes}
              onChange={(e) => setPlatterNotes(e.target.value)}
              placeholder="e.g. Add a gift note: 'Happy Retirement Sir', 100% Eggless assortment..."
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
              <span>Confirm &amp; WhatsApp Baker</span>
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
