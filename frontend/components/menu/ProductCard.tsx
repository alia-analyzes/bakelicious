'use client';

import React from 'react';
import { Product } from '@/types';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { Edit, Trash2, Clock, Scale, Sparkles, ChefHat } from 'lucide-react';

interface ProductCardProps {
  product: Product;
  onEdit: (product: Product) => void;
  onDelete: (product: Product) => void;
  onConfigureRecipe: (product: Product) => void;
}

export const ProductCard: React.FC<ProductCardProps> = ({
  product,
  onEdit,
  onDelete,
  onConfigureRecipe,
}) => {
  const backendUrl = process.env.NEXT_PUBLIC_API_URL?.replace('/api', '') || 'http://localhost:8000';
  
  const getImageUrl = (url?: string) => {
    if (!url) return null;
    if (url.startsWith('http')) return url;
    return `${backendUrl}${url}`;
  };

  const imageUrl = getImageUrl(product.image_url);

  return (
    <div className="bg-cream-100 rounded-2xl shadow-sm border border-cream-300 overflow-hidden flex flex-col justify-between transition-all duration-200 hover:shadow-md hover:-translate-y-0.5 group">
      <div>
        {/* Product Image Container */}
        <div className="relative h-48 w-full bg-cream-200 overflow-hidden flex items-center justify-center border-b border-cream-300">
          {imageUrl ? (
            <img
              src={imageUrl}
              alt={product.name}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
              onError={(e) => {
                (e.target as HTMLElement).style.display = 'none';
              }}
            />
          ) : (
            <div className="flex flex-col items-center justify-center text-maroon-300 p-4 text-center">
              <Sparkles className="w-10 h-10 mb-1 text-maroon-500" />
              <span className="text-xs font-bold text-maroon-800 font-serif">Bakelicious Craft</span>
            </div>
          )}

          {/* Availability Badge Overlay */}
          <div className="absolute top-3 left-3">
            <StatusBadge
              status={product.availability ? 'Available' : 'Unavailable'}
              type="availability"
            />
          </div>

          {/* Category Pill Overlay */}
          {product.category && (
            <div className="absolute top-3 right-3 px-2.5 py-1 bg-maroon-700 text-cream-100 rounded-full text-[10px] font-bold shadow-sm border border-maroon-800">
              {product.category.name}
            </div>
          )}
        </div>

        {/* Card Content */}
        <div className="p-3.5 sm:p-5 space-y-2.5 sm:space-y-3">
          <div className="flex items-start justify-between gap-2">
            <h3 className="font-bold text-maroon-900 text-base leading-snug line-clamp-1 font-serif">
              {product.name}
            </h3>
            <span className="text-base font-black text-maroon-700 shrink-0 font-serif">
              ₹{product.price.toLocaleString()}
            </span>
          </div>

          {product.description && (
            <p className="text-xs text-charcoal-muted line-clamp-2 leading-relaxed font-medium">
              {product.description}
            </p>
          )}

          {/* Details Metadata */}
          <div className="flex items-center gap-4 text-[11px] text-charcoal-muted font-bold pt-1">
            {product.size && (
              <span className="flex items-center gap-1">
                <Scale className="w-3.5 h-3.5 text-maroon-600" />
                {product.size}
              </span>
            )}
            <span className="flex items-center gap-1">
              <Clock className="w-3.5 h-3.5 text-maroon-600" />
              {product.prep_time_hours}h prep
            </span>
          </div>

          {/* Cost & Profit Margin Summary */}
          <div className="p-2.5 bg-cream-200 rounded-xl border border-cream-300 flex flex-col sm:flex-row sm:items-center justify-between gap-1 text-[11px]">
            <div>
              <span className="text-charcoal-muted">Cost: </span>
              <span className="font-bold text-maroon-900">₹{product.effective_cost.toFixed(2)}</span>
              {product.use_manual_cost && (
                <span className="ml-1 text-[9px] text-amber-700 font-bold">(Manual)</span>
              )}
            </div>
            <div>
              <span className="text-charcoal-muted">Profit: </span>
              <span className="font-bold text-emerald-800">₹{product.profit.toFixed(2)} ({product.profit_margin}%)</span>
            </div>
          </div>

          {/* Tags */}
          {product.tags && product.tags.length > 0 && (
            <div className="flex flex-wrap gap-1 pt-1">
              {product.tags.map((tag, idx) => (
                <span
                  key={idx}
                  className="px-2 py-0.5 bg-cream-300 text-maroon-900 rounded-md text-[10px] font-bold"
                >
                  #{tag}
                </span>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Card Action Buttons */}
      <div className="p-3 sm:p-4 bg-cream-200 border-t border-cream-300 flex items-center justify-between gap-2">
        <button
          onClick={() => onConfigureRecipe(product)}
          className="px-3 py-1.5 bg-maroon-700 hover:bg-maroon-800 text-cream-100 text-xs font-bold rounded-lg transition shadow-xs flex items-center gap-1.5"
        >
          <ChefHat className="w-3.5 h-3.5" />
          <span>Recipe Costing</span>
        </button>

        <div className="flex items-center gap-1">
          <button
            onClick={() => onEdit(product)}
            className="p-2 min-w-[36px] min-h-[36px] flex items-center justify-center text-charcoal-muted hover:text-maroon-800 hover:bg-cream-300 rounded-lg transition"
            title="Edit Product"
          >
            <Edit className="w-4 h-4" />
          </button>
          <button
            onClick={() => onDelete(product)}
            className="p-2 min-w-[36px] min-h-[36px] flex items-center justify-center text-charcoal-muted hover:text-rose-700 hover:bg-rose-50 rounded-lg transition"
            title="Delete Product"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};
