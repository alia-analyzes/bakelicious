'use client';

import React, { useState } from 'react';
import { Receipt } from '@/types';
import {
  Search,
  Receipt as ReceiptIcon,
  Calendar,
  Phone,
  Eye,
  Edit,
  Printer,
  Download,
  Trash2,
  TrendingUp,
  Clock,
  IndianRupee,
  ShoppingBag,
  Truck,
  AlertCircle
} from 'lucide-react';

interface ReceiptHistoryProps {
  receipts: Receipt[];
  searchQuery: string;
  onSearchChange: (query: string) => void;
  onSelectReceipt: (receipt: Receipt) => void;
  onEditReceipt: (receipt: Receipt) => void;
  onPrintReceipt: (receipt: Receipt) => void;
  onDownloadReceiptPdf: (receipt: Receipt) => void;
  onDeleteReceipt: (receiptId: number) => Promise<void>;
  loading?: boolean;
}

export const ReceiptHistory: React.FC<ReceiptHistoryProps> = ({
  receipts,
  searchQuery,
  onSearchChange,
  onSelectReceipt,
  onEditReceipt,
  onPrintReceipt,
  onDownloadReceiptPdf,
  onDeleteReceipt,
  loading = false
}) => {
  const [deleteConfirmId, setDeleteConfirmId] = useState<number | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Filter receipts locally based on search query
  const filteredReceipts = receipts.filter(r => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase().trim();
    return (
      r.receipt_number?.toLowerCase().includes(q) ||
      r.customer_name?.toLowerCase().includes(q) ||
      r.phone_number?.toLowerCase().includes(q) ||
      r.cake_flavour?.toLowerCase().includes(q)
    );
  });

  // Calculate statistics
  const totalRevenue = receipts.reduce((acc, r) => acc + Number(r.final_total || 0), 0);
  const totalDue = receipts.reduce((acc, r) => acc + Number(r.due_amount || 0), 0);
  const totalAdvance = receipts.reduce((acc, r) => acc + Number(r.advance_paid || 0), 0);

  const todayStr = new Date().toISOString().split('T')[0];
  const todayCount = receipts.filter(r => {
    if (!r.receipt_date) return false;
    return r.receipt_date.startsWith(todayStr);
  }).length;

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

  const handleDelete = async (id: number) => {
    try {
      setIsDeleting(true);
      await onDeleteReceipt(id);
      setDeleteConfirmId(null);
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* STATS OVERVIEW CARDS */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Receipts */}
        <div className="bg-cream-100 dark:bg-maroon-900 p-5 rounded-3xl border border-cream-300 dark:border-maroon-800 shadow-sm">
          <div className="flex items-center justify-between text-[#7E4049] dark:text-cream-300 mb-2">
            <span className="text-[10px] font-extrabold uppercase tracking-wider">Total Receipts</span>
            <ReceiptIcon className="w-4 h-4" />
          </div>
          <div className="text-2xl font-black font-mono text-[#4D1A22] dark:text-cream-100">
            {receipts.length}
          </div>
          <div className="text-[10px] text-gray-500 font-medium mt-1">
            {todayCount} generated today
          </div>
        </div>

        {/* Total Invoiced */}
        <div className="bg-cream-100 dark:bg-maroon-900 p-5 rounded-3xl border border-cream-300 dark:border-maroon-800 shadow-sm">
          <div className="flex items-center justify-between text-[#7E4049] dark:text-cream-300 mb-2">
            <span className="text-[10px] font-extrabold uppercase tracking-wider">Total Invoiced</span>
            <TrendingUp className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="text-2xl font-black font-mono text-emerald-700 dark:text-emerald-400">
            ₹{totalRevenue.toLocaleString('en-IN', { maximumFractionDigits: 0 })}
          </div>
          <div className="text-[10px] text-gray-500 font-medium mt-1">
            Advance paid: ₹{totalAdvance.toLocaleString('en-IN', { maximumFractionDigits: 0 })}
          </div>
        </div>

        {/* Outstanding Due */}
        <div className="bg-cream-100 dark:bg-maroon-900 p-5 rounded-3xl border border-cream-300 dark:border-maroon-800 shadow-sm">
          <div className="flex items-center justify-between text-[#7E4049] dark:text-cream-300 mb-2">
            <span className="text-[10px] font-extrabold uppercase tracking-wider">Balance Due</span>
            <Clock className="w-4 h-4 text-amber-600" />
          </div>
          <div className="text-2xl font-black font-mono text-amber-700 dark:text-amber-400">
            ₹{totalDue.toLocaleString('en-IN', { maximumFractionDigits: 0 })}
          </div>
          <div className="text-[10px] text-gray-500 font-medium mt-1">
            Payable upon cake delivery
          </div>
        </div>

        {/* Active Month */}
        <div className="bg-cream-100 dark:bg-maroon-900 p-5 rounded-3xl border border-cream-300 dark:border-maroon-800 shadow-sm">
          <div className="flex items-center justify-between text-[#7E4049] dark:text-cream-300 mb-2">
            <span className="text-[10px] font-extrabold uppercase tracking-wider">Numbering Cycle</span>
            <Calendar className="w-4 h-4 text-blue-600" />
          </div>
          <div className="text-lg font-black text-[#4D1A22] dark:text-cream-100 mt-1">
            {new Date().toLocaleDateString('en-IN', { month: 'short', year: 'numeric' })}
          </div>
          <div className="text-[10px] text-gray-500 font-medium mt-1">
            Auto monthly reset to C01
          </div>
        </div>
      </div>

      {/* SEARCH AND FILTER BAR */}
      <div className="bg-cream-100 dark:bg-maroon-900 p-4 rounded-3xl border border-cream-300 dark:border-maroon-800 shadow-sm flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="relative w-full sm:w-96">
          <Search className="w-4 h-4 text-gray-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search by receipt number, customer name, or phone..."
            value={searchQuery}
            onChange={e => onSearchChange(e.target.value)}
            className="w-full pl-9 pr-4 py-2.5 rounded-2xl bg-white dark:bg-maroon-950 border border-cream-300 dark:border-maroon-700 text-xs font-medium focus:ring-2 focus:ring-[#7E4049] dark:focus:ring-cream-300 focus:outline-none"
          />
        </div>

        <div className="text-xs text-gray-500 font-medium self-end sm:self-center">
          Showing <span className="font-bold text-gray-900 dark:text-cream-100">{filteredReceipts.length}</span> of {receipts.length} receipts
        </div>
      </div>

      {/* RECEIPT ARCHIVE TABLE */}
      <div className="bg-white dark:bg-maroon-950 rounded-3xl border border-cream-300 dark:border-maroon-800 shadow-sm overflow-hidden">
        {loading ? (
          <div className="p-12 text-center text-gray-400">
            <div className="w-8 h-8 border-3 border-[#7E4049] border-t-transparent rounded-full animate-spin mx-auto mb-3"></div>
            <div className="text-xs font-bold">Loading receipt archive...</div>
          </div>
        ) : filteredReceipts.length === 0 ? (
          <div className="p-12 text-center">
            <ReceiptIcon className="w-12 h-12 text-gray-300 dark:text-gray-600 mx-auto mb-3 stroke-[1.5]" />
            <div className="text-sm font-bold text-gray-800 dark:text-cream-200">No receipts found</div>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1 max-w-sm mx-auto">
              {searchQuery
                ? `No receipts matched your search query "${searchQuery}". Try a different name or number.`
                : 'No receipts have been generated yet. Use the "Generate Receipt" tab above to create the first receipt.'}
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-cream-100 dark:bg-maroon-900/90 text-gray-600 dark:text-cream-300 font-extrabold uppercase text-[10px] tracking-wider border-b border-cream-300 dark:border-maroon-800">
                <tr>
                  <th className="py-3 px-4">Receipt #</th>
                  <th className="py-3 px-4">Date</th>
                  <th className="py-3 px-4">Customer Details</th>
                  <th className="py-3 px-4">Cake & Delivery</th>
                  <th className="py-3 px-4 text-right">Total</th>
                  <th className="py-3 px-4 text-right">Due</th>
                  <th className="py-3 px-4 text-center">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-cream-200 dark:divide-maroon-900">
                {filteredReceipts.map(rcpt => (
                  <tr
                    key={rcpt.id}
                    className="hover:bg-cream-50/70 dark:hover:bg-maroon-900/40 transition group"
                  >
                    {/* Receipt Number */}
                    <td className="py-3.5 px-4">
                      <button
                        type="button"
                        onClick={() => onSelectReceipt(rcpt)}
                        className="font-mono font-bold text-xs text-[#7E4049] dark:text-cream-300 hover:underline flex items-center gap-1.5"
                      >
                        <ReceiptIcon className="w-3.5 h-3.5 shrink-0 opacity-70" />
                        <span>{rcpt.receipt_number}</span>
                      </button>
                    </td>

                    {/* Date */}
                    <td className="py-3.5 px-4 text-gray-600 dark:text-cream-300/80 font-medium">
                      {formatDate(rcpt.receipt_date)}
                    </td>

                    {/* Customer */}
                    <td className="py-3.5 px-4">
                      <div className="font-bold text-gray-900 dark:text-cream-100">
                        {rcpt.customer_name}
                      </div>
                      <div className="text-[11px] text-gray-500 flex items-center gap-1 mt-0.5">
                        <Phone className="w-3 h-3" />
                        <span>{rcpt.phone_number}</span>
                      </div>
                    </td>

                    {/* Cake & Type */}
                    <td className="py-3.5 px-4">
                      <div className="font-semibold text-gray-800 dark:text-cream-200">
                        {rcpt.cake_flavour || 'Custom Cake'}
                        {rcpt.cake_weight ? ` (${rcpt.cake_weight})` : ''}
                      </div>
                      <div className="flex items-center gap-1.5 mt-0.5">
                        <span className={`px-2 py-0.2 rounded-full text-[9px] font-bold ${
                          rcpt.order_type === 'Home Delivery'
                            ? 'bg-blue-100 text-blue-800 dark:bg-blue-900/40 dark:text-blue-300'
                            : 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-300'
                        }`}>
                          {rcpt.order_type}
                        </span>
                        {rcpt.delivery_date && (
                          <span className="text-[10px] text-gray-400">
                            Due {formatDate(rcpt.delivery_date)}
                          </span>
                        )}
                      </div>
                    </td>

                    {/* Total Amount */}
                    <td className="py-3.5 px-4 text-right font-mono font-bold text-gray-900 dark:text-cream-100">
                      ₹{Number(rcpt.final_total || 0).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </td>

                    {/* Remaining Due */}
                    <td className="py-3.5 px-4 text-right font-mono font-bold">
                      {Number(rcpt.due_amount || 0) > 0 ? (
                        <span className="text-amber-700 dark:text-amber-400">
                          ₹{Number(rcpt.due_amount).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </span>
                      ) : (
                        <span className="text-emerald-600 font-semibold text-[11px]">Paid</span>
                      )}
                    </td>

                    {/* Actions */}
                    <td className="py-3.5 px-4 text-center">
                      <div className="flex items-center justify-center gap-1">
                        {/* Preview */}
                        <button
                          type="button"
                          onClick={() => onSelectReceipt(rcpt)}
                          className="p-1.5 rounded-lg text-gray-500 hover:text-[#7E4049] hover:bg-cream-100 dark:hover:bg-maroon-800 transition"
                          title="Preview Customer Receipt"
                        >
                          <Eye className="w-4 h-4" />
                        </button>

                        {/* Edit */}
                        <button
                          type="button"
                          onClick={() => onEditReceipt(rcpt)}
                          className="p-1.5 rounded-lg text-gray-500 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-950 transition"
                          title="Edit Receipt Details"
                        >
                          <Edit className="w-4 h-4" />
                        </button>

                        {/* Print */}
                        <button
                          type="button"
                          onClick={() => onPrintReceipt(rcpt)}
                          className="p-1.5 rounded-lg text-gray-500 hover:text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-950 transition"
                          title="Print Receipt"
                        >
                          <Printer className="w-4 h-4" />
                        </button>

                        {/* PDF */}
                        <button
                          type="button"
                          onClick={() => onDownloadReceiptPdf(rcpt)}
                          className="p-1.5 rounded-lg text-gray-500 hover:text-purple-600 hover:bg-purple-50 dark:hover:bg-purple-950 transition"
                          title="Download PDF"
                        >
                          <Download className="w-4 h-4" />
                        </button>

                        {/* Delete */}
                        <button
                          type="button"
                          onClick={() => setDeleteConfirmId(rcpt.id)}
                          className="p-1.5 rounded-lg text-gray-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950 transition"
                          title="Delete Receipt"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* DELETE CONFIRMATION MODAL */}
      {deleteConfirmId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="bg-white dark:bg-maroon-900 rounded-3xl max-w-sm w-full p-6 shadow-2xl border border-cream-300 dark:border-maroon-800 animate-scaleIn">
            <div className="flex items-center gap-2.5 text-rose-600 mb-3">
              <AlertCircle className="w-6 h-6 shrink-0" />
              <h3 className="text-base font-bold text-gray-900 dark:text-cream-100">
                Delete Saved Receipt?
              </h3>
            </div>
            <p className="text-xs text-gray-600 dark:text-cream-300/80">
              Are you sure you want to remove this receipt from the archive? This action cannot be undone.
            </p>
            <div className="flex items-center justify-end gap-3 mt-6">
              <button
                type="button"
                disabled={isDeleting}
                onClick={() => setDeleteConfirmId(null)}
                className="px-4 py-2 rounded-xl text-xs font-bold text-gray-700 dark:text-cream-200 bg-gray-100 dark:bg-maroon-800 hover:bg-gray-200 transition"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={isDeleting}
                onClick={() => handleDelete(deleteConfirmId)}
                className="px-4 py-2 rounded-xl text-xs font-bold text-white bg-rose-600 hover:bg-rose-700 transition shadow-sm"
              >
                {isDeleting ? 'Deleting...' : 'Yes, Delete'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
