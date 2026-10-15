import React from 'react';
import { 
  TrendingUp, 
  ArrowUpRight, 
  ArrowDownRight, 
  ShieldCheck, 
  Building2, 
  CreditCard, 
  QrCode, 
  Smartphone, 
  RefreshCw, 
  AlertCircle, 
  Clock, 
  CheckCircle2, 
  XCircle, 
  RotateCcw,
  Sparkles,
  Landmark,
  Wallet,
  ArrowRight
} from 'lucide-react';
import { 
  AreaChart, 
  Area, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer, 
  PieChart, 
  Pie, 
  Cell 
} from 'recharts';
import { usePayment } from '../../context/PaymentContext';
import { useAppState } from '../../context/AppStateContext';

interface PaymentDashboardProps {
  onNavigateToTab: (tab: 'transactions' | 'checkout' | 'settings' | 'reports' | 'sandbox') => void;
}

const METHOD_COLORS = {
  upi_intent: '#00A896', // Teal
  upi_qr: '#0F4C81',     // Navy
  card: '#6366F1',       // Indigo
  netbanking: '#F59E0B', // Amber
  wallet: '#EC4899',     // Pink
  cash: '#64748B'        // Slate
};

export const PaymentDashboard: React.FC<PaymentDashboardProps> = ({ onNavigateToTab }) => {
  const { filteredTransactions, activeConfig, metrics } = usePayment();
  const { orgType } = useAppState();

  // Prepare trend data for last 7 days
  const chartData = React.useMemo(() => {
    const days: { [dateStr: string]: { date: string; volume: number; count: number } } = {};
    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const str = d.toISOString().split('T')[0];
      const display = d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
      days[str] = { date: display, volume: 0, count: 0 };
    }

    filteredTransactions.forEach(t => {
      const dateKey = t.createdAt.split('T')[0];
      if (days[dateKey] && t.status === 'success') {
        days[dateKey].volume += t.amount;
        days[dateKey].count += 1;
      }
    });

    return Object.values(days);
  }, [filteredTransactions]);

  // Payment method distribution
  const methodData = React.useMemo(() => {
    const counts: { [key: string]: number } = {
      'UPI Apps': 0,
      'UPI Dynamic QR': 0,
      'Debit/Credit Cards': 0,
      'Net Banking': 0
    };

    filteredTransactions.filter(t => t.status === 'success').forEach(t => {
      if (t.paymentMethod === 'upi_intent') counts['UPI Apps'] += t.amount;
      else if (t.paymentMethod === 'upi_qr') counts['UPI Dynamic QR'] += t.amount;
      else if (t.paymentMethod === 'card') counts['Debit/Credit Cards'] += t.amount;
      else counts['Net Banking'] += t.amount;
    });

    return [
      { name: 'UPI Apps', value: counts['UPI Apps'], color: '#00A896' },
      { name: 'UPI Dynamic QR', value: counts['UPI Dynamic QR'], color: '#0F4C81' },
      { name: 'Cards', value: counts['Debit/Credit Cards'], color: '#6366F1' },
      { name: 'Net Banking', value: counts['Net Banking'], color: '#F59E0B' }
    ].filter(item => item.value > 0);
  }, [filteredTransactions]);

  const recentTransactions = filteredTransactions.slice(0, 5);

  return (
    <div className="space-y-6">
      {/* Active Gateway & Bank Settlement Banner */}
      <div className="bg-gradient-to-r from-navy-900 via-navy-800 to-slate-900 rounded-2xl p-5 text-white shadow-md border border-slate-800 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-start sm:items-center gap-3.5">
          <div className="w-12 h-12 rounded-xl bg-teal-500/20 border border-teal-500/30 flex items-center justify-center shrink-0">
            <Landmark className="w-6 h-6 text-teal-300" />
          </div>
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <h2 className="text-lg font-bold text-white tracking-tight">
                {activeConfig.organizationName}
              </h2>
              <span className={`text-[11px] font-semibold px-2 py-0.5 rounded-full border ${
                activeConfig.environmentMode === 'production' 
                  ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30' 
                  : 'bg-amber-500/20 text-amber-300 border-amber-500/30'
              }`}>
                {activeConfig.environmentMode === 'production' ? '● LIVE MODE' : '⚡ SANDBOX TEST MODE'}
              </span>
              <span className="text-[11px] font-medium bg-slate-800 text-slate-300 px-2 py-0.5 rounded-md border border-slate-700">
                Gateway: {activeConfig.gatewayProvider.toUpperCase()}
              </span>
            </div>
            <p className="text-xs text-slate-300 mt-1 flex flex-wrap items-center gap-2">
              <span>Settlement Account:</span>
              <strong className="text-white font-semibold">
                {activeConfig.bankAccount.bankName} (A/C •••• {activeConfig.bankAccount.accountNumber.slice(-4)})
              </strong>
              <span>• IFSC: <span className="font-mono text-teal-300">{activeConfig.bankAccount.ifscCode}</span></span>
              <span>• Cycle: <span className="text-emerald-400 font-semibold">{activeConfig.settlementCycle} Daily Auto-Credit</span></span>
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 self-start md:self-auto shrink-0">
          <button
            onClick={() => onNavigateToTab('checkout')}
            className="bg-teal-500 hover:bg-teal-600 text-white px-3.5 py-2 rounded-xl text-xs font-semibold transition-all shadow-sm flex items-center gap-1.5"
          >
            <QrCode className="w-4 h-4" />
            <span>Open UPI QR & Checkout</span>
          </button>
          <button
            onClick={() => onNavigateToTab('settings')}
            className="bg-white/10 hover:bg-white/20 text-slate-200 border border-white/20 px-3.5 py-2 rounded-xl text-xs font-semibold transition-all"
          >
            Manage Bank Details
          </button>
        </div>
      </div>

      {/* KPI Metrics Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Collections */}
        <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-sm relative overflow-hidden group hover:border-teal-300 transition-all">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Total Gross Collections</span>
            <div className="p-2 rounded-xl bg-teal-50 text-teal-700">
              <TrendingUp className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-2xl font-extrabold text-navy-900 tracking-tight">
              ₹{metrics.totalCollections.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </div>
            <div className="flex items-center gap-1 text-xs text-slate-500 mt-1">
              <span className="text-emerald-600 font-semibold flex items-center">
                <ArrowUpRight className="w-3.5 h-3.5" /> 100%
              </span>
              <span>Direct Bank Settlement</span>
            </div>
          </div>
        </div>

        {/* Today's Collections */}
        <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-sm relative overflow-hidden group hover:border-teal-300 transition-all">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Today's Inflow</span>
            <div className="p-2 rounded-xl bg-emerald-50 text-emerald-700">
              <Smartphone className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-2xl font-extrabold text-navy-900 tracking-tight">
              ₹{metrics.todayCollections.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </div>
            <div className="flex items-center gap-1 text-xs text-slate-500 mt-1">
              <span>UPI & Gateway confirmed</span>
            </div>
          </div>
        </div>

        {/* Net Settled into Bank */}
        <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-sm relative overflow-hidden group hover:border-teal-300 transition-all">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Net Bank Payout (Settled)</span>
            <div className="p-2 rounded-xl bg-blue-50 text-blue-700">
              <Landmark className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-2xl font-extrabold text-blue-900 tracking-tight">
              ₹{metrics.netSettledToBank.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </div>
            <div className="flex items-center gap-1 text-xs text-slate-500 mt-1">
              <span>Credited to {activeConfig.bankAccount.bankName}</span>
            </div>
          </div>
        </div>

        {/* Gateway Deductions (2% + GST) */}
        <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-sm relative overflow-hidden group hover:border-teal-300 transition-all">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Gateway Charges & GST</span>
            <div className="p-2 rounded-xl bg-slate-100 text-slate-700">
              <CreditCard className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-2xl font-extrabold text-slate-700 tracking-tight">
              ₹{metrics.totalGatewayFees.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </div>
            <div className="flex items-center gap-1 text-xs text-slate-500 mt-1">
              <span>Fee ~{activeConfig.gatewayFeePercent}% + 18% GST</span>
            </div>
          </div>
        </div>
      </div>

      {/* Secondary Quick Metrics Row */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="bg-amber-50/60 border border-amber-200/60 rounded-xl p-3 flex items-center gap-3">
          <Clock className="w-4 h-4 text-amber-600 shrink-0" />
          <div>
            <div className="text-xs text-amber-700 font-medium">Pending Settlement</div>
            <div className="text-sm font-bold text-amber-900">₹{metrics.pendingSettlement.toFixed(2)}</div>
          </div>
        </div>
        <div className="bg-purple-50/60 border border-purple-200/60 rounded-xl p-3 flex items-center gap-3">
          <RotateCcw className="w-4 h-4 text-purple-600 shrink-0" />
          <div>
            <div className="text-xs text-purple-700 font-medium">Refunds Processed</div>
            <div className="text-sm font-bold text-purple-900">₹{metrics.refundedAmount.toFixed(2)} ({metrics.refundedCount})</div>
          </div>
        </div>
        <div className="bg-rose-50/60 border border-rose-200/60 rounded-xl p-3 flex items-center gap-3">
          <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
          <div>
            <div className="text-xs text-rose-700 font-medium">Failed Transactions</div>
            <div className="text-sm font-bold text-rose-900">{metrics.failedCount} (₹{metrics.failedAmount.toFixed(2)})</div>
          </div>
        </div>
        <div className="bg-emerald-50/60 border border-emerald-200/60 rounded-xl p-3 flex items-center gap-3">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          <div>
            <div className="text-xs text-emerald-700 font-medium">Success Rate</div>
            <div className="text-sm font-bold text-emerald-900">
              {filteredTransactions.length > 0 
                ? `${((filteredTransactions.filter(t => t.status === 'success').length / filteredTransactions.length) * 100).toFixed(1)}%`
                : '100%'}
            </div>
          </div>
        </div>
      </div>

      {/* Visual Analytics Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* 7-Day Collection Trend */}
        <div className="lg:col-span-2 bg-white rounded-2xl p-5 border border-slate-200/80 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="font-bold text-navy-900 text-sm">7-Day Payment Collection Volume</h3>
              <p className="text-xs text-slate-500">Daily gross inflow through UPI & payment gateway</p>
            </div>
            <span className="text-xs font-semibold px-2.5 py-1 rounded-lg bg-teal-50 text-teal-700 border border-teal-200">
              Auto-Reconciled
            </span>
          </div>

          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                <defs>
                  <linearGradient id="paymentColor" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#00A896" stopOpacity={0.4} />
                    <stop offset="95%" stopColor="#00A896" stopOpacity={0.0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
                <XAxis dataKey="date" tick={{ fontSize: 11, fill: '#64748B' }} stroke="#CBD5E1" />
                <YAxis tick={{ fontSize: 11, fill: '#64748B' }} stroke="#CBD5E1" tickFormatter={(val) => `₹${val}`} />
                <Tooltip 
                  formatter={(value: any) => [`₹${Number(value).toFixed(2)}`, 'Volume']}
                  contentStyle={{ backgroundColor: '#0F172A', borderRadius: '8px', color: '#fff', fontSize: '12px' }}
                />
                <Area type="monotone" dataKey="volume" stroke="#00A896" strokeWidth={2.5} fillOpacity={1} fill="url(#paymentColor)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Payment Methods Breakdown */}
        <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-sm flex flex-col justify-between">
          <div>
            <h3 className="font-bold text-navy-900 text-sm">Payment Methods Split</h3>
            <p className="text-xs text-slate-500 mb-4">Distribution by customer payment instrument</p>

            {methodData.length > 0 ? (
              <div className="h-44 w-full flex items-center justify-center">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={methodData}
                      dataKey="value"
                      nameKey="name"
                      cx="50%"
                      cy="50%"
                      innerRadius={45}
                      outerRadius={70}
                      paddingAngle={3}
                    >
                      {methodData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(value: any) => [`₹${Number(value).toFixed(2)}`, 'Amount']} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <div className="h-44 flex items-center justify-center text-xs text-slate-400">
                No successful transactions yet
              </div>
            )}
          </div>

          <div className="space-y-1.5 mt-2 border-t border-slate-100 pt-3">
            {methodData.map((m, idx) => (
              <div key={idx} className="flex items-center justify-between text-xs">
                <div className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: m.color }} />
                  <span className="text-slate-600">{m.name}</span>
                </div>
                <span className="font-semibold text-navy-900">₹{m.value.toFixed(2)}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Recent Live Transactions */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden">
        <div className="p-4 sm:p-5 border-b border-slate-100 flex items-center justify-between">
          <div>
            <h3 className="font-bold text-navy-900 text-sm">Recent Verified Transactions</h3>
            <p className="text-xs text-slate-500">Live payment gateway status and bank settlement records</p>
          </div>
          <button
            onClick={() => onNavigateToTab('transactions')}
            className="text-teal-600 hover:text-teal-700 text-xs font-semibold flex items-center gap-1 transition-colors"
          >
            <span>View Full Ledger</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-500 border-b border-slate-100">
              <tr>
                <th className="px-4 py-3 font-semibold">Txn ID / Gateway Ref</th>
                <th className="px-4 py-3 font-semibold">Bill #</th>
                <th className="px-4 py-3 font-semibold">Patient</th>
                <th className="px-4 py-3 font-semibold">Method</th>
                <th className="px-4 py-3 font-semibold text-right">Gross Amount</th>
                <th className="px-4 py-3 font-semibold text-right">Net Settled</th>
                <th className="px-4 py-3 font-semibold text-center">Status</th>
                <th className="px-4 py-3 font-semibold">Settlement</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {recentTransactions.map((t) => (
                <tr key={t.id} className="hover:bg-slate-50/60 transition-colors">
                  <td className="px-4 py-3">
                    <div className="font-mono font-medium text-slate-800">{t.id}</div>
                    <div className="text-[10px] text-slate-400 font-mono">{t.gatewayPaymentId}</div>
                  </td>
                  <td className="px-4 py-3">
                    <span className="font-semibold text-navy-900">{t.invoiceId}</span>
                    <span className="block text-[10px] text-slate-500 capitalize">{t.billCategory}</span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="font-medium text-slate-800">{t.patientName}</div>
                    <div className="text-[10px] text-slate-400">{t.patientPhone}</div>
                  </td>
                  <td className="px-4 py-3">
                    <div className="inline-flex items-center gap-1 text-slate-700 font-medium">
                      {t.paymentMethod === 'upi_intent' || t.paymentMethod === 'upi_qr' ? (
                        <>
                          <Smartphone className="w-3.5 h-3.5 text-teal-600" />
                          <span>{t.paymentMethodDetails?.upiApp || 'UPI'}</span>
                        </>
                      ) : t.paymentMethod === 'card' ? (
                        <>
                          <CreditCard className="w-3.5 h-3.5 text-indigo-600" />
                          <span>Card ({t.paymentMethodDetails?.cardLast4 || '••••'})</span>
                        </>
                      ) : (
                        <>
                          <Landmark className="w-3.5 h-3.5 text-amber-600" />
                          <span>Net Banking</span>
                        </>
                      )}
                    </div>
                  </td>
                  <td className="px-4 py-3 text-right font-bold text-navy-900">
                    ₹{t.amount.toFixed(2)}
                  </td>
                  <td className="px-4 py-3 text-right font-semibold text-teal-700">
                    ₹{t.netSettlementAmount.toFixed(2)}
                  </td>
                  <td className="px-4 py-3 text-center">
                    <span className={`inline-block px-2 py-0.5 rounded-full text-[10px] font-bold ${
                      t.status === 'success' ? 'bg-emerald-100 text-emerald-800' :
                      t.status === 'pending' ? 'bg-amber-100 text-amber-800' :
                      t.status === 'refunded' ? 'bg-purple-100 text-purple-800' :
                      'bg-rose-100 text-rose-800'
                    }`}>
                      {t.status.toUpperCase()}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="text-slate-700 font-medium">
                      {t.settlementStatus === 'settled' ? (
                        <span className="text-emerald-700 font-semibold flex items-center gap-1">
                          <CheckCircle2 className="w-3 h-3" /> Settled
                        </span>
                      ) : t.settlementStatus === 'processing' ? (
                        <span className="text-amber-700 flex items-center gap-1">
                          <Clock className="w-3 h-3" /> In Process (T+1)
                        </span>
                      ) : t.settlementStatus === 'refunded' ? (
                        <span className="text-purple-700 font-semibold">Refunded</span>
                      ) : (
                        <span className="text-slate-400">Unsettled</span>
                      )}
                    </div>
                    {t.settlementUtr && (
                      <div className="text-[10px] font-mono text-slate-400">UTR: {t.settlementUtr}</div>
                    )}
                  </td>
                </tr>
              ))}

              {recentTransactions.length === 0 && (
                <tr>
                  <td colSpan={8} className="px-4 py-8 text-center text-slate-400">
                    No transactions recorded for this organization yet.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
