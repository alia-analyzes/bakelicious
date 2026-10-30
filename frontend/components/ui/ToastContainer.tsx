'use client';

import React, { useEffect, useState } from 'react';
import { subscribeToast } from '@/lib/toast';
import { CheckCircle2, AlertCircle, Info, X } from 'lucide-react';

interface ToastMessage {
  id: number;
  message: string;
  type: 'success' | 'error' | 'info';
}

export const ToastContainer: React.FC = () => {
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  useEffect(() => {
    return subscribeToast(({ message, type }) => {
      const id = Date.now();
      setToasts((prev) => [...prev, { id, message, type }]);
      setTimeout(() => {
        setToasts((prev) => prev.filter((t) => t.id !== id));
      }, 4000);
    });
  }, []);

  if (toasts.length === 0) return null;

  return (
    <div className="fixed bottom-4 sm:bottom-5 right-0 sm:right-5 left-0 sm:left-auto z-50 flex flex-col gap-2 max-w-md mx-auto sm:mx-0 px-3 sm:px-4 pointer-events-none">
      {toasts.map((toast) => (
        <div
          key={toast.id}
          className={`pointer-events-auto flex items-center justify-between p-3.5 sm:p-4 rounded-xl sm:rounded-2xl shadow-lg border transition-all duration-300 transform translate-y-0 ${
            toast.type === 'success'
              ? 'bg-emerald-900 text-white border-emerald-700'
              : toast.type === 'error'
              ? 'bg-rose-900 text-white border-rose-700'
              : 'bg-slate-900 text-white border-slate-700'
          }`}
        >
          <div className="flex items-center gap-3">
            {toast.type === 'success' && <CheckCircle2 className="w-5 h-5 text-emerald-400" />}
            {toast.type === 'error' && <AlertCircle className="w-5 h-5 text-rose-400" />}
            {toast.type === 'info' && <Info className="w-5 h-5 text-sky-400" />}
            <span className="text-sm font-medium">{toast.message}</span>
          </div>
          <button
            onClick={() => setToasts((prev) => prev.filter((t) => t.id !== toast.id))}
            className="text-slate-400 hover:text-white p-2 min-w-[36px] min-h-[36px] flex items-center justify-center shrink-0"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      ))}
    </div>
  );
};
