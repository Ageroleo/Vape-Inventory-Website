'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { VapeProduct, FlavorVariant, StockStatus, ProductCategory } from '@/types/vape';
import { 
  saveInventory,
  exportInventoryJson, 
  resetInventoryToDefault 
} from '@/lib/inventoryService';
import { isSupabaseConfigured } from '@/lib/supabaseClient';
import { 
  X, Lock, Unlock, Plus, Minus, Download, RotateCcw, 
  Search, ShieldAlert, Save, Check, Cloud, CloudOff, Loader2,
  KeyRound, Delete, Trash2, Tag, Layers, Sparkles
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

const COLOR_PALETTE = [
  { name: 'Emerald', hex: '#10b981' },
  { name: 'Teal', hex: '#00d4aa' },
  { name: 'Cyan', hex: '#06b6d4' },
  { name: 'Purple', hex: '#8b5cf6' },
  { name: 'Pink', hex: '#ec4899' },
  { name: 'Rose', hex: '#f43f5e' },
  { name: 'Amber', hex: '#f59e0b' },
  { name: 'Indigo', hex: '#6366f1' },
  { name: 'Lime', hex: '#84cc16' },
  { name: 'Dark Slate', hex: '#475569' },
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

  // New Brand / Product Modal & Form State
  const [isCreatingProduct, setIsCreatingProduct] = useState(false);
  const [newBrandName, setNewBrandName] = useState('');
  const [newProductName, setNewProductName] = useState('');
  const [newCategory, setNewCategory] = useState<ProductCategory>('transparent_disposable');
  const [newPrice, setNewPrice] = useState<number>(320);
  const [newPuffCount, setNewPuffCount] = useState<number>(30000);
  const [newNicotine, setNewNicotine] = useState<string>('3% (30mg)');
  const [newInitialFlavors, setNewInitialFlavors] = useState<Array<{ name: string; colorHex: string; stockCount: number }>>([
    { name: '', colorHex: '#10b981', stockCount: 10 }
  ]);

  // Adding Flavor to Existing Product State
  const [addingFlavorForProductId, setAddingFlavorForProductId] = useState<string | null>(null);
  const [newFlavorName, setNewFlavorName] = useState('');
  const [newFlavorColor, setNewFlavorColor] = useState('#10b981');
  const [newFlavorStock, setNewFlavorStock] = useState<number>(10);

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

  // Add Flavor to Existing Product
  const handleAddFlavorToProduct = (productId: string) => {
    if (!newFlavorName.trim()) {
      alert('Please enter a flavor name.');
      return;
    }

    const newFlavor: FlavorVariant = {
      id: `flavor_${Date.now()}`,
      name: newFlavorName.trim(),
      colorHex: newFlavorColor || '#10b981',
      coolingLevel: 3,
      sweetnessLevel: 3,
      stockCount: Math.max(0, newFlavorStock),
      status: newFlavorStock > 0 ? 'in_stock' : 'out_of_stock',
    };

    setLocalProducts((prev) =>
      prev.map((product) => {
        if (product.id !== productId) return product;
        return {
          ...product,
          flavors: [...product.flavors, newFlavor],
        };
      })
    );

    setHasUnsavedChanges(true);
    setAddingFlavorForProductId(null);
    setNewFlavorName('');
    setNewFlavorColor('#10b981');
    setNewFlavorStock(10);
  };

  // Delete Flavor from Existing Product
  const handleDeleteFlavor = (productId: string, flavorId: string, flavorName: string) => {
    if (!window.confirm(`Delete flavor "${flavorName}"?`)) return;

    setLocalProducts((prev) =>
      prev.map((product) => {
        if (product.id !== productId) return product;
        return {
          ...product,
          flavors: product.flavors.filter((f) => f.id !== flavorId),
        };
      })
    );
    setHasUnsavedChanges(true);
  };

  // Delete Entire Brand / Device
  const handleDeleteProduct = (productId: string, productName: string) => {
    if (!window.confirm(`Are you sure you want to completely remove "${productName}" and all its flavors?`)) return;

    setLocalProducts((prev) => prev.filter((p) => p.id !== productId));
    setHasUnsavedChanges(true);
  };

  // Create Brand & Product
  const handleCreateProduct = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newBrandName.trim() || !newProductName.trim()) {
      alert('Please provide both Brand Name and Model/Device Name.');
      return;
    }

    const validFlavors = newInitialFlavors.filter((f) => f.name.trim());
    const flavorsList: FlavorVariant[] = (
      validFlavors.length > 0
        ? validFlavors
        : [{ name: 'Original Menthol', colorHex: '#10b981', stockCount: 10 }]
    ).map((f, idx) => ({
      id: `flavor_${Date.now()}_${idx}`,
      name: f.name.trim() || 'Original',
      colorHex: f.colorHex || '#10b981',
      coolingLevel: 3,
      sweetnessLevel: 3,
      stockCount: Math.max(0, f.stockCount || 0),
      status: (f.stockCount || 0) > 0 ? 'in_stock' : 'out_of_stock',
    }));

    const slug = `${newBrandName}-${newProductName}`.toLowerCase().replace(/[^a-z0-9]+/g, '-');
    const newProduct: VapeProduct = {
      id: `prod_${Date.now()}`,
      slug,
      name: newProductName.trim(),
      brand: newBrandName.trim(),
      category: newCategory,
      price: Math.max(0, newPrice || 0),
      nicotineStrength: newNicotine || '3% (30mg)',
      puffCount: newPuffCount > 0 ? newPuffCount : undefined,
      coilType: 'Dual Mesh Coil',
      image: 'linear-gradient(135deg, #0f172a 0%, #1e293b 100%)',
      description: `${newBrandName} ${newProductName} live inventory showcase device.`,
      flavors: flavorsList,
      isNewArrival: true,
    };

    setLocalProducts((prev) => [newProduct, ...prev]);
    setHasUnsavedChanges(true);
    setIsCreatingProduct(false);

    // Reset Form
    setNewBrandName('');
    setNewProductName('');
    setNewPrice(320);
    setNewPuffCount(30000);
    setNewInitialFlavors([{ name: '', colorHex: '#10b981', stockCount: 10 }]);
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
    if (window.confirm('Reset all inventory back to initial default values? This will remove custom created brands.')) {
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
      <div className="fixed inset-0 z-50 flex justify-end bg-black/40 dark:bg-black/75 backdrop-blur-sm">
        <motion.div
          initial={{ x: '100%' }}
          animate={{ x: 0 }}
          exit={{ x: '100%' }}
          transition={{ type: 'spring', damping: 30, stiffness: 300 }}
          className="relative w-full max-w-2xl h-full bg-white dark:bg-[#12141c] border-l border-neutral-200 dark:border-white/[0.08] shadow-2xl flex flex-col justify-between text-neutral-900 dark:text-white transition-colors"
        >
          {/* Header */}
          <div className="p-4 sm:p-5 border-b border-neutral-200 dark:border-white/[0.08] flex items-center justify-between bg-neutral-50 dark:bg-neutral-900/40">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-xl bg-neutral-100 dark:bg-neutral-800 text-neutral-800 dark:text-neutral-200">
                {isAuthenticated ? <Unlock className="w-5 h-5 text-emerald-600 dark:text-emerald-400" /> : <Lock className="w-5 h-5" />}
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-sm sm:text-base font-bold text-neutral-900 dark:text-white font-space">
                    Staff Inventory Manager
                  </h3>
                  {hasUnsavedChanges && (
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-amber-500/10 text-amber-700 dark:text-amber-400 border border-amber-500/20">
                      <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse" />
                      Unsaved
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-2 mt-0.5 text-xs text-neutral-500 dark:text-neutral-400 font-mono-spec">
                  {isSupabaseConfigured() ? (
                    <span className="inline-flex items-center gap-1 text-emerald-600 dark:text-emerald-400 font-medium">
                      <Cloud className="w-3.5 h-3.5" />
                      <span>Cloud Sync Active</span>
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 text-neutral-400 dark:text-neutral-500">
                      <CloudOff className="w-3.5 h-3.5" />
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
                  className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl font-semibold text-xs transition-all cursor-pointer ${
                    isSaving
                      ? 'bg-neutral-800 text-white cursor-wait'
                      : savedNotification
                      ? 'bg-emerald-600 text-white shadow-xs'
                      : hasUnsavedChanges
                      ? 'bg-neutral-900 hover:bg-neutral-800 text-white dark:bg-white dark:hover:bg-neutral-100 dark:text-neutral-900 shadow-sm'
                      : 'bg-neutral-100 hover:bg-neutral-200 dark:bg-neutral-800 dark:hover:bg-neutral-700 text-neutral-700 dark:text-neutral-300'
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
                className="p-2 rounded-xl text-neutral-400 hover:text-neutral-900 dark:hover:text-white hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Authentication Screen - Interactive PIN Keypad */}
          {!isAuthenticated ? (
            <div className="flex-1 flex flex-col items-center justify-center p-6 text-center select-none overflow-y-auto">
              <div className="w-12 h-12 rounded-full bg-neutral-100 dark:bg-neutral-800 flex items-center justify-center text-neutral-800 dark:text-neutral-200 mb-3">
                <KeyRound className="w-6 h-6" />
              </div>

              <h4 className="text-lg font-bold text-neutral-900 dark:text-white font-space">
                Staff Security Keypad
              </h4>
              <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-1 max-w-xs font-mono-spec">
                Enter your 4-digit PIN to manage brands and stock
              </p>

              {/* 4-Digit Slot Indicators */}
              <motion.div
                animate={shake ? { x: [-10, 10, -6, 6, -2, 2, 0] } : {}}
                transition={{ duration: 0.3 }}
                className="flex items-center justify-center gap-3.5 my-5"
              >
                {[0, 1, 2, 3].map((idx) => {
                  const isFilled = pin.length > idx;
                  return (
                    <motion.div
                      key={idx}
                      animate={isFilled ? { scale: [1, 1.25, 1] } : { scale: 1 }}
                      transition={{ duration: 0.15 }}
                      className={`w-3.5 h-3.5 rounded-full border transition-all ${
                        authError
                          ? 'border-rose-500 bg-rose-500'
                          : isFilled
                          ? 'border-neutral-900 bg-neutral-900 dark:border-white dark:bg-white'
                          : 'border-neutral-300 dark:border-neutral-700 bg-transparent'
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
                      <span>Incorrect PIN. Try again.</span>
                    </motion.p>
                  )}
                </AnimatePresence>
              </div>

              {/* Numeric Keypad Grid */}
              <div className="grid grid-cols-3 gap-2.5 sm:gap-3 max-w-xs w-full justify-items-center">
                {KEYPAD_BUTTONS.map((item) => {
                  if (item.action === 'clear') {
                    return (
                      <button
                        key="clear"
                        type="button"
                        onClick={handlePinClear}
                        aria-label="Clear PIN"
                        className="w-16 h-16 rounded-2xl bg-neutral-100 hover:bg-neutral-200/80 text-neutral-600 dark:bg-neutral-900 dark:hover:bg-neutral-800 dark:text-neutral-300 active:scale-95 transition-all flex flex-col items-center justify-center cursor-pointer"
                      >
                        <span className="font-space font-bold text-base leading-none">C</span>
                        <span className="text-[9px] font-mono-spec text-neutral-400 mt-1">CLEAR</span>
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
                        className="w-16 h-16 rounded-2xl bg-neutral-100 hover:bg-neutral-200/80 text-neutral-600 dark:bg-neutral-900 dark:hover:bg-neutral-800 dark:text-neutral-300 active:scale-95 transition-all flex items-center justify-center cursor-pointer"
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
                      className="w-16 h-16 rounded-2xl bg-neutral-100 hover:bg-neutral-200 text-neutral-900 dark:bg-neutral-900 dark:hover:bg-neutral-800 dark:text-white active:scale-95 transition-all flex flex-col items-center justify-center cursor-pointer shadow-xs"
                    >
                      <span className="text-xl font-bold font-space leading-none">
                        {item.num}
                      </span>
                      {item.sub ? (
                        <span className="text-[8px] font-mono-spec tracking-widest text-neutral-400 mt-0.5">
                          {item.sub}
                        </span>
                      ) : (
                        <span className="h-[10px]" />
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
          ) : (
            /* Stock Editor & Brand Manager Screen */
            <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-4">
              
              {/* Top Action Bar: Add Brand & Search */}
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2.5">
                <button
                  type="button"
                  onClick={() => setIsCreatingProduct(true)}
                  className="flex items-center justify-center gap-2 px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold bg-neutral-900 text-white hover:bg-neutral-800 dark:bg-white dark:text-neutral-900 dark:hover:bg-neutral-100 transition-all cursor-pointer shadow-sm active:scale-98"
                >
                  <Plus className="w-4 h-4" />
                  <span>Add New Brand / Device</span>
                </button>

                <div className="relative flex-1 sm:max-w-xs">
                  <Search className="w-4 h-4 text-neutral-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                  <input
                    type="text"
                    value={adminSearch}
                    onChange={(e) => setAdminSearch(e.target.value)}
                    placeholder="Search brand, device, flavor..."
                    className="w-full pl-9 pr-3 py-1.5 text-xs bg-neutral-100 dark:bg-neutral-900 border border-neutral-200 dark:border-white/[0.08] rounded-xl text-neutral-900 dark:text-white placeholder-neutral-400 focus:outline-none focus:border-neutral-400 dark:focus:border-white/20"
                  />
                </div>
              </div>

              {/* Notification Banner when saved */}
              <AnimatePresence>
                {savedNotification && (
                  <motion.div
                    initial={{ opacity: 0, y: -8 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -8 }}
                    className="p-3 bg-emerald-500/10 border border-emerald-500/20 rounded-xl text-emerald-800 dark:text-emerald-300 flex items-center justify-between text-xs font-medium"
                  >
                    <div className="flex items-center gap-2">
                      <Check className="w-4 h-4 text-emerald-600 flex-shrink-0" />
                      <span>
                        {isSupabaseConfigured()
                          ? 'Stock and brands synced to Supabase Cloud.'
                          : 'Saved to local storage. Live catalog updated.'}
                      </span>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Create Brand / Device Modal Form */}
              <AnimatePresence>
                {isCreatingProduct && (
                  <motion.form
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    onSubmit={handleCreateProduct}
                    className="p-4 sm:p-5 rounded-2xl bg-neutral-50 dark:bg-neutral-900/90 border border-neutral-300 dark:border-white/20 space-y-4 shadow-lg"
                  >
                    <div className="flex items-center justify-between border-b border-neutral-200 dark:border-white/[0.08] pb-3">
                      <div className="flex items-center gap-2">
                        <Tag className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                        <h4 className="text-sm font-bold text-neutral-900 dark:text-white font-space">
                          Create New Brand & Device
                        </h4>
                      </div>
                      <button
                        type="button"
                        onClick={() => setIsCreatingProduct(false)}
                        className="text-neutral-400 hover:text-neutral-900 dark:hover:text-white p-1"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                      <div>
                        <label className="block text-neutral-500 dark:text-neutral-400 mb-1 font-medium">
                          Brand Name *
                        </label>
                        <input
                          type="text"
                          required
                          value={newBrandName}
                          onChange={(e) => setNewBrandName(e.target.value)}
                          placeholder="e.g. Geek Bar, Waka, Relx"
                          className="w-full px-3 py-2 rounded-xl bg-white dark:bg-neutral-800 border border-neutral-200 dark:border-white/10 text-neutral-900 dark:text-white focus:outline-none focus:border-neutral-400"
                        />
                      </div>

                      <div>
                        <label className="block text-neutral-500 dark:text-neutral-400 mb-1 font-medium">
                          Model / Device Name *
                        </label>
                        <input
                          type="text"
                          required
                          value={newProductName}
                          onChange={(e) => setNewProductName(e.target.value)}
                          placeholder="e.g. Pulse 15,000, soPro 20K"
                          className="w-full px-3 py-2 rounded-xl bg-white dark:bg-neutral-800 border border-neutral-200 dark:border-white/10 text-neutral-900 dark:text-white focus:outline-none focus:border-neutral-400"
                        />
                      </div>

                      <div>
                        <label className="block text-neutral-500 dark:text-neutral-400 mb-1 font-medium">
                          Category
                        </label>
                        <select
                          value={newCategory}
                          onChange={(e) => setNewCategory(e.target.value as ProductCategory)}
                          className="w-full px-3 py-2 rounded-xl bg-white dark:bg-neutral-800 border border-neutral-200 dark:border-white/10 text-neutral-900 dark:text-white focus:outline-none focus:border-neutral-400"
                        >
                          <option value="transparent_disposable">Transparent Tank Disposable</option>
                          <option value="non_transparent_disposable">Solid / Non-Transparent</option>
                        </select>
                      </div>

                      <div>
                        <label className="block text-neutral-500 dark:text-neutral-400 mb-1 font-medium">
                          Price (₱) *
                        </label>
                        <input
                          type="number"
                          required
                          min={0}
                          value={newPrice}
                          onChange={(e) => setNewPrice(parseInt(e.target.value) || 0)}
                          className="w-full px-3 py-2 rounded-xl bg-white dark:bg-neutral-800 border border-neutral-200 dark:border-white/10 text-neutral-900 dark:text-white font-mono-spec focus:outline-none focus:border-neutral-400"
                        />
                      </div>

                      <div>
                        <label className="block text-neutral-500 dark:text-neutral-400 mb-1 font-medium">
                          Puff Count
                        </label>
                        <input
                          type="number"
                          min={0}
                          value={newPuffCount}
                          onChange={(e) => setNewPuffCount(parseInt(e.target.value) || 0)}
                          className="w-full px-3 py-2 rounded-xl bg-white dark:bg-neutral-800 border border-neutral-200 dark:border-white/10 text-neutral-900 dark:text-white font-mono-spec focus:outline-none focus:border-neutral-400"
                        />
                      </div>

                      <div>
                        <label className="block text-neutral-500 dark:text-neutral-400 mb-1 font-medium">
                          Nicotine Strength
                        </label>
                        <input
                          type="text"
                          value={newNicotine}
                          onChange={(e) => setNewNicotine(e.target.value)}
                          placeholder="e.g. 3% (30mg) or 5%"
                          className="w-full px-3 py-2 rounded-xl bg-white dark:bg-neutral-800 border border-neutral-200 dark:border-white/10 text-neutral-900 dark:text-white focus:outline-none focus:border-neutral-400"
                        />
                      </div>
                    </div>

                    {/* Flavors for this new brand */}
                    <div className="space-y-2 pt-2 border-t border-neutral-200 dark:border-white/[0.08]">
                      <div className="flex items-center justify-between text-xs font-medium text-neutral-700 dark:text-neutral-300">
                        <span>Flavors for {newBrandName || 'this brand'}:</span>
                        <button
                          type="button"
                          onClick={() =>
                            setNewInitialFlavors((prev) => [
                              ...prev,
                              { name: '', colorHex: COLOR_PALETTE[prev.length % COLOR_PALETTE.length].hex, stockCount: 10 },
                            ])
                          }
                          className="inline-flex items-center gap-1 text-emerald-600 dark:text-emerald-400 hover:underline cursor-pointer"
                        >
                          <Plus className="w-3.5 h-3.5" />
                          <span>Add another flavor</span>
                        </button>
                      </div>

                      <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                        {newInitialFlavors.map((flv, idx) => (
                          <div
                            key={idx}
                            className="flex items-center gap-2 p-2 rounded-xl bg-white dark:bg-neutral-800 border border-neutral-200 dark:border-white/[0.08] text-xs"
                          >
                            <input
                              type="color"
                              value={flv.colorHex}
                              onChange={(e) =>
                                setNewInitialFlavors((prev) =>
                                  prev.map((item, i) => (i === idx ? { ...item, colorHex: e.target.value } : item))
                                )
                              }
                              className="w-7 h-7 rounded-lg border-0 cursor-pointer bg-transparent"
                              title="Pick flavor color"
                            />

                            <input
                              type="text"
                              required
                              value={flv.name}
                              onChange={(e) =>
                                setNewInitialFlavors((prev) =>
                                  prev.map((item, i) => (i === idx ? { ...item, name: e.target.value } : item))
                                )
                              }
                              placeholder="e.g. Watermelon Ice, Blue Razz"
                              className="flex-1 px-2.5 py-1 rounded-lg bg-neutral-50 dark:bg-neutral-900 border border-neutral-200 dark:border-white/[0.08] text-neutral-900 dark:text-white focus:outline-none"
                            />

                            <div className="flex items-center gap-1">
                              <span className="text-[10px] text-neutral-400 font-mono-spec">Qty:</span>
                              <input
                                type="number"
                                min={0}
                                value={flv.stockCount}
                                onChange={(e) =>
                                  setNewInitialFlavors((prev) =>
                                    prev.map((item, i) =>
                                      i === idx ? { ...item, stockCount: parseInt(e.target.value) || 0 } : item
                                    )
                                  )
                                }
                                className="w-14 px-2 py-1 rounded-lg bg-neutral-50 dark:bg-neutral-900 border border-neutral-200 dark:border-white/[0.08] text-neutral-900 dark:text-white font-mono-spec text-center focus:outline-none"
                              />
                            </div>

                            {newInitialFlavors.length > 1 && (
                              <button
                                type="button"
                                onClick={() =>
                                  setNewInitialFlavors((prev) => prev.filter((_, i) => i !== idx))
                                }
                                className="p-1 text-neutral-400 hover:text-rose-500"
                                title="Remove flavor"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>

                    <div className="flex items-center justify-end gap-2 pt-2 border-t border-neutral-200 dark:border-white/[0.08]">
                      <button
                        type="button"
                        onClick={() => setIsCreatingProduct(false)}
                        className="px-3.5 py-2 rounded-xl text-xs font-medium text-neutral-600 hover:text-neutral-900 dark:text-neutral-400 dark:hover:text-white"
                      >
                        Cancel
                      </button>
                      <button
                        type="submit"
                        className="px-4 py-2 rounded-xl text-xs font-semibold bg-neutral-900 text-white hover:bg-neutral-800 dark:bg-white dark:text-neutral-900 dark:hover:bg-neutral-100 transition-all cursor-pointer shadow-sm"
                      >
                        Create Brand & Device
                      </button>
                    </div>
                  </motion.form>
                )}
              </AnimatePresence>

              {/* Product and Flavor List */}
              <div className="space-y-4">
                {filteredProducts.map((product) => (
                  <div
                    key={product.id}
                    className="p-4 rounded-2xl bg-neutral-50 dark:bg-neutral-900/60 border border-neutral-200/80 dark:border-white/[0.06] space-y-3"
                  >
                    {/* Product Header */}
                    <div className="flex items-center justify-between border-b border-neutral-200 dark:border-white/[0.06] pb-2.5">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-[10px] font-mono-spec uppercase text-neutral-500 dark:text-neutral-400 font-bold">
                            {product.brand}
                          </span>
                          <span className="text-[10px] px-2 py-0.2 rounded-full bg-neutral-200/60 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-300">
                            {product.category === 'transparent_disposable' ? 'Transparent' : 'Solid'}
                          </span>
                        </div>
                        <h4 className="text-sm font-bold text-neutral-900 dark:text-white font-space mt-0.5">
                          {product.name}
                        </h4>
                      </div>

                      <div className="flex items-center gap-2">
                        <span className="text-xs font-mono-spec font-semibold text-neutral-900 dark:text-white">
                          ₱{product.price.toLocaleString()}
                        </span>

                        {/* Add Flavor button */}
                        <button
                          type="button"
                          onClick={() => {
                            setAddingFlavorForProductId(product.id);
                            setNewFlavorName('');
                            setNewFlavorColor('#10b981');
                            setNewFlavorStock(10);
                          }}
                          className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-medium bg-neutral-200/70 hover:bg-neutral-200 dark:bg-neutral-800 dark:hover:bg-neutral-700 text-neutral-800 dark:text-neutral-200 transition-colors cursor-pointer"
                          title="Add a new flavor variant to this device"
                        >
                          <Plus className="w-3 h-3" />
                          <span>Flavor</span>
                        </button>

                        {/* Delete Brand / Device button */}
                        <button
                          type="button"
                          onClick={() => handleDeleteProduct(product.id, `${product.brand} ${product.name}`)}
                          className="p-1 text-neutral-400 hover:text-rose-500 transition-colors"
                          title="Delete this product"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>

                    {/* Inline Add Flavor to Existing Product Form */}
                    <AnimatePresence>
                      {addingFlavorForProductId === product.id && (
                        <motion.div
                          initial={{ opacity: 0, height: 0 }}
                          animate={{ opacity: 1, height: 'auto' }}
                          exit={{ opacity: 0, height: 0 }}
                          className="p-3 rounded-xl bg-white dark:bg-neutral-800 border border-neutral-300 dark:border-white/10 space-y-3 shadow-xs"
                        >
                          <div className="flex items-center justify-between text-xs font-bold text-neutral-800 dark:text-neutral-200">
                            <span>Add Flavor to {product.brand}:</span>
                            <button
                              type="button"
                              onClick={() => setAddingFlavorForProductId(null)}
                              className="text-neutral-400 hover:text-neutral-900 dark:hover:text-white"
                            >
                              <X className="w-3.5 h-3.5" />
                            </button>
                          </div>

                          <div className="grid grid-cols-1 sm:grid-cols-12 gap-2 text-xs">
                            <div className="sm:col-span-6">
                              <input
                                type="text"
                                autoFocus
                                value={newFlavorName}
                                onChange={(e) => setNewFlavorName(e.target.value)}
                                placeholder="Flavor name (e.g. Grape Ice)"
                                className="w-full px-2.5 py-1.5 rounded-lg bg-neutral-50 dark:bg-neutral-900 border border-neutral-200 dark:border-white/10 text-neutral-900 dark:text-white focus:outline-none"
                              />
                            </div>

                            <div className="sm:col-span-3 flex items-center gap-1.5">
                              <input
                                type="color"
                                value={newFlavorColor}
                                onChange={(e) => setNewFlavorColor(e.target.value)}
                                className="w-8 h-8 rounded-lg border-0 cursor-pointer bg-transparent"
                                title="Pick flavor color swatch"
                              />
                              <div className="flex flex-wrap gap-1">
                                {COLOR_PALETTE.slice(0, 4).map((c) => (
                                  <button
                                    key={c.hex}
                                    type="button"
                                    onClick={() => setNewFlavorColor(c.hex)}
                                    className="w-3.5 h-3.5 rounded-full border border-black/10 dark:border-white/20"
                                    style={{ backgroundColor: c.hex }}
                                    title={c.name}
                                  />
                                ))}
                              </div>
                            </div>

                            <div className="sm:col-span-3 flex items-center gap-1">
                              <span className="text-[10px] text-neutral-400 font-mono-spec">Qty:</span>
                              <input
                                type="number"
                                min={0}
                                value={newFlavorStock}
                                onChange={(e) => setNewFlavorStock(parseInt(e.target.value) || 0)}
                                className="w-full px-2 py-1.5 rounded-lg bg-neutral-50 dark:bg-neutral-900 border border-neutral-200 dark:border-white/10 text-neutral-900 dark:text-white font-mono-spec text-center focus:outline-none"
                              />
                            </div>
                          </div>

                          <div className="flex justify-end gap-2">
                            <button
                              type="button"
                              onClick={() => setAddingFlavorForProductId(null)}
                              className="px-2.5 py-1 rounded-lg text-xs text-neutral-500 hover:text-neutral-900 dark:text-neutral-400 dark:hover:text-white"
                            >
                              Cancel
                            </button>
                            <button
                              type="button"
                              onClick={() => handleAddFlavorToProduct(product.id)}
                              className="px-3 py-1 rounded-lg text-xs font-semibold bg-neutral-900 text-white dark:bg-white dark:text-neutral-900 hover:opacity-90 cursor-pointer shadow-xs"
                            >
                              Add Flavor
                            </button>
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>

                    {/* Flavors Rows */}
                    <div className="space-y-1.5">
                      {product.flavors.map((flavor) => {
                        const isSoldOut = flavor.status === 'out_of_stock' || flavor.stockCount === 0;

                        return (
                          <div
                            key={flavor.id}
                            className="flex items-center justify-between gap-3 p-2 rounded-xl bg-white dark:bg-[#12141c] border border-neutral-200/80 dark:border-white/[0.06] text-xs"
                          >
                            <div className="flex items-center gap-2 truncate">
                              <span
                                className="w-2.5 h-2.5 rounded-full flex-shrink-0"
                                style={{ backgroundColor: flavor.colorHex }}
                              />
                              <span className={`truncate font-medium ${isSoldOut ? 'text-neutral-400 dark:text-neutral-500 line-through' : 'text-neutral-800 dark:text-neutral-200'}`}>
                                {flavor.name}
                              </span>
                            </div>

                            <div className="flex items-center gap-2 flex-shrink-0">
                              {/* Stock count with -/+, exact number input */}
                              <div className="flex items-center gap-1 bg-neutral-100 dark:bg-neutral-800 px-1.5 py-0.5 rounded-lg border border-neutral-200/80 dark:border-white/[0.08] font-mono-spec text-xs">
                                <button
                                  type="button"
                                  onClick={() => handleStockDelta(product.id, flavor.id, -1)}
                                  disabled={flavor.stockCount <= 0}
                                  className="w-5 h-5 flex items-center justify-center text-neutral-500 hover:text-neutral-900 dark:hover:text-white disabled:opacity-30 cursor-pointer"
                                  title="Decrease quantity by 1"
                                >
                                  <Minus className="w-3 h-3" />
                                </button>
                                
                                <input
                                  type="number"
                                  min={0}
                                  value={flavor.stockCount}
                                  onChange={(e) => handleStockExact(product.id, flavor.id, parseInt(e.target.value) || 0)}
                                  className={`w-9 text-center font-bold bg-transparent border-0 focus:outline-none font-mono-spec [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none ${
                                    flavor.stockCount > 0 ? 'text-neutral-900 dark:text-white' : 'text-rose-500'
                                  }`}
                                  title="Type exact quantity"
                                />

                                <button
                                  type="button"
                                  onClick={() => handleStockDelta(product.id, flavor.id, 1)}
                                  className="w-5 h-5 flex items-center justify-center text-neutral-500 hover:text-neutral-900 dark:hover:text-white cursor-pointer"
                                  title="Increase quantity by 1"
                                >
                                  <Plus className="w-3 h-3" />
                                </button>
                              </div>

                              {/* Toggle Sold Out / Active */}
                              <button
                                type="button"
                                onClick={() => handleToggleSoldOut(product.id, flavor.id)}
                                className={`px-2.5 py-0.5 rounded-lg font-mono-spec text-[11px] font-semibold transition-all cursor-pointer ${
                                  isSoldOut
                                    ? 'bg-rose-500/10 text-rose-600 dark:text-rose-400 hover:bg-rose-500/20'
                                    : 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 hover:bg-emerald-500/20'
                                }`}
                              >
                                {isSoldOut ? 'Sold Out' : 'Active'}
                              </button>

                              {/* Delete single flavor */}
                              <button
                                type="button"
                                onClick={() => handleDeleteFlavor(product.id, flavor.id, flavor.name)}
                                className="p-1 text-neutral-300 hover:text-rose-500 dark:text-neutral-600 dark:hover:text-rose-400 transition-colors"
                                title="Delete flavor"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
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
            <div className="p-4 border-t border-neutral-200 dark:border-white/[0.08] bg-neutral-50 dark:bg-neutral-900/60 flex flex-wrap items-center justify-between gap-3 text-xs">
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleReset}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-neutral-600 dark:text-neutral-400 hover:text-rose-600 dark:hover:text-rose-400 border border-neutral-200 dark:border-white/[0.08] hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors cursor-pointer"
                  title="Reset to default initial products"
                >
                  <RotateCcw className="w-3.5 h-3.5 text-rose-500" />
                  <span>Reset Defaults</span>
                </button>

                <button
                  type="button"
                  onClick={() => exportInventoryJson(localProducts)}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white border border-neutral-200 dark:border-white/[0.08] hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors cursor-pointer"
                  title="Download inventory as JSON"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Export</span>
                </button>
              </div>

              <div className="flex items-center gap-2.5">
                {hasUnsavedChanges && (
                  <span className="text-[11px] font-mono-spec text-amber-600 dark:text-amber-400 flex items-center gap-1.5 font-medium">
                    <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse" />
                    <span>Unsaved changes</span>
                  </span>
                )}

                <button
                  type="button"
                  onClick={handleSave}
                  disabled={isSaving}
                  className="flex items-center gap-2 px-5 py-2 rounded-xl font-bold transition-all cursor-pointer shadow-sm text-xs bg-neutral-900 hover:bg-neutral-800 text-white dark:bg-white dark:hover:bg-neutral-100 dark:text-neutral-900 active:scale-98"
                  title="Save all inventory adjustments (Ctrl+S)"
                >
                  {isSaving ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      <span>Saving...</span>
                    </>
                  ) : savedNotification ? (
                    <>
                      <Check className="w-3.5 h-3.5 text-emerald-400" />
                      <span>Saved!</span>
                    </>
                  ) : (
                    <>
                      <Save className="w-3.5 h-3.5" />
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
