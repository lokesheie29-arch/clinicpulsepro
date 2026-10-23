import { useState, useEffect } from 'react';
import {
  ShieldCheck,
  CheckCircle2,
  Lock,
  ArrowLeft,
  Sparkles,
  CreditCard,
  Building2,
  BadgePercent,
  Receipt,
  HelpCircle,
  Download,
  AlertCircle
} from 'lucide-react';
import confetti from 'canvas-confetti';

export type PlanId = 'starter' | 'professional' | 'enterprise';
export type BillingCycle = 'monthly' | 'annual';

interface PlanDetails {
  id: PlanId;
  name: string;
  tagline: string;
  monthlyPrice: number;
  annualMonthlyPrice: number; // 20% discount
  popular?: boolean;
  features: string[];
}

export const SUBSCRIPTION_PLANS: Record<PlanId, PlanDetails> = {
  starter: {
    id: 'starter',
    name: 'Starter Clinic',
    tagline: 'Ideal for standalone general practice clinics & small dispensaries',
    monthlyPrice: 999,
    annualMonthlyPrice: 799,
    features: [
      'Single Branch / Counter Operations',
      'Up to 2 Doctor & Staff Logins',
      'OPD Consultation & E-Prescriptions',
      'WhatsApp Bill & Payment Links',
      'Basic Pharmacy Stock Management',
      'Daily Financial Summary'
    ]
  },
  professional: {
    id: 'professional',
    name: 'Growth & Professional ERP',
    tagline: 'For multispecialty clinics, busy medical stores & diagnostic labs',
    monthlyPrice: 2499,
    annualMonthlyPrice: 1999,
    popular: true,
    features: [
      'Multi-Specialty & Laboratory Support',
      'Up to 10 Doctor & Staff Logins',
      'FEFO Drug Inventory & Expiry Alerts (1y, 6m, 3m, 1m)',
      'Direct WhatsApp Official PDF Invoices',
      'Instant UPI QR & Direct Bank Settlement',
      'Advanced Diagnostic Test Reports',
      'Role-Based Staff Access Control',
      'Priority Email & WhatsApp Support'
    ]
  },
  enterprise: {
    id: 'enterprise',
    name: 'Polyclinic & Hospital ERP Suite',
    tagline: 'For hospitals, healthcare chains & high-volume pharmacy networks',
    monthlyPrice: 4999,
    annualMonthlyPrice: 3999,
    features: [
      'Unlimited Branches & Departments',
      'Unlimited Doctor & Admin Logins',
      'Complete Purchase & Procurement Suite (RFQ, PO, GRN, 3-Way Match)',
      'Automated Accounts Payable & Vendor Ledgers',
      'Custom GSTIN & Drug License Configuration',
      'Automated Daily Cloud Backups',
      'Dedicated Account Manager & 24/7 Phone SLA'
    ]
  }
};

declare global {
  interface Window {
    Razorpay: any;
  }
}

