import React, { useState } from 'react';
import {
  RotateCcw,
  PlusCircle,
  FileText,
  AlertTriangle,
  CheckCircle2,
  DollarSign
} from 'lucide-react';
import { useProcurement } from '../../context/ProcurementContext';
import { PurchaseReturn } from '../../types/procurement';
import { v4 as uuidv4 } from 'uuid';
import confetti from 'canvas-confetti';

export const PurchaseReturns = () => {
  const { purchaseReturns, grns, suppliers, createPurchaseReturn } = useProcurement();

  const [showAddModal, setShowAddModal] = useState(false);
  const [selectedGrnId, setSelectedGrnId] = useState('');
  const [returnReason, setReturnReason] = useState<'Damaged' | 'Expired' | 'Quality Failed' | 'Excess Delivery'>('Damaged');

  const chosenGrn = grns.find(g => g.id === selectedGrnId);

  const handleCreateReturn = () => {
    if (!chosenGrn) {
      alert('Please select a Goods Receipt Note.');
      return;
    }

    const nextReturnNo = `PRT-${new Date().getFullYear()}-${String(purchaseReturns.length + 1).padStart(4, '0')}`;
    const nextDebitNote = `DN-${new Date().getFullYear()}-${String(purchaseReturns.length + 1).padStart(4, '0')}`;

    const returnItems = chosenGrn.items
      .filter(i => i.rejectedQty > 0 || i.damagedQty > 0)
      .map(i => ({
        itemName: i.itemName,
        batchNo: i.batchNo,
        returnQty: i.rejectedQty || i.damagedQty || 1,
        unitPrice: i.unitPrice,
        totalAmount: (i.rejectedQty || i.damagedQty || 1) * i.unitPrice * 1.12,
        reason: returnReason
      }));

    if (returnItems.length === 0) {
      alert('The selected GRN does not have any rejected or damaged items recorded.');
      return;
    }

    const totalAmount = returnItems.reduce((sum, i) => sum + i.totalAmount, 0);

    const newReturn: PurchaseReturn = {
      id: `prt-${uuidv4().substring(0, 8)}`,
      returnNumber: nextReturnNo,
      organizationId: 'org-default',
      supplierId: chosenGrn.supplierId,
      supplierName: chosenGrn.supplierName,
      grnId: chosenGrn.id,
      grnNumber: chosenGrn.grnNumber,
      returnDate: new Date().toISOString().split('T')[0],
      items: returnItems,
      totalReturnAmount: totalAmount,
      debitNoteNumber: nextDebitNote,
      status: 'Dispatched to Vendor',
      createdAt: new Date().toISOString()
    };

    createPurchaseReturn(newReturn);
    confetti({ particleCount: 50, spread: 50, origin: { y: 0.6 } });
    setShowAddModal(false);
  };

  return (
    <div className="space-y-6">

      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-xl font-extrabold text-navy-900">Purchase Returns &amp; Debit Notes</h2>
          <p className="text-xs text-slate-500">Manage rejected materials, return-to-vendor dispatches, and supplier debit notes.</p>
        </div>

        <button
          onClick={() => setShowAddModal(true)}
          className="flex items-center space-x-2 bg-teal-600 hover:bg-teal-700 text-white px-4 py-2.5 rounded-xl text-xs font-bold transition-all shadow-sm"
        >
          <PlusCircle className="h-4 w-4" />
          <span>Raise Return / Debit Note</span>
        </button>
      </div>

      {/* Returns List */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left">
            <thead className="bg-slate-50 text-slate-500 uppercase tracking-wider font-semibold border-b border-slate-200">
              <tr>
                <th className="px-5 py-3.5">Return #</th>
                <th className="px-4 py-3.5">Supplier Name</th>
                <th className="px-4 py-3.5">Origin GRN</th>
                <th className="px-4 py-3.5">Debit Note Ref</th>
                <th className="px-4 py-3.5">Items Returned</th>
                <th className="px-4 py-3.5 text-right">Debit Amount (₹)</th>
                <th className="px-4 py-3.5 text-center">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {purchaseReturns.map(ret => (
                <tr key={ret.id} className="hover:bg-slate-50/70 transition-colors">
                  <td className="px-5 py-4 font-bold text-navy-900">
                    {ret.returnNumber}
                    <div className="text-[10px] text-slate-400 font-normal">{ret.returnDate}</div>
                  </td>
                  <td className="px-4 py-4 font-semibold text-slate-800">{ret.supplierName}</td>
                  <td className="px-4 py-4 text-teal-800 font-medium">{ret.grnNumber}</td>
                  <td className="px-4 py-4 font-mono font-bold text-slate-700">{ret.debitNoteNumber}</td>
                  <td className="px-4 py-4">
                    <div className="font-medium text-slate-800">{ret.items[0]?.itemName}</div>
                    <div className="text-[10px] text-red-600 font-semibold">{ret.items[0]?.reason} ({ret.items[0]?.returnQty} units)</div>
                  </td>
                  <td className="px-4 py-4 text-right font-extrabold text-red-600">
                    ₹{ret.totalReturnAmount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                  </td>
                  <td className="px-4 py-4 text-center">
                    <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-blue-100 text-blue-800 border border-blue-200">
                      {ret.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Raise Return Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md overflow-hidden border border-slate-200">
            <div className="px-6 py-4 border-b border-slate-200 bg-slate-50 flex justify-between items-center">
              <h3 className="text-base font-bold text-navy-900">Issue Purchase Return &amp; Debit Note</h3>
              <button onClick={() => setShowAddModal(false)} className="text-slate-400 font-bold text-xl">×</button>
            </div>

            <div className="p-6 space-y-4 text-xs">
              <div>
                <label className="block font-semibold text-slate-600 mb-1">Select Origin GRN *</label>
                <select
                  value={selectedGrnId}
                  onChange={e => setSelectedGrnId(e.target.value)}
                  className="w-full p-2 border border-slate-200 rounded-xl outline-none bg-white font-medium"
                >
                  <option value="">-- Choose Goods Receipt Note --</option>
                  {grns.map(g => (
                    <option key={g.id} value={g.id}>{g.grnNumber} ({g.supplierName} — Rejected: {g.totalRejectedQty})</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block font-semibold text-slate-600 mb-1">Return Reason *</label>
                <select
                  value={returnReason}
                  onChange={e => setReturnReason(e.target.value as any)}
                  className="w-full p-2 border border-slate-200 rounded-xl outline-none bg-white font-medium"
                >
                  <option value="Damaged">Damaged during transit / crushed</option>
                  <option value="Expired">Near-expiry or short shelf life</option>
                  <option value="Quality Failed">Failed Quality Inspection / Test</option>
                  <option value="Excess Delivery">Excess Quantity Delivered</option>
                </select>
              </div>
            </div>

            <div className="px-6 py-3 bg-slate-50 border-t border-slate-200 flex justify-end gap-3">
              <button onClick={() => setShowAddModal(false)} className="px-4 py-2 border border-slate-300 rounded-xl text-xs font-semibold">
                Cancel
              </button>
              <button onClick={handleCreateReturn} className="bg-red-600 hover:bg-red-700 text-white px-5 py-2 rounded-xl text-xs font-bold shadow-xs">
                Issue Return &amp; Debit Note
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
