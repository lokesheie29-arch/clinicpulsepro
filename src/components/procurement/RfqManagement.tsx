import React, { useState } from 'react';
import {
  PlusCircle,
  FileQuestion,
  Users,
  CheckCircle2,
  Calendar,
  Clock,
  ArrowRight,
  TrendingDown,
  DollarSign
} from 'lucide-react';
import { useProcurement } from '../../context/ProcurementContext';
import { RequestForQuotation, SupplierQuotationEntry } from '../../types/procurement';
import { v4 as uuidv4 } from 'uuid';
import confetti from 'canvas-confetti';

export const RfqManagement = ({ onOpenComparison }: { onOpenComparison: (rfqId: string) => void }) => {
  const { rfqs, suppliers, requisitions, createRfq, recordSupplierQuotation } = useProcurement();

  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showAddQuoteModal, setShowAddQuoteModal] = useState(false);
  const [selectedRfqForQuote, setSelectedRfqForQuote] = useState<RequestForQuotation | null>(null);

  // Form State
  const [title, setTitle] = useState('');
  const [requisitionId, setRequisitionId] = useState('');
  const [deadline, setDeadline] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() + 5);
    return d.toISOString().split('T')[0];
  });
  const [selectedSupplierIds, setSelectedSupplierIds] = useState<string[]>([]);
  const [terms, setTerms] = useState('Door delivery to Hospital Central Store. Minimum 24 months shelf life.');

  // Quote Entry Form
  const [quoteSupplierId, setQuoteSupplierId] = useState('');
  const [quoteRefNumber, setQuoteRefNumber] = useState('');
  const [quoteLeadTime, setQuoteLeadTime] = useState(3);
  const [quoteFreight, setQuoteFreight] = useState(0);
  const [quoteRates, setQuoteRates] = useState<{ [itemId: string]: number }>({});

  const handleToggleSupplier = (id: string) => {
    if (selectedSupplierIds.includes(id)) {
      setSelectedSupplierIds(selectedSupplierIds.filter(s => s !== id));
    } else {
      setSelectedSupplierIds([...selectedSupplierIds, id]);
    }
  };

  const handleCreateRfq = () => {
    if (!title || selectedSupplierIds.length === 0) {
      alert('Please specify an RFQ Title and select at least one supplier.');
      return;
    }

    const selectedReq = requisitions.find(r => r.id === requisitionId);
    const chosenSuppliers = suppliers
      .filter(s => selectedSupplierIds.includes(s.id))
      .map(s => ({
        supplierId: s.id,
        supplierName: s.legalName,
        email: s.email,
        status: 'Pending' as const
      }));

    const nextRfqNumber = `RFQ-${new Date().getFullYear()}-${String(rfqs.length + 1).padStart(4, '0')}`;

    const newRfq: RequestForQuotation = {
      id: `rfq-${uuidv4().substring(0, 8)}`,
      rfqNumber: nextRfqNumber,
      organizationId: 'org-default',
      requisitionId,
      requisitionNumber: selectedReq?.requisitionNumber,
      title,
      enquiryDate: new Date().toISOString().split('T')[0],
      submissionDeadline: deadline,
      status: 'Sent',
      selectedSuppliers: chosenSuppliers,
      items: selectedReq ? selectedReq.items : [
        {
          id: uuidv4(),
          itemName: 'Bulk Pharmaceutical Order',
          category: 'Medicines & Pharmaceuticals',
          hsnCode: '3004',
          uom: 'Boxes',
          requestedQty: 100,
          estimatedUnitPrice: 50,
          gstRate: 12,
          totalAmount: 5600
        }
      ],
      termsAndConditions: terms,
      quotations: [],
      createdAt: new Date().toISOString(),
      createdBy: 'Procurement Specialist'
    };

    createRfq(newRfq);
    confetti({ particleCount: 60, spread: 50, origin: { y: 0.6 } });
    setShowCreateModal(false);
  };

  const handleRecordQuotationSubmit = () => {
    if (!selectedRfqForQuote || !quoteSupplierId || !quoteRefNumber) {
      alert('Please select supplier and enter quotation reference number.');
      return;
    }

    const supplier = suppliers.find(s => s.id === quoteSupplierId);
    if (!supplier) return;

    let subTotal = 0;
    let totalTax = 0;

    const items = selectedRfqForQuote.items.map(item => {
      const rate = quoteRates[item.id] || item.estimatedUnitPrice;
      const taxable = rate * item.requestedQty;
      const tax = (taxable * item.gstRate) / 100;
      subTotal += taxable;
      totalTax += tax;

      return {
        itemId: item.id,
        itemName: item.itemName,
        quotedRate: rate,
        discountPercent: 0,
        gstRate: item.gstRate,
        taxableAmount: taxable,
        totalAmount: taxable + tax
      };
    });

    const quoteEntry: SupplierQuotationEntry = {
      id: `quote-${uuidv4().substring(0, 8)}`,
      rfqId: selectedRfqForQuote.id,
      supplierId: supplier.id,
      supplierName: supplier.legalName,
      quotationRefNumber: quoteRefNumber,
      quotationDate: new Date().toISOString().split('T')[0],
      validUntil: new Date(Date.now() + 30 * 86400000).toISOString().split('T')[0],
      leadTimeDays: quoteLeadTime,
      paymentTerms: `Net ${supplier.paymentTermsDays} Days`,
      freightCharges: quoteFreight,
      otherCharges: 0,
      items,
      subTotal,
      totalTax,
      totalLandedCost: subTotal + totalTax + quoteFreight
    };

    recordSupplierQuotation(selectedRfqForQuote.id, quoteEntry);
    confetti({ particleCount: 50, spread: 45, origin: { y: 0.6 } });
    setShowAddQuoteModal(false);
  };

  return (
    <div className="space-y-6">

      {/* Header Toolbar */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-xl font-extrabold text-navy-900">Request for Quotation (RFQ)</h2>
          <p className="text-xs text-slate-500">Send multi-vendor enquiries, collect bids, and evaluate commercial responses.</p>
        </div>

        <button
          onClick={() => setShowCreateModal(true)}
          className="flex items-center space-x-2 bg-teal-600 hover:bg-teal-700 text-white px-4 py-2.5 rounded-xl text-xs font-bold transition-all shadow-sm"
        >
          <PlusCircle className="h-4 w-4" />
          <span>Create New RFQ</span>
        </button>
      </div>

      {/* RFQ List Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {rfqs.map(rfq => (
          <div key={rfq.id} className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs hover:border-teal-300 transition-all flex flex-col justify-between">
            <div>
              <div className="flex justify-between items-start gap-2 mb-2">
                <span className="font-mono text-xs font-extrabold text-navy-900 bg-slate-100 px-2.5 py-1 rounded-lg">
                  {rfq.rfqNumber}
                </span>
                <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                  rfq.status === 'Evaluated'
                    ? 'bg-emerald-100 text-emerald-800'
                    : rfq.status === 'Responses Received'
                    ? 'bg-blue-100 text-blue-800'
                    : 'bg-amber-100 text-amber-800'
                }`}>
                  {rfq.status}
                </span>
              </div>

              <h3 className="font-bold text-navy-900 text-sm mt-1">{rfq.title}</h3>
              {rfq.requisitionNumber && (
                <p className="text-[11px] text-teal-700 font-medium">Ref: {rfq.requisitionNumber}</p>
              )}

              {/* Items summary */}
              <div className="mt-3 p-2.5 bg-slate-50 rounded-xl text-xs text-slate-700 space-y-1">
                <div className="font-semibold text-slate-800">
                  {rfq.items[0]?.itemName} {rfq.items.length > 1 && `+ ${rfq.items.length - 1} more`}
                </div>
                <div className="text-[11px] text-slate-500">
                  Enquiry Date: {rfq.enquiryDate} &nbsp;|&nbsp; Deadline: <strong className="text-navy-900">{rfq.submissionDeadline}</strong>
                </div>
              </div>

              {/* Suppliers invited */}
              <div className="mt-3">
                <span className="text-[11px] font-semibold text-slate-500">Invited Vendors ({rfq.selectedSuppliers.length}):</span>
                <div className="flex flex-wrap gap-1.5 mt-1">
                  {rfq.selectedSuppliers.map(s => (
                    <span key={s.supplierId} className="text-[10px] px-2 py-0.5 bg-slate-100 rounded-md text-slate-700 font-medium">
                      {s.supplierName}
                    </span>
                  ))}
                </div>
              </div>

              {/* Quotations received badge */}
              <div className="mt-3 text-xs flex items-center justify-between">
                <span className="text-slate-500">Quotations Received:</span>
                <span className="font-bold text-teal-700">{rfq.quotations.length} / {rfq.selectedSuppliers.length}</span>
              </div>
            </div>

            {/* Actions */}
            <div className="mt-5 pt-3 border-t border-slate-100 flex items-center justify-between">
              <button
                onClick={() => {
                  setSelectedRfqForQuote(rfq);
                  setShowAddQuoteModal(true);
                }}
                className="text-xs font-semibold text-slate-600 hover:text-navy-900 bg-slate-100 px-3 py-1.5 rounded-lg"
              >
                + Record Vendor Quote
              </button>

              <button
                onClick={() => onOpenComparison(rfq.id)}
                className="flex items-center gap-1 text-xs font-bold text-white bg-teal-600 hover:bg-teal-700 px-3 py-1.5 rounded-lg shadow-xs"
              >
                <span>Compare Quotations</span>
                <ArrowRight className="h-3 w-3" />
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* ── CREATE RFQ MODAL ── */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-xl overflow-hidden border border-slate-200">
            <div className="px-6 py-4 border-b border-slate-200 bg-slate-50 flex justify-between items-center">
              <h3 className="text-base font-bold text-navy-900">Initiate Request for Quotation (RFQ)</h3>
              <button onClick={() => setShowCreateModal(false)} className="text-slate-400 font-bold text-xl">×</button>
            </div>

            <div className="p-6 space-y-4 text-xs">
              <div>
                <label className="block font-semibold text-slate-600 mb-1">RFQ Title *</label>
                <input
                  type="text"
                  value={title}
                  onChange={e => setTitle(e.target.value)}
                  placeholder="e.g. Bulk Antibiotics & Consumables Enquiry"
                  className="w-full p-2 border border-slate-200 rounded-xl outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-600 mb-1">From Requisition (Optional)</label>
                  <select
                    value={requisitionId}
                    onChange={e => setRequisitionId(e.target.value)}
                    className="w-full p-2 border border-slate-200 rounded-xl outline-none bg-white"
                  >
                    <option value="">-- Direct Enquiry --</option>
                    {requisitions.filter(r => r.status === 'Approved').map(r => (
                      <option key={r.id} value={r.id}>{r.requisitionNumber} ({r.department})</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block font-semibold text-slate-600 mb-1">Submission Deadline *</label>
                  <input
                    type="date"
                    value={deadline}
                    onChange={e => setDeadline(e.target.value)}
                    className="w-full p-2 border border-slate-200 rounded-xl outline-none"
                  />
                </div>
              </div>

              {/* Multi-Vendor Selection */}
              <div>
                <label className="block font-semibold text-slate-600 mb-1.5">
                  Select Suppliers to Send Enquiry ({selectedSupplierIds.length} selected) *
                </label>
                <div className="space-y-1.5 max-h-40 overflow-y-auto border border-slate-200 rounded-xl p-2.5 bg-slate-50">
                  {suppliers.map(s => (
                    <label key={s.id} className="flex items-center gap-2.5 p-1.5 hover:bg-white rounded-lg cursor-pointer">
                      <input
                        type="checkbox"
                        checked={selectedSupplierIds.includes(s.id)}
                        onChange={() => handleToggleSupplier(s.id)}
                        className="rounded text-teal-600 focus:ring-teal-500"
                      />
                      <span className="font-semibold text-slate-800">{s.legalName}</span>
                      <span className="text-[10px] text-slate-400">({s.category})</span>
                    </label>
                  ))}
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-600 mb-1">Commercial Conditions</label>
                <textarea
                  rows={2}
                  value={terms}
                  onChange={e => setTerms(e.target.value)}
                  className="w-full p-2 border border-slate-200 rounded-xl outline-none"
                />
              </div>
            </div>

            <div className="px-6 py-3 bg-slate-50 border-t border-slate-200 flex justify-end gap-3">
              <button onClick={() => setShowCreateModal(false)} className="px-4 py-2 border border-slate-300 rounded-xl text-xs font-semibold">
                Cancel
              </button>
              <button onClick={handleCreateRfq} className="bg-teal-600 hover:bg-teal-700 text-white px-5 py-2 rounded-xl text-xs font-bold shadow-xs">
                Issue RFQ to Vendors
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── RECORD SUPPLIER QUOTATION MODAL ── */}
      {showAddQuoteModal && selectedRfqForQuote && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-lg overflow-hidden border border-slate-200">
            <div className="px-6 py-4 border-b border-slate-200 bg-slate-50 flex justify-between items-center">
              <div>
                <h3 className="text-base font-bold text-navy-900">Record Vendor Quotation Response</h3>
                <p className="text-xs text-slate-500">{selectedRfqForQuote.rfqNumber}: {selectedRfqForQuote.title}</p>
              </div>
              <button onClick={() => setShowAddQuoteModal(false)} className="text-slate-400 font-bold text-xl">×</button>
            </div>

            <div className="p-6 space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-600 mb-1">Bidding Supplier *</label>
                  <select
                    value={quoteSupplierId}
                    onChange={e => setQuoteSupplierId(e.target.value)}
                    className="w-full p-2 border border-slate-200 rounded-xl outline-none bg-white font-medium"
                  >
                    <option value="">-- Choose Vendor --</option>
                    {suppliers.map(s => (
                      <option key={s.id} value={s.id}>{s.legalName}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block font-semibold text-slate-600 mb-1">Quotation Ref No *</label>
                  <input
                    type="text"
                    value={quoteRefNumber}
                    onChange={e => setQuoteRefNumber(e.target.value)}
                    placeholder="e.g. Q-VENDOR-991"
                    className="w-full p-2 border border-slate-200 rounded-xl outline-none font-mono"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-600 mb-1">Delivery Lead Time (Days)</label>
                  <input
                    type="number"
                    value={quoteLeadTime}
                    onChange={e => setQuoteLeadTime(parseInt(e.target.value) || 2)}
                    className="w-full p-2 border border-slate-200 rounded-xl outline-none"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-600 mb-1">Freight &amp; Handling (₹)</label>
                  <input
                    type="number"
                    value={quoteFreight}
                    onChange={e => setQuoteFreight(parseFloat(e.target.value) || 0)}
                    className="w-full p-2 border border-slate-200 rounded-xl outline-none"
                  />
                </div>
              </div>

              {/* Items Quoted Rate */}
              <div>
                <label className="block font-semibold text-slate-700 mb-1.5">Quoted Rates Per Item:</label>
                <div className="space-y-2 border border-slate-200 rounded-xl p-3 bg-slate-50">
                  {selectedRfqForQuote.items.map(item => (
                    <div key={item.id} className="flex items-center justify-between gap-3 text-xs">
                      <span className="font-medium text-slate-800 flex-1">{item.itemName} (Qty: {item.requestedQty})</span>
                      <div className="flex items-center gap-1">
                        <span className="text-slate-400">₹</span>
                        <input
                          type="number"
                          step="0.01"
                          placeholder={String(item.estimatedUnitPrice)}
                          onChange={e => setQuoteRates({ ...quoteRates, [item.id]: parseFloat(e.target.value) || item.estimatedUnitPrice })}
                          className="w-24 p-1.5 border border-slate-200 rounded-lg text-right bg-white font-bold outline-none"
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="px-6 py-3 bg-slate-50 border-t border-slate-200 flex justify-end gap-3">
              <button onClick={() => setShowAddQuoteModal(false)} className="px-4 py-2 border border-slate-300 rounded-xl text-xs font-semibold">
                Cancel
              </button>
              <button onClick={handleRecordQuotationSubmit} className="bg-teal-600 hover:bg-teal-700 text-white px-5 py-2 rounded-xl text-xs font-bold shadow-xs">
                Save Quotation Response
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
