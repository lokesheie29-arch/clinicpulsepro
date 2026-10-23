import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { useUser } from '@clerk/react';
import {
  UserSubscription,
  SubscriptionPlan,
  SubscriptionStatus,
  BillingFrequency
} from '../types/subscription';
import {
  DEFAULT_PLANS,
  getUserSubscription,
  initializeUserTrial,
  evaluateSubscriptionStatus,
  calculateRemainingDays,
  getTrialWarningLevel,
  activatePaidSubscription,
  extendTrialByAdmin,
  cancelSubscriptionPlan,
  saveUserSubscriptionLocally,
  syncSubscriptionToSupabase
} from '../lib/subscriptionService';

interface SubscriptionContextType {
  subscription: UserSubscription | null;
  loading: boolean;
  plans: SubscriptionPlan[];
  remainingDays: number;
  warningLevel: 'none' | 'info' | 'warning' | 'critical' | 'expired';
  canAccessApp: boolean;
  isTrialActive: boolean;
  isTrialExpired: boolean;
  hasPaidAccess: boolean;
  refreshSubscription: () => Promise<void>;
  activatePaid: (
    planId: string,
    frequency: BillingFrequency,
    amount: number,
    paymentDetails: {
      paymentId: string;
      orderId?: string;
      signature?: string;
      method?: string;
    }
  ) => Promise<UserSubscription>;
  extendTrial: (days: number, reason: string) => Promise<UserSubscription>;
  cancelSubscription: (reason?: string) => Promise<UserSubscription>;
}

const SubscriptionContext = createContext<SubscriptionContextType | undefined>(undefined);

export const SubscriptionProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, isSignedIn, isLoaded } = useUser();
  const [subscription, setSubscription] = useState<UserSubscription | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [plans] = useState<SubscriptionPlan[]>(DEFAULT_PLANS);

  const isMasterAdmin = user?.primaryEmailAddress?.emailAddress === 'lokesheie29@gmail.com';

  // Load or initialize user subscription
  const loadUserSub = useCallback(async () => {
    if (!isLoaded) return;
    if (!isSignedIn || !user) {
      setSubscription(null);
      setLoading(false);
      return;
    }

    setLoading(true);
    try {
      const email = user.primaryEmailAddress?.emailAddress || '';
      let existingSub = await getUserSubscription(user.id, email);

      if (!existingSub) {
        // Initialize 30-day trial automatically
        const userCreatedAt = user.createdAt ? new Date(user.createdAt) : new Date();
        const userName = user.fullName || user.firstName || 'Healthcare Practitioner';
        const defaultClinic = 'ClinicPulse Healthcare Center';
        
        existingSub = initializeUserTrial(
          user.id,
          email,
          userName,
          defaultClinic,
          'hospital',
          userCreatedAt
        );
      } else {
        // Re-evaluate current status against true timestamp
        const evaluated = evaluateSubscriptionStatus(existingSub);
        if (evaluated !== existingSub.status) {
          existingSub = { ...existingSub, status: evaluated, updatedAt: new Date().toISOString() };
          saveUserSubscriptionLocally(existingSub);
          syncSubscriptionToSupabase(existingSub);
        }
      }

      setSubscription(existingSub);
    } catch (err) {
      console.error('Error loading subscription state:', err);
    } finally {
      setLoading(false);
    }
  }, [user, isSignedIn, isLoaded]);

  useEffect(() => {
    loadUserSub();
  }, [loadUserSub]);

  // Periodic status refresh (every 10 minutes)
  useEffect(() => {
    const timer = setInterval(() => {
      if (subscription) {
        const evaluated = evaluateSubscriptionStatus(subscription);
        if (evaluated !== subscription.status) {
          setSubscription(prev => prev ? { ...prev, status: evaluated } : null);
        }
      }
    }, 10 * 60 * 1000);

    return () => clearInterval(timer);
  }, [subscription]);

  const remainingDays = subscription ? calculateRemainingDays(subscription.trialExpiryDate) : 0;
  const rawWarning = subscription ? getTrialWarningLevel(remainingDays, subscription.status) : null;
  const warningLevel: 'none' | 'info' | 'warning' | 'critical' | 'expired' =
    rawWarning === 'expired'
      ? 'expired'
      : rawWarning === '1day'
      ? 'critical'
      : rawWarning === '3days'
      ? 'warning'
      : rawWarning === '7days'
      ? 'info'
      : 'none';

  const isPaidActive = subscription?.status === 'active';
  const isTrialValid = subscription?.status === 'trialing' && remainingDays > 0;
  const isExpired = subscription?.status === 'trial_expired' || (subscription?.status === 'trialing' && remainingDays === 0);

  // Master admin always has access for system oversight; users must have active trial or paid plan
  const canAccessApp = isMasterAdmin || isPaidActive || isTrialValid;

  const handleActivatePaid = async (
    planId: string,
    frequency: BillingFrequency,
    amount: number,
    paymentDetails: {
      paymentId: string;
      orderId?: string;
      signature?: string;
      method?: string;
    }
  ): Promise<UserSubscription> => {
    if (!subscription && user) {
      // Create base subscription if missing
      const email = user.primaryEmailAddress?.emailAddress || '';
      const baseSub = initializeUserTrial(
        user.id,
        email,
        user.fullName || 'Practitioner',
        'ClinicPulse Healthcare Center',
        'hospital'
      );
      const updated = activatePaidSubscription(baseSub, planId, frequency, amount, paymentDetails);
      setSubscription(updated);
      return updated;
    }

    if (!subscription) throw new Error('No user subscription found to activate.');

    const updated = activatePaidSubscription(subscription, planId, frequency, amount, paymentDetails);
    setSubscription(updated);
    return updated;
  };

  const handleExtendTrial = async (days: number, reason: string): Promise<UserSubscription> => {
    if (!subscription) throw new Error('No active subscription to extend.');
    const adminEmail = user?.primaryEmailAddress?.emailAddress || 'admin@clinicpulsepro.com';
    const updated = extendTrialByAdmin(subscription, days, adminEmail, reason);
    setSubscription(updated);
    return updated;
  };

  const handleCancelSubscription = async (reason?: string): Promise<UserSubscription> => {
    if (!subscription) throw new Error('No active subscription to cancel.');
    const updated = cancelSubscriptionPlan(subscription, reason);
    setSubscription(updated);
    return updated;
  };

  return (
    <SubscriptionContext.Provider
      value={{
        subscription,
        loading,
        plans,
        remainingDays,
        warningLevel,
        canAccessApp,
        isTrialActive: isTrialValid,
        isTrialExpired: isExpired && !isPaidActive,
        hasPaidAccess: isPaidActive,
        refreshSubscription: loadUserSub,
        activatePaid: handleActivatePaid,
        extendTrial: handleExtendTrial,
        cancelSubscription: handleCancelSubscription
      }}
    >
      {children}
    </SubscriptionContext.Provider>
  );
};

export const useSubscription = (): SubscriptionContextType => {
  const context = useContext(SubscriptionContext);
  if (!context) {
    throw new Error('useSubscription must be used within a SubscriptionProvider');
  }
  return context;
};
