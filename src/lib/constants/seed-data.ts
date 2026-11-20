import { Transaction, Budget } from '@/types';

// Production clean initial data: 0 dummy transactions
export const SEED_TRANSACTIONS: Transaction[] = [];

// Production clean budgets: clean initial spending caps
export const SEED_BUDGETS: Budget[] = [
  {
    id: 'bdg-total',
    user_id: 'default',
    category_id: null, // Total monthly limit
    period: 'monthly',
    amount_limit: 50000.00,
    threshold_warning: 75,
    threshold_critical: 90,
    created_at: new Date().toISOString(),
  },
];
