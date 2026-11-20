'use client';

import React from 'react';
import { Transaction, Category } from '@/types';
import { CategoryIcon } from '@/components/ui/CategoryIcon';
import { format } from 'date-fns';
import {
  ArrowDownLeft,
  ArrowUpRight,
  RotateCcw,
  AlertCircle,
  CheckCircle2,
  Download,
  Calendar,
  Layers,
} from 'lucide-react';

interface TransactionsTableProps {
  transactions: Transaction[];
  categories: Category[];
  onOpenCategorize: (transactionId: string) => void;
  groupBy: 'none' | 'day' | 'month';
  setGroupBy: (g: 'none' | 'day' | 'month') => void;
}

export function TransactionsTable({
  transactions,
  categories,
  onOpenCategorize,
  groupBy,
  setGroupBy,
}: TransactionsTableProps) {
  // Compute totals
  const totalDebit = transactions
    .filter((t) => t.transaction_type === 'debit')
    .reduce((acc, t) => acc + t.amount, 0);

  const totalCredit = transactions
    .filter((t) => t.transaction_type === 'credit')
    .reduce((acc, t) => acc + t.amount, 0);

  // CSV export handler
  const exportCSV = () => {
    const headers = ['Date', 'Merchant', 'Bank', 'Type', 'Amount', 'Category', 'Status', 'Reference'];
    const rows = transactions.map((t) => [
      format(new Date(t.transaction_date), 'yyyy-MM-dd HH:mm'),
      `"${t.merchant.replace(/"/g, '""')}"`,
      t.bank_sender,
      t.transaction_type,
      t.amount,
      `"${t.category?.name || 'Uncategorized'}"`,
      t.status,
      `"${t.transaction_reference || ''}"`,
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `SpendWise_Transactions_${format(new Date(), 'yyyyMMdd')}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-4">
      {/* Table Top Bar: Filter summary & Grouping & CSV Export */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 px-1">
        <div className="flex items-center space-x-3 text-xs text-zinc-400">
          <span>
            Showing <strong className="text-white">{transactions.length}</strong> transactions
          </span>
          <span>•</span>
          <span>
            Total Spent: <strong className="text-rose-400">₹{totalDebit.toLocaleString('en-IN')}</strong>
          </span>
          {totalCredit > 0 && (
            <>
              <span>•</span>
              <span>
                Income: <strong className="text-emerald-400">₹{totalCredit.toLocaleString('en-IN')}</strong>
              </span>
            </>
          )}
        </div>

        <div className="flex items-center space-x-2">
          {/* Grouping selector */}
          <div className="flex items-center bg-zinc-900 border border-zinc-800 rounded-xl p-1 text-xs">
            <Layers className="w-3.5 h-3.5 text-zinc-500 ml-1.5 mr-1" />
            {(['none', 'day', 'month'] as const).map((g) => (
              <button
                key={g}
                onClick={() => setGroupBy(g)}
                className={`px-2.5 py-1 rounded-lg capitalize transition ${
                  groupBy === g
                    ? 'bg-zinc-800 text-white font-semibold'
                    : 'text-zinc-400 hover:text-zinc-200'
                }`}
              >
                {g === 'none' ? 'Flat' : `By ${g}`}
              </button>
            ))}
          </div>

          {/* Export CSV button */}
          <button
            onClick={exportCSV}
            className="flex items-center space-x-1.5 px-3 py-1.5 rounded-xl bg-zinc-900 border border-zinc-800 text-xs font-semibold text-zinc-300 hover:text-white hover:border-zinc-700 transition"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Export CSV</span>
          </button>
        </div>
      </div>

      {/* Main Table Card */}
      <div className="rounded-2xl bg-zinc-900/90 border border-zinc-800 shadow-xl overflow-hidden backdrop-blur-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-zinc-950/80 border-b border-zinc-800 text-zinc-400 uppercase tracking-wider font-semibold">
              <tr>
                <th className="py-3 px-4">Merchant & Bank</th>
                <th className="py-3 px-4">Category</th>
                <th className="py-3 px-4">Date & Time</th>
                <th className="py-3 px-4">Type</th>
                <th className="py-3 px-4 text-right">Amount</th>
                <th className="py-3 px-4 text-center">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-800/60">
              {transactions.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-zinc-500">
                    No transactions match the selected filter criteria.
                  </td>
                </tr>
              ) : (
                transactions.map((txn) => {
                  const isPending = txn.status === 'pending_categorization';
                  const cat = txn.category || categories.find((c) => c.id === txn.category_id);

                  return (
                    <tr
                      key={txn.id}
                      className="hover:bg-zinc-800/40 transition group"
                    >
                      {/* Merchant & Bank */}
                      <td className="py-3.5 px-4">
                        <div className="flex items-center space-x-3">
                          <div
                            className="w-8 h-8 rounded-xl flex items-center justify-center shrink-0 border border-white/5 font-bold text-xs"
                            style={{
                              backgroundColor: cat ? `${cat.color}20` : '#27272a',
                              color: cat?.color || '#a1a1aa',
                            }}
                          >
                            {cat ? (
                              <CategoryIcon name={cat.icon} className="w-4 h-4" color={cat.color} />
                            ) : (
                              '?'
                            )}
                          </div>
                          <div className="min-w-0">
                            <div className="font-semibold text-white truncate group-hover:text-emerald-400 transition-colors">
                              {txn.merchant}
                            </div>
                            <div className="text-[11px] text-zinc-400 flex items-center space-x-1.5">
                              <span className="font-mono text-zinc-300 font-medium">
                                {txn.bank_sender}
                              </span>
                              {txn.card_last4 && <span>• Card **{txn.card_last4}</span>}
                              {txn.upi_ref && <span>• UPI {txn.upi_ref}</span>}
                            </div>
                          </div>
                        </div>
                      </td>

                      {/* Category (With 1-Tap Pill if Pending) */}
                      <td className="py-3.5 px-4">
                        {isPending ? (
                          <button
                            onClick={() => onOpenCategorize(txn.id)}
                            className="inline-flex items-center space-x-1 px-2.5 py-1 rounded-full bg-amber-500/15 border border-amber-500/30 text-amber-400 font-semibold text-[11px] hover:bg-amber-500 hover:text-zinc-950 transition active:scale-95"
                          >
                            <AlertCircle className="w-3 h-3" />
                            <span>Select Category</span>
                          </button>
                        ) : cat ? (
                          <button
                            onClick={() => onOpenCategorize(txn.id)}
                            className="inline-flex items-center space-x-1.5 px-2.5 py-1 rounded-lg bg-zinc-950 border border-zinc-800/80 hover:border-zinc-700 transition"
                          >
                            <span
                              className="w-2 h-2 rounded-full"
                              style={{ backgroundColor: cat.color }}
                            />
                            <span className="text-zinc-200 font-medium">{cat.name}</span>
                          </button>
                        ) : (
                          <span className="text-zinc-500">Unassigned</span>
                        )}
                      </td>

                      {/* Date & Time */}
                      <td className="py-3.5 px-4 text-zinc-300 whitespace-nowrap">
                        <div>{format(new Date(txn.transaction_date), 'MMM dd, yyyy')}</div>
                        <div className="text-[10px] text-zinc-500">
                          {format(new Date(txn.transaction_date), 'h:mm a')}
                        </div>
                      </td>

                      {/* Type Badge */}
                      <td className="py-3.5 px-4">
                        <span
                          className={`inline-flex items-center space-x-1 px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                            txn.transaction_type === 'debit'
                              ? 'bg-rose-500/10 text-rose-400 border border-rose-500/20'
                              : txn.transaction_type === 'credit'
                              ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                              : 'bg-blue-500/10 text-blue-400 border border-blue-500/20'
                          }`}
                        >
                          {txn.transaction_type === 'debit' ? (
                            <ArrowUpRight className="w-2.5 h-2.5" />
                          ) : (
                            <ArrowDownLeft className="w-2.5 h-2.5" />
                          )}
                          <span>{txn.transaction_type}</span>
                        </span>
                      </td>

                      {/* Amount */}
                      <td className="py-3.5 px-4 text-right">
                        <div
                          className={`font-extrabold text-sm ${
                            txn.transaction_type === 'debit'
                              ? 'text-white'
                              : 'text-emerald-400'
                          }`}
                        >
                          {txn.transaction_type === 'debit' ? '-' : '+'}₹
                          {txn.amount.toLocaleString('en-IN', {
                            minimumFractionDigits: 2,
                            maximumFractionDigits: 2,
                          })}
                        </div>
                      </td>

                      {/* Status */}
                      <td className="py-3.5 px-4 text-center">
                        {isPending ? (
                          <span className="inline-block w-2.5 h-2.5 rounded-full bg-amber-400 animate-ping" title="Needs Categorization" />
                        ) : (
                          <span title="Categorized" className="inline-flex items-center justify-center">
                            <CheckCircle2 className="w-4 h-4 text-emerald-500 inline-block" />
                          </span>
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
