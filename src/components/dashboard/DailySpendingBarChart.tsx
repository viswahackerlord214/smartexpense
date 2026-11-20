'use client';

import React, { useState } from 'react';
import { useExpense } from '@/context/ExpenseContext';
import { computeDailySpending } from '@/lib/analytics/spending-insights';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Cell,
} from 'recharts';
import { format } from 'date-fns';
import { X, Calendar, ArrowRight } from 'lucide-react';
import Link from 'next/link';

export function DailySpendingBarChart() {
  const { transactions } = useExpense();
  const [selectedDay, setSelectedDay] = useState<string | null>(null);

  const dailyData = computeDailySpending(transactions);

  // Transactions for selected day
  const selectedDayTxns = selectedDay
    ? transactions.filter((t) => t.transaction_date.startsWith(selectedDay))
    : [];

  return (
    <div className="rounded-2xl bg-zinc-900/80 border border-zinc-800 p-5 shadow-lg backdrop-blur-sm flex flex-col justify-between">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-sm font-semibold text-white tracking-tight">Daily Spending Rhythm</h3>
          <p className="text-xs text-zinc-400">Click any day to drill into transactions</p>
        </div>
        <div className="text-xs text-zinc-400 font-medium">November 2026</div>
      </div>

      <div className="h-52 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart
            data={dailyData}
            margin={{ top: 5, right: 5, left: -25, bottom: 0 }}
            onClick={(state) => {
              if (state && state.activePayload && state.activePayload.length) {
                const date = state.activePayload[0].payload.date;
                setSelectedDay(date);
              }
            }}
          >
            <XAxis
              dataKey="date"
              stroke="#71717a"
              fontSize={10}
              tickLine={false}
              axisLine={false}
              tickFormatter={(d) => format(new Date(d), 'd')}
            />
            <YAxis
              stroke="#71717a"
              fontSize={10}
              tickLine={false}
              axisLine={false}
              tickFormatter={(v) => `₹${v >= 1000 ? `${(v / 1000).toFixed(0)}k` : v}`}
            />
            <Tooltip
              cursor={{ fill: 'rgba(255, 255, 255, 0.05)' }}
              content={({ active, payload }) => {
                if (active && payload && payload.length) {
                  const data = payload[0].payload;
                  return (
                    <div className="rounded-xl bg-zinc-950 border border-zinc-800 p-2.5 shadow-xl text-xs">
                      <div className="text-zinc-400 font-medium">{format(new Date(data.date), 'EEE, MMM dd')}</div>
                      <div className="text-emerald-400 font-bold text-sm">
                        ₹{data.amount.toLocaleString('en-IN')}
                      </div>
                      <div className="text-zinc-500 text-[10px]">{data.count} transactions (click to inspect)</div>
                    </div>
                  );
                }
                return null;
              }}
            />
            <Bar dataKey="amount" radius={[4, 4, 0, 0]}>
              {dailyData.map((entry) => (
                <Cell
                  key={`day-${entry.date}`}
                  fill={selectedDay === entry.date ? '#10B981' : entry.amount > 0 ? '#059669' : '#27272a'}
                  className="cursor-pointer transition-colors hover:fill-emerald-400"
                />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Selected Day Transactions Drawer */}
      {selectedDay && (
        <div className="mt-4 p-3.5 rounded-xl bg-zinc-950/80 border border-zinc-800 animate-fade-in">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center space-x-1.5 text-xs text-zinc-300 font-medium">
              <Calendar className="w-3.5 h-3.5 text-emerald-400" />
              <span>{format(new Date(selectedDay), 'MMMM dd, yyyy')}</span>
              <span className="text-zinc-500">• {selectedDayTxns.length} txns</span>
            </div>
            <button
              onClick={() => setSelectedDay(null)}
              className="text-zinc-500 hover:text-zinc-300 p-1"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>

          {selectedDayTxns.length === 0 ? (
            <div className="text-xs text-zinc-500 py-2 text-center">No transactions on this date</div>
          ) : (
            <div className="space-y-1.5 max-h-36 overflow-y-auto">
              {selectedDayTxns.map((t) => (
                <div
                  key={t.id}
                  className="flex items-center justify-between text-xs py-1 px-2 rounded-lg bg-zinc-900/60"
                >
                  <div className="truncate pr-2">
                    <span className="font-medium text-white">{t.merchant}</span>
                    <span className="text-[10px] text-zinc-500 ml-1.5">{t.bank_sender}</span>
                  </div>
                  <div className={`font-semibold shrink-0 ${t.transaction_type === 'debit' ? 'text-zinc-200' : 'text-emerald-400'}`}>
                    {t.transaction_type === 'debit' ? '-' : '+'}₹{t.amount.toLocaleString('en-IN')}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

