'use client';

import React, { useState } from 'react';
import { Category, TransactionType, TransactionStatus } from '@/types';
import { QuickDatePreset } from '@/lib/filters/filter-engine';
import {
  Calendar,
  Filter,
  SlidersHorizontal,
  X,
  Search,
  Check,
  ChevronDown,
  RotateCcw,
} from 'lucide-react';

interface FilterToolbarProps {
  categories: Category[];
  searchQuery: string;
  setSearchQuery: (q: string) => void;
  datePreset: QuickDatePreset;
  setDatePreset: (p: QuickDatePreset) => void;
  selectedMonths: number[];
  setSelectedMonths: (m: number[]) => void;
  selectedCategories: string[];
  setSelectedCategories: (c: string[]) => void;
  selectedTypes: TransactionType[];
  setSelectedTypes: (t: TransactionType[]) => void;
  selectedStatus: TransactionStatus | 'all';
  setSelectedStatus: (s: TransactionStatus | 'all') => void;
  minAmount: string;
  setMinAmount: (v: string) => void;
  maxAmount: string;
  setMaxAmount: (v: string) => void;
  selectedBank: string;
  setSelectedBank: (b: string) => void;
  onOpenCustomBuilder: () => void;
  onResetFilters: () => void;
  activeFilterCount: number;
}

const MONTH_NAMES = [
  'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
  'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec',
];

const KNOWN_BANKS = ['All Banks', 'HDFCBK', 'ICICIB', 'SBIINB', 'FEDX', 'AXISBK', 'KOTAKB'];

