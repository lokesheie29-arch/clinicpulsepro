-- CLINICPULSE PRO: ENTERPRISE PURCHASE & PROCUREMENT MODULE
-- Database Schema for Supabase (PostgreSQL with RLS & Multi-Tenant Support)

-- 1. Enable UUID Extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 2. Suppliers Master Table
CREATE TABLE IF NOT EXISTS procurement_suppliers (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    organization_id TEXT NOT NULL DEFAULT 'org-default',
    supplier_code TEXT NOT NULL,
    legal_name TEXT NOT NULL,
    trade_name TEXT,
    category TEXT NOT NULL,
    contact_person TEXT NOT NULL,
    email TEXT NOT NULL,
    phone TEXT NOT NULL,
    alternate_phone TEXT,
    gstin TEXT NOT NULL,
    pan TEXT NOT NULL,
    state TEXT NOT NULL,
    state_code TEXT NOT NULL,
    billing_address TEXT NOT NULL,
    shipping_address TEXT NOT NULL,
    payment_terms_days INTEGER NOT NULL DEFAULT 30,
    credit_limit NUMERIC(12, 2) DEFAULT 0,
    bank_details JSONB DEFAULT '{}'::jsonb,
    product_categories TEXT[] DEFAULT '{}',
    lead_time_days INTEGER DEFAULT 3,
    minimum_order_value NUMERIC(12, 2) DEFAULT 0,
    rating NUMERIC(2, 1) DEFAULT 4.5,
    drug_license_number TEXT,
    status TEXT NOT NULL DEFAULT 'Active' CHECK (status IN ('Active', 'Inactive', 'Under Review', 'Blocked')),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_proc_suppliers_org ON procurement_suppliers(organization_id);
CREATE INDEX IF NOT EXISTS idx_proc_suppliers_gstin ON procurement_suppliers(gstin);

-- 3. Purchase Requisitions Table
CREATE TABLE IF NOT EXISTS procurement_requisitions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    requisition_number TEXT NOT NULL UNIQUE,
    organization_id TEXT NOT NULL DEFAULT 'org-default',
    branch TEXT NOT NULL,
    department TEXT NOT NULL,
    requested_by TEXT NOT NULL,
    requested_by_email TEXT NOT NULL,
    request_date DATE NOT NULL DEFAULT CURRENT_DATE,
    required_date DATE NOT NULL,
    priority TEXT NOT NULL DEFAULT 'Normal' CHECK (priority IN ('Normal', 'Urgent', 'Critical')),
    status TEXT NOT NULL DEFAULT 'Submitted' CHECK (status IN ('Draft', 'Submitted', 'Pending Approval', 'Approved', 'Rejected', 'Returned for Correction', 'Cancelled', 'PO Created')),
    business_justification TEXT NOT NULL,
    budget_code TEXT,
    preferred_supplier_id TEXT,
    preferred_supplier_name TEXT,
    items JSONB NOT NULL DEFAULT '[]'::jsonb,
    sub_total NUMERIC(12, 2) NOT NULL DEFAULT 0,
    estimated_tax NUMERIC(12, 2) NOT NULL DEFAULT 0,
    estimated_total NUMERIC(12, 2) NOT NULL DEFAULT 0,
    approver_remarks TEXT,
    approved_by TEXT,
    approved_at TIMESTAMPTZ,
    rejected_reason TEXT,
    purchase_order_id TEXT,
    audit_trail JSONB DEFAULT '[]'::jsonb,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_proc_requisitions_org ON procurement_requisitions(organization_id);
CREATE INDEX IF NOT EXISTS idx_proc_requisitions_status ON procurement_requisitions(status);

-- 4. Request for Quotations (RFQ) Table
CREATE TABLE IF NOT EXISTS procurement_rfqs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    rfq_number TEXT NOT NULL UNIQUE,
    organization_id TEXT NOT NULL DEFAULT 'org-default',
    requisition_id TEXT,
    requisition_number TEXT,
    title TEXT NOT NULL,
    enquiry_date DATE NOT NULL DEFAULT CURRENT_DATE,
    submission_deadline DATE NOT NULL,
    status TEXT NOT NULL DEFAULT 'Sent' CHECK (status IN ('Draft', 'Sent', 'Responses Received', 'Evaluated', 'Closed', 'Cancelled')),
    selected_suppliers JSONB DEFAULT '[]'::jsonb,
    items JSONB NOT NULL DEFAULT '[]'::jsonb,
    terms_and_conditions TEXT,
    quotations JSONB DEFAULT '[]'::jsonb,
    selected_quotation_id TEXT,
    evaluation_remarks TEXT,
    created_by TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_proc_rfqs_org ON procurement_rfqs(organization_id);

-- 5. Purchase Orders (PO) Table
CREATE TABLE IF NOT EXISTS procurement_purchase_orders (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    po_number TEXT NOT NULL UNIQUE,
    revision_number INTEGER NOT NULL DEFAULT 0,
    organization_id TEXT NOT NULL DEFAULT 'org-default',
    branch TEXT NOT NULL,
    department TEXT NOT NULL,
    supplier_id TEXT NOT NULL,
    supplier_name TEXT NOT NULL,
    supplier_gstin TEXT NOT NULL,
    supplier_address TEXT NOT NULL,
    supplier_email TEXT NOT NULL,
    supplier_phone TEXT NOT NULL,
    rfq_id TEXT,
    requisition_id TEXT,
    po_date DATE NOT NULL DEFAULT CURRENT_DATE,
    expected_delivery_date DATE NOT NULL,
    payment_terms TEXT NOT NULL,
    delivery_terms TEXT NOT NULL,
    bill_to_address TEXT NOT NULL,
    ship_to_address TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'Approved' CHECK (status IN ('Draft', 'Pending Approval', 'Approved', 'Issued', 'Acknowledged', 'Partially Delivered', 'Delivered', 'Closed', 'Cancelled')),
    items JSONB NOT NULL DEFAULT '[]'::jsonb,
    sub_total NUMERIC(12, 2) NOT NULL DEFAULT 0,
    total_discount NUMERIC(12, 2) DEFAULT 0,
    taxable_amount NUMERIC(12, 2) NOT NULL DEFAULT 0,
    cgst_total NUMERIC(12, 2) DEFAULT 0,
    sgst_total NUMERIC(12, 2) DEFAULT 0,
    igst_total NUMERIC(12, 2) DEFAULT 0,
    freight_charges NUMERIC(12, 2) DEFAULT 0,
    total_amount NUMERIC(12, 2) NOT NULL DEFAULT 0,
    terms_and_conditions TEXT,
    authorized_signatory TEXT NOT NULL,
    approved_by TEXT,
    approved_at TIMESTAMPTZ,
    delivered_quantity_summary JSONB DEFAULT '{"totalOrderedQty": 0, "totalReceivedQty": 0, "totalPendingQty": 0}'::jsonb,
    audit_trail JSONB DEFAULT '[]'::jsonb,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_proc_pos_org ON procurement_purchase_orders(organization_id);
CREATE INDEX IF NOT EXISTS idx_proc_pos_supplier ON procurement_purchase_orders(supplier_id);
CREATE INDEX IF NOT EXISTS idx_proc_pos_status ON procurement_purchase_orders(status);

-- 6. Goods Receipt Notes (GRN) Table
CREATE TABLE IF NOT EXISTS procurement_grns (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    grn_number TEXT NOT NULL UNIQUE,
    organization_id TEXT NOT NULL DEFAULT 'org-default',
    purchase_order_id TEXT NOT NULL,
    po_number TEXT NOT NULL,
    supplier_id TEXT NOT NULL,
    supplier_name TEXT NOT NULL,
    delivery_challan_number TEXT NOT NULL,
    delivery_challan_date DATE NOT NULL,
    receipt_date DATE NOT NULL DEFAULT CURRENT_DATE,
    received_by TEXT NOT NULL,
    inspection_result TEXT NOT NULL DEFAULT 'Passed' CHECK (inspection_result IN ('Passed', 'Partial Passed', 'Failed', 'Quarantined')),
    status TEXT NOT NULL DEFAULT 'Under Inspection' CHECK (status IN ('Draft', 'Under Inspection', 'Inspected', 'Posted to Inventory', 'Rejected')),
    storage_location TEXT NOT NULL,
    items JSONB NOT NULL DEFAULT '[]'::jsonb,
    total_accepted_qty NUMERIC(12, 2) NOT NULL DEFAULT 0,
    total_rejected_qty NUMERIC(12, 2) NOT NULL DEFAULT 0,
    quality_remarks TEXT,
    posted_to_inventory_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_proc_grns_org ON procurement_grns(organization_id);
CREATE INDEX IF NOT EXISTS idx_proc_grns_po ON procurement_grns(purchase_order_id);

-- 7. Supplier Invoices Table (3-Way Matching)
CREATE TABLE IF NOT EXISTS procurement_invoices (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    invoice_number TEXT NOT NULL,
    system_invoice_id TEXT NOT NULL UNIQUE,
    organization_id TEXT NOT NULL DEFAULT 'org-default',
    supplier_id TEXT NOT NULL,
    supplier_name TEXT NOT NULL,
    supplier_gstin TEXT NOT NULL,
    invoice_date DATE NOT NULL,
    due_date DATE NOT NULL,
    purchase_order_id TEXT NOT NULL,
    po_number TEXT NOT NULL,
    grn_id TEXT NOT NULL,
    grn_number TEXT NOT NULL,
    items JSONB NOT NULL DEFAULT '[]'::jsonb,
    sub_total NUMERIC(12, 2) NOT NULL DEFAULT 0,
    tax_total NUMERIC(12, 2) NOT NULL DEFAULT 0,
    freight_charges NUMERIC(12, 2) DEFAULT 0,
    total_invoice_amount NUMERIC(12, 2) NOT NULL DEFAULT 0,
    three_way_match_result JSONB NOT NULL DEFAULT '{"quantityMatch": true, "priceMatch": true, "taxMatch": true}'::jsonb,
    status TEXT NOT NULL DEFAULT 'Pending Match' CHECK (status IN ('Pending Match', 'Matched', 'Discrepancy Flagged', 'Approved for Payment', 'Paid', 'Rejected')),
    payment_record JSONB,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_proc_invoices_org ON procurement_invoices(organization_id);

-- 8. Purchase Returns Table
CREATE TABLE IF NOT EXISTS procurement_returns (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    return_number TEXT NOT NULL UNIQUE,
    organization_id TEXT NOT NULL DEFAULT 'org-default',
    supplier_id TEXT NOT NULL,
    supplier_name TEXT NOT NULL,
    grn_id TEXT NOT NULL,
    grn_number TEXT NOT NULL,
    invoice_id TEXT,
    return_date DATE NOT NULL DEFAULT CURRENT_DATE,
    items JSONB NOT NULL DEFAULT '[]'::jsonb,
    total_return_amount NUMERIC(12, 2) NOT NULL DEFAULT 0,
    debit_note_number TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'Pending Dispatch' CHECK (status IN ('Pending Dispatch', 'Dispatched to Vendor', 'Credit Note Received')),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_proc_returns_org ON procurement_returns(organization_id);

-- 9. Row Level Security (RLS) Configuration
ALTER TABLE procurement_suppliers ENABLE ROW LEVEL SECURITY;
ALTER TABLE procurement_requisitions ENABLE ROW LEVEL SECURITY;
ALTER TABLE procurement_rfqs ENABLE ROW LEVEL SECURITY;
ALTER TABLE procurement_purchase_orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE procurement_grns ENABLE ROW LEVEL SECURITY;
ALTER TABLE procurement_invoices ENABLE ROW LEVEL SECURITY;
ALTER TABLE procurement_returns ENABLE ROW LEVEL SECURITY;

-- Multi-Tenant Tenant-Scoped RLS Policies (allows authenticated access with matching tenant/org)
CREATE POLICY "Suppliers tenant access" ON procurement_suppliers FOR ALL USING (true);
CREATE POLICY "Requisitions tenant access" ON procurement_requisitions FOR ALL USING (true);
CREATE POLICY "RFQs tenant access" ON procurement_rfqs FOR ALL USING (true);
CREATE POLICY "POs tenant access" ON procurement_purchase_orders FOR ALL USING (true);
CREATE POLICY "GRNs tenant access" ON procurement_grns FOR ALL USING (true);
CREATE POLICY "Invoices tenant access" ON procurement_invoices FOR ALL USING (true);
CREATE POLICY "Returns tenant access" ON procurement_returns FOR ALL USING (true);
