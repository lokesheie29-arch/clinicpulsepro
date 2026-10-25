import { EnhancedInvoice, CreditNote, DateRangeFilter } from '../types/billing';
import { filterRecordsByDate } from './billingService';
import { HEALTHCARE_TAX_CLASSIFICATIONS, roundPaise } from './gstEngine';

export interface SalesRegisterRow {
  invoiceNumber: string;
  invoiceDate: string;
  customerName: string;
  customerGstin: string;
  customerType: string;
  placeOfSupply: string;
  isInterState: string;
  supplyType: string;
  subTotal: number;
  discount: number;
  taxableValue: number;
  cgst: number;
  sgst: number;
  igst: number;
  totalTax: number;
  roundOff: number;
  invoiceTotal: number;
  paymentStatus: string;
  invoiceStatus: string;
}

export interface GstRateSummaryRow {
  rate: number;
  rateLabel: string;
  taxableValue: number;
  cgst: number;
  sgst: number;
  igst: number;
  totalTax: number;
  itemCount: number;
}

export interface HsnSummaryRow {
  hsnSacCode: string;
  description: string;
  uqc: string;
  totalQuantity: number;
  totalValue: number;
  taxableValue: number;
  cgst: number;
  sgst: number;
  igst: number;
  totalTax: number;
}

export interface B2bRow {
  gstin: string;
  customerName: string;
  invoiceNumber: string;
  invoiceDate: string;
  placeOfSupply: string;
  taxableValue: number;
  cgst: number;
  sgst: number;
  igst: number;
  invoiceTotal: number;
}

export interface CreditNoteRegisterRow {
  creditNoteNumber: string;
  date: string;
  invoiceNumber: string;
  invoiceDate: string;
  customerName: string;
  customerGstin: string;
  reason: string;
  taxableAdjustment: number;
  cgstAdjustment: number;
  sgstAdjustment: number;
  igstAdjustment: number;
  totalRefundAmount: number;
  stockRestocked: string;
  refundStatus: string;
}

export interface TaxLiabilitySummary {
  taxableOutwardSupplies: number;
  exemptNilRatedSupplies: number;
  zeroRatedSupplies: number;
  totalOutwardSupplies: number;
  outputCgst: number;
  outputSgst: number;
  outputIgst: number;
  totalOutputTax: number;
  creditNoteCgstAdjustment: number;
  creditNoteSgstAdjustment: number;
  creditNoteIgstAdjustment: number;
  totalCreditNoteTaxAdjustment: number;
  netCgstLiability: number;
  netSgstLiability: number;
  netIgstLiability: number;
  netTotalGstLiability: number;
}

export interface ReconciliationReport {
  totalInvoiced: number;
  totalCollected: number;
  totalReceivables: number;
  totalCreditNotes: number;
  cancelledInvoicesCount: number;
  cancelledInvoicesValue: number;
  fullyPaidInvoicesCount: number;
  partialInvoicesCount: number;
  unpaidInvoicesCount: number;
  discrepancies: {
    type: 'warning' | 'error' | 'info';
    title: string;
    description: string;
    invoiceNumber?: string;
  }[];
}

/**
 * 1. Generates the Sales Register (GSTR-1 Outward Supplies format)
 */
