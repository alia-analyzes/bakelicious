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
      // Filter Platters
      const filtered = res.data.filter((p: Product) => 
        p.category?.name.includes('Platter') || 
        p.name.includes('Platter') || 
        p.tags?.includes('Platter')
      );
      setPlatters(filtered);
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
        phone: customerPhone,
        product_id: selectedPlatter?.id || null,
        delivery_date: deliveryDate || null,
        special_instructions: `Cake Platter Order: ${selectedPlatter?.name || 'Custom Platter'}. Notes: ${platterNotes || 'None'}`
      });
      showToast('Platter enquiry saved in ERP system!', 'success');
    } catch (err) {
      console.error('Failed to submit platter order:', err);
    }

    const msg = `Hello Bakelicious! I would like to order a Cake Platter: ${selectedPlatter?.name || 'Celebration Platter'}. Name: ${customerName}, Phone: ${customerPhone}, Date: ${deliveryDate || 'Flexible'}. Notes: ${platterNotes || 'None'}`;
    const whatsappUrl = `https://wa.me/919876543210?text=${encodeURIComponent(msg)}`;
    window.open(whatsappUrl, '_blank');
    setEnquiryModalOpen(false);
  };

  return (
    <div className="min-h-screen bg-cream-200 text-charcoal flex flex-col font-sans">
      <PublicHeader />

      <main className="flex-1">
        {/* Platter Hero Header */}
        <section className="bg-cream-100 py-16 border-b border-cream-300">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center space-y-3 max-w-2xl">
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-cream-200 border border-cream-300 text-maroon-800 text-xs font-bold shadow-sm">
              <Utensils className="w-3.5 h-3.5 text-maroon-600" />
              <span>Assorted Party &amp; Celebration Samplers</span>
            </div>
            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold font-serif text-maroon-950">
              Gourmet Cake &amp; Dessert Platters
            </h1>
            <p className="text-xs sm:text-sm text-charcoal-muted font-medium leading-relaxed">
              Curated dessert platters featuring mini cake slices, fudgy chocolate brownies, macaron pops, and fruit tarts perfect for office meetings, birthdays, and anniversaries.
            </p>
          </div>
        </section>

        {/* Platters Grid */}
        <section className="py-16 bg-cream-200">
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
                    className="bg-cream-100 rounded-3xl border border-cream-300 p-6 space-y-4 shadow-sm hover:shadow-md transition flex flex-col justify-between"
                  >
                    <div className="space-y-4">
                      <div className="aspect-[4/3] rounded-2xl overflow-hidden border border-cream-300 relative bg-cream-200">
                        <img
                          src={getImageUrl(platter.image_url, '/images/cakes/cake-platter-1.jpg')}
                          alt={platter.name}
                          className="w-full h-full object-cover"
                        />
                        <span className="absolute top-3 right-3 px-3.5 py-1 bg-maroon-800 text-cream-100 text-xs font-bold rounded-full shadow-sm">
                          ₹{platter.price}
                        </span>
                      </div>

                      <div>
                        <span className="text-[10px] uppercase font-bold text-maroon-700 tracking-wider">
                          {platter.size || 'Assorted Party Box'}
                        </span>
                        <h3 className="font-bold text-maroon-950 text-lg font-serif mt-0.5">{platter.name}</h3>
                        <p className="text-xs text-charcoal-muted mt-1.5 leading-relaxed font-medium">
                          {platter.description}
                        </p>
                      </div>

                      <div className="p-3 bg-cream-200 rounded-xl border border-cream-300 text-xs text-maroon-900 font-medium">
                        ✨ Serves 6–10 guests • Includes multiple signature cake flavors
                      </div>
                    </div>

                    <button
                      onClick={() => handleOpenEnquiry(platter)}
                      className="w-full py-3 bg-maroon-700 hover:bg-maroon-800 text-cream-100 text-xs font-bold rounded-xl transition flex items-center justify-center gap-2 shadow-sm"
                    >
                      <ShoppingBag className="w-4 h-4" />
                      <span>Order Platter</span>
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
        title={selectedPlatter ? `Order Platter: ${selectedPlatter.name}` : 'Cake Platter Order'}
        subtitle="Order fresh celebration cake platters for your event."
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
              placeholder="e.g. Vikram Roy"
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
            <label className="block font-bold text-maroon-900 mb-1">Event / Delivery Date</label>
            <input
              type="date"
              value={deliveryDate}
              onChange={(e) => setDeliveryDate(e.target.value)}
              className="w-full px-3.5 py-2 bg-cream-100 border border-cream-300 rounded-xl font-medium focus:outline-none"
            />
          </div>

          <div>
            <label className="block font-bold text-maroon-900 mb-1">Custom Platter Instructions / Flavours</label>
            <textarea
              rows={2}
              value={platterNotes}
              onChange={(e) => setPlatterNotes(e.target.value)}
              placeholder="e.g. Include eggless truffle, brownie cubes & red velvet slices"
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
              <span>Send Platter Order via WhatsApp</span>
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
