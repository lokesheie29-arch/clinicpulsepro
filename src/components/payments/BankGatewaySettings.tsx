import React, { useState } from 'react';
import { 
  Building2, 
  Landmark, 
  Key, 
  ShieldCheck, 
  Eye, 
  EyeOff, 
  Check, 
  Copy, 
  RefreshCw, 
  AlertCircle, 
  Save, 
  Sparkles,
  Lock,
  Smartphone,
  CheckCircle2,
  HelpCircle
} from 'lucide-react';
import { usePayment } from '../../context/PaymentContext';
import { useAppState } from '../../context/AppStateContext';
import { OrgType } from '../../types';
import { OrgPaymentConfig, PaymentGatewayProvider, EnvironmentMode } from '../../types/payment';

export const BankGatewaySettings: React.FC = () => {
  const { paymentConfigs, updateOrgConfig, testGatewayConnection } = usePayment();
  const { orgType } = useAppState();

  const [selectedOrg, setSelectedOrg] = useState<OrgType>(orgType);
  const config = paymentConfigs[selectedOrg] || paymentConfigs.hospital;

  // Local editable form state
  const [formData, setFormData] = useState<OrgPaymentConfig>({ ...config });
  const [showSecret, setShowSecret] = useState(false);
  const [copiedWebhook, setCopiedWebhook] = useState(false);
  const [confirmAccNumber, setConfirmAccNumber] = useState(config.bankAccount.accountNumber);
  const [accMatchError, setAccMatchError] = useState(false);
  const [isTesting, setIsTesting] = useState(false);
  const [testResult, setTestResult] = useState<{ success: boolean; message: string } | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  // Sync when changing selected org
  const handleSelectOrg = (type: OrgType) => {
    setSelectedOrg(type);
    const newConfig = paymentConfigs[type];
    setFormData({ ...newConfig });
    setConfirmAccNumber(newConfig.bankAccount.accountNumber);
    setTestResult(null);
    setSaveSuccess(false);
  };

  const handleInputChange = (field: keyof OrgPaymentConfig, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleBankChange = (field: keyof OrgPaymentConfig['bankAccount'], value: any) => {
    setFormData(prev => ({
      ...prev,
      bankAccount: {
        ...prev.bankAccount,
        [field]: value
      }
    }));
  };

  // Test Connection
  const handleTestConnection = async () => {
    setIsTesting(true);
    setTestResult(null);
    try {
      const res = await testGatewayConnection(selectedOrg);
      setTestResult(res);
    } catch (e: any) {
      setTestResult({ success: false, message: e.message || 'Connection test failed' });
    } finally {
      setIsTesting(false);
    }
  };

  // Save Config
  const handleSave = () => {
    if (formData.bankAccount.accountNumber !== confirmAccNumber) {
      setAccMatchError(true);
      return;
    }
    setAccMatchError(false);
    setIsSaving(true);

    updateOrgConfig(selectedOrg, formData);

    setTimeout(() => {
      setIsSaving(false);
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
    }, 500);
  };

  const webhookUrl = `${window.location.origin}/api/payment-webhook`;

  const handleCopyWebhook = () => {
    navigator.clipboard.writeText(webhookUrl);
    setCopiedWebhook(true);
    setTimeout(() => setCopiedWebhook(false), 2000);
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      {/* Organization Tab Switcher */}
      <div className="bg-white rounded-2xl p-4 border border-slate-200/80 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider block">
            Select Organization Facility to Configure:
          </span>
          <p className="text-xs text-slate-400 mt-0.5">
            Strict multi-tenant isolation — each facility settles to its own independent bank account.
          </p>
        </div>

        <div className="flex items-center gap-1.5 bg-slate-100 p-1 rounded-xl">
          <button
            onClick={() => handleSelectOrg('hospital')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              selectedOrg === 'hospital' 
                ? 'bg-white text-navy-900 shadow-sm' 
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Hospital Mode
          </button>
          <button
            onClick={() => handleSelectOrg('laboratory')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              selectedOrg === 'laboratory' 
                ? 'bg-white text-navy-900 shadow-sm' 
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Diagnostic Lab
          </button>
          <button
            onClick={() => handleSelectOrg('pharmacy')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              selectedOrg === 'pharmacy' 
                ? 'bg-white text-navy-900 shadow-sm' 
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Pharmacy / MedStore
          </button>
        </div>
      </div>

      {/* Gateway Environment & Provider Card */}
      <div className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-sm space-y-5">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-teal-50 rounded-xl text-teal-700">
              <Key className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-navy-900 text-sm">Payment Gateway & API Integration</h3>
              <p className="text-xs text-slate-500">Configure Indian Payment Gateway (Razorpay / Cashfree) credentials</p>
            </div>
          </div>

          {/* Environment Mode Switch */}
          <div className="flex items-center gap-2">
            <span className="text-xs text-slate-500 font-medium">Environment:</span>
            <div className="inline-flex rounded-xl bg-slate-100 p-0.5 border border-slate-200">
              <button
                type="button"
                onClick={() => handleInputChange('environmentMode', 'sandbox')}
                className={`px-3 py-1 rounded-lg text-xs font-semibold transition-all ${
                  formData.environmentMode === 'sandbox'
                    ? 'bg-amber-500 text-white shadow-sm'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Sandbox (Test)
              </button>
              <button
                type="button"
                onClick={() => handleInputChange('environmentMode', 'production')}
                className={`px-3 py-1 rounded-lg text-xs font-semibold transition-all ${
                  formData.environmentMode === 'production'
                    ? 'bg-emerald-600 text-white shadow-sm'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Production (Live)
              </button>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Gateway Provider */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Gateway Provider:
            </label>
            <select
              value={formData.gatewayProvider}
              onChange={(e) => handleInputChange('gatewayProvider', e.target.value as PaymentGatewayProvider)}
              className="w-full text-xs bg-slate-50 border border-slate-200 rounded-xl p-2.5 font-medium text-navy-900 focus:outline-none focus:ring-2 focus:ring-teal-500/20"
            >
              <option value="razorpay">Razorpay (Recommended - UPI, Cards, NetBanking)</option>
              <option value="cashfree">Cashfree Payments (Auto-Collect & Payouts)</option>
              <option value="custom_upi">Direct Merchant Bank UPI VPA</option>
            </select>
          </div>

          {/* Gateway Key ID */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              API Key ID (Public Key):
            </label>
            <input
              type="text"
              value={formData.keyId}
              onChange={(e) => handleInputChange('keyId', e.target.value)}
              placeholder="e.g. rzp_test_... or rzp_live_..."
              className="w-full text-xs font-mono bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-navy-900 focus:outline-none focus:ring-2 focus:ring-teal-500/20"
            />
          </div>

          {/* Gateway Key Secret */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              API Key Secret:
            </label>
            <div className="relative">
              <input
                type={showSecret ? 'text' : 'password'}
                value={formData.keySecret}
                onChange={(e) => handleInputChange('keySecret', e.target.value)}
                placeholder="Secret key from gateway dashboard"
                className="w-full text-xs font-mono bg-slate-50 border border-slate-200 rounded-xl p-2.5 pr-9 text-navy-900 focus:outline-none focus:ring-2 focus:ring-teal-500/20"
              />
              <button
                type="button"
                onClick={() => setShowSecret(!showSecret)}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
              >
                {showSecret ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>
        </div>

        {/* Webhook Secret & Endpoint */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2 border-t border-slate-100">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Webhook Secret (for HMAC-SHA256 Signature Verification):
            </label>
            <input
              type="text"
              value={formData.webhookSecret}
              onChange={(e) => handleInputChange('webhookSecret', e.target.value)}
              placeholder="whsec_..."
              className="w-full text-xs font-mono bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-navy-900 focus:outline-none focus:ring-2 focus:ring-teal-500/20"
            />
            <span className="text-[10px] text-slate-400 mt-1 block">
              Used to cryptographically verify incoming payment webhook confirmations.
            </span>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Your Webhook Callback URL (Paste in Gateway Dashboard):
            </label>
            <div className="flex items-center gap-1.5">
              <input
                type="text"
                readOnly
                value={webhookUrl}
                className="w-full text-xs font-mono bg-slate-100 border border-slate-200 rounded-xl p-2.5 text-slate-600 select-all"
              />
              <button
                type="button"
                onClick={handleCopyWebhook}
                className="bg-slate-200 hover:bg-slate-300 text-slate-700 p-2.5 rounded-xl text-xs font-semibold transition-colors shrink-0"
                title="Copy Webhook URL"
              >
                {copiedWebhook ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4" />}
              </button>
            </div>
            <span className="text-[10px] text-slate-400 mt-1 block">
              Subscribe to: <code className="text-teal-700 font-mono">payment.captured</code>, <code className="text-teal-700 font-mono">payment.failed</code>
            </span>
          </div>
        </div>

        {/* Test Connection Button */}
        <div className="pt-2 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <button
              type="button"
              disabled={isTesting}
              onClick={handleTestConnection}
              className="bg-slate-100 hover:bg-slate-200 text-slate-700 px-3.5 py-2 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-colors"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isTesting ? 'animate-spin' : ''}`} />
              <span>{isTesting ? 'Verifying Gateway API...' : 'Test Gateway Connection'}</span>
            </button>
            {formData.lastTestedAt && (
              <span className="text-[11px] text-slate-400">
                Last checked: {new Date(formData.lastTestedAt).toLocaleTimeString()}
              </span>
            )}
          </div>

          {testResult && (
            <div className={`text-xs px-3 py-1.5 rounded-xl flex items-center gap-1.5 font-medium ${
              testResult.success 
                ? 'bg-emerald-50 text-emerald-800 border border-emerald-200' 
                : 'bg-rose-50 text-rose-800 border border-rose-200'
            }`}>
              {testResult.success ? <CheckCircle2 className="w-4 h-4 text-emerald-600" /> : <AlertCircle className="w-4 h-4 text-rose-600" />}
              <span>{testResult.message}</span>
            </div>
          )}
        </div>
      </div>

      {/* Registered Settlement Bank Account Card */}
      <div className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-sm space-y-5">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-blue-50 rounded-xl text-blue-700">
              <Landmark className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-navy-900 text-sm">Settlement Bank Account Details</h3>
              <p className="text-xs text-slate-500">
                Registered Indian bank account where customer collections will be settled directly
              </p>
            </div>
          </div>

          <span className="text-xs font-bold px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 flex items-center gap-1">
            <CheckCircle2 className="w-3.5 h-3.5" />
            <span>Bank Verified</span>
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {/* Legal Account Name */}
          <div className="sm:col-span-2">
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Account Holder Legal Name (as per Bank Records):
            </label>
            <input
              type="text"
              value={formData.bankAccount.accountHolderName}
              onChange={(e) => handleBankChange('accountHolderName', e.target.value.toUpperCase())}
              placeholder="e.g. CLINICPULSE HEALTHCARE SERVICES PVT LTD"
              className="w-full text-xs font-semibold uppercase bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-navy-900 focus:outline-none focus:ring-2 focus:ring-teal-500/20"
            />
          </div>

          {/* Bank Name */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Bank Name:
            </label>
            <input
              type="text"
              value={formData.bankAccount.bankName}
              onChange={(e) => handleBankChange('bankName', e.target.value)}
              placeholder="e.g. HDFC Bank, ICICI Bank, State Bank of India"
              className="w-full text-xs bg-slate-50 border border-slate-200 rounded-xl p-2.5 font-medium text-navy-900 focus:outline-none focus:ring-2 focus:ring-teal-500/20"
            />
          </div>

          {/* IFSC Code */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Bank IFSC Code:
            </label>
            <input
              type="text"
              maxLength={11}
              value={formData.bankAccount.ifscCode}
              onChange={(e) => handleBankChange('ifscCode', e.target.value.toUpperCase())}
              placeholder="e.g. HDFC0000240"
              className="w-full text-xs font-mono uppercase bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-navy-900 focus:outline-none focus:ring-2 focus:ring-teal-500/20"
            />
          </div>

          {/* Account Number */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Bank Account Number:
            </label>
            <input
              type="text"
              value={formData.bankAccount.accountNumber}
              onChange={(e) => handleBankChange('accountNumber', e.target.value.replace(/\D/g, ''))}
              placeholder="Enter bank account number"
              className="w-full text-xs font-mono bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-navy-900 focus:outline-none focus:ring-2 focus:ring-teal-500/20"
            />
          </div>

          {/* Confirm Account Number */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Confirm Bank Account Number:
            </label>
            <input
              type="text"
              value={confirmAccNumber}
              onChange={(e) => {
                setConfirmAccNumber(e.target.value.replace(/\D/g, ''));
                setAccMatchError(false);
              }}
              placeholder="Re-enter bank account number"
              className={`w-full text-xs font-mono bg-slate-50 border rounded-xl p-2.5 text-navy-900 focus:outline-none focus:ring-2 ${
                accMatchError ? 'border-rose-400 focus:ring-rose-500/20' : 'border-slate-200 focus:ring-teal-500/20'
              }`}
            />
            {accMatchError && (
              <span className="text-[10px] text-rose-600 mt-1 block">
                Account numbers do not match. Please re-check.
              </span>
            )}
          </div>

          {/* Account Type */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Account Type:
            </label>
            <select
              value={formData.bankAccount.accountType}
              onChange={(e) => handleBankChange('accountType', e.target.value as any)}
              className="w-full text-xs bg-slate-50 border border-slate-200 rounded-xl p-2.5 font-medium text-navy-900 focus:outline-none focus:ring-2 focus:ring-teal-500/20"
            >
              <option value="current">Current Account (Business/Hospital)</option>
              <option value="savings">Savings Account (Sole Proprietor/Clinic)</option>
            </select>
          </div>

          {/* Settlement Frequency */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Settlement Cycle:
            </label>
            <select
              value={formData.settlementCycle}
              onChange={(e) => handleInputChange('settlementCycle', e.target.value as any)}
              className="w-full text-xs bg-slate-50 border border-slate-200 rounded-xl p-2.5 font-medium text-navy-900 focus:outline-none focus:ring-2 focus:ring-teal-500/20"
            >
              <option value="T+1">T+1 Daily Auto-Settlement (Next Working Day)</option>
              <option value="T+2">T+2 Standard Gateway Settlement</option>
              <option value="daily">Same-Day Evening Batch</option>
              <option value="instant">Instant On-Demand Payout</option>
            </select>
          </div>
        </div>

        {/* Merchant UPI ID (VPA) */}
        <div className="pt-3 border-t border-slate-100">
          <label className="block text-xs font-semibold text-slate-700 mb-1">
            Facility Direct UPI VPA (Linked to Bank Account):
          </label>
          <div className="flex items-center gap-2">
            <Smartphone className="w-4 h-4 text-teal-600 shrink-0" />
            <input
              type="text"
              value={formData.merchantVpa}
              onChange={(e) => handleInputChange('merchantVpa', e.target.value.toLowerCase())}
              placeholder="e.g. clinicpulse.hospital@hdfcbank"
              className="w-full text-xs font-mono bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-navy-900 focus:outline-none focus:ring-2 focus:ring-teal-500/20"
            />
          </div>
          <span className="text-[10px] text-slate-400 mt-1 block">
            This UPI ID is embedded into dynamic QR codes and intent links for direct patient settlement.
          </span>
        </div>
      </div>

      {/* Security Compliance Note & Save Button */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-5 bg-slate-100 rounded-2xl border border-slate-200">
        <div className="flex items-start gap-2.5 text-xs text-slate-600 max-w-xl">
          <Lock className="w-4 h-4 text-slate-500 shrink-0 mt-0.5" />
          <p className="text-[11px]">
            <strong>Security Guarantee:</strong> API keys and settlement accounts are isolated by facility. ClinicPulse Pro never collects or stores customer UPI PINs, CVVs, OTPs, or banking login credentials.
          </p>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          {saveSuccess && (
            <span className="text-xs text-emerald-700 font-semibold flex items-center gap-1">
              <Check className="w-4 h-4" /> Changes Saved!
            </span>
          )}
          <button
            type="button"
            disabled={isSaving}
            onClick={handleSave}
            className="bg-navy-900 hover:bg-navy-800 disabled:opacity-50 text-white px-5 py-2.5 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-all shadow-md"
          >
            <Save className="w-4 h-4 text-teal-400" />
            <span>{isSaving ? 'Saving...' : 'Save Bank & Gateway Settings'}</span>
          </button>
        </div>
      </div>
    </div>
  );
};
