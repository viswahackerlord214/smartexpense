'use client';

import React from 'react';
import { useExpense } from '@/context/ExpenseContext';
import { generateSpendingInsights } from '@/lib/analytics/spending-insights';
import { Sparkles, TrendingUp, TrendingDown, Store, AlertTriangle, Repeat, CheckCircle2 } from 'lucide-react';

export function SpendingInsightsCard() {
  const { transactions, categories } = useExpense();
  const insights = generateSpendingInsights(transactions, categories);

  const getIcon = (type: string, sentiment: string) => {
    switch (type) {
      case 'warning':
        return <AlertTriangle className="w-4 h-4 text-amber-400" />;
      case 'decrease':
        return <TrendingDown className="w-4 h-4 text-emerald-400" />;
      case 'increase':
        return <TrendingUp className="w-4 h-4 text-rose-400" />;
      case 'merchant':
        return <Store className="w-4 h-4 text-blue-400" />;
      case 'recurring':
        return <Repeat className="w-4 h-4 text-purple-400" />;
      default:
        return <Sparkles className="w-4 h-4 text-emerald-400" />;
    }
  };

  return (
    <div className="rounded-2xl bg-zinc-900/80 border border-zinc-800 p-5 shadow-lg backdrop-blur-sm">
      <div className="flex items-center space-x-2 mb-4">
        <Sparkles className="w-4 h-4 text-emerald-400" />
        <h3 className="text-sm font-semibold text-white tracking-tight">Fintech Intelligence & Insights</h3>
      </div>

      {insights.length === 0 ? (
        <div className="p-6 rounded-xl bg-zinc-950/40 border border-dashed border-zinc-800 text-center">
          <p className="text-xs text-zinc-400">
            Waiting for bank transaction data. SpendWise will automatically analyze spending velocity, peak days, and top merchants once bank SMS messages are received.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          {insights.map((insight) => (
            <div
              key={insight.id}
              className="p-3.5 rounded-xl bg-zinc-950/70 border border-zinc-800/80 hover:border-zinc-700/80 transition flex flex-col justify-between space-y-2"
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-zinc-200 flex items-center space-x-1.5">
                  {getIcon(insight.type, insight.sentiment)}
                  <span>{insight.title}</span>
                </span>
                {insight.metric && (
                  <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-zinc-800 text-zinc-200 border border-zinc-700">
                    {insight.metric}
                  </span>
                )}
              </div>

              <p className="text-xs text-zinc-400 leading-relaxed">
                {insight.description}
              </p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

