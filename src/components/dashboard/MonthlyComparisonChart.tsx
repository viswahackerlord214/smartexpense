'use client';

import React, { useState, useMemo } from 'react';
import { useExpense } from '@/context/ExpenseContext';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  CartesianGrid,
} from 'recharts';
import { BarChart3, Info } from 'lucide-react';

const MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];

export function MonthlyComparisonChart() {
  const { transactions, categories } = useExpense();

  // Dynamically default to previous month and current month
  const [selectedMonths, setSelectedMonths] = useState<number[]>(() => {
    const cur = new Date().getMonth();
    const prev = (cur - 1 + 12) % 12;
    return [prev, cur].sort((a, b) => a - b);
  });

  const toggleMonth = (mIdx: number) => {
    if (selectedMonths.includes(mIdx)) {
      if (selectedMonths.length > 1) {
        setSelectedMonths(selectedMonths.filter((m) => m !== mIdx));
      }
    } else {
      setSelectedMonths([...selectedMonths, mIdx].sort((a, b) => a - b));
    }
  };

  // Compute total spending for each selected month based on actual transactions
  const monthTotals = useMemo(() => {
    return selectedMonths.map((mIdx) => {
      const total = transactions
        .filter((t) => {
          const d = new Date(t.transaction_date);
          return d.getMonth() === mIdx && t.transaction_type === 'debit';
        })
        .reduce((acc, t) => acc + t.amount, 0);

      return {
        mIdx,
        name: MONTH_NAMES[mIdx],
        shortName: MONTH_NAMES[mIdx].slice(0, 3),
        total,
      };
    });
  }, [transactions, selectedMonths]);

  const hasAnyExpenses = useMemo(() => {
    return monthTotals.some((m) => m.total > 0);
  }, [monthTotals]);

  // Compute category comparison data based strictly on user transactions
  const comparisonData = useMemo(() => {
    // 1. Find all categories that actually have debit transactions in the selected months
    const activeCategoryNames = new Map<string, number>();

    for (const t of transactions) {
      if (t.transaction_type !== 'debit') continue;
      const d = new Date(t.transaction_date);
      if (selectedMonths.includes(d.getMonth())) {
        const catName = t.category?.name || 'Uncategorized';
        activeCategoryNames.set(
          catName,
          (activeCategoryNames.get(catName) || 0) + t.amount
        );
      }
    }

    // 2. Determine target category list
    let targetCategoryNames: string[] = [];

    if (activeCategoryNames.size > 0) {
      // Sort categories with actual spending descending
      targetCategoryNames = Array.from(activeCategoryNames.entries())
        .sort((a, b) => b[1] - a[1])
        .slice(0, 6)
        .map(([name]) => name);
    } else {
      // If no expenses yet in selected months, show top standard categories with ₹0
      targetCategoryNames = categories.slice(0, 5).map((c) => c.name);
    }

    // 3. Build data rows for each category
    return targetCategoryNames.map((catName) => {
      const row: Record<string, any> = { category: catName };

      for (const mIdx of selectedMonths) {
        const monthName = MONTH_NAMES[mIdx];
        const monthTxns = transactions.filter((t) => {
          const d = new Date(t.transaction_date);
          const tCatName = t.category?.name || 'Uncategorized';
          return (
            d.getMonth() === mIdx &&
            t.transaction_type === 'debit' &&
            tCatName.toLowerCase() === catName.toLowerCase()
          );
        });

        // Strictly the user's real calculated total - NEVER fabricated static numbers
        const total = monthTxns.reduce((acc, t) => acc + t.amount, 0);
        row[monthName] = total;
      }

      return row;
    });
  }, [transactions, categories, selectedMonths]);

  const monthColors = ['#10B981', '#3B82F6', '#8B5CF6', '#EC4899', '#F97316', '#06B6D4'];

  return (
    <div className="rounded-2xl bg-zinc-900/80 border border-zinc-800 p-5 shadow-lg backdrop-blur-sm">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 mb-4">
        <div>
          <div className="flex items-center space-x-2">
            <h3 className="text-sm font-semibold text-white tracking-tight">Month-over-Month Comparison</h3>
            <span className="px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 text-[10px] font-bold border border-emerald-500/20">
              Live Expense Data
            </span>
          </div>
          <p className="text-xs text-zinc-400 mt-0.5">
            Compare category spending across selected calendar months
          </p>
        </div>

        {/* Month Selector Pills */}
        <div className="flex flex-wrap gap-1.5 max-w-md">
          {MONTH_NAMES.map((name, idx) => {
            const isSelected = selectedMonths.includes(idx);
            return (
              <button
                key={name}
                onClick={() => toggleMonth(idx)}
                className={`px-2.5 py-1 rounded-lg text-xs font-medium transition-all ${
                  isSelected
                    ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 shadow-sm'
                    : 'bg-zinc-950 text-zinc-400 border border-zinc-800 hover:text-zinc-200'
                }`}
              >
                {name.slice(0, 3)}
              </button>
            );
          })}
        </div>
      </div>

      {/* Selected Month Summary Badges */}
      <div className="flex flex-wrap items-center gap-2 mb-4 p-2.5 rounded-xl bg-zinc-950/60 border border-zinc-800/60">
        <span className="text-[11px] text-zinc-500 font-medium">Selected Periods:</span>
        {monthTotals.map((m, idx) => (
          <div
            key={m.name}
            className="flex items-center space-x-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold"
            style={{
              backgroundColor: `${monthColors[idx % monthColors.length]}15`,
              borderColor: `${monthColors[idx % monthColors.length]}30`,
              borderWidth: 1,
              color: monthColors[idx % monthColors.length],
            }}
          >
            <span>{m.name}:</span>
            <span className="font-bold text-white">₹{m.total.toLocaleString('en-IN')}</span>
          </div>
        ))}
      </div>

      {!hasAnyExpenses ? (
        <div className="h-56 w-full flex flex-col items-center justify-center p-6 rounded-xl bg-zinc-950/30 border border-dashed border-zinc-800/80 text-center">
          <div className="w-10 h-10 rounded-xl bg-zinc-800/60 flex items-center justify-center text-zinc-400 mb-2.5">
            <BarChart3 className="w-5 h-5 text-zinc-500" />
          </div>
          <h4 className="text-xs font-bold text-zinc-300">No Expense Data in Selected Months</h4>
          <p className="text-[11px] text-zinc-500 max-w-sm mt-1">
            As you log expenses manually or import bank SMS messages, your category-wise spending will compare here accurately in real-time.
          </p>
        </div>
      ) : (
        <div className="h-64 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={comparisonData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#27272a" vertical={false} />
              <XAxis
                dataKey="category"
                stroke="#71717a"
                fontSize={11}
                tickLine={false}
                axisLine={false}
              />
              <YAxis
                stroke="#71717a"
                fontSize={11}
                tickLine={false}
                axisLine={false}
                tickFormatter={(v) => `₹${v >= 1000 ? `${(v / 1000).toFixed(0)}k` : v}`}
              />
              <Tooltip
                content={({ active, payload, label }) => {
                  if (active && payload && payload.length) {
                    return (
                      <div className="rounded-xl bg-zinc-950 border border-zinc-800 p-3 shadow-xl text-xs space-y-1">
                        <div className="font-bold text-white mb-1.5">{label}</div>
                        {payload.map((item: any, i: number) => (
                          <div key={i} className="flex items-center justify-between space-x-3">
                            <span className="text-zinc-400 flex items-center space-x-1">
                              <span className="w-2 h-2 rounded-full" style={{ backgroundColor: item.color }} />
                              <span>{item.name}:</span>
                            </span>
                            <span className="font-bold text-white">
                              ₹{Number(item.value).toLocaleString('en-IN')}
                            </span>
                          </div>
                        ))}
                      </div>
                    );
                  }
                  return null;
                }}
              />
              <Legend
                wrapperStyle={{ fontSize: '11px', paddingTop: '10px' }}
                iconType="circle"
              />
              {selectedMonths.map((mIdx, i) => (
                <Bar
                  key={MONTH_NAMES[mIdx]}
                  dataKey={MONTH_NAMES[mIdx]}
                  fill={monthColors[i % monthColors.length]}
                  radius={[4, 4, 0, 0]}
                />
              ))}
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}
    </div>
  );
}
