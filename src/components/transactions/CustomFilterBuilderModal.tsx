'use client';

import React, { useState } from 'react';
import { FilterGroup, FilterRule, Category, Transaction, FilterOperator } from '@/types';
import { evaluateFilterGroup } from '@/lib/filters/filter-engine';
import { X, Plus, Trash2, BookmarkCheck, Check, Sparkles } from 'lucide-react';

interface CustomFilterBuilderModalProps {
  isOpen: boolean;
  onClose: () => void;
  categories: Category[];
  transactions: Transaction[];
  onApplyFilter: (group: FilterGroup) => void;
  onSaveView: (name: string, group: FilterGroup) => void;
}

export function CustomFilterBuilderModal({
  isOpen,
  onClose,
  categories,
  transactions,
  onApplyFilter,
  onSaveView,
}: CustomFilterBuilderModalProps) {
  const [logic, setLogic] = useState<'AND' | 'OR'>('AND');
  const [rules, setRules] = useState<FilterRule[]>([
    {
      id: 'r-init-1',
      field: 'category',
      operator: 'equals',
      value: 'cat-food',
    },
    {
      id: 'r-init-2',
      field: 'amount',
      operator: 'greater_than',
      value: 500,
    },
  ]);
  const [viewName, setViewName] = useState('');
  const [isSaved, setIsSaved] = useState(false);

  if (!isOpen) return null;

  const currentGroup: FilterGroup = {
    id: 'grp-active',
    logic,
    rules,
  };

  const matchingCount = transactions.filter((t) => evaluateFilterGroup(t, currentGroup)).length;

  const handleAddRule = () => {
    setRules([
      ...rules,
      {
        id: `r-${Date.now()}`,
        field: 'amount',
        operator: 'greater_than',
        value: 1000,
      },
    ]);
  };

  const handleUpdateRule = (idx: number, updates: Partial<FilterRule>) => {
    const next = [...rules];
    next[idx] = { ...next[idx], ...updates };
    setRules(next);
  };

  const handleRemoveRule = (idx: number) => {
    if (rules.length > 1) {
      setRules(rules.filter((_, i) => i !== idx));
    }
  };

  const handleApply = () => {
    onApplyFilter(currentGroup);
    onClose();
  };

  const handleSave = () => {
    if (!viewName.trim()) return;
    onSaveView(viewName.trim(), currentGroup);
    setIsSaved(true);
    setTimeout(() => {
      setIsSaved(false);
      onApplyFilter(currentGroup);
      onClose();
    }, 800);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-md">
      <div className="fixed inset-0" onClick={onClose} />

      <div className="relative w-full max-w-2xl bg-zinc-950 border border-zinc-800 rounded-3xl shadow-2xl z-10 overflow-hidden flex flex-col max-h-[90vh]">
        {/* Modal Header */}
        <div className="p-6 border-b border-zinc-800 flex items-center justify-between bg-zinc-900/40">
          <div>
            <h3 className="text-base font-bold text-white flex items-center space-x-2">
              <span>Advanced Custom Filter Builder</span>
              <span className="text-[10px] uppercase font-extrabold px-2 py-0.5 rounded-full bg-purple-500/20 text-purple-400 border border-purple-500/30">
                Boolean Logic
              </span>
            </h3>
            <p className="text-xs text-zinc-400 mt-0.5">
              Build nested multi-condition rules with AND / OR matching
            </p>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-full text-zinc-400 hover:text-white hover:bg-zinc-800"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Builder Body */}
        <div className="p-6 overflow-y-auto flex-1 space-y-5">
          {/* Top Logic Toggle: Match ALL (AND) vs Match ANY (OR) */}
          <div className="flex items-center space-x-3 p-3 rounded-2xl bg-zinc-900/80 border border-zinc-800">
            <span className="text-xs font-semibold text-zinc-300">Match condition:</span>
            <div className="inline-flex rounded-xl bg-zinc-950 p-1 border border-zinc-800">
              <button
                type="button"
                onClick={() => setLogic('AND')}
                className={`px-3 py-1 rounded-lg text-xs font-bold transition ${
                  logic === 'AND'
                    ? 'bg-purple-600 text-white shadow'
                    : 'text-zinc-400 hover:text-white'
                }`}
              >
                ALL Rules (AND)
              </button>
              <button
                type="button"
                onClick={() => setLogic('OR')}
                className={`px-3 py-1 rounded-lg text-xs font-bold transition ${
                  logic === 'OR'
                    ? 'bg-purple-600 text-white shadow'
                    : 'text-zinc-400 hover:text-white'
                }`}
              >
                ANY Rule (OR)
              </button>
            </div>
            <span className="text-xs text-zinc-500 hidden sm:inline">
              {logic === 'AND' ? 'Transactions must meet every condition below' : 'Transactions meeting any condition will match'}
            </span>
          </div>

          {/* Rules List */}
          <div className="space-y-3">
            {rules.map((rule, idx) => (
              <div
                key={rule.id}
                className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 p-3 rounded-2xl bg-zinc-900/50 border border-zinc-800 hover:border-zinc-700 transition"
              >
                <span className="text-xs font-mono font-bold text-zinc-500 w-6 shrink-0">
                  #{idx + 1}
                </span>

                {/* Field selector */}
                <select
                  value={rule.field}
                  onChange={(e) => handleUpdateRule(idx, { field: e.target.value as any })}
                  className="px-2.5 py-1.5 bg-zinc-950 border border-zinc-800 rounded-xl text-xs text-zinc-200 focus:outline-none focus:border-purple-500"
                >
                  <option value="category">Category</option>
                  <option value="amount">Amount</option>
                  <option value="merchant">Merchant</option>
                  <option value="bank_sender">Bank</option>
                  <option value="transaction_type">Type</option>
                  <option value="status">Status</option>
                </select>

                {/* Operator selector */}
                <select
                  value={rule.operator}
                  onChange={(e) => handleUpdateRule(idx, { operator: e.target.value as FilterOperator })}
                  className="px-2.5 py-1.5 bg-zinc-950 border border-zinc-800 rounded-xl text-xs text-zinc-200 focus:outline-none focus:border-purple-500"
                >
                  <option value="equals">Equals (=)</option>
                  <option value="not_equals">Does not equal (≠)</option>
                  <option value="greater_than">Greater than (&gt;)</option>
                  <option value="less_than">Less than (&lt;)</option>
                  <option value="contains">Contains text</option>
                </select>

                {/* Value input according to field */}
                {rule.field === 'category' ? (
                  <select
                    value={rule.value}
                    onChange={(e) => handleUpdateRule(idx, { value: e.target.value })}
                    className="flex-1 px-2.5 py-1.5 bg-zinc-950 border border-zinc-800 rounded-xl text-xs text-zinc-200 focus:outline-none focus:border-purple-500"
                  >
                    {categories.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                ) : rule.field === 'transaction_type' ? (
                  <select
                    value={rule.value}
                    onChange={(e) => handleUpdateRule(idx, { value: e.target.value })}
                    className="flex-1 px-2.5 py-1.5 bg-zinc-950 border border-zinc-800 rounded-xl text-xs text-zinc-200 focus:outline-none focus:border-purple-500"
                  >
                    <option value="debit">Debit</option>
                    <option value="credit">Credit</option>
                    <option value="refund">Refund</option>
                  </select>
                ) : rule.field === 'bank_sender' ? (
                  <select
                    value={rule.value}
                    onChange={(e) => handleUpdateRule(idx, { value: e.target.value })}
                    className="flex-1 px-2.5 py-1.5 bg-zinc-950 border border-zinc-800 rounded-xl text-xs text-zinc-200 focus:outline-none focus:border-purple-500"
                  >
                    <option value="HDFCBK">HDFC Bank</option>
                    <option value="ICICIB">ICICI Bank</option>
                    <option value="SBIINB">SBI</option>
                    <option value="FEDX">Federal Bank</option>
                    <option value="AXISBK">Axis Bank</option>
                  </select>
                ) : (
                  <input
                    type={rule.field === 'amount' ? 'number' : 'text'}
                    value={rule.value}
                    onChange={(e) => handleUpdateRule(idx, { value: e.target.value })}
                    placeholder="Enter target value..."
                    className="flex-1 px-2.5 py-1.5 bg-zinc-950 border border-zinc-800 rounded-xl text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-purple-500"
                  />
                )}

                {/* Remove button */}
                <button
                  type="button"
                  onClick={() => handleRemoveRule(idx)}
                  disabled={rules.length === 1}
                  className="p-2 text-zinc-500 hover:text-rose-400 disabled:opacity-30 self-center"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>

          {/* Add Rule Button */}
          <button
            type="button"
            onClick={handleAddRule}
            className="flex items-center space-x-1.5 px-3 py-1.5 rounded-xl border border-dashed border-zinc-700 text-xs font-semibold text-zinc-300 hover:text-white hover:border-zinc-500 transition"
          >
            <Plus className="w-3.5 h-3.5 text-purple-400" />
            <span>Add Condition Rule</span>
          </button>

          {/* Save view section */}
          <div className="pt-4 border-t border-zinc-800">
            <label className="text-xs font-semibold text-zinc-300 block mb-1.5">
              Save as Reusable Custom View
            </label>
            <div className="flex gap-2">
              <input
                type="text"
                value={viewName}
                onChange={(e) => setViewName(e.target.value)}
                placeholder="e.g. High Value Dining (>₹500), Monthly Groceries"
                className="flex-1 px-3 py-2 bg-zinc-900 border border-zinc-800 rounded-xl text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-purple-500"
              />
              <button
                type="button"
                onClick={handleSave}
                disabled={!viewName.trim() || isSaved}
                className="px-4 py-2 bg-zinc-800 hover:bg-zinc-700 text-white rounded-xl text-xs font-semibold border border-zinc-700 flex items-center space-x-1.5 disabled:opacity-50"
              >
                {isSaved ? <Check className="w-4 h-4 text-emerald-400" /> : <BookmarkCheck className="w-4 h-4 text-purple-400" />}
                <span>{isSaved ? 'Saved!' : 'Save View'}</span>
              </button>
            </div>
          </div>
        </div>

        {/* Modal Footer with Live Count */}
        <div className="p-4 border-t border-zinc-800 bg-zinc-900/40 flex items-center justify-between">
          <div className="text-xs text-zinc-400">
            Matching Transactions:{' '}
            <span className="text-emerald-400 font-bold text-sm ml-1">{matchingCount}</span>
          </div>

          <div className="flex items-center space-x-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-xs font-semibold text-zinc-400 hover:text-white"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleApply}
              className="px-5 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs shadow-lg shadow-purple-600/20 transition active:scale-95"
            >
              Apply Filter
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