export const generateSalesRegister = (
  invoices: EnhancedInvoice[],
  filter?: DateRangeFilter
): SalesRegisterRow[] => {
  const filtered = filter ? filterRecordsByDate(invoices, filter) : invoices;

  return filtered.map(inv => {
    const isCancelled = inv.invoiceStatus === 'cancelled';
    const isB2b = !!inv.customerDetails.gstin && inv.customerDetails.gstin.trim().length === 15;
    const isLargeInterState = inv.isInterState && !isB2b && inv.grandTotal > 250000;
    const custTypeLabel = isB2b ? 'B2B Registered' : isLargeInterState ? 'B2C Large' : 'B2C Small';

    return {
      invoiceNumber: inv.id,
      invoiceDate: new Date(inv.invoiceDate).toLocaleDateString('en-IN'),
      customerName: inv.customerDetails.name,
      customerGstin: inv.customerDetails.gstin || 'URP (Unregistered)',
      customerType: custTypeLabel,
      placeOfSupply: inv.placeOfSupply,
      isInterState: inv.isInterState ? 'Inter-State (IGST)' : 'Intra-State (CGST+SGST)',
      supplyType: inv.totalTax > 0 ? 'Regular Taxable' : 'Exempt Healthcare',
      subTotal: isCancelled ? 0 : inv.subTotal,
      discount: isCancelled ? 0 : inv.totalDiscount,
      taxableValue: isCancelled ? 0 : inv.totalTaxable,
      cgst: isCancelled ? 0 : inv.totalCgst,
      sgst: isCancelled ? 0 : inv.totalSgst,
      igst: isCancelled ? 0 : inv.totalIgst,
      totalTax: isCancelled ? 0 : inv.totalTax,
      roundOff: isCancelled ? 0 : inv.roundOff,
      invoiceTotal: isCancelled ? 0 : inv.grandTotal,
      paymentStatus: inv.paymentStatus.toUpperCase(),
      invoiceStatus: isCancelled ? 'CANCELLED (VOID)' : inv.invoiceStatus.toUpperCase()
    };
  });
};

/**
 * 2. Generates Rate-wise GST Summary (0%, 5%, 12%, 18%, 28%)
 */
export const generateGstRateSummary = (
  invoices: EnhancedInvoice[],
  filter?: DateRangeFilter
): GstRateSummaryRow[] => {
  const filtered = filter ? filterRecordsByDate(invoices, filter) : invoices;
  const rates = [0, 5, 12, 18, 28];

  const summaryMap: Record<number, GstRateSummaryRow> = {};
  rates.forEach(r => {
    summaryMap[r] = {
      rate: r,
      rateLabel: r === 0 ? '0% (Exempt / Nil Rated)' : `${r}% GST`,
      taxableValue: 0,
      cgst: 0,
      sgst: 0,
      igst: 0,
      totalTax: 0,
      itemCount: 0
    };
  });

  filtered.forEach(inv => {
    if (inv.invoiceStatus === 'cancelled') return;

    inv.items.forEach(it => {
      const r = it.gstRate in summaryMap ? it.gstRate : 0;
      summaryMap[r].taxableValue += it.taxableAmount;
      summaryMap[r].cgst += it.cgstAmount;
      summaryMap[r].sgst += it.sgstAmount;
      summaryMap[r].igst += it.igstAmount;
      summaryMap[r].totalTax += it.totalTax;
      summaryMap[r].itemCount++;
    });
  });

  return Object.values(summaryMap).map(row => ({
    ...row,
    taxableValue: roundPaise(row.taxableValue),
    cgst: roundPaise(row.cgst),
    sgst: roundPaise(row.sgst),
    igst: roundPaise(row.igst),
    totalTax: roundPaise(row.totalTax)
  }));
};

/**
 * 3. Generates B2B and B2C summaries
 */
