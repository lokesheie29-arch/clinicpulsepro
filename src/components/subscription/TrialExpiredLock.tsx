import React, { useState } from 'react';
import { 
  Lock, 
  ShieldCheck, 
  CheckCircle2, 
  Sparkles, 
  ArrowRight, 
  AlertCircle, 
  PhoneCall, 
  Database,
  ExternalLink
} from 'lucide-react';
import { useUser, UserButton } from '@clerk/react';
import { useSubscription } from '../../context/SubscriptionContext';
import { BillingFrequency } from '../../types/subscription';
import { Logo } from '../Logo';

interface TrialExpiredLockProps {
  onSelectPlan?: (planId: string, frequency: BillingFrequency) => void;
  onOpenSettings?: () => void;
}

export const TrialExpiredLock: React.FC<TrialExpiredLockProps> = ({ 
  onSelectPlan,
  onOpenSettings
}) => {
  const { user } = useUser();
  const { plans, subscription } = useSubscription();
  const [selectedFreq, setSelectedFreq] = useState<BillingFrequency>('annual');

  const handleSubscribe = (planId: string) => {
    if (onSelectPlan) {
      onSelectPlan(planId, selectedFreq);
    } else {
      window.location.hash = `#checkout?plan=${planId}&billing=${selectedFreq}`;
    }
  };

  return (
    <div className="min-h-screen bg-slate-900 text-slate-100 flex flex-col justify-between selection:bg-teal-500 selection:text-white">
      {/* Top Header */}
      <header className="border-b border-slate-800 bg-slate-900/90 backdrop-blur-md px-6 py-4">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Logo size="md" variant="light" />
            <span className="hidden sm:inline-block px-2.5 py-0.5 rounded-full text-xs font-semibold bg-rose-500/20 text-rose-400 border border-rose-500/30">
              Trial Expired
            </span>
          </div>

          <div className="flex items-center gap-4">
            <div className="text-right hidden sm:block">
              <p className="text-xs text-slate-400">{user?.primaryEmailAddress?.emailAddress}</p>
              <p className="text-xs font-semibold text-slate-200">{user?.fullName || 'Practitioner'}</p>
            </div>
            <UserButton afterSignOutUrl="/" />
          </div>
        </div>
      </header>

      {/* Main Lockout Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 flex-1 flex flex-col items-center justify-center">
        {/* Lock Icon & Hero Alert */}
        <div className="text-center max-w-3xl mx-auto mb-10">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-rose-500/10 text-rose-400 border border-rose-500/20 shadow-lg shadow-rose-950/40 mb-5">
            <Lock className="w-8 h-8" />
          </div>
          <h1 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight mb-3">
            Your 30-Day Free Trial Has Expired
          </h1>
          <p className="text-base sm:text-lg text-slate-300">
            Please choose a subscription plan to continue using <strong className="text-teal-400 font-semibold">ClinicPulse Pro</strong>.
            Your access will be restored immediately upon payment confirmation.
          </p>

          {/* Data Safety Assurance Box */}
          <div className="mt-6 inline-flex items-center gap-3 bg-slate-800/80 border border-slate-700/80 rounded-xl px-4 py-2.5 text-xs sm:text-sm text-slate-300">
            <Database className="w-4 h-4 text-teal-400 shrink-0" />
            <span>
              <strong>Zero Data Loss Guaranteed:</strong> All your patient records, medical stock, prescriptions, and invoices remain safely intact in cloud storage.
            </span>
          </div>
        </div>

        {/* Frequency Selector */}
        <div className="flex justify-center mb-8">
          <div className="bg-slate-800/90 p-1.5 rounded-2xl border border-slate-700 flex items-center space-x-1 shadow-inner">
            <button
              onClick={() => setSelectedFreq('monthly')}
              className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold transition-all ${
                selectedFreq === 'monthly'
                  ? 'bg-teal-600 text-white shadow-md'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Monthly
            </button>
            <button
              onClick={() => setSelectedFreq('quarterly')}
              className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold transition-all relative ${
                selectedFreq === 'quarterly'
                  ? 'bg-teal-600 text-white shadow-md'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Quarterly
              <span className="ml-1.5 px-1.5 py-0.5 rounded text-[10px] font-bold bg-teal-400/20 text-teal-300">
                10% OFF
              </span>
            </button>
            <button
              onClick={() => setSelectedFreq('annual')}
              className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold transition-all relative ${
                selectedFreq === 'annual'
                  ? 'bg-teal-600 text-white shadow-md'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Annual Billing
              <span className="ml-1.5 px-1.5 py-0.5 rounded text-[10px] font-bold bg-amber-400/20 text-amber-300">
                20% OFF
              </span>
            </button>
          </div>
        </div>

        {/* Plan Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 w-full max-w-6xl">
          {plans.map((plan) => {
            const price = plan.prices[selectedFreq];
            const monthlyEquivalent =
              selectedFreq === 'annual'
                ? Math.round(price / 12)
                : selectedFreq === 'quarterly'
                ? Math.round(price / 3)
                : price;

            return (
              <div
                key={plan.id}
                className={`relative rounded-3xl p-6 sm:p-8 flex flex-col justify-between transition-all duration-300 ${
                  plan.isPopular
                    ? 'bg-gradient-to-b from-slate-800 to-slate-850 border-2 border-teal-500 shadow-2xl shadow-teal-950/40 transform md:-translate-y-2'
                    : 'bg-slate-800/60 border border-slate-700/80 hover:border-slate-600'
                }`}
              >
                {plan.isPopular && (
                  <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 bg-teal-500 text-slate-950 font-black text-[11px] uppercase tracking-wider px-4 py-1 rounded-full shadow-lg flex items-center gap-1">
                    <Sparkles className="w-3.5 h-3.5 fill-current" /> Most Popular ERP
                  </div>
                )}

                <div>
                  <h3 className="text-xl font-bold text-white mb-1">{plan.name}</h3>
                  <p className="text-xs text-slate-400 mb-6 min-h-[36px]">{plan.tagline}</p>

                  <div className="mb-6 pb-6 border-b border-slate-700/60">
                    <div className="flex items-baseline gap-1">
                      <span className="text-3xl sm:text-4xl font-extrabold text-white">
                        ₹{monthlyEquivalent.toLocaleString('en-IN')}
                      </span>
                      <span className="text-xs text-slate-400 font-medium">/ month</span>
                    </div>
                    {selectedFreq !== 'monthly' && (
                      <p className="text-xs text-teal-400 mt-1 font-medium">
                        Billed ₹{price.toLocaleString('en-IN')} {selectedFreq === 'annual' ? 'yearly' : 'quarterly'} (+ 18% GST)
                      </p>
                    )}
                  </div>

                  {/* Feature Checklist */}
                  <ul className="space-y-3 mb-8 text-xs sm:text-sm text-slate-300">
                    {plan.features.map((feat, idx) => (
                      <li key={idx} className="flex items-start gap-2.5">
                        <CheckCircle2 className="w-4 h-4 text-teal-400 shrink-0 mt-0.5" />
                        <span>{feat}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                <button
                  onClick={() => handleSubscribe(plan.id)}
                  className={`w-full py-3 px-4 rounded-xl font-bold text-sm flex items-center justify-center gap-2 transition-all shadow-md ${
                    plan.isPopular
                      ? 'bg-teal-500 hover:bg-teal-400 text-slate-950 hover:shadow-teal-500/25'
                      : 'bg-slate-700 hover:bg-slate-600 text-white'
                  }`}
                >
                  <span>Subscribe to {plan.name.split(' ')[0]}</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            );
          })}
        </div>

        {/* Footer Support Info */}
        <div className="mt-12 text-center text-xs text-slate-400 flex flex-wrap items-center justify-center gap-6">
          <div className="flex items-center gap-1.5">
            <ShieldCheck className="w-4 h-4 text-teal-400" />
            <span>256-Bit SSL Encrypted Razorpay Gateway</span>
          </div>
          <div className="flex items-center gap-1.5">
            <PhoneCall className="w-4 h-4 text-teal-400" />
            <span>Need Custom Setup or Support? <a href="mailto:support@clinicpulsepro.com" className="text-teal-400 underline hover:text-teal-300">support@clinicpulsepro.com</a></span>
          </div>
        </div>
      </main>

      {/* Subtle bottom note */}
      <footer className="border-t border-slate-800/80 py-4 text-center text-xs text-slate-500">
        &copy; {new Date().getFullYear()} ClinicPulse Pro. All rights reserved. Medical records are encrypted and protected under healthcare data governance standards.
      </footer>
    </div>
  );
};
