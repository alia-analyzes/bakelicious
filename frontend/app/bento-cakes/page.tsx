'use client';

import React, { useEffect, useState } from 'react';
import { PublicHeader } from '@/components/layout/PublicHeader';
import { PublicFooter } from '@/components/layout/PublicFooter';
import { Modal } from '@/components/ui/Modal';
import { api, getImageUrl } from '@/lib/api';
import { Product } from '@/types';
import { showToast } from '@/lib/toast';
import { Sparkles, Phone, ShoppingBag, Heart, Gift } from 'lucide-react';

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
      // Filter Bento cakes
      const filtered = res.data.filter((p: Product) => 
        p.category?.name.includes('Bento') || 
        p.name.includes('Bento') || 
        p.tags?.includes('Bento')
      );
      setBentoCakes(filtered);
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
        phone: customerPhone,
        product_id: selectedBento?.id || null,
        delivery_date: deliveryDate || null,
        special_instructions: `Bento Cake Order. Custom Message: ${bentoMessage || 'None'}`
      });
      showToast('Bento cake order saved in system!', 'success');
    } catch (err) {
      console.error('Failed to submit bento order:', err);
    }

    const msg = `Hello Bakelicious! I would like to order a Bento Cake: ${selectedBento?.name || 'Custom Bento Cake'}. Name: ${customerName}, Phone: ${customerPhone}, Date: ${deliveryDate || 'Flexible'}. Custom Message on Bento: ${bentoMessage || 'None'}`;
    const whatsappUrl = `https://wa.me/919876543210?text=${encodeURIComponent(msg)}`;
    window.open(whatsappUrl, '_blank');
    setEnquiryModalOpen(false);
  };

  return (
    <div className="min-h-screen bg-cream-200 text-charcoal flex flex-col font-sans">
      <PublicHeader />

      <main className="flex-1">
        {/* Bento Hero Header */}
        <section className="bg-cream-100 py-16 border-b border-cream-300">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center space-y-3 max-w-2xl">
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-cream-200 border border-cream-300 text-maroon-800 text-xs font-bold shadow-sm">
              <Gift className="w-3.5 h-3.5 text-maroon-600" />
              <span>Trending Korean Mini Cakes</span>
            </div>
            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold font-serif text-maroon-950">
              Artisanal Bento Cake Gallery
            </h1>
            <p className="text-xs sm:text-sm text-charcoal-muted font-medium leading-relaxed">
              Adorable 4-inch bento cakes packed in eco-friendly sugarcane bento boxes with custom hand-lettered quotes, minimal pastel designs, and fudgy chocolate ganache.
            </p>
          </div>
        </section>

        {/* Bento Cakes Grid */}
        <section className="py-16 bg-cream-200">
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
                    className="bg-cream-100 rounded-3xl border border-cream-300 p-5 space-y-4 shadow-sm hover:shadow-md transition flex flex-col justify-between"
                  >
                    <div className="space-y-3">
                      <div className="aspect-square rounded-2xl overflow-hidden border border-cream-300 relative bg-cream-200">
                        <img
                          src={getImageUrl(bento.image_url, '/images/cakes/bento-floating.jpg')}
                          alt={bento.name}
                          className="w-full h-full object-cover"
                        />
                        <span className="absolute top-3 right-3 px-3 py-1 bg-maroon-800 text-cream-100 text-xs font-bold rounded-full shadow-sm">
                          ₹{bento.price}
                        </span>
                      </div>

                      <div>
                        <span className="text-[10px] uppercase font-bold text-maroon-700 tracking-wider">
                          4-Inch Bento • {bento.size || '350g'}
                        </span>
                        <h3 className="font-bold text-maroon-950 text-base font-serif mt-0.5">{bento.name}</h3>
                        <p className="text-xs text-charcoal-muted line-clamp-2 mt-1 font-medium leading-relaxed">
                          {bento.description}
                        </p>
                      </div>

                      <div className="p-2.5 bg-cream-200 rounded-xl border border-cream-300 text-[11px] text-maroon-900 font-medium">
                        ✨ Includes eco bento box + candle &amp; wooden fork
                      </div>
                    </div>

                    <button
                      onClick={() => handleOpenEnquiry(bento)}
                      className="w-full py-2.5 bg-maroon-700 hover:bg-maroon-800 text-cream-100 text-xs font-bold rounded-xl transition flex items-center justify-center gap-2 shadow-sm"
                    >
                      <ShoppingBag className="w-4 h-4" />
                      <span>Custom Order Bento</span>
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </section>
      </main>

      <PublicFooter />

      {/* Bento Order Modal */}
      <Modal
        isOpen={enquiryModalOpen}
        onClose={() => setEnquiryModalOpen(false)}
        title={selectedBento ? `Custom Bento Order: ${selectedBento.name}` : 'Custom Bento Cake Order'}
        subtitle="Specify your custom message and pastel frosting design."
        maxWidth="md"
      >
        <form onSubmit={handleSendEnquiry} className="space-y-4 text-xs">
          <div>
            <label className="block font-bold text-maroon-900 mb-1">Your Full Name *</label>
            <input
              type="text"
              required
              value={customerName}
              onChange={(e) => setCustomerName(e.target.value)}
              placeholder="e.g. Rahul Sen"
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
            <label className="block font-bold text-maroon-900 mb-1">Delivery Date</label>
            <input
              type="date"
              value={deliveryDate}
              onChange={(e) => setDeliveryDate(e.target.value)}
              className="w-full px-3.5 py-2 bg-cream-100 border border-cream-300 rounded-xl font-medium focus:outline-none"
            />
          </div>

          <div>
            <label className="block font-bold text-maroon-900 mb-1">Message to Pipe on Bento Cake</label>
            <textarea
              rows={2}
              value={bentoMessage}
              onChange={(e) => setBentoMessage(e.target.value)}
              placeholder="e.g. 'Happy Birthday Priya! 💖' or 'Best Partner Ever 🎂'"
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
              <span>Send Order via WhatsApp</span>
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
