import crypto from 'crypto';
import { Transaction, Category, Budget, SavedFilter, NotificationSubscriptionRecord } from '../../types';
import { DEFAULT_CATEGORIES } from '../constants/categories';
import { getServerSupabaseAdmin } from '../supabase/server';

/**
 * Multi-user persistent data store layer backed by Supabase PostgreSQL.
 * Every query and mutation is strictly scoped to the authenticated user's UUID.
 */

// 1. TRANSACTIONS

export async function getTransactions(userId: string): Promise<Transaction[]> {
  const supabase = getServerSupabaseAdmin();
  if (!supabase) {
    throw new Error('Database connection not configured.');
  }

  const { data, error } = await supabase
    .from('transactions')
    .select('*, category:categories(*)')
    .eq('user_id', userId)
    .order('transaction_date', { ascending: false });

  if (error) {
    console.error('Error in getTransactions:', error);
    throw new Error(`Failed to load transactions: ${error.message}`);
  }

  return (data || []) as Transaction[];
}

export async function getTransactionById(id: string, userId: string): Promise<Transaction | null> {
  const supabase = getServerSupabaseAdmin();
  if (!supabase) return null;

  const { data, error } = await supabase
    .from('transactions')
    .select('*, category:categories(*)')
    .eq('id', id)
    .eq('user_id', userId)
    .maybeSingle();

  if (error || !data) return null;
  return data as Transaction;
}

export async function findDuplicateTransaction(rawHash: string, userId: string): Promise<Transaction | null> {
  const supabase = getServerSupabaseAdmin();
  if (!supabase) return null;

  try {
    const { data } = await supabase
      .from('transactions')
      .select('*')
      .eq('user_id', userId)
      .eq('raw_message_hash', rawHash)
      .limit(1)
      .maybeSingle();

    return (data as Transaction) || null;
  } catch (e) {
    return null;
  }
}

export async function createTransaction(
  txn: Omit<Transaction, 'id' | 'created_at' | 'updated_at'>,
  userId: string
): Promise<Transaction> {
  const supabase = getServerSupabaseAdmin();
  if (!supabase) {
    throw new Error('Database connection not configured.');
  }

  // Generate SHA-256 64-char hash for manual or unhashed inputs
  const rawHash =
    txn.raw_message_hash ||
    crypto
      .createHash('sha256')
      .update(`manual-${userId}-${Date.now()}-${Math.random()}-${txn.amount}-${txn.merchant}`)
      .digest('hex');

  const insertPayload = {
    user_id: userId,
    amount: txn.amount,
    currency: txn.currency || 'INR',
    transaction_type: txn.transaction_type || 'debit',
    merchant: txn.merchant,
    bank_sender: txn.bank_sender || 'MANUAL',
    transaction_reference: txn.transaction_reference || null,
    card_last4: txn.card_last4 || null,
    upi_ref: txn.upi_ref || null,
    account_type: txn.account_type || 'manual',
    transaction_date: txn.transaction_date || new Date().toISOString(),
    category_id: txn.category_id || null,
    status: txn.status || (txn.category_id ? 'categorized' : 'pending_categorization'),
    raw_message_hash: rawHash,
    confidence_score: txn.confidence_score ?? 1.0,
    notes: txn.notes || null,
  };

  const { data, error } = await supabase
    .from('transactions')
    .insert(insertPayload)
    .select('*, category:categories(*)')
    .single();

  if (error || !data) {
    console.error('Error inserting transaction:', error);
    throw new Error(`Failed to save transaction: ${error?.message || 'Database error'}`);
  }

  return data as Transaction;
}

export async function deleteTransaction(id: string, userId: string): Promise<boolean> {
  const supabase = getServerSupabaseAdmin();
  if (!supabase) {
    throw new Error('Database connection not configured.');
  }

  const { error } = await supabase
    .from('transactions')
    .delete()
    .eq('id', id)
    .eq('user_id', userId);

  if (error) {
    console.error('Error deleting transaction:', error);
    throw new Error(`Failed to delete transaction: ${error.message}`);
  }

  return true;
}

