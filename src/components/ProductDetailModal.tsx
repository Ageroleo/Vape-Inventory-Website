'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { VapeProduct, FlavorVariant } from '@/types/vape';
import { openMessengerReservation } from '@/lib/messenger';
import { X, Check, MessageSquare, Copy, CheckCheck } from 'lucide-react';

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

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/40 dark:bg-black/70 backdrop-blur-sm overflow-y-auto">
        <motion.div
          initial={{ opacity: 0, scale: 0.96, y: 10 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.96, y: 10 }}
          transition={{ duration: 0.2, ease: 'easeOut' }}
          className="relative w-full max-w-3xl max-h-[92vh] flex flex-col rounded-2xl border border-neutral-200/90 dark:border-white/[0.08] bg-white dark:bg-[#12141c] text-neutral-900 dark:text-white shadow-2xl overflow-hidden transition-colors"
        >
          {/* Close button */}
          <button
            onClick={onClose}
            aria-label="Close details"
            className="absolute top-4 right-4 z-20 p-2 rounded-full text-neutral-400 hover:text-neutral-900 dark:hover:text-white hover:bg-neutral-100 dark:hover:bg-white/[0.06] transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>

          {/* Modal Content */}
          <div className="flex-1 overflow-y-auto p-5 sm:p-8 grid grid-cols-1 md:grid-cols-12 gap-6 sm:gap-8">

            {/* Left: Device Preview & Specifications */}
            <div className="md:col-span-5 space-y-5">
              <div
                className="relative rounded-2xl bg-neutral-100/80 dark:bg-neutral-900/80 p-8 flex flex-col items-center justify-center min-h-[220px] overflow-hidden"
              >
                <div
                  className="w-24 h-36 rounded-2xl border border-white/60 dark:border-white/20 shadow-md flex flex-col items-center justify-between p-4 backdrop-blur-sm transition-all duration-300"
                  style={{
                    backgroundColor: `${activeHighlightFlavor?.colorHex || '#10b981'}20`,
                  }}
                >
                  <div
                    className="w-4 h-1.5 rounded-full"
                    style={{ backgroundColor: activeHighlightFlavor?.colorHex || '#10b981' }}
                  />
                  <div className="text-center">
                    <span className="text-[11px] font-bold text-neutral-800 dark:text-white uppercase tracking-wider font-space">
                      {product.brand}
                    </span>
                    <div className="text-[10px] text-neutral-500 dark:text-neutral-400 font-mono-spec mt-0.5">
                      {activeHighlightFlavor?.name || 'In Stock'}
                    </div>
                  </div>
                  <div
                    className="w-3 h-3 rounded-full"
                    style={{ backgroundColor: activeHighlightFlavor?.colorHex || '#10b981' }}
                  />
                </div>
              </div>

              {/* Minimal Specs List */}
              <div className="space-y-2 rounded-xl bg-neutral-50 dark:bg-neutral-900/40 p-4 border border-neutral-200/60 dark:border-white/[0.05] text-xs">
                <div className="flex justify-between py-1 border-b border-neutral-200/50 dark:border-white/[0.05]">
                  <span className="text-neutral-500 dark:text-neutral-400">Puff Capacity</span>
                  <span className="font-mono-spec font-medium text-neutral-900 dark:text-white">{product.puffCount?.toLocaleString()}</span>
                </div>
                <div className="flex justify-between py-1 border-b border-neutral-200/50 dark:border-white/[0.05]">
                  <span className="text-neutral-500 dark:text-neutral-400">Nicotine Strength</span>
                  <span className="font-mono-spec font-medium text-neutral-900 dark:text-white">{product.nicotineStrength}</span>
                </div>
                <div className="flex justify-between py-1 border-b border-neutral-200/50 dark:border-white/[0.05]">
                  <span className="text-neutral-500 dark:text-neutral-400">Coil Technology</span>
                  <span className="font-mono-spec font-medium text-neutral-900 dark:text-white">{product.coilType}</span>
                </div>
                <div className="flex justify-between py-1">
                  <span className="text-neutral-500 dark:text-neutral-400">Category</span>
                  <span className="font-mono-spec font-medium text-neutral-900 dark:text-white">
                    {product.category === 'transparent_disposable' ? 'Transparent Tank' : 'Solid'}
                  </span>
                </div>
              </div>
            </div>

            {/* Right: Flavor Selector & Reserve CTA */}
            <div className="md:col-span-7 flex flex-col justify-between space-y-5">
              <div>
                <div className="text-xs font-mono-spec uppercase tracking-wider text-neutral-400 dark:text-neutral-500">
                  {product.brand}
                </div>
                <h2 className="text-xl sm:text-2xl font-bold text-neutral-900 dark:text-white tracking-tight font-space mt-0.5">
                  {product.name}
                </h2>
                <div className="text-xl font-bold font-mono-spec text-neutral-900 dark:text-white mt-1">
                  ₱{product.price.toLocaleString()}
                </div>

                <p className="text-xs text-neutral-600 dark:text-neutral-300 mt-2">
                  {product.description}
                </p>

                {/* Flavor Options */}
                <div className="mt-5">
                  <div className="text-xs font-medium text-neutral-500 dark:text-neutral-400 mb-2">
                    Available Flavors ({product.flavors.length}):
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-48 overflow-y-auto pr-1">
                    {product.flavors.map((flavor) => {
                      const isSelected = selectedFlavorIds.includes(flavor.id);
                      const isAvailable = flavor.status !== 'out_of_stock';

                      return (
                        <button
                          key={flavor.id}
                          onClick={() => toggleFlavorSelection(flavor)}
                          disabled={!isAvailable}
                          className={`flex items-center justify-between p-2.5 rounded-xl text-xs font-medium border transition-all text-left cursor-pointer ${
                            isSelected
                              ? 'bg-neutral-900 text-white dark:bg-white dark:text-neutral-900 border-neutral-900 dark:border-white shadow-xs'
                              : isAvailable
                              ? 'bg-neutral-50 hover:bg-neutral-100 dark:bg-neutral-900/60 dark:hover:bg-neutral-900 border-neutral-200/80 dark:border-white/[0.08] text-neutral-800 dark:text-neutral-200'
                              : 'bg-neutral-100/50 text-neutral-400 dark:bg-neutral-950/20 dark:text-neutral-600 border-neutral-200/40 line-through cursor-not-allowed'
                          }`}
                        >
                          <div className="flex items-center gap-2 truncate">
                            <span
                              className="w-2.5 h-2.5 rounded-full flex-shrink-0"
                              style={{ backgroundColor: flavor.colorHex }}
                            />
                            <span className="truncate">{flavor.name}</span>
                          </div>
                          {isSelected && <Check className="w-3.5 h-3.5 flex-shrink-0" />}
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>

              {/* Bottom Actions */}
              <div className="pt-4 border-t border-neutral-200/80 dark:border-white/[0.08] space-y-2.5">
                <div className="flex items-baseline justify-between text-sm">
                  <span className="text-neutral-500 dark:text-neutral-400">Total Estimate:</span>
                  <span className="text-xl font-bold font-mono-spec text-neutral-900 dark:text-white">
                    ₱{totalPrice.toLocaleString()}
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  <button
                    onClick={handleFacebookReserve}
                    className="flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl text-xs sm:text-sm font-semibold bg-neutral-900 hover:bg-neutral-800 text-white dark:bg-white dark:hover:bg-neutral-100 dark:text-neutral-900 transition-all cursor-pointer shadow-sm active:scale-98"
                  >
                    <MessageSquare className="w-4 h-4" />
                    <span>{isReserving ? 'Opening...' : 'Reserve on Messenger'}</span>
                  </button>

                  <button
                    onClick={handleCopyInquiry}
                    className="flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl text-xs sm:text-sm font-medium border border-neutral-200/80 hover:bg-neutral-100 dark:border-white/[0.08] dark:hover:bg-white/[0.06] text-neutral-700 dark:text-neutral-300 transition-colors cursor-pointer"
                  >
                    {copied ? <CheckCheck className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4" />}
                    <span>{copied ? 'Inquiry Copied' : 'Copy Inquiry Text'}</span>
                  </button>
                </div>
              </div>

            </div>

          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
