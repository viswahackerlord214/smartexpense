import { Transaction, Category, Budget, FilterGroup, SavedFilter, NotificationSubscriptionRecord } from '@/types';
import { DEFAULT_CATEGORIES } from '../constants/categories';
import { SEED_TRANSACTIONS, SEED_BUDGETS } from '../constants/seed-data';
import { getServerSupabase } from '../supabase/server';

// Server-side / in-memory store fallback when Supabase is in local/demo mode
let localTransactions: Transaction[] = [];
let localCategories: Category[] = [...DEFAULT_CATEGORIES];
let localBudgets: Budget[] = [...SEED_BUDGETS];
let localSubscriptions: NotificationSubscriptionRecord[] = [];
let localSavedFilters: SavedFilter[] = [];

export async function getTransactions(): Promise<Transaction[]> {
  const supabase = getServerSupabase();
  if (supabase) {
    try {
      const { data, error } = await supabase
        .from('transactions')
        .select('*, category:categories(*)')
        .order('transaction_date', { ascending: false });

      if (!error && data && data.length > 0) {
        return data as Transaction[];
      }
    } catch (e) {
      console.warn('Supabase query failed, falling back to local store:', e);
    }
  }

  // Local fallback with joined category
  return localTransactions
    .map((txn) => ({
      ...txn,
      category: localCategories.find((c) => c.id === txn.category_id),
    }))
    .sort((a, b) => new Date(b.transaction_date).getTime() - new Date(a.transaction_date).getTime());
}

export async function getTransactionById(id: string): Promise<Transaction | null> {
  const supabase = getServerSupabase();
  if (supabase) {
    try {
      const { data, error } = await supabase
        .from('transactions')
        .select('*, category:categories(*)')
        .eq('id', id)
        .single();

      if (!error && data) {
        return data as Transaction;
      }
    } catch (e) {
      console.warn('Supabase getTransactionById failed:', e);
    }
  }

  const found = localTransactions.find((t) => t.id === id);
  if (!found) return null;

  return {
    ...found,
    category: localCategories.find((c) => c.id === found.category_id),
  };
}

export async function findDuplicateTransaction(rawHash: string): Promise<Transaction | null> {
  const supabase = getServerSupabase();
  if (supabase) {
    try {
      const { data } = await supabase
        .from('transactions')
        .select('*')
        .eq('raw_message_hash', rawHash)
        .limit(1)
        .single();
      if (data) return data as Transaction;
    } catch (e) {
      // Ignore not found error
    }
  }

  return localTransactions.find((t) => t.raw_message_hash === rawHash) || null;
}

