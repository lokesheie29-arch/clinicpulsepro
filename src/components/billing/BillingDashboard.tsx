import React from 'react';
import { 
  Receipt, 
  TrendingUp, 
  DollarSign, 
  CreditCard, 
  Clock, 
  ShieldCheck, 
  AlertCircle, 
  ArrowUpRight, 
  Download, 
  Calendar, 
  FileText, 
  Tag, 
  RotateCcw, 
  Ban,
  CheckCircle2,
  PieChart as PieIcon,
  BarChart2
} from 'lucide-react';
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid, Legend, Cell, PieChart, Pie } from 'recharts';
import { useBilling } from '../../context/BillingContext';
import { formatInr, getCurrentFinancialYear } from '../../lib/gstEngine';
import { DateRangeFilter } from '../../types/billing';

interface BillingDashboardProps {
  onNewInvoice: () => void;
  onViewReports: () => void;
  onViewCreditNotes: () => void;
}

export const BillingDashboard: React.FC<BillingDashboardProps> = ({
  onNewInvoice,
  onViewReports,
  onViewCreditNotes
}) => {
  const { metrics, dateFilter, setDateFilter, invoices } = useBilling();

  const handlePeriodChange = (period: DateRangeFilter['period']) => {
    const today = new Date();
    const todayStr = today.toISOString().split('T')[0];
    const fy = getCurrentFinancialYear();

    if (period === 'today') {
      setDateFilter({ period: 'today', startDate: todayStr, endDate: todayStr, financialYear: fy });
    } else if (period === 'week') {
      const past7 = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
      setDateFilter({ period: 'week', startDate: past7, endDate: todayStr, financialYear: fy });
    } else if (period === 'month') {
      const firstDay = new Date(today.getFullYear(), today.getMonth(), 1).toISOString().split('T')[0];
      setDateFilter({ period: 'month', startDate: firstDay, endDate: todayStr, financialYear: fy });
    } else if (period === 'quarter') {
      const currentMonth = today.getMonth();
      const qStartMonth = Math.floor(currentMonth / 3) * 3;
      const qStartDate = new Date(today.getFullYear(), qStartMonth, 1).toISOString().split('T')[0];
      setDateFilter({ period: 'quarter', startDate: qStartDate, endDate: todayStr, financialYear: fy });
    } else if (period === 'financial_year') {
      const startYear = parseInt(fy.split('-')[0], 10);
      const endYear = parseInt(fy.split('-')[1], 10);
      setDateFilter({
        period: 'financial_year',
        startDate: `${startYear}-04-01`,
        endDate: `${endYear}-03-31`,
        financialYear: fy
      });
    }
  };

  // Prepare chart data for payment modes
  const paymentChartData = [
    { name: 'UPI / QR', value: metrics.paymentMethodTotals.upi, color: '#0D9488' },
    { name: 'Cash', value: metrics.paymentMethodTotals.cash, color: '#10B981' },
    { name: 'Card', value: metrics.paymentMethodTotals.card, color: '#3B82F6' },
    { name: 'Bank Transfer', value: metrics.paymentMethodTotals.bank_transfer, color: '#6366F1' },
    { name: 'Online Gateway', value: metrics.paymentMethodTotals.gateway, color: '#8B5CF6' }
  ].filter(p => p.value > 0);

  // Prepare GST Rate Distribution Data
  const taxTierData = [
    { name: '0% Exempt (Healthcare)', value: metrics.taxTierTotals[0]?.taxable || 0, tax: 0, fill: '#14B8A6' },
    { name: '5% Rate (Deluxe Beds)', value: metrics.taxTierTotals[5]?.taxable || 0, tax: metrics.taxTierTotals[5]?.tax || 0, fill: '#3B82F6' },
    { name: '12% Rate (Medicines)', value: metrics.taxTierTotals[12]?.taxable || 0, tax: metrics.taxTierTotals[12]?.tax || 0, fill: '#F59E0B' },
    { name: '18% Rate (Devices/Supp)', value: metrics.taxTierTotals[18]?.taxable || 0, tax: metrics.taxTierTotals[18]?.tax || 0, fill: '#8B5CF6' },
    { name: '28% Rate (Cosmetic)', value: metrics.taxTierTotals[28]?.taxable || 0, tax: metrics.taxTierTotals[28]?.tax || 0, fill: '#EF4444' }
  ].filter(t => t.value > 0);

  // Recent 7 days trend data
  const trendData = React.useMemo(() => {
    const map: Record<string, { date: string; taxable: number; tax: number; total: number }> = {};
    for (let i = 6; i >= 0; i--) {
      const d = new Date(Date.now() - i * 24 * 60 * 60 * 1000);
      const key = d.toLocaleDateString('en-IN', { day: '2-digit', month: 'short' });
      map[key] = { date: key, taxable: 0, tax: 0, total: 0 };
    }

    invoices.forEach(inv => {
      if (inv.invoiceStatus === 'cancelled') return;
      const key = new Date(inv.invoiceDate).toLocaleDateString('en-IN', { day: '2-digit', month: 'short' });
      if (map[key]) {
        map[key].taxable += inv.totalTaxable;
        map[key].tax += inv.totalTax;
        map[key].total += inv.grandTotal;
      }
    });

    return Object.values(map);
  }, [invoices]);

  return (
    <div className="space-y-8 animate-in fade-in duration-300">
      {/* Top Filter & Actions Header */}
      <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4 bg-white p-5 rounded-3xl border border-slate-200 shadow-xs">
        <div>
          <h2 className="text-xl font-extrabold text-slate-900 tracking-tight flex items-center gap-2">
            <Receipt className="w-6 h-6 text-teal-600" />
            <span>Healthcare Billing & GST Financial Dashboard</span>
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            Real-time tax accounting, sales registers, and reconciliation compliant with the Indian GST Council guidelines.
          </p>
        </div>

        {/* Date Filter Badges */}
        <div className="flex flex-wrap items-center gap-2">
          <div className="inline-flex bg-slate-100 p-1 rounded-2xl border border-slate-200 text-xs font-semibold">
            <button
              onClick={() => handlePeriodChange('today')}
              className={`px-3 py-1.5 rounded-xl transition-all ${
                dateFilter.period === 'today' ? 'bg-white text-teal-700 shadow-xs font-bold' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Today
            </button>
            <button
              onClick={() => handlePeriodChange('week')}
              className={`px-3 py-1.5 rounded-xl transition-all ${
                dateFilter.period === 'week' ? 'bg-white text-teal-700 shadow-xs font-bold' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              7 Days
            </button>
            <button
              onClick={() => handlePeriodChange('month')}
              className={`px-3 py-1.5 rounded-xl transition-all ${
                dateFilter.period === 'month' ? 'bg-white text-teal-700 shadow-xs font-bold' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              This Month
            </button>
            <button
              onClick={() => handlePeriodChange('financial_year')}
              className={`px-3 py-1.5 rounded-xl transition-all ${
                dateFilter.period === 'financial_year' ? 'bg-white text-teal-700 shadow-xs font-bold' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              FY {dateFilter.financialYear || getCurrentFinancialYear()}
            </button>
          </div>

          <button
            onClick={onNewInvoice}
            className="inline-flex items-center gap-1.5 px-4 py-2 bg-teal-600 hover:bg-teal-700 text-white text-xs font-bold rounded-2xl transition-all shadow-sm"
          >
            <span>+ Create Invoice</span>
          </button>
        </div>
      </div>

      {/* 8 Metric Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* 1. Gross Invoice Value */}
        <div className="bg-white p-5 rounded-3xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Total Invoiced (Gross)</span>
            <div className="p-2 bg-teal-50 text-teal-600 rounded-xl">
              <TrendingUp className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl font-black text-slate-900">{formatInr(metrics.totalInvoiceValue)}</p>
          <div className="flex items-center justify-between text-[11px] text-slate-400 mt-2 pt-2 border-t border-slate-100">
            <span>{metrics.invoiceCount} Total Invoices</span>
            <span className="text-emerald-600 font-semibold">{metrics.paidCount} Fully Paid</span>
          </div>
        </div>

        {/* 2. Total Taxable Value */}
        <div className="bg-white p-5 rounded-3xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Net Taxable Value</span>
            <div className="p-2 bg-blue-50 text-blue-600 rounded-xl">
              <FileText className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl font-black text-blue-900">{formatInr(metrics.totalTaxableValue)}</p>
          <div className="flex items-center justify-between text-[11px] text-slate-400 mt-2 pt-2 border-t border-slate-100">
            <span>Excl. of GST & Levy</span>
            <span className="text-slate-600 font-medium">B2B + B2C Base</span>
          </div>
        </div>

        {/* 3. Total GST Collected */}
        <div className="bg-white p-5 rounded-3xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Total Output GST</span>
            <div className="p-2 bg-indigo-50 text-indigo-600 rounded-xl">
              <ShieldCheck className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl font-black text-indigo-900">{formatInr(metrics.totalGst)}</p>
          <div className="flex items-center gap-1.5 text-[10px] text-indigo-700 font-mono mt-2 pt-2 border-t border-slate-100">
            <span className="bg-indigo-50 px-1.5 py-0.5 rounded">C: {formatInr(metrics.totalCgst)}</span>
            <span className="bg-indigo-50 px-1.5 py-0.5 rounded">S: {formatInr(metrics.totalSgst)}</span>
            <span className="bg-indigo-50 px-1.5 py-0.5 rounded">I: {formatInr(metrics.totalIgst)}</span>
          </div>
        </div>

        {/* 4. Payments Received */}
        <div className="bg-white p-5 rounded-3xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Total Amount Received</span>
            <div className="p-2 bg-emerald-50 text-emerald-600 rounded-xl">
              <CheckCircle2 className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl font-black text-emerald-700">{formatInr(metrics.totalAmountReceived)}</p>
          <div className="flex items-center justify-between text-[11px] text-emerald-700 mt-2 pt-2 border-t border-slate-100">
            <span>Realized Settlement</span>
            <span className="font-bold">
              {metrics.totalInvoiceValue > 0
                ? `${Math.round((metrics.totalAmountReceived / metrics.totalInvoiceValue) * 100)}% Collected`
                : '100%'}
            </span>
          </div>
        </div>

        {/* 5. Outstanding Receivables */}
        <div className="bg-white p-5 rounded-3xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-bold uppercase tracking-wider text-rose-500">Pending Receivables</span>
            <div className="p-2 bg-rose-50 text-rose-600 rounded-xl">
              <Clock className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl font-black text-rose-600">{formatInr(metrics.outstandingReceivables)}</p>
          <div className="flex items-center justify-between text-[11px] text-slate-400 mt-2 pt-2 border-t border-slate-100">
            <span>{metrics.partialCount + metrics.unpaidCount} Pending Invoices</span>
            <span className="text-rose-600 font-bold">Unpaid Dues</span>
          </div>
        </div>

        {/* 6. Total Discounts Given */}
        <div className="bg-white p-5 rounded-3xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Discounts Concessions</span>
            <div className="p-2 bg-amber-50 text-amber-600 rounded-xl">
              <Tag className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl font-black text-amber-700">{formatInr(metrics.totalDiscounts)}</p>
          <div className="flex items-center justify-between text-[11px] text-slate-400 mt-2 pt-2 border-t border-slate-100">
            <span>Pre-Tax Line Deductions</span>
            <span className="text-amber-700 font-semibold">100% Compliant</span>
          </div>
        </div>

        {/* 7. Credit Notes & Sales Returns */}
        <div className="bg-white p-5 rounded-3xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Credit Notes (Returns)</span>
            <div className="p-2 bg-purple-50 text-purple-600 rounded-xl">
              <RotateCcw className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl font-black text-purple-700">{formatInr(metrics.totalCreditNotesValue)}</p>
          <div className="flex items-center justify-between text-[11px] text-purple-700 mt-2 pt-2 border-t border-slate-100">
            <button onClick={onViewCreditNotes} className="underline hover:text-purple-900 font-medium">
              View Return Register →
            </button>
            <span>Tax Adjusted</span>
          </div>
        </div>

        {/* 8. Cancelled Invoices */}
        <div className="bg-white p-5 rounded-3xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Void / Cancelled</span>
            <div className="p-2 bg-slate-100 text-slate-500 rounded-xl">
              <Ban className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl font-black text-slate-600">{formatInr(metrics.totalCancelledValue)}</p>
          <div className="flex items-center justify-between text-[11px] text-slate-400 mt-2 pt-2 border-t border-slate-100">
            <span>{metrics.cancelledCount} Cancelled Invoices</span>
            <span className="text-slate-500">Excluded from GST</span>
          </div>
        </div>
      </div>

      {/* Visual Analytics Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left: 7-Day Revenue & GST Trend Bar Chart */}
        <div className="lg:col-span-8 bg-white p-6 rounded-3xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="font-extrabold text-sm text-slate-900 flex items-center gap-2">
                <BarChart2 className="w-4 h-4 text-teal-600" />
                <span>Sales & Tax Output Trend</span>
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">Taxable Base vs. Output GST across recent days</p>
            </div>
            <span className="text-xs font-bold text-teal-700 bg-teal-50 px-2.5 py-1 rounded-full border border-teal-200">
              Daily Realtime
            </span>
          </div>

          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={trendData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
                <XAxis dataKey="date" tick={{ fontSize: 11, fill: '#64748B' }} />
                <YAxis tick={{ fontSize: 11, fill: '#64748B' }} />
                <Tooltip
                  formatter={(val: number) => formatInr(val)}
                  contentStyle={{ backgroundColor: '#0F172A', color: '#F8FAFC', borderRadius: '12px', fontSize: '11px', border: 'none' }}
                />
                <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '10px' }} />
                <Bar dataKey="taxable" name="Taxable Value" fill="#0D9488" radius={[4, 4, 0, 0]} />
                <Bar dataKey="tax" name="Output GST" fill="#6366F1" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Right: Payment Modes Split (Pie/Donut) */}
        <div className="lg:col-span-4 bg-white p-6 rounded-3xl border border-slate-200 shadow-xs flex flex-col justify-between">
          <div>
            <h3 className="font-extrabold text-sm text-slate-900 flex items-center gap-2 mb-1">
              <PieIcon className="w-4 h-4 text-emerald-600" />
              <span>Payment Mode Split</span>
            </h3>
            <p className="text-xs text-slate-400 mb-4">Cash, UPI, Card & Direct Bank settlement ratio</p>

            {paymentChartData.length > 0 ? (
              <div className="h-44 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={paymentChartData}
                      dataKey="value"
                      nameKey="name"
                      cx="50%"
                      cy="50%"
                      innerRadius={45}
                      outerRadius={70}
                      paddingAngle={3}
                    >
                      {paymentChartData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip
                      formatter={(val: number) => formatInr(val)}
                      contentStyle={{ backgroundColor: '#0F172A', color: '#F8FAFC', borderRadius: '12px', fontSize: '11px' }}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <div className="h-44 flex items-center justify-center text-xs text-slate-400">
                No recorded payments in this period.
              </div>
            )}
          </div>

          <div className="grid grid-cols-2 gap-2 pt-2 border-t border-slate-100 text-xs">
            <div className="bg-slate-50 p-2 rounded-xl">
              <span className="text-[10px] text-slate-500 font-semibold block">UPI & QR</span>
              <span className="font-bold text-teal-700">{formatInr(metrics.paymentMethodTotals.upi)}</span>
            </div>
            <div className="bg-slate-50 p-2 rounded-xl">
              <span className="text-[10px] text-slate-500 font-semibold block">Cash Counter</span>
              <span className="font-bold text-emerald-700">{formatInr(metrics.paymentMethodTotals.cash)}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Quick Launchpad to GST Compliance Hub */}
      <div className="bg-gradient-to-r from-slate-900 via-slate-850 to-slate-900 text-white rounded-3xl p-6 sm:p-8 flex flex-col md:flex-row items-start md:items-center justify-between gap-6 shadow-md border border-slate-800">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-teal-500/20 text-teal-300 text-xs font-semibold mb-2 border border-teal-500/30">
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>Chartered Accountant Ready</span>
          </div>
          <h3 className="text-xl font-black text-white tracking-tight">
            Indian GST Return Filing & Audit Reconciliation
          </h3>
          <p className="text-xs sm:text-sm text-slate-300 mt-1 max-w-xl">
            Export GSTR-1 Sales Registers, HSN/SAC summaries, B2B vs B2C reports, and Tax Liability summaries in Excel and CSV formats with formula injection protection.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <button
            onClick={onViewReports}
            className="px-5 py-3 bg-teal-500 hover:bg-teal-400 text-slate-950 text-xs font-bold rounded-2xl transition-all shadow-md flex items-center gap-2"
          >
            <span>Open GST Reports Hub</span>
            <ArrowUpRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};
