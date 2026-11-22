'use client';

import React, { useState } from 'react';
import { FinancialOverviewCards } from '@/components/dashboard/FinancialOverviewCards';
import { SpendingTrendChart } from '@/components/dashboard/SpendingTrendChart';
import { CategoryDonutChart } from '@/components/dashboard/CategoryDonutChart';
import { DailySpendingBarChart } from '@/components/dashboard/DailySpendingBarChart';
import { MonthlyComparisonChart } from '@/components/dashboard/MonthlyComparisonChart';
import { SpendingInsightsCard } from '@/components/dashboard/SpendingInsightsCard';
import { SpendingHeatmap } from '@/components/dashboard/SpendingHeatmap';
import { AddExpenseModal } from '@/components/transactions/AddExpenseModal';
import { useExpense } from '@/context/ExpenseContext';
import { useAuth } from '@/context/AuthContext';
import Link from 'next/link';
import { ArrowRight, Smartphone, ShieldCheck, Zap, User, Plus } from 'lucide-react';

export default function DashboardPage() {
  const { pendingCount, transactions } = useExpense();
  const { user } = useAuth();
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);

  const firstName = user?.name ? user.name.split(' ')[0] : 'there';

  return (
    <div className="space-y-6">
      {/* Top Banner / Welcome with Apple Shortcuts Automation Status */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-zinc-900 via-zinc-900 to-zinc-950 border border-zinc-800 p-6 sm:p-8 shadow-xl">
        <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div className="space-y-1.5 max-w-2xl">
            <div className="flex flex-wrap items-center gap-2">
              <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-xs font-semibold">
                <Zap className="w-3.5 h-3.5" />
                <span>Apple Shortcuts Bank SMS Engine Active</span>
              </div>
              {user && (
                <div className="inline-flex items-center space-x-1.5 px-2.5 py-1 rounded-full bg-zinc-800 border border-zinc-700 text-zinc-300 text-xs">
                  <span className="w-2 h-2 rounded-full bg-emerald-400" />
                  <span className="font-mono text-[11px]">{user.email}</span>
                </div>
              )}
            </div>

            <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
              Welcome back, {firstName}
            </h1>
            <p className="text-sm text-zinc-400">
              Personalized for your bank accounts. Transactions from HDFC, SBI, ICICI & Federal Bank are captured automatically from your iPhone.
              Your only regular manual task is selecting the category.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <button
              onClick={() => setIsAddModalOpen(true)}
              className="inline-flex items-center space-x-1.5 px-4 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-zinc-950 text-xs font-bold shadow-lg shadow-emerald-500/20 transition active:scale-95"
            >
              <Plus className="w-4 h-4" />
              <span>Add Expense</span>
            </button>

            <Link
              href="/transactions"
              className="inline-flex items-center space-x-2 px-4 py-2 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-200 text-xs font-semibold border border-zinc-700 transition"
            >
              <Smartphone className="w-4 h-4 text-emerald-400" />
              <span>View Transactions</span>
            </Link>

            <Link
              href="/shortcuts-guide"
              className="inline-flex items-center space-x-2 px-4 py-2 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-200 text-xs font-semibold border border-zinc-700 transition"
            >
              <span>Setup Mobile Automation</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>

        {/* Ambient subtle light gradient */}
        <div className="absolute -top-24 -right-24 w-96 h-96 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />
      </div>

      {/* Section A: Financial Overview KPI Cards */}
      <FinancialOverviewCards />

      {/* Section B & C: Spending Trend & Category Donut Breakdown */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <SpendingTrendChart />
        <CategoryDonutChart />
      </div>

      {/* Section D & Heatmap: Daily Spending Bar & Spending Calendar Heatmap */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <DailySpendingBarChart />
        <SpendingHeatmap />
      </div>

      {/* Section E: Month-over-Month Comparison */}
      <MonthlyComparisonChart />

      {/* Section F: Spending Intelligence Insights */}
      <SpendingInsightsCard />

      {/* Manual Expense Entry Modal */}
      <AddExpenseModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
      />
    </div>
  );
}

