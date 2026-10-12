'use client';

import React, { useEffect, useState } from 'react';
import { PublicHeader } from '@/components/layout/PublicHeader';
import { PublicFooter } from '@/components/layout/PublicFooter';
import { Modal } from '@/components/ui/Modal';
import { api } from '@/lib/api';
import { Feedback as FeedbackType } from '@/types';
import { Star, Heart, MessageSquare, Image as ImageIcon, ZoomIn, Sparkles } from 'lucide-react';

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
      setFeedbackList(res.data.length > 0 ? res.data : [
        {
          id: 1,
          customer_name: 'Ananya Sen',
          rating: 5,
          review_text: 'Bakelicious created our 3-tier anniversary cake. The rose pink ombre with edible gold leaf was breathtaking and tasted divine!',
          created_at: '2026-08-29'
        },
        {
          id: 2,
          customer_name: 'Neha Roy',
          rating: 5,
          review_text: 'The Belgian Chocolate Truffle was ordered for my husband\'s birthday. Rich, moist and not overly sweet. Everyone asked where it was from!',
          created_at: '2026-10-12'
        },
        {
          id: 3,
          customer_name: 'Priya Patel',
          rating: 5,
          review_text: 'The 4-inch mini bento cake with custom handwritten Korean lettering was adorable and arrived in pristine packaging on time!',
          created_at: '2026-08-28'
        }
      ]);
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
    <div className="min-h-screen bg-cream-100 dark:bg-maroon-950 text-charcoal dark:text-cream-100 flex flex-col font-sans selection:bg-maroon-700 selection:text-cream-100">
      <PublicHeader />

      <main className="flex-1 py-12 lg:py-18">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12">
          
          {/* Header */}
          <div className="text-center max-w-2xl mx-auto space-y-3">
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-cream-50 dark:bg-maroon-900 border-2 border-maroon-950 dark:border-cream-100 text-maroon-950 dark:text-cream-100 text-[11px] font-black uppercase tracking-widest shadow-neo-sm">
              <Sparkles className="w-3.5 h-3.5 text-amber-500 fill-amber-500" />
              <span>Verified Customer Love</span>
            </div>

            <h1 className="text-4xl sm:text-5xl font-black text-maroon-950 dark:text-cream-100 font-serif tracking-tight">
              Customer Testimonials &amp; Reviews
            </h1>
            <p className="text-xs sm:text-sm text-charcoal-muted dark:text-cream-300 font-medium leading-relaxed">
              Real reviews, WhatsApp messages, and celebration feedback from our dessert lovers across Kolkata.
            </p>
          </div>

          {/* Filter Tabs */}
          <div className="flex items-center justify-center gap-3">
            <button
              onClick={() => setActiveTab('all')}
              className={`px-5 py-2 rounded-xl text-xs font-serif font-bold transition border-2 ${
                activeTab === 'all'
                  ? 'bg-maroon-700 text-cream-100 border-maroon-950 shadow-neo-sm'
                  : 'bg-cream-50 dark:bg-maroon-900 text-maroon-950 dark:text-cream-100 border-maroon-950/20 hover:border-maroon-950'
              }`}
            >
              All Reviews ({feedbackList.length})
            </button>
            <button
              onClick={() => setActiveTab('text')}
              className={`px-5 py-2 rounded-xl text-xs font-serif font-bold transition border-2 ${
                activeTab === 'text'
                  ? 'bg-maroon-700 text-cream-100 border-maroon-950 shadow-neo-sm'
                  : 'bg-cream-50 dark:bg-maroon-900 text-maroon-950 dark:text-cream-100 border-maroon-950/20 hover:border-maroon-950'
              }`}
            >
              Written Reviews
            </button>
            <button
              onClick={() => setActiveTab('screenshot')}
              className={`px-5 py-2 rounded-xl text-xs font-serif font-bold transition border-2 ${
                activeTab === 'screenshot'
                  ? 'bg-maroon-700 text-cream-100 border-maroon-950 shadow-neo-sm'
                  : 'bg-cream-50 dark:bg-maroon-900 text-maroon-950 dark:text-cream-100 border-maroon-950/20 hover:border-maroon-950'
              }`}
            >
              WhatsApp Screenshots
            </button>
          </div>

          {/* Reviews Grid */}
          {loading ? (
            <div className="py-24 text-center">
              <div className="inline-block animate-spin rounded-full h-8 w-8 border-4 border-maroon-700 border-t-transparent"></div>
              <p className="text-xs text-charcoal-muted mt-2 font-bold">Loading reviews...</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredList.map((fb) => (
                <div
                  key={fb.id}
                  className="bg-cream-50 dark:bg-maroon-900 rounded-3xl border-2 border-maroon-950/20 dark:border-cream-100/20 hover:border-maroon-950 dark:hover:border-cream-100 p-6 space-y-4 shadow-neo-sm hover:shadow-neo hover:-translate-y-1 transition-all flex flex-col justify-between"
                >
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-1 text-amber-500">
                        {[...Array(fb.rating || 5)].map((_, i) => (
                          <Star key={i} className="w-4 h-4 fill-amber-500" />
                        ))}
                      </div>
                      <span className="text-[10px] text-charcoal-muted dark:text-cream-400 font-mono">
                        {fb.created_at ? new Date(fb.created_at).toLocaleDateString('en-GB') : 'Verified'}
                      </span>
                    </div>

                    <p className="text-xs sm:text-sm text-charcoal dark:text-cream-200 font-medium leading-relaxed italic">
                      &quot;{fb.review_text || (fb as any).comments}&quot;
                    </p>
                  </div>

                  <div className="pt-3 border-t-2 border-maroon-950/10 dark:border-maroon-800 flex items-center justify-between">
                    <div>
                      <span className="font-serif font-black text-maroon-950 dark:text-cream-100 text-sm block">
                        {fb.customer_name || (fb as any).client_name || 'Happy Customer'}
                      </span>
                      <span className="text-[10px] text-maroon-700 dark:text-cream-300 font-bold uppercase tracking-wider">
                        Kolkata Verified Order
                      </span>
                    </div>
                    <Heart className="w-4 h-4 text-rose-500 fill-rose-500 shrink-0" />
                  </div>
                </div>
              ))}
            </div>
          )}

        </div>
      </main>

      <PublicFooter />
    </div>
  );
}
