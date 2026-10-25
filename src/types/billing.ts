import { OrgType } from './index';

export type GstRate = 0 | 5 | 12 | 18 | 28;

export type TaxTreatment = 
  | 'taxable' 
  | 'exempt' 
  | 'nil_rated' 
  | 'zero_rated' 
  | 'non_gst';

export type CustomerType = 
  | 'b2c_patient' 
  | 'b2b_corporate' 
  | 'hospital' 
  | 'pharmacy' 
  | 'laboratory';

export type InvoiceCategory = 
  | 'pharmacy' 
  | 'opd_consultation' 
  | 'lab_test' 
  | 'procedure' 
  | 'room_rent' 
  | 'general_medical'
  | 'other';

export type InvoiceStatus = 
  | 'draft' 
  | 'issued' 
  | 'cancelled' 
  | 'credit_note_issued';

export type PaymentStatus = 
  | 'paid' 
  | 'partial' 
  | 'unpaid' 
  | 'overdue' 
  | 'refunded';

export type PaymentMethodType = 
  | 'cash' 
  | 'upi' 
  | 'card' 
  | 'bank_transfer' 
  | 'cheque' 
  | 'gateway';

export interface IndianState {
  code: string;
  name: string;
}

export interface BusinessTaxProfile {
  businessName: string;
  tradeName?: string;
  gstin: string;
  pan?: string;
  drugLicenseNo?: string;
  address: string;
  city: string;
  pincode: string;
  state: string;
  stateCode: string;
  phone: string;
  email: string;
  logoUrl?: string;
  invoicePrefix: string;
  financialYear: string; // e.g. "2026-2027"
  defaultPriceType: 'exclusive' | 'inclusive';
  enableRoundOff: boolean;
  bankDetails?: {
    bankName: string;
    accountHolderName: string;
    accountNumber: string;
    ifscCode: string;
    branchName?: string;
    upiId?: string;
  };
}

export interface CustomerBillingDetails {
  name: string;
  type: CustomerType;
  phone: string;
  email?: string;
  address?: string;
  city?: string;
  pincode?: string;
  state: string;
  stateCode: string;
  gstin?: string;
  patientId?: string;
  visitId?: string;
  prescriptionId?: string;
  labOrderId?: string;
  doctorName?: string;
  doctorId?: string;
}

export interface InvoiceLineItem {
  id: string;
  name: string;
  description?: string;
  category: InvoiceCategory;
  hsnSacCode: string; // e.g. "3004" for pharma, "999312" for healthcare
  quantity: number;
  unit: string; // "Tabs", "Strips", "Bottles", "Nos", "Consultation", "Test", "Days"
  unitPrice: number;
  discountPercent?: number;
  discountAmount: number;
  taxableAmount: number;
  gstRate: GstRate;
  isExempt?: boolean;
  taxTreatment: TaxTreatment;
  
  // Computed Tax breakdowns
  cgstRate: number;
  cgstAmount: number;
  sgstRate: number;
  sgstAmount: number;
  igstRate: number;
  igstAmount: number;
  totalTax: number;
  totalAmount: number;

  // Healthcare linkage
  batchNo?: string;
  expiryDate?: string;
  medicineId?: string;
  labTestId?: string;
}

export interface InvoicePaymentRecord {
  id: string;
  invoiceId: string;
  amount: number;
  paymentMethod: PaymentMethodType;
  transactionRef: string;
  paymentDate: string; // ISO string
  notes?: string;
  receivedBy?: string;
}

export interface TaxRateBreakdown {
  rate: GstRate;
  taxableValue: number;
  cgstAmount: number;
  sgstAmount: number;
  igstAmount: number;
  totalTax: number;
  cessAmount?: number;
}

export interface EnhancedInvoice {
  id: string; // Unique Invoice # e.g. "INV/2026-27/0001"
  invoiceSequence: number;
  series: string; // e.g. "INV-2627"
  invoiceDate: string; // ISO string
  dueDate?: string;
  financialYear: string; // "2026-2027"
  orgType: OrgType;

