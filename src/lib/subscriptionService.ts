import { 
  SubscriptionPlan, 
  UserSubscription, 
  AdminSubscriptionConfig, 
  SubscriptionStatus, 
  BillingFrequency 
} from '../types/subscription';
import { supabase } from './supabase';

export const DEFAULT_PLANS: SubscriptionPlan[] = [
  {
    id: 'starter',
    name: 'Starter Clinic',
    tagline: 'Ideal for standalone general practice clinics & small dispensaries',
    prices: {
      monthly: 999,
      quarterly: 2697, // 10% off (899/mo)
      annual: 9588     // 20% off (799/mo - 2 months free)
    },
    currency: 'INR',
    features: [
      'Single Branch / Counter Operations',
      'Up to 2 Doctor & Staff Logins',
      'OPD Consultation & E-Prescriptions',
      'WhatsApp Bill & Payment Links',
      'Basic Pharmacy Stock Management',
      'Daily Financial Summary'
    ],
    isActive: true
  },
  {
    id: 'professional',
    name: 'Growth & Professional ERP',
    tagline: 'For multispecialty clinics, busy medical stores & diagnostic labs',
    prices: {
      monthly: 2499,
      quarterly: 6747, // 10% off (2249/mo)
      annual: 23988    // 20% off (1999/mo - 2 months free)
    },
    currency: 'INR',
    isPopular: true,
    features: [
      'Multi-Specialty & Laboratory Support',
      'Up to 10 Doctor & Staff Logins',
      'FEFO Drug Inventory & Expiry Alerts (1y, 6m, 3m, 1m)',
      'Direct WhatsApp Official PDF Invoices',
      'Instant UPI QR & Direct Bank Settlement',
      'Advanced Diagnostic Test Reports',
      'Role-Based Staff Access Control',
      'Priority Email & WhatsApp Support'
    ],
    isActive: true
  },
  {
    id: 'enterprise',
    name: 'Polyclinic & Hospital ERP Suite',
    tagline: 'For hospitals, healthcare chains & high-volume pharmacy networks',
    prices: {
      monthly: 4999,
      quarterly: 13497, // 10% off (4499/mo)
      annual: 47988     // 20% off (3999/mo - 2 months free)
    },
    currency: 'INR',
    features: [
      'Unlimited Branches & Departments',
      'Unlimited Doctor & Admin Logins',
      'Complete Purchase & Procurement Suite (RFQ, PO, GRN, 3-Way Match)',
      'Automated Accounts Payable & Vendor Ledgers',
      'Custom GSTIN & Drug License Configuration',
      'Automated Daily Cloud Backups',
      'Dedicated Account Manager & 24/7 Phone SLA'
    ],
    isActive: true
  }
];

export const DEFAULT_ADMIN_CONFIG: AdminSubscriptionConfig = {
  defaultTrialDays: 30,
  allowManualExtensions: true,
  maxExtensionDays: 60,
  gracePeriodDays: 3,
  plans: DEFAULT_PLANS,
  updatedAt: new Date().toISOString(),
  updatedBy: 'system'
};

const STORAGE_KEY_PREFIX = 'clinicpulse_sub_';
const ADMIN_CONFIG_KEY = 'clinicpulse_admin_sub_config_v1';

/**
 * Calculates remaining trial days based on standard midnight-aligned timestamps
 */
export const calculateRemainingDays = (expiryDateStr: string): number => {
  const now = new Date().getTime();
  const expiry = new Date(expiryDateStr).getTime();
  const diffMs = expiry - now;
  return Math.max(0, Math.ceil(diffMs / (1000 * 60 * 60 * 24)));
};

/**
 * Computes warning alert tier for remaining trial days
 */
export const getTrialWarningLevel = (
  daysRemaining: number, 
  status: SubscriptionStatus
): '7days' | '3days' | '1day' | 'expired' | null => {
  if (status === 'trial_expired' || status === 'expired') return 'expired';
  if (status !== 'trialing') return null;
  if (daysRemaining <= 0) return 'expired';
  if (daysRemaining === 1) return '1day';
  if (daysRemaining <= 3) return '3days';
  if (daysRemaining <= 7) return '7days';
  return null;
};

/**
 * Computes new status from dates and payment condition
 */
export const evaluateSubscriptionStatus = (sub: UserSubscription): SubscriptionStatus => {
  // If active paid subscription
  if (sub.status === 'active') {
    const periodEnd = new Date(sub.currentPeriodEnd).getTime();
    const now = new Date().getTime();
    if (now > periodEnd) {
      return 'expired';
    }
    return 'active';
  }

  // If in trial mode
  if (sub.status === 'trialing') {
    const remaining = calculateRemainingDays(sub.trialExpiryDate);
    if (remaining <= 0) {
      return 'trial_expired';
    }
    return 'trialing';
  }

  return sub.status;
};

