import React, { useState } from 'react';
import { 
  FileSpreadsheet, 
  Download, 
  Calendar, 
  Filter, 
  TrendingUp, 
  CreditCard, 
  Landmark, 
  RotateCcw,
  Building2,
  CheckCircle2,
  Search
} from 'lucide-react';
import { usePayment } from '../../context/PaymentContext';
import { OrgType } from '../../types';

export const PaymentReports: React.FC = () => {
  const { transactions } = usePayment();

  // Filters
  const [dateRange, setDateRange] = useState<'today' | 'yesterday' | '7days' | 'month' | 'all'>('7days');
  const [selectedOrgFilter, setSelectedOrgFilter] = useState<string>('all');
  const [methodFilter, setMethodFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');

  // Filter logic
  const filteredData = transactions.filter(t => {
    // Date filter
    const now = new Date();
    const tDate = new Date(t.createdAt);
    let dateMatch = true;

    if (dateRange === 'today') {
      dateMatch = t.createdAt.startsWith(now.toISOString().split('T')[0]);
    } else if (dateRange === 'yesterday') {
      const y = new Date();
      y.setDate(y.getDate() - 1);
      dateMatch = t.createdAt.startsWith(y.toISOString().split('T')[0]);
    } else if (dateRange === '7days') {
      const sevenDaysAgo = new Date();
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
      dateMatch = tDate >= sevenDaysAgo;
    } else if (dateRange === 'month') {
      const monthPrefix = now.toISOString().substring(0, 7);
      dateMatch = t.createdAt.startsWith(monthPrefix);
    }

    // Org filter
    const orgMatch = selectedOrgFilter === 'all' || t.organizationType === selectedOrgFilter;

    // Method filter
    const methodMatch = methodFilter === 'all' || t.paymentMethod === methodFilter;

    // Status filter
    const statusMatch = statusFilter === 'all' || t.status === statusFilter;

    return dateMatch && orgMatch && methodMatch && statusMatch;
  });

  // Calculate Aggregates
  const totalGross = filteredData.reduce((acc, t) => t.status === 'success' ? acc + t.amount : acc, 0);
  const totalFees = filteredData.reduce((acc, t) => t.status === 'success' ? acc + (t.gatewayFee + t.gatewayFeeGst) : acc, 0);
  const totalNetSettled = filteredData.reduce((acc, t) => (t.status === 'success' && t.settlementStatus === 'settled') ? acc + t.netSettlementAmount : acc, 0);
  const totalRefunded = filteredData.reduce((acc, t) => t.status === 'refunded' ? acc + (t.refundDetails?.refundAmount || t.amount) : acc, 0);

  // Export CSV / Excel
  const handleExportCsv = () => {
    const headers = [
      'Transaction ID',
      'Invoice ID',
      'Date & Time',
      'Facility / Organization',
      'Bill Category',
      'Patient Name',
      'Patient Phone',
      'Payment Method',
      'Gateway Payment ID',
      'Gross Amount (INR)',
      'Gateway Fee (INR)',
      'GST on Gateway Fee (INR)',
      'Net Settled Payout (INR)',
      'Transaction Status',
      'Settlement Status',
      'Settlement Bank Account',
      'Bank UTR Number'
    ];

    const rows = filteredData.map(t => [
      `"${t.id}"`,
      `"${t.invoiceId}"`,
      `"${new Date(t.createdAt).toISOString()}"`,
      `"${t.organizationName}"`,
      `"${t.billCategory.toUpperCase()}"`,
      `"${t.patientName}"`,
      `"${t.patientPhone}"`,
      `"${t.paymentMethod}"`,
      `"${t.gatewayPaymentId}"`,
      t.amount.toFixed(2),
      t.gatewayFee.toFixed(2),
      t.gatewayFeeGst.toFixed(2),
      t.netSettlementAmount.toFixed(2),
      `"${t.status}"`,
      `"${t.settlementStatus}"`,
      `"${t.bankAccountMasked || ''}"`,
      `"${t.settlementUtr || ''}"`
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `ClinicPulse_Bank_Settlement_Report_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6">
      {/* Top Filter Bar */}
      <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-sm space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h3 className="font-bold text-navy-900 text-sm">Settlement & Bank Reconciliation Reports</h3>
            <p className="text-xs text-slate-500">
              Audit-ready financial reporting by facility, date range, payment instrument, and settlement UTR
            </p>
          </div>

          <button
            onClick={handleExportCsv}
            className="bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2 rounded-xl text-xs font-semibold flex items-center gap-2 transition-all shadow-sm shrink-0"
          >
            <Download className="w-4 h-4" />
            <span>Download Excel / CSV Report</span>
          </button>
        </div>

        {/* Filter Controls Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-3 border-t border-slate-100 text-xs">
          {/* Date Range */}
          <div>
            <label className="block text-slate-500 font-semibold mb-1">Time Period:</label>
            <select
              value={dateRange}
              onChange={(e) => setDateRange(e.target.value as any)}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2 font-medium text-slate-700"
            >
              <option value="today">Today</option>
              <option value="yesterday">Yesterday</option>
              <option value="7days">Last 7 Days</option>
              <option value="month">This Month (MTD)</option>
              <option value="all">All-Time Records</option>
            </select>
          </div>

          {/* Org Filter */}
          <div>
            <label className="block text-slate-500 font-semibold mb-1">Facility / Org:</label>
            <select
              value={selectedOrgFilter}
              onChange={(e) => setSelectedOrgFilter(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2 font-medium text-slate-700"
            >
              <option value="all">All Facilities</option>
              <option value="hospital">Hospital Multispecialty</option>
              <option value="laboratory">Diagnostic Laboratory</option>
              <option value="pharmacy">Pharmacy / MedStore</option>
            </select>
          </div>

          {/* Payment Method */}
          <div>
            <label className="block text-slate-500 font-semibold mb-1">Payment Method:</label>
            <select
              value={methodFilter}
              onChange={(e) => setMethodFilter(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2 font-medium text-slate-700"
            >
              <option value="all">All Payment Methods</option>
              <option value="upi_intent">UPI Apps (GPay, PhonePe, Paytm)</option>
              <option value="upi_qr">UPI Dynamic QR Code</option>
              <option value="card">Debit / Credit Cards</option>
              <option value="netbanking">Net Banking</option>
            </select>
          </div>

          {/* Transaction Status */}
          <div>
            <label className="block text-slate-500 font-semibold mb-1">Status:</label>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2 font-medium text-slate-700"
            >
              <option value="all">All Statuses</option>
              <option value="success">Success</option>
              <option value="pending">Pending</option>
              <option value="failed">Failed</option>
              <option value="refunded">Refunded</option>
            </select>
          </div>
        </div>
      </div>

      {/* Aggregate Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        <div className="bg-white rounded-2xl p-4 border border-slate-200/80 shadow-sm">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Gross Inflow</span>
          <div className="text-xl font-black text-navy-900 mt-1">
            ₹{totalGross.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
          </div>
          <span className="text-[11px] text-slate-500 mt-0.5 block">{filteredData.filter(t => t.status === 'success').length} Success Transactions</span>
        </div>

        <div className="bg-white rounded-2xl p-4 border border-slate-200/80 shadow-sm">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Gateway Charges</span>
          <div className="text-xl font-black text-slate-700 mt-1">
            ₹{totalFees.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
          </div>
          <span className="text-[11px] text-slate-500 mt-0.5 block">2% Fee + 18% GST Deducted</span>
        </div>

        <div className="bg-white rounded-2xl p-4 border border-slate-200/80 shadow-sm">
          <span className="text-[10px] font-bold text-teal-600 uppercase tracking-wider block">Direct Bank Credit</span>
          <div className="text-xl font-black text-teal-800 mt-1">
            ₹{totalNetSettled.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
          </div>
          <span className="text-[11px] text-teal-700 mt-0.5 block">Settled into Registered A/C</span>
        </div>

        <div className="bg-white rounded-2xl p-4 border border-slate-200/80 shadow-sm">
          <span className="text-[10px] font-bold text-purple-600 uppercase tracking-wider block">Total Refunds</span>
          <div className="text-xl font-black text-purple-800 mt-1">
            ₹{totalRefunded.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
          </div>
          <span className="text-[11px] text-purple-700 mt-0.5 block">{filteredData.filter(t => t.status === 'refunded').length} Processed Refunds</span>
        </div>
      </div>

      {/* Summary Table */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden">
        <div className="p-4 border-b border-slate-100 flex items-center justify-between">
          <h4 className="font-bold text-navy-900 text-xs uppercase tracking-wider">
            Reconciled Report Lines ({filteredData.length} Records)
          </h4>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-500 border-b border-slate-100">
              <tr>
                <th className="px-4 py-3 font-semibold">Date & Time</th>
                <th className="px-4 py-3 font-semibold">Txn ID / UTR</th>
                <th className="px-4 py-3 font-semibold">Facility</th>
                <th className="px-4 py-3 font-semibold">Patient</th>
                <th className="px-4 py-3 font-semibold">Instrument</th>
                <th className="px-4 py-3 font-semibold text-right">Gross (INR)</th>
                <th className="px-4 py-3 font-semibold text-right">Fee (INR)</th>
                <th className="px-4 py-3 font-semibold text-right">Net Credit (INR)</th>
                <th className="px-4 py-3 font-semibold text-center">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredData.map(t => (
                <tr key={t.id} className="hover:bg-slate-50/60 transition-colors">
                  <td className="px-4 py-3 text-slate-600">
                    {new Date(t.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                  </td>
                  <td className="px-4 py-3">
                    <div className="font-mono font-medium text-navy-900">{t.id}</div>
                    {t.settlementUtr && (
                      <div className="text-[10px] font-mono text-slate-400">UTR: {t.settlementUtr}</div>
                    )}
                  </td>
                  <td className="px-4 py-3 text-slate-700 capitalize font-medium">
                    {t.organizationType}
                  </td>
                  <td className="px-4 py-3 text-slate-800 font-medium">
                    {t.patientName}
                  </td>
                  <td className="px-4 py-3 capitalize text-slate-600">
                    {t.paymentMethod.replace('_', ' ')}
                  </td>
                  <td className="px-4 py-3 text-right font-bold text-navy-900">
                    ₹{t.amount.toFixed(2)}
                  </td>
                  <td className="px-4 py-3 text-right text-slate-500">
                    ₹{(t.gatewayFee + t.gatewayFeeGst).toFixed(2)}
                  </td>
                  <td className="px-4 py-3 text-right font-bold text-teal-800">
                    ₹{t.netSettlementAmount.toFixed(2)}
                  </td>
                  <td className="px-4 py-3 text-center">
                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                      t.status === 'success' ? 'bg-emerald-100 text-emerald-800' :
                      t.status === 'pending' ? 'bg-amber-100 text-amber-800' :
                      t.status === 'refunded' ? 'bg-purple-100 text-purple-800' :
                      'bg-rose-100 text-rose-800'
                    }`}>
                      {t.status.toUpperCase()}
                    </span>
                  </td>
                </tr>
              ))}

              {filteredData.length === 0 && (
                <tr>
                  <td colSpan={9} className="px-4 py-10 text-center text-slate-400">
                    No transactions found for the selected report filters.
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
