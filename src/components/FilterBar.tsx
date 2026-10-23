'use client';

import React from 'react';
import { FilterState, ProductCategory } from '@/types/vape';
import { RotateCcw, ChevronDown } from 'lucide-react';

interface FilterBarProps {
  filters: FilterState;
  onFilterChange: (newFilters: FilterState) => void;
  availableBrands: string[];
  activeFilterCount: number;
}

const CATEGORIES: { id: ProductCategory | 'all'; label: string }[] = [
  { id: 'all', label: 'All Items' },
  { id: 'transparent_disposable', label: 'Transparent Tank' },
  { id: 'non_transparent_disposable', label: 'Solid Disposable' },
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
    <div className="sticky top-16 sm:top-18 z-30 bg-white/80 dark:bg-[#090a0f]/80 backdrop-blur-xl border-b border-neutral-200/80 dark:border-white/[0.08] py-3 transition-colors">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center justify-between gap-3 overflow-x-auto no-scrollbar">
        
        {/* Category Filter Pills */}
        <div className="flex items-center gap-1.5 flex-shrink-0">
          {CATEGORIES.map((cat) => {
            const isActive = filters.category === cat.id;
            return (
              <button
                key={cat.id}
                id={`filter-category-${cat.id}`}
                onClick={() => handleCategorySelect(cat.id)}
                className={`px-3.5 py-1.5 rounded-full text-xs font-medium transition-all whitespace-nowrap cursor-pointer ${
                  isActive
                    ? 'bg-neutral-900 text-white dark:bg-white dark:text-neutral-900 shadow-sm'
                    : 'bg-neutral-100/80 hover:bg-neutral-200/70 text-neutral-600 hover:text-neutral-900 dark:bg-white/[0.05] dark:hover:bg-white/[0.09] dark:text-neutral-400 dark:hover:text-white'
                }`}
              >
                {cat.label}
              </button>
            );
          })}
        </div>

        {/* Right: Clean Sort Dropdown & Reset */}
        <div className="flex items-center gap-2 flex-shrink-0 ml-auto">
          {activeFilterCount > 0 && (
            <button
              id="reset-all-filters-btn"
              onClick={handleReset}
              className="flex items-center gap-1 px-2.5 py-1.5 rounded-full text-xs text-neutral-500 hover:text-neutral-900 dark:text-neutral-400 dark:hover:text-white transition-colors cursor-pointer"
              title="Reset filters"
            >
              <RotateCcw className="w-3 h-3" />
              <span>Reset</span>
            </button>
          )}

          <div className="relative flex items-center">
            <select
              id="filter-sort-select"
              aria-label="Sort inventory products"
              value={filters.sortBy}
              onChange={(e) => onFilterChange({ ...filters, sortBy: e.target.value as any })}
              className="appearance-none bg-neutral-100/80 hover:bg-neutral-200/70 dark:bg-white/[0.05] dark:hover:bg-white/[0.09] text-neutral-800 dark:text-neutral-200 text-xs font-medium rounded-full pl-3 pr-7 py-1.5 border-none focus:outline-none cursor-pointer"
            >
              <option value="featured" className="bg-white dark:bg-neutral-900">Featured</option>
              <option value="stock-high" className="bg-white dark:bg-neutral-900">Most Stock</option>
              <option value="price-asc" className="bg-white dark:bg-neutral-900">Price: Low to High</option>
              <option value="price-desc" className="bg-white dark:bg-neutral-900">Price: High to Low</option>
            </select>
            <ChevronDown className="w-3 h-3 text-neutral-500 dark:text-neutral-400 absolute right-2.5 pointer-events-none" />
          </div>
        </div>

      </div>
    </div>
  );
};
