'use client';

import React, { useState } from 'react';
import { PublicHeader } from '@/components/layout/PublicHeader';
import { PublicFooter } from '@/components/layout/PublicFooter';
import { api } from '@/lib/api';
import { showToast } from '@/lib/toast';
import {
  Sparkles,
  Cake,
  Calendar,
  Clock,
  MapPin,
  Phone,
  User,
  Heart,
  CheckCircle2,
  Check,
  ArrowRight,
  MessageSquare
} from 'lucide-react';

export default function CustomCakesStudioPage() {
  // Studio selections
  const [cakeType, setCakeType] = useState('Celebration Cake');
  const [selectedSize, setSelectedSize] = useState('1 Pound (Serves 4-6)');
  const [selectedFlavor, setSelectedFlavor] = useState('Belgian Chocolate Truffle');
  const [dietary, setDietary] = useState('100% Eggless');
  const [cakeMessage, setCakeMessage] = useState('');
  const [specialNotes, setSpecialNotes] = useState('');

  // Contact & Delivery
  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [deliveryDate, setDeliveryDate] = useState('');
  const [deliveryTimeSlot, setDeliveryTimeSlot] = useState('02:00 PM - 05:00 PM (Afternoon)');
  const [deliveryAddress, setDeliveryAddress] = useState('');

  const [submitting, setSubmitting] = useState(false);
  const [submittedOrder, setSubmittedOrder] = useState<any | null>(null);

  const cakeSizes = [
    { name: '4-inch Mini Bento', desc: 'Personal 250g, serves 1-2', estPrice: '₹450' },
    { name: '1 Pound (Serves 4-6)', desc: 'Standard celebration tier', estPrice: '₹1,100' },
    { name: '2 Pound (Serves 10-12)', desc: 'Large family gathering', estPrice: '₹2,100' },
    { name: '2-Tier (3 Pound)', desc: 'Grand party showstopper', estPrice: '₹3,400' },
    { name: '3-Tier Luxury Wedding', desc: 'Bespoke floral centerpiece', estPrice: '₹5,500+' },
  ];

  const flavorOptions = [
    { name: 'Belgian Chocolate Truffle', desc: 'Pure 54% Callebaut ganache & dark cocoa' },
    { name: 'Red Velvet Cream Cheese', desc: 'Velvety crimson sponge & rich cream cheese' },
    { name: 'Vanilla Rose Dream', desc: 'Light chiffon, rosewater cream & strawberry compote' },
    { name: 'Butterscotch Salted Caramel', desc: 'Caramel crunch, toffee mousse & butter cake' },
    { name: 'Pistachio Saffron Royale', desc: 'Cardamom infused sponge with roasted pistachio' },
  ];

  const occasions = [
    'Birthday Celebration',
    'Romantic Anniversary',
    'Wedding & Engagement',
    'Baby Shower / Gender Reveal',
    'Corporate Milestone'
  ];

  const handleSubmitCustomOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!customerName.trim() || !customerPhone.trim()) {
      showToast('Please enter your name and phone number', 'error');
      return;
    }

    try {
      setSubmitting(true);

      const instructions = [
        `🎨 Custom Design Studio Order`,
        `Type: ${cakeType}`,
        `Size: ${selectedSize}`,
        `Flavor: ${selectedFlavor}`,
        `Dietary: ${dietary}`,
        cakeMessage ? `Message on Cake: "${cakeMessage}"` : null,
        specialNotes ? `Design Notes: ${specialNotes}` : null,
      ].filter(Boolean).join(' | ');

      const res = await api.post('/orders/public', {
        customer_name: customerName.trim(),
        customer_phone: customerPhone.trim(),
        delivery_address: deliveryAddress.trim() || 'Bakery Pick-up (Park Street)',
        delivery_date: deliveryDate || new Date(Date.now() + 86400000).toISOString().split('T')[0],
        delivery_time: deliveryTimeSlot,
        special_instructions: instructions,
        total_amount: 1100,
        items: []
      });

      setSubmittedOrder(res.data);
      showToast('Custom Cake Order Submitted Successfully!', 'success');
    } catch (err: any) {
      console.error('Custom cake order error:', err);
      showToast(err.response?.data?.detail || 'Failed to submit order. Please try again.', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-cream-100 dark:bg-maroon-950 text-charcoal dark:text-cream-100 flex flex-col font-sans selection:bg-maroon-700 selection:text-cream-100">
      <PublicHeader />

      <main className="flex-1 py-12 lg:py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12">
          
          {/* Header Banner (Neo-Brutalist Editorial) */}
          <div className="text-center max-w-3xl mx-auto space-y-3">
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-cream-50 dark:bg-maroon-900 border-2 border-maroon-950 dark:border-cream-100 text-maroon-950 dark:text-cream-100 text-[11px] font-black uppercase tracking-widest shadow-neo-sm">
              <Sparkles className="w-3.5 h-3.5 text-amber-500 fill-amber-500" />
              <span>Bespoke Atelier Studio</span>
            </div>
            
            <h1 className="text-4xl sm:text-5xl font-black text-maroon-950 dark:text-cream-100 font-serif tracking-tight">
              Design Your Dream Cake
            </h1>
            
            <p className="text-xs sm:text-sm text-charcoal-muted dark:text-cream-300 max-w-xl mx-auto font-medium leading-relaxed">
              Every celebration is unique. Tailor sizes, hand-selected Belgian chocolates, sugar flower detailing, and personalized messages with our master cake designers.
            </p>
          </div>

          {submittedOrder ? (
            /* Order Placed Success View */
            <div className="max-w-2xl mx-auto bg-cream-50 dark:bg-maroon-900 rounded-3xl border-2 border-maroon-950 dark:border-cream-100 p-8 sm:p-12 shadow-neo-lg text-center space-y-6 animate-fadeIn">
              <div className="w-16 h-16 rounded-full bg-emerald-500 text-cream-100 border-2 border-maroon-950 flex items-center justify-center mx-auto shadow-neo-sm">
                <Check className="w-8 h-8 stroke-[3]" />
              </div>

              <div className="space-y-2">
                <span className="text-[11px] uppercase font-bold tracking-widest text-maroon-700 dark:text-cream-300 font-sans block">
                  Studio Request Received
                </span>
                <h2 className="text-2xl sm:text-3xl font-black font-serif text-maroon-950 dark:text-cream-100">
                  Thank You, {customerName}!
                </h2>
                <p className="text-xs sm:text-sm text-charcoal-muted dark:text-cream-200">
                  Your custom order <strong className="text-maroon-950 dark:text-cream-100 font-mono">#{submittedOrder.order_number}</strong> has been logged in our bakery production pipeline. Our head decorator will contact you on <strong className="text-maroon-950 dark:text-cream-100">{customerPhone}</strong> to review final visual details.
                </p>
              </div>

              <div className="p-4 bg-cream-100 dark:bg-maroon-950/60 rounded-2xl border-2 border-maroon-950/20 text-left text-xs space-y-1.5 font-medium">
                <div><strong>Size:</strong> {selectedSize}</div>
                <div><strong>Flavor:</strong> {selectedFlavor}</div>
                <div><strong>Dietary:</strong> {dietary}</div>
                {cakeMessage && <div><strong>Cake Message:</strong> &quot;{cakeMessage}&quot;</div>}
                <div><strong>Delivery Date:</strong> {deliveryDate || 'Tomorrow'} ({deliveryTimeSlot})</div>
              </div>

              <button
                onClick={() => setSubmittedOrder(null)}
                className="px-8 py-3.5 bg-maroon-700 text-cream-100 font-black rounded-2xl text-xs uppercase tracking-wider border-2 border-maroon-950 shadow-neo hover:shadow-neo-lg transition"
              >
                Create Another Design
              </button>
            </div>
          ) : (
            /* Customization Form Studio */
            <form onSubmit={handleSubmitCustomOrder} className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
              
              {/* Left Column: Interactive Visual Choices */}
              <div className="lg:col-span-7 space-y-8">
                
                {/* Step 1: Occasion */}
                <div className="bg-cream-50 dark:bg-maroon-900 rounded-3xl border-2 border-maroon-950/20 dark:border-cream-100/20 p-6 shadow-neo-sm space-y-4">
                  <div className="flex items-center gap-2 font-serif font-black text-lg text-maroon-950 dark:text-cream-100">
                    <span className="w-7 h-7 rounded-full bg-maroon-950 text-cream-100 text-xs flex items-center justify-center font-sans font-bold">1</span>
                    <span>Select Celebration Occasion</span>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
                    {occasions.map((occ) => (
                      <button
                        type="button"
                        key={occ}
                        onClick={() => setCakeType(occ)}
                        className={`p-3 rounded-xl border-2 text-xs font-bold font-serif transition text-center ${
                          cakeType === occ
                            ? 'bg-maroon-700 text-cream-100 border-maroon-950 shadow-neo-sm'
                            : 'bg-cream-100 dark:bg-maroon-950 text-maroon-950 dark:text-cream-100 border-maroon-950/20 hover:border-maroon-950'
                        }`}
                      >
                        {occ}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Step 2: Size & Tiers */}
                <div className="bg-cream-50 dark:bg-maroon-900 rounded-3xl border-2 border-maroon-950/20 dark:border-cream-100/20 p-6 shadow-neo-sm space-y-4">
                  <div className="flex items-center gap-2 font-serif font-black text-lg text-maroon-950 dark:text-cream-100">
                    <span className="w-7 h-7 rounded-full bg-maroon-950 text-cream-100 text-xs flex items-center justify-center font-sans font-bold">2</span>
                    <span>Choose Size &amp; Tiers</span>
                  </div>

                  <div className="space-y-2.5">
                    {cakeSizes.map((sz) => (
                      <div
                        key={sz.name}
                        onClick={() => setSelectedSize(sz.name)}
                        className={`p-3.5 rounded-2xl border-2 cursor-pointer transition flex items-center justify-between ${
                          selectedSize === sz.name
                            ? 'bg-cream-100 dark:bg-maroon-950 border-maroon-950 dark:border-cream-100 shadow-neo-sm'
                            : 'bg-cream-100/50 dark:bg-maroon-950/40 border-maroon-950/15 hover:border-maroon-950'
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center ${
                            selectedSize === sz.name ? 'border-maroon-950 bg-maroon-700' : 'border-maroon-950/40'
                          }`}>
                            {selectedSize === sz.name && <div className="w-1.5 h-1.5 rounded-full bg-cream-100" />}
                          </div>
                          <div>
                            <span className="font-serif font-bold text-sm text-maroon-950 dark:text-cream-100 block">{sz.name}</span>
                            <span className="text-[11px] text-charcoal-muted dark:text-cream-300">{sz.desc}</span>
                          </div>
                        </div>
                        <span className="text-xs font-black font-mono text-maroon-950 dark:text-cream-100 px-2.5 py-1 bg-cream-200 dark:bg-maroon-800 rounded-lg border border-maroon-950/20">
                          {sz.estPrice}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Step 3: Gourmet Flavor Selection */}
                <div className="bg-cream-50 dark:bg-maroon-900 rounded-3xl border-2 border-maroon-950/20 dark:border-cream-100/20 p-6 shadow-neo-sm space-y-4">
                  <div className="flex items-center gap-2 font-serif font-black text-lg text-maroon-950 dark:text-cream-100">
                    <span className="w-7 h-7 rounded-full bg-maroon-950 text-cream-100 text-xs flex items-center justify-center font-sans font-bold">3</span>
                    <span>Signature Flavor Formulation</span>
                  </div>

                  <div className="space-y-2.5">
                    {flavorOptions.map((flv) => (
                      <div
                        key={flv.name}
                        onClick={() => setSelectedFlavor(flv.name)}
                        className={`p-3.5 rounded-2xl border-2 cursor-pointer transition flex items-center justify-between ${
                          selectedFlavor === flv.name
                            ? 'bg-cream-100 dark:bg-maroon-950 border-maroon-950 dark:border-cream-100 shadow-neo-sm'
                            : 'bg-cream-100/50 dark:bg-maroon-950/40 border-maroon-950/15 hover:border-maroon-950'
                        }`}
                      >
                        <div>
                          <span className="font-serif font-bold text-sm text-maroon-950 dark:text-cream-100 block">{flv.name}</span>
                          <span className="text-[11px] text-charcoal-muted dark:text-cream-300">{flv.desc}</span>
                        </div>
                        {selectedFlavor === flv.name && (
                          <CheckCircle2 className="w-5 h-5 text-maroon-700 dark:text-amber-400 shrink-0" />
                        )}
                      </div>
                    ))}
                  </div>
                </div>

                {/* Step 4: Dietary & Custom Writing */}
                <div className="bg-cream-50 dark:bg-maroon-900 rounded-3xl border-2 border-maroon-950/20 dark:border-cream-100/20 p-6 shadow-neo-sm space-y-4">
                  <div className="flex items-center gap-2 font-serif font-black text-lg text-maroon-950 dark:text-cream-100">
                    <span className="w-7 h-7 rounded-full bg-maroon-950 text-cream-100 text-xs flex items-center justify-center font-sans font-bold">4</span>
                    <span>Dietary &amp; Message on Cake</span>
                  </div>

                  <div className="space-y-3.5">
                    <div>
                      <label className="text-xs font-bold uppercase tracking-wider text-maroon-950 dark:text-cream-200 block mb-1.5 font-sans">
                        Dietary Preference
                      </label>
                      <div className="grid grid-cols-3 gap-2">
                        {['100% Eggless', 'Standard with Egg', 'Low Sugar'].map((opt) => (
                          <button
                            type="button"
                            key={opt}
                            onClick={() => setDietary(opt)}
                            className={`p-2.5 rounded-xl border-2 text-xs font-bold transition ${
                              dietary === opt
                                ? 'bg-maroon-700 text-cream-100 border-maroon-950 shadow-neo-sm'
                                : 'bg-cream-100 dark:bg-maroon-950 text-maroon-950 dark:text-cream-100 border-maroon-950/20'
                            }`}
                          >
                            {opt}
                          </button>
                        ))}
                      </div>
                    </div>

                    <div>
                      <label className="text-xs font-bold uppercase tracking-wider text-maroon-950 dark:text-cream-200 block mb-1 font-sans">
                        Handwritten Message on Cake (Optional)
                      </label>
                      <input
                        type="text"
                        value={cakeMessage}
                        onChange={(e) => setCakeMessage(e.target.value)}
                        placeholder="e.g. Happy 25th Anniversary Mom & Dad ♡"
                        className="w-full px-4 py-2.5 rounded-xl border-2 border-maroon-950/30 dark:border-cream-100/30 bg-cream-100 dark:bg-maroon-950 text-maroon-950 dark:text-cream-100 text-xs font-medium focus:border-maroon-950 dark:focus:border-cream-100 outline-none"
                      />
                    </div>

                    <div>
                      <label className="text-xs font-bold uppercase tracking-wider text-maroon-950 dark:text-cream-200 block mb-1 font-sans">
                        Pinterest Reference / Special Design Notes
                      </label>
                      <textarea
                        value={specialNotes}
                        onChange={(e) => setSpecialNotes(e.target.value)}
                        rows={3}
                        placeholder="Describe your desired color palette, sugar flowers, theme, or paste an image link..."
                        className="w-full px-4 py-2.5 rounded-xl border-2 border-maroon-950/30 dark:border-cream-100/30 bg-cream-100 dark:bg-maroon-950 text-maroon-950 dark:text-cream-100 text-xs font-medium focus:border-maroon-950 dark:focus:border-cream-100 outline-none"
                      />
                    </div>
                  </div>
                </div>

              </div>

              {/* Right Column: Customer Info & Order Summary Card */}
              <div className="lg:col-span-5 sticky top-28 space-y-6">
                <div className="bg-cream-50 dark:bg-maroon-900 rounded-3xl border-2 border-maroon-950 dark:border-cream-100 p-6 sm:p-8 shadow-neo-lg space-y-6">
                  
                  <div className="border-b-2 border-maroon-950/15 dark:border-cream-100/20 pb-4">
                    <span className="text-[10px] uppercase font-bold tracking-[0.2em] text-maroon-700 dark:text-cream-300 font-sans block">
                      Summary &amp; Delivery
                    </span>
                    <h3 className="font-serif font-black text-2xl text-maroon-950 dark:text-cream-100 mt-0.5">
                      Artisan Commission
                    </h3>
                  </div>

                  {/* Visual Selected Summary */}
                  <div className="p-4 bg-cream-100 dark:bg-maroon-950 rounded-2xl border-2 border-maroon-950/20 space-y-2 text-xs">
                    <div className="flex justify-between">
                      <span className="text-charcoal-muted dark:text-cream-300">Occasion:</span>
                      <strong className="text-maroon-950 dark:text-cream-100">{cakeType}</strong>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-charcoal-muted dark:text-cream-300">Size:</span>
                      <strong className="text-maroon-950 dark:text-cream-100">{selectedSize}</strong>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-charcoal-muted dark:text-cream-300">Flavor:</span>
                      <strong className="text-maroon-950 dark:text-cream-100">{selectedFlavor}</strong>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-charcoal-muted dark:text-cream-300">Dietary:</span>
                      <strong className="text-maroon-950 dark:text-cream-100">{dietary}</strong>
                    </div>
                  </div>

                  {/* Customer Information Inputs */}
                  <div className="space-y-3.5">
                    <div>
                      <label className="text-xs font-bold text-maroon-950 dark:text-cream-200 block mb-1">
                        Your Name *
                      </label>
                      <input
                        type="text"
                        required
                        value={customerName}
                        onChange={(e) => setCustomerName(e.target.value)}
                        placeholder="Full Name"
                        className="w-full px-3.5 py-2.5 rounded-xl border-2 border-maroon-950/30 dark:border-cream-100/30 bg-cream-100 dark:bg-maroon-950 text-maroon-950 dark:text-cream-100 text-xs font-medium outline-none focus:border-maroon-950"
                      />
                    </div>

                    <div>
                      <label className="text-xs font-bold text-maroon-950 dark:text-cream-200 block mb-1">
                        WhatsApp / Phone Number *
                      </label>
                      <input
                        type="tel"
                        required
                        value={customerPhone}
                        onChange={(e) => setCustomerPhone(e.target.value)}
                        placeholder="+91 98765 43210"
                        className="w-full px-3.5 py-2.5 rounded-xl border-2 border-maroon-950/30 dark:border-cream-100/30 bg-cream-100 dark:bg-maroon-950 text-maroon-950 dark:text-cream-100 text-xs font-medium outline-none focus:border-maroon-950"
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-2.5">
                      <div>
                        <label className="text-[11px] font-bold text-maroon-950 dark:text-cream-200 block mb-1">
                          Delivery Date
                        </label>
                        <input
                          type="date"
                          value={deliveryDate}
                          onChange={(e) => setDeliveryDate(e.target.value)}
                          className="w-full px-3 py-2 rounded-xl border-2 border-maroon-950/30 dark:border-cream-100/30 bg-cream-100 dark:bg-maroon-950 text-maroon-950 dark:text-cream-100 text-xs font-medium outline-none"
                        />
                      </div>
                      <div>
                        <label className="text-[11px] font-bold text-maroon-950 dark:text-cream-200 block mb-1">
                          Time Slot
                        </label>
                        <select
                          value={deliveryTimeSlot}
                          onChange={(e) => setDeliveryTimeSlot(e.target.value)}
                          className="w-full px-2 py-2 rounded-xl border-2 border-maroon-950/30 dark:border-cream-100/30 bg-cream-100 dark:bg-maroon-950 text-maroon-950 dark:text-cream-100 text-xs font-medium outline-none"
                        >
                          <option value="10:00 AM - 01:00 PM">Morning (10am-1pm)</option>
                          <option value="02:00 PM - 05:00 PM">Afternoon (2pm-5pm)</option>
                          <option value="06:00 PM - 09:00 PM">Evening (6pm-9pm)</option>
                        </select>
                      </div>
                    </div>

                    <div>
                      <label className="text-xs font-bold text-maroon-950 dark:text-cream-200 block mb-1">
                        Delivery Address in Kolkata
                      </label>
                      <input
                        type="text"
                        value={deliveryAddress}
                        onChange={(e) => setDeliveryAddress(e.target.value)}
                        placeholder="Street, Area, Kolkata (or type 'Self Pickup')"
                        className="w-full px-3.5 py-2.5 rounded-xl border-2 border-maroon-950/30 dark:border-cream-100/30 bg-cream-100 dark:bg-maroon-950 text-maroon-950 dark:text-cream-100 text-xs font-medium outline-none focus:border-maroon-950"
                      />
                    </div>
                  </div>

                  {/* Submission Button */}
                  <button
                    type="submit"
                    disabled={submitting}
                    className="w-full py-4 bg-maroon-700 hover:bg-maroon-800 disabled:opacity-50 text-cream-100 rounded-2xl text-xs sm:text-sm font-black uppercase tracking-wider border-2 border-maroon-950 dark:border-cream-100 shadow-neo hover:shadow-neo-lg hover:-translate-x-0.5 hover:-translate-y-0.5 active:translate-x-0 active:translate-y-0 transition-all flex items-center justify-center gap-2"
                  >
                    <Sparkles className="w-4 h-4 text-amber-300" />
                    <span>{submitting ? 'Submitting Design...' : 'Submit Custom Order Commission'}</span>
                  </button>

                  <p className="text-[11px] text-charcoal-muted dark:text-cream-300/80 text-center font-medium">
                    No immediate online payment required. Our team will verify flavor &amp; design availability via WhatsApp first.
                  </p>
                </div>
              </div>

            </form>
          )}

        </div>
      </main>

      <PublicFooter />
    </div>
  );
}
