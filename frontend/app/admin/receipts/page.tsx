'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Sidebar } from '@/components/layout/Sidebar';
import { Header } from '@/components/layout/Header';
import { ProtectedRoute } from '@/components/auth/ProtectedRoute';
import { ReceiptForm } from '@/components/receipts/ReceiptForm';
import { CustomerReceipt } from '@/components/receipts/CustomerReceipt';
import { ReceiptHistory } from '@/components/receipts/ReceiptHistory';
import { Receipt, ReceiptFormData } from '@/types';
import { api } from '@/lib/api';
import {
  Receipt as ReceiptIcon,
  PlusCircle,
  History,
  X,
  CheckCircle2,
  AlertCircle,
  FileCheck
} from 'lucide-react';

export default function AdminReceiptsPage() {
  const router = useRouter();

  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<'generator' | 'history'>('generator');

  const [nextReceiptNumber, setNextReceiptNumber] = useState<string>('BLX-OC26-C01');
  const [receipts, setReceipts] = useState<Receipt[]>([]);
  const [loadingReceipts, setLoadingReceipts] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const [editingReceipt, setEditingReceipt] = useState<Receipt | null>(null);
  const [previewModalReceipt, setPreviewModalReceipt] = useState<Receipt | null>(null);

  const [isSaving, setIsSaving] = useState(false);
  const [toastMessage, setToastMessage] = useState<{ text: string; type: 'success' | 'error' | 'info' } | null>(null);

  const showToast = (text: string, type: 'success' | 'error' | 'info' = 'success') => {
    setToastMessage({ text, type });
    setTimeout(() => setToastMessage(null), 4000);
  };

  // Fetch initial next receipt number & history list
  useEffect(() => {
    fetchNextNumber();
    fetchReceipts();
  }, []);

  const fetchNextNumber = async () => {
    try {
      const res = await api.get('/receipts/next-number');
      if (res.data?.receipt_number) {
        setNextReceiptNumber(res.data.receipt_number);
      }
    } catch (err) {
      console.error('Failed to fetch next receipt number:', err);
    }
  };

  const fetchReceipts = async (search?: string) => {
    try {
      setLoadingReceipts(true);
      const url = search ? `/receipts?search=${encodeURIComponent(search)}` : '/receipts';
      const res = await api.get(url);
      if (Array.isArray(res.data)) {
        setReceipts(res.data);
      }
    } catch (err) {
      console.error('Failed to fetch receipts list:', err);
    } finally {
      setLoadingReceipts(false);
    }
  };

  const handleSearchChange = (query: string) => {
    setSearchQuery(query);
    // Debounced search if needed, or query parameter
    fetchReceipts(query);
  };

  const handleSaveReceipt = async (formData: ReceiptFormData) => {
    try {
      setIsSaving(true);
      let saved: Receipt;

      if (editingReceipt) {
        // Updating existing receipt
        const res = await api.put(`/receipts/${editingReceipt.id}`, formData);
        saved = res.data;
        showToast(`Receipt ${saved.receipt_number} updated successfully!`, 'success');
      } else {
        // Creating new receipt
        const res = await api.post('/receipts', formData);
        saved = res.data;
        showToast(`Receipt ${saved.receipt_number} created and saved to database!`, 'success');
      }

      // Update state
      await fetchNextNumber();
      await fetchReceipts();

      // Open final preview modal so user can immediately print or download
      setPreviewModalReceipt(saved);
      setEditingReceipt(null);
    } catch (err: any) {
      const msg = err.response?.data?.detail || 'Failed to save receipt. Please check details.';
      showToast(msg, 'error');
      throw new Error(msg);
    } finally {
      setIsSaving(false);
    }
  };

  const handlePreviewForm = (formData: ReceiptFormData) => {
    // Generate a temporary preview receipt object from form data
    const previewData: Receipt = {
      id: editingReceipt?.id || 0,
      receipt_number: formData.receipt_number || nextReceiptNumber,
      receipt_date: formData.receipt_date,
      customer_name: formData.customer_name,
      phone_number: formData.phone_number,
      customer_address: formData.customer_address,
      cake_flavour: formData.cake_flavour,
      cake_weight: formData.cake_weight,
      delivery_date: formData.delivery_date,
      delivery_time: formData.delivery_time,
      order_type: formData.order_type,
      delivery_address: formData.delivery_address,
      cake_amount: formData.cake_amount,
      delivery_charges: formData.delivery_charges,
      candles_required: formData.candles_required,
      candle_type: formData.candle_type,
      candle_quantity: formData.candle_quantity,
      candle_price_per_unit: formData.candle_price_per_unit,
      total_candle_charges: formData.total_candle_charges,
      final_total: formData.final_total,
      advance_paid: formData.advance_paid,
      due_amount: formData.due_amount,
      notes: formData.notes,
      created_at: editingReceipt?.created_at || new Date().toISOString(),
      updated_at: new Date().toISOString()
    };
    setPreviewModalReceipt(previewData);
  };

  const handleEditReceipt = (receipt: Receipt) => {
    setEditingReceipt(receipt);
    setActiveTab('generator');
    setPreviewModalReceipt(null);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleResetForm = () => {
    setEditingReceipt(null);
    fetchNextNumber();
  };

  const handleDeleteReceipt = async (receiptId: number) => {
    try {
      await api.delete(`/receipts/${receiptId}`);
      showToast('Receipt removed from archive.', 'info');
      await fetchReceipts();
      await fetchNextNumber();
      if (editingReceipt?.id === receiptId) {
        setEditingReceipt(null);
      }
      if (previewModalReceipt?.id === receiptId) {
        setPreviewModalReceipt(null);
      }
    } catch (err: any) {
      showToast(err.response?.data?.detail || 'Failed to delete receipt.', 'error');
    }
  };

  const handlePrintReceipt = (receipt: Receipt) => {
    setPreviewModalReceipt(receipt);
    setTimeout(() => {
      window.print();
    }, 300);
  };

  const handleDownloadPdf = async (receipt: Receipt) => {
    setPreviewModalReceipt(receipt);
    setTimeout(async () => {
      const element = document.getElementById('printable-receipt-card');
      if (!element) {
        window.print();
        return;
      }
      try {
        const { jsPDF } = await import('jspdf');
        const html2canvas = (await import('html2canvas')).default;
        const clientName = (receipt.customer_name || 'Customer').trim().replace(/[\/\\?%*:|"<>]/g, '_');
        const canvas = await html2canvas(element, {
          scale: 2,
          useCORS: true,
          logging: false,
          backgroundColor: '#FDF6EB',
          windowWidth: 794
        });
        const pdf = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
        // Paint full sheet template cream (#FDF6EB)
        pdf.setFillColor(253, 246, 235);
        pdf.rect(0, 0, 210, 297, 'F');
        const imgData = canvas.toDataURL('image/png');
        pdf.addImage(imgData, 'PNG', 0, 0, 210, 297, undefined, 'FAST');
        const getPageCount = () => (pdf as any).getNumberOfPages?.() || (pdf.internal as any)?.getNumberOfPages?.() || 1;
        while (getPageCount() > 1) {
          pdf.deletePage(getPageCount());
        }
        pdf.save(`${clientName}_invoice.pdf`);
      } catch (e) {
        console.error('PDF generation error:', e);
        window.print();
      }
    }, 400);
  };

  return (
    <div className="min-h-screen bg-cream-200 dark:bg-maroon-950 text-charcoal dark:text-cream-100 flex font-sans">
      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      <div className="flex-1 flex flex-col min-w-0 lg:pl-64">
        <Header onOpenSidebar={() => setSidebarOpen(true)} title="Invoice Generator" />

        {/* Toast Notification */}
        {toastMessage && (
          <div
            className={`fixed top-20 right-6 z-50 px-4 py-3 rounded-2xl shadow-2xl flex items-center gap-2 animate-bounce-short text-xs font-bold ${
              toastMessage.type === 'error'
                ? 'bg-rose-900 text-cream-100 border border-rose-500'
                : 'bg-maroon-900 text-cream-100 border border-cream-300/30'
            }`}
          >
            {toastMessage.type === 'error' ? (
              <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
            ) : (
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            )}
            <span>{toastMessage.text}</span>
          </div>
        )}

        <main className="flex-1 p-3 sm:p-6 space-y-6 w-full max-w-7xl mx-auto">
          {/* Header Banner */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-cream-100 dark:bg-maroon-900 p-6 rounded-3xl border border-cream-300 dark:border-maroon-800 shadow-sm">
            <div>
              <div className="flex items-center gap-2">
                <div className="w-10 h-10 rounded-2xl bg-[#FCF1E3] dark:bg-maroon-950 border border-[#7E4049]/30 flex items-center justify-center text-[#7E4049] dark:text-cream-300 shadow-sm">
                  <ReceiptIcon className="w-5 h-5" />
                </div>
                <div>
                  <h1 className="text-2xl sm:text-3xl font-extrabold font-serif text-maroon-950 dark:text-cream-100">
                    Invoice Generator
                  </h1>
                  <p className="text-xs text-charcoal-muted dark:text-cream-300/80 font-medium mt-0.5">
                    Generate professional, branded customer invoices with automatic BLX-MMYY-CXX numbering and live pricing calculations.
                  </p>
                </div>
              </div>
            </div>

            {/* TAB TOGGLE BUTTONS */}
            <div className="flex items-center gap-1.5 bg-cream-200 dark:bg-maroon-950 p-1.5 rounded-2xl border border-cream-300 dark:border-maroon-800 text-xs font-bold self-start md:self-auto">
              <button
                type="button"
                onClick={() => setActiveTab('generator')}
                className={`px-4 py-2 rounded-xl transition flex items-center gap-1.5 ${
                  activeTab === 'generator'
                    ? 'bg-[#7E4049] text-[#FCF1E3] shadow-md'
                    : 'text-gray-600 dark:text-cream-300 hover:text-gray-900 dark:hover:text-cream-100'
                }`}
              >
                <PlusCircle className="w-3.5 h-3.5" />
                <span>{editingReceipt ? 'Edit Receipt' : 'New Receipt'}</span>
              </button>

              <button
                type="button"
                onClick={() => setActiveTab('history')}
                className={`px-4 py-2 rounded-xl transition flex items-center gap-1.5 ${
                  activeTab === 'history'
                    ? 'bg-[#7E4049] text-[#FCF1E3] shadow-md'
                    : 'text-gray-600 dark:text-cream-300 hover:text-gray-900 dark:hover:text-cream-100'
                }`}
              >
                <History className="w-3.5 h-3.5" />
                <span>Receipt History ({receipts.length})</span>
              </button>
            </div>
          </div>

          {/* TAB 1: GENERATE / EDIT RECEIPT */}
          {activeTab === 'generator' && (
            <div className="animate-fadeIn">
              <ReceiptForm
                initialData={editingReceipt}
                nextReceiptNumber={nextReceiptNumber}
                onSave={handleSaveReceipt}
                onPreview={handlePreviewForm}
                onReset={handleResetForm}
                isSaving={isSaving}
              />
            </div>
          )}

          {/* TAB 2: RECEIPT HISTORY ARCHIVE */}
          {activeTab === 'history' && (
            <div className="animate-fadeIn">
              <ReceiptHistory
                receipts={receipts}
                searchQuery={searchQuery}
                onSearchChange={handleSearchChange}
                onSelectReceipt={receipt => setPreviewModalReceipt(receipt)}
                onEditReceipt={handleEditReceipt}
                onPrintReceipt={handlePrintReceipt}
                onDownloadReceiptPdf={handleDownloadPdf}
                onDeleteReceipt={handleDeleteReceipt}
                loading={loadingReceipts}
              />
            </div>
          )}
        </main>
      </div>

      {/* FULL PREVIEW MODAL */}
      {previewModalReceipt && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-sm p-3 sm:p-6 overflow-y-auto">
          <div className="relative w-full max-w-3xl my-8 bg-cream-100 dark:bg-maroon-900 rounded-3xl p-4 sm:p-6 shadow-2xl border border-cream-300 dark:border-maroon-800 animate-scaleIn max-h-[92vh] overflow-y-auto">
            {/* Modal Close Button */}
            <button
              type="button"
              onClick={() => setPreviewModalReceipt(null)}
              className="no-print absolute top-4 right-4 p-2 rounded-full bg-cream-200 dark:bg-maroon-800 text-gray-700 dark:text-cream-200 hover:bg-cream-300 dark:hover:bg-maroon-700 transition z-20 shadow-sm"
              title="Close preview"
            >
              <X className="w-5 h-5" />
            </button>

            {/* Embedded Customer Receipt with Actions */}
            <CustomerReceipt
              receipt={previewModalReceipt}
              onEdit={() => {
                handleEditReceipt(previewModalReceipt);
                setPreviewModalReceipt(null);
              }}
              showActions={true}
            />
          </div>
        </div>
      )}
    </div>
  );
}
