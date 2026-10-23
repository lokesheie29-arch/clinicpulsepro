-- ====================================================================
-- ClinicPulse Pro — 30-Day Free Trial & Razorpay Subscriptions Schema
-- ====================================================================

-- 1. Create subscriptions table
CREATE TABLE IF NOT EXISTS public.subscriptions (
  id TEXT PRIMARY KEY,
  user_id TEXT UNIQUE NOT NULL,
  user_email TEXT NOT NULL,
  user_name TEXT,
  clinic_name TEXT,
  org_type TEXT DEFAULT 'hospital',
  status TEXT NOT NULL DEFAULT 'trialing',
  plan_id TEXT NOT NULL DEFAULT 'professional',
  billing_frequency TEXT NOT NULL DEFAULT 'annual',
  
  -- Trial Metadata
  trial_start_date TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  trial_expiry_date TIMESTAMPTZ NOT NULL DEFAULT (NOW() + INTERVAL '30 days'),
  trial_duration_days INT DEFAULT 30,
  trial_extended_by_admin BOOLEAN DEFAULT FALSE,
  trial_extension_days INT DEFAULT 0,
  trial_extended_at TIMESTAMPTZ,
  trial_extended_by TEXT,
  trial_extension_reason TEXT,

  -- Active Subscription & Razorpay Metadata
  current_period_start TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  current_period_end TIMESTAMPTZ NOT NULL DEFAULT (NOW() + INTERVAL '30 days'),
  razorpay_customer_id TEXT,
  razorpay_subscription_id TEXT,
  razorpay_payment_id TEXT,
  razorpay_order_id TEXT,
  razorpay_signature TEXT,
  amount_paid NUMERIC(12, 2) DEFAULT 0.00,
  currency TEXT DEFAULT 'INR',

  -- Payment & Cancellation
  cancel_at_period_end BOOLEAN DEFAULT FALSE,
  cancelled_at TIMESTAMPTZ,
  payment_status TEXT DEFAULT 'pending',
  last_payment_date TIMESTAMPTZ,
  next_renewal_date TIMESTAMPTZ,
  
  -- Audit & History (JSONB)
  history JSONB DEFAULT '[]'::jsonb,

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Indexes for High-Performance Access & Status Lookups
CREATE INDEX IF NOT EXISTS idx_subscriptions_user_id ON public.subscriptions(user_id);
CREATE INDEX IF NOT EXISTS idx_subscriptions_status ON public.subscriptions(status);
CREATE INDEX IF NOT EXISTS idx_subscriptions_trial_expiry ON public.subscriptions(trial_expiry_date);
CREATE INDEX IF NOT EXISTS idx_subscriptions_current_period_end ON public.subscriptions(current_period_end);

-- 3. Row Level Security (RLS)
ALTER TABLE public.subscriptions ENABLE ROW LEVEL SECURITY;

-- Users can only read their own subscription record
DROP POLICY IF EXISTS "Users can read own subscription" ON public.subscriptions;
CREATE POLICY "Users can read own subscription" ON public.subscriptions
  FOR SELECT
  USING (auth.uid()::text = user_id OR user_email = auth.jwt() ->> 'email');

-- Master Admin full access policy (lokesheie29@gmail.com)
DROP POLICY IF EXISTS "Master admin full access to subscriptions" ON public.subscriptions;
CREATE POLICY "Master admin full access to subscriptions" ON public.subscriptions
  FOR ALL
  USING (
    (auth.jwt() ->> 'email') = 'lokesheie29@gmail.com'
    OR (auth.jwt() -> 'app_metadata' ->> 'role') = 'admin'
  );

-- Service role full access (for webhooks & serverless functions)
DROP POLICY IF EXISTS "Service role full access" ON public.subscriptions;
CREATE POLICY "Service role full access" ON public.subscriptions
  FOR ALL
  USING (auth.role() = 'service_role');

-- 4. Subscription Audit Log Table
CREATE TABLE IF NOT EXISTS public.subscription_audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  subscription_id TEXT REFERENCES public.subscriptions(id) ON DELETE CASCADE,
  user_id TEXT NOT NULL,
  event TEXT NOT NULL,
  actor TEXT NOT NULL,
  details JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_audit_logs_user_id ON public.subscription_audit_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_created_at ON public.subscription_audit_logs(created_at);
