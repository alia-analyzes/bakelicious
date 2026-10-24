'use client';

import React, { useState, useEffect } from 'react';
import { Receipt, ReceiptFormData } from '@/types';
import {
  Plus,
  Trash2,
  User,
  Phone,
  MapPin,
  Calendar,
  Clock,
  Sparkles,
  Truck,
  ShoppingBag,
  Flame,
  IndianRupee,
  FileText,
  Eye,
  Save,
  RotateCcw,
  CheckCircle2,
  AlertCircle
} from 'lucide-react';

interface ReceiptFormProps {
  initialData?: Receipt | null;
  nextReceiptNumber: string;
  onSave: (data: ReceiptFormData) => Promise<void>;
  onPreview: (data: ReceiptFormData) => void;
  onReset: () => void;
  isSaving?: boolean;
}

const COMMON_FLAVOURS = [
  'Belgian Chocolate',
  'Dutch Truffle',
  'Red Velvet Cream Cheese',
  'Fresh Blueberry',
  'Butterscotch Crunch',
  'Black Forest Classic',
  'Vanilla Bean Custard',
  'Pineapple Delice',
  'Nutella Hazelnut',
  'Lotus Biscoff',
  'Mango Mascarpone',
  'Strawberry Shortcake'
];

const WEIGHT_OPTIONS = [
  '500 grams (0.5 kg)',
  '1 kg',
  '1.5 kg',
  '2 kg',
  '2.5 kg',
  '3 kg',
  '4 kg',
  '5 kg'
];

const CANDLE_TYPES = [
  'Standard Spiral Candles',
  'Sparkler Candle',
  'Number Candles (0-9)',
  'Metallic Gold/Silver Candles',
  'Musical Rotating Candle',
  'Magic Relighting Candles'
];