export const CheckoutPage = ({
  initialPlan = 'professional',
  initialBilling = 'annual',
  onBack,
  onSuccess
}: {
  initialPlan?: PlanId;
  initialBilling?: BillingCycle;
  onBack: () => void;
  onSuccess?: () => void;
}) => {
  const [selectedPlanId, setSelectedPlanId] = useState<PlanId>(initialPlan);
  const [billingCycle, setBillingCycle] = useState<BillingCycle>(initialBilling);
  const [orgType, setOrgType] = useState<'hospital' | 'laboratory' | 'pharmacy'>('hospital');
  const [isProcessing, setIsProcessing] = useState(false);
  const [paymentSuccess, setPaymentSuccess] = useState<any | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Form Fields
  const [formData, setFormData] = useState({
    clinicName: '',
    fullName: '',
    email: '',
    phone: '',
    gstin: '',
    city: '',
    state: 'Karnataka'
  });

  const plan = SUBSCRIPTION_PLANS[selectedPlanId] || SUBSCRIPTION_PLANS.professional;
  const razorpayKey = import.meta.env.VITE_RAZORPAY_KEY_ID || '';

  // Calculate pricing
  const isAnnual = billingCycle === 'annual';
  const unitMonthlyPrice = isAnnual ? plan.annualMonthlyPrice : plan.monthlyPrice;
  const baseSubtotal = isAnnual ? unitMonthlyPrice * 12 : unitMonthlyPrice;
  const savings = isAnnual ? (plan.monthlyPrice - plan.annualMonthlyPrice) * 12 : 0;
  const gstTax = Math.round(baseSubtotal * 0.18);
  const totalAmount = baseSubtotal + gstTax;

  // Load Razorpay Script dynamically
  useEffect(() => {
    if (!window.Razorpay) {
      const script = document.createElement('script');
      script.src = 'https://checkout.razorpay.com/v1/checkout.js';
      script.async = true;
      document.body.appendChild(script);
    }
  }, []);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleRazorpayPayment = async () => {
    // Validation
    if (!formData.clinicName.trim() || !formData.fullName.trim()) {
      alert('Please enter your Healthcare Facility Name and Contact Person Full Name.');
      return;
    }

    if (!formData.email.trim() || !formData.phone.trim()) {
      alert('Please enter your valid Email and Phone / WhatsApp number.');
      return;
    }

    setIsProcessing(true);
    setErrorMessage(null);

    // 1. If Razorpay key is NOT provided in .env, offer sandbox demo completion
    if (!razorpayKey || razorpayKey === 'rzp_test_placeholder' || razorpayKey.includes('your_key')) {
      setTimeout(() => {
        const mockPaymentId = `pay_mock_${Math.random().toString(36).substring(2, 11)}`;
        completeSubscription(mockPaymentId, 'Sandbox Simulation (Add VITE_RAZORPAY_KEY_ID in .env for Live)');
      }, 1000);
      return;
    }

    // 2. Real Razorpay Gateway Integration
    if (!window.Razorpay) {
      setErrorMessage('Razorpay SDK failed to load. Please check your internet connection or try again.');
      setIsProcessing(false);
      return;
    }

    try {
      const options = {
        key: razorpayKey,
        amount: totalAmount * 100, // in paise
        currency: 'INR',
        name: 'ClinicPulse Pro',
        description: `${plan.name} (${isAnnual ? '1 Year' : '1 Month'}) Subscription`,
        image: 'https://clinicpulsepro.com/logo.png',
        prefill: {
          name: formData.fullName,
          email: formData.email,
          contact: formData.phone
        },
        notes: {
          clinicName: formData.clinicName,
          orgType: orgType,
          planId: plan.id,
          billingCycle: billingCycle,
          gstin: formData.gstin || 'Unregistered'
        },
        theme: {
          color: '#0D9488' // Teal-600
        },
        handler: function (response: any) {
          completeSubscription(response.razorpay_payment_id, 'Razorpay Verified Direct Settlement');
        },
        modal: {
          ondismiss: function () {
            setIsProcessing(false);
          }
        }
      };

      const rzp = new window.Razorpay(options);
      rzp.on('payment.failed', function (response: any) {
        setIsProcessing(false);
        setErrorMessage(response.error?.description || 'Payment was declined or cancelled.');
      });
      rzp.open();
    } catch (err: any) {
      setIsProcessing(false);
      setErrorMessage(err.message || 'Error initializing Razorpay gateway.');
    }
  };

  const completeSubscription = (paymentId: string, method: string) => {
    setIsProcessing(false);
    const subRecord = {
      paymentId,
      method,
      plan: plan.name,
      planId: plan.id,
      billingCycle,
      totalPaid: totalAmount,
      date: new Date().toISOString(),
      clinicName: formData.clinicName,
      contactName: formData.fullName,
      email: formData.email,
      phone: formData.phone,
      gstin: formData.gstin,
      validUntil: isAnnual
        ? new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toLocaleDateString('en-IN')
        : new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toLocaleDateString('en-IN')
    };

    localStorage.setItem('clinicpulse_active_subscription', JSON.stringify(subRecord));
    setPaymentSuccess(subRecord);

    confetti({
      particleCount: 160,
      spread: 80,
      origin: { y: 0.6 },
      colors: ['#0D9488', '#10B981', '#0F4C81', '#F59E0B']
    });
  };

  // SUCCESS SCREEN
  if (paymentSuccess) {
    return (
      <div className="min-h-screen bg-slate-50 py-12 px-4 sm:px-6 lg:px-8 flex items-center justify-center">
        <div className="max-w-2xl w-full bg-white rounded-3xl shadow-2xl border border-slate-200 p-8 sm:p-10 text-center space-y-6">
          <div className="w-20 h-20 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto shadow-inner">
            <CheckCircle2 className="w-12 h-12" />
          </div>

          <div className="space-y-2">
            <span className="px-3 py-1 rounded-full text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
              Payment Confirmed • Subscription Active ✓
            </span>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-navy-900">
              Welcome to ClinicPulse Pro!
            </h1>
            <p className="text-sm text-slate-500">
              Thank you, <strong>{paymentSuccess.contactName}</strong>. Your subscription for{' '}
              <strong>{paymentSuccess.clinicName}</strong> has been successfully activated.
            </p>
          </div>

          {/* Receipt Details Card */}
          <div className="bg-slate-50 rounded-2xl p-6 border border-slate-200 text-left text-xs space-y-3 font-mono">
            <div className="flex justify-between border-b pb-2">
              <span className="text-slate-500 font-sans">Payment Reference:</span>
              <span className="font-bold text-navy-900">{paymentSuccess.paymentId}</span>
            </div>
            <div className="flex justify-between border-b pb-2">
              <span className="text-slate-500 font-sans">Plan Subscribed:</span>
              <span className="font-bold text-teal-700">{paymentSuccess.plan} ({paymentSuccess.billingCycle})</span>
            </div>
            <div className="flex justify-between border-b pb-2">
              <span className="text-slate-500 font-sans">Total Amount Paid:</span>
              <span className="font-bold text-navy-900">₹{paymentSuccess.totalPaid.toLocaleString('en-IN')} (incl. 18% GST)</span>
            </div>
            <div className="flex justify-between border-b pb-2">
              <span className="text-slate-500 font-sans">Payment Mode:</span>
              <span className="font-bold text-slate-800">{paymentSuccess.method}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500 font-sans">Access Valid Until:</span>
              <span className="font-bold text-emerald-700">{paymentSuccess.validUntil}</span>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row gap-3 pt-4">
            <button
              onClick={() => {
                if (onSuccess) onSuccess();
                else window.location.href = '/';
              }}
              className="flex-1 bg-gradient-to-r from-teal-600 via-teal-700 to-navy-900 hover:from-teal-700 hover:to-navy-800 text-white font-bold py-3.5 px-6 rounded-xl transition-all shadow-md text-sm"
            >
              Enter ClinicPulse Pro Workspace →
            </button>
            <button
              onClick={() => window.print()}
              className="bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold py-3.5 px-6 rounded-xl text-sm flex items-center justify-center gap-2 transition-colors"
            >
              <Download className="w-4 h-4" />
              <span>Print Tax Receipt</span>
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-6xl w-full mx-auto space-y-8">
        {/* Top Header & Back Button */}
        <div className="flex items-center justify-between">
          <button
            onClick={onBack}
            className="flex items-center gap-2 text-xs font-bold text-slate-600 hover:text-navy-900 bg-white px-4 py-2.5 rounded-xl border border-slate-200 shadow-xs transition-colors"
          >
            <ArrowLeft className="w-4 h-4 text-teal-600" />
            <span>Back to Plans</span>
          </button>

          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200 text-xs font-bold">
            <Lock className="w-3.5 h-3.5 text-emerald-600" />
            <span>256-Bit Encrypted Razorpay Checkout</span>
          </div>
        </div>

        {/* Header Title */}
        <div className="text-center space-y-2">
          <h1 className="text-2xl sm:text-4xl font-extrabold text-navy-900 tracking-tight">
            Complete Your ClinicPulse Pro Subscription
          </h1>
          <p className="text-slate-500 text-sm max-w-xl mx-auto">
            Get instant access to enterprise healthcare operations, FEFO pharmacy inventory, and automated WhatsApp billing.
          </p>
        </div>

        {/* Billing Cycle Switcher */}
        <div className="flex items-center justify-center">
          <div className="bg-slate-200/80 p-1.5 rounded-2xl flex items-center gap-2">
            <button
              onClick={() => setBillingCycle('monthly')}
              className={`px-5 py-2 rounded-xl text-xs font-bold transition-all ${
                billingCycle === 'monthly'
                  ? 'bg-white text-navy-900 shadow-xs'
                  : 'text-slate-600 hover:text-navy-900'
              }`}
            >
              Monthly Billing
            </button>
            <button
              onClick={() => setBillingCycle('annual')}
              className={`px-5 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all ${
                billingCycle === 'annual'
                  ? 'bg-teal-700 text-white shadow-xs'
                  : 'text-slate-600 hover:text-navy-900'
              }`}
            >
              <span>Annual Billing</span>
              <span className="bg-amber-400 text-navy-900 text-[10px] font-black px-2 py-0.5 rounded-full">
                SAVE 20%
              </span>
            </button>
          </div>
        </div>

        {/* 2-Column Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* Left Form: Plan Selector & Customer Information */}
          <div className="lg:col-span-7 space-y-6">
            {/* Step 1: Choose / Confirm Plan */}
            <div className="bg-white rounded-3xl p-6 sm:p-7 border border-slate-200 shadow-sm space-y-4">
              <div className="flex items-center justify-between border-b pb-3">
                <h3 className="text-base font-bold text-navy-900 flex items-center gap-2">
                  <span className="w-6 h-6 rounded-full bg-teal-100 text-teal-800 text-xs flex items-center justify-center font-bold">1</span>
                  Select Subscription Tier
                </h3>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {(Object.keys(SUBSCRIPTION_PLANS) as PlanId[]).map((pId) => {
                  const p = SUBSCRIPTION_PLANS[pId];
                  const isSelected = selectedPlanId === pId;
                  const price = isAnnual ? p.annualMonthlyPrice : p.monthlyPrice;
                  return (
                    <div
                      key={pId}
                      onClick={() => setSelectedPlanId(pId)}
                      className={`cursor-pointer rounded-2xl p-4 border-2 transition-all relative ${
                        isSelected
                          ? 'border-teal-600 bg-teal-50/40 shadow-xs'
                          : 'border-slate-200 hover:border-slate-300 bg-white'
                      }`}
                    >
                      {p.popular && (
                        <span className="absolute -top-2.5 right-3 bg-amber-400 text-navy-900 font-black text-[9px] px-2 py-0.5 rounded-full tracking-wider uppercase">
                          POPULAR
                        </span>
                      )}
                      <h4 className="font-bold text-xs text-navy-900">{p.name}</h4>
                      <div className="mt-2 text-lg font-black text-teal-800">
                        ₹{price.toLocaleString('en-IN')}
                        <span className="text-[10px] text-slate-500 font-normal">/mo</span>
                      </div>
                      <p className="text-[11px] text-slate-500 mt-1 leading-snug">
                        {p.tagline}
                      </p>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Step 2: Clinic & Billing Information */}
            <div className="bg-white rounded-3xl p-6 sm:p-7 border border-slate-200 shadow-sm space-y-5">
              <div className="flex items-center justify-between border-b pb-3">
                <h3 className="text-base font-bold text-navy-900 flex items-center gap-2">
                  <span className="w-6 h-6 rounded-full bg-teal-100 text-teal-800 text-xs flex items-center justify-center font-bold">2</span>
                  Facility &amp; Billing Details
                </h3>
                <span className="text-[11px] text-slate-400">* Required for GST Tax Invoice</span>
              </div>

              <div className="space-y-4 text-xs">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    Facility Type *
                  </label>
                  <div className="grid grid-cols-3 gap-2">
                    {[
                      { id: 'hospital', label: 'Hospital / Clinic' },
                      { id: 'laboratory', label: 'Diagnostic Lab' },
                      { id: 'pharmacy', label: 'Pharmacy / Store' }
                    ].map((t) => (
                      <button
                        key={t.id}
                        type="button"
                        onClick={() => setOrgType(t.id as any)}
                        className={`py-2 px-3 rounded-xl border text-center font-bold text-xs transition-all ${
                          orgType === t.id
                            ? 'border-teal-600 bg-teal-50 text-teal-800'
                            : 'border-slate-200 text-slate-600 hover:border-slate-300'
                        }`}
                      >
                        {t.label}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block font-bold text-slate-700 mb-1">
                      Healthcare Center / Clinic Name *
                    </label>
                    <input
                      type="text"
                      name="clinicName"
                      value={formData.clinicName}
                      onChange={handleInputChange}
                      placeholder="e.g. Apex Multispecialty Hospital"
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 font-medium text-navy-900 focus:outline-none focus:ring-2 focus:ring-teal-500/20"
                    />
                  </div>

                  <div>
                    <label className="block font-bold text-slate-700 mb-1">
                      Contact Person Full Name *
                    </label>
                    <input
                      type="text"
                      name="fullName"
                      value={formData.fullName}
                      onChange={handleInputChange}
                      placeholder="Dr. Rajesh Kumar / Administrator"
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 font-medium text-navy-900 focus:outline-none focus:ring-2 focus:ring-teal-500/20"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block font-bold text-slate-700 mb-1">
                      Billing Email Address *
                    </label>
                    <input
                      type="email"
                      name="email"
                      value={formData.email}
                      onChange={handleInputChange}
                      placeholder="admin@apexclinic.com"
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 font-medium text-navy-900 focus:outline-none focus:ring-2 focus:ring-teal-500/20"
                    />
                  </div>

                  <div>
                    <label className="block font-bold text-slate-700 mb-1">
                      WhatsApp / Phone Number *
                    </label>
                    <input
                      type="tel"
                      name="phone"
                      value={formData.phone}
                      onChange={handleInputChange}
                      placeholder="9876543210"
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 font-medium text-navy-900 focus:outline-none focus:ring-2 focus:ring-teal-500/20"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block font-bold text-slate-700 mb-1">
                      GSTIN Number <span className="font-normal text-slate-400">(Optional for ITC Credit)</span>
                    </label>
                    <input
                      type="text"
                      name="gstin"
                      value={formData.gstin}
                      onChange={handleInputChange}
                      placeholder="29AAAAA0000A1Z5"
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 font-mono uppercase text-navy-900 focus:outline-none focus:ring-2 focus:ring-teal-500/20"
                    />
                  </div>

                  <div>
                    <label className="block font-bold text-slate-700 mb-1">
                      City &amp; State *
                    </label>
                    <input
                      type="text"
                      name="city"
                      value={formData.city}
                      onChange={handleInputChange}
                      placeholder="Bengaluru, Karnataka"
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 font-medium text-navy-900 focus:outline-none focus:ring-2 focus:ring-teal-500/20"
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Right Column: Order Summary & Razorpay Trigger */}
          <div className="lg:col-span-5 space-y-5">
            <div className="bg-white rounded-3xl p-6 sm:p-7 border border-slate-200 shadow-md space-y-6">
              <div className="border-b pb-3">
                <h3 className="text-base font-bold text-navy-900 flex items-center justify-between">
                  <span>Order Summary</span>
                  <span className="text-xs text-teal-700 font-bold bg-teal-50 px-2.5 py-0.5 rounded-full border border-teal-200">
                    {isAnnual ? 'Annual Billing' : 'Monthly'}
                  </span>
                </h3>
              </div>

              {/* Selected Plan Details */}
              <div className="bg-slate-50 rounded-2xl p-4 border border-slate-200 space-y-2">
                <div className="flex justify-between items-start">
                  <div>
                    <h4 className="font-extrabold text-navy-900 text-sm">{plan.name}</h4>
                    <p className="text-[11px] text-slate-500">{plan.tagline}</p>
                  </div>
                  <span className="font-black text-sm text-teal-800">
                    ₹{unitMonthlyPrice.toLocaleString('en-IN')}/mo
                  </span>
                </div>

                <div className="pt-2 border-t border-slate-200/80 space-y-1.5">
                  {plan.features.slice(0, 4).map((f, i) => (
                    <div key={i} className="flex items-center gap-2 text-[11px] text-slate-600">
                      <CheckCircle2 className="w-3.5 h-3.5 text-teal-600 shrink-0" />
                      <span>{f}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Price Calculation breakdown */}
              <div className="space-y-2 text-xs border-b pb-4">
                <div className="flex justify-between text-slate-600">
                  <span>Base Plan Fee ({isAnnual ? '12 Months' : '1 Month'}):</span>
                  <span className="font-mono">₹{baseSubtotal.toLocaleString('en-IN')}</span>
                </div>

                {isAnnual && savings > 0 && (
                  <div className="flex justify-between text-emerald-700 font-semibold">
                    <span className="flex items-center gap-1">
                      <BadgePercent className="w-3.5 h-3.5" />
                      Annual 20% Discount Saved:
                    </span>
                    <span className="font-mono">-₹{savings.toLocaleString('en-IN')}</span>
                  </div>
                )}

                <div className="flex justify-between text-slate-600">
                  <span>Applicable GST (18% CGST + SGST):</span>
                  <span className="font-mono">₹{gstTax.toLocaleString('en-IN')}</span>
                </div>
              </div>

              {/* Total Payable */}
              <div className="flex justify-between items-baseline pt-1">
                <div>
                  <div className="text-xs font-bold text-slate-700 uppercase tracking-wide">Total Payable</div>
                  <div className="text-[10px] text-slate-400">All Taxes &amp; GST Included</div>
                </div>
                <div className="text-right">
                  <div className="text-2xl sm:text-3xl font-black text-teal-700 font-mono">
                    ₹{totalAmount.toLocaleString('en-IN')}
                  </div>
                  <div className="text-[10px] text-emerald-700 font-bold">
                    {isAnnual ? 'Billed annually (Includes 2 months free)' : 'Billed monthly'}
                  </div>
                </div>
              </div>

              {errorMessage && (
                <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-xs text-red-700 flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 text-red-600 shrink-0" />
                  <span>{errorMessage}</span>
                </div>
              )}

              {/* Pay Button */}
              <button
                onClick={handleRazorpayPayment}
                disabled={isProcessing}
                className="w-full bg-gradient-to-r from-teal-600 via-teal-700 to-navy-900 hover:from-teal-700 hover:to-navy-800 disabled:opacity-60 text-white font-extrabold py-4 px-6 rounded-2xl shadow-lg transition-all flex items-center justify-center gap-2 text-sm group"
              >
                <Lock className="w-4 h-4 text-teal-300 group-hover:scale-110 transition-transform" />
                <span>
                  {isProcessing
                    ? 'Connecting to Razorpay...'
                    : `Pay ₹${totalAmount.toLocaleString('en-IN')} via Razorpay / UPI`}
                </span>
              </button>

              <div className="text-center space-y-2">
                <p className="text-[10px] text-slate-400 flex items-center justify-center gap-1.5">
                  <ShieldCheck className="w-3.5 h-3.5 text-teal-600" />
                  Supports Google Pay, PhonePe, Paytm, NetBanking, Credit/Debit Cards
                </p>
                <p className="text-[10px] text-slate-400">
                  Instant activation upon verified payment • Official GST Tax Invoice issued
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