/**
 * Alias for fetching user subscription
 */
export const getUserSubscription = (
  userId: string,
  userEmail: string,
  createdAtString?: string
): Promise<UserSubscription | null> => fetchUserSubscription(userId, userEmail, createdAtString);


/**
 * Fetches subscription record from Supabase or localStorage fallback
 */
export const fetchUserSubscription = async (
  userId: string,
  userEmail: string,
  createdAtString?: string
): Promise<UserSubscription | null> => {
  try {
    // 1. Try Supabase
    if (supabase) {
      const { data, error } = await supabase
        .from('subscriptions')
        .select('*')
        .eq('user_id', userId)
        .maybeSingle();

      if (!error && data) {
        const sub: UserSubscription = {
          id: data.id,
          userId: data.user_id,
          userEmail: data.user_email || userEmail,
          userName: data.user_name || 'Practitioner',
          clinicName: data.clinic_name || 'ClinicPulse Center',
          orgType: data.org_type || 'hospital',
          status: data.status,
          planId: data.plan_id || 'professional',
          billingFrequency: data.billing_frequency || 'annual',
          trialStartDate: data.trial_start_date,
          trialExpiryDate: data.trial_expiry_date,
          trialDurationDays: data.trial_duration_days || 30,
          trialExtendedByAdmin: data.trial_extended_by_admin,
          trialExtensionDays: data.trial_extension_days,
          trialExtendedAt: data.trial_extended_at,
          trialExtendedBy: data.trial_extended_by,
          trialExtensionReason: data.trial_extension_reason,
          currentPeriodStart: data.current_period_start,
          currentPeriodEnd: data.current_period_end,
          razorpayCustomerId: data.razorpay_customer_id,
          razorpaySubscriptionId: data.razorpay_subscription_id,
          razorpayPaymentId: data.razorpay_payment_id,
          razorpayOrderId: data.razorpay_order_id,
          razorpaySignature: data.razorpay_signature,
          amountPaid: Number(data.amount_paid || 0),
          currency: data.currency || 'INR',
          cancelAtPeriodEnd: data.cancel_at_period_end,
          cancelledAt: data.cancelled_at,
          paymentStatus: data.payment_status || 'pending',
          lastPaymentDate: data.last_payment_date,
          nextRenewalDate: data.next_renewal_date,
          history: data.history || [],
          createdAt: data.created_at,
          updatedAt: data.updated_at
        };

        const updatedStatus = evaluateSubscriptionStatus(sub);
        if (updatedStatus !== sub.status) {
          sub.status = updatedStatus;
          // save update
          saveUserSubscriptionLocally(sub);
        }
        return sub;
      }
    }
  } catch (err) {
    console.warn('Supabase subscription lookup fallback to cache:', err);
  }

  // 2. Fallback to LocalStorage
  const cached = localStorage.getItem(`${STORAGE_KEY_PREFIX}${userId}`);
  if (cached) {
    try {
      const parsed: UserSubscription = JSON.parse(cached);
      parsed.status = evaluateSubscriptionStatus(parsed);
      return parsed;
    } catch {
      // invalid cache
    }
  }

  // 3. Fallback to general subscription key if present
  const generalCached = localStorage.getItem('clinicpulse_active_subscription');
  if (generalCached) {
    try {
      const p = JSON.parse(generalCached);
      if (p.paymentId) {
        // Return active paid
        return {
          id: `sub_${userId}`,
          userId,
          userEmail,
          userName: p.contactName || 'Practitioner',
          clinicName: p.clinicName || 'ClinicPulse Center',
          orgType: 'hospital',
          status: 'active',
          planId: p.planId || 'professional',
          billingFrequency: p.billingCycle || 'annual',
          trialStartDate: new Date().toISOString(),
          trialExpiryDate: new Date().toISOString(),
          trialDurationDays: 30,
          currentPeriodStart: p.date || new Date().toISOString(),
          currentPeriodEnd: p.validUntil ? new Date(p.validUntil).toISOString() : new Date(Date.now() + 365*24*60*60*1000).toISOString(),
          amountPaid: p.totalPaid || 0,
          currency: 'INR',
          paymentStatus: 'paid',
          history: [{
            id: `audit_${Date.now()}`,
            timestamp: new Date().toISOString(),
            event: 'payment_verified',
            actor: 'system',
            details: { paymentId: p.paymentId }
          }],
          createdAt: p.date || new Date().toISOString(),
          updatedAt: new Date().toISOString()
        };
      }
    } catch {}
  }

  return null;
};

