import { 
  EnhancedInvoice, 
  CreditNote, 
  BusinessTaxProfile, 
  FinancialAuditLog, 
  DateRangeFilter, 
  BillingDashboardMetrics, 
  GstRate,
  InvoiceLineItem
} from '../types/billing';
import { 
  calculateInvoiceSummary, 
  getCurrentFinancialYear, 
  roundPaise, 
  isInterStateTransaction 
} from './gstEngine';
import { supabase } from './supabase';

export { roundPaise } from './gstEngine';

const INVOICE_STORAGE_KEY = 'clinicpulse_billing_invoices_v1';
const CN_STORAGE_KEY = 'clinicpulse_billing_credit_notes_v1';
const TAX_PROFILE_KEY = 'clinicpulse_business_tax_profile_v1';
const AUDIT_STORAGE_KEY = 'clinicpulse_financial_audit_logs_v1';

export const DEFAULT_BUSINESS_TAX_PROFILE: BusinessTaxProfile = {
  businessName: 'CLINICPULSE MULTISPECIALTY & PHARMACY ERP',
  tradeName: 'ClinicPulse Healthcare Center',
  gstin: '33ABCDE1234F1Z5',
  pan: 'ABCDE1234F',
  drugLicenseNo: 'TN-KPM-20B-102948',
  address: 'No.29, Kamarajar Street, Pallavan Nagar, TNHB, Kancheepuram, Tamil Nadu. 631501',
  city: 'Kancheepuram',
  pincode: '631501',
  state: 'Tamil Nadu',
  stateCode: '33',
  phone: '+91 72001 24136',
  email: 'billing@clinicpulsepro.com',
  invoicePrefix: 'INV',
  financialYear: getCurrentFinancialYear(),
  defaultPriceType: 'exclusive',
  enableRoundOff: true,
  bankDetails: {
    bankName: 'HDFC Bank Ltd',
    accountHolderName: 'CLINICPULSE HEALTHCARE SERVICES',
    accountNumber: '50200088992211',
    ifscCode: 'HDFC0001234',
    branchName: 'Kancheepuram Main Branch',
    upiId: 'clinicpulse@hdfcbank'
  }
};

/**
 * Generates seed/initial enhanced invoices with proper Indian GST data
 */
