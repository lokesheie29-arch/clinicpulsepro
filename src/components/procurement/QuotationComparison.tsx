import React, { useState } from 'react';
import {
  TrendingDown,
  CheckCircle2,
  Award,
  AlertCircle,
  Clock,
  ArrowRight,
  ShieldCheck,
  FileCheck2,
  DollarSign
} from 'lucide-react';
import { useProcurement } from '../../context/ProcurementContext';
import { RequestForQuotation, SupplierQuotationEntry, PurchaseOrder } from '../../types/procurement';
import { v4 as uuidv4 } from 'uuid';
import confetti from 'canvas-confetti';

export const QuotationComparison = ({
  rfqId,
  onPoGenerated
}: {
  rfqId?: string;
  onPoGenerated?: (poId: string) => void;
}) => {
  const { rfqs, selectQuotation, createPurchaseOrder, suppliers } = useProcurement();

  const [activeRfqId, setActiveRfqId] = useState<string>(rfqId || (rfqs[0]?.id || ''));
  const [selectionJustification, setSelectionJustification] = useState('');
  const [selectedQuoteId, setSelectedQuoteId] = useState<string>('');

  const currentRfq = rfqs.find(r => r.id === activeRfqId) || rfqs[0];

  if (!currentRfq) {
    return <div className="text-center py-12 text-slate-500 text-xs">No RFQs available for quotation comparison.</div>;
  }

  // Find lowest landed cost (L1)
  const quotes = currentRfq.quotations || [];
  const minLandedCost = quotes.length > 0 ? Math.min(...quotes.map(q => q.totalLandedCost)) : 0;

  const handleSelectVendor = (quoteId: string) => {
    setSelectedQuoteId(quoteId);
    const chosen = quotes.find(q => q.id === quoteId);
    if (chosen) {
      if (chosen.totalLandedCost === minLandedCost) {
        setSelectionJustification('Lowest landed cost (L1) with verified compliance and fast delivery lead time.');
      } else {
        setSelectionJustification(`Selected for superior reliability and shorter lead time (${chosen.leadTimeDays} days) despite variance.`);
      }
    }
  };

  const handleAwardAndGeneratePO = () => {
    if (!selectedQuoteId) {
      alert('Please select a quotation from the comparison matrix.');
      return;
    }

    if (!selectionJustification.trim()) {
      alert('Please record an audit justification for supplier selection.');
      return;
    }

    const awardedQuote = quotes.find(q => q.id === selectedQuoteId);
    if (!awardedQuote) return;

    selectQuotation(currentRfq.id, selectedQuoteId, selectionJustification);

    const supplier = suppliers.find(s => s.id === awardedQuote.supplierId);
    const nextPoNumber = `PO-${new Date().getFullYear()}-${String(Math.floor(1000 + Math.random() * 9000))}`;

    const newPO: PurchaseOrder = {
      id: `po-${uuidv4().substring(0, 8)}`,
      poNumber: nextPoNumber,
      revisionNumber: 0,
      organizationId: 'org-default',
      branch: 'Main Hospital Center',
      department: 'Central Pharmacy',
      supplierId: awardedQuote.supplierId,
      supplierName: awardedQuote.supplierName,
      supplierGstin: supplier?.gstin || '33AAACA1234A1Z5',
      supplierAddress: supplier?.billingAddress || 'Chennai, Tamil Nadu',
      supplierEmail: supplier?.email || 'orders@supplier.com',
      supplierPhone: supplier?.phone || '+91 9840123456',
      rfqId: currentRfq.id,
      requisitionId: currentRfq.requisitionId,
      poDate: new Date().toISOString().split('T')[0],
      expectedDeliveryDate: new Date(Date.now() + awardedQuote.leadTimeDays * 86400000).toISOString().split('T')[0],
      paymentTerms: awardedQuote.paymentTerms,
      deliveryTerms: 'Door Delivery to Hospital Central Pharmacy Store',
      billToAddress: 'ClinicPulse Pro Healthcare Center, No.29, Kamarajar Street, Pallavan Nagar, TNHB, Kancheepuram, Tamil Nadu. 631501',
      shipToAddress: 'ClinicPulse Pro Healthcare Center, No.29, Kamarajar Street, Pallavan Nagar, TNHB, Kancheepuram, Tamil Nadu. 631501',
      status: 'Approved',
      items: currentRfq.items.map(item => {
        const qItem = awardedQuote.items.find(qi => qi.itemName === item.itemName);
        const rate = qItem ? qItem.quotedRate : item.estimatedUnitPrice;
        return {
          ...item,
          estimatedUnitPrice: rate,
          quotedUnitPrice: rate,
          totalAmount: rate * item.requestedQty * (1 + item.gstRate / 100)
        };
      }),
      subTotal: awardedQuote.subTotal,
      totalDiscount: 0,
      taxableAmount: awardedQuote.subTotal,
      cgstTotal: awardedQuote.totalTax / 2,
      sgstTotal: awardedQuote.totalTax / 2,
      igstTotal: 0,
      freightCharges: awardedQuote.freightCharges,
      totalAmount: awardedQuote.totalLandedCost,
      termsAndConditions: '1. Standard inspection upon receipt.\n2. Invoices must include GSTIN, PO number, and batch CoA.',
      authorizedSignatory: 'Dr. Lokesh K. (Medical Superintendent)',
      approvedBy: 'Procurement Committee',
      approvedAt: new Date().toISOString(),
      deliveredQuantitySummary: {
        totalOrderedQty: currentRfq.items.reduce((a, b) => a + b.requestedQty, 0),
        totalReceivedQty: 0,
        totalPendingQty: currentRfq.items.reduce((a, b) => a + b.requestedQty, 0)
      },
      auditTrail: [
        {
          action: 'PO Generated from Quotation Evaluation',
          performedBy: 'Procurement Specialist',
          timestamp: new Date().toISOString(),
          notes: selectionJustification
        }
      ],
      createdAt: new Date().toISOString()
    };

    createPurchaseOrder(newPO);
    confetti({ particleCount: 80, spread: 70, origin: { y: 0.6 } });

    if (onPoGenerated) {
      onPoGenerated(newPO.id);
    } else {
      alert(`Purchase Order ${newPO.poNumber} generated successfully!`);
    }
  };

  return (
    <div className="space-y-6">

      {/* Header and RFQ Selector */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-xl font-extrabold text-navy-900">Quotation Comparison Matrix</h2>
          <p className="text-xs text-slate-500">Commercial &amp; technical evaluation across competing supplier quotes.</p>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-xs font-semibold text-slate-600">Select RFQ:</span>
          <select
            value={activeRfqId}
            onChange={e => setActiveRfqId(e.target.value)}
            className="p-2 border border-slate-200 rounded-xl text-xs font-bold text-navy-900 bg-white outline-none shadow-xs"
          >
            {rfqs.map(r => (
              <option key={r.id} value={r.id}>{r.rfqNumber} - {r.title}</option>
            ))}
          </select>
        </div>
      </div>

      {/* RFQ Meta Info Bar */}
      <div className="bg-slate-50 border border-slate-200 p-4 rounded-2xl flex flex-wrap justify-between items-center gap-3 text-xs">
        <div>
          <span className="text-slate-500">RFQ Reference:</span> <strong className="text-navy-900">{currentRfq.rfqNumber}</strong>
          <span className="mx-2 text-slate-300">•</span>
          <span className="text-slate-500">Subject:</span> <strong>{currentRfq.title}</strong>
        </div>
        <div>
          <span className="text-slate-500">Bids Received:</span> <strong className="text-teal-700">{quotes.length} Vendors</strong>
          <span className="mx-2 text-slate-300">•</span>
          <span className="text-slate-500">Status:</span> <strong className="text-emerald-700">{currentRfq.status}</strong>
        </div>
      </div>

      {/* Comparison Grid */}
      {quotes.length === 0 ? (
        <div className="bg-white p-12 text-center rounded-2xl border border-slate-200 text-xs text-slate-400">
          No supplier quotations have been recorded yet for this RFQ. Click "Record Vendor Quote" in the RFQ tab.
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left border-collapse">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 uppercase tracking-wider font-semibold">
                  <th className="p-4 w-48">Evaluation Criteria</th>
                  {quotes.map(q => {
                    const isL1 = q.totalLandedCost === minLandedCost;
                    const isSelected = selectedQuoteId ? selectedQuoteId === q.id : q.isSelected;

                    return (
                      <th
                        key={q.id}
                        className={`p-4 text-center min-w-[200px] border-l border-slate-200 ${
                          isSelected ? 'bg-teal-50/60' : ''
                        }`}
                      >
                        {isL1 && (
                          <div className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-[10px] font-extrabold mb-1">
                            <Award className="h-3 w-3" />
                            <span>L1 - Lowest Cost</span>
                          </div>
                        )}
                        <div className="text-sm font-extrabold text-navy-900">{q.supplierName}</div>
                        <div className="text-[10px] font-mono text-slate-500 font-normal">Ref: {q.quotationRefNumber}</div>
                      </th>
                    );
                  })}
                </tr>
              </thead>

              <tbody className="divide-y divide-slate-100">
                {/* Item Rates */}
                {currentRfq.items.map(item => (
                  <tr key={item.id} className="hover:bg-slate-50/50">
                    <td className="p-3.5 font-semibold text-slate-800 bg-slate-50/50">
                      <div>{item.itemName}</div>
                      <div className="text-[10px] text-slate-400 font-normal">Requested Qty: {item.requestedQty} {item.uom}</div>
                    </td>
                    {quotes.map(q => {
                      const quoteItem = q.items.find(qi => qi.itemName === item.itemName);
                      return (
                        <td key={q.id} className="p-3.5 text-center border-l border-slate-100 font-mono">
                          <div className="font-bold text-navy-900">₹{quoteItem ? quoteItem.quotedRate.toFixed(2) : '-'} / {item.uom}</div>
                          <div className="text-[10px] text-slate-400 font-sans">Total: ₹{quoteItem ? quoteItem.totalAmount.toFixed(2) : '-'}</div>
                        </td>
                      );
                    })}
                  </tr>
                ))}

                {/* Sub Total */}
                <tr className="bg-slate-50/30">
                  <td className="p-3.5 font-bold text-slate-700">Subtotal (Taxable)</td>
                  {quotes.map(q => (
                    <td key={q.id} className="p-3.5 text-center border-l border-slate-100 font-bold font-mono">
                      ₹{q.subTotal.toFixed(2)}
                    </td>
                  ))}
                </tr>

                {/* Taxes & GST */}
                <tr>
                  <td className="p-3.5 text-slate-600 font-medium">GST / Taxes</td>
                  {quotes.map(q => (
                    <td key={q.id} className="p-3.5 text-center border-l border-slate-100 font-mono text-slate-600">
                      ₹{q.totalTax.toFixed(2)}
                    </td>
                  ))}
                </tr>

                {/* Freight */}
                <tr>
                  <td className="p-3.5 text-slate-600 font-medium">Freight &amp; Handling</td>
                  {quotes.map(q => (
                    <td key={q.id} className="p-3.5 text-center border-l border-slate-100 font-mono text-slate-600">
                      {q.freightCharges === 0 ? <span className="text-emerald-600 font-bold">FREE</span> : `₹${q.freightCharges.toFixed(2)}`}
                    </td>
                  ))}
                </tr>

                {/* Total Landed Cost (Highlighted) */}
                <tr className="bg-teal-50/40 border-t-2 border-b-2 border-teal-200">
                  <td className="p-4 font-extrabold text-teal-900 text-sm">TOTAL LANDED COST</td>
                  {quotes.map(q => {
                    const isL1 = q.totalLandedCost === minLandedCost;
                    return (
                      <td key={q.id} className="p-4 text-center border-l border-teal-200">
                        <div className="text-base font-extrabold text-teal-900 font-mono">
                          ₹{q.totalLandedCost.toFixed(2)}
                        </div>
                        {isL1 && (
                          <span className="text-[10px] font-bold text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded-full inline-block mt-0.5">
                            Best Landed Price
                          </span>
                        )}
                      </td>
                    );
                  })}
                </tr>

                {/* Lead Time */}
                <tr>
                  <td className="p-3.5 text-slate-600 font-medium">Delivery Lead Time</td>
                  {quotes.map(q => (
                    <td key={q.id} className="p-3.5 text-center border-l border-slate-100 font-bold text-slate-800">
                      {q.leadTimeDays} Business Days
                    </td>
                  ))}
                </tr>

                {/* Payment Terms */}
                <tr>
                  <td className="p-3.5 text-slate-600 font-medium">Payment Terms</td>
                  {quotes.map(q => (
                    <td key={q.id} className="p-3.5 text-center border-l border-slate-100 text-slate-700">
                      {q.paymentTerms}
                    </td>
                  ))}
                </tr>

                {/* Selection Radio Row */}
                <tr className="bg-slate-50">
                  <td className="p-4 font-bold text-navy-900">Select Awardee</td>
                  {quotes.map(q => {
                    const isSelected = selectedQuoteId === q.id || (!selectedQuoteId && q.isSelected);
                    return (
                      <td key={q.id} className="p-4 text-center border-l border-slate-200">
                        <button
                          type="button"
                          onClick={() => handleSelectVendor(q.id)}
                          className={`w-full py-2 px-3 rounded-xl text-xs font-bold transition-all ${
                            isSelected
                              ? 'bg-teal-600 text-white shadow-sm ring-2 ring-teal-400'
                              : 'bg-white border border-slate-300 text-slate-700 hover:bg-slate-100'
                          }`}
                        >
                          {isSelected ? '✓ Selected Awardee' : 'Select Vendor'}
                        </button>
                      </td>
                    );
                  })}
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Award & Justification Bar */}
      {quotes.length > 0 && (
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-4">
          <div>
            <label className="block text-xs font-bold text-navy-900 mb-1">
              Recorded Selection Justification &amp; Compliance Notes *
            </label>
            <input
              type="text"
              value={selectionJustification}
              onChange={e => setSelectionJustification(e.target.value)}
              placeholder="e.g. Awarded to L1 supplier based on lowest landed cost, verified cold chain compliance, and 2-day delivery guarantee..."
              className="w-full p-2.5 border border-slate-200 rounded-xl text-xs outline-none focus:ring-2 focus:ring-teal-500"
            />
          </div>

          <div className="flex justify-between items-center pt-2">
            <div className="text-xs text-slate-500">
              Approved vendor will be converted into an authorized Purchase Order (PO) with full audit tracking.
            </div>
            <button
              onClick={handleAwardAndGeneratePO}
              className="flex items-center space-x-2 bg-teal-600 hover:bg-teal-700 text-white px-6 py-3 rounded-xl text-xs font-bold transition-all shadow-sm"
            >
              <span>Approve Selection &amp; Issue Purchase Order</span>
              <ArrowRight className="h-4 w-4" />
            </button>
          </div>
        </div>
      )}

    </div>
  );
};
