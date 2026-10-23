'use client';

import React from 'react';
import { ArrowRight, Sparkles } from 'lucide-react';
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
}) => {
  return (
    <section className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 pt-6 pb-2">
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-neutral-100 via-neutral-50 to-neutral-100 dark:from-neutral-900/90 dark:via-neutral-900/60 dark:to-neutral-900/90 border border-neutral-200/80 dark:border-white/[0.08] p-5 sm:p-7 flex flex-col md:flex-row md:items-center justify-between gap-5 transition-all">
        
        {/* Left: Refined Editorial Highlight */}
        <div className="space-y-1.5 max-w-xl">
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-1 text-[11px] font-semibold uppercase tracking-wider text-emerald-700 dark:text-emerald-400 bg-emerald-500/10 dark:bg-emerald-500/[0.12] px-2.5 py-0.5 rounded-full">
              <Sparkles className="w-3 h-3" />
              Featured In-Stock
            </span>
            <span className="text-[11px] text-neutral-500 dark:text-neutral-400 font-mono-spec">
              {featuredProduct.brand}
            </span>
          </div>

          <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-neutral-900 dark:text-white font-space">
            {featuredProduct.name}
          </h1>

          <p className="text-xs sm:text-sm text-neutral-600 dark:text-neutral-300 line-clamp-1">
            50,000 puffs with crystal dual mesh tank. Live stock available for instant reservation.
          </p>
        </div>

        {/* Right: Quick Action & In-Stock Count */}
        <div className="flex items-center gap-4 sm:gap-6 flex-shrink-0 pt-2 md:pt-0 border-t md:border-t-0 border-neutral-200/70 dark:border-white/[0.08]">
          <div className="text-left md:text-right">
            <div className="text-xs text-neutral-500 dark:text-neutral-400 font-medium">Available Now</div>
            <div className="text-lg sm:text-xl font-bold text-neutral-900 dark:text-white font-mono-spec">
              ₱{featuredProduct.price.toLocaleString()}
            </div>
          </div>

          <button
            id="hero-inspect-flavors-btn"
            onClick={() => onSelectProduct(featuredProduct)}
            className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-xs sm:text-sm font-semibold bg-neutral-900 hover:bg-neutral-800 text-white dark:bg-white dark:hover:bg-neutral-100 dark:text-neutral-900 transition-all cursor-pointer shadow-sm active:scale-98"
          >
            <span>View Flavors</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

      </div>
    </section>
  );
};
