'use client';

import React, { useEffect, useState } from 'react';
import { PublicHeader } from '@/components/layout/PublicHeader';
import { PublicFooter } from '@/components/layout/PublicFooter';
import { Modal } from '@/components/ui/Modal';
import { api, getImageUrl } from '@/lib/api';
import { Product } from '@/types';
import { showToast } from '@/lib/toast';
import { Sparkles, Phone, ShoppingBag, Heart, Gift, ArrowRight } from 'lucide-react';

export default function BentoCakesPage() {
  const [bentoCakes, setBentoCakes] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  // Enquiry Modal
  const [enquiryModalOpen, setEnquiryModalOpen] = useState(false);
  const [selectedBento, setSelectedBento] = useState<Product | null>(null);
  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [deliveryDate, setDeliveryDate] = useState('');
  const [bentoMessage, setBentoMessage] = useState('');

  useEffect(() => {
    fetchBentoCakes();
  }, []);

  const fetchBentoCakes = async () => {
    try {
      setLoading(true);
      const res = await api.get('/products');
      const filtered = res.data.filter((p: Product) => 
        p.category?.name.includes('Bento') || 
        p.name.includes('Bento') || 
        p.tags?.includes('Bento')
      );
      setBentoCakes(filtered.length > 0 ? filtered : [
        {
          id: 501,
          name: 'Pastel Pink Korean Bento Cake',
          price: 450,
          description: '4-inch strawberry sponge with smooth Swiss meringue buttercream and custom handwritten lettering.',
          image_url: '/images/cakes/bento-pastel-pink.jpg',
          category: { name: 'Bento Mini' }
        },
        {
          id: 502,
          name: 'Minimalist Chocolate Fudge Bento',
          price: 450,
          description: 'Rich dark Belgian cocoa sponge with vintage piping and gold sugar pearls.',
          image_url: '/images/cakes/bento-floating.jpg',
          category: { name: 'Bento Mini' }
        }
      ]);
    } catch (err) {
      console.error('Failed to load bento cakes:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenEnquiry = (bento?: Product) => {
    setSelectedBento(bento || null);
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
        delivery_address: 'Bakery Pick-up / Delivery',
        delivery_date: deliveryDate || new Date().toISOString().split('T')[0],
        special_instructions: `Bento Cake Order: ${selectedBento?.name || 'Custom Bento'}. Message on Bento: "${bentoMessage || 'None'}"`,
        total_amount: selectedBento?.price || 450,
        items: []
      });
      showToast('Bento cake request submitted! Opening WhatsApp...', 'success');
    } catch (err) {
      // Proceed to WhatsApp fallback
    }

    const msg = `Hello Bakelicious! I would like to order a Bento Cake: ${selectedBento?.name || 'Custom Bento Cake'}. Name: ${customerName}, Phone: ${customerPhone}, Date: ${deliveryDate || 'Flexible'}. Custom Message on Bento: ${bentoMessage || 'None'}`;
    const whatsappUrl = `https://wa.me/919876543210?text=${encodeURIComponent(msg)}`;
    window.open(whatsappUrl, '_blank');
    setEnquiryModalOpen(false);
  };

  return (
    <div className="min-h-screen bg-cream-100 dark:bg-maroon-950 text-charcoal dark:text-cream-100 flex flex-col font-sans selection:bg-maroon-700 selection:text-cream-100">
      <PublicHeader />

      <main className="flex-1">
        {/* Bento Hero Header */}
        <section className="bg-cream-100 dark:bg-maroon-950 py-16 border-b-2 border-maroon-950/20 dark:border-maroon-800">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center space-y-3 max-w-2xl">
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-cream-50 dark:bg-maroon-900 border-2 border-maroon-950 dark:border-cream-100 text-maroon-950 dark:text-cream-100 text-[11px] font-black uppercase tracking-widest shadow-neo-sm">
              <Gift className="w-3.5 h-3.5 text-amber-500 fill-amber-500" />
              <span>Trending Korean Mini Cakes</span>
            </div>
            <h1 className="text-3xl sm:text-5xl font-black font-serif text-maroon-950 dark:text-cream-100">
              Artisanal Bento Cake Gallery
            </h1>
            <p className="text-xs sm:text-sm text-charcoal-muted dark:text-cream-300 font-medium leading-relaxed">
              Adorable 4-inch bento cakes packed in eco-friendly sugarcane bento boxes with custom hand-lettered quotes, minimal pastel designs, and fudgy chocolate ganache.
            </p>
          </div>
        </section>

        {/* Bento Cakes Grid */}
        <section className="py-16 bg-cream-100 dark:bg-maroon-950">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-10">
            {loading ? (
              <div className="py-20 text-center">
                <div className="inline-block animate-spin rounded-full h-8 w-8 border-4 border-maroon-700 border-t-transparent"></div>
                <p className="text-xs text-charcoal-muted mt-2 font-bold">Loading bento cakes...</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {bentoCakes.map((bento) => (
                  <div
                    key={bento.id}
                    className="bg-cream-50 dark:bg-maroon-900 rounded-3xl border-2 border-maroon-950/20 dark:border-cream-100/20 hover:border-maroon-950 dark:hover:border-cream-100 p-5 space-y-4 shadow-neo-sm hover:shadow-neo hover:-translate-y-1 transition-all flex flex-col justify-between group"
                  >
                    <div className="space-y-3">
                      <div className="aspect-square rounded-2xl overflow-hidden border-2 border-maroon-950/15 dark:border-cream-100/20 relative bg-cream-200 dark:bg-maroon-800">
                        <img
                          src={getImageUrl(bento.image_url, '/images/cakes/bento-floating.jpg')}
                          alt={bento.name}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                        />
                        <span className="absolute top-2.5 right-2.5 px-3 py-1 bg-maroon-950 text-cream-100 border border-cream-200 text-xs font-black rounded-xl shadow-xs">
                          ₹{bento.price}
                        </span>
                      </div>

                      <div>
                        <span className="text-[10px] uppercase font-bold text-maroon-700 dark:text-cream-300 tracking-wider">
                          4-Inch Bento • {bento.size || '350g'}
                        </span>
                        <h3 className="font-bold text-maroon-950 dark:text-cream-100 text-base font-serif mt-0.5 group-hover:text-maroon-700 dark:group-hover:text-amber-300 transition-colors">
                          {bento.name}
                        </h3>
                        <p className="text-xs text-charcoal-muted dark:text-cream-300/80 line-clamp-2 mt-1 font-medium leading-relaxed">
                          {bento.description}
                        </p>
                      </div>

                      <div className="p-2.5 bg-cream-100 dark:bg-maroon-950 rounded-xl border-2 border-maroon-950/15 text-[11px] text-maroon-950 dark:text-cream-200 font-medium">
                        ✨ Includes eco bento box + candle &amp; wooden fork
                      </div>
                    </div>

                    <button
                      onClick={() => handleOpenEnquiry(bento)}
                      className="w-full py-3 bg-maroon-700 hover:bg-maroon-800 text-cream-100 text-xs font-black uppercase tracking-wider rounded-xl border-2 border-maroon-950 dark:border-cream-100 shadow-neo-sm hover:shadow-neo hover:-translate-x-0.5 hover:-translate-y-0.5 active:translate-x-0 active:translate-y-0 transition-all flex items-center justify-center gap-2"
                    >
                      <ShoppingBag className="w-4 h-4" />
                      <span>Order Bento Cake</span>
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </section>
      </main>

      <PublicFooter />

      {/* Enquiry Modal */}
      <Modal
        isOpen={enquiryModalOpen}
        onClose={() => setEnquiryModalOpen(false)}
        title={selectedBento ? `Order ${selectedBento.name}` : 'Order Custom Bento'}
        subtitle="4-inch personal bento cake with custom handwritten message"
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
              placeholder="e.g. Rohini Sengupta"
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
            <label className="block font-bold text-maroon-950 dark:text-cream-200 mb-1">Custom Lettering Message on Bento *</label>
            <input
              type="text"
              required
              value={bentoMessage}
              onChange={(e) => setBentoMessage(e.target.value)}
              placeholder="e.g. Happy 21st Sarah! ♡ (Max 25 letters)"
              className="w-full p-2.5 bg-cream-100 dark:bg-maroon-950 border-2 border-maroon-950/20 dark:border-cream-100/20 rounded-xl outline-none focus:border-maroon-950"
            />
          </div>

          <div>
            <label className="block font-bold text-maroon-950 dark:text-cream-200 mb-1">Delivery / Pickup Date</label>
            <input
              type="date"
              value={deliveryDate}
              onChange={(e) => setDeliveryDate(e.target.value)}
              className="w-full p-2.5 bg-cream-100 dark:bg-maroon-950 border-2 border-maroon-950/20 dark:border-cream-100/20 rounded-xl outline-none"
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