/**
 * Creates and initializes a 30-Day Free Trial for a registered user.
 * Implements strict anti-duplicate policy:
 * - If user account creation date was > 30 days ago, marks as trial_expired.
 * - Otherwise computes exact 30 days from creation date.
 */
export const initializeUserTrial = (
  userId: string,
  userEmail: string,
  userName: string,
  clinicName: string,
  orgType: any,
  userCreatedAt?: Date | string | null
): UserSubscription => {
  const now = new Date();
  
  // Safe migration policy for existing users
  let startDate = now;
  if (userCreatedAt) {
    const parsedCreated = new Date(userCreatedAt);
    if (!isNaN(parsedCreated.getTime())) {
      startDate = parsedCreated;
    }
  }

  const durationDays = 30;
  const expiryDate = new Date(startDate.getTime() + durationDays * 24 * 60 * 60 * 1000);
  const isAlreadyPast = now.getTime() > expiryDate.getTime();
  const status: SubscriptionStatus = isAlreadyPast ? 'trial_expired' : 'trialing';

  const newSub: UserSubscription = {
    id: `sub_${userId.replace(/[^a-zA-Z0-9]/g, '_')}`,
    userId,
    userEmail,
    userName: userName || 'Practitioner',
    clinicName: clinicName || 'ClinicPulse Healthcare Center',
    orgType: orgType || 'hospital',
    status,
    planId: 'professional', // Default trial plan is the full Growth & Professional ERP suite
    billingFrequency: 'annual',
    trialStartDate: startDate.toISOString(),
    trialExpiryDate: expiryDate.toISOString(),
    trialDurationDays: durationDays,
    currentPeriodStart: startDate.toISOString(),
    currentPeriodEnd: expiryDate.toISOString(),
    amountPaid: 0,
    currency: 'INR',
    paymentStatus: 'pending',
    history: [
      {
        id: `audit_${Date.now()}`,
        timestamp: now.toISOString(),
        event: 'trial_initialized',
        actor: 'system',
        details: {
          trialDurationDays: durationDays,
          startDate: startDate.toISOString(),
          expiryDate: expiryDate.toISOString(),
          initialStatus: status
        }
      }
    ],
    createdAt: startDate.toISOString(),
    updatedAt: now.toISOString()
  };

  saveUserSubscriptionLocally(newSub);
  syncSubscriptionToSupabase(newSub);

  return newSub;
};

/**
 * Saves subscription locally
 */
export const saveUserSubscriptionLocally = (sub: UserSubscription): void => {
  localStorage.setItem(`${STORAGE_KEY_PREFIX}${sub.userId}`, JSON.stringify(sub));
  
  // Also keep all known subscriptions indexed for the admin panel
  const allList = getAllSubscriptionsFromCache();
  const idx = allList.findIndex(s => s.userId === sub.userId);
  if (idx >= 0) {
    allList[idx] = sub;
  } else {
    allList.push(sub);
  }
  localStorage.setItem('clinicpulse_all_subscriptions_cache', JSON.stringify(allList));
};

/**
 * Syncs subscription to Supabase in the background
 */
export const syncSubscriptionToSupabase = async (sub: UserSubscription): Promise<void> => {
  if (!supabase) return;
  try {
    await supabase.from('subscriptions').upsert({
      id: sub.id,
      user_id: sub.userId,
      user_email: sub.userEmail,
      user_name: sub.userName,
      clinic_name: sub.clinicName,
      org_type: sub.orgType,
      status: sub.status,
      plan_id: sub.planId,
      billing_frequency: sub.billingFrequency,
      trial_start_date: sub.trialStartDate,
      trial_expiry_date: sub.trialExpiryDate,
      trial_duration_days: sub.trialDurationDays,
      trial_extended_by_admin: sub.trialExtendedByAdmin,
      trial_extension_days: sub.trialExtensionDays,
      trial_extended_at: sub.trialExtendedAt,
      trial_extended_by: sub.trialExtendedBy,
      trial_extension_reason: sub.trialExtensionReason,
      current_period_start: sub.currentPeriodStart,
      current_period_end: sub.currentPeriodEnd,
      amount_paid: sub.amountPaid,
      currency: sub.currency,
      payment_status: sub.paymentStatus,
      razorpay_payment_id: sub.razorpayPaymentId,
      razorpay_order_id: sub.razorpayOrderId,
      history: sub.history,
      updated_at: new Date().toISOString()
    }, { onConflict: 'user_id' });
  } catch (err) {
    console.warn('Background Supabase subscription sync notice:', err);
  }
};

