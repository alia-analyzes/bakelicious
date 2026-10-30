'use client';

import React from 'react';
import { Modal } from './Modal';
import { AlertTriangle } from 'lucide-react';

interface ConfirmModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  isDangerous?: boolean;
}

export const ConfirmModal: React.FC<ConfirmModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  confirmText = 'Confirm',
  cancelText = 'Cancel',
  isDangerous = true,
}) => {
  return (
    <Modal isOpen={isOpen} onClose={onClose} title={title} maxWidth="sm">
      <div className="flex flex-col items-center text-center space-y-4">
        <div className={`p-3 rounded-full ${isDangerous ? 'bg-rose-100 text-rose-600' : 'bg-amber-100 text-amber-600'}`}>
          <AlertTriangle className="w-8 h-8" />
        </div>
        <p className="text-sm text-slate-600 leading-relaxed">{message}</p>
        <div className="flex flex-col-reverse sm:flex-row items-stretch sm:items-center justify-end gap-2.5 sm:gap-3 w-full pt-4 border-t border-slate-100 dark:border-maroon-800">
          <button
            onClick={onClose}
            className="px-4 py-2.5 text-xs sm:text-sm font-bold text-slate-700 dark:text-cream-200 bg-slate-100 dark:bg-maroon-800 hover:bg-slate-200 dark:hover:bg-maroon-700 rounded-xl transition"
          >
            {cancelText}
          </button>
          <button
            onClick={() => {
              onConfirm();
              onClose();
            }}
            className={`px-5 py-2.5 text-xs sm:text-sm font-bold text-white rounded-xl transition shadow-sm ${
              isDangerous ? 'bg-rose-600 hover:bg-rose-700' : 'bg-maroon-700 hover:bg-maroon-800'
            }`}
          >
            {confirmText}
          </button>
        </div>
      </div>
    </Modal>
  );
};