export async function updateTransactionCategory(
  id: string,
  categoryId: string,
  userId: string
): Promise<Transaction> {
  const supabase = getServerSupabaseAdmin();
  if (!supabase) {
    throw new Error('Database connection not configured.');
  }

  const { data, error } = await supabase
    .from('transactions')
    .update({
      category_id: categoryId,
      status: 'categorized',
      updated_at: new Date().toISOString(),
    })
    .eq('id', id)
    .eq('user_id', userId)
    .select('*, category:categories(*)')
    .single();

  if (error || !data) {
    console.error('Error categorizing transaction:', error);
    throw new Error(`Failed to update transaction category: ${error?.message || 'Not found'}`);
  }

  return data as Transaction;
}

// 2. CATEGORIES

export async function getCategories(userId?: string): Promise<Category[]> {
  const supabase = getServerSupabaseAdmin();
  if (!supabase) {
    return DEFAULT_CATEGORIES;
  }

  let query = supabase.from('categories').select('*').order('name');
  if (userId) {
    query = query.or(`user_id.is.null,user_id.eq.${userId}`);
  } else {
    query = query.is('user_id', null);
  }

  const { data, error } = await query;
  if (error) {
    console.error('Error loading categories:', error);
    return DEFAULT_CATEGORIES;
  }

  return (data && data.length > 0 ? data : DEFAULT_CATEGORIES) as Category[];
}

export async function createCategory(
  category: Omit<Category, 'id' | 'created_at' | 'is_custom'>,
  userId: string
): Promise<Category> {
  const supabase = getServerSupabaseAdmin();
  if (!supabase) {
    throw new Error('Database connection not configured.');
  }

  const { data, error } = await supabase
    .from('categories')
    .insert({
      user_id: userId,
      name: category.name,
      slug: category.slug,
      icon: category.icon,
      color: category.color,
      type: category.type,
      is_custom: true,
    })
    .select()
    .single();

  if (error || !data) {
    console.error('Error creating custom category:', error);
    throw new Error(`Failed to create category: ${error?.message}`);
  }

  return data as Category;
}

// 3. BUDGETS

export async function getBudgets(userId: string): Promise<Budget[]> {
  const supabase = getServerSupabaseAdmin();
  if (!supabase) return [];

  const { data, error } = await supabase
    .from('budgets')
    .select('*')
    .eq('user_id', userId);

  if (error) {
    console.error('Error loading budgets:', error);
    return [];
  }

  return (data || []) as Budget[];
}

export async function saveBudget(
  budget: {
    category_id: string | null;
    period: 'monthly' | 'weekly';
    amount_limit: number;
    threshold_warning?: number;
    threshold_critical?: number;
  },
  userId: string
): Promise<Budget> {
  const supabase = getServerSupabaseAdmin();
  if (!supabase) {
    throw new Error('Database connection not configured.');
  }

  const payload = {
    user_id: userId,
    category_id: budget.category_id,
    period: budget.period,
    amount_limit: budget.amount_limit,
    threshold_warning: budget.threshold_warning || 75,
    threshold_critical: budget.threshold_critical || 90,
    updated_at: new Date().toISOString(),
  };

  const { data, error } = await supabase
    .from('budgets')
    .upsert(payload, { onConflict: 'user_id, category_id, period' })
    .select()
    .single();

  if (error || !data) {
    console.error('Error saving budget:', error);
    throw new Error(`Failed to save budget: ${error?.message}`);
  }

  return data as Budget;
}

// 4. NOTIFICATION SUBSCRIPTIONS

export async function getNotificationSubscriptions(userId: string): Promise<NotificationSubscriptionRecord[]> {
  const supabase = getServerSupabaseAdmin();
  if (!supabase) return [];

  const { data, error } = await supabase
    .from('notification_subscriptions')
    .select('*')
    .eq('user_id', userId);

  if (error) {
    console.error('Error loading notification subscriptions:', error);
    return [];
  }

  return (data || []) as NotificationSubscriptionRecord[];
}

export async function saveNotificationSubscription(
  sub: {
    endpoint: string;
    keys: { p256dh: string; auth: string };
    userAgent?: string;
  },
  userId: string
): Promise<boolean> {
  const supabase = getServerSupabaseAdmin();
  if (!supabase) return false;

  const { error } = await supabase
    .from('notification_subscriptions')
    .upsert(
      {
        user_id: userId,
        endpoint: sub.endpoint,
        p256dh: sub.keys.p256dh,
        auth: sub.keys.auth,
        user_agent: sub.userAgent || null,
      },
      { onConflict: 'user_id, endpoint' }
    );

  if (error) {
    console.error('Error saving notification subscription:', error);
    return false;
  }

  return true;
}
