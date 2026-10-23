'use client';

import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ShieldCheck } from 'lucide-react';

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
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 dark:bg-black/70 backdrop-blur-sm">
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 15 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: -15 }}
          transition={{ duration: 0.2, ease: 'easeOut' }}
          className="relative w-full max-w-sm rounded-2xl border border-neutral-200/90 dark:border-white/[0.08] bg-white dark:bg-[#12141c] p-6 sm:p-7 shadow-2xl text-center transition-colors"
        >
          {/* Minimalist Age Shield */}
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-neutral-100 dark:bg-neutral-800 text-neutral-800 dark:text-neutral-200">
            <ShieldCheck className="h-6 w-6" />
          </div>

          <h2 className="text-lg sm:text-xl font-bold tracking-tight text-neutral-900 dark:text-white mb-1.5 font-space">
            Age Verification
          </h2>

          <p className="text-xs text-neutral-500 dark:text-neutral-400 leading-relaxed mb-6">
            You must be of legal smoking and vaping age (21+) to browse live inventory and reserve products.
          </p>

          <div className="space-y-2">
            <button
              id="age-verify-enter-btn"
              onClick={handleConfirm}
              className="w-full py-2.5 px-4 rounded-xl text-xs sm:text-sm font-semibold text-white bg-neutral-900 hover:bg-neutral-800 dark:bg-white dark:text-neutral-900 dark:hover:bg-neutral-100 transition-all cursor-pointer shadow-xs active:scale-98"
            >
              I am 21 or Older
            </button>

            <button
              id="age-verify-exit-btn"
              onClick={handleReject}
              className="w-full py-2.5 px-4 rounded-xl text-xs font-medium text-neutral-500 hover:text-neutral-800 dark:text-neutral-400 dark:hover:text-white transition-colors cursor-pointer"
            >
              Exit
            </button>
          </div>

          <p className="mt-4 text-[10px] text-neutral-400 dark:text-neutral-600">
            Strictly 21+ only. Nicotine is an addictive chemical.
          </p>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
