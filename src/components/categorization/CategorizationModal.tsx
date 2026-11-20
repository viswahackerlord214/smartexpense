'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useExpense } from '@/context/ExpenseContext';
import { CategoryIcon } from '@/components/ui/CategoryIcon';
import { Check, X, Plus, Sparkles, Building2, Calendar, CreditCard } from 'lucide-react';
import { format } from 'date-fns';

export function CategorizationModal() {
  const {
    transactions,
    categories,
    activeCategorizeId,
    setActiveCategorizeId,
    categorizeTransaction,
    addCategory,
  } = useExpense();

  const [isSuccess, setIsSuccess] = useState(false);
  const [selectedCatName, setSelectedCatName] = useState('');
  const [isAddingCustom, setIsAddingCustom] = useState(false);
  const [customName, setCustomName] = useState('');
  const [customColor, setCustomColor] = useState('#10B981');

  const transaction = transactions.find((t) => t.id === activeCategorizeId);

  if (!activeCategorizeId || !transaction) {
    return null;
  }

  const handleSelectCategory = async (catId: string, catName: string) => {
    setSelectedCatName(catName);
    setIsSuccess(true);
    await categorizeTransaction(transaction.id, catId);

    // Auto-close after brief confirmation animation
    setTimeout(() => {
      setIsSuccess(false);
      setActiveCategorizeId(null);
      // Remove query param from URL cleanly
      if (typeof window !== 'undefined' && window.history.replaceState) {
        const url = new URL(window.location.href);
        url.searchParams.delete('categorize');
        window.history.replaceState({}, '', url.pathname);
      }
    }, 900);
  };

  const handleCreateCustom = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!customName.trim()) return;
    const newCat = await addCategory(customName.trim(), customColor, 'Tag');
    if (newCat) {
      setIsAddingCustom(false);
      setCustomName('');
      handleSelectCategory(newCat.id, newCat.name);
    }
  };

  const formattedAmount = `₹${transaction.amount.toLocaleString('en-IN', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/70 backdrop-blur-md">
        {/* Backdrop click to dismiss */}
        <div
          className="fixed inset-0"
          onClick={() => setActiveCategorizeId(null)}
        />

        <motion.div
          initial={{ opacity: 0, y: 100, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 100, scale: 0.95 }}
          transition={{ type: 'spring', damping: 25, stiffness: 300 }}
          className="relative w-full max-w-lg bg-zinc-950 border border-zinc-800 rounded-t-3xl sm:rounded-3xl shadow-2xl overflow-hidden z-10 max-h-[90vh] flex flex-col"
        >
          {/* Header banner */}
          <div className="p-6 border-b border-zinc-800/80 bg-gradient-to-b from-zinc-900/60 to-transparent flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <span className="flex h-2.5 w-2.5 relative">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
              </span>
              <span className="text-xs font-semibold tracking-wider uppercase text-emerald-400">
                Action Required • 1-Tap Categorization
              </span>
            </div>

            <button
              onClick={() => setActiveCategorizeId(null)}
              className="p-1.5 rounded-full text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800 transition"
              aria-label="Close"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Transaction Hero Info */}
          <div className="p-6 text-center border-b border-zinc-800/60 bg-zinc-900/30">
            <div className="text-xs text-zinc-400 font-medium mb-1">AUTOMATED SMS IMPORT</div>
            <div className="text-4xl font-extrabold tracking-tight text-white mb-2">
              {formattedAmount}
            </div>

            <div className="inline-flex items-center space-x-2 px-3 py-1 bg-zinc-800/70 rounded-full text-sm font-medium text-zinc-200 mb-3">
              <Building2 className="w-4 h-4 text-emerald-400" />
              <span>{transaction.merchant}</span>
            </div>

            <div className="flex items-center justify-center space-x-4 text-xs text-zinc-400">
              <span className="inline-flex items-center space-x-1">
                <CreditCard className="w-3.5 h-3.5 text-zinc-500" />
                <span>{transaction.bank_sender}</span>
              </span>
              <span>•</span>
              <span className="inline-flex items-center space-x-1">
                <Calendar className="w-3.5 h-3.5 text-zinc-500" />
                <span>{format(new Date(transaction.transaction_date), 'MMM dd, h:mm a')}</span>
              </span>
            </div>
          </div>

          {/* Content: Categories Grid or Success Overlay */}
          <div className="p-6 overflow-y-auto flex-1">
            {isSuccess ? (
              <motion.div
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                className="py-12 flex flex-col items-center justify-center text-center"
              >
                <div className="w-16 h-16 rounded-full bg-emerald-500/20 border border-emerald-500/50 flex items-center justify-center text-emerald-400 mb-4 animate-bounce">
                  <Check className="w-8 h-8 stroke-[3]" />
                </div>
                <h3 className="text-xl font-bold text-white mb-1">Categorized!</h3>
                <p className="text-sm text-zinc-400">
                  Assigned to <span className="text-emerald-400 font-semibold">{selectedCatName}</span>
                </p>
              </motion.div>
            ) : isAddingCustom ? (
              <form onSubmit={handleCreateCustom} className="space-y-4">
                <h4 className="text-sm font-semibold text-zinc-200">Create Custom Category</h4>
                <div>
                  <label className="text-xs text-zinc-400 block mb-1">Category Name</label>
                  <input
                    type="text"
                    value={customName}
                    onChange={(e) => setCustomName(e.target.value)}
                    placeholder="e.g. Pet Care, Books, Gadgets"
                    className="w-full px-3 py-2 bg-zinc-900 border border-zinc-700 rounded-xl text-white placeholder-zinc-500 focus:outline-none focus:border-emerald-500"
                    autoFocus
                  />
                </div>
                <div>
                  <label className="text-xs text-zinc-400 block mb-1">Color</label>
                  <div className="flex space-x-2">
                    {['#10B981', '#3B82F6', '#8B5CF6', '#EC4899', '#F97316', '#EAB308'].map((c) => (
                      <button
                        key={c}
                        type="button"
                        onClick={() => setCustomColor(c)}
                        className={`w-7 h-7 rounded-full border-2 ${customColor === c ? 'border-white scale-110' : 'border-transparent'}`}
                        style={{ backgroundColor: c }}
                      />
                    ))}
                  </div>
                </div>
                <div className="flex space-x-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setIsAddingCustom(false)}
                    className="flex-1 py-2 px-3 rounded-xl border border-zinc-700 text-zinc-300 hover:bg-zinc-800 text-sm font-medium"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="flex-1 py-2 px-3 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-zinc-950 text-sm font-semibold"
                  >
                    Save & Select
                  </button>
                </div>
              </form>
            ) : (
              <div>
                <div className="flex items-center justify-between mb-3">
                  <span className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">
                    Select Category (1 Tap)
                  </span>
                  <button
                    onClick={() => setIsAddingCustom(true)}
                    className="text-xs text-emerald-400 hover:text-emerald-300 flex items-center space-x-1 font-medium"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Custom</span>
                  </button>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
                  {categories.map((cat) => (
                    <button
                      key={cat.id}
                      onClick={() => handleSelectCategory(cat.id, cat.name)}
                      className="group flex items-center space-x-3 p-3 rounded-2xl bg-zinc-900/90 border border-zinc-800/80 hover:border-zinc-700 hover:bg-zinc-800/80 active:scale-95 transition-all text-left"
                    >
                      <div
                        className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0 transition-transform group-hover:scale-105"
                        style={{
                          backgroundColor: `${cat.color}20`,
                          color: cat.color,
                        }}
                      >
                        <CategoryIcon name={cat.icon} className="w-5 h-5" color={cat.color} />
                      </div>
                      <div className="min-w-0">
                        <div className="text-xs font-medium text-zinc-200 truncate group-hover:text-white">
                          {cat.name}
                        </div>
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Footer note */}
          <div className="px-6 py-3 border-t border-zinc-900 bg-zinc-950/80 flex items-center justify-center space-x-1.5 text-xs text-zinc-500">
            <Sparkles className="w-3.5 h-3.5 text-emerald-500" />
            <span>SpendWise updates all budgets and analytics in real-time</span>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}

