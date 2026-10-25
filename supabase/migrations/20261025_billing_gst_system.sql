-- ====================================================================
-- ClinicPulse Pro — Comprehensive Billing & Indian GST Compliance Schema
-- Supports Hospitals, Clinics, Laboratories, and Pharmacies
-- ====================================================================

-- 1. Create billing_invoices table
CREATE TABLE IF NOT EXISTS public.billing_invoices (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  series TEXT NOT NULL,
  invoice_sequence INT NOT NULL,
  invoice_date TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  due_date TIMESTAMPTZ,
  financial_year TEXT NOT NULL,
  org_type TEXT NOT NULL DEFAULT 'hospital',

  -- Business and Customer Information
  business_details JSONB NOT NULL,
  customer_details JSONB NOT NULL,

  -- GST Place of Supply & Rates
  place_of_supply TEXT NOT NULL,
  place_of_supply_code TEXT NOT NULL,
  is_inter_state BOOLEAN NOT NULL DEFAULT FALSE,
  price_type TEXT NOT NULL DEFAULT 'exclusive',

  -- Line items and Grouped Breakdown
  items JSONB NOT NULL DEFAULT '[]'::jsonb,
  tax_breakdowns JSONB NOT NULL DEFAULT '[]'::jsonb,

  -- Financial Calculations
  sub_total NUMERIC(12, 2) NOT NULL DEFAULT 0.00,
  total_discount NUMERIC(12, 2) NOT NULL DEFAULT 0.00,
  total_taxable NUMERIC(12, 2) NOT NULL DEFAULT 0.00,
  total_cgst NUMERIC(12, 2) NOT NULL DEFAULT 0.00,
  total_sgst NUMERIC(12, 2) NOT NULL DEFAULT 0.00,
  total_igst NUMERIC(12, 2) NOT NULL DEFAULT 0.00,
  total_tax NUMERIC(12, 2) NOT NULL DEFAULT 0.00,
  round_off NUMERIC(8, 2) NOT NULL DEFAULT 0.00,
  grand_total NUMERIC(12, 2) NOT NULL DEFAULT 0.00,

  -- Payment & Status Management
  amount_paid NUMERIC(12, 2) NOT NULL DEFAULT 0.00,
  balance_due NUMERIC(12, 2) NOT NULL DEFAULT 0.00,
  payment_status TEXT NOT NULL DEFAULT 'unpaid',
  invoice_status TEXT NOT NULL DEFAULT 'issued',
  payments JSONB NOT NULL DEFAULT '[]'::jsonb,
  credit_note_ids JSONB DEFAULT '[]'::jsonb,

  notes TEXT,
  terms_and_conditions TEXT,
  cancelled_at TIMESTAMPTZ,
  cancel_reason TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 2. Create billing_credit_notes table
CREATE TABLE IF NOT EXISTS public.billing_credit_notes (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  credit_note_number TEXT NOT NULL,
  invoice_id TEXT NOT NULL REFERENCES public.billing_invoices(id) ON DELETE CASCADE,
  invoice_number TEXT NOT NULL,
  invoice_date TIMESTAMPTZ NOT NULL,
  date TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  financial_year TEXT NOT NULL,
  reason TEXT NOT NULL,
  reason_details TEXT,

  customer_name TEXT NOT NULL,
  customer_gstin TEXT,
  state_code TEXT NOT NULL,

  items JSONB NOT NULL DEFAULT '[]'::jsonb,
  total_taxable_adjustment NUMERIC(12, 2) NOT NULL DEFAULT 0.00,
  total_cgst_adjustment NUMERIC(12, 2) NOT NULL DEFAULT 0.00,
  total_sgst_adjustment NUMERIC(12, 2) NOT NULL DEFAULT 0.00,
  total_igst_adjustment NUMERIC(12, 2) NOT NULL DEFAULT 0.00,
  total_refund_amount NUMERIC(12, 2) NOT NULL DEFAULT 0.00,

  refund_method TEXT NOT NULL DEFAULT 'cash',
  refund_status TEXT NOT NULL DEFAULT 'completed',
  stock_restocked BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 3. Create gst_tax_configurations table
CREATE TABLE IF NOT EXISTS public.gst_tax_configurations (
  id TEXT PRIMARY KEY,
  user_id TEXT UNIQUE NOT NULL,
  business_name TEXT NOT NULL,
  trade_name TEXT,
  gstin TEXT,
  pan TEXT,
  drug_license_no TEXT,
  address TEXT NOT NULL,
  city TEXT,
  pincode TEXT,
  state TEXT NOT NULL DEFAULT 'Tamil Nadu',
  state_code TEXT NOT NULL DEFAULT '33',
  phone TEXT,
  email TEXT,
  invoice_prefix TEXT NOT NULL DEFAULT 'INV',
  financial_year TEXT NOT NULL DEFAULT '2026-2027',
  default_price_type TEXT NOT NULL DEFAULT 'exclusive',
  enable_round_off BOOLEAN NOT NULL DEFAULT TRUE,
  bank_details JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 4. Create financial_audit_logs table
CREATE TABLE IF NOT EXISTS public.financial_audit_logs (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  timestamp TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  actor TEXT NOT NULL,
  action TEXT NOT NULL,
  entity_id TEXT NOT NULL,
  entity_type TEXT NOT NULL,
  details JSONB DEFAULT '{}'::jsonb
);

-- 5. Performance Indexes
CREATE INDEX IF NOT EXISTS idx_billing_inv_user ON public.billing_invoices(user_id);
CREATE INDEX IF NOT EXISTS idx_billing_inv_date ON public.billing_invoices(invoice_date);
CREATE INDEX IF NOT EXISTS idx_billing_inv_status ON public.billing_invoices(invoice_status);
CREATE INDEX IF NOT EXISTS idx_billing_inv_payment ON public.billing_invoices(payment_status);
CREATE INDEX IF NOT EXISTS idx_billing_inv_pos ON public.billing_invoices(place_of_supply_code);
CREATE INDEX IF NOT EXISTS idx_billing_cn_user ON public.billing_credit_notes(user_id);
CREATE INDEX IF NOT EXISTS idx_billing_cn_inv ON public.billing_credit_notes(invoice_id);
CREATE INDEX IF NOT EXISTS idx_fin_audit_user ON public.financial_audit_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_fin_audit_entity ON public.financial_audit_logs(entity_id);

-- 6. Row Level Security (RLS)
ALTER TABLE public.billing_invoices ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.billing_credit_notes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.gst_tax_configurations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.financial_audit_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage their own billing invoices"
  ON public.billing_invoices
  FOR ALL
  USING (auth.uid()::text = user_id OR user_id = current_setting('request.jwt.claims', true)::json->>'sub');

CREATE POLICY "Users can manage their own credit notes"
  ON public.billing_credit_notes
  FOR ALL
  USING (auth.uid()::text = user_id OR user_id = current_setting('request.jwt.claims', true)::json->>'sub');

CREATE POLICY "Users can manage their own tax configurations"
  ON public.gst_tax_configurations
  FOR ALL
  USING (auth.uid()::text = user_id OR user_id = current_setting('request.jwt.claims', true)::json->>'sub');

CREATE POLICY "Users can view their own financial audit logs"
  ON public.financial_audit_logs
  FOR ALL
  USING (auth.uid()::text = user_id OR user_id = current_setting('request.jwt.claims', true)::json->>'sub');
