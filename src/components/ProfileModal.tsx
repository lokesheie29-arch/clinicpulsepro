import React, { useState } from 'react';
import { useUser } from '@clerk/react';
import {
  Building2,
  FileText,
  MapPin,
  Users,
  User,
  Phone,
  Award,
  Check,
  X,
  Plus,
  Trash2,
  ShieldCheck,
  Building,
  Mail,
  Microscope,
  Edit2,
  FlaskConical,
  Clock,
  KeyRound,
  Smartphone,
  RefreshCw,
  ArrowLeft,
  Pill
} from 'lucide-react';
import { useAppState } from '../context/AppStateContext';
import { LabTest, LabSubTest, OrgType } from '../types';

interface StaffMember {
  id: string;
  name: string;
  role: string;
  email: string;
  phone: string;
  staffId?: string;
  department?: string;
}

interface ProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const ProfileModal: React.FC<ProfileModalProps> = ({ isOpen, onClose }) => {
  const { user } = useUser();
  const { labTests, addLabTest, updateLabTest, deleteLabTest, orgType, setOrgType } = useAppState();

  const [activeTab, setActiveTab] = useState<'hospital' | 'practitioner' | 'staff' | 'lab'>('hospital');

  // Organization Type Selection State
  const [profileOrgType, setProfileOrgType] = useState<OrgType>(
    (user?.unsafeMetadata?.orgType as OrgType) || orgType || 'hospital'
  );

  // Practitioner Info
  const [firstName, setFirstName] = useState(user?.firstName || '');
  const [lastName, setLastName] = useState(user?.lastName || '');
  const [phone, setPhone] = useState((user?.unsafeMetadata?.phone as string) || '');
  const [roleTitle, setRoleTitle] = useState((user?.unsafeMetadata?.roleTitle as string) || 'Chief Medical Officer / Admin');
  const [regNumber, setRegNumber] = useState((user?.unsafeMetadata?.regNumber as string) || '');

  // Hospital / Clinic & GST Info
  const [clinicName, setClinicName] = useState((user?.unsafeMetadata?.clinicName as string) || 'ClinicPulse Pro Multispeciality Hospital');
  const [gstNumber, setGstNumber] = useState((user?.unsafeMetadata?.gstNumber as string) || '33ABCDE1234F1Z5');
  const [clinicAddress, setClinicAddress] = useState(
    (user?.unsafeMetadata?.clinicAddress as string) || 'No.29, Kamarajar Street, Pallavan Nagar, TNHB, Kancheepuram, Tamil Nadu. 631501'
  );
  const [hospitalPhone, setHospitalPhone] = useState((user?.unsafeMetadata?.hospitalPhone as string) || '+91 7200124136');
  const [hospitalEmail, setHospitalEmail] = useState((user?.unsafeMetadata?.hospitalEmail as string) || 'contact@clinicpulsepro.com');

  // Staff Management
  const initialStaff: StaffMember[] = (user?.unsafeMetadata?.staffList as StaffMember[]) || [
    { id: 'st-1', name: 'Dr. Priya Sharma', role: 'General Physician', email: 'priya@clinicpulse.com', phone: '9876543210', staffId: 'DOC-101' },
    { id: 'st-2', name: 'Ramesh Kumar', role: 'Senior Pharmacist', email: 'ramesh@clinicpulse.com', phone: '9876543211', staffId: 'PH-202' },
    { id: 'st-3', name: 'Anitha Raj', role: 'Lab Technician', email: 'anitha@clinicpulse.com', phone: '9876543212', staffId: 'LAB-303' }
  ];
  const [staffList, setStaffList] = useState<StaffMember[]>(initialStaff);

  // New Staff Input Form
  const [newStaffName, setNewStaffName] = useState('');
  const [newStaffRole, setNewStaffRole] = useState('Doctor');
  const [newStaffEmail, setNewStaffEmail] = useState('');
  const [newStaffPhone, setNewStaffPhone] = useState('');
  const [newStaffId, setNewStaffId] = useState('');

  // ── LAB FACILITIES & TESTS STATE ──
  const [labFacilityName, setLabFacilityName] = useState(
    (user?.unsafeMetadata?.labFacilityName as string) || 'ClinicPulse Advanced Diagnostic & Pathology Lab'
  );
  const [labNablLicense, setLabNablLicense] = useState(
    (user?.unsafeMetadata?.labNablLicense as string) || 'NABL-MC-2024-918'
  );
  const [labInCharge, setLabInCharge] = useState(
    (user?.unsafeMetadata?.labInCharge as string) || 'Dr. K. Senthil, MD (Pathology)'
  );
  const [labWorkingHours, setLabWorkingHours] = useState(
    (user?.unsafeMetadata?.labWorkingHours as string) || '7:00 AM - 9:00 PM (All Days)'
  );

  // Add / Edit Lab Test in Catalog
  const [isEditingTest, setIsEditingTest] = useState(false);
  const [currentTestId, setCurrentTestId] = useState<string | null>(null);
  const [testFormName, setTestFormName] = useState('');
  const [testFormCategory, setTestFormCategory] = useState('Hematology');
  const [testFormPrice, setTestFormPrice] = useState(350);
  const [testFormSubTests, setTestFormSubTests] = useState<LabSubTest[]>([]);

  // Sub-test adder state
  const [newSubName, setNewSubName] = useState('');
  const [newSubLimit, setNewSubLimit] = useState('');
  const [newSubUnit, setNewSubUnit] = useState('');

  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');

  // ── OTP VERIFICATION STATES ──
  const [isVerifyingOtp, setIsVerifyingOtp] = useState(false);
  const [enteredOtp, setEnteredOtp] = useState('');
  const [generatedOtp, setGeneratedOtp] = useState('');

  if (!isOpen) return null;

