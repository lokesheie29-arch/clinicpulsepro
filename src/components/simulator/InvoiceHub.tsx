import { useState, useMemo, useEffect } from 'react';
import { 
  Printer, Smartphone, CheckCircle, Download, Send, AlertCircle, 
  Loader2, CreditCard, QrCode, Landmark, ShieldCheck, X, Receipt, 
  Plus, Paperclip, Copy, Check, FileText, Share2 
} from 'lucide-react';
import { useAppState } from '../../context/AppStateContext';
import { usePayment } from '../../context/PaymentContext';
import { PatientPaymentPortal } from '../payments/PatientPaymentPortal';
import { doctors } from '../../data/mockData';
import { getBillShareUrl } from '../../lib/invoiceShare';
import confetti from 'canvas-confetti';
import { useUser } from '@clerk/react';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';

// Converts a number into Indian words format
function numberToWords(num: number): string {
  const ones = ['', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine',
    'Ten', 'Eleven', 'Twelve', 'Thirteen', 'Fourteen', 'Fifteen', 'Sixteen', 'Seventeen',
    'Eighteen', 'Nineteen'];
  const tens = ['', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety'];

  const toWords = (n: number): string => {
    if (n < 20) return ones[n];
    if (n < 100) return tens[Math.floor(n / 10)] + (n % 10 ? ' ' + ones[n % 10] : '');
    if (n < 1000) return ones[Math.floor(n / 100)] + ' Hundred' + (n % 100 ? ' And ' + toWords(n % 100) : '');
    if (n < 100000) return toWords(Math.floor(n / 1000)) + ' Thousand' + (n % 1000 ? ' ' + toWords(n % 1000) : '');
    if (n < 10000000) return toWords(Math.floor(n / 100000)) + ' Lakh' + (n % 100000 ? ' ' + toWords(n % 100000) : '');
    return toWords(Math.floor(n / 10000000)) + ' Crore' + (n % 10000000 ? ' ' + toWords(n % 10000000) : '');
  };

  const rupees = Math.floor(num);
  const paise = Math.round((num - rupees) * 100);
  let result = 'Rupees ' + toWords(rupees);
  if (paise > 0) result += ' And ' + toWords(paise) + ' Paise';
  return result + ' Only';
}

export const InvoiceHub = ({ 
  selectedInvoiceId,
  onNewBill 
}: { 
  selectedInvoiceId: string | null;
  onNewBill?: () => void;
}) => {
  const { invoices, updateInvoicePaymentStatus, orgType } = useAppState();
  const { activeConfig, transactions } = usePayment();
  const { user } = useUser();
  const [activeInvoiceId, setActiveInvoiceId] = useState<string>(selectedInvoiceId || invoices[0]?.id || '');
  const [isGeneratingPdf, setIsGeneratingPdf] = useState(false);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [showWhatsAppHelper, setShowWhatsAppHelper] = useState(false);
  const [lastGeneratedPdfName, setLastGeneratedPdfName] = useState('');
  const [lastBillUrl, setLastBillUrl] = useState('');
  const [copiedLink, setCopiedLink] = useState(false);

  useEffect(() => {
    if (selectedInvoiceId) {
      setActiveInvoiceId(selectedInvoiceId);
    } else if (invoices.length > 0 && !activeInvoiceId) {
      setActiveInvoiceId(invoices[0].id);
    }
  }, [selectedInvoiceId, invoices]);

  const isPharmacy = orgType === 'pharmacy';

  const hospitalName =
    (user?.unsafeMetadata?.clinicName as string) ||
    localStorage.getItem('clinicpulse_clinic_name') ||
    (isPharmacy ? 'CLINICPULSE PHARMACY & HEALTHCARE' : 'CLINICPULSE PRO HOSPITAL');
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
  const hospitalEmail =
    (user?.unsafeMetadata?.hospitalEmail as string) ||
    localStorage.getItem('clinicpulse_clinic_email') ||
    'contact@clinicpulsepro.com';
  const drugLicense =
    (user?.unsafeMetadata?.drugLicense as string) ||
    localStorage.getItem('clinicpulse_drug_license') ||
    'DL No: 20B/12345/21B/12345';
  const billedBy =
    (user?.unsafeMetadata?.staffName as string) ||
    user?.firstName ||
    'Admin/Staff';

  const invoice = useMemo(() => {
    if (activeInvoiceId) {
      return invoices.find(i => i.id === activeInvoiceId) || invoices[0];
    }
    return invoices[0];
  }, [invoices, activeInvoiceId]);

  if (!invoice) {
    return <div className="text-center py-12 text-slate-500">No invoices available.</div>;
  }

  const doctor = doctors.find(d => d.id === invoice.doctorId);

  // Pharmacy bills do NOT include consultation fee
  const hasConsultation = !isPharmacy && (invoice.consultationFee > 0);

  // Computed discount
  const totalDiscount = useMemo(() => {
    if (invoice.totalDiscount !== undefined && invoice.totalDiscount > 0) {
      return invoice.totalDiscount;
    }
    return invoice.prescriptionItems.reduce((acc, p) => {
      if (p.discountAmount !== undefined && p.discountAmount > 0) {
        return acc + p.discountAmount;
      }
      if (p.discountPercent !== undefined && p.discountPercent > 0) {
        return acc + ((p.quantity * p.pricePerUnit * p.discountPercent) / 100);
      }
      return acc;
    }, 0);
  }, [invoice]);

  const grossSubTotal = invoice.subTotal + totalDiscount;

  // Computed totals
  const totalQty = invoice.prescriptionItems.reduce((acc, p) => acc + p.quantity, 0);
  const itemCount = invoice.prescriptionItems.length + (invoice.labItems?.length || 0) + (hasConsultation ? 1 : 0);
  const billDate = new Date(invoice.date);
  const billDateTime = billDate.toLocaleDateString('en-IN', { day: '2-digit', month: '2-digit', year: 'numeric' }) +
    '  ' + billDate.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: true }).toUpperCase();

  const invoiceTxn = transactions.find(t => t.invoiceId === invoice.id && t.status === 'success');
  const vpa = activeConfig?.merchantVpa || "clinicpulse@upi";
  const merchantName = activeConfig?.merchantName || hospitalName;
  const upiString = `upi://pay?pa=${vpa}&pn=${encodeURIComponent(merchantName)}&am=${invoice.totalAmount.toFixed(2)}&cu=INR&tn=Invoice-${invoice.id}&tr=${invoice.id}`;
  const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${encodeURIComponent(upiString)}`;

  // 1. Send Payment Link via WhatsApp
  const handleSendPaymentLink = () => {
    confetti({
      particleCount: 80,
      spread: 60,
      origin: { y: 0.6 },
      colors: ['#00A896', '#0D9488', '#0F4C81']
    });

    const cleanPhone = invoice.patient.phone.replace(/\D/g, '');
    const medSummary = invoice.prescriptionItems.map(p => {
      const discStr = (p.discountPercent && p.discountPercent > 0) ? ` [${p.discountPercent}% Off]` : '';
      return `• ${p.medicineName} (${p.quantity} qty)${discStr}`;
    }).join('%0A');
    const discountLine = totalDiscount > 0 ? `%0A*Discount Saved:* -₹${totalDiscount.toFixed(2)}%0A` : '';
    const docDisplay = invoice.prescribedByDoctorName || doctor?.name || 'General / Direct';
    const billLink = getBillShareUrl(invoice, hospitalName);
    const waText = `*${isPharmacy ? 'Pharmacy Tax Invoice' : 'Medical Tax Invoice'} %26 Payment Link - Bill %23${invoice.id}*%0A%0AHello *${invoice.patient.name}*,%0AYour medical bill has been generated at *${hospitalName}*.%0A%0A*Bill No:* ${invoice.id}%0A*${isPharmacy ? 'Prescribed By' : 'Doctor'}:* ${docDisplay}%0A*Total Amount Due:* ₹${invoice.totalAmount.toFixed(2)}${discountLine}%0A*Payment Status:* PENDING PAYMENT%0A%0A*Payment Link (Instant UPI):*%0A${encodeURIComponent(upiString)}%0A%0A📄 *View & Verify Bill Online:*%0A${encodeURIComponent(billLink)}%0A%0A*Medicines Prescribed:*%0A${medSummary}%0A%0APlease pay using the UPI link above. Once payment is confirmed, your official PDF bill will be generated and dispatched automatically!%0A%0A*** WISH YOU A SPEEDY RECOVERY ***`;

    window.open(`https://wa.me/91${cleanPhone}?text=${waText}`, '_blank');
    setStatusMessage('Payment link dispatched to patient WhatsApp!');
  };

  // Helper to generate PDF file
  const generatePdfBlob = async (): Promise<{ pdf: jsPDF; filename: string } | null> => {
    const element = document.getElementById('printable-invoice');
    if (!element) return null;

    const canvas = await html2canvas(element, {
      scale: 2,
      useCORS: true,
      logging: false,
      backgroundColor: '#ffffff'
    });

    const imgData = canvas.toDataURL('image/png');
    const pdf = new jsPDF('p', 'mm', 'a4');
    const pdfWidth = pdf.internal.pageSize.getWidth();
    const pdfHeight = (canvas.height * pdfWidth) / canvas.width;

    pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight);
    const filename = `${invoice.id}_${invoice.patient.name.replace(/\s+/g, '_')}_Bill.pdf`;
    return { pdf, filename };
  };

  // 2. Mark Payment Done & Auto-send PDF Bill to WhatsApp
  const handleMarkPaidAndSendPdf = async () => {
    setIsGeneratingPdf(true);
    setStatusMessage(null);

    try {
      // Step A: Update invoice payment status to 'Paid' in state & Supabase
      updateInvoicePaymentStatus(invoice.id, 'Paid');

      // Step B: Confetti celebration
      confetti({
        particleCount: 120,
        spread: 80,
        origin: { y: 0.6 },
        colors: ['#10B981', '#0D9488', '#00A896', '#0F4C81']
      });

      // Small delay so the DOM updates the balance to PAID before PDF capture
      await new Promise(resolve => setTimeout(resolve, 300));

      // Step C: Generate & download PDF
      const pdfResult = await generatePdfBlob();
      if (!pdfResult) {
        throw new Error('Failed to render printable bill canvas');
      }

      // Save PDF locally
      pdfResult.pdf.save(pdfResult.filename);
      setLastGeneratedPdfName(pdfResult.filename);

      // Generate direct online bill link with embedded data
      const billLink = getBillShareUrl(invoice, hospitalName);
      setLastBillUrl(billLink);

      // Step D: Format WhatsApp text with Direct 1-Click PDF Link
      const cleanPhone = invoice.patient.phone.replace(/\D/g, '');
      const medList = invoice.prescriptionItems.map(p => {
        const discStr = (p.discountPercent && p.discountPercent > 0) ? ` [${p.discountPercent}% Off]` : '';
        return `• ${p.medicineName} (${p.quantity} qty)${discStr}`;
      }).join('%0A');
      const discountLine = totalDiscount > 0 ? `%0A- Discount Saved: -₹${totalDiscount.toFixed(2)} (Applied)` : '';
      const docDisplay = invoice.prescribedByDoctorName || doctor?.name || 'General / Direct';
      const paidWaText = `*${hospitalName} - Payment Confirmation %26 Official Tax Invoice*%0A%0AHello *${invoice.patient.name}*,%0AThank you! We have received your payment of *₹${invoice.totalAmount.toFixed(2)}* for Bill *%23${invoice.id}* (Status: *PAID ✓*).%0A%0A*Receipt Details:*%0A- Bill No: ${invoice.id}%0A- Date %26 Time: ${billDateTime}%0A- ${isPharmacy ? 'Prescribed By' : 'Doctor'}: ${docDisplay}%0A- Total Paid: ₹${invoice.totalAmount.toFixed(2)}${discountLine}%0A- Payment Status: PAID ✓%0A%0A*Items / Medicines:*%0A${medList}%0A%0A📄 *Download / View Official PDF Tax Invoice:*%0A${encodeURIComponent(billLink)}%0A%0AOfficial PDF document generated & saved.%0AThank you for choosing ${hospitalName}!%0A%0A*** WISH YOU A SPEEDY RECOVERY ***`;

      // Step E: Try native Web Share with the actual PDF document file (Mobile Chrome, Safari, etc.)
      let fileSharedNatively = false;
      const pdfBlob = pdfResult.pdf.output('blob');
      const pdfFile = new File([pdfBlob], pdfResult.filename, { type: 'application/pdf' });

      if (typeof navigator !== 'undefined' && navigator.canShare && navigator.canShare({ files: [pdfFile] })) {
        try {
          await navigator.share({
            files: [pdfFile],
            title: `${hospitalName} - Bill #${invoice.id} Official Tax Invoice`,
            text: `Payment Confirmation & Official Tax Invoice for ${invoice.patient.name} (Bill #${invoice.id}).\nDirect Bill Link: ${billLink}`
          });
          fileSharedNatively = true;
          setStatusMessage('Official PDF Document attached and dispatched successfully via WhatsApp / Device Share!');
        } catch (shareErr) {
          console.log('Native share dismissed or unavailable, falling back to WhatsApp Web link:', shareErr);
        }
      }

      // Step F: If not shared via native file share (e.g. desktop browser), open WhatsApp Web with direct link & show helper modal
      if (!fileSharedNatively) {
        window.open(`https://wa.me/91${cleanPhone}?text=${paidWaText}`, '_blank');
        setShowWhatsAppHelper(true);
        setStatusMessage('Payment verified! Official PDF downloaded & WhatsApp opened with 1-click PDF download link.');
      }
    } catch (err) {
      console.error('Failed to process payment and PDF:', err);
      setStatusMessage('Payment status updated to Paid.');
    } finally {
      setIsGeneratingPdf(false);
    }
  };

  // 3. Download PDF only
  const handleDownloadPdf = async () => {
    setIsGeneratingPdf(true);
    try {
      const pdfResult = await generatePdfBlob();
      if (pdfResult) {
        pdfResult.pdf.save(pdfResult.filename);
      }
    } catch (err) {
      console.error('Error generating PDF:', err);
    } finally {
      setIsGeneratingPdf(false);
    }
  };

  const tdBase = "border border-slate-300 px-2 py-1.5 text-xs";
  const thBase = "border border-slate-400 px-2 py-1.5 text-xs font-bold text-center bg-slate-100 uppercase tracking-wide";

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

      {/* ─── Left: Invoice Preview (exact pharmacy bill style) ─── */}
      <div className="lg:col-span-2 space-y-4">
        {statusMessage && (
          <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-lg text-xs font-medium flex items-center justify-between print:hidden">
            <span className="flex items-center gap-1.5">
              <CheckCircle className="h-4 w-4 text-emerald-600 shrink-0" />
              <span>{statusMessage}</span>
            </span>
            <button onClick={() => setStatusMessage(null)} className="text-emerald-600 font-bold ml-2">×</button>
          </div>
        )}

        {/* Top Control Bar: Switch Invoice & Generate New Bill */}
        <div className="bg-white p-3.5 rounded-2xl border border-slate-200/80 shadow-xs flex flex-wrap items-center justify-between gap-3 print:hidden">
          <div className="flex items-center gap-2.5 flex-1 min-w-[220px]">
            <Receipt className="w-4 h-4 text-teal-600 shrink-0" />
            <select
              value={activeInvoiceId}
              onChange={(e) => setActiveInvoiceId(e.target.value)}
              className="text-xs bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 font-semibold text-navy-900 focus:outline-none focus:ring-2 focus:ring-teal-500/20 w-full"
            >
              {invoices.map((inv) => (
                <option key={inv.id} value={inv.id}>
                  {inv.id} — {inv.patient.name} (₹{inv.totalAmount.toFixed(2)}) [{inv.paymentStatus}]
                </option>
              ))}
            </select>
          </div>

          {onNewBill && (
            <button
              onClick={onNewBill}
              className="bg-gradient-to-r from-teal-600 via-teal-700 to-navy-900 hover:from-teal-700 hover:to-navy-800 text-white px-4 py-2 rounded-xl text-xs font-bold transition-all shadow-sm flex items-center gap-1.5 shrink-0"
            >
              <Plus className="w-4 h-4 text-teal-300" />
              <span>{isPharmacy ? 'Generate New Medicine Bill' : 'Generate New Bill'}</span>
            </button>
          )}
        </div>

        <div
          className="bg-white border border-slate-300 shadow-sm print:border-none print:shadow-none"
          id="printable-invoice"
          style={{ fontFamily: 'Consolas, "Courier New", monospace', minWidth: 0 }}
        >

          {/* ── HEADER ── */}
          <div className="border-b-2 border-slate-400 pb-3 pt-4 px-4 text-center">
            <h1 className="text-xl font-extrabold text-slate-900 uppercase tracking-widest leading-tight">
              {hospitalName}
            </h1>
            <p className="text-[11px] text-slate-700 mt-0.5">{hospitalAddress}</p>
            <p className="text-[11px] text-slate-700 mt-0.5">
              {drugLicense} &nbsp;|&nbsp; <span className="font-semibold">GSTIN:</span> {hospitalGst}
            </p>
            <p className="text-[11px] text-slate-700">
              <span className="font-semibold">PHONE:</span> {hospitalPhone} &nbsp;|&nbsp;
              <span className="font-semibold">EMAIL:</span> {hospitalEmail}
            </p>
          </div>

          {/* ── BILL META ── */}
          <div className="border-b border-slate-300 px-4 py-2 grid grid-cols-2 gap-x-4 text-[11px] text-slate-800">
            {/* Left column */}
            <div className="space-y-0.5">
              <div><span className="font-bold">Cust. Name</span> : {invoice.patient.name}</div>
              <div><span className="font-bold">{isPharmacy ? 'Prescribed By' : 'Doctor Name'}</span> : {invoice.prescribedByDoctorName || doctor?.name || 'Direct / OTC'}</div>
              <div><span className="font-bold">Ph No</span> : +91 {invoice.patient.phone}</div>
              {invoice.patient.complaints && (
                <div><span className="font-bold">Complaints</span> : {invoice.patient.complaints}</div>
              )}
              {/* Vitals compact */}
              {(invoice.patient.bp || invoice.patient.pulse || invoice.patient.weight) && (
                <div className="text-[10px] text-slate-600 mt-0.5">
                  {invoice.patient.bp && <span>BP: <b>{invoice.patient.bp}</b> &nbsp;</span>}
                  {invoice.patient.pulse && <span>Pulse: <b>{invoice.patient.pulse}</b> &nbsp;</span>}
                  {invoice.patient.temp && <span>Temp: <b>{invoice.patient.temp}°F</b> &nbsp;</span>}
                  {invoice.patient.spo2 && <span>SpO2: <b>{invoice.patient.spo2}%</b> &nbsp;</span>}
                  {invoice.patient.weight && <span>Wt: <b>{invoice.patient.weight} kg</b></span>}
                </div>
              )}
            </div>
            {/* Right column */}
            <div className="space-y-0.5 text-right">
              <div><span className="font-bold">Bill No</span> : {invoice.id}</div>
              <div><span className="font-bold">Bill Date</span> : {billDateTime}</div>
              <div><span className="font-bold">Specialty</span> : {doctor?.specialty || 'Pharmacy Retail'}</div>
              <div><span className="font-bold">Reg No</span> : {doctor?.regNo || 'DL-20B/21B'}</div>
            </div>
          </div>

          {/* ── ITEMS TABLE ── */}
          <div className="px-4 py-2 overflow-x-auto">
            <table className="w-full border-collapse" style={{ fontSize: '11px' }}>
              <thead>
                <tr>
                  <th className={thBase} style={{ width: '28px' }}>S.No</th>
                  <th className={thBase} style={{ width: '48px' }}>MFR</th>
                  <th className={`${thBase} text-left`}>Product Name</th>
                  <th className={thBase} style={{ width: '70px' }}>Batch</th>
                  <th className={thBase} style={{ width: '40px' }}>Exp</th>
                  <th className={thBase} style={{ width: '30px' }}>Qty</th>
                  <th className={thBase} style={{ width: '58px' }}>MRP</th>
                  <th className={thBase} style={{ width: '52px' }}>Disc</th>
                  <th className={thBase} style={{ width: '64px' }}>Amount</th>
                </tr>
              </thead>
              <tbody>
                {/* Consultation Row (ONLY for hospitals/clinics, OMITTED for pharmacy) */}
                {hasConsultation && (
                  <tr>
                    <td className={`${tdBase} text-center`}>1</td>
                    <td className={`${tdBase} text-center`}>—</td>
                    <td className={`${tdBase}`}>
                      <div className="font-semibold">OPD Consultation</div>
                      <div className="text-[10px] text-slate-500">SAC: 999312</div>
                    </td>
                    <td className={`${tdBase} text-center`}>—</td>
                    <td className={`${tdBase} text-center`}>—</td>
                    <td className={`${tdBase} text-center`}>—</td>
                    <td className={`${tdBase} text-right`}>₹{invoice.consultationFee.toFixed(2)}</td>
                    <td className={`${tdBase} text-center text-slate-400`}>—</td>
                    <td className={`${tdBase} text-right font-semibold`}>₹{invoice.consultationFee.toFixed(2)}</td>
                  </tr>
                )}

                {/* Medicine Rows */}
                {invoice.prescriptionItems.map((item, idx) => {
                  const sNo = hasConsultation ? idx + 2 : idx + 1;
                  const itemDiscPct = item.discountPercent ?? 0;
                  const itemDiscAmt = item.discountAmount ?? ((item.quantity * item.pricePerUnit * itemDiscPct) / 100);
                  const hasDiscount = itemDiscPct > 0 || itemDiscAmt > 0;

                  return (
                    <tr key={item.id} className={idx % 2 === 0 ? 'bg-slate-50/40' : ''}>
                      <td className={`${tdBase} text-center`}>{sNo}</td>
                      <td className={`${tdBase} text-center uppercase`} style={{ fontSize: '10px' }}>
                        {item.medicineName.split(' ')[0].substring(0, 6).toUpperCase()}
                      </td>
                      <td className={`${tdBase}`}>
                        <div className="font-semibold">{item.medicineName}</div>
                        <div className="text-[10px] text-slate-500">
                          Dosage: <b>{item.dosage}</b> ({item.durationDays}d) &nbsp;
                          <span className={`inline-block px-1 rounded font-bold ${
                            (item.foodTiming || 'After Food') === 'After Food' ? 'bg-blue-100 text-blue-700' :
                            (item.foodTiming || 'After Food') === 'Before Food' ? 'bg-amber-100 text-amber-700' :
                            (item.foodTiming || 'After Food') === 'Empty Stomach' ? 'bg-rose-100 text-rose-700' :
                            'bg-emerald-100 text-emerald-700'
                          }`}>
                            {item.foodTiming || 'After Food'}
                          </span>
                          &nbsp;| HSN: {item.hsn} | GST: {item.gstRate}%
                        </div>
                      </td>
                      <td className={`${tdBase} text-center`} style={{ fontSize: '10px' }}>
                        {item.batchNo || 'N/A'}
                      </td>
                      <td className={`${tdBase} text-center`} style={{ fontSize: '10px' }}>
                        {item.expiryDate
                          ? new Date(item.expiryDate).toLocaleDateString('en-GB', { month: '2-digit', year: '2-digit' })
                          : 'N/A'}
                      </td>
                      <td className={`${tdBase} text-center font-semibold`}>{item.quantity}</td>
                      <td className={`${tdBase} text-right`}>₹{item.pricePerUnit.toFixed(2)}</td>
                      <td className={`${tdBase} text-center font-semibold ${hasDiscount ? 'text-emerald-700' : 'text-slate-400'}`}>
                        {hasDiscount ? (itemDiscPct > 0 ? `${itemDiscPct}%` : `₹${itemDiscAmt.toFixed(1)}`) : '0%'}
                      </td>
                      <td className={`${tdBase} text-right font-semibold`}>₹{item.totalPrice.toFixed(2)}</td>
                    </tr>
                  );
                })}

                {/* Lab Test Rows */}
                {invoice.labItems?.map((item, idx) => {
                  const sNo = (hasConsultation ? 1 : 0) + invoice.prescriptionItems.length + idx + 1;
                  return (
                    <tr key={item.id} className="bg-purple-50/40">
                      <td className={`${tdBase} text-center`}>{sNo}</td>
                      <td className={`${tdBase} text-center`} style={{ fontSize: '10px' }}>LAB</td>
                      <td className={`${tdBase}`}>
                        <div className="font-semibold">{item.testName}</div>
                        <div className="text-[10px] text-slate-500">Lab Diagnostic Test</div>
                      </td>
                      <td className={`${tdBase} text-center`}>—</td>
                      <td className={`${tdBase} text-center`}>—</td>
                      <td className={`${tdBase} text-center`}>1</td>
                      <td className={`${tdBase} text-right`}>₹{item.price.toFixed(2)}</td>
                      <td className={`${tdBase} text-center text-slate-400`}>—</td>
                      <td className={`${tdBase} text-right font-semibold`}>₹{item.price.toFixed(2)}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* ── TOTALS FOOTER ── */}
          <div className="border-t border-slate-300 px-4 pt-2 pb-1 text-[11px]">
            {/* Item count & qty row */}
            <div className="flex justify-between items-start">
              <div className="space-y-0.5">
                <div><span className="font-bold">Item :</span> {itemCount}</div>
                <div><span className="font-bold">Total Qty :</span> {totalQty}</div>
                {totalDiscount > 0 && (
                  <div className="text-emerald-700 font-bold mt-1">
                    ✓ Total Savings: ₹{totalDiscount.toFixed(2)}
                  </div>
                )}
              </div>
              <div className="text-right space-y-0.5">
                {totalDiscount > 0 && (
                  <>
                    <div className="flex gap-12 justify-end">
                      <span className="text-slate-600">Gross Total:</span>
                      <span className="font-semibold w-24 text-right">₹{grossSubTotal.toFixed(2)}</span>
                    </div>
                    <div className="flex gap-12 justify-end text-emerald-700">
                      <span className="font-medium">Discount :</span>
                      <span className="font-bold w-24 text-right">-₹{totalDiscount.toFixed(2)}</span>
                    </div>
                  </>
                )}
                <div className="flex gap-12 justify-end">
                  <span className="text-slate-600">{totalDiscount > 0 ? 'Taxable Amount:' : 'Sub Total:'}</span>
                  <span className="font-semibold w-24 text-right">₹{invoice.subTotal.toFixed(2)}</span>
                </div>
                <div className="flex gap-12 justify-end">
                  <span className="text-slate-600">CGST :</span>
                  <span className="font-semibold w-24 text-right">₹{invoice.cgst.toFixed(2)}</span>
                </div>
                <div className="flex gap-12 justify-end">
                  <span className="text-slate-600">SGST :</span>
                  <span className="font-semibold w-24 text-right">₹{invoice.sgst.toFixed(2)}</span>
                </div>
                <div className="flex gap-12 justify-end border-t border-slate-300 pt-0.5 mt-0.5">
                  <span className="font-bold text-slate-800">GST :</span>
                  <span className="font-bold w-24 text-right">₹{(invoice.cgst + invoice.sgst).toFixed(2)}</span>
                </div>
              </div>
            </div>
          </div>

          {/* ── GRAND TOTAL ── */}
          <div className="border-t-2 border-b-2 border-slate-400 mx-4 my-1 flex justify-between items-center py-1.5 px-2">
            <div className="text-sm font-extrabold text-slate-900 uppercase tracking-wide">Grand Total</div>
            <div className="text-sm font-extrabold text-slate-900">
              : &nbsp; ₹{invoice.totalAmount.toFixed(2)}
            </div>
          </div>

          {/* ── AMOUNT IN WORDS ── */}
          <div className="px-4 py-1.5 text-[11px] border-b border-slate-300">
            <span className="font-bold">Bill Amount In Words : </span>
            <span className="text-slate-700">{numberToWords(invoice.totalAmount)}</span>
          </div>

          {/* ── BILLED BY / E&OE / BALANCE ── */}
          <div className="px-4 py-1.5 border-b border-slate-300 flex justify-between items-center text-[11px]">
            <div className="space-y-0.5">
              <div><span className="font-bold">E. &amp; O.E.</span></div>
              <div><span className="font-bold">Billed By</span> : {billedBy}</div>
            </div>
            <div className="text-right space-y-0.5">
              <div>
                <span className="font-bold">Total Amount</span> : ₹{invoice.totalAmount.toFixed(2)}
              </div>
              <div>
                <span className="font-bold">Balance</span> :&nbsp;
                <span className={invoice.paymentStatus === 'Paid' ? 'text-emerald-700 font-bold' : 'text-red-600 font-bold'}>
                  {invoice.paymentStatus === 'Paid' ? 'PAID ✓' : `₹${invoice.totalAmount.toFixed(2)}`}
                </span>
              </div>
            </div>
          </div>

          {/* ── SIGNATURE ── */}
          <div className="px-4 py-3 flex justify-between items-end text-[11px]">
            <div>
              <div className="text-center font-extrabold text-slate-700 tracking-widest text-xs mt-1">
                *** WISH YOU A SPEEDY RECOVERY ***
              </div>
            </div>
            <div className="text-right">
              <div className="border-t border-slate-500 w-28 mb-0.5 mt-6"></div>
              <div className="font-bold text-slate-700">SIGNATURE</div>
            </div>
          </div>

        </div>
      </div>

      {/* ─── Right: Actions & QR ─── */}
      <div className="lg:col-span-1 space-y-6 print:hidden">

        {/* Payment QR & Status Card */}
        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm text-center">
          <div className="flex justify-between items-center mb-3">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Payment Status</span>
            <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold ${
              invoice.paymentStatus === 'Paid'
                ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                : 'bg-amber-100 text-amber-800 border border-amber-300'
            }`}>
              {invoice.paymentStatus === 'Paid' ? 'PAID ✓' : 'PENDING PAYMENT'}
            </span>
          </div>

          <h3 className="text-base font-bold text-navy-900 mb-1">Instant UPI QR Code</h3>
          <p className="text-xs text-slate-500 mb-4">Patient scans with GPay, PhonePe, Paytm or any UPI app.</p>
          
          <div className="inline-block p-2 border-2 border-dashed border-teal-200 rounded-xl mb-4 bg-white shadow-xs">
            <img src={qrUrl} alt="UPI QR Code" className="w-36 h-36 mx-auto" />
          </div>

          <div className="flex items-center justify-center space-x-2 text-sm font-semibold text-teal-700 bg-teal-50 py-2.5 rounded-lg border border-teal-100">
            <CheckCircle className="h-4 w-4 text-teal-600" />
            <span>Amount: ₹{invoice.totalAmount.toFixed(2)}</span>
          </div>
        </div>

        {/* Workflow Actions */}
        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm flex flex-col space-y-3">
          <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">
            Automated Patient WhatsApp Actions
          </h4>

          {/* 0. Direct Payment Gateway / UPI Pay Button */}
          <button
            onClick={() => setShowPaymentModal(true)}
            className="w-full flex items-center justify-center space-x-2 bg-gradient-to-r from-teal-600 via-teal-700 to-navy-900 hover:from-teal-700 hover:to-navy-800 text-white px-4 py-3 rounded-lg font-semibold transition-all shadow-md group"
          >
            <CreditCard className="h-5 w-5 text-teal-300 shrink-0 group-hover:scale-105 transition-transform" />
            <span>
              {invoice.paymentStatus === 'Paid' ? 'View Payment Gateway Slip' : 'Pay via UPI / Payment Gateway'}
            </span>
          </button>

          {/* Verified Settlement Badge if Paid */}
          {invoiceTxn && (
            <div className="bg-teal-50/70 border border-teal-200 rounded-lg p-2.5 text-xs text-teal-900 space-y-1">
              <div className="flex items-center gap-1 font-bold text-teal-800">
                <ShieldCheck className="h-4 w-4 text-emerald-600" />
                <span>Verified Direct Bank Settlement</span>
              </div>
              <div className="text-[11px] font-mono text-teal-700">Txn Ref: {invoiceTxn.id}</div>
              <div className="text-[10px] text-teal-600">
                Settles to: <strong>{invoiceTxn.bankAccountMasked || activeConfig?.bankAccount.bankName}</strong> ({activeConfig?.settlementCycle} Cycle)
              </div>
            </div>
          )}

          {/* 1. Send Payment Link */}
          <button
            onClick={handleSendPaymentLink}
            className="w-full flex items-center justify-center space-x-2 bg-[#25D366] hover:bg-[#1DA851] text-white px-4 py-3 rounded-lg font-medium transition-colors shadow-sm"
          >
            <Smartphone className="h-5 w-5 shrink-0" />
            <span>Send Payment Link via WhatsApp</span>
          </button>

          {/* 2. Mark Paid & Send PDF */}
          <button
            onClick={handleMarkPaidAndSendPdf}
            disabled={isGeneratingPdf}
            className="w-full flex items-center justify-center space-x-2 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-60 text-white px-4 py-3 rounded-lg font-semibold transition-colors shadow-sm"
          >
            {isGeneratingPdf ? (
              <>
                <Loader2 className="h-5 w-5 animate-spin shrink-0" />
                <span>Generating & Sending PDF...</span>
              </>
            ) : (
              <>
                <CheckCircle className="h-5 w-5 shrink-0" />
                <span>
                  {invoice.paymentStatus === 'Paid' ? 'Resend Paid PDF via WhatsApp' : 'Mark Paid & Send PDF to WhatsApp'}
                </span>
              </>
            )}
          </button>

          {/* 3. Download PDF */}
          <button
            onClick={handleDownloadPdf}
            disabled={isGeneratingPdf}
            className="w-full flex items-center justify-center space-x-2 bg-slate-100 hover:bg-slate-200 text-slate-700 px-4 py-2.5 rounded-lg text-sm font-medium transition-colors"
          >
            <Download className="h-4 w-4" />
            <span>Download PDF Bill</span>
          </button>

          {/* 4. Print */}
          <button
            onClick={() => window.print()}
            className="w-full flex items-center justify-center space-x-2 bg-slate-50 hover:bg-slate-100 text-slate-600 px-4 py-2.5 rounded-lg text-sm font-medium transition-colors border border-slate-200"
          >
            <Printer className="h-4 w-4" />
            <span>Print Invoice</span>
          </button>
        </div>

        {/* Invoice Summary Card */}
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm text-xs text-slate-700 space-y-2">
          <h4 className="font-semibold text-slate-900 border-b pb-1 mb-2 flex justify-between items-center">
            <span>Bill Summary</span>
            {isPharmacy && (
              <span className="text-[10px] font-bold text-amber-700 bg-amber-50 px-2 py-0.5 rounded border border-amber-200">
                Pharmacy (0 Consultation)
              </span>
            )}
          </h4>
          <div className="flex justify-between"><span>Items:</span><span className="font-semibold">{itemCount}</span></div>
          <div className="flex justify-between"><span>Total Qty:</span><span className="font-semibold">{totalQty}</span></div>
          <div className="flex justify-between"><span>Sub Total:</span><span className="font-semibold">₹{invoice.subTotal.toFixed(2)}</span></div>
          <div className="flex justify-between"><span>CGST:</span><span className="font-semibold">₹{invoice.cgst.toFixed(2)}</span></div>
          <div className="flex justify-between"><span>SGST:</span><span className="font-semibold">₹{invoice.sgst.toFixed(2)}</span></div>
          <div className="flex justify-between border-t pt-1 font-bold text-sm text-navy-900">
            <span>Grand Total:</span>
            <span className="text-teal-700">₹{invoice.totalAmount.toFixed(2)}</span>
          </div>
          <div className="mt-1 text-[10px] text-slate-500 italic leading-tight">
            {numberToWords(invoice.totalAmount)}
          </div>
        </div>
      </div>

      {/* Online UPI & Payment Gateway Modal */}
      {showPaymentModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-4xl w-full max-h-[92vh] overflow-y-auto shadow-2xl border border-slate-100 p-6 relative animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100 mb-6">
              <div className="flex items-center gap-2">
                <CreditCard className="w-5 h-5 text-teal-600" />
                <h3 className="font-bold text-navy-900 text-base">Direct Payment Collection Terminal</h3>
              </div>
              <button 
                onClick={() => setShowPaymentModal(false)}
                className="text-slate-400 hover:text-slate-600 p-1.5 rounded-xl hover:bg-slate-100 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <PatientPaymentPortal 
              initialInvoiceId={invoice.id} 
              onPaymentSuccess={() => {
                setStatusMessage('Payment verified! Invoice status updated to Paid.');
                setTimeout(() => setShowPaymentModal(false), 1500);
              }} 
            />
          </div>
        </div>
      )}

      {/* ─── WhatsApp PDF Dispatch Helper Modal ─── */}
      {showWhatsAppHelper && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 sm:p-8 max-w-lg w-full shadow-2xl border border-slate-200 space-y-5 animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-start justify-between gap-3 border-b border-slate-100 pb-4">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-2xl bg-[#25D366]/10 text-[#25D366] flex items-center justify-center shrink-0 border border-[#25D366]/20">
                  <Smartphone className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-base sm:text-lg font-bold text-navy-900">
                    WhatsApp Opened &amp; PDF Downloaded
                  </h3>
                  <p className="text-xs text-slate-500">
                    Bill #{invoice.id} • {invoice.patient.name} (₹{invoice.totalAmount.toFixed(2)})
                  </p>
                </div>
              </div>
              <button
                onClick={() => setShowWhatsAppHelper(false)}
                className="text-slate-400 hover:text-slate-700 p-1.5 rounded-lg hover:bg-slate-100 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3.5 text-xs">
              <div className="p-3.5 bg-emerald-50 rounded-2xl border border-emerald-200 text-emerald-900 space-y-1.5">
                <div className="flex items-center gap-2 font-bold text-emerald-800">
                  <CheckCircle className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>Direct 1-Click PDF Link Included in Message</span>
                </div>
                <p className="text-[11px] text-emerald-700 leading-relaxed">
                  Your WhatsApp message already contains the official direct link for the patient to view and download their official PDF tax invoice immediately on their smartphone!
                </p>
              </div>

              <div className="p-3.5 bg-blue-50 rounded-2xl border border-blue-200 text-blue-900 space-y-2">
                <div className="flex items-center gap-2 font-bold text-blue-800">
                  <Paperclip className="w-4 h-4 text-blue-600 shrink-0" />
                  <span>To Send the PDF File directly in WhatsApp Web:</span>
                </div>
                <p className="text-[11px] text-blue-700 leading-relaxed">
                  The PDF <strong>"{lastGeneratedPdfName || `${invoice.id}_Bill.pdf`}"</strong> was automatically downloaded to your computer's <strong>Downloads</strong> folder.
                </p>
                <ol className="list-decimal list-inside space-y-1 text-[11px] text-blue-800 font-medium pl-1">
                  <li>In the WhatsApp Web chat tab that opened, click the <strong>📎 (Paperclip)</strong> icon at the bottom.</li>
                  <li>Click <strong>Document</strong>.</li>
                  <li>Select <strong>{lastGeneratedPdfName || `${invoice.id}_Bill.pdf`}</strong> and press Send!</li>
                </ol>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row gap-2.5 pt-2">
              <button
                onClick={() => {
                  const cleanPhone = invoice.patient.phone.replace(/\D/g, '');
                  const docDisplay = invoice.prescribedByDoctorName || doctor?.name || 'General / Direct';
                  const paidWaText = `*${hospitalName} - Payment Confirmation %26 Official Tax Invoice*%0A%0AHello *${invoice.patient.name}*,%0AThank you! We have received your payment of *₹${invoice.totalAmount.toFixed(2)}* for Bill *%23${invoice.id}* (Status: *PAID ✓*).%0A%0A*Receipt Details:*%0A- Bill No: ${invoice.id}%0A- Date %26 Time: ${billDateTime}%0A- ${isPharmacy ? 'Prescribed By' : 'Doctor'}: ${docDisplay}%0A- Total Paid: ₹${invoice.totalAmount.toFixed(2)}%0A- Payment Status: PAID ✓%0A%0A📄 *Download / View Official PDF Tax Invoice:*%0A${encodeURIComponent(lastBillUrl)}%0A%0AThank you for choosing ${hospitalName}!%0A%0A*** WISH YOU A SPEEDY RECOVERY ***`;
                  window.open(`https://wa.me/91${cleanPhone}?text=${paidWaText}`, '_blank');
                }}
                className="flex-1 bg-[#25D366] hover:bg-[#1DA851] text-white py-2.5 px-4 rounded-xl font-bold text-xs flex items-center justify-center gap-2 shadow-sm transition-colors"
              >
                <Smartphone className="w-4 h-4" />
                <span>Re-open WhatsApp Chat</span>
              </button>

              <button
                onClick={() => {
                  if (lastBillUrl) {
                    navigator.clipboard.writeText(lastBillUrl);
                    setCopiedLink(true);
                    setTimeout(() => setCopiedLink(false), 2000);
                  }
                }}
                className="bg-slate-100 hover:bg-slate-200 text-slate-700 py-2.5 px-3.5 rounded-xl font-semibold text-xs flex items-center justify-center gap-1.5 transition-colors"
              >
                {copiedLink ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4" />}
                <span>{copiedLink ? 'Copied!' : 'Copy PDF Link'}</span>
              </button>

              <button
                onClick={handleDownloadPdf}
                className="bg-slate-100 hover:bg-slate-200 text-slate-700 py-2.5 px-3.5 rounded-xl font-semibold text-xs flex items-center justify-center gap-1.5 transition-colors"
              >
                <Download className="w-4 h-4" />
                <span>Download Again</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
