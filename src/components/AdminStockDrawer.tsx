'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { VapeProduct, StockStatus } from '@/types/vape';
import { 
  saveInventory,
  exportInventoryJson, 
  resetInventoryToDefault 
} from '@/lib/inventoryService';
import { 
  X, Lock, Unlock, Plus, Minus, Download, RotateCcw, 
  Search, ShieldAlert, Save, Check
} from 'lucide-react';

interface AdminStockDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  products: VapeProduct[];
}

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
  const [adminSearch, setAdminSearch] = useState('');

  // Local working copy of products for editing
  const [localProducts, setLocalProducts] = useState<VapeProduct[]>(products);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [savedNotification, setSavedNotification] = useState(false);

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
  }, [isOpen, isAuthenticated, localProducts]);

  if (!isOpen) return null;

  const handleVerifyPin = (e: React.FormEvent) => {
    e.preventDefault();
    // Default PIN: 2026
    if (pin.trim() === '2026') {
      setIsAuthenticated(true);
      setAuthError(false);
      if (typeof window !== 'undefined') {
        sessionStorage.setItem('rash_vape_admin_auth', 'true');
      }
    } else {
      setAuthError(true);
      setPin('');
    }
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

  const handleSave = () => {
    saveInventory(localProducts);
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
                <p className="text-xs text-slate-500 dark:text-zinc-400 font-mono-spec">
                  PIN-Protected Quick Inventory Adjustment
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              {isAuthenticated && (
                <button
                  type="button"
                  onClick={handleSave}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl font-semibold text-xs transition-all cursor-pointer ${
                    savedNotification
                      ? 'bg-emerald-500 text-white shadow-md shadow-emerald-500/20'
                      : hasUnsavedChanges
                      ? 'bg-teal-400 hover:bg-teal-300 text-black shadow-md shadow-teal-500/25 ring-2 ring-teal-400/40'
                      : 'bg-slate-100 hover:bg-slate-200 dark:bg-zinc-900 dark:hover:bg-zinc-800 text-slate-700 dark:text-zinc-300 border border-slate-200 dark:border-white/10'
                  }`}
                  title="Save changes to stock (Ctrl+S)"
                >
                  {savedNotification ? (
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

          {/* Authentication Screen */}
          {!isAuthenticated ? (
            <div className="flex-1 flex flex-col items-center justify-center p-6 text-center">
              <div className="w-16 h-16 rounded-2xl bg-slate-100 dark:bg-zinc-900 border border-slate-200 dark:border-white/10 flex items-center justify-center text-purple-600 dark:text-purple-400 mb-4 shadow-xl">
                <Lock className="w-8 h-8" />
              </div>

              <h4 className="text-xl font-bold text-slate-900 dark:text-white mb-1 font-space">
                Enter Staff Passcode
              </h4>
              <p className="text-xs text-slate-500 dark:text-zinc-400 mb-6 max-w-xs">
                Enter your authorized staff security PIN to access and modify real-time stock quantities.
              </p>

              <form onSubmit={handleVerifyPin} className="w-full max-w-xs space-y-3">
                <input
                  type="password"
                  maxLength={6}
                  value={pin}
                  onChange={(e) => setPin(e.target.value)}
                  placeholder="Enter PIN (2026)..."
                  autoFocus
                  className="w-full text-center text-xl tracking-widest py-3 px-4 rounded-xl bg-slate-100 dark:bg-zinc-900 border border-slate-200 dark:border-white/10 text-slate-900 dark:text-white focus:border-teal-500 dark:focus:border-teal-400 focus:outline-none font-mono-spec"
                />

                {authError && (
                  <p className="text-xs text-rose-600 dark:text-rose-400 font-mono-spec flex items-center justify-center gap-1">
                    <ShieldAlert className="w-3.5 h-3.5" /> Incorrect PIN. Access denied.
                  </p>
                )}

                <button
                  type="submit"
                  className="w-full py-3 rounded-xl bg-teal-400 hover:bg-teal-300 text-black font-semibold text-sm transition-all cursor-pointer shadow-lg shadow-teal-500/20"
                >
                  Unlock Stock Controls
                </button>
              </form>
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
                      <span>Stock inventory saved successfully! Live showcase updated.</span>
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
                  className={`flex items-center gap-2 px-5 py-2.5 rounded-xl font-bold transition-all cursor-pointer shadow-md text-xs ${
                    savedNotification
                      ? 'bg-emerald-500 text-white shadow-emerald-500/20'
                      : hasUnsavedChanges
                      ? 'bg-gradient-to-r from-teal-400 to-emerald-400 hover:from-teal-300 hover:to-emerald-300 text-black shadow-teal-500/30 ring-2 ring-teal-400/50 scale-[1.02]'
                      : 'bg-teal-400 hover:bg-teal-300 text-black shadow-teal-500/20'
                  }`}
                  title="Save all inventory adjustments to storage (Ctrl+S)"
                >
                  {savedNotification ? (
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

