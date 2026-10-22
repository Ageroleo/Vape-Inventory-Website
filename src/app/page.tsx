'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { VapeProduct, FlavorVariant, FilterState } from '@/types/vape';
import { 
  getStoredInventory, 
  INVENTORY_EVENT, 
  fetchInventoryFromCloud, 
  subscribeToInventoryRealtime 
} from '@/lib/inventoryService';
import { Navbar } from '@/components/Navbar';
import { HeroSpotlight } from '@/components/HeroSpotlight';
import { FilterBar } from '@/components/FilterBar';
import { ProductCard } from '@/components/ProductCard';
import { ProductDetailModal } from '@/components/ProductDetailModal';
import { AdminStockDrawer } from '@/components/AdminStockDrawer';
import { AgeVerificationModal } from '@/components/AgeVerificationModal';
import { MessengerToast, ToastData } from '@/components/MessengerToast';
import { generateReservationMessage, openMessengerReservation } from '@/lib/messenger';
import {
  PackageOpen, RotateCcw, Sparkles, MessageSquare,
  Flame, ShieldCheck, Clock, MapPin, Zap, ExternalLink
} from 'lucide-react';

export default function HomePage() {
  const [products, setProducts] = useState<VapeProduct[]>([]);
  const [mounted, setMounted] = useState(false);

  // Filters State
  const [filters, setFilters] = useState<FilterState>({
    searchQuery: '',
    category: 'all',
    brand: 'all',
    puffRange: 'all',
    coolingFilter: 'all',
    sortBy: 'featured',
    inStockOnly: false,
  });

  // Modal & Drawer State
  const [selectedProduct, setSelectedProduct] = useState<VapeProduct | null>(null);
  const [activeModalFlavor, setActiveModalFlavor] = useState<FlavorVariant | undefined>(undefined);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isAdminOpen, setIsAdminOpen] = useState(false);
  const [toastData, setToastData] = useState<ToastData | null>(null);

  // Load and subscribe to inventory changes (Local + Cloud Realtime)
  useEffect(() => {
    setMounted(true);
    setProducts(getStoredInventory());

    // Fetch latest cloud state from Supabase
    fetchInventoryFromCloud().then((cloudProducts) => {
      if (cloudProducts) {
        setProducts(cloudProducts);
      }
    });

    const handleUpdate = (e: Event) => {
      const customEvent = e as CustomEvent<VapeProduct[]>;
      if (customEvent.detail) {
        setProducts(customEvent.detail);
      } else {
        setProducts(getStoredInventory());
      }
    };

    window.addEventListener(INVENTORY_EVENT, handleUpdate);

    // Subscribe to multi-user Supabase Realtime broadcast
    const unsubscribeRealtime = subscribeToInventoryRealtime((newProducts) => {
      setProducts(newProducts);
    });

    return () => {
      window.removeEventListener(INVENTORY_EVENT, handleUpdate);
      unsubscribeRealtime();
    };
  }, []);

  // Compute live brands available
  const availableBrands = useMemo(() => {
    const brandsSet = new Set<string>();
    products.forEach((p) => brandsSet.add(p.brand));
    return Array.from(brandsSet);
  }, [products]);

  // Compute total available in-stock flavors
  const totalFlavorsInStock = useMemo(() => {
    return products.reduce((acc, p) => {
      return acc + p.flavors.filter((f) => f.status !== 'out_of_stock' && f.stockCount > 0).length;
    }, 0);
  }, [products]);

  // Category counts for Bento Hero & inventory stats (calculating actual pieces in stock)
  const categoryCounts = useMemo(() => {
    let transparent = 0;
    let nonTransparent = 0;

    products.forEach((p) => {
      const piecesSum = p.flavors.reduce((sum, f) => {
        return f.status !== 'out_of_stock' ? sum + (f.stockCount || 0) : sum;
      }, 0);

      if (p.category === 'transparent_disposable') transparent += piecesSum;
      if (p.category === 'non_transparent_disposable') nonTransparent += piecesSum;
    });

    return {
      disposables: transparent + nonTransparent,
      transparent,
      nonTransparent,
      pods: 0,
      liquids: 0,
    };
  }, [products]);

  // Filter & Sort Logic
  const filteredProducts = useMemo(() => {
    return products
      .filter((p) => {
        // Category
        if (filters.category !== 'all' && p.category !== filters.category) {
          return false;
        }

        // Brand
        if (filters.brand !== 'all' && p.brand !== filters.brand) {
          return false;
        }

        // In-Stock Only filter
        if (filters.inStockOnly) {
          const hasInStock = p.flavors.some((f) => f.status !== 'out_of_stock' && f.stockCount > 0);
          if (!hasInStock) return false;
        }

        // Puff Range
        if (filters.puffRange !== 'all') {
          if (!p.puffCount) return false;
          if (filters.puffRange === 'under10k' && p.puffCount > 10000) return false;
          if (filters.puffRange === '10k-20k' && (p.puffCount < 10000 || p.puffCount > 20000)) return false;
          if (filters.puffRange === '20k+' && p.puffCount < 20000) return false;
        }

        // Cooling Filter
        if (filters.coolingFilter !== 'all') {
          if (filters.coolingFilter === 'high-ice') {
            const hasHighIce = p.flavors.some((f) => f.coolingLevel >= 4);
            if (!hasHighIce) return false;
          } else if (filters.coolingFilter === 'low-ice') {
            const hasLowIce = p.flavors.some((f) => f.coolingLevel <= 3);
            if (!hasLowIce) return false;
          }
        }

        // Search Query (matches product name, brand, description, or flavor name)
        if (filters.searchQuery.trim()) {
          const q = filters.searchQuery.toLowerCase();
          const matchesTitle = p.name.toLowerCase().includes(q);
          const matchesBrand = p.brand.toLowerCase().includes(q);
          const matchesFlavor = p.flavors.some((f) => f.name.toLowerCase().includes(q));
          if (!matchesTitle && !matchesBrand && !matchesFlavor) {
            return false;
          }
        }

        return true;
      })
      .sort((a, b) => {
        if (filters.sortBy === 'stock-high') {
          const stockA = a.flavors.reduce((acc, f) => acc + f.stockCount, 0);
          const stockB = b.flavors.reduce((acc, f) => acc + f.stockCount, 0);
          return stockB - stockA;
        }
        if (filters.sortBy === 'price-asc') {
          return a.price - b.price;
        }
        if (filters.sortBy === 'price-desc') {
          return b.price - a.price;
        }
        if (filters.sortBy === 'puff-desc') {
          return (b.puffCount || 0) - (a.puffCount || 0);
        }
        // Default: featured first, then new arrival
        if (a.isFeatured && !b.isFeatured) return -1;
        if (!a.isFeatured && b.isFeatured) return 1;
        return 0;
      });
  }, [products, filters]);

  // Compute Active Filters Count
  const activeFilterCount = useMemo(() => {
    let count = 0;
    if (filters.category !== 'all') count++;
    if (filters.brand !== 'all') count++;
    if (filters.puffRange !== 'all') count++;
    if (filters.coolingFilter !== 'all') count++;
    if (filters.inStockOnly) count++;
    if (filters.searchQuery.trim()) count++;
    return count;
  }, [filters]);

  const handleOpenQuickView = (product: VapeProduct, defaultFlavor?: FlavorVariant) => {
    setSelectedProduct(product);
    setActiveModalFlavor(defaultFlavor);
    setIsModalOpen(true);
  };

  const handleInstantReserve = (product: VapeProduct, flavor: FlavorVariant) => {
    const message = generateReservationMessage({
      product,
      flavors: [flavor],
      customQty: 1,
    });
    openMessengerReservation(message);
    setToastData({
      productName: product.name,
      brand: product.brand,
      flavorName: flavor.name,
      price: product.price,
      message,
    });
  };


  const featuredProduct = products.find((p) => p.isFeatured) || products[0];

  // In-stock popular flavors for recommendations in Empty State
  const recommendedFlavors = useMemo(() => {
    const list: { flavor: FlavorVariant; product: VapeProduct }[] = [];
    products.forEach((p) => {
      p.flavors.forEach((f) => {
        if (f.status === 'in_stock' && list.length < 6) {
          list.push({ flavor: f, product: p });
        }
      });
    });
    return list;
  }, [products]);

  if (!mounted) return null;

  return (
    <div className="min-h-screen flex flex-col bg-slate-50/50 dark:bg-canvas-dark text-slate-900 dark:text-slate-100 transition-colors duration-250">

      {/* 21+ Age Gate Modal */}
      <AgeVerificationModal />

      {/* Sticky Header */}
      <Navbar
        searchQuery={filters.searchQuery}
        onSearchChange={(q) => setFilters((prev) => ({ ...prev, searchQuery: q }))}
        inStockOnly={filters.inStockOnly}
        onToggleInStockOnly={(val) => setFilters((prev) => ({ ...prev, inStockOnly: val }))}
        totalFlavorsInStock={totalFlavorsInStock}
      />

      {/* Hero Spotlight Drop (Show if not deeply searching) */}
      {!filters.searchQuery && filters.category === 'all' && featuredProduct && (
        <HeroSpotlight
          featuredProduct={featuredProduct}
          onSelectProduct={(p) => handleOpenQuickView(p)}
          disposablesCount={categoryCounts.disposables}
          totalFlavorsCount={totalFlavorsInStock}
          lastUpdatedText="Live Today"
        />
      )}

      {/* Filter Bar */}
      <FilterBar
        filters={filters}
        onFilterChange={(newFilters) => setFilters(newFilters)}
        availableBrands={availableBrands}
        activeFilterCount={activeFilterCount}
      />

      {/* Product Catalog Grid */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-3 sm:px-6 lg:px-8 py-5 sm:py-8">

        {/* Results Heading */}
        <div className="flex items-baseline justify-between mb-4 sm:mb-6">
          <div>
            <h2 className="text-lg sm:text-2xl font-bold text-white tracking-tight font-space">
              {filters.category === 'all'
                ? 'All Disposable Showcase'
                : filters.category === 'transparent_disposable'
                ? 'Transparent Tank Disposables'
                : 'Non-Transparent Disposables'}
            </h2>
            <p className="text-[11px] sm:text-xs text-zinc-400 mt-0.5">
              Showing {filteredProducts.length} devices available • Real-time flavor stock
            </p>
          </div>

          {activeFilterCount > 0 && (
            <span className="text-xs font-mono-spec text-teal-400 hidden sm:inline">
              Filtered by {activeFilterCount} active criteria
            </span>
          )}
        </div>

        {/* Product Cards Grid */}
        {filteredProducts.length > 0 ? (
          <div className="grid grid-cols-1 lg:grid-cols-2 max-w-5xl mx-auto gap-4 sm:gap-8">
            {filteredProducts.map((product) => (
              <ProductCard
                key={product.id}
                product={product}
                onQuickView={handleOpenQuickView}
                onInstantReserve={handleInstantReserve}
              />
            ))}
          </div>
        ) : (
          /* Step 7 Rich Empty State */
          <div className="py-16 px-4 rounded-3xl border border-slate-200 dark:border-white/10 bg-white/70 dark:bg-zinc-900/40 backdrop-blur-md text-center max-w-2xl mx-auto shadow-xl dark:shadow-2xl transition-colors">
            <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-slate-100 dark:bg-zinc-800/80 border border-slate-200 dark:border-white/10 flex items-center justify-center text-teal-600 dark:text-teal-400">
              <PackageOpen className="w-8 h-8" />
            </div>

            <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-2 font-space">
              {filters.category === 'non_transparent_disposable'
                ? 'No Non-Transparent Disposables in Stock'
                : 'No exact matches found for your filter'}
            </h3>
            <p className="text-sm text-slate-600 dark:text-zinc-400 mb-6 max-w-md mx-auto">
              {filters.category === 'non_transparent_disposable'
                ? 'All current live stock consists of Transparent Tank Disposables (Black Elite 50K with 10 flavors ready). Clear filters to view all in-stock flavors.'
                : `We couldn't find any items matching "${filters.searchQuery || filters.category}". Try clearing your active filters or explore these popular in-stock flavor profiles ready for pickup:`}
            </p>

            <button
              onClick={() =>
                setFilters({
                  searchQuery: '',
                  category: 'all',
                  brand: 'all',
                  puffRange: 'all',
                  coolingFilter: 'all',
                  sortBy: 'featured',
                  inStockOnly: false,
                })
              }
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold text-black bg-teal-400 hover:bg-teal-300 transition-all cursor-pointer shadow-lg shadow-teal-500/20 mb-8"
            >
              <RotateCcw className="w-4 h-4" />
              <span>Clear All Filters</span>
            </button>

            {/* In-Stock Suggestions */}
            <div className="pt-6 border-t border-slate-200 dark:border-white/10 text-left">
              <div className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-zinc-400 mb-3 font-mono-spec flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-teal-600 dark:text-teal-400" />
                Popular In-Stock Alternatives:
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                {recommendedFlavors.map(({ flavor, product }) => (
                  <button
                    key={`${product.id}-${flavor.id}`}
                    onClick={() => handleOpenQuickView(product, flavor)}
                    className="p-2.5 rounded-xl bg-slate-50 hover:bg-slate-100 dark:bg-zinc-950/80 border border-slate-200 dark:border-white/5 hover:border-teal-500/30 text-left transition-all cursor-pointer group"
                  >
                    <div className="flex items-center gap-2 mb-1">
                      <span
                        className="w-2.5 h-2.5 rounded-full flex-shrink-0"
                        style={{ backgroundColor: flavor.colorHex }}
                      />
                      <span className="text-xs font-semibold text-slate-800 dark:text-white truncate group-hover:text-teal-600 dark:group-hover:text-teal-300">
                        {flavor.name}
                      </span>
                    </div>
                    <div className="text-[10px] text-slate-500 dark:text-zinc-500 truncate font-mono-spec">
                      {product.brand} • ₱{product.price}
                    </div>
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

      </main>


      {/* Footer */}
      <footer className="mt-auto border-t border-slate-200 dark:border-white/10 bg-slate-100/90 dark:bg-zinc-950/80 py-6 sm:py-8 px-4 sm:px-6 lg:px-8 text-xs text-slate-500 dark:text-zinc-500 transition-colors">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <Flame className="w-4 h-4 text-teal-600 dark:text-teal-400" />
            <span className="font-bold text-slate-800 dark:text-zinc-300 font-space">RASH VAPE SHOWCASE</span>
          </div>

          <div className="flex items-center gap-4">
            <button
              onClick={() => setIsAdminOpen(true)}
              className="text-slate-600 dark:text-zinc-400 hover:text-teal-600 dark:hover:text-teal-300 transition-colors cursor-pointer flex items-center gap-1.5"
            >
              <Zap className="w-3.5 h-3.5 text-purple-600 dark:text-purple-400" />
              <span>Staff Stock Manager</span>
            </button>
            <span>•</span>
            <span className="text-rose-600 dark:text-rose-400/90 font-mono-spec font-medium">Strictly 21+ Only</span>
          </div>
        </div>
      </footer>

      {/* Product Detail Modal */}
      <ProductDetailModal
        product={selectedProduct}
        initialFlavor={activeModalFlavor}
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
      />

      {/* Admin Stock Manager Drawer */}
      <AdminStockDrawer
        isOpen={isAdminOpen}
        onClose={() => setIsAdminOpen(false)}
        products={products}
      />

      {/* Automated Messenger Status Toast */}
      <MessengerToast
        toast={toastData}
        onClose={() => setToastData(null)}
      />

    </div>
  );
}