export const generateB2bSummary = (
  invoices: EnhancedInvoice[],
  filter?: DateRangeFilter
): { b2bList: B2bRow[]; b2cLargeList: B2bRow[]; b2cSmallTotal: number; b2cSmallCount: number } => {
  const filtered = filter ? filterRecordsByDate(invoices, filter) : invoices;

  const b2bList: B2bRow[] = [];
  const b2cLargeList: B2bRow[] = [];
  let b2cSmallTotal = 0;
  let b2cSmallCount = 0;

  filtered.forEach(inv => {
    if (inv.invoiceStatus === 'cancelled') return;

    const hasGstin = !!inv.customerDetails.gstin && inv.customerDetails.gstin.trim().length === 15;

    if (hasGstin) {
      b2bList.push({
        gstin: inv.customerDetails.gstin!,
        customerName: inv.customerDetails.name,
        invoiceNumber: inv.id,
        invoiceDate: new Date(inv.invoiceDate).toLocaleDateString('en-IN'),
        placeOfSupply: inv.placeOfSupply,
        taxableValue: inv.totalTaxable,
        cgst: inv.totalCgst,
        sgst: inv.totalSgst,
        igst: inv.totalIgst,
        invoiceTotal: inv.grandTotal
      });
    } else if (inv.isInterState && inv.grandTotal > 250000) {
      b2cLargeList.push({
        gstin: 'URP',
        customerName: inv.customerDetails.name,
        invoiceNumber: inv.id,
        invoiceDate: new Date(inv.invoiceDate).toLocaleDateString('en-IN'),
        placeOfSupply: inv.placeOfSupply,
        taxableValue: inv.totalTaxable,
        cgst: inv.totalCgst,
        sgst: inv.totalSgst,
        igst: inv.totalIgst,
        invoiceTotal: inv.grandTotal
      });
    } else {
      b2cSmallTotal += inv.grandTotal;
      b2cSmallCount++;
    }
  });

  return {
    b2bList,
    b2cLargeList,
    b2cSmallTotal: roundPaise(b2cSmallTotal),
    b2cSmallCount
  };
};

/**
 * 4. Generates HSN / SAC Summary
 */
export const generateHsnSummary = (
  invoices: EnhancedInvoice[],
  filter?: DateRangeFilter
): HsnSummaryRow[] => {
  const filtered = filter ? filterRecordsByDate(invoices, filter) : invoices;
  const hsnMap: Record<string, HsnSummaryRow> = {};

  filtered.forEach(inv => {
    if (inv.invoiceStatus === 'cancelled') return;

    inv.items.forEach(it => {
      const code = it.hsnSacCode || '999312';
      if (!hsnMap[code]) {
        const found = HEALTHCARE_TAX_CLASSIFICATIONS.find(c => c.code === code);
        const description = found?.name || it.name || 'Healthcare Goods / Services';
        const uqc = it.unit?.toUpperCase() || (code.startsWith('99') ? 'OTH' : 'NOS');

        hsnMap[code] = {
          hsnSacCode: code,
          description,
          uqc,
          totalQuantity: 0,
          totalValue: 0,
          taxableValue: 0,
          cgst: 0,
          sgst: 0,
          igst: 0,
          totalTax: 0
        };
      }

      hsnMap[code].totalQuantity += it.quantity;
      hsnMap[code].totalValue += it.totalAmount;
      hsnMap[code].taxableValue += it.taxableAmount;
      hsnMap[code].cgst += it.cgstAmount;
      hsnMap[code].sgst += it.sgstAmount;
      hsnMap[code].igst += it.igstAmount;
      hsnMap[code].totalTax += it.totalTax;
    });
  });

  return Object.values(hsnMap).map(row => ({
    ...row,
    totalValue: roundPaise(row.totalValue),
    taxableValue: roundPaise(row.taxableValue),
    cgst: roundPaise(row.cgst),
    sgst: roundPaise(row.sgst),
    igst: roundPaise(row.igst),
    totalTax: roundPaise(row.totalTax)
  }));
};

/**
 * 5. Generates Credit Notes and Refunds Register
 */
