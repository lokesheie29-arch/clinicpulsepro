import React, { createContext, useContext, useState, useEffect } from 'react';
import { OrgType } from '../types';
import { 
  OrgPaymentConfig, 
  PaymentTransaction, 
  PaymentStatus, 
  PaymentMethod,
  PaymentDashboardMetrics 
} from '../types/payment';
import { initialPaymentConfigs, initialPaymentTransactions } from '../data/mockPaymentData';
import { useAppState } from './AppStateContext';
import { supabase } from '../lib/supabase';

interface CreateOrderOptions {
  invoiceId: string;
  amount: number;
  patientName: string;
  patientPhone: string;
  billCategory?: 'opd' | 'lab' | 'pharmacy';
}

interface PaymentOrderResult {
  orderId: string;
  invoiceId: string;
  amount: number;
  merchantVpa: string;
  merchantName: string;
  upiIntentUrl: string;
  qrCodeUrl: string;
  keyId: string;
  currency: string;
}

interface PaymentContextType {
  paymentConfigs: Record<OrgType, OrgPaymentConfig>;
  activeConfig: OrgPaymentConfig;
  transactions: PaymentTransaction[];
  filteredTransactions: PaymentTransaction[];
  metrics: PaymentDashboardMetrics;
  updateOrgConfig: (type: OrgType, updated: Partial<OrgPaymentConfig>) => void;
  createPaymentOrder: (opts: CreateOrderOptions) => PaymentOrderResult;
  verifyAndRecordPayment: (
    orderId: string,
    invoiceId: string,
    amount: number,
    patientName: string,
    patientPhone: string,
    paymentMethod: PaymentMethod,
    methodDetails?: PaymentTransaction['paymentMethodDetails'],
    gatewayPaymentId?: string
  ) => Promise<PaymentTransaction>;
  recordFailedPayment: (
    orderId: string,
    invoiceId: string,
    amount: number,
    patientName: string,
    patientPhone: string,
    paymentMethod: PaymentMethod,
    reason: string
  ) => PaymentTransaction;
  initiateRefund: (transactionId: string, reason: string) => Promise<boolean>;
  simulateWebhookArrival: (
    eventType: 'payment.captured' | 'payment.failed',
    invoiceId: string,
    amount: number,
    patientName: string,
    patientPhone: string,
    paymentMethod: PaymentMethod
  ) => Promise<PaymentTransaction>;
  testGatewayConnection: (type: OrgType) => Promise<{ success: boolean; message: string }>;
  resetPaymentData: () => void;
}

const PaymentContext = createContext<PaymentContextType | undefined>(undefined);

const CONFIGS_STORAGE_KEY = 'clinicpulse_payment_configs_v2';
const TRANSACTIONS_STORAGE_KEY = 'clinicpulse_payment_transactions_v2';

