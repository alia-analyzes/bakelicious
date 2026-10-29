'use client';

import React, { useRef, useState, useEffect } from 'react';
import { Receipt } from '@/types';
import { Printer, Download, Edit3, Phone, MapPin } from 'lucide-react';

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

  // Format as DD/MM/YYYY matching [DD/MM/YYYY] from template
  const formatDate = (dateStr?: string) => {
    if (!dateStr) return '—';
    try {
      const d = new Date(dateStr);
      if (isNaN(d.getTime())) return dateStr;
      const day = String(d.getDate()).padStart(2, '0');
      const month = String(d.getMonth() + 1).padStart(2, '0');
      const year = d.getFullYear();
      return `${day}/${month}/${year}`;
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
            amount: Number(item.amount) || Number(item.price) || 0
          }));
        }
      } catch (e) {
        // Fallback below
      }
    }
    return [
      {
        flavour: receipt.cake_flavour || 'Standard Cake',
        weight: receipt.cake_weight || '1 kg',
        amount: Number(receipt.cake_amount || receipt.final_total || 0)
      }
    ];
  };

  const cakeItems = getCakeItems();
  const issuedDate = receipt.receipt_date || receipt.created_at || new Date().toISOString();

  // Robust 1-page 100% cream PDF generation using html2canvas & jsPDF
  const handleDownloadPdf = async () => {
    const element = receiptRef.current;
    if (!element) return;
    setIsGeneratingPdf(true);
    try {
      const { jsPDF } = await import('jspdf');
      const html2canvas = (await import('html2canvas')).default;

      const clientName = (receipt.customer_name || 'Customer').trim().replace(/[\/\\?%*:|"<>]/g, '_');

      // Capture exact canvas with template cream background #FDF6EB
      const canvas = await html2canvas(element, {
        scale: 2,
        useCORS: true,
        logging: false,
        backgroundColor: '#FDF6EB',
        windowWidth: 794
      });

      // Initialize strictly 1 A4 portrait page (210mm x 297mm)
      const pdf = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4'
      });

      // 1. Paint 100% of the A4 page cream (#FDF6EB = RGB 253, 246, 235) so zero white space exists
      pdf.setFillColor(253, 246, 235);
      pdf.rect(0, 0, 210, 297, 'F');

      // 2. Draw the rendered canvas onto the PDF (fitting exactly 210 x 297 mm)
      const imgData = canvas.toDataURL('image/png');
      pdf.addImage(imgData, 'PNG', 0, 0, 210, 297, undefined, 'FAST');

      // 3. Guarantee strictly 1 page (delete any extra page)
      const getPageCount = () => (pdf as any).getNumberOfPages?.() || (pdf.internal as any)?.getNumberOfPages?.() || 1;
      while (getPageCount() > 1) {
        pdf.deletePage(getPageCount());
      }

      pdf.save(`${clientName}_invoice.pdf`);
    } catch (err) {
      console.error('PDF export error:', err);
      window.print();
    } finally {
      setIsGeneratingPdf(false);
    }
  };

  return (
    <div className="flex flex-col items-center w-full">
      {/* Google Fonts link for luxury Playfair Display & Plus Jakarta Sans typography */}
      <link
        rel="stylesheet"
        href="https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,600;0,700;0,800;0,900;1,600&family=Plus+Jakarta+Sans:wght@400;500;600;700;800&display=swap"
      />

      {/* Top Action Bar (Print / Download / Edit) - Hidden in Print / Download */}
      {showActions && (
        <div className="no-print w-full max-w-[794px] flex items-center justify-between gap-3 mb-4 p-3 bg-white dark:bg-maroon-900 rounded-2xl border-2 border-maroon-950/20 dark:border-cream-100/20 shadow-md">
          <div className="flex items-center gap-2 text-xs font-bold text-maroon-900 dark:text-cream-100">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse"></span>
            <span>Invoice Ready • {receipt.receipt_number}</span>
          </div>

          <div className="flex items-center gap-2">
            {onEdit && (
              <button
                type="button"
                onClick={onEdit}
                className="px-3.5 py-1.5 rounded-xl border border-maroon-950/30 dark:border-cream-100/30 bg-cream-100 dark:bg-maroon-800 text-maroon-950 dark:text-cream-100 text-xs font-bold hover:bg-cream-200 transition flex items-center gap-1.5"
              >
                <Edit3 className="w-3.5 h-3.5 text-[#540808]" />
                <span>Edit</span>
              </button>
            )}

            <button
              type="button"
              onClick={handlePrint}
              className="px-3.5 py-1.5 rounded-xl border border-maroon-950/30 dark:border-cream-100/30 bg-cream-100 dark:bg-maroon-800 text-maroon-950 dark:text-cream-100 text-xs font-bold hover:bg-cream-200 transition flex items-center gap-1.5"
            >
              <Printer className="w-3.5 h-3.5 text-[#540808]" />
              <span>Print</span>
            </button>

            <button
              type="button"
              onClick={handleDownloadPdf}
              disabled={isGeneratingPdf}
              className="px-4 py-1.5 rounded-xl bg-[#540808] hover:bg-[#3d0505] text-white text-xs font-black shadow-sm transition flex items-center gap-1.5 disabled:opacity-60"
            >
              <Download className="w-3.5 h-3.5" />
              <span>{isGeneratingPdf ? 'Generating 1-Page PDF...' : 'Download PDF'}</span>
            </button>
          </div>
        </div>
      )}

      {/* Horizontal scroll container for responsive preview, preserving exact 794x1122 canvas */}
      <div className="w-full flex justify-center overflow-x-auto p-1">
        {/* The Printable Invoice Page - EXACT MATCH TO USER'S TEMPLATE */}
        <div
          id="printable-receipt-card"
          ref={receiptRef}
          className="printable-receipt-wrapper relative shadow-2xl"
          style={{
            boxSizing: 'border-box',
            backgroundColor: '#FDF6EB',
            color: '#222222',
            width: '794px',
            minWidth: '794px',
            height: '1122px',
            minHeight: '1122px',
            maxHeight: '1122px',
            padding: '36px 44px',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
            fontFamily: "'Plus Jakarta Sans', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
            pageBreakInside: 'avoid',
            breakInside: 'avoid',
            overflow: 'hidden'
          }}
        >
          {/* TOP SECTION: LOGO + BAKELICIOUS, CONTACT & METAS, DIVIDERS, ITEMS, TOTALS & GREETING */}
          <div>
            {/* Row 1: CIRCULAR LOGO ON LEFT + BIG BOLD 'BAKELICIOUS' IN MAROON (UP-ALIGNED WITH LOGO) */}
            <div className="flex items-center gap-6">
              <div className="w-28 h-28 rounded-full border-2 border-[#540808] p-1 flex items-center justify-center shrink-0 overflow-hidden bg-transparent">
                <img
                  src={logoDataUrl}
                  alt="Bakelicious Logo"
                  className="w-full h-full object-contain rounded-full"
                />
              </div>
              <div className="-mt-3.5 sm:-mt-4">
                <h1
                  className="text-4xl sm:text-5xl font-black tracking-wider leading-none text-[#540808]"
                  style={{ fontFamily: "'Playfair Display', Georgia, serif" }}
                >
                  BAKELICIOUS
                </h1>
              </div>
            </div>

            {/* Row 2: CONTACT DETAILS (LEFT) & INVOICE DATE + RECEIPT NO (RIGHT) */}
            <div className="flex items-end justify-between gap-4 mt-4 pt-1">
              {/* Left Column: Phone & Location in small circle icons - perfectly aligned with badges */}
              <div className="space-y-2 text-xs text-[#222222]">
                <div className="flex items-center gap-2.5 leading-none">
                  <div className="w-5 h-5 rounded-full border border-[#540808]/60 flex items-center justify-center shrink-0">
                    <Phone className="w-2.5 h-2.5 text-[#540808]" />
                  </div>
                  <span className="font-semibold text-xs leading-none self-center">9903278826</span>
                </div>
                <div className="flex items-center gap-2.5 max-w-sm">
                  <div className="w-5 h-5 rounded-full border border-[#540808]/60 flex items-center justify-center shrink-0">
                    <MapPin className="w-2.5 h-2.5 text-[#540808]" />
                  </div>
                  <span className="font-medium text-xs leading-tight self-center">
                    27/A, G.J. Khan Road, Near A.S. Model School, Topsia, Kolkata – 700039
                  </span>
                </div>
              </div>

              {/* Right Column: Invoice Date & Receipt No. */}
              <div className="space-y-1.5 text-xs text-right shrink-0">
                <div className="flex items-center justify-end gap-3">
                  <span className="font-bold text-[#540808]">Invoice Date:</span>
                  <span className="font-semibold text-[#222222] font-mono min-w-[90px] text-left">
                    {formatDate(issuedDate)}
                  </span>
                </div>
                <div className="flex items-center justify-end gap-3">
                  <span className="font-bold text-[#540808]">Receipt No.:</span>
                  <span className="font-semibold text-[#222222] font-mono min-w-[90px] text-left">
                    {receipt.receipt_number}
                  </span>
                </div>
              </div>
            </div>

            {/* DIVIDER LINE 1 (Warm Maroon Line) */}
            <div className="w-full border-b border-[#8C5158]/40 my-3.5"></div>

            {/* SECTION 2: BILL TO: (LEFT) & ORDER & DELIVERY SCHEDULE (RIGHT) */}
            <div className="grid grid-cols-2 gap-8 my-2">
              {/* Left Column: BILL TO */}
              <div>
                <h2 className="text-xs font-black tracking-wider uppercase text-[#540808] mb-2">
                  BILL TO:
                </h2>
                <div className="space-y-1 text-xs">
                  <div className="grid grid-cols-[110px_1fr] gap-2">
                    <span className="font-bold text-[#540808]">Customer Name:</span>
                    <span className="font-semibold text-[#222222]">{receipt.customer_name || 'Walk-in Customer'}</span>
                  </div>
                  <div className="grid grid-cols-[110px_1fr] gap-2">
                    <span className="font-bold text-[#540808]">Phone:</span>
                    <span className="font-semibold text-[#222222] font-mono">{receipt.phone_number || 'N/A'}</span>
                  </div>
                  <div className="grid grid-cols-[110px_1fr] gap-2">
                    <span className="font-bold text-[#540808]">Address:</span>
                    <span className="font-medium text-[#222222] leading-tight">{receipt.customer_address || 'N/A'}</span>
                  </div>
                </div>
              </div>

              {/* Right Column: ORDER & DELIVERY SCHEDULE */}
              <div>
                <h2 className="text-xs font-black tracking-wider uppercase text-[#540808] mb-2">
                  ORDER &amp; DELIVERY SCHEDULE
                </h2>
                <div className="space-y-1 text-xs">
                  <div className="grid grid-cols-[115px_1fr] gap-2">
                    <span className="font-bold text-[#540808]">Order Type:</span>
                    <span className="font-semibold text-[#222222]">
                      {receipt.order_type === 'Home Delivery' ? 'Home Delivery' : 'Self Pick-up'}
                    </span>
                  </div>
                  <div className="grid grid-cols-[115px_1fr] gap-2">
                    <span className="font-bold text-[#540808]">Delivery Date:</span>
                    <span className="font-semibold text-[#222222] font-mono">
                      {receipt.delivery_date ? formatDate(receipt.delivery_date) : 'Pending Schedule'}
                      {receipt.delivery_time ? ` (${receipt.delivery_time})` : ''}
                    </span>
                  </div>
                  <div className="grid grid-cols-[115px_1fr] gap-2">
                    <span className="font-bold text-[#540808]">Delivery Address:</span>
                    <span className="font-medium text-[#222222] leading-tight">
                      {receipt.order_type === 'Home Delivery'
                        ? (receipt.delivery_address || 'Delivery Address Pending')
                        : 'Bakelicious Bakery (Near A.S. Model School, Topsia)'}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* DIVIDER LINE 2 */}
            <div className="w-full border-b border-[#8C5158]/40 my-3.5"></div>

            {/* SECTION 3: ITEM DESCRIPTION TABLE */}
            <div className="my-2">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="border-b border-[#8C5158]/60">
                    <th className="py-2 px-1 font-bold text-[11px] uppercase tracking-wider text-[#540808]" style={{ width: '52%' }}>
                      ITEM DESCRIPTION
                    </th>
                    <th className="py-2 px-2 text-center font-bold text-[11px] uppercase tracking-wider text-[#540808]" style={{ width: '28%' }}>
                      QUANTITY / DETAILS
                    </th>
                    <th className="py-2 px-1 text-right font-bold text-[11px] uppercase tracking-wider text-[#540808]" style={{ width: '20%' }}>
                      AMOUNT
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {/* Cake Items */}
                  {cakeItems.map((item, idx) => (
                    <tr key={idx} className="border-b border-[#8C5158]/30">
                      <td className="py-2.5 px-1 font-semibold text-[#222222]">
                        {cakeItems.length > 1 ? `Cake #${idx + 1}: ` : ''}{item.flavour || 'Custom Cake'}
                      </td>
                      <td className="py-2.5 px-2 text-center text-[#222222] font-medium">
                        {item.weight || '1 kg'}, 1 unit
                      </td>
                      <td className="py-2.5 px-1 text-right font-semibold text-[#222222] font-mono">
                        ₹{Number(item.amount || 0).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </td>
                    </tr>
                  ))}

                  {/* Delivery Charges */}
                  <tr className="border-b border-[#8C5158]/30">
                    <td className="py-2.5 px-1 font-semibold text-[#222222]">
                      Delivery Charges
                    </td>
                    <td className="py-2.5 px-2 text-center text-[#222222] font-medium">
                      {receipt.order_type === 'Self Pick-up' ? 'Customer Pick-up' : '1 trip'}
                    </td>
                    <td className="py-2.5 px-1 text-right font-semibold text-[#222222] font-mono">
                      {receipt.order_type === 'Self Pick-up' ? (
                        <span className="font-semibold">₹0.00</span>
                      ) : (
                        `₹${Number(receipt.delivery_charges || 0).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
                      )}
                    </td>
                  </tr>

                  {/* Celebration Candles (if required) */}
                  {receipt.candles_required && (
                    <tr className="border-b border-[#8C5158]/30">
                      <td className="py-2.5 px-1 font-semibold text-[#222222]">
                        Celebration Candles {receipt.candle_type ? `(${receipt.candle_type})` : ''}
                      </td>
                      <td className="py-2.5 px-2 text-center text-[#222222] font-medium">
                        {receipt.candle_quantity || 1} pcs
                      </td>
                      <td className="py-2.5 px-1 text-right font-semibold text-[#222222] font-mono">
                        ₹{Number(receipt.total_candle_charges || 0).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            {/* SECTION 4: SPECIAL INSTRUCTIONS (LEFT) & TOTALS SUMMARY (RIGHT) */}
            <div className="grid grid-cols-2 gap-8 my-4 pt-1 items-start">
              {/* Left Column: SPECIAL INSTRUCTIONS */}
              <div>
                <h3 className="text-xs font-black tracking-wider uppercase text-[#540808] mb-1.5">
                  SPECIAL INSTRUCTIONS
                </h3>
                <p className="text-xs text-[#333333] leading-relaxed">
                  {receipt.notes ? receipt.notes : 'Please pack with celebration ribbon.'}
                </p>
              </div>

              {/* Right Column: TOTALS SUMMARY WITH INDIVIDUAL DIVIDER LINES */}
              <div className="space-y-1.5 text-xs">
                {/* Final Total Amount */}
                <div className="flex justify-between items-center pb-1.5 border-b border-[#8C5158]/40">
                  <span className="font-black uppercase tracking-wider text-[#540808]">
                    FINAL TOTAL AMOUNT
                  </span>
                  <span className="font-bold font-mono text-sm text-[#222222]">
                    ₹{Number(receipt.final_total || 0).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </span>
                </div>

                {/* Advance Paid */}
                <div className="flex justify-between items-center py-1.5 border-b border-[#8C5158]/40">
                  <span className="font-black uppercase tracking-wider text-[#540808]">
                    ADVANCE PAID
                  </span>
                  <span className="font-bold font-mono text-sm text-[#222222]">
                    ₹{Number(receipt.advance_paid || 0).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </span>
                </div>

                {/* Remaining Due Amount */}
                <div className="flex justify-between items-center pt-1.5">
                  <span className="font-black uppercase tracking-wider text-[#540808]">
                    REMAINING DUE AMOUNT
                  </span>
                  <span className="font-black font-mono text-base text-[#222222]">
                    ₹{Number(receipt.due_amount || 0).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* BOTTOM SECTION: CLOSING GREETING & FOOTER (NO FULL-WIDTH LINE) */}
          <div className="mt-auto space-y-7">
            {/* Centered 3-line closing greeting - positioned down towards the bottom */}
            <div className="text-center space-y-0.5">
              <p className="text-xs italic font-serif text-[#6B2A30]">
                Every order is crafted with love, baked with care, and finished with a unique touch just for you.
              </p>
              <p className="text-xs font-bold text-[#540808]">
                Thank you for choosing Bakelicious!
              </p>
              <p className="text-xs font-bold text-[#222222]">
                For queries or order updates, connect with us on 9903278826.
              </p>
            </div>

            {/* Footer: NO BORDER LINE ACROSS BOTTOM */}
            <div className="flex items-end justify-between text-xs pt-1">
              {/* Bottom Left: SYSTEM GENERATED INVOICE • BAKELICIOUS ERP & Official Customer Copy */}
              <div className="text-left space-y-0.5">
                <div className="font-extrabold uppercase tracking-wider text-[11px] text-[#540808]">
                  SYSTEM GENERATED INVOICE • BAKELICIOUS ERP
                </div>
                <div className="text-[10px] text-[#444444] font-medium tracking-wide">
                  Official Customer Copy
                </div>
              </div>

              {/* Bottom Right: Signature Line, Authorized Signatory & Issued on */}
              <div className="text-right flex flex-col items-center">
                <div className="w-48 border-b-2 border-[#540808] mb-1.5"></div>
                <div className="font-bold text-xs text-[#540808]">
                  Authorized Signatory
                </div>
                <div className="text-[11px] text-[#540808] font-medium mt-0.5">
                  Issued on: <span className="text-[#222222] font-semibold">{formatDate(issuedDate)}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Global CSS for Print Mode: isolates the pure cream receipt sheet on 1 single page */}
      <style jsx global>{`
        @media print {
          @page {
            size: A4 portrait;
            margin: 0;
          }
          html, body {
            margin: 0 !important;
            padding: 0 !important;
            background-color: #FDF6EB !important;
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
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
            width: 210mm !important;
            height: 297mm !important;
            max-height: 297mm !important;
            margin: 0 !important;
            padding: 24mm 20mm !important;
            border: none !important;
            box-shadow: none !important;
            background-color: #FDF6EB !important;
            color: #222222 !important;
            page-break-inside: avoid !important;
            break-inside: avoid !important;
            page-break-after: avoid !important;
            break-after: avoid !important;
            overflow: hidden !important;
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


