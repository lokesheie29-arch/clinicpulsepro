import React, { useState, useMemo } from 'react';
import {
  PlusCircle,
  FileText,
  Printer,
  Download,
  CheckCircle2,
  AlertTriangle,
  Clock,
  Building2,
  Calendar,
  Search,
  Truck,
  Eye,
  ShieldCheck,
  X
} from 'lucide-react';
import { useProcurement } from '../../context/ProcurementContext';
import { useAppState } from '../../context/AppStateContext';
import { PurchaseOrder } from '../../types/procurement';
import { useUser } from '@clerk/react';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';
import confetti from 'canvas-confetti';

export const PurchaseOrders = ({ onOpenGrn }: { onOpenGrn?: (poId: string) => void }) => {
  const { purchaseOrders, approvePurchaseOrder, cancelPurchaseOrder } = useProcurement();
  const { user } = useUser();

  const [statusFilter, setStatusFilter] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedPoForView, setSelectedPoForView] = useState<PurchaseOrder | null>(null);
  const [isGeneratingPdf, setIsGeneratingPdf] = useState(false);

  const hospitalName =
    (user?.unsafeMetadata?.clinicName as string) ||
    localStorage.getItem('clinicpulse_clinic_name') ||
    'CLINICPULSE PRO HEALTHCARE CENTER';
  const hospitalAddress =
    (user?.unsafeMetadata?.clinicAddress as string) ||
    localStorage.getItem('clinicpulse_clinic_address') ||
    'No.29, Kamarajar Street, Pallavan Nagar, TNHB, Kancheepuram, Tamil Nadu. 631501';
  const hospitalGst =
    (user?.unsafeMetadata?.gstNumber as string) ||
    localStorage.getItem('clinicpulse_clinic_gst') ||
    '33ABCDE1234F1Z5';
  const hospitalPhone =
    (user?.unsafeMetadata?.hospitalPhone as string) ||
    localStorage.getItem('clinicpulse_clinic_phone') ||
    '+91 7200124136';

  const filteredPOs = useMemo(() => {
    return purchaseOrders.filter(po => {
      if (statusFilter !== 'All' && po.status !== statusFilter) return false;
      if (searchQuery) {
        const q = searchQuery.toLowerCase();
        const matches =
          po.poNumber.toLowerCase().includes(q) ||
          po.supplierName.toLowerCase().includes(q) ||
          po.supplierGstin.toLowerCase().includes(q) ||
          po.items.some(i => i.itemName.toLowerCase().includes(q));
        if (!matches) return false;
      }
      return true;
    });
  }, [purchaseOrders, statusFilter, searchQuery]);

  const handleDownloadPdf = async (po: PurchaseOrder) => {
    setIsGeneratingPdf(true);
    try {
      const element = document.getElementById('printable-purchase-order');
      if (element) {
        const canvas = await html2canvas(element, { scale: 2, useCORS: true, logging: false });
        const imgData = canvas.toDataURL('image/png');
        const pdf = new jsPDF('p', 'mm', 'a4');
        const pdfWidth = pdf.internal.pageSize.getWidth();
        const pdfHeight = (canvas.height * pdfWidth) / canvas.width;
        pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight);
        pdf.save(`${po.poNumber}_PurchaseOrder.pdf`);
      }
    } catch (err) {
      console.error('Failed to generate PDF:', err);
    } finally {
      setIsGeneratingPdf(false);
    }
  };

  return (
    <div className="space-y-6">

      {/* Header Toolbar */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-xl font-extrabold text-navy-900">Purchase Order (PO) Management</h2>
          <p className="text-xs text-slate-500">Official binding purchase orders, supplier acknowledgements, and PDF dispatch.</p>
        </div>
      </div>

      {/* Search & Filters */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-white p-3.5 rounded-xl border border-slate-200">
        <div className="flex items-center gap-2 flex-1 min-w-[220px]">
          <Search className="h-4 w-4 text-slate-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            placeholder="Search PO number, supplier, medicine..."
            className="w-full text-xs outline-none bg-transparent"
          />
        </div>

        <div className="flex items-center gap-2 text-xs">
          <span className="text-slate-400 font-medium">Status:</span>
          <select
            value={statusFilter}
            onChange={e => setStatusFilter(e.target.value)}
            className="border border-slate-200 rounded-lg p-1.5 outline-none bg-slate-50 font-medium"
          >
            <option value="All">All Statuses</option>
            <option value="Approved">Approved</option>
            <option value="Issued">Issued</option>
            <option value="Partially Delivered">Partially Delivered</option>
            <option value="Delivered">Delivered</option>
            <option value="Cancelled">Cancelled</option>
          </select>
        </div>
      </div>

      {/* PO Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left">
            <thead className="bg-slate-50 text-slate-500 uppercase tracking-wider font-semibold border-b border-slate-200">
              <tr>
                <th className="px-5 py-3.5">PO Number</th>
                <th className="px-4 py-3.5">Supplier Details</th>
                <th className="px-4 py-3.5">PO Date</th>
                <th className="px-4 py-3.5">Expected Delivery</th>
                <th className="px-4 py-3.5 text-center">Fulfillment Progress</th>
                <th className="px-4 py-3.5 text-right">Total Value (₹)</th>
                <th className="px-4 py-3.5 text-center">Status</th>
                <th className="px-5 py-3.5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredPOs.map(po => {
                const totalOrd = po.items.reduce((a, b) => a + b.requestedQty, 0);
                const recSummary = po.deliveredQuantitySummary || { totalReceivedQty: 0 };
                const pct = totalOrd > 0 ? Math.round((recSummary.totalReceivedQty / totalOrd) * 100) : 0;

                return (
                  <tr key={po.id} className="hover:bg-slate-50/70 transition-colors">
                    <td className="px-5 py-4 font-bold text-navy-900">
                      {po.poNumber}
                      {po.revisionNumber > 0 && <span className="text-[10px] text-slate-400 font-normal ml-1">R{po.revisionNumber}</span>}
                      <div className="text-[10px] text-teal-700 font-medium">{po.department}</div>
                    </td>

                    <td className="px-4 py-4">
                      <div className="font-semibold text-slate-800">{po.supplierName}</div>
                      <div className="text-[10px] text-slate-400 font-mono">GSTIN: {po.supplierGstin}</div>
                    </td>

                    <td className="px-4 py-4 text-slate-600">{po.poDate}</td>
                    <td className="px-4 py-4 font-medium text-slate-800">{po.expectedDeliveryDate}</td>

                    {/* Progress */}
                    <td className="px-4 py-4 text-center">
                      <div className="w-24 mx-auto">
                        <div className="flex justify-between text-[10px] text-slate-500 font-medium mb-1">
                          <span>{recSummary.totalReceivedQty} rec</span>
                          <span>{totalOrd}</span>
                        </div>
                        <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden">
                          <div
                            className={`h-full rounded-full ${pct === 100 ? 'bg-emerald-500' : 'bg-teal-600'}`}
                            style={{ width: `${pct}%` }}
                          />
                        </div>
                      </div>
                    </td>

                    <td className="px-4 py-4 text-right font-extrabold text-teal-800">
                      ₹{po.totalAmount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                    </td>

                    <td className="px-4 py-4 text-center">
                      <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold ${
                        po.status === 'Approved' || po.status === 'Issued'
                          ? 'bg-blue-100 text-blue-800 border border-blue-200'
                          : po.status === 'Delivered' || po.status === 'Closed'
                          ? 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                          : po.status === 'Partially Delivered'
                          ? 'bg-amber-100 text-amber-800 border border-amber-200'
                          : 'bg-slate-100 text-slate-700'
                      }`}>
                        {po.status}
                      </span>
                    </td>

                    <td className="px-5 py-4 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          onClick={() => setSelectedPoForView(po)}
                          className="px-2.5 py-1 rounded-lg text-xs font-semibold bg-slate-100 hover:bg-slate-200 text-slate-700 flex items-center gap-1"
                        >
                          <Eye className="h-3.5 w-3.5" />
                          <span>View PO</span>
                        </button>

                        {(po.status === 'Approved' || po.status === 'Issued' || po.status === 'Partially Delivered') && onOpenGrn && (
                          <button
                            onClick={() => onOpenGrn(po.id)}
                            className="px-2.5 py-1 rounded-lg text-xs font-bold bg-teal-600 hover:bg-teal-700 text-white shadow-xs"
                          >
                            Receive Goods →
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
      </div>

      {/* ── OFFICIAL PURCHASE ORDER DOCUMENT / PRINT MODAL ── */}
      {selectedPoForView && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-3xl overflow-hidden border border-slate-200 max-h-[95vh] flex flex-col">
            {/* Modal Header */}
            <div className="px-6 py-3.5 border-b border-slate-200 bg-slate-50 flex justify-between items-center print:hidden">
              <div className="flex items-center gap-2">
                <FileText className="h-5 w-5 text-teal-600" />
                <span className="font-bold text-navy-900 text-sm">Official Purchase Order — {selectedPoForView.poNumber}</span>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => handleDownloadPdf(selectedPoForView)}
                  disabled={isGeneratingPdf}
                  className="flex items-center gap-1 text-xs font-bold text-teal-700 bg-teal-50 hover:bg-teal-100 px-3 py-1.5 rounded-lg border border-teal-200"
                >
                  <Download className="h-3.5 w-3.5" />
                  <span>{isGeneratingPdf ? 'Generating...' : 'Download PDF'}</span>
                </button>
                <button
                  onClick={() => window.print()}
                  className="flex items-center gap-1 text-xs font-bold text-slate-700 bg-slate-100 hover:bg-slate-200 px-3 py-1.5 rounded-lg border border-slate-300"
                >
                  <Printer className="h-3.5 w-3.5" />
                  <span>Print PO</span>
                </button>
                <button onClick={() => setSelectedPoForView(null)} className="text-slate-400 font-bold text-xl ml-2">×</button>
              </div>
            </div>

            {/* Document Content (Exact Printable PO Format) */}
            <div className="p-8 overflow-y-auto flex-1 font-sans text-xs bg-white" id="printable-purchase-order">
              {/* Header Box */}
              <div className="border-b-2 border-slate-900 pb-4 mb-4 flex justify-between items-start">
                <div>
                  <h1 className="text-xl font-extrabold text-navy-900 uppercase tracking-wide">{hospitalName}</h1>
                  <p className="text-[11px] text-slate-600 mt-0.5">{hospitalAddress}</p>
                  <p className="text-[11px] text-slate-600 font-mono">GSTIN: {hospitalGst} &nbsp;|&nbsp; Helpline: {hospitalPhone}</p>
                </div>
                <div className="text-right">
                  <span className="px-3 py-1 bg-navy-900 text-white font-extrabold text-sm rounded tracking-wider uppercase inline-block mb-1">
                    PURCHASE ORDER
                  </span>
                  <div className="font-mono font-bold text-slate-800 text-sm">PO #: {selectedPoForView.poNumber}</div>
                  <div className="text-slate-500 text-[11px]">Date: {selectedPoForView.poDate}</div>
                </div>
              </div>

              {/* Vendor & Delivery Schedule Grid */}
              <div className="grid grid-cols-2 gap-4 border border-slate-300 rounded-xl p-3 mb-4 bg-slate-50/50">
                <div>
                  <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block mb-1">VENDOR / SUPPLIER DETAILS:</span>
                  <div className="font-bold text-navy-900 text-xs">{selectedPoForView.supplierName}</div>
                  <div className="text-[11px] text-slate-600">{selectedPoForView.supplierAddress}</div>
                  <div className="text-[11px] text-slate-700 font-mono mt-1">GSTIN: <strong>{selectedPoForView.supplierGstin}</strong></div>
                  <div className="text-[11px] text-slate-600">Email: {selectedPoForView.supplierEmail} | Ph: {selectedPoForView.supplierPhone}</div>
                </div>

                <div className="border-l border-slate-300 pl-4 space-y-1">
                  <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block mb-1">DELIVERY &amp; BILLING SCHEDULE:</span>
                  <div><span className="text-slate-500">Expected Delivery:</span> <strong>{selectedPoForView.expectedDeliveryDate}</strong></div>
                  <div><span className="text-slate-500">Payment Terms:</span> <strong>{selectedPoForView.paymentTerms}</strong></div>
                  <div><span className="text-slate-500">Delivery Terms:</span> <strong>{selectedPoForView.deliveryTerms}</strong></div>
                  <div><span className="text-slate-500">Department:</span> <strong>{selectedPoForView.department} ({selectedPoForView.branch})</strong></div>
                </div>
              </div>

              {/* Line Items Table */}
              <table className="w-full border-collapse border border-slate-300 mb-4 text-xs">
                <thead>
                  <tr className="bg-slate-100 text-slate-700 font-bold uppercase text-[10px]">
                    <th className="border border-slate-300 p-2 text-center w-8">#</th>
                    <th className="border border-slate-300 p-2 text-left">Item Description</th>
                    <th className="border border-slate-300 p-2 text-center w-16">HSN</th>
                    <th className="border border-slate-300 p-2 text-center w-16">Qty</th>
                    <th className="border border-slate-300 p-2 text-right w-20">Unit Rate</th>
                    <th className="border border-slate-300 p-2 text-center w-12">GST</th>
                    <th className="border border-slate-300 p-2 text-right w-24">Total (₹)</th>
                  </tr>
                </thead>
                <tbody>
                  {selectedPoForView.items.map((item, idx) => (
                    <tr key={item.id} className="border-b border-slate-200">
                      <td className="border border-slate-300 p-2 text-center font-medium">{idx + 1}</td>
                      <td className="border border-slate-300 p-2">
                        <div className="font-bold text-slate-900">{item.itemName}</div>
                        {item.specifications && <div className="text-[10px] text-slate-500">{item.specifications}</div>}
                      </td>
                      <td className="border border-slate-300 p-2 text-center font-mono">{item.hsnCode}</td>
                      <td className="border border-slate-300 p-2 text-center font-bold">{item.requestedQty} {item.uom}</td>
                      <td className="border border-slate-300 p-2 text-right font-mono">₹{item.estimatedUnitPrice.toFixed(2)}</td>
                      <td className="border border-slate-300 p-2 text-center font-mono">{item.gstRate}%</td>
                      <td className="border border-slate-300 p-2 text-right font-bold font-mono">₹{item.totalAmount.toFixed(2)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>

              {/* Totals Breakdown */}
              <div className="flex justify-end mb-6">
                <div className="w-64 space-y-1.5 text-xs">
                  <div className="flex justify-between text-slate-600">
                    <span>Taxable Subtotal:</span>
                    <span className="font-mono font-medium">₹{selectedPoForView.subTotal.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-slate-600">
                    <span>CGST:</span>
                    <span className="font-mono font-medium">₹{selectedPoForView.cgstTotal.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-slate-600">
                    <span>SGST:</span>
                    <span className="font-mono font-medium">₹{selectedPoForView.sgstTotal.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-slate-600">
                    <span>Freight / Delivery:</span>
                    <span className="font-mono font-medium">₹{selectedPoForView.freightCharges.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between border-t-2 border-slate-900 pt-1.5 text-sm font-extrabold text-navy-900">
                    <span>GRAND TOTAL:</span>
                    <span className="text-teal-800 font-mono">₹{selectedPoForView.totalAmount.toFixed(2)}</span>
                  </div>
                </div>
              </div>

              {/* Signatures */}
              <div className="border-t border-slate-300 pt-6 mt-8 flex justify-between items-end text-xs">
                <div>
                  <div className="font-bold text-slate-800">Terms &amp; Acceptance:</div>
                  <div className="text-[10px] text-slate-500 max-w-sm mt-0.5">
                    {selectedPoForView.termsAndConditions}
                  </div>
                </div>

                <div className="text-center">
                  <div className="border-b border-slate-500 w-44 mb-1"></div>
                  <div className="font-bold text-slate-900">{selectedPoForView.authorizedSignatory}</div>
                  <div className="text-[10px] text-slate-500">Authorized Procurement Authority</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
