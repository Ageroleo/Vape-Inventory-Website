'use client';

import React, { useState } from 'react';
import { VapeProduct, FlavorVariant } from '@/types/vape';
import { MessageSquare, ArrowUpRight, Check } from 'lucide-react';

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
  const defaultFlavor = product.flavors.find((f) => f.status !== 'out_of_stock') || product.flavors[0];
  const [selectedFlavor, setSelectedFlavor] = useState<FlavorVariant>(defaultFlavor);
  const [isReserving, setIsReserving] = useState(false);

  const totalStockCount = product.flavors.reduce((acc, curr) => acc + (curr.stockCount || 0), 0);
  const isAvailable = selectedFlavor && selectedFlavor.status !== 'out_of_stock' && selectedFlavor.stockCount > 0;

  return (
    <div className="group relative rounded-2xl bg-white dark:bg-[#12141c] border border-neutral-200/90 dark:border-white/[0.08] p-5 sm:p-6 flex flex-col justify-between shadow-xs hover:shadow-xl hover:border-neutral-300 dark:hover:border-white/20 transition-all duration-300">
      
      {/* Top Device Showcase Area */}
      <div className="relative w-full rounded-xl bg-neutral-100/70 dark:bg-neutral-900/60 p-6 sm:p-8 flex flex-col items-center justify-center overflow-hidden min-h-[180px] sm:min-h-[210px] transition-colors">
        
        {/* Soft Dynamic Glow behind Device */}
        <div
          className="absolute inset-0 opacity-25 dark:opacity-30 blur-2xl transition-all duration-700 pointer-events-none"
          style={{
            background: `radial-gradient(circle at center, ${selectedFlavor?.colorHex || '#10b981'} 0%, transparent 70%)`,
          }}
        />

        {/* Minimal Category & Stock Pill */}
        <div className="absolute top-3 left-3 flex items-center gap-1.5">
          <span className="text-[11px] font-medium tracking-wide px-2.5 py-0.5 rounded-full bg-white/90 dark:bg-neutral-800/90 text-neutral-600 dark:text-neutral-300 border border-neutral-200/60 dark:border-white/[0.06] shadow-xs">
            {product.category === 'transparent_disposable' ? 'Transparent' : 'Solid'}
          </span>
          {product.isNewArrival && (
            <span className="text-[10px] font-semibold tracking-wider uppercase px-2 py-0.5 rounded-full bg-neutral-900 text-white dark:bg-white dark:text-neutral-900 shadow-xs">
              New
            </span>
          )}
        </div>

        <div className="absolute top-3 right-3 text-[11px] font-mono-spec text-neutral-500 dark:text-neutral-400">
          {totalStockCount} in stock
        </div>

        {/* Sleek Device Representation */}
        <div className="relative z-10 flex flex-col items-center">
          <div
            className="w-20 h-28 sm:w-24 sm:h-32 rounded-2xl border border-white/60 dark:border-white/20 shadow-lg flex flex-col items-center justify-between p-3 backdrop-blur-sm transition-all duration-500 group-hover:scale-105"
            style={{
              backgroundColor: `${selectedFlavor?.colorHex || '#10b981'}15`,
            }}
          >
            <div
              className="w-4 h-1.5 rounded-full"
              style={{ backgroundColor: selectedFlavor?.colorHex || '#10b981' }}
            />
            <div className="text-center">
              <div className="text-[10px] font-bold text-neutral-800 dark:text-white uppercase tracking-wider font-space line-clamp-1">
                {product.brand}
              </div>
              <div className="text-[9px] text-neutral-500 dark:text-neutral-400 font-mono-spec">
                {product.puffCount ? `${(product.puffCount / 1000).toFixed(0)}k` : '50k'}
              </div>
            </div>
            <div
              className="w-2.5 h-2.5 rounded-full shadow-xs"
              style={{ backgroundColor: selectedFlavor?.colorHex || '#10b981' }}
            />
          </div>
        </div>

      </div>

      {/* Product Details */}
      <div className="mt-4 sm:mt-5 space-y-3">
        
        {/* Title, Brand & Price */}
        <div className="flex items-start justify-between gap-3">
          <div>
            <div className="text-[11px] font-mono-spec uppercase tracking-wider text-neutral-400 dark:text-neutral-500">
              {product.brand}
            </div>
            <h3 className="text-base sm:text-lg font-bold text-neutral-900 dark:text-white tracking-tight font-space mt-0.5">
              {product.name}
            </h3>
            <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-0.5">
              {product.puffCount?.toLocaleString()} Puffs • {product.nicotineStrength}
            </p>
          </div>

          <div className="text-right flex-shrink-0">
            <div className="text-lg sm:text-xl font-bold text-neutral-900 dark:text-white font-mono-spec">
              ₱{product.price.toLocaleString()}
            </div>
            <div className="text-[10px] text-emerald-600 dark:text-emerald-400 font-medium">
              Same-Day Dispatch
            </div>
          </div>
        </div>

        {/* Simplified Flavor Swatches (Clean, uncluttered, easy to click) */}
        <div>
          <div className="flex items-center justify-between text-xs text-neutral-500 dark:text-neutral-400 mb-2">
            <span>Select Flavor:</span>
            <span className="font-medium text-neutral-900 dark:text-white">
              {selectedFlavor?.name}
            </span>
          </div>

          <div className="flex flex-wrap gap-1.5 max-h-28 overflow-y-auto pr-1">
            {product.flavors.map((flavor) => {
              const isSelected = selectedFlavor?.id === flavor.id;
              const hasStock = flavor.status !== 'out_of_stock' && flavor.stockCount > 0;

              return (
                <button
                  key={flavor.id}
                  onClick={() => {
                    if (hasStock) setSelectedFlavor(flavor);
                  }}
                  disabled={!hasStock}
                  className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium transition-all cursor-pointer ${
                    isSelected
                      ? 'bg-neutral-900 text-white dark:bg-white dark:text-neutral-900 shadow-xs'
                      : hasStock
                      ? 'bg-neutral-100 hover:bg-neutral-200/80 text-neutral-700 dark:bg-white/[0.06] dark:hover:bg-white/[0.1] dark:text-neutral-300'
                      : 'bg-neutral-100/50 text-neutral-400 dark:bg-white/[0.02] dark:text-neutral-600 line-through opacity-40 cursor-not-allowed'
                  }`}
                >
                  <span
                    className="w-2 h-2 rounded-full flex-shrink-0"
                    style={{ backgroundColor: flavor.colorHex }}
                  />
                  <span>{flavor.name}</span>
                  {isSelected && <Check className="w-3 h-3 ml-0.5" />}
                </button>
              );
            })}
          </div>
        </div>

      </div>

      {/* Clean Actions */}
      <div className="mt-5 pt-4 border-t border-neutral-200/80 dark:border-white/[0.08] flex items-center gap-2">
        <button
          onClick={() => {
            if (!isAvailable) return;
            setIsReserving(true);
            onInstantReserve(product, selectedFlavor);
            setTimeout(() => setIsReserving(false), 2000);
          }}
          disabled={!isAvailable}
          className={`flex-1 flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl text-xs sm:text-sm font-semibold transition-all cursor-pointer ${
            isAvailable
              ? 'bg-neutral-900 hover:bg-neutral-800 text-white dark:bg-white dark:hover:bg-neutral-100 dark:text-neutral-900 active:scale-98 shadow-sm'
              : 'bg-neutral-200 text-neutral-400 dark:bg-neutral-800 dark:text-neutral-600 cursor-not-allowed'
          }`}
        >
          <MessageSquare className="w-3.5 h-3.5" />
          <span>{isReserving ? 'Opening...' : 'Reserve on Messenger'}</span>
        </button>

        <button
          onClick={() => onQuickView(product, selectedFlavor)}
          className="p-2.5 rounded-xl border border-neutral-200/80 hover:bg-neutral-100 dark:border-white/[0.08] dark:hover:bg-white/[0.06] text-neutral-700 dark:text-neutral-300 transition-colors cursor-pointer"
          title="View Device Specifications"
        >
          <ArrowUpRight className="w-4 h-4" />
        </button>
      </div>

    </div>
  );
};
