'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { VapeProduct, StockStatus } from '@/types/vape';
import { 
  saveInventory,
  exportInventoryJson, 
  resetInventoryToDefault 
} from '@/lib/inventoryService';
import { isSupabaseConfigured } from '@/lib/supabaseClient';
import { 
  X, Lock, Unlock, Plus, Minus, Download, RotateCcw, 
  Search, ShieldAlert, Save, Check, Cloud, CloudOff, Loader2,
  KeyRound, Delete
} from 'lucide-react';

interface AdminStockDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  products: VapeProduct[];
}

const KEYPAD_BUTTONS = [
  { num: '1', sub: '' },
  { num: '2', sub: 'ABC' },
  { num: '3', sub: 'DEF' },
  { num: '4', sub: 'GHI' },
  { num: '5', sub: 'JKL' },
  { num: '6', sub: 'MNO' },
  { num: '7', sub: 'PQRS' },
  { num: '8', sub: 'TUV' },
  { num: '9', sub: 'WXYZ' },
  { action: 'clear' as const },
  { num: '0', sub: '+' },
  { action: 'backspace' as const },
];

export const AdminStockDrawer: React.FC<AdminStockDrawerProps> = ({
  isOpen,
  onClose,
  products,
}) => {
  const [pin, setPin] = useState('');
  const [isAuthenticated, setIsAuthenticated] = useState(() => {
    if (typeof window !== 'undefined') {
      return sessionStorage.getItem('rash_vape_admin_auth') === 'true';
    }
    return false;
  });
  const [authError, setAuthError] = useState(false);
  const [shake, setShake] = useState(false);
  const [adminSearch, setAdminSearch] = useState('');

  // Local working copy of products for editing
  const [localProducts, setLocalProducts] = useState<VapeProduct[]>(products);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [savedNotification, setSavedNotification] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  // Sync local products when drawer opens or base products update without unsaved changes
  useEffect(() => {
    if (isOpen && !hasUnsavedChanges) {
      setLocalProducts(products);
    }
  }, [isOpen, products, hasUnsavedChanges]);

  // Support Ctrl+S or Cmd+S to save while drawer is open
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!isOpen || !isAuthenticated) return;
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 's') {
        e.preventDefault();
        handleSave();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, isAuthenticated, localProducts, isSaving]);

  // Support physical numeric keyboard when PIN keypad is shown
  useEffect(() => {
    if (!isOpen || isAuthenticated) return;

    const handleKeypadPhysical = (e: KeyboardEvent) => {
      if (e.key >= '0' && e.key <= '9') {
        e.preventDefault();
        handlePinDigit(e.key);
      } else if (e.key === 'Backspace') {
        e.preventDefault();
        handlePinBackspace();
      } else if (e.key === 'Escape' || e.key.toLowerCase() === 'c') {
        e.preventDefault();
        handlePinClear();
      }
    };

    window.addEventListener('keydown', handleKeypadPhysical);
    return () => window.removeEventListener('keydown', handleKeypadPhysical);
  }, [isOpen, isAuthenticated, pin]);

  if (!isOpen) return null;

  const handlePinDigit = (digit: string) => {
    if (pin.length >= 4) return;
    const nextPin = pin + digit;
    setPin(nextPin);
    setAuthError(false);

    // Auto-verify when 4 digits are entered
    if (nextPin.length === 4) {
      if (nextPin === '2026') {
        setIsAuthenticated(true);
        setAuthError(false);
        if (typeof window !== 'undefined') {
          sessionStorage.setItem('rash_vape_admin_auth', 'true');
        }
      } else {
        setAuthError(true);
        setShake(true);
        setTimeout(() => setShake(false), 500);
        setTimeout(() => setPin(''), 550);
      }
    }
  };

  const handlePinBackspace = () => {
    setPin((prev) => prev.slice(0, -1));
    setAuthError(false);
  };

  const handlePinClear = () => {
    setPin('');
    setAuthError(false);
  };

  const handleStockDelta = (productId: string, flavorId: string, delta: number) => {
    setLocalProducts((prev) =>
      prev.map((product) => {
        if (product.id !== productId) return product;
        return {
          ...product,
          flavors: product.flavors.map((flavor) => {
            if (flavor.id !== flavorId) return flavor;
            const newCount = Math.max(0, flavor.stockCount + delta);
            let newStatus: StockStatus = 'in_stock';
            if (newCount === 0) newStatus = 'out_of_stock';
            else if (newCount <= 3) newStatus = 'low_stock';
            return {
              ...flavor,
              stockCount: newCount,
              status: newStatus,
            };
          }),
        };
      })
    );
    setHasUnsavedChanges(true);
  };

  const handleStockExact = (productId: string, flavorId: string, count: number) => {
    const newCount = Math.max(0, isNaN(count) ? 0 : count);
    setLocalProducts((prev) =>
      prev.map((product) => {
        if (product.id !== productId) return product;
        return {
          ...product,
          flavors: product.flavors.map((flavor) => {
            if (flavor.id !== flavorId) return flavor;
            let newStatus: StockStatus = 'in_stock';
            if (newCount === 0) newStatus = 'out_of_stock';
            else if (newCount <= 3) newStatus = 'low_stock';
            return {
              ...flavor,
              stockCount: newCount,
              status: newStatus,
            };
          }),
        };
      })
    );
    setHasUnsavedChanges(true);
  };

  const handleToggleSoldOut = (productId: string, flavorId: string) => {
    setLocalProducts((prev) =>
      prev.map((product) => {
        if (product.id !== productId) return product;
        return {
          ...product,
          flavors: product.flavors.map((flavor) => {
            if (flavor.id !== flavorId) return flavor;
            const isCurrentlySoldOut = flavor.stockCount === 0 || flavor.status === 'out_of_stock';
            const newCount = isCurrentlySoldOut ? 10 : 0;
            const newStatus: StockStatus = isCurrentlySoldOut ? 'in_stock' : 'out_of_stock';
            return {
              ...flavor,
              stockCount: newCount,
              status: newStatus,
            };
          }),
        };
      })
    );
    setHasUnsavedChanges(true);
  };

  const handleSave = async () => {
    setIsSaving(true);
    await saveInventory(localProducts);
    setIsSaving(false);
    setHasUnsavedChanges(false);
    setSavedNotification(true);
    setTimeout(() => {
      setSavedNotification(false);
    }, 2500);
  };

  const handleReset = () => {
    if (window.confirm('Reset all inventory back to initial default values?')) {
      const reset = resetInventoryToDefault();
      setLocalProducts(reset);
      setHasUnsavedChanges(false);
      setSavedNotification(true);
      setTimeout(() => {
        setSavedNotification(false);
      }, 2500);
    }
  };

  const handleSafeClose = () => {
    if (hasUnsavedChanges) {
      if (window.confirm('You have unsaved stock changes. Do you want to save them before closing?')) {
        saveInventory(localProducts);
        setHasUnsavedChanges(false);
      }
    }
    onClose();
  };

  const filteredProducts = localProducts.filter((p) => {
    const q = adminSearch.toLowerCase();
    return (
      p.name.toLowerCase().includes(q) ||
      p.brand.toLowerCase().includes(q) ||
      p.flavors.some((f) => f.name.toLowerCase().includes(q))
    );
  });

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex justify-end bg-black/60 dark:bg-black/80 backdrop-blur-sm">
        <motion.div
          initial={{ x: '100%' }}
          animate={{ x: 0 }}
          exit={{ x: '100%' }}
          transition={{ type: 'spring', damping: 28, stiffness: 260 }}
          className="relative w-full max-w-2xl h-full bg-white dark:bg-card-dark border-l border-slate-200 dark:border-white/10 shadow-2xl flex flex-col justify-between text-slate-900 dark:text-white transition-colors"
        >
          {/* Header */}
          <div className="p-5 border-b border-slate-200 dark:border-white/10 flex items-center justify-between bg-slate-50 dark:bg-zinc-950/80">
            <div className="flex items-center gap-2.5">
              <div className="p-2 rounded-xl bg-purple-500/15 border border-purple-500/30 text-purple-600 dark:text-purple-300">
                {isAuthenticated ? <Unlock className="w-5 h-5 text-teal-600 dark:text-teal-400" /> : <Lock className="w-5 h-5" />}
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-base font-bold text-slate-900 dark:text-white font-space">
                    Staff Live Stock Manager
                  </h3>
                  {hasUnsavedChanges && (
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-amber-500/15 text-amber-600 dark:text-amber-400 border border-amber-500/30">
                      <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse" />
                      Unsaved
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-2 mt-0.5">
                  <p className="text-xs text-slate-500 dark:text-zinc-400 font-mono-spec">
                    Quick Stock Control
                  </p>
                  <span className="text-slate-300 dark:text-zinc-700">•</span>
                  {isSupabaseConfigured() ? (
                    <span className="inline-flex items-center gap-1 text-[11px] font-mono-spec text-teal-600 dark:text-teal-400 font-medium" title="Connected to Supabase Cloud - Realtime Sync Active">
                      <Cloud className="w-3.5 h-3.5 text-teal-500" />
                      <span>Cloud Sync (Supabase)</span>
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 text-[11px] font-mono-spec text-slate-400 dark:text-zinc-500" title="Add Supabase credentials to .env.local to enable multi-device sync">
                      <CloudOff className="w-3.5 h-3.5 text-slate-400 dark:text-zinc-500" />
                      <span>Local Cache</span>
                    </span>
                  )}
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2">
              {isAuthenticated && (
                <button
                  type="button"
                  onClick={handleSave}
                  disabled={isSaving}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl font-semibold text-xs transition-all cursor-pointer ${
                    isSaving
                      ? 'bg-teal-400/70 text-black cursor-wait'
                      : savedNotification
                      ? 'bg-emerald-500 text-white shadow-md shadow-emerald-500/20'
                      : hasUnsavedChanges
                      ? 'bg-teal-400 hover:bg-teal-300 text-black shadow-md shadow-teal-500/25 ring-2 ring-teal-400/40'
                      : 'bg-slate-100 hover:bg-slate-200 dark:bg-zinc-900 dark:hover:bg-zinc-800 text-slate-700 dark:text-zinc-300 border border-slate-200 dark:border-white/10'
                  }`}
                  title="Save changes to stock (Ctrl+S)"
                >
                  {isSaving ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      <span>Saving...</span>
                    </>
                  ) : savedNotification ? (
                    <>
                      <Check className="w-3.5 h-3.5 text-white" />
                      <span>Saved</span>
                    </>
                  ) : (
                    <>
                      <Save className="w-3.5 h-3.5" />
                      <span>Save</span>
                    </>
                  )}
                </button>
              )}

              <button
                type="button"
                onClick={handleSafeClose}
                aria-label="Close manager"
                className="p-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-600 hover:text-slate-900 dark:bg-zinc-900 dark:hover:bg-zinc-800 dark:text-zinc-400 dark:hover:text-white border border-slate-200 dark:border-white/10 cursor-pointer transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Authentication Screen - Interactive PIN Keypad */}
          {!isAuthenticated ? (
            <div className="flex-1 flex flex-col items-center justify-center p-6 text-center select-none overflow-y-auto">
              {/* Security Icon */}
              <div className="w-14 h-14 rounded-2xl bg-teal-500/10 border border-teal-500/30 flex items-center justify-center text-teal-600 dark:text-teal-400 mb-3 shadow-xl shadow-teal-500/10">
                <KeyRound className="w-7 h-7" />
              </div>

              <h4 className="text-xl font-bold text-slate-900 dark:text-white font-space">
                Staff Security Keypad
              </h4>
              <p className="text-xs text-slate-500 dark:text-zinc-400 mt-1 max-w-xs font-mono-spec">
                Tap your 4-digit PIN to access live stock controls
              </p>

              {/* 4-Digit Slot Indicators */}
              <motion.div
                animate={shake ? { x: [-12, 12, -8, 8, -4, 4, 0] } : {}}
                transition={{ duration: 0.4 }}
                className="flex items-center justify-center gap-4 my-5"
              >
                {[0, 1, 2, 3].map((idx) => {
                  const isFilled = pin.length > idx;
                  return (
                    <motion.div
                      key={idx}
                      animate={isFilled ? { scale: [1, 1.3, 1] } : { scale: 1 }}
                      transition={{ duration: 0.15 }}
                      className={`w-4 h-4 rounded-full border-2 transition-all duration-200 ${
                        authError
                          ? 'border-rose-500 bg-rose-500 shadow-lg shadow-rose-500/50'
                          : isFilled
                          ? 'border-teal-400 bg-teal-400 shadow-lg shadow-teal-500/60 ring-4 ring-teal-400/20'
                          : 'border-slate-300 dark:border-zinc-700 bg-transparent'
                      }`}
                    />
                  );
                })}
              </motion.div>

              {/* Error feedback slot */}
              <div className="h-5 mb-2 flex items-center justify-center">
                <AnimatePresence>
                  {authError && (
                    <motion.p
                      initial={{ opacity: 0, y: -4 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -4 }}
                      className="text-xs text-rose-600 dark:text-rose-400 font-mono-spec flex items-center justify-center gap-1.5 font-medium"
                    >
                      <ShieldAlert className="w-3.5 h-3.5 flex-shrink-0" />
                      <span>Incorrect PIN. Please try again.</span>
                    </motion.p>
                  )}
                </AnimatePresence>
              </div>

              {/* Numeric Keypad Grid */}
              <div className="grid grid-cols-3 gap-3 sm:gap-3.5 max-w-xs w-full justify-items-center">
                {KEYPAD_BUTTONS.map((item) => {
                  if (item.action === 'clear') {
                    return (
                      <button
                        key="clear"
                        type="button"
                        onClick={handlePinClear}
                        aria-label="Clear PIN"
                        className="w-16 h-16 sm:w-18 sm:h-18 rounded-2xl bg-slate-100 hover:bg-rose-500/10 text-slate-500 hover:text-rose-600 dark:bg-zinc-900/80 dark:hover:bg-rose-500/20 dark:text-zinc-400 dark:hover:text-rose-400 border border-slate-200 dark:border-white/5 active:scale-90 transition-all duration-150 flex flex-col items-center justify-center cursor-pointer shadow-sm"
                      >
                        <span className="font-space font-bold text-base leading-none">C</span>
                        <span className="text-[9px] font-mono-spec text-slate-400 dark:text-zinc-500 mt-1">CLEAR</span>
                      </button>
                    );
                  }

                  if (item.action === 'backspace') {
                    return (
                      <button
                        key="backspace"
                        type="button"
                        onClick={handlePinBackspace}
                        aria-label="Backspace"
                        className="w-16 h-16 sm:w-18 sm:h-18 rounded-2xl bg-slate-100 hover:bg-slate-200 text-slate-600 hover:text-slate-900 dark:bg-zinc-900/80 dark:hover:bg-zinc-800 dark:text-zinc-300 border border-slate-200 dark:border-white/5 active:scale-90 transition-all duration-150 flex items-center justify-center cursor-pointer shadow-sm"
                      >
                        <Delete className="w-5 h-5" />
                      </button>
                    );
                  }

                  return (
                    <button
                      key={item.num}
                      type="button"
                      onClick={() => handlePinDigit(item.num)}
                      className="w-16 h-16 sm:w-18 sm:h-18 rounded-2xl bg-slate-100 hover:bg-teal-500/15 hover:border-teal-400/50 text-slate-900 dark:bg-zinc-900/90 dark:hover:bg-zinc-800 dark:hover:border-teal-400/40 dark:text-white border border-slate-200/90 dark:border-white/10 active:scale-90 transition-all duration-150 flex flex-col items-center justify-center cursor-pointer shadow-sm group"
                    >
                      <span className="text-xl sm:text-2xl font-bold font-space group-hover:text-teal-600 dark:group-hover:text-teal-400 leading-none">
                        {item.num}
                      </span>
                      {item.sub ? (
                        <span className="text-[9px] font-mono-spec tracking-widest text-slate-400 dark:text-zinc-500 mt-1">
                          {item.sub}
                        </span>
                      ) : (
                        <span className="h-[13px]" />
                      )}
                    </button>
                  );
                })}
              </div>

              {/* Bottom Input Hint */}
              <div className="mt-5 flex items-center justify-center w-full max-w-xs px-2 text-[11px] font-mono-spec text-slate-400 dark:text-zinc-500">
                <span>Touch / Keyboard Supported</span>
              </div>
            </div>
          ) : (
            /* Stock Editor Table */
            <div className="flex-1 overflow-y-auto p-5 space-y-4">
              
              {/* Notification Banner when saved */}
              <AnimatePresence>
                {savedNotification && (
                  <motion.div
                    initial={{ opacity: 0, y: -8 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -8 }}
                    className="p-3 bg-emerald-500/15 border border-emerald-500/30 rounded-xl text-emerald-700 dark:text-emerald-300 flex items-center justify-between text-xs font-medium shadow-sm"
                  >
                    <div className="flex items-center gap-2">
                      <Check className="w-4 h-4 text-emerald-500 flex-shrink-0" />
                      <span>
                        {isSupabaseConfigured()
                          ? 'Stock synced to Supabase Cloud! Live showcase updated for all devices.'
                          : 'Stock saved to local cache! Add Supabase credentials to .env.local to sync across all devices.'}
                      </span>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Search in Admin */}
              <div className="relative">
                <Search className="w-4 h-4 text-slate-400 dark:text-zinc-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={adminSearch}
                  onChange={(e) => setAdminSearch(e.target.value)}
                  placeholder="Filter device or flavor to adjust..."
                  className="w-full pl-9 pr-4 py-2 text-xs bg-slate-100 dark:bg-zinc-900/90 border border-slate-200 dark:border-white/10 rounded-xl text-slate-900 dark:text-white focus:border-teal-500 dark:focus:border-teal-400 focus:outline-none"
                />
              </div>

              {/* Product and Flavor List */}
              <div className="space-y-4">
                {filteredProducts.map((product) => (
                  <div
                    key={product.id}
                    className="p-4 rounded-2xl bg-slate-50 dark:bg-zinc-900/50 border border-slate-200 dark:border-white/5 space-y-3"
                  >
                    <div className="flex items-center justify-between border-b border-slate-200 dark:border-white/5 pb-2">
                      <div>
                        <span className="text-[10px] font-mono-spec uppercase text-teal-600 dark:text-teal-400 font-bold">
                          {product.brand}
                        </span>
                        <h4 className="text-sm font-bold text-slate-900 dark:text-white">
                          {product.name}
                        </h4>
                      </div>
                      <span className="text-xs font-mono-spec text-slate-500 dark:text-zinc-400">
                        ₱{product.price.toLocaleString()}
                      </span>
                    </div>

                    {/* Flavors Rows */}
                    <div className="space-y-2">
                      {product.flavors.map((flavor) => {
                        const isSoldOut = flavor.status === 'out_of_stock' || flavor.stockCount === 0;

                        return (
                          <div
                            key={flavor.id}
                            className="flex items-center justify-between gap-3 p-2 rounded-xl bg-white dark:bg-zinc-950/60 border border-slate-200 dark:border-white/5 text-xs"
                          >
                            <div className="flex items-center gap-2 truncate">
                              <span
                                className="w-2.5 h-2.5 rounded-full flex-shrink-0"
                                style={{ backgroundColor: flavor.colorHex }}
                              />
                              <span className={`truncate font-medium ${isSoldOut ? 'text-slate-400 dark:text-zinc-500 line-through' : 'text-slate-800 dark:text-zinc-200'}`}>
                                {flavor.name}
                              </span>
                            </div>

                            <div className="flex items-center gap-2 flex-shrink-0">
                              {/* Stock count with -/+, exact number input */}
                              <div className="flex items-center gap-1 bg-slate-100 dark:bg-zinc-900 px-1.5 py-1 rounded-lg border border-slate-200 dark:border-white/10 font-mono-spec text-xs">
                                <button
                                  type="button"
                                  onClick={() => handleStockDelta(product.id, flavor.id, -1)}
                                  disabled={flavor.stockCount <= 0}
                                  className="w-5 h-5 flex items-center justify-center text-slate-600 hover:text-slate-900 dark:text-zinc-400 dark:hover:text-white disabled:opacity-30 cursor-pointer"
                                  title="Decrease quantity by 1"
                                >
                                  <Minus className="w-3 h-3" />
                                </button>
                                
                                <input
                                  type="number"
                                  min={0}
                                  value={flavor.stockCount}
                                  onChange={(e) => handleStockExact(product.id, flavor.id, parseInt(e.target.value) || 0)}
                                  className={`w-10 text-center font-bold bg-transparent border-0 focus:outline-none focus:ring-1 focus:ring-teal-500 rounded font-mono-spec [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none ${
                                    flavor.stockCount > 0 ? 'text-teal-700 dark:text-teal-300' : 'text-rose-500 dark:text-rose-400'
                                  }`}
                                  title="Click to directly type quantity"
                                />

                                <button
                                  type="button"
                                  onClick={() => handleStockDelta(product.id, flavor.id, 1)}
                                  className="w-5 h-5 flex items-center justify-center text-slate-600 hover:text-slate-900 dark:text-zinc-400 dark:hover:text-white cursor-pointer"
                                  title="Increase quantity by 1"
                                >
                                  <Plus className="w-3 h-3" />
                                </button>
                              </div>

                              {/* Toggle Sold Out / In Stock */}
                              <button
                                type="button"
                                onClick={() => handleToggleSoldOut(product.id, flavor.id)}
                                className={`px-2.5 py-1 rounded-lg font-mono-spec text-[11px] font-semibold transition-all cursor-pointer ${
                                  isSoldOut
                                    ? 'bg-rose-500/15 border border-rose-500/30 text-rose-700 dark:text-rose-300 hover:bg-rose-500/25'
                                    : 'bg-emerald-500/15 border border-emerald-500/30 text-emerald-700 dark:text-emerald-300 hover:bg-emerald-500/25'
                                }`}
                              >
                                {isSoldOut ? 'Sold Out' : 'Active'}
                              </button>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>

            </div>
          )}

          {/* Footer Controls */}
          {isAuthenticated && (
            <div className="p-4 border-t border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-zinc-950/80 flex flex-wrap items-center justify-between gap-3 text-xs">
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleReset}
                  className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 dark:bg-zinc-900 dark:hover:bg-zinc-800 dark:text-zinc-400 dark:hover:text-white border border-slate-200 dark:border-white/10 transition-all cursor-pointer"
                  title="Reset to default inventory values"
                >
                  <RotateCcw className="w-3.5 h-3.5 text-rose-500" />
                  <span className="hidden sm:inline">Reset Defaults</span>
                  <span className="sm:hidden">Reset</span>
                </button>

                <button
                  type="button"
                  onClick={() => exportInventoryJson(localProducts)}
                  className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 dark:bg-zinc-900 dark:hover:bg-zinc-800 dark:text-zinc-400 dark:hover:text-white border border-slate-200 dark:border-white/10 transition-all cursor-pointer"
                  title="Download inventory as JSON"
                >
                  <Download className="w-3.5 h-3.5 text-slate-500 dark:text-zinc-400" />
                  <span>Export</span>
                </button>
              </div>

              <div className="flex items-center gap-2.5">
                {hasUnsavedChanges && (
                  <span className="text-[11px] font-mono-spec text-amber-600 dark:text-amber-400 flex items-center gap-1.5 font-medium">
                    <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse" />
                    <span>Unsaved changes</span>
                  </span>
                )}

                <button
                  type="button"
                  onClick={handleSave}
                  disabled={isSaving}
                  className={`flex items-center gap-2 px-5 py-2.5 rounded-xl font-bold transition-all cursor-pointer shadow-md text-xs ${
                    isSaving
                      ? 'bg-teal-400/70 text-black cursor-wait'
                      : savedNotification
                      ? 'bg-emerald-500 text-white shadow-emerald-500/20'
                      : hasUnsavedChanges
                      ? 'bg-gradient-to-r from-teal-400 to-emerald-400 hover:from-teal-300 hover:to-emerald-300 text-black shadow-teal-500/30 ring-2 ring-teal-400/50 scale-[1.02]'
                      : 'bg-teal-400 hover:bg-teal-300 text-black shadow-teal-500/20'
                  }`}
                  title="Save all inventory adjustments to storage (Ctrl+S)"
                >
                  {isSaving ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Saving...</span>
                    </>
                  ) : savedNotification ? (
                    <>
                      <Check className="w-4 h-4 text-white" />
                      <span>Saved!</span>
                    </>
                  ) : (
                    <>
                      <Save className="w-4 h-4" />
                      <span>{hasUnsavedChanges ? 'Save Changes' : 'Save Stock'}</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          )}

        </motion.div>
      </div>
    </AnimatePresence>
  );
};

