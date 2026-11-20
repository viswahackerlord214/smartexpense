'use client';

import React, { useState, useMemo } from 'react';
import { useExpense } from '@/context/ExpenseContext';
import { computeFinancialOverview, computeDailySpending, detectRecurringExpenses } from '@/lib/analytics/spending-insights';
import { SpendingHeatmap } from '@/components/dashboard/SpendingHeatmap';
import { CategoryDonutChart } from '@/components/dashboard/CategoryDonutChart';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  Cell,
} from 'recharts';
import { format, getDay } from 'date-fns';
import {
  PieChart,
  TrendingUp,
  Download,
  Calendar,
  Repeat,
  Store,
  Clock,
  ArrowUpRight,
  ArrowDownRight,
  Layers,
} from 'lucide-react';

export default function AnalyticsPage() {
  const { transactions, categories } = useExpense();
  const [selectedMonth, setSelectedMonth] = useState('2026-11');

  const overview = computeFinancialOverview(transactions);
  const daily = computeDailySpending(transactions);
  const recurring = detectRecurringExpenses(transactions);

  // Highest and lowest spending day
  const { highestDay, lowestDay } = useMemo(() => {
    const daysWithSpend = daily.filter((d) => d.amount > 0);
    if (daysWithSpend.length === 0) return { highestDay: null, lowestDay: null };

    const sorted = [...daysWithSpend].sort((a, b) => b.amount - a.amount);
    return {
      highestDay: sorted[0],
      lowestDay: sorted[sorted.length - 1],
    };
  }, [daily]);

  // Merchant-wise ranking
  const merchantRanking = useMemo(() => {
    const map: Record<string, { amount: number; count: number; bank: string }> = {};
    for (const t of transactions) {
      if (t.transaction_type === 'debit') {
        if (!map[t.merchant]) {
          map[t.merchant] = { amount: 0, count: 0, bank: t.bank_sender };
        }
        map[t.merchant].amount += t.amount;
        map[t.merchant].count++;
      }
    }
    return Object.entries(map)
      .map(([name, data]) => ({ name, ...data }))
      .sort((a, b) => b.amount - a.amount)
      .slice(0, 8);
  }, [transactions]);

  // Weekday vs Weekend spending
  const dayOfWeekData = useMemo(() => {
    const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    const totals = [0, 0, 0, 0, 0, 0, 0];
    const counts = [0, 0, 0, 0, 0, 0, 0];

    for (const t of transactions) {
      if (t.transaction_type === 'debit') {
        const d = getDay(new Date(t.transaction_date));
        totals[d] += t.amount;
        counts[d]++;
      }
    }

    return days.map((name, i) => ({
      day: name,
      amount: totals[i],
      count: counts[i],
      isWeekend: i === 0 || i === 6,
    }));
  }, [transactions]);

  // Export report as CSV
  const handleExportReport = () => {
    const reportData = [
      ['Metric', 'Value'],
      ['Report Period', 'November 2026'],
      ['Total Outlays (INR)', overview.totalExpense],
      ['Total Income (INR)', overview.totalIncome],
      ['Net Cash Flow (INR)', overview.netCashFlow],
      ['Average Daily Spend (INR)', overview.averageDailySpending],
      ['Top Category', overview.highestCategory?.name || 'N/A'],
      ['Top Category Amount (INR)', overview.highestCategory?.amount || 0],
      ['Highest Spending Day', highestDay ? `${highestDay.date} (INR ${highestDay.amount})` : 'N/A'],
      ['Recurring Commitments Count', recurring.length],
      ['Total Transactions Tracked', overview.totalTransactionsCount],
    ];

    const csv = 'data:text/csv;charset=utf-8,' + reportData.map((e) => e.join(',')).join('\n');
    const link = document.createElement('a');
    link.setAttribute('href', encodeURI(csv));
    link.setAttribute('download', `SpendWise_Financial_Report_${selectedMonth}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-white tracking-tight">Monthly Expense Analytics</h1>
          <p className="text-xs text-zinc-400 mt-1">
            In-depth spending distributions, recurring commitments, merchant patterns & rhythms
          </p>
        </div>

        <button
          onClick={handleExportReport}
          className="flex items-center space-x-1.5 px-4 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-zinc-950 font-bold text-xs shadow-lg shadow-emerald-500/20 transition active:scale-95"
        >
          <Download className="w-4 h-4" />
          <span>Export Monthly Statement</span>
        </button>
      </div>

      {/* Key Analytical Metrics Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-4 rounded-2xl bg-zinc-900/80 border border-zinc-800">
          <div className="text-xs text-zinc-400 uppercase font-semibold">Monthly Outlay</div>
          <div className="text-2xl font-extrabold text-white mt-1">
            ₹{overview.totalExpense.toLocaleString('en-IN')}
          </div>
          <div className="text-xs text-emerald-400 mt-1 flex items-center space-x-1">
            <TrendingUp className="w-3.5 h-3.5" />
            <span>Average ₹{overview.averageDailySpending.toLocaleString('en-IN')} / day</span>
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-zinc-900/80 border border-zinc-800">
          <div className="text-xs text-zinc-400 uppercase font-semibold">Highest Spending Day</div>
          <div className="text-2xl font-extrabold text-amber-400 mt-1">
            {highestDay ? `₹${highestDay.amount.toLocaleString('en-IN')}` : '₹0'}
          </div>
          <div className="text-xs text-zinc-400 mt-1">
            {highestDay ? format(new Date(highestDay.date), 'EEEE, MMM dd') : 'No data'}
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-zinc-900/80 border border-zinc-800">
          <div className="text-xs text-zinc-400 uppercase font-semibold">Recurring Bills</div>
          <div className="text-2xl font-extrabold text-purple-400 mt-1">
            {recurring.length} <span className="text-sm font-normal text-zinc-400">commitments</span>
          </div>
          <div className="text-xs text-zinc-400 mt-1">
            ₹{recurring.reduce((a, b) => a + b.amount, 0).toLocaleString('en-IN')} / month
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-zinc-900/80 border border-zinc-800">
          <div className="text-xs text-zinc-400 uppercase font-semibold">Discretionary Ratio</div>
          <div className="text-2xl font-extrabold text-blue-400 mt-1">
            {overview.totalIncome > 0
              ? `${Math.round((overview.totalExpense / overview.totalIncome) * 100)}%`
              : 'N/A'}
          </div>
          <div className="text-xs text-zinc-400 mt-1">
            Spend to income utilization
          </div>
        </div>
      </div>

      {/* Heatmap & Donut */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <SpendingHeatmap />
        <CategoryDonutChart />
      </div>

      {/* Weekday vs Weekend spending Bar Chart */}
      <div className="rounded-2xl bg-zinc-900/80 border border-zinc-800 p-5 shadow-lg backdrop-blur-sm">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-sm font-semibold text-white tracking-tight">Weekday vs. Weekend Spending Pattern</h3>
            <p className="text-xs text-zinc-400">Total expenditure mapped across days of the week</p>
          </div>
          <div className="text-xs text-zinc-400 font-medium">All Bank Sources</div>
        </div>

        <div className="h-56 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={dayOfWeekData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#27272a" vertical={false} />
              <XAxis dataKey="day" stroke="#71717a" fontSize={11} tickLine={false} axisLine={false} />
              <YAxis
                stroke="#71717a"
                fontSize={11}
                tickLine={false}
                axisLine={false}
                tickFormatter={(v) => `₹${v >= 1000 ? `${(v / 1000).toFixed(0)}k` : v}`}
              />
              <Tooltip
                content={({ active, payload }) => {
                  if (active && payload && payload.length) {
                    const data = payload[0].payload;
                    return (
                      <div className="rounded-xl bg-zinc-950 border border-zinc-800 p-2.5 shadow-xl text-xs">
                        <div className="font-bold text-white">{data.day}</div>
                        <div className="text-emerald-400 font-bold text-sm">
                          ₹{data.amount.toLocaleString('en-IN')}
                        </div>
                        <div className="text-zinc-500 text-[10px]">{data.count} transactions</div>
                      </div>
                    );
                  }
                  return null;
                }}
              />
              <Bar dataKey="amount" radius={[6, 6, 0, 0]}>
                {dayOfWeekData.map((entry) => (
                  <Cell
                    key={entry.day}
                    fill={entry.isWeekend ? '#8B5CF6' : '#10B981'}
                  />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Merchant Ranking and Recurring Subscriptions Side-by-Side */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Merchant Leaderboard */}
        <div className="rounded-2xl bg-zinc-900/80 border border-zinc-800 p-5 shadow-lg backdrop-blur-sm">
          <div className="flex items-center space-x-2 mb-4">
            <Store className="w-4 h-4 text-emerald-400" />
            <h3 className="text-sm font-semibold text-white tracking-tight">Top Merchant Destinations</h3>
          </div>

          <div className="space-y-2.5">
            {merchantRanking.map((m, idx) => (
              <div
                key={m.name}
                className="flex items-center justify-between p-2.5 rounded-xl bg-zinc-950/60 border border-zinc-800/60"
              >
                <div className="flex items-center space-x-3">
                  <span className="w-5 text-center font-mono font-bold text-xs text-zinc-500">
                    #{idx + 1}
                  </span>
                  <div>
                    <div className="text-xs font-semibold text-zinc-200">{m.name}</div>
                    <div className="text-[10px] text-zinc-500">{m.bank} • {m.count} txns</div>
                  </div>
                </div>

                <div className="text-right">
                  <div className="text-xs font-bold text-white">
                    ₹{m.amount.toLocaleString('en-IN')}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Recurring Expense Detector */}
        <div className="rounded-2xl bg-zinc-900/80 border border-zinc-800 p-5 shadow-lg backdrop-blur-sm">
          <div className="flex items-center space-x-2 mb-4">
            <Repeat className="w-4 h-4 text-purple-400" />
            <h3 className="text-sm font-semibold text-white tracking-tight">Detected Recurring Expenses</h3>
          </div>

          <div className="space-y-2.5">
            {recurring.map((rec) => (
              <div
                key={rec.merchant}
                className="flex items-center justify-between p-3 rounded-xl bg-purple-950/20 border border-purple-800/30"
              >
                <div className="flex items-center space-x-2.5">
                  <div className="w-8 h-8 rounded-lg bg-purple-500/20 text-purple-400 flex items-center justify-center">
                    <Repeat className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="text-xs font-semibold text-white">{rec.merchant}</div>
                    <div className="text-[10px] text-purple-300">Automated Monthly Schedule</div>
                  </div>
                </div>

                <div className="text-right">
                  <div className="text-xs font-extrabold text-white">
                    ₹{rec.amount.toLocaleString('en-IN')}{' '}
                    <span className="text-[10px] font-normal text-zinc-400">/mo</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

