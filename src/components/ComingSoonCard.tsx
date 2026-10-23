'use client';

import React from 'react';
import { Sparkles, MessageSquare, Plus, Clock } from 'lucide-react';
import { openMessengerReservation } from '@/lib/messenger';

interface ComingSoonCardProps {
  onRequestFlavor?: (msg: string) => void;
}

export const ComingSoonCard: React.FC<ComingSoonCardProps> = ({ onRequestFlavor }) => {
  const handleRequest = () => {
    const text = 'Hi Rash Vape! Inquiring on upcoming restocks. Are you stocking any new vape devices or flavors soon? I would like to request one!';
    openMessengerReservation(text);
    if (onRequestFlavor) {
      onRequestFlavor(text);
    }
  };

  return (
    <div className="group relative rounded-2xl bg-white dark:bg-[#12141c] border border-dashed border-neutral-300 dark:border-white/15 p-5 sm:p-6 flex flex-col justify-between shadow-xs hover:shadow-lg hover:border-neutral-400 dark:hover:border-white/25 transition-all duration-300">
      
      {/* Top Visual Showcase Area */}
      <div className="relative w-full rounded-xl bg-neutral-100/70 dark:bg-neutral-900/60 p-6 sm:p-8 flex flex-col items-center justify-center overflow-hidden min-h-[180px] sm:min-h-[210px] transition-colors">
        
        {/* Soft Ambient Halo */}
        <div className="absolute inset-0 opacity-20 dark:opacity-25 blur-2xl bg-radial from-emerald-500 via-teal-400 to-transparent pointer-events-none" />

        {/* Minimal Pill */}
        <div className="absolute top-3 left-3 flex items-center gap-1.5">
          <span className="inline-flex items-center gap-1 text-[11px] font-medium tracking-wide px-2.5 py-0.5 rounded-full bg-white/90 dark:bg-neutral-800/90 text-neutral-600 dark:text-neutral-300 border border-neutral-200/60 dark:border-white/[0.06] shadow-xs">
            <Clock className="w-3 h-3 text-emerald-600 dark:text-emerald-400" />
            <span>Next Drop</span>
          </span>
        </div>

        <div className="absolute top-3 right-3 text-[11px] font-mono-spec text-neutral-400 dark:text-neutral-500">
          In Transit
        </div>

        {/* Visual Graphic */}
        <div className="relative z-10 flex flex-col items-center text-center">
          <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl border border-dashed border-neutral-300 dark:border-white/20 flex items-center justify-center bg-white/50 dark:bg-neutral-800/50 backdrop-blur-sm group-hover:scale-105 transition-transform duration-300 shadow-xs">
            <Sparkles className="w-8 h-8 text-neutral-400 dark:text-neutral-500 group-hover:text-emerald-500 transition-colors" />
          </div>
          <span className="text-[11px] font-mono-spec text-neutral-400 dark:text-neutral-500 mt-2.5">
            New Shipments
          </span>
        </div>

      </div>

      {/* Card Info */}
      <div className="mt-4 sm:mt-5 space-y-2">
        <div className="text-[11px] font-mono-spec uppercase tracking-wider text-neutral-400 dark:text-neutral-500">
          INVENTORY PIPELINE
        </div>
        
        <h3 className="text-base sm:text-lg font-bold text-neutral-900 dark:text-white tracking-tight font-space">
          More Coming Soon
        </h3>
        
        <p className="text-xs text-neutral-500 dark:text-neutral-400 leading-relaxed">
          Fresh restocks, new high-capacity disposable models, and customer-requested flavor variants are arriving weekly.
        </p>

        {/* Preview Tags */}
        <div className="flex flex-wrap gap-1.5 pt-2">
          {['New Disposables', 'Dual Mesh Tanks', 'Exclusive Flavors', 'Pods'].map((tag) => (
            <span
              key={tag}
              className="px-2 py-0.5 rounded-md text-[10px] font-medium bg-neutral-100 dark:bg-white/[0.05] text-neutral-600 dark:text-neutral-400 border border-neutral-200/60 dark:border-white/[0.04]"
            >
              {tag}
            </span>
          ))}
        </div>
      </div>

      {/* Action CTA */}
      <div className="mt-5 pt-4 border-t border-neutral-200/80 dark:border-white/[0.08]">
        <button
          onClick={handleRequest}
          className="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl text-xs sm:text-sm font-semibold bg-neutral-100 hover:bg-neutral-200/80 text-neutral-800 dark:bg-white/[0.08] dark:hover:bg-white/[0.12] dark:text-white border border-neutral-200 dark:border-white/10 transition-all cursor-pointer shadow-xs active:scale-98"
        >
          <MessageSquare className="w-3.5 h-3.5" />
          <span>Request a Device or Flavor</span>
        </button>
      </div>

    </div>
  );
};
