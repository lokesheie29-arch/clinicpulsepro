import React, { useState, useEffect } from 'react';
import { 
  QrCode, 
  Smartphone, 
  CreditCard, 
  CheckCircle2, 
  Clock, 
  Share2, 
  Copy, 
  Check, 
  ExternalLink, 
  ShieldCheck, 
  Sparkles, 
  Send,
  AlertCircle,
  Receipt,
  User,
  Landmark,
  ArrowRight
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { usePayment } from '../../context/PaymentContext';
import { useAppState } from '../../context/AppStateContext';
import { Invoice } from '../../types';

interface PatientPaymentPortalProps {
  initialInvoiceId?: string | null;
  onPaymentSuccess?: (invoiceId: string) => void;
}

export const PatientPaymentPortal: React.FC<PatientPaymentPortalProps> = ({ 
  initialInvoiceId, 
  onPaymentSuccess 
}) => {
  const { invoices, orgType } = useAppState();
  const { activeConfig, createPaymentOrder, verifyAndRecordPayment } = usePayment();

  // Selected invoice
  const [selectedInvId, setSelectedInvId] = useState<string>(
    initialInvoiceId || invoices.find(i => i.paymentStatus === 'Pending')?.id || invoices[0]?.id || ''
  );

  const [copiedVpa, setCopiedVpa] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);
  const [isVerifying, setIsVerifying] = useState(false);
  const [paymentComplete, setPaymentComplete] = useState(false);
  const [completedTxnId, setCompletedTxnId] = useState<string | null>(null);

  const activeInvoice = invoices.find(i => i.id === selectedInvId) || invoices[0];

  // Dynamic order details
  const orderData = React.useMemo(() => {
    if (!activeInvoice) return null;
    return createPaymentOrder({
      invoiceId: activeInvoice.id,
      amount: activeInvoice.totalAmount,
      patientName: activeInvoice.patient.name,
      patientPhone: activeInvoice.patient.phone,
      billCategory: orgType === 'laboratory' ? 'lab' : orgType === 'pharmacy' ? 'pharmacy' : 'opd'
    });
  }, [activeInvoice, activeConfig, orgType]);

  // Reset payment status when switching invoices
  useEffect(() => {
    if (activeInvoice?.paymentStatus === 'Paid') {
      setPaymentComplete(true);
    } else {
      setPaymentComplete(false);
      setCompletedTxnId(null);
    }
  }, [selectedInvId, activeInvoice?.paymentStatus]);

  if (!activeInvoice || !orderData) {
    return (
      <div className="bg-white rounded-2xl p-12 text-center border border-slate-200">
        <Receipt className="w-10 h-10 text-slate-300 mx-auto mb-3" />
        <h3 className="font-bold text-slate-700">No Invoices Available</h3>
        <p className="text-xs text-slate-400 mt-1">Generate a consultation or bill first from OPD, Lab, or Pharmacy.</p>
      </div>
    );
  }

  // Copy VPA
  const handleCopyVpa = () => {
    navigator.clipboard.writeText(orderData.merchantVpa);
    setCopiedVpa(true);
    setTimeout(() => setCopiedVpa(false), 2000);
  };

  // Copy Payment Link
  const handleCopyLink = () => {
    navigator.clipboard.writeText(orderData.upiIntentUrl);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2000);
  };

  // Open WhatsApp with payment link
  const handleSendWhatsAppLink = () => {
    const cleanPhone = activeInvoice.patient.phone.replace(/\D/g, '');
    const waText = `*${activeConfig.organizationName} - Bill %26 Payment Request*%0A%0AHello *${activeInvoice.patient.name}*,%0AYour medical invoice *%23${activeInvoice.id}* is ready.%0A%0A*Total Amount Due:* ₹${activeInvoice.totalAmount.toFixed(2)}%0A*Payment Status:* PENDING PAYMENT%0A%0A*Pay Instantly via UPI / QR:*%0A${encodeURIComponent(orderData.upiIntentUrl)}%0A%0A*Direct UPI VPA:* \`${orderData.merchantVpa}\`%0A%0AOnce your payment is completed, your official GST Tax Invoice PDF will be delivered automatically!`;
    window.open(`https://wa.me/91${cleanPhone}?text=${waText}`, '_blank');
  };

  // Simulate or Confirm Payment
  const handleSimulatePayment = async (method: 'Google Pay' | 'PhonePe' | 'Paytm' | 'BHIM' | 'Card') => {
    setIsVerifying(true);
    try {
      await new Promise(r => setTimeout(r, 900)); // Simulate gateway round-trip

      const txn = await verifyAndRecordPayment(
        orderData.orderId,
        activeInvoice.id,
        activeInvoice.totalAmount,
        activeInvoice.patient.name,
        activeInvoice.patient.phone,
        method === 'Card' ? 'card' : 'upi_intent',
        method === 'Card' 
          ? { cardNetwork: 'Visa', cardLast4: '8821', bankName: 'HDFC Bank' } 
          : { upiApp: method, vpa: `${activeInvoice.patient.name.toLowerCase().replace(/\s+/g, '')}@upi` }
      );

      setPaymentComplete(true);
      setCompletedTxnId(txn.id);

      confetti({
        particleCount: 100,
        spread: 70,
        origin: { y: 0.6 },
        colors: ['#00A896', '#0F4C81', '#10B981']
      });

      if (onPaymentSuccess) {
        onPaymentSuccess(activeInvoice.id);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setIsVerifying(false);
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
      {/* Left Column: Bill Selector & Patient Summary */}
      <div className="lg:col-span-5 space-y-4">
        {/* Bill Selection Dropdown */}
        <div className="bg-white rounded-2xl p-4 border border-slate-200/80 shadow-sm">
          <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">
            Select Patient Bill to Collect Payment:
          </label>
          <select
            value={selectedInvId}
            onChange={(e) => setSelectedInvId(e.target.value)}
            className="w-full text-xs bg-slate-50 border border-slate-200 rounded-xl p-2.5 font-medium text-navy-900 focus:outline-none focus:ring-2 focus:ring-teal-500/20"
          >
            {invoices.map(inv => (
              <option key={inv.id} value={inv.id}>
                {inv.id} — {inv.patient.name} (₹{inv.totalAmount.toFixed(2)}) [{inv.paymentStatus}]
              </option>
            ))}
          </select>
        </div>

        {/* Invoice Summary Card */}
        <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-sm space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-teal-600 bg-teal-50 px-2 py-0.5 rounded-full">
                {activeInvoice.id}
              </span>
              <h3 className="font-bold text-navy-900 text-sm mt-1">{activeInvoice.patient.name}</h3>
            </div>
            <div className="text-right">
              <span className={`text-[10px] font-bold px-2.5 py-1 rounded-full ${
                activeInvoice.paymentStatus === 'Paid' 
                  ? 'bg-emerald-100 text-emerald-800' 
                  : 'bg-amber-100 text-amber-800'
              }`}>
                {activeInvoice.paymentStatus.toUpperCase()}
              </span>
              <div className="text-xs text-slate-400 mt-1">
                {new Date(activeInvoice.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
              </div>
            </div>
          </div>

          {/* Patient Details */}
          <div className="grid grid-cols-2 gap-2 text-xs text-slate-600">
            <div>
              <span className="text-slate-400 block text-[10px]">Phone Number</span>
              <span className="font-mono font-medium">{activeInvoice.patient.phone || 'N/A'}</span>
            </div>
            <div>
              <span className="text-slate-400 block text-[10px]">Age / Gender</span>
              <span>{activeInvoice.patient.age} Yrs • {activeInvoice.patient.gender}</span>
            </div>
            <div>
              <span className="text-slate-400 block text-[10px]">Consultation Fee</span>
              <span>₹{activeInvoice.consultationFee.toFixed(2)}</span>
            </div>
            <div>
              <span className="text-slate-400 block text-[10px]">Prescriptions / Tests</span>
              <span>{activeInvoice.prescriptionItems.length + (activeInvoice.labItems?.length || 0)} Items</span>
            </div>
          </div>

          {/* Amount Due Big Banner */}
          <div className="bg-gradient-to-r from-teal-50 to-emerald-50 rounded-xl p-4 border border-teal-200/70 flex items-center justify-between">
            <div>
              <span className="text-xs font-semibold text-teal-800">Total Net Payable</span>
              <div className="text-2xl font-black text-teal-950">
                ₹{activeInvoice.totalAmount.toFixed(2)}
              </div>
            </div>
            <div className="text-right text-[11px] text-teal-700">
              <div>Subtotal: ₹{activeInvoice.subTotal.toFixed(2)}</div>
              <div>GST: ₹{(activeInvoice.cgst + activeInvoice.sgst).toFixed(2)}</div>
            </div>
          </div>

          {/* Direct WhatsApp Share button */}
          <button
            onClick={handleSendWhatsAppLink}
            className="w-full bg-emerald-600 hover:bg-emerald-700 text-white py-2.5 px-4 rounded-xl text-xs font-semibold flex items-center justify-center gap-2 transition-all shadow-sm"
          >
            <Send className="w-4 h-4" />
            <span>Send Payment Request via WhatsApp</span>
          </button>
        </div>

        {/* Settlement Account Notification */}
        <div className="bg-slate-50 rounded-xl p-3.5 border border-slate-200 text-xs text-slate-600 space-y-1">
          <div className="flex items-center gap-1.5 font-bold text-navy-900">
            <Landmark className="w-4 h-4 text-teal-600" />
            <span>Direct Bank Settlement Destination</span>
          </div>
          <p className="text-[11px]">
            Funds collected will settle into <strong>{activeConfig.bankAccount.bankName}</strong> (•••• {activeConfig.bankAccount.accountNumber.slice(-4)}) on a <strong>{activeConfig.settlementCycle} schedule</strong>.
          </p>
        </div>
      </div>

      {/* Right Column: Dynamic UPI QR & Payment Terminal */}
      <div className="lg:col-span-7 bg-white rounded-2xl p-6 border border-slate-200/80 shadow-sm flex flex-col justify-between">
        <div>
          {/* Header */}
          <div className="flex items-center justify-between pb-4 border-b border-slate-100">
            <div className="flex items-center gap-2.5">
              <div className="p-2 bg-teal-50 rounded-xl text-teal-700">
                <QrCode className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-bold text-navy-900 text-base">Direct UPI & Gateway Payment Terminal</h3>
                <p className="text-xs text-slate-500">Scan with any UPI App or click below for instant intent payment</p>
              </div>
            </div>

            <span className={`text-[10px] font-bold px-2.5 py-1 rounded-full border ${
              activeConfig.environmentMode === 'production' 
                ? 'bg-emerald-50 text-emerald-700 border-emerald-200' 
                : 'bg-amber-50 text-amber-700 border-amber-200'
            }`}>
              {activeConfig.environmentMode.toUpperCase()} GATEWAY
            </span>
          </div>

          {/* Payment Status State Banner */}
          {paymentComplete ? (
            <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-6 text-center my-6 space-y-3">
              <div className="w-12 h-12 bg-emerald-100 rounded-full flex items-center justify-center mx-auto text-emerald-600">
                <CheckCircle2 className="w-7 h-7" />
              </div>
              <h4 className="text-lg font-bold text-emerald-950">Payment Received & Verified!</h4>
              <p className="text-xs text-emerald-800 max-w-md mx-auto">
                ₹{activeInvoice.totalAmount.toFixed(2)} received from {activeInvoice.patient.name}. Invoice payment status is updated to <strong>PAID ✓</strong>.
              </p>
              {completedTxnId && (
                <div className="text-[11px] font-mono text-emerald-700 bg-white/80 py-1.5 px-3 rounded-lg inline-block border border-emerald-200">
                  Transaction Ref: {completedTxnId}
                </div>
              )}
            </div>
          ) : (
            /* Live Terminal Area */
            <div className="my-6 grid grid-cols-1 md:grid-cols-2 gap-6 items-center">
              {/* Dynamic QR Code Box */}
              <div className="flex flex-col items-center justify-center p-4 bg-slate-50/80 rounded-2xl border border-slate-200 text-center">
                <div className="relative p-2 bg-white rounded-xl shadow-sm border border-slate-200">
                  <img
                    src={orderData.qrCodeUrl}
                    alt="UPI Payment QR Code"
                    className="w-48 h-48 rounded-lg object-contain"
                  />
                  <div className="absolute inset-x-0 bottom-3 text-center">
                    <span className="bg-white/95 text-navy-900 font-bold text-[10px] px-2 py-0.5 rounded shadow-sm border border-slate-200">
                      ₹{activeInvoice.totalAmount.toFixed(2)}
                    </span>
                  </div>
                </div>

                <div className="mt-3 text-xs text-slate-600 font-medium">
                  Scan using GPay, PhonePe, Paytm, or BHIM
                </div>

                {/* Copy VPA Pill */}
                <div className="mt-2 flex items-center gap-1.5 bg-white px-2.5 py-1 rounded-lg border border-slate-200 text-[11px]">
                  <span className="text-slate-400">UPI ID:</span>
                  <span className="font-mono font-semibold text-navy-900">{orderData.merchantVpa}</span>
                  <button 
                    onClick={handleCopyVpa}
                    className="text-teal-600 hover:text-teal-700 transition-colors p-0.5"
                    title="Copy UPI ID"
                  >
                    {copiedVpa ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                  </button>
                </div>
              </div>

              {/* UPI Apps & Direct Payment Options */}
              <div className="space-y-3">
                <div className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                  Direct UPI Apps Payment:
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <button
                    disabled={isVerifying}
                    onClick={() => handleSimulatePayment('Google Pay')}
                    className="p-2.5 border border-slate-200 rounded-xl hover:border-teal-400 hover:bg-teal-50/50 transition-all text-xs font-semibold text-slate-800 flex items-center gap-2 group shadow-sm"
                  >
                    <div className="w-7 h-7 rounded-lg bg-white border border-slate-200 flex items-center justify-center font-bold text-blue-600">
                      G
                    </div>
                    <span>Google Pay</span>
                  </button>

                  <button
                    disabled={isVerifying}
                    onClick={() => handleSimulatePayment('PhonePe')}
                    className="p-2.5 border border-slate-200 rounded-xl hover:border-purple-400 hover:bg-purple-50/50 transition-all text-xs font-semibold text-slate-800 flex items-center gap-2 group shadow-sm"
                  >
                    <div className="w-7 h-7 rounded-lg bg-purple-600 text-white flex items-center justify-center font-bold">
                      Pe
                    </div>
                    <span>PhonePe</span>
                  </button>

                  <button
                    disabled={isVerifying}
                    onClick={() => handleSimulatePayment('Paytm')}
                    className="p-2.5 border border-slate-200 rounded-xl hover:border-blue-400 hover:bg-blue-50/50 transition-all text-xs font-semibold text-slate-800 flex items-center gap-2 group shadow-sm"
                  >
                    <div className="w-7 h-7 rounded-lg bg-sky-500 text-white flex items-center justify-center font-bold">
                      Pay
                    </div>
                    <span>Paytm</span>
                  </button>

                  <button
                    disabled={isVerifying}
                    onClick={() => handleSimulatePayment('BHIM')}
                    className="p-2.5 border border-slate-200 rounded-xl hover:border-amber-400 hover:bg-amber-50/50 transition-all text-xs font-semibold text-slate-800 flex items-center gap-2 group shadow-sm"
                  >
                    <div className="w-7 h-7 rounded-lg bg-amber-600 text-white flex items-center justify-center font-bold">
                      BH
                    </div>
                    <span>BHIM UPI</span>
                  </button>
                </div>

                {/* Cards & Net Banking Option */}
                <div className="pt-2">
                  <button
                    disabled={isVerifying}
                    onClick={() => handleSimulatePayment('Card')}
                    className="w-full p-2.5 bg-slate-900 hover:bg-navy-800 text-white rounded-xl text-xs font-semibold flex items-center justify-center gap-2 transition-all shadow-sm"
                  >
                    <CreditCard className="w-4 h-4 text-teal-400" />
                    <span>Pay with Debit / Credit Card / NetBanking</span>
                  </button>
                </div>

                {/* Copy UPI Intent Link */}
                <button
                  onClick={handleCopyLink}
                  className="w-full text-slate-500 hover:text-slate-700 py-1.5 text-[11px] font-medium flex items-center justify-center gap-1.5 transition-colors"
                >
                  {copiedLink ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copiedLink ? 'Payment link copied!' : 'Copy raw UPI intent link'}</span>
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Security & Verification Footer */}
        <div className="pt-4 border-t border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-[11px] text-slate-400">
          <div className="flex items-center gap-1.5">
            <ShieldCheck className="w-4 h-4 text-emerald-600" />
            <span>256-Bit Encrypted Gateway • Webhook Verified • RBI & NPCI Compliant</span>
          </div>
          <div className="text-slate-500">
            Order Ref: <span className="font-mono font-medium">{orderData.orderId}</span>
          </div>
        </div>
      </div>
    </div>
  );
};