  // Header & Profiles
  businessDetails: BusinessTaxProfile;
  customerDetails: CustomerBillingDetails;

  // GST Logic & Classification
  placeOfSupply: string;
  placeOfSupplyCode: string;
  isInterState: boolean;
  priceType: 'exclusive' | 'inclusive';

  // Items & Calculations
  items: InvoiceLineItem[];
  subTotal: number; // Gross value before discount
  totalDiscount: number;
  totalTaxable: number;
  totalCgst: number;
  totalSgst: number;
  totalIgst: number;
  totalTax: number;
  roundOff: number; // between -0.49 and +0.49
  grandTotal: number;

  // Tax breakdowns grouped by rate
  taxBreakdowns: TaxRateBreakdown[];

  // Payment Tracking
  amountPaid: number;
  balanceDue: number;
  paymentStatus: PaymentStatus;
  invoiceStatus: InvoiceStatus;
  payments: InvoicePaymentRecord[];

  // Audit & Notes
  notes?: string;
  termsAndConditions?: string;
  creditNoteIds?: string[];
  
  createdAt: string;
  updatedAt: string;
  finalizedAt?: string;
  cancelledAt?: string;
  cancelReason?: string;
  createdBy?: string;
}

export interface CreditNoteItem {
  lineItemId?: string;
  name: string;
  hsnSacCode: string;
  quantity: number;
  unitPrice: number;
  taxableAmount: number;
  gstRate: GstRate;
  cgstAmount: number;
  sgstAmount: number;
  igstAmount: number;
  totalAmount: number;
  medicineId?: string;
  batchNo?: string;
}

export interface CreditNote {
  id: string; // E.g. "CN/2026-27/0001"
  creditNoteNumber: string;
  invoiceId: string;
  invoiceNumber: string;
  invoiceDate: string;
  date: string; // ISO string
  financialYear: string;
  reason: 
    | 'sales_return' 
    | 'deficiency_in_service' 
    | 'overcharge' 
    | 'order_cancellation' 
    | 'other';
  reasonDetails?: string;

  // Customer
  customerName: string;
  customerGstin?: string;
  stateCode: string;

  // Adjustments
  items: CreditNoteItem[];
  totalTaxableAdjustment: number;
  totalCgstAdjustment: number;
  totalSgstAdjustment: number;
  totalIgstAdjustment: number;
  totalRefundAmount: number;

  refundMethod: PaymentMethodType | 'credit_balance';
  refundStatus: 'issued' | 'completed';
  stockRestocked: boolean; // Whether pharmacy medicine stock was restored
  
  createdAt: string;
  createdBy?: string;
}

export interface FinancialAuditLog {
  id: string;
  timestamp: string;
  actor: string;
  action: 
    | 'invoice_created' 
    | 'invoice_finalized' 
    | 'invoice_cancelled' 
    | 'payment_recorded' 
    | 'credit_note_issued' 
    | 'tax_config_updated';
  entityId: string;
  entityType: 'invoice' | 'payment' | 'credit_note' | 'config';
  details: Record<string, any>;
}

export interface BillingDashboardMetrics {
  totalInvoiceValue: number;
  totalTaxableValue: number;
  totalCgst: number;
  totalSgst: number;
  totalIgst: number;
  totalGst: number;
  totalAmountReceived: number;
  outstandingReceivables: number;
  totalDiscounts: number;
  totalCreditNotesValue: number;
  totalCancelledValue: number;
  invoiceCount: number;
  paidCount: number;
  partialCount: number;
  unpaidCount: number;
  cancelledCount: number;
  
  // Payment Method Breakdown
  paymentMethodTotals: {
    cash: number;
    upi: number;
    card: number;
    bank_transfer: number;
    gateway: number;
    cheque: number;
  };

  // Tax Tier Breakdown
  taxTierTotals: Record<GstRate, { taxable: number; tax: number; count: number }>;
}

export interface DateRangeFilter {
  period: 'today' | 'week' | 'month' | 'quarter' | 'financial_year' | 'custom';
  startDate: string; // YYYY-MM-DD
  endDate: string;   // YYYY-MM-DD
  financialYear?: string;
}
