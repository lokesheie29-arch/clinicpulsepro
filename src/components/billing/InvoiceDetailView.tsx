import React, { useState, useRef } from 'react';
import { 
  Printer, 
  Download, 
  Send, 
  ArrowLeft, 
  CheckCircle2, 
  Clock, 
  Receipt, 
  QrCode, 
  ShieldCheck, 
  Ban, 
  RotateCcw, 
  Building2, 
  CreditCard,
  Share2,
  FileText,
  AlertTriangle,
  X
} from 'lucide-react';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import { useBilling } from '../../context/BillingContext';
import { EnhancedInvoice, InvoicePaymentRecord } from '../../types/billing';
import { formatInr, numberToIndianWords } from '../../lib/gstEngine';

interface InvoiceDetailViewProps {
  invoice: EnhancedInvoice;
  onBack: () => void;
  onIssueCreditNote: (invoice: EnhancedInvoice) => void;
}

export const InvoiceDetailView: React.FC<InvoiceDetailViewProps> = ({
  invoice,
  onBack,
  onIssueCreditNote
}) => {
  const { recordPayment, cancelInvoice, taxProfile } = useBilling();
  const invoiceRef = useRef<HTMLDivElement>(null);

  const [printLayout, setPrintLayout] = useState<'a4' | 'thermal'>('a4');
  const [isGeneratingPdf, setIsGeneratingPdf] = useState(false);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [cancelReason, setCancelReason] = useState('');

  // Payment Form State
  const [payAmount, setPayAmount] = useState<string>(String(invoice.balanceDue || 0));
  const [payMethod, setPayMethod] = useState<InvoicePaymentRecord['paymentMethod']>('upi');
  const [payRef, setPayRef] = useState('');
  const [isRecordingPayment, setIsRecordingPayment] = useState(false);

  const isCancelled = invoice.invoiceStatus === 'cancelled';
  const isPaid = invoice.paymentStatus === 'paid';

  // Direct Print
  const handlePrint = () => {
    window.print();
  };

  // Download PDF
  const handleDownloadPdf = async () => {
    if (!invoiceRef.current) return;
    setIsGeneratingPdf(true);
    try {
      const element = invoiceRef.current;
      const canvas = await html2canvas(element, {
        scale: 2,
        useCORS: true,
        logging: false,
        backgroundColor: '#FFFFFF'
      });

      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: printLayout === 'thermal' ? [80, 200] : 'a4'
      });

      if (printLayout === 'thermal') {
        const imgWidth = 76;
        const pageHeight = 200;
        const imgHeight = (canvas.height * imgWidth) / canvas.width;
        pdf.addImage(imgData, 'PNG', 2, 4, imgWidth, Math.min(imgHeight, pageHeight - 8));
      } else {
        const imgWidth = 210;
        const pageHeight = 297;
        const imgHeight = (canvas.height * imgWidth) / canvas.width;
        let heightLeft = imgHeight;
        let position = 0;

        pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
        heightLeft -= pageHeight;

        while (heightLeft >= 0) {
          position = heightLeft - imgHeight;
          pdf.addPage();
          pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
          heightLeft -= pageHeight;
        }
      }

      pdf.save(`${invoice.id.replace(/\//g, '_')}_Tax_Invoice.pdf`);
    } catch (err) {
      console.error('PDF generation error:', err);
      alert('Failed to generate PDF. You can also use the browser Print option.');
    } finally {
      setIsGeneratingPdf(false);
    }
  };

  // WhatsApp Share
  const handleShareWhatsApp = () => {
    const phone = invoice.customerDetails.phone?.replace(/\D/g, '') || '';
    const text = `*${invoice.businessDetails.businessName} - Official GST Tax Invoice*%0A%0AHello *${invoice.customerDetails.name}*,%0AHere are your bill details for Invoice *%23${invoice.id}*:%0A- Date: ${new Date(invoice.invoiceDate).toLocaleDateString('en-IN')}%0A- Taxable Value: ₹${invoice.totalTaxable.toFixed(2)}%0A- GST Output: ₹${invoice.totalTax.toFixed(2)}%0A- Grand Total: *₹${invoice.grandTotal.toFixed(2)}*%0A- Balance Due: *₹${invoice.balanceDue.toFixed(2)}*%0A- Payment Status: *${invoice.paymentStatus.toUpperCase()}*%0A%0AThank you for choosing ${invoice.businessDetails.businessName}!`;
    window.open(`https://wa.me/91${phone}?text=${text}`, '_blank');
  };

  // Submit Payment
  const handlePaymentSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const amt = parseFloat(payAmount);
    if (isNaN(amt) || amt <= 0) {
      alert('Please enter a valid payment amount.');
      return;
    }

    setIsRecordingPayment(true);
    try {
      await recordPayment(invoice.id, {
        amount: amt,
        paymentMethod: payMethod,
        transactionRef: payRef.trim() || undefined,
        notes: 'Recorded in Invoice Hub'
      });
      setShowPaymentModal(false);
    } catch (err: any) {
      alert(err.message || 'Error recording payment.');
    } finally {
      setIsRecordingPayment(false);
    }
  };

  // Submit Cancellation
  const handleCancelSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!cancelReason.trim()) {
      alert('Please enter a mandatory audit reason for voiding this invoice.');
      return;
    }
    try {
      await cancelInvoice(invoice.id, cancelReason.trim());
      setShowCancelModal(false);
    } catch (err: any) {
      alert(err.message || 'Error cancelling invoice.');
    }
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto pb-16">
      {/* Action Bar (Hidden on print) */}
      <div className="print:hidden flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-white p-4 rounded-3xl border border-slate-200 shadow-xs">
        <button
          onClick={onBack}
          className="inline-flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs font-semibold text-slate-600 bg-slate-100 hover:bg-slate-200 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Invoices</span>
        </button>

        <div className="flex flex-wrap items-center gap-2">
          {/* A4 vs Thermal layout switcher */}
          <div className="inline-flex bg-slate-100 p-1 rounded-xl text-xs font-semibold">
            <button
              onClick={() => setPrintLayout('a4')}
              className={`px-2.5 py-1 rounded-lg transition-all ${
                printLayout === 'a4' ? 'bg-white text-slate-900 shadow-xs font-bold' : 'text-slate-500'
              }`}
            >
              Standard A4
            </button>
            <button
              onClick={() => setPrintLayout('thermal')}
              className={`px-2.5 py-1 rounded-lg transition-all ${
                printLayout === 'thermal' ? 'bg-white text-slate-900 shadow-xs font-bold' : 'text-slate-500'
              }`}
            >
              Thermal POS (80mm)
            </button>
          </div>

          <button
            onClick={handlePrint}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl transition-colors"
          >
            <Printer className="w-3.5 h-3.5" />
            <span>Print</span>
          </button>

          <button
            onClick={handleDownloadPdf}
            disabled={isGeneratingPdf}
            className="inline-flex items-center gap-1.5 px-3.5 py-1.5 bg-teal-600 hover:bg-teal-700 text-white text-xs font-bold rounded-xl transition-colors shadow-xs"
          >
            <Download className="w-3.5 h-3.5" />
            <span>{isGeneratingPdf ? 'Generating...' : 'Download PDF'}</span>
          </button>

          <button
            onClick={handleShareWhatsApp}
            className="inline-flex items-center gap-1.5 px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl transition-colors shadow-xs"
          >
            <Send className="w-3.5 h-3.5" />
            <span>WhatsApp</span>
          </button>

          {!isCancelled && !isPaid && (
            <button
              onClick={() => setShowPaymentModal(true)}
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-xl transition-colors shadow-xs"
            >
              <CreditCard className="w-3.5 h-3.5" />
              <span>Record Payment</span>
            </button>
          )}

          {!isCancelled && (
            <button
              onClick={() => onIssueCreditNote(invoice)}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-purple-50 hover:bg-purple-100 text-purple-700 text-xs font-bold rounded-xl transition-colors border border-purple-200"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Credit Note</span>
            </button>
          )}

          {!isCancelled && (
            <button
              onClick={() => setShowCancelModal(true)}
              className="inline-flex items-center gap-1.5 px-2.5 py-1.5 text-rose-600 hover:bg-rose-50 text-xs font-semibold rounded-xl transition-colors"
            >
              <Ban className="w-3.5 h-3.5" />
              <span>Void</span>
            </button>
          )}
        </div>
      </div>

      {isCancelled && (
        <div className="p-4 bg-rose-50 border border-rose-200 rounded-2xl text-xs text-rose-800 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Ban className="w-4 h-4 text-rose-600 shrink-0" />
            <span>
              <strong>INVOICE CANCELLED & VOIDED:</strong> {invoice.cancelReason || 'Cancelled by staff'} (Reversed in GSTR reports)
            </span>
          </div>
          <span className="text-[11px] text-rose-600">
            {invoice.cancelledAt ? new Date(invoice.cancelledAt).toLocaleString('en-IN') : ''}
          </span>
        </div>
      )}

      {/* Main Printable Container */}
      <div className="flex justify-center">
        <div
          ref={invoiceRef}
          className={`bg-white text-slate-900 border border-slate-200 shadow-sm print:shadow-none print:border-none ${
            printLayout === 'thermal'
              ? 'w-[320px] p-4 text-[11px] leading-tight font-mono'
              : 'w-full max-w-4xl p-8 sm:p-10 text-xs rounded-3xl space-y-6'
          }`}
        >
          {/* THERMAL 80mm LAYOUT */}
          {printLayout === 'thermal' ? (
            <div className="space-y-3">
              <div className="text-center border-b border-dashed border-slate-400 pb-2">
                <p className="font-extrabold text-xs uppercase">{invoice.businessDetails.businessName}</p>
                <p className="text-[10px] text-slate-600">{invoice.businessDetails.address}</p>
                <p className="text-[10px] text-slate-600">GSTIN: {invoice.businessDetails.gstin}</p>
                {invoice.businessDetails.drugLicenseNo && (
                  <p className="text-[10px] text-slate-600">DL: {invoice.businessDetails.drugLicenseNo}</p>
                )}
                <p className="font-bold text-xs mt-1 border-t border-slate-300 pt-1">
                  TAX INVOICE {isCancelled ? '(CANCELLED)' : ''}
                </p>
              </div>

              <div className="text-[10px] space-y-0.5 border-b border-dashed border-slate-300 pb-2">
                <p>Inv #: <strong>{invoice.id}</strong></p>
                <p>Date: {new Date(invoice.invoiceDate).toLocaleString('en-IN')}</p>
                <p>Customer: {invoice.customerDetails.name}</p>
                {invoice.customerDetails.phone && <p>Phone: {invoice.customerDetails.phone}</p>}
                {invoice.customerDetails.gstin && <p>GSTIN: {invoice.customerDetails.gstin}</p>}
                <p>POS: {invoice.placeOfSupply}</p>
              </div>

              <div className="border-b border-dashed border-slate-400 pb-2">
                <table className="w-full text-left text-[10px]">
                  <thead>
                    <tr className="border-b border-slate-300">
                      <th className="py-1">Item</th>
                      <th className="py-1 text-center">Qty</th>
                      <th className="py-1 text-right">Amt (₹)</th>
                    </tr>
                  </thead>
                  <tbody>
                    {invoice.items.map((it, idx) => (
                      <tr key={idx}>
                        <td className="py-1 pr-1">
                          <p className="font-bold">{it.name}</p>
                          <p className="text-[9px] text-slate-500">HSN: {it.hsnSacCode} | GST: {it.gstRate}%</p>
                        </td>
                        <td className="py-1 text-center align-top">{it.quantity}</td>
                        <td className="py-1 text-right font-bold align-top">{it.totalAmount.toFixed(2)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div className="space-y-1 text-[10px] border-b border-dashed border-slate-400 pb-2 font-mono">
                <div className="flex justify-between">
                  <span>Taxable Value:</span>
                  <span>₹{invoice.totalTaxable.toFixed(2)}</span>
                </div>
                {!invoice.isInterState ? (
                  <>
                    <div className="flex justify-between">
                      <span>CGST:</span>
                      <span>₹{invoice.totalCgst.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>SGST:</span>
                      <span>₹{invoice.totalSgst.toFixed(2)}</span>
                    </div>
                  </>
                ) : (
                  <div className="flex justify-between">
                    <span>IGST:</span>
                    <span>₹{invoice.totalIgst.toFixed(2)}</span>
                  </div>
                )}
                {invoice.roundOff !== 0 && (
                  <div className="flex justify-between">
                    <span>Round-off:</span>
                    <span>{invoice.roundOff > 0 ? `+${invoice.roundOff}` : invoice.roundOff}</span>
                  </div>
                )}
                <div className="flex justify-between text-xs font-bold pt-1 border-t border-slate-300">
                  <span>Grand Total:</span>
                  <span>₹{invoice.grandTotal.toFixed(2)}</span>
                </div>
                <div className="flex justify-between font-bold text-teal-800">
                  <span>Paid ({invoice.paymentStatus.toUpperCase()}):</span>
                  <span>₹{invoice.amountPaid.toFixed(2)}</span>
                </div>
                {invoice.balanceDue > 0 && (
                  <div className="flex justify-between font-bold text-rose-600">
                    <span>Balance Due:</span>
                    <span>₹{invoice.balanceDue.toFixed(2)}</span>
                  </div>
                )}
              </div>

              <div className="text-center text-[9px] text-slate-500 pt-1 space-y-0.5">
                <p>WISH YOU A SPEEDY RECOVERY</p>
                <p>*** THANK YOU ***</p>
              </div>
            </div>
          ) : (
            /* STANDARD A4 TAX INVOICE */
            <>
              {/* Header */}
              <div className="flex flex-col sm:flex-row justify-between items-start gap-4 border-b border-slate-200 pb-6">
                <div>
                  <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
                    {invoice.businessDetails.businessName}
                  </h1>
                  {invoice.businessDetails.tradeName && (
                    <p className="text-xs font-bold text-teal-700">{invoice.businessDetails.tradeName}</p>
                  )}
                  <p className="text-xs text-slate-600 mt-1 max-w-md">{invoice.businessDetails.address}</p>
                  <div className="mt-2 text-[11px] space-y-0.5 text-slate-600">
                    <p>
                      <strong>GSTIN:</strong> <span className="font-mono font-bold">{invoice.businessDetails.gstin}</span>
                    </p>
                    {invoice.businessDetails.drugLicenseNo && (
                      <p>
                        <strong>Drug License:</strong> {invoice.businessDetails.drugLicenseNo}
                      </p>
                    )}
                    <p>
                      <strong>State / Code:</strong> {invoice.businessDetails.state} ({invoice.businessDetails.stateCode})
                    </p>
                    <p>
                      <strong>Contact:</strong> {invoice.businessDetails.phone} | {invoice.businessDetails.email}
                    </p>
                  </div>
                </div>

                <div className="text-right sm:text-right w-full sm:w-auto">
                  <div className="inline-block px-3 py-1 rounded-xl bg-slate-900 text-white font-black text-sm uppercase tracking-wider mb-2">
                    Tax Invoice
                  </div>
                  <p className="text-xs text-slate-500">Original for Recipient</p>
                  <p className="font-black text-base text-slate-900 font-mono mt-2">
                    {invoice.id}
                  </p>
                  <p className="text-xs text-slate-600">
                    Date: <strong>{new Date(invoice.invoiceDate).toLocaleDateString('en-IN')}</strong>
                  </p>
                  <p className="text-xs text-slate-600">
                    FY: <strong>{invoice.financialYear}</strong>
                  </p>
                  <div className="mt-2 inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider border">
                    {isPaid ? (
                      <span className="text-emerald-700 bg-emerald-50 border-emerald-200 px-2 py-0.5 rounded-full">
                        Status: PAID ✓
                      </span>
                    ) : (
                      <span className="text-rose-700 bg-rose-50 border-rose-200 px-2 py-0.5 rounded-full">
                        Status: {invoice.paymentStatus.toUpperCase()}
                      </span>
                    )}
                  </div>
                </div>
              </div>

              {/* Billed To / Place of Supply Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 bg-slate-50 p-4 rounded-2xl border border-slate-100 text-xs">
                <div>
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Details of Receiver (Billed To):</p>
                  <p className="font-bold text-slate-900 text-sm">{invoice.customerDetails.name}</p>
                  {invoice.customerDetails.address && <p className="text-slate-600">{invoice.customerDetails.address}</p>}
                  <p className="text-slate-600 mt-1">
                    <strong>State:</strong> {invoice.customerDetails.state} ({invoice.customerDetails.stateCode})
                  </p>
                  {invoice.customerDetails.gstin && (
                    <p className="text-teal-700 font-mono font-bold">
                      <strong>GSTIN:</strong> {invoice.customerDetails.gstin}
                    </p>
                  )}
                  {invoice.customerDetails.phone && (
                    <p className="text-slate-600"><strong>Phone:</strong> {invoice.customerDetails.phone}</p>
                  )}
                  {invoice.customerDetails.patientId && (
                    <p className="text-slate-600"><strong>Patient ID:</strong> {invoice.customerDetails.patientId}</p>
                  )}
                </div>

                <div className="border-t sm:border-t-0 sm:border-l border-slate-200 pt-3 sm:pt-0 sm:pl-6 space-y-1">
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Supply & Treatment Info:</p>
                  <p><strong>Place of Supply:</strong> {invoice.placeOfSupply}</p>
                  <p>
                    <strong>Tax Category:</strong>{' '}
                    <span className="font-semibold text-slate-900">
                      {invoice.isInterState ? 'Inter-State Supply (IGST)' : 'Intra-State Supply (CGST + SGST)'}
                    </span>
                  </p>
                  <p><strong>Pricing Basis:</strong> {invoice.priceType === 'inclusive' ? 'GST Inclusive' : 'GST Exclusive'}</p>
                  {invoice.customerDetails.doctorName && (
                    <p><strong>Prescribing Doctor:</strong> {invoice.customerDetails.doctorName}</p>
                  )}
                </div>
              </div>

              {/* Line Items Table */}
              <div className="border border-slate-200 rounded-2xl overflow-hidden">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-100 text-slate-600 font-bold uppercase border-b border-slate-200">
                    <tr>
                      <th className="py-2.5 px-3 w-8">#</th>
                      <th className="py-2.5 px-3">Item / Service Description</th>
                      <th className="py-2.5 px-2 text-center w-16">HSN/SAC</th>
                      <th className="py-2.5 px-2 text-center w-14">Qty</th>
                      <th className="py-2.5 px-2 text-right w-16">Price</th>
                      <th className="py-2.5 px-2 text-right w-14">Disc</th>
                      <th className="py-2.5 px-2 text-right w-20">Taxable</th>
                      <th className="py-2.5 px-2 text-center w-12">GST %</th>
                      {!invoice.isInterState ? (
                        <>
                          <th className="py-2.5 px-2 text-right w-16">CGST</th>
                          <th className="py-2.5 px-2 text-right w-16">SGST</th>
                        </>
                      ) : (
                        <th className="py-2.5 px-2 text-right w-20">IGST</th>
                      )}
                      <th className="py-2.5 px-3 text-right w-20">Total (₹)</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {invoice.items.map((it, idx) => (
                      <tr key={idx} className="hover:bg-slate-50/50">
                        <td className="py-2.5 px-3 text-slate-400">{idx + 1}</td>
                        <td className="py-2.5 px-3">
                          <p className="font-bold text-slate-900">{it.name}</p>
                          {it.batchNo && (
                            <span className="text-[10px] text-slate-500 font-mono block">
                              Batch: {it.batchNo} | Exp: {it.expiryDate}
                            </span>
                          )}
                        </td>
                        <td className="py-2.5 px-2 text-center font-mono text-slate-600">{it.hsnSacCode}</td>
                        <td className="py-2.5 px-2 text-center font-medium">{it.quantity} {it.unit}</td>
                        <td className="py-2.5 px-2 text-right">{it.unitPrice.toFixed(2)}</td>
                        <td className="py-2.5 px-2 text-right text-slate-500">{it.discountAmount > 0 ? it.discountAmount.toFixed(2) : '-'}</td>
                        <td className="py-2.5 px-2 text-right font-medium">{it.taxableAmount.toFixed(2)}</td>
                        <td className="py-2.5 px-2 text-center font-bold text-slate-700">{it.gstRate}%</td>
                        {!invoice.isInterState ? (
                          <>
                            <td className="py-2.5 px-2 text-right text-slate-600">{it.cgstAmount.toFixed(2)}</td>
                            <td className="py-2.5 px-2 text-right text-slate-600">{it.sgstAmount.toFixed(2)}</td>
                          </>
                        ) : (
                          <td className="py-2.5 px-2 text-right text-indigo-700 font-semibold">{it.igstAmount.toFixed(2)}</td>
                        )}
                        <td className="py-2.5 px-3 text-right font-bold text-slate-900">{it.totalAmount.toFixed(2)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Bottom Summary & Tax Breakdowns */}
              <div className="grid grid-cols-1 sm:grid-cols-12 gap-6 items-start pt-2">
                {/* Left: Words, Bank Details & UPI QR */}
                <div className="sm:col-span-7 space-y-3">
                  <div className="bg-slate-50 p-3 rounded-xl border border-slate-100">
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-0.5">Amount Chargeable in Words:</p>
                    <p className="font-bold text-slate-800 text-xs italic">
                      {numberToIndianWords(invoice.grandTotal)}
                    </p>
                  </div>

                  {taxProfile.bankDetails && (
                    <div className="bg-slate-50 p-3 rounded-xl border border-slate-100 text-[11px] text-slate-600 space-y-0.5">
                      <p className="font-bold text-slate-800 text-xs mb-1 flex items-center gap-1">
                        <Building2 className="w-3.5 h-3.5 text-teal-600" />
                        <span>Direct Bank Payment Settlement:</span>
                      </p>
                      <p>Bank: <strong>{taxProfile.bankDetails.bankName}</strong> | Account: <strong>{taxProfile.bankDetails.accountNumber}</strong></p>
                      <p>IFSC Code: <strong>{taxProfile.bankDetails.ifscCode}</strong> | A/c Name: <strong>{taxProfile.bankDetails.accountHolderName}</strong></p>
                      {taxProfile.bankDetails.upiId && (
                        <p className="text-teal-700 font-bold">UPI ID: {taxProfile.bankDetails.upiId}</p>
                      )}
                    </div>
                  )}

                  <div className="text-[10px] text-slate-400 leading-relaxed">
                    <p><strong>Statutory Terms:</strong> {invoice.termsAndConditions || '1. Medicine sales are compliant with Schedule H/H1 drug guidelines. 2. Clinical establishment consultations are exempt from GST under Notification 12/2017-CT(R).'}</p>
                  </div>
                </div>

                {/* Right: Calculations Totals */}
                <div className="sm:col-span-5 bg-slate-50 p-4 rounded-2xl border border-slate-100 space-y-2 text-xs">
                  <div className="flex justify-between text-slate-600">
                    <span>Subtotal:</span>
                    <span className="font-semibold text-slate-900">{formatInr(invoice.subTotal)}</span>
                  </div>

                  {invoice.totalDiscount > 0 && (
                    <div className="flex justify-between text-amber-700 font-medium">
                      <span>Total Discount:</span>
                      <span>- {formatInr(invoice.totalDiscount)}</span>
                    </div>
                  )}

                  <div className="flex justify-between font-bold text-slate-800 border-t border-slate-200 pt-1">
                    <span>Taxable Value:</span>
                    <span>{formatInr(invoice.totalTaxable)}</span>
                  </div>

                  {!invoice.isInterState ? (
                    <>
                      <div className="flex justify-between text-[11px] text-slate-500">
                        <span>Central Tax (CGST):</span>
                        <span>{formatInr(invoice.totalCgst)}</span>
                      </div>
                      <div className="flex justify-between text-[11px] text-slate-500">
                        <span>State Tax (SGST):</span>
                        <span>{formatInr(invoice.totalSgst)}</span>
                      </div>
                    </>
                  ) : (
                    <div className="flex justify-between text-[11px] text-indigo-700 font-semibold">
                      <span>Integrated Tax (IGST):</span>
                      <span>{formatInr(invoice.totalIgst)}</span>
                    </div>
                  )}

                  {invoice.roundOff !== 0 && (
                    <div className="flex justify-between text-[11px] text-slate-400">
                      <span>Round Off:</span>
                      <span>{invoice.roundOff > 0 ? `+${invoice.roundOff}` : invoice.roundOff}</span>
                    </div>
                  )}

                  <div className="flex justify-between font-black text-slate-900 text-sm border-t border-slate-200 pt-2">
                    <span>Grand Total:</span>
                    <span className="text-teal-700 text-base">{formatInr(invoice.grandTotal)}</span>
                  </div>

                  <div className="flex justify-between font-bold text-xs text-emerald-700 border-t border-slate-200 pt-1.5">
                    <span>Amount Paid:</span>
                    <span>{formatInr(invoice.amountPaid)}</span>
                  </div>

                  {invoice.balanceDue > 0 && (
                    <div className="flex justify-between font-bold text-xs text-rose-600">
                      <span>Balance Outstanding:</span>
                      <span>{formatInr(invoice.balanceDue)}</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Signatures & Footer */}
              <div className="pt-8 border-t border-slate-200 flex justify-between items-end text-xs text-slate-500">
                <div>
                  <p className="font-semibold text-slate-800">Prepared By: {invoice.createdBy || 'Authorized Cashier'}</p>
                  <p className="text-[10px]">Computer Generated GST Compliant Tax Invoice</p>
                </div>
                <div className="text-right">
                  <div className="h-10"></div>
                  <p className="border-t border-slate-400 pt-1 font-bold text-slate-900">
                    For {invoice.businessDetails.businessName}
                  </p>
                  <p className="text-[10px]">Authorized Signatory</p>
                </div>
              </div>
            </>
          )}
        </div>
      </div>

      {/* Payment Recording Modal */}
      {showPaymentModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-200 animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-4">
              <h3 className="font-bold text-sm text-slate-900 flex items-center gap-2">
                <CreditCard className="w-4 h-4 text-teal-600" />
                <span>Record Invoice Payment</span>
              </h3>
              <button onClick={() => setShowPaymentModal(false)} className="p-1 text-slate-400 hover:text-slate-600">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handlePaymentSubmit} className="space-y-4 text-xs">
              <div className="bg-slate-50 p-3 rounded-xl space-y-1">
                <p><strong>Invoice:</strong> {invoice.id}</p>
                <p><strong>Customer:</strong> {invoice.customerDetails.name}</p>
                <p><strong>Grand Total:</strong> {formatInr(invoice.grandTotal)}</p>
                <p><strong>Outstanding Due:</strong> <span className="font-bold text-rose-600">{formatInr(invoice.balanceDue)}</span></p>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Amount to Collect (₹)</label>
                <input
                  type="number"
                  step="0.01"
                  required
                  max={invoice.balanceDue}
                  value={payAmount}
                  onChange={(e) => setPayAmount(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500 font-bold"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Payment Method</label>
                <select
                  value={payMethod}
                  onChange={(e) => setPayMethod(e.target.value as any)}
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:outline-none font-bold bg-white"
                >
                  <option value="upi">UPI / QR Code</option>
                  <option value="cash">Cash Counter</option>
                  <option value="card">Credit / Debit Card</option>
                  <option value="bank_transfer">Bank Transfer (NEFT/RTGS)</option>
                  <option value="cheque">Cheque</option>
                </select>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Reference / UTR / Auth No</label>
                <input
                  type="text"
                  placeholder="e.g. UPI/260410/009182"
                  value={payRef}
                  onChange={(e) => setPayRef(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:outline-none font-mono"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowPaymentModal(false)}
                  className="px-4 py-2 font-semibold text-slate-600 hover:bg-slate-100 rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isRecordingPayment}
                  className="px-4 py-2 font-bold text-white bg-teal-600 hover:bg-teal-700 rounded-xl shadow-xs"
                >
                  {isRecordingPayment ? 'Recording...' : 'Confirm Payment'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Invoice Void / Cancel Modal */}
      {showCancelModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-200 animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-4">
              <h3 className="font-bold text-sm text-rose-700 flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-rose-600" />
                <span>Void & Cancel Invoice {invoice.id}</span>
              </h3>
              <button onClick={() => setShowCancelModal(false)} className="p-1 text-slate-400 hover:text-slate-600">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCancelSubmit} className="space-y-4 text-xs">
              <div className="bg-rose-50 border border-rose-200 p-3 rounded-xl text-rose-900 space-y-1">
                <p><strong>Warning:</strong> Cancelling an invoice voids its tax liability from GST returns.</p>
                <p>A permanent audit entry will be recorded under your staff login.</p>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Mandatory Cancellation Reason <span className="text-rose-500">*</span>
                </label>
                <textarea
                  required
                  rows={3}
                  placeholder="e.g. Patient appointment cancelled / accidental duplicate entry..."
                  value={cancelReason}
                  onChange={(e) => setCancelReason(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-rose-500"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowCancelModal(false)}
                  className="px-4 py-2 font-semibold text-slate-600 hover:bg-slate-100 rounded-xl"
                >
                  Back
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 font-bold text-white bg-rose-600 hover:bg-rose-700 rounded-xl shadow-xs"
                >
                  Confirm Void Invoice
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
