'use client';

import React, { useEffect, useState } from 'react';
import { PublicHeader } from '@/components/layout/PublicHeader';
import { PublicFooter } from '@/components/layout/PublicFooter';
import { Modal } from '@/components/ui/Modal';
import { api, getImageUrl } from '@/lib/api';
import { Product, Category } from '@/types';
import { showToast } from '@/lib/toast';
import { Search, ShoppingBag, Phone, Sparkles, UtensilsCrossed } from 'lucide-react';

export default function PublicMenuPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);

  // Search & Filters
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');

  // Enquiry Modal
  const [enquiryModalOpen, setEnquiryModalOpen] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [deliveryDate, setDeliveryDate] = useState('');
  const [customNotes, setCustomNotes] = useState('');

  useEffect(() => {
    fetchPublicMenu();
  }, []);

  const fetchPublicMenu = async () => {
    try {
      setLoading(true);
      const [prodRes, catRes] = await Promise.all([
        api.get('/products?available_only=true'),
        api.get('/categories')
      ]);
      setProducts(prodRes.data);
      setCategories(catRes.data);
    } catch (err) {
      console.error('Failed to load menu:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenEnquiry = (prod: Product) => {
    setSelectedProduct(prod);
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
        product_id: selectedProduct?.id || null,
        delivery_date: deliveryDate || null,
        special_instructions: customNotes || undefined
      });
      showToast('Order enquiry submitted successfully!', 'success');
    } catch (err) {
      console.error('Failed to submit public order:', err);
    }

    const msg = `Hello Bakelicious! I would like to order/enquire about: ${selectedProduct?.name}. Name: ${customerName}, Phone: ${customerPhone}, Date: ${deliveryDate || 'Flexible'}. Notes: ${customNotes || 'None'}`;
    const whatsappUrl = `https://wa.me/919876543210?text=${encodeURIComponent(msg)}`;
    window.open(whatsappUrl, '_blank');
    setEnquiryModalOpen(false);
  };

  const filteredProducts = products.filter((p) => {
    if (selectedCategory !== 'all') {
      const catId = parseInt(selectedCategory, 10);
      if (!isNaN(catId)) {
        if (p.category_id !== catId) return false;
      } else {
        const catName = p.category?.name.toLowerCase() || '';
        if (!catName.includes(selectedCategory.toLowerCase())) return false;
      }
    }

    if (search.trim()) {
      const q = search.toLowerCase();
      const matchName = p.name.toLowerCase().includes(q);
      const matchDesc = p.description?.toLowerCase().includes(q) || false;
      if (!matchName && !matchDesc) return false;
    }
    return true;
  });

  return (
    <div className="min-h-screen bg-cream-200 text-charcoal flex flex-col font-sans">
      <PublicHeader />

      <main className="flex-1 py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
          
          {/* Header Banner */}
          <div className="text-center max-w-2xl mx-auto space-y-3">
            <span className="text-xs uppercase font-bold text-maroon-700 tracking-widest block font-sans">
              Handcrafted With Love
            </span>
            <h1 className="text-3xl sm:text-4xl font-extrabold text-maroon-950 font-serif">
              Our Bakery Menu Catalog
            </h1>
            <p className="text-xs sm:text-sm text-charcoal-muted font-medium">
              Explore our freshly baked cakes, artisanal bento boxes, wedding tiers &amp; celebration platters.
            </p>
          </div>

          {/* Search & Category Filter Pills */}
          <div className="bg-cream-100 p-4 rounded-3xl shadow-sm border border-cream-300 flex flex-col md:flex-row items-center justify-between gap-4">
            
            {/* Search Input */}
            <div className="relative w-full md:w-80">
              <Search className="w-4 h-4 text-charcoal-muted absolute left-3.5 top-3" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search cakes by name or flavor..."
                className="w-full pl-10 pr-4 py-2.5 bg-cream-200 border border-cream-300 rounded-2xl text-xs font-medium text-maroon-900 placeholder:text-charcoal-muted focus:outline-none focus:ring-2 focus:ring-maroon-600"
              />
            </div>

            {/* Category Filter Pills (Dynamically fetched from ERP Categories API) */}
            <div className="flex items-center gap-2 overflow-x-auto w-full md:w-auto pb-1 md:pb-0 scrollbar-none">
              <button
                onClick={() => setSelectedCategory('all')}
                className={`px-4 py-2 rounded-2xl text-xs font-bold transition shrink-0 ${
                  selectedCategory === 'all'
                    ? 'bg-maroon-700 text-cream-100 shadow-sm'
                    : 'bg-cream-200 text-charcoal hover:bg-cream-300'
                }`}
              >
                All Cakes
              </button>
              {categories.map((cat) => (
                <button
                  key={cat.id}
                  onClick={() => setSelectedCategory(String(cat.id))}
                  className={`px-4 py-2 rounded-2xl text-xs font-bold transition shrink-0 ${
                    selectedCategory === String(cat.id)
                      ? 'bg-maroon-700 text-cream-100 shadow-sm'
                      : 'bg-cream-200 text-charcoal hover:bg-cream-300'
                  }`}
                >
                  {cat.name}
                </button>
              ))}
            </div>

          </div>

          {/* Product Grid */}
          {loading ? (
            <div className="py-20 text-center">
              <div className="inline-block animate-spin rounded-full h-8 w-8 border-4 border-maroon-700 border-t-transparent"></div>
              <p className="text-xs text-charcoal-muted mt-2 font-bold">Loading gourmet cakes...</p>
            </div>
          ) : filteredProducts.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {filteredProducts.map((prod) => (
                <div
                  key={prod.id}
                  className="bg-cream-100 rounded-3xl border border-cream-300 p-5 space-y-4 shadow-sm hover:shadow-md transition flex flex-col justify-between"
                >
                  <div className="space-y-3">
                    <div className="aspect-[4/3] rounded-2xl overflow-hidden border border-cream-300 relative bg-cream-200">
                      <img
                        src={getImageUrl(prod.image_url)}
                        alt={prod.name}
                        className="w-full h-full object-cover"
                      />
                      <span className="absolute top-3 right-3 px-3 py-1 bg-maroon-800/90 text-cream-100 text-xs font-bold rounded-full shadow-sm">
                        ₹{prod.price}
                      </span>
                    </div>

                    <div>
                      <span className="text-[10px] uppercase font-bold text-maroon-700 tracking-wider">
                        {prod.category?.name || 'Gourmet Cake'}
                      </span>
                      <h3 className="font-bold text-maroon-950 text-base font-serif mt-0.5">{prod.name}</h3>
                      <p className="text-xs text-charcoal-muted line-clamp-2 mt-1 font-medium leading-relaxed">
                        {prod.description}
                      </p>
                    </div>

                    {prod.sizes && prod.sizes.length > 0 ? (
                      <div className="pt-2 border-t border-cream-300 space-y-1 text-[11px]">
                        <span className="font-bold text-maroon-900 block">Available Sizes &amp; Prices:</span>
                        <div className="flex flex-wrap gap-1">
                          {prod.sizes.map((s: any, idx: number) => (
                            <span key={idx} className="px-2 py-0.5 bg-cream-200 text-maroon-900 rounded-md font-medium border border-cream-300">
                              {typeof s === 'string' ? s : `${s.size} — ₹${s.selling_price}`}
                            </span>
                          ))}
                        </div>
                      </div>
                    ) : (
                      <div className="flex items-center gap-2 pt-2 border-t border-cream-300 text-[11px] text-charcoal-muted">
                        <span className="font-bold text-maroon-900">Size:</span> {prod.size || '1 Pound'} — ₹{prod.price}
                      </div>
                    )}
                  </div>

                  <button
                    onClick={() => handleOpenEnquiry(prod)}
                    className="w-full py-2.5 bg-maroon-700 hover:bg-maroon-800 text-cream-100 text-xs font-bold rounded-xl transition flex items-center justify-center gap-2 shadow-sm"
                  >
                    <ShoppingBag className="w-4 h-4" />
                    <span>Order / Enquire</span>
                  </button>
                </div>
              ))}
            </div>
          ) : (
            <div className="bg-cream-100 rounded-3xl border border-cream-300 p-12 text-center space-y-3">
              <div className="w-16 h-16 rounded-full bg-cream-200 text-maroon-700 mx-auto flex items-center justify-center">
                <UtensilsCrossed className="w-8 h-8" />
              </div>
              <h3 className="text-base font-bold text-maroon-900 font-serif">No cakes found</h3>
              <p className="text-xs text-charcoal-muted max-w-sm mx-auto font-medium">
                No Bakelicious cakes match your search or filter criteria. Try choosing another category!
              </p>
            </div>
          )}

        </div>
      </main>

      <PublicFooter />

      {/* Order Enquiry Modal */}
      <Modal
        isOpen={enquiryModalOpen}
        onClose={() => setEnquiryModalOpen(false)}
        title={selectedProduct ? `Order Enquiry: ${selectedProduct.name}` : 'Cake Order Enquiry'}
        subtitle="Connect directly with our master bakers via WhatsApp."
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
              placeholder="e.g. Priya Sharma"
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
            <label className="block font-bold text-maroon-900 mb-1">Required Delivery Date</label>
            <input
              type="date"
              value={deliveryDate}
              onChange={(e) => setDeliveryDate(e.target.value)}
              className="w-full px-3.5 py-2 bg-cream-100 border border-cream-300 rounded-xl font-medium focus:outline-none"
            />
          </div>

          <div>
            <label className="block font-bold text-maroon-900 mb-1">Custom Notes / Flavours / Message on Cake</label>
            <textarea
              rows={3}
              value={customNotes}
              onChange={(e) => setCustomNotes(e.target.value)}
              placeholder="e.g. Eggless, 1kg chocolate truffle, write 'Happy Birthday Priya!'"
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
              <span>Send Enquiry via WhatsApp</span>
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