export const generateCreditNoteRegister = (
  creditNotes: CreditNote[],
  filter?: DateRangeFilter
): CreditNoteRegisterRow[] => {
  const filtered = filter ? filterRecordsByDate(creditNotes, filter) : creditNotes;

  return filtered.map(cn => ({
    creditNoteNumber: cn.creditNoteNumber,
    date: new Date(cn.date).toLocaleDateString('en-IN'),
    invoiceNumber: cn.invoiceNumber,
    invoiceDate: new Date(cn.invoiceDate).toLocaleDateString('en-IN'),
    customerName: cn.customerName,
    customerGstin: cn.customerGstin || 'URP',
    reason: cn.reason.replace(/_/g, ' ').toUpperCase(),
    taxableAdjustment: cn.totalTaxableAdjustment,
    cgstAdjustment: cn.totalCgstAdjustment,
    sgstAdjustment: cn.totalSgstAdjustment,
    igstAdjustment: cn.totalIgstAdjustment,
    totalRefundAmount: cn.totalRefundAmount,
    stockRestocked: cn.stockRestocked ? 'Yes (Inventory Restored)' : 'No',
    refundStatus: cn.refundStatus.toUpperCase()
  }));
};

/**
 * 6. Generates Tax Liability Summary (GSTR-3B Output Estimates)
 */
export const generateTaxLiabilitySummary = (
  invoices: EnhancedInvoice[],
  creditNotes: CreditNote[],
  filter?: DateRangeFilter
): TaxLiabilitySummary => {
  const filteredInvoices = filter ? filterRecordsByDate(invoices, filter) : invoices;
  const filteredCreditNotes = filter ? filterRecordsByDate(creditNotes, filter) : creditNotes;

  let taxableOutwardSupplies = 0;
  let exemptNilRatedSupplies = 0;
  let zeroRatedSupplies = 0;
  let outputCgst = 0;
  let outputSgst = 0;
  let outputIgst = 0;
  let totalOutputTax = 0;

  filteredInvoices.forEach(inv => {
    if (inv.invoiceStatus === 'cancelled') return;

    inv.items.forEach(it => {
      if (it.taxTreatment === 'exempt' || it.taxTreatment === 'nil_rated' || it.gstRate === 0) {
        exemptNilRatedSupplies += it.taxableAmount;
      } else if (it.taxTreatment === 'zero_rated') {
        zeroRatedSupplies += it.taxableAmount;
      } else {
        taxableOutwardSupplies += it.taxableAmount;
        outputCgst += it.cgstAmount;
        outputSgst += it.sgstAmount;
        outputIgst += it.igstAmount;
        totalOutputTax += it.totalTax;
      }
    });
  });

  // Credit Notes Tax Adjustments
  let creditNoteCgstAdjustment = 0;
  let creditNoteSgstAdjustment = 0;
  let creditNoteIgstAdjustment = 0;
  let totalCreditNoteTaxAdjustment = 0;

  filteredCreditNotes.forEach(cn => {
    creditNoteCgstAdjustment += cn.totalCgstAdjustment;
    creditNoteSgstAdjustment += cn.totalSgstAdjustment;
    creditNoteIgstAdjustment += cn.totalIgstAdjustment;
    totalCreditNoteTaxAdjustment += (cn.totalCgstAdjustment + cn.totalSgstAdjustment + cn.totalIgstAdjustment);
  });

  const netCgstLiability = roundPaise(Math.max(0, outputCgst - creditNoteCgstAdjustment));
  const netSgstLiability = roundPaise(Math.max(0, outputSgst - creditNoteSgstAdjustment));
  const netIgstLiability = roundPaise(Math.max(0, outputIgst - creditNoteIgstAdjustment));
  const netTotalGstLiability = roundPaise(netCgstLiability + netSgstLiability + netIgstLiability);

  return {
    taxableOutwardSupplies: roundPaise(taxableOutwardSupplies),
    exemptNilRatedSupplies: roundPaise(exemptNilRatedSupplies),
    zeroRatedSupplies: roundPaise(zeroRatedSupplies),
    totalOutwardSupplies: roundPaise(taxableOutwardSupplies + exemptNilRatedSupplies + zeroRatedSupplies),
    outputCgst: roundPaise(outputCgst),
    outputSgst: roundPaise(outputSgst),
    outputIgst: roundPaise(outputIgst),
    totalOutputTax: roundPaise(totalOutputTax),
    creditNoteCgstAdjustment: roundPaise(creditNoteCgstAdjustment),
    creditNoteSgstAdjustment: roundPaise(creditNoteSgstAdjustment),
    creditNoteIgstAdjustment: roundPaise(creditNoteIgstAdjustment),
    totalCreditNoteTaxAdjustment: roundPaise(totalCreditNoteTaxAdjustment),
    netCgstLiability,
    netSgstLiability,
    netIgstLiability,
    netTotalGstLiability
  };
};