export async function createTransaction(txn: Omit<Transaction, 'id' | 'created_at' | 'updated_at'>): Promise<Transaction> {
  const newTxn: Transaction = {
    ...txn,
    id: `txn-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };

  const supabase = getServerSupabase();
  if (supabase) {
    try {
      const { data, error } = await supabase
        .from('transactions')
        .insert({
          amount: newTxn.amount,
          currency: newTxn.currency,
          transaction_type: newTxn.transaction_type,
          merchant: newTxn.merchant,
          bank_sender: newTxn.bank_sender,
          transaction_reference: newTxn.transaction_reference,
          card_last4: newTxn.card_last4,
          upi_ref: newTxn.upi_ref,
          account_type: newTxn.account_type,
          transaction_date: newTxn.transaction_date,
          category_id: newTxn.category_id,
          status: newTxn.status,
          raw_message_hash: newTxn.raw_message_hash,
          confidence_score: newTxn.confidence_score,
          notes: newTxn.notes,
        })
        .select()
        .single();

      if (!error && data) {
        return data as Transaction;
      }
    } catch (e) {
      console.warn('Supabase createTransaction failed, persisting to local store:', e);
    }
  }

  localTransactions.unshift(newTxn);
  return newTxn;
}

export async function updateTransactionCategory(id: string, categoryId: string): Promise<Transaction | null> {
  const supabase = getServerSupabase();
  if (supabase) {
    try {
      const { data, error } = await supabase
        .from('transactions')
        .update({
          category_id: categoryId,
          status: 'categorized',
          updated_at: new Date().toISOString(),
        })
        .eq('id', id)
        .select('*, category:categories(*)')
        .single();

      if (!error && data) {
        return data as Transaction;
      }
    } catch (e) {
      console.warn('Supabase updateTransactionCategory failed:', e);
    }
  }

  const idx = localTransactions.findIndex((t) => t.id === id);
  if (idx === -1) return null;

  localTransactions[idx] = {
    ...localTransactions[idx],
    category_id: categoryId,
    status: 'categorized',
    updated_at: new Date().toISOString(),
  };

  return {
    ...localTransactions[idx],
    category: localCategories.find((c) => c.id === categoryId),
  };
}

export async function getCategories(): Promise<Category[]> {
  const supabase = getServerSupabase();
  if (supabase) {
    try {
      const { data, error } = await supabase
        .from('categories')
        .select('*')
        .order('name', { ascending: true });

      if (!error && data && data.length > 0) {
        return data as Category[];
      }
    } catch (e) {
      // fallback
    }
  }

  return localCategories;
}

export async function createCategory(cat: Omit<Category, 'id'>): Promise<Category> {
  const newCat: Category = {
    ...cat,
    id: `cat-${Date.now()}`,
    is_custom: true,
  };

  const supabase = getServerSupabase();
  if (supabase) {
    try {
      const { data, error } = await supabase
        .from('categories')
        .insert({
          name: newCat.name,
          slug: newCat.slug,
          icon: newCat.icon,
          color: newCat.color,
          type: newCat.type,
          is_custom: true,
        })
        .select()
        .single();
      if (!error && data) return data as Category;
    } catch (e) {
      // fallback
    }
  }

  localCategories.push(newCat);
  return newCat;
}

export async function getBudgets(): Promise<Budget[]> {
  const supabase = getServerSupabase();
  if (supabase) {
    try {
      const { data, error } = await supabase
        .from('budgets')
        .select('*, category:categories(*)');
      if (!error && data && data.length > 0) {
        return data as Budget[];
      }
    } catch (e) {
      // fallback
    }
  }

  return localBudgets.map((b) => ({
    ...b,
    category: localCategories.find((c) => c.id === b.category_id),
  }));
}

export async function saveBudget(budget: Omit<Budget, 'id' | 'created_at'>): Promise<Budget> {
  const newBudget: Budget = {
    ...budget,
    id: `bdg-${Date.now()}`,
    created_at: new Date().toISOString(),
  };

  const idx = localBudgets.findIndex((b) => b.category_id === budget.category_id && b.period === budget.period);
  if (idx !== -1) {
    localBudgets[idx] = { ...localBudgets[idx], ...budget, updated_at: new Date().toISOString() };
    return localBudgets[idx];
  } else {
    localBudgets.push(newBudget);
    return newBudget;
  }
}

export async function getNotificationSubscriptions(): Promise<NotificationSubscriptionRecord[]> {
  const supabase = getServerSupabase();
  if (supabase) {
    try {
      const { data, error } = await supabase.from('notification_subscriptions').select('*');
      if (!error && data) return data as NotificationSubscriptionRecord[];
    } catch (e) {}
  }
  return localSubscriptions;
}

export async function saveNotificationSubscription(
  sub: Omit<NotificationSubscriptionRecord, 'id' | 'created_at'>
): Promise<NotificationSubscriptionRecord> {
  const newSub: NotificationSubscriptionRecord = {
    ...sub,
    id: `sub-${Date.now()}`,
    created_at: new Date().toISOString(),
  };

  const supabase = getServerSupabase();
  if (supabase) {
    try {
      await supabase.from('notification_subscriptions').upsert({
        user_id: newSub.user_id,
        endpoint: newSub.endpoint,
        p256dh: newSub.p256dh,
        auth: newSub.auth,
        user_agent: newSub.user_agent,
      });
    } catch (e) {}
  }

  // Also maintain in local array
  const existingIdx = localSubscriptions.findIndex((s) => s.endpoint === sub.endpoint);
  if (existingIdx !== -1) {
    localSubscriptions[existingIdx] = newSub;
  } else {
    localSubscriptions.push(newSub);
  }

  return newSub;
}

export async function getSavedFilters(): Promise<SavedFilter[]> {
  return localSavedFilters;
}

export async function saveFilter(name: string, filterGroup: FilterGroup, description?: string): Promise<SavedFilter> {
  const newFilter: SavedFilter = {
    id: `filter-${Date.now()}`,
    user_id: 'usr-demo',
    name,
    description,
    filter_group: filterGroup,
    created_at: new Date().toISOString(),
  };
  localSavedFilters.unshift(newFilter);
  return newFilter;
}

export async function resetDemoData() {
  localTransactions = [...SEED_TRANSACTIONS];
  localCategories = [...DEFAULT_CATEGORIES];
  localBudgets = [...SEED_BUDGETS];
}

