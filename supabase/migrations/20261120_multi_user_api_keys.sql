-- SpendWise Multi-User API Key & Data Isolation Migration
-- Run this in your Supabase Dashboard SQL Editor (https://supabase.com/dashboard/project/YOUR_PROJECT_ID/sql)

-- 1. Add revocation, status, and prefix fields to api_keys
ALTER TABLE public.api_keys 
ADD COLUMN IF NOT EXISTS is_active BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN IF NOT EXISTS revoked_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS key_prefix VARCHAR(16);

-- Allow flexible key hint length
ALTER TABLE public.api_keys ALTER COLUMN key_hint TYPE VARCHAR(16);

-- 2. Indexes for fast webhook lookups and user isolation
CREATE INDEX IF NOT EXISTS idx_api_keys_hash ON public.api_keys(key_hash);
CREATE INDEX IF NOT EXISTS idx_api_keys_user ON public.api_keys(user_id);
CREATE INDEX IF NOT EXISTS idx_api_keys_status ON public.api_keys(user_id, is_active);

-- 3. Row Level Security on api_keys
ALTER TABLE public.api_keys ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can manage own API keys" ON public.api_keys;
CREATE POLICY "Users can manage own API keys"
    ON public.api_keys FOR ALL
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

-- 4. Verify RLS policies on transactions, categories, budgets
ALTER TABLE public.transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.budgets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notification_subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.saved_filters ENABLE ROW LEVEL SECURITY;
