export type TransactionType = 'debit' | 'credit' | 'refund' | 'reversal' | 'failed' | 'balance_query';

export type TransactionStatus = 'pending_categorization' | 'categorized' | 'flagged_review' | 'ignored';

export interface Category {
  id: string;
  name: string;
  slug: string;
  icon: string; // Lucide icon name
  color: string; // Hex color code
  type: 'expense' | 'income';
  is_custom?: boolean;
}

export interface Transaction {
  id: string;
  user_id: string;
  amount: number;
  currency: string;
  transaction_type: TransactionType;
  merchant: string;
  bank_sender: string;
  transaction_reference?: string;
  transaction_date: string; // ISO date string
  category_id?: string | null;
  status: TransactionStatus;
  raw_message_hash: string;
  confidence_score: number; // 0.0 - 1.0
  card_last4?: string;
  upi_ref?: string;
  notes?: string;
  account_type?: string; // 'savings', 'credit_card', 'wallet'
  created_at: string;
  updated_at: string;
  // Joined relation
  category?: Category;
}

export interface Budget {
  id: string;
  user_id: string;
  category_id: string | null; // null represents overall monthly budget
  period: 'monthly' | 'weekly';
  amount_limit: number;
  threshold_warning: number; // e.g. 75 (%)
  threshold_critical: number; // e.g. 90 (%)
  created_at: string;
  updated_at?: string;
  category?: Category;
}

export interface ParsedTransactionResult {
  amount: number | null;
  currency: string;
  transaction_type: TransactionType;
  merchant: string | null;
  bank_sender: string;
  transaction_reference: string | null;
  transaction_date: string; // ISO string
  card_last4: string | null;
  upi_ref: string | null;
  account_last4: string | null;
  confidence_score: number;
  is_ambiguous: boolean;
  is_non_transaction: boolean;
  non_transaction_reason?: 'otp' | 'promotional' | 'balance_only' | 'unrecognized';
  raw_hash: string;
  explanation: string;
}

export type FilterOperator = 
  | 'equals' 
  | 'not_equals' 
  | 'greater_than' 
  | 'less_than' 
  | 'contains' 
  | 'in' 
  | 'between';

export interface FilterRule {
  id: string;
  field: 'category' | 'amount' | 'merchant' | 'bank_sender' | 'transaction_type' | 'status' | 'date';
  operator: FilterOperator;
  value: any;
  valueTo?: any; // For between operator
}

export interface FilterGroup {
  id: string;
  logic: 'AND' | 'OR';
  rules: (FilterRule | FilterGroup)[];
}

export interface SavedFilter {
  id: string;
  user_id: string;
  name: string;
  description?: string;
  filter_group: FilterGroup;
  created_at: string;
}

export interface SpendingInsight {
  id: string;
  type: 'increase' | 'decrease' | 'highlight' | 'warning' | 'merchant';
  title: string;
  description: string;
  metric?: string;
  sentiment: 'positive' | 'negative' | 'neutral';
}

export interface DailySpending {
  date: string; // YYYY-MM-DD
  dayOfWeek: string;
  amount: number;
  count: number;
}

export interface SpendingHeatmapItem {
  date: string;
  amount: number;
  count: number;
  level: 0 | 1 | 2 | 3 | 4; // visual intensity 0 = 0, 4 = highest
}

export interface NotificationSubscriptionRecord {
  id: string;
  user_id: string;
  endpoint: string;
  p256dh: string;
  auth: string;
  user_agent?: string;
  created_at: string;
}

