import React, { useState, useEffect, useMemo } from 'react';
import { 
  Users, 
  ShieldCheck, 
  Calendar, 
  Clock, 
  Search, 
  Filter, 
  Sparkles, 
  AlertCircle, 
  CheckCircle2, 
  PlusCircle, 
  History, 
  DollarSign,
  ArrowUpRight,
  RefreshCw,
  X,
  CreditCard
} from 'lucide-react';
import { useUser } from '@clerk/react';
import { UserSubscription, SubscriptionStatus } from '../../types/subscription';
import { 
  getAllSubscriptionsFromCache, 
  extendTrialByAdmin, 
  calculateRemainingDays,
  syncSubscriptionToSupabase
} from '../../lib/subscriptionService';
import { supabase } from '../../lib/supabase';

export const AdminSubscriptionManager: React.FC = () => {
  const { user } = useUser();
  const [subscriptions, setSubscriptions] = useState<UserSubscription[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  
  // Extension Modal State
  const [selectedSubForExtension, setSelectedSubForExtension] = useState<UserSubscription | null>(null);
  const [extensionDays, setExtensionDays] = useState<number>(14);
  const [extensionReason, setExtensionReason] = useState<string>('');
  const [isExtending, setIsExtending] = useState<boolean>(false);
  const [extensionSuccessMsg, setExtensionSuccessMsg] = useState<string | null>(null);

  // Audit Log Inspector State
  const [selectedSubForAudit, setSelectedSubForAudit] = useState<UserSubscription | null>(null);

  const adminEmail = user?.primaryEmailAddress?.emailAddress || 'lokesheie29@gmail.com';

  const loadSubscriptions = async () => {
    setLoading(true);
    try {
      // 1. Try fetching from Supabase
      if (supabase) {
        const { data, error } = await supabase
          .from('subscriptions')
          .select('*')
          .order('created_at', { ascending: false });

        if (!error && data && data.length > 0) {
          const mapped: UserSubscription[] = data.map((d: any) => ({
            id: d.id,
            userId: d.user_id,
            userEmail: d.user_email,
            userName: d.user_name || 'Practitioner',
            clinicName: d.clinic_name || 'ClinicPulse Center',
            orgType: d.org_type || 'hospital',
            status: d.status,
            planId: d.plan_id,
            billingFrequency: d.billing_frequency,
            trialStartDate: d.trial_start_date,
            trialExpiryDate: d.trial_expiry_date,
            trialDurationDays: d.trial_duration_days || 30,
            trialExtendedByAdmin: d.trial_extended_by_admin,
            trialExtensionDays: d.trial_extension_days,
            trialExtendedAt: d.trial_extended_at,
            trialExtendedBy: d.trial_extended_by,
            trialExtensionReason: d.trial_extension_reason,
            currentPeriodStart: d.current_period_start,
            currentPeriodEnd: d.current_period_end,
            amountPaid: Number(d.amount_paid || 0),
            currency: d.currency || 'INR',
            paymentStatus: d.payment_status || 'pending',
            razorpayPaymentId: d.razorpay_payment_id,
            razorpayOrderId: d.razorpay_order_id,
            history: d.history || [],
            createdAt: d.created_at,
            updatedAt: d.updated_at
          }));
          setSubscriptions(mapped);
          setLoading(false);
          return;
        }
      }

      // 2. Fallback to LocalStorage cache
      const cached = getAllSubscriptionsFromCache();
      setSubscriptions(cached);
    } catch (err) {
      console.error('Failed to load subscriptions for admin:', err);
      setSubscriptions(getAllSubscriptionsFromCache());
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadSubscriptions();
  }, []);

  // Filtered List
  const filteredSubscriptions = useMemo(() => {
    return subscriptions.filter(sub => {
      const matchSearch =
        sub.userEmail.toLowerCase().includes(searchQuery.toLowerCase()) ||
        sub.userName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        sub.clinicName.toLowerCase().includes(searchQuery.toLowerCase());

      const matchStatus = statusFilter === 'all' || sub.status === statusFilter;

      return matchSearch && matchStatus;
    });
  }, [subscriptions, searchQuery, statusFilter]);

  // Aggregate Stats
  const stats = useMemo(() => {
    const total = subscriptions.length;
    const trialing = subscriptions.filter(s => s.status === 'trialing').length;
    const activePaid = subscriptions.filter(s => s.status === 'active').length;
    const expired = subscriptions.filter(s => s.status === 'trial_expired').length;
    const totalRevenue = subscriptions
      .filter(s => s.status === 'active')
      .reduce((acc, curr) => acc + (curr.amountPaid || 0), 0);

    return { total, trialing, activePaid, expired, totalRevenue };
  }, [subscriptions]);

  // Handle Extension
  const handleConfirmExtension = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedSubForExtension) return;
    if (!extensionReason.trim()) {
      alert('Please enter a mandatory audit reason for extending this trial.');
      return;
    }

    setIsExtending(true);
    try {
      const updated = extendTrialByAdmin(
        selectedSubForExtension,
        Number(extensionDays),
        adminEmail,
        extensionReason.trim()
      );

      // Update state
      setSubscriptions(prev =>
        prev.map(s => (s.userId === updated.userId ? updated : s))
      );

      setExtensionSuccessMsg(
        `Successfully added ${extensionDays} days to ${updated.userEmail}. New expiry: ${new Date(updated.trialExpiryDate).toLocaleDateString('en-IN')}`
      );
      setTimeout(() => {
        setSelectedSubForExtension(null);
        setExtensionSuccessMsg(null);
        setExtensionReason('');
      }, 2000);
    } catch (err: any) {
      alert(err.message || 'Error extending trial.');
    } finally {
      setIsExtending(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Overview Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between text-slate-500 mb-1">
            <span className="text-xs font-semibold">Total Accounts</span>
            <Users className="w-4 h-4 text-slate-400" />
          </div>
          <p className="text-2xl font-black text-slate-900">{stats.total}</p>
          <p className="text-[11px] text-slate-400 mt-0.5">Registered clinic tenants</p>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between text-teal-600 mb-1">
            <span className="text-xs font-semibold">Active Trials (30-Day)</span>
            <Clock className="w-4 h-4" />
          </div>
          <p className="text-2xl font-black text-teal-700">{stats.trialing}</p>
          <p className="text-[11px] text-slate-400 mt-0.5">Currently in evaluation</p>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between text-emerald-600 mb-1">
            <span className="text-xs font-semibold">Paid Commercial ERP</span>
            <Sparkles className="w-4 h-4" />
          </div>
          <p className="text-2xl font-black text-emerald-700">{stats.activePaid}</p>
          <p className="text-[11px] text-emerald-600 mt-0.5">Active paying clinics</p>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between text-rose-500 mb-1">
            <span className="text-xs font-semibold">Expired Trials</span>
            <AlertCircle className="w-4 h-4" />
          </div>
          <p className="text-2xl font-black text-rose-600">{stats.expired}</p>
          <p className="text-[11px] text-slate-400 mt-0.5">Locked; awaiting renewal</p>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between text-indigo-600 mb-1">
            <span className="text-xs font-semibold">Paid Subscriptions</span>
            <DollarSign className="w-4 h-4" />
          </div>
          <p className="text-2xl font-black text-indigo-700">₹{stats.totalRevenue.toLocaleString('en-IN')}</p>
          <p className="text-[11px] text-indigo-600 mt-0.5">Total processed volume</p>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
          <input
            type="text"
            placeholder="Search email, doctor, or clinic..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-4 py-2 text-xs border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500"
          />
        </div>

        <div className="flex items-center gap-3 w-full sm:w-auto justify-end">
          <div className="flex items-center gap-1.5 text-xs text-slate-600">
            <Filter className="w-3.5 h-3.5 text-slate-400" />
            <span>Status:</span>
          </div>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="text-xs border border-slate-200 rounded-xl px-3 py-2 bg-slate-50 focus:outline-none focus:ring-2 focus:ring-teal-500 font-medium"
          >
            <option value="all">All Statuses ({subscriptions.length})</option>
            <option value="trialing">Active Trialing</option>
            <option value="active">Active Paid</option>
            <option value="trial_expired">Trial Expired</option>
            <option value="cancelled">Cancelled</option>
          </select>

          <button
            onClick={loadSubscriptions}
            className="p-2 border border-slate-200 rounded-xl hover:bg-slate-50 text-slate-500"
            title="Refresh list"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* Users Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
          <h3 className="font-bold text-slate-900 text-sm">
            Registered Clinics & Trial Allocations ({filteredSubscriptions.length})
          </h3>
          <span className="text-[11px] text-slate-400">
            Audit logging enforced on every manual extension
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-500 font-semibold uppercase border-b border-slate-100">
              <tr>
                <th className="py-3 px-4">Clinic & User</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4">Plan</th>
                <th className="py-3 px-4">Trial Start</th>
                <th className="py-3 px-4">Trial Expiry</th>
                <th className="py-3 px-4">Remaining</th>
                <th className="py-3 px-4">Payment Info</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              {filteredSubscriptions.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-8 text-center text-slate-400">
                    No subscriptions match your current filter.
                  </td>
                </tr>
              ) : (
                filteredSubscriptions.map((sub) => {
                  const remaining = calculateRemainingDays(sub.trialExpiryDate);
                  return (
                    <tr key={sub.userId} className="hover:bg-slate-50/60 transition-colors">
                      <td className="py-3.5 px-4">
                        <p className="font-bold text-slate-900">{sub.clinicName}</p>
                        <p className="text-[11px] text-slate-500">{sub.userName}</p>
                        <p className="text-[10px] text-teal-600 font-mono">{sub.userEmail}</p>
                      </td>
                      <td className="py-3.5 px-4">
                        {sub.status === 'active' ? (
                          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                            Active Paid
                          </span>
                        ) : sub.status === 'trialing' ? (
                          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-teal-50 text-teal-700 border border-teal-200">
                            30-Day Trial
                          </span>
                        ) : sub.status === 'trial_expired' ? (
                          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-50 text-rose-700 border border-rose-200">
                            Trial Expired
                          </span>
                        ) : (
                          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 text-slate-700">
                            {sub.status}
                          </span>
                        )}
                        {sub.trialExtendedByAdmin && (
                          <span className="block mt-1 text-[9px] font-bold text-amber-600">
                            Ext +{sub.trialExtensionDays}d
                          </span>
                        )}
                      </td>
                      <td className="py-3.5 px-4 capitalize font-medium">
                        {sub.planId} ({sub.billingFrequency})
                      </td>
                      <td className="py-3.5 px-4 text-slate-500">
                        {new Date(sub.trialStartDate).toLocaleDateString('en-IN', {
                          day: '2-digit',
                          month: 'short',
                          year: 'numeric'
                        })}
                      </td>
                      <td className="py-3.5 px-4 text-slate-500">
                        {new Date(sub.trialExpiryDate).toLocaleDateString('en-IN', {
                          day: '2-digit',
                          month: 'short',
                          year: 'numeric'
                        })}
                      </td>
                      <td className="py-3.5 px-4">
                        {sub.status === 'active' ? (
                          <span className="text-emerald-600 font-bold">Prepaid</span>
                        ) : remaining > 0 ? (
                          <span className={`font-bold ${remaining <= 3 ? 'text-rose-600' : 'text-teal-700'}`}>
                            {remaining} days
                          </span>
                        ) : (
                          <span className="text-rose-600 font-bold">0 days (Locked)</span>
                        )}
                      </td>
                      <td className="py-3.5 px-4">
                        {sub.razorpayPaymentId ? (
                          <div>
                            <p className="font-mono text-[10px] text-slate-800">{sub.razorpayPaymentId}</p>
                            <p className="text-[10px] text-emerald-600 font-bold">₹{sub.amountPaid}</p>
                          </div>
                        ) : (
                          <span className="text-slate-400 text-[11px]">No payment yet</span>
                        )}
                      </td>
                      <td className="py-3.5 px-4 text-right space-x-2">
                        <button
                          onClick={() => setSelectedSubForExtension(sub)}
                          className="px-2.5 py-1 text-[11px] font-bold bg-teal-50 text-teal-700 hover:bg-teal-100 rounded-lg transition-colors border border-teal-200"
                        >
                          Extend Trial
                        </button>
                        <button
                          onClick={() => setSelectedSubForAudit(sub)}
                          className="px-2 py-1 text-[11px] text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-lg transition-colors"
                          title="View Audit History"
                        >
                          <History className="w-3.5 h-3.5 inline" />
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Manual Trial Extension Modal */}
      {selectedSubForExtension && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-200 animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100 mb-4">
              <div className="flex items-center gap-2">
                <div className="p-2 bg-teal-50 text-teal-700 rounded-xl">
                  <Clock className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-slate-900 text-sm">Extend 30-Day Free Trial</h3>
                  <p className="text-[11px] text-slate-500">Authorized Master Admin Action</p>
                </div>
              </div>
              <button
                onClick={() => setSelectedSubForExtension(null)}
                className="p-1 text-slate-400 hover:text-slate-600 rounded-lg"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {extensionSuccessMsg ? (
              <div className="p-4 bg-emerald-50 text-emerald-800 rounded-2xl text-xs flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>{extensionSuccessMsg}</span>
              </div>
            ) : (
              <form onSubmit={handleConfirmExtension} className="space-y-4">
                <div className="bg-slate-50 p-3 rounded-xl text-xs space-y-1">
                  <p><strong>Clinic:</strong> {selectedSubForExtension.clinicName}</p>
                  <p><strong>Doctor / Admin:</strong> {selectedSubForExtension.userName} ({selectedSubForExtension.userEmail})</p>
                  <p><strong>Current Expiry:</strong> {new Date(selectedSubForExtension.trialExpiryDate).toLocaleDateString('en-IN')}</p>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Extension Period (Days)
                  </label>
                  <div className="grid grid-cols-4 gap-2 mb-2">
                    {[7, 14, 30, 45].map(d => (
                      <button
                        type="button"
                        key={d}
                        onClick={() => setExtensionDays(d)}
                        className={`py-1.5 text-xs font-bold rounded-lg border transition-all ${
                          extensionDays === d
                            ? 'bg-teal-600 text-white border-teal-600 shadow-sm'
                            : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
                        }`}
                      >
                        +{d} Days
                      </button>
                    ))}
                  </div>
                  <input
                    type="number"
                    min="1"
                    max="90"
                    value={extensionDays}
                    onChange={(e) => setExtensionDays(Number(e.target.value))}
                    className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Mandatory Audit Reason <span className="text-rose-500">*</span>
                  </label>
                  <textarea
                    required
                    rows={3}
                    placeholder="e.g., Extended courtesy evaluation for multi-branch doctor onboarding demo..."
                    value={extensionReason}
                    onChange={(e) => setExtensionReason(e.target.value)}
                    className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500"
                  />
                  <p className="text-[10px] text-slate-400 mt-1">
                    This reason will be permanently recorded with your email ({adminEmail}) in the immutable audit log.
                  </p>
                </div>

                <div className="flex items-center justify-end gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setSelectedSubForExtension(null)}
                    className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isExtending}
                    className="px-4 py-2 text-xs font-bold text-white bg-teal-600 hover:bg-teal-700 rounded-xl transition-colors shadow-sm"
                  >
                    {isExtending ? 'Recording...' : `Confirm +${extensionDays} Days Extension`}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}

      {/* Audit Log Inspector Drawer/Modal */}
      {selectedSubForAudit && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 max-h-[80vh] flex flex-col">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100 mb-4">
              <div className="flex items-center gap-2">
                <History className="w-5 h-5 text-teal-600" />
                <div>
                  <h3 className="font-bold text-slate-900 text-sm">Subscription Audit Trail</h3>
                  <p className="text-[11px] text-slate-500">{selectedSubForAudit.userEmail}</p>
                </div>
              </div>
              <button
                onClick={() => setSelectedSubForAudit(null)}
                className="p-1 text-slate-400 hover:text-slate-600 rounded-lg"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto space-y-3 pr-1 text-xs">
              {selectedSubForAudit.history && selectedSubForAudit.history.length > 0 ? (
                selectedSubForAudit.history.map((log, idx) => (
                  <div key={idx} className="p-3 bg-slate-50 rounded-xl border border-slate-100 space-y-1">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-slate-800 capitalize">
                        {log.event.replace(/_/g, ' ')}
                      </span>
                      <span className="text-[10px] text-slate-400">
                        {new Date(log.timestamp).toLocaleString('en-IN')}
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-600">
                      <strong>Actor:</strong> {log.actor}
                    </p>
                    {log.details && (
                      <pre className="text-[10px] bg-slate-100 p-2 rounded-lg text-slate-700 overflow-x-auto">
                        {JSON.stringify(log.details, null, 2)}
                      </pre>
                    )}
                  </div>
                ))
              ) : (
                <p className="text-slate-400 text-center py-6">No audit entries recorded yet.</p>
              )}
            </div>

            <div className="pt-4 border-t border-slate-100 text-right">
              <button
                onClick={() => setSelectedSubForAudit(null)}
                className="px-4 py-2 text-xs font-semibold bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl"
              >
                Close Trail
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
