import React, { useState, useMemo } from 'react';
import { 
  RotateCcw, 
  Search, 
  Plus, 
  Download, 
  Receipt, 
  AlertCircle, 
  CheckCircle2, 
  Calendar, 
  Package, 
  Pill, 
  X, 
  ArrowRight,
  ShieldCheck,
  FileSpreadsheet,
  CornerDownRight
} from 'lucide-react';
import { useBilling } from '../../context/BillingContext';
import { 
  CreditNote, 
  CreditNoteItem, 
  EnhancedInvoice, 
  InvoiceLineItem, 
  PaymentMethodType 
} from '../../types/billing';
import { formatInr, getCurrentFinancialYear } from '../../lib/gstEngine';
import { downloadCsv } from '../../lib/billingService';

interface CreditNotesManagerProps {
  preselectedInvoice?: EnhancedInvoice | null;
  onClearPreselected?: () => void;
  onViewInvoice?: (invoice: EnhancedInvoice) => void;
}

export const CreditNotesManager: React.FC<CreditNotesManagerProps> = ({
  preselectedInvoice,
  onClearPreselected,
  onViewInvoice
}) => {
  const { creditNotes, invoices, issueCreditNote } = useBilling();

  // Search & Filter
  const [searchTerm, setSearchTerm] = useState('');
  const [reasonFilter, setReasonFilter] = useState<string>('all');

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(!!preselectedInvoice);
  const [selectedInvoiceId, setSelectedInvoiceId] = useState<string>(preselectedInvoice?.id || '');
  const [reason, setReason] = useState<CreditNote['reason']>('sales_return');
  const [reasonDetails, setReasonDetails] = useState('');
  const [refundMethod, setRefundMethod] = useState<PaymentMethodType | 'credit_balance'>('cash');
  const [stockRestocked, setStockRestocked] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Detail View Modal
  const [viewingCreditNote, setViewingCreditNote] = useState<CreditNote | null>(null);

  // Selected invoice object
  const activeInvoice = useMemo(() => {
    return invoices.find(inv => inv.id === selectedInvoiceId) || preselectedInvoice || null;
  }, [invoices, selectedInvoiceId, preselectedInvoice]);

  // Items selection state for the credit note: Map of item index -> { selected: boolean, returnQty: number }
  const [selectedItemState, setSelectedItemState] = useState<Record<number, { selected: boolean; returnQty: number }>>({});

  // Reset item state when active invoice changes
  React.useEffect(() => {
    if (activeInvoice) {
      const initial: Record<number, { selected: boolean; returnQty: number }> = {};
      activeInvoice.items.forEach((item, idx) => {
        initial[idx] = { selected: true, returnQty: item.quantity };
      });
      setSelectedItemState(initial);
    } else {
      setSelectedItemState({});
    }
  }, [activeInvoice]);

  // Open modal if preselectedInvoice is provided from external component
  React.useEffect(() => {
    if (preselectedInvoice) {
      setSelectedInvoiceId(preselectedInvoice.id);
      setIsModalOpen(true);
    }
  }, [preselectedInvoice]);

  // Compute credit note adjustments from selected items
  const computedAdjustment = useMemo(() => {
    if (!activeInvoice) {
      return { items: [], totalTaxable: 0, totalCgst: 0, totalSgst: 0, totalIgst: 0, totalRefund: 0 };
    }

    const itemsToCredit: CreditNoteItem[] = [];
    let totalTaxable = 0;
    let totalCgst = 0;
    let totalSgst = 0;
    let totalIgst = 0;
    let totalRefund = 0;

    activeInvoice.items.forEach((item, idx) => {
      const state = selectedItemState[idx];
      if (state && state.selected && state.returnQty > 0) {
        const qtyRatio = state.returnQty / (item.quantity || 1);
        const itemTaxable = Math.round(item.taxableAmount * qtyRatio * 100) / 100;
        const itemCgst = Math.round(item.cgstAmount * qtyRatio * 100) / 100;
        const itemSgst = Math.round(item.sgstAmount * qtyRatio * 100) / 100;
        const itemIgst = Math.round(item.igstAmount * qtyRatio * 100) / 100;
        const itemTotal = itemTaxable + itemCgst + itemSgst + itemIgst;

        itemsToCredit.push({
          lineItemId: item.id,
          name: item.name,
          hsnSacCode: item.hsnSacCode,
          quantity: state.returnQty,
          unitPrice: item.unitPrice,
          taxableAmount: itemTaxable,
          gstRate: item.gstRate,
          cgstAmount: itemCgst,
          sgstAmount: itemSgst,
          igstAmount: itemIgst,
          totalAmount: itemTotal,
          medicineId: item.medicineId,
          batchNo: item.batchNo
        });

        totalTaxable += itemTaxable;
        totalCgst += itemCgst;
        totalSgst += itemSgst;
        totalIgst += itemIgst;
        totalRefund += itemTotal;
      }
    });

    return {
      items: itemsToCredit,
      totalTaxable: Math.round(totalTaxable * 100) / 100,
      totalCgst: Math.round(totalCgst * 100) / 100,
      totalSgst: Math.round(totalSgst * 100) / 100,
      totalIgst: Math.round(totalIgst * 100) / 100,
      totalRefund: Math.round(totalRefund * 100) / 100
    };
  }, [activeInvoice, selectedItemState]);

  // Handle Form Submit
  const handleIssueSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeInvoice || computedAdjustment.items.length === 0) {
      alert('Please select at least one item and quantity to credit/return.');
      return;
    }

    const invNum = activeInvoice.id || activeInvoice.invoiceNumber || '';
    const invDate = activeInvoice.invoiceDate ? activeInvoice.invoiceDate.split('T')[0] : (activeInvoice.date || '');
    const custName = activeInvoice.customerDetails?.name || activeInvoice.customerName || 'Patient';
    const custGstin = activeInvoice.customerDetails?.gstin || activeInvoice.customerGstin;
    const stateCode = activeInvoice.placeOfSupplyCode || activeInvoice.placeOfSupplyStateCode || '33';
    const isPharma = activeInvoice.category === 'pharmacy' || activeInvoice.items.some(it => it.category === 'pharmacy');

    setIsSubmitting(true);
    try {
      await issueCreditNote({
        invoiceId: activeInvoice.id,
        invoiceNumber: invNum,
        invoiceDate: invDate,
        financialYear: getCurrentFinancialYear(),
        reason,
        reasonDetails,
        customerName: custName,
        customerGstin: custGstin,
        stateCode,
        items: computedAdjustment.items,
        totalTaxableAdjustment: computedAdjustment.totalTaxable,
        totalCgstAdjustment: computedAdjustment.totalCgst,
        totalSgstAdjustment: computedAdjustment.totalSgst,
        totalIgstAdjustment: computedAdjustment.totalIgst,
        totalRefundAmount: computedAdjustment.totalRefund,
        refundMethod,
        refundStatus: 'completed',
        stockRestocked: stockRestocked && isPharma
      });

      setIsModalOpen(false);
      setSelectedInvoiceId('');
      if (onClearPreselected) onClearPreselected();
      alert('Credit Note successfully issued and GST liability reversed!');
    } catch (err: any) {
      alert('Failed to issue Credit Note: ' + (err.message || 'Unknown error'));
    } finally {
      setIsSubmitting(false);
    }
  };

  // Filtered Credit Notes
  const filteredCreditNotes = useMemo(() => {
    return creditNotes.filter(cn => {
      if (searchTerm) {
        const query = searchTerm.toLowerCase();
        const matchNum = cn.creditNoteNumber.toLowerCase().includes(query);
        const matchInv = cn.invoiceNumber.toLowerCase().includes(query);
        const matchCust = cn.customerName.toLowerCase().includes(query);
        const matchGstin = cn.customerGstin?.toLowerCase().includes(query) ?? false;
        if (!matchNum && !matchInv && !matchCust && !matchGstin) return false;
      }
      if (reasonFilter !== 'all' && cn.reason !== reasonFilter) return false;
      return true;
    });
  }, [creditNotes, searchTerm, reasonFilter]);

  // Metrics
  const metrics = useMemo(() => {
    let totalTaxable = 0;
    let totalGst = 0;
    let totalRefund = 0;

    filteredCreditNotes.forEach(cn => {
      totalTaxable += cn.totalTaxableAdjustment;
      totalGst += (cn.totalCgstAdjustment + cn.totalSgstAdjustment + cn.totalIgstAdjustment);
      totalRefund += cn.totalRefundAmount;
    });

    return { totalCount: filteredCreditNotes.length, totalTaxable, totalGst, totalRefund };
  }, [filteredCreditNotes]);

  // Export to CSV
  const exportCsv = () => {
    const rows = filteredCreditNotes.map(cn => ({
      creditNoteNumber: cn.creditNoteNumber,
      date: cn.date,
      invoiceNumber: cn.invoiceNumber,
      invoiceDate: cn.invoiceDate,
      customerName: cn.customerName,
      customerGstin: cn.customerGstin || '',
      reason: cn.reason.replace(/_/g, ' '),
      taxableAdjustment: cn.totalTaxableAdjustment,
      cgstAdjustment: cn.totalCgstAdjustment,
      sgstAdjustment: cn.totalSgstAdjustment,
      igstAdjustment: cn.totalIgstAdjustment,
      totalGstReversed: cn.totalCgstAdjustment + cn.totalSgstAdjustment + cn.totalIgstAdjustment,
      totalRefund: cn.totalRefundAmount,
      refundMethod: cn.refundMethod,
      stockRestocked: cn.stockRestocked ? 'Yes' : 'No'
    }));

    downloadCsv(
      rows,
      `Credit_Note_Register_${new Date().toISOString().split('T')[0]}.csv`,
      [
        { header: 'Credit Note #', key: 'creditNoteNumber' },
        { header: 'Date', key: 'date' },
        { header: 'Original Invoice #', key: 'invoiceNumber' },
        { header: 'Original Date', key: 'invoiceDate' },
        { header: 'Recipient / Patient', key: 'customerName' },
        { header: 'GSTIN', key: 'customerGstin' },
        { header: 'Reason', key: 'reason' },
        { header: 'Taxable Reversal (₹)', key: 'taxableAdjustment' },
        { header: 'CGST Reversal (₹)', key: 'cgstAdjustment' },
        { header: 'SGST Reversal (₹)', key: 'sgstAdjustment' },
        { header: 'IGST Reversal (₹)', key: 'igstAdjustment' },
        { header: 'Total GST Reversed (₹)', key: 'totalGstReversed' },
        { header: 'Total Refund (₹)', key: 'totalRefund' },
        { header: 'Refund Method', key: 'refundMethod' },
        { header: 'Stock Restored', key: 'stockRestocked' }
      ]
    );
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-slate-200/80 shadow-sm">
        <div>
          <div className="flex items-center gap-2">
            <RotateCcw className="w-6 h-6 text-purple-600" />
            <h1 className="text-2xl font-bold text-slate-900">Credit Notes & Sales Returns</h1>
          </div>
          <p className="text-sm text-slate-500 mt-1">
            Section 34 CGST Act compliant credit adjustments, sales returns, and tax reversal records.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={exportCsv}
            disabled={filteredCreditNotes.length === 0}
            className="inline-flex items-center gap-2 px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-sm font-semibold transition-colors disabled:opacity-50"
          >
            <Download className="w-4 h-4" />
            <span>Export Table 9B</span>
          </button>

          <button
            onClick={() => {
              setSelectedInvoiceId('');
              setIsModalOpen(true);
            }}
            className="inline-flex items-center gap-2 px-5 py-2.5 bg-purple-600 hover:bg-purple-700 text-white rounded-xl text-sm font-semibold shadow-sm hover:shadow transition-all"
          >
            <Plus className="w-4 h-4" />
            <span>Issue Credit Note</span>
          </button>
        </div>
      </div>

      {/* Metrics Bar */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-xl border border-slate-200/80 shadow-sm">
          <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Credit Notes Issued</p>
          <div className="mt-2 flex items-baseline justify-between">
            <span className="text-2xl font-bold text-purple-900">{metrics.totalCount}</span>
            <span className="text-xs text-purple-700 font-medium bg-purple-50 px-2 py-0.5 rounded-full">GSTR-1 Table 9B</span>
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200/80 shadow-sm">
          <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Taxable Reversed</p>
          <div className="mt-2">
            <span className="text-2xl font-bold text-slate-900">{formatInr(metrics.totalTaxable)}</span>
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200/80 shadow-sm">
          <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">GST Reversed</p>
          <div className="mt-2">
            <span className="text-2xl font-bold text-purple-600">{formatInr(metrics.totalGst)}</span>
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200/80 shadow-sm">
          <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Total Refund Amount</p>
          <div className="mt-2">
            <span className="text-2xl font-bold text-rose-600">{formatInr(metrics.totalRefund)}</span>
          </div>
        </div>
      </div>

      {/* Filter / Search Bar */}
      <div className="bg-white p-4 rounded-xl border border-slate-200/80 shadow-sm flex flex-col md:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search by Credit Note #, Invoice #, customer name or GSTIN..."
            className="w-full pl-9 pr-4 py-2 border border-slate-200 rounded-lg text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-600"
          />
        </div>

        <select
          value={reasonFilter}
          onChange={(e) => setReasonFilter(e.target.value)}
          className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-purple-500/20"
        >
          <option value="all">All Reasons</option>
          <option value="sales_return">Sales Return</option>
          <option value="deficiency_in_service">Deficiency in Service</option>
          <option value="overcharge">Correction / Overcharge</option>
          <option value="order_cancellation">Order Cancellation</option>
          <option value="other">Other</option>
        </select>
      </div>

      {/* Credit Note Table */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden">
        {filteredCreditNotes.length === 0 ? (
          <div className="p-12 text-center">
            <div className="w-16 h-16 bg-purple-50 rounded-full flex items-center justify-center mx-auto text-purple-400 mb-4">
              <RotateCcw className="w-8 h-8" />
            </div>
            <h3 className="text-lg font-bold text-slate-800">No Credit Notes Issued</h3>
            <p className="text-sm text-slate-500 mt-1 max-w-sm mx-auto">
              Issue a credit note when medicines are returned or when adjusting an overcharged invoice to reverse your GST liability.
            </p>
            <button
              onClick={() => {
                setSelectedInvoiceId('');
                setIsModalOpen(true);
              }}
              className="mt-6 inline-flex items-center gap-2 px-5 py-2.5 bg-purple-600 hover:bg-purple-700 text-white rounded-xl text-sm font-semibold transition-colors"
            >
              <Plus className="w-4 h-4" />
              <span>Issue First Credit Note</span>
            </button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-sm">
              <thead>
                <tr className="bg-slate-50/75 border-b border-slate-200 text-xs font-semibold text-slate-500 uppercase tracking-wider">
                  <th className="py-3.5 px-4">Credit Note #</th>
                  <th className="py-3.5 px-4">Date</th>
                  <th className="py-3.5 px-4">Against Invoice #</th>
                  <th className="py-3.5 px-4">Customer</th>
                  <th className="py-3.5 px-4">Reason</th>
                  <th className="py-3.5 px-4 text-right">Taxable Reversed</th>
                  <th className="py-3.5 px-4 text-right">GST Reversed</th>
                  <th className="py-3.5 px-4 text-right">Total Refund</th>
                  <th className="py-3.5 px-4 text-center">Stock</th>
                  <th className="py-3.5 px-4 text-center">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredCreditNotes.map((cn) => {
                  const gstReversed = cn.totalCgstAdjustment + cn.totalSgstAdjustment + cn.totalIgstAdjustment;

                  return (
                    <tr key={cn.id} className="hover:bg-slate-50/70 transition-colors">
                      <td className="py-3.5 px-4 font-mono font-bold text-purple-700">
                        {cn.creditNoteNumber}
                      </td>

                      <td className="py-3.5 px-4 text-slate-600 whitespace-nowrap">
                        {cn.date}
                      </td>

                      <td className="py-3.5 px-4">
                        <div className="font-mono text-slate-800 font-semibold flex items-center gap-1">
                          <Receipt className="w-3.5 h-3.5 text-slate-400" />
                          <span>{cn.invoiceNumber}</span>
                        </div>
                        <div className="text-[11px] text-slate-400 mt-0.5">
                          Date: {cn.invoiceDate}
                        </div>
                      </td>

                      <td className="py-3.5 px-4">
                        <div className="font-semibold text-slate-800">{cn.customerName}</div>
                        {cn.customerGstin && (
                          <div className="text-[11px] font-mono text-purple-600 font-medium">
                            {cn.customerGstin}
                          </div>
                        )}
                      </td>

                      <td className="py-3.5 px-4">
                        <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold bg-purple-50 text-purple-700 capitalize">
                          {cn.reason.replace(/_/g, ' ')}
                        </span>
                      </td>

                      <td className="py-3.5 px-4 text-right font-medium text-slate-700">
                        {formatInr(cn.totalTaxableAdjustment)}
                      </td>

                      <td className="py-3.5 px-4 text-right">
                        <div className="font-semibold text-purple-700">{formatInr(gstReversed)}</div>
                        <div className="text-[10px] text-slate-400">
                          {cn.totalIgstAdjustment > 0 ? 'IGST' : 'CGST+SGST'}
                        </div>
                      </td>

                      <td className="py-3.5 px-4 text-right font-bold text-rose-600">
                        {formatInr(cn.totalRefundAmount)}
                      </td>

                      <td className="py-3.5 px-4 text-center">
                        {cn.stockRestocked ? (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-emerald-50 text-emerald-700">
                            <CheckCircle2 className="w-3 h-3" />
                            Restored
                          </span>
                        ) : (
                          <span className="text-xs text-slate-400">No</span>
                        )}
                      </td>

                      <td className="py-3.5 px-4 text-center">
                        <button
                          onClick={() => setViewingCreditNote(cn)}
                          className="px-2.5 py-1 text-xs font-semibold text-purple-700 hover:bg-purple-50 border border-purple-200 rounded-lg transition-colors"
                        >
                          View Slip
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Issue Credit Note Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-2xl w-full shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[90vh] animate-in fade-in zoom-in-95">
            {/* Modal Header */}
            <div className="p-5 border-b border-slate-100 flex items-center justify-between bg-purple-50/50">
              <div className="flex items-center gap-2">
                <div className="w-9 h-9 rounded-xl bg-purple-100 text-purple-700 flex items-center justify-center">
                  <RotateCcw className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-slate-900">Issue GST Credit Note</h3>
                  <p className="text-xs text-slate-500">Reverse tax liability & record medicine returns</p>
                </div>
              </div>
              <button
                onClick={() => {
                  setIsModalOpen(false);
                  if (onClearPreselected) onClearPreselected();
                }}
                className="text-slate-400 hover:text-slate-600 p-1"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Form Body */}
            <form onSubmit={handleIssueSubmit} className="p-6 space-y-5 overflow-y-auto flex-1">
              {/* Select Original Invoice */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Original Invoice *
                </label>
                <select
                  value={selectedInvoiceId}
                  onChange={(e) => setSelectedInvoiceId(e.target.value)}
                  required
                  className="w-full px-3.5 py-2.5 border border-slate-200 rounded-xl text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-purple-500 font-mono"
                >
                  <option value="">-- Choose Issued Invoice --</option>
                  {invoices
                    .filter(inv => (inv.invoiceStatus === 'issued' || inv.status === 'issued'))
                    .map(inv => {
                      const num = inv.id || inv.invoiceNumber || '';
                      const name = inv.customerDetails?.name || inv.customerName || 'Patient';
                      const tot = inv.grandTotal ?? inv.totalAmount ?? 0;
                      const dt = inv.invoiceDate ? inv.invoiceDate.split('T')[0] : (inv.date || '');
                      return (
                        <option key={inv.id} value={inv.id}>
                          {num} — {name} ({formatInr(tot)}) [{dt}]
                        </option>
                      );
                    })}
                </select>
              </div>

              {activeInvoice && (
                <>
                  {/* Original Invoice Preview Card */}
                  <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 text-xs flex justify-between items-center">
                    <div>
                      <span className="text-slate-400 block">Customer</span>
                      <strong className="text-slate-800 text-sm">
                        {activeInvoice.customerDetails?.name || activeInvoice.customerName}
                      </strong>
                      {(activeInvoice.customerDetails?.gstin || activeInvoice.customerGstin) && (
                        <span className="font-mono text-purple-600 block mt-0.5">
                          GSTIN: {activeInvoice.customerDetails?.gstin || activeInvoice.customerGstin}
                        </span>
                      )}
                    </div>
                    <div className="text-right">
                      <span className="text-slate-400 block">Invoice Total</span>
                      <strong className="text-slate-800 text-sm">
                        {formatInr(activeInvoice.grandTotal ?? activeInvoice.totalAmount ?? 0)}
                      </strong>
                      <span className="text-slate-500 block mt-0.5 capitalize">
                        {(activeInvoice.category || activeInvoice.items[0]?.category || 'healthcare').replace('_', ' ')}
                      </span>
                    </div>
                  </div>

                  {/* Select Items to Credit / Return */}
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                        Select Items to Return / Credit
                      </label>
                      <span className="text-xs text-purple-600 font-medium">
                        {computedAdjustment.items.length} item(s) selected
                      </span>
                    </div>

                    <div className="border border-slate-200 rounded-xl overflow-hidden divide-y divide-slate-100">
                      {activeInvoice.items.map((item, idx) => {
                        const state = selectedItemState[idx] || { selected: false, returnQty: item.quantity };

                        return (
                          <div 
                            key={idx} 
                            className={`p-3 text-xs flex items-center justify-between transition-colors ${state.selected ? 'bg-purple-50/30' : 'bg-white opacity-60'}`}
                          >
                            <div className="flex items-center gap-3">
                              <input
                                type="checkbox"
                                checked={state.selected}
                                onChange={(e) => {
                                  setSelectedItemState(prev => ({
                                    ...prev,
                                    [idx]: {
                                      ...prev[idx],
                                      selected: e.target.checked,
                                      returnQty: e.target.checked ? (prev[idx]?.returnQty || item.quantity) : 0
                                    }
                                  }));
                                }}
                                className="w-4 h-4 text-purple-600 rounded border-slate-300 focus:ring-purple-500"
                              />
                              <div>
                                <div className="font-bold text-slate-800">{item.name}</div>
                                <div className="text-slate-400 text-[11px] font-mono">
                                  HSN/SAC: {item.hsnSacCode} | GST: {item.gstRate}%
                                </div>
                              </div>
                            </div>

                            <div className="flex items-center gap-4">
                              <div className="flex items-center gap-1.5">
                                <span className="text-slate-500 text-[11px]">Return Qty:</span>
                                <input
                                  type="number"
                                  min="1"
                                  max={item.quantity}
                                  disabled={!state.selected}
                                  value={state.returnQty}
                                  onChange={(e) => {
                                    const val = Math.min(Math.max(1, parseInt(e.target.value) || 1), item.quantity);
                                    setSelectedItemState(prev => ({
                                      ...prev,
                                      [idx]: { ...prev[idx], returnQty: val }
                                    }));
                                  }}
                                  className="w-16 px-2 py-1 border border-slate-200 rounded text-center font-bold text-slate-800 text-xs focus:ring-1 focus:ring-purple-500"
                                />
                                <span className="text-slate-400 text-[11px]">/ {item.quantity}</span>
                              </div>

                              <div className="text-right w-24">
                                <span className="font-bold text-slate-900 block">
                                  {formatInr(item.unitPrice * (state.selected ? state.returnQty : 0))}
                                </span>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {/* Reason & Refund Controls */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1">
                        Reason for Credit Note *
                      </label>
                      <select
                        value={reason}
                        onChange={(e) => setReason(e.target.value as any)}
                        className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-purple-500"
                      >
                        <option value="sales_return">Sales Return (Medicines/Goods)</option>
                        <option value="deficiency_in_service">Deficiency in Service / Consultation</option>
                        <option value="overcharge">Price Correction / Overcharge</option>
                        <option value="order_cancellation">Order / Appointment Cancellation</option>
                        <option value="other">Other Commercial Reason</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1">
                        Refund Mode *
                      </label>
                      <select
                        value={refundMethod}
                        onChange={(e) => setRefundMethod(e.target.value as any)}
                        className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-purple-500"
                      >
                        <option value="cash">Cash Refund</option>
                        <option value="upi">UPI / Instant Bank Transfer</option>
                        <option value="bank_transfer">Bank Account Transfer</option>
                        <option value="credit_balance">Store Credit / Advance Ledger</option>
                      </select>
                    </div>
                  </div>

                  {/* Pharmacy Stock Restock Toggle */}
                  {(activeInvoice.category === 'pharmacy' || activeInvoice.items.some(it => it.category === 'pharmacy')) && (
                    <div className="p-3 bg-emerald-50/70 border border-emerald-200 rounded-xl flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Package className="w-5 h-5 text-emerald-600" />
                        <div>
                          <p className="text-xs font-bold text-emerald-900">Restock Returned Medicines</p>
                          <p className="text-[11px] text-emerald-700">
                            Automatically adds returned units back to pharmacy inventory batches.
                          </p>
                        </div>
                      </div>
                      <input
                        type="checkbox"
                        checked={stockRestocked}
                        onChange={(e) => setStockRestocked(e.target.checked)}
                        className="w-4 h-4 text-emerald-600 rounded border-emerald-300 focus:ring-emerald-500"
                      />
                    </div>
                  )}

                  {/* Optional Remarks */}
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Reason Remarks / Explanation
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. Patient returned unsealed strips within 24h"
                      value={reasonDetails}
                      onChange={(e) => setReasonDetails(e.target.value)}
                      className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-purple-500"
                    />
                  </div>

                  {/* Adjustment Summary */}
                  <div className="p-4 bg-purple-50/50 border border-purple-200/80 rounded-xl space-y-1.5 text-xs">
                    <div className="flex justify-between text-slate-600">
                      <span>Taxable Value Reversed:</span>
                      <span className="font-semibold">{formatInr(computedAdjustment.totalTaxable)}</span>
                    </div>
                    {computedAdjustment.totalIgst > 0 ? (
                      <div className="flex justify-between text-slate-600">
                        <span>IGST Reversed:</span>
                        <span className="font-semibold text-purple-700">{formatInr(computedAdjustment.totalIgst)}</span>
                      </div>
                    ) : (
                      <>
                        <div className="flex justify-between text-slate-600">
                          <span>CGST Reversed:</span>
                          <span className="font-semibold text-purple-700">{formatInr(computedAdjustment.totalCgst)}</span>
                        </div>
                        <div className="flex justify-between text-slate-600">
                          <span>SGST Reversed:</span>
                          <span className="font-semibold text-purple-700">{formatInr(computedAdjustment.totalSgst)}</span>
                        </div>
                      </>
                    )}
                    <div className="pt-2 border-t border-purple-200 flex justify-between text-sm font-bold text-slate-900">
                      <span>Total Refund / Credit:</span>
                      <span className="text-rose-600">{formatInr(computedAdjustment.totalRefund)}</span>
                    </div>
                  </div>
                </>
              )}

              {/* Action Buttons */}
              <div className="pt-2 flex gap-3">
                <button
                  type="button"
                  onClick={() => {
                    setIsModalOpen(false);
                    if (onClearPreselected) onClearPreselected();
                  }}
                  className="flex-1 px-4 py-2.5 border border-slate-200 text-slate-600 rounded-xl text-sm font-semibold hover:bg-slate-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting || !activeInvoice || computedAdjustment.items.length === 0}
                  className="flex-1 px-4 py-2.5 bg-purple-600 hover:bg-purple-700 text-white rounded-xl text-sm font-semibold transition-colors disabled:opacity-50"
                >
                  {isSubmitting ? 'Issuing...' : 'Issue Credit Note'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* View Credit Note Details Modal */}
      {viewingCreditNote && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full shadow-2xl border border-slate-200 overflow-hidden animate-in fade-in zoom-in-95">
            <div className="p-5 border-b border-slate-100 flex items-center justify-between bg-purple-50/50">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-purple-600 text-white flex items-center justify-center">
                  <RotateCcw className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-bold text-slate-900">{viewingCreditNote.creditNoteNumber}</h3>
                  <p className="text-xs text-slate-500">Issued on {viewingCreditNote.date}</p>
                </div>
              </div>
              <button
                onClick={() => setViewingCreditNote(null)}
                className="text-slate-400 hover:text-slate-600 p-1"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-3 p-3 bg-slate-50 rounded-xl">
                <div>
                  <span className="text-slate-400 block">Against Invoice</span>
                  <span className="font-mono font-bold text-slate-800">{viewingCreditNote.invoiceNumber}</span>
                  <span className="text-[11px] text-slate-500 block">Date: {viewingCreditNote.invoiceDate}</span>
                </div>
                <div>
                  <span className="text-slate-400 block">Customer</span>
                  <span className="font-bold text-slate-800">{viewingCreditNote.customerName}</span>
                  {viewingCreditNote.customerGstin && (
                    <span className="font-mono text-purple-600 block">{viewingCreditNote.customerGstin}</span>
                  )}
                </div>
              </div>

              <div>
                <span className="text-slate-400 block mb-1">Reason for Credit</span>
                <div className="p-2.5 bg-purple-50 text-purple-900 rounded-lg font-medium">
                  {viewingCreditNote.reason.replace(/_/g, ' ').toUpperCase()}
                  {viewingCreditNote.reasonDetails && `: ${viewingCreditNote.reasonDetails}`}
                </div>
              </div>

              <div>
                <span className="text-slate-400 block mb-1">Credited Items</span>
                <div className="border border-slate-200 rounded-xl overflow-hidden divide-y divide-slate-100">
                  {viewingCreditNote.items.map((item, i) => (
                    <div key={i} className="p-2.5 flex justify-between items-center">
                      <div>
                        <strong className="text-slate-800">{item.name}</strong>
                        <span className="text-slate-400 text-[11px] block">
                          Qty: {item.quantity} × {formatInr(item.unitPrice)} (HSN: {item.hsnSacCode})
                        </span>
                      </div>
                      <span className="font-bold text-slate-800">{formatInr(item.totalAmount)}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="p-3 bg-slate-50 rounded-xl space-y-1">
                <div className="flex justify-between text-slate-600">
                  <span>Taxable Reversal:</span>
                  <span className="font-semibold">{formatInr(viewingCreditNote.totalTaxableAdjustment)}</span>
                </div>
                <div className="flex justify-between text-slate-600">
                  <span>GST Reversal (CGST+SGST/IGST):</span>
                  <span className="font-semibold text-purple-700">
                    {formatInr(viewingCreditNote.totalCgstAdjustment + viewingCreditNote.totalSgstAdjustment + viewingCreditNote.totalIgstAdjustment)}
                  </span>
                </div>
                <div className="pt-2 border-t border-slate-200 flex justify-between font-bold text-sm text-slate-900">
                  <span>Total Refund:</span>
                  <span className="text-rose-600">{formatInr(viewingCreditNote.totalRefundAmount)}</span>
                </div>
              </div>
            </div>

            <div className="p-4 border-t border-slate-100 bg-slate-50/50 flex justify-end">
              <button
                onClick={() => setViewingCreditNote(null)}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-900 text-white rounded-xl text-xs font-semibold"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