export const getInitialEnhancedInvoices = (): EnhancedInvoice[] => {
  const fy = getCurrentFinancialYear();
  const profile = DEFAULT_BUSINESS_TAX_PROFILE;

  const inv1Items: InvoiceLineItem[] = [
    {
      id: 'item-1',
      name: 'Consultation - Senior Physician (OPD)',
      category: 'opd_consultation',
      hsnSacCode: '999312',
      quantity: 1,
      unit: 'Consultation',
      unitPrice: 500,
      discountAmount: 0,
      taxableAmount: 500,
      gstRate: 0,
      isExempt: true,
      taxTreatment: 'exempt',
      cgstRate: 0,
      cgstAmount: 0,
      sgstRate: 0,
      sgstAmount: 0,
      igstRate: 0,
      igstAmount: 0,
      totalTax: 0,
      totalAmount: 500
    },
    {
      id: 'item-2',
      name: 'Dolo 500 (Paracetamol 500mg)',
      category: 'pharmacy',
      hsnSacCode: '3004',
      quantity: 20,
      unit: 'Tabs',
      unitPrice: 2.0,
      discountAmount: 4.0, // 10% off
      taxableAmount: 36.0,
      gstRate: 12,
      isExempt: false,
      taxTreatment: 'taxable',
      cgstRate: 6,
      cgstAmount: 2.16,
      sgstRate: 6,
      sgstAmount: 2.16,
      igstRate: 0,
      igstAmount: 0,
      totalTax: 4.32,
      totalAmount: 40.32,
      batchNo: 'B202601',
      expiryDate: '2027-08-30'
    },
    {
      id: 'item-3',
      name: 'Zincovit Tablets (Vitamins + Zinc)',
      category: 'pharmacy',
      hsnSacCode: '2106',
      quantity: 15,
      unit: 'Tabs',
      unitPrice: 4.0,
      discountAmount: 0,
      taxableAmount: 60.0,
      gstRate: 18,
      isExempt: false,
      taxTreatment: 'taxable',
      cgstRate: 9,
      cgstAmount: 5.4,
      sgstRate: 9,
      sgstAmount: 5.4,
      igstRate: 0,
      igstAmount: 0,
      totalTax: 10.8,
      totalAmount: 70.8,
      batchNo: 'B202604',
      expiryDate: '2027-04-15'
    }
  ];

  const summary1 = calculateInvoiceSummary(inv1Items, true);

  const inv1: EnhancedInvoice = {
    id: 'INV/2026-27/0001',
    invoiceNumber: 'INV/2026-27/0001',
    invoiceSequence: 1,
    series: 'INV-2627',
    invoiceDate: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000).toISOString(),
    date: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    financialYear: fy,
    orgType: 'hospital',
    businessDetails: profile,
    customerDetails: {
      name: 'Ramesh Kumar',
      type: 'b2c_patient',
      phone: '9876543210',
      address: '24, Gandhi Road',
      city: 'Chennai',
      state: 'Tamil Nadu',
      stateCode: '33',
      patientId: 'PT-1001',
      doctorName: 'Dr. Rajesh Sharma, MD'
    },
    customerName: 'Ramesh Kumar',
    customerPhone: '9876543210',
    customerType: 'b2c_patient',
    isB2B: false,
    category: 'opd_consultation',
    placeOfSupply: 'Tamil Nadu (33)',
    placeOfSupplyCode: '33',
    placeOfSupplyStateName: 'Tamil Nadu',
    placeOfSupplyStateCode: '33',
    isInterState: false,
    priceType: 'exclusive',
    items: inv1Items,
    ...summary1,
    taxableAmount: summary1.totalTaxable,
    cgstAmount: summary1.totalCgst,
    sgstAmount: summary1.totalSgst,
    igstAmount: summary1.totalIgst,
    totalAmount: summary1.grandTotal,
    amountPaid: summary1.grandTotal,
    paidAmount: summary1.grandTotal,
    balanceDue: 0,
    paymentStatus: 'paid',
    invoiceStatus: 'issued',
    status: 'issued',
    payments: [
      {
        id: 'PAY-1001',
        invoiceId: 'INV/2026-27/0001',
        amount: summary1.grandTotal,
        paymentMethod: 'upi',
        transactionRef: 'UPI/260410/948271',
        paymentDate: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000).toISOString(),
        receivedBy: 'Receptionist Priya'
      }
    ],
    createdAt: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000).toISOString(),
    updatedAt: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000).toISOString(),
    finalizedAt: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000).toISOString()
  };

  // Inter-State B2B Invoice (Bangalore Corporate, Karnataka 29 -> Tamil Nadu 33: IGST applies)
  const inv2Items: InvoiceLineItem[] = [
    {
      id: 'item-201',
      name: 'Complete Health Diagnostic Package B2B',
      category: 'lab_test',
      hsnSacCode: '999316',
      quantity: 5,
      unit: 'Test',
      unitPrice: 1200,
      discountAmount: 600, // 10% volume discount
      taxableAmount: 5400,
      gstRate: 0,
      isExempt: true,
      taxTreatment: 'exempt',
      cgstRate: 0,
      cgstAmount: 0,
      sgstRate: 0,
      sgstAmount: 0,
      igstRate: 0,
      igstAmount: 0,
      totalTax: 0,
      totalAmount: 5400
    },
    {
      id: 'item-202',
      name: 'Sterile Surgical Glove Boxes (HSN 9018)',
      category: 'general_medical',
      hsnSacCode: '9018',
      quantity: 10,
      unit: 'Boxes',
      unitPrice: 450,
      discountAmount: 0,
      taxableAmount: 4500,
      gstRate: 12,
      isExempt: false,
      taxTreatment: 'taxable',
      cgstRate: 0,
      cgstAmount: 0,
      sgstRate: 0,
      sgstAmount: 0,
      igstRate: 12,
      igstAmount: 540,
      totalTax: 540,
      totalAmount: 5040
    }
  ];

  const summary2 = calculateInvoiceSummary(inv2Items, true);

  const inv2: EnhancedInvoice = {
    id: 'INV/2026-27/0002',
    invoiceNumber: 'INV/2026-27/0002',
    invoiceSequence: 2,
    series: 'INV-2627',
    invoiceDate: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
    date: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    financialYear: fy,
    orgType: 'hospital',
    businessDetails: profile,
    customerDetails: {
      name: 'BioTech Solutions India Pvt Ltd',
      type: 'b2b_corporate',
      phone: '9845012345',
      email: 'finance@biotechindia.com',
      address: '77, Electronic City Phase 1',
      city: 'Bengaluru',
      state: 'Karnataka',
      stateCode: '29',
      gstin: '29AABCB1234P1Z4'
    },
    customerName: 'BioTech Solutions India Pvt Ltd',
    customerPhone: '9845012345',
    customerGstin: '29AABCB1234P1Z4',
    customerType: 'b2b_corporate',
    isB2B: true,
    category: 'lab_test',
    placeOfSupply: 'Karnataka (29)',
    placeOfSupplyCode: '29',
    placeOfSupplyStateName: 'Karnataka',
    placeOfSupplyStateCode: '29',
    isInterState: true,
    priceType: 'exclusive',
    items: inv2Items,
    ...summary2,
    taxableAmount: summary2.totalTaxable,
    cgstAmount: summary2.totalCgst,
    sgstAmount: summary2.totalSgst,
    igstAmount: summary2.totalIgst,
    totalAmount: summary2.grandTotal,
    amountPaid: 5000,
    paidAmount: 5000,
    balanceDue: roundPaise(summary2.grandTotal - 5000),
    paymentStatus: 'partial',
    invoiceStatus: 'issued',
    status: 'issued',
    payments: [
      {
        id: 'PAY-1002',
        invoiceId: 'INV/2026-27/0002',
        amount: 5000,
        paymentMethod: 'bank_transfer',
        transactionRef: 'NEFT/HDFC/20261021/008291',
        paymentDate: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
        notes: 'Advance part payment received via NEFT'
      }
    ],
    createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
    updatedAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
    finalizedAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString()
  };

  return [inv1, inv2];
};

