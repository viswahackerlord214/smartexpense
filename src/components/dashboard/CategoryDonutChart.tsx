'use client';

import React, { useState } from 'react';
import { useExpense } from '@/context/ExpenseContext';
import { computeCategoryBreakdown } from '@/lib/analytics/spending-insights';
import { ResponsiveContainer, PieChart, Pie, Cell, Tooltip } from 'recharts';
import { CategoryIcon } from '@/components/ui/CategoryIcon';
import Link from 'next/link';

export function CategoryDonutChart() {
  const { transactions, categories } = useExpense();
  const [hoveredIdx, setHoveredIdx] = useState<number | null>(null);

  const breakdown = computeCategoryBreakdown(transactions, categories);
  const totalAmount = breakdown.reduce((acc, curr) => acc + curr.amount, 0);

  const activeItem = hoveredIdx !== null ? breakdown[hoveredIdx] : null;

  return (
    <div className="rounded-2xl bg-zinc-900/80 border border-zinc-800 p-5 shadow-lg backdrop-blur-sm flex flex-col justify-between">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-sm font-semibold text-white tracking-tight">Category Breakdown</h3>
          <p className="text-xs text-zinc-400">Tap segment to inspect transactions</p>
        </div>
        <Link
          href="/transactions"
          className="text-xs text-emerald-400 hover:text-emerald-300 font-medium"
        >
          View Table
        </Link>
      </div>

      {breakdown.length === 0 || totalAmount === 0 ? (
        <div className="h-56 flex flex-col items-center justify-center text-center p-6 rounded-xl bg-zinc-950/40 border border-dashed border-zinc-800">
          <div className="w-10 h-10 rounded-full bg-zinc-900 flex items-center justify-center text-zinc-500 mb-2">
            ₹
          </div>
          <div className="text-xs font-semibold text-zinc-300">No categorized expenses yet</div>
          <p className="text-[11px] text-zinc-500 max-w-xs mt-1">
            Whenever a bank transaction SMS arrives on your iPhone, tap the notification to categorize it.
          </p>
        </div>
      ) : (
        <div className="flex flex-col md:flex-row items-center gap-6">
          {/* Donut Chart with Center Label */}
          <div className="relative w-48 h-48 sm:w-56 sm:h-56 shrink-0 flex items-center justify-center">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={breakdown}
                  cx="50%"
                  cy="50%"
                  innerRadius={62}
                  outerRadius={88}
                  paddingAngle={3}
                  dataKey="amount"
                  onMouseEnter={(_, index) => setHoveredIdx(index)}
                  onMouseLeave={() => setHoveredIdx(null)}
                >
                  {breakdown.map((entry, index) => (
                    <Cell
                      key={`cell-${entry.id}`}
                      fill={entry.color}
                      stroke="#18181b"
                      strokeWidth={2}
                      className="cursor-pointer transition-transform hover:opacity-90"
                    />
                  ))}
                </Pie>
                <Tooltip
                  content={({ active, payload }) => {
                    if (active && payload && payload.length) {
                      const data = payload[0].payload;
                      return (
                        <div className="rounded-xl bg-zinc-950 border border-zinc-800 p-2.5 shadow-xl text-xs">
                          <div className="font-semibold text-white">{data.name}</div>
                          <div className="text-emerald-400 font-bold">
                            ₹{data.amount.toLocaleString('en-IN')} ({data.percentage}%)
                          </div>
                          <div className="text-zinc-500 text-[10px]">{data.count} transactions</div>
                        </div>
                      );
                    }
                    return null;
                  }}
                />
              </PieChart>
            </ResponsiveContainer>

            {/* Center Content */}
            <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none text-center p-2">
              <span className="text-[11px] text-zinc-400 font-medium">
                {activeItem ? activeItem.name : 'Total Outlays'}
              </span>
              <span className="text-sm sm:text-base font-extrabold text-white tracking-tight">
                ₹{(activeItem ? activeItem.amount : totalAmount).toLocaleString('en-IN')}
              </span>
              {activeItem && (
                <span className="text-[10px] text-emerald-400 font-bold">
                  {activeItem.percentage}%
                </span>
              )}
            </div>
          </div>

          {/* Legend / Category List with Progress bars */}
          <div className="w-full space-y-2 overflow-y-auto max-h-56 pr-1">
            {breakdown.map((item, index) => (
              <Link
                key={item.id}
                href={`/transactions?category=${item.id}`}
                onMouseEnter={() => setHoveredIdx(index)}
                onMouseLeave={() => setHoveredIdx(null)}
                className="flex items-center justify-between p-2 rounded-xl bg-zinc-950/60 hover:bg-zinc-800/80 border border-zinc-800/60 transition group cursor-pointer"
              >
                <div className="flex items-center space-x-2.5 min-w-0">
                  <div
                    className="w-7 h-7 rounded-lg flex items-center justify-center shrink-0"
                    style={{ backgroundColor: `${item.color}25`, color: item.color }}
                  >
                    <CategoryIcon name={item.icon} className="w-4 h-4" color={item.color} />
                  </div>
                  <div className="min-w-0">
                    <div className="text-xs font-medium text-zinc-200 truncate group-hover:text-white">
                      {item.name}
                    </div>
                    <div className="text-[10px] text-zinc-500">
                      {item.count} {item.count === 1 ? 'txn' : 'txns'}
                    </div>
                  </div>
                </div>

                <div className="text-right shrink-0">
                  <div className="text-xs font-bold text-white">
                    ₹{item.amount.toLocaleString('en-IN')}
                  </div>
                  <div className="text-[10px] text-zinc-400 font-medium">{item.percentage}%</div>
                </div>
              </Link>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

