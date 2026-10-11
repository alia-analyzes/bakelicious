'use client';

import React from 'react';

interface StatusBadgeProps {
  status: string;
  type?: 'order' | 'payment' | 'production' | 'availability';
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({ status, type = 'order' }) => {
  const getBadgeStyle = () => {
    switch (status) {
      case 'Received':
      case 'Not Started':
      case 'Pending':
        return 'bg-amber-50 text-amber-800 border-amber-200';
      case 'Confirmed':
      case 'Preparing':
      case 'Baking':
      case 'Decorating':
      case 'Partial':
        return 'bg-sky-50 text-sky-800 border-sky-200';
      case 'Ready':
      case 'Out for Delivery':
        return 'bg-purple-50 text-purple-800 border-purple-200';
      case 'Delivered':
      case 'Completed':
      case 'Paid':
      case 'Available':
        return 'bg-emerald-50 text-emerald-800 border-emerald-200';
      case 'Cancelled':
      case 'Unavailable':
      case 'Low Stock':
        return 'bg-rose-50 text-rose-800 border-rose-200';
      default:
        return 'bg-cream-200 text-maroon-900 border-cream-300';
    }
  };

  return (
    <span
      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-bold border ${getBadgeStyle()}`}
    >
      {status}
    </span>
  );
};
