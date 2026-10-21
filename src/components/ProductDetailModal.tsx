'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { VapeProduct, FlavorVariant } from '@/types/vape';
import { openMessengerReservation } from '@/lib/messenger';
import {
  X, Check, Wind, Droplet, Zap, Battery,
  Layers, Sliders, Sparkles, MessageSquare, Copy, CheckCheck, Share2
} from 'lucide-react';

interface ProductDetailModalProps {
  product: VapeProduct | null;
  initialFlavor?: FlavorVariant;
  isOpen: boolean;
  onClose: () => void;
}

export const ProductDetailModal: React.FC<ProductDetailModalProps> = ({
  product,
  initialFlavor,
  isOpen,
  onClose,
}) => {
  const [selectedFlavorIds, setSelectedFlavorIds] = useState<string[]>([]);
  const [activeHighlightFlavor, setActiveHighlightFlavor] = useState<FlavorVariant | null>(null);
  const [copied, setCopied] = useState(false);
  const [isReserving, setIsReserving] = useState(false);

  useEffect(() => {
    if (product) {
      if (initialFlavor && initialFlavor.status !== 'out_of_stock') {
        setSelectedFlavorIds([initialFlavor.id]);
        setActiveHighlightFlavor(initialFlavor);
      } else {
        const firstInStock = product.flavors.find((f) => f.status !== 'out_of_stock');
        if (firstInStock) {
          setSelectedFlavorIds([firstInStock.id]);
          setActiveHighlightFlavor(firstInStock);
        } else {
          setSelectedFlavorIds([]);
          setActiveHighlightFlavor(product.flavors[0]);
        }
      }
    }
  }, [product, initialFlavor]);

  if (!isOpen || !product) return null;

  const toggleFlavorSelection = (flavor: FlavorVariant) => {
    if (flavor.status === 'out_of_stock') return;
    setActiveHighlightFlavor(flavor);

    setSelectedFlavorIds((prev) => {
      if (prev.includes(flavor.id)) {
        return prev.filter((id) => id !== flavor.id);
      } else {
        return [...prev, flavor.id];
      }
    });
  };

  const selectedFlavors = product.flavors.filter((f) => selectedFlavorIds.includes(f.id));
  const totalPrice = product.price * (selectedFlavors.length || 1);

  // Generate Inquiry Template
  const generateInquiryText = () => {
    const flavorNames = selectedFlavors.map((f) => f.name).join(', ') || 'Any In-Stock Flavor';
    return `Hi Rash Vape! Inquiring on live stock availability to reserve:\n• Product: ${product.brand} - ${product.name}\n• Flavor(s): ${flavorNames}\n• Qty: ${selectedFlavors.length || 1}\n• Est. Price: ₱${totalPrice.toLocaleString()}\nAre these ready for same-day delivery / store pickup? Thank you!`;
  };

  const handleCopyInquiry = () => {
    navigator.clipboard.writeText(generateInquiryText());
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  const handleFacebookReserve = () => {
    const text = generateInquiryText();
    setIsReserving(true);
    setCopied(true);
    openMessengerReservation(text);
    setTimeout(() => {
      setIsReserving(false);
      setCopied(false);
    }, 3000);
  };

  const handleWhatsApp = () => {
    const text = encodeURIComponent(generateInquiryText());
    window.open(`https://api.whatsapp.com/send?text=${text}`, '_blank');
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-6 bg-black/60 dark:bg-black/85 backdrop-blur-md overflow-y-auto">
        <motion.div
          initial={{ opacity: 0, scale: 0.94, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.94, y: 20 }}
          transition={{ duration: 0.25, ease: 'easeOut' }}
          className="relative w-full max-w-4xl max-h-[96vh] sm:max-h-[92vh] flex flex-col rounded-2xl sm:rounded-3xl border border-slate-200/90 dark:border-white/10 bg-white dark:bg-card-dark text-slate-900 dark:text-white shadow-2xl overflow-hidden transition-colors"
        >
          {/* Close button */}
          <button
            onClick={onClose}
            aria-label="Close details"
            className="absolute top-3 right-3 sm:top-4 sm:right-4 z-20 p-2 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-600 hover:text-slate-900 dark:bg-zinc-900/80 dark:hover:bg-zinc-800 dark:text-zinc-400 dark:hover:text-white border border-slate-200 dark:border-white/10 transition-all cursor-pointer"
          >
            <X className="w-4 sm:w-5 h-4 sm:h-5" />
          </button>

          {/* Modal Content Scrollable Area */}
          <div className="flex-1 overflow-y-auto p-4 sm:p-8 grid grid-cols-1 md:grid-cols-12 gap-5 sm:gap-8">

            {/* Left Column: Visual Preview & Specs (5 cols) */}
            <div className="md:col-span-5 space-y-6">

              {/* Product Visual Container with dynamic glow */}
              <div
                className="relative rounded-2xl border border-slate-200 dark:border-white/10 p-6 flex flex-col items-center justify-center min-h-[240px] overflow-hidden transition-all duration-500 shadow-xl"
                style={{
                  background: activeHighlightFlavor?.colorHex
                    ? `radial-gradient(circle at 50% 50%, ${activeHighlightFlavor.colorHex}45 0%, #1e293b 70%, #090a0f 100%)`
                    : product.image,
                }}
              >
                <div
                  className="w-32 h-32 rounded-3xl border border-white/20 flex flex-col items-center justify-center p-4 backdrop-blur-md shadow-2xl"
                  style={{
                    backgroundColor: `${activeHighlightFlavor?.colorHex || '#00f5d4'}25`,
                    boxShadow: `0 0 45px -5px ${activeHighlightFlavor?.colorHex || '#00f5d4'}50`,
                  }}
                >
                  <Sparkles className="w-10 h-10 text-white mb-2" />
                  <span className="text-xs font-mono-spec font-bold text-center text-white truncate max-w-[100px]">
                    {activeHighlightFlavor?.name || product.name}
                  </span>
                </div>

                <div className="mt-4 px-3 py-1 rounded-full text-xs font-mono-spec bg-black/70 border border-teal-500/40 text-teal-300">
                  {product.category === 'transparent_disposable' ? 'TRANSPARENT TANK DISPOSABLE' : 'NON-TRANSPARENT DISPOSABLE'} • ₱{product.price}
                </div>
              </div>

              {/* Hardware Spec Grid */}
              <div className="space-y-3">
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-zinc-400 font-mono-spec">
                  Hardware Specifications
                </h4>

                <div className="grid grid-cols-2 gap-2 text-xs font-mono-spec">
                  <div className="p-3 rounded-xl bg-slate-50 dark:bg-zinc-900/80 border border-slate-200 dark:border-white/5 space-y-1">
                    <span className="text-slate-500 dark:text-zinc-500 flex items-center gap-1.5 text-[11px]">
                      <Battery className="w-3.5 h-3.5 text-teal-500 dark:text-teal-400" /> Battery
                    </span>
                    <span className="font-semibold text-slate-800 dark:text-zinc-200 block truncate">
                      {product.batteryCapacity || 'Standard Built-in'}
                    </span>
                  </div>

                  <div className="p-3 rounded-xl bg-slate-50 dark:bg-zinc-900/80 border border-slate-200 dark:border-white/5 space-y-1">
                    <span className="text-slate-500 dark:text-zinc-500 flex items-center gap-1.5 text-[11px]">
                      <Zap className="w-3.5 h-3.5 text-purple-500 dark:text-purple-400" /> Nicotine
                    </span>
                    <span className="font-semibold text-slate-800 dark:text-zinc-200 block truncate">
                      {product.nicotineStrength}
                    </span>
                  </div>

                  <div className="p-3 rounded-xl bg-slate-50 dark:bg-zinc-900/80 border border-slate-200 dark:border-white/5 space-y-1">
                    <span className="text-slate-500 dark:text-zinc-500 flex items-center gap-1.5 text-[11px]">
                      <Layers className="w-3.5 h-3.5 text-amber-500 dark:text-amber-400" /> Capacity / Coil
                    </span>
                    <span className="font-semibold text-slate-800 dark:text-zinc-200 block truncate">
                      {product.capacity || product.coilType || 'Optimized'}
                    </span>
                  </div>

                  <div className="p-3 rounded-xl bg-slate-50 dark:bg-zinc-900/80 border border-slate-200 dark:border-white/5 space-y-1">
                    <span className="text-slate-500 dark:text-zinc-500 flex items-center gap-1.5 text-[11px]">
                      <Sliders className="w-3.5 h-3.5 text-cyan-500 dark:text-cyan-400" /> Airflow
                    </span>
                    <span className="font-semibold text-slate-800 dark:text-zinc-200 block truncate">
                      {product.airflow || 'Precision MTL/RDL'}
                    </span>
                  </div>
                </div>

                <p className="text-xs text-slate-600 dark:text-zinc-400 leading-relaxed pt-1">
                  {product.description}
                </p>
              </div>

            </div>

            {/* Right Column: Flavor Variant Interactive Selector (7 cols) */}
            <div className="md:col-span-7 flex flex-col justify-between space-y-4">
              <div>
                <div className="flex items-baseline justify-between mb-1">
                  <span className="text-xs font-mono-spec uppercase tracking-wider text-teal-600 dark:text-teal-400 font-bold">
                    {product.brand}
                  </span>
                  <div className="text-xl sm:text-2xl font-extrabold text-slate-900 dark:text-white font-mono-spec">
                    ₱{product.price.toLocaleString()}
                  </div>
                </div>

                <h2 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white mb-3 font-space">
                  {product.name}
                </h2>

                <div className="flex items-center justify-between py-2 border-y border-slate-200 dark:border-white/10 mb-4">
                  <span className="text-xs font-medium text-slate-700 dark:text-zinc-300">
                    Select Flavors to Inquire / Reserve:
                  </span>
                  <span className="text-xs font-mono-spec text-teal-600 dark:text-teal-400 font-semibold">
                    {selectedFlavorIds.length} flavor(s) selected
                  </span>
                </div>

                {/* Flavor Variants List */}
                <div className="space-y-2.5 max-h-[340px] overflow-y-auto pr-1">
                  {product.flavors.map((flavor) => {
                    const isSelected = selectedFlavorIds.includes(flavor.id);
                    const isAvailable = flavor.status !== 'out_of_stock';

                    return (
                      <div
                        key={flavor.id}
                        onClick={() => toggleFlavorSelection(flavor)}
                        onMouseEnter={() => setActiveHighlightFlavor(flavor)}
                        className={`p-3 rounded-2xl border transition-all flex items-center justify-between gap-3 cursor-pointer ${
                          isSelected
                            ? 'bg-teal-500/10 border-teal-500/50 shadow-sm shadow-teal-500/10'
                            : isAvailable
                            ? 'bg-slate-50 hover:bg-slate-100/90 border-slate-200 dark:bg-zinc-900/60 dark:hover:bg-zinc-800/80 dark:border-white/5 dark:hover:border-white/15'
                            : 'bg-slate-100/40 border-slate-200 text-slate-400 dark:bg-zinc-950/30 dark:border-white/5 opacity-50 cursor-not-allowed'
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <span
                            className="w-3.5 h-3.5 rounded-full flex-shrink-0 shadow-md"
                            style={{ backgroundColor: flavor.colorHex }}
                          />
                          <div>
                            <div className="flex items-center gap-2">
                              <span className={`text-sm font-semibold ${isAvailable ? 'text-slate-900 dark:text-white' : 'text-slate-400 dark:text-zinc-500 line-through'}`}>
                                {flavor.name}
                              </span>
                              {flavor.status === 'low_stock' && (
                                <span className="px-2 py-0.5 rounded-md text-[10px] font-mono-spec bg-amber-500/15 text-amber-700 dark:text-amber-300 border border-amber-500/30">
                                  Low Stock ({flavor.stockCount})
                                </span>
                              )}
                              {flavor.status === 'out_of_stock' && (
                                <span className="px-2 py-0.5 rounded-md text-[10px] font-mono-spec bg-slate-200 dark:bg-zinc-800 text-slate-500 dark:text-zinc-500">
                                  Sold Out
                                </span>
                              )}
                            </div>

                            {/* Meters */}
                            <div className="flex items-center gap-4 mt-1 text-[11px] font-mono-spec text-slate-500 dark:text-zinc-400">
                              <span className="flex items-center gap-1">
                                <Wind className="w-3 h-3 text-cyan-600 dark:text-cyan-400" /> Ice: {flavor.coolingLevel}/5
                              </span>
                              <span className="flex items-center gap-1">
                                <Droplet className="w-3 h-3 text-pink-600 dark:text-pink-400" /> Sweet: {flavor.sweetnessLevel}/5
                              </span>
                              {flavor.status === 'in_stock' && (
                                <span className="text-emerald-600 dark:text-emerald-400 font-semibold">
                                  {flavor.stockCount} ready
                                </span>
                              )}
                            </div>
                          </div>
                        </div>

                        {/* Toggle Checkbox Button */}
                        <button
                          type="button"
                          disabled={!isAvailable}
                          className={`w-7 h-7 rounded-lg flex items-center justify-center border transition-all ${
                            isSelected
                              ? 'bg-teal-400 border-teal-300 text-black'
                              : isAvailable
                              ? 'border-slate-300 dark:border-white/20 bg-slate-100 dark:bg-zinc-800/80 text-transparent'
                              : 'border-slate-200 dark:border-zinc-800 bg-slate-100 dark:bg-zinc-900 text-transparent'
                          }`}
                        >
                          <Check className="w-4 h-4" />
                        </button>
                      </div>
                    );
                  })}
                </div>
              </div>

            </div>

          </div>

          {/* Sticky Bottom Action Bar inside Modal */}
          <div className="p-3.5 sm:p-5 bg-slate-50/95 dark:bg-zinc-950/95 border-t border-slate-200 dark:border-white/10 flex flex-col sm:flex-row items-center justify-between gap-3 transition-colors">
            <div className="w-full sm:w-auto text-left">
              <div className="text-[11px] sm:text-xs text-slate-500 dark:text-zinc-400">Total Selected:</div>
              <div className="flex items-baseline gap-2 font-mono-spec">
                <span className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white">
                  ₱{totalPrice.toLocaleString()}
                </span>
                <span className="text-[11px] sm:text-xs text-teal-600 dark:text-teal-400 font-semibold">
                  ({selectedFlavors.length || 0} flavor variants queued)
                </span>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 w-full sm:w-auto">
              {/* Copy Inquiry Message */}
              <button
                onClick={handleCopyInquiry}
                className="w-full sm:w-auto flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-xl text-xs font-semibold bg-slate-100 hover:bg-slate-200 text-slate-800 border border-slate-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 dark:text-zinc-200 dark:border-white/10 transition-all cursor-pointer"
                title="Copy ready-to-send text message"
              >
                {copied ? <CheckCheck className="w-4 h-4 text-emerald-500 dark:text-emerald-400" /> : <Copy className="w-4 h-4" />}
                <span>{copied ? 'Copied Details!' : 'Copy Inquiry'}</span>
              </button>

              {/* Direct Messenger Reservation */}
              <button
                onClick={handleFacebookReserve}
                className="w-full sm:w-auto flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl text-xs sm:text-sm font-semibold bg-gradient-to-r from-teal-400 to-teal-300 hover:from-teal-300 text-black shadow-lg shadow-teal-500/20 active:scale-95 transition-all cursor-pointer"
              >
                <MessageSquare className={`w-4 h-4 ${isReserving ? 'animate-bounce' : ''}`} />
                <span>{isReserving ? 'Opening Messenger...' : 'Reserve on Messenger'}</span>
              </button>

              {/* WhatsApp Inquiry */}
              <button
                onClick={handleWhatsApp}
                className="hidden lg:flex items-center justify-center p-2.5 rounded-xl text-xs font-semibold bg-emerald-600 hover:bg-emerald-500 text-white transition-all cursor-pointer"
                title="Reserve via WhatsApp"
              >
                <Share2 className="w-4 h-4" />
              </button>
            </div>
          </div>

        </motion.div>
      </div>
    </AnimatePresence>
  );
};
