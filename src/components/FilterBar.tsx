'use client';

import React from 'react';
import { FilterState, ProductCategory } from '@/types/vape';
import { RotateCcw, SlidersHorizontal, ChevronDown } from 'lucide-react';

interface FilterBarProps {
  filters: FilterState;
  onFilterChange: (newFilters: FilterState) => void;
  availableBrands: string[];
  activeFilterCount: number;
}

const CATEGORIES: { id: ProductCategory | 'all'; label: string }[] = [
  { id: 'all', label: 'All Disposables' },
  { id: 'transparent_disposable', label: 'Transparent Disposables' },
  { id: 'non_transparent_disposable', label: 'Non-Transparent Disposables' },
];

export const FilterBar: React.FC<FilterBarProps> = ({
  filters,
  onFilterChange,
  availableBrands,
  activeFilterCount,
}) => {
  const handleCategorySelect = (cat: ProductCategory | 'all') => {
    onFilterChange({ ...filters, category: cat });
  };

  const handleReset = () => {
    onFilterChange({
      searchQuery: '',
      category: 'all',
      brand: 'all',
      puffRange: 'all',
      coolingFilter: 'all',
      sortBy: 'featured',
      inStockOnly: false,
    });
  };

  return (
    <div className="sticky top-16 sm:top-20 z-30 bg-white/90 dark:bg-canvas-dark/90 backdrop-blur-md border-b border-slate-200/80 dark:border-white/10 py-2.5 sm:py-3.5 transition-colors">
      <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 space-y-2.5 sm:space-y-3">
        
        {/* Top: Category Horizontal Pills */}
        <div className="flex items-center justify-between gap-2.5 sm:gap-3 overflow-x-auto no-scrollbar touch-pan-x pb-0.5">
          <div className="flex items-center gap-1.5 sm:gap-2 flex-shrink-0">
            {CATEGORIES.map((cat) => {
              const isActive = filters.category === cat.id;
              return (
                <button
                  key={cat.id}
                  id={`filter-category-${cat.id}`}
                  onClick={() => handleCategorySelect(cat.id)}
                  className={`px-3.5 py-1.5 rounded-xl text-xs sm:text-sm font-semibold transition-all whitespace-nowrap cursor-pointer ${
                    isActive
                      ? 'bg-teal-500 text-black shadow-lg shadow-teal-500/25 scale-[1.02]'
                      : 'bg-slate-100 hover:bg-slate-200/80 text-slate-700 hover:text-slate-900 border border-slate-200 dark:bg-zinc-900/80 dark:hover:bg-zinc-800 dark:text-zinc-300 dark:hover:text-white dark:border-white/5'
                  }`}
                >
                  {cat.label}
                </button>
              );
            })}
          </div>

          {/* Reset Filters CTA if any filter is active */}
          {activeFilterCount > 0 && (
            <button
              id="reset-all-filters-btn"
              onClick={handleReset}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold text-rose-600 hover:text-rose-700 dark:text-rose-400 dark:hover:text-rose-300 bg-rose-50 dark:bg-rose-500/10 hover:bg-rose-100 dark:hover:bg-rose-500/20 border border-rose-200 dark:border-rose-500/30 transition-all flex-shrink-0 cursor-pointer"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Clear ({activeFilterCount})</span>
            </button>
          )}
        </div>

        {/* Secondary Detailed Filter Row */}
        <div className="flex items-center justify-between gap-2.5 overflow-x-auto no-scrollbar pt-1 text-xs text-slate-600 dark:text-zinc-300">
          
          <div className="flex items-center gap-2 flex-shrink-0">
            <span className="hidden md:flex items-center gap-1 text-slate-400 dark:text-zinc-500 font-mono-spec">
              <SlidersHorizontal className="w-3.5 h-3.5" />
              <span>REFINE:</span>
            </span>

            {/* Brand Dropdown */}
            <div className="relative">
              <select
                id="filter-brand-select"
                aria-label="Filter by Brand"
                value={filters.brand}
                onChange={(e) => onFilterChange({ ...filters, brand: e.target.value })}
                className="appearance-none bg-slate-100 dark:bg-zinc-900/90 hover:bg-slate-200/70 dark:hover:bg-zinc-800 text-slate-800 dark:text-zinc-200 border border-slate-200 dark:border-white/10 rounded-xl px-3 py-1.5 pr-8 focus:border-teal-500 dark:focus:border-teal-400 focus:outline-none cursor-pointer"
              >
                <option value="all" className="bg-white dark:bg-zinc-900 text-slate-900 dark:text-white">All Brands</option>
                {availableBrands.map((b) => (
                  <option key={b} value={b} className="bg-white dark:bg-zinc-900 text-slate-900 dark:text-white">{b}</option>
                ))}
              </select>
              <ChevronDown className="w-3.5 h-3.5 text-slate-500 dark:text-zinc-400 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            </div>

            {/* Puff Count Filter */}
            <div className="relative">
              <select
                id="filter-puff-select"
                aria-label="Filter by Puff Count"
                value={filters.puffRange}
                onChange={(e) => onFilterChange({ ...filters, puffRange: e.target.value })}
                className="appearance-none bg-slate-100 dark:bg-zinc-900/90 hover:bg-slate-200/70 dark:hover:bg-zinc-800 text-slate-800 dark:text-zinc-200 border border-slate-200 dark:border-white/10 rounded-xl px-3 py-1.5 pr-8 focus:border-teal-500 dark:focus:border-teal-400 focus:outline-none cursor-pointer"
              >
                <option value="all" className="bg-white dark:bg-zinc-900 text-slate-900 dark:text-white">Any Puff Capacity</option>
                <option value="under10k" className="bg-white dark:bg-zinc-900 text-slate-900 dark:text-white">Up to 10,000 Puffs</option>
                <option value="10k-20k" className="bg-white dark:bg-zinc-900 text-slate-900 dark:text-white">10,000 – 20,000 Puffs</option>
                <option value="20k+" className="bg-white dark:bg-zinc-900 text-slate-900 dark:text-white">20,000+ Max Puff</option>
              </select>
              <ChevronDown className="w-3.5 h-3.5 text-slate-500 dark:text-zinc-400 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            </div>

            {/* Menthol / Ice Filter */}
            <div className="relative">
              <select
                id="filter-cooling-select"
                aria-label="Filter by Menthol and Ice Level"
                value={filters.coolingFilter}
                onChange={(e) => onFilterChange({ ...filters, coolingFilter: e.target.value })}
                className="appearance-none bg-slate-100 dark:bg-zinc-900/90 hover:bg-slate-200/70 dark:hover:bg-zinc-800 text-slate-800 dark:text-zinc-200 border border-slate-200 dark:border-white/10 rounded-xl px-3 py-1.5 pr-8 focus:border-teal-500 dark:focus:border-teal-400 focus:outline-none cursor-pointer"
              >
                <option value="all" className="bg-white dark:bg-zinc-900 text-slate-900 dark:text-white">All Ice Levels</option>
                <option value="high-ice" className="bg-white dark:bg-zinc-900 text-slate-900 dark:text-white">High Ice / Menthol ❄️ (Level 4-5)</option>
                <option value="low-ice" className="bg-white dark:bg-zinc-900 text-slate-900 dark:text-white">Low / Smooth Ice (Level 1-3)</option>
              </select>
              <ChevronDown className="w-3.5 h-3.5 text-slate-500 dark:text-zinc-400 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            </div>
          </div>

          {/* Sort By Dropdown */}
          <div className="flex items-center gap-2 flex-shrink-0 ml-auto">
            <span className="hidden sm:inline text-slate-400 dark:text-zinc-500 font-mono-spec">SORT:</span>
            <div className="relative">
              <select
                id="filter-sort-select"
                aria-label="Sort inventory products"
                value={filters.sortBy}
                onChange={(e) => onFilterChange({ ...filters, sortBy: e.target.value })}
                className="appearance-none bg-slate-100 dark:bg-zinc-900/90 hover:bg-slate-200/70 dark:hover:bg-zinc-800 text-teal-700 dark:text-teal-300 font-medium border border-teal-500/30 rounded-xl px-3 py-1.5 pr-8 focus:border-teal-500 dark:focus:border-teal-400 focus:outline-none cursor-pointer"
              >
                <option value="featured" className="bg-white dark:bg-zinc-900 text-slate-900 dark:text-white">Featured / Newest</option>
                <option value="stock-high" className="bg-white dark:bg-zinc-900 text-slate-900 dark:text-white">Most Stock Available</option>
                <option value="price-asc" className="bg-white dark:bg-zinc-900 text-slate-900 dark:text-white">Price: Low to High</option>
                <option value="price-desc" className="bg-white dark:bg-zinc-900 text-slate-900 dark:text-white">Price: High to Low</option>
                <option value="puff-desc" className="bg-white dark:bg-zinc-900 text-slate-900 dark:text-white">Highest Puff Count</option>
              </select>
              <ChevronDown className="w-3.5 h-3.5 text-teal-600 dark:text-teal-400 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            </div>
          </div>

        </div>

      </div>
    </div>
  );
};
