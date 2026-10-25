import React, { useState } from 'react';
import { 
  Building2, 
  ShieldCheck, 
  Save, 
  CheckCircle2, 
  AlertCircle, 
  Landmark, 
  QrCode, 
  FileText, 
  History, 
  FileCheck, 
  HelpCircle,
  Copy,
  ExternalLink
} from 'lucide-react';
import { useBilling } from '../../context/BillingContext';
import { BusinessTaxProfile } from '../../types/billing';
import { INDIAN_STATES, validateGstin } from '../../lib/gstEngine';

export const TaxSettingsView: React.FC = () => {
  const { taxProfile, updateTaxProfile, auditLogs } = useBilling();

  // Form State
  const [formData, setFormData] = useState<BusinessTaxProfile>({
    ...taxProfile,
    bankDetails: {
      bankName: taxProfile.bankDetails?.bankName || '',
      accountHolderName: taxProfile.bankDetails?.accountHolderName || '',
      accountNumber: taxProfile.bankDetails?.accountNumber || '',
      ifscCode: taxProfile.bankDetails?.ifscCode || '',
      branchName: taxProfile.bankDetails?.branchName || '',
      upiId: taxProfile.bankDetails?.upiId || ''
    }
  });

  const [activeTab, setActiveTab] = useState<'profile' | 'invoicing' | 'bank' | 'audit_log'>('profile');
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [gstinValidation, setGstinValidation] = useState<{ isValid: boolean; stateName?: string; pan?: string } | null>(null);

  // Handle GSTIN change with automatic state & PAN deduction
  const handleGstinChange = (value: string) => {
    const uppercaseVal = value.toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 15);
    const validation = validateGstin(uppercaseVal);
    setGstinValidation(validation);

    if (validation.isValid) {
      setFormData(prev => ({
        ...prev,
        gstin: uppercaseVal,
        pan: validation.pan || prev.pan,
        stateCode: uppercaseVal.slice(0, 2),
        state: validation.stateName || prev.state
      }));
    } else {
      setFormData(prev => ({ ...prev, gstin: uppercaseVal }));
    }
  };

  // Handle Save
  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    setSaveSuccess(false);

    try {
      await updateTaxProfile(formData);
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 4000);
    } catch (err: any) {
      alert('Failed to update tax profile: ' + (err.message || 'Unknown error'));
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-slate-200/80 shadow-sm">
        <div>
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-6 h-6 text-indigo-600" />
            <h1 className="text-2xl font-bold text-slate-900">Tax Settings & Compliance Profile</h1>
          </div>
          <p className="text-sm text-slate-500 mt-1">
            Configure your registered establishment GSTIN, legal name, bank accounts, and invoice printing settings.
          </p>
        </div>

        {saveSuccess && (
          <div className="flex items-center gap-2 px-4 py-2 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-xl text-sm font-semibold animate-in fade-in">
            <CheckCircle2 className="w-4 h-4" />
            <span>Profile Saved Successfully!</span>
          </div>
        )}
      </div>

      {/* Tabs */}
      <div className="flex border-b border-slate-200 gap-1 bg-white p-1 rounded-xl shadow-sm">
        <button
          onClick={() => setActiveTab('profile')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-semibold transition-all ${
            activeTab === 'profile'
              ? 'bg-indigo-600 text-white shadow-sm'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
          }`}
        >
          <Building2 className="w-4 h-4" />
          <span>Establishment & GSTIN</span>
        </button>

        <button
          onClick={() => setActiveTab('invoicing')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-semibold transition-all ${
            activeTab === 'invoicing'
              ? 'bg-indigo-600 text-white shadow-sm'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
          }`}
        >
          <FileText className="w-4 h-4" />
          <span>Invoicing Preferences</span>
        </button>

        <button
          onClick={() => setActiveTab('bank')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-semibold transition-all ${
            activeTab === 'bank'
              ? 'bg-indigo-600 text-white shadow-sm'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
          }`}
        >
          <Landmark className="w-4 h-4" />
          <span>Bank & UPI Settlement</span>
        </button>

        <button
          onClick={() => setActiveTab('audit_log')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-semibold transition-all ${
            activeTab === 'audit_log'
              ? 'bg-indigo-600 text-white shadow-sm'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
          }`}
        >
          <History className="w-4 h-4" />
          <span>Audit Log ({auditLogs.length})</span>
        </button>
      </div>

      {/* Tab 1: Establishment & GSTIN */}
      {activeTab === 'profile' && (
        <form onSubmit={handleSave} className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-sm space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Legal Business Name */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Legal Registered Business Name *
              </label>
              <input
                type="text"
                required
                value={formData.businessName}
                onChange={(e) => setFormData({ ...formData, businessName: e.target.value })}
                placeholder="e.g. ClinicPulse Healthcare Pvt Ltd"
                className="w-full px-3.5 py-2.5 border border-slate-200 rounded-xl text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
              <p className="text-[11px] text-slate-400 mt-1">As registered on GST Certificate Form REG-06</p>
            </div>

            {/* Trade Name */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Trade Name (Printed on Bill Header)
              </label>
              <input
                type="text"
                value={formData.tradeName || ''}
                onChange={(e) => setFormData({ ...formData, tradeName: e.target.value })}
                placeholder="e.g. ClinicPulse Super Speciality Hospital"
                className="w-full px-3.5 py-2.5 border border-slate-200 rounded-xl text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>

            {/* GSTIN */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                GSTIN (15 Alpha-numeric Characters) *
              </label>
              <div className="relative">
                <input
                  type="text"
                  required
                  maxLength={15}
                  value={formData.gstin}
                  onChange={(e) => handleGstinChange(e.target.value)}
                  placeholder="33AAAAA0000A1Z5"
                  className="w-full font-mono uppercase px-3.5 py-2.5 border border-slate-200 rounded-xl text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
                {formData.gstin && (
                  <div className="absolute right-3 top-1/2 -translate-y-1/2">
                    {validateGstin(formData.gstin).isValid ? (
                      <span className="text-xs text-emerald-600 font-semibold flex items-center gap-1">
                        <CheckCircle2 className="w-4 h-4" /> Valid
                      </span>
                    ) : (
                      <span className="text-xs text-rose-500 font-semibold flex items-center gap-1">
                        <AlertCircle className="w-4 h-4" /> Invalid
                      </span>
                    )}
                  </div>
                )}
              </div>
              <p className="text-[11px] text-slate-400 mt-1">Format: 2 state digits + 10 PAN + 1 entity + 1 'Z' + 1 checksum</p>
            </div>

            {/* PAN */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Permanent Account Number (PAN)
              </label>
              <input
                type="text"
                maxLength={10}
                value={formData.pan || ''}
                onChange={(e) => setFormData({ ...formData, pan: e.target.value.toUpperCase() })}
                placeholder="AAAAA0000A"
                className="w-full font-mono uppercase px-3.5 py-2.5 border border-slate-200 rounded-xl text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>

            {/* State & State Code */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Registered State & State Code *
              </label>
              <select
                value={formData.stateCode}
                onChange={(e) => {
                  const stateCode = e.target.value;
                  const st = INDIAN_STATES.find(s => s.code === stateCode);
                  setFormData({
                    ...formData,
                    stateCode,
                    state: st ? st.name : formData.state
                  });
                }}
                className="w-full px-3.5 py-2.5 border border-slate-200 rounded-xl text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                {INDIAN_STATES.map(s => (
                  <option key={s.code} value={s.code}>
                    {s.code} - {s.name}
                  </option>
                ))}
              </select>
              <p className="text-[11px] text-slate-400 mt-1">Determines Intra-State (CGST+SGST) vs Inter-State (IGST) place of supply</p>
            </div>

            {/* Drug License Number */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Pharmacy Drug License No. (Form 20B / 21B)
              </label>
              <input
                type="text"
                value={formData.drugLicenseNo || ''}
                onChange={(e) => setFormData({ ...formData, drugLicenseNo: e.target.value })}
                placeholder="e.g. DL-TN-CHE-2024-00123"
                className="w-full px-3.5 py-2.5 border border-slate-200 rounded-xl text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
              <p className="text-[11px] text-slate-400 mt-1">Mandatory on pharmacy cash memos and tax invoices</p>
            </div>

            {/* Address */}
            <div className="md:col-span-2">
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Registered Street Address *
              </label>
              <input
                type="text"
                required
                value={formData.address}
                onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                placeholder="Building, street, landmark, area"
                className="w-full px-3.5 py-2.5 border border-slate-200 rounded-xl text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>

            {/* City */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                City / District *
              </label>
              <input
                type="text"
                required
                value={formData.city}
                onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                placeholder="e.g. Chennai"
                className="w-full px-3.5 py-2.5 border border-slate-200 rounded-xl text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>

            {/* Pincode */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                PIN Code *
              </label>
              <input
                type="text"
                required
                maxLength={6}
                value={formData.pincode}
                onChange={(e) => setFormData({ ...formData, pincode: e.target.value })}
                placeholder="600001"
                className="w-full px-3.5 py-2.5 border border-slate-200 rounded-xl text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>

            {/* Phone */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Billing Support Phone *
              </label>
              <input
                type="text"
                required
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                placeholder="+91 98765 43210"
                className="w-full px-3.5 py-2.5 border border-slate-200 rounded-xl text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>

            {/* Email */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Billing Support Email *
              </label>
              <input
                type="email"
                required
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                placeholder="billing@clinicpulsepro.com"
                className="w-full px-3.5 py-2.5 border border-slate-200 rounded-xl text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
          </div>

          <div className="pt-4 border-t border-slate-100 flex justify-end">
            <button
              type="submit"
              disabled={isSaving}
              className="inline-flex items-center gap-2 px-6 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-sm font-semibold transition-colors disabled:opacity-50 shadow-sm"
            >
              <Save className="w-4 h-4" />
              <span>{isSaving ? 'Saving...' : 'Save Establishment Profile'}</span>
            </button>
          </div>
        </form>
      )}

      {/* Tab 2: Invoicing Preferences */}
      {activeTab === 'invoicing' && (
        <form onSubmit={handleSave} className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-sm space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Invoice Prefix */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Invoice Number Prefix *
              </label>
              <input
                type="text"
                required
                value={formData.invoicePrefix}
                onChange={(e) => setFormData({ ...formData, invoicePrefix: e.target.value.toUpperCase() })}
                placeholder="INV"
                className="w-full font-mono uppercase px-3.5 py-2.5 border border-slate-200 rounded-xl text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
              <p className="text-[11px] text-slate-400 mt-1">Example: INV/2026-27/0001</p>
            </div>

            {/* Default Pricing Mode */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Default Rate Mode for Line Items *
              </label>
              <select
                value={formData.defaultPriceType}
                onChange={(e) => setFormData({ ...formData, defaultPriceType: e.target.value as any })}
                className="w-full px-3.5 py-2.5 border border-slate-200 rounded-xl text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                <option value="exclusive">Exclusive of GST (Base Price + GST calculated on top - B2B standard)</option>
                <option value="inclusive">Inclusive of GST (MRP includes GST - Pharmacy Retail standard)</option>
              </select>
            </div>

            {/* Round off switch */}
            <div className="md:col-span-2 p-4 bg-slate-50 border border-slate-200 rounded-xl flex items-center justify-between">
              <div>
                <p className="text-sm font-bold text-slate-900">Enable Half-Up Round-Off to Nearest Rupee</p>
                <p className="text-xs text-slate-500 mt-0.5">
                  Applies standard mathematical paise rounding (-₹0.49 to +₹0.49) to produce clean cash/UPI totals.
                </p>
              </div>
              <input
                type="checkbox"
                checked={formData.enableRoundOff}
                onChange={(e) => setFormData({ ...formData, enableRoundOff: e.target.checked })}
                className="w-5 h-5 text-indigo-600 rounded border-slate-300 focus:ring-indigo-500"
              />
            </div>

            {/* Statutory Healthcare Exemption Note */}
            <div className="md:col-span-2 p-4 bg-indigo-50/60 border border-indigo-200 rounded-xl flex items-start gap-3">
              <ShieldCheck className="w-6 h-6 text-indigo-600 flex-shrink-0 mt-0.5" />
              <div className="text-xs text-indigo-950 space-y-1">
                <p className="font-bold">Indian GST Healthcare Service Exemption (Notification No. 12/2017-Central Tax)</p>
                <p className="leading-relaxed">
                  Health care services by a clinical establishment, an authorized medical practitioner or paramedics are exempted from GST under SAC 999312. ClinicPulse Pro automatically tags doctor consultations, nursing, and room rents under threshold at 0% GST (Exempt). Pharmacy medicine supplies are taxed at their respective HSN rates (5% or 12%).
                </p>
              </div>
            </div>
          </div>

          <div className="pt-4 border-t border-slate-100 flex justify-end">
            <button
              type="submit"
              disabled={isSaving}
              className="inline-flex items-center gap-2 px-6 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-sm font-semibold transition-colors disabled:opacity-50 shadow-sm"
            >
              <Save className="w-4 h-4" />
              <span>{isSaving ? 'Saving...' : 'Save Invoicing Settings'}</span>
            </button>
          </div>
        </form>
      )}

      {/* Tab 3: Bank & Settlement */}
      {activeTab === 'bank' && (
        <form onSubmit={handleSave} className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-sm space-y-6">
          <p className="text-sm text-slate-500">
            These bank and UPI details are automatically rendered at the bottom of printed invoices and PDF exports to receive instant payments from patients and B2B corporate clients.
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Account Holder */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Account Holder / Beneficiary Name *
              </label>
              <input
                type="text"
                value={formData.bankDetails?.accountHolderName || ''}
                onChange={(e) => setFormData({
                  ...formData,
                  bankDetails: { ...formData.bankDetails!, accountHolderName: e.target.value }
                })}
                placeholder="e.g. ClinicPulse Healthcare Pvt Ltd"
                className="w-full px-3.5 py-2.5 border border-slate-200 rounded-xl text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>

            {/* Bank Name */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Bank Name *
              </label>
              <input
                type="text"
                value={formData.bankDetails?.bankName || ''}
                onChange={(e) => setFormData({
                  ...formData,
                  bankDetails: { ...formData.bankDetails!, bankName: e.target.value }
                })}
                placeholder="e.g. HDFC Bank"
                className="w-full px-3.5 py-2.5 border border-slate-200 rounded-xl text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>

            {/* Account Number */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Bank Account Number *
              </label>
              <input
                type="text"
                value={formData.bankDetails?.accountNumber || ''}
                onChange={(e) => setFormData({
                  ...formData,
                  bankDetails: { ...formData.bankDetails!, accountNumber: e.target.value }
                })}
                placeholder="50200012345678"
                className="w-full font-mono px-3.5 py-2.5 border border-slate-200 rounded-xl text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>

            {/* IFSC Code */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Bank IFSC Code *
              </label>
              <input
                type="text"
                maxLength={11}
                value={formData.bankDetails?.ifscCode || ''}
                onChange={(e) => setFormData({
                  ...formData,
                  bankDetails: { ...formData.bankDetails!, ifscCode: e.target.value.toUpperCase() }
                })}
                placeholder="HDFC0001234"
                className="w-full font-mono uppercase px-3.5 py-2.5 border border-slate-200 rounded-xl text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>

            {/* Branch */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Branch Name
              </label>
              <input
                type="text"
                value={formData.bankDetails?.branchName || ''}
                onChange={(e) => setFormData({
                  ...formData,
                  bankDetails: { ...formData.bankDetails!, branchName: e.target.value }
                })}
                placeholder="Anna Nagar Branch"
                className="w-full px-3.5 py-2.5 border border-slate-200 rounded-xl text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>

            {/* UPI ID */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Merchant UPI ID (VPA) *
              </label>
              <div className="relative">
                <input
                  type="text"
                  value={formData.bankDetails?.upiId || ''}
                  onChange={(e) => setFormData({
                    ...formData,
                    bankDetails: { ...formData.bankDetails!, upiId: e.target.value }
                  })}
                  placeholder="clinicpulse@hdfcbank"
                  className="w-full font-mono px-3.5 py-2.5 border border-slate-200 rounded-xl text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
                <QrCode className="w-4 h-4 text-slate-400 absolute right-3 top-1/2 -translate-y-1/2" />
              </div>
              <p className="text-[11px] text-slate-400 mt-1">Used to generate dynamic UPI QR code on the invoice footer</p>
            </div>
          </div>

          <div className="pt-4 border-t border-slate-100 flex justify-end">
            <button
              type="submit"
              disabled={isSaving}
              className="inline-flex items-center gap-2 px-6 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-sm font-semibold transition-colors disabled:opacity-50 shadow-sm"
            >
              <Save className="w-4 h-4" />
              <span>{isSaving ? 'Saving...' : 'Save Bank Details'}</span>
            </button>
          </div>
        </form>
      )}

      {/* Tab 4: Audit Log */}
      {activeTab === 'audit_log' && (
        <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden">
          <div className="p-4 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <History className="w-4 h-4 text-slate-600" />
              <h3 className="font-bold text-slate-800 text-sm">Financial Transaction & Configuration Audit Trail</h3>
            </div>
            <span className="text-xs text-slate-500 font-medium">
              Read-only immutable log • {auditLogs.length} events recorded
            </span>
          </div>

          {auditLogs.length === 0 ? (
            <div className="p-8 text-center text-slate-400 text-sm">
              No audit log events recorded yet.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-slate-50 text-slate-500 uppercase tracking-wider font-semibold border-b border-slate-200">
                    <th className="py-2.5 px-4">Timestamp</th>
                    <th className="py-2.5 px-4">Action</th>
                    <th className="py-2.5 px-4">Actor</th>
                    <th className="py-2.5 px-4">Entity ID</th>
                    <th className="py-2.5 px-4">Details</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {auditLogs.map((log) => (
                    <tr key={log.id} className="hover:bg-slate-50/60 font-mono">
                      <td className="py-2.5 px-4 text-slate-500 whitespace-nowrap">
                        {new Date(log.timestamp).toLocaleString('en-IN')}
                      </td>
                      <td className="py-2.5 px-4 font-sans font-bold text-slate-800">
                        <span className="px-2 py-0.5 rounded bg-slate-100 text-slate-700 capitalize">
                          {log.action.replace(/_/g, ' ')}
                        </span>
                      </td>
                      <td className="py-2.5 px-4 font-sans text-slate-600">
                        {log.actor}
                      </td>
                      <td className="py-2.5 px-4 text-indigo-600 font-semibold">
                        {log.entityId}
                      </td>
                      <td className="py-2.5 px-4 font-sans text-slate-500 max-w-xs truncate">
                        {JSON.stringify(log.details)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
