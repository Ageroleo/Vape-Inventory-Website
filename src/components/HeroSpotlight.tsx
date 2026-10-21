'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { Sparkles, ChevronRight, CheckCircle2, Zap } from 'lucide-react';
import { VapeProduct } from '@/types/vape';

interface HeroSpotlightProps {
  featuredProduct: VapeProduct;
  onSelectProduct: (p: VapeProduct) => void;
  disposablesCount: number;
  totalFlavorsCount: number;
  lastUpdatedText: string;
}

export const HeroSpotlight: React.FC<HeroSpotlightProps> = ({
  featuredProduct,
  onSelectProduct,
  disposablesCount,
  totalFlavorsCount,
  lastUpdatedText,
}) => {
  return (
    <section className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 pt-4 sm:pt-6 pb-2 sm:pb-4">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-3.5 sm:gap-6">

        {/* Left Bento: Featured Restock Drop (2/3 width) */}
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
          className="lg:col-span-2 relative overflow-hidden rounded-2xl sm:rounded-3xl border border-slate-200/90 dark:border-white/10 bg-gradient-to-br from-white via-slate-50/80 to-teal-50/30 dark:from-zinc-900/90 dark:via-zinc-950/80 dark:to-[#0c0e17] p-5 sm:p-8 backdrop-blur-md shadow-xl shadow-slate-200/50 dark:shadow-2xl flex flex-col justify-between group transition-colors"
        >
          {/* Subtle Ambient Radial Glow */}
          <div className="absolute -right-20 -top-20 w-80 h-80 bg-teal-500/10 rounded-full blur-3xl pointer-events-none group-hover:bg-teal-500/15 transition-all duration-700" />
          <div className="absolute -left-10 -bottom-10 w-60 h-60 bg-purple-500/10 rounded-full blur-3xl pointer-events-none" />

          <div>
            {/* Top Badges */}
            <div className="flex flex-wrap items-center gap-2 mb-3 sm:mb-4">
              <span className="inline-flex items-center gap-1.5 px-2.5 sm:px-3 py-1 rounded-full text-[11px] sm:text-xs font-semibold uppercase tracking-wider bg-teal-500/15 text-teal-700 dark:text-teal-300 border border-teal-500/30">
                <Sparkles className="w-3 sm:w-3.5 h-3 sm:h-3.5 text-teal-500 dark:text-teal-400" />
                Featured Restock
              </span>
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] sm:text-xs font-mono-spec bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border border-emerald-500/20">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 dark:bg-emerald-400 animate-ping"></span>
                Freshly Unboxed
              </span>
            </div>

            {/* Title & Brand */}
            <div className="max-w-xl">
              <div className="text-[11px] sm:text-xs uppercase tracking-widest text-slate-500 dark:text-zinc-400 font-mono-spec mb-1">
                {featuredProduct.brand}
              </div>
              <h1 className="text-xl sm:text-3xl lg:text-4xl font-extrabold text-slate-900 dark:text-white tracking-tight mb-2 font-space">
                {featuredProduct.name}
              </h1>
              <p className="text-xs sm:text-sm text-slate-600 dark:text-zinc-300 line-clamp-2 mb-4 sm:mb-5">
                {featuredProduct.description}
              </p>
            </div>

            {/* Floating Spec Chips */}
            <div className="flex flex-wrap items-center gap-2 sm:gap-2.5 mb-5 sm:mb-6">
              {featuredProduct.puffCount && (
                <div className="px-2.5 sm:px-3 py-1 sm:py-1.5 rounded-xl bg-slate-100 dark:bg-zinc-900/90 border border-slate-200 dark:border-white/10 text-[11px] sm:text-xs font-mono-spec text-teal-700 dark:text-teal-300 flex items-center gap-1.5 shadow-xs">
                  <span className="text-slate-500 dark:text-zinc-500">PUFFS:</span>
                  <span className="font-bold">{featuredProduct.puffCount.toLocaleString()}</span>
                </div>
              )}
              <div className="px-2.5 sm:px-3 py-1 sm:py-1.5 rounded-xl bg-slate-100 dark:bg-zinc-900/90 border border-slate-200 dark:border-white/10 text-[11px] sm:text-xs font-mono-spec text-purple-700 dark:text-purple-300 flex items-center gap-1.5 shadow-xs">
                <span className="text-slate-500 dark:text-zinc-500">NIC:</span>
                <span className="font-bold">{featuredProduct.nicotineStrength}</span>
              </div>
              {featuredProduct.coilType && (
                <div className="px-2.5 sm:px-3 py-1 sm:py-1.5 rounded-xl bg-slate-100 dark:bg-zinc-900/90 border border-slate-200 dark:border-white/10 text-[11px] sm:text-xs font-mono-spec text-amber-700 dark:text-amber-300 flex items-center gap-1.5 shadow-xs">
                  <span className="text-slate-500 dark:text-zinc-500">COIL:</span>
                  <span className="font-bold">{featuredProduct.coilType.split('(')[0]}</span>
                </div>
              )}
            </div>
          </div>

          {/* Bottom Action & Price */}
          <div className="pt-3.5 sm:pt-4 border-t border-slate-200 dark:border-white/10 flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4">
            <div className="flex items-baseline gap-2 sm:gap-2.5 flex-wrap">
              <span className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white font-mono-spec">
                ₱{featuredProduct.price.toLocaleString()}
              </span>
              {featuredProduct.compareAtPrice && (
                <span className="text-xs sm:text-sm text-slate-400 dark:text-zinc-500 line-through font-mono-spec">
                  ₱{featuredProduct.compareAtPrice.toLocaleString()}
                </span>
              )}
              <span className="text-[11px] sm:text-xs text-emerald-600 dark:text-emerald-400 font-mono-spec font-medium">Instant Reserve Ready</span>
            </div>

            <button
              id="hero-inspect-flavors-btn"
              onClick={() => onSelectProduct(featuredProduct)}
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-5 py-2.5 sm:py-3 rounded-xl text-xs sm:text-sm font-semibold text-black bg-gradient-to-r from-teal-400 to-teal-300 hover:from-teal-300 hover:to-teal-200 transition-all shadow-lg shadow-teal-500/20 active:scale-[0.98] cursor-pointer"
            >
              <span>View Available Flavors</span>
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </motion.div>

        {/* Right Bento Column: Live Stock Status */}
        <div className="flex flex-col">
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: 0.1 }}
            className="h-full rounded-2xl sm:rounded-3xl border border-slate-200/90 dark:border-white/10 bg-white/90 dark:bg-zinc-900/70 p-4 sm:p-6 backdrop-blur-md shadow-xl shadow-slate-200/50 dark:shadow-xl flex flex-col justify-between relative overflow-hidden transition-colors"
          >
            <div>
              <div className="flex items-center justify-between mb-4 sm:mb-6">
                <span className="text-xs font-semibold uppercase tracking-wider text-teal-600 dark:text-teal-400 flex items-center gap-1.5">
                  <Zap className="w-3.5 h-3.5" />
                  Live Stock Status
                </span>
                <span className="text-[11px] font-mono-spec text-slate-500 dark:text-zinc-400">
                  {lastUpdatedText}
                </span>
              </div>

              <div className="grid grid-cols-3 gap-2 sm:gap-3 py-1 sm:py-2">
                <div className="rounded-xl sm:rounded-2xl bg-slate-50 dark:bg-zinc-950/60 border border-slate-200 dark:border-white/5 p-2.5 sm:p-4 text-center">
                  <div className="text-lg sm:text-2xl lg:text-3xl font-bold text-slate-900 dark:text-white font-mono-spec">
                    {disposablesCount}
                  </div>
                  <div className="text-[10px] sm:text-xs text-slate-500 dark:text-zinc-400 mt-0.5 sm:mt-1">Total Pieces</div>
                </div>

                <div className="rounded-xl sm:rounded-2xl bg-slate-50 dark:bg-zinc-950/60 border border-slate-200 dark:border-white/5 p-2.5 sm:p-4 text-center">
                  <div className="text-lg sm:text-2xl lg:text-3xl font-bold text-teal-600 dark:text-teal-400 font-mono-spec">
                    {totalFlavorsCount}
                  </div>
                  <div className="text-[10px] sm:text-xs text-slate-500 dark:text-zinc-400 mt-0.5 sm:mt-1">Flavors Ready</div>
                </div>

                <div className="rounded-xl sm:rounded-2xl bg-slate-50 dark:bg-zinc-950/60 border border-slate-200 dark:border-white/5 p-2.5 sm:p-4 text-center">
                  <div className="text-sm sm:text-lg lg:text-xl font-bold text-emerald-600 dark:text-emerald-400 font-mono-spec pt-0.5">
                    ₱270–₱320
                  </div>
                  <div className="text-[10px] sm:text-xs text-slate-500 dark:text-zinc-400 mt-0.5 sm:mt-1">Price Range</div>
                </div>
              </div>
            </div>

            <div className="mt-4 sm:mt-6 pt-3 sm:pt-4 border-t border-slate-200 dark:border-white/5 flex items-center justify-between text-[11px] sm:text-xs text-slate-500 dark:text-zinc-400">
              <span className="flex items-center gap-1.5 text-emerald-600 dark:text-emerald-400 font-medium">
                <CheckCircle2 className="w-3.5 sm:w-4 h-3.5 sm:h-4" /> 100% Authentic
              </span>
              <span className="text-[10px] sm:text-[11px] font-mono-spec text-slate-400 dark:text-zinc-500">Auto-Refreshed</span>
            </div>
          </motion.div>
        </div>

      </div>
    </section>
  );
};
