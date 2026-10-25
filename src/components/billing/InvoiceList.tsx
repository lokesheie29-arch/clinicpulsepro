import React, { useState, useMemo } from 'react';
import { 
  Search, 
  Filter, 
  Plus, 
  Receipt, 
  Calendar, 
  ArrowUpDown, 
  Eye, 
  CreditCard, 
  RotateCcw, 
  Ban, 
  CheckCircle2, 
  Clock, 
  AlertCircle, 
  Building2, 
  User, 
  FileSpreadsheet, 
  Download,
  IndianRupee,
  ChevronDown,
  X
} from 'lucide-react';
import { useBilling } from '../../context/BillingContext';
import { EnhancedInvoice, InvoiceStatus, PaymentStatus, InvoiceCategory } from '../../types/billing';
import { formatInr } from '../../lib/gstEngine';
import { downloadCsv } from '../../lib/billingService';

interface InvoiceListProps {
  onSelectInvoice: (invoice: EnhancedInvoice) => void;
  onNewInvoice: () => void;
  onIssueCreditNote: (invoice: EnhancedInvoice) => void;
}

export const InvoiceList: React.FC<InvoiceListProps> = ({
  onSelectInvoice,
  onNewInvoice,
  onIssueCreditNote
}) => {
  const { invoices, cancelInvoice, recordPayment } = useBilling();

  // Search & Filters state
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | InvoiceStatus>('all');
  const [paymentFilter, setPaymentFilter] = useState<'all' | PaymentStatus>('all');
  const [categoryFilter, setCategoryFilter] = useState<'all' | InvoiceCategory>('all');
  const [customerTypeFilter, setCustomerTypeFilter] = useState<'all' | 'b2b' | 'b2c'>('all');
  const [sortField, setSortField] = useState<'date' | 'totalAmount' | 'invoiceNumber'>('date');
  const [sortAsc, setSortAsc] = useState(false);

  // Quick Payment Modal State
  const [paymentModalInvoice, setPaymentModalInvoice] = useState<EnhancedInvoice | null>(null);
  const [paymentAmount, setPaymentAmount] = useState<number>(0);
  const [paymentMethod, setPaymentMethod] = useState<'cash' | 'upi' | 'card' | 'bank_transfer'>('cash');
  const [paymentRef, setPaymentRef] = useState('');
  const [paymentNotes, setPaymentNotes] = useState('');
  const [isSubmittingPayment, setIsSubmittingPayment] = useState(false);

  // Void/Cancel Modal State
  const [voidModalInvoice, setVoidModalInvoice] = useState<EnhancedInvoice | null>(null);
  const [cancelReason, setCancelReason] = useState('');
  const [isSubmittingVoid, setIsSubmittingVoid] = useState(false);

  // Filtered & Sorted Invoices
  const filteredInvoices = useMemo(() => {
    return invoices.filter(inv => {
      // Search text matches invoiceNumber, customer name, phone, gstin
      if (searchTerm) {
        const query = searchTerm.toLowerCase();
        const matchNum = inv.invoiceNumber.toLowerCase().includes(query);
        const matchCust = inv.customerName.toLowerCase().includes(query);
        const matchPhone = inv.customerPhone?.toLowerCase().includes(query) ?? false;
        const matchGstin = inv.customerGstin?.toLowerCase().includes(query) ?? false;
        if (!matchNum && !matchCust && !matchPhone && !matchGstin) return false;
      }

      // Status filter
      if (statusFilter !== 'all' && inv.status !== statusFilter) return false;

      // Payment filter
      if (paymentFilter !== 'all' && inv.paymentStatus !== paymentFilter) return false;

      // Category filter
      if (categoryFilter !== 'all' && inv.category !== categoryFilter) return false;

      // Customer type filter
      if (customerTypeFilter === 'b2b') {
        if (!inv.isB2B && inv.customerType === 'b2c_patient') return false;
      } else if (customerTypeFilter === 'b2c') {
        if (inv.isB2B || inv.customerType !== 'b2c_patient') return false;
      }

      return true;
    }).sort((a, b) => {
      let comparison = 0;
      if (sortField === 'date') {
        comparison = new Date(a.date).getTime() - new Date(b.date).getTime();
      } else if (sortField === 'totalAmount') {
        comparison = a.totalAmount - b.totalAmount;
      } else {
        comparison = a.invoiceNumber.localeCompare(b.invoiceNumber);
      }
      return sortAsc ? comparison : -comparison;
    });
  }, [invoices, searchTerm, statusFilter, paymentFilter, categoryFilter, customerTypeFilter, sortField, sortAsc]);

  // Aggregate stats of current filtered set
  const stats = useMemo(() => {
    let totalInvoiced = 0;
    let totalTaxable = 0;
    let totalGst = 0;
    let totalPaid = 0;
    let totalBalanceDue = 0;

    filteredInvoices.forEach(inv => {
      if (inv.status !== 'cancelled') {
        totalInvoiced += inv.totalAmount;
        totalTaxable += inv.taxableAmount;
        totalGst += inv.cgstAmount + inv.sgstAmount + inv.igstAmount;
        totalPaid += inv.paidAmount;
        totalBalanceDue += inv.balanceDue;
      }
    });

    return { totalInvoiced, totalTaxable, totalGst, totalPaid, totalBalanceDue };
  }, [filteredInvoices]);

  // Open Quick Pay Modal
  const openPaymentModal = (invoice: EnhancedInvoice) => {
    setPaymentModalInvoice(invoice);
    setPaymentAmount(invoice.balanceDue > 0 ? invoice.balanceDue : invoice.totalAmount);
    setPaymentMethod('cash');
    setPaymentRef('');
    setPaymentNotes('');
  };

  // Submit Quick Payment
  const handlePaymentSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!paymentModalInvoice || paymentAmount <= 0) return;
    setIsSubmittingPayment(true);
    try {
      await recordPayment(paymentModalInvoice.id, {
        amount: Number(paymentAmount),
        paymentMethod,
        transactionRef: paymentRef,
        notes: paymentNotes
      });
      setPaymentModalInvoice(null);
    } catch (err: any) {
      alert('Failed to record payment: ' + (err.message || 'Unknown error'));
    } finally {
      setIsSubmittingPayment(false);
    }
  };

  // Submit Void / Cancel
  const handleVoidSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!voidModalInvoice || !cancelReason.trim()) return;
    setIsSubmittingVoid(true);
    try {
      await cancelInvoice(voidModalInvoice.id, cancelReason);
      setVoidModalInvoice(null);
      setCancelReason('');
    } catch (err: any) {
      alert('Failed to cancel invoice: ' + (err.message || 'Unknown error'));
    } finally {
      setIsSubmittingVoid(false);
    }
  };

  // Export Filtered Table to CSV
  const exportCsv = () => {
    const rows = filteredInvoices.map(inv => ({
      invoiceNumber: inv.invoiceNumber,
      date: inv.date,
      customerName: inv.customerName,
      customerType: inv.customerType,
      isB2B: inv.isB2B ? 'Yes' : 'No',
      customerGstin: inv.customerGstin || '',
      placeOfSupply: inv.placeOfSupplyStateName,
      category: inv.category,
      taxableAmount: inv.taxableAmount,
      cgstAmount: inv.cgstAmount,
      sgstAmount: inv.sgstAmount,
      igstAmount: inv.igstAmount,
      totalTax: inv.cgstAmount + inv.sgstAmount + inv.igstAmount,
      totalAmount: inv.totalAmount,
      paidAmount: inv.paidAmount,
      balanceDue: inv.balanceDue,
      paymentStatus: inv.paymentStatus,
      status: inv.status
    }));

    downloadCsv(
      rows,
      `Invoices_Register_${new Date().toISOString().split('T')[0]}.csv`,
      [
        { header: 'Invoice Number', key: 'invoiceNumber' },
        { header: 'Date', key: 'date' },
        { header: 'Customer / Patient', key: 'customerName' },
        { header: 'Type', key: 'customerType' },
        { header: 'B2B', key: 'isB2B' },
        { header: 'GSTIN', key: 'customerGstin' },
        { header: 'Place of Supply', key: 'placeOfSupply' },
        { header: 'Category', key: 'category' },
        { header: 'Taxable Val (₹)', key: 'taxableAmount' },
        { header: 'CGST (₹)', key: 'cgstAmount' },
        { header: 'SGST (₹)', key: 'sgstAmount' },
        { header: 'IGST (₹)', key: 'igstAmount' },
        { header: 'Total GST (₹)', key: 'totalTax' },
        { header: 'Grand Total (₹)', key: 'totalAmount' },
        { header: 'Paid (₹)', key: 'paidAmount' },
        { header: 'Balance Due (₹)', key: 'balanceDue' },
        { header: 'Payment Status', key: 'paymentStatus' },
        { header: 'Invoice Status', key: 'status' }
      ]
    );
  };

  return (
    <div className="space-y-6">
      {/* Top Banner / Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-slate-200/80 shadow-sm">
        <div>
          <div className="flex items-center gap-2">
            <Receipt className="w-6 h-6 text-indigo-600" />
            <h1 className="text-2xl font-bold text-slate-900">Invoices & Receipts</h1>
          </div>
          <p className="text-sm text-slate-500 mt-1">
            Manage patient OPD, pharmacy sales, B2B hospital invoices, and tax collections.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={exportCsv}
            disabled={filteredInvoices.length === 0}
            className="inline-flex items-center gap-2 px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-sm font-semibold transition-colors disabled:opacity-50"
            title="Export filtered records to CSV"
          >
            <Download className="w-4 h-4" />
            <span>Export CSV</span>
          </button>

          <button
            onClick={onNewInvoice}
            className="inline-flex items-center gap-2 px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-sm font-semibold shadow-sm hover:shadow transition-all"
          >
            <Plus className="w-4 h-4" />
            <span>Create Invoice</span>
          </button>
        </div>
      </div>

      {/* Quick Summary Pill Bar */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-xl border border-slate-200/80 shadow-sm">
          <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Filtered Invoices</p>
          <div className="mt-2 flex items-baseline justify-between">
            <span className="text-2xl font-bold text-slate-900">{filteredInvoices.length}</span>
            <span className="text-xs text-slate-500">of {invoices.length} total</span>
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200/80 shadow-sm">
          <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Total Value</p>
          <div className="mt-2 flex items-baseline justify-between">
            <span className="text-2xl font-bold text-slate-900">{formatInr(stats.totalInvoiced)}</span>
            <span className="text-xs text-indigo-600 font-medium">GST: {formatInr(stats.totalGst)}</span>
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200/80 shadow-sm">
          <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Collected Amount</p>
          <div className="mt-2 flex items-baseline justify-between">
            <span className="text-2xl font-bold text-emerald-600">{formatInr(stats.totalPaid)}</span>
            <span className="text-xs text-emerald-700 font-medium bg-emerald-50 px-2 py-0.5 rounded-full">
              {stats.totalInvoiced > 0 ? `${Math.round((stats.totalPaid / stats.totalInvoiced) * 100)}%` : '0%'}
            </span>
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200/80 shadow-sm">
          <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Outstanding Due</p>
          <div className="mt-2 flex items-baseline justify-between">
            <span className={`text-2xl font-bold ${stats.totalBalanceDue > 0 ? 'text-amber-600' : 'text-slate-900'}`}>
              {formatInr(stats.totalBalanceDue)}
            </span>
            {stats.totalBalanceDue > 0 && (
              <span className="text-xs text-amber-700 font-medium bg-amber-50 px-2 py-0.5 rounded-full">
                Pending
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Filters Toolbar */}
      <div className="bg-white p-4 rounded-xl border border-slate-200/80 shadow-sm space-y-3">
        <div className="flex flex-col md:flex-row gap-3">
          {/* Search Box */}
          <div className="relative flex-1">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search by invoice #, customer name, mobile, or GSTIN..."
              className="w-full pl-9 pr-4 py-2 border border-slate-200 rounded-lg text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600"
            />
            {searchTerm && (
              <button
                onClick={() => setSearchTerm('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>

          {/* Status Filter */}
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as any)}
            className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
          >
            <option value="all">All Statuses</option>
            <option value="issued">Issued</option>
            <option value="draft">Draft</option>
            <option value="credit_note_issued">Credit Note Issued</option>
            <option value="cancelled">Cancelled (Void)</option>
          </select>

          {/* Payment Status Filter */}
          <select
            value={paymentFilter}
            onChange={(e) => setPaymentFilter(e.target.value as any)}
            className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
          >
            <option value="all">All Payment Statuses</option>
            <option value="paid">Paid</option>
            <option value="partial">Partial</option>
            <option value="unpaid">Unpaid</option>
            <option value="refunded">Refunded</option>
          </select>

          {/* Category Filter */}
          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value as any)}
            className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
          >
            <option value="all">All Categories</option>
            <option value="opd_consultation">OPD Consultation</option>
            <option value="pharmacy">Pharmacy</option>
            <option value="lab_test">Diagnostics & Lab</option>
            <option value="procedure">Clinical Procedure</option>
            <option value="room_rent">Room / Bed Rent</option>
            <option value="general_medical">General Medical</option>
          </select>

          {/* Customer Type Filter */}
          <select
            value={customerTypeFilter}
            onChange={(e) => setCustomerTypeFilter(e.target.value as any)}
            className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
          >
            <option value="all">B2B & B2C</option>
            <option value="b2c">B2C Patients Only</option>
            <option value="b2b">B2B Registered Businesses</option>
          </select>
        </div>
      </div>

      {/* Invoice Table */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden">
        {filteredInvoices.length === 0 ? (
          <div className="p-12 text-center">
            <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto text-slate-400 mb-4">
              <Receipt className="w-8 h-8" />
            </div>
            <h3 className="text-lg font-bold text-slate-800">No Invoices Found</h3>
            <p className="text-sm text-slate-500 mt-1 max-w-sm mx-auto">
              {searchTerm || statusFilter !== 'all' || paymentFilter !== 'all' 
                ? 'Try clearing or modifying your search and filter criteria.'
                : 'Create your first GST-compliant invoice for patient consultation, pharmacy, or diagnostic services.'}
            </p>
            <div className="mt-6 flex justify-center gap-3">
              {(searchTerm || statusFilter !== 'all' || paymentFilter !== 'all') && (
                <button
                  onClick={() => {
                    setSearchTerm('');
                    setStatusFilter('all');
                    setPaymentFilter('all');
                    setCategoryFilter('all');
                    setCustomerTypeFilter('all');
                  }}
                  className="px-4 py-2 text-sm font-semibold text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-xl"
                >
                  Clear Filters
                </button>
              )}
              <button
                onClick={onNewInvoice}
                className="inline-flex items-center gap-2 px-5 py-2 text-sm font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl"
              >
                <Plus className="w-4 h-4" />
                <span>Create Invoice</span>
              </button>
            </div>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-sm">
              <thead>
                <tr className="bg-slate-50/75 border-b border-slate-200 text-xs font-semibold text-slate-500 uppercase tracking-wider">
                  <th className="py-3.5 px-4 cursor-pointer select-none" onClick={() => {
                    if (sortField === 'invoiceNumber') setSortAsc(!sortAsc);
                    else { setSortField('invoiceNumber'); setSortAsc(false); }
                  }}>
                    <div className="flex items-center gap-1.5">
                      <span>Invoice #</span>
                      <ArrowUpDown className="w-3.5 h-3.5 text-slate-400" />
                    </div>
                  </th>
                  <th className="py-3.5 px-4 cursor-pointer select-none" onClick={() => {
                    if (sortField === 'date') setSortAsc(!sortAsc);
                    else { setSortField('date'); setSortAsc(false); }
                  }}>
                    <div className="flex items-center gap-1.5">
                      <span>Date</span>
                      <ArrowUpDown className="w-3.5 h-3.5 text-slate-400" />
                    </div>
                  </th>
                  <th className="py-3.5 px-4">Customer / Patient</th>
                  <th className="py-3.5 px-4">Category</th>
                  <th className="py-3.5 px-4 text-right">Taxable</th>
                  <th className="py-3.5 px-4 text-right">GST Total</th>
                  <th className="py-3.5 px-4 text-right cursor-pointer select-none" onClick={() => {
                    if (sortField === 'totalAmount') setSortAsc(!sortAsc);
                    else { setSortField('totalAmount'); setSortAsc(false); }
                  }}>
                    <div className="flex items-center justify-end gap-1.5">
                      <span>Grand Total</span>
                      <ArrowUpDown className="w-3.5 h-3.5 text-slate-400" />
                    </div>
                  </th>
                  <th className="py-3.5 px-4 text-center">Payment</th>
                  <th className="py-3.5 px-4 text-center">Status</th>
                  <th className="py-3.5 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredInvoices.map((inv) => {
                  const isCancelled = inv.status === 'cancelled';
                  const isPaid = inv.paymentStatus === 'paid';
                  const isPartial = inv.paymentStatus === 'partial';

                  return (
                    <tr 
                      key={inv.id} 
                      className={`hover:bg-slate-50/70 transition-colors ${isCancelled ? 'opacity-60 bg-slate-50/40' : ''}`}
                    >
                      {/* Invoice Number */}
                      <td className="py-3.5 px-4 font-mono font-medium text-slate-900">
                        <button
                          onClick={() => onSelectInvoice(inv)}
                          className="hover:text-indigo-600 hover:underline flex items-center gap-1.5 font-bold"
                        >
                          <span>{inv.invoiceNumber}</span>
                          {inv.isB2B && (
                            <span className="text-[10px] bg-purple-100 text-purple-700 font-sans font-bold px-1.5 py-0.5 rounded">
                              B2B
                            </span>
                          )}
                        </button>
                      </td>

                      {/* Date */}
                      <td className="py-3.5 px-4 text-slate-600 whitespace-nowrap">
                        {inv.date}
                      </td>

                      {/* Customer / Patient */}
                      <td className="py-3.5 px-4">
                        <div className="font-semibold text-slate-800">
                          {inv.customerName}
                        </div>
                        <div className="text-xs text-slate-400 flex items-center gap-2 mt-0.5">
                          {inv.customerPhone && <span>{inv.customerPhone}</span>}
                          {inv.customerGstin && (
                            <span className="font-mono text-[11px] text-purple-600 font-medium">
                              GSTIN: {inv.customerGstin}
                            </span>
                          )}
                        </div>
                      </td>

                      {/* Category */}
                      <td className="py-3.5 px-4">
                        <span className="inline-flex items-center px-2 py-0.5 rounded-md text-xs font-medium bg-slate-100 text-slate-700 capitalize">
                          {inv.category.replace('_', ' ')}
                        </span>
                      </td>

                      {/* Taxable */}
                      <td className="py-3.5 px-4 text-right font-medium text-slate-600">
                        {formatInr(inv.taxableAmount)}
                      </td>

                      {/* GST Total */}
                      <td className="py-3.5 px-4 text-right text-xs">
                        <div className="font-semibold text-slate-700">
                          {formatInr(inv.cgstAmount + inv.sgstAmount + inv.igstAmount)}
                        </div>
                        <div className="text-[11px] text-slate-400">
                          {inv.igstAmount > 0 ? 'IGST' : 'CGST+SGST'}
                        </div>
                      </td>

                      {/* Grand Total */}
                      <td className="py-3.5 px-4 text-right">
                        <div className="font-bold text-slate-900">
                          {formatInr(inv.totalAmount)}
                        </div>
                        {inv.balanceDue > 0 && !isCancelled && (
                          <div className="text-xs text-rose-600 font-medium">
                            Due: {formatInr(inv.balanceDue)}
                          </div>
                        )}
                      </td>

                      {/* Payment Status Badge */}
                      <td className="py-3.5 px-4 text-center">
                        {isPaid ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-800">
                            <CheckCircle2 className="w-3 h-3" />
                            Paid
                          </span>
                        ) : isPartial ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-100 text-amber-800">
                            <Clock className="w-3 h-3" />
                            Partial
                          </span>
                        ) : inv.paymentStatus === 'refunded' ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-purple-100 text-purple-800">
                            <RotateCcw className="w-3 h-3" />
                            Refunded
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-rose-100 text-rose-800">
                            <AlertCircle className="w-3 h-3" />
                            Unpaid
                          </span>
                        )}
                      </td>

                      {/* Status Badge */}
                      <td className="py-3.5 px-4 text-center">
                        {isCancelled ? (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-bold bg-rose-50 text-rose-700 line-through">
                            Void / Cancelled
                          </span>
                        ) : inv.status === 'credit_note_issued' ? (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-bold bg-purple-50 text-purple-700">
                            Credit Note
                          </span>
                        ) : inv.status === 'draft' ? (
                          <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-slate-100 text-slate-600">
                            Draft
                          </span>
                        ) : (
                          <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold bg-sky-50 text-sky-700">
                            Issued
                          </span>
                        )}
                      </td>

                      {/* Action buttons */}
                      <td className="py-3.5 px-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          {/* View Invoice */}
                          <button
                            onClick={() => onSelectInvoice(inv)}
                            className="p-1.5 text-slate-500 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
                            title="View / Print Invoice"
                          >
                            <Eye className="w-4 h-4" />
                          </button>

                          {/* Quick Pay Button */}
                          {!isCancelled && inv.balanceDue > 0 && (
                            <button
                              onClick={() => openPaymentModal(inv)}
                              className="p-1.5 text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50 rounded-lg transition-colors"
                              title="Record Payment"
                            >
                              <IndianRupee className="w-4 h-4" />
                            </button>
                          )}

                          {/* Issue Credit Note */}
                          {!isCancelled && inv.status !== 'draft' && (
                            <button
                              onClick={() => onIssueCreditNote(inv)}
                              className="p-1.5 text-purple-600 hover:text-purple-700 hover:bg-purple-50 rounded-lg transition-colors"
                              title="Issue Credit Note / Sales Return"
                            >
                              <RotateCcw className="w-4 h-4" />
                            </button>
                          )}

                          {/* Cancel Invoice */}
                          {!isCancelled && inv.status !== 'cancelled' && (
                            <button
                              onClick={() => {
                                setVoidModalInvoice(inv);
                                setCancelReason('');
                              }}
                              className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                              title="Cancel / Void Invoice"
                            >
                              <Ban className="w-4 h-4" />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Quick Record Payment Modal */}
      {paymentModalInvoice && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full shadow-2xl border border-slate-200 overflow-hidden animate-in fade-in zoom-in-95">
            <div className="p-5 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
              <div className="flex items-center gap-2">
                <div className="w-9 h-9 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
                  <CreditCard className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-slate-800">Record Payment</h3>
                  <p className="text-xs text-slate-500 font-mono">Invoice #{paymentModalInvoice.invoiceNumber}</p>
                </div>
              </div>
              <button
                onClick={() => setPaymentModalInvoice(null)}
                className="text-slate-400 hover:text-slate-600 p-1"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handlePaymentSubmit} className="p-6 space-y-4">
              <div className="p-3 bg-emerald-50/50 border border-emerald-100 rounded-xl flex items-center justify-between">
                <div>
                  <span className="text-xs text-emerald-700 block">Balance Pending</span>
                  <span className="text-lg font-bold text-emerald-800">
                    {formatInr(paymentModalInvoice.balanceDue)}
                  </span>
                </div>
                <div className="text-right">
                  <span className="text-xs text-slate-500 block">Total Invoice</span>
                  <span className="text-sm font-semibold text-slate-700">
                    {formatInr(paymentModalInvoice.totalAmount)}
                  </span>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Amount Received (₹) *
                </label>
                <input
                  type="number"
                  step="0.01"
                  min="0.01"
                  max={paymentModalInvoice.balanceDue}
                  required
                  value={paymentAmount}
                  onChange={(e) => setPaymentAmount(parseFloat(e.target.value) || 0)}
                  className="w-full px-3.5 py-2.5 border border-slate-200 rounded-xl text-lg font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Payment Method *
                </label>
                <select
                  value={paymentMethod}
                  onChange={(e) => setPaymentMethod(e.target.value as any)}
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                >
                  <option value="cash">Cash</option>
                  <option value="upi">UPI / QR Code</option>
                  <option value="card">Debit / Credit Card</option>
                  <option value="bank_transfer">Bank Transfer (NEFT/IMPS)</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Transaction / UTR Reference No.
                </label>
                <input
                  type="text"
                  placeholder="e.g. UPI Ref / Card Last 4 / Cheque #"
                  value={paymentRef}
                  onChange={(e) => setPaymentRef(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Notes
                </label>
                <input
                  type="text"
                  placeholder="Optional payment notes"
                  value={paymentNotes}
                  onChange={(e) => setPaymentNotes(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div className="pt-2 flex gap-3">
                <button
                  type="button"
                  onClick={() => setPaymentModalInvoice(null)}
                  className="flex-1 px-4 py-2.5 border border-slate-200 text-slate-600 rounded-xl text-sm font-semibold hover:bg-slate-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmittingPayment || paymentAmount <= 0}
                  className="flex-1 px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-sm font-semibold transition-colors disabled:opacity-50"
                >
                  {isSubmittingPayment ? 'Saving...' : 'Record Payment'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Cancel / Void Invoice Modal */}
      {voidModalInvoice && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full shadow-2xl border border-slate-200 overflow-hidden animate-in fade-in zoom-in-95">
            <div className="p-5 border-b border-slate-100 flex items-center justify-between bg-rose-50/50">
              <div className="flex items-center gap-2">
                <div className="w-9 h-9 rounded-xl bg-rose-100 text-rose-600 flex items-center justify-center">
                  <Ban className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-rose-900">Cancel & Void Invoice</h3>
                  <p className="text-xs text-rose-700 font-mono">Invoice #{voidModalInvoice.invoiceNumber}</p>
                </div>
              </div>
              <button
                onClick={() => setVoidModalInvoice(null)}
                className="text-slate-400 hover:text-slate-600 p-1"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleVoidSubmit} className="p-6 space-y-4">
              <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-xs text-amber-800 leading-relaxed">
                <strong>Important Legal Compliance:</strong> Under Indian GST regulations, voiding an issued invoice leaves an audit trail in the GST Sales Register. The tax liability will be nullified, and the cancellation reason will be permanently archived.
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Reason for Cancellation *
                </label>
                <textarea
                  rows={3}
                  required
                  value={cancelReason}
                  onChange={(e) => setCancelReason(e.target.value)}
                  placeholder="e.g. Data entry error, duplicate invoice, patient treatment cancelled..."
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-rose-500"
                />
              </div>

              <div className="pt-2 flex gap-3">
                <button
                  type="button"
                  onClick={() => setVoidModalInvoice(null)}
                  className="flex-1 px-4 py-2.5 border border-slate-200 text-slate-600 rounded-xl text-sm font-semibold hover:bg-slate-50"
                >
                  Dismiss
                </button>
                <button
                  type="submit"
                  disabled={isSubmittingVoid || !cancelReason.trim()}
                  className="flex-1 px-4 py-2.5 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-sm font-semibold transition-colors disabled:opacity-50"
                >
                  {isSubmittingVoid ? 'Cancelling...' : 'Confirm Void'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
