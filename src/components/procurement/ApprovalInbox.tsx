import React, { useState } from 'react';
import { 
  CheckCircle, 
  XCircle, 
  Clock, 
  FileText, 
  ShoppingCart, 
  FileSpreadsheet, 
  AlertTriangle,
  User,
  Building,
  IndianRupee,
  ShieldCheck,
  Eye,
  Search
} from 'lucide-react';
import { useProcurement } from '../../context/ProcurementContext';
import { PurchaseRequisition, PurchaseOrder, SupplierInvoiceRecord } from '../../types/procurement';

export const ApprovalInbox: React.FC = () => {
  const { 
    requisitions, 
    approveRequisition,
    rejectRequisition,
    purchaseOrders, 
    approvePurchaseOrder,
    cancelPurchaseOrder,
    supplierInvoices, 
    approveSupplierInvoiceForPayment 
  } = useProcurement();

  const [activeTab, setActiveTab] = useState<'all' | 'pr' | 'po' | 'invoice'>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [actionNotes, setActionNotes] = useState<Record<string, string>>({});
  const [processingId, setProcessingId] = useState<string | null>(null);
  const [selectedItem, setSelectedItem] = useState<{
    type: 'pr' | 'po' | 'invoice';
    data: PurchaseRequisition | PurchaseOrder | SupplierInvoiceRecord;
  } | null>(null);

  // Filter items pending approval
  const pendingPRs = requisitions.filter(r => r.status === 'Submitted');
  const pendingPOs = purchaseOrders.filter(p => p.status === 'Draft' || p.status === 'Pending Approval');
  const pendingInvoices = supplierInvoices.filter(i => i.status === 'Pending Match' || i.status === 'Discrepancy Flagged');

  const allPendingCount = pendingPRs.length + pendingPOs.length + pendingInvoices.length;

  const handlePrAction = async (id: string, action: 'approve' | 'reject', e?: React.MouseEvent) => {
    e?.stopPropagation();
    setProcessingId(id);
    const note = actionNotes[id] || (action === 'approve' ? 'Approved via Approval Inbox' : 'Rejected via Approval Inbox');
    try {
      if (action === 'approve') {
        approveRequisition(id, 'Dr. Sarah Smith (Medical Superintendent)', note);
      } else {
        rejectRequisition(id, note);
      }
    } finally {
      setProcessingId(null);
      if (selectedItem?.data.id === id) setSelectedItem(null);
    }
  };

  const handlePoAction = async (id: string, action: 'approve' | 'cancel', e?: React.MouseEvent) => {
    e?.stopPropagation();
    setProcessingId(id);
    const note = actionNotes[id] || (action === 'approve' ? 'Authorized PO release' : 'PO request rejected');
    try {
      if (action === 'approve') {
        approvePurchaseOrder(id, 'Finance Director');
      } else {
        cancelPurchaseOrder(id, note);
      }
    } finally {
      setProcessingId(null);
      if (selectedItem?.data.id === id) setSelectedItem(null);
    }
  };

  const handleInvoiceAction = async (id: string, action: 'approve' | 'dispute', e?: React.MouseEvent) => {
    e?.stopPropagation();
    setProcessingId(id);
    try {
      if (action === 'approve') {
        approveSupplierInvoiceForPayment(id);
      }
    } finally {
      setProcessingId(null);
      if (selectedItem?.data.id === id) setSelectedItem(null);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
        <div>
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-amber-50 text-amber-600 rounded-xl border border-amber-200">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-slate-800">Unified Approval Inbox</h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Multi-tier sign-off and verification queue for Requisitions, Purchase Orders, and Vendor Invoices
              </p>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <div className="px-4 py-2 bg-amber-100/70 border border-amber-300 rounded-xl flex items-center gap-2">
            <Clock className="w-4 h-4 text-amber-700 animate-pulse" />
            <span className="text-xs font-semibold text-amber-800">
              {allPendingCount} Total Decisions Pending
            </span>
          </div>
        </div>
      </div>

      {/* Tabs & Search */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="flex items-center gap-2 overflow-x-auto w-full sm:w-auto p-1 bg-slate-100 rounded-xl border border-slate-200">
          <button
            onClick={() => setActiveTab('all')}
            className={`px-4 py-2 text-xs font-semibold rounded-lg transition-all flex items-center gap-2 whitespace-nowrap ${
              activeTab === 'all' ? 'bg-white text-indigo-700 shadow-sm' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            All Pending ({allPendingCount})
          </button>
          <button
            onClick={() => setActiveTab('pr')}
            className={`px-4 py-2 text-xs font-semibold rounded-lg transition-all flex items-center gap-2 whitespace-nowrap ${
              activeTab === 'pr' ? 'bg-white text-indigo-700 shadow-sm' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <FileText className="w-3.5 h-3.5 text-blue-600" />
            Requisitions ({pendingPRs.length})
          </button>
          <button
            onClick={() => setActiveTab('po')}
            className={`px-4 py-2 text-xs font-semibold rounded-lg transition-all flex items-center gap-2 whitespace-nowrap ${
              activeTab === 'po' ? 'bg-white text-indigo-700 shadow-sm' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <ShoppingCart className="w-3.5 h-3.5 text-emerald-600" />
            Purchase Orders ({pendingPOs.length})
          </button>
          <button
            onClick={() => setActiveTab('invoice')}
            className={`px-4 py-2 text-xs font-semibold rounded-lg transition-all flex items-center gap-2 whitespace-nowrap ${
              activeTab === 'invoice' ? 'bg-white text-indigo-700 shadow-sm' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <FileSpreadsheet className="w-3.5 h-3.5 text-purple-600" />
            Vendor Invoices ({pendingInvoices.length})
          </button>
        </div>

        <div className="relative w-full sm:w-64">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search pending items..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-3 py-2 bg-white border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
        </div>
      </div>

      {/* Main Inbox List */}
      <div className="space-y-4">
        {/* Requisitions Section */}
        {(activeTab === 'all' || activeTab === 'pr') && pendingPRs.length > 0 && (
          <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm">
            <div className="px-5 py-3.5 bg-blue-50/60 border-b border-blue-100 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <FileText className="w-4 h-4 text-blue-600" />
                <h3 className="text-xs font-bold uppercase tracking-wider text-blue-900">
                  Purchase Requisitions Awaiting Approval ({pendingPRs.length})
                </h3>
              </div>
              <span className="text-[11px] text-blue-700 font-medium">Head of Department / Medical Superintendent Review</span>
            </div>
            <div className="divide-y divide-slate-100">
              {pendingPRs
                .filter(pr => 
                  pr.requisitionNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
                  pr.department.toLowerCase().includes(searchTerm.toLowerCase()) ||
                  pr.requestedBy.toLowerCase().includes(searchTerm.toLowerCase())
                )
                .map((pr) => (
                  <div key={pr.id} className="p-5 hover:bg-slate-50 transition-colors">
                    <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                      <div className="space-y-1.5 flex-1">
                        <div className="flex items-center gap-2.5 flex-wrap">
                          <span className="font-bold text-sm text-slate-900">{pr.requisitionNumber}</span>
                          <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                            pr.priority === 'Critical' ? 'bg-red-100 text-red-700 border border-red-200' :
                            pr.priority === 'Urgent' ? 'bg-amber-100 text-amber-700 border border-amber-200' :
                            'bg-slate-100 text-slate-700'
                          }`}>
                            {pr.priority} Priority
                          </span>
                          <span className="text-xs text-slate-500 flex items-center gap-1">
                            <Building className="w-3.5 h-3.5" /> {pr.department} ({pr.branch})
                          </span>
                          <span className="text-xs text-slate-500 flex items-center gap-1">
                            <User className="w-3.5 h-3.5" /> Req by: {pr.requestedBy}
                          </span>
                        </div>
                        <p className="text-xs text-slate-600 line-clamp-1 italic">
                          "{pr.businessJustification}"
                        </p>
                        <div className="flex items-center gap-4 text-xs text-slate-500 pt-1">
                          <span>Items: <strong>{pr.items.length} lines</strong> ({pr.items.map(i => i.itemName).join(', ')})</span>
                          <span>Required by: <strong>{pr.requiredDate}</strong></span>
                        </div>
                      </div>

                      <div className="flex flex-col sm:flex-row items-end sm:items-center gap-4">
                        <div className="text-right">
                          <div className="text-xs text-slate-400">Estimated Total</div>
                          <div className="text-base font-extrabold text-slate-900 flex items-center justify-end">
                            <IndianRupee className="w-3.5 h-3.5" />
                            {pr.estimatedTotal.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                          </div>
                        </div>

                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => setSelectedItem({ type: 'pr', data: pr })}
                            className="p-2 border border-slate-200 hover:bg-slate-100 rounded-xl text-slate-600 text-xs flex items-center gap-1"
                            title="Inspect Details"
                          >
                            <Eye className="w-4 h-4" />
                          </button>
                          <button
                            disabled={processingId === pr.id}
                            onClick={(e) => handlePrAction(pr.id, 'approve', e)}
                            className="px-3 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-semibold flex items-center gap-1.5 shadow-sm transition-all"
                          >
                            <CheckCircle className="w-3.5 h-3.5" />
                            Approve
                          </button>
                          <button
                            disabled={processingId === pr.id}
                            onClick={(e) => handlePrAction(pr.id, 'reject', e)}
                            className="px-3 py-2 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-all"
                          >
                            <XCircle className="w-3.5 h-3.5" />
                            Reject
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
            </div>
          </div>
        )}

        {/* Purchase Orders Section */}
        {(activeTab === 'all' || activeTab === 'po') && pendingPOs.length > 0 && (
          <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm">
            <div className="px-5 py-3.5 bg-emerald-50/60 border-b border-emerald-100 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <ShoppingCart className="w-4 h-4 text-emerald-600" />
                <h3 className="text-xs font-bold uppercase tracking-wider text-emerald-900">
                  Purchase Orders Awaiting Sign-off ({pendingPOs.length})
                </h3>
              </div>
              <span className="text-[11px] text-emerald-700 font-medium">Finance Controller & Commercial Review</span>
            </div>
            <div className="divide-y divide-slate-100">
              {pendingPOs
                .filter(po => 
                  po.poNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
                  po.supplierName.toLowerCase().includes(searchTerm.toLowerCase())
                )
                .map((po) => (
                  <div key={po.id} className="p-5 hover:bg-slate-50 transition-colors">
                    <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                      <div className="space-y-1.5 flex-1">
                        <div className="flex items-center gap-2.5 flex-wrap">
                          <span className="font-bold text-sm text-slate-900">{po.poNumber}</span>
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-800 border border-amber-200">
                            {po.status}
                          </span>
                          <span className="text-xs font-medium text-slate-700">
                            Vendor: <strong>{po.supplierName}</strong>
                          </span>
                          <span className="text-xs text-slate-500">
                            Payment: {po.paymentTerms}
                          </span>
                        </div>
                        <div className="flex items-center gap-4 text-xs text-slate-500">
                          <span>Delivery to: <strong>{po.branch}</strong></span>
                          <span>Expected date: <strong>{po.expectedDeliveryDate}</strong></span>
                          <span>Items count: <strong>{po.items.length} items</strong></span>
                        </div>
                      </div>

                      <div className="flex flex-col sm:flex-row items-end sm:items-center gap-4">
                        <div className="text-right">
                          <div className="text-xs text-slate-400">Total Landed Amount</div>
                          <div className="text-base font-extrabold text-emerald-600 flex items-center justify-end">
                            <IndianRupee className="w-3.5 h-3.5" />
                            {po.totalAmount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                          </div>
                        </div>

                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => setSelectedItem({ type: 'po', data: po })}
                            className="p-2 border border-slate-200 hover:bg-slate-100 rounded-xl text-slate-600 text-xs flex items-center gap-1"
                            title="Inspect Details"
                          >
                            <Eye className="w-4 h-4" />
                          </button>
                          <button
                            disabled={processingId === po.id}
                            onClick={(e) => handlePoAction(po.id, 'approve', e)}
                            className="px-3 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-semibold flex items-center gap-1.5 shadow-sm transition-all"
                          >
                            <CheckCircle className="w-3.5 h-3.5" />
                            Sign & Approve
                          </button>
                          <button
                            disabled={processingId === po.id}
                            onClick={(e) => handlePoAction(po.id, 'cancel', e)}
                            className="px-3 py-2 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-all"
                          >
                            <XCircle className="w-3.5 h-3.5" />
                            Hold / Cancel
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
            </div>
          </div>
        )}

        {/* Vendor Invoices Section */}
        {(activeTab === 'all' || activeTab === 'invoice') && pendingInvoices.length > 0 && (
          <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm">
            <div className="px-5 py-3.5 bg-purple-50/60 border-b border-purple-100 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <FileSpreadsheet className="w-4 h-4 text-purple-600" />
                <h3 className="text-xs font-bold uppercase tracking-wider text-purple-900">
                  Vendor Invoices Under 3-Way Verification ({pendingInvoices.length})
                </h3>
              </div>
              <span className="text-[11px] text-purple-700 font-medium">Accounts Payable Final Clearance</span>
            </div>
            <div className="divide-y divide-slate-100">
              {pendingInvoices
                .filter(inv => 
                  inv.invoiceNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
                  inv.supplierName.toLowerCase().includes(searchTerm.toLowerCase())
                )
                .map((inv) => (
                  <div key={inv.id} className="p-5 hover:bg-slate-50 transition-colors">
                    <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                      <div className="space-y-1.5 flex-1">
                        <div className="flex items-center gap-2.5 flex-wrap">
                          <span className="font-bold text-sm text-slate-900">{inv.invoiceNumber}</span>
                          <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                            inv.status === 'Matched' ? 'bg-emerald-100 text-emerald-800' :
                            inv.status === 'Discrepancy Flagged' ? 'bg-amber-100 text-amber-800' :
                            'bg-blue-100 text-blue-800'
                          }`}>
                            Status: {inv.status}
                          </span>
                          <span className="text-xs font-medium text-slate-700">
                            Vendor: <strong>{inv.supplierName}</strong>
                          </span>
                          <span className="text-xs text-slate-500">
                            Ref PO: {inv.poNumber} | Ref GRN: {inv.grnNumber}
                          </span>
                        </div>
                        {inv.threeWayMatchResult.discrepancyNotes && (
                          <div className="flex items-center gap-1.5 text-xs text-amber-700 bg-amber-50 p-2 rounded-lg border border-amber-200">
                            <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
                            <span>{inv.threeWayMatchResult.discrepancyNotes}</span>
                          </div>
                        )}
                        <div className="flex items-center gap-4 text-xs text-slate-500">
                          <span>Dated: <strong>{inv.invoiceDate}</strong></span>
                          <span>Payment Due: <strong>{inv.dueDate}</strong></span>
                        </div>
                      </div>

                      <div className="flex flex-col sm:flex-row items-end sm:items-center gap-4">
                        <div className="text-right">
                          <div className="text-xs text-slate-400">Invoice Total</div>
                          <div className="text-base font-extrabold text-purple-700 flex items-center justify-end">
                            <IndianRupee className="w-3.5 h-3.5" />
                            {inv.totalInvoiceAmount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                          </div>
                        </div>

                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => setSelectedItem({ type: 'invoice', data: inv })}
                            className="p-2 border border-slate-200 hover:bg-slate-100 rounded-xl text-slate-600 text-xs flex items-center gap-1"
                            title="Inspect Details"
                          >
                            <Eye className="w-4 h-4" />
                          </button>
                          <button
                            disabled={processingId === inv.id}
                            onClick={(e) => handleInvoiceAction(inv.id, 'approve', e)}
                            className="px-3 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-semibold flex items-center gap-1.5 shadow-sm transition-all"
                          >
                            <CheckCircle className="w-3.5 h-3.5" />
                            Clear for AP
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
            </div>
          </div>
        )}

        {/* Empty State */}
        {allPendingCount === 0 && (
          <div className="text-center py-16 bg-white rounded-2xl border border-dashed border-slate-200">
            <div className="w-16 h-16 bg-emerald-50 text-emerald-600 rounded-full flex items-center justify-center mx-auto mb-3">
              <CheckCircle className="w-8 h-8" />
            </div>
            <h3 className="text-base font-bold text-slate-800">Inbox is completely up to date!</h3>
            <p className="text-xs text-slate-500 max-w-md mx-auto mt-1">
              There are no pending requisitions, purchase orders, or supplier invoices awaiting sign-off at this time.
            </p>
          </div>
        )}
      </div>

      {/* Inspect Modal */}
      {selectedItem && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[85vh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            <div className="px-6 py-4 bg-slate-900 text-white flex items-center justify-between">
              <div className="flex items-center gap-2">
                <FileText className="w-5 h-5 text-indigo-400" />
                <h3 className="font-bold text-sm">
                  Document Detail: {
                    selectedItem.type === 'pr' ? (selectedItem.data as PurchaseRequisition).requisitionNumber :
                    selectedItem.type === 'po' ? (selectedItem.data as PurchaseOrder).poNumber :
                    (selectedItem.data as SupplierInvoiceRecord).invoiceNumber
                  }
                </h3>
              </div>
              <button 
                onClick={() => setSelectedItem(null)}
                className="text-slate-400 hover:text-white p-1 rounded-lg"
              >
                ✕
              </button>
            </div>

            <div className="p-6 overflow-y-auto space-y-4 text-xs">
              <pre className="bg-slate-50 p-4 rounded-xl text-slate-700 overflow-x-auto border border-slate-200 font-mono text-[11px]">
                {JSON.stringify(selectedItem.data, null, 2)}
              </pre>
            </div>

            <div className="p-4 bg-slate-50 border-t border-slate-200 flex justify-end">
              <button
                onClick={() => setSelectedItem(null)}
                className="px-4 py-2 bg-slate-200 hover:bg-slate-300 text-slate-800 rounded-xl font-semibold text-xs"
              >
                Close Preview
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
