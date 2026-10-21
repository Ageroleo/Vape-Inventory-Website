'use client';

import React, { useState } from 'react';
import { VapeProduct, FlavorVariant } from '@/types/vape';
import { Eye, MessageSquare, Wind, Droplet, Check, Zap, Layers } from 'lucide-react';

interface ProductCardProps {
  product: VapeProduct;
  onQuickView: (p: VapeProduct, defaultFlavor?: FlavorVariant) => void;
  onInstantReserve: (p: VapeProduct, flavor: FlavorVariant) => void;
}

export const ProductCard: React.FC<ProductCardProps> = ({
  product,
  onQuickView,
  onInstantReserve,
}) => {
  // Default to the first in-stock flavor if available, else first flavor
  const defaultFlavor = product.flavors.find((f) => f.status !== 'out_of_stock') || product.flavors[0];
  const [selectedFlavor, setSelectedFlavor] = useState<FlavorVariant>(defaultFlavor);
  const [hoveredFlavor, setHoveredFlavor] = useState<FlavorVariant | null>(null);
  const [isReserving, setIsReserving] = useState(false);

  const activeFlavor = hoveredFlavor || selectedFlavor;

  // Aggregate stock stats
  const totalStockCount = product.flavors.reduce((acc, curr) => acc + curr.stockCount, 0);
  const inStockFlavorsCount = product.flavors.filter((f) => f.status !== 'out_of_stock').length;

  const isTransparent = product.category === 'transparent_disposable';

  return (
    <div
      className="group relative rounded-2xl sm:rounded-3xl border border-slate-200/90 dark:border-white/10 bg-white/95 dark:bg-gradient-to-b dark:from-zinc-900/90 dark:via-zinc-950/90 dark:to-[#0a0c14] backdrop-blur-xl overflow-hidden hover:border-teal-500/50 dark:hover:border-teal-400/50 hover:shadow-2xl hover:shadow-teal-500/10 shadow-lg shadow-slate-200/60 dark:shadow-none transition-all duration-500 flex flex-col justify-between"
      style={{
        boxShadow: activeFlavor?.colorHex
          ? `0 10px 40px -15px ${activeFlavor.colorHex}25`
          : undefined,
      }}
    >
      {/* Dynamic Ambient Top Glow (driven by active flavor color) */}
      <div
        className="absolute top-0 left-0 right-0 h-1 transition-colors duration-500"
        style={{
          backgroundColor: activeFlavor?.colorHex || (isTransparent ? '#00f5d4' : '#7928ca'),
          boxShadow: `0 0 20px ${activeFlavor?.colorHex || '#00f5d4'}`,
        }}
      />
      <div
        className="absolute -top-24 left-1/2 -translate-x-1/2 w-72 h-36 rounded-full blur-3xl opacity-20 pointer-events-none transition-all duration-700"
        style={{
          backgroundColor: activeFlavor?.colorHex || (isTransparent ? '#00f5d4' : '#7928ca'),
        }}
      />

      <div className="p-4 sm:p-7 space-y-4 sm:space-y-6">
        {/* Header Badges: Category & Live Stock Count */}
        <div className="flex flex-wrap items-center justify-between gap-2.5">
          <div className="flex items-center gap-2">
            <span
              className={`px-3 py-1 rounded-full text-xs font-semibold uppercase tracking-wider border backdrop-blur-md flex items-center gap-1.5 ${
                isTransparent
                  ? 'bg-teal-500/10 text-teal-700 dark:text-teal-300 border-teal-500/30'
                  : 'bg-purple-500/10 text-purple-700 dark:text-purple-300 border-purple-500/30'
              }`}
            >
              <span
                className={`w-1.5 h-1.5 rounded-full ${
                  isTransparent ? 'bg-teal-500 dark:bg-teal-400 animate-pulse' : 'bg-purple-500 dark:bg-purple-400'
                }`}
              />
              {isTransparent ? 'Transparent Tank' : 'Non-Transparent Solid'}
            </span>

            {product.isNewArrival && (
              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-teal-400 text-black shadow-xs">
                NEW
              </span>
            )}
          </div>

          <div className="flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-mono-spec border border-emerald-500/30 bg-emerald-50 dark:bg-emerald-500/10 text-emerald-700 dark:text-emerald-400">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 dark:bg-emerald-400 animate-pulse" />
            <span className="font-semibold">{totalStockCount} Pieces In Stock</span>
          </div>
        </div>

        {/* Title, Brand & Large Neon Price */}
        <div>
          <div className="flex items-center justify-between gap-4 mb-1">
            <span className="text-xs font-mono-spec uppercase tracking-[0.2em] text-teal-600 dark:text-teal-400 font-bold">
              {product.brand} • READY STOCK
            </span>
            <span className="text-[11px] font-mono-spec text-slate-500 dark:text-zinc-400">
              {inStockFlavorsCount} Flavors Ready
            </span>
          </div>

          <h3 className="text-lg sm:text-2xl font-extrabold text-slate-900 dark:text-white tracking-tight group-hover:text-teal-600 dark:group-hover:text-teal-300 transition-colors font-space">
            {product.name}
          </h3>

          <div className="mt-2.5 sm:mt-3 flex items-baseline gap-2 sm:gap-3 flex-wrap font-mono-spec">
            <span className="text-2xl sm:text-4xl font-extrabold text-slate-900 dark:text-white tracking-tight">
              ₱{product.price.toLocaleString()}
            </span>
            {product.compareAtPrice && (
              <span className="text-xs sm:text-sm text-slate-400 dark:text-zinc-500 line-through">
                ₱{product.compareAtPrice.toLocaleString()}
              </span>
            )}
            <span className="text-[11px] sm:text-xs font-semibold text-emerald-700 dark:text-emerald-400 px-2 py-0.5 rounded-md bg-emerald-500/10 border border-emerald-500/20">
              Instant Reserve
            </span>
          </div>
        </div>

        {/* Hardware Spec Badges Strip */}
        <div className="grid grid-cols-3 gap-1.5 sm:gap-2.5 p-2.5 sm:p-3 rounded-xl sm:rounded-2xl bg-slate-50 dark:bg-zinc-950/60 border border-slate-200 dark:border-white/5">
          <div className="text-center">
            <div className="text-[10px] font-mono-spec uppercase text-slate-500 dark:text-zinc-400 flex items-center justify-center gap-1">
              <Zap className="w-3 h-3 text-teal-500 dark:text-teal-400" /> Puffs
            </div>
            <div className="text-xs sm:text-sm font-bold text-slate-800 dark:text-white font-mono-spec mt-0.5">
              {product.puffCount?.toLocaleString() || '35,000+'}
            </div>
          </div>

          <div className="text-center border-x border-slate-200 dark:border-white/5">
            <div className="text-[10px] font-mono-spec uppercase text-slate-500 dark:text-zinc-400 flex items-center justify-center gap-1">
              <Droplet className="w-3 h-3 text-purple-500 dark:text-purple-400" /> Nicotine
            </div>
            <div className="text-xs sm:text-sm font-bold text-purple-700 dark:text-purple-300 font-mono-spec mt-0.5">
              {product.nicotineStrength.includes('Freebase') ? '3% Freebase' : '3% (30mg)'}
            </div>
          </div>

          <div className="text-center">
            <div className="text-[10px] font-mono-spec uppercase text-slate-500 dark:text-zinc-400 flex items-center justify-center gap-1">
              <Layers className="w-3 h-3 text-amber-500 dark:text-amber-400" /> Coil
            </div>
            <div className="text-xs sm:text-sm font-bold text-amber-700 dark:text-amber-300 font-mono-spec mt-0.5">
              {product.coilType?.includes('Mesh') ? 'Dual Mesh' : 'Mesh Coil'}
            </div>
          </div>
        </div>

        {/* Active Flavor Spotlight Panel */}
        <div
          className="p-4 rounded-2xl border transition-all duration-300 relative overflow-hidden"
          style={{
            borderColor: `${activeFlavor?.colorHex || '#00f5d4'}40`,
            backgroundColor: `${activeFlavor?.colorHex || '#00f5d4'}14`,
          }}
        >
          <div className="flex items-center justify-between gap-3 mb-2">
            <div className="flex items-center gap-2.5 min-w-0">
              <span
                className="w-3.5 h-3.5 rounded-full flex-shrink-0 shadow-lg"
                style={{
                  backgroundColor: activeFlavor?.colorHex || '#00f5d4',
                  boxShadow: `0 0 12px ${activeFlavor?.colorHex || '#00f5d4'}`,
                }}
              />
              <span className="text-sm sm:text-base font-bold text-slate-900 dark:text-white truncate">
                {activeFlavor?.name}
              </span>
            </div>

            <span className="text-xs font-mono-spec font-bold px-2 py-0.5 rounded-md bg-white/90 dark:bg-black/60 border border-slate-200 dark:border-white/10 text-teal-700 dark:text-teal-300 flex-shrink-0">
              {activeFlavor && activeFlavor.stockCount > 0 ? (
                `${activeFlavor.stockCount} pcs ready`
              ) : (
                <span className="text-rose-500 dark:text-rose-400">Sold Out</span>
              )}
            </span>
          </div>

          {/* Ice & Sweetness Meters */}
          {activeFlavor && (
            <div className="grid grid-cols-2 gap-3 pt-2 border-t border-slate-200/80 dark:border-white/10 text-xs font-mono-spec">
              <div className="flex items-center justify-between">
                <span className="flex items-center gap-1 text-cyan-600 dark:text-cyan-300">
                  <Wind className="w-3 h-3" /> Ice
                </span>
                <div className="flex gap-1">
                  {[1, 2, 3, 4, 5].map((lvl) => (
                    <span
                      key={lvl}
                      className={`w-2 h-2 rounded-xs ${
                        lvl <= activeFlavor.coolingLevel ? 'bg-cyan-500 dark:bg-cyan-400' : 'bg-slate-200 dark:bg-zinc-800'
                      }`}
                    />
                  ))}
                </div>
              </div>

              <div className="flex items-center justify-between">
                <span className="flex items-center gap-1 text-pink-600 dark:text-pink-300">
                  <Droplet className="w-3 h-3" /> Sweet
                </span>
                <div className="flex gap-1">
                  {[1, 2, 3, 4, 5].map((lvl) => (
                    <span
                      key={lvl}
                      className={`w-2 h-2 rounded-xs ${
                        lvl <= activeFlavor.sweetnessLevel ? 'bg-pink-500 dark:bg-pink-400' : 'bg-slate-200 dark:bg-zinc-800'
                      }`}
                    />
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Interactive Flavors Grid (Full Names Clearly Displayed) */}
        <div>
          <div className="flex items-center justify-between text-xs font-medium text-slate-700 dark:text-zinc-300 mb-2.5">
            <span>Select Flavor ({product.flavors.length} options):</span>
            <span className="text-slate-500 dark:text-zinc-400 text-[11px]">Click to preview</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-56 overflow-y-auto pr-1">
            {product.flavors.map((flavor) => {
              const isSelected = selectedFlavor?.id === flavor.id;
              const isAvailable = flavor.status !== 'out_of_stock';

              return (
                <button
                  key={flavor.id}
                  onClick={() => {
                    if (isAvailable) setSelectedFlavor(flavor);
                  }}
                  onMouseEnter={() => setHoveredFlavor(flavor)}
                  onMouseLeave={() => setHoveredFlavor(null)}
                  disabled={!isAvailable}
                  className={`flex items-center justify-between gap-2 px-3 py-2.5 rounded-xl text-xs font-medium border transition-all text-left cursor-pointer ${
                    isSelected
                      ? 'bg-teal-500/10 dark:bg-zinc-900 border-teal-500 dark:border-teal-400 text-slate-900 dark:text-white shadow-md shadow-teal-500/15'
                      : isAvailable
                      ? 'bg-slate-50 hover:bg-slate-100/90 border-slate-200 text-slate-700 dark:bg-zinc-950/60 dark:hover:bg-zinc-900 dark:border-white/5 dark:text-zinc-300'
                      : 'bg-slate-100/50 border-slate-200 text-slate-400 line-through opacity-40 dark:bg-zinc-950/20 dark:border-white/5 dark:text-zinc-600 cursor-not-allowed'
                  }`}
                  style={{
                    borderColor: isSelected ? flavor.colorHex : undefined,
                  }}
                >
                  <div className="flex items-center gap-2 truncate">
                    <span
                      className="w-2.5 h-2.5 rounded-full flex-shrink-0"
                      style={{
                        backgroundColor: flavor.colorHex,
                        boxShadow: isSelected ? `0 0 8px ${flavor.colorHex}` : undefined,
                      }}
                    />
                    <span className="truncate">{flavor.name}</span>
                  </div>

                  <div className="flex items-center gap-1.5 flex-shrink-0">
                    <span className="text-[10px] font-mono-spec text-slate-500 dark:text-zinc-400">
                      {flavor.stockCount} left
                    </span>
                    {isSelected && (
                      <Check className="w-3.5 h-3.5 text-teal-600 dark:text-teal-400" />
                    )}
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Card Footer Actions */}
      <div className="p-4 pt-0 sm:p-6 sm:pt-0 border-t border-slate-200 dark:border-white/10 mt-2 grid grid-cols-1 sm:grid-cols-2 gap-2 sm:gap-3">
        <button
          onClick={() => onQuickView(product, selectedFlavor)}
          className="flex items-center justify-center gap-2 py-2.5 sm:py-3 px-3 sm:px-4 rounded-xl text-xs sm:text-sm font-semibold bg-slate-100 hover:bg-slate-200/80 text-slate-800 dark:bg-zinc-900 dark:hover:bg-zinc-800 dark:text-zinc-200 border border-slate-200 dark:border-white/10 hover:border-teal-400/40 transition-all cursor-pointer"
        >
          <Eye className="w-4 h-4 text-teal-600 dark:text-teal-400" />
          <span>Full Specs</span>
        </button>

        <button
          onClick={() => {
            if (selectedFlavor.status === 'out_of_stock') return;
            setIsReserving(true);
            onInstantReserve(product, selectedFlavor);
            setTimeout(() => setIsReserving(false), 2000);
          }}
          disabled={selectedFlavor.status === 'out_of_stock'}
          title={`Reserve ${selectedFlavor.name} directly on Messenger`}
          className={`flex items-center justify-center gap-2 py-2.5 sm:py-3 px-3 sm:px-4 rounded-xl text-xs sm:text-sm font-semibold transition-all cursor-pointer ${
            selectedFlavor.status !== 'out_of_stock'
              ? 'bg-gradient-to-r from-teal-400 to-teal-300 hover:from-teal-300 hover:to-teal-200 text-black font-bold shadow-lg shadow-teal-500/25 active:scale-[0.98]'
              : 'bg-slate-100 text-slate-400 dark:bg-zinc-800 dark:text-zinc-500 cursor-not-allowed opacity-50'
          }`}
        >
          <MessageSquare className={`w-4 h-4 ${isReserving ? 'animate-bounce' : ''}`} />
          <span>{isReserving ? 'Opening Messenger...' : 'Reserve on Messenger'}</span>
        </button>
      </div>
    </div>
  );
};
