import React, { createContext, useContext, useState, useEffect, useCallback, useMemo } from 'react';
import { useUser } from '@clerk/react';
import { useAppState } from './AppStateContext';
import { 
  EnhancedInvoice, 
  CreditNote, 
  BusinessTaxProfile, 
  FinancialAuditLog, 
  BillingDashboardMetrics, 
  DateRangeFilter,
  InvoicePaymentRecord,
  InvoiceLineItem
} from '../types/billing';
import { 
  getStoredInvoices, 
  saveInvoicesToStorage, 
  getStoredCreditNotes, 
  saveCreditNotesToStorage, 
  getStoredTaxProfile, 
  saveTaxProfileToStorage, 
  getStoredAuditLogs, 
  appendAuditLog, 
  getNextInvoiceNumber, 
  getNextCreditNoteNumber, 
  computeDashboardMetrics,
  DEFAULT_BUSINESS_TAX_PROFILE 
} from '../lib/billingService';
import { 
  calculateInvoiceSummary, 
  getCurrentFinancialYear, 
  roundPaise, 
  isInterStateTransaction 
} from '../lib/gstEngine';
import { supabase } from '../lib/supabase';

interface BillingContextType {
  invoices: EnhancedInvoice[];
  creditNotes: CreditNote[];
  taxProfile: BusinessTaxProfile;
  auditLogs: FinancialAuditLog[];
  metrics: BillingDashboardMetrics;
  dateFilter: DateRangeFilter;
  setDateFilter: (filter: DateRangeFilter) => void;
  selectedInvoice: EnhancedInvoice | null;
  setSelectedInvoice: (invoice: EnhancedInvoice | null) => void;
  createInvoice: (draft: Partial<EnhancedInvoice>) => Promise<EnhancedInvoice>;
  finalizeInvoice: (id: string) => Promise<EnhancedInvoice>;
  cancelInvoice: (id: string, reason: string) => Promise<EnhancedInvoice>;
  recordPayment: (
    invoiceId: string, 
    payment: {
      amount: number;
      paymentMethod: InvoicePaymentRecord['paymentMethod'];
      transactionRef?: string;
      notes?: string;
      receivedBy?: string;
    }
  ) => Promise<EnhancedInvoice>;
  issueCreditNote: (
    data: Omit<CreditNote, 'id' | 'creditNoteNumber' | 'date' | 'createdAt'>
  ) => Promise<CreditNote>;
  updateTaxProfile: (updated: Partial<BusinessTaxProfile>) => Promise<BusinessTaxProfile>;
  syncFromOpdBill: (
    invoiceId: string,
    patient: any,
    prescriptions: any[],
    consultationFee: number,
    doctorName?: string
  ) => Promise<EnhancedInvoice>;
  refreshBillingData: () => Promise<void>;
}

const BillingContext = createContext<BillingContextType | undefined>(undefined);

