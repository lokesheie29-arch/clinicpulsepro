import React, { useState, useMemo } from 'react';
import {
  PackageCheck,
  PlusCircle,
  CheckCircle2,
  AlertTriangle,
  Clock,
  ShieldCheck,
  Building2,
  Calendar,
  Layers,
  ArrowRight
} from 'lucide-react';
import { useProcurement } from '../../context/ProcurementContext';
import { GoodsReceiptNote, InspectionResult } from '../../types/procurement';
import { v4 as uuidv4 } from 'uuid';
import confetti from 'canvas-confetti';

export const GoodsReceiptNotes = ({ poId }: { poId?: string }) => {
  const { grns, purchaseOrders, createGoodsReceipt, postGrnToInventory } = useProcurement();

  const [searchQuery, setSearchQuery] = useState('');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [selectedGrn, setSelectedGrn] = useState<GoodsReceiptNote | null>(null);

  // Form State
  const [selectedPoId, setSelectedPoId] = useState<string>(poId || '');
  const [challanNumber, setChallanNumber] = useState('');
  const [challanDate, setChallanDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [storageLocation, setStorageLocation] = useState('Central Pharmacy Warehouse Rack-B2');
  const [receivedBy, setReceivedBy] = useState('Store Supervisor');
  const [inspectionResult, setInspectionResult] = useState<InspectionResult>('Passed');
  const [qualityRemarks, setQualityRemarks] = useState('');

  // Items State (generated from selected PO)
  const currentPO = purchaseOrders.find(p => p.id === selectedPoId);

  const [receivedItems, setReceivedItems] = useState<any[]>([]);

  // When PO is chosen, populate default items
  React.useEffect(() => {
    if (currentPO) {
      setReceivedItems(currentPO.items.map(item => ({
        id: uuidv4(),
        itemName: item.itemName,
        orderedQty: item.requestedQty,
        receivedQty: item.requestedQty,
        acceptedQty: item.requestedQty,
        rejectedQty: 0,
        damagedQty: 0,
        unitPrice: item.estimatedUnitPrice,
        batchNo: `B${new Date().getFullYear()}${Math.floor(10 + Math.random() * 90)}`,
        expiryDate: new Date(Date.now() + 730 * 86400000).toISOString().split('T')[0], // 2 years default
        mfgDate: new Date().toISOString().split('T')[0],
        rejectionReason: ''
      })));
    }
  }, [selectedPoId, currentPO]);

  const updateItem = (idx: number, field: string, value: any) => {
    setReceivedItems(prev => {
      const copy = [...prev];
      copy[idx] = { ...copy[idx], [field]: value };
      if (field === 'receivedQty' || field === 'rejectedQty' || field === 'damagedQty') {
        const rec = Number(copy[idx].receivedQty) || 0;
        const rej = Number(copy[idx].rejectedQty) || 0;
        const dam = Number(copy[idx].damagedQty) || 0;
        copy[idx].acceptedQty = Math.max(0, rec - rej - dam);
      }
      return copy;
    });
  };

  const handleCreateGrn = () => {
    if (!currentPO || !challanNumber) {
      alert('Please select a Purchase Order and enter Supplier Delivery Challan / Invoice #.');
      return;
    }

    const nextGrnNumber = `GRN-${new Date().getFullYear()}-${String(grns.length + 1).padStart(4, '0')}`;
    const totalAccepted = receivedItems.reduce((sum, i) => sum + (Number(i.acceptedQty) || 0), 0);
    const totalRejected = receivedItems.reduce((sum, i) => sum + (Number(i.rejectedQty) || 0) + (Number(i.damagedQty) || 0), 0);

    const newGRN: GoodsReceiptNote = {
      id: `grn-${uuidv4().substring(0, 8)}`,
      grnNumber: nextGrnNumber,
      organizationId: 'org-default',
      purchaseOrderId: currentPO.id,
      poNumber: currentPO.poNumber,
      supplierId: currentPO.supplierId,
      supplierName: currentPO.supplierName,
      deliveryChallanNumber: challanNumber,
      deliveryChallanDate: challanDate,
      receiptDate: new Date().toISOString().split('T')[0],
      receivedBy,
      inspectionResult,
      status: 'Under Inspection',
      storageLocation,
      items: receivedItems,
      totalAcceptedQty: totalAccepted,
      totalRejectedQty: totalRejected,
      qualityRemarks: qualityRemarks || 'Physical package seals and batch numbers verified against delivery challan.',
      createdAt: new Date().toISOString()
    };

    createGoodsReceipt(newGRN);
    confetti({ particleCount: 60, spread: 50, origin: { y: 0.6 } });
    setShowCreateModal(false);
  };

  const handlePostInventory = (grn: GoodsReceiptNote) => {
    postGrnToInventory(grn.id);
    confetti({
      particleCount: 90,
      spread: 70,
      origin: { y: 0.6 },
      colors: ['#0D9488', '#10B981', '#0F172A']
    });
    alert(`Success: ${grn.totalAcceptedQty} accepted units from ${grn.grnNumber} have been posted directly into FEFO inventory stock!`);
  };

  return (
    <div className="space-y-6">

      {/* Header Toolbar */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-xl font-extrabold text-navy-900">Goods Receipt Notes (GRN) &amp; Inspection</h2>
          <p className="text-xs text-slate-500">Record incoming supplier shipments, batch/expiry controls, and post accepted stock to FEFO inventory.</p>
        </div>

        <button
          onClick={() => setShowCreateModal(true)}
          className="flex items-center space-x-2 bg-teal-600 hover:bg-teal-700 text-white px-4 py-2.5 rounded-xl text-xs font-bold transition-all shadow-sm"
        >
          <PlusCircle className="h-4 w-4" />
          <span>Create New GRN</span>
        </button>
      </div>

      {/* GRN Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left">
            <thead className="bg-slate-50 text-slate-500 uppercase tracking-wider font-semibold border-b border-slate-200">
              <tr>
                <th className="px-5 py-3.5">GRN Number</th>
                <th className="px-4 py-3.5">PO Ref &amp; Supplier</th>
                <th className="px-4 py-3.5">Challan / Inv #</th>
                <th className="px-4 py-3.5">Storage Location</th>
                <th className="px-4 py-3.5 text-center">Accepted / Rejected</th>
                <th className="px-4 py-3.5 text-center">Quality Inspection</th>
                <th className="px-4 py-3.5 text-center">Inventory Post Status</th>
                <th className="px-5 py-3.5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {grns.map(grn => (
                <tr key={grn.id} className="hover:bg-slate-50/70 transition-colors">
                  <td className="px-5 py-4 font-bold text-navy-900">
                    {grn.grnNumber}
                    <div className="text-[10px] text-slate-400 font-normal">{grn.receiptDate}</div>
                  </td>

                  <td className="px-4 py-4">
                    <div className="font-bold text-teal-800">{grn.poNumber}</div>
                    <div className="text-[11px] text-slate-600">{grn.supplierName}</div>
                  </td>

                  <td className="px-4 py-4 font-mono font-medium text-slate-800">
                    {grn.deliveryChallanNumber}
                  </td>

                  <td className="px-4 py-4 text-slate-600">
                    {grn.storageLocation}
                  </td>

                  <td className="px-4 py-4 text-center">
                    <div className="inline-flex items-center gap-1.5 font-bold">
                      <span className="text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                        ✓ {grn.totalAcceptedQty}
                      </span>
                      {grn.totalRejectedQty > 0 && (
                        <span className="text-red-700 bg-red-50 px-2 py-0.5 rounded border border-red-200">
                          ✗ {grn.totalRejectedQty}
                        </span>
                      )}
                    </div>
                  </td>

                  <td className="px-4 py-4 text-center">
                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                      grn.inspectionResult === 'Passed'
                        ? 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                        : 'bg-amber-100 text-amber-800 border border-amber-200'
                    }`}>
                      {grn.inspectionResult}
                    </span>
                  </td>

                  <td className="px-4 py-4 text-center">
                    <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold ${
                      grn.status === 'Posted to Inventory'
                        ? 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                        : 'bg-amber-100 text-amber-800 border border-amber-200'
                    }`}>
                      {grn.status}
                    </span>
                  </td>

                  <td className="px-5 py-4 text-right">
                    <div className="flex items-center justify-end gap-1.5">
                      <button
                        onClick={() => setSelectedGrn(grn)}
                        className="px-2.5 py-1 rounded-lg text-xs font-semibold bg-slate-100 hover:bg-slate-200 text-slate-700"
                      >
                        Inspect
                      </button>

                      {grn.status !== 'Posted to Inventory' ? (
                        <button
                          onClick={() => handlePostInventory(grn)}
                          className="px-3 py-1 rounded-lg text-xs font-bold bg-teal-600 hover:bg-teal-700 text-white shadow-xs"
                        >
                          Post Stock →
                        </button>
                      ) : (
                        <span className="text-[10px] text-emerald-700 font-bold bg-emerald-50 px-2 py-1 rounded border border-emerald-200">
                          Stock Live ✓
                        </span>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* ── CREATE GRN MODAL ── */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-3xl overflow-hidden border border-slate-200 max-h-[90vh] flex flex-col">
            <div className="px-6 py-4 border-b border-slate-200 bg-slate-50 flex justify-between items-center">
              <div>
                <h3 className="text-base font-bold text-navy-900">Create Goods Receipt Note (GRN)</h3>
                <p className="text-xs text-slate-500">Record physical shipment against authorized Purchase Order.</p>
              </div>
              <button onClick={() => setShowCreateModal(false)} className="text-slate-400 font-bold text-xl">×</button>
            </div>

            <div className="p-6 space-y-4 overflow-y-auto flex-1 text-xs">
              {/* Select Purchase Order */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block font-semibold text-slate-600 mb-1">Select Purchase Order *</label>
                  <select
                    value={selectedPoId}
                    onChange={e => setSelectedPoId(e.target.value)}
                    className="w-full p-2 border border-slate-200 rounded-xl outline-none bg-white font-bold text-navy-900"
                  >
                    <option value="">-- Choose Approved PO --</option>
                    {purchaseOrders.filter(p => p.status !== 'Cancelled').map(po => (
                      <option key={po.id} value={po.id}>{po.poNumber} — {po.supplierName}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block font-semibold text-slate-600 mb-1">Supplier Delivery Challan / Inv # *</label>
                  <input
                    type="text"
                    value={challanNumber}
                    onChange={e => setChallanNumber(e.target.value)}
                    placeholder="e.g. DC-99881 or INV-5544"
                    className="w-full p-2 border border-slate-200 rounded-xl outline-none font-mono"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="block font-semibold text-slate-600 mb-1">Receipt Date</label>
                  <input
                    type="date"
                    value={challanDate}
                    onChange={e => setChallanDate(e.target.value)}
                    className="w-full p-2 border border-slate-200 rounded-xl outline-none"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-600 mb-1">Storage Location *</label>
                  <input
                    type="text"
                    value={storageLocation}
                    onChange={e => setStorageLocation(e.target.value)}
                    placeholder="e.g. Central Pharmacy Rack-B2"
                    className="w-full p-2 border border-slate-200 rounded-xl outline-none"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-600 mb-1">Inspection Result</label>
                  <select
                    value={inspectionResult}
                    onChange={e => setInspectionResult(e.target.value as InspectionResult)}
                    className="w-full p-2 border border-slate-200 rounded-xl outline-none bg-white"
                  >
                    <option value="Passed">Passed (100% Accepted)</option>
                    <option value="Partial Passed">Partial Passed (Defects Found)</option>
                    <option value="Quarantined">Quarantined for QA</option>
                    <option value="Failed">Failed / Rejected</option>
                  </select>
                </div>
              </div>

              {/* Items Table for Batch & Qty Verification */}
              {receivedItems.length > 0 && (
                <div>
                  <label className="block font-bold text-navy-900 uppercase tracking-wider mb-2">
                    Received Item Quantities &amp; Batch Expiry Tracking
                  </label>
                  <div className="space-y-3">
                    {receivedItems.map((item, idx) => (
                      <div key={item.id} className="p-3 bg-slate-50 border border-slate-200 rounded-2xl space-y-2">
                        <div className="font-bold text-slate-800">{item.itemName} (Ordered: {item.orderedQty})</div>
                        <div className="grid grid-cols-5 gap-2 items-center">
                          <div>
                            <span className="text-[10px] text-slate-400 block">Received Qty</span>
                            <input
                              type="number"
                              value={item.receivedQty}
                              onChange={e => updateItem(idx, 'receivedQty', e.target.value)}
                              className="w-full p-1.5 border border-slate-200 rounded-lg text-xs bg-white font-bold"
                            />
                          </div>

                          <div>
                            <span className="text-[10px] text-slate-400 block">Damaged/Rejected</span>
                            <input
                              type="number"
                              value={item.damagedQty}
                              onChange={e => updateItem(idx, 'damagedQty', e.target.value)}
                              className="w-full p-1.5 border border-slate-200 rounded-lg text-xs bg-white text-red-600 font-bold"
                            />
                          </div>

                          <div>
                            <span className="text-[10px] text-slate-400 block">Accepted Qty</span>
                            <div className="p-1.5 bg-emerald-50 text-emerald-800 rounded-lg font-extrabold text-center border border-emerald-200">
                              {item.acceptedQty}
                            </div>
                          </div>

                          <div>
                            <span className="text-[10px] text-slate-400 block">Batch / Lot #</span>
                            <input
                              type="text"
                              value={item.batchNo}
                              onChange={e => updateItem(idx, 'batchNo', e.target.value)}
                              className="w-full p-1.5 border border-slate-200 rounded-lg text-xs bg-white font-mono"
                            />
                          </div>

                          <div>
                            <span className="text-[10px] text-slate-400 block">Expiry Date *</span>
                            <input
                              type="date"
                              value={item.expiryDate}
                              onChange={e => updateItem(idx, 'expiryDate', e.target.value)}
                              className="w-full p-1.5 border border-slate-200 rounded-lg text-xs bg-white"
                            />
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div>
                <label className="block font-semibold text-slate-600 mb-1">Quality Inspection Remarks</label>
                <textarea
                  rows={2}
                  value={qualityRemarks}
                  onChange={e => setQualityRemarks(e.target.value)}
                  placeholder="Record package seal verification, temperature monitoring, damage observations..."
                  className="w-full p-2 border border-slate-200 rounded-xl outline-none"
                />
              </div>
            </div>

            <div className="px-6 py-3 bg-slate-50 border-t border-slate-200 flex justify-end gap-3">
              <button onClick={() => setShowCreateModal(false)} className="px-4 py-2 border border-slate-300 rounded-xl text-xs font-semibold">
                Cancel
              </button>
              <button onClick={handleCreateGrn} className="bg-teal-600 hover:bg-teal-700 text-white px-5 py-2 rounded-xl text-xs font-bold shadow-xs">
                Save &amp; Generate GRN
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── GRN DETAILS MODAL ── */}
      {selectedGrn && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-xl overflow-hidden border border-slate-200">
            <div className="px-6 py-4 border-b border-slate-200 bg-slate-50 flex justify-between items-center">
              <div>
                <h3 className="text-base font-bold text-navy-900">{selectedGrn.grnNumber} Quality Dossier</h3>
                <p className="text-xs text-slate-500">PO: {selectedGrn.poNumber} | Supplier: {selectedGrn.supplierName}</p>
              </div>
              <button onClick={() => setSelectedGrn(null)} className="text-slate-400 font-bold text-xl">×</button>
            </div>

            <div className="p-6 space-y-3 text-xs">
              <div className="grid grid-cols-2 gap-3 p-3 bg-slate-50 rounded-xl">
                <div>Challan #: <strong>{selectedGrn.deliveryChallanNumber}</strong></div>
                <div>Storage Location: <strong>{selectedGrn.storageLocation}</strong></div>
                <div>Inspection Result: <strong>{selectedGrn.inspectionResult}</strong></div>
                <div>Stock Status: <strong>{selectedGrn.status}</strong></div>
              </div>

              <div>
                <h4 className="font-bold text-slate-800 mb-1">Batch &amp; Expiry Breakdown:</h4>
                <div className="space-y-1.5 border border-slate-200 rounded-xl p-3 bg-slate-50">
                  {selectedGrn.items.map((i, idx) => (
                    <div key={idx} className="flex justify-between items-center text-xs">
                      <span className="font-semibold text-slate-800">{i.itemName}</span>
                      <div className="text-right">
                        <span className="font-bold text-emerald-700">{i.acceptedQty} accepted</span>
                        <span className="text-slate-400 font-mono ml-2">(Batch: {i.batchNo} | Exp: {i.expiryDate})</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="p-3 bg-teal-50/50 rounded-xl">
                <span className="font-bold text-teal-900 block mb-0.5">Quality Inspector Remarks:</span>
                <p className="text-slate-600 italic">"{selectedGrn.qualityRemarks}"</p>
              </div>
            </div>

            <div className="px-6 py-3 bg-slate-50 border-t border-slate-200 flex justify-end">
              <button onClick={() => setSelectedGrn(null)} className="px-4 py-1.5 bg-slate-200 rounded-xl font-bold text-slate-700">
                Close
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
