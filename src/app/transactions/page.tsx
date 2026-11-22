'use client';

import React, { useState, useMemo } from 'react';
import { useExpense } from '@/context/ExpenseContext';
import { FilterToolbar } from '@/components/transactions/FilterToolbar';
import { CustomFilterBuilderModal } from '@/components/transactions/CustomFilterBuilderModal';
import { TransactionsTable } from '@/components/transactions/TransactionsTable';
import { AddExpenseModal } from '@/components/transactions/AddExpenseModal';
import { FilterGroup, TransactionType, TransactionStatus, SavedFilter } from '@/types';
import { filterByDatePreset, QuickDatePreset, evaluateFilterGroup } from '@/lib/filters/filter-engine';
import { Bookmark, Layers, Plus } from 'lucide-react';

export default function TransactionsPage() {
  const { transactions, categories, setActiveCategorizeId } = useExpense();

  // Filter States
  const [searchQuery, setSearchQuery] = useState('');
  const [datePreset, setDatePreset] = useState<QuickDatePreset>('all');
  const [selectedMonths, setSelectedMonths] = useState<number[]>([]);
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [selectedTypes, setSelectedTypes] = useState<TransactionType[]>([]);
  const [selectedStatus, setSelectedStatus] = useState<TransactionStatus | 'all'>('all');
  const [minAmount, setMinAmount] = useState('');
  const [maxAmount, setMaxAmount] = useState('');
  const [selectedBank, setSelectedBank] = useState('all');
  const [groupBy, setGroupBy] = useState<'none' | 'day' | 'month'>('none');

  // Custom AND/OR Filter Group State
  const [customFilterGroup, setCustomFilterGroup] = useState<FilterGroup | null>(null);
  const [isCustomModalOpen, setIsCustomModalOpen] = useState(false);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [savedViews, setSavedViews] = useState<{ name: string; group: FilterGroup }[]>([
    {
      name: 'High Value (>₹1,000)',
      group: {
        id: 'sv-1',
        logic: 'AND',
        rules: [{ id: 'r1', field: 'amount', operator: 'greater_than', value: 1000 }],
      },
    },
    {
      name: 'Pending Review',
      group: {
        id: 'sv-2',
        logic: 'AND',
        rules: [{ id: 'r2', field: 'status', operator: 'equals', value: 'pending_categorization' }],
      },
    },
  ]);

  // Compute Active Filter Count
  const activeFilterCount = useMemo(() => {
    let count = 0;
    if (searchQuery) count++;
    if (datePreset !== 'all') count++;
    if (selectedMonths.length > 0) count += selectedMonths.length;
    if (selectedCategories.length > 0) count += selectedCategories.length;
    if (selectedTypes.length > 0) count += selectedTypes.length;
    if (selectedStatus !== 'all') count++;
    if (minAmount || maxAmount) count++;
    if (selectedBank !== 'all') count++;
    if (customFilterGroup) count++;
    return count;
  }, [
    searchQuery,
    datePreset,
    selectedMonths,
    selectedCategories,
    selectedTypes,
    selectedStatus,
    minAmount,
    maxAmount,
    selectedBank,
    customFilterGroup,
  ]);

  // Filter Transactions pipeline
  const filteredTransactions = useMemo(() => {
    let result = [...transactions];

    // 1. Search Query
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      result = result.filter(
        (t) =>
          t.merchant.toLowerCase().includes(q) ||
          t.bank_sender.toLowerCase().includes(q) ||
          (t.upi_ref && t.upi_ref.toLowerCase().includes(q)) ||
          (t.transaction_reference && t.transaction_reference.toLowerCase().includes(q))
      );
    }

    // 2. Date Preset
    if (datePreset !== 'all') {
      result = filterByDatePreset(result, datePreset);
    }

    // 3. Multi-Month Filter
    if (selectedMonths.length > 0) {
      result = result.filter((t) => {
        const month = new Date(t.transaction_date).getMonth();
        return selectedMonths.includes(month);
      });
    }

    // 4. Category Filter
    if (selectedCategories.length > 0) {
      result = result.filter(
        (t) => t.category_id && selectedCategories.includes(t.category_id)
      );
    }

    // 5. Transaction Types
    if (selectedTypes.length > 0) {
      result = result.filter((t) => selectedTypes.includes(t.transaction_type));
    }

    // 6. Status Filter
    if (selectedStatus !== 'all') {
      result = result.filter((t) => t.status === selectedStatus);
    }

    // 7. Amount Range
    if (minAmount) {
      const min = parseFloat(minAmount);
      if (!isNaN(min)) result = result.filter((t) => t.amount >= min);
    }
    if (maxAmount) {
      const max = parseFloat(maxAmount);
      if (!isNaN(max)) result = result.filter((t) => t.amount <= max);
    }

    // 8. Bank Filter
    if (selectedBank !== 'all') {
      result = result.filter((t) => t.bank_sender === selectedBank);
    }

    // 9. Custom Boolean Filter Group (AND / OR)
    if (customFilterGroup) {
      result = result.filter((t) => evaluateFilterGroup(t, customFilterGroup));
    }

    return result;
  }, [
    transactions,
    searchQuery,
    datePreset,
    selectedMonths,
    selectedCategories,
    selectedTypes,
    selectedStatus,
    minAmount,
    maxAmount,
    selectedBank,
    customFilterGroup,
  ]);

  const handleResetFilters = () => {
    setSearchQuery('');
    setDatePreset('all');
    setSelectedMonths([]);
    setSelectedCategories([]);
    setSelectedTypes([]);
    setSelectedStatus('all');
    setMinAmount('');
    setMaxAmount('');
    setSelectedBank('all');
    setCustomFilterGroup(null);
  };

  const handleApplySavedView = (group: FilterGroup) => {
    setCustomFilterGroup(group);
  };

  return (
    <div className="space-y-6">
      {/* Page Header with Actions & Saved Views */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-white tracking-tight">Transactions</h1>
          <p className="text-xs text-zinc-400 mt-1">
            Browse, filter, and inspect SMS-imported expenses across your bank accounts
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          {/* Saved Views quick bar */}
          <div className="flex flex-wrap items-center gap-1.5">
            <span className="text-xs text-zinc-500 flex items-center space-x-1 mr-1">
              <Bookmark className="w-3.5 h-3.5 text-purple-400" />
              <span>Views:</span>
            </span>
            {savedViews.map((sv, idx) => (
              <button
                key={idx}
                onClick={() => handleApplySavedView(sv.group)}
                className="px-2.5 py-1 rounded-lg text-xs bg-zinc-900 border border-zinc-800 text-zinc-300 hover:text-white hover:border-zinc-700 transition"
              >
                {sv.name}
              </button>
            ))}
          </div>

          {/* Add Expense Button */}
          <button
            onClick={() => setIsAddModalOpen(true)}
            className="flex items-center space-x-1.5 px-3.5 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-zinc-950 font-bold text-xs shadow-lg shadow-emerald-500/20 transition active:scale-95"
          >
            <Plus className="w-4 h-4" />
            <span>Add Expense</span>
          </button>
        </div>
      </div>

      {/* Filter Toolbar */}
      <FilterToolbar
        categories={categories}
        searchQuery={searchQuery}
        setSearchQuery={setSearchQuery}
        datePreset={datePreset}
        setDatePreset={setDatePreset}
        selectedMonths={selectedMonths}
        setSelectedMonths={setSelectedMonths}
        selectedCategories={selectedCategories}
        setSelectedCategories={setSelectedCategories}
        selectedTypes={selectedTypes}
        setSelectedTypes={setSelectedTypes}
        selectedStatus={selectedStatus}
        setSelectedStatus={setSelectedStatus}
        minAmount={minAmount}
        setMinAmount={setMinAmount}
        maxAmount={maxAmount}
        setMaxAmount={setMaxAmount}
        selectedBank={selectedBank}
        setSelectedBank={setSelectedBank}
        onOpenCustomBuilder={() => setIsCustomModalOpen(true)}
        onResetFilters={handleResetFilters}
        activeFilterCount={activeFilterCount}
      />

      {/* Active Custom Filter Indicator */}
      {customFilterGroup && (
        <div className="flex items-center justify-between p-3 rounded-xl bg-purple-950/30 border border-purple-800/40 text-xs text-purple-300">
          <div className="flex items-center space-x-2">
            <span className="w-2 h-2 rounded-full bg-purple-400" />
            <span>
              Active Custom Boolean Filter ({customFilterGroup.logic} logic with{' '}
              {customFilterGroup.rules.length} conditions)
            </span>
          </div>
          <button
            onClick={() => setCustomFilterGroup(null)}
            className="text-purple-400 hover:text-white font-semibold underline text-xs"
          >
            Clear Custom Filter
          </button>
        </div>
      )}

      {/* Main Transactions Table */}
      <TransactionsTable
        transactions={filteredTransactions}
        categories={categories}
        onOpenCategorize={(id) => setActiveCategorizeId(id)}
        groupBy={groupBy}
        setGroupBy={setGroupBy}
      />

      {/* Custom AND / OR Filter Builder Modal */}
      <CustomFilterBuilderModal
        isOpen={isCustomModalOpen}
        onClose={() => setIsCustomModalOpen(false)}
        categories={categories}
        transactions={transactions}
        onApplyFilter={(group) => setCustomFilterGroup(group)}
        onSaveView={(name, group) => {
          setSavedViews((prev) => [...prev, { name, group }]);
        }}
      />

      {/* Manual Expense Entry Modal */}
      <AddExpenseModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
      />
    </div>
  );
}

