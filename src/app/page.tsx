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
import { PackageOpen, RotateCcw, Sparkles, ShieldCheck } from 'lucide-react';

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

    const unsubscribeRealtime = subscribeToInventoryRealtime((newProducts) => {
      setProducts(newProducts);
    });

    return () => {
      window.removeEventListener(INVENTORY_EVENT, handleUpdate);
      unsubscribeRealtime();
    };
  }, []);

  const availableBrands = useMemo(() => {
    const brandsSet = new Set<string>();
    products.forEach((p) => brandsSet.add(p.brand));
    return Array.from(brandsSet);
  }, [products]);

  const totalFlavorsInStock = useMemo(() => {
    return products.reduce((acc, p) => {
      const flavors = Array.isArray(p?.flavors) ? p.flavors : [];
      return acc + flavors.filter((f) => f.status !== 'out_of_stock' && f.stockCount > 0).length;
    }, 0);
  }, [products]);

  const categoryCounts = useMemo(() => {
    let transparent = 0;
    let nonTransparent = 0;

    products.forEach((p) => {
      const flavors = Array.isArray(p?.flavors) ? p.flavors : [];
      const piecesSum = flavors.reduce((sum, f) => {
        return f.status !== 'out_of_stock' ? sum + (f.stockCount || 0) : sum;
      }, 0);

      if (p.category === 'transparent_disposable') transparent += piecesSum;
      if (p.category === 'non_transparent_disposable') nonTransparent += piecesSum;
    });

    return {
      disposables: transparent + nonTransparent,
      transparent,
      nonTransparent,
    };
  }, [products]);

  // Filter & Sort Logic
  const filteredProducts = useMemo(() => {
    return products
      .filter((p) => {
        if (!p || !p.id) return false;
        const flavors = Array.isArray(p.flavors) ? p.flavors : [];

        if (filters.category !== 'all' && p.category !== filters.category) {
          return false;
        }

        if (filters.brand !== 'all' && p.brand !== filters.brand) {
          return false;
        }

        if (filters.inStockOnly) {
          const hasInStock = flavors.some((f) => f.status !== 'out_of_stock' && f.stockCount > 0);
          if (!hasInStock) return false;
        }

        if (filters.searchQuery.trim()) {
          const q = filters.searchQuery.toLowerCase();
          const matchesTitle = p.name.toLowerCase().includes(q);
          const matchesBrand = p.brand.toLowerCase().includes(q);
          const matchesFlavor = flavors.some((f) => f.name.toLowerCase().includes(q));
          if (!matchesTitle && !matchesBrand && !matchesFlavor) {
            return false;
          }
        }

        return true;
      })
      .sort((a, b) => {
        const flavorsA = Array.isArray(a.flavors) ? a.flavors : [];
        const flavorsB = Array.isArray(b.flavors) ? b.flavors : [];

        if (filters.sortBy === 'stock-high') {
          const stockA = flavorsA.reduce((acc, f) => acc + (f.stockCount || 0), 0);
          const stockB = flavorsB.reduce((acc, f) => acc + (f.stockCount || 0), 0);
          return stockB - stockA;
        }
        if (filters.sortBy === 'price-asc') {
          return a.price - b.price;
        }
        if (filters.sortBy === 'price-desc') {
          return b.price - a.price;
        }
        if (a.isFeatured && !b.isFeatured) return -1;
        if (!a.isFeatured && b.isFeatured) return 1;
        return 0;
      });
  }, [products, filters]);

  const activeFilterCount = useMemo(() => {
    let count = 0;
    if (filters.category !== 'all') count++;
    if (filters.brand !== 'all') count++;
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

  if (!mounted) return null;

  return (
    <div className="min-h-screen flex flex-col bg-[#fafafa] dark:bg-[#090a0f] text-neutral-900 dark:text-neutral-100 transition-colors duration-200">

      {/* 21+ Age Gate Modal */}
      <AgeVerificationModal />

      {/* Sleek Minimalist Navbar */}
      <Navbar
        searchQuery={filters.searchQuery}
        onSearchChange={(q) => setFilters((prev) => ({ ...prev, searchQuery: q }))}
        inStockOnly={filters.inStockOnly}
        onToggleInStockOnly={(val) => setFilters((prev) => ({ ...prev, inStockOnly: val }))}
        totalFlavorsInStock={totalFlavorsInStock}
      />

      {/* Compact Editorial Spotlight Banner (Only when no search query and category is 'all') */}
      {!filters.searchQuery && filters.category === 'all' && featuredProduct && (
        <HeroSpotlight
          featuredProduct={featuredProduct}
          onSelectProduct={(p) => handleOpenQuickView(p)}
          disposablesCount={categoryCounts.disposables}
          totalFlavorsCount={totalFlavorsInStock}
          lastUpdatedText="Live Today"
        />
      )}

      {/* Streamlined Filter Bar */}
      <FilterBar
        filters={filters}
        onFilterChange={(newFilters) => setFilters(newFilters)}
        availableBrands={availableBrands}
        activeFilterCount={activeFilterCount}
      />

      {/* Product Catalog Grid */}
      <main className="flex-1 max-w-6xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-10">

        {/* Section Heading */}
        <div className="flex items-baseline justify-between mb-5 sm:mb-6">
          <div>
            <h2 className="text-lg sm:text-xl font-bold text-neutral-900 dark:text-white tracking-tight font-space">
              {filters.category === 'all'
                ? 'Available Inventory'
                : filters.category === 'transparent_disposable'
                ? 'Transparent Tank Collection'
                : 'Solid Disposables'}
            </h2>
            <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-0.5">
              {filteredProducts.length} devices • Live flavor availability
            </p>
          </div>

          {activeFilterCount > 0 && (
            <span className="text-xs font-mono-spec text-neutral-500 dark:text-neutral-400">
              Filtered ({activeFilterCount})
            </span>
          )}
        </div>

        {/* Product Grid */}
        {filteredProducts.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5 sm:gap-6">
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
          /* Clean Minimal Empty State */
          <div className="py-16 px-4 rounded-2xl border border-neutral-200/80 dark:border-white/[0.08] bg-white dark:bg-[#12141c] text-center max-w-xl mx-auto shadow-xs">
            <div className="w-12 h-12 mx-auto mb-3 rounded-full bg-neutral-100 dark:bg-neutral-800 flex items-center justify-center text-neutral-500 dark:text-neutral-400">
              <PackageOpen className="w-6 h-6" />
            </div>

            <h3 className="text-base font-bold text-neutral-900 dark:text-white mb-1 font-space">
              No matching items found
            </h3>
            <p className="text-xs text-neutral-500 dark:text-neutral-400 mb-5 max-w-sm mx-auto">
              {filters.category === 'non_transparent_disposable'
                ? 'All current in-stock devices are Transparent Tank models (Black Elite 50K).'
                : 'No products matched your active filters. Clear your filters to view all in-stock items.'}
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
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-semibold bg-neutral-900 text-white dark:bg-white dark:text-neutral-900 hover:opacity-90 transition-all cursor-pointer shadow-xs"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Show All Items</span>
            </button>
          </div>
        )}

      </main>

      {/* Discreet Minimalist Footer */}
      <footer className="mt-auto border-t border-neutral-200/80 dark:border-white/[0.08] bg-white dark:bg-[#090a0f] py-6 px-4 sm:px-6 lg:px-8 text-xs text-neutral-500 dark:text-neutral-500 transition-colors">
        <div className="max-w-6xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-3 text-center sm:text-left">
          <div className="flex items-center gap-2">
            <span className="font-bold text-neutral-900 dark:text-neutral-200 font-space tracking-tight">
              RASH VAPE
            </span>
            <span>•</span>
            <span>Live Stock Showcase</span>
          </div>

          <div className="flex items-center gap-4">
            <button
              onClick={() => setIsAdminOpen(true)}
              className="text-neutral-500 hover:text-neutral-900 dark:text-neutral-400 dark:hover:text-white transition-colors cursor-pointer"
            >
              Staff Stock Manager
            </button>
            <span>•</span>
            <span className="text-neutral-400 dark:text-neutral-600">Strictly 21+ Only</span>
          </div>
        </div>
      </footer>

      {/* Modals & Drawers */}
      <ProductDetailModal
        product={selectedProduct}
        initialFlavor={activeModalFlavor}
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
      />

      <AdminStockDrawer
        isOpen={isAdminOpen}
        onClose={() => setIsAdminOpen(false)}
        products={products}
      />

      <MessengerToast
        toast={toastData}
        onClose={() => setToastData(null)}
      />

    </div>
  );
}
