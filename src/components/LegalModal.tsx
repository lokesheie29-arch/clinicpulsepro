import React, { useState, useEffect } from 'react';
import {
  ShieldCheck,
  FileText,
  Scale,
  Receipt,
  Pill,
  X,
  CheckCircle2,
  AlertTriangle,
  Building2,
  Lock,
  Printer,
  ExternalLink
} from 'lucide-react';

export type LegalTab = 'privacy' | 'terms' | 'gst' | 'drug-license';

interface LegalModalProps {
  isOpen: boolean;
  initialTab?: LegalTab;
  onClose: () => void;
}

export const LegalModal: React.FC<LegalModalProps> = ({
  isOpen,
  initialTab = 'privacy',
  onClose
}) => {
  const [activeTab, setActiveTab] = useState<LegalTab>(initialTab);

  useEffect(() => {
    if (initialTab) {
      setActiveTab(initialTab);
    }
  }, [initialTab]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
      <div className="bg-white rounded-3xl shadow-2xl border border-slate-200 w-full max-w-4xl overflow-hidden flex flex-col max-h-[92vh]">
        
        {/* Header */}
        <div className="bg-gradient-to-r from-navy-900 via-navy-800 to-slate-900 text-white p-6 relative shrink-0">
          <button
            onClick={onClose}
            className="absolute top-5 right-5 text-slate-400 hover:text-white p-1 rounded-xl transition-colors"
          >
            <X className="h-5 w-5" />
          </button>

          <div className="flex items-center space-x-3.5">
            <div className="w-12 h-12 rounded-2xl bg-teal-500/20 border border-teal-400/30 flex items-center justify-center text-teal-300">
              <Scale className="h-6 w-6" />
            </div>
            <div>
              <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-teal-500/20 text-teal-300 text-xs font-semibold mb-1 border border-teal-500/30">
                <ShieldCheck className="h-3.5 w-3.5" />
                <span>Statutory Compliance & Legal Guidelines</span>
              </div>
              <h2 className="text-xl sm:text-2xl font-bold">
                ClinicPulse Pro Legal & Regulatory Center
              </h2>
              <p className="text-slate-300 text-xs sm:text-sm mt-0.5">
                Official statutory policies, Indian GST exemptions, pharmacy licensing norms & privacy standards.
              </p>
            </div>
          </div>

          {/* Navigation Tabs */}
          <div className="flex space-x-2 mt-6 border-b border-white/10 pb-0 overflow-x-auto">
            <button
              onClick={() => setActiveTab('privacy')}
              className={`pb-2.5 px-3.5 text-xs font-semibold flex items-center gap-2 border-b-2 transition-all whitespace-nowrap ${
                activeTab === 'privacy'
                  ? 'border-teal-400 text-teal-300'
                  : 'border-transparent text-slate-300 hover:text-white'
              }`}
            >
              <Lock className="h-3.5 w-3.5" />
              <span>Privacy Policy</span>
            </button>

            <button
              onClick={() => setActiveTab('terms')}
              className={`pb-2.5 px-3.5 text-xs font-semibold flex items-center gap-2 border-b-2 transition-all whitespace-nowrap ${
                activeTab === 'terms'
                  ? 'border-teal-400 text-teal-300'
                  : 'border-transparent text-slate-300 hover:text-white'
              }`}
            >
              <FileText className="h-3.5 w-3.5" />
              <span>Terms of Service</span>
            </button>

            <button
              onClick={() => setActiveTab('gst')}
              className={`pb-2.5 px-3.5 text-xs font-semibold flex items-center gap-2 border-b-2 transition-all whitespace-nowrap ${
                activeTab === 'gst'
                  ? 'border-teal-400 text-teal-300'
                  : 'border-transparent text-slate-300 hover:text-white'
              }`}
            >
              <Receipt className="h-3.5 w-3.5" />
              <span>GST Compliance Guide</span>
            </button>

            <button
              onClick={() => setActiveTab('drug-license')}
              className={`pb-2.5 px-3.5 text-xs font-semibold flex items-center gap-2 border-b-2 transition-all whitespace-nowrap ${
                activeTab === 'drug-license'
                  ? 'border-teal-400 text-teal-300'
                  : 'border-transparent text-slate-300 hover:text-white'
              }`}
            >
              <Pill className="h-3.5 w-3.5" />
              <span>Drug License Guide</span>
            </button>
          </div>
        </div>

        {/* Content Area */}
        <div className="p-6 sm:p-8 overflow-y-auto flex-1 space-y-6 text-slate-700 text-sm leading-relaxed">
          
          {/* 1. PRIVACY POLICY */}
          {activeTab === 'privacy' && (
            <div className="space-y-6 animate-in fade-in duration-200">
              <div className="bg-teal-50 border border-teal-200/80 rounded-2xl p-4 text-xs text-teal-900 flex items-start gap-3">
                <Lock className="h-5 w-5 text-teal-600 shrink-0 mt-0.5" />
                <div>
                  <p className="font-bold">Patient Data Protection Commitment (DISHA & DPDP Act 2023)</p>
                  <p className="mt-1">
                    ClinicPulse Pro adheres to the Digital Personal Data Protection (DPDP) Act, 2023 and Ministry of Health (DISHA) guidelines. Patient Electronic Health Records (EHR) remain strictly confidential to the treating healthcare facility.
                  </p>
                </div>
              </div>

              <div>
                <h3 className="text-base font-bold text-navy-900 mb-2">1. Data Controller and Entity Information</h3>
                <p>
                  This Privacy Policy applies to the ClinicPulse Pro ERP software platform, provided and managed by ClinicPulse Pro having its principal facility at:
                </p>
                <div className="mt-2 p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-800">
                  No.29, Kamarajar Street, Pallavan Nagar, TNHB, Kancheepuram, Tamil Nadu - 631501, India.
                </div>
              </div>

              <div>
                <h3 className="text-base font-bold text-navy-900 mb-2">2. Information We Process</h3>
                <ul className="list-disc pl-5 space-y-1.5 text-xs">
                  <li><strong>Practitioner & Clinic Profiles:</strong> Medical council registration numbers, doctor names, GSTIN, clinic addresses, contact phone numbers, and official email IDs.</li>
                  <li><strong>Patient Clinical Records:</strong> Demographics (name, age, phone), presenting symptoms, vital parameters (BP, pulse, SpO2, BMI), diagnosis summaries, and electronic prescriptions.</li>
                  <li><strong>Laboratory & Investigation Data:</strong> Diagnostic test orders, pathology parameter limits, numerical results, and lab technician endorsements.</li>
                  <li><strong>Pharmacy Dispensing & Inventory:</strong> Medicine batch numbers, HSN codes, manufacturer details, purchase/selling margins, and Schedule H/H1 dispensing audit logs.</li>
                </ul>
              </div>

              <div>
                <h3 className="text-base font-bold text-navy-900 mb-2">3. WhatsApp Paperless Billing & Messaging Consent</h3>
                <p className="text-xs">
                  When a clinic or pharmacy generates a bill or prescription, it is delivered via the official WhatsApp Business Cloud API only to the mobile number furnished by the patient or their legal guardian during registration. Transmission is protected by end-to-end transport layer security (TLS 1.3).
                </p>
              </div>

              <div>
                <h3 className="text-base font-bold text-navy-900 mb-2">4. Zero Data Selling & Encryption Standards</h3>
                <p className="text-xs">
                  ClinicPulse Pro guarantees that clinical data is never sold, leased, or monetized for commercial advertising or third-party pharmaceutical profiling. All database stores utilize AES-256 encryption at rest and SSL/TLS encryption in transit.
                </p>
              </div>
            </div>
          )}

          {/* 2. TERMS OF SERVICE */}
          {activeTab === 'terms' && (
            <div className="space-y-6 animate-in fade-in duration-200">
              <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 text-xs text-slate-800 flex items-start gap-3">
                <FileText className="h-5 w-5 text-navy-800 shrink-0 mt-0.5" />
                <div>
                  <p className="font-bold">Software-as-a-Service (SaaS) Agreement</p>
                  <p className="mt-1">
                    By accessing or registering on ClinicPulse Pro ERP, hospitals, medical practitioners, pharmacies, and diagnostic centers agree to the terms specified below.
                  </p>
                </div>
              </div>

              <div>
                <h3 className="text-base font-bold text-navy-900 mb-2">1. Scope of Service & Medical Disclaimer</h3>
                <p className="text-xs leading-relaxed">
                  ClinicPulse Pro provides operational ERP tools, appointment management, inventory tracking, and GST billing software. <strong>The software does not provide medical diagnosis or replace clinical judgment.</strong> All prescription choices, dosages, and medical interpretations remain the sole professional responsibility of the attending Registered Medical Practitioner (RMP).
                </p>
              </div>

              <div>
                <h3 className="text-base font-bold text-navy-900 mb-2">2. User Account Security & Two-Factor Authentication</h3>
                <p className="text-xs leading-relaxed">
                  Clinics are required to maintain strict credential hygiene. Changes to official hospital names, GST numbers, bank details, and diagnostic parameters require multi-factor verification code confirmation (dispatched to the registered phone and email).
                </p>
              </div>

              <div>
                <h3 className="text-base font-bold text-navy-900 mb-2">3. Data Ownership & Portability</h3>
                <p className="text-xs leading-relaxed">
                  The client hospital, clinic, or pharmacy retains 100% intellectual property and ownership rights over their patient databases and inventory records. Customers may export their complete records anytime using the provided Excel/CSV export and import utilities.
                </p>
              </div>

              <div>
                <h3 className="text-base font-bold text-navy-900 mb-2">4. Uptime & Service Level Agreement (SLA)</h3>
                <p className="text-xs leading-relaxed">
                  ClinicPulse Pro maintains a 99.9% target cloud availability with progressive Web App (PWA) offline capabilities allowing billing operations during transient internet interruptions.
                </p>
              </div>
            </div>
          )}

          {/* 3. GST COMPLIANCE GUIDE */}
          {activeTab === 'gst' && (
            <div className="space-y-6 animate-in fade-in duration-200">
              <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-4 text-xs text-emerald-900 flex items-start gap-3">
                <Receipt className="h-5 w-5 text-emerald-600 shrink-0 mt-0.5" />
                <div>
                  <p className="font-bold">Indian GST Framework for Healthcare & Pharmacies</p>
                  <p className="mt-1">
                    Clear separation between GST-exempt clinical consultation services and taxable pharmaceutical supplies under the Central Goods and Services Tax (CGST) Act.
                  </p>
                </div>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-xs border border-slate-200 rounded-xl overflow-hidden">
                  <thead className="bg-slate-100 text-slate-800 font-bold">
                    <tr>
                      <th className="p-3 text-left border-b border-slate-200">Category</th>
                      <th className="p-3 text-left border-b border-slate-200">HSN / SAC Code</th>
                      <th className="p-3 text-left border-b border-slate-200">GST Rate</th>
                      <th className="p-3 text-left border-b border-slate-200">Statutory Provision</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    <tr>
                      <td className="p-3 font-semibold text-slate-900">Doctor Consultation & OPD</td>
                      <td className="p-3 font-mono">SAC 999312</td>
                      <td className="p-3 font-bold text-emerald-600">0% (Nil / Exempt)</td>
                      <td className="p-3">Notification No. 12/2017-CT(Rate), Entry 74</td>
                    </tr>
                    <tr>
                      <td className="p-3 font-semibold text-slate-900">Pathology & Lab Diagnostics</td>
                      <td className="p-3 font-mono">SAC 999316</td>
                      <td className="p-3 font-bold text-emerald-600">0% (Nil / Exempt)</td>
                      <td className="p-3">Healthcare services by clinical establishments</td>
                    </tr>
                    <tr>
                      <td className="p-3 font-semibold text-slate-900">Medicines (Tablets, Syrups)</td>
                      <td className="p-3 font-mono">HSN 3004</td>
                      <td className="p-3 font-bold text-blue-600">12% (6% CGST + 6% SGST)</td>
                      <td className="p-3">Standard Schedule HSN 3004 medicaments</td>
                    </tr>
                    <tr>
                      <td className="p-3 font-semibold text-slate-900">Life-Saving Insulin & Vaccines</td>
                      <td className="p-3 font-mono">HSN 3002</td>
                      <td className="p-3 font-bold text-blue-600">5% (2.5% CGST + 2.5% SGST)</td>
                      <td className="p-3">Concessional GST rate for vital biologics</td>
                    </tr>
                    <tr>
                      <td className="p-3 font-semibold text-slate-900">Medical Devices & Thermometers</td>
                      <td className="p-3 font-mono">HSN 9018 / 9025</td>
                      <td className="p-3 font-bold text-amber-600">12% / 18%</td>
                      <td className="p-3">Diagnostic instruments & medical hardware</td>
                    </tr>
                  </tbody>
                </table>
              </div>

              <div>
                <h3 className="text-base font-bold text-navy-900 mb-2">CA-Ready Tax Invoicing Features</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                  <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl">
                    <p className="font-bold text-slate-900">Exact CGST & SGST Splitting</p>
                    <p className="text-slate-500 mt-1">Automatic 50-50 intra-state tax calculation compliant with GSTR-1 Table 7 rules.</p>
                  </div>
                  <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl">
                    <p className="font-bold text-slate-900">HSN-Wise Summary Breakdown</p>
                    <p className="text-slate-500 mt-1">Every printed and WhatsApp invoice prints medicine batch, HSN, and taxable value.</p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* 4. DRUG LICENSE GUIDE */}
          {activeTab === 'drug-license' && (
            <div className="space-y-6 animate-in fade-in duration-200">
              <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 text-xs text-amber-900 flex items-start gap-3">
                <Pill className="h-5 w-5 text-amber-600 shrink-0 mt-0.5" />
                <div>
                  <p className="font-bold">Drug & Cosmetics Act, 1940 Compliance for Dispensaries</p>
                  <p className="mt-1">
                    Operational handbook for retail chemists, in-house hospital pharmacies, and medical dispensaries across India.
                  </p>
                </div>
              </div>

              <div>
                <h3 className="text-base font-bold text-navy-900 mb-2">1. Statutory Retail Drug License Forms</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                  <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl">
                    <span className="font-bold text-navy-900 block text-sm">Form 20 Retail License</span>
                    <p className="text-slate-600 mt-1">
                      Required for retail sale of general allopathic drugs other than those specified in Schedule C, C(1), and X.
                    </p>
                  </div>
                  <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl">
                    <span className="font-bold text-navy-900 block text-sm">Form 21 Biologicals License</span>
                    <p className="text-slate-600 mt-1">
                      Mandatory for storing and dispensing vaccines, sera, antibiotics, and special biologicals (Schedule C/C1).
                    </p>
                  </div>
                </div>
              </div>

              <div>
                <h3 className="text-base font-bold text-navy-900 mb-2">2. Schedule H & H1 Drug Audit Logging</h3>
                <p className="text-xs mb-3">
                  Under Government of India Gazette notifications, all Schedule H1 antibiotics and psychotropic drugs must be recorded with:
                </p>
                <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-1 text-xs">
                  <div className="flex items-center gap-2"><CheckCircle2 className="h-4 w-4 text-teal-600" /><span>Date of dispensing & Patient full name</span></div>
                  <div className="flex items-center gap-2"><CheckCircle2 className="h-4 w-4 text-teal-600" /><span>Prescribing Doctor's name & council registration number</span></div>
                  <div className="flex items-center gap-2"><CheckCircle2 className="h-4 w-4 text-teal-600" /><span>Medicine brand, batch number, manufacturer, and quantity</span></div>
                </div>
              </div>

              <div>
                <h3 className="text-base font-bold text-navy-900 mb-2">3. FEFO Expiry Safeguards & Disposal Norms</h3>
                <p className="text-xs">
                  ClinicPulse Pro's automated <strong>FEFO (First-Expiry, First-Out)</strong> engine automatically suggests and deducts the earliest expiring batches first. Expired stock is automatically quarantined to prevent accidental dispensing to patients.
                </p>
              </div>
            </div>
          )}

        </div>

        {/* Footer */}
        <div className="p-5 border-t border-slate-100 bg-slate-50 flex items-center justify-between shrink-0">
          <p className="text-xs text-slate-400">
            Official statutory documentation • ClinicPulse Pro Healthcare ERP
          </p>

          <button
            onClick={onClose}
            className="px-6 py-2 bg-navy-900 hover:bg-navy-800 text-white rounded-xl text-xs font-bold transition-colors shadow-sm"
          >
            Close
          </button>
        </div>

      </div>
    </div>
  );
};
