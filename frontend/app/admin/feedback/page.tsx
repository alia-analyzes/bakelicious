'use client';

import React, { useEffect, useState } from 'react';
import { Sidebar } from '@/components/layout/Sidebar';
import { Header } from '@/components/layout/Header';
import { api } from '@/lib/api';
import { Feedback } from '@/types';
import { ProtectedRoute } from '@/components/auth/ProtectedRoute';
import { Modal } from '@/components/ui/Modal';
import { ConfirmModal } from '@/components/ui/ConfirmModal';
import { showToast } from '@/lib/toast';
import { MessageSquare, Plus, Star, Eye, EyeOff, Edit, Trash2, CheckCircle2 } from 'lucide-react';

export default function AdminFeedbackPage() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [feedbackList, setFeedbackList] = useState<Feedback[]>([]);
  const [loading, setLoading] = useState(true);

  // Form Modal State
  const [modalOpen, setModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<Feedback | null>(null);
  const [customerName, setCustomerName] = useState('');
  const [rating, setRating] = useState(5);
  const [reviewText, setReviewText] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  const [isScreenshot, setIsScreenshot] = useState(false);
  const [isPublished, setIsPublished] = useState(true);
  const [saving, setSaving] = useState(false);

  // Delete Confirm Modal State
  const [confirmDeleteOpen, setConfirmDeleteOpen] = useState(false);
  const [deletingItem, setDeletingItem] = useState<Feedback | null>(null);

  useEffect(() => {
    fetchAdminFeedback();
  }, []);

  const fetchAdminFeedback = async () => {
    try {
      setLoading(true);
      const res = await api.get('/feedback/admin');
      setFeedbackList(res.data);
    } catch (err) {
      showToast('Failed to load admin feedback', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleOpenCreate = () => {
    setEditingItem(null);
    setCustomerName('');
    setRating(5);
    setReviewText('');
    setImageUrl('');
    setIsScreenshot(false);
    setIsPublished(true);
    setModalOpen(true);
  };

  const handleOpenEdit = (fb: Feedback) => {
    setEditingItem(fb);
    setCustomerName(fb.customer_name);
    setRating(fb.rating || 5);
    setReviewText(fb.review_text || '');
    setImageUrl(fb.image_url || '');
    setIsScreenshot(fb.is_screenshot || false);
    setIsPublished(fb.is_published ?? true);
    setModalOpen(true);
  };

  const handleTogglePublish = async (fb: Feedback) => {
    try {
      const updatedStatus = !fb.is_published;
      await api.put(`/feedback/${fb.id}`, { is_published: updatedStatus });
      showToast(`Feedback ${updatedStatus ? 'published' : 'unpublished'} successfully`, 'success');
      fetchAdminFeedback();
    } catch (err) {
      showToast('Failed to toggle publish status', 'error');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!customerName) {
      showToast('Customer name is required', 'error');
      return;
    }

    setSaving(true);
    try {
      const payload = {
        customer_name: customerName,
        rating,
        review_text: reviewText,
        image_url: imageUrl,
        is_screenshot: isScreenshot,
        is_published: isPublished
      };

      if (editingItem) {
        await api.put(`/feedback/${editingItem.id}`, payload);
        showToast('Feedback updated successfully', 'success');
      } else {
        await api.post('/feedback', payload);
        showToast('Feedback added successfully', 'success');
      }
      fetchAdminFeedback();
      setModalOpen(false);
    } catch (err: any) {
      showToast(err.response?.data?.detail || 'Failed to save feedback', 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleConfirmDelete = async () => {
    if (!deletingItem) return;
    try {
      await api.delete(`/feedback/${deletingItem.id}`);
      showToast('Feedback deleted', 'success');
      fetchAdminFeedback();
    } catch (err) {
      showToast('Failed to delete feedback', 'error');
    }
  };

  return (
    <ProtectedRoute requiredPermission="FEEDBACK_VIEW">
      <div className="min-h-screen bg-cream-200 flex">
        <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

        <div className="flex-1 lg:pl-64 flex flex-col min-w-0">
          <Header onToggleSidebar={() => setSidebarOpen(true)} title="Customer Feedback Manager" />

          <main className="p-4 lg:p-8 space-y-6 max-w-7xl mx-auto w-full">
            {/* Header Action Bar */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-cream-100 p-6 rounded-2xl shadow-sm border border-cream-300">
              <div>
                <h1 className="text-xl font-extrabold text-maroon-900 font-serif flex items-center gap-2">
                  <MessageSquare className="w-5 h-5 text-maroon-600" />
                  <span>Feedback Management</span>
                </h1>
                <p className="text-xs text-charcoal-muted mt-0.5 font-medium">
                  Manage public customer testimonials, WhatsApp/Instagram screenshot reviews, and publication statuses.
                </p>
              </div>

              <button
                onClick={handleOpenCreate}
                className="px-4 py-2 bg-maroon-600 hover:bg-maroon-700 text-white rounded-xl text-xs font-bold transition shadow-md shadow-maroon-600/20 flex items-center gap-2"
              >
                <Plus className="w-4 h-4" />
                <span>Add Customer Feedback</span>
              </button>
            </div>

            {/* Feedback List Table */}
            <div className="bg-cream-100 rounded-2xl shadow-sm border border-cream-300 overflow-hidden">
              {loading ? (
                <div className="py-20 text-center">
                  <div className="inline-block animate-spin rounded-full h-8 w-8 border-4 border-maroon-600 border-t-transparent"></div>
                  <p className="text-xs text-charcoal-muted mt-2 font-bold">Loading feedback records...</p>
                </div>
              ) : feedbackList.length > 0 ? (
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-cream-200 text-maroon-900 font-bold uppercase border-b border-cream-300">
                      <tr>
                        <th className="px-6 py-3.5">Customer Name</th>
                        <th className="px-6 py-3.5">Rating</th>
                        <th className="px-6 py-3.5">Review Content</th>
                        <th className="px-6 py-3.5">Type</th>
                        <th className="px-6 py-3.5">Status</th>
                        <th className="px-6 py-3.5 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-cream-200">
                      {feedbackList.map((fb) => (
                        <tr key={fb.id} className="hover:bg-cream-200/70 transition">
                          <td className="px-6 py-4 font-bold text-maroon-900">{fb.customer_name}</td>
                          <td className="px-6 py-4">
                            <div className="flex items-center gap-0.5 text-amber-500">
                              {Array.from({ length: fb.rating || 5 }).map((_, i) => (
                                <Star key={i} className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                              ))}
                            </div>
                          </td>
                          <td className="px-6 py-4 text-maroon-900 font-medium max-w-xs truncate">
                            {fb.review_text || (fb.image_url ? '[Screenshot Review]' : 'No text')}
                          </td>
                          <td className="px-6 py-4">
                            <span className={`px-2.5 py-1 rounded text-[10px] font-bold ${
                              fb.is_screenshot ? 'bg-purple-100 text-purple-900' : 'bg-cream-300 text-maroon-900'
                            }`}>
                              {fb.is_screenshot ? 'Screenshot' : 'Text Review'}
                            </span>
                          </td>
                          <td className="px-6 py-4">
                            <button
                              onClick={() => handleTogglePublish(fb)}
                              className={`px-3 py-1 rounded-xl text-[11px] font-bold flex items-center gap-1 transition ${
                                fb.is_published
                                  ? 'bg-emerald-100 text-emerald-900 border border-emerald-300'
                                  : 'bg-rose-100 text-rose-900 border border-rose-300'
                              }`}
                            >
                              {fb.is_published ? <Eye className="w-3.5 h-3.5" /> : <EyeOff className="w-3.5 h-3.5" />}
                              <span>{fb.is_published ? 'Published' : 'Hidden'}</span>
                            </button>
                          </td>
                          <td className="px-6 py-4 text-right">
                            <div className="flex items-center justify-end gap-2">
                              <button
                                onClick={() => handleOpenEdit(fb)}
                                className="p-1.5 text-charcoal-muted hover:text-maroon-800 transition"
                              >
                                <Edit className="w-4 h-4" />
                              </button>
                              <button
                                onClick={() => {
                                  setDeletingItem(fb);
                                  setConfirmDeleteOpen(true);
                                }}
                                className="p-1.5 text-charcoal-muted hover:text-rose-700 transition"
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
              ) : (
                <div className="p-12 text-center text-charcoal-muted text-sm font-medium">No feedback items recorded yet.</div>
              )}
            </div>
          </main>
        </div>

        {/* Add / Edit Modal */}
        <Modal
          isOpen={modalOpen}
          onClose={() => setModalOpen(false)}
          title={editingItem ? 'Edit Feedback Entry' : 'Add New Feedback Entry'}
          maxWidth="md"
        >
          <form onSubmit={handleSubmit} className="space-y-4 text-xs">
            <div>
              <label className="block font-bold text-maroon-900 mb-1">Customer Name *</label>
              <input
                type="text"
                required
                value={customerName}
                onChange={(e) => setCustomerName(e.target.value)}
                placeholder="e.g. Priya Patel"
                className="w-full px-3.5 py-2 bg-cream-100 border border-cream-300 rounded-xl font-medium focus:outline-none"
              />
            </div>

            <div>
              <label className="block font-bold text-maroon-900 mb-1">Rating (1 to 5 Stars)</label>
              <select
                value={rating}
                onChange={(e) => setRating(Number(e.target.value))}
                className="w-full px-3.5 py-2 bg-cream-100 border border-cream-300 rounded-xl font-medium focus:outline-none"
              >
                <option value={5}>5 Stars ⭐⭐⭐⭐⭐</option>
                <option value={4}>4 Stars ⭐⭐⭐⭐</option>
                <option value={3}>3 Stars ⭐⭐⭐</option>
                <option value={2}>2 Stars ⭐⭐</option>
                <option value={1}>1 Star ⭐</option>
              </select>
            </div>

            <div>
              <label className="block font-bold text-maroon-900 mb-1">Review Text / Testimonial</label>
              <textarea
                rows={3}
                value={reviewText}
                onChange={(e) => setReviewText(e.target.value)}
                placeholder="e.g. Everyone loved the fresh fruit cream cake! So light and delicious!"
                className="w-full px-3.5 py-2 bg-cream-100 border border-cream-300 rounded-xl font-medium focus:outline-none"
              />
            </div>

            <div>
              <label className="block font-bold text-maroon-900 mb-1">Image / Screenshot URL</label>
              <input
                type="text"
                value={imageUrl}
                onChange={(e) => setImageUrl(e.target.value)}
                placeholder="e.g. /images/feedback/whatsapp_review_1.png"
                className="w-full px-3.5 py-2 bg-cream-100 border border-cream-300 rounded-xl font-medium focus:outline-none"
              />
            </div>

            <div className="flex items-center gap-6 pt-2">
              <label className="flex items-center gap-2 cursor-pointer font-bold text-maroon-900">
                <input
                  type="checkbox"
                  checked={isScreenshot}
                  onChange={(e) => setIsScreenshot(e.target.checked)}
                  className="rounded text-maroon-600 focus:ring-maroon-600"
                />
                <span>Is Screenshot Review (WhatsApp/Instagram)</span>
              </label>

              <label className="flex items-center gap-2 cursor-pointer font-bold text-maroon-900">
                <input
                  type="checkbox"
                  checked={isPublished}
                  onChange={(e) => setIsPublished(e.target.checked)}
                  className="rounded text-maroon-600 focus:ring-maroon-600"
                />
                <span>Publish Immediately</span>
              </label>
            </div>

            <div className="flex items-center justify-end gap-3 pt-4 border-t border-cream-300">
              <button
                type="button"
                onClick={() => setModalOpen(false)}
                className="px-4 py-2 bg-cream-200 text-maroon-900 font-bold rounded-xl"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={saving}
                className="px-5 py-2 bg-maroon-600 text-white font-bold rounded-xl shadow-md"
              >
                {saving ? 'Saving...' : editingItem ? 'Save Changes' : 'Add Feedback'}
              </button>
            </div>
          </form>
        </Modal>

        {/* Delete Confirm Modal */}
        <ConfirmModal
          isOpen={confirmDeleteOpen}
          onClose={() => setConfirmDeleteOpen(false)}
          onConfirm={handleConfirmDelete}
          title="Delete Feedback Confirmation"
          message={`Are you sure you want to delete feedback from "${deletingItem?.customer_name}"?`}
        />
      </div>
    </ProtectedRoute>
  );
}
