import React, { useState, useMemo } from 'react';
import { 
  FileText, 
  Download, 
  Printer, 
  ShieldCheck, 
  Filter, 
  Calendar, 
  CheckCircle2, 
  AlertTriangle, 
  Info, 
  TrendingUp, 
  Search, 
  RefreshCw,
  Building2,
  Table,
  Layers,
  RotateCcw,
  Scale
} from 'lucide-react';
import { useBilling } from '../../context/BillingContext';
import { 
  generateSalesRegister, 
  generateGstRateSummary, 
  generateB2bSummary, 
  generateHsnSummary, 
  generateCreditNoteRegister, 
  generateTaxLiabilitySummary, 
  generateReconciliationReport 
} from '../../lib/gstReportsGenerator';
import { downloadCsv } from '../../lib/billingService';
import { formatInr, getCurrentFinancialYear } from '../../lib/gstEngine';

type ReportTab = 
  | 'sales_register' 
  | 'gst_summary' 
  | 'b2b_b2c' 
  | 'hsn_summary' 
  | 'credit_notes' 
  | 'tax_liability' 
  | 'reconciliation';

export const GstReportsHub: React.FC = () => {
  const { invoices, creditNotes, dateFilter, setDateFilter } = useBilling();
  const [activeTab, setActiveTab] = useState<ReportTab>('sales_register');
  const [searchFilter, setSearchFilter] = useState('');

  // Generate Report Data based on active filter
  const salesRegister = useMemo(() => generateSalesRegister(invoices, dateFilter), [invoices, dateFilter]);
  const rateSummary = useMemo(() => generateGstRateSummary(invoices, dateFilter), [invoices, dateFilter]);
  const b2bSummary = useMemo(() => generateB2bSummary(invoices, dateFilter), [invoices, dateFilter]);
  const hsnSummary = useMemo(() => generateHsnSummary(invoices, dateFilter), [invoices, dateFilter]);
  const creditNoteRegister = useMemo(() => generateCreditNoteRegister(creditNotes, dateFilter), [creditNotes, dateFilter]);
  const taxLiability = useMemo(() => generateTaxLiabilitySummary(invoices, creditNotes, dateFilter), [invoices, creditNotes, dateFilter]);
  const reconciliation = useMemo(() => generateReconciliationReport(invoices, creditNotes, dateFilter), [invoices, creditNotes, dateFilter]);

  // CSV Export Handlers
  const handleExportSalesRegister = () => {
    const headers = [
      'Invoice Number', 'Invoice Date', 'Customer Name', 'Customer GSTIN', 'Customer Type',
      'Place of Supply', 'Tax Category', 'Supply Type', 'Subtotal', 'Discount',
      'Taxable Value', 'CGST', 'SGST', 'IGST', 'Total Tax', 'Round Off', 'Invoice Total',
      'Payment Status', 'Invoice Status'
    ];
    const rows = salesRegister.map(r => [
      r.invoiceNumber, r.invoiceDate, r.customerName, r.customerGstin, r.customerType,
      r.placeOfSupply, r.isInterState, r.supplyType, r.subTotal, r.discount,
      r.taxableValue, r.cgst, r.sgst, r.igst, r.totalTax, r.roundOff, r.invoiceTotal,
      r.paymentStatus, r.invoiceStatus
    ]);
    downloadCsv(`GSTR1_Sales_Register_${dateFilter.financialYear || 'FY'}`, headers, rows);
  };

  const handleExportHsnSummary = () => {
    const headers = ['HSN/SAC Code', 'Description', 'UQC', 'Total Quantity', 'Total Value', 'Taxable Value', 'CGST', 'SGST', 'IGST', 'Total Tax'];
    const rows = hsnSummary.map(r => [
      r.hsnSacCode, r.description, r.uqc, r.totalQuantity, r.totalValue, r.taxableValue, r.cgst, r.sgst, r.igst, r.totalTax
    ]);
    downloadCsv(`GSTR1_Table12_HSN_Summary_${dateFilter.financialYear || 'FY'}`, headers, rows);
  };

  const handleExportRateSummary = () => {
    const headers = ['GST Rate', 'Rate Label', 'Taxable Value', 'CGST', 'SGST', 'IGST', 'Total Tax', 'Items Count'];
    const rows = rateSummary.map(r => [
      `${r.rate}%`, r.rateLabel, r.taxableValue, r.cgst, r.sgst, r.igst, r.totalTax, r.itemCount
    ]);
    downloadCsv(`GST_Rate_Summary_${dateFilter.financialYear || 'FY'}`, headers, rows);
  };

  const handleExportCreditNotes = () => {
    const headers = [
      'Credit Note Number', 'Date', 'Original Invoice Number', 'Invoice Date', 'Customer Name',
      'Customer GSTIN', 'Reason', 'Taxable Adjustment', 'CGST Adjustment', 'SGST Adjustment',
      'IGST Adjustment', 'Total Refund Amount', 'Inventory Restocked', 'Refund Status'
    ];
    const rows = creditNoteRegister.map(r => [
      r.creditNoteNumber, r.date, r.invoiceNumber, r.invoiceDate, r.customerName,
      r.customerGstin, r.reason, r.taxableAdjustment, r.cgstAdjustment, r.sgstAdjustment,
      r.igstAdjustment, r.totalRefundAmount, r.stockRestocked, r.refundStatus
    ]);
    downloadCsv(`GSTR1_Table9B_Credit_Notes_${dateFilter.financialYear || 'FY'}`, headers, rows);
  };

  const filteredSalesRegister = useMemo(() => {
    if (!searchFilter.trim()) return salesRegister;
    const q = searchFilter.toLowerCase();
    return salesRegister.filter(r => 
      r.invoiceNumber.toLowerCase().includes(q) ||
      r.customerName.toLowerCase().includes(q) ||
      r.customerGstin.toLowerCase().includes(q)
    );
  }, [salesRegister, searchFilter]);

  return (
    <div className="space-y-6">
      {/* Top Banner with CA Readiness info */}
      <div className="bg-white p-5 rounded-3xl border border-slate-200 shadow-xs flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-lg font-extrabold text-slate-900 tracking-tight flex items-center gap-2">
              <ShieldCheck className="w-5 h-5 text-teal-600" />
              <span>GST Compliance & Audit Reports Hub</span>
            </h2>
            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-teal-50 text-teal-700 border border-teal-200">
              GSTR-1 & GSTR-3B Ready
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Export outward supply registers, rate summaries, HSN summaries, and audit reconciliation for your Chartered Accountant.
          </p>
        </div>

        <div className="flex items-center gap-2">
          {activeTab === 'sales_register' && (
            <button
              onClick={handleExportSalesRegister}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-teal-600 hover:bg-teal-700 text-white font-bold text-xs rounded-xl transition-all shadow-xs"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Export Sales Register (CSV)</span>
            </button>
          )}

          {activeTab === 'hsn_summary' && (
            <button
              onClick={handleExportHsnSummary}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-teal-600 hover:bg-teal-700 text-white font-bold text-xs rounded-xl transition-all shadow-xs"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Export HSN Summary (CSV)</span>
            </button>
          )}

          {activeTab === 'gst_summary' && (
            <button
              onClick={handleExportRateSummary}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-teal-600 hover:bg-teal-700 text-white font-bold text-xs rounded-xl transition-all shadow-xs"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Export Rate Summary (CSV)</span>
            </button>
          )}

          {activeTab === 'credit_notes' && (
            <button
              onClick={handleExportCreditNotes}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-purple-600 hover:bg-purple-700 text-white font-bold text-xs rounded-xl transition-all shadow-xs"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Export Credit Notes (CSV)</span>
            </button>
          )}

          <button
            onClick={() => window.print()}
            className="inline-flex items-center gap-1.5 px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl transition-colors"
          >
            <Printer className="w-3.5 h-3.5" />
            <span>Print Report</span>
          </button>
        </div>
      </div>

      {/* Tabs Bar */}
      <div className="flex items-center space-x-1 border-b border-slate-200 overflow-x-auto pb-1 text-xs">
        {[
          { id: 'sales_register', label: '1. Sales Register (GSTR-1)', icon: <Table className="w-3.5 h-3.5" /> },
          { id: 'gst_summary', label: '2. Rate-wise GST Summary', icon: <Layers className="w-3.5 h-3.5" /> },
          { id: 'b2b_b2c', label: '3. B2B vs B2C Split', icon: <Building2 className="w-3.5 h-3.5" /> },
          { id: 'hsn_summary', label: '4. HSN / SAC Summary', icon: <FileText className="w-3.5 h-3.5" /> },
          { id: 'credit_notes', label: '5. Credit Notes & Returns', icon: <RotateCcw className="w-3.5 h-3.5" /> },
          { id: 'tax_liability', label: '6. Tax Liability Summary', icon: <Scale className="w-3.5 h-3.5" /> },
          { id: 'reconciliation', label: '7. Audit & Reconciliation', icon: <AlertTriangle className="w-3.5 h-3.5" /> }
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as ReportTab)}
            className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl font-bold whitespace-nowrap transition-all ${
              activeTab === tab.id
                ? 'bg-slate-900 text-white shadow-xs'
                : 'text-slate-500 hover:text-slate-900 hover:bg-slate-100'
            }`}
          >
            {tab.icon}
            <span>{tab.label}</span>
          </button>
        ))}
      </div>

      {/* TAB 1: Sales Register (GSTR-1 Format) */}
      {activeTab === 'sales_register' && (
        <div className="bg-white rounded-3xl border border-slate-200 shadow-xs overflow-hidden space-y-4">
          <div className="p-4 border-b border-slate-100 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
            <div className="relative w-full sm:w-80">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
              <input
                type="text"
                placeholder="Search invoice #, customer, or GSTIN..."
                value={searchFilter}
                onChange={(e) => setSearchFilter(e.target.value)}
                className="w-full pl-9 pr-3 py-1.5 text-xs border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500"
              />
            </div>

            <p className="text-xs text-slate-400">
              Showing <strong>{filteredSalesRegister.length}</strong> tax invoices
            </p>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-500 font-bold uppercase border-b border-slate-100">
                <tr>
                  <th className="py-2.5 px-3">Invoice #</th>
                  <th className="py-2.5 px-2">Date</th>
                  <th className="py-2.5 px-3">Customer / GSTIN</th>
                  <th className="py-2.5 px-2">Category</th>
                  <th className="py-2.5 px-2">POS</th>
                  <th className="py-2.5 px-2 text-right">Taxable (₹)</th>
                  <th className="py-2.5 px-2 text-right">CGST</th>
                  <th className="py-2.5 px-2 text-right">SGST</th>
                  <th className="py-2.5 px-2 text-right">IGST</th>
                  <th className="py-2.5 px-3 text-right">Invoice Total (₹)</th>
                  <th className="py-2.5 px-2 text-center">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredSalesRegister.length === 0 ? (
                  <tr>
                    <td colSpan={11} className="py-8 text-center text-slate-400">
                      No invoices found for the selected period.
                    </td>
                  </tr>
                ) : (
                  filteredSalesRegister.map((row, idx) => (
                    <tr key={idx} className="hover:bg-slate-50/50">
                      <td className="py-2.5 px-3 font-mono font-bold text-slate-900">{row.invoiceNumber}</td>
                      <td className="py-2.5 px-2 text-slate-500">{row.invoiceDate}</td>
                      <td className="py-2.5 px-3">
                        <p className="font-semibold text-slate-900">{row.customerName}</p>
                        <p className="text-[10px] text-teal-700 font-mono">{row.customerGstin}</p>
                      </td>
                      <td className="py-2.5 px-2">
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 text-slate-700">
                          {row.customerType}
                        </span>
                      </td>
                      <td className="py-2.5 px-2 text-slate-600">{row.placeOfSupply}</td>
                      <td className="py-2.5 px-2 text-right font-medium">{formatInr(row.taxableValue)}</td>
                      <td className="py-2.5 px-2 text-right text-slate-600">{formatInr(row.cgst)}</td>
                      <td className="py-2.5 px-2 text-right text-slate-600">{formatInr(row.sgst)}</td>
                      <td className="py-2.5 px-2 text-right text-indigo-700 font-semibold">{formatInr(row.igst)}</td>
                      <td className="py-2.5 px-3 text-right font-black text-slate-900">{formatInr(row.invoiceTotal)}</td>
                      <td className="py-2.5 px-2 text-center">
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                          row.invoiceStatus.includes('CANCELLED')
                            ? 'bg-rose-50 text-rose-700'
                            : 'bg-emerald-50 text-emerald-700'
                        }`}>
                          {row.invoiceStatus}
                        </span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 2: Rate-wise GST Summary */}
      {activeTab === 'gst_summary' && (
        <div className="bg-white rounded-3xl border border-slate-200 shadow-xs overflow-hidden">
          <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
            <h3 className="font-bold text-sm text-slate-900">GST Slab-wise Tax Breakdowns</h3>
            <span className="text-xs text-slate-400">Classified across 0% (Exempt), 5%, 12%, 18%, 28%</span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-500 font-bold uppercase border-b border-slate-100">
                <tr>
                  <th className="py-3 px-4">Tax Slab Rate</th>
                  <th className="py-3 px-4 text-center">Line Items Count</th>
                  <th className="py-3 px-4 text-right">Taxable Value (₹)</th>
                  <th className="py-3 px-4 text-right">Central Tax (CGST)</th>
                  <th className="py-3 px-4 text-right">State Tax (SGST)</th>
                  <th className="py-3 px-4 text-right">Integrated Tax (IGST)</th>
                  <th className="py-3 px-4 text-right">Total Tax (₹)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {rateSummary.map((r) => (
                  <tr key={r.rate} className="hover:bg-slate-50/50">
                    <td className="py-3 px-4 font-bold text-slate-900">
                      <span className="inline-block w-16">{r.rate}%</span>
                      <span className="text-[11px] text-slate-500 font-normal">{r.rateLabel}</span>
                    </td>
                    <td className="py-3 px-4 text-center">{r.itemCount}</td>
                    <td className="py-3 px-4 text-right font-medium">{formatInr(r.taxableValue)}</td>
                    <td className="py-3 px-4 text-right text-slate-600">{formatInr(r.cgst)}</td>
                    <td className="py-3 px-4 text-right text-slate-600">{formatInr(r.sgst)}</td>
                    <td className="py-3 px-4 text-right text-indigo-700 font-semibold">{formatInr(r.igst)}</td>
                    <td className="py-3 px-4 text-right font-black text-teal-700">{formatInr(r.totalTax)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 3: B2B vs B2C Split */}
      {activeTab === 'b2b_b2c' && (
        <div className="space-y-6">
          {/* B2B Table */}
          <div className="bg-white rounded-3xl border border-slate-200 shadow-xs overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
              <div>
                <h3 className="font-bold text-sm text-slate-900">B2B Registered Sales (GSTR-1 Table 4A/4B)</h3>
                <p className="text-[11px] text-slate-400">Sales made to registered enterprises with valid recipient GSTIN</p>
              </div>
              <span className="px-2.5 py-1 bg-teal-50 text-teal-800 rounded-full text-xs font-bold">
                {b2bSummary.b2bList.length} B2B Invoices
              </span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 text-slate-500 font-bold uppercase border-b border-slate-100">
                  <tr>
                    <th className="py-2.5 px-3">Recipient GSTIN</th>
                    <th className="py-2.5 px-3">Business Name</th>
                    <th className="py-2.5 px-2">Invoice #</th>
                    <th className="py-2.5 px-2">Date</th>
                    <th className="py-2.5 px-2">POS</th>
                    <th className="py-2.5 px-2 text-right">Taxable</th>
                    <th className="py-2.5 px-2 text-right">CGST</th>
                    <th className="py-2.5 px-2 text-right">SGST</th>
                    <th className="py-2.5 px-2 text-right">IGST</th>
                    <th className="py-2.5 px-3 text-right">Total (₹)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {b2bSummary.b2bList.length === 0 ? (
                    <tr>
                      <td colSpan={10} className="py-6 text-center text-slate-400">
                        No B2B invoices recorded in this period.
                      </td>
                    </tr>
                  ) : (
                    b2bSummary.b2bList.map((row, idx) => (
                      <tr key={idx} className="hover:bg-slate-50/50">
                        <td className="py-2.5 px-3 font-mono font-bold text-teal-700">{row.gstin}</td>
                        <td className="py-2.5 px-3 font-semibold text-slate-900">{row.customerName}</td>
                        <td className="py-2.5 px-2 font-mono">{row.invoiceNumber}</td>
                        <td className="py-2.5 px-2 text-slate-500">{row.invoiceDate}</td>
                        <td className="py-2.5 px-2 text-slate-600">{row.placeOfSupply}</td>
                        <td className="py-2.5 px-2 text-right font-medium">{formatInr(row.taxableValue)}</td>
                        <td className="py-2.5 px-2 text-right text-slate-600">{formatInr(row.cgst)}</td>
                        <td className="py-2.5 px-2 text-right text-slate-600">{formatInr(row.sgst)}</td>
                        <td className="py-2.5 px-2 text-right text-indigo-700">{formatInr(row.igst)}</td>
                        <td className="py-2.5 px-3 text-right font-bold text-slate-900">{formatInr(row.invoiceTotal)}</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* B2C Small Summary Card */}
          <div className="bg-slate-50 p-6 rounded-3xl border border-slate-200 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div>
              <h4 className="font-extrabold text-sm text-slate-900">B2C Small Supplies (GSTR-1 Table 7)</h4>
              <p className="text-xs text-slate-500 mt-0.5">
                Consolidated intra-state and inter-state patient walk-in bills below ₹2.5 Lakh.
              </p>
            </div>
            <div className="text-right">
              <span className="text-2xl font-black text-slate-900">{formatInr(b2bSummary.b2cSmallTotal)}</span>
              <p className="text-[11px] text-slate-400">{b2bSummary.b2cSmallCount} Patient Invoices</p>
            </div>
          </div>
        </div>
      )}

      {/* TAB 4: HSN / SAC Summary (GSTR-1 Table 12) */}
      {activeTab === 'hsn_summary' && (
        <div className="bg-white rounded-3xl border border-slate-200 shadow-xs overflow-hidden">
          <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
            <div>
              <h3 className="font-bold text-sm text-slate-900">HSN & SAC Summary (GSTR-1 Table 12)</h3>
              <p className="text-[11px] text-slate-400">Classified by Harmonized System of Nomenclature & Service Accounting Codes</p>
            </div>
            <span className="text-xs text-slate-400">Required for official CA filing</span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-500 font-bold uppercase border-b border-slate-100">
                <tr>
                  <th className="py-3 px-3">HSN / SAC</th>
                  <th className="py-3 px-4">Commodity / Service Description</th>
                  <th className="py-3 px-2 text-center">UQC</th>
                  <th className="py-3 px-2 text-center">Total Qty</th>
                  <th className="py-3 px-3 text-right">Total Value (₹)</th>
                  <th className="py-3 px-3 text-right">Taxable Value (₹)</th>
                  <th className="py-3 px-2 text-right">CGST</th>
                  <th className="py-3 px-2 text-right">SGST</th>
                  <th className="py-3 px-2 text-right">IGST</th>
                  <th className="py-3 px-3 text-right">Total Tax (₹)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {hsnSummary.length === 0 ? (
                  <tr>
                    <td colSpan={10} className="py-6 text-center text-slate-400">
                      No HSN items recorded in this period.
                    </td>
                  </tr>
                ) : (
                  hsnSummary.map((h, idx) => (
                    <tr key={idx} className="hover:bg-slate-50/50">
                      <td className="py-3 px-3 font-mono font-bold text-slate-900">{h.hsnSacCode}</td>
                      <td className="py-3 px-4 text-slate-700">{h.description}</td>
                      <td className="py-3 px-2 text-center font-mono text-slate-500">{h.uqc}</td>
                      <td className="py-3 px-2 text-center font-bold">{h.totalQuantity}</td>
                      <td className="py-3 px-3 text-right font-medium">{formatInr(h.totalValue)}</td>
                      <td className="py-3 px-3 text-right font-bold text-slate-900">{formatInr(h.taxableValue)}</td>
                      <td className="py-3 px-2 text-right text-slate-600">{formatInr(h.cgst)}</td>
                      <td className="py-3 px-2 text-right text-slate-600">{formatInr(h.sgst)}</td>
                      <td className="py-3 px-2 text-right text-indigo-700">{formatInr(h.igst)}</td>
                      <td className="py-3 px-3 text-right font-bold text-teal-700">{formatInr(h.totalTax)}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 5: Credit Notes Register */}
      {activeTab === 'credit_notes' && (
        <div className="bg-white rounded-3xl border border-slate-200 shadow-xs overflow-hidden">
          <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
            <div>
              <h3 className="font-bold text-sm text-slate-900">Credit Notes & Sales Return Register (GSTR-1 Table 9B)</h3>
              <p className="text-[11px] text-slate-400">Reversal of outward tax liability for medicine returns and invoice corrections</p>
            </div>
            <span className="text-xs text-purple-700 font-bold bg-purple-50 px-2.5 py-1 rounded-full border border-purple-200">
              {creditNoteRegister.length} Credit Notes Issued
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-500 font-bold uppercase border-b border-slate-100">
                <tr>
                  <th className="py-2.5 px-3">Credit Note #</th>
                  <th className="py-2.5 px-2">Date</th>
                  <th className="py-2.5 px-2">Orig Invoice</th>
                  <th className="py-2.5 px-3">Customer</th>
                  <th className="py-2.5 px-2">Reason</th>
                  <th className="py-2.5 px-2 text-right">Taxable Adj</th>
                  <th className="py-2.5 px-2 text-right">CGST</th>
                  <th className="py-2.5 px-2 text-right">SGST</th>
                  <th className="py-2.5 px-2 text-right">IGST</th>
                  <th className="py-2.5 px-3 text-right">Refund Total</th>
                  <th className="py-2.5 px-2 text-center">Restocked</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {creditNoteRegister.length === 0 ? (
                  <tr>
                    <td colSpan={11} className="py-8 text-center text-slate-400">
                      No credit notes issued in this period.
                    </td>
                  </tr>
                ) : (
                  creditNoteRegister.map((cn, idx) => (
                    <tr key={idx} className="hover:bg-slate-50/50">
                      <td className="py-2.5 px-3 font-mono font-bold text-purple-700">{cn.creditNoteNumber}</td>
                      <td className="py-2.5 px-2 text-slate-500">{cn.date}</td>
                      <td className="py-2.5 px-2 font-mono text-slate-700">{cn.invoiceNumber}</td>
                      <td className="py-2.5 px-3 font-semibold text-slate-900">{cn.customerName}</td>
                      <td className="py-2.5 px-2 text-slate-600">{cn.reason}</td>
                      <td className="py-2.5 px-2 text-right font-medium text-rose-600">- {formatInr(cn.taxableAdjustment)}</td>
                      <td className="py-2.5 px-2 text-right text-slate-600">{formatInr(cn.cgstAdjustment)}</td>
                      <td className="py-2.5 px-2 text-right text-slate-600">{formatInr(cn.sgstAdjustment)}</td>
                      <td className="py-2.5 px-2 text-right text-slate-600">{formatInr(cn.igstAdjustment)}</td>
                      <td className="py-2.5 px-3 text-right font-black text-slate-900">{formatInr(cn.totalRefundAmount)}</td>
                      <td className="py-2.5 px-2 text-center">
                        <span className="text-[10px] font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full">
                          {cn.stockRestocked}
                        </span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 6: Tax Liability Summary (GSTR-3B) */}
      {activeTab === 'tax_liability' && (
        <div className="bg-white rounded-3xl border border-slate-200 shadow-xs p-6 sm:p-8 space-y-6">
          <div className="border-b border-slate-100 pb-4 flex items-center justify-between">
            <div>
              <h3 className="text-base font-extrabold text-slate-900 flex items-center gap-2">
                <Scale className="w-5 h-5 text-teal-600" />
                <span>Sales-Side Output Tax Liability Summary (GSTR-3B Format)</span>
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Section 3.1 Outward supplies and tax payable calculations.
              </p>
            </div>
            <span className="text-[10px] font-bold text-amber-800 bg-amber-50 border border-amber-200 px-3 py-1 rounded-full">
              Sales-Side Estimation
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border border-slate-200 rounded-2xl overflow-hidden">
              <thead className="bg-slate-100 text-slate-700 font-bold uppercase">
                <tr>
                  <th className="py-3 px-4">Nature of Supply (GSTR-3B 3.1)</th>
                  <th className="py-3 px-4 text-right">Total Taxable Value (₹)</th>
                  <th className="py-3 px-4 text-right">Integrated Tax (IGST)</th>
                  <th className="py-3 px-4 text-right">Central Tax (CGST)</th>
                  <th className="py-3 px-4 text-right">State/UT Tax (SGST)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium">
                <tr>
                  <td className="py-3.5 px-4 font-bold text-slate-900">
                    (a) Outward Taxable Supplies (Medicines, Goods, Deluxe Beds)
                  </td>
                  <td className="py-3.5 px-4 text-right font-bold text-slate-900">{formatInr(taxLiability.taxableOutwardSupplies)}</td>
                  <td className="py-3.5 px-4 text-right text-indigo-700">{formatInr(taxLiability.outputIgst)}</td>
                  <td className="py-3.5 px-4 text-right text-slate-700">{formatInr(taxLiability.outputCgst)}</td>
                  <td className="py-3.5 px-4 text-right text-slate-700">{formatInr(taxLiability.outputSgst)}</td>
                </tr>
                <tr>
                  <td className="py-3.5 px-4 font-bold text-slate-900">
                    (c) Other Outward Supplies (Exempt Healthcare Consultations & Lab)
                  </td>
                  <td className="py-3.5 px-4 text-right font-bold text-teal-700">{formatInr(taxLiability.exemptNilRatedSupplies)}</td>
                  <td className="py-3.5 px-4 text-right text-slate-400">₹0.00</td>
                  <td className="py-3.5 px-4 text-right text-slate-400">₹0.00</td>
                  <td className="py-3.5 px-4 text-right text-slate-400">₹0.00</td>
                </tr>
                <tr className="bg-purple-50/50 text-purple-900">
                  <td className="py-3.5 px-4 font-bold">
                    Less: Credit Note Reversals (Sales Returns)
                  </td>
                  <td className="py-3.5 px-4 text-right font-bold">-</td>
                  <td className="py-3.5 px-4 text-right">- {formatInr(taxLiability.creditNoteIgstAdjustment)}</td>
                  <td className="py-3.5 px-4 text-right">- {formatInr(taxLiability.creditNoteCgstAdjustment)}</td>
                  <td className="py-3.5 px-4 text-right">- {formatInr(taxLiability.creditNoteSgstAdjustment)}</td>
                </tr>
                <tr className="bg-slate-900 text-white font-bold">
                  <td className="py-4 px-4 text-sm font-black">
                    Net Output Tax Payable
                  </td>
                  <td className="py-4 px-4 text-right text-teal-300 font-black text-sm">
                    {formatInr(taxLiability.totalOutwardSupplies)}
                  </td>
                  <td className="py-4 px-4 text-right text-indigo-300 font-black">{formatInr(taxLiability.netIgstLiability)}</td>
                  <td className="py-4 px-4 text-right text-teal-300 font-black">{formatInr(taxLiability.netCgstLiability)}</td>
                  <td className="py-4 px-4 text-right text-teal-300 font-black">{formatInr(taxLiability.netSgstLiability)}</td>
                </tr>
              </tbody>
            </table>
          </div>

          <div className="bg-amber-50 border border-amber-200 p-4 rounded-2xl text-xs text-amber-900 flex items-start gap-2.5">
            <Info className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
            <p className="leading-relaxed">
              <strong>Statutory Compliance Notice:</strong> This summary reflects the gross and net output tax liability calculated from finalized client sales invoices and credit notes. To compute the final net GST payable to the Government of India, your accountant must offset eligible Input Tax Credit (ITC) from medical purchase invoices and reverse charge mechanisms.
            </p>
          </div>
        </div>
      )}

      {/* TAB 7: Audit & Reconciliation */}
      {activeTab === 'reconciliation' && (
        <div className="bg-white rounded-3xl border border-slate-200 shadow-xs p-6 sm:p-8 space-y-6">
          <div className="border-b border-slate-100 pb-4 flex items-center justify-between">
            <div>
              <h3 className="text-base font-extrabold text-slate-900 flex items-center gap-2">
                <AlertTriangle className="w-5 h-5 text-teal-600" />
                <span>Financial Reconciliation & Integrity Audit</span>
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">Automated detection of payment gaps, voided invoices, and ledger differences.</p>
            </div>
            <span className="text-xs font-bold text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-200">
              Audit Engine Active
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100">
              <span className="text-[10px] font-bold text-slate-400 uppercase">Invoiced Total</span>
              <p className="text-xl font-black text-slate-900 mt-1">{formatInr(reconciliation.totalInvoiced)}</p>
            </div>
            <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100">
              <span className="text-[10px] font-bold text-slate-400 uppercase">Payment Realized</span>
              <p className="text-xl font-black text-emerald-700 mt-1">{formatInr(reconciliation.totalCollected)}</p>
            </div>
            <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100">
              <span className="text-[10px] font-bold text-slate-400 uppercase">Receivables Gap</span>
              <p className="text-xl font-black text-rose-600 mt-1">{formatInr(reconciliation.totalReceivables)}</p>
            </div>
          </div>

          <div>
            <h4 className="font-extrabold text-xs text-slate-800 uppercase tracking-wider mb-3">
              Automated Discrepancy Checks ({reconciliation.discrepancies.length})
            </h4>

            {reconciliation.discrepancies.length === 0 ? (
              <div className="p-6 bg-emerald-50 border border-emerald-200 rounded-2xl text-xs text-emerald-800 flex items-center gap-3">
                <CheckCircle2 className="w-6 h-6 text-emerald-600 shrink-0" />
                <div>
                  <p className="font-bold">Zero Ledger Discrepancies Found!</p>
                  <p className="text-[11px] text-emerald-700 mt-0.5">
                    All invoice line items, rounding policies, tax splits, and payment receipt logs reconcile 100% accurately.
                  </p>
                </div>
              </div>
            ) : (
              <div className="space-y-3">
                {reconciliation.discrepancies.map((d, idx) => (
                  <div key={idx} className="p-4 bg-amber-50 border border-amber-200 rounded-2xl text-xs text-amber-900 flex items-start gap-3">
                    <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
                    <div>
                      <p className="font-bold">{d.title}</p>
                      <p className="text-amber-800 mt-0.5">{d.description}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
