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
  Briefcase
} from 'lucide-react';

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

  const [activeTab, setActiveTab] = useState<'hospital' | 'practitioner' | 'staff'>('hospital');

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
    (user?.unsafeMetadata?.clinicAddress as string) || '123 Health Avenue, Anna Nagar, Chennai, Tamil Nadu - 600040'
  );
  const [hospitalPhone, setHospitalPhone] = useState((user?.unsafeMetadata?.hospitalPhone as string) || '+91 7200124136');

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

  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');

  if (!isOpen) return null;

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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
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
          staffList
        }
      });

      // Also persist to localStorage for instant client-side retrieval
      localStorage.setItem('clinicpulse_clinic_name', clinicName);
      localStorage.setItem('clinicpulse_clinic_gst', gstNumber);
      localStorage.setItem('clinicpulse_clinic_address', clinicAddress);

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
      <div className="bg-white rounded-3xl shadow-2xl border border-slate-200 w-full max-w-3xl overflow-hidden flex flex-col max-h-[92vh]">
        
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
              <h2 className="text-xl font-bold">Hospital & Staff Profile Management</h2>
              <p className="text-teal-300 text-xs mt-0.5 flex items-center gap-1.5">
                <ShieldCheck className="h-3.5 w-3.5" />
                <span>GST Tax Compliance • Medical Center Registration • Staff Directory</span>
              </p>
            </div>
          </div>

          {/* Navigation Tabs */}
          <div className="flex space-x-2 mt-6 border-b border-white/10 pb-0">
            <button
              type="button"
              onClick={() => setActiveTab('hospital')}
              className={`pb-2.5 px-3 text-xs font-semibold flex items-center gap-2 border-b-2 transition-all ${
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
              onClick={() => setActiveTab('staff')}
              className={`pb-2.5 px-3 text-xs font-semibold flex items-center gap-2 border-b-2 transition-all ${
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
              className={`pb-2.5 px-3 text-xs font-semibold flex items-center gap-2 border-b-2 transition-all ${
                activeTab === 'practitioner'
                  ? 'border-teal-400 text-teal-300'
                  : 'border-transparent text-slate-300 hover:text-white'
              }`}
            >
              <User className="h-3.5 w-3.5" />
              <span>Practitioner Info</span>
            </button>
          </div>
        </div>

        {/* Modal Content Scrollable Area */}
        <div className="p-6 overflow-y-auto flex-1 space-y-6">
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-600 text-xs p-3 rounded-xl">
              {error}
            </div>
          )}
          {success && (
            <div className="bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs p-3 rounded-xl flex items-center gap-2">
              <Check className="h-4 w-4 text-emerald-600" />
              <span>Details and staff directory updated successfully!</span>
            </div>
          )}

          {/* ── TAB 1: HOSPITAL & GST DETAILS ── */}
          {activeTab === 'hospital' && (
            <div className="space-y-4">
              <div className="bg-teal-50/50 border border-teal-200/60 p-4 rounded-2xl text-xs text-teal-900 leading-relaxed">
                <strong>Tax Invoice & Report Header:</strong> These details automatically appear on your printed patient bills, GST tax invoices, prescriptions, and diagnostic lab reports.
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
                    Hospital Helpline / Emergency Contact
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
                </div>
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

          {/* ── TAB 2: STAFF MANAGEMENT ── */}
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

          {/* ── TAB 3: PRACTITIONER / ADMIN INFO ── */}
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
        </div>

        {/* Modal Footer */}
        <div className="p-5 border-t border-slate-100 bg-slate-50 flex items-center justify-between shrink-0">
          <p className="text-xs text-slate-400">
            Changes sync with Clerk and auto-reflect across invoices & reports.
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
              onClick={handleSubmit}
              disabled={saving}
              className="px-6 py-2.5 text-sm font-bold bg-teal-600 hover:bg-teal-700 text-white rounded-xl shadow-md transition-colors disabled:opacity-50 flex items-center gap-2"
            >
              {saving ? 'Saving Changes...' : 'Save All Details'}
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};
