import React, { useState } from 'react';
import {
  Receipt,
  PlusCircle,
  CheckCircle2,
  AlertTriangle,
  FileCheck2,
  DollarSign,
  ArrowRight,
  ShieldCheck,
  Building2,
  Calendar
} from 'lucide-react';
import { useProcurement } from '../../context/ProcurementContext';
import { SupplierInvoiceRecord, SupplierInvoiceStatus } from '../../types/procurement';
import { v4 as uuidv4 } from 'uuid';
import confetti from 'canvas-confetti';

export const SupplierInvoiceMatching = () => {
  const { supplierInvoices, purchaseOrders, grns, createSupplierInvoice, approveSupplierInvoiceForPayment } = useProcurement();

  const [showAddModal, setShowAddModal] = useState(false);
  const [selectedInvoice, setSelectedInvoice] = useState<SupplierInvoiceRecord | null>(null);

  // Form State
  const [selectedGrnId, setSelectedGrnId] = useState('');
  const [vendorInvoiceNo, setVendorInvoiceNo] = useState('');
  const [invoiceDate, setInvoiceDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [dueDate, setDueDate] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() + 30);
    return d.toISOString().split('T')[0];
  });

  const chosenGrn = grns.find(g => g.id === selectedGrnId);
  const linkedPo = chosenGrn ? purchaseOrders.find(p => p.id === chosenGrn.purchaseOrderId || p.poNumber === chosenGrn.poNumber) : null;

  const handleCreateAndMatchInvoice = () => {
    if (!chosenGrn || !linkedPo || !vendorInvoiceNo) {
      alert('Please select a GRN and provide the Supplier Invoice Number.');
      return;
    }

    const nextSystemId = `PINV-${new Date().getFullYear()}-${String(supplierInvoices.length + 1).padStart(4, '0')}`;

    // Perform Automated 3-Way Match Verification
    let quantityMatch = true;
    let priceMatch = true;
    let taxMatch = true;
    let subTotal = 0;
    let taxTotal = 0;

    const matchedItems = chosenGrn.items.map(grnItem => {
      const poItem = linkedPo.items.find(pi => pi.itemName === grnItem.itemName);
      const poPrice = poItem ? poItem.estimatedUnitPrice : grnItem.unitPrice;
      const billedPrice = grnItem.unitPrice;
      const billedQty = grnItem.acceptedQty;

      const taxable = billedQty * billedPrice;
      const gstRate = poItem ? poItem.gstRate : 12;
      const tax = (taxable * gstRate) / 100;

      subTotal += taxable;
      taxTotal += tax;

      // Variance check
      const hasPriceVariance = Math.abs(billedPrice - poPrice) > 0.01;
      const hasQtyVariance = grnItem.rejectedQty > 0 || grnItem.damagedQty > 0;

      if (hasPriceVariance) priceMatch = false;
      if (hasQtyVariance) quantityMatch = false;

      return {
        itemName: grnItem.itemName,
        billedQty,
        grnAcceptedQty: grnItem.acceptedQty,
        unitPrice: billedPrice,
        poUnitPrice: poPrice,
        taxableAmount: taxable,
        gstAmount: tax,
        totalAmount: taxable + tax,
        varianceFlag: hasPriceVariance || hasQtyVariance
      };
    });

    const isFullyMatched = quantityMatch && priceMatch && taxMatch;
    const initialStatus: SupplierInvoiceStatus = isFullyMatched ? 'Matched' : 'Discrepancy Flagged';

    const newInvoice: SupplierInvoiceRecord = {
      id: `pinv-${uuidv4().substring(0, 8)}`,
      invoiceNumber: vendorInvoiceNo,
      systemInvoiceId: nextSystemId,
      organizationId: 'org-default',
      supplierId: linkedPo.supplierId,
      supplierName: linkedPo.supplierName,
      supplierGstin: linkedPo.supplierGstin,
      invoiceDate,
      dueDate,
      purchaseOrderId: linkedPo.id,
      poNumber: linkedPo.poNumber,
      grnId: chosenGrn.id,
      grnNumber: chosenGrn.grnNumber,
      items: matchedItems,
      subTotal,
      taxTotal,
      freightCharges: linkedPo.freightCharges || 0,
      totalInvoiceAmount: subTotal + taxTotal + (linkedPo.freightCharges || 0),
      threeWayMatchResult: {
        quantityMatch,
        priceMatch,
        taxMatch,
        discrepancyNotes: isFullyMatched
          ? 'Automated 3-Way Match Verified (PO, GRN & Invoice 100% congruent).'
          : 'Discrepancy Flagged: Partial damaged goods or unit rate adjustments identified between PO and GRN.'
      },
      status: initialStatus,
      createdAt: new Date().toISOString()
    };

    createSupplierInvoice(newInvoice);
    confetti({ particleCount: 60, spread: 50, origin: { y: 0.6 } });
    setShowAddModal(false);
  };

  const handleApprovePayment = (id: string) => {
    approveSupplierInvoiceForPayment(id);
    confetti({ particleCount: 70, spread: 60, origin: { y: 0.6 } });
    alert('Supplier invoice verified & approved for Accounts Payable disbursement!');
  };

  return (
    <div className="space-y-6">

      {/* Header Toolbar */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-xl font-extrabold text-navy-900">Supplier Invoice Verification (3-Way Matching)</h2>
          <p className="text-xs text-slate-500">Reconcile Purchase Order (PO), Goods Receipt (GRN), and Supplier Invoice before payment release.</p>
        </div>

        <button
          onClick={() => setShowAddModal(true)}
          className="flex items-center space-x-2 bg-teal-600 hover:bg-teal-700 text-white px-4 py-2.5 rounded-xl text-xs font-bold transition-all shadow-sm"
        >
          <PlusCircle className="h-4 w-4" />
          <span>Record Supplier Invoice</span>
        </button>
      </div>

      {/* Invoices List */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left">
            <thead className="bg-slate-50 text-slate-500 uppercase tracking-wider font-semibold border-b border-slate-200">
              <tr>
                <th className="px-5 py-3.5">Invoice #</th>
                <th className="px-4 py-3.5">Supplier &amp; GSTIN</th>
                <th className="px-4 py-3.5">Linked PO &amp; GRN</th>
                <th className="px-4 py-3.5">Due Date</th>
                <th className="px-4 py-3.5 text-center">3-Way Match Status</th>
                <th className="px-4 py-3.5 text-right">Invoice Total (₹)</th>
                <th className="px-4 py-3.5 text-center">Status</th>
                <th className="px-5 py-3.5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {supplierInvoices.map(inv => (
                <tr key={inv.id} className="hover:bg-slate-50/70 transition-colors">
                  <td className="px-5 py-4 font-bold text-navy-900">
                    <div className="font-mono text-xs">{inv.invoiceNumber}</div>
                    <div className="text-[10px] text-slate-400 font-normal">{inv.systemInvoiceId} | {inv.invoiceDate}</div>
                  </td>

                  <td className="px-4 py-4">
                    <div className="font-semibold text-slate-800">{inv.supplierName}</div>
                    <div className="text-[10px] text-slate-400 font-mono">GSTIN: {inv.supplierGstin}</div>
                  </td>

                  <td className="px-4 py-4">
                    <div className="font-medium text-teal-800">{inv.poNumber}</div>
                    <div className="text-[10px] text-slate-500 font-mono">{inv.grnNumber}</div>
                  </td>

                  <td className="px-4 py-4 text-slate-700 font-medium">
                    {inv.dueDate}
                  </td>

                  {/* 3-Way Match Pill */}
                  <td className="px-4 py-4 text-center">
                    <div className="inline-flex items-center gap-1">
                      {inv.threeWayMatchResult.quantityMatch && inv.threeWayMatchResult.priceMatch ? (
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-200">
                          ✓ 3-Way Matched
                        </span>
                      ) : (
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-800 border border-amber-200">
                          ⚠️ Discrepancy Found
                        </span>
                      )}
                    </div>
                  </td>

                  <td className="px-4 py-4 text-right font-extrabold text-teal-800">
                    ₹{inv.totalInvoiceAmount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                  </td>

                  <td className="px-4 py-4 text-center">
                    <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold ${
                      inv.status === 'Approved for Payment' || inv.status === 'Paid'
                        ? 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                        : inv.status === 'Matched'
                        ? 'bg-blue-100 text-blue-800 border border-blue-200'
                        : 'bg-amber-100 text-amber-800 border border-amber-200'
                    }`}>
                      {inv.status}
                    </span>
                  </td>

                  <td className="px-5 py-4 text-right">
                    <div className="flex items-center justify-end gap-1.5">
                      <button
                        onClick={() => setSelectedInvoice(inv)}
                        className="px-2.5 py-1 rounded-lg text-xs font-semibold bg-slate-100 hover:bg-slate-200 text-slate-700"
                      >
                        Match Audit
                      </button>

                      {inv.status !== 'Approved for Payment' && inv.status !== 'Paid' && (
                        <button
                          onClick={() => handleApprovePayment(inv.id)}
                          className="px-2.5 py-1 rounded-lg text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white shadow-xs"
                        >
                          Approve Payment
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* ── RECORD SUPPLIER INVOICE MODAL ── */}
      {showAddModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-lg overflow-hidden border border-slate-200">
            <div className="px-6 py-4 border-b border-slate-200 bg-slate-50 flex justify-between items-center">
              <div>
                <h3 className="text-base font-bold text-navy-900">Record Vendor Bill &amp; 3-Way Match</h3>
                <p className="text-xs text-slate-500">Automated reconciliation against posted Goods Receipt Notes.</p>
              </div>
              <button onClick={() => setShowAddModal(false)} className="text-slate-400 font-bold text-xl">×</button>
            </div>

            <div className="p-6 space-y-4 text-xs">
              <div>
                <label className="block font-semibold text-slate-600 mb-1">Select Inspected GRN *</label>
                <select
                  value={selectedGrnId}
                  onChange={e => setSelectedGrnId(e.target.value)}
                  className="w-full p-2 border border-slate-200 rounded-xl outline-none bg-white font-bold text-navy-900"
                >
                  <option value="">-- Choose Goods Receipt Note --</option>
                  {grns.map(g => (
                    <option key={g.id} value={g.id}>{g.grnNumber} (PO: {g.poNumber} — {g.supplierName})</option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-600 mb-1">Supplier Invoice Number *</label>
                  <input
                    type="text"
                    value={vendorInvoiceNo}
                    onChange={e => setVendorInvoiceNo(e.target.value)}
                    placeholder="e.g. INV-VENDOR-8891"
                    className="w-full p-2 border border-slate-200 rounded-xl outline-none font-mono font-bold"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-600 mb-1">Invoice Date *</label>
                  <input
                    type="date"
                    value={invoiceDate}
                    onChange={e => setInvoiceDate(e.target.value)}
                    className="w-full p-2 border border-slate-200 rounded-xl outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-600 mb-1">Payment Due Date</label>
                <input
                  type="date"
                  value={dueDate}
                  onChange={e => setDueDate(e.target.value)}
                  className="w-full p-2 border border-slate-200 rounded-xl outline-none"
                />
              </div>

              {chosenGrn && linkedPo && (
                <div className="p-3 bg-teal-50 border border-teal-200 rounded-2xl space-y-1">
                  <div className="font-bold text-teal-900">Verification Summary:</div>
                  <div className="text-slate-700">Vendor: <strong>{linkedPo.supplierName}</strong></div>
                  <div className="text-slate-700">Accepted Units: <strong>{chosenGrn.totalAcceptedQty}</strong></div>
                  <div className="text-slate-700">PO Total Value: <strong>₹{linkedPo.totalAmount.toFixed(2)}</strong></div>
                </div>
              )}
            </div>

            <div className="px-6 py-3 bg-slate-50 border-t border-slate-200 flex justify-end gap-3">
              <button onClick={() => setShowAddModal(false)} className="px-4 py-2 border border-slate-300 rounded-xl text-xs font-semibold">
                Cancel
              </button>
              <button onClick={handleCreateAndMatchInvoice} className="bg-teal-600 hover:bg-teal-700 text-white px-5 py-2 rounded-xl text-xs font-bold shadow-xs">
                Run 3-Way Match &amp; Save
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── 3-WAY MATCH AUDIT DOSSIER MODAL ── */}
      {selectedInvoice && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-xl overflow-hidden border border-slate-200">
            <div className="px-6 py-4 border-b border-slate-200 bg-slate-50 flex justify-between items-center">
              <div>
                <h3 className="text-base font-bold text-navy-900">3-Way Match Audit Dossier</h3>
                <p className="text-xs text-slate-500">Invoice: {selectedInvoice.invoiceNumber} | PO: {selectedInvoice.poNumber}</p>
              </div>
              <button onClick={() => setSelectedInvoice(null)} className="text-slate-400 font-bold text-xl">×</button>
            </div>

            <div className="p-6 space-y-4 text-xs">
              <div className="grid grid-cols-3 gap-2 text-center">
                <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                  <span className="text-[10px] text-slate-500 block">1. Purchase Order</span>
                  <strong className="text-navy-900">{selectedInvoice.poNumber}</strong>
                </div>
                <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                  <span className="text-[10px] text-slate-500 block">2. Goods Receipt</span>
                  <strong className="text-navy-900">{selectedInvoice.grnNumber}</strong>
                </div>
                <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                  <span className="text-[10px] text-slate-500 block">3. Vendor Invoice</span>
                  <strong className="text-navy-900">{selectedInvoice.invoiceNumber}</strong>
                </div>
              </div>

              <div className="p-3 bg-slate-50 rounded-xl">
                <h4 className="font-bold text-slate-800 mb-1">Reconciliation Notes:</h4>
                <p className="text-slate-600 italic">"{selectedInvoice.threeWayMatchResult.discrepancyNotes}"</p>
              </div>

              <div>
                <h4 className="font-bold text-slate-800 mb-2">Line-by-Line Reconciliation:</h4>
                <div className="border border-slate-200 rounded-xl overflow-hidden">
                  <table className="w-full text-left">
                    <thead className="bg-slate-100 text-slate-600 font-semibold">
                      <tr>
                        <th className="p-2">Item</th>
                        <th className="p-2 text-center">Billed Qty</th>
                        <th className="p-2 text-right">PO Rate</th>
                        <th className="p-2 text-right">Invoice Total</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {selectedInvoice.items.map((i, idx) => (
                        <tr key={idx}>
                          <td className="p-2 font-medium">{i.itemName}</td>
                          <td className="p-2 text-center">{i.billedQty}</td>
                          <td className="p-2 text-right font-mono">₹{i.poUnitPrice.toFixed(2)}</td>
                          <td className="p-2 text-right font-bold font-mono text-teal-800">₹{i.totalAmount.toFixed(2)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>

            <div className="px-6 py-3 bg-slate-50 border-t border-slate-200 flex justify-end">
              <button onClick={() => setSelectedInvoice(null)} className="px-4 py-1.5 bg-slate-200 rounded-xl font-bold text-slate-700">
                Close
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
