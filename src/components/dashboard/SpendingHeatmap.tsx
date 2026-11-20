'use client';

import React, { useState } from 'react';
import { useExpense } from '@/context/ExpenseContext';
import { computeSpendingHeatmap } from '@/lib/analytics/spending-insights';
import { format } from 'date-fns';
import { Calendar as CalendarIcon, Info } from 'lucide-react';
import Link from 'next/link';

export function SpendingHeatmap() {
  const { transactions } = useExpense();
  const [hoveredDate, setHoveredDate] = useState<{ date: string; amount: number; count: number } | null>(null);

  const heatmap = computeSpendingHeatmap(transactions);

  const getIntensityClass = (level: number) => {
    switch (level) {
      case 4:
        return 'bg-emerald-400 border-emerald-300';
      case 3:
        return 'bg-emerald-600 border-emerald-500';
      case 2:
        return 'bg-emerald-800 border-emerald-700';
      case 1:
        return 'bg-emerald-950 border-emerald-900';
      default:
        return 'bg-zinc-900 border-zinc-800/80';
    }
  };

  return (
    <div className="rounded-2xl bg-zinc-900/80 border border-zinc-800 p-5 shadow-lg backdrop-blur-sm">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center space-x-2">
          <CalendarIcon className="w-4 h-4 text-emerald-400" />
          <h3 className="text-sm font-semibold text-white tracking-tight">Spending Heatmap</h3>
          <span className="text-xs text-zinc-400 font-normal">November 2026</span>
        </div>

        {/* Legend */}
        <div className="flex items-center space-x-1.5 text-[10px] text-zinc-400">
          <span>Less</span>
          <span className="w-2.5 h-2.5 rounded bg-zinc-900 border border-zinc-800" />
          <span className="w-2.5 h-2.5 rounded bg-emerald-950 border border-emerald-900" />
          <span className="w-2.5 h-2.5 rounded bg-emerald-800 border border-emerald-700" />
          <span className="w-2.5 h-2.5 rounded bg-emerald-600 border border-emerald-500" />
          <span className="w-2.5 h-2.5 rounded bg-emerald-400 border border-emerald-300" />
          <span>More</span>
        </div>
      </div>

      {/* Grid of days */}
      <div className="grid grid-cols-7 gap-2">
        {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((d) => (
          <div key={d} className="text-[10px] font-semibold text-zinc-500 text-center pb-1">
            {d}
          </div>
        ))}

        {heatmap.map((item) => {
          const d = new Date(item.date);
          const dayNum = d.getDate();
          return (
            <Link
              key={item.date}
              href={`/transactions?date=${item.date}`}
              onMouseEnter={() => setHoveredDate(item)}
              onMouseLeave={() => setHoveredDate(null)}
              className={`relative aspect-square rounded-xl border flex flex-col items-center justify-center p-1 cursor-pointer transition-all hover:scale-105 hover:z-10 ${getIntensityClass(
                item.level
              )}`}
            >
              <span className={`text-[11px] font-bold ${item.level >= 3 ? 'text-zinc-950' : 'text-zinc-300'}`}>
                {dayNum}
              </span>
              {item.amount > 0 && (
                <span className={`text-[9px] font-medium leading-none mt-0.5 truncate max-w-full ${item.level >= 3 ? 'text-zinc-900 font-semibold' : 'text-zinc-400'}`}>
                  ₹{item.amount >= 1000 ? `${(item.amount / 1000).toFixed(1)}k` : item.amount}
                </span>
              )}
            </Link>
          );
        })}
      </div>

      {/* Hover tooltip bar */}
      <div className="mt-3 py-1.5 px-3 rounded-xl bg-zinc-950/60 border border-zinc-800/60 text-xs flex items-center justify-between text-zinc-400 min-h-[32px]">
        {hoveredDate ? (
          <>
            <span>{format(new Date(hoveredDate.date), 'EEEE, MMMM dd, yyyy')}:</span>
            <span className="font-bold text-white">
              ₹{hoveredDate.amount.toLocaleString('en-IN')} ({hoveredDate.count} {hoveredDate.count === 1 ? 'transaction' : 'transactions'})
            </span>
          </>
        ) : (
          <span className="text-[11px] text-zinc-500 flex items-center space-x-1">
            <Info className="w-3.5 h-3.5 mr-1" />
            Hover over any day to view spending intensity. Click to open transactions.
          </span>
        )}
      </div>
    </div>
  );
}

