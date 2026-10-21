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
          initial={{ opacity: 0, y: 50, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 20, scale: 0.95 }}
          transition={{ duration: 0.25, ease: 'easeOut' }}
          className="fixed bottom-6 right-4 sm:right-6 z-50 max-w-md w-[calc(100vw-2rem)] sm:w-auto"
        >
          <div className="rounded-2xl border border-teal-500/30 bg-white/95 dark:bg-zinc-950/95 backdrop-blur-xl p-4 sm:p-5 shadow-2xl shadow-slate-300/60 dark:shadow-[0_10px_40px_rgba(0,0,0,0.8),0_0_25px_rgba(0,245,212,0.15)] text-slate-900 dark:text-white transition-colors">
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-xl bg-gradient-to-tr from-teal-500 to-cyan-400 text-black flex items-center justify-center flex-shrink-0 shadow-lg shadow-teal-500/25">
                  <MessageSquare className="w-5 h-5" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-bold text-slate-900 dark:text-white">Opening Messenger</span>
                    <span className="flex h-2 w-2 relative">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-teal-400 opacity-75"></span>
                      <span className="relative inline-flex rounded-full h-2 w-2 bg-teal-500"></span>
                    </span>
                  </div>
                  <p className="text-xs text-slate-600 dark:text-zinc-400 mt-0.5">
                    Flavor details pre-filled. Just tap <span className="text-teal-600 dark:text-teal-300 font-semibold">Send</span>!
                  </p>
                </div>
              </div>

              <button
                onClick={onClose}
                className="text-slate-400 hover:text-slate-700 dark:text-zinc-500 dark:hover:text-white p-1 rounded-lg hover:bg-slate-100 dark:hover:bg-zinc-800 transition-colors"
                aria-label="Dismiss notification"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Reservation Summary Pill */}
            <div className="mt-3 p-2.5 rounded-xl bg-slate-100 dark:bg-zinc-900/90 border border-slate-200 dark:border-white/10 text-xs flex items-center justify-between gap-2">
              <div className="truncate">
                <span className="text-teal-600 dark:text-teal-400 font-medium">{toast.brand}</span>{' '}
                <span className="text-slate-700 dark:text-zinc-300">• {toast.flavorName}</span>
              </div>
              <span className="font-mono-spec font-bold text-slate-900 dark:text-white flex-shrink-0">
                ₱{toast.price.toLocaleString()}
              </span>
            </div>

            {/* Quick Actions */}
            <div className="mt-3 flex items-center gap-2">
              <button
                onClick={handleCopyAgain}
                className="flex-1 flex items-center justify-center gap-1.5 py-1.5 px-3 rounded-lg text-xs font-semibold bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 dark:text-zinc-300 dark:border-white/10 transition-colors"
              >
                {copied ? <Check className="w-3.5 h-3.5 text-emerald-500 dark:text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copied ? 'Copied!' : 'Copy Text'}</span>
              </button>

              <button
                onClick={handleReopenMessenger}
                className="flex-1 flex items-center justify-center gap-1.5 py-1.5 px-3 rounded-lg text-xs font-semibold bg-teal-400 hover:bg-teal-300 text-black transition-colors"
              >
                <ExternalLink className="w-3.5 h-3.5" />
                <span>Re-open Chat</span>
              </button>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
