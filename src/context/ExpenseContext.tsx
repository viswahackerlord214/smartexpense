'use client';

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { Transaction, Category, Budget, FilterGroup } from '@/types';
import { DEFAULT_CATEGORIES } from '@/lib/constants/categories';
import { SEED_TRANSACTIONS, SEED_BUDGETS } from '@/lib/constants/seed-data';

interface ExpenseContextType {
  transactions: Transaction[];
  categories: Category[];
  budgets: Budget[];
  isLoading: boolean;
  activeCategorizeId: string | null;
  setActiveCategorizeId: (id: string | null) => void;
  categorizeTransaction: (transactionId: string, categoryId: string) => Promise<boolean>;
  addTransaction: (txn: Partial<Transaction>) => Promise<Transaction | null>;
  addCategory: (name: string, color: string, icon: string) => Promise<Category | null>;
  saveBudgetLimit: (categoryId: string | null, limit: number, period?: 'monthly' | 'weekly') => Promise<void>;
  refreshData: () => Promise<void>;
  pendingCount: number;
}

const ExpenseContext = createContext<ExpenseContextType | undefined>(undefined);

export function ExpenseProvider({ children }: { children: React.ReactNode }) {
  const [transactions, setTransactions] = useState<Transaction[]>(SEED_TRANSACTIONS);
  const [categories, setCategories] = useState<Category[]>(DEFAULT_CATEGORIES);
  const [budgets, setBudgets] = useState<Budget[]>(SEED_BUDGETS);
  const [isLoading, setIsLoading] = useState(false);
  const [activeCategorizeId, setActiveCategorizeId] = useState<string | null>(null);

  // Check URL query param for deep link (e.g. ?categorize=txn-001)
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const urlParams = new URLSearchParams(window.location.search);
      const catId = urlParams.get('categorize');
      if (catId) {
        setActiveCategorizeId(catId);
      }
    }
  }, []);

  const refreshData = useCallback(async () => {
    setIsLoading(true);
    try {
      const [txnRes, catRes, bdgRes] = await Promise.all([
        fetch('/api/transactions'),
        fetch('/api/categories'),
        fetch('/api/budgets'),
      ]);

      if (txnRes.ok) {
        const { transactions } = await txnRes.json();
        if (transactions && transactions.length > 0) {
          setTransactions(transactions);
        }
      }

      if (catRes.ok) {
        const { categories } = await catRes.json();
        if (categories && categories.length > 0) {
          setCategories(categories);
        }
      }

      if (bdgRes.ok) {
        const { budgets } = await bdgRes.json();
        if (budgets && budgets.length > 0) {
          setBudgets(budgets);
        }
      }
    } catch (e) {
      console.warn('Error fetching API data, using cached state:', e);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    refreshData();
  }, [refreshData]);

  // One-tap categorization function
  const categorizeTransaction = async (transactionId: string, categoryId: string): Promise<boolean> => {
    // Optimistic update
    const selectedCategory = categories.find((c) => c.id === categoryId);
    setTransactions((prev) =>
      prev.map((t) =>
        t.id === transactionId
          ? {
              ...t,
              category_id: categoryId,
              status: 'categorized',
              category: selectedCategory,
              updated_at: new Date().toISOString(),
            }
          : t
      )
    );

    try {
      const res = await fetch(`/api/transactions/${transactionId}/categorize`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ categoryId }),
      });

      if (!res.ok) {
        console.error('Categorize request failed on server');
      }
      return true;
    } catch (err) {
      console.error('Network error during categorize:', err);
      return false;
    }
  };

  const addTransaction = async (txn: Partial<Transaction>): Promise<Transaction | null> => {
    try {
      const res = await fetch('/api/transactions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(txn),
      });
      if (res.ok) {
        const { transaction } = await res.json();
        setTransactions((prev) => [transaction, ...prev]);
        return transaction;
      }
    } catch (e) {
      console.error('Failed to add transaction:', e);
    }
    return null;
  };

  const addCategory = async (name: string, color: string, icon: string): Promise<Category | null> => {
    try {
      const res = await fetch('/api/categories', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, color, icon }),
      });
      if (res.ok) {
        const { category } = await res.json();
        setCategories((prev) => [...prev, category]);
        return category;
      }
    } catch (e) {
      console.error('Failed to add category:', e);
    }
    return null;
  };

  const saveBudgetLimit = async (categoryId: string | null, limit: number, period: 'monthly' | 'weekly' = 'monthly') => {
    try {
      const res = await fetch('/api/budgets', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ category_id: categoryId, amount_limit: limit, period }),
      });
      if (res.ok) {
        const { budget } = await res.json();
        setBudgets((prev) => {
          const idx = prev.findIndex((b) => b.category_id === categoryId && b.period === period);
          if (idx !== -1) {
            const next = [...prev];
            next[idx] = budget;
            return next;
          }
          return [...prev, budget];
        });
      }
    } catch (e) {
      console.error('Failed to save budget:', e);
    }
  };

  const pendingCount = transactions.filter((t) => t.status === 'pending_categorization').length;

  return (
    <ExpenseContext.Provider
      value={{
        transactions,
        categories,
        budgets,
        isLoading,
        activeCategorizeId,
        setActiveCategorizeId,
        categorizeTransaction,
        addTransaction,
        addCategory,
        saveBudgetLimit,
        refreshData,
        pendingCount,
      }}
    >
      {children}
    </ExpenseContext.Provider>
  );
}

export function useExpense() {
  const ctx = useContext(ExpenseContext);
  if (!ctx) throw new Error('useExpense must be used within ExpenseProvider');
  return ctx;
}