/**
 * Loads invoices from local cache or initializes defaults
 */
export const getStoredInvoices = (): EnhancedInvoice[] => {
  const cached = localStorage.getItem(INVOICE_STORAGE_KEY);
  if (cached) {
    try {
      const parsed = JSON.parse(cached);
      if (Array.isArray(parsed) && parsed.length > 0) return parsed;
    } catch {}
  }
  const initial = getInitialEnhancedInvoices();
  saveInvoicesToStorage(initial);
  return initial;
};

export const saveInvoicesToStorage = (invoices: EnhancedInvoice[]): void => {
  localStorage.setItem(INVOICE_STORAGE_KEY, JSON.stringify(invoices));
};

export const getStoredCreditNotes = (): CreditNote[] => {
  const cached = localStorage.getItem(CN_STORAGE_KEY);
  if (cached) {
    try {
      return JSON.parse(cached);
    } catch {}
  }
  return [];
};

export const saveCreditNotesToStorage = (notes: CreditNote[]): void => {
  localStorage.setItem(CN_STORAGE_KEY, JSON.stringify(notes));
};

export const getStoredTaxProfile = (): BusinessTaxProfile => {
  const cached = localStorage.getItem(TAX_PROFILE_KEY);
  if (cached) {
    try {
      return JSON.parse(cached);
    } catch {}
  }
  return DEFAULT_BUSINESS_TAX_PROFILE;
};

export const saveTaxProfileToStorage = (profile: BusinessTaxProfile): void => {
  localStorage.setItem(TAX_PROFILE_KEY, JSON.stringify(profile));
};

export const getStoredAuditLogs = (): FinancialAuditLog[] => {
  const cached = localStorage.getItem(AUDIT_STORAGE_KEY);
  if (cached) {
    try {
      return JSON.parse(cached);
    } catch {}
  }
  return [];
};