/**
 * 7. Generates Reconciliation and Audit Report
 */
export const generateReconciliationReport = (
  invoices: EnhancedInvoice[],
  creditNotes: CreditNote[],
  filter?: DateRangeFilter
): ReconciliationReport => {
  const filteredInvoices = filter ? filterRecordsByDate(invoices, filter) : invoices;
  const filteredCreditNotes = filter ? filterRecordsByDate(creditNotes, filter) : creditNotes;

  let totalInvoiced = 0;
  let totalCollected = 0;
  let totalReceivables = 0;
  let cancelledCount = 0;
  let cancelledValue = 0;
  let fullyPaid = 0;
  let partial = 0;
  let unpaid = 0;

  const discrepancies: ReconciliationReport['discrepancies'] = [];

  filteredInvoices.forEach(inv => {
    if (inv.invoiceStatus === 'cancelled') {
      cancelledCount++;
      cancelledValue += inv.grandTotal;
      if (inv.amountPaid > 0) {
        discrepancies.push({
          type: 'error',
          title: 'Cancelled Invoice with Collected Funds',
          description: `Invoice ${inv.id} is marked CANCELLED but shows ₹${inv.amountPaid} collected without recorded refund.`,
          invoiceNumber: inv.id
        });
      }
      return;
    }

    totalInvoiced += inv.grandTotal;
    totalCollected += inv.amountPaid;
    totalReceivables += inv.balanceDue;

    if (inv.paymentStatus === 'paid') fullyPaid++;
    else if (inv.paymentStatus === 'partial') partial++;
    else unpaid++;

    // Check payment sum integrity
    const recordedPaymentsSum = inv.payments.reduce((acc, curr) => acc + curr.amount, 0);
    if (Math.abs(recordedPaymentsSum - inv.amountPaid) > 0.05) {
      discrepancies.push({
        type: 'warning',
        title: 'Payment Log Mismatch',
        description: `Sum of payment records (₹${recordedPaymentsSum}) differs from amountPaid (₹${inv.amountPaid}) on Invoice ${inv.id}.`,
        invoiceNumber: inv.id
      });
    }

    // Check line tax math integrity
    const lineTotalSum = inv.items.reduce((acc, curr) => acc + curr.totalAmount, 0);
    const expectedGross = roundPaise(lineTotalSum + inv.roundOff);
    if (Math.abs(expectedGross - inv.grandTotal) > 0.05) {
      discrepancies.push({
        type: 'warning',
        title: 'Invoice Line Total Rounding Discrepancy',
        description: `Line items sum ₹${lineTotalSum} with roundoff ₹${inv.roundOff} does not equal grand total ₹${inv.grandTotal}.`,
        invoiceNumber: inv.id
      });
    }
  });

  let totalCreditNotes = 0;
  filteredCreditNotes.forEach(cn => {
    totalCreditNotes += cn.totalRefundAmount;
  });

  return {
    totalInvoiced: roundPaise(totalInvoiced),
    totalCollected: roundPaise(totalCollected),
    totalReceivables: roundPaise(totalReceivables),
    totalCreditNotes: roundPaise(totalCreditNotes),
    cancelledInvoicesCount: cancelledCount,
    cancelledInvoicesValue: roundPaise(cancelledValue),
    fullyPaidInvoicesCount: fullyPaid,
    partialInvoicesCount: partial,
    unpaidInvoicesCount: unpaid,
    discrepancies
  };
};
