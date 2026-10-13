import { useMemo } from 'react';
import { Printer, Smartphone, CheckCircle } from 'lucide-react';
import { useAppState } from '../../context/AppStateContext';
import { doctors } from '../../data/mockData';
import confetti from 'canvas-confetti';
import { useUser } from '@clerk/react';

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

export const InvoiceHub = ({ selectedInvoiceId }: { selectedInvoiceId: string | null }) => {
  const { invoices } = useAppState();
  const { user } = useUser();

  const hospitalName =
    (user?.unsafeMetadata?.clinicName as string) ||
    localStorage.getItem('clinicpulse_clinic_name') ||
    'CLINICPULSE PRO HOSPITAL';
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
    'DL No: ——————';
  const billedBy =
    (user?.unsafeMetadata?.staffName as string) ||
    user?.firstName ||
    'Staff';

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

  // Computed totals
  const totalQty = invoice.prescriptionItems.reduce((acc, p) => acc + p.quantity, 0);
  const itemCount = invoice.prescriptionItems.length + (invoice.labItems?.length || 0) + 1; // +1 for consultation
  const billDate = new Date(invoice.date);
  const billDateTime = billDate.toLocaleDateString('en-IN', { day: '2-digit', month: '2-digit', year: 'numeric' }) +
    '  ' + billDate.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: true }).toUpperCase();

  const handleWhatsAppShare = () => {
    confetti({
      particleCount: 100,
      spread: 70,
      origin: { y: 0.6 },
      colors: ['#00A896', '#0D9488', '#0F4C81']
    });

    const text = `*${hospitalName} - Medical Tax Invoice* %0A%0AHello *${invoice.patient.name}*,%0AThank you for your visit today.%0A%0A*Bill No:* ${invoice.id}%0A*Doctor:* ${doctor?.name}%0A*Phone:* ${hospitalPhone}%0A*Email:* ${hospitalEmail}%0A*GSTIN:* ${hospitalGst}%0A%0A*Medicines Prescribed:*%0A${invoice.prescriptionItems.map(p => `- ${p.medicineName} (${p.dosage}) [${p.foodTiming || 'After Food'}] for ${p.durationDays} days`).join('%0A')}%0A%0A*CGST:* ₹${invoice.cgst.toFixed(2)}%0A*SGST:* ₹${invoice.sgst.toFixed(2)}%0A*GST Total:* ₹${(invoice.cgst + invoice.sgst).toFixed(2)}%0A%0A*Grand Total:* ₹${invoice.totalAmount.toFixed(2)}%0A%0A*** WISH YOU A SPEEDY RECOVERY ***`;

    window.open(`https://wa.me/91${invoice.patient.phone}?text=${text}`, '_blank');
  };

  const vpa = "clinicpulse@upi";
  const upiString = `upi://pay?pa=${vpa}&pn=ClinicPulse&am=${invoice.totalAmount.toFixed(2)}&cu=INR&tn=Invoice-${invoice.id}`;
  const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${encodeURIComponent(upiString)}`;

  const tdBase = "border border-slate-300 px-2 py-1.5 text-xs";
  const thBase = "border border-slate-400 px-2 py-1.5 text-xs font-bold text-center bg-slate-100 uppercase tracking-wide";

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

      {/* ─── Left: Invoice Preview (pharmacy bill style) ─── */}
      <div className="lg:col-span-2">
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
              <div><span className="font-bold">Doctor Name</span> : {doctor?.name}</div>
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
              <div><span className="font-bold">Specialty</span> : {doctor?.specialty}</div>
              <div><span className="font-bold">Reg No</span> : {doctor?.regNo}</div>
            </div>
          </div>

          {/* ── ITEMS TABLE ── */}
          <div className="px-4 py-2 overflow-x-auto">
            <table className="w-full border-collapse" style={{ fontSize: '11px' }}>
              <thead>
                <tr>
                  <th className={thBase} style={{ width: '28px' }}>S.No</th>
                  <th className={thBase} style={{ width: '52px' }}>MFR</th>
                  <th className={`${thBase} text-left`}>Product Name</th>
                  <th className={thBase} style={{ width: '76px' }}>Batch</th>
                  <th className={thBase} style={{ width: '44px' }}>Exp</th>
                  <th className={thBase} style={{ width: '32px' }}>Qty</th>
                  <th className={thBase} style={{ width: '64px' }}>MRP</th>
                  <th className={thBase} style={{ width: '68px' }}>Amount</th>
                </tr>
              </thead>
              <tbody>
                {/* Consultation Row */}
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
                  <td className={`${tdBase} text-right font-semibold`}>₹{invoice.consultationFee.toFixed(2)}</td>
                </tr>

                {/* Medicine Rows */}
                {invoice.prescriptionItems.map((item, idx) => (
                  <tr key={item.id} className={idx % 2 === 0 ? 'bg-slate-50/40' : ''}>
                    <td className={`${tdBase} text-center`}>{idx + 2}</td>
                    <td className={`${tdBase} text-center uppercase`} style={{ fontSize: '10px' }}>
                      {/* Manufacturer abbreviation: take first word ≤5 chars */}
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
                    <td className={`${tdBase} text-right font-semibold`}>₹{item.totalPrice.toFixed(2)}</td>
                  </tr>
                ))}

                {/* Lab Test Rows */}
                {invoice.labItems?.map((item, idx) => (
                  <tr key={item.id} className="bg-purple-50/40">
                    <td className={`${tdBase} text-center`}>{invoice.prescriptionItems.length + idx + 2}</td>
                    <td className={`${tdBase} text-center`} style={{ fontSize: '10px' }}>LAB</td>
                    <td className={`${tdBase}`}>
                      <div className="font-semibold">{item.testName}</div>
                      <div className="text-[10px] text-slate-500">Lab Diagnostic Test</div>
                    </td>
                    <td className={`${tdBase} text-center`}>—</td>
                    <td className={`${tdBase} text-center`}>—</td>
                    <td className={`${tdBase} text-center`}>1</td>
                    <td className={`${tdBase} text-right`}>₹{item.price.toFixed(2)}</td>
                    <td className={`${tdBase} text-right font-semibold`}>₹{item.price.toFixed(2)}</td>
                  </tr>
                ))}
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
              </div>
              <div className="text-right space-y-0.5">
                <div className="flex gap-12 justify-end">
                  <span className="text-slate-600">Sub Total:</span>
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
        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm text-center">
          <h3 className="text-lg font-semibold text-navy-900 mb-2">Scan &amp; Pay</h3>
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

        {/* Invoice Summary Card */}
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm text-xs text-slate-700 space-y-2">
          <h4 className="font-semibold text-slate-900 border-b pb-1 mb-2">Bill Summary</h4>
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
    </div>
  );
};