export function FilterToolbar({
  categories,
  searchQuery,
  setSearchQuery,
  datePreset,
  setDatePreset,
  selectedMonths,
  setSelectedMonths,
  selectedCategories,
  setSelectedCategories,
  selectedTypes,
  setSelectedTypes,
  selectedStatus,
  setSelectedStatus,
  minAmount,
  setMinAmount,
  maxAmount,
  setMaxAmount,
  selectedBank,
  setSelectedBank,
  onOpenCustomBuilder,
  onResetFilters,
  activeFilterCount,
}: FilterToolbarProps) {
  const [showAdvanced, setShowAdvanced] = useState(false);

  const toggleCategory = (catId: string) => {
    if (selectedCategories.includes(catId)) {
      setSelectedCategories(selectedCategories.filter((c) => c !== catId));
    } else {
      setSelectedCategories([...selectedCategories, catId]);
    }
  };

  const toggleMonth = (mIdx: number) => {
    if (selectedMonths.includes(mIdx)) {
      setSelectedMonths(selectedMonths.filter((m) => m !== mIdx));
    } else {
      setSelectedMonths([...selectedMonths, mIdx]);
    }
  };

  const toggleType = (type: TransactionType) => {
    if (selectedTypes.includes(type)) {
      setSelectedTypes(selectedTypes.filter((t) => t !== type));
    } else {
      setSelectedTypes([...selectedTypes, type]);
    }
  };

  return (
    <div className="space-y-3 rounded-2xl bg-zinc-900/90 border border-zinc-800 p-4 shadow-lg backdrop-blur-sm">
      {/* Top search & quick toggles bar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        {/* Search Merchant / Reference */}
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-zinc-500 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search merchant, bank sender, or UPI reference..."
            className="w-full pl-9 pr-3 py-2 bg-zinc-950 border border-zinc-800 rounded-xl text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-emerald-500"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-white"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        {/* Date presets selector */}
        <div className="flex items-center space-x-2">
          <div className="relative">
            <select
              value={datePreset}
              onChange={(e) => setDatePreset(e.target.value as QuickDatePreset)}
              className="appearance-none pl-3 pr-8 py-2 bg-zinc-950 border border-zinc-800 rounded-xl text-xs font-medium text-zinc-200 focus:outline-none focus:border-emerald-500 cursor-pointer"
            >
              <option value="all">All Dates</option>
              <option value="today">Today</option>
              <option value="yesterday">Yesterday</option>
              <option value="last_7_days">Last 7 Days</option>
              <option value="last_30_days">Last 30 Days</option>
              <option value="this_week">This Week</option>
              <option value="prev_week">Previous Week</option>
              <option value="this_month">This Month (Nov)</option>
              <option value="prev_month">Previous Month (Oct)</option>
              <option value="this_year">This Year (2026)</option>
            </select>
            <ChevronDown className="w-3.5 h-3.5 text-zinc-500 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
          </div>

          {/* Advanced toggle */}
          <button
            onClick={() => setShowAdvanced(!showAdvanced)}
            className={`flex items-center space-x-1.5 px-3 py-2 rounded-xl text-xs font-semibold border transition ${
              showAdvanced || activeFilterCount > 0
                ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
                : 'bg-zinc-950 text-zinc-400 border-zinc-800 hover:text-white'
            }`}
          >
            <SlidersHorizontal className="w-3.5 h-3.5" />
            <span>Filters</span>
            {activeFilterCount > 0 && (
              <span className="w-4 h-4 rounded-full bg-emerald-500 text-zinc-950 text-[10px] font-black flex items-center justify-center">
                {activeFilterCount}
              </span>
            )}
          </button>

          {/* Custom Filter Builder button */}
          <button
            onClick={onOpenCustomBuilder}
            className="flex items-center space-x-1.5 px-3 py-2 rounded-xl bg-zinc-950 border border-zinc-800 text-xs font-semibold text-zinc-200 hover:border-zinc-700 hover:text-white transition"
          >
            <Filter className="w-3.5 h-3.5 text-purple-400" />
            <span className="hidden md:inline">Custom AND/OR</span>
          </button>

          {/* Reset Filters */}
          {activeFilterCount > 0 && (
            <button
              onClick={onResetFilters}
              title="Reset all filters"
              className="p-2 rounded-xl bg-zinc-950 border border-zinc-800 text-zinc-400 hover:text-rose-400 transition"
            >
              <RotateCcw className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>

      {/* Expandable Advanced Filter Panel */}
      {showAdvanced && (
        <div className="pt-3 border-t border-zinc-800/80 space-y-3.5 animate-fade-in">
          {/* Multi-Month Selector */}
          <div>
            <div className="text-[11px] font-semibold text-zinc-400 uppercase tracking-wider mb-1.5">
              Multi-Month Selection
            </div>
            <div className="flex flex-wrap gap-1">
              {MONTH_NAMES.map((m, idx) => {
                const isSelected = selectedMonths.includes(idx);
                return (
                  <button
                    key={m}
                    onClick={() => toggleMonth(idx)}
                    className={`px-2.5 py-1 rounded-lg text-xs font-medium transition ${
                      isSelected
                        ? 'bg-emerald-500 text-zinc-950 font-bold'
                        : 'bg-zinc-950 text-zinc-400 border border-zinc-800 hover:text-white'
                    }`}
                  >
                    {m}
                  </button>
                );
              })}
              {selectedMonths.length > 0 && (
                <button
                  onClick={() => setSelectedMonths([])}
                  className="px-2 py-1 text-[11px] text-zinc-500 hover:text-zinc-300"
                >
                  Clear Months
                </button>
              )}
            </div>
          </div>

          {/* Multi-Category Selector */}
          <div>
            <div className="text-[11px] font-semibold text-zinc-400 uppercase tracking-wider mb-1.5">
              Categories (Multi-Select)
            </div>
            <div className="flex flex-wrap gap-1.5 max-h-24 overflow-y-auto pr-1">
              {categories.map((cat) => {
                const isSelected = selectedCategories.includes(cat.id);
                return (
                  <button
                    key={cat.id}
                    onClick={() => toggleCategory(cat.id)}
                    className={`flex items-center space-x-1.5 px-2.5 py-1 rounded-lg text-xs transition border ${
                      isSelected
                        ? 'bg-zinc-800 text-white border-zinc-600 font-semibold shadow-sm'
                        : 'bg-zinc-950 text-zinc-400 border-zinc-800/80 hover:text-zinc-200'
                    }`}
                  >
                    <span
                      className="w-2 h-2 rounded-full"
                      style={{ backgroundColor: cat.color }}
                    />
                    <span>{cat.name}</span>
                    {isSelected && <Check className="w-3 h-3 text-emerald-400" />}
                  </button>
                );
              })}
              {selectedCategories.length > 0 && (
                <button
                  onClick={() => setSelectedCategories([])}
                  className="px-2 py-1 text-[11px] text-zinc-500 hover:text-zinc-300"
                >
                  Clear Categories
                </button>
              )}
            </div>
          </div>

          {/* Amount range and Status row */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {/* Amount range */}
            <div>
              <div className="text-[11px] font-semibold text-zinc-400 uppercase tracking-wider mb-1.5">
                Amount Range (₹)
              </div>
              <div className="flex items-center space-x-2">
                <input
                  type="number"
                  placeholder="Min"
                  value={minAmount}
                  onChange={(e) => setMinAmount(e.target.value)}
                  className="w-full px-2.5 py-1.5 bg-zinc-950 border border-zinc-800 rounded-lg text-xs text-white placeholder-zinc-600 focus:outline-none focus:border-emerald-500"
                />
                <span className="text-zinc-500 text-xs">to</span>
                <input
                  type="number"
                  placeholder="Max"
                  value={maxAmount}
                  onChange={(e) => setMaxAmount(e.target.value)}
                  className="w-full px-2.5 py-1.5 bg-zinc-950 border border-zinc-800 rounded-lg text-xs text-white placeholder-zinc-600 focus:outline-none focus:border-emerald-500"
                />
              </div>
            </div>

            {/* Bank Sender Filter */}
            <div>
              <div className="text-[11px] font-semibold text-zinc-400 uppercase tracking-wider mb-1.5">
                Bank Sender
              </div>
              <select
                value={selectedBank}
                onChange={(e) => setSelectedBank(e.target.value)}
                className="w-full px-2.5 py-1.5 bg-zinc-950 border border-zinc-800 rounded-lg text-xs text-zinc-200 focus:outline-none focus:border-emerald-500"
              >
                {KNOWN_BANKS.map((b) => (
                  <option key={b} value={b === 'All Banks' ? 'all' : b}>
                    {b}
                  </option>
                ))}
              </select>
            </div>

            {/* Transaction Type toggles */}
            <div>
              <div className="text-[11px] font-semibold text-zinc-400 uppercase tracking-wider mb-1.5">
                Transaction Type
              </div>
              <div className="flex flex-wrap gap-1">
                {(['debit', 'credit', 'refund'] as TransactionType[]).map((type) => {
                  const isSel = selectedTypes.includes(type);
                  return (
                    <button
                      key={type}
                      onClick={() => toggleType(type)}
                      className={`px-2.5 py-1 rounded-lg text-xs font-medium capitalize transition ${
                        isSel
                          ? 'bg-zinc-800 text-white border border-zinc-700'
                          : 'bg-zinc-950 text-zinc-400 border border-zinc-800 hover:text-white'
                      }`}
                    >
                      {type}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

