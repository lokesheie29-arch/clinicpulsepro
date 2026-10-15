import { OrgType } from './index';

export type PaymentGatewayProvider = 'razorpay' | 'cashfree' | 'custom_upi';
export type EnvironmentMode = 'sandbox' | 'production';
export type PaymentMethod = 'upi_qr' | 'upi_intent' | 'card' | 'netbanking' | 'wallet' | 'cash';
export type PaymentStatus = 'pending' | 'success' | 'failed' | 'refunded';
export type SettlementStatus = 'unsettled' | 'processing' | 'settled' | 'refunded';

export interface BankAccountDetails {
  accountNumber: string;
  accountHolderName: string;
  bankName: string;
  ifscCode: string;
  branchName?: string;
  accountType: 'current' | 'savings';
  isVerified: boolean;
  verifiedAt?: string;
}

export interface OrgPaymentConfig {
  organizationId: string;
  organizationType: OrgType; // 'hospital' | 'laboratory' | 'pharmacy'
  organizationName: string;
  gatewayProvider: PaymentGatewayProvider;
  environmentMode: EnvironmentMode;
  keyId: string;
  keySecret: string; // Stored securely, masked on UI
  webhookSecret: string;
  merchantVpa: string; // Business UPI ID e.g., hospitalcare@icici
  merchantName: string;
  bankAccount: BankAccountDetails;
  settlementCycle: 'T+1' | 'T+2' | 'instant' | 'daily';
  autoWebhookEnabled: boolean;
  gatewayFeePercent: number; // e.g., 2.0%
  gstOnFeePercent: number; // 18% on gateway fee
  status: 'active' | 'pending_verification' | 'disabled';
  lastTestedAt?: string;
  updatedAt: string;
}

export interface PaymentTransaction {
  id: string; // txn_... or pay_...
  orderId: string; // order_...
  invoiceId: string;
  patientName: string;
  patientPhone: string;
  organizationType: OrgType;
  organizationName: string;
  billCategory: 'opd' | 'lab' | 'pharmacy';
  amount: number; // in INR
  currency: 'INR';
  paymentMethod: PaymentMethod;
  paymentMethodDetails?: {
    upiApp?: 'Google Pay' | 'PhonePe' | 'Paytm' | 'BHIM' | 'Other UPI';
    vpa?: string;
    cardNetwork?: 'Visa' | 'MasterCard' | 'RuPay';
    cardLast4?: string;
    bankName?: string;
  };
  gatewayProvider: PaymentGatewayProvider;
  gatewayPaymentId: string;
  gatewayFee: number; // Fee charged by gateway
  gatewayFeeGst: number; // GST on fee
  netSettlementAmount: number; // amount - (gatewayFee + gatewayFeeGst)
  status: PaymentStatus;
  settlementStatus: SettlementStatus;
  settlementUtr?: string; // Bank UTR reference
  settlementDate?: string;
  bankAccountMasked?: string; // e.g. "HDFC Bank (•••• 4921)"
  refundDetails?: {
    refundId: string;
    refundAmount: number;
    refundDate: string;
    reason: string;
    status: 'processed' | 'pending' | 'failed';
  };
  signatureVerified: boolean;
  failureReason?: string;
  createdAt: string;
  completedAt?: string;
}

export interface PaymentDashboardMetrics {
  totalCollections: number;
  todayCollections: number;
  monthlyCollections: number;
  pendingAmount: number;
  pendingCount: number;
  failedCount: number;
  failedAmount: number;
  refundedAmount: number;
  refundedCount: number;
  totalGatewayFees: number;
  netSettledToBank: number;
  pendingSettlement: number;
}
