'use client';

import React, { useEffect, useRef } from 'react';
import { Search, Sun, Moon } from 'lucide-react';
import { useTheme } from '@/context/ThemeContext';

interface NavbarProps {
  searchQuery: string;
  onSearchChange: (q: string) => void;
  inStockOnly: boolean;
  onToggleInStockOnly: (val: boolean) => void;
  totalFlavorsInStock: number;
}

export const Navbar: React.FC<NavbarProps> = ({
  searchQuery,
  onSearchChange,
  inStockOnly,
  onToggleInStockOnly,
  totalFlavorsInStock,
}) => {
  const searchInputRef = useRef<HTMLInputElement>(null);
  const { theme, toggleTheme } = useTheme();

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        searchInputRef.current?.focus();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  return (
    <header className="sticky top-0 z-40 backdrop-blur-xl bg-white/80 dark:bg-[#090a0f]/80 border-b border-neutral-200/80 dark:border-white/[0.08] transition-colors">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 h-16 sm:h-18 flex items-center justify-between gap-3 sm:gap-6">
        
        {/* Brand & Live Status */}
        <div className="flex items-center gap-3 sm:gap-5 flex-shrink-0">
          <div className="flex items-center gap-2">
            <span className="text-base sm:text-lg font-bold tracking-tight text-neutral-900 dark:text-white font-space">
              RASH<span className="text-neutral-400 dark:text-neutral-500 font-light mx-1.5">/</span>VAPE
            </span>
          </div>

          <div className="hidden sm:flex items-center gap-2 px-2.5 py-1 rounded-full bg-emerald-500/[0.08] border border-emerald-500/20 text-emerald-700 dark:text-emerald-400 text-[11px] font-medium tracking-wide">
            <span className="relative flex h-1.5 w-1.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-emerald-500"></span>
            </span>
            <span>{totalFlavorsInStock} Flavors Ready</span>
          </div>
        </div>

        {/* Minimal Search Input */}
        <div className="flex-1 max-w-md min-w-0 mx-1 sm:mx-2 relative">
          <div className="relative flex items-center">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400 dark:text-neutral-500 pointer-events-none" />
            <input
              ref={searchInputRef}
              id="search-inventory-input"
              type="text"
              value={searchQuery}
              onChange={(e) => onSearchChange(e.target.value)}
              placeholder="Search by device or flavor..."
              className="w-full pl-9.5 pr-11 py-2 text-xs sm:text-sm bg-neutral-100/80 hover:bg-neutral-100 dark:bg-white/[0.05] dark:hover:bg-white/[0.08] focus:bg-white dark:focus:bg-neutral-900 text-neutral-900 dark:text-white placeholder-neutral-400 dark:placeholder-neutral-500 rounded-full border border-transparent focus:border-neutral-300 dark:focus:border-white/20 outline-none transition-all"
            />
            <div className="absolute right-3.5 top-1/2 -translate-y-1/2 hidden sm:flex items-center pointer-events-none">
              <kbd className="px-1.5 py-0.5 text-[10px] font-mono-spec text-neutral-400 dark:text-neutral-500 bg-neutral-200/60 dark:bg-neutral-800 rounded">
                ⌘K
              </kbd>
            </div>
          </div>
        </div>

        {/* Controls: In-Stock Toggle & Theme */}
        <div className="flex items-center gap-2 flex-shrink-0">
          <button
            id="toggle-in-stock-filter"
            onClick={() => onToggleInStockOnly(!inStockOnly)}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium transition-all cursor-pointer ${
              inStockOnly
                ? 'bg-neutral-900 text-white dark:bg-white dark:text-neutral-900'
                : 'bg-neutral-100 dark:bg-white/[0.06] text-neutral-600 dark:text-neutral-300 hover:text-neutral-900 dark:hover:text-white'
            }`}
            title="Show only items available right now"
          >
            <span className={`w-1.5 h-1.5 rounded-full ${inStockOnly ? 'bg-emerald-400 dark:bg-emerald-500' : 'bg-neutral-400'}`} />
            <span className="hidden sm:inline">In Stock Only</span>
            <span className="sm:hidden">Stock</span>
          </button>

          <button
            id="theme-toggle-btn"
            type="button"
            onClick={toggleTheme}
            aria-label={`Switch to ${theme === 'dark' ? 'Light' : 'Dark'} mode`}
            className="p-2 rounded-full text-neutral-600 dark:text-neutral-300 hover:text-neutral-900 dark:hover:text-white hover:bg-neutral-100 dark:hover:bg-white/[0.06] transition-colors cursor-pointer"
          >
            {theme === 'dark' ? (
              <Sun className="w-4 h-4 text-amber-400" />
            ) : (
              <Moon className="w-4 h-4 text-neutral-700" />
            )}
          </button>
        </div>

      </div>
    </header>
  );
};
