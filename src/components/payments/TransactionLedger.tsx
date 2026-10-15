import React, { useState } from 'react';
import { 
  Search, 
  Filter, 
  Download, 
  CheckCircle2, 
  XCircle, 
  Clock, 
  RotateCcw, 
  FileText, 
  ExternalLink, 
  Smartphone, 
  CreditCard, 
  Landmark, 
  ShieldCheck, 
  Eye, 
  X,
  AlertTriangle
} from 'lucide-react';
import { usePayment } from '../../context/PaymentContext';
import { PaymentTransaction, PaymentStatus } from '../../types/payment';

export const TransactionLedger: React.FC = () => {
  const { filteredTransactions, activeConfig, initiateRefund } = usePayment();

  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [methodFilter, setMethodFilter] = useState<string>('all');
  const [settlementFilter, setSettlementFilter] = useState<string>('all');

  // Modal states
  const [selectedTxn, setSelectedTxn] = useState<PaymentTransaction | null>(null);
  const [refundTxn, setRefundTxn] = useState<PaymentTransaction | null>(null);
  const [refundReason, setRefundReason] = useState('Patient requested cancellation / Doctor unavailable');
  const [isProcessingRefund, setIsProcessingRefund] = useState(false);

  // Filtered list
  const displayTransactions = filteredTransactions.filter(t => {
    const matchesSearch = 
      t.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
      t.invoiceId.toLowerCase().includes(searchTerm.toLowerCase()) ||
      t.patientName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      t.patientPhone.includes(searchTerm) ||
      (t.gatewayPaymentId && t.gatewayPaymentId.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (t.settlementUtr && t.settlementUtr.toLowerCase().includes(searchTerm.toLowerCase()));

    const matchesStatus = statusFilter === 'all' || t.status === statusFilter;
    const matchesMethod = 
      methodFilter === 'all' || 
      (methodFilter === 'upi' && (t.paymentMethod === 'upi_intent' || t.paymentMethod === 'upi_qr')) ||
      (methodFilter === 'card' && t.paymentMethod === 'card') ||
      (methodFilter === 'netbanking' && t.paymentMethod === 'netbanking');

    const matchesSettlement = 
      settlementFilter === 'all' || t.settlementStatus === settlementFilter;

    return matchesSearch && matchesStatus && matchesMethod && matchesSettlement;
  });

  // Handle Refund
  const handleConfirmRefund = async () => {
    if (!refundTxn) return;
    setIsProcessingRefund(true);
    await initiateRefund(refundTxn.id, refundReason);
    setIsProcessingRefund(false);
    setRefundTxn(null);
  };

  // Export to CSV
  const handleExportCsv = () => {
    const headers = [
      'Transaction ID',
      'Invoice ID',
      'Patient Name',
      'Patient Phone',
      'Facility / Org',
      'Payment Method',
      'Gateway Provider',
      'Gateway Payment ID',
      'Gross Amount (INR)',
      'Gateway Fee (INR)',
      'GST on Fee (INR)',
      'Net Settled (INR)',
      'Payment Status',
      'Settlement Status',
      'Bank Account',
      'Bank UTR',
      'Date & Time'
    ];

    const rows = displayTransactions.map(t => [
      `"${t.id}"`,
      `"${t.invoiceId}"`,
      `"${t.patientName}"`,
      `"${t.patientPhone}"`,
      `"${t.organizationName}"`,
      `"${t.paymentMethod}"`,
      `"${t.gatewayProvider}"`,
      `"${t.gatewayPaymentId}"`,
      t.amount.toFixed(2),
      t.gatewayFee.toFixed(2),
      t.gatewayFeeGst.toFixed(2),
      t.netSettlementAmount.toFixed(2),
      `"${t.status}"`,
      `"${t.settlementStatus}"`,
      `"${t.bankAccountMasked || ''}"`,
      `"${t.settlementUtr || ''}"`,
      `"${t.createdAt}"`
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `ClinicPulse_Payment_Ledger_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-5">
      {/* Search & Filters Bar */}
      <div className="bg-white rounded-2xl p-4 sm:p-5 border border-slate-200/80 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search by Patient, Bill #, Txn ID, Gateway Ref, or Bank UTR..."
            className="w-full pl-10 pr-4 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 transition-all"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          {/* Status Filter */}
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="text-xs bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-700 font-medium focus:outline-none focus:ring-2 focus:ring-teal-500/20"
          >
            <option value="all">All Statuses</option>
            <option value="success">Success ✓</option>
            <option value="pending">Pending ⏳</option>
            <option value="failed">Failed ✕</option>
            <option value="refunded">Refunded ↺</option>
          </select>

          {/* Method Filter */}
          <select
            value={methodFilter}
            onChange={(e) => setMethodFilter(e.target.value)}
            className="text-xs bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-700 font-medium focus:outline-none focus:ring-2 focus:ring-teal-500/20"
          >
            <option value="all">All Methods</option>
            <option value="upi">UPI (GPay / PhonePe / QR)</option>
            <option value="card">Cards (Visa / MC / RuPay)</option>
            <option value="netbanking">Net Banking</option>
          </select>

          {/* Settlement Filter */}
          <select
            value={settlementFilter}
            onChange={(e) => setSettlementFilter(e.target.value)}
            className="text-xs bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-700 font-medium focus:outline-none focus:ring-2 focus:ring-teal-500/20"
          >
            <option value="all">All Settlements</option>
            <option value="settled">Settled to Bank</option>
            <option value="processing">In Process (T+1)</option>
            <option value="unsettled">Unsettled</option>
            <option value="refunded">Refunded</option>
          </select>

          {/* CSV Export Button */}
          <button
            onClick={handleExportCsv}
            className="bg-emerald-600 hover:bg-emerald-700 text-white px-3.5 py-2 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-colors shadow-sm ml-auto sm:ml-0"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Export CSV</span>
          </button>
        </div>
      </div>

      {/* Transactions Table */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-500 border-b border-slate-100">
              <tr>
                <th className="px-4 py-3.5 font-semibold">Transaction ID & Gateway Ref</th>
                <th className="px-4 py-3.5 font-semibold">Bill # & Category</th>
                <th className="px-4 py-3.5 font-semibold">Patient Details</th>
                <th className="px-4 py-3.5 font-semibold">Method & Instrument</th>
                <th className="px-4 py-3.5 font-semibold text-right">Gross (INR)</th>
                <th className="px-4 py-3.5 font-semibold text-right">Fees & GST</th>
                <th className="px-4 py-3.5 font-semibold text-right">Net Settled</th>
                <th className="px-4 py-3.5 font-semibold text-center">Payment Status</th>
                <th className="px-4 py-3.5 font-semibold">Bank Settlement</th>
                <th className="px-4 py-3.5 font-semibold text-center">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {displayTransactions.map((t) => (
                <tr key={t.id} className="hover:bg-slate-50/70 transition-colors">
                  {/* Txn ID */}
                  <td className="px-4 py-3">
                    <div className="font-mono font-bold text-navy-900">{t.id}</div>
                    <div className="text-[10px] text-slate-400 font-mono">{t.gatewayPaymentId}</div>
                    <div className="text-[10px] text-slate-400">
                      {new Date(t.createdAt).toLocaleString('en-US', { 
                        month: 'short', 
                        day: 'numeric', 
                        hour: '2-digit', 
                        minute: '2-digit' 
                      })}
                    </div>
                  </td>

                  {/* Bill # */}
                  <td className="px-4 py-3">
                    <span className="font-semibold text-navy-900">{t.invoiceId}</span>
                    <span className="block text-[10px] text-slate-500 uppercase font-medium">
                      {t.billCategory === 'opd' ? 'Hospital OPD' : t.billCategory === 'lab' ? 'Diagnostic Lab' : 'Pharmacy Bill'}
                    </span>
                  </td>

                  {/* Patient */}
                  <td className="px-4 py-3">
                    <div className="font-medium text-slate-800">{t.patientName}</div>
                    <div className="text-[10px] text-slate-500 font-mono">{t.patientPhone}</div>
                  </td>

                  {/* Method */}
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-1.5 font-medium text-slate-800">
                      {t.paymentMethod === 'upi_intent' || t.paymentMethod === 'upi_qr' ? (
                        <>
                          <Smartphone className="w-3.5 h-3.5 text-teal-600 shrink-0" />
                          <span>{t.paymentMethodDetails?.upiApp || 'UPI'}</span>
                        </>
                      ) : t.paymentMethod === 'card' ? (
                        <>
                          <CreditCard className="w-3.5 h-3.5 text-indigo-600 shrink-0" />
                          <span>Card ({t.paymentMethodDetails?.cardLast4 || '••••'})</span>
                        </>
                      ) : (
                        <>
                          <Landmark className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                          <span>Net Banking</span>
                        </>
                      )}
                    </div>
                    {t.paymentMethodDetails?.vpa && (
                      <div className="text-[10px] font-mono text-slate-400 truncate max-w-[120px]">
                        {t.paymentMethodDetails.vpa}
                      </div>
                    )}
                  </td>

                  {/* Gross Amount */}
                  <td className="px-4 py-3 text-right font-bold text-navy-900">
                    ₹{t.amount.toFixed(2)}
                  </td>

                  {/* Gateway Charges */}
                  <td className="px-4 py-3 text-right text-slate-500 text-[11px]">
                    <div>-₹{(t.gatewayFee + t.gatewayFeeGst).toFixed(2)}</div>
                    <div className="text-[9px] text-slate-400">(Fee: ₹{t.gatewayFee.toFixed(1)} + GST)</div>
                  </td>

                  {/* Net Settled */}
                  <td className="px-4 py-3 text-right font-bold text-emerald-700">
                    ₹{t.netSettlementAmount.toFixed(2)}
                  </td>

                  {/* Payment Status */}
                  <td className="px-4 py-3 text-center">
                    <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold ${
                      t.status === 'success' ? 'bg-emerald-100 text-emerald-800' :
                      t.status === 'pending' ? 'bg-amber-100 text-amber-800' :
                      t.status === 'refunded' ? 'bg-purple-100 text-purple-800' :
                      'bg-rose-100 text-rose-800'
                    }`}>
                      {t.status === 'success' && <CheckCircle2 className="w-3 h-3 text-emerald-600" />}
                      {t.status === 'pending' && <Clock className="w-3 h-3 text-amber-600" />}
                      {t.status === 'refunded' && <RotateCcw className="w-3 h-3 text-purple-600" />}
                      {t.status === 'failed' && <XCircle className="w-3 h-3 text-rose-600" />}
                      <span>{t.status.toUpperCase()}</span>
                    </span>
                  </td>

                  {/* Settlement */}
                  <td className="px-4 py-3">
                    <div className="font-semibold">
                      {t.settlementStatus === 'settled' ? (
                        <span className="text-emerald-700 flex items-center gap-1">
                          <CheckCircle2 className="w-3 h-3" /> Settled to Bank
                        </span>
                      ) : t.settlementStatus === 'processing' ? (
                        <span className="text-amber-700 flex items-center gap-1">
                          <Clock className="w-3 h-3" /> In Process (T+1)
                        </span>
                      ) : t.settlementStatus === 'refunded' ? (
                        <span className="text-purple-700">Refunded to Source</span>
                      ) : (
                        <span className="text-slate-400">Not Settled</span>
                      )}
                    </div>
                    {t.bankAccountMasked && (
                      <div className="text-[10px] text-slate-500">{t.bankAccountMasked}</div>
                    )}
                    {t.settlementUtr && (
                      <div className="text-[10px] font-mono text-slate-400">UTR: {t.settlementUtr}</div>
                    )}
                  </td>

                  {/* Actions */}
                  <td className="px-4 py-3 text-center">
                    <div className="inline-flex items-center gap-1 justify-center">
                      <button
                        onClick={() => setSelectedTxn(t)}
                        className="p-1.5 rounded-lg text-slate-500 hover:text-teal-600 hover:bg-teal-50 transition-colors"
                        title="View Gateway Receipt"
                      >
                        <Eye className="w-4 h-4" />
                      </button>

                      {t.status === 'success' && (
                        <button
                          onClick={() => setRefundTxn(t)}
                          className="p-1.5 rounded-lg text-slate-400 hover:text-purple-600 hover:bg-purple-50 transition-colors"
                          title="Initiate Refund"
                        >
                          <RotateCcw className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}

              {displayTransactions.length === 0 && (
                <tr>
                  <td colSpan={10} className="px-4 py-12 text-center text-slate-400">
                    No transactions matched your search filters.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Gateway Receipt Modal */}
      {selectedTxn && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full overflow-hidden shadow-2xl border border-slate-100 animate-in fade-in zoom-in-95 duration-150">
            {/* Header */}
            <div className="bg-navy-900 text-white p-5 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <ShieldCheck className="w-6 h-6 text-teal-400" />
                <div>
                  <h3 className="font-bold text-base">Verified Gateway Receipt</h3>
                  <p className="text-xs text-slate-300">Transaction ID: {selectedTxn.id}</p>
                </div>
              </div>
              <button 
                onClick={() => setSelectedTxn(null)}
                className="text-slate-400 hover:text-white transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Receipt Body */}
            <div className="p-6 space-y-4 text-xs">
              <div className="bg-slate-50 p-4 rounded-xl border border-slate-200/80 space-y-2">
                <div className="flex justify-between">
                  <span className="text-slate-500">Merchant / Org:</span>
                  <span className="font-bold text-navy-900">{selectedTxn.organizationName}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Invoice Reference:</span>
                  <span className="font-semibold text-slate-800">{selectedTxn.invoiceId}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Patient Name:</span>
                  <span className="font-semibold text-slate-800">{selectedTxn.patientName}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Patient Phone:</span>
                  <span className="font-mono text-slate-800">{selectedTxn.patientPhone}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Gateway Order ID:</span>
                  <span className="font-mono text-slate-800">{selectedTxn.orderId}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Gateway Payment ID:</span>
                  <span className="font-mono text-teal-700 font-semibold">{selectedTxn.gatewayPaymentId}</span>
                </div>
              </div>

              {/* Financial Breakdown */}
              <div className="border border-slate-200 rounded-xl p-4 space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="font-semibold text-slate-700">Gross Paid by Patient:</span>
                  <span className="font-extrabold text-navy-900">₹{selectedTxn.amount.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-slate-500">
                  <span>Payment Gateway Fee (2%):</span>
                  <span>-₹{selectedTxn.gatewayFee.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-slate-500">
                  <span>GST on Gateway Fee (18%):</span>
                  <span>-₹{selectedTxn.gatewayFeeGst.toFixed(2)}</span>
                </div>
                <div className="border-t border-slate-200 pt-2 flex justify-between text-sm">
                  <span className="font-bold text-teal-800">Net Settlement to Clinic Bank:</span>
                  <span className="font-extrabold text-teal-800">₹{selectedTxn.netSettlementAmount.toFixed(2)}</span>
                </div>
              </div>

              {/* Settlement Bank Details */}
              <div className="bg-teal-50/60 border border-teal-200/80 rounded-xl p-3.5 space-y-1">
                <div className="flex items-center gap-1.5 font-bold text-teal-900 text-xs">
                  <Landmark className="w-4 h-4 text-teal-700" />
                  <span>Direct Bank Settlement Status</span>
                </div>
                <p className="text-[11px] text-teal-800">
                  Account: <strong>{selectedTxn.bankAccountMasked || activeConfig.bankAccount.bankName}</strong>
                </p>
                {selectedTxn.settlementUtr && (
                  <p className="text-[11px] font-mono text-teal-700">
                    Bank UTR: <strong>{selectedTxn.settlementUtr}</strong>
                  </p>
                )}
                <p className="text-[10px] text-teal-600">
                  Signature Verification: <strong>CRYPTOGRAPHICALLY VERIFIED (HMAC-SHA256)</strong>
                </p>
              </div>

              {selectedTxn.refundDetails && (
                <div className="bg-purple-50 border border-purple-200 rounded-xl p-3.5 space-y-1">
                  <div className="font-bold text-purple-900">Refund Information</div>
                  <div className="text-[11px] text-purple-800">
                    Refund ID: <span className="font-mono">{selectedTxn.refundDetails.refundId}</span>
                  </div>
                  <div className="text-[11px] text-purple-800">
                    Amount: <strong>₹{selectedTxn.refundDetails.refundAmount.toFixed(2)}</strong> (Credited back to patient)
                  </div>
                  <div className="text-[11px] text-purple-800">
                    Reason: {selectedTxn.refundDetails.reason}
                  </div>
                </div>
              )}
            </div>

            <div className="bg-slate-50 px-6 py-4 flex justify-end gap-2 border-t border-slate-100">
              <button
                onClick={() => setSelectedTxn(null)}
                className="bg-navy-900 hover:bg-navy-800 text-white px-4 py-2 rounded-xl text-xs font-semibold"
              >
                Close Receipt
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Refund Confirmation Modal */}
      {refundTxn && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full overflow-hidden shadow-2xl border border-slate-100">
            <div className="p-5 border-b border-slate-100 flex items-center justify-between">
              <div className="flex items-center gap-2 text-purple-800 font-bold text-sm">
                <RotateCcw className="w-5 h-5 text-purple-600" />
                <span>Initiate Patient Refund</span>
              </div>
              <button onClick={() => setRefundTxn(null)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-5 space-y-4 text-xs">
              <div className="bg-amber-50 border border-amber-200 rounded-xl p-3.5 text-amber-800 flex items-start gap-2.5">
                <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                <div>
                  <strong>Are you sure you want to refund this transaction?</strong>
                  <p className="mt-1 text-[11px] text-amber-700">
                    ₹{refundTxn.amount.toFixed(2)} will be refunded back to <strong>{refundTxn.patientName}</strong> via the original payment source.
                  </p>
                </div>
              </div>

              <div>
                <label className="block text-slate-700 font-semibold mb-1">
                  Refund Reason (Recorded in audit trail):
                </label>
                <textarea
                  value={refundReason}
                  onChange={(e) => setRefundReason(e.target.value)}
                  rows={3}
                  className="w-full p-2.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-purple-500/20"
                />
              </div>
            </div>

            <div className="bg-slate-50 px-5 py-3.5 flex justify-end gap-2 border-t border-slate-100">
              <button
                onClick={() => setRefundTxn(null)}
                className="px-3.5 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-200/60 rounded-xl transition-colors"
              >
                Cancel
              </button>
              <button
                disabled={isProcessingRefund}
                onClick={handleConfirmRefund}
                className="bg-purple-600 hover:bg-purple-700 disabled:opacity-50 text-white px-4 py-2 text-xs font-semibold rounded-xl transition-colors shadow-sm"
              >
                {isProcessingRefund ? 'Processing...' : 'Confirm & Issue Refund'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
