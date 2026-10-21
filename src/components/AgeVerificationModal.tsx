'use client';

import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ShieldAlert, CheckCircle2, XCircle } from 'lucide-react';

export const AgeVerificationModal: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    const verified = localStorage.getItem('vape_age_verified');
    if (verified !== 'true') {
      setIsOpen(true);
    }
  }, []);

  const handleConfirm = () => {
    localStorage.setItem('vape_age_verified', 'true');
    setIsOpen(false);
  };

  const handleReject = () => {
    window.location.href = 'https://www.google.com';
  };

  if (!mounted || !isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 dark:bg-black/85 backdrop-blur-xl">
        <motion.div
          initial={{ opacity: 0, scale: 0.9, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: -20 }}
          transition={{ duration: 0.25, ease: 'easeOut' }}
          className="relative w-full max-w-sm sm:max-w-md overflow-hidden rounded-2xl border border-slate-200 dark:border-white/10 bg-white/95 dark:bg-zinc-950/90 p-5 sm:p-8 shadow-2xl text-center transition-colors"
        >
          {/* Neon accent line */}
          <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-teal-400 via-purple-500 to-teal-400" />

          {/* Age Icon */}
          <div className="mx-auto mb-4 sm:mb-5 flex h-14 w-14 sm:h-16 sm:w-16 items-center justify-center rounded-2xl bg-teal-500/10 border border-teal-500/20 text-teal-600 dark:text-teal-400">
            <ShieldAlert className="h-7 w-7 sm:h-8 sm:w-8" />
          </div>

          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] sm:text-xs font-semibold uppercase tracking-wider bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/20 mb-3">
            Age Verification Required
          </div>

          <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900 dark:text-white mb-2 font-space">
            Are you 21 or older?
          </h2>

          <p className="text-xs sm:text-sm text-slate-600 dark:text-zinc-400 leading-relaxed mb-5 sm:mb-6">
            You must be of legal smoking and vaping age (21+) in your jurisdiction to browse live inventory, view nicotine products, or reserve stock.
          </p>

          <div className="space-y-3">
            <button
              id="age-verify-enter-btn"
              onClick={handleConfirm}
              className="w-full flex items-center justify-center gap-2 py-3.5 px-6 rounded-xl font-medium text-black bg-gradient-to-r from-teal-400 to-teal-300 hover:from-teal-300 hover:to-teal-200 transition-all duration-200 shadow-lg shadow-teal-500/20 active:scale-[0.98] cursor-pointer"
            >
              <CheckCircle2 className="w-5 h-5" />
              <span>I am of Legal Age (Enter)</span>
            </button>

            <button
              id="age-verify-exit-btn"
              onClick={handleReject}
              className="w-full flex items-center justify-center gap-2 py-3 px-6 rounded-xl font-medium text-slate-600 hover:text-slate-900 dark:text-zinc-400 dark:hover:text-zinc-200 bg-slate-100 hover:bg-slate-200 dark:bg-zinc-900/80 dark:hover:bg-zinc-800 border border-slate-200 dark:border-white/5 transition-all duration-200 cursor-pointer text-sm"
            >
              <XCircle className="w-4 h-4" />
              <span>Exit (Under 21)</span>
            </button>
          </div>

          <p className="mt-5 text-[11px] text-slate-400 dark:text-zinc-500">
            By entering, you confirm you meet local age regulations. Nicotine is an addictive chemical.
          </p>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
