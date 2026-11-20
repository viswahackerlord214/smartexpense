-- SpendWise Supabase PostgreSQL Migration
-- Created for Smart Personal Finance & Automated Expense Tracker

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. CATEGORIES TABLE
CREATE TABLE IF NOT EXISTS public.categories (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE, -- NULL for default system categories
    name TEXT NOT NULL,
    slug TEXT NOT NULL,
    icon TEXT NOT NULL DEFAULT 'Tag',
    color TEXT NOT NULL DEFAULT '#10B981',
    type TEXT NOT NULL CHECK (type IN ('expense', 'income')),
    is_custom BOOLEAN NOT NULL DEFAULT false,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    UNIQUE(user_id, slug)
);

-- 2. TRANSACTIONS TABLE
CREATE TABLE IF NOT EXISTS public.transactions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    amount NUMERIC(12, 2) NOT NULL,
    currency VARCHAR(10) NOT NULL DEFAULT 'INR',
    transaction_type VARCHAR(20) NOT NULL CHECK (transaction_type IN ('debit', 'credit', 'refund', 'reversal', 'failed', 'balance_query')),
    merchant TEXT NOT NULL,
    bank_sender VARCHAR(50) NOT NULL,
    transaction_reference TEXT,
    card_last4 VARCHAR(10),
    upi_ref TEXT,
    account_type VARCHAR(30) DEFAULT 'savings',
    transaction_date TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    category_id UUID REFERENCES public.categories(id) ON DELETE SET NULL,
    status VARCHAR(30) NOT NULL DEFAULT 'pending_categorization' CHECK (status IN ('pending_categorization', 'categorized', 'flagged_review', 'ignored')),
    raw_message_hash VARCHAR(64) NOT NULL,
    confidence_score NUMERIC(3, 2) NOT NULL DEFAULT 1.00,
    notes TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- Indexes for lightning fast dashboard and filter querying
CREATE INDEX IF NOT EXISTS idx_transactions_user_date ON public.transactions(user_id, transaction_date DESC);
CREATE INDEX IF NOT EXISTS idx_transactions_user_category ON public.transactions(user_id, category_id);
CREATE INDEX IF NOT EXISTS idx_transactions_user_status ON public.transactions(user_id, status);
CREATE INDEX IF NOT EXISTS idx_transactions_hash ON public.transactions(user_id, raw_message_hash);
CREATE INDEX IF NOT EXISTS idx_transactions_ref ON public.transactions(user_id, transaction_reference);

-- 3. BUDGETS TABLE
CREATE TABLE IF NOT EXISTS public.budgets (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    category_id UUID REFERENCES public.categories(id) ON DELETE CASCADE, -- NULL for total monthly budget
    period VARCHAR(20) NOT NULL DEFAULT 'monthly' CHECK (period IN ('monthly', 'weekly')),
    amount_limit NUMERIC(12, 2) NOT NULL,
    threshold_warning NUMERIC(5, 2) NOT NULL DEFAULT 75.00,
    threshold_critical NUMERIC(5, 2) NOT NULL DEFAULT 90.00,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    UNIQUE(user_id, category_id, period)
);

-- 4. NOTIFICATION SUBSCRIPTIONS TABLE
CREATE TABLE IF NOT EXISTS public.notification_subscriptions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    endpoint TEXT NOT NULL,
    p256dh TEXT NOT NULL,
    auth TEXT NOT NULL,
    user_agent TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    UNIQUE(user_id, endpoint)
);

-- 5. SAVED FILTERS TABLE
CREATE TABLE IF NOT EXISTS public.saved_filters (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    description TEXT,
    filter_group JSONB NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- 6. API KEYS (FOR APPLE SHORTCUTS AUTOMATION AUTH)
CREATE TABLE IF NOT EXISTS public.api_keys (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    name TEXT NOT NULL DEFAULT 'iPhone Shortcut Key',
    key_hash VARCHAR(64) NOT NULL UNIQUE,
    key_hint VARCHAR(8) NOT NULL, -- e.g. "sw_...a5f6"
    last_used_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- ROW LEVEL SECURITY (RLS) POLICIES
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.budgets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notification_subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.saved_filters ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.api_keys ENABLE ROW LEVEL SECURITY;

-- Categories RLS: view system categories OR own categories
CREATE POLICY "Users can view default categories and own categories"
    ON public.categories FOR SELECT
    USING (user_id IS NULL OR user_id = auth.uid());

CREATE POLICY "Users can create own custom categories"
    ON public.categories FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own custom categories"
    ON public.categories FOR UPDATE
    USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own custom categories"
    ON public.categories FOR DELETE
    USING (auth.uid() = user_id);

-- Transactions RLS: strictly own rows
CREATE POLICY "Users can view own transactions"
    ON public.transactions FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own transactions"
    ON public.transactions FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own transactions"
    ON public.transactions FOR UPDATE
    USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own transactions"
    ON public.transactions FOR DELETE
    USING (auth.uid() = user_id);

-- Budgets RLS
CREATE POLICY "Users can manage own budgets"
    ON public.budgets FOR ALL
    USING (auth.uid() = user_id);

-- Notification Subscriptions RLS
CREATE POLICY "Users can manage own notification subscriptions"
    ON public.notification_subscriptions FOR ALL
    USING (auth.uid() = user_id);

-- Saved Filters RLS
CREATE POLICY "Users can manage own saved filters"
    ON public.saved_filters FOR ALL
    USING (auth.uid() = user_id);

-- API Keys RLS
CREATE POLICY "Users can manage own API keys"
    ON public.api_keys FOR ALL
    USING (auth.uid() = user_id);

-- SEED DEFAULT SYSTEM CATEGORIES
INSERT INTO public.categories (user_id, name, slug, icon, color, type, is_custom)
VALUES
    (NULL, 'Food & Dining', 'food-dining', 'Utensils', '#f97316', 'expense', false),
    (NULL, 'Groceries', 'groceries', 'ShoppingCart', '#10b981', 'expense', false),
    (NULL, 'Shopping', 'shopping', 'ShoppingBag', '#ec4899', 'expense', false),
    (NULL, 'Transportation', 'transportation', 'Car', '#3b82f6', 'expense', false),
    (NULL, 'Fuel', 'fuel', 'Fuel', '#eab308', 'expense', false),
    (NULL, 'Entertainment', 'entertainment', 'Film', '#8b5cf6', 'expense', false),
    (NULL, 'Bills & Utilities', 'bills-utilities', 'Receipt', '#64748b', 'expense', false),
    (NULL, 'Rent', 'rent', 'Home', '#6366f1', 'expense', false),
    (NULL, 'Healthcare', 'healthcare', 'HeartPulse', '#ef4444', 'expense', false),
    (NULL, 'Education', 'education', 'GraduationCap', '#14b8a6', 'expense', false),
    (NULL, 'Travel', 'travel', 'Plane', '#06b6d4', 'expense', false),
    (NULL, 'Subscriptions', 'subscriptions', 'CreditCard', '#a855f7', 'expense', false),
    (NULL, 'Personal Care', 'personal-care', 'Sparkles', '#f43f5e', 'expense', false),
    (NULL, 'Investments', 'investments', 'TrendingUp', '#22c55e', 'expense', false),
    (NULL, 'Transfers', 'transfers', 'ArrowLeftRight', '#94a3b8', 'expense', false),
    (NULL, 'Salary & Income', 'salary-income', 'Wallet', '#10b981', 'income', false),
    (NULL, 'Other', 'other', 'HelpCircle', '#71717a', 'expense', false)
ON CONFLICT DO NOTHING;


