'use client';

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { Transaction, Category, Budget } from '@/types';
import { DEFAULT_CATEGORIES } from '@/lib/constants/categories';
import { useAuth } from './AuthContext';

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
  const { user } = useAuth();
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [categories, setCategories] = useState<Category[]>(DEFAULT_CATEGORIES);
  const [budgets, setBudgets] = useState<Budget[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [activeCategorizeId, setActiveCategorizeId] = useState<string | null>(null);

  // Check URL query param for deep link (e.g. ?categorize=txn-001)
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const checkParam = () => {
        const urlParams = new URLSearchParams(window.location.search);
        const catId = urlParams.get('categorize');
        if (catId) {
          setActiveCategorizeId(catId);
        }
      };
      checkParam();
      window.addEventListener('popstate', checkParam);
      return () => window.removeEventListener('popstate', checkParam);
    }
  }, []);

  const refreshData = useCallback(async () => {
    if (!user) {
      setTransactions([]);
      setBudgets([]);
      return;
    }

    setIsLoading(true);
    try {
      const [txnRes, catRes, bdgRes] = await Promise.all([
        fetch('/api/transactions'),
        fetch('/api/categories'),
        fetch('/api/budgets'),
      ]);

      if (txnRes.ok) {
        const { transactions } = await txnRes.json();
        setTransactions(transactions || []);
      }

      if (catRes.ok) {
        const { categories } = await catRes.json();
        if (categories && categories.length > 0) {
          setCategories(categories);
        }
      }

      if (bdgRes.ok) {
        const { budgets } = await bdgRes.json();
        setBudgets(budgets || []);
      }
    } catch (e) {
      console.warn('Error fetching API data:', e);
    } finally {
      setIsLoading(false);
    }
  }, [user]);

  // Re-fetch data whenever user changes (logs in, logs out, or switches accounts)
  useEffect(() => {
    if (user) {
      refreshData();
    } else {
      setTransactions([]);
      setBudgets([]);
    }
  }, [user, refreshData]);

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
        refreshData();
        return false;
      }
      return true;
    } catch (err) {
      console.error('Network error during categorize:', err);
      refreshData();
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
      console.error('Error adding transaction:', e);
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
      console.error('Error adding category:', e);
    }
    return null;
  };

  const saveBudgetLimit = async (
    categoryId: string | null,
    limit: number,
    period: 'monthly' | 'weekly' = 'monthly'
  ) => {
    try {
      const res = await fetch('/api/budgets', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          category_id: categoryId,
          amount_limit: limit,
          period,
        }),
      });
      if (res.ok) {
        const { budget } = await res.json();
        setBudgets((prev) => {
          const index = prev.findIndex((b) => b.category_id === categoryId && b.period === period);
          if (index >= 0) {
            const next = [...prev];
            next[index] = budget;
            return next;
          }
          return [...prev, budget];
        });
      }
    } catch (e) {
      console.error('Error saving budget limit:', e);
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
  const context = useContext(ExpenseContext);
  if (!context) {
    throw new Error('useExpense must be used within an ExpenseProvider');
  }
  return context;
}
