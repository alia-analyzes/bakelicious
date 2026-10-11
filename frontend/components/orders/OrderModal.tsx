'use client';

import React, { useState, useEffect } from 'react';
import { Modal } from '@/components/ui/Modal';
import { Client, Product } from '@/types';
import { api } from '@/lib/api';
import { showToast } from '@/lib/toast';
import { Plus, Trash2, ShoppingBag, Calculator } from 'lucide-react';

interface OrderModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
  onOrderCreated?: () => void;
  clients: Client[];
  products: Product[];
}

interface OrderItemInput {
  product_id: number;
  quantity: number;
  unit_price: number;
  notes?: string;
}

export const OrderModal: React.FC<OrderModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  onOrderCreated,
  clients,
  products,
}) => {
  const [clientId, setClientId] = useState<number | ''>('');
  const [deliveryDate, setDeliveryDate] = useState('');
  const [deliveryTime, setDeliveryTime] = useState('05:00 PM');
  const [items, setItems] = useState<OrderItemInput[]>([]);
  const [discount, setDiscount] = useState<number | ''>(0);
  const [advancePaid, setAdvancePaid] = useState<number | ''>(0);
  const [specialInstructions, setSpecialInstructions] = useState('');
  const [deliveryAddress, setDeliveryAddress] = useState('');
  const [notes, setNotes] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (isOpen) {
      if (clients.length > 0) setClientId(clients[0].id);
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      setDeliveryDate(tomorrow.toISOString().split('T')[0]);
      if (products.length > 0) {
        setItems([{ product_id: products[0].id, quantity: 1, unit_price: products[0].price }]);
      }
      setDiscount(0);
      setAdvancePaid(0);
      setSpecialInstructions('');
      setDeliveryAddress('');
      setNotes('');
    }
  }, [isOpen, clients, products]);

  const handleClientChange = (id: number) => {
    setClientId(id);
    const selected = clients.find((c) => c.id === id);
    if (selected && selected.address) {
      setDeliveryAddress(selected.address);
    }
  };

  const handleAddItem = () => {
    if (products.length === 0) return;
    setItems([
      ...items,
      { product_id: products[0].id, quantity: 1, unit_price: products[0].price },
    ]);
  };

  const handleRemoveItem = (index: number) => {
    setItems(items.filter((_, idx) => idx !== index));
  };

  const handleItemProductChange = (index: number, pid: number) => {
    const prod = products.find((p) => p.id === pid);
    if (!prod) return;
    const updated = [...items];
    updated[index].product_id = pid;
    updated[index].unit_price = prod.price;
    setItems(updated);
  };

  const handleItemQtyChange = (index: number, qty: number) => {
    const updated = [...items];
    updated[index].quantity = Math.max(1, qty);
    setItems(updated);
  };

  const calculateSubtotal = () => {
    return items.reduce((acc, item) => acc + item.quantity * (item.unit_price || 0), 0);
  };

  const subtotal = calculateSubtotal();
  const discNum = Number(discount || 0);
  const finalAmount = Math.max(0, subtotal - discNum);
  const advanceNum = Number(advancePaid || 0);
  const remainingAmount = Math.max(0, finalAmount - advanceNum);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!clientId) {
      showToast('Please select a customer client', 'error');
      return;
    }
    if (!deliveryDate) {
      showToast('Please set a delivery date', 'error');
      return;
    }
    if (items.length === 0) {
      showToast('Order must contain at least one product item', 'error');
      return;
    }
    if (discNum > subtotal) {
      showToast('Discount cannot exceed order subtotal', 'error');
      return;
    }
    if (advanceNum > finalAmount) {
      showToast('Advance payment cannot exceed final order amount', 'error');
      return;
    }

    setSaving(true);
    try {
      const payload = {
        client_id: Number(clientId),
        delivery_date: `${deliveryDate}T12:00:00`,
        delivery_time: deliveryTime,
        items: items.map((i) => ({
          product_id: i.product_id,
          quantity: i.quantity,
          unit_price: i.unit_price,
        })),
        discount: discNum,
        advance_paid: advanceNum,
        special_instructions: specialInstructions,
        delivery_address: deliveryAddress,
        notes,
      };

      await api.post('/orders', payload);
      showToast('Order created successfully!', 'success');
      (onOrderCreated || onSuccess || (() => {}))();
      onClose();
    } catch (err: any) {
      showToast(err.response?.data?.detail || 'Failed to create order', 'error');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Create New Customer Order"
      subtitle="Select client, products, delivery date, advance payment"
      maxWidth="2xl"
    >
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Client & Delivery Info */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Select Client *
            </label>
            <select
              required
              value={clientId}
              onChange={(e) => handleClientChange(Number(e.target.value))}
              className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-bakery-600"
            >
              <option value="">Choose Client...</option>
              {clients.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name} ({c.phone})
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Delivery Date *
            </label>
            <input
              type="date"
              required
              value={deliveryDate}
              onChange={(e) => setDeliveryDate(e.target.value)}
              className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-bakery-600"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Delivery Time
            </label>
            <input
              type="text"
              value={deliveryTime}
              onChange={(e) => setDeliveryTime(e.target.value)}
              placeholder="e.g. 05:00 PM"
              className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-bakery-600"
            />
          </div>
        </div>

        {/* Order Items Table */}
        <div className="p-4 bg-bakery-50 rounded-2xl border border-bakery-200 space-y-3">
          <div className="flex items-center justify-between">
            <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
              Ordered Products
            </h4>
            <button
              type="button"
              onClick={handleAddItem}
              className="px-3 py-1 bg-bakery-600 hover:bg-bakery-700 text-white rounded-lg text-xs font-bold transition flex items-center gap-1 shadow-sm"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Add Item</span>
            </button>
          </div>

          <div className="space-y-2">
            {items.map((item, idx) => (
              <div
                key={idx}
                className="grid grid-cols-12 gap-2 items-center p-3 bg-white rounded-xl border border-bakery-200 shadow-sm"
              >
                <div className="col-span-5">
                  <select
                    value={item.product_id}
                    onChange={(e) => handleItemProductChange(idx, Number(e.target.value))}
                    className="w-full px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-semibold"
                  >
                    {products.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.name} (₹{p.price})
                      </option>
                    ))}
                  </select>
                </div>

                <div className="col-span-3">
                  <input
                    type="number"
                    min="1"
                    value={item.quantity}
                    onChange={(e) => handleItemQtyChange(idx, Number(e.target.value))}
                    placeholder="Qty"
                    className="w-full px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs text-center font-bold"
                  />
                </div>

                <div className="col-span-3 text-right">
                  <span className="text-xs font-extrabold text-slate-900">
                    ₹{(item.quantity * item.unit_price).toFixed(2)}
                  </span>
                </div>

                <div className="col-span-1 text-center">
                  <button
                    type="button"
                    onClick={() => handleRemoveItem(idx)}
                    className="p-1 text-slate-400 hover:text-rose-600 transition"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Pricing Summary Box */}
        <div className="p-4 bg-slate-900 text-white rounded-2xl space-y-3">
          <div className="flex items-center justify-between text-xs text-slate-300">
            <span>Subtotal Amount:</span>
            <span className="font-bold text-white text-sm">₹{subtotal.toFixed(2)}</span>
          </div>

          <div className="grid grid-cols-2 gap-4 pt-2 border-t border-slate-800">
            <div>
              <label className="block text-[11px] font-semibold text-slate-400 mb-1">
                Discount (₹)
              </label>
              <input
                type="number"
                step="0.01"
                value={discount}
                onChange={(e) => setDiscount(e.target.value === '' ? '' : Number(e.target.value))}
                className="w-full px-3 py-1.5 bg-slate-800 border border-slate-700 rounded-xl text-xs font-bold text-white focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-[11px] font-semibold text-slate-400 mb-1">
                Advance Payment (₹)
              </label>
              <input
                type="number"
                step="0.01"
                value={advancePaid}
                onChange={(e) => setAdvancePaid(e.target.value === '' ? '' : Number(e.target.value))}
                className="w-full px-3 py-1.5 bg-slate-800 border border-slate-700 rounded-xl text-xs font-bold text-emerald-400 focus:outline-none"
              />
            </div>
          </div>

          <div className="flex items-center justify-between pt-3 border-t border-slate-800">
            <div>
              <p className="text-[11px] text-slate-400">Final Order Amount</p>
              <p className="text-xl font-black text-white">₹{finalAmount.toFixed(2)}</p>
            </div>

            <div className="text-right">
              <p className="text-[11px] text-slate-400">Remaining Balance</p>
              <p className={`text-xl font-black ${remainingAmount > 0 ? 'text-amber-400' : 'text-emerald-400'}`}>
                ₹{remainingAmount.toFixed(2)}
              </p>
            </div>
          </div>
        </div>

        {/* Special Instructions & Address */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Delivery Address
            </label>
            <input
              type="text"
              value={deliveryAddress}
              onChange={(e) => setDeliveryAddress(e.target.value)}
              placeholder="Delivery location..."
              className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-bakery-600"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Special Instructions
            </label>
            <input
              type="text"
              value={specialInstructions}
              onChange={(e) => setSpecialInstructions(e.target.value)}
              placeholder="e.g. Write 'Happy Birthday' on cake"
              className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-bakery-600"
            />
          </div>
        </div>

        {/* Form Action Buttons */}
        <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 bg-slate-100 text-slate-700 hover:bg-slate-200 text-xs font-semibold rounded-xl transition"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={saving}
            className="px-5 py-2 bg-bakery-600 hover:bg-bakery-700 text-white text-xs font-bold rounded-xl transition shadow-md shadow-bakery-600/20 disabled:opacity-50"
          >
            {saving ? 'Creating Order...' : 'Place Order'}
          </button>
        </div>
      </form>
    </Modal>
  );
};
