import { useMemo } from 'react';
import { Printer, Smartphone, CheckCircle } from 'lucide-react';
import { useAppState } from '../../context/AppStateContext';
import { doctors } from '../../data/mockData';
import confetti from 'canvas-confetti';

export const InvoiceHub = ({ selectedInvoiceId }: { selectedInvoiceId: string | null }) => {
  const { invoices } = useAppState();
  
  const invoice = useMemo(() => {
    if (selectedInvoiceId) {
      return invoices.find(i => i.id === selectedInvoiceId) || invoices[0];
    }
    return invoices[0];
  }, [invoices, selectedInvoiceId]);

  if (!invoice) {
    return <div className="text-center py-12 text-slate-500">No invoices available.</div>;
  }

  const doctor = doctors.find(d => d.id === invoice.doctorId);

  const handleWhatsAppShare = () => {
    confetti({
      particleCount: 100,
      spread: 70,
      origin: { y: 0.6 },
      colors: ['#00A896', '#0D9488', '#0F4C81']
    });

    const text = `*ClinicPulse Pro - Medical Tax Invoice* %0A%0AHello *${invoice.patient.name}*,%0AThank you for your visit today.%0A%0A*Invoice ID:* ${invoice.id}%0A*Doctor:* ${doctor?.name}%0A*Total Amount:* ₹${invoice.totalAmount.toFixed(2)}%0A%0A*Medicines Prescribed:*%0A${invoice.prescriptionItems.map(p => `- ${p.medicineName} (${p.dosage}) for ${p.durationDays} days`).join('%0A')}%0A%0A*Payment Link:* https://pay.clinicpulse.demo/${invoice.id}%0A%0ARecovery well!`;
    
    window.open(`https://wa.me/91${invoice.patient.phone}?text=${text}`, '_blank');
  };

  const vpa = "clinicpulse@upi";
  const upiString = `upi://pay?pa=${vpa}&pn=ClinicPulse&am=${invoice.totalAmount.toFixed(2)}&cu=INR&tn=Invoice-${invoice.id}`;
  const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${encodeURIComponent(upiString)}`;

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
      {/* Left: Invoice Preview */}
      <div className="lg:col-span-2">
        <div className="bg-white p-8 rounded-xl border border-slate-200 shadow-sm print:border-none print:shadow-none print:p-0" id="printable-invoice">
          {/* Header */}
          <div className="flex justify-between items-start border-b border-slate-200 pb-6 mb-6">
            <div>
              <h1 className="text-2xl font-bold text-navy-900">CLINICPULSE PRO CLINIC</h1>
              <p className="text-sm text-slate-500 mt-1">123 Health Avenue, Chennai, TN - 600001</p>
              <p className="text-sm text-slate-500">GSTIN: 33ABCDE1234F1Z5</p>
            </div>
            <div className="text-right">
              <h2 className="text-xl font-bold text-teal-700">TAX INVOICE</h2>
              <p className="text-sm font-medium text-navy-900 mt-1">#{invoice.id}</p>
              <p className="text-sm text-slate-500">Date: {new Date(invoice.date).toLocaleDateString()}</p>
            </div>
          </div>

          {/* Details */}
          <div className="flex justify-between mb-8">
            <div>
              <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">Patient Details</h3>
              <p className="font-medium text-navy-900">{invoice.patient.name} ({invoice.patient.age}{invoice.patient.gender[0]})</p>
              <p className="text-sm text-slate-600">+91 {invoice.patient.phone}</p>
            </div>
            <div className="text-right">
              <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">Consulting Doctor</h3>
              <p className="font-medium text-navy-900">{doctor?.name}</p>
              <p className="text-sm text-slate-600">{doctor?.specialty} | {doctor?.regNo}</p>
            </div>
          </div>

          {/* Items */}
          <table className="w-full mb-8">
            <thead>
              <tr className="border-b-2 border-slate-200 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">
                <th className="py-3">Description</th>
                <th className="py-3 text-center">Qty</th>
                <th className="py-3 text-right">Rate</th>
                <th className="py-3 text-right">Amount</th>
              </tr>
            </thead>
            <tbody className="text-sm">
              <tr className="border-b border-slate-100">
                <td className="py-3">
                  <div className="font-medium text-navy-900">OPD Consultation</div>
                  <div className="text-xs text-slate-500">SAC: 999312</div>
                </td>
                <td className="py-3 text-center">-</td>
                <td className="py-3 text-right">₹{invoice.consultationFee.toFixed(2)}</td>
                <td className="py-3 text-right font-medium">₹{invoice.consultationFee.toFixed(2)}</td>
              </tr>
              {invoice.prescriptionItems.map(item => (
                <tr key={item.id} className="border-b border-slate-100">
                  <td className="py-3">
                    <div className="font-medium text-navy-900">{item.medicineName}</div>
                    <div className="text-xs text-slate-500">
                      HSN: {item.hsn || item.id} | GST: {item.gstRate}%
                    </div>
                    <div className="text-[11px] text-slate-400 mt-0.5">
                      Batch: {item.batchNo || 'N/A'} | Exp: {item.expiryDate ? new Date(item.expiryDate).toLocaleDateString('en-GB', { month: 'short', year: '2-digit' }) : 'N/A'}
                    </div>
                  </td>
                  <td className="py-3 text-center">{item.quantity}</td>
                  <td className="py-3 text-right">₹{item.pricePerUnit.toFixed(2)}</td>
                  <td className="py-3 text-right font-medium">₹{item.totalPrice.toFixed(2)}</td>
                </tr>
              ))}
            </tbody>
          </table>

          {/* Totals */}
          <div className="flex justify-end">
            <div className="w-64 space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-slate-600">Subtotal:</span>
                <span className="font-medium">₹{invoice.subTotal.toFixed(2)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-600">CGST:</span>
                <span className="font-medium">₹{invoice.cgst.toFixed(2)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-600">SGST:</span>
                <span className="font-medium">₹{invoice.sgst.toFixed(2)}</span>
              </div>
              <div className="flex justify-between border-t border-slate-200 pt-2 text-lg font-bold text-navy-900">
                <span>Total:</span>
                <span className="text-teal-700">₹{invoice.totalAmount.toFixed(2)}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Right: Actions & QR */}
      <div className="lg:col-span-1 space-y-6 print:hidden">
        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm text-center">
          <h3 className="text-lg font-semibold text-navy-900 mb-2">Scan & Pay</h3>
          <p className="text-sm text-slate-500 mb-4">Accept instant UPI payments with auto-reconciliation.</p>
          <div className="inline-block p-2 border-2 border-dashed border-teal-200 rounded-xl mb-4 bg-white">
            <img src={qrUrl} alt="UPI QR Code" className="w-36 h-36 mx-auto" />
          </div>
          <div className="flex items-center justify-center space-x-2 text-sm font-medium text-emerald-600 bg-emerald-50 py-2 rounded-lg">
            <CheckCircle className="h-4 w-4" />
            <span>Amount: ₹{invoice.totalAmount.toFixed(2)}</span>
          </div>
        </div>

        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm flex flex-col space-y-3">
          <button 
            onClick={handleWhatsAppShare}
            className="w-full flex items-center justify-center space-x-2 bg-[#25D366] hover:bg-[#1DA851] text-white px-4 py-3 rounded-lg font-medium transition-colors shadow-sm"
          >
            <Smartphone className="h-5 w-5" />
            <span>Send via WhatsApp</span>
          </button>
          
          <button 
            onClick={() => window.print()}
            className="w-full flex items-center justify-center space-x-2 bg-slate-100 hover:bg-slate-200 text-slate-700 px-4 py-3 rounded-lg font-medium transition-colors"
          >
            <Printer className="h-5 w-5" />
            <span>Print Invoice</span>
          </button>
        </div>
      </div>
    </div>
  );
};
