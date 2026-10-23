import { OrgType } from './index';

export type SubscriptionStatus = 
  | 'trialing'
  | 'trial_expired'
  | 'pending_payment'
  | 'active'
  | 'past_due'
  | 'cancelled'
  | 'expired';

export type BillingFrequency = 'monthly' | 'quarterly' | 'annual';

export interface PlanPricing {
  monthly: number;
  quarterly: number; // e.g. 10% discount
  annual: number;    // e.g. 20% discount (2 months free)
}

export interface SubscriptionPlan {
  id: string; // 'starter' | 'professional' | 'enterprise'
  name: string;
  tagline: string;
  prices: PlanPricing;
  currency: string;
  features: string[];
  isActive: boolean;
  isPopular?: boolean;
  razorpayPlanIds?: {
    monthly?: string;
    quarterly?: string;
    annual?: string;
  };
}

export interface SubscriptionAuditLog {
  id: string;
  timestamp: string;
  event: string;
  actor: string;
  details?: Record<string, any>;
}

export interface UserSubscription {
  id: string;
  userId: string;
  userEmail: string;
  userName: string;
  clinicName: string;
  orgType: OrgType;
  status: SubscriptionStatus;
  planId: string;
  billingFrequency: BillingFrequency;
  
  // Trial Metadata
  trialStartDate: string;  // ISO timestamp
  trialExpiryDate: string; // ISO timestamp
  trialDurationDays: number;
  trialExtendedByAdmin?: boolean;
  trialExtensionDays?: number;
  trialExtendedAt?: string;
  trialExtendedBy?: string;
  trialExtensionReason?: string;

  // Active Billing Metadata
  currentPeriodStart: string;
  currentPeriodEnd: string;
  razorpayCustomerId?: string;
  razorpaySubscriptionId?: string;
  razorpayPaymentId?: string;
  razorpayOrderId?: string;
  razorpaySignature?: string;
  amountPaid: number;
  currency: string;

  // Cancellation & Renewal
  cancelAtPeriodEnd?: boolean;
  cancelledAt?: string;
  cancellationReason?: string;
  paymentStatus: 'paid' | 'pending' | 'failed';
  lastPaymentDate?: string;
  nextRenewalDate?: string;

  // Audit Logs
  history: SubscriptionAuditLog[];
  createdAt: string;
  updatedAt: string;
}

export interface AdminSubscriptionConfig {
  defaultTrialDays: number;
  allowManualExtensions: boolean;
  maxExtensionDays: number;
  gracePeriodDays: number;
  plans: SubscriptionPlan[];
  updatedAt: string;
  updatedBy: string;
}

export interface CreateOrderRequest {
  planId: string;
  billingFrequency: BillingFrequency;
  clinicName: string;
  userEmail: string;
  userName: string;
  userPhone: string;
  gstin?: string;
  orgType: OrgType;
}

export interface VerifyPaymentRequest {
  orderId: string;
  paymentId: string;
  signature: string;
  planId: string;
  billingFrequency: BillingFrequency;
  amount: number;
  userId: string;
  userEmail: string;
  clinicName: string;
  orgType: OrgType;
}
