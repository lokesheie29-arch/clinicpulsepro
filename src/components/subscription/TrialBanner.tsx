import React, { useState } from 'react';
import { Sparkles, AlertTriangle, Clock, ArrowRight, X, ShieldCheck } from 'lucide-react';
import { useSubscription } from '../../context/SubscriptionContext';

interface TrialBannerProps {
  onUpgradeClick?: () => void;
}

export const TrialBanner: React.FC<TrialBannerProps> = ({ onUpgradeClick }) => {
  const { subscription, isTrialActive, remainingDays, warningLevel, hasPaidAccess } = useSubscription();
  const [isDismissed, setIsDismissed] = useState(false);

  // If user has paid active subscription or dismissed (> 3 days remaining), don't show
  if (hasPaidAccess || !isTrialActive || !subscription) {
    return null;
  }

  if (isDismissed && remainingDays > 3) {
    return null;
  }

  const handleUpgrade = () => {
    if (onUpgradeClick) {
      onUpgradeClick();
    } else {
      window.location.hash = '#checkout?plan=professional&billing=annual';
    }
  };

  // 1. Critical Urgency (<= 1 Day remaining)
  if (warningLevel === 'critical' || remainingDays <= 1) {
    return (
      <div className="bg-gradient-to-r from-rose-600 via-red-600 to-rose-700 text-white px-4 py-2.5 shadow-md border-b border-rose-800">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-2 text-xs sm:text-sm">
          <div className="flex items-center gap-2 font-medium">
            <span className="p-1 bg-white/20 rounded-full flex items-center justify-center animate-bounce">
              <AlertTriangle className="w-4 h-4 text-white" />
            </span>
            <span>
              <strong>URGENT:</strong> Your 30-day free trial expires{' '}
              {remainingDays === 0 ? 'today!' : 'in 1 day!'} Upgrade now to prevent disruption to your OPD, Pharmacy & Invoicing.
            </span>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={handleUpgrade}
              className="inline-flex items-center gap-1.5 px-3.5 py-1 bg-white text-rose-700 font-bold rounded-lg hover:bg-rose-50 transition-all shadow-sm transform hover:scale-105"
            >
              <Sparkles className="w-3.5 h-3.5" />
              Subscribe Now & Save 20%
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>
    );
  }

  // 2. High Warning (<= 3 Days remaining)
  if (warningLevel === 'warning' || remainingDays <= 3) {
    return (
      <div className="bg-gradient-to-r from-amber-600 via-orange-600 to-amber-700 text-white px-4 py-2.5 shadow-md border-b border-amber-800">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-2 text-xs sm:text-sm">
          <div className="flex items-center gap-2 font-medium">
            <span className="p-1 bg-white/20 rounded-full">
              <Clock className="w-4 h-4 text-white" />
            </span>
            <span>
              <strong>Trial Ending Soon:</strong> Only <strong>{remainingDays} days</strong> remaining in your ClinicPulse Pro trial.
            </span>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={handleUpgrade}
              className="inline-flex items-center gap-1.5 px-3 py-1 bg-white text-amber-800 font-bold rounded-lg hover:bg-amber-50 transition-all shadow-sm"
            >
              Choose a Plan
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>
    );
  }

  // 3. Info Notice (<= 7 Days remaining)
  if (warningLevel === 'info' || remainingDays <= 7) {
    return (
      <div className="bg-gradient-to-r from-blue-700 via-indigo-700 to-teal-700 text-white px-4 py-2 border-b border-indigo-800">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-2 text-xs sm:text-sm">
          <div className="flex items-center gap-2 font-medium">
            <span className="p-1 bg-white/20 rounded-full">
              <Sparkles className="w-3.5 h-3.5 text-teal-200" />
            </span>
            <span>
              You have <strong>{remainingDays} days left</strong> in your 30-day full access trial.
            </span>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={handleUpgrade}
              className="inline-flex items-center gap-1 px-3 py-0.5 bg-white/10 hover:bg-white/20 text-white font-semibold rounded-md transition-colors border border-white/20"
            >
              View Subscription Plans
              <ArrowRight className="w-3 h-3" />
            </button>
            <button
              onClick={() => setIsDismissed(true)}
              className="p-1 text-white/70 hover:text-white rounded"
              title="Dismiss for this session"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>
    );
  }

  // 4. Default Subtle Banner (> 7 Days remaining)
  return (
    <div className="bg-teal-50 border-b border-teal-100 text-teal-900 px-4 py-2">
      <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-2 text-xs">
        <div className="flex items-center gap-2 font-medium">
          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-teal-600 text-white uppercase tracking-wider">
            Free Trial
          </span>
          <span>
            ClinicPulse Pro Suite Active • <strong>{remainingDays} days</strong> remaining in your 30-day trial period.
          </span>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={handleUpgrade}
            className="inline-flex items-center gap-1 font-semibold text-teal-700 hover:text-teal-900 transition-colors"
          >
            Upgrade Plan <ArrowRight className="w-3 h-3" />
          </button>
          <button
            onClick={() => setIsDismissed(true)}
            className="p-0.5 text-teal-500 hover:text-teal-800 rounded"
            title="Dismiss"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
};