export const BillingProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user } = useUser();
  const { medicines, updateMedicineStock, restockMedicine, orgType } = useAppState();

  const [invoices, setInvoices] = useState<EnhancedInvoice[]>([]);
  const [creditNotes, setCreditNotes] = useState<CreditNote[]>([]);
  const [taxProfile, setTaxProfile] = useState<BusinessTaxProfile>(DEFAULT_BUSINESS_TAX_PROFILE);
  const [auditLogs, setAuditLogs] = useState<FinancialAuditLog[]>([]);
  const [selectedInvoice, setSelectedInvoice] = useState<EnhancedInvoice | null>(null);

  // Default filter: Current Financial Year
  const currentFy = getCurrentFinancialYear();
  const [dateFilter, setDateFilter] = useState<DateRangeFilter>({
    period: 'financial_year',
    startDate: `${currentFy.split('-')[0]}-04-01`,
    endDate: `${currentFy.split('-')[1]}-03-31`,
    financialYear: currentFy
  });

  const actorName = user?.fullName || user?.firstName || 'Authorized Staff';

  // Load initial records
  const loadData = useCallback(async () => {
    const storedProfile = getStoredTaxProfile();
    // Merge user metadata if available
    if (user?.unsafeMetadata?.clinicName) {
      storedProfile.businessName = user.unsafeMetadata.clinicName as string;
    }
    if (user?.unsafeMetadata?.gstNumber) {
      storedProfile.gstin = user.unsafeMetadata.gstNumber as string;
    }
    setTaxProfile(storedProfile);

    const storedInvs = getStoredInvoices();
    setInvoices(storedInvs);

    const storedCn = getStoredCreditNotes();
    setCreditNotes(storedCn);

    const storedLogs = getStoredAuditLogs();
    setAuditLogs(storedLogs);

    // Optional Supabase background fetch
    if (supabase) {
      try {
        const { data: supaInvs } = await supabase
          .from('billing_invoices')
          .select('*')
          .order('invoice_date', { ascending: false });

        if (supaInvs && supaInvs.length > 0) {
          const mapped: EnhancedInvoice[] = supaInvs.map((row: any) => ({
            id: row.id,
            invoiceSequence: row.invoice_sequence,
            series: row.series,
            invoiceDate: row.invoice_date,
            dueDate: row.due_date,
            financialYear: row.financial_year,
            orgType: row.org_type || 'hospital',
            businessDetails: row.business_details || storedProfile,
            customerDetails: row.customer_details,
            placeOfSupply: row.place_of_supply,
            placeOfSupplyCode: row.place_of_supply_code,
            isInterState: row.is_inter_state,
            priceType: row.price_type || 'exclusive',
            items: row.items || [],
            subTotal: Number(row.sub_total || 0),
            totalDiscount: Number(row.total_discount || 0),
            totalTaxable: Number(row.total_taxable || 0),
            totalCgst: Number(row.total_cgst || 0),
            totalSgst: Number(row.total_sgst || 0),
            totalIgst: Number(row.total_igst || 0),
            totalTax: Number(row.total_tax || 0),
            roundOff: Number(row.round_off || 0),
            grandTotal: Number(row.grand_total || 0),
            taxBreakdowns: row.tax_breakdowns || [],
            amountPaid: Number(row.amount_paid || 0),
            balanceDue: Number(row.balance_due || 0),
            paymentStatus: row.payment_status || 'unpaid',
            invoiceStatus: row.invoice_status || 'issued',
            payments: row.payments || [],
            creditNoteIds: row.credit_note_ids || [],
            notes: row.notes,
            termsAndConditions: row.terms_and_conditions,
            createdAt: row.created_at,
            updatedAt: row.updated_at,
            cancelledAt: row.cancelled_at,
            cancelReason: row.cancel_reason
          }));
          setInvoices(mapped);
          saveInvoicesToStorage(mapped);
        }
      } catch (err) {
        console.warn('Background Supabase invoices fetch notice:', err);
      }
    }
  }, [user]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Compute live dashboard metrics
  const metrics = useMemo(() => {
    return computeDashboardMetrics(invoices, creditNotes, dateFilter);
  }, [invoices, creditNotes, dateFilter]);

  // Create new Invoice
  const createInvoice = async (draft: Partial<EnhancedInvoice>): Promise<EnhancedInvoice> => {
    const fy = draft.financialYear || taxProfile.financialYear || getCurrentFinancialYear();
    const prefix = taxProfile.invoicePrefix || 'INV';
    const nextSeq = getNextInvoiceNumber(invoices, prefix, fy);

    const items = draft.items || [];
    const summary = calculateInvoiceSummary(items, taxProfile.enableRoundOff);

    const supplierStateCode = taxProfile.stateCode || '33';
    const posStateCode = draft.placeOfSupplyCode || draft.customerDetails?.stateCode || supplierStateCode;
    const isInterState = isInterStateTransaction(supplierStateCode, posStateCode);

    const newInvoice: EnhancedInvoice = {
      id: draft.id || nextSeq.id,
      invoiceSequence: nextSeq.sequence,
      series: nextSeq.series,
      invoiceDate: draft.invoiceDate || new Date().toISOString(),
      dueDate: draft.dueDate,
      financialYear: fy,
      orgType: draft.orgType || orgType || 'hospital',
      businessDetails: taxProfile,
      customerDetails: draft.customerDetails || {
        name: 'Walk-in Patient',
        type: 'b2c_patient',
        phone: '',
        state: taxProfile.state,
        stateCode: taxProfile.stateCode
      },
      placeOfSupply: draft.placeOfSupply || `${taxProfile.state} (${taxProfile.stateCode})`,
      placeOfSupplyCode: posStateCode,
      isInterState,
      priceType: draft.priceType || taxProfile.defaultPriceType || 'exclusive',
      items,
      ...summary,
      amountPaid: draft.amountPaid || 0,
      balanceDue: roundPaise(summary.grandTotal - (draft.amountPaid || 0)),
      paymentStatus: (draft.amountPaid || 0) >= summary.grandTotal ? 'paid' : (draft.amountPaid || 0) > 0 ? 'partial' : 'unpaid',
      invoiceStatus: draft.invoiceStatus || 'issued',
      payments: draft.payments || [],
      notes: draft.notes,
      termsAndConditions: draft.termsAndConditions || '1. Goods/Medicines once sold cannot be returned without original batch verification.\n2. Consultation fee is valid for 7 days revisit only.',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      finalizedAt: draft.invoiceStatus === 'issued' ? new Date().toISOString() : undefined,
      createdBy: actorName
    };

    // Deduct pharmacy stock if invoice is issued immediately and has medicines
    if (newInvoice.invoiceStatus === 'issued') {
      newInvoice.items.forEach(it => {
        if (it.medicineId && it.quantity > 0) {
          updateMedicineStock(it.medicineId, it.quantity);
        }
      });
    }

    const updated = [newInvoice, ...invoices];
    setInvoices(updated);
    saveInvoicesToStorage(updated);
    setSelectedInvoice(newInvoice);

    appendAuditLog(actorName, 'invoice_created', newInvoice.id, 'invoice', {
      grandTotal: newInvoice.grandTotal,
      customer: newInvoice.customerDetails.name,
      status: newInvoice.invoiceStatus
    });

    // Supabase background sync
    if (supabase) {
      supabase.from('billing_invoices').upsert({
        id: newInvoice.id,
        user_id: user?.id || 'tenant',
        series: newInvoice.series,
        invoice_sequence: newInvoice.invoiceSequence,
        invoice_date: newInvoice.invoiceDate,
        financial_year: newInvoice.financialYear,
        org_type: newInvoice.orgType,
        business_details: newInvoice.businessDetails,
        customer_details: newInvoice.customerDetails,
        place_of_supply: newInvoice.placeOfSupply,
        place_of_supply_code: newInvoice.placeOfSupplyCode,
        is_inter_state: newInvoice.isInterState,
        price_type: newInvoice.priceType,
        items: newInvoice.items,
        tax_breakdowns: newInvoice.taxBreakdowns,
        sub_total: newInvoice.subTotal,
        total_discount: newInvoice.totalDiscount,
        total_taxable: newInvoice.totalTaxable,
        total_cgst: newInvoice.totalCgst,
        total_sgst: newInvoice.totalSgst,
        total_igst: newInvoice.totalIgst,
        total_tax: newInvoice.totalTax,
        round_off: newInvoice.roundOff,
        grand_total: newInvoice.grandTotal,
        amount_paid: newInvoice.amountPaid,
        balance_due: newInvoice.balanceDue,
        payment_status: newInvoice.paymentStatus,
        invoice_status: newInvoice.invoiceStatus,
        payments: newInvoice.payments,
        notes: newInvoice.notes,
        terms_and_conditions: newInvoice.termsAndConditions,
        created_at: newInvoice.createdAt,
        updated_at: newInvoice.updatedAt
      }).then(() => {}).catch(() => {});
    }

    return newInvoice;
  };

  // Finalize an existing draft invoice
  const finalizeInvoice = async (id: string): Promise<EnhancedInvoice> => {
    const inv = invoices.find(i => i.id === id);
    if (!inv) throw new Error('Invoice not found');

    // Deduct stock for medicines upon finalization
    inv.items.forEach(it => {
      if (it.medicineId && it.quantity > 0) {
        updateMedicineStock(it.medicineId, it.quantity);
      }
    });

    const updatedInv: EnhancedInvoice = {
      ...inv,
      invoiceStatus: 'issued',
      finalizedAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    const updatedList = invoices.map(i => i.id === id ? updatedInv : i);
    setInvoices(updatedList);
    saveInvoicesToStorage(updatedList);
    setSelectedInvoice(updatedInv);

    appendAuditLog(actorName, 'invoice_finalized', id, 'invoice', {
      grandTotal: updatedInv.grandTotal
    });

    return updatedInv;
  };

  // Cancel an invoice (with mandatory audit reason)
  const cancelInvoice = async (id: string, reason: string): Promise<EnhancedInvoice> => {
    const inv = invoices.find(i => i.id === id);
    if (!inv) throw new Error('Invoice not found');

    const updatedInv: EnhancedInvoice = {
      ...inv,
      invoiceStatus: 'cancelled',
      cancelledAt: new Date().toISOString(),
      cancelReason: reason,
      updatedAt: new Date().toISOString()
    };

    const updatedList = invoices.map(i => i.id === id ? updatedInv : i);
    setInvoices(updatedList);
    saveInvoicesToStorage(updatedList);
    setSelectedInvoice(updatedInv);

    appendAuditLog(actorName, 'invoice_cancelled', id, 'invoice', {
      reason,
      cancelledTotal: inv.grandTotal
    });

    return updatedInv;
  };

  // Record a payment against an invoice
  const recordPayment = async (
    invoiceId: string,
    paymentInput: {
      amount: number;
      paymentMethod: InvoicePaymentRecord['paymentMethod'];
      transactionRef?: string;
      notes?: string;
      receivedBy?: string;
    }
  ): Promise<EnhancedInvoice> => {
    const inv = invoices.find(i => i.id === invoiceId);
    if (!inv) throw new Error('Invoice not found');

    const newPaymentRecord: InvoicePaymentRecord = {
      id: `PAY-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      invoiceId,
      amount: roundPaise(paymentInput.amount),
      paymentMethod: paymentInput.paymentMethod,
      transactionRef: paymentInput.transactionRef || `TXN-${Date.now()}`,
      paymentDate: new Date().toISOString(),
      notes: paymentInput.notes,
      receivedBy: paymentInput.receivedBy || actorName
    };

    const newAmountPaid = roundPaise(inv.amountPaid + newPaymentRecord.amount);
    const newBalanceDue = roundPaise(Math.max(0, inv.grandTotal - newAmountPaid));
    const newPaymentStatus = newBalanceDue <= 0 ? 'paid' : 'partial';

    const updatedInv: EnhancedInvoice = {
      ...inv,
      amountPaid: newAmountPaid,
      balanceDue: newBalanceDue,
      paymentStatus: newPaymentStatus,
      payments: [...inv.payments, newPaymentRecord],
      updatedAt: new Date().toISOString()
    };

    const updatedList = invoices.map(i => i.id === invoiceId ? updatedInv : i);
    setInvoices(updatedList);
    saveInvoicesToStorage(updatedList);
    setSelectedInvoice(updatedInv);

    appendAuditLog(actorName, 'payment_recorded', invoiceId, 'payment', {
      paymentId: newPaymentRecord.id,
      amount: newPaymentRecord.amount,
      method: newPaymentRecord.paymentMethod,
      balanceRemaining: newBalanceDue
    });

    return updatedInv;
  };

  // Issue a Credit Note / Sales Return
  const issueCreditNote = async (
    data: Omit<CreditNote, 'id' | 'creditNoteNumber' | 'date' | 'createdAt'>
  ): Promise<CreditNote> => {
    const fy = data.financialYear || taxProfile.financialYear || getCurrentFinancialYear();
    const cnNumber = getNextCreditNoteNumber(creditNotes, fy);

    const newCreditNote: CreditNote = {
      id: cnNumber,
      creditNoteNumber: cnNumber,
      invoiceId: data.invoiceId,
      invoiceNumber: data.invoiceNumber,
      invoiceDate: data.invoiceDate,
      date: new Date().toISOString(),
      financialYear: fy,
      reason: data.reason,
      reasonDetails: data.reasonDetails,
      customerName: data.customerName,
      customerGstin: data.customerGstin,
      stateCode: data.stateCode,
      items: data.items,
      totalTaxableAdjustment: roundPaise(data.totalTaxableAdjustment),
      totalCgstAdjustment: roundPaise(data.totalCgstAdjustment),
      totalSgstAdjustment: roundPaise(data.totalSgstAdjustment),
      totalIgstAdjustment: roundPaise(data.totalIgstAdjustment),
      totalRefundAmount: roundPaise(data.totalRefundAmount),
      refundMethod: data.refundMethod,
      refundStatus: data.refundStatus || 'completed',
      stockRestocked: data.stockRestocked,
      createdAt: new Date().toISOString(),
      createdBy: actorName
    };

    // If pharmacy medicine items need restocking
    if (newCreditNote.stockRestocked && newCreditNote.items) {
      newCreditNote.items.forEach(it => {
        if (it.medicineId && it.quantity > 0) {
          restockMedicine(it.medicineId, it.quantity);
        }
      });
    }

    // Mark credit note on invoice
    const inv = invoices.find(i => i.id === data.invoiceId);
    if (inv) {
      const updatedInv: EnhancedInvoice = {
        ...inv,
        creditNoteIds: [...(inv.creditNoteIds || []), newCreditNote.id],
        invoiceStatus: 'credit_note_issued',
        updatedAt: new Date().toISOString()
      };
      const updatedInvs = invoices.map(i => i.id === inv.id ? updatedInv : i);
      setInvoices(updatedInvs);
      saveInvoicesToStorage(updatedInvs);
    }

    const updatedCnList = [newCreditNote, ...creditNotes];
    setCreditNotes(updatedCnList);
    saveCreditNotesToStorage(updatedCnList);

    appendAuditLog(actorName, 'credit_note_issued', newCreditNote.id, 'credit_note', {
      originalInvoice: newCreditNote.invoiceNumber,
      refundAmount: newCreditNote.totalRefundAmount,
      reason: newCreditNote.reason,
      stockRestocked: newCreditNote.stockRestocked
    });

    return newCreditNote;
  };

  // Update business tax configuration profile
  const updateTaxProfile = async (updated: Partial<BusinessTaxProfile>): Promise<BusinessTaxProfile> => {
    const merged: BusinessTaxProfile = {
      ...taxProfile,
      ...updated
    };
    setTaxProfile(merged);
    saveTaxProfileToStorage(merged);

    appendAuditLog(actorName, 'tax_config_updated', 'tax_profile', 'config', {
      gstin: merged.gstin,
      businessName: merged.businessName
    });

    return merged;
  };

  // Bridge OPD Consultation into an Enhanced Tax Invoice seamlessly
  const syncFromOpdBill = async (
    invoiceId: string,
    patient: any,
    prescriptions: any[],
    consultationFee: number,
    doctorName?: string
  ): Promise<EnhancedInvoice> => {
    const fy = getCurrentFinancialYear();
    const lineItems: InvoiceLineItem[] = [];

    // 1. Consultation Fee (SAC 999312 @ 0% Exempt)
    if (consultationFee > 0) {
      lineItems.push({
        id: `item-cons-${Date.now()}`,
        name: 'Doctor OPD Consultation Service',
        category: 'opd_consultation',
        hsnSacCode: '999312',
        quantity: 1,
        unit: 'Consultation',
        unitPrice: consultationFee,
        discountAmount: 0,
        taxableAmount: consultationFee,
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
        totalAmount: consultationFee
      });
    }

    // 2. Prescribed Medicines (HSN 3004 / 2106)
    prescriptions.forEach((p, idx) => {
      const qty = p.quantity || 1;
      const unitPrice = p.pricePerUnit || (p.totalPrice ? p.totalPrice / qty : 10);
      const gross = roundPaise(unitPrice * qty);
      const discount = p.discountAmount || 0;
      const taxable = roundPaise(gross - discount);
      const gstRate = (p.gstRate === 0 || p.gstRate === 5 || p.gstRate === 12 || p.gstRate === 18 || p.gstRate === 28) ? p.gstRate : 12;
      const taxAmount = roundPaise((taxable * gstRate) / 100);
      const cgst = roundPaise(taxAmount / 2);
      const sgst = roundPaise(taxAmount - cgst);

      lineItems.push({
        id: `item-rx-${Date.now()}-${idx}`,
        name: p.medicineName,
        category: 'pharmacy',
        hsnSacCode: p.hsn || '3004',
        quantity: qty,
        unit: 'Tabs/Units',
        unitPrice,
        discountAmount: discount,
        taxableAmount: taxable,
        gstRate,
        isExempt: false,
        taxTreatment: 'taxable',
        cgstRate: gstRate / 2,
        cgstAmount: cgst,
        sgstRate: gstRate / 2,
        sgstAmount: sgst,
        igstRate: 0,
        igstAmount: 0,
        totalTax: taxAmount,
        totalAmount: roundPaise(taxable + taxAmount),
        batchNo: p.batchNo,
        expiryDate: p.expiryDate,
        medicineId: p.medicineId
      });
    });

    const summary = calculateInvoiceSummary(lineItems, true);

    const enhanced: EnhancedInvoice = {
      id: invoiceId,
      invoiceSequence: invoices.length + 1,
      series: 'INV-2627',
      invoiceDate: new Date().toISOString(),
      financialYear: fy,
      orgType: orgType || 'hospital',
      businessDetails: taxProfile,
      customerDetails: {
        name: patient.name || 'Walk-in Patient',
        type: 'b2c_patient',
        phone: patient.phone || '',
        state: taxProfile.state,
        stateCode: taxProfile.stateCode,
        patientId: patient.patientId || `PT-${Math.floor(1000 + Math.random() * 9000)}`,
        doctorName: doctorName || 'Attending Physician'
      },
      placeOfSupply: `${taxProfile.state} (${taxProfile.stateCode})`,
      placeOfSupplyCode: taxProfile.stateCode,
      isInterState: false,
      priceType: 'exclusive',
      items: lineItems,
      ...summary,
      amountPaid: 0,
      balanceDue: summary.grandTotal,
      paymentStatus: 'unpaid',
      invoiceStatus: 'issued',
      payments: [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      finalizedAt: new Date().toISOString(),
      createdBy: actorName
    };

    const updated = [enhanced, ...invoices];
    setInvoices(updated);
    saveInvoicesToStorage(updated);
    return enhanced;
  };

  return (
    <BillingContext.Provider
      value={{
        invoices,
        creditNotes,
        taxProfile,
        auditLogs,
        metrics,
        dateFilter,
        setDateFilter,
        selectedInvoice,
        setSelectedInvoice,
        createInvoice,
        finalizeInvoice,
        cancelInvoice,
        recordPayment,
        issueCreditNote,
        updateTaxProfile,
        syncFromOpdBill,
        refreshBillingData: loadData
      }}
    >
      {children}
    </BillingContext.Provider>
  );
};

export const useBilling = (): BillingContextType => {
  const context = useContext(BillingContext);
  if (!context) {
    throw new Error('useBilling must be used within a BillingProvider');
  }
  return context;
};
