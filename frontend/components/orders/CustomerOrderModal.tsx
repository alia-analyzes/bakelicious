'use client';

import React, { useState, useEffect } from 'react';
import { Modal } from '@/components/ui/Modal';
import { Product } from '@/types';
import { api } from '@/lib/api';
import { showToast } from '@/lib/toast';
import {
  ShoppingBag,
  Sparkles,
  Phone,
  Calendar,
  Clock,
  MapPin,
  CheckCircle2,
  Heart,
  MessageSquare,
  Cake,
  Check
} from 'lucide-react';

interface CustomerOrderModalProps {
  isOpen: boolean;
  onClose: () => void;
  selectedProduct?: Product | null;
  productsList?: Product[];
}

export const CustomerOrderModal: React.FC<CustomerOrderModalProps> = ({
  isOpen,
  onClose,
  selectedProduct,
  productsList = []
}) => {
  const [chosenProductId, setChosenProductId] = useState<number | 'custom'>('custom');
  const [sizeOverride, setSizeOverride] = useState<string>('1 Pound');
  const [quantity, setQuantity] = useState<number>(1);

  // Customization & Comments according to customer's need
  const [cakeMessage, setCakeMessage] = useState<string>('');
  const [dietaryPreference, setDietaryPreference] = useState<string>('Standard');
  const [customizationNotes, setCustomizationNotes] = useState<string>('');

  // Customer & Delivery Info
  const [customerName, setCustomerName] = useState<string>('');
  const [customerPhone, setCustomerPhone] = useState<string>('');
  const [customerEmail, setCustomerEmail] = useState<string>('');
  const [deliveryDate, setDeliveryDate] = useState<string>('');
  const [deliveryTimeSlot, setDeliveryTimeSlot] = useState<string>('12:00 PM - 03:00 PM (Afternoon)');
  const [deliveryAddress, setDeliveryAddress] = useState<string>('');
  const [deliveryType, setDeliveryType] = useState<'delivery' | 'pickup'>('delivery');

  // Order State
  const [submitting, setSubmitting] = useState<boolean>(false);
  const [placedOrder, setPlacedOrder] = useState<any | null>(null);

  useEffect(() => {
    if (isOpen) {
      if (selectedProduct) {
        setChosenProductId(selectedProduct.id);
        setSizeOverride(selectedProduct.size || '1 Pound');
      } else if (productsList.length > 0) {
        setChosenProductId(productsList[0].id);
        setSizeOverride(productsList[0].size || '1 Pound');
      } else {
        setChosenProductId('custom');
        setSizeOverride('1 Pound');
      }

      // Default tomorrow for delivery
      const tmrw = new Date();
      tmrw.setDate(tmrw.getDate() + 1);
      setDeliveryDate(tmrw.toISOString().split('T')[0]);

      setPlacedOrder(null);
      setQuantity(1);
      setCakeMessage('');
      setCustomizationNotes('');
    }
  }, [isOpen, selectedProduct, productsList]);

  const activeProduct = typeof chosenProductId === 'number'
    ? productsList.find((p) => p.id === chosenProductId) || selectedProduct
    : null;

  const handleSubmitOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!customerName.trim() || !customerPhone.trim()) {
      showToast('Please enter your name and phone number', 'error');
      return;
    }

    // Compile all customization notes into comprehensive instructions
    const customizationParts = [];
    if (cakeMessage.trim()) {
      customizationParts.push(`🎂 Message on Cake: "${cakeMessage.trim()}"`);
    }
    if (dietaryPreference && dietaryPreference !== 'Standard') {
      customizationParts.push(`🌿 Dietary: ${dietaryPreference}`);
    }
    if (customizationNotes.trim()) {
      customizationParts.push(`🎨 Customer Customization & Comments: ${customizationNotes.trim()}`);
    }
    if (deliveryType === 'pickup') {
      customizationParts.push(`🏬 Pickup Preference: Store Counter Pickup`);
    }

    const compiledInstructions = customizationParts.join(' | ');

    try {
      setSubmitting(true);
      const res = await api.post('/orders/public', {
        customer_name: customerName.trim(),
        phone: customerPhone.trim(),
        email: customerEmail.trim() || undefined,
        product_id: typeof chosenProductId === 'number' ? chosenProductId : null,
        size_override: sizeOverride || (activeProduct?.size || '1 Pound'),
        quantity: Math.max(1, quantity),
        delivery_date: deliveryDate ? `${deliveryDate}T12:00:00` : undefined,
        delivery_time: deliveryTimeSlot,
        delivery_address: deliveryType === 'delivery' ? (deliveryAddress.trim() || 'Kolkata Delivery Address') : 'Store Counter Pickup',
        special_instructions: compiledInstructions || 'Standard fresh preparation.'
      });

      setPlacedOrder(res.data);
      showToast('Order received! Our master bakers have been notified.', 'success');
    } catch (err: any) {
      console.error('Failed to submit order:', err);
      showToast(err.response?.data?.detail || 'Failed to place order. Please try again.', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const handleWhatsAppChat = () => {
    if (!placedOrder) return;
    const cakeName = activeProduct?.name || 'Custom Artisan Cake';
    const msg = `Hello Bakelicious team! I just placed an online order (${placedOrder.order_number}) on your website for "${cakeName}".\nName: ${customerName}\nDate: ${deliveryDate}\nCustomization: ${cakeMessage || customizationNotes || 'As specified on website'}`;
    const url = `https://wa.me/919876543210?text=${encodeURIComponent(msg)}`;
    window.open(url, '_blank');
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={
        placedOrder
          ? '🎉 Order Received Successfully!'
          : activeProduct
          ? `Order: ${activeProduct.name}`
          : 'Customize & Order Your Cake'
      }
      subtitle={
        placedOrder
          ? `Your order number is #${placedOrder.order_number}`
          : 'Direct bakery order with personal customization and delivery details'
      }
      maxWidth="lg"
    >
      {placedOrder ? (
        // Confirmation View
        <div className="space-y-5 text-xs text-charcoal">
          <div className="p-5 bg-emerald-50 border border-emerald-300 rounded-3xl text-center space-y-3">
            <div className="w-14 h-14 rounded-full bg-emerald-100 text-emerald-700 mx-auto flex items-center justify-center shadow-xs">
              <CheckCircle2 className="w-8 h-8" />
            </div>
            <h3 className="text-xl font-extrabold font-serif text-emerald-950">
              Thank You, {customerName}!
            </h3>
            <p className="text-xs text-emerald-900 max-w-md mx-auto font-medium">
              Your order has been registered directly in our bakery management system and scheduled in our kitchen queue.
            </p>
          </div>

          <div className="bg-cream-100 p-4 rounded-2xl border border-cream-300 space-y-2.5">
            <div className="flex justify-between border-b border-cream-200 pb-2">
              <span className="font-bold text-maroon-900">Order Reference:</span>
              <span className="font-mono font-extrabold text-maroon-950 text-sm">{placedOrder.order_number}</span>
            </div>
            <div className="flex justify-between border-b border-cream-200 pb-2">
              <span className="font-bold text-maroon-900">Cake / Item:</span>
              <span className="font-bold">{activeProduct?.name || 'Custom Artisan Cake'} ({sizeOverride}) x{quantity}</span>
            </div>
            <div className="flex justify-between border-b border-cream-200 pb-2">
              <span className="font-bold text-maroon-900">Delivery Date &amp; Slot:</span>
              <span className="font-bold">{deliveryDate} • {deliveryTimeSlot}</span>
            </div>
            {placedOrder.special_instructions && (
              <div className="pt-1">
                <span className="font-bold text-maroon-900 block mb-1">Your Customization Details:</span>
                <p className="p-2.5 bg-cream-200 rounded-xl text-maroon-950 font-medium">
                  {placedOrder.special_instructions}
                </p>
              </div>
            )}
          </div>

          <div className="flex flex-col sm:flex-row items-center justify-end gap-3 pt-3 border-t border-cream-300">
            <button
              type="button"
              onClick={handleWhatsAppChat}
              className="w-full sm:w-auto px-5 py-3 bg-emerald-700 hover:bg-emerald-800 text-white font-bold rounded-2xl shadow-md flex items-center justify-center gap-2"
            >
              <Phone className="w-4 h-4" />
              <span>Connect with Baker on WhatsApp</span>
            </button>
            <button
              type="button"
              onClick={onClose}
              className="w-full sm:w-auto px-6 py-3 bg-maroon-700 hover:bg-maroon-800 text-cream-100 font-bold rounded-2xl shadow-md"
            >
              Done
            </button>
          </div>
        </div>
      ) : (
        // Order Form
        <form onSubmit={handleSubmitOrder} className="space-y-5 text-xs text-charcoal">
          {/* Step 1: Cake & Size */}
          <div className="space-y-3">
            <h4 className="font-extrabold text-sm text-maroon-950 font-serif flex items-center gap-1.5 border-b border-cream-300 pb-1.5">
              <Cake className="w-4 h-4 text-maroon-700" />
              <span>1. Cake Selection &amp; Weight</span>
            </h4>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="sm:col-span-2">
                <label className="block font-bold text-maroon-900 mb-1">Selected Cake</label>
                {productsList.length > 0 ? (
                  <select
                    value={chosenProductId}
                    onChange={(e) => {
                      const val = e.target.value;
                      setChosenProductId(val === 'custom' ? 'custom' : Number(val));
                    }}
                    className="w-full px-3.5 py-2.5 bg-cream-100 border border-cream-300 rounded-xl font-bold text-maroon-950 focus:outline-none"
                  >
                    {productsList.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.name} - ₹{p.price} ({p.size || '1 Pound'})
                      </option>
                    ))}
                    <option value="custom">✨ Bespoke / Custom Cake Design</option>
                  </select>
                ) : (
                  <input
                    type="text"
                    disabled
                    value={selectedProduct?.name || 'Custom Cake Design'}
                    className="w-full px-3.5 py-2 bg-cream-200 border border-cream-300 rounded-xl font-bold text-maroon-950"
                  />
                )}
              </div>

              <div>
                <label className="block font-bold text-maroon-900 mb-1">Size / Weight</label>
                <select
                  value={sizeOverride}
                  onChange={(e) => setSizeOverride(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-cream-100 border border-cream-300 rounded-xl font-bold text-maroon-950 focus:outline-none"
                >
                  <option value="1 Pound">1 Pound (approx. 500g)</option>
                  <option value="2 Pound">2 Pound (approx. 1 kg)</option>
                  <option value="3 Pound">3 Pound (approx. 1.5 kg)</option>
                  <option value="Bento Half Pound">Bento Cake (approx. 250g)</option>
                  <option value="Multi-tier 4+ Pound">Multi-tier Cake (4+ Pound)</option>
                </select>
              </div>
            </div>
          </div>

          {/* Step 2: Customization According to Need & Comments */}
          <div className="space-y-3 bg-cream-100 p-4 rounded-2xl border border-cream-300">
            <h4 className="font-extrabold text-sm text-maroon-950 font-serif flex items-center gap-1.5 border-b border-cream-300 pb-1.5">
              <Sparkles className="w-4 h-4 text-maroon-700" />
              <span>2. Your Customization &amp; Special Needs</span>
            </h4>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block font-bold text-maroon-900 mb-1">
                  Message to write on Cake (Optional)
                </label>
                <input
                  type="text"
                  value={cakeMessage}
                  onChange={(e) => setCakeMessage(e.target.value)}
                  placeholder="e.g. Happy 25th Birthday Sarah! 🎂"
                  className="w-full px-3.5 py-2 bg-white border border-cream-300 rounded-xl font-semibold text-maroon-950 focus:outline-none"
                />
              </div>

              <div>
                <label className="block font-bold text-maroon-900 mb-1">
                  Dietary / Recipe Preference
                </label>
                <select
                  value={dietaryPreference}
                  onChange={(e) => setDietaryPreference(e.target.value)}
                  className="w-full px-3.5 py-2 bg-white border border-cream-300 rounded-xl font-bold text-maroon-950 focus:outline-none"
                >
                  <option value="Standard">Standard Gourmet Recipe</option>
                  <option value="100% Eggless">100% Pure Eggless</option>
                  <option value="Gluten-Friendly">Gluten-Friendly</option>
                  <option value="Less Sweet">Less Sweet / Mild Sugar</option>
                  <option value="Extra Dark Chocolate">Extra Dark Chocolate Ganache</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block font-bold text-maroon-900 mb-1">
                Your Customization Comments &amp; Design Notes *
              </label>
              <textarea
                rows={3}
                value={customizationNotes}
                onChange={(e) => setCustomizationNotes(e.target.value)}
                placeholder="Mention any customization according to your need: color palette, piping style, flavor combination, allergy instructions, or design requests..."
                className="w-full p-3 bg-white border border-cream-300 rounded-xl font-medium text-maroon-950 focus:outline-none leading-relaxed"
              />
              <span className="text-[10px] text-charcoal-muted mt-1 block">
                ✦ This comment will be displayed directly to the head baker and decorating staff.
              </span>
            </div>
          </div>

          {/* Step 3: Customer Contact & Delivery Details */}
          <div className="space-y-3">
            <h4 className="font-extrabold text-sm text-maroon-950 font-serif flex items-center gap-1.5 border-b border-cream-300 pb-1.5">
              <Calendar className="w-4 h-4 text-maroon-700" />
              <span>3. Contact &amp; Delivery Information</span>
            </h4>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
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
                <label className="block font-bold text-maroon-900 mb-1">Required Delivery Date *</label>
                <input
                  type="date"
                  required
                  value={deliveryDate}
                  onChange={(e) => setDeliveryDate(e.target.value)}
                  className="w-full px-3.5 py-2 bg-cream-100 border border-cream-300 rounded-xl font-medium focus:outline-none"
                />
              </div>

              <div>
                <label className="block font-bold text-maroon-900 mb-1">Preferred Time Slot</label>
                <select
                  value={deliveryTimeSlot}
                  onChange={(e) => setDeliveryTimeSlot(e.target.value)}
                  className="w-full px-3.5 py-2 bg-cream-100 border border-cream-300 rounded-xl font-medium focus:outline-none"
                >
                  <option value="10:00 AM - 01:00 PM (Morning)">10:00 AM - 01:00 PM (Morning)</option>
                  <option value="01:00 PM - 05:00 PM (Afternoon)">01:00 PM - 05:00 PM (Afternoon)</option>
                  <option value="05:00 PM - 08:00 PM (Evening)">05:00 PM - 08:00 PM (Evening)</option>
                </select>
              </div>
            </div>

            <div className="flex items-center gap-4 pt-1">
              <label className="flex items-center gap-2 cursor-pointer font-bold text-maroon-900">
                <input
                  type="radio"
                  name="deliveryType"
                  checked={deliveryType === 'delivery'}
                  onChange={() => setDeliveryType('delivery')}
                  className="text-maroon-700"
                />
                <span>Home Delivery</span>
              </label>

              <label className="flex items-center gap-2 cursor-pointer font-bold text-maroon-900">
                <input
                  type="radio"
                  name="deliveryType"
                  checked={deliveryType === 'pickup'}
                  onChange={() => setDeliveryType('pickup')}
                  className="text-maroon-700"
                />
                <span>Store Pickup at Kolkata Bakery</span>
              </label>
            </div>

            {deliveryType === 'delivery' && (
              <div>
                <label className="block font-bold text-maroon-900 mb-1">Delivery Address in Kolkata</label>
                <textarea
                  rows={2}
                  value={deliveryAddress}
                  onChange={(e) => setDeliveryAddress(e.target.value)}
                  placeholder="Apartment, Street address, Landmark, Kolkata PIN"
                  className="w-full px-3.5 py-2 bg-cream-100 border border-cream-300 rounded-xl font-medium focus:outline-none"
                />
              </div>
            )}
          </div>

          {/* Form Actions */}
          <div className="flex items-center justify-end gap-3 pt-4 border-t-2 border-maroon-950/15">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 bg-cream-200 text-maroon-950 font-bold rounded-xl border-2 border-maroon-950/30 hover:border-maroon-950 transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="px-6 py-2.5 bg-maroon-700 hover:bg-maroon-800 disabled:opacity-50 text-cream-100 font-black rounded-xl border-2 border-maroon-950 shadow-neo-sm hover:shadow-neo hover:-translate-x-0.5 hover:-translate-y-0.5 active:translate-x-0 active:translate-y-0 transition-all flex items-center gap-2"
            >
              <ShoppingBag className="w-4 h-4" />
              <span>{submitting ? 'Placing Order...' : 'Place Order Directly'}</span>
            </button>
          </div>
        </form>
      )}
    </Modal>
  );
};