/**
 * Returns all cached subscriptions for the admin manager
 */
export const getAllSubscriptionsFromCache = (): UserSubscription[] => {
  const cached = localStorage.getItem('clinicpulse_all_subscriptions_cache');
  if (cached) {
    try {
      return JSON.parse(cached);
    } catch {}
  }
  return [];
};

/**
 * Admin action: Manually extends a user's trial
 */
export const extendTrialByAdmin = (
  sub: UserSubscription,
  extensionDays: number,
  adminEmail: string,
  reason: string
): UserSubscription => {
  const currentExpiry = new Date(sub.trialExpiryDate).getTime();
  const baseTime = Math.max(new Date().getTime(), currentExpiry);
  const newExpiry = new Date(baseTime + extensionDays * 24 * 60 * 60 * 1000);

  const updated: UserSubscription = {
    ...sub,
    status: 'trialing',
    trialExpiryDate: newExpiry.toISOString(),
    trialDurationDays: (sub.trialDurationDays || 30) + extensionDays,
    trialExtendedByAdmin: true,
    trialExtensionDays: (sub.trialExtensionDays || 0) + extensionDays,
    trialExtendedAt: new Date().toISOString(),
    trialExtendedBy: adminEmail,
    trialExtensionReason: reason,
    currentPeriodEnd: newExpiry.toISOString(),
    updatedAt: new Date().toISOString(),
    history: [
      ...sub.history,
      {
        id: `audit_${Date.now()}`,
        timestamp: new Date().toISOString(),
        event: 'trial_extended_by_admin',
        actor: adminEmail,
        details: {
          daysAdded: extensionDays,
          newExpiryDate: newExpiry.toISOString(),
          reason
        }
      }
    ]
  };

  saveUserSubscriptionLocally(updated);
  syncSubscriptionToSupabase(updated);
  return updated;
};

/**
 * Activates a paid subscription after verified payment
 */
export const activatePaidSubscription = (
  sub: UserSubscription,
  planId: string,
  frequency: BillingFrequency,
  amount: number,
  paymentDetails: {
    paymentId: string;
    orderId?: string;
    signature?: string;
    method?: string;
  }
): UserSubscription => {
  const now = new Date();
  let daysToAdd = 30;
  if (frequency === 'quarterly') daysToAdd = 90;
  if (frequency === 'annual') daysToAdd = 365;

  const periodEnd = new Date(now.getTime() + daysToAdd * 24 * 60 * 60 * 1000);

  const updated: UserSubscription = {
    ...sub,
    status: 'active',
    planId,
    billingFrequency: frequency,
    currentPeriodStart: now.toISOString(),
    currentPeriodEnd: periodEnd.toISOString(),
    amountPaid: amount,
    currency: 'INR',
    paymentStatus: 'paid',
    razorpayPaymentId: paymentDetails.paymentId,
    razorpayOrderId: paymentDetails.orderId,
    razorpaySignature: paymentDetails.signature,
    lastPaymentDate: now.toISOString(),
    nextRenewalDate: periodEnd.toISOString(),
    updatedAt: now.toISOString(),
    history: [
      ...sub.history,
      {
        id: `audit_${Date.now()}`,
        timestamp: now.toISOString(),
        event: 'subscription_activated',
        actor: 'razorpay_verified',
        details: {
          planId,
          frequency,
          amount,
          paymentId: paymentDetails.paymentId,
          validUntil: periodEnd.toISOString()
        }
      }
    ]
  };

  saveUserSubscriptionLocally(updated);
  syncSubscriptionToSupabase(updated);
  return updated;
};

/**
 * Cancels an active subscription (sets cancelAtPeriodEnd to true)
 */
export const cancelSubscriptionPlan = (
  sub: UserSubscription,
  reason: string = 'User requested cancellation'
): UserSubscription => {
  const now = new Date();
  const updated: UserSubscription = {
    ...sub,
    cancelAtPeriodEnd: true,
    cancelledAt: now.toISOString(),
    cancellationReason: reason,
    updatedAt: now.toISOString(),
    history: [
      ...sub.history,
      {
        id: `audit_${Date.now()}`,
        timestamp: now.toISOString(),
        event: 'subscription_cancelled',
        actor: sub.userEmail,
        details: { reason }
      }
    ]
  };

  saveUserSubscriptionLocally(updated);
  syncSubscriptionToSupabase(updated);
  return updated;
};