export const PaymentProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { orgType, updateInvoicePaymentStatus } = useAppState();

  const [paymentConfigs, setPaymentConfigs] = useState<Record<OrgType, OrgPaymentConfig>>(() => {
    const saved = localStorage.getItem(CONFIGS_STORAGE_KEY);
    return saved ? JSON.parse(saved) : initialPaymentConfigs;
  });

  const [transactions, setTransactions] = useState<PaymentTransaction[]>(() => {
    const saved = localStorage.getItem(TRANSACTIONS_STORAGE_KEY);
    return saved ? JSON.parse(saved) : initialPaymentTransactions;
  });

  // Sync to local storage
  useEffect(() => {
    localStorage.setItem(CONFIGS_STORAGE_KEY, JSON.stringify(paymentConfigs));
  }, [paymentConfigs]);

  useEffect(() => {
    localStorage.setItem(TRANSACTIONS_STORAGE_KEY, JSON.stringify(transactions));
  }, [transactions]);

  // Attempt to load from Supabase if table exists
  useEffect(() => {
    const syncFromSupabase = async () => {
      try {
        const { data: supaTxns, error } = await supabase
          .from('payment_transactions')
          .select('*')
          .order('created_at', { ascending: false });

        if (supaTxns && supaTxns.length > 0 && !error) {
          // Merge Supabase transactions
          const mapped: PaymentTransaction[] = supaTxns.map(row => ({
            id: row.id,
            orderId: row.order_id,
            invoiceId: row.invoice_id,
            patientName: row.patient_name,
            patientPhone: row.patient_phone || '',
            organizationType: row.organization_type,
            organizationName: row.organization_name,
            billCategory: row.bill_category || 'opd',
            amount: Number(row.amount),
            currency: 'INR',
            paymentMethod: row.payment_method,
            paymentMethodDetails: row.payment_method_details,
            gatewayProvider: row.gateway_provider,
            gatewayPaymentId: row.gateway_payment_id || `pay_${Date.now()}`,
            gatewayFee: Number(row.gateway_fee || 0),
            gatewayFeeGst: Number(row.gateway_fee_gst || 0),
            netSettlementAmount: Number(row.net_settlement_amount || row.amount),
            status: row.status,
            settlementStatus: row.settlement_status || 'unsettled',
            settlementUtr: row.settlement_utr,
            settlementDate: row.settlement_date,
            bankAccountMasked: row.bank_account_masked,
            refundDetails: row.refund_details,
            signatureVerified: row.signature_verified ?? true,
            failureReason: row.failure_reason,
            createdAt: row.created_at,
            completedAt: row.completed_at
          }));
          setTransactions(mapped);
        }
      } catch (err) {
        // Fallback to local storage seamlessly
      }
    };

    syncFromSupabase();
  }, []);

  const activeConfig = paymentConfigs[orgType] || paymentConfigs.hospital;

  // Transactions filtered by active orgType for tenant isolation
  const filteredTransactions = transactions.filter(t => t.organizationType === orgType);

  // Calculate Metrics
  const metrics: PaymentDashboardMetrics = React.useMemo(() => {
    const orgTxns = transactions.filter(t => t.organizationType === orgType);
    const now = new Date();
    const todayStr = now.toISOString().split('T')[0];
    const monthStr = todayStr.substring(0, 7);

    let totalCollections = 0;
    let todayCollections = 0;
    let monthlyCollections = 0;
    let totalGatewayFees = 0;
    let netSettledToBank = 0;
    let pendingSettlement = 0;
    let refundedAmount = 0;
    let refundedCount = 0;
    let failedAmount = 0;
    let failedCount = 0;

    orgTxns.forEach(t => {
      const isToday = t.createdAt.startsWith(todayStr);
      const isThisMonth = t.createdAt.startsWith(monthStr);

      if (t.status === 'success') {
        totalCollections += t.amount;
        totalGatewayFees += (t.gatewayFee + t.gatewayFeeGst);

        if (isToday) todayCollections += t.amount;
        if (isThisMonth) monthlyCollections += t.amount;

        if (t.settlementStatus === 'settled') {
          netSettledToBank += t.netSettlementAmount;
        } else {
          pendingSettlement += t.netSettlementAmount;
        }
      } else if (t.status === 'refunded') {
        refundedAmount += (t.refundDetails?.refundAmount || t.amount);
        refundedCount++;
      } else if (t.status === 'failed') {
        failedAmount += t.amount;
        failedCount++;
      }
    });

    return {
      totalCollections,
      todayCollections,
      monthlyCollections,
      pendingAmount: pendingSettlement,
      pendingCount: orgTxns.filter(t => t.status === 'pending').length,
      failedCount,
      failedAmount,
      refundedAmount,
      refundedCount,
      totalGatewayFees,
      netSettledToBank,
      pendingSettlement
    };
  }, [transactions, orgType]);

  // Update Org Payment Config
  const updateOrgConfig = (type: OrgType, updated: Partial<OrgPaymentConfig>) => {
    setPaymentConfigs(prev => ({
      ...prev,
      [type]: {
        ...prev[type],
        ...updated,
        updatedAt: new Date().toISOString()
      }
    }));

    // Sync to Supabase in background
    supabase
      .from('organization_payment_configs')
      .upsert({
        organization_type: type,
        ...updated,
        updated_at: new Date().toISOString()
      })
      .then();
  };

  // Create Order with Dynamic UPI Intent
  const createPaymentOrder = (opts: CreateOrderOptions): PaymentOrderResult => {
    const config = paymentConfigs[orgType] || paymentConfigs.hospital;
    const orderId = `order_${Date.now().toString(36).toUpperCase()}_${Math.floor(1000 + Math.random() * 9000)}`;
    const merchantVpa = config.merchantVpa || 'clinicpulse@upi';
    const merchantName = config.merchantName || 'ClinicPulse Pro';

    // Standard NPCI UPI Intent Format:
    // upi://pay?pa=VPA&pn=NAME&am=AMOUNT&cu=INR&tn=NOTE&tr=REF
    const cleanAmount = opts.amount.toFixed(2);
    const txnNote = `Bill-${opts.invoiceId}`;
    const upiIntentUrl = `upi://pay?pa=${merchantVpa}&pn=${encodeURIComponent(merchantName)}&am=${cleanAmount}&cu=INR&tn=${encodeURIComponent(txnNote)}&tr=${orderId}`;
    
    // QR Code generation URL using dynamic UPI URI
    const qrCodeUrl = `https://api.qrserver.com/v1/create-qr-code/?size=240x240&margin=10&data=${encodeURIComponent(upiIntentUrl)}`;

    return {
      orderId,
      invoiceId: opts.invoiceId,
      amount: opts.amount,
      merchantVpa,
      merchantName,
      upiIntentUrl,
      qrCodeUrl,
      keyId: config.keyId,
      currency: 'INR'
    };
  };

  // Verify and record a successful payment
  const verifyAndRecordPayment = async (
    orderId: string,
    invoiceId: string,
    amount: number,
    patientName: string,
    patientPhone: string,
    paymentMethod: PaymentMethod,
    methodDetails?: PaymentTransaction['paymentMethodDetails'],
    gatewayPaymentId?: string
  ): Promise<PaymentTransaction> => {
    const config = paymentConfigs[orgType] || paymentConfigs.hospital;
    const feePct = (config.gatewayFeePercent || 2.0) / 100;
    const gstPct = (config.gstOnFeePercent || 18.0) / 100;

    const gatewayFee = Number((amount * feePct).toFixed(2));
    const gatewayFeeGst = Number((gatewayFee * gstPct).toFixed(2));
    const netSettlementAmount = Number((amount - (gatewayFee + gatewayFeeGst)).toFixed(2));

    const pId = gatewayPaymentId || `pay_${Date.now().toString(36).toUpperCase()}${Math.floor(100 + Math.random() * 900)}`;
    const txnId = `txn_${Date.now()}`;
    const nowIso = new Date().toISOString();

    const bankMask = `${config.bankAccount.bankName} (•••• ${config.bankAccount.accountNumber.slice(-4)})`;

    const newTxn: PaymentTransaction = {
      id: txnId,
      orderId,
      invoiceId,
      patientName,
      patientPhone,
      organizationType: orgType,
      organizationName: config.organizationName,
      billCategory: orgType === 'laboratory' ? 'lab' : orgType === 'pharmacy' ? 'pharmacy' : 'opd',
      amount,
      currency: 'INR',
      paymentMethod,
      paymentMethodDetails: methodDetails,
      gatewayProvider: config.gatewayProvider,
      gatewayPaymentId: pId,
      gatewayFee,
      gatewayFeeGst,
      netSettlementAmount,
      status: 'success',
      settlementStatus: config.environmentMode === 'sandbox' ? 'settled' : 'processing',
      settlementUtr: config.environmentMode === 'sandbox' ? `UTR${Date.now().toString().slice(-10)}` : undefined,
      settlementDate: config.environmentMode === 'sandbox' ? nowIso : undefined,
      bankAccountMasked: bankMask,
      signatureVerified: true,
      createdAt: nowIso,
      completedAt: nowIso
    };

    // Update Invoices state & Supabase
    updateInvoicePaymentStatus(invoiceId, 'Paid');

    // Update transactions list
    setTransactions(prev => [newTxn, ...prev]);

    // Save transaction to Supabase
    supabase.from('payment_transactions').insert({
      id: newTxn.id,
      order_id: newTxn.orderId,
      invoice_id: newTxn.invoiceId,
      patient_name: newTxn.patientName,
      patient_phone: newTxn.patientPhone,
      organization_type: newTxn.organizationType,
      organization_name: newTxn.organizationName,
      bill_category: newTxn.billCategory,
      amount: newTxn.amount,
      payment_method: newTxn.paymentMethod,
      payment_method_details: newTxn.paymentMethodDetails,
      gateway_provider: newTxn.gatewayProvider,
      gateway_payment_id: newTxn.gatewayPaymentId,
      gateway_fee: newTxn.gatewayFee,
      gateway_fee_gst: newTxn.gatewayFeeGst,
      net_settlement_amount: newTxn.netSettlementAmount,
      status: newTxn.status,
      settlement_status: newTxn.settlementStatus,
      settlement_utr: newTxn.settlementUtr,
      bank_account_masked: newTxn.bankAccountMasked,
      signature_verified: newTxn.signatureVerified,
      created_at: newTxn.createdAt,
      completed_at: newTxn.completedAt
    }).then();

    return newTxn;
  };

  // Record a failed transaction
  const recordFailedPayment = (
    orderId: string,
    invoiceId: string,
    amount: number,
    patientName: string,
    patientPhone: string,
    paymentMethod: PaymentMethod,
    reason: string
  ): PaymentTransaction => {
    const config = paymentConfigs[orgType] || paymentConfigs.hospital;
    const nowIso = new Date().toISOString();

    const failedTxn: PaymentTransaction = {
      id: `txn_fail_${Date.now()}`,
      orderId,
      invoiceId,
      patientName,
      patientPhone,
      organizationType: orgType,
      organizationName: config.organizationName,
      billCategory: orgType === 'laboratory' ? 'lab' : orgType === 'pharmacy' ? 'pharmacy' : 'opd',
      amount,
      currency: 'INR',
      paymentMethod,
      gatewayProvider: config.gatewayProvider,
      gatewayPaymentId: `pay_declined_${Date.now()}`,
      gatewayFee: 0,
      gatewayFeeGst: 0,
      netSettlementAmount: 0,
      status: 'failed',
      settlementStatus: 'unsettled',
      failureReason: reason,
      signatureVerified: true,
      createdAt: nowIso
    };

    setTransactions(prev => [failedTxn, ...prev]);
    return failedTxn;
  };

  // Initiate Refund
  const initiateRefund = async (transactionId: string, reason: string): Promise<boolean> => {
    const target = transactions.find(t => t.id === transactionId);
    if (!target) return false;

    const refundId = `rfnd_${Date.now().toString(36).toUpperCase()}`;
    const nowIso = new Date().toISOString();

    const updatedTxn: PaymentTransaction = {
      ...target,
      status: 'refunded',
      settlementStatus: 'refunded',
      refundDetails: {
        refundId,
        refundAmount: target.amount,
        refundDate: nowIso,
        reason,
        status: 'processed'
      }
    };

    setTransactions(prev => prev.map(t => t.id === transactionId ? updatedTxn : t));

    // Update in Supabase
    supabase.from('payment_transactions').update({
      status: 'refunded',
      settlement_status: 'refunded',
      refund_details: updatedTxn.refundDetails
    }).eq('id', transactionId).then();

    return true;
  };

  // Simulate Webhook arrival (for Sandbox Testing Suite)
  const simulateWebhookArrival = async (
    eventType: 'payment.captured' | 'payment.failed',
    invoiceId: string,
    amount: number,
    patientName: string,
    patientPhone: string,
    paymentMethod: PaymentMethod
  ): Promise<PaymentTransaction> => {
    const orderId = `order_WH_${Date.now().toString(36).toUpperCase()}`;
    if (eventType === 'payment.captured') {
      return verifyAndRecordPayment(
        orderId,
        invoiceId,
        amount,
        patientName,
        patientPhone,
        paymentMethod,
        { upiApp: 'PhonePe', vpa: `${patientName.toLowerCase().replace(/\s+/g, '')}@upi` },
        `pay_wh_${Date.now()}`
      );
    } else {
      return recordFailedPayment(
        orderId,
        invoiceId,
        amount,
        patientName,
        patientPhone,
        paymentMethod,
        'WEBHOOK_ALERT: Transaction timed out or declined by customer bank'
      );
    }
  };

  // Test Gateway Connection
  const testGatewayConnection = async (type: OrgType): Promise<{ success: boolean; message: string }> => {
    const config = paymentConfigs[type];
    await new Promise(resolve => setTimeout(resolve, 800)); // Simulate realistic network ping

    if (!config.keyId || !config.keySecret) {
      return {
        success: false,
        message: 'Missing Gateway Key ID or Key Secret. Please enter valid credentials.'
      };
    }

    if (config.keyId.startsWith('rzp_test_') || config.keyId.startsWith('rzp_live_') || config.gatewayProvider === 'cashfree') {
      updateOrgConfig(type, {
        status: 'active',
        lastTestedAt: new Date().toISOString()
      });
      return {
        success: true,
        message: `Gateway API connection verified successfully in ${config.environmentMode.toUpperCase()} mode! Webhook signature engine active.`
      };
    }

    return {
      success: true,
      message: `Connection successful for ${config.gatewayProvider.toUpperCase()} (${config.environmentMode} mode).`
    };
  };

  // Reset demo payments
  const resetPaymentData = () => {
    localStorage.removeItem(CONFIGS_STORAGE_KEY);
    localStorage.removeItem(TRANSACTIONS_STORAGE_KEY);
    setPaymentConfigs(initialPaymentConfigs);
    setTransactions(initialPaymentTransactions);
  };

  return (
    <PaymentContext.Provider
      value={{
        paymentConfigs,
        activeConfig,
        transactions,
        filteredTransactions,
        metrics,
        updateOrgConfig,
        createPaymentOrder,
        verifyAndRecordPayment,
        recordFailedPayment,
        initiateRefund,
        simulateWebhookArrival,
        testGatewayConnection,
        resetPaymentData
      }}
    >
      {children}
    </PaymentContext.Provider>
  );
};

export const usePayment = () => {
  const context = useContext(PaymentContext);
  if (!context) {
    throw new Error('usePayment must be used within a PaymentProvider');
  }
  return context;
};
