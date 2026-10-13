import React, { useState, useMemo } from 'react';
import {
  PlusCircle,
  Clock,
  CheckCircle2,
  XCircle,
  FileText,
  AlertTriangle,
  Search,
  Filter,
  Trash2,
  Calendar,
  Building2,
  User,
  ArrowRight
} from 'lucide-react';
import { useProcurement } from '../../context/ProcurementContext';
import { useAppState } from '../../context/AppStateContext';
import { PurchaseRequisition, ProcurementItemLine, RequisitionPriority, ItemProcurementCategory } from '../../types/procurement';
import { v4 as uuidv4 } from 'uuid';
import { useUser } from '@clerk/react';
import confetti from 'canvas-confetti';

export const PurchaseRequisitions = ({ onCreateRfq }: { onCreateRfq?: (req: PurchaseRequisition) => void }) => {
  const { requisitions, createRequisition, approveRequisition, rejectRequisition, suppliers } = useProcurement();
  const { orgType, medicines } = useAppState();
  const { user } = useUser();

  const [statusFilter, setStatusFilter] = useState('All');
  const [priorityFilter, setPriorityFilter] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [selectedReq, setSelectedReq] = useState<PurchaseRequisition | null>(null);

  // Form State
  const [department, setDepartment] = useState('Pharmacy Dispensary');
  const [branch, setBranch] = useState('Main Hospital Center');
  const [requiredDate, setRequiredDate] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() + 7);
    return d.toISOString().split('T')[0];
  });
  const [priority, setPriority] = useState<RequisitionPriority>('Normal');
  const [businessJustification, setBusinessJustification] = useState('');
  const [preferredSupplierId, setPreferredSupplierId] = useState('');

  // Items State
  const [items, setItems] = useState<ProcurementItemLine[]>([
    {
      id: uuidv4(),
      itemName: '',
      category: 'Medicines & Pharmaceuticals',
      hsnCode: '3004',
      uom: 'Strips',
      requestedQty: 50,
      estimatedUnitPrice: 20.00,
      gstRate: 12,
      totalAmount: 1120.00,
      specifications: ''
    }
  ]);

  // Categories based on orgType
  const defaultCategory: ItemProcurementCategory = orgType === 'laboratory'
    ? 'Reagents & Test Kits'
    : orgType === 'pharmacy'
    ? 'Finished Pharmaceuticals'
    : 'Medicines & Pharmaceuticals';

  const addItemRow = () => {
    setItems([
      ...items,
      {
        id: uuidv4(),
        itemName: '',
        category: defaultCategory,
        hsnCode: '3004',
        uom: 'Strips',
        requestedQty: 10,
        estimatedUnitPrice: 10,
        gstRate: 12,
        totalAmount: 112,
        specifications: ''
      }
    ]);
  };

  const updateItemRow = (id: string, field: keyof ProcurementItemLine, value: any) => {
    setItems(items.map(item => {
      if (item.id === id) {
        const updated = { ...item, [field]: value };
        if (field === 'requestedQty' || field === 'estimatedUnitPrice' || field === 'gstRate') {
          const qty = field === 'requestedQty' ? Number(value) : item.requestedQty;
          const rate = field === 'estimatedUnitPrice' ? Number(value) : item.estimatedUnitPrice;
          const gst = field === 'gstRate' ? Number(value) : item.gstRate;
          const sub = qty * rate;
          updated.totalAmount = sub + (sub * gst) / 100;
        }
        return updated;
      }
      return item;
    }));
  };

  const removeItemRow = (id: string) => {
    if (items.length > 1) {
      setItems(items.filter(i => i.id !== id));
    }
  };

  // Pre-fill from existing low-stock inventory item
  const handleSelectPreloadMedicine = (rowId: string, medName: string) => {
    const med = medicines.find(m => m.brandName === medName);
    if (med) {
      updateItemRow(rowId, 'itemName', med.brandName);
      updateItemRow(rowId, 'estimatedUnitPrice', med.costPrice);
      updateItemRow(rowId, 'gstRate', med.gstRate);
      updateItemRow(rowId, 'hsnCode', med.hsn);
    }
  };

  // Compute Totals
  const totalSubTotal = items.reduce((sum, item) => sum + (item.requestedQty * item.estimatedUnitPrice), 0);
  const totalEstimatedAmount = items.reduce((sum, item) => sum + item.totalAmount, 0);
  const totalTax = totalEstimatedAmount - totalSubTotal;

  const handleSubmitRequisition = () => {
    if (!businessJustification.trim()) {
      alert('Please provide a business justification for this requisition.');
      return;
    }

    if (items.some(i => !i.itemName.trim() || i.requestedQty <= 0)) {
      alert('Please ensure all item rows have valid item names and quantities.');
      return;
    }

    const nextNumber = `PR-${new Date().getFullYear()}-${String(requisitions.length + 1).padStart(4, '0')}`;
    const preferredSupplier = suppliers.find(s => s.id === preferredSupplierId);

    const userName = user?.firstName
      ? `${user.firstName} ${user.lastName || ''}`.trim()
      : user?.primaryEmailAddress?.emailAddress?.split('@')[0] || 'Staff Member';

    const newReq: PurchaseRequisition = {
      id: `pr-${uuidv4().substring(0, 8)}`,
      requisitionNumber: nextNumber,
      organizationId: 'org-default',
      branch,
      department,
      requestedBy: userName,
      requestedByEmail: user?.primaryEmailAddress?.emailAddress || 'staff@clinicpulsepro.com',
      requestDate: new Date().toISOString().split('T')[0],
      requiredDate,
      priority,
      status: 'Submitted',
      businessJustification,
      preferredSupplierId,
      preferredSupplierName: preferredSupplier?.legalName,
      items,
      subTotal: totalSubTotal,
      estimatedTax: totalTax,
      estimatedTotal: totalEstimatedAmount,
      auditTrail: [
        {
          action: 'Requisition Created & Submitted',
          performedBy: userName,
          timestamp: new Date().toISOString(),
          notes: businessJustification
        }
      ]
    };

    createRequisition(newReq);
    confetti({ particleCount: 70, spread: 60, origin: { y: 0.6 } });
    setShowCreateModal(false);
  };

  const filteredRequisitions = useMemo(() => {
    return requisitions.filter(req => {
      if (statusFilter !== 'All' && req.status !== statusFilter) return false;
      if (priorityFilter !== 'All' && req.priority !== priorityFilter) return false;
      if (searchQuery) {
        const q = searchQuery.toLowerCase();
        const matches =
          req.requisitionNumber.toLowerCase().includes(q) ||
          req.requestedBy.toLowerCase().includes(q) ||
          req.department.toLowerCase().includes(q) ||
          req.items.some(i => i.itemName.toLowerCase().includes(q));
        if (!matches) return false;
      }
      return true;
    });
  }, [requisitions, statusFilter, priorityFilter, searchQuery]);

  return (
    <div className="space-y-6">

      {/* ── Header Toolbar ── */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-xl font-extrabold text-navy-900">Purchase Requisitions (PR)</h2>
          <p className="text-xs text-slate-500">Raise, verify, and approve procurement requests with role authorization.</p>
        </div>

        <button
          onClick={() => setShowCreateModal(true)}
          className="flex items-center space-x-2 bg-teal-600 hover:bg-teal-700 text-white px-4 py-2.5 rounded-xl text-xs font-bold transition-all shadow-sm"
        >
          <PlusCircle className="h-4 w-4" />
          <span>Raise New Requisition</span>
        </button>
      </div>

      {/* ── Filters Bar ── */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-white p-3.5 rounded-xl border border-slate-200">
        <div className="flex items-center gap-2 flex-1 min-w-[200px]">
          <Search className="h-4 w-4 text-slate-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            placeholder="Search PR number, item, requested by..."
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
            <option value="Submitted">Submitted</option>
            <option value="Approved">Approved</option>
            <option value="Rejected">Rejected</option>
            <option value="PO Created">PO Created</option>
          </select>

          <span className="text-slate-400 font-medium ml-2">Priority:</span>
          <select
            value={priorityFilter}
            onChange={e => setPriorityFilter(e.target.value)}
            className="border border-slate-200 rounded-lg p-1.5 outline-none bg-slate-50 font-medium"
          >
            <option value="All">All Priorities</option>
            <option value="Normal">Normal</option>
            <option value="Urgent">Urgent</option>
            <option value="Critical">Critical</option>
          </select>
        </div>
      </div>

      {/* ── Requisitions Table ── */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left">
            <thead className="bg-slate-50 text-slate-500 uppercase tracking-wider font-semibold border-b border-slate-200">
              <tr>
                <th className="px-5 py-3.5">PR Number</th>
                <th className="px-4 py-3.5">Dept &amp; Requested By</th>
                <th className="px-4 py-3.5">Required Date</th>
                <th className="px-4 py-3.5">Items Summary</th>
                <th className="px-4 py-3.5 text-center">Priority</th>
                <th className="px-4 py-3.5 text-right">Est. Total (₹)</th>
                <th className="px-4 py-3.5 text-center">Status</th>
                <th className="px-5 py-3.5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredRequisitions.map(req => (
                <tr key={req.id} className="hover:bg-slate-50/70 transition-colors">
                  <td className="px-5 py-4 font-bold text-navy-900">
                    {req.requisitionNumber}
                    <div className="text-[10px] text-slate-400 font-normal">{req.requestDate}</div>
                  </td>
                  <td className="px-4 py-4">
                    <div className="font-semibold text-slate-800">{req.department}</div>
                    <div className="text-[10px] text-slate-500">{req.requestedBy}</div>
                  </td>
                  <td className="px-4 py-4 text-slate-700">{req.requiredDate}</td>
                  <td className="px-4 py-4">
                    <div className="font-medium text-slate-800">
                      {req.items[0]?.itemName}
                      {req.items.length > 1 && <span className="text-teal-600 font-bold ml-1">+{req.items.length - 1} more</span>}
                    </div>
                    <div className="text-[10px] text-slate-400">Total Qty: {req.items.reduce((a, b) => a + b.requestedQty, 0)} units</div>
                  </td>
                  <td className="px-4 py-4 text-center">
                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                      req.priority === 'Critical'
                        ? 'bg-red-100 text-red-700 border border-red-200'
                        : req.priority === 'Urgent'
                        ? 'bg-amber-100 text-amber-700 border border-amber-200'
                        : 'bg-slate-100 text-slate-700'
                    }`}>
                      {req.priority}
                    </span>
                  </td>
                  <td className="px-4 py-4 text-right font-extrabold text-teal-700">
                    ₹{req.estimatedTotal.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                  </td>
                  <td className="px-4 py-4 text-center">
                    <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold ${
                      req.status === 'Approved' || req.status === 'PO Created'
                        ? 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                        : req.status === 'Submitted' || req.status === 'Pending Approval'
                        ? 'bg-amber-100 text-amber-800 border border-amber-200'
                        : req.status === 'Rejected'
                        ? 'bg-red-100 text-red-800 border border-red-200'
                        : 'bg-slate-100 text-slate-700'
                    }`}>
                      {req.status}
                    </span>
                  </td>
                  <td className="px-5 py-4 text-right">
                    <div className="flex items-center justify-end gap-1.5">
                      <button
                        onClick={() => setSelectedReq(req)}
                        className="px-2.5 py-1 rounded-lg text-xs font-semibold bg-slate-100 hover:bg-slate-200 text-slate-700"
                      >
                        Details
                      </button>

                      {req.status === 'Submitted' && (
                        <>
                          <button
                            onClick={() => approveRequisition(req.id, 'Procurement Director')}
                            className="px-2.5 py-1 rounded-lg text-xs font-semibold bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200"
                            title="Approve Requisition"
                          >
                            Approve
                          </button>
                          <button
                            onClick={() => {
                              const reason = prompt('Please enter rejection reason:');
                              if (reason) rejectRequisition(req.id, reason);
                            }}
                            className="px-2 py-1 rounded-lg text-xs font-semibold text-red-600 hover:bg-red-50"
                            title="Reject"
                          >
                            Reject
                          </button>
                        </>
                      )}

                      {req.status === 'Approved' && onCreateRfq && (
                        <button
                          onClick={() => onCreateRfq(req)}
                          className="px-2.5 py-1 rounded-lg text-xs font-semibold bg-teal-600 hover:bg-teal-700 text-white shadow-xs"
                        >
                          Create RFQ →
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
              {filteredRequisitions.length === 0 && (
                <tr>
                  <td colSpan={8} className="px-6 py-12 text-center text-slate-400">
                    No purchase requisitions found. Click "Raise New Requisition" to begin.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* ── CREATE REQUISITION MODAL ── */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-3xl overflow-hidden border border-slate-200 max-h-[90vh] flex flex-col">
            <div className="px-6 py-4 border-b border-slate-200 flex justify-between items-center bg-slate-50">
              <div>
                <h3 className="text-lg font-bold text-navy-900">Raise Purchase Requisition</h3>
                <p className="text-xs text-slate-500">Provide required quantities and business justification for review.</p>
              </div>
              <button onClick={() => setShowCreateModal(false)} className="text-slate-400 font-bold text-xl">×</button>
            </div>

            <div className="p-6 space-y-5 overflow-y-auto flex-1">
              {/* Department & Branch */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">Branch *</label>
                  <select
                    value={branch}
                    onChange={e => setBranch(e.target.value)}
                    className="w-full p-2 border border-slate-200 rounded-xl text-xs outline-none bg-white font-medium"
                  >
                    <option>Main Hospital Center</option>
                    <option>Clinical Pathology Lab</option>
                    <option>Retail Pharmacy Store</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">Department *</label>
                  <select
                    value={department}
                    onChange={e => setDepartment(e.target.value)}
                    className="w-full p-2 border border-slate-200 rounded-xl text-xs outline-none bg-white font-medium"
                  >
                    <option>Pharmacy Dispensary</option>
                    <option>Emergency Ward</option>
                    <option>Pathology & Biochemistry</option>
                    <option>Operation Theater (OT)</option>
                    <option>General Inpatient (IPD)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">Required Delivery Date *</label>
                  <input
                    type="date"
                    value={requiredDate}
                    onChange={e => setRequiredDate(e.target.value)}
                    className="w-full p-2 border border-slate-200 rounded-xl text-xs outline-none"
                  />
                </div>
              </div>

              {/* Priority & Preferred Supplier */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">Requisition Priority *</label>
                  <div className="flex gap-2">
                    {(['Normal', 'Urgent', 'Critical'] as RequisitionPriority[]).map(p => (
                      <button
                        key={p}
                        type="button"
                        onClick={() => setPriority(p)}
                        className={`flex-1 py-1.5 rounded-xl text-xs font-bold border transition-all ${
                          priority === p
                            ? p === 'Critical'
                              ? 'bg-red-600 text-white border-red-600'
                              : p === 'Urgent'
                              ? 'bg-amber-500 text-white border-amber-500'
                              : 'bg-teal-600 text-white border-teal-600'
                            : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
                        }`}
                      >
                        {p}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">Preferred Supplier (Optional)</label>
                  <select
                    value={preferredSupplierId}
                    onChange={e => setPreferredSupplierId(e.target.value)}
                    className="w-full p-2 border border-slate-200 rounded-xl text-xs outline-none bg-white"
                  >
                    <option value="">-- No Supplier Preference --</option>
                    {suppliers.map(s => (
                      <option key={s.id} value={s.id}>{s.legalName} ({s.category})</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Items Table */}
              <div>
                <div className="flex justify-between items-center mb-2">
                  <label className="block text-xs font-bold text-navy-900 uppercase tracking-wider">
                    Requested Items / Materials
                  </label>
                  <button
                    type="button"
                    onClick={addItemRow}
                    className="text-xs font-bold text-teal-700 hover:text-teal-900 flex items-center gap-1"
                  >
                    <PlusCircle className="h-3.5 w-3.5" />
                    <span>+ Add Another Item</span>
                  </button>
                </div>

                <div className="space-y-2">
                  {items.map((item, idx) => (
                    <div key={item.id} className="p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-2">
                      <div className="grid grid-cols-12 gap-2 items-center">
                        <div className="col-span-4">
                          <input
                            type="text"
                            value={item.itemName}
                            onChange={e => updateItemRow(item.id, 'itemName', e.target.value)}
                            placeholder="Item name / brand..."
                            className="w-full p-1.5 border border-slate-200 rounded-lg text-xs bg-white outline-none"
                          />
                        </div>

                        <div className="col-span-2">
                          <input
                            type="text"
                            value={item.uom}
                            onChange={e => updateItemRow(item.id, 'uom', e.target.value)}
                            placeholder="UOM (Strips, Boxes)"
                            className="w-full p-1.5 border border-slate-200 rounded-lg text-xs bg-white outline-none"
                          />
                        </div>

                        <div className="col-span-2">
                          <input
                            type="number"
                            value={item.requestedQty}
                            onChange={e => updateItemRow(item.id, 'requestedQty', e.target.value)}
                            placeholder="Qty"
                            className="w-full p-1.5 border border-slate-200 rounded-lg text-xs bg-white outline-none font-bold"
                          />
                        </div>

                        <div className="col-span-2">
                          <input
                            type="number"
                            step="0.01"
                            value={item.estimatedUnitPrice}
                            onChange={e => updateItemRow(item.id, 'estimatedUnitPrice', e.target.value)}
                            placeholder="Rate (₹)"
                            className="w-full p-1.5 border border-slate-200 rounded-lg text-xs bg-white outline-none text-right font-medium"
                          />
                        </div>

                        <div className="col-span-1 text-right text-xs font-bold text-teal-700">
                          ₹{item.totalAmount.toFixed(0)}
                        </div>

                        <div className="col-span-1 text-right">
                          <button
                            type="button"
                            onClick={() => removeItemRow(item.id)}
                            className="text-slate-400 hover:text-red-500"
                            disabled={items.length === 1}
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Justification */}
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">
                  Business Justification &amp; Purpose *
                </label>
                <textarea
                  rows={2}
                  value={businessJustification}
                  onChange={e => setBusinessJustification(e.target.value)}
                  placeholder="Explain why these items are required (e.g. Low stock alert, unexpected surge in IPD patients, scheduled surgeries)..."
                  className="w-full p-2.5 border border-slate-200 rounded-xl text-xs outline-none"
                />
              </div>

              {/* Totals Summary */}
              <div className="p-3 bg-teal-50 border border-teal-200 rounded-2xl flex justify-between items-center text-xs">
                <div>
                  <span className="text-slate-600">Subtotal: </span>
                  <strong>₹{totalSubTotal.toFixed(2)}</strong> &nbsp;|&nbsp;
                  <span className="text-slate-600"> Est. GST: </span>
                  <strong>₹{totalTax.toFixed(2)}</strong>
                </div>
                <div>
                  <span className="text-slate-700 font-medium">Estimated Total Landed Cost: </span>
                  <span className="text-base font-extrabold text-teal-800">₹{totalEstimatedAmount.toFixed(2)}</span>
                </div>
              </div>
            </div>

            <div className="px-6 py-4 bg-slate-50 border-t border-slate-200 flex justify-end gap-3">
              <button
                type="button"
                onClick={() => setShowCreateModal(false)}
                className="px-4 py-2 border border-slate-300 text-slate-700 rounded-xl text-xs font-semibold hover:bg-slate-100"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSubmitRequisition}
                className="bg-teal-600 hover:bg-teal-700 text-white px-5 py-2 rounded-xl text-xs font-bold transition-all shadow-sm"
              >
                Submit Requisition for Approval
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── REQUISITION DETAIL MODAL ── */}
      {selectedReq && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-2xl overflow-hidden border border-slate-200 max-h-[85vh] flex flex-col">
            <div className="px-6 py-4 border-b border-slate-200 flex justify-between items-center bg-slate-50">
              <div>
                <h3 className="text-lg font-bold text-navy-900">{selectedReq.requisitionNumber} Details</h3>
                <p className="text-xs text-slate-500">Raised on {selectedReq.requestDate} by {selectedReq.requestedBy}</p>
              </div>
              <button onClick={() => setSelectedReq(null)} className="text-slate-400 font-bold text-xl">×</button>
            </div>

            <div className="p-6 space-y-4 overflow-y-auto flex-1 text-xs">
              <div className="grid grid-cols-2 gap-4 p-3 bg-slate-50 rounded-xl">
                <div><span className="text-slate-500">Branch:</span> <strong>{selectedReq.branch}</strong></div>
                <div><span className="text-slate-500">Department:</span> <strong>{selectedReq.department}</strong></div>
                <div><span className="text-slate-500">Required Date:</span> <strong>{selectedReq.requiredDate}</strong></div>
                <div><span className="text-slate-500">Priority:</span> <strong>{selectedReq.priority}</strong></div>
                <div><span className="text-slate-500">Status:</span> <strong>{selectedReq.status}</strong></div>
                <div><span className="text-slate-500">Total Est:</span> <strong className="text-teal-700">₹{selectedReq.estimatedTotal.toFixed(2)}</strong></div>
              </div>

              <div>
                <h4 className="font-bold text-slate-800 mb-1">Business Justification</h4>
                <p className="text-slate-600 italic bg-amber-50/50 p-2.5 rounded-lg border border-amber-100">
                  "{selectedReq.businessJustification}"
                </p>
              </div>

              <div>
                <h4 className="font-bold text-slate-800 mb-2">Item Specifications</h4>
                <div className="border border-slate-200 rounded-xl overflow-hidden">
                  <table className="w-full text-left">
                    <thead className="bg-slate-100 text-slate-500 font-semibold">
                      <tr>
                        <th className="p-2.5">Item Name</th>
                        <th className="p-2.5">Qty</th>
                        <th className="p-2.5">Est. Rate</th>
                        <th className="p-2.5 text-right">Total</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {selectedReq.items.map(item => (
                        <tr key={item.id}>
                          <td className="p-2.5 font-medium">{item.itemName}</td>
                          <td className="p-2.5">{item.requestedQty} {item.uom}</td>
                          <td className="p-2.5">₹{item.estimatedUnitPrice.toFixed(2)}</td>
                          <td className="p-2.5 text-right font-bold text-teal-700">₹{item.totalAmount.toFixed(2)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Audit Trail */}
              <div>
                <h4 className="font-bold text-slate-800 mb-2">Audit Trail</h4>
                <div className="space-y-1.5">
                  {selectedReq.auditTrail.map((audit, idx) => (
                    <div key={idx} className="flex items-start gap-2 text-[11px] text-slate-600">
                      <CheckCircle2 className="h-3.5 w-3.5 text-teal-600 shrink-0 mt-0.5" />
                      <div>
                        <strong>{audit.action}</strong> by {audit.performedBy} on {new Date(audit.timestamp).toLocaleString()}
                        {audit.notes && <div className="text-slate-500 italic mt-0.5">{audit.notes}</div>}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="px-6 py-4 bg-slate-50 border-t border-slate-200 flex justify-end">
              <button
                onClick={() => setSelectedReq(null)}
                className="px-4 py-2 bg-slate-200 hover:bg-slate-300 text-slate-700 rounded-xl text-xs font-semibold"
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