export const ReceiptForm: React.FC<ReceiptFormProps> = ({
  initialData,
  nextReceiptNumber,
  onSave,
  onPreview,
  onReset,
  isSaving = false
}) => {
  const getTodayDateStr = () => new Date().toISOString().split('T')[0];

  const [formData, setFormData] = useState<ReceiptFormData>({
    receipt_number: initialData?.receipt_number || nextReceiptNumber,
    receipt_date: initialData?.receipt_date
      ? new Date(initialData.receipt_date).toISOString().split('T')[0]
      : getTodayDateStr(),

    customer_name: initialData?.customer_name || '',
    phone_number: initialData?.phone_number || '',
    customer_address: initialData?.customer_address || '',

    cake_flavour: initialData?.cake_flavour || '',
    cake_weight: initialData?.cake_weight || '1 kg',
    delivery_date: initialData?.delivery_date || getTodayDateStr(),
    delivery_time: initialData?.delivery_time || '04:00 PM',
    order_type: initialData?.order_type || 'Self Pick-up',
    delivery_address: initialData?.delivery_address || '',

    cake_amount: initialData?.cake_amount ?? 0,
    delivery_charges: initialData?.delivery_charges ?? 0,

    candles_required: initialData?.candles_required ?? false,
    candle_type: initialData?.candle_type || '',
    candle_quantity: initialData?.candle_quantity ?? 0,
    candle_price_per_unit: initialData?.candle_price_per_unit ?? 0,
    total_candle_charges: initialData?.total_candle_charges ?? 0,

    final_total: initialData?.final_total ?? 0,
    advance_paid: initialData?.advance_paid ?? 0,
    due_amount: initialData?.due_amount ?? 0,

    notes: initialData?.notes || ''
  });

  const [isDirty, setIsDirty] = useState(false);
  const [showDiscardModal, setShowDiscardModal] = useState(false);
  const [validationError, setValidationError] = useState<string | null>(null);

  const [cakeItems, setCakeItems] = useState<Array<{ id: string; flavour: string; weight: string; amount: number }>>([
    { id: '1', flavour: initialData?.cake_flavour || '', weight: initialData?.cake_weight || '1 kg', amount: Number(initialData?.cake_amount || 0) }
  ]);

  const updateCakeTotals = (items: Array<{ id: string; flavour: string; weight: string; amount: number }>) => {
    const sum = items.reduce((acc, c) => acc + (Number(c.amount) || 0), 0);
    const flavours = items.map(c => c.flavour ? `${c.flavour} (${c.weight})` : '').filter(Boolean).join(', ');
    const weights = items.map(c => c.weight).filter(Boolean).join(', ');
    setFormData(prev => ({
      ...prev,
      cake_amount: sum,
      cake_flavour: flavours || prev.cake_flavour,
      cake_weight: weights || prev.cake_weight,
      items_json: JSON.stringify(items)
    }));
  };

  const handleAddCakeItem = () => {
    const updated = [
      ...cakeItems,
      { id: Date.now().toString(), flavour: '', weight: '1 kg', amount: 0 }
    ];
    setCakeItems(updated);
    updateCakeTotals(updated);
    setIsDirty(true);
  };

  const handleRemoveCakeItem = (index: number) => {
    if (cakeItems.length <= 1) return;
    const updated = cakeItems.filter((_, i) => i !== index);
    setCakeItems(updated);
    updateCakeTotals(updated);
    setIsDirty(true);
  };

  const handleCakeItemChange = (index: number, field: string, value: any) => {
    const updated = [...cakeItems];
    updated[index] = { ...updated[index], [field]: value };
    setCakeItems(updated);
    updateCakeTotals(updated);
    setIsDirty(true);
  };

  // Sync nextReceiptNumber if no initialData
  useEffect(() => {
    if (!initialData && nextReceiptNumber) {
      setFormData(prev => ({
        ...prev,
        receipt_number: nextReceiptNumber
      }));
    }
  }, [nextReceiptNumber, initialData]);

  // If initialData changes (e.g. user selected another receipt to edit)
  useEffect(() => {
    if (initialData) {
      setFormData({
        receipt_number: initialData.receipt_number,
        receipt_date: new Date(initialData.receipt_date).toISOString().split('T')[0],
        customer_name: initialData.customer_name || '',
        phone_number: initialData.phone_number || '',
        customer_address: initialData.customer_address || '',
        cake_flavour: initialData.cake_flavour || '',
        cake_weight: initialData.cake_weight || '1 kg',
        delivery_date: initialData.delivery_date || getTodayDateStr(),
        delivery_time: initialData.delivery_time || '04:00 PM',
        order_type: initialData.order_type || 'Self Pick-up',
        delivery_address: initialData.delivery_address || '',
        cake_amount: Number(initialData.cake_amount || 0),
        delivery_charges: Number(initialData.delivery_charges || 0),
        candles_required: Boolean(initialData.candles_required),
        candle_type: initialData.candle_type || '',
        candle_quantity: Number(initialData.candle_quantity || 0),
        candle_price_per_unit: Number(initialData.candle_price_per_unit || 0),
        total_candle_charges: Number(initialData.total_candle_charges || 0),
        final_total: Number(initialData.final_total || 0),
        advance_paid: Number(initialData.advance_paid || 0),
        due_amount: Number(initialData.due_amount || 0),
        notes: initialData.notes || ''
      });
      let initialCakes = [{ id: '1', flavour: initialData.cake_flavour || '', weight: initialData.cake_weight || '1 kg', amount: Number(initialData.cake_amount || 0) }];
      if (initialData.items_json) {
        try {
          const parsed = JSON.parse(initialData.items_json);
          if (Array.isArray(parsed) && parsed.length > 0) {
            initialCakes = parsed;
          }
        } catch (e) {}
      }
      setCakeItems(initialCakes);
      setIsDirty(false);
    }
  }, [initialData]);

  // Recalculate totals automatically whenever amounts, candles, or delivery change
  useEffect(() => {
    const cakeAmt = Math.max(0, Number(formData.cake_amount) || 0);
    const delCharge = formData.order_type === 'Self Pick-up'
      ? 0
      : Math.max(0, Number(formData.delivery_charges) || 0);

    let candleTotal = 0;
    if (formData.candles_required) {
      const q = Math.max(0, parseInt(String(formData.candle_quantity)) || 0);
      const p = Math.max(0, Number(formData.candle_price_per_unit) || 0);
      candleTotal = Math.round(q * p * 100) / 100;
    }

    const finalTot = Math.round((cakeAmt + delCharge + candleTotal) * 100) / 100;
    const advance = Math.max(0, Number(formData.advance_paid) || 0);
    const due = Math.max(0, Math.round((finalTot - advance) * 100) / 100);

    setFormData(prev => {
      if (
        prev.total_candle_charges === candleTotal &&
        prev.final_total === finalTot &&
        prev.due_amount === due &&
        (prev.order_type === 'Self Pick-up' ? prev.delivery_charges === 0 : true)
      ) {
        return prev;
      }
      return {
        ...prev,
        delivery_charges: prev.order_type === 'Self Pick-up' ? 0 : prev.delivery_charges,
        total_candle_charges: candleTotal,
        final_total: finalTot,
        due_amount: due
      };
    });
  }, [
    formData.cake_amount,
    formData.delivery_charges,
    formData.order_type,
    formData.candles_required,
    formData.candle_quantity,
    formData.candle_price_per_unit,
    formData.advance_paid
  ]);

  const handleChange = (field: keyof ReceiptFormData, value: any) => {
    setIsDirty(true);
    setValidationError(null);
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleOrderTypeChange = (type: 'Self Pick-up' | 'Home Delivery') => {
    setIsDirty(true);
    setFormData(prev => ({
      ...prev,
      order_type: type,
      delivery_charges: type === 'Self Pick-up' ? 0 : prev.delivery_charges,
      delivery_address: type === 'Self Pick-up' ? '' : prev.delivery_address
    }));
  };

  const handleCandlesRequiredChange = (required: boolean) => {
    setIsDirty(true);
    setFormData(prev => ({
      ...prev,
      candles_required: required,
      candle_quantity: required ? (prev.candle_quantity || 1) : 0,
      candle_price_per_unit: required ? (prev.candle_price_per_unit || 50) : 0,
      candle_type: required ? (prev.candle_type || 'Standard Spiral Candles') : ''
    }));
  };

  const validate = (): boolean => {
    if (!formData.customer_name.trim()) {
      setValidationError('Please enter the customer name.');
      return false;
    }
    if (!formData.phone_number.trim()) {
      setValidationError('Please enter the customer phone number.');
      return false;
    }
    if (formData.order_type === 'Home Delivery' && !formData.delivery_address?.trim()) {
      setValidationError('Please enter the delivery address for home delivery.');
      return false;
    }
    if (formData.cake_amount < 0 || isNaN(formData.cake_amount)) {
      setValidationError('Cake amount cannot be negative.');
      return false;
    }
    if (formData.advance_paid < 0 || isNaN(formData.advance_paid)) {
      setValidationError('Advance paid cannot be negative.');
      return false;
    }
    if (formData.advance_paid > formData.final_total && formData.final_total > 0) {
      setValidationError('Advance paid cannot exceed the final total amount.');
      return false;
    }
    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;
    try {
      await onSave({ ...formData, items_json: JSON.stringify(cakeItems) });
      setIsDirty(false);
    } catch (err: any) {
      setValidationError(err?.message || 'Failed to save receipt.');
    }
  };

  const handlePreviewClick = (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;
    onPreview({ ...formData, items_json: JSON.stringify(cakeItems) });
  };

  const handleResetClick = () => {
    if (isDirty) {
      setShowDiscardModal(true);
    } else {
      onReset();
    }
  };

  const confirmDiscard = () => {
    setShowDiscardModal(false);
    setIsDirty(false);
    onReset();
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Validation Banner */}
      {validationError && (
        <div className="p-4 rounded-2xl bg-rose-50 dark:bg-rose-950/80 border border-rose-300 dark:border-rose-700 text-rose-900 dark:text-rose-200 text-xs font-bold flex items-center gap-2 animate-bounce-short">
          <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
          <span>{validationError}</span>
        </div>
      )}

      {/* TOP BAR: Receipt Meta & Quick Controls */}
      <div className="bg-cream-100 dark:bg-maroon-900/90 p-5 rounded-3xl border border-cream-300 dark:border-maroon-800 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <span className="text-[10px] font-extrabold uppercase tracking-widest text-[#7E4049] dark:text-cream-300">
            {initialData ? 'Editing Saved Receipt' : 'New Receipt Generator'}
          </span>
          <div className="flex items-center gap-2 mt-0.5">
            <span className="text-xl sm:text-2xl font-black font-mono text-[#4D1A22] dark:text-cream-100">
              {formData.receipt_number}
            </span>
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-[#FCF1E3] text-[#7E4049] border border-[#7E4049]/30">
              Format: BLX-MMYY-CXX
            </span>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <div className="flex items-center gap-2 bg-white dark:bg-maroon-950 px-3.5 py-2 rounded-2xl border border-cream-300 dark:border-maroon-800 text-xs">
            <Calendar className="w-3.5 h-3.5 text-[#7E4049] dark:text-cream-300" />
            <span className="text-gray-500 font-medium">Receipt Date:</span>
            <input
              type="date"
              value={formData.receipt_date}
              onChange={e => handleChange('receipt_date', e.target.value)}
              className="bg-transparent font-bold text-gray-900 dark:text-cream-100 focus:outline-none cursor-pointer"
            />
          </div>

          <button
            type="button"
            onClick={handleResetClick}
            className="px-3.5 py-2 bg-stone-200 dark:bg-maroon-800 hover:bg-stone-300 dark:hover:bg-maroon-700 text-stone-800 dark:text-cream-200 rounded-2xl text-xs font-bold transition flex items-center gap-1.5"
            title="Create fresh new receipt"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Create New</span>
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* LEFT COLUMN: Customer & Cake Form Inputs (2 Cols on Large) */}
        <div className="lg:col-span-2 space-y-6">
          {/* SECTION 1: Customer Details */}
          <div className="bg-cream-100 dark:bg-maroon-900 p-6 rounded-3xl border border-cream-300 dark:border-maroon-800 shadow-sm space-y-4">
            <div className="flex items-center gap-2 pb-3 border-b border-cream-300/60 dark:border-maroon-800">
              <User className="w-5 h-5 text-[#7E4049] dark:text-cream-300" />
              <h2 className="text-base font-bold text-maroon-950 dark:text-cream-100">
                1. Customer Details
              </h2>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-gray-700 dark:text-cream-200 mb-1">
                  Customer Name <span className="text-rose-500">*</span>
                </label>
                <div className="relative">
                  <input
                    type="text"
                    required
                    placeholder="e.g. Priyanshu Mukherjee"
                    value={formData.customer_name}
                    onChange={e => handleChange('customer_name', e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-2xl bg-white dark:bg-maroon-950 border border-cream-300 dark:border-maroon-700 text-sm font-medium focus:ring-2 focus:ring-[#7E4049] dark:focus:ring-cream-300 focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 dark:text-cream-200 mb-1">
                  Phone Number <span className="text-rose-500">*</span>
                </label>
                <div className="relative">
                  <input
                    type="tel"
                    required
                    placeholder="e.g. 9876543210"
                    value={formData.phone_number}
                    onChange={e => handleChange('phone_number', e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-2xl bg-white dark:bg-maroon-950 border border-cream-300 dark:border-maroon-700 text-sm font-medium focus:ring-2 focus:ring-[#7E4049] dark:focus:ring-cream-300 focus:outline-none"
                  />
                </div>
              </div>

              <div className="sm:col-span-2">
                <label className="block text-xs font-bold text-gray-700 dark:text-cream-200 mb-1">
                  Customer Address <span className="text-gray-400 font-normal">(Optional)</span>
                </label>
                <input
                  type="text"
                  placeholder="e.g. Flat 4B, Silver Oak, Topsia, Kolkata"
                  value={formData.customer_address}
                  onChange={e => handleChange('customer_address', e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-2xl bg-white dark:bg-maroon-950 border border-cream-300 dark:border-maroon-700 text-sm font-medium focus:ring-2 focus:ring-[#7E4049] dark:focus:ring-cream-300 focus:outline-none"
                />
              </div>
            </div>
          </div>

          {/* SECTION 2: Order Details */}
          <div className="bg-cream-100 dark:bg-maroon-900 p-6 rounded-3xl border border-cream-300 dark:border-maroon-800 shadow-sm space-y-4">
            <div className="flex items-center gap-2 pb-3 border-b border-cream-300/60 dark:border-maroon-800">
              <Sparkles className="w-5 h-5 text-[#7E4049] dark:text-cream-300" />
              <h2 className="text-base font-bold text-maroon-950 dark:text-cream-100">
                2. Order Details
              </h2>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Multi-Cake Order Section */}
              <div className="sm:col-span-2 space-y-3">
                <div className="flex items-center justify-between pb-1 border-b border-cream-200 dark:border-maroon-800">
                  <label className="text-xs font-bold text-gray-800 dark:text-cream-100 flex items-center gap-1.5">
                    <span>Cakes in this Order</span>
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-[#7E4049]/10 text-[#7E4049] dark:text-cream-200">
                      {cakeItems.length} {cakeItems.length === 1 ? 'Cake' : 'Cakes'}
                    </span>
                  </label>
                  <button
                    type="button"
                    onClick={handleAddCakeItem}
                    className="px-3 py-1 bg-[#7E4049] hover:bg-[#64262F] text-[#FCF1E3] rounded-xl text-xs font-bold transition flex items-center gap-1 shadow-sm"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    + Add Another Cake
                  </button>
                </div>

                <div className="space-y-3">
                  {cakeItems.map((cake, idx) => (
                    <div
                      key={cake.id || idx}
                      className="p-3.5 rounded-2xl bg-white dark:bg-maroon-950 border border-cream-300 dark:border-maroon-800 shadow-sm space-y-2.5"
                    >
                      <div className="flex items-center justify-between pb-1 border-b border-stone-100 dark:border-maroon-800/60">
                        <span className="text-xs font-black text-[#7E4049] dark:text-cream-200">
                          Cake #{idx + 1}
                        </span>
                        {cakeItems.length > 1 && (
                          <button
                            type="button"
                            onClick={() => handleRemoveCakeItem(idx)}
                            className="text-xs text-rose-500 hover:text-rose-700 flex items-center gap-1 font-bold"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                            Remove
                          </button>
                        )}
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                        <div>
                          <label className="block text-[11px] font-bold text-gray-600 dark:text-cream-300 mb-1">
                            Cake Flavour
                          </label>
                          <input
                            type="text"
                            list="cake-flavours"
                            placeholder="e.g. Belgian Chocolate"
                            value={cake.flavour}
                            onChange={e => handleCakeItemChange(idx, 'flavour', e.target.value)}
                            className="w-full px-3 py-2 rounded-xl bg-stone-50 dark:bg-maroon-900 border border-cream-300 dark:border-maroon-700 text-xs font-medium focus:ring-2 focus:ring-[#7E4049] focus:outline-none"
                          />
                          <datalist id="cake-flavours">
                            {COMMON_FLAVOURS.map(fl => (
                              <option key={fl} value={fl} />
                            ))}
                          </datalist>
                        </div>

                        <div>
                          <label className="block text-[11px] font-bold text-gray-600 dark:text-cream-300 mb-1">
                            Weight
                          </label>
                          <div className="flex gap-1.5">
                            <select
                              value={WEIGHT_OPTIONS.includes(cake.weight || '') ? cake.weight : 'custom'}
                              onChange={e => {
                                if (e.target.value !== 'custom') {
                                  handleCakeItemChange(idx, 'weight', e.target.value);
                                }
                              }}
                              className="w-1/2 px-2 py-2 rounded-xl bg-stone-50 dark:bg-maroon-900 border border-cream-300 dark:border-maroon-700 text-xs font-medium focus:outline-none cursor-pointer"
                            >
                              {WEIGHT_OPTIONS.map(w => (
                                <option key={w} value={w}>{w}</option>
                              ))}
                              <option value="custom">Custom...</option>
                            </select>
                            <input
                              type="text"
                              placeholder="1.2 kg"
                              value={cake.weight}
                              onChange={e => handleCakeItemChange(idx, 'weight', e.target.value)}
                              className="w-1/2 px-2 py-2 rounded-xl bg-stone-50 dark:bg-maroon-900 border border-cream-300 dark:border-maroon-700 text-xs font-medium focus:outline-none"
                            />
                          </div>
                        </div>

                        <div>
                          <label className="block text-[11px] font-bold text-gray-600 dark:text-cream-300 mb-1">
                            Cake Price (₹)
                          </label>
                          <input
                            type="number"
                            min="0"
                            placeholder="0"
                            value={cake.amount || ''}
                            onChange={e => handleCakeItemChange(idx, 'amount', Math.max(0, parseFloat(e.target.value) || 0))}
                            className="w-full px-3 py-2 rounded-xl bg-stone-50 dark:bg-maroon-900 border border-cream-300 dark:border-maroon-700 text-xs font-mono font-bold focus:ring-2 focus:ring-[#7E4049] focus:outline-none"
                          />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 dark:text-cream-200 mb-1">
                  Delivery / Pick-up Date
                </label>
                <input
                  type="date"
                  value={formData.delivery_date}
                  onChange={e => handleChange('delivery_date', e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-2xl bg-white dark:bg-maroon-950 border border-cream-300 dark:border-maroon-700 text-sm font-medium focus:ring-2 focus:ring-[#7E4049] dark:focus:ring-cream-300 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 dark:text-cream-200 mb-1">
                  Delivery / Pick-up Time
                </label>
                <input
                  type="text"
                  placeholder="e.g. 05:30 PM"
                  value={formData.delivery_time}
                  onChange={e => handleChange('delivery_time', e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-2xl bg-white dark:bg-maroon-950 border border-cream-300 dark:border-maroon-700 text-sm font-medium focus:ring-2 focus:ring-[#7E4049] dark:focus:ring-cream-300 focus:outline-none"
                />
              </div>

              {/* Order Type Toggle */}
              <div className="sm:col-span-2">
                <label className="block text-xs font-bold text-gray-700 dark:text-cream-200 mb-1.5">
                  Order Type
                </label>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => handleOrderTypeChange('Self Pick-up')}
                    className={`p-3.5 rounded-2xl border text-xs font-bold flex items-center justify-center gap-2 transition ${
                      formData.order_type === 'Self Pick-up'
                        ? 'bg-[#7E4049] text-[#FCF1E3] border-[#7E4049] shadow-md ring-2 ring-[#7E4049]/30'
                        : 'bg-white dark:bg-maroon-950 text-gray-700 dark:text-cream-200 border-cream-300 dark:border-maroon-700 hover:bg-cream-200/50'
                    }`}
                  >
                    <ShoppingBag className="w-4 h-4" />
                    <span>Self Pick-up (Bakery)</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => handleOrderTypeChange('Home Delivery')}
                    className={`p-3.5 rounded-2xl border text-xs font-bold flex items-center justify-center gap-2 transition ${
                      formData.order_type === 'Home Delivery'
                        ? 'bg-[#7E4049] text-[#FCF1E3] border-[#7E4049] shadow-md ring-2 ring-[#7E4049]/30'
                        : 'bg-white dark:bg-maroon-950 text-gray-700 dark:text-cream-200 border-cream-300 dark:border-maroon-700 hover:bg-cream-200/50'
                    }`}
                  >
                    <Truck className="w-4 h-4" />
                    <span>Home Delivery</span>
                  </button>
                </div>
              </div>

              {/* CONDITIONAL DELIVERY ADDRESS (Shown only when Home Delivery is selected) */}
              {formData.order_type === 'Home Delivery' && (
                <div className="sm:col-span-2 p-4 rounded-2xl bg-blue-50/70 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-800 animate-fadeIn space-y-2">
                  <label className="block text-xs font-bold text-blue-950 dark:text-blue-200">
                    Delivery Address <span className="text-rose-500">*</span>
                  </label>
                  <textarea
                    rows={2}
                    required={formData.order_type === 'Home Delivery'}
                    placeholder="Enter complete delivery address with landmark and pin code..."
                    value={formData.delivery_address || ''}
                    onChange={e => handleChange('delivery_address', e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-2xl bg-white dark:bg-maroon-950 border border-blue-200 dark:border-blue-700 text-sm font-medium focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  />
                  <div className="text-[11px] text-blue-700 dark:text-blue-300">
                    * Deliveries are dispatched from 27/A G.J. Khan Road, Near A.S. Model School, Topsia, Kolkata.
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* SECTION 3: Candles Selection */}
          <div className="bg-cream-100 dark:bg-maroon-900 p-6 rounded-3xl border border-cream-300 dark:border-maroon-800 shadow-sm space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-cream-300/60 dark:border-maroon-800">
              <div className="flex items-center gap-2">
                <Flame className="w-5 h-5 text-[#7E4049] dark:text-cream-300" />
                <h2 className="text-base font-bold text-maroon-950 dark:text-cream-100">
                  3. Celebration Candles
                </h2>
              </div>

              {/* Yes / No Toggle */}
              <div className="flex items-center gap-1.5 bg-white dark:bg-maroon-950 p-1 rounded-2xl border border-cream-300 dark:border-maroon-700 text-xs font-bold">
                <button
                  type="button"
                  onClick={() => handleCandlesRequiredChange(false)}
                  className={`px-3 py-1.5 rounded-xl transition ${
                    !formData.candles_required
                      ? 'bg-[#7E4049] text-[#FCF1E3]'
                      : 'text-gray-600 dark:text-cream-300 hover:text-gray-900'
                  }`}
                >
                  No
                </button>
                <button
                  type="button"
                  onClick={() => handleCandlesRequiredChange(true)}
                  className={`px-3 py-1.5 rounded-xl transition ${
                    formData.candles_required
                      ? 'bg-[#7E4049] text-[#FCF1E3]'
                      : 'text-gray-600 dark:text-cream-300 hover:text-gray-900'
                  }`}
                >
                  Yes
                </button>
              </div>
            </div>

            {/* CONDITIONAL CANDLE FIELDS (Shown ONLY when Candles Required is Yes) */}
            {formData.candles_required && (
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 p-4 rounded-2xl bg-amber-50/60 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 animate-fadeIn">
                <div className="sm:col-span-1">
                  <label className="block text-xs font-bold text-amber-950 dark:text-amber-200 mb-1">
                    Candle Type (Optional)
                  </label>
                  <input
                    type="text"
                    list="candle-types"
                    placeholder="e.g. Magic Candles"
                    value={formData.candle_type || ''}
                    onChange={e => handleChange('candle_type', e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-white dark:bg-maroon-950 border border-amber-200 dark:border-amber-700 text-xs font-medium focus:outline-none"
                  />
                  <datalist id="candle-types">
                    {CANDLE_TYPES.map(ct => (
                      <option key={ct} value={ct} />
                    ))}
                  </datalist>
                </div>

                <div>
                  <label className="block text-xs font-bold text-amber-950 dark:text-amber-200 mb-1">
                    Candle Quantity
                  </label>
                  <input
                    type="number"
                    min="1"
                    placeholder="1"
                    value={formData.candle_quantity || ''}
                    onChange={e => handleChange('candle_quantity', Math.max(0, parseInt(e.target.value) || 0))}
                    className="w-full px-3 py-2 rounded-xl bg-white dark:bg-maroon-950 border border-amber-200 dark:border-amber-700 text-xs font-bold focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-amber-950 dark:text-amber-200 mb-1">
                    Price per Unit (₹)
                  </label>
                  <input
                    type="number"
                    min="0"
                    step="0.5"
                    placeholder="0"
                    value={formData.candle_price_per_unit || ''}
                    onChange={e => handleChange('candle_price_per_unit', Math.max(0, parseFloat(e.target.value) || 0))}
                    className="w-full px-3 py-2 rounded-xl bg-white dark:bg-maroon-950 border border-amber-200 dark:border-amber-700 text-xs font-bold focus:outline-none"
                  />
                </div>

                <div className="sm:col-span-3 pt-2 border-t border-amber-200 dark:border-amber-800 flex items-center justify-between text-xs">
                  <span className="font-semibold text-amber-900 dark:text-amber-200">
                    Total Candle Charges (Qty × Price):
                  </span>
                  <span className="font-mono font-black text-amber-950 dark:text-amber-100 text-sm">
                    ₹{Number(formData.total_candle_charges || 0).toFixed(2)}
                  </span>
                </div>
              </div>
            )}
          </div>

          {/* SECTION 4: Notes / Special Instructions */}
          <div className="bg-cream-100 dark:bg-maroon-900 p-6 rounded-3xl border border-cream-300 dark:border-maroon-800 shadow-sm space-y-3">
            <div className="flex items-center gap-2">
              <FileText className="w-5 h-5 text-[#7E4049] dark:text-cream-300" />
              <h2 className="text-base font-bold text-maroon-950 dark:text-cream-100">
                4. Notes & Custom Instructions
              </h2>
            </div>
            <textarea
              rows={2}
              placeholder="e.g. Message on cake: 'Happy Birthday Ayan!', Eggless preparation, Less sugar..."
              value={formData.notes || ''}
              onChange={e => handleChange('notes', e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-2xl bg-white dark:bg-maroon-950 border border-cream-300 dark:border-maroon-700 text-sm font-medium focus:ring-2 focus:ring-[#7E4049] dark:focus:ring-cream-300 focus:outline-none"
            />
          </div>
        </div>

        {/* RIGHT COLUMN: Live Calculation & Billing Summary Card (1 Col) */}
        <div className="space-y-6">
          <div className="bg-cream-100 dark:bg-maroon-900 p-6 rounded-3xl border border-cream-300 dark:border-maroon-800 shadow-md sticky top-6 space-y-5">
            <div className="flex items-center gap-2 pb-3 border-b border-cream-300/70 dark:border-maroon-800">
              <IndianRupee className="w-5 h-5 text-[#7E4049] dark:text-cream-300" />
              <h3 className="text-base font-black text-maroon-950 dark:text-cream-100">
                Pricing & Live Total
              </h3>
            </div>

            {/* Cake Base Amount Input */}
            <div>
              <label className="block text-xs font-bold text-gray-700 dark:text-cream-200 mb-1">
                Cake / Base Amount (₹) <span className="text-rose-500">*</span>
              </label>
              <div className="relative">
                <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-500 font-bold">₹</span>
                <input
                  type="number"
                  min="0"
                  step="1"
                  required
                  placeholder="0"
                  value={formData.cake_amount || ''}
                  onChange={e => handleChange('cake_amount', Math.max(0, parseFloat(e.target.value) || 0))}
                  className="w-full pl-8 pr-3.5 py-2.5 rounded-2xl bg-white dark:bg-maroon-950 border border-cream-300 dark:border-maroon-700 text-base font-mono font-bold focus:ring-2 focus:ring-[#7E4049] dark:focus:ring-cream-300 focus:outline-none"
                />
              </div>
            </div>

            {/* Delivery Charges Input */}
            <div>
              <div className="flex justify-between items-center mb-1">
                <label className="text-xs font-bold text-gray-700 dark:text-cream-200">
                  Delivery Charges (₹)
                </label>
                {formData.order_type === 'Self Pick-up' && (
                  <span className="text-[10px] text-emerald-600 font-bold">₹0 for Self Pick-up</span>
                )}
              </div>
              <div className="relative">
                <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-500 font-bold">₹</span>
                <input
                  type="number"
                  min="0"
                  step="1"
                  disabled={formData.order_type === 'Self Pick-up'}
                  placeholder="0"
                  value={formData.order_type === 'Self Pick-up' ? 0 : (formData.delivery_charges || '')}
                  onChange={e => handleChange('delivery_charges', Math.max(0, parseFloat(e.target.value) || 0))}
                  className={`w-full pl-8 pr-3.5 py-2.5 rounded-2xl border text-base font-mono font-bold focus:outline-none ${
                    formData.order_type === 'Self Pick-up'
                      ? 'bg-stone-100 dark:bg-maroon-950/40 border-dashed text-gray-400 cursor-not-allowed'
                      : 'bg-white dark:bg-maroon-950 border-cream-300 dark:border-maroon-700 focus:ring-2 focus:ring-[#7E4049]'
                  }`}
                />
              </div>
            </div>

            {/* Breakdown lines */}
            <div className="pt-3 border-t border-cream-300/60 dark:border-maroon-800 space-y-2 text-xs">
              <div className="flex justify-between text-gray-600 dark:text-cream-300/80">
                <span>Base Cake Amount:</span>
                <span className="font-mono font-bold">₹{Number(formData.cake_amount || 0).toFixed(2)}</span>
              </div>

              <div className="flex justify-between text-gray-600 dark:text-cream-300/80">
                <span>Delivery:</span>
                <span className="font-mono font-bold">
                  {formData.order_type === 'Self Pick-up' ? '₹0.00' : `₹${Number(formData.delivery_charges || 0).toFixed(2)}`}
                </span>
              </div>

              {formData.candles_required && (
                <div className="flex justify-between text-gray-600 dark:text-cream-300/80">
                  <span>Candle Charges:</span>
                  <span className="font-mono font-bold">₹{Number(formData.total_candle_charges || 0).toFixed(2)}</span>
                </div>
              )}
            </div>

            {/* FINAL TOTAL (Highlighted) */}
            <div className="p-4 rounded-2xl bg-[#FCF1E3] dark:bg-maroon-950 border-2 border-[#7E4049] dark:border-cream-300/40">
              <div className="text-[10px] font-extrabold uppercase tracking-widest text-[#7E4049] dark:text-cream-300">
                Final Total Amount
              </div>
              <div className="text-2xl font-black font-mono text-[#4D1A22] dark:text-cream-100 mt-0.5">
                ₹{Number(formData.final_total || 0).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </div>
            </div>

            {/* Advance Paid Input */}
            <div>
              <label className="block text-xs font-bold text-gray-700 dark:text-cream-200 mb-1">
                Advance Paid (₹)
              </label>
              <div className="relative">
                <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-500 font-bold">₹</span>
                <input
                  type="number"
                  min="0"
                  step="1"
                  placeholder="0"
                  value={formData.advance_paid || ''}
                  onChange={e => handleChange('advance_paid', Math.max(0, parseFloat(e.target.value) || 0))}
                  className="w-full pl-8 pr-3.5 py-2.5 rounded-2xl bg-white dark:bg-maroon-950 border border-cream-300 dark:border-maroon-700 text-base font-mono font-bold focus:ring-2 focus:ring-[#7E4049] dark:focus:ring-cream-300 focus:outline-none"
                />
              </div>
            </div>

            {/* DUE AMOUNT (Remaining) */}
            <div className={`p-4 rounded-2xl border-2 transition ${
              formData.due_amount > 0
                ? 'bg-amber-50 dark:bg-amber-950/50 border-amber-400 dark:border-amber-700'
                : 'bg-emerald-50 dark:bg-emerald-950/50 border-emerald-400 dark:border-emerald-700'
            }`}>
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-extrabold uppercase tracking-widest text-gray-700 dark:text-cream-200">
                  Remaining Due Amount
                </span>
                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                  formData.due_amount > 0
                    ? 'bg-amber-200 text-amber-900'
                    : 'bg-emerald-200 text-emerald-900'
                }`}>
                  {formData.due_amount > 0 ? 'Due on Handover' : 'Fully Paid'}
                </span>
              </div>
              <div className={`text-2xl font-black font-mono mt-0.5 ${
                formData.due_amount > 0
                  ? 'text-amber-900 dark:text-amber-200'
                  : 'text-emerald-800 dark:text-emerald-200'
              }`}>
                ₹{Number(formData.due_amount || 0).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </div>
            </div>

            {/* BUTTONS: Preview & Save & Generate */}
            <div className="space-y-2 pt-2">
              <button
                type="button"
                onClick={handlePreviewClick}
                className="w-full py-3 px-4 rounded-2xl bg-cream-200 dark:bg-maroon-800 hover:bg-cream-300 dark:hover:bg-maroon-700 text-maroon-900 dark:text-cream-100 font-bold text-xs transition border border-cream-300 dark:border-maroon-700 flex items-center justify-center gap-2 shadow-sm"
              >
                <Eye className="w-4 h-4 text-[#7E4049] dark:text-cream-300" />
                <span>Preview Final Receipt</span>
              </button>

              <button
                type="submit"
                disabled={isSaving}
                className="w-full py-3.5 px-4 rounded-2xl bg-[#7E4049] hover:bg-[#64262F] text-[#FCF1E3] font-black text-sm transition shadow-lg flex items-center justify-center gap-2 disabled:opacity-50"
              >
                {isSaving ? (
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                ) : (
                  <>
                    <Save className="w-4 h-4" />
                    <span>{initialData ? 'Update & Save Receipt' : 'Save & Generate Receipt'}</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* DISCARD CONFIRMATION MODAL */}
      {showDiscardModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="bg-white dark:bg-maroon-900 rounded-3xl max-w-md w-full p-6 shadow-2xl border border-cream-300 dark:border-maroon-800 animate-scaleIn">
            <div className="flex items-center gap-3 text-amber-600 dark:text-amber-400 mb-3">
              <AlertCircle className="w-6 h-6 shrink-0" />
              <h3 className="text-lg font-bold text-gray-900 dark:text-cream-100">
                Discard Unsaved Changes?
              </h3>
            </div>
            <p className="text-xs text-gray-600 dark:text-cream-300/80 leading-relaxed">
              You have unsaved information entered in this receipt form. Discarding will reset the form and any modifications will be lost.
            </p>
            <div className="flex items-center justify-end gap-3 mt-6">
              <button
                type="button"
                onClick={() => setShowDiscardModal(false)}
                className="px-4 py-2 rounded-xl text-xs font-bold text-gray-700 dark:text-cream-200 bg-gray-100 dark:bg-maroon-800 hover:bg-gray-200 transition"
              >
                Keep Editing
              </button>
              <button
                type="button"
                onClick={confirmDiscard}
                className="px-4 py-2 rounded-xl text-xs font-bold text-white bg-rose-600 hover:bg-rose-700 transition shadow-sm"
              >
                Yes, Discard
              </button>
            </div>
          </div>
        </div>
      )}
    </form>
  );
};
