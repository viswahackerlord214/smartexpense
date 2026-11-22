'use client';

import React, { useState, useEffect } from 'react';
import { useExpense } from '@/context/ExpenseContext';
import { TransactionType } from '@/types';
import { CategoryIcon } from '@/components/ui/CategoryIcon';
import {
  X,
  Plus,
  ArrowUpRight,
  ArrowDownLeft,
  Calendar,
  CreditCard,
  Tag,
  Store,
  FileText,
  Loader2,
  CheckCircle2,
} from 'lucide-react';
import { format } from 'date-fns';

interface AddExpenseModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const PAYMENT_METHODS = [
  'UPI',
  'Credit Card',
  'Debit Card',
  'Cash',
  'Net Banking',
  'HDFC Bank',
  'SBI',
  'ICICI Bank',
  'Other',
];

export function AddExpenseModal({ isOpen, onClose }: AddExpenseModalProps) {
  const { categories, addTransaction } = useExpense();

  const [type, setType] = useState<TransactionType>('debit');
  const [amount, setAmount] = useState('');
  const [merchant, setMerchant] = useState('');
  const [categoryId, setCategoryId] = useState<string>('');
  const [dateTime, setDateTime] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('UPI');
  const [notes, setNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  // Set default current local datetime whenever modal opens
  useEffect(() => {
    if (isOpen) {
      const now = new Date();
      // Format as YYYY-MM-DDTHH:mm for datetime-local
      const formatted = format(now, "yyyy-MM-dd'T'HH:mm");
      setDateTime(formatted);
      setAmount('');
      setMerchant('');
      setCategoryId('');
      setPaymentMethod('UPI');
      setNotes('');
      setError(null);
      setSuccess(false);
    }
  }, [isOpen]);

  // Handle escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const parsedAmount = parseFloat(amount);
    if (isNaN(parsedAmount) || parsedAmount <= 0) {
      setError('Please enter a valid amount greater than ₹0');
      return;
    }

    if (!merchant.trim()) {
      setError('Please enter a merchant or description');
      return;
    }

    setIsSubmitting(true);
    try {
      const selectedCat = categories.find((c) => c.id === categoryId);

      const txnDate = dateTime ? new Date(dateTime).toISOString() : new Date().toISOString();

      const newTxn = await addTransaction({
        amount: parsedAmount,
        currency: 'INR',
        transaction_type: type,
        merchant: merchant.trim(),
        bank_sender: paymentMethod,
        account_type: paymentMethod.toLowerCase().includes('card') ? 'credit_card' : 'savings',
        transaction_date: txnDate,
        category_id: categoryId || undefined,
        status: categoryId ? 'categorized' : 'pending_categorization',
        notes: notes.trim() || undefined,
        confidence_score: 1.0,
      });

      if (newTxn) {
        setSuccess(true);
        setTimeout(() => {
          onClose();
        }, 600);
      } else {
        setError('Failed to save expense. Please check your connection and try again.');
      }
    } catch (err: any) {
      setError(err?.message || 'An error occurred while saving the transaction');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div
        className="relative w-full max-w-lg rounded-3xl bg-zinc-900 border border-zinc-800 shadow-2xl overflow-hidden p-6 text-zinc-100 space-y-5"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="flex items-center justify-between border-b border-zinc-800/80 pb-4">
          <div className="flex items-center space-x-2.5">
            <div className="w-9 h-9 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 flex items-center justify-center">
              <Plus className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white tracking-tight">Manual Transaction Entry</h2>
              <p className="text-xs text-zinc-400">Add an expense or income to your tracker</p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-xl text-zinc-400 hover:text-white hover:bg-zinc-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Expense vs Income Toggle */}
        <div className="grid grid-cols-2 gap-2 p-1 rounded-2xl bg-zinc-950 border border-zinc-800">
          <button
            type="button"
            onClick={() => setType('debit')}
            className={`flex items-center justify-center space-x-2 py-2 rounded-xl text-xs font-bold transition ${
              type === 'debit'
                ? 'bg-rose-500/20 text-rose-300 border border-rose-500/40 shadow-sm'
                : 'text-zinc-400 hover:text-zinc-200'
            }`}
          >
            <ArrowUpRight className="w-3.5 h-3.5" />
            <span>Expense (Debit)</span>
          </button>

          <button
            type="button"
            onClick={() => setType('credit')}
            className={`flex items-center justify-center space-x-2 py-2 rounded-xl text-xs font-bold transition ${
              type === 'credit'
                ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 shadow-sm'
                : 'text-zinc-400 hover:text-zinc-200'
            }`}
          >
            <ArrowDownLeft className="w-3.5 h-3.5" />
            <span>Income (Credit)</span>
          </button>
        </div>

        {error && (
          <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-400 text-xs">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Amount Input */}
          <div>
            <label className="block text-xs font-medium text-zinc-400 mb-1.5">
              Amount (INR) <span className="text-rose-400">*</span>
            </label>
            <div className="relative rounded-2xl bg-zinc-950 border border-zinc-800 focus-within:border-emerald-500 focus-within:ring-1 focus-within:ring-emerald-500 transition">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-xl font-bold text-zinc-500">
                ₹
              </span>
              <input
                type="number"
                step="0.01"
                min="0.01"
                autoFocus
                placeholder="0.00"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                className="w-full bg-transparent pl-10 pr-4 py-3.5 text-2xl font-extrabold text-white placeholder-zinc-600 focus:outline-none"
                required
              />
            </div>
          </div>

          {/* Merchant / Description */}
          <div>
            <label className="block text-xs font-medium text-zinc-400 mb-1.5">
              Merchant / Description <span className="text-rose-400">*</span>
            </label>
            <div className="relative rounded-xl bg-zinc-950 border border-zinc-800 focus-within:border-emerald-500 transition">
              <Store className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
              <input
                type="text"
                placeholder="e.g. Swiggy, Starbucks, Milk & Groceries, Uber"
                value={merchant}
                onChange={(e) => setMerchant(e.target.value)}
                className="w-full bg-transparent pl-10 pr-4 py-2.5 text-xs text-white placeholder-zinc-600 focus:outline-none"
                required
              />
            </div>
          </div>

          {/* Category & Payment Method Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {/* Category */}
            <div>
              <label className="block text-xs font-medium text-zinc-400 mb-1.5">Category</label>
              <div className="relative rounded-xl bg-zinc-950 border border-zinc-800 focus-within:border-emerald-500 transition">
                <Tag className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500 pointer-events-none" />
                <select
                  value={categoryId}
                  onChange={(e) => setCategoryId(e.target.value)}
                  className="w-full bg-transparent pl-9 pr-8 py-2.5 text-xs text-white appearance-none focus:outline-none cursor-pointer"
                >
                  <option value="" className="bg-zinc-900 text-zinc-400">
                    -- Select Category (Optional) --
                  </option>
                  {categories.map((c) => (
                    <option key={c.id} value={c.id} className="bg-zinc-900 text-white">
                      {c.name}
                    </option>
                  ))}
                </select>
                <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-zinc-500 text-[10px]">
                  ▼
                </div>
              </div>
            </div>

            {/* Payment Method / Bank */}
            <div>
              <label className="block text-xs font-medium text-zinc-400 mb-1.5">Payment Method</label>
              <div className="relative rounded-xl bg-zinc-950 border border-zinc-800 focus-within:border-emerald-500 transition">
                <CreditCard className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500 pointer-events-none" />
                <select
                  value={paymentMethod}
                  onChange={(e) => setPaymentMethod(e.target.value)}
                  className="w-full bg-transparent pl-9 pr-8 py-2.5 text-xs text-white appearance-none focus:outline-none cursor-pointer"
                >
                  {PAYMENT_METHODS.map((m) => (
                    <option key={m} value={m} className="bg-zinc-900 text-white">
                      {m}
                    </option>
                  ))}
                </select>
                <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-zinc-500 text-[10px]">
                  ▼
                </div>
              </div>
            </div>
          </div>

          {/* Date & Time */}
          <div>
            <label className="block text-xs font-medium text-zinc-400 mb-1.5">Date & Time</label>
            <div className="relative rounded-xl bg-zinc-950 border border-zinc-800 focus-within:border-emerald-500 transition">
              <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500 pointer-events-none" />
              <input
                type="datetime-local"
                value={dateTime}
                onChange={(e) => setDateTime(e.target.value)}
                className="w-full bg-transparent pl-10 pr-4 py-2.5 text-xs text-white focus:outline-none scheme-dark"
                required
              />
            </div>
          </div>

          {/* Notes (Optional) */}
          <div>
            <label className="block text-xs font-medium text-zinc-400 mb-1.5">Notes / Reference (Optional)</label>
            <div className="relative rounded-xl bg-zinc-950 border border-zinc-800 focus-within:border-emerald-500 transition">
              <FileText className="absolute left-3 top-3 w-4 h-4 text-zinc-500" />
              <textarea
                rows={2}
                placeholder="Add any additional details or tags..."
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                className="w-full bg-transparent pl-10 pr-3 py-2 text-xs text-white placeholder-zinc-600 focus:outline-none resize-none"
              />
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center justify-end space-x-3 pt-3 border-t border-zinc-800/80">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="px-4 py-2.5 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-300 font-semibold text-xs transition"
            >
              Cancel
            </button>

            <button
              type="submit"
              disabled={isSubmitting || success}
              className="flex items-center space-x-2 px-5 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-zinc-950 font-bold text-xs shadow-lg shadow-emerald-500/20 transition active:scale-95 disabled:opacity-50"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Saving...</span>
                </>
              ) : success ? (
                <>
                  <CheckCircle2 className="w-4 h-4 text-zinc-950" />
                  <span>Saved!</span>
                </>
              ) : (
                <>
                  <Plus className="w-4 h-4" />
                  <span>Save {type === 'debit' ? 'Expense' : 'Income'}</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
