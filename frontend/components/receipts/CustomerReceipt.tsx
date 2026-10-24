'use client';

import React, { useRef, useState, useEffect } from 'react';
import { Receipt } from '@/types';
import { Printer, Download } from 'lucide-react';

interface CustomerReceiptProps {
  receipt: Receipt;
  onEdit?: () => void;
  showActions?: boolean;
}

export const CustomerReceipt: React.FC<CustomerReceiptProps> = ({
  receipt,
  onEdit,
  showActions = true,
}) => {
  const receiptRef = useRef<HTMLDivElement>(null);
  const [logoDataUrl, setLogoDataUrl] = useState<string>('/logo.png');
  const [isGeneratingPdf, setIsGeneratingPdf] = useState(false);

  // Pre-convert /logo.png to data URL to guarantee html2canvas renders it without any async or CORS issues
  useEffect(() => {
    const img = new window.Image();
    img.crossOrigin = 'anonymous';
    img.src = '/logo.png';
    img.onload = () => {
      try {
        const canvas = document.createElement('canvas');
        canvas.width = img.naturalWidth || img.width;
        canvas.height = img.naturalHeight || img.height;
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.drawImage(img, 0, 0);
          setLogoDataUrl(canvas.toDataURL('image/png'));
        }
      } catch (e) {
        console.warn('Could not convert logo to base64, using fallback /logo.png', e);
      }
    };
  }, []);

  const handlePrint = () => {
    window.print();
  };

  const handleDownloadPdf = async () => {
    const element = receiptRef.current;
    if (!element) return;
    setIsGeneratingPdf(true);
    try {
      const html2pdf = (await import('html2pdf.js')).default;
      const opt: any = {
        margin: [4, 4, 4, 4],
        filename: `${receipt.receipt_number || 'Bakelicious-Receipt'}.pdf`,
        image: { type: 'jpeg', quality: 0.98 },
        html2canvas: {
          scale: 2,
          useCORS: true,
          letterRendering: true,
          scrollY: 0,
          scrollX: 0,
          backgroundColor: '#ffffff'
        },
        jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' },
        pagebreak: { mode: ['avoid-all', 'css', 'legacy'] }
      };
      await html2pdf().set(opt).from(element).save();
    } catch (err) {
      console.error('html2pdf error:', err);
      window.print();
    } finally {
      setIsGeneratingPdf(false);
    }
  };

  const formatDate = (dateStr?: string) => {
    if (!dateStr) return '—';
    try {
      const d = new Date(dateStr);
      if (isNaN(d.getTime())) return dateStr;
      return d.toLocaleDateString('en-IN', {
        day: '2-digit',
        month: 'short',
        year: 'numeric'
      });
    } catch {
      return dateStr;
    }
  };

  // Helper to extract multiple cakes or fallback to single cake
  const getCakeItems = (): Array<{ flavour: string; weight: string; amount: number }> => {
    if (receipt.items_json) {
      try {
        const parsed = JSON.parse(receipt.items_json);
        if (Array.isArray(parsed) && parsed.length > 0) {
          return parsed.map((item: any) => ({
            flavour: item.flavour || 'Custom Cake',
            weight: item.weight || '1 kg',
            amount: Number(item.amount || 0)
          }));
        }
      } catch (e) {
        // ignore and fallback
      }
    }
    if (receipt.items && Array.isArray(receipt.items) && receipt.items.length > 0) {
      return receipt.items.map(item => ({
        flavour: item.flavour || 'Custom Cake',
        weight: item.weight || '1 kg',
        amount: Number(item.amount || 0)
      }));
    }
    return [
      {
        flavour: receipt.cake_flavour || 'Custom Cake',
        weight: receipt.cake_weight || '1 kg',
        amount: Number(receipt.cake_amount || 0)
      }
    ];
  };

  const cakeItems = getCakeItems();

  return (
    <div className="w-full flex flex-col items-center">
      {/* Top action toolbar (Screen only) */}
      {showActions && (
        <div className="no-print w-full max-w-2xl mb-3 flex flex-wrap items-center justify-between gap-3 bg-[#FCF1E3] p-3.5 rounded-2xl border border-[#a74e5b]/30 shadow-sm">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-[#a74e5b] animate-pulse"></span>
            <span className="text-xs font-bold text-[#a74e5b]">
              Receipt Preview: <span className="font-mono text-[#a74e5b] underline">{receipt.receipt_number}</span>
            </span>
          </div>

          <div className="flex items-center gap-2">
            {onEdit && (
              <button
                type="button"
                onClick={onEdit}
                className="px-3.5 py-1.5 bg-white hover:bg-[#FCF1E3] text-[#a74e5b] rounded-xl text-xs font-bold transition flex items-center gap-1.5 border border-[#a74e5b]/40 shadow-sm"
              >
                Edit Details
              </button>
            )}

            <button
              type="button"
              disabled={isGeneratingPdf}
              onClick={handleDownloadPdf}
              className="px-4 py-1.5 bg-[#a74e5b] hover:bg-[#8f3e4a] text-white rounded-xl text-xs font-bold transition shadow-md flex items-center gap-1.5 disabled:opacity-70"
            >
              <Download className="w-4 h-4" />
              {isGeneratingPdf ? 'Generating PDF...' : 'Download as PDF'}
            </button>

            <button
              type="button"
              onClick={handlePrint}
              className="px-4 py-1.5 bg-white hover:bg-[#FCF1E3] text-[#a74e5b] border border-[#a74e5b]/40 rounded-xl text-xs font-bold transition shadow-sm flex items-center gap-1.5"
            >
              <Printer className="w-4 h-4" />
              Print Receipt
            </button>
          </div>
        </div>
      )}

      {/* The Printable Receipt Card (Clean text-only, single-page A4, unified font family) */}
      <div
        id="printable-receipt-card"
        ref={receiptRef}
        className="printable-receipt-wrapper w-full max-w-[740px] bg-white text-gray-900 p-5 rounded-2xl shadow-xl border border-[#a74e5b]/20 relative overflow-hidden font-sans"
        style={{
          boxSizing: 'border-box',
          backgroundColor: '#ffffff',
          color: '#1f2937',
          width: '100%',
          maxWidth: '740px',
          fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif",
          pageBreakInside: 'avoid',
          breakInside: 'avoid'
        }}
      >
        {/* Decorative Top Accent Bar in #a74e5b */}
        <div
          className="absolute top-0 left-0 right-0 h-2.5"
          style={{ backgroundColor: '#a74e5b' }}
        />

        {/* Header Section: Logo on Top Left + 1-Line Date & 1-Line Receipt Number on Top Right */}
        <div className="flex flex-row items-center justify-between gap-3 pb-3 border-b-2 border-dashed border-[#a74e5b]/25 mt-1">
          {/* Logo and Brand in Top Left Corner */}
          <div className="flex items-center gap-3">
            <div
              className="relative w-16 h-16 shrink-0 rounded-2xl p-1.5 shadow-sm border flex items-center justify-center overflow-hidden"
              style={{ backgroundColor: '#FCF1E3', borderColor: 'rgba(167, 78, 91, 0.3)' }}
            >
              <img
                src={logoDataUrl}
                alt="Bakelicious Logo"
                className="w-full h-full object-contain"
                style={{ width: '100%', height: '100%', objectFit: 'contain' }}
              />
            </div>
            <div>
              <h1
                className="text-2xl sm:text-3xl font-black tracking-tight"
                style={{ color: '#a74e5b' }}
              >
                BAKELICIOUS
              </h1>
              <div
                className="text-xs font-bold mt-0.5"
                style={{ color: '#a74e5b' }}
              >
                <span>Contact: <strong>9903278826</strong></span>
              </div>
            </div>
          </div>

          {/* Top Right: Date First (1-line cream box), Receipt Number Second (1-line cream box) */}
          <div className="text-right flex flex-col items-end gap-1 shrink-0">
            {/* 1. Date First in Cream Box (1 line only) */}
            <div
              className="px-2.5 py-1 rounded-xl border shadow-sm"
              style={{ backgroundColor: '#FCF1E3', borderColor: 'rgba(167, 78, 91, 0.35)' }}
            >
              <span className="text-[11px] font-black uppercase tracking-wider" style={{ color: '#a74e5b' }}>
                Date: <strong className="font-bold text-gray-900">{formatDate(receipt.receipt_date)}</strong>
              </span>
            </div>

            {/* 2. Receipt Number Second in Cream Box (1 line only) */}
            <div
              className="px-2.5 py-1 rounded-xl border shadow-sm"
              style={{ backgroundColor: '#FCF1E3', borderColor: 'rgba(167, 78, 91, 0.35)' }}
            >
              <span className="text-[11px] font-black uppercase tracking-wider" style={{ color: '#a74e5b' }}>
                Receipt Number: <strong className="font-bold text-gray-900 font-mono">{receipt.receipt_number}</strong>
              </span>
            </div>
          </div>
        </div>

        {/* Bakery Address Line in Cream Box (Near A.S. Model School) */}
        <div
          className="py-1.5 px-3 rounded-xl my-2 text-xs border"
          style={{
            backgroundColor: '#FCF1E3',
            borderColor: 'rgba(167, 78, 91, 0.3)',
            color: '#a74e5b'
          }}
        >
          <strong style={{ color: '#a74e5b' }}>Bakery Address:</strong> 27/A, G.J. Khan Road, Near A.S. Model School, Topsia, Kolkata – 700039
        </div>

        {/* Customer & Order Type Grid: Matching cream boxes, no box line around Home Delivery */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 my-2">
          {/* Customer Card: Cream Box with 3 Cream sub-boxes inside */}
          <div
            className="p-2.5 rounded-2xl border flex flex-col justify-between"
            style={{
              backgroundColor: '#FCF1E3',
              borderColor: 'rgba(167, 78, 91, 0.3)'
            }}
          >
            {/* 1. Customer Name */}
            <div
              className="p-1.5 px-2.5 rounded-xl border mb-1.5 flex items-center justify-between"
              style={{
                backgroundColor: '#FCF1E3',
                borderColor: 'rgba(167, 78, 91, 0.35)'
              }}
            >
              <span className="text-[10px] font-black uppercase tracking-wider" style={{ color: '#a74e5b' }}>
                Customer Name:
              </span>
              <span className="text-xs font-bold text-gray-900">
                {receipt.customer_name || 'Walk-in Customer'}
              </span>
            </div>

            {/* 2. Phone Number */}
            <div
              className="p-1.5 px-2.5 rounded-xl border mb-1.5 flex items-center justify-between"
              style={{
                backgroundColor: '#FCF1E3',
                borderColor: 'rgba(167, 78, 91, 0.35)'
              }}
            >
              <span className="text-[10px] font-black uppercase tracking-wider" style={{ color: '#a74e5b' }}>
                Phone Number:
              </span>
              <span className="text-xs font-bold text-gray-900 font-mono">
                {receipt.phone_number || 'N/A'}
              </span>
            </div>

            {/* 3. Address */}
            <div
              className="p-1.5 px-2.5 rounded-xl border flex items-start justify-between gap-1"
              style={{
                backgroundColor: '#FCF1E3',
                borderColor: 'rgba(167, 78, 91, 0.35)'
              }}
            >
              <span className="text-[10px] font-black uppercase tracking-wider shrink-0 mt-0.5" style={{ color: '#a74e5b' }}>
                Address:
              </span>
              <span className="text-xs font-medium text-gray-900 text-right leading-tight">
                {receipt.customer_address || 'N/A'}
              </span>
            </div>
          </div>

          {/* Order Type Card: Cream Box, NO box line around Home Delivery */}
          <div
            className="p-2.5 rounded-2xl border flex flex-col justify-between"
            style={{
              backgroundColor: '#FCF1E3',
              borderColor: 'rgba(167, 78, 91, 0.3)'
            }}
          >
            {/* 1. Order Type (Notice: box line removed from Home Delivery, matching Customer Name on the left) */}
            <div
              className="p-1.5 px-2.5 rounded-xl border mb-1.5 flex items-center justify-between"
              style={{
                backgroundColor: '#FCF1E3',
                borderColor: 'rgba(167, 78, 91, 0.35)'
              }}
            >
              <span className="text-[10px] font-black uppercase tracking-wider" style={{ color: '#a74e5b' }}>
                Order Type:
              </span>
              <span className="text-xs font-bold text-gray-900 uppercase">
                {receipt.order_type === 'Home Delivery' ? 'Home Delivery' : 'Self Pick-up'}
              </span>
            </div>

            {/* 2. Order Date */}
            <div
              className="p-1.5 px-2.5 rounded-xl border mb-1.5 flex items-center justify-between"
              style={{
                backgroundColor: '#FCF1E3',
                borderColor: 'rgba(167, 78, 91, 0.35)'
              }}
            >
              <span className="text-[10px] font-black uppercase tracking-wider" style={{ color: '#a74e5b' }}>
                Order Date:
              </span>
              <span className="text-xs font-bold text-gray-900">
                {receipt.delivery_date ? formatDate(receipt.delivery_date) : 'Pending Schedule'}
                {receipt.delivery_time ? ` at ${receipt.delivery_time}` : ''}
              </span>
            </div>

            {/* 3. Deliver To / Pick-up Location */}
            <div
              className="p-1.5 px-2.5 rounded-xl border flex items-start justify-between gap-1"
              style={{
                backgroundColor: '#FCF1E3',
                borderColor: 'rgba(167, 78, 91, 0.35)'
              }}
            >
              <span className="text-[10px] font-black uppercase tracking-wider shrink-0 mt-0.5" style={{ color: '#a74e5b' }}>
                {receipt.order_type === 'Home Delivery' ? 'Deliver To:' : 'Pick-up:'}
              </span>
              <span className="text-xs font-medium text-gray-900 text-right leading-tight">
                {receipt.order_type === 'Home Delivery'
                  ? (receipt.delivery_address || 'Delivery Address Pending')
                  : 'Bakelicious Bakery (Near A.S. Model School, Topsia)'}
              </span>
            </div>
          </div>
        </div>

        {/* Order Details in Cream Box */}
        <div
          className="p-3 rounded-2xl border my-2"
          style={{
            backgroundColor: '#FCF1E3',
            borderColor: 'rgba(167, 78, 91, 0.3)'
          }}
        >
          <div
            className="text-[11px] font-black uppercase tracking-wider mb-2 flex items-center justify-between"
            style={{ color: '#a74e5b' }}
          >
            <span>Order Details {cakeItems.length > 1 ? `(${cakeItems.length} Cakes Ordered)` : ''}</span>
            {cakeItems.length > 1 && (
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-md border" style={{ backgroundColor: '#FCF1E3', borderColor: '#a74e5b', color: '#a74e5b' }}>
                Multi-Cake Order
              </span>
            )}
          </div>

          <div className="space-y-2">
            {cakeItems.map((item, idx) => (
              <div
                key={idx}
                className="grid grid-cols-2 sm:grid-cols-3 gap-2 pb-1.5 border-b last:border-b-0 border-[#a74e5b]/20 text-xs"
              >
                <div>
                  <div className="text-[10px] font-bold uppercase tracking-wider" style={{ color: '#a74e5b' }}>
                    {cakeItems.length > 1 ? `Cake #${idx + 1} Flavour` : 'Flavour'}
                  </div>
                  <div className="font-bold text-gray-900">{item.flavour || 'Standard / Custom'}</div>
                </div>
                <div>
                  <div className="text-[10px] font-bold uppercase tracking-wider" style={{ color: '#a74e5b' }}>
                    Weight
                  </div>
                  <div className="font-bold text-gray-900">{item.weight || '1 kg'}</div>
                </div>
                <div>
                  <div className="text-[10px] font-bold uppercase tracking-wider" style={{ color: '#a74e5b' }}>
                    {cakeItems.length > 1 ? 'Cake Price' : 'Celebration Candles'}
                  </div>
                  <div className="font-bold text-gray-900">
                    {cakeItems.length > 1 ? (
                      <span className="font-mono text-[#a74e5b]">₹{Number(item.amount || 0).toFixed(2)}</span>
                    ) : receipt.candles_required ? (
                      <span style={{ color: '#a74e5b' }}>Yes ({receipt.candle_quantity} pcs{receipt.candle_type ? ` - ${receipt.candle_type}` : ''})</span>
                    ) : (
                      <span className="text-gray-500">No</span>
                    )}
                  </div>
                </div>
              </div>
            ))}

            {cakeItems.length > 1 && (
              <div className="pt-1 flex items-center justify-between text-xs font-semibold">
                <span style={{ color: '#a74e5b' }}>Celebration Candles:</span>
                <span>
                  {receipt.candles_required ? (
                    <span style={{ color: '#a74e5b' }}>Yes ({receipt.candle_quantity} pcs{receipt.candle_type ? ` - ${receipt.candle_type}` : ''})</span>
                  ) : (
                    <span className="text-gray-500">No</span>
                  )}
                </span>
              </div>
            )}
          </div>
        </div>

        {/* Financial Breakdown Table in Cream Theme */}
        <div
          className="my-2 overflow-hidden rounded-2xl border shadow-sm"
          style={{ borderColor: 'rgba(167, 78, 91, 0.3)' }}
        >
          <table className="w-full text-left text-xs border-collapse">
            <thead
              style={{
                backgroundColor: '#a74e5b',
                color: '#FCF1E3'
              }}
            >
              <tr>
                <th className="py-2 px-3 font-bold text-[11px] uppercase tracking-wider" style={{ width: '55%' }}>
                  Order Details
                </th>
                <th className="py-2 px-3 text-center font-bold text-[11px] uppercase tracking-wider" style={{ width: '20%' }}>
                  Qty / Rate
                </th>
                <th className="py-2 px-3 text-right font-bold text-[11px] uppercase tracking-wider" style={{ width: '25%' }}>
                  Amount (₹)
                </th>
              </tr>
            </thead>
            <tbody
              className="divide-y divide-[#a74e5b]/20"
              style={{ backgroundColor: '#FCF1E3' }}
            >
              {cakeItems.map((item, idx) => (
                <tr key={idx} style={{ backgroundColor: '#FCF1E3' }}>
                  <td className="py-2 px-3">
                    <div className="font-bold text-gray-900">
                      Cake {cakeItems.length > 1 ? `#${idx + 1}: ` : ''}{item.flavour || 'Custom Cake'}
                    </div>
                    <div className="text-[10px] text-gray-600">
                      Weight: {item.weight || '1 kg'}
                    </div>
                  </td>
                  <td className="py-2 px-3 text-center text-gray-700 font-medium">
                    1 unit
                  </td>
                  <td className="py-2 px-3 text-right font-bold text-gray-900 font-mono">
                    ₹{Number(item.amount || 0).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </td>
                </tr>
              ))}

              {/* Delivery Charges Row */}
              <tr style={{ backgroundColor: '#FCF1E3' }}>
                <td className="py-1.5 px-3">
                  <div className="font-bold text-gray-900">Delivery Charges</div>
                  <div className="text-[10px] text-gray-600">
                    {receipt.order_type === 'Self Pick-up' ? 'Customer Self Pick-up from Topsia Bakery' : 'Direct Doorstep Delivery'}
                  </div>
                </td>
                <td className="py-1.5 px-3 text-center text-gray-700 font-medium">
                  {receipt.order_type === 'Self Pick-up' ? 'Pick-up' : '1 trip'}
                </td>
                <td className="py-1.5 px-3 text-right font-bold text-gray-900 font-mono">
                  {receipt.order_type === 'Self Pick-up' ? (
                    <span style={{ color: '#a74e5b', fontWeight: 'bold' }}>₹0.00</span>
                  ) : (
                    `₹${Number(receipt.delivery_charges || 0).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
                  )}
                </td>
              </tr>

              {/* Candles Row: Only quantity written in Qty column, price in Amount column */}
              {receipt.candles_required && (
                <tr style={{ backgroundColor: '#FCF1E3' }}>
                  <td className="py-1.5 px-3">
                    <div className="font-bold text-gray-900">
                      Celebration Candles {receipt.candle_type ? `(${receipt.candle_type})` : ''}
                    </div>
                    <div className="text-[10px] text-gray-600">
                      Special decorative candles for celebration
                    </div>
                  </td>
                  <td className="py-1.5 px-3 text-center text-gray-700 font-medium">
                    {receipt.candle_quantity || 0} pcs
                  </td>
                  <td className="py-1.5 px-3 text-right font-bold text-gray-900 font-mono">
                    ₹{Number(receipt.total_candle_charges || 0).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </td>
                </tr>
              )}
            </tbody>
          </table>

          {/* Totals Summary Footer in Cream Box */}
          <div
            className="border-t p-3 space-y-1.5"
            style={{
              backgroundColor: '#FCF1E3',
              borderColor: 'rgba(167, 78, 91, 0.3)'
            }}
          >
            <div className="flex justify-between items-center text-xs">
              <span className="font-bold" style={{ color: '#a74e5b' }}>
                {cakeItems.length > 1 ? `Total Cake Amount (${cakeItems.length} Cakes):` : 'Cake / Base Amount:'}
              </span>
              <span className="font-mono font-bold text-gray-800">₹{Number(receipt.cake_amount || 0).toFixed(2)}</span>
            </div>

            <div className="flex justify-between items-center text-xs">
              <span className="font-bold" style={{ color: '#a74e5b' }}>Delivery Charges:</span>
              <span className="font-mono font-bold text-gray-800">₹{Number(receipt.delivery_charges || 0).toFixed(2)}</span>
            </div>

            {receipt.candles_required && (
              <div className="flex justify-between items-center text-xs">
                <span className="font-bold" style={{ color: '#a74e5b' }}>Candle Charges:</span>
                <span className="font-mono font-bold text-gray-800">₹{Number(receipt.total_candle_charges || 0).toFixed(2)}</span>
              </div>
            )}

            <div
              className="pt-1.5 border-t flex justify-between items-center text-sm"
              style={{ borderColor: 'rgba(167, 78, 91, 0.3)' }}
            >
              <span className="font-black text-gray-900">Final Total Amount:</span>
              <span
                className="font-black text-base font-mono"
                style={{ color: '#a74e5b' }}
              >
                ₹{Number(receipt.final_total || 0).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </span>
            </div>

            {/* Advance Paid & Remaining Due Amount: BOTH IN BLACK FONT, MATCHING FORMAT & BOX SIZES */}
            <div className="grid grid-cols-2 gap-2 pt-1">
              {/* Advance Paid Box */}
              <div
                className="p-2.5 rounded-xl border flex flex-col justify-between"
                style={{
                  backgroundColor: '#FCF1E3',
                  borderColor: 'rgba(167, 78, 91, 0.4)'
                }}
              >
                <div
                  className="text-[10px] font-black uppercase tracking-wider"
                  style={{ color: '#000000' }}
                >
                  Advance Paid
                </div>
                <div
                  className="text-base font-black font-mono mt-1"
                  style={{ color: '#000000' }}
                >
                  ₹{Number(receipt.advance_paid || 0).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </div>
              </div>

              {/* Remaining Due Amount Box */}
              <div
                className="p-2.5 rounded-xl border flex flex-col justify-between"
                style={{
                  backgroundColor: '#FCF1E3',
                  borderColor: 'rgba(167, 78, 91, 0.4)'
                }}
              >
                <div
                  className="text-[10px] font-black uppercase tracking-wider"
                  style={{ color: '#000000' }}
                >
                  Remaining Due Amount
                </div>
                <div
                  className="text-base font-black font-mono mt-1"
                  style={{ color: '#000000' }}
                >
                  ₹{Number(receipt.due_amount || 0).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Notes / Special Instructions in Cream Box */}
        {receipt.notes && (
          <div
            className="p-2 rounded-xl border my-1.5 text-xs"
            style={{
              backgroundColor: '#FCF1E3',
              borderColor: 'rgba(167, 78, 91, 0.3)'
            }}
          >
            <span className="font-bold" style={{ color: '#a74e5b' }}>Special Instructions / Notes: </span>
            <span className="text-gray-800 italic">{receipt.notes}</span>
          </div>
        )}

        {/* Closing Message Box in Cream Box: Tight compact spacing & same clean font style */}
        <div
          className="my-1.5 text-center px-3 py-1.5 rounded-xl border"
          style={{
            backgroundColor: '#FCF1E3',
            borderColor: 'rgba(167, 78, 91, 0.3)',
            color: '#a74e5b',
            lineHeight: '1.35'
          }}
        >
          <div className="text-[11px] font-medium" style={{ color: '#a74e5b' }}>
            Every order is crafted with love, baked with care, and finished with a unique touch just for you.
          </div>
          <div className="text-[11px] font-medium mt-0.5" style={{ color: '#a74e5b' }}>
            Thank you for choosing Bakelicious!
          </div>
          <div className="text-[11px] font-medium mt-0.5" style={{ color: '#a74e5b' }}>
            For queries or order updates, connect with us on 9903278826 .
          </div>
        </div>

        {/* Footer Seal & Sign */}
        <div
          className="pt-1.5 border-t flex items-center justify-between text-[10px]"
          style={{
            borderColor: 'rgba(167, 78, 91, 0.25)',
            color: '#a74e5b'
          }}
        >
          <div>
            <div className="font-semibold">System Generated Customer Receipt • Bakelicious ERP</div>
            <div className="text-gray-500">Printed on {new Date().toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}</div>
          </div>
          <div className="text-right">
            <div
              className="h-6 border-b w-28 mb-0.5"
              style={{ borderColor: '#a74e5b' }}
            ></div>
            <div className="font-bold" style={{ color: '#a74e5b' }}>Authorized Signatory</div>
          </div>
        </div>
      </div>

      {/* Global CSS for Print Mode to isolate only the receipt on 1 page */}
      <style jsx global>{`
        @media print {
          @page {
            size: A4 portrait;
            margin: 5mm;
          }
          body * {
            visibility: hidden !important;
          }
          #printable-receipt-card,
          #printable-receipt-card * {
            visibility: visible !important;
          }
          #printable-receipt-card {
            position: absolute !important;
            left: 0 !important;
            top: 0 !important;
            width: 100% !important;
            max-width: 100% !important;
            margin: 0 !important;
            padding: 16px !important;
            border: 1px solid rgba(167, 78, 91, 0.3) !important;
            box-shadow: none !important;
            background: #ffffff !important;
            color: #111827 !important;
            page-break-inside: avoid !important;
            break-inside: avoid !important;
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
          }
          .no-print,
          nav,
          header,
          aside,
          button {
            display: none !important;
          }
        }
      `}</style>
    </div>
  );
};