export const appendAuditLog = (
  actor: string,
  action: FinancialAuditLog['action'],
  entityId: string,
  entityType: FinancialAuditLog['entityType'],
  details: Record<string, any>
): void => {
  const logs = getStoredAuditLogs();
  const entry: FinancialAuditLog = {
    id: `AUD-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
    timestamp: new Date().toISOString(),
    actor: actor || 'Clinic Staff',
    action,
    entityId,
    entityType,
    details
  };
  logs.unshift(entry);
  localStorage.setItem(AUDIT_STORAGE_KEY, JSON.stringify(logs.slice(0, 500))); // keep latest 500

  // Background sync to Supabase if configured
  if (supabase) {
    supabase.from('financial_audit_logs').insert([{
      id: entry.id,
      user_id: 'tenant',
      timestamp: entry.timestamp,
      actor: entry.actor,
      action: entry.action,
      entity_id: entry.entityId,
      entity_type: entry.entityType,
      details: entry.details
    }]).then(() => {}, () => {});
  }
};

/**
 * Calculates next invoice number in sequence for the given prefix and financial year
 */
export const getNextInvoiceNumber = (
  invoices: EnhancedInvoice[],
  prefix: string = 'INV',
  fy: string = getCurrentFinancialYear()
): { id: string; sequence: number; series: string } => {
  const series = `${prefix}-${fy.replace('-', '').slice(2)}`;
  let maxSeq = 0;
  invoices.forEach(inv => {
    if (inv.financialYear === fy) {
      if (inv.invoiceSequence && inv.invoiceSequence > maxSeq) {
        maxSeq = inv.invoiceSequence;
      }
    }
  });

  const nextSeq = maxSeq + 1;
  const seqPadded = String(nextSeq).padStart(4, '0');
  const id = `${prefix}/${fy}/${seqPadded}`;

  return { id, sequence: nextSeq, series };
};

/**
 * Calculates next credit note number in sequence
 */
export const getNextCreditNoteNumber = (
  creditNotes: CreditNote[],
  fy: string = getCurrentFinancialYear()
): string => {
  let maxSeq = 0;
  creditNotes.forEach(cn => {
    if (cn.financialYear === fy) {
      const match = cn.creditNoteNumber.match(/\d+$/);
      if (match) {
        const num = parseInt(match[0], 10);
        if (num > maxSeq) maxSeq = num;
      }
    }
  });
  const nextSeq = maxSeq + 1;
  return `CN/${fy}/${String(nextSeq).padStart(4, '0')}`;
};

/**
 * Filters invoices and credit notes by DateRangeFilter
 */
export const filterRecordsByDate = <T extends { invoiceDate?: string; date?: string; createdAt?: string }>(
  records: T[],
  filter: DateRangeFilter
): T[] => {
  const start = new Date(filter.startDate).getTime();
  const end = new Date(filter.endDate).getTime() + (24 * 60 * 60 * 1000 - 1); // end of day

  return records.filter(r => {
    const rawDate = r.invoiceDate || r.date || r.createdAt;
    if (!rawDate) return false;
    const time = new Date(rawDate).getTime();
    return time >= start && time <= end;
  });
};

/**
 * Computes comprehensive billing dashboard metrics
 */
export const computeDashboardMetrics = (
  invoices: EnhancedInvoice[],
  creditNotes: CreditNote[],
  filter: DateRangeFilter
): BillingDashboardMetrics => {
  const filteredInvoices = filterRecordsByDate(invoices, filter);
  const filteredCreditNotes = filterRecordsByDate(creditNotes, filter);

  let totalInvoiceValue = 0;
  let totalTaxableValue = 0;
  let totalCgst = 0;
  let totalSgst = 0;
  let totalIgst = 0;
  let totalTax = 0;
  let totalAmountReceived = 0;
  let outstandingReceivables = 0;
  let totalDiscounts = 0;
  let totalCancelledValue = 0;

  let paidCount = 0;
  let partialCount = 0;
  let unpaidCount = 0;
  let cancelledCount = 0;

  const paymentMethodTotals = {
    cash: 0,
    upi: 0,
    card: 0,
    bank_transfer: 0,
    gateway: 0,
    cheque: 0
  };

  const taxTierTotals: Record<GstRate, { taxable: number; tax: number; count: number }> = {
    0: { taxable: 0, tax: 0, count: 0 },
    5: { taxable: 0, tax: 0, count: 0 },
    12: { taxable: 0, tax: 0, count: 0 },
    18: { taxable: 0, tax: 0, count: 0 },
    28: { taxable: 0, tax: 0, count: 0 }
  };

  filteredInvoices.forEach(inv => {
    if (inv.invoiceStatus === 'cancelled' || inv.status === 'cancelled') {
      cancelledCount++;
      totalCancelledValue += (inv.grandTotal ?? inv.totalAmount ?? 0);
      return; // Do not include cancelled bills in taxable revenue
    }

    const gTotal = inv.grandTotal ?? inv.totalAmount ?? 0;
    const tTaxable = inv.totalTaxable ?? inv.taxableAmount ?? 0;
    const tCgst = inv.totalCgst ?? inv.cgstAmount ?? 0;
    const tSgst = inv.totalSgst ?? inv.sgstAmount ?? 0;
    const tIgst = inv.totalIgst ?? inv.igstAmount ?? 0;
    const tTax = inv.totalTax ?? (tCgst + tSgst + tIgst);
    const aPaid = inv.amountPaid ?? inv.paidAmount ?? 0;
    const bDue = inv.balanceDue ?? 0;
    const tDisc = inv.totalDiscount ?? 0;

    totalInvoiceValue += gTotal;
    totalTaxableValue += tTaxable;
    totalCgst += tCgst;
    totalSgst += tSgst;
    totalIgst += tIgst;
    totalTax += tTax;
    totalAmountReceived += aPaid;
    outstandingReceivables += bDue;
    totalDiscounts += tDisc;

    if (inv.paymentStatus === 'paid') paidCount++;
    else if (inv.paymentStatus === 'partial') partialCount++;
    else unpaidCount++;

    // Payments breakdown
    inv.payments.forEach(p => {
      if (p.paymentMethod in paymentMethodTotals) {
        paymentMethodTotals[p.paymentMethod] += p.amount;
      }
    });

    // Tax tiers
    inv.items.forEach(item => {
      const rate = item.gstRate in taxTierTotals ? item.gstRate : 0;
      taxTierTotals[rate].taxable += item.taxableAmount;
      taxTierTotals[rate].tax += item.totalTax;
      taxTierTotals[rate].count++;
    });
  });

  // Credit notes total value
  let totalCreditNotesValue = 0;
  filteredCreditNotes.forEach(cn => {
    totalCreditNotesValue += cn.totalRefundAmount;
  });

  return {
    totalInvoiceValue: roundPaise(totalInvoiceValue),
    totalTaxableValue: roundPaise(totalTaxableValue),
    totalCgst: roundPaise(totalCgst),
    totalSgst: roundPaise(totalSgst),
    totalIgst: roundPaise(totalIgst),
    totalGst: roundPaise(totalTax),
    totalAmountReceived: roundPaise(totalAmountReceived),
    outstandingReceivables: roundPaise(outstandingReceivables),
    totalDiscounts: roundPaise(totalDiscounts),
    totalCreditNotesValue: roundPaise(totalCreditNotesValue),
    totalCancelledValue: roundPaise(totalCancelledValue),
    invoiceCount: filteredInvoices.length,
    paidCount,
    partialCount,
    unpaidCount,
    cancelledCount,
    paymentMethodTotals: {
      cash: roundPaise(paymentMethodTotals.cash),
      upi: roundPaise(paymentMethodTotals.upi),
      card: roundPaise(paymentMethodTotals.card),
      bank_transfer: roundPaise(paymentMethodTotals.bank_transfer),
      gateway: roundPaise(paymentMethodTotals.gateway),
      cheque: roundPaise(paymentMethodTotals.cheque)
    },
    taxTierTotals
  };
};

/**
 * Escapes values for safe CSV export (prevents CSV formula injection e.g. =cmd|)
 */
export const sanitizeCsvCell = (val: any): string => {
  if (val === null || val === undefined) return '""';
  let str = String(val).trim();

  // Prevent formula injection
  if (/^[=+\-@\t\r]/.test(str)) {
    str = `'` + str;
  }

  // Escape inner double quotes
  str = str.replace(/"/g, '""');
  return `"${str}"`;
};

/**
 * Polymorphic client-side CSV download helper supporting both:
 * 1) downloadCsv(filename, headers, rows)
 * 2) downloadCsv(rows, filename, columnDefs)
 */
export function downloadCsv(
  arg1: string | Record<string, any>[],
  arg2: string[] | string,
  arg3?: (string | number)[][] | { header: string; key: string }[]
): void {
  let filename: string;
  let headers: string[];
  let rowLines: string[];

  if (typeof arg1 === 'string' && Array.isArray(arg2)) {
    // Standard format: (filename, headers, rows)
    filename = arg1;
    headers = arg2;
    const rows = (arg3 as (string | number)[][]) || [];
    rowLines = rows.map(r => r.map(sanitizeCsvCell).join(','));
  } else if (Array.isArray(arg1) && typeof arg2 === 'string') {
    // Array of objects format: (rows, filename, columns)
    const objects = arg1;
    filename = arg2;
    const cols = (arg3 as { header: string; key: string }[]) || [];
    headers = cols.map(c => c.header);
    rowLines = objects.map(obj => cols.map(c => sanitizeCsvCell(obj[c.key])).join(','));
  } else {
    return;
  }

  const headerLine = headers.map(sanitizeCsvCell).join(',');
  const csvContent = '\uFEFF' + [headerLine, ...rowLines].join('\r\n');

  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', filename.endsWith('.csv') ? filename : `${filename}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
