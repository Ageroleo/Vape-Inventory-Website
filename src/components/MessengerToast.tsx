'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { MessageSquare, Check, Copy, ExternalLink, X } from 'lucide-react';
import { MESSENGER_CONFIG } from '@/lib/messenger';

export interface ToastData {
  productName: string;
  brand: string;
  flavorName: string;
  price: number;
  message: string;
}

interface MessengerToastProps {
  toast: ToastData | null;
  onClose: () => void;
}

export const MessengerToast: React.FC<MessengerToastProps> = ({ toast, onClose }) => {
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (!toast) return;
    const timer = setTimeout(() => {
      onClose();
    }, 7000);
    return () => clearTimeout(timer);
  }, [toast, onClose]);

  const handleCopyAgain = () => {
    if (!toast) return;
    navigator.clipboard.writeText(toast.message);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleReopenMessenger = () => {
    if (!toast) return;
    const url = `${MESSENGER_CONFIG.mMeUrl}?text=${encodeURIComponent(toast.message)}`;
    window.open(url, '_blank', 'noopener,noreferrer');
  };

  return (
    <AnimatePresence>
      {toast && (
        <motion.div
          initial={{ opacity: 0, y: 30, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 20, scale: 0.95 }}
          transition={{ duration: 0.2, ease: 'easeOut' }}
          className="fixed bottom-5 right-4 sm:right-6 z-50 max-w-sm w-[calc(100vw-2rem)] sm:w-auto"
        >
          <div className="rounded-2xl border border-neutral-200/90 dark:border-white/[0.08] bg-white dark:bg-[#12141c] p-4 shadow-xl text-neutral-900 dark:text-white transition-colors">
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-center gap-2.5">
                <div className="h-8 w-8 rounded-full bg-neutral-900 text-white dark:bg-white dark:text-neutral-900 flex items-center justify-center flex-shrink-0">
                  <MessageSquare className="w-4 h-4" />
                </div>
                <div>
                  <div className="text-xs font-bold text-neutral-900 dark:text-white">
                    Reservation Launched
                  </div>
                  <p className="text-[11px] text-neutral-500 dark:text-neutral-400">
                    {toast.flavorName} • ₱{toast.price.toLocaleString()}
                  </p>
                </div>
              </div>

              <button
                onClick={onClose}
                className="text-neutral-400 hover:text-neutral-900 dark:hover:text-white p-1 rounded-md transition-colors"
                aria-label="Dismiss"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="mt-3 flex items-center gap-2">
              <button
                onClick={handleCopyAgain}
                className="flex-1 flex items-center justify-center gap-1.5 py-1.5 px-3 rounded-lg text-xs font-medium border border-neutral-200 dark:border-white/[0.08] hover:bg-neutral-100 dark:hover:bg-white/[0.06] text-neutral-700 dark:text-neutral-300 transition-colors"
              >
                {copied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copied ? 'Copied' : 'Copy Text'}</span>
              </button>

              <button
                onClick={handleReopenMessenger}
                className="flex items-center justify-center gap-1 py-1.5 px-3 rounded-lg text-xs font-semibold bg-neutral-900 text-white dark:bg-white dark:text-neutral-900 hover:opacity-90 transition-all cursor-pointer shadow-xs"
              >
                <span>Re-open</span>
                <ExternalLink className="w-3 h-3" />
              </button>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
