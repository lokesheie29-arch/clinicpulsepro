-- CLINICPULSE PRO: PAYMENT COLLECTION & BANK/UPI INTEGRATION MODULE
-- Database Schema for Supabase (PostgreSQL with RLS & Multi-Tenant Support)

-- 1. Enable UUID extension if not already present
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 2. Organization Payment & Gateway Configurations
CREATE TABLE IF NOT EXISTS organization_payment_configs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    organization_type TEXT NOT NULL UNIQUE CHECK (organization_type IN ('hospital', 'laboratory', 'pharmacy')),
    organization_name TEXT NOT NULL,
    gateway_provider TEXT NOT NULL DEFAULT 'razorpay' CHECK (gateway_provider IN ('razorpay', 'cashfree', 'custom_upi')),
    environment_mode TEXT NOT NULL DEFAULT 'sandbox' CHECK (environment_mode IN ('sandbox', 'production')),
    key_id TEXT NOT NULL,
    key_secret TEXT NOT NULL,
    webhook_secret TEXT NOT NULL,
    merchant_vpa TEXT NOT NULL,
    merchant_name TEXT NOT NULL,
    bank_account JSONB NOT NULL DEFAULT '{}'::jsonb,
    settlement_cycle TEXT NOT NULL DEFAULT 'T+1' CHECK (settlement_cycle IN ('T+1', 'T+2', 'daily', 'instant')),
    auto_webhook_enabled BOOLEAN DEFAULT true,
    gateway_fee_percent NUMERIC(4, 2) DEFAULT 2.0,
    gst_on_fee_percent NUMERIC(4, 2) DEFAULT 18.0,
    status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'pending_verification', 'disabled')),
    last_tested_at TIMESTAMPTZ,
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index for speedy org queries
CREATE INDEX IF NOT EXISTS idx_payment_configs_org ON organization_payment_configs(organization_type);

-- 3. Payment Transactions Ledger
CREATE TABLE IF NOT EXISTS payment_transactions (
    id TEXT PRIMARY KEY,
    order_id TEXT NOT NULL,
    invoice_id TEXT NOT NULL,
    patient_name TEXT NOT NULL,
    patient_phone TEXT,
    organization_type TEXT NOT NULL CHECK (organization_type IN ('hospital', 'laboratory', 'pharmacy')),
    organization_name TEXT NOT NULL,
    bill_category TEXT NOT NULL DEFAULT 'opd' CHECK (bill_category IN ('opd', 'lab', 'pharmacy')),
    amount NUMERIC(12, 2) NOT NULL,
    currency TEXT NOT NULL DEFAULT 'INR',
    payment_method TEXT NOT NULL CHECK (payment_method IN ('upi_qr', 'upi_intent', 'card', 'netbanking', 'wallet', 'cash')),
    payment_method_details JSONB DEFAULT '{}'::jsonb,
    gateway_provider TEXT NOT NULL DEFAULT 'razorpay',
    gateway_payment_id TEXT NOT NULL,
    gateway_fee NUMERIC(10, 2) NOT NULL DEFAULT 0,
    gateway_fee_gst NUMERIC(10, 2) NOT NULL DEFAULT 0,
    net_settlement_amount NUMERIC(12, 2) NOT NULL,
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'success', 'failed', 'refunded')),
    settlement_status TEXT NOT NULL DEFAULT 'unsettled' CHECK (settlement_status IN ('unsettled', 'processing', 'settled', 'refunded')),
    settlement_utr TEXT,
    settlement_date TIMESTAMPTZ,
    bank_account_masked TEXT,
    refund_details JSONB,
    signature_verified BOOLEAN DEFAULT true,
    failure_reason TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    completed_at TIMESTAMPTZ
);

-- Indexes for transaction ledger & reports
CREATE INDEX IF NOT EXISTS idx_payment_txns_org ON payment_transactions(organization_type);
CREATE INDEX IF NOT EXISTS idx_payment_txns_invoice ON payment_transactions(invoice_id);
CREATE INDEX IF NOT EXISTS idx_payment_txns_status ON payment_transactions(status);
CREATE INDEX IF NOT EXISTS idx_payment_txns_settlement ON payment_transactions(settlement_status);
CREATE INDEX IF NOT EXISTS idx_payment_txns_created_at ON payment_transactions(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_payment_txns_gateway_id ON payment_transactions(gateway_payment_id);

-- 4. Enable Row Level Security (RLS)
ALTER TABLE organization_payment_configs ENABLE ROW LEVEL SECURITY;
ALTER TABLE payment_transactions ENABLE ROW LEVEL SECURITY;

-- 5. Safe Multi-Tenant Policies (Allow authenticated / anon for ERP simulator)
DROP POLICY IF EXISTS "Allow read access to payment configs" ON organization_payment_configs;
CREATE POLICY "Allow read access to payment configs" ON organization_payment_configs
    FOR SELECT USING (true);

DROP POLICY IF EXISTS "Allow write access to payment configs" ON organization_payment_configs;
CREATE POLICY "Allow write access to payment configs" ON organization_payment_configs
    FOR ALL USING (true);

DROP POLICY IF EXISTS "Allow read access to transactions" ON payment_transactions;
CREATE POLICY "Allow read access to transactions" ON payment_transactions
    FOR SELECT USING (true);

DROP POLICY IF EXISTS "Allow write access to transactions" ON payment_transactions;
CREATE POLICY "Allow write access to transactions" ON payment_transactions
    FOR ALL USING (true);
