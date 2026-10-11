'use client';

import React, { useEffect, useState } from 'react';
import { PublicHeader } from '@/components/layout/PublicHeader';
import { PublicFooter } from '@/components/layout/PublicFooter';
import { Modal } from '@/components/ui/Modal';
import { api } from '@/lib/api';
import { Feedback as FeedbackType } from '@/types';
import { Star, Heart, MessageSquare, Image as ImageIcon, ZoomIn } from 'lucide-react';

export default function FeedbackPublicPage() {
  const [feedbackList, setFeedbackList] = useState<FeedbackType[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'all' | 'text' | 'screenshot'>('all');

  // Lightbox Modal for screenshot inspection
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [activeImage, setActiveImage] = useState<string | null>(null);
  const [activeTitle, setActiveTitle] = useState<string>('');

  useEffect(() => {
    fetchFeedback();
  }, []);

  const fetchFeedback = async () => {
    try {
      setLoading(true);
      const res = await api.get('/feedback');
      setFeedbackList(res.data);
    } catch (err) {
      console.error('Failed to load customer feedback:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenLightbox = (imageUrl: string, title: string) => {
    setActiveImage(imageUrl);
    setActiveTitle(title);
    setLightboxOpen(true);
  };

  const filteredList = feedbackList.filter((fb) => {
    if (activeTab === 'text' && fb.is_screenshot) return false;
    if (activeTab === 'screenshot' && !fb.is_screenshot) return false;
    return true;
  });

  return (
    <div className="min-h-screen bg-cream-200 text-charcoal flex flex-col font-sans">
      <PublicHeader />

      <main className="flex-1 py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-10">
          
          {/* Header Banner */}
          <div className="text-center max-w-2xl mx-auto space-y-3">
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-cream-100 border border-cream-300 text-maroon-800 text-xs font-bold shadow-sm">
              <Heart className="w-3.5 h-3.5 fill-maroon-600 text-maroon-600" />
              <span>Real Customer Reviews &amp; Social Love</span>
            </div>
            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold font-serif text-maroon-950">
              Client Feedback &amp; Reviews
            </h1>
            <p className="text-xs sm:text-sm text-charcoal-muted font-medium leading-relaxed">
              Read authentic feedback from happy clients across Kolkata, featuring verified WhatsApp &amp; Instagram review screenshots.
            </p>
          </div>

          {/* Filter Tabs */}
          <div className="flex justify-center">
            <div className="bg-cream-100 p-1.5 rounded-2xl border border-cream-300 inline-flex items-center gap-2 shadow-sm text-xs font-bold">
              <button
                onClick={() => setActiveTab('all')}
                className={`px-4 py-2 rounded-xl transition ${
                  activeTab === 'all'
                    ? 'bg-maroon-700 text-cream-100 shadow-sm'
                    : 'text-maroon-900 hover:bg-cream-200'
                }`}
              >
                All Reviews ({feedbackList.length})
              </button>
              <button
                onClick={() => setActiveTab('text')}
                className={`px-4 py-2 rounded-xl transition flex items-center gap-1.5 ${
                  activeTab === 'text'
                    ? 'bg-maroon-700 text-cream-100 shadow-sm'
                    : 'text-maroon-900 hover:bg-cream-200'
                }`}
              >
                <MessageSquare className="w-3.5 h-3.5" />
                <span>Text Reviews</span>
              </button>
              <button
                onClick={() => setActiveTab('screenshot')}
                className={`px-4 py-2 rounded-xl transition flex items-center gap-1.5 ${
                  activeTab === 'screenshot'
                    ? 'bg-maroon-700 text-cream-100 shadow-sm'
                    : 'text-maroon-900 hover:bg-cream-200'
                }`}
              >
                <ImageIcon className="w-3.5 h-3.5" />
                <span>Screenshot Proofs</span>
              </button>
            </div>
          </div>

          {/* Reviews Grid */}
          {loading ? (
            <div className="py-20 text-center">
              <div className="inline-block animate-spin rounded-full h-8 w-8 border-4 border-maroon-700 border-t-transparent"></div>
              <p className="text-xs text-charcoal-muted mt-2 font-bold">Loading feedback...</p>
            </div>
          ) : filteredList.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {filteredList.map((fb) => (
                <div
                  key={fb.id}
                  className="bg-cream-100 rounded-3xl border border-cream-300 p-6 space-y-4 shadow-sm hover:shadow-md transition flex flex-col justify-between"
                >
                  <div className="space-y-3">
                    {/* Header info */}
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-maroon-800 text-cream-100 flex items-center justify-center font-bold text-sm font-serif shadow-sm">
                          {fb.customer_name.charAt(0)}
                        </div>
                        <div>
                          <h3 className="font-bold text-maroon-950 text-sm font-serif">{fb.customer_name}</h3>
                          <p className="text-[11px] text-charcoal-muted font-medium">Verified Kolkata Buyer</p>
                        </div>
                      </div>

                      {/* Stars */}
                      <div className="flex items-center gap-0.5 text-amber-500 text-xs">
                        {Array.from({ length: fb.rating || 5 }).map((_, i) => (
                          <Star key={i} className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                        ))}
                      </div>
                    </div>

                    {/* Review text */}
                    {fb.review_text && (
                      <p className="text-xs text-charcoal leading-relaxed font-medium italic bg-cream-200/50 p-3 rounded-2xl border border-cream-300">
                        &quot;{fb.review_text}&quot;
                      </p>
                    )}

                    {/* Screenshot image container if present */}
                    {fb.image_url && (
                      <div
                        onClick={() => handleOpenLightbox(fb.image_url!, fb.customer_name)}
                        className="relative rounded-2xl overflow-hidden border-2 border-cream-300 bg-cream-200 cursor-pointer group shadow-sm"
                      >
                        <img
                          src={fb.image_url}
                          alt={`Review by ${fb.customer_name}`}
                          className="w-full h-48 object-cover group-hover:scale-105 transition duration-500"
                        />
                        <div className="absolute inset-0 bg-maroon-950/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-cream-100 gap-1.5 font-bold text-xs">
                          <ZoomIn className="w-4 h-4" />
                          <span>Inspect Screenshot</span>
                        </div>
                      </div>
                    )}
                  </div>

                  <div className="pt-2 text-[10px] text-charcoal-muted flex items-center justify-between font-medium">
                    <span>Date: {new Date(fb.created_at).toLocaleDateString()}</span>
                    <span className="text-maroon-800 font-bold uppercase tracking-wider">
                      {fb.is_screenshot ? 'Verified Screenshot' : 'Verified Review'}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="p-12 text-center text-charcoal-muted text-sm bg-cream-100 rounded-3xl border border-cream-300">
              No feedback found for this filter.
            </div>
          )}

        </div>
      </main>

      <PublicFooter />

      {/* Screenshot Lightbox Modal */}
      <Modal
        isOpen={lightboxOpen}
        onClose={() => setLightboxOpen(false)}
        title={`Customer Feedback Proof: ${activeTitle}`}
        maxWidth="lg"
      >
        {activeImage && (
          <div className="p-2 text-center space-y-3">
            <div className="rounded-2xl overflow-hidden border border-cream-300 bg-cream-200 max-h-[70vh] flex items-center justify-center">
              <img src={activeImage} alt="Feedback Screenshot" className="max-h-[65vh] w-auto object-contain rounded-xl" />
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
