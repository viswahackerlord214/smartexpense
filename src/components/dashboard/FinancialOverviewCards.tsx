'use client';

import React from 'react';
import { useExpense } from '@/context/ExpenseContext';
import { computeFinancialOverview } from '@/lib/analytics/spending-insights';
import { ArrowUpRight, ArrowDownRight, Wallet, TrendingUp, AlertCircle, Calendar, Hash } from 'lucide-react';

export function FinancialOverviewCards() {
  const { transactions, pendingCount, setActiveCategorizeId } = useExpense();
  const overview = computeFinancialOverview(transactions);

  const pendingTxn = transactions.find((t) => t.status === 'pending_categorization');

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {/* 1. Total Monthly Expenses */}
      <div className="relative overflow-hidden rounded-2xl bg-zinc-900/80 border border-zinc-800 p-5 shadow-lg backdrop-blur-sm group hover:border-zinc-700 transition-all">
        <div className="flex items-center justify-between text-zinc-400 mb-3">
          <span className="text-xs font-semibold uppercase tracking-wider">Total Expenses</span>
          <div className="w-8 h-8 rounded-lg bg-rose-500/10 text-rose-400 flex items-center justify-center">
            <ArrowUpRight className="w-4 h-4" />
          </div>
        </div>
        <div className="text-2xl lg:text-3xl font-extrabold text-white tracking-tight">
          ₹{overview.totalExpense.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
        </div>
        <div className="mt-2 flex items-center text-xs text-zinc-400">
          <span className="text-rose-400 font-medium mr-1.5">Debit Outflows</span>
          <span>• November 2026</span>
        </div>
        <div className="absolute top-0 right-0 w-24 h-24 bg-rose-500/5 rounded-full blur-2xl pointer-events-none" />
      </div>

      {/* 2. Total Income & Net Cash Flow */}
      <div className="relative overflow-hidden rounded-2xl bg-zinc-900/80 border border-zinc-800 p-5 shadow-lg backdrop-blur-sm group hover:border-zinc-700 transition-all">
        <div className="flex items-center justify-between text-zinc-400 mb-3">
          <span className="text-xs font-semibold uppercase tracking-wider">Net Cash Flow</span>
          <div className="w-8 h-8 rounded-lg bg-emerald-500/10 text-emerald-400 flex items-center justify-center">
            <TrendingUp className="w-4 h-4" />
          </div>
        </div>
        <div className="text-2xl lg:text-3xl font-extrabold text-emerald-400 tracking-tight">
          +₹{overview.netCashFlow.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
        </div>
        <div className="mt-2 flex items-center text-xs text-zinc-400">
          <span className="text-zinc-300 font-medium mr-1.5">Income: ₹{overview.totalIncome.toLocaleString('en-IN')}</span>
        </div>
        <div className="absolute top-0 right-0 w-24 h-24 bg-emerald-500/5 rounded-full blur-2xl pointer-events-none" />
      </div>

      {/* 3. Average Daily Spending & Top Category */}
      <div className="relative overflow-hidden rounded-2xl bg-zinc-900/80 border border-zinc-800 p-5 shadow-lg backdrop-blur-sm group hover:border-zinc-700 transition-all">
        <div className="flex items-center justify-between text-zinc-400 mb-3">
          <span className="text-xs font-semibold uppercase tracking-wider">Daily Spending Rate</span>
          <div className="w-8 h-8 rounded-lg bg-blue-500/10 text-blue-400 flex items-center justify-center">
            <Calendar className="w-4 h-4" />
          </div>
        </div>
        <div className="text-2xl lg:text-3xl font-extrabold text-white tracking-tight">
          ₹{overview.averageDailySpending.toLocaleString('en-IN')}{' '}
          <span className="text-xs font-normal text-zinc-400">/day</span>
        </div>
        <div className="mt-2 flex items-center text-xs text-zinc-400">
          <span className="text-blue-400 font-medium mr-1.5">
            Top: {overview.highestCategory?.name || 'Dining'}
          </span>
          <span>({overview.highestCategory?.percentage || 0}%)</span>
        </div>
        <div className="absolute top-0 right-0 w-24 h-24 bg-blue-500/5 rounded-full blur-2xl pointer-events-none" />
      </div>

      {/* 4. Action Card: Pending Categorization */}
      <div className={`relative overflow-hidden rounded-2xl border p-5 shadow-lg backdrop-blur-sm transition-all ${
        pendingCount > 0
          ? 'bg-gradient-to-br from-amber-950/30 to-zinc-900 border-amber-600/40 hover:border-amber-500/60'
          : 'bg-zinc-900/80 border-zinc-800'
      }`}>
        <div className="flex items-center justify-between text-zinc-400 mb-3">
          <span className="text-xs font-semibold uppercase tracking-wider">SMS Auto-Detected</span>
          <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${
            pendingCount > 0 ? 'bg-amber-500/20 text-amber-400 animate-pulse' : 'bg-zinc-800 text-zinc-400'
          }`}>
            <AlertCircle className="w-4 h-4" />
          </div>
        </div>

        <div className="flex items-baseline justify-between">
          <div className="text-2xl lg:text-3xl font-extrabold text-white tracking-tight">
            {pendingCount}{' '}
            <span className="text-sm font-medium text-zinc-400">
              {pendingCount === 1 ? 'Pending' : 'Pending'}
            </span>
          </div>

          {pendingCount > 0 && pendingTxn && (
            <button
              onClick={() => setActiveCategorizeId(pendingTxn.id)}
              className="px-3 py-1.5 bg-amber-500 hover:bg-amber-400 text-zinc-950 font-bold text-xs rounded-xl shadow-md transition-all active:scale-95"
            >
              Categorize 1-Tap
            </button>
          )}
        </div>

        <div className="mt-2 flex items-center text-xs text-zinc-400">
          <span>{overview.totalTransactionsCount} total bank transactions tracked</span>
        </div>
      </div>
    </div>
  );
}

