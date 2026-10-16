import { useState, useMemo } from 'react';
import {
  Download,
  Printer,
  X,
  CheckCircle,
  FileText,
  Building2,
  Calendar,
  User,
  Phone,
  ShieldCheck,
  Stethoscope,
  Pill,
  Loader2
} from 'lucide-react';
import { useAppState } from '../context/AppStateContext';
import { decodeInvoiceFromUrl, DecodedBillData } from '../lib/invoiceShare';
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

interface PatientBillViewProps {
  billData: {
    id?: string;
    data?: string;
  };
  onClose: () => void;
}

export const PatientBillView = ({ billData, onClose }: PatientBillViewProps) => {
  const { invoices } = useAppState();
  const [isDownloading, setIsDownloading] = useState(false);

  // Reconstruct invoice from URL or local store
  const bill: DecodedBillData | null = useMemo(() => {
    // 1. If payload is provided in URL, decode it
    if (billData.data) {
      const decoded = decodeInvoiceFromUrl(billData.data);
      if (decoded) return decoded;
    }

    // 2. Otherwise look up by id in state or local storage
    if (billData.id) {
      const match = invoices.find(inv => inv.id === billData.id);
      if (match) {
        return {
          id: match.id,
          patient: match.patient,
          prescribedByDoctorName: match.prescribedByDoctorName || 'Dr. Rajesh Kumar, MD (KMC-45892)',
          consultationFee: match.consultationFee,
          prescriptionItems: match.prescriptionItems.map(p => ({
            medicineName: p.medicineName,
            batchNo: p.batchNo,
            expiryDate: p.expiryDate,
            hsn: p.hsn,
            quantity: p.quantity,
            pricePerUnit: p.pricePerUnit,
            discountPercent: p.discountPercent || 0,
            discountAmount: p.discountAmount || 0,
            totalPrice: p.totalPrice,
            gstRate: p.gstRate
          })),
          subTotal: match.subTotal,
          cgst: match.cgst,
          sgst: match.sgst,
          totalAmount: match.totalAmount,
          date: match.date,
          paymentStatus: match.paymentStatus,
          orgName: 'ClinicPulse Pro Healthcare',
          orgGstin: '33ABCDE1234F1Z5',
          orgDl: 'DL-20B/21B-45892',
          orgAddress: '100 Feet Road, Indiranagar, Bengaluru - 560038'
        };
      }
    }

    return null;
  }, [billData, invoices]);

  const handleDownloadPdf = async () => {
    const element = document.getElementById('public-printable-invoice');
    if (!element || !bill) return;

    setIsDownloading(true);
    try {
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
      const filename = `${bill.id}_${bill.patient.name.replace(/\s+/g, '_')}_Official_Tax_Invoice.pdf`;
      pdf.save(filename);
    } catch (err) {
      console.error('Error generating PDF:', err);
    } finally {
      setIsDownloading(false);
    }
  };

  const tdBase = "border border-slate-300 px-2 py-1.5 text-xs";
  const thBase = "border border-slate-400 px-2 py-1.5 text-xs font-bold text-center bg-slate-100 uppercase tracking-wide";

  if (!bill) {
    return (
      <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
        <div className="bg-white rounded-3xl p-8 max-w-md w-full text-center space-y-4 shadow-2xl">
          <FileText className="w-12 h-12 text-slate-400 mx-auto" />
          <h3 className="text-xl font-bold text-navy-900">Invoice Not Found</h3>
          <p className="text-sm text-slate-500">
            The requested bill could not be retrieved. Please verify the link or contact your healthcare facility.
          </p>
          <button
            onClick={onClose}
            className="w-full bg-teal-600 hover:bg-teal-700 text-white py-2.5 rounded-xl text-sm font-semibold transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    );
  }

  const isPaid = bill.paymentStatus === 'Paid';
  const billDate = new Date(bill.date).toLocaleDateString('en-IN', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric'
  });
  const billTime = new Date(bill.date).toLocaleTimeString('en-IN', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: true
  });

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/70 backdrop-blur-sm overflow-y-auto p-3 sm:p-6 flex flex-col items-center">
      {/* Top Floating Control Bar */}
      <div className="w-full max-w-4xl bg-white rounded-2xl shadow-xl border border-slate-200/80 p-3 sm:p-4 mb-4 flex flex-wrap items-center justify-between gap-3 print:hidden">
        <div className="flex items-center gap-2.5">
          <div className="w-10 h-10 rounded-xl bg-teal-50 border border-teal-200 flex items-center justify-center text-teal-700 font-bold shrink-0">
            <ShieldCheck className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-navy-900">Official Patient Tax Invoice</span>
              <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                isPaid ? 'bg-emerald-50 text-emerald-700 border-emerald-300' : 'bg-amber-50 text-amber-700 border-amber-300'
              }`}>
                {isPaid ? 'PAID ✓' : 'PENDING'}
              </span>
            </div>
            <p className="text-[11px] text-slate-500">
              Bill #{bill.id} • {bill.patient.name} • ₹{bill.totalAmount.toFixed(2)}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleDownloadPdf}
            disabled={isDownloading}
            className="bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2 rounded-xl text-xs font-bold transition-all shadow-sm flex items-center gap-1.5 disabled:opacity-60"
          >
            {isDownloading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Downloading...</span>
              </>
            ) : (
              <>
                <Download className="w-4 h-4" />
                <span>Download Official PDF Bill</span>
              </>
            )}
          </button>

          <button
            onClick={() => window.print()}
            className="bg-slate-100 hover:bg-slate-200 text-slate-700 px-3.5 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5"
          >
            <Printer className="w-4 h-4" />
            <span className="hidden sm:inline">Print</span>
          </button>

          <button
            onClick={onClose}
            className="bg-slate-100 hover:bg-slate-200 text-slate-500 hover:text-slate-800 p-2 rounded-xl text-xs font-bold transition-all"
            title="Close"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Printable Invoice Container */}
      <div className="w-full max-w-4xl bg-white shadow-2xl rounded-2xl overflow-hidden border border-slate-300 print:shadow-none print:border-none print:rounded-none mb-12">
        <div id="public-printable-invoice" className="bg-white text-navy-900 p-6 sm:p-8 font-sans">
          
          {/* ── HEADER ── */}
          <div className="border-b-2 border-slate-900 pb-3 mb-4 text-center">
            <h1 className="text-xl sm:text-2xl font-black uppercase tracking-wide text-navy-900">
              {bill.orgName || 'ClinicPulse Pro Healthcare'}
            </h1>
            <p className="text-xs text-slate-600 font-medium mt-0.5">
              {bill.orgAddress || '100 Feet Road, Indiranagar, Bengaluru - 560038'}
            </p>
            <div className="flex flex-wrap items-center justify-center gap-4 text-[11px] text-slate-600 mt-1 font-mono">
              <span>GSTIN: <strong>{bill.orgGstin || '33ABCDE1234F1Z5'}</strong></span>
              <span>•</span>
              <span>D.L. No: <strong>{bill.orgDl || 'DL-20B/21B-45892'}</strong></span>
              <span>•</span>
              <span>FSSAI: <strong>10018042004212</strong></span>
            </div>
            <div className="mt-2 inline-block px-3 py-0.5 bg-slate-100 border border-slate-300 rounded-md text-[11px] font-bold tracking-wider text-slate-800 uppercase">
              TAX INVOICE / CASH BILL (PATIENT COPY)
            </div>
          </div>

          {/* ── PATIENT & BILL METADATA ── */}
          <div className="grid grid-cols-2 gap-4 text-xs border border-slate-300 rounded-lg p-3 mb-4 bg-slate-50/50">
            <div className="space-y-1">
              <div><span className="font-bold text-slate-600">Patient / Cust. Name:</span> <strong className="text-navy-900">{bill.patient.name}</strong></div>
              <div><span className="font-bold text-slate-600">Prescribed By Doctor:</span> <strong className="text-teal-800">{bill.prescribedByDoctorName || 'Direct / General Practice'}</strong></div>
              <div><span className="font-bold text-slate-600">Phone / WhatsApp:</span> +91 {bill.patient.phone}</div>
              {bill.patient.complaints && (
                <div><span className="font-bold text-slate-600">Notes / Rx Ref:</span> {bill.patient.complaints}</div>
              )}
            </div>
            <div className="text-right space-y-1">
              <div><span className="font-bold text-slate-600">Bill No:</span> <strong className="text-navy-900 font-mono">{bill.id}</strong></div>
              <div><span className="font-bold text-slate-600">Date &amp; Time:</span> {billDate} {billTime}</div>
              <div>
                <span className="font-bold text-slate-600">Payment Status:</span>&nbsp;
                <span className={`inline-block px-2 py-0.5 rounded text-[10px] font-bold ${
                  isPaid ? 'bg-emerald-100 text-emerald-800 border border-emerald-300' : 'bg-red-100 text-red-800 border border-red-300'
                }`}>
                  {isPaid ? 'PAID ✓' : 'PENDING'}
                </span>
              </div>
            </div>
          </div>

          {/* ── ITEMS TABLE ── */}
          <div className="overflow-x-auto mb-4">
            <table className="w-full border-collapse text-xs">
              <thead>
                <tr>
                  <th className={thBase} style={{ width: '32px' }}>S.No</th>
                  <th className={`${thBase} text-left`}>Item / Medicine Description</th>
                  <th className={thBase} style={{ width: '80px' }}>Batch</th>
                  <th className={thBase} style={{ width: '60px' }}>Exp</th>
                  <th className={thBase} style={{ width: '40px' }}>Qty</th>
                  <th className={thBase} style={{ width: '70px' }}>MRP</th>
                  <th className={thBase} style={{ width: '60px' }}>Disc</th>
                  <th className={thBase} style={{ width: '80px' }}>Amount</th>
                </tr>
              </thead>
              <tbody>
                {/* Consultation Fee if present */}
                {bill.consultationFee > 0 && (
                  <tr>
                    <td className={`${tdBase} text-center`}>1</td>
                    <td className={tdBase}>
                      <div className="font-semibold text-navy-900">Professional Doctor Consultation Fee</div>
                      <div className="text-[10px] text-slate-500">SAC: 999312 • GST 18%</div>
                    </td>
                    <td className={`${tdBase} text-center text-slate-400`}>—</td>
                    <td className={`${tdBase} text-center text-slate-400`}>—</td>
                    <td className={`${tdBase} text-center font-bold`}>1</td>
                    <td className={`${tdBase} text-right`}>₹{bill.consultationFee.toFixed(2)}</td>
                    <td className={`${tdBase} text-center text-slate-400`}>0%</td>
                    <td className={`${tdBase} text-right font-semibold`}>₹{bill.consultationFee.toFixed(2)}</td>
                  </tr>
                )}

                {/* Medicine Rows */}
                {bill.prescriptionItems.map((item, index) => {
                  const sNo = bill.consultationFee > 0 ? index + 2 : index + 1;
                  const itemGross = item.quantity * item.pricePerUnit;
                  const itemDisc = item.discountAmount || 0;
                  return (
                    <tr key={index} className="hover:bg-slate-50">
                      <td className={`${tdBase} text-center`}>{sNo}</td>
                      <td className={tdBase}>
                        <div className="font-semibold text-navy-900">{item.medicineName}</div>
                        <div className="text-[10px] text-slate-500 font-mono">HSN: {item.hsn || '300490'} • GST: {item.gstRate}%</div>
                      </td>
                      <td className={`${tdBase} text-center font-mono`}>{item.batchNo}</td>
                      <td className={`${tdBase} text-center font-mono`}>{item.expiryDate}</td>
                      <td className={`${tdBase} text-center font-bold text-teal-800`}>{item.quantity}</td>
                      <td className={`${tdBase} text-right font-mono`}>₹{item.pricePerUnit.toFixed(2)}</td>
                      <td className={`${tdBase} text-center font-mono text-emerald-700`}>
                        {item.discountPercent && item.discountPercent > 0 ? (
                          <span>{item.discountPercent}%<br/><span className="text-[9px]">(-₹{itemDisc.toFixed(1)})</span></span>
                        ) : '—'}
                      </td>
                      <td className={`${tdBase} text-right font-bold text-navy-900 font-mono`}>
                        ₹{item.totalPrice.toFixed(2)}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* ── TAX BREAKDOWN & TOTAL ── */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 border border-slate-300 rounded-lg p-3 mb-4 bg-slate-50/50 text-xs">
            <div className="space-y-1">
              <div className="font-bold text-slate-700 uppercase tracking-wide">GST Tax Summary</div>
              <div className="flex justify-between text-slate-600">
                <span>Taxable Subtotal:</span>
                <span className="font-mono">₹{bill.subTotal.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-slate-600">
                <span>CGST:</span>
                <span className="font-mono">₹{bill.cgst.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-slate-600">
                <span>SGST:</span>
                <span className="font-mono">₹{bill.sgst.toFixed(2)}</span>
              </div>
              <div className="text-[10px] text-emerald-700 font-medium pt-1">
                ✓ Computer-generated official tax invoice under Indian GST Act.
              </div>
            </div>

            <div className="border-t sm:border-t-0 sm:border-l border-slate-300 pt-2 sm:pt-0 sm:pl-4 space-y-1">
              <div className="flex justify-between items-center text-sm font-black text-navy-900 border-b border-slate-300 pb-1">
                <span>TOTAL AMOUNT:</span>
                <span className="text-base text-teal-700 font-mono">₹{bill.totalAmount.toFixed(2)}</span>
              </div>
              <div className="flex justify-between items-center text-xs font-bold">
                <span>Amount Paid:</span>
                <span className={isPaid ? 'text-emerald-700 font-mono' : 'text-red-600 font-mono'}>
                  {isPaid ? `₹${bill.totalAmount.toFixed(2)} (PAID ✓)` : '₹0.00'}
                </span>
              </div>
              <div className="flex justify-between items-center text-xs font-bold">
                <span>Balance Due:</span>
                <span className={isPaid ? 'text-emerald-700 font-mono' : 'text-red-600 font-mono'}>
                  {isPaid ? '₹0.00 (NIL)' : `₹${bill.totalAmount.toFixed(2)}`}
                </span>
              </div>
            </div>
          </div>

          {/* ── WORDS ── */}
          <div className="border border-slate-300 rounded-lg px-3 py-1.5 text-xs mb-4 bg-slate-50">
            <span className="font-bold text-slate-700">Amount in Words: </span>
            <span className="font-medium text-navy-900 italic">{numberToWords(bill.totalAmount)}</span>
          </div>

          {/* ── FOOTER & SIGNATURE ── */}
          <div className="flex justify-between items-end text-xs pt-4 border-t border-slate-300">
            <div className="space-y-0.5">
              <div className="text-[10px] text-slate-500 font-medium">E. &amp; O.E. • Subject to Bangalore Jurisdiction</div>
              <div className="text-[10px] text-slate-500">Please consult your doctor before repeating Schedule H medications.</div>
              <div className="font-bold text-teal-700 mt-2">*** WISH YOU A SPEEDY RECOVERY ***</div>
            </div>

            <div className="text-right">
              <div className="border-t border-slate-400 w-32 mb-1"></div>
              <div className="font-bold text-slate-700 text-[11px] uppercase">Authorized Signatory</div>
              <div className="text-[10px] text-slate-500">{bill.orgName || 'ClinicPulse Pro'}</div>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
};
