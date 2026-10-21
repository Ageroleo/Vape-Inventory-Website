'use client';

import React, { useEffect, useRef } from 'react';
import { Search, Flame, Sun, Moon } from 'lucide-react';
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

  // Cmd+K / Ctrl+K keyboard shortcut listener
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
    <header className="sticky top-0 z-40 backdrop-blur-md bg-white/85 dark:bg-canvas-dark/90 border-b border-slate-200/80 dark:border-white/10 transition-colors">
      <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 h-16 sm:h-20 flex items-center justify-between gap-2.5 sm:gap-4">
        
        {/* Brand & Live Status */}
        <div className="flex items-center gap-2 sm:gap-4 flex-shrink-0">
          <div className="flex items-center gap-2 sm:gap-2.5">
            <div className="h-9 w-9 sm:h-10 sm:w-10 rounded-xl bg-gradient-to-br from-teal-500/20 to-purple-500/20 border border-teal-500/30 flex items-center justify-center text-teal-600 dark:text-teal-300 shadow-[0_0_15px_rgba(0,245,212,0.25)] flex-shrink-0">
              <Flame className="w-4 h-4 sm:w-5 sm:h-5 text-teal-500 dark:text-teal-400" />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="text-base sm:text-xl font-extrabold tracking-tight text-slate-900 dark:text-white font-space whitespace-nowrap">
                  RASH <span className="text-teal-500 dark:text-teal-400">VAPE</span>
                </span>
                <span className="text-[9px] sm:text-[10px] font-mono-spec px-1.5 py-0.5 rounded bg-slate-100 dark:bg-zinc-800 text-slate-600 dark:text-zinc-400 border border-slate-200 dark:border-white/10 hidden xs:inline-block">
                  EST. 2024
                </span>
              </div>
              <p className="text-[10px] sm:text-[11px] text-slate-500 dark:text-zinc-400 hidden md:block">Real-Time In-Stock Showcase</p>
            </div>
          </div>

          {/* Live Inventory Counter Badge */}
          <div className="hidden lg:flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-500/30 text-emerald-700 dark:text-emerald-400 text-xs font-mono-spec">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
            </span>
            <span>LIVE: <strong className="text-emerald-800 dark:text-emerald-300">{totalFlavorsInStock}</strong> FLAVORS READY</span>
          </div>
        </div>

        {/* Search Bar with Cmd+K */}
        <div className="flex-1 max-w-lg min-w-0 mx-1 sm:mx-2 relative">
          <div className="relative flex items-center">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 sm:w-4 sm:h-4 text-slate-400 dark:text-zinc-400 pointer-events-none" />
            <input
              ref={searchInputRef}
              id="search-inventory-input"
              type="text"
              value={searchQuery}
              onChange={(e) => onSearchChange(e.target.value)}
              placeholder="Search flavor or device..."
              className="w-full pl-8 sm:pl-10 pr-3 sm:pr-14 py-2 sm:py-2.5 text-xs sm:text-sm bg-slate-100 dark:bg-zinc-900/80 hover:bg-slate-200/60 dark:hover:bg-zinc-900 focus:bg-white dark:focus:bg-zinc-950 text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-zinc-500 rounded-xl border border-slate-200 dark:border-white/10 focus:border-teal-500 dark:focus:border-teal-400 focus:ring-1 focus:ring-teal-500 dark:focus:ring-teal-400 outline-none transition-all"
            />
            <div className="absolute right-3 top-1/2 -translate-y-1/2 hidden sm:flex items-center gap-1 pointer-events-none">
              <kbd className="px-1.5 py-0.5 text-[10px] font-mono-spec font-medium text-slate-500 dark:text-zinc-400 bg-slate-200/80 dark:bg-zinc-800 border border-slate-300 dark:border-zinc-700 rounded shadow-xs">
                ⌘K
              </kbd>
            </div>
          </div>
        </div>

        {/* Right Controls */}
        <div className="flex items-center gap-1.5 sm:gap-2.5 flex-shrink-0">
          {/* In Stock Only Switch */}
          <button
            id="toggle-in-stock-filter"
            onClick={() => onToggleInStockOnly(!inStockOnly)}
            className={`flex items-center gap-1.5 sm:gap-2 px-2.5 sm:px-3 py-1.5 sm:py-2 rounded-xl text-xs sm:text-sm font-medium border transition-all cursor-pointer ${
              inStockOnly
                ? 'bg-teal-500/15 border-teal-500/40 text-teal-700 dark:text-teal-300 shadow-[0_0_12px_rgba(0,245,212,0.2)]'
                : 'bg-slate-100 dark:bg-zinc-900/60 border-slate-200 dark:border-white/10 text-slate-600 dark:text-zinc-400 hover:text-slate-900 dark:hover:text-zinc-200 hover:border-slate-300 dark:hover:border-white/20'
            }`}
            title="Filter to items available for immediate pickup"
          >
            <div className={`w-1.5 h-1.5 sm:w-2 sm:h-2 rounded-full ${inStockOnly ? 'bg-teal-500 dark:bg-teal-400 animate-pulse' : 'bg-slate-400 dark:bg-zinc-500'}`} />
            <span className="hidden sm:inline">In-Stock</span>
            <span className="sm:hidden text-[11px]">Stock</span>
          </button>

          {/* Theme Toggle Button (Light / Dark) */}
          <button
            id="theme-toggle-btn"
            type="button"
            onClick={toggleTheme}
            aria-label={`Switch to ${theme === 'dark' ? 'Light' : 'Dark'} mode`}
            title={`Switch to ${theme === 'dark' ? 'Light' : 'Dark'} mode`}
            className="flex items-center justify-center p-2 sm:px-3 sm:py-2 rounded-xl text-xs sm:text-sm font-medium border border-slate-200 dark:border-white/10 bg-slate-100 dark:bg-zinc-900/60 hover:bg-slate-200/80 dark:hover:bg-zinc-800 text-slate-700 dark:text-zinc-300 transition-all cursor-pointer shadow-xs active:scale-95"
          >
            {theme === 'dark' ? (
              <Sun className="w-4 h-4 text-amber-400 hover:rotate-45 transition-transform" />
            ) : (
              <Moon className="w-4 h-4 text-slate-700 hover:-rotate-12 transition-transform" />
            )}
            <span className="ml-1.5 text-xs font-semibold">
              {theme === 'dark' ? 'Light' : 'Dark'}
            </span>
          </button>
        </div>

      </div>
    </header>
  );
};