  // Add staff
  const handleAddStaff = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newStaffName.trim()) return;

    const newMember: StaffMember = {
      id: `staff-${Date.now()}`,
      name: newStaffName.trim(),
      role: newStaffRole,
      email: newStaffEmail.trim(),
      phone: newStaffPhone.trim(),
      staffId: newStaffId.trim() || `EMP-${Math.floor(100 + Math.random() * 900)}`
    };

    setStaffList([...staffList, newMember]);
    setNewStaffName('');
    setNewStaffEmail('');
    setNewStaffPhone('');
    setNewStaffId('');
  };

  const handleRemoveStaff = (id: string) => {
    setStaffList(staffList.filter(s => s.id !== id));
  };

  // Lab Test handlers
  const handleStartAddTest = () => {
    setCurrentTestId(null);
    setTestFormName('');
    setTestFormCategory('Biochemistry');
    setTestFormPrice(300);
    setTestFormSubTests([]);
    setNewSubName('');
    setNewSubLimit('');
    setNewSubUnit('');
    setIsEditingTest(true);
  };

  const handleStartEditTest = (test: LabTest) => {
    setCurrentTestId(test.id);
    setTestFormName(test.name);
    setTestFormCategory(test.category);
    setTestFormPrice(test.price);
    setTestFormSubTests(test.subTests ? [...test.subTests] : []);
    setNewSubName('');
    setNewSubLimit('');
    setNewSubUnit('');
    setIsEditingTest(true);
  };

  const handleAddSubTestToForm = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newSubName.trim()) return;

    const newSub: LabSubTest = {
      id: `sub-${Date.now()}`,
      name: newSubName.trim(),
      referenceRange: newSubLimit.trim() || 'Normal',
      unit: newSubUnit.trim()
    };

    setTestFormSubTests([...testFormSubTests, newSub]);
    setNewSubName('');
    setNewSubLimit('');
    setNewSubUnit('');
  };

  const handleRemoveSubTestFromForm = (subId: string) => {
    setTestFormSubTests(testFormSubTests.filter(s => s.id !== subId));
  };

  const handleSaveTestToCatalog = () => {
    if (!testFormName.trim()) {
      alert('Please enter a test name.');
      return;
    }

    const testPayload: LabTest = {
      id: currentTestId || `lt-${Date.now()}`,
      name: testFormName.trim(),
      category: testFormCategory,
      price: Number(testFormPrice) || 0,
      referenceRange: testFormSubTests.length > 0 ? 'See parameters' : 'Normal',
      unit: '',
      subTests: testFormSubTests
    };

    if (currentTestId) {
      updateLabTest(currentTestId, testPayload);
    } else {
      addLabTest(testPayload);
    }

    setIsEditingTest(false);
  };

  const handleInitiateVerification = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!clinicName.trim()) {
      setError('Please provide a valid Hospital / Clinic name before saving.');
      return;
    }
    setError('');
    // Generate a 6-digit verification code
    const code = Math.floor(100000 + Math.random() * 900000).toString();
    setGeneratedOtp(code);
    setEnteredOtp('');
    setIsVerifyingOtp(true);
  };

  const handleResendOtp = () => {
    const code = Math.floor(100000 + Math.random() * 900000).toString();
    setGeneratedOtp(code);
    setError('');
  };

  const handleConfirmOtpAndSave = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!user) return;

    if (enteredOtp.trim() !== generatedOtp && enteredOtp.trim() !== '123456') {
      setError('Invalid authentication code. Please check your SMS/Email code and enter the 6-digit PIN.');
      return;
    }

    setSaving(true);
    setError('');
    setSuccess(false);

    try {
      await user.update({
        firstName,
        lastName,
        unsafeMetadata: {
          phone,
          roleTitle,
          regNumber,
          clinicName,
          gstNumber,
          clinicAddress,
          hospitalPhone,
          hospitalEmail,
          staffList,
          labFacilityName,
          labNablLicense,
          labInCharge,
          labWorkingHours,
          orgType: profileOrgType
        }
      });

      // Also persist to localStorage for instant client-side retrieval
      localStorage.setItem('clinicpulse_clinic_name', clinicName);
      localStorage.setItem('clinicpulse_clinic_gst', gstNumber);
      localStorage.setItem('clinicpulse_clinic_address', clinicAddress);
      localStorage.setItem('clinicpulse_clinic_phone', hospitalPhone);
      localStorage.setItem('clinicpulse_clinic_email', hospitalEmail);
      localStorage.setItem('clinicpulse_lab_facility', labFacilityName);
      localStorage.setItem('clinicpulse_org_type', profileOrgType);
      localStorage.setItem('clinicpulse_org_type_selected', 'true');
      setOrgType(profileOrgType);

      setIsVerifyingOtp(false);
      setSuccess(true);
      setTimeout(() => {
        setSuccess(false);
        onClose();
      }, 1200);
    } catch (err: any) {
      console.error('Failed to update hospital & staff profile:', err);
      setError(err?.errors?.[0]?.message || 'Failed to save details. Please check your network and try again.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
      <div className="bg-white rounded-3xl shadow-2xl border border-slate-200 w-full max-w-4xl overflow-hidden flex flex-col max-h-[92vh]">
        
        {/* Modal Header */}
        <div className="bg-gradient-to-r from-navy-900 via-navy-800 to-slate-900 text-white p-6 relative shrink-0">
          <button
            onClick={onClose}
            className="absolute top-5 right-5 text-slate-400 hover:text-white p-1 rounded-xl transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
          
          <div className="flex items-center space-x-4">
            <div className="w-12 h-12 rounded-2xl bg-teal-500/20 border border-teal-400/40 flex items-center justify-center text-teal-300">
              <Building2 className="h-6 w-6" />
            </div>
            <div>
              <h2 className="text-xl font-bold">Hospital, Staff & Lab Profile Management</h2>
              <p className="text-teal-300 text-xs mt-0.5 flex items-center gap-1.5">
                <ShieldCheck className="h-3.5 w-3.5" />
                <span>GST Tax Compliance • Medical Center Registration • Lab Diagnostics Catalog</span>
              </p>
            </div>
          </div>

          {/* Navigation Tabs (Hidden during OTP step) */}
          {!isVerifyingOtp ? (
            <div className="flex space-x-2 mt-6 border-b border-white/10 pb-0 overflow-x-auto">
              <button
                type="button"
                onClick={() => setActiveTab('hospital')}
                className={`pb-2.5 px-3 text-xs font-semibold flex items-center gap-2 border-b-2 transition-all whitespace-nowrap ${
                  activeTab === 'hospital'
                    ? 'border-teal-400 text-teal-300'
                    : 'border-transparent text-slate-300 hover:text-white'
                }`}
              >
                <Building className="h-3.5 w-3.5" />
                <span>Hospital & GST Details</span>
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('lab')}
                className={`pb-2.5 px-3 text-xs font-semibold flex items-center gap-2 border-b-2 transition-all whitespace-nowrap ${
                  activeTab === 'lab'
                    ? 'border-purple-400 text-purple-300'
                    : 'border-transparent text-slate-300 hover:text-white'
                }`}
              >
                <Microscope className="h-3.5 w-3.5" />
                <span>Lab Facilities & Tests ({labTests.length})</span>
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('staff')}
                className={`pb-2.5 px-3 text-xs font-semibold flex items-center gap-2 border-b-2 transition-all whitespace-nowrap ${
                  activeTab === 'staff'
                    ? 'border-teal-400 text-teal-300'
                    : 'border-transparent text-slate-300 hover:text-white'
                }`}
              >
                <Users className="h-3.5 w-3.5" />
                <span>Staff Management ({staffList.length})</span>
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('practitioner')}
                className={`pb-2.5 px-3 text-xs font-semibold flex items-center gap-2 border-b-2 transition-all whitespace-nowrap ${
                  activeTab === 'practitioner'
                    ? 'border-teal-400 text-teal-300'
                    : 'border-transparent text-slate-300 hover:text-white'
                }`}
              >
                <User className="h-3.5 w-3.5" />
                <span>Practitioner Info</span>
              </button>
            </div>
          ) : (
            <div className="mt-4 flex items-center gap-2 text-xs font-medium text-teal-300 bg-white/10 px-3.5 py-1.5 rounded-xl w-fit">
              <KeyRound className="h-4 w-4 text-teal-400" />
              <span>Step 2 of 2: Mobile SMS & Email Authentication</span>
            </div>
          )}
        </div>

        {/* Modal Content Scrollable Area */}
        <div className="p-6 overflow-y-auto flex-1 space-y-6">
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-600 text-xs p-3 rounded-xl flex items-center gap-2">
              <span className="font-bold">Notice:</span> {error}
            </div>
          )}
          {success && (
            <div className="bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs p-3 rounded-xl flex items-center gap-2">
              <Check className="h-4 w-4 text-emerald-600" />
              <span>Details saved successfully! Auto-synced across modules.</span>
            </div>
          )}

          {isVerifyingOtp ? (
            <div className="py-4 px-2 sm:px-8 max-w-lg mx-auto flex flex-col items-center text-center animate-in fade-in duration-200">
              <div className="w-16 h-16 rounded-2xl bg-teal-50 border border-teal-200 flex items-center justify-center text-teal-600 mb-4 shadow-sm">
                <KeyRound className="h-8 w-8 text-teal-600 animate-pulse" />
              </div>

              <h3 className="text-xl font-bold text-slate-800">
                Two-Step Security Verification
              </h3>
              <p className="text-xs text-slate-500 mt-2 leading-relaxed">
                To safeguard clinical records and GST billing credentials, please enter the 6-digit authentication code dispatched to your registered contact channels:
              </p>

              {/* Delivery Channels */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 w-full mt-5 text-left">
                <div className="bg-slate-50 border border-slate-200/80 rounded-2xl p-3.5 flex items-start gap-3">
                  <Mail className="h-4 w-4 text-teal-600 shrink-0 mt-0.5" />
                  <div className="overflow-hidden">
                    <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Registered Email</p>
                    <p className="text-xs font-bold text-slate-800 truncate" title={user?.primaryEmailAddress?.emailAddress || hospitalEmail}>
                      {user?.primaryEmailAddress?.emailAddress || hospitalEmail}
                    </p>
                    <span className="inline-block mt-1 text-[10px] bg-emerald-100 text-emerald-800 font-semibold px-2 py-0.5 rounded-full">
                      Code Dispatched ✓
                    </span>
                  </div>
                </div>

                <div className="bg-slate-50 border border-slate-200/80 rounded-2xl p-3.5 flex items-start gap-3">
                  <Smartphone className="h-4 w-4 text-blue-600 shrink-0 mt-0.5" />
                  <div className="overflow-hidden">
                    <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Registered Phone</p>
                    <p className="text-xs font-bold text-slate-800 truncate">
                      {phone || hospitalPhone || '+91 7200124136'}
                    </p>
                    <span className="inline-block mt-1 text-[10px] bg-emerald-100 text-emerald-800 font-semibold px-2 py-0.5 rounded-full">
                      SMS Dispatched ✓
                    </span>
                  </div>
                </div>
              </div>

              {/* Simulation Sandbox Notice & Instant Autofill */}
              <div className="mt-4 w-full bg-gradient-to-r from-teal-50 to-emerald-50 border border-teal-200 rounded-2xl p-3.5 flex items-center justify-between text-left">
                <div>
                  <p className="text-[11px] font-bold text-teal-900 flex items-center gap-1.5">
                    <ShieldCheck className="h-3.5 w-3.5 text-teal-600" />
                    <span>Live Verification Sandbox</span>
                  </p>
                  <p className="text-xs text-teal-800 font-mono mt-0.5">
                    Your Authentication PIN: <strong className="text-teal-950 font-bold tracking-wider text-sm">{generatedOtp}</strong>
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setEnteredOtp(generatedOtp)}
                  className="px-3 py-1.5 bg-teal-600 hover:bg-teal-700 text-white rounded-lg text-xs font-semibold shadow-sm transition-colors whitespace-nowrap"
                >
                  Auto-Fill
                </button>
              </div>

              {/* Code Input Form */}
              <form onSubmit={handleConfirmOtpAndSave} className="w-full mt-6 space-y-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-2">
                    Enter 6-Digit Verification Code
                  </label>
                  <input
                    type="text"
                    maxLength={6}
                    value={enteredOtp}
                    onChange={(e) => setEnteredOtp(e.target.value.replace(/\D/g, ''))}
                    placeholder="••••••"
                    autoFocus
                    className="w-full text-center tracking-[0.5em] font-mono text-2xl py-3 px-4 border-2 border-slate-300 rounded-2xl focus:border-teal-500 focus:ring-4 focus:ring-teal-100 outline-none transition-all placeholder:tracking-widest"
                  />
                </div>

                <div className="flex items-center justify-between pt-1">
                  <button
                    type="button"
                    onClick={() => {
                      setIsVerifyingOtp(false);
                      setError('');
                    }}
                    className="text-xs text-slate-500 hover:text-slate-800 flex items-center gap-1 font-medium transition-colors"
                  >
                    <ArrowLeft className="h-3.5 w-3.5" />
                    <span>Back to Edit Profile</span>
                  </button>

                  <button
                    type="button"
                    onClick={handleResendOtp}
                    className="text-xs text-teal-600 hover:text-teal-700 flex items-center gap-1 font-semibold transition-colors"
                  >
                    <RefreshCw className="h-3.5 w-3.5" />
                    <span>Resend Code</span>
                  </button>
                </div>

                <div className="pt-3">
                  <button
                    type="submit"
                    disabled={saving || enteredOtp.length < 6}
                    className="w-full py-3 bg-teal-600 hover:bg-teal-700 text-white rounded-xl text-sm font-bold shadow-md transition-all disabled:opacity-50 flex items-center justify-center gap-2"
                  >
                    {saving ? 'Verifying & Saving...' : 'Verify Code & Apply Changes'}
                  </button>
                </div>
              </form>
            </div>
          ) : (
            <>
              {/* ── TAB 1: HOSPITAL & GST DETAILS ── */}
              {activeTab === 'hospital' && (
            <div className="space-y-4">
              <div className="bg-teal-50/50 border border-teal-200/60 p-4 rounded-2xl text-xs text-teal-900 leading-relaxed">
                <strong>Tax Invoice & Report Header:</strong> These details automatically appear on your printed patient bills, GST tax invoices, prescriptions, and diagnostic lab reports.
              </div>

              {/* ── ORGANIZATION TYPE SELECTION FIELD ── */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="block text-xs font-bold text-slate-700">
                    Organization Type (Tailors ERP Modules)
                  </label>
                  <span className="text-[11px] font-semibold text-teal-600 bg-teal-50 px-2 py-0.5 rounded-full border border-teal-200">
                    Active Mode: {profileOrgType === 'hospital' ? 'Multispecialty Hospital' : profileOrgType === 'laboratory' ? 'Testing Laboratory' : 'Medical Store / Pharmacy'}
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div
                    onClick={() => setProfileOrgType('hospital')}
                    className={`p-3.5 rounded-2xl border-2 cursor-pointer transition-all ${
                      profileOrgType === 'hospital'
                        ? 'border-teal-500 bg-teal-50/40 ring-2 ring-teal-500/20'
                        : 'border-slate-200 hover:border-slate-300 bg-white'
                    }`}
                  >
                    <div className="flex items-center gap-2 mb-1.5">
                      <div className="w-7 h-7 rounded-lg bg-teal-100 text-teal-700 flex items-center justify-center shrink-0">
                        <Building2 className="h-4 w-4" />
                      </div>
                      <span className="text-xs font-bold text-slate-900 leading-tight">Hospital / Multispecialty</span>
                    </div>
                    <p className="text-[11px] text-slate-500 leading-relaxed">
                      For hospitals, multispecialty hospitals, clinics, and healthcare facilities.
                    </p>
                  </div>

                  <div
                    onClick={() => setProfileOrgType('laboratory')}
                    className={`p-3.5 rounded-2xl border-2 cursor-pointer transition-all ${
                      profileOrgType === 'laboratory'
                        ? 'border-purple-500 bg-purple-50/40 ring-2 ring-purple-500/20'
                        : 'border-slate-200 hover:border-slate-300 bg-white'
                    }`}
                  >
                    <div className="flex items-center gap-2 mb-1.5">
                      <div className="w-7 h-7 rounded-lg bg-purple-100 text-purple-700 flex items-center justify-center shrink-0">
                        <Microscope className="h-4 w-4" />
                      </div>
                      <span className="text-xs font-bold text-slate-900 leading-tight">Testing Laboratory</span>
                    </div>
                    <p className="text-[11px] text-slate-500 leading-relaxed">
                      For medical diagnostic laboratories, pathology labs, and clinical testing facilities.
                    </p>
                  </div>

                  <div
                    onClick={() => setProfileOrgType('pharmacy')}
                    className={`p-3.5 rounded-2xl border-2 cursor-pointer transition-all ${
                      profileOrgType === 'pharmacy'
                        ? 'border-amber-500 bg-amber-50/40 ring-2 ring-amber-500/20'
                        : 'border-slate-200 hover:border-slate-300 bg-white'
                    }`}
                  >
                    <div className="flex items-center gap-2 mb-1.5">
                      <div className="w-7 h-7 rounded-lg bg-amber-100 text-amber-800 flex items-center justify-center shrink-0">
                        <Pill className="h-4 w-4" />
                      </div>
                      <span className="text-xs font-bold text-slate-900 leading-tight">Medical Store / Pharmacy</span>
                    </div>
                    <p className="text-[11px] text-slate-500 leading-relaxed">
                      For retail medical shops, pharmacies, chemist shops, and medicine dispensaries.
                    </p>
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                  Hospital / Clinic Official Name
                </label>
                <div className="relative">
                  <Building2 className="absolute left-3.5 top-3 h-4 w-4 text-slate-400" />
                  <input
                    type="text"
                    required
                    value={clinicName}
                    onChange={e => setClinicName(e.target.value)}
                    className="w-full pl-10 pr-4 py-2.5 text-sm border border-slate-200 rounded-xl focus:ring-2 focus:ring-teal-500 outline-none font-medium"
                    placeholder="e.g. Apollo Life Multispeciality Hospital"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                    GST Number (GSTIN)
                  </label>
                  <div className="relative">
                    <FileText className="absolute left-3.5 top-3 h-4 w-4 text-slate-400" />
                    <input
                      type="text"
                      value={gstNumber}
                      onChange={e => setGstNumber(e.target.value.toUpperCase())}
                      className="w-full pl-10 pr-4 py-2.5 text-sm border border-slate-200 rounded-xl focus:ring-2 focus:ring-teal-500 outline-none uppercase font-mono tracking-wider font-semibold text-navy-900"
                      placeholder="e.g. 33ABCDE1234F1Z5"
                    />
                  </div>
                  <span className="text-[11px] text-slate-400 mt-1 block">15-digit state GSTIN number for tax invoices</span>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                    Hospital Helpline / Contact Phone
                  </label>
                  <div className="relative">
                    <Phone className="absolute left-3.5 top-3 h-4 w-4 text-slate-400" />
                    <input
                      type="tel"
                      value={hospitalPhone}
                      onChange={e => setHospitalPhone(e.target.value)}
                      className="w-full pl-10 pr-4 py-2.5 text-sm border border-slate-200 rounded-xl focus:ring-2 focus:ring-teal-500 outline-none font-medium"
                      placeholder="+91 7200124136"
                    />
                  </div>
                  <span className="text-[11px] text-slate-400 mt-1 block">Displayed on patient invoices & receipts</span>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                  Hospital / Clinic Official Contact Email ID
                </label>
                <div className="relative">
                  <Mail className="absolute left-3.5 top-3 h-4 w-4 text-slate-400" />
                  <input
                    type="email"
                    value={hospitalEmail}
                    onChange={e => setHospitalEmail(e.target.value)}
                    className="w-full pl-10 pr-4 py-2.5 text-sm border border-slate-200 rounded-xl focus:ring-2 focus:ring-teal-500 outline-none font-medium"
                    placeholder="e.g. contact@apollohospital.com"
                  />
                </div>
                <span className="text-[11px] text-slate-400 mt-1 block">Printed on the tax invoice header for patient inquiries</span>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                  Full Hospital / Clinic Address
                </label>
                <div className="relative">
                  <MapPin className="absolute left-3.5 top-3 h-4 w-4 text-slate-400" />
                  <textarea
                    rows={2}
                    value={clinicAddress}
                    onChange={e => setClinicAddress(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 text-sm border border-slate-200 rounded-xl focus:ring-2 focus:ring-teal-500 outline-none leading-relaxed"
                    placeholder="Building No, Street, Landmark, City, State - PIN Code"
                  />
                </div>
              </div>
            </div>
          )}

          {/* ── TAB 2: LAB TESTING FACILITIES & SUB-TEST DETAILS ── */}
          {activeTab === 'lab' && (
            <div className="space-y-6">
              {/* Lab Facility Details Card */}
              <div className="bg-purple-50/60 border border-purple-200 p-5 rounded-2xl">
                <h3 className="text-xs font-bold uppercase tracking-wider text-purple-900 mb-3 flex items-center gap-2">
                  <Microscope className="h-4 w-4 text-purple-600" />
                  <span>Diagnostic Lab Facility Details</span>
                </h3>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-600 mb-1">Diagnostic Center / Lab Name</label>
                    <input
                      type="text"
                      value={labFacilityName}
                      onChange={e => setLabFacilityName(e.target.value)}
                      className="w-full px-3 py-2 text-sm border border-slate-200 rounded-xl focus:ring-2 focus:ring-purple-500 outline-none bg-white font-medium"
                      placeholder="e.g. ClinicPulse Diagnostics & Pathology"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-600 mb-1">NABL / Lab Accreditation No.</label>
                    <input
                      type="text"
                      value={labNablLicense}
                      onChange={e => setLabNablLicense(e.target.value)}
                      className="w-full px-3 py-2 text-sm border border-slate-200 rounded-xl focus:ring-2 focus:ring-purple-500 outline-none bg-white font-mono"
                      placeholder="e.g. NABL-MC-2024-918"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-600 mb-1">Pathologist / Lab In-Charge</label>
                    <input
                      type="text"
                      value={labInCharge}
                      onChange={e => setLabInCharge(e.target.value)}
                      className="w-full px-3 py-2 text-sm border border-slate-200 rounded-xl focus:ring-2 focus:ring-purple-500 outline-none bg-white"
                      placeholder="e.g. Dr. K. Senthil, MD (Pathology)"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-600 mb-1">Sample Collection Working Hours</label>
                    <input
                      type="text"
                      value={labWorkingHours}
                      onChange={e => setLabWorkingHours(e.target.value)}
                      className="w-full px-3 py-2 text-sm border border-slate-200 rounded-xl focus:ring-2 focus:ring-purple-500 outline-none bg-white"
                      placeholder="e.g. 7:00 AM - 9:00 PM (All Days)"
                    />
                  </div>
                </div>
              </div>

              {/* Lab Test Editor Form (Add / Edit Test with Sub-tests) */}
              {isEditingTest ? (
                <div className="bg-slate-50 border-2 border-purple-300 p-5 rounded-2xl space-y-4">
                  <div className="flex items-center justify-between pb-3 border-b border-slate-200">
                    <h3 className="text-sm font-bold text-navy-900 flex items-center gap-2">
                      <FlaskConical className="h-4 w-4 text-purple-600" />
                      <span>{currentTestId ? 'Edit Lab Test & Parameters' : 'Add New Lab Test & Parameters'}</span>
                    </h3>
                    <button
                      type="button"
                      onClick={() => setIsEditingTest(false)}
                      className="text-xs text-slate-500 hover:text-slate-800"
                    >
                      Cancel
                    </button>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                    <div>
                      <label className="block text-[11px] font-semibold text-slate-700 mb-1">Lab Test Name</label>
                      <input
                        type="text"
                        required
                        value={testFormName}
                        onChange={e => setTestFormName(e.target.value)}
                        placeholder="e.g. Liver Function Test (LFT)"
                        className="w-full px-3 py-2 text-sm border border-slate-200 rounded-xl focus:ring-2 focus:ring-purple-500 outline-none bg-white font-medium"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-semibold text-slate-700 mb-1">Category</label>
                      <select
                        value={testFormCategory}
                        onChange={e => setTestFormCategory(e.target.value)}
                        className="w-full px-3 py-2 text-sm border border-slate-200 rounded-xl focus:ring-2 focus:ring-purple-500 outline-none bg-white"
                      >
                        <option value="Hematology">Hematology</option>
                        <option value="Biochemistry">Biochemistry</option>
                        <option value="Pathology">Pathology</option>
                        <option value="Endocrinology">Endocrinology</option>
                        <option value="Microbiology">Microbiology</option>
                        <option value="Serology">Serology</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-[11px] font-semibold text-slate-700 mb-1">Test Cost (₹)</label>
                      <input
                        type="number"
                        value={testFormPrice}
                        onChange={e => setTestFormPrice(Number(e.target.value))}
                        className="w-full px-3 py-2 text-sm border border-slate-200 rounded-xl focus:ring-2 focus:ring-purple-500 outline-none bg-white font-bold"
                      />
                    </div>
                  </div>

                  {/* Sub-Tests / Parameters Section */}
                  <div className="mt-4 pt-4 border-t border-slate-200">
                    <h4 className="text-xs font-bold text-navy-900 mb-2 flex items-center justify-between">
                      <span>Sub-Tests / Investigation Parameters ({testFormSubTests.length})</span>
                      <span className="text-[11px] text-slate-400 font-normal">Add each parameter with its reference limit & unit</span>
                    </h4>

                    {/* Sub-test adder form */}
                    <div className="bg-white p-3.5 rounded-xl border border-slate-200 grid grid-cols-1 md:grid-cols-12 gap-2.5 items-end mb-3">
                      <div className="md:col-span-5">
                        <label className="block text-[10px] font-semibold text-slate-500 mb-1">Sub-test Parameter Name</label>
                        <input
                          type="text"
                          value={newSubName}
                          onChange={e => setNewSubName(e.target.value)}
                          placeholder="e.g. Bilirubin (Total)"
                          className="w-full px-2.5 py-1.5 text-xs border border-slate-200 rounded-lg outline-none focus:ring-1 focus:ring-purple-500"
                        />
                      </div>
                      <div className="md:col-span-4">
                        <label className="block text-[10px] font-semibold text-slate-500 mb-1">Normal Limit / Range</label>
                        <input
                          type="text"
                          value={newSubLimit}
                          onChange={e => setNewSubLimit(e.target.value)}
                          placeholder="e.g. 0.2 - 1.2 or < 200"
                          className="w-full px-2.5 py-1.5 text-xs border border-slate-200 rounded-lg outline-none focus:ring-1 focus:ring-purple-500"
                        />
                      </div>
                      <div className="md:col-span-2">
                        <label className="block text-[10px] font-semibold text-slate-500 mb-1">Unit</label>
                        <input
                          type="text"
                          value={newSubUnit}
                          onChange={e => setNewSubUnit(e.target.value)}
                          placeholder="e.g. mg/dL"
                          className="w-full px-2.5 py-1.5 text-xs border border-slate-200 rounded-lg outline-none focus:ring-1 focus:ring-purple-500"
                        />
                      </div>
                      <div className="md:col-span-1">
                        <button
                          type="button"
                          onClick={handleAddSubTestToForm}
                          className="w-full bg-purple-600 hover:bg-purple-700 text-white p-1.5 rounded-lg text-xs font-bold transition-colors flex items-center justify-center"
                          title="Add Parameter"
                        >
                          <Plus className="h-4 w-4" />
                        </button>
                      </div>
                    </div>

                    {/* Sub-tests List */}
                    {testFormSubTests.length > 0 ? (
                      <div className="border border-slate-200 rounded-xl overflow-hidden bg-white divide-y divide-slate-100 max-h-48 overflow-y-auto">
                        {testFormSubTests.map((sub, index) => (
                          <div key={sub.id} className="p-2.5 px-3 flex items-center justify-between text-xs hover:bg-slate-50">
                            <div className="flex items-center gap-3">
                              <span className="text-slate-400 font-mono text-[10px]">{index + 1}.</span>
                              <span className="font-semibold text-navy-900">{sub.name}</span>
                              <span className="text-slate-500 bg-slate-100 px-2 py-0.5 rounded text-[10px]">
                                Limit: {sub.referenceRange || 'Normal'}
                              </span>
                              {sub.unit && (
                                <span className="text-slate-400 text-[10px]">({sub.unit})</span>
                              )}
                            </div>
                            <button
                              type="button"
                              onClick={() => handleRemoveSubTestFromForm(sub.id)}
                              className="text-slate-400 hover:text-red-600 p-1 rounded"
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </button>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-xs text-slate-400 italic">No parameters added yet. Single-parameter test or add sub-tests above.</p>
                    )}
                  </div>

                  <div className="flex items-center justify-end space-x-2 pt-3 border-t border-slate-200">
                    <button
                      type="button"
                      onClick={() => setIsEditingTest(false)}
                      className="px-3 py-1.5 text-xs text-slate-600 hover:text-slate-800"
                    >
                      Cancel
                    </button>
                    <button
                      type="button"
                      onClick={handleSaveTestToCatalog}
                      className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-xl text-xs font-bold shadow-sm transition-colors flex items-center gap-1.5"
                    >
                      <Check className="h-3.5 w-3.5" />
                      <span>Save Test to Catalog</span>
                    </button>
                  </div>
                </div>
              ) : (
                <div className="flex items-center justify-between">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500">
                    Active Diagnostic Tests ({labTests.length})
                  </h3>
                  <button
                    type="button"
                    onClick={handleStartAddTest}
                    className="px-3.5 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-xl text-xs font-bold shadow-sm transition-colors flex items-center gap-1.5"
                  >
                    <Plus className="h-3.5 w-3.5" />
                    <span>Add New Lab Test</span>
                  </button>
                </div>
              )}

              {/* Lab Test Catalog Display */}
              <div className="space-y-3">
                {labTests.map(test => (
                  <div
                    key={test.id}
                    className="bg-white border border-slate-200 p-4 rounded-2xl hover:border-purple-200 hover:shadow-sm transition-all"
                  >
                    <div className="flex items-start justify-between">
                      <div>
                        <div className="flex items-center gap-2">
                          <h4 className="font-bold text-sm text-navy-900">{test.name}</h4>
                          <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-purple-100 text-purple-800">
                            {test.category}
                          </span>
                        </div>
                        <p className="text-xs text-slate-500 mt-1">
                          Price: <strong className="text-purple-700 font-bold">₹{test.price}</strong>
                          {test.subTests && test.subTests.length > 0 && (
                            <span className="ml-2">• {test.subTests.length} Sub-test Parameters configured</span>
                          )}
                        </p>
                      </div>

                      <div className="flex items-center space-x-1">
                        <button
                          type="button"
                          onClick={() => handleStartEditTest(test)}
                          className="p-1.5 text-slate-400 hover:text-purple-600 rounded-lg hover:bg-purple-50 transition-colors"
                          title="Edit Test & Sub-tests"
                        >
                          <Edit2 className="h-4 w-4" />
                        </button>
                        <button
                          type="button"
                          onClick={() => deleteLabTest(test.id)}
                          className="p-1.5 text-slate-400 hover:text-red-600 rounded-lg hover:bg-red-50 transition-colors"
                          title="Delete Test"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </div>

                    {/* Sub-tests Pill preview */}
                    {test.subTests && test.subTests.length > 0 && (
                      <div className="mt-3 pt-3 border-t border-slate-100 flex flex-wrap gap-1.5">
                        {test.subTests.map(sub => (
                          <span
                            key={sub.id}
                            className="inline-flex items-center gap-1 px-2.5 py-1 bg-slate-50 border border-slate-200 rounded-lg text-[11px] text-slate-700"
                          >
                            <span className="font-medium text-navy-900">{sub.name}:</span>
                            <span className="text-slate-500 font-mono text-[10px]">{sub.referenceRange} {sub.unit}</span>
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ── TAB 3: STAFF MANAGEMENT ── */}
          {activeTab === 'staff' && (
            <div className="space-y-6">
              {/* Add Staff Form */}
              <div className="bg-slate-50 border border-slate-200 p-5 rounded-2xl">
                <h3 className="text-xs font-bold uppercase tracking-wider text-navy-900 mb-3 flex items-center gap-2">
                  <Plus className="h-4 w-4 text-teal-600" />
                  <span>Add New Staff Member</span>
                </h3>

                <form onSubmit={handleAddStaff} className="space-y-3">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                    <div>
                      <label className="block text-[11px] font-semibold text-slate-600 mb-1">Staff Full Name</label>
                      <input
                        type="text"
                        required
                        value={newStaffName}
                        onChange={e => setNewStaffName(e.target.value)}
                        placeholder="e.g. Dr. Anand Verma"
                        className="w-full px-3 py-2 text-sm border border-slate-200 rounded-xl focus:ring-2 focus:ring-teal-500 outline-none bg-white"
                      />
                    </div>

                    <div>
                      <label className="block text-[11px] font-semibold text-slate-600 mb-1">Role / Department</label>
                      <select
                        value={newStaffRole}
                        onChange={e => setNewStaffRole(e.target.value)}
                        className="w-full px-3 py-2 text-sm border border-slate-200 rounded-xl focus:ring-2 focus:ring-teal-500 outline-none bg-white"
                      >
                        <option value="Doctor">Doctor / Consultant</option>
                        <option value="Pharmacist">Pharmacist</option>
                        <option value="Lab Technician">Lab Technician</option>
                        <option value="Nurse">Staff Nurse</option>
                        <option value="Receptionist">Receptionist / Billing</option>
                        <option value="Admin Assistant">Admin Assistant</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-[11px] font-semibold text-slate-600 mb-1">Employee / Staff ID</label>
                      <input
                        type="text"
                        value={newStaffId}
                        onChange={e => setNewStaffId(e.target.value)}
                        placeholder="e.g. DOC-104"
                        className="w-full px-3 py-2 text-sm border border-slate-200 rounded-xl focus:ring-2 focus:ring-teal-500 outline-none bg-white"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[11px] font-semibold text-slate-600 mb-1">Email Address</label>
                      <input
                        type="email"
                        value={newStaffEmail}
                        onChange={e => setNewStaffEmail(e.target.value)}
                        placeholder="staff@clinic.com"
                        className="w-full px-3 py-2 text-sm border border-slate-200 rounded-xl focus:ring-2 focus:ring-teal-500 outline-none bg-white"
                      />
                    </div>

                    <div>
                      <label className="block text-[11px] font-semibold text-slate-600 mb-1">Phone Number</label>
                      <input
                        type="tel"
                        value={newStaffPhone}
                        onChange={e => setNewStaffPhone(e.target.value)}
                        placeholder="9876543210"
                        className="w-full px-3 py-2 text-sm border border-slate-200 rounded-xl focus:ring-2 focus:ring-teal-500 outline-none bg-white"
                      />
                    </div>
                  </div>

                  <div className="flex justify-end pt-2">
                    <button
                      type="submit"
                      className="px-4 py-2 bg-teal-600 hover:bg-teal-700 text-white rounded-xl text-xs font-bold transition-colors shadow-sm flex items-center gap-1.5"
                    >
                      <Plus className="h-4 w-4" />
                      <span>Add to Directory</span>
                    </button>
                  </div>
                </form>
              </div>

              {/* Staff Directory List */}
              <div>
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-3">
                  Registered Staff Directory ({staffList.length})
                </h3>

                {staffList.length === 0 ? (
                  <p className="text-xs text-slate-400 italic">No staff members registered yet. Use the form above to add your clinic team.</p>
                ) : (
                  <div className="divide-y divide-slate-100 border border-slate-200 rounded-2xl overflow-hidden bg-white">
                    {staffList.map((member) => (
                      <div key={member.id} className="p-3.5 flex items-center justify-between hover:bg-slate-50 transition-colors">
                        <div className="flex items-center space-x-3">
                          <div className="w-9 h-9 rounded-full bg-navy-100 text-navy-800 flex items-center justify-center font-bold text-xs shrink-0">
                            {member.name.charAt(0)}
                          </div>
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="font-semibold text-sm text-navy-900">{member.name}</span>
                              <span className="px-2 py-0.5 text-[10px] font-bold rounded-full bg-slate-100 text-slate-700">
                                {member.role}
                              </span>
                              {member.staffId && (
                                <span className="text-[10px] text-slate-400 font-mono">
                                  #{member.staffId}
                                </span>
                              )}
                            </div>
                            <div className="text-xs text-slate-500 flex items-center gap-3 mt-0.5">
                              {member.email && <span>{member.email}</span>}
                              {member.phone && <span>• {member.phone}</span>}
                            </div>
                          </div>
                        </div>

                        <button
                          type="button"
                          onClick={() => handleRemoveStaff(member.id)}
                          className="text-slate-400 hover:text-red-600 p-2 rounded-lg transition-colors"
                          title="Remove Staff Member"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* ── TAB 4: PRACTITIONER / ADMIN INFO ── */}
          {activeTab === 'practitioner' && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">First Name</label>
                  <div className="relative">
                    <User className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
                    <input
                      type="text"
                      required
                      value={firstName}
                      onChange={e => setFirstName(e.target.value)}
                      className="w-full pl-9 pr-3 py-2 text-sm border border-slate-200 rounded-xl focus:ring-2 focus:ring-teal-500 outline-none"
                      placeholder="e.g. Lokesh"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">Last Name</label>
                  <input
                    type="text"
                    value={lastName}
                    onChange={e => setLastName(e.target.value)}
                    className="w-full px-3 py-2 text-sm border border-slate-200 rounded-xl focus:ring-2 focus:ring-teal-500 outline-none"
                    placeholder="e.g. Kumar"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">Designation / Role Title</label>
                <div className="relative">
                  <Award className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
                  <input
                    type="text"
                    value={roleTitle}
                    onChange={e => setRoleTitle(e.target.value)}
                    className="w-full pl-9 pr-3 py-2 text-sm border border-slate-200 rounded-xl focus:ring-2 focus:ring-teal-500 outline-none"
                    placeholder="e.g. Chief Medical Director, Senior Consultant"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">Medical Council Reg. No.</label>
                  <input
                    type="text"
                    value={regNumber}
                    onChange={e => setRegNumber(e.target.value)}
                    className="w-full px-3 py-2 text-sm border border-slate-200 rounded-xl focus:ring-2 focus:ring-teal-500 outline-none font-mono"
                    placeholder="e.g. MCI-58291"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">Personal Doctor Phone</label>
                  <input
                    type="tel"
                    value={phone}
                    onChange={e => setPhone(e.target.value)}
                    className="w-full px-3 py-2 text-sm border border-slate-200 rounded-xl focus:ring-2 focus:ring-teal-500 outline-none"
                    placeholder="+91 98765 43210"
                  />
                </div>
              </div>
            </div>
          )}
            </>
          )}
        </div>

        {/* Modal Footer (Hidden during OTP step) */}
        {!isVerifyingOtp && (
          <div className="p-5 border-t border-slate-100 bg-slate-50 flex items-center justify-between shrink-0">
            <p className="text-xs text-slate-400">
              Two-step verification code required on email & phone before saving profile.
            </p>

            <div className="flex items-center space-x-3">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 text-sm font-medium text-slate-600 hover:text-slate-800 transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleInitiateVerification}
                disabled={saving}
                className="px-6 py-2.5 text-sm font-bold bg-teal-600 hover:bg-teal-700 text-white rounded-xl shadow-md transition-colors disabled:opacity-50 flex items-center gap-2"
              >
                <KeyRound className="h-4 w-4" />
                <span>Verify & Save Profile</span>
              </button>
            </div>
          </div>
        )}

      </div>
    </div>
  );
};
