'use client';

import React, { useState } from 'react';
import { useExpense } from '@/context/ExpenseContext';
import { CategoryIcon } from '@/components/ui/CategoryIcon';
import {
  PiggyBank,
  Plus,
  AlertTriangle,
  CheckCircle,
  Sliders,
  TrendingUp,
  X,
  Sparkles,
} from 'lucide-react';

export default function BudgetsPage() {
  const { budgets, categories, transactions, saveBudgetLimit } = useExpense();
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [selectedCatId, setSelectedCatId] = useState<string>('overall');
  const [limitAmount, setLimitAmount] = useState<string>('');
  const [period, setPeriod] = useState<'monthly' | 'weekly'>('monthly');

  // Compute spent for each budget
  const budgetStats = budgets.map((b) => {
    let spent = 0;
    if (b.category_id === null) {
      // Overall budget
      spent = transactions
        .filter((t) => t.transaction_type === 'debit')
        .reduce((acc, t) => acc + t.amount, 0);
    } else {
      spent = transactions
        .filter((t) => t.transaction_type === 'debit' && t.category_id === b.category_id)
        .reduce((acc, t) => acc + t.amount, 0);
    }

    const percentage = b.amount_limit > 0 ? Math.round((spent / b.amount_limit) * 100) : 0;
    const remaining = b.amount_limit - spent;

    let status: 'safe' | 'warning' | 'critical' | 'exceeded' = 'safe';
    if (percentage >= 100) status = 'exceeded';
    else if (percentage >= b.threshold_critical) status = 'critical';
    else if (percentage >= b.threshold_warning) status = 'warning';

    const category = categories.find((c) => c.id === b.category_id);

    return {
      ...b,
      spent,
      remaining,
      percentage,
      status,
      category,
    };
  });

  const handleSaveBudget = async (e: React.FormEvent) => {
    e.preventDefault();
    const limit = parseFloat(limitAmount);
    if (isNaN(limit) || limit <= 0) return;

    await saveBudgetLimit(selectedCatId === 'overall' ? null : selectedCatId, limit, period);
    setIsAddModalOpen(false);
    setLimitAmount('');
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-white tracking-tight">Budget Management</h1>
          <p className="text-xs text-zinc-400 mt-1">
            Track spending limits with automatic alerts at 75%, 90%, and 100% capacity
          </p>
        </div>

        <button
          onClick={() => setIsAddModalOpen(true)}
          className="flex items-center space-x-1.5 px-4 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-zinc-950 font-bold text-xs shadow-lg shadow-emerald-500/20 transition active:scale-95"
        >
          <Plus className="w-4 h-4" />
          <span>Set Budget Limit</span>
        </button>
      </div>

      {/* Overall Total Budget Hero Card */}
      {(() => {
        const overall = budgetStats.find((b) => b.category_id === null);
        if (!overall) return null;

        return (
          <div className="p-6 rounded-3xl bg-gradient-to-br from-zinc-900 via-zinc-900 to-zinc-950 border border-zinc-800 shadow-xl relative overflow-hidden">
            <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 mb-4">
              <div className="flex items-center space-x-3">
                <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 flex items-center justify-center">
                  <PiggyBank className="w-6 h-6" />
                </div>
                <div>
                  <div className="text-xs font-semibold uppercase tracking-wider text-emerald-400">
                    Master Spending Cap
                  </div>
                  <h2 className="text-lg font-bold text-white">Overall Monthly Budget</h2>
                </div>
              </div>

              <div className="text-right">
                <div className="text-xs text-zinc-400">Budget Limit</div>
                <div className="text-2xl font-extrabold text-white">
                  ₹{overall.amount_limit.toLocaleString('en-IN')}
                </div>
              </div>
            </div>

            {/* Progress bar */}
            <div className="space-y-2">
              <div className="flex justify-between text-xs">
                <span className="text-zinc-400">
                  Spent: <strong className="text-white">₹{overall.spent.toLocaleString('en-IN')}</strong>
                </span>
                <span className={`font-bold ${overall.percentage >= 100 ? 'text-rose-400' : 'text-emerald-400'}`}>
                  {overall.percentage}% Utilized
                </span>
                <span className="text-zinc-400">
                  Remaining:{' '}
                  <strong className={overall.remaining < 0 ? 'text-rose-400' : 'text-emerald-400'}>
                    ₹{overall.remaining.toLocaleString('en-IN')}
                  </strong>
                </span>
              </div>

              <div className="w-full h-3 rounded-full bg-zinc-800 overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all duration-500 ${
                    overall.status === 'exceeded'
                      ? 'bg-rose-500'
                      : overall.status === 'critical'
                      ? 'bg-orange-500'
                      : overall.status === 'warning'
                      ? 'bg-amber-500'
                      : 'bg-emerald-500'
                  }`}
                  style={{ width: `${Math.min(100, overall.percentage)}%` }}
                />
              </div>
            </div>

            {/* Threshold alerts banner if exceeded or warning */}
            {overall.status !== 'safe' && (
              <div className="mt-4 p-3 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center space-x-2 text-xs text-amber-300">
                <AlertTriangle className="w-4 h-4 shrink-0" />
                <span>
                  {overall.status === 'exceeded'
                    ? 'Budget exceeded! You have surpassed your allocated monthly limit.'
                    : `Threshold reached: ${overall.percentage}% of overall monthly budget consumed.`}
                </span>
              </div>
            )}
          </div>
        );
      })()}

      {/* Category-Specific Budget Limits Grid */}
      <div>
        <h3 className="text-sm font-semibold text-white tracking-tight mb-3">
          Category Budgets & Limits
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {budgetStats
            .filter((b) => b.category_id !== null)
            .map((b) => {
              const catName = b.category?.name || 'Category';
              const catColor = b.category?.color || '#10B981';
              const catIcon = b.category?.icon || 'Tag';

              return (
                <div
                  key={b.id}
                  className="p-5 rounded-2xl bg-zinc-900/80 border border-zinc-800 hover:border-zinc-700 transition flex flex-col justify-between space-y-4"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2.5">
                      <div
                        className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0"
                        style={{ backgroundColor: `${catColor}25`, color: catColor }}
                      >
                        <CategoryIcon name={catIcon} className="w-4 h-4" color={catColor} />
                      </div>
                      <div>
                        <div className="text-xs font-semibold text-white">{catName}</div>
                        <div className="text-[10px] text-zinc-400 capitalize">{b.period} Limit</div>
                      </div>
                    </div>

                    <span
                      className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                        b.status === 'exceeded'
                          ? 'bg-rose-500/10 text-rose-400 border-rose-500/20'
                          : b.status === 'critical'
                          ? 'bg-orange-500/10 text-orange-400 border-orange-500/20'
                          : b.status === 'warning'
                          ? 'bg-amber-500/10 text-amber-400 border-amber-500/20'
                          : 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                      }`}
                    >
                      {b.percentage}%
                    </span>
                  </div>

                  {/* Progress bar */}
                  <div className="space-y-1.5">
                    <div className="w-full h-2 rounded-full bg-zinc-800 overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all duration-500 ${
                          b.status === 'exceeded'
                            ? 'bg-rose-500'
                            : b.status === 'critical'
                            ? 'bg-orange-500'
                            : b.status === 'warning'
                            ? 'bg-amber-500'
                            : 'bg-emerald-500'
                        }`}
                        style={{ width: `${Math.min(100, b.percentage)}%` }}
                      />
                    </div>

                    <div className="flex justify-between text-[11px] text-zinc-400">
                      <span>Spent: ₹{b.spent.toLocaleString('en-IN')}</span>
                      <span>Cap: ₹{b.amount_limit.toLocaleString('en-IN')}</span>
                    </div>
                  </div>

                  <div className="pt-2 border-t border-zinc-800/60 flex items-center justify-between text-xs">
                    <span className="text-zinc-500 text-[11px]">
                      {b.remaining >= 0 ? 'Remaining' : 'Over by'}
                    </span>
                    <span
                      className={`font-bold ${
                        b.remaining < 0 ? 'text-rose-400' : 'text-zinc-200'
                      }`}
                    >
                      ₹{Math.abs(b.remaining).toLocaleString('en-IN')}
                    </span>
                  </div>
                </div>
              );
            })}
        </div>
      </div>

      {/* Add / Edit Budget Modal */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-md">
          <div className="fixed inset-0" onClick={() => setIsAddModalOpen(false)} />

          <div className="relative w-full max-w-md bg-zinc-950 border border-zinc-800 rounded-3xl p-6 shadow-2xl z-10 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-bold text-white">Configure Budget Limit</h3>
              <button
                onClick={() => setIsAddModalOpen(false)}
                className="text-zinc-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveBudget} className="space-y-4">
              <div>
                <label className="text-xs text-zinc-400 block mb-1">Target Category</label>
                <select
                  value={selectedCatId}
                  onChange={(e) => setSelectedCatId(e.target.value)}
                  className="w-full px-3 py-2 bg-zinc-900 border border-zinc-800 rounded-xl text-xs text-white focus:outline-none focus:border-emerald-500"
                >
                  <option value="overall">Overall Total Monthly Budget</option>
                  {categories.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-xs text-zinc-400 block mb-1">Period</label>
                <div className="flex space-x-2">
                  {(['monthly', 'weekly'] as const).map((p) => (
                    <button
                      key={p}
                      type="button"
                      onClick={() => setPeriod(p)}
                      className={`flex-1 py-1.5 rounded-xl text-xs font-semibold capitalize border transition ${
                        period === p
                          ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
                          : 'bg-zinc-900 text-zinc-400 border-zinc-800'
                      }`}
                    >
                      {p}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="text-xs text-zinc-400 block mb-1">Spending Limit (₹)</label>
                <input
                  type="number"
                  required
                  placeholder="e.g. 10000"
                  value={limitAmount}
                  onChange={(e) => setLimitAmount(e.target.value)}
                  className="w-full px-3 py-2 bg-zinc-900 border border-zinc-800 rounded-xl text-sm text-white placeholder-zinc-500 focus:outline-none focus:border-emerald-500 font-mono"
                  autoFocus
                />
              </div>

              <div className="p-3 rounded-xl bg-zinc-900/60 border border-zinc-800 text-[11px] text-zinc-400 space-y-1">
                <div className="flex items-center space-x-1.5 font-semibold text-zinc-300">
                  <Sparkles className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Automated Alert Rules</span>
                </div>
                <p>• Warning notification sent at 75% utilization</p>
                <p>• Critical alert notification sent at 90% utilization</p>
                <p>• Exceeded warning dispatched at 100%</p>
              </div>

              <div className="flex space-x-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="flex-1 py-2 rounded-xl border border-zinc-800 text-xs font-semibold text-zinc-400 hover:text-white"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-zinc-950 text-xs font-bold shadow-lg shadow-emerald-500/20"
                >
                  Save Budget Limit
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

