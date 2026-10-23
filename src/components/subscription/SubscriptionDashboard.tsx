import React, { useState } from 'react';
import { 
  CreditCard, 
  Sparkles, 
  ShieldCheck, 
  Clock, 
  Calendar, 
  CheckCircle2, 
  AlertTriangle, 
  ArrowRight, 
  Receipt, 
  ExternalLink,
  ChevronRight,
  Download,
  RefreshCw,
  Building2,
  FileText
} from 'lucide-react';
import { useSubscription } from '../../context/SubscriptionContext';
import { useUser } from '@clerk/react';
import { BillingFrequency } from '../../types/subscription';

interface SubscriptionDashboardProps {
  onBack?: () => void;
  onNavigateCheckout?: (planId: string, frequency: BillingFrequency) => void;
}

export const SubscriptionDashboard: React.FC<SubscriptionDashboardProps> = ({
  onBack,
  onNavigateCheckout
}) => {
  const { user } = useUser();
  const { 
    subscription, 
    plans, 
    remainingDays, 
    hasPaidAccess, 
    isTrialActive, 
    isTrialExpired,
    cancelSubscription,
    refreshSubscription 
  } = useSubscription();

  const [isCancelling, setIsCancelling] = useState(false);
  const [cancelFeedback, setCancelFeedback] = useState<string | null>(null);

  const activePlan = plans.find(p => p.id === (subscription?.planId || 'professional')) || plans[1];

  const handleUpgrade = (planId: string, freq: BillingFrequency = 'annual') => {
    if (onNavigateCheckout) {
      onNavigateCheckout(planId, freq);
    } else {
      window.location.hash = `#checkout?plan=${planId}&billing=${freq}`;
    }
  };

  const handleCancel = async () => {
    if (!window.confirm('Are you sure you want to cancel your subscription renewal? Your full access will continue until the end of your billing cycle.')) {
      return;
    }
    setIsCancelling(true);
    try {
      await cancelSubscription('Cancelled by clinic administrator');
      setCancelFeedback('Your subscription renewal has been stopped. Access remains active until the end of current cycle.');
    } catch (err: any) {
      alert(err.message || 'Failed to cancel subscription.');
    } finally {
      setIsCancelling(false);
    }
  };

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8">
      {/* Header Breadcrumbs / Title */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between pb-6 mb-8 border-b border-slate-200 gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold text-teal-600 mb-1">
            <span>CLINIC PULSE PRO</span>
            <span>/</span>
            <span>SUBSCRIPTION & BILLING</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
            Subscription & License Management
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Manage your clinic software license, billing intervals, GST invoices, and renewal settings.
          </p>
        </div>

        {onBack && (
          <button
            onClick={onBack}
            className="px-4 py-2 text-xs font-semibold text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors"
          >
            ← Back to Dashboard
          </button>
        )}
      </div>

      {cancelFeedback && (
        <div className="mb-6 p-4 rounded-xl bg-amber-50 border border-amber-200 text-amber-900 text-sm flex items-center gap-2">
          <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0" />
          <span>{cancelFeedback}</span>
        </div>
      )}

      {/* Primary Status Card */}
      <div className="bg-gradient-to-br from-slate-900 via-slate-850 to-slate-900 text-white rounded-3xl p-6 sm:p-8 shadow-xl mb-10 border border-slate-800">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6 pb-6 border-b border-slate-800">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <span className="text-xs uppercase tracking-wider font-bold text-teal-400 bg-teal-400/10 px-3 py-1 rounded-full border border-teal-400/20">
                {hasPaidAccess ? 'Commercial ERP License' : isTrialActive ? '30-Day Evaluation Trial' : 'Trial Expired'}
              </span>
              {subscription?.cancelAtPeriodEnd && (
                <span className="text-xs font-semibold bg-rose-500/20 text-rose-300 px-2.5 py-0.5 rounded-full border border-rose-500/30">
                  Cancels at period end
                </span>
              )}
            </div>
            <h2 className="text-3xl font-black text-white tracking-tight">
              {activePlan.name}
            </h2>
            <p className="text-sm text-slate-300 mt-1 max-w-xl">
              {activePlan.tagline}
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <button
              onClick={() => handleUpgrade('professional', 'annual')}
              className="px-5 py-2.5 bg-teal-500 hover:bg-teal-400 text-slate-950 font-bold text-sm rounded-xl transition-all shadow-md flex items-center gap-1.5"
            >
              <Sparkles className="w-4 h-4 fill-current" />
              {hasPaidAccess ? 'Upgrade / Change Plan' : 'Subscribe Now'}
            </button>
            <button
              onClick={() => refreshSubscription()}
              className="p-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl transition-colors border border-slate-700"
              title="Refresh status"
            >
              <RefreshCw className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Detailed Metrics Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-6 pt-6">
          <div className="bg-slate-800/60 rounded-2xl p-4 border border-slate-700/60">
            <p className="text-xs font-medium text-slate-400 flex items-center gap-1.5 mb-1">
              <Clock className="w-4 h-4 text-teal-400" /> License Status
            </p>
            <p className="text-lg font-bold text-white capitalize">
              {subscription?.status.replace('_', ' ') || 'Evaluation'}
            </p>
            <p className="text-xs text-slate-400 mt-1">
              {hasPaidAccess
                ? 'All ERP modules active'
                : `${remainingDays} days remaining`}
            </p>
          </div>

          <div className="bg-slate-800/60 rounded-2xl p-4 border border-slate-700/60">
            <p className="text-xs font-medium text-slate-400 flex items-center gap-1.5 mb-1">
              <Calendar className="w-4 h-4 text-teal-400" /> Current Period Expiry
            </p>
            <p className="text-lg font-bold text-white">
              {subscription?.currentPeriodEnd
                ? new Date(subscription.currentPeriodEnd).toLocaleDateString('en-IN', {
                    day: 'numeric',
                    month: 'short',
                    year: 'numeric'
                  })
                : '30 Days from registration'}
            </p>
            <p className="text-xs text-slate-400 mt-1">
              {hasPaidAccess ? 'Auto-renews unless cancelled' : 'Trial ends without auto-charge'}
            </p>
          </div>

          <div className="bg-slate-800/60 rounded-2xl p-4 border border-slate-700/60">
            <p className="text-xs font-medium text-slate-400 flex items-center gap-1.5 mb-1">
              <CreditCard className="w-4 h-4 text-teal-400" /> Billed Frequency
            </p>
            <p className="text-lg font-bold text-white capitalize">
              {subscription?.billingFrequency || 'Annual (Save 20%)'}
            </p>
            <p className="text-xs text-teal-300 mt-1">
              {hasPaidAccess ? `Paid ₹${subscription?.amountPaid?.toLocaleString('en-IN')}` : 'No credit card required for trial'}
            </p>
          </div>

          <div className="bg-slate-800/60 rounded-2xl p-4 border border-slate-700/60">
            <p className="text-xs font-medium text-slate-400 flex items-center gap-1.5 mb-1">
              <Building2 className="w-4 h-4 text-teal-400" /> Licensed Clinic
            </p>
            <p className="text-lg font-bold text-white truncate">
              {subscription?.clinicName || user?.fullName || 'ClinicPulse Facility'}
            </p>
            <p className="text-xs text-slate-400 mt-1 truncate">
              {user?.primaryEmailAddress?.emailAddress}
            </p>
          </div>
        </div>
      </div>

      {/* Available Plans Section */}
      <div className="mb-12">
        <div className="mb-6">
          <h2 className="text-xl font-bold text-slate-900">Available Subscription Tiers</h2>
          <p className="text-xs sm:text-sm text-slate-500">
            Upgrade or switch between plans at any time with prorated adjustments.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {plans.map((p) => {
            const isCurrent = subscription?.planId === p.id && hasPaidAccess;
            return (
              <div
                key={p.id}
                className={`rounded-2xl p-6 border transition-all ${
                  isCurrent
                    ? 'border-teal-500 bg-teal-50/30 ring-2 ring-teal-500/20'
                    : 'border-slate-200 bg-white hover:border-slate-300 shadow-sm'
                }`}
              >
                <div className="flex items-center justify-between mb-2">
                  <h3 className="font-bold text-slate-900">{p.name}</h3>
                  {isCurrent && (
                    <span className="text-[10px] font-bold uppercase bg-teal-600 text-white px-2 py-0.5 rounded-full">
                      Current Plan
                    </span>
                  )}
                </div>
                <p className="text-xs text-slate-500 min-h-[36px] mb-4">{p.tagline}</p>

                <div className="mb-4 pb-4 border-b border-slate-100">
                  <span className="text-2xl font-black text-slate-900">
                    ₹{p.prices.monthly.toLocaleString('en-IN')}
                  </span>
                  <span className="text-xs text-slate-500"> / month</span>
                  <p className="text-[11px] text-teal-600 font-semibold mt-1">
                    Annual: ₹{p.prices.annual.toLocaleString('en-IN')} (2 Months Free)
                  </p>
                </div>

                <ul className="space-y-2 mb-6 text-xs text-slate-600">
                  {p.features.slice(0, 5).map((f, i) => (
                    <li key={i} className="flex items-start gap-2">
                      <CheckCircle2 className="w-3.5 h-3.5 text-teal-600 shrink-0 mt-0.5" />
                      <span>{f}</span>
                    </li>
                  ))}
                </ul>

                <button
                  disabled={isCurrent}
                  onClick={() => handleUpgrade(p.id, 'annual')}
                  className={`w-full py-2.5 rounded-xl text-xs font-bold transition-all ${
                    isCurrent
                      ? 'bg-slate-100 text-slate-400 cursor-default'
                      : 'bg-slate-900 hover:bg-slate-800 text-white shadow-sm'
                  }`}
                >
                  {isCurrent ? 'Current Plan' : `Switch to ${p.name.split(' ')[0]}`}
                </button>
              </div>
            );
          })}
        </div>
      </div>

      {/* Payment History & Invoices */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm mb-10">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-lg font-bold text-slate-900">Payment History & Tax Invoices</h3>
            <p className="text-xs text-slate-500">Official GST-compliant tax invoices for your accounts department.</p>
          </div>
          <span className="text-xs text-slate-400 flex items-center gap-1">
            <ShieldCheck className="w-4 h-4 text-teal-600" /> 100% Tax Compliant
          </span>
        </div>

        {subscription?.razorpayPaymentId ? (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-500 font-semibold uppercase border-b border-slate-100">
                <tr>
                  <th className="py-3 px-4">Invoice / Payment ID</th>
                  <th className="py-3 px-4">Date</th>
                  <th className="py-3 px-4">Plan & Billing</th>
                  <th className="py-3 px-4">Amount</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4 text-right">Receipt</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700">
                <tr>
                  <td className="py-3.5 px-4 font-mono font-medium">
                    {subscription.razorpayPaymentId}
                  </td>
                  <td className="py-3.5 px-4">
                    {subscription.lastPaymentDate
                      ? new Date(subscription.lastPaymentDate).toLocaleDateString('en-IN')
                      : 'Recent'}
                  </td>
                  <td className="py-3.5 px-4 capitalize">
                    {activePlan.name} ({subscription.billingFrequency})
                  </td>
                  <td className="py-3.5 px-4 font-bold text-slate-900">
                    ₹{subscription.amountPaid.toLocaleString('en-IN')}
                  </td>
                  <td className="py-3.5 px-4">
                    <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                      Paid & Verified
                    </span>
                  </td>
                  <td className="py-3.5 px-4 text-right">
                    <button
                      onClick={() => alert(`Official GST Receipt for Payment ${subscription.razorpayPaymentId}\nClinic: ${subscription.clinicName}\nAmount Paid: ₹${subscription.amountPaid}\nStatus: Confirmed`)}
                      className="inline-flex items-center gap-1 text-teal-600 hover:text-teal-800 font-bold"
                    >
                      <Download className="w-3.5 h-3.5" /> View Receipt
                    </button>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        ) : (
          <div className="py-8 text-center text-slate-400 bg-slate-50/60 rounded-xl border border-dashed border-slate-200">
            <FileText className="w-8 h-8 mx-auto text-slate-300 mb-2" />
            <p className="text-xs font-medium">No paid invoices yet.</p>
            <p className="text-[11px] text-slate-400 mt-0.5">
              Your free trial does not generate any recurring charges. Paid invoices will appear here.
            </p>
          </div>
        )}
      </div>

      {/* Cancellation / Account Settings section */}
      {hasPaidAccess && !subscription?.cancelAtPeriodEnd && (
        <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <p className="text-xs font-bold text-slate-800">Need to cancel your subscription?</p>
            <p className="text-[11px] text-slate-500">
              You can cancel renewal at any time. Your access will continue until the end of your prepaid period.
            </p>
          </div>
          <button
            onClick={handleCancel}
            disabled={isCancelling}
            className="px-4 py-2 text-xs font-semibold text-rose-600 hover:bg-rose-50 border border-rose-200 rounded-lg transition-colors whitespace-nowrap"
          >
            {isCancelling ? 'Processing...' : 'Cancel Auto-Renewal'}
          </button>
        </div>
      )}
    </div>
  );
};
