import { useState, useMemo, useEffect } from 'react';
import { 
  Search, 
  Trash2, 
  ArrowRight, 
  Smartphone, 
  CheckCircle, 
  UserCheck, 
  Pill, 
  Receipt, 
  Plus, 
  AlertCircle,
  Building2,
  ChevronDown,
  ChevronUp,
  Stethoscope,
  Sparkles
} from 'lucide-react';
import { useAppState } from '../../context/AppStateContext';
import { doctors } from '../../data/mockData';
import { PrescriptionItem, PatientDetails, Invoice } from '../../types';
import { getBillShareUrl } from '../../lib/invoiceShare';
import { v4 as uuidv4 } from 'uuid';

export const OpdConsultation = ({ onComplete }: { onComplete: (invoiceId: string, patientPhone?: string, total?: number, billId?: string) => void }) => {
  const { medicines, addInvoice, updateMedicineStock, orgType } = useAppState();
  const isPharmacy = orgType === 'pharmacy';

  const [patient, setPatient] = useState<PatientDetails>({
    name: '', age: 0, gender: 'Male', phone: '', complaints: '', bp: '', pulse: '', temp: '', spo2: '', weight: ''
  });

  // Doctor state - defaults to the first doctor for hospital, or doc-1 for pharmacy
  const [doctorId, setDoctorId] = useState<string>(doctors[0]?.id || 'doc-1');
  const [customDoctorName, setCustomDoctorName] = useState('');
  const [customDoctorRegNo, setCustomDoctorRegNo] = useState('');
  const [rxSlipNumber, setRxSlipNumber] = useState('');
  const [doctorValidationError, setDoctorValidationError] = useState(false);

  // Pharmacy has zero consultation fee
  const [consultationFee, setConsultationFee] = useState(isPharmacy ? 0 : 500);
  const [prescriptions, setPrescriptions] = useState<PrescriptionItem[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [showVitals, setShowVitals] = useState(!isPharmacy); // Collapsed by default in pharmacy mode

  // Ensure consultation fee is 0 for pharmacy
  useEffect(() => {
    if (isPharmacy) {
      setConsultationFee(0);
    }
  }, [isPharmacy]);

  const filteredMedicines = useMemo(() => {
    if (!searchQuery) return [];
    return medicines.filter(m =>
      m.brandName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      m.genericName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      m.batchNo.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [searchQuery, medicines]);

  const addPrescription = (medId: string) => {
    const med = medicines.find(m => m.id === medId);
    if (!med) return;

    // Check if already in list
    const existing = prescriptions.find(p => p.medicineId === med.id);
    if (existing) {
      updatePrescription(existing.id, 'quantity', existing.quantity + 1);
      setSearchQuery('');
      return;
    }

    const defaultQty = isPharmacy ? 10 : 6;
    const gross = med.sellingPrice * defaultQty;

    setPrescriptions([...prescriptions, {
      id: uuidv4(),
      medicineId: med.id,
      medicineName: med.brandName,
      batchNo: med.batchNo,
      expiryDate: med.expiryDate,
      hsn: med.hsn,
      dosage: '1-0-1',
      durationDays: 3,
      quantity: defaultQty,
      pricePerUnit: med.sellingPrice,
      discountPercent: 0,
      discountAmount: 0,
      totalPrice: gross,
      gstRate: med.gstRate,
      foodTiming: 'After Food'
    }]);
    setSearchQuery('');
  };

  const updatePrescription = (id: string, field: keyof PrescriptionItem, value: any) => {
    setPrescriptions(prev => prev.map(p => {
      if (p.id === id) {
        const updated = { ...p, [field]: value };
        // Recalculate quantity if dosage or durationDays is changed in OPD mode
        if (field === 'dosage' || field === 'durationDays') {
          const timesPerDay = (updated.dosage.match(/1/g) || []).length || (updated.dosage === 'SOS' ? 1 : 1);
          updated.quantity = timesPerDay * updated.durationDays;
        }

        // Direct quantity edit in pharmacy mode
        if (field === 'quantity') {
          updated.quantity = Math.max(1, parseInt(value) || 1);
        }

        const gross = updated.quantity * updated.pricePerUnit;
        const discPct = Math.max(0, Math.min(100, Number(updated.discountPercent) || 0));
        updated.discountPercent = discPct;
        updated.discountAmount = (gross * discPct) / 100;
        updated.totalPrice = Math.max(0, gross - updated.discountAmount);
        return updated;
      }
      return p;
    }));
  };

  const removePrescription = (id: string) => {
    setPrescriptions(prev => prev.filter(p => p.id !== id));
  };

  // Get active selected doctor details
  const selectedDoctorObj = useMemo(() => {
    return doctors.find(d => d.id === doctorId);
  }, [doctorId]);

  const handleFinalize = () => {
    // 1. Validate Patient Info
    if (!patient.name.trim()) {
      alert('Please enter Customer / Patient Full Name.');
      return;
    }

    if (!patient.phone.trim()) {
      alert('Please enter Customer WhatsApp Phone Number for sending bill & payment receipt.');
      return;
    }

    // 2. Validate Prescribed By Doctor (as requested)
    if (!doctorId) {
      setDoctorValidationError(true);
      alert('Please select the Prescribing Doctor from the list before generating the bill.');
      return;
    }

    if (doctorId === 'doc-other' && !customDoctorName.trim()) {
      setDoctorValidationError(true);
      alert('Please enter the name of the external Prescribing Doctor.');
      return;
    }

    setDoctorValidationError(false);

    // 3. Validate Medicines
    if (prescriptions.length === 0) {
      alert('Please add at least one medicine to generate the bill.');
      return;
    }

    // Compute Doctor Display Name for Bill
    let effectiveDoctorName = 'Direct / OTC';
    if (doctorId === 'doc-other') {
      effectiveDoctorName = customDoctorRegNo.trim() 
        ? `${customDoctorName.trim()} (${customDoctorRegNo.trim()})` 
        : customDoctorName.trim();
    } else if (selectedDoctorObj) {
      effectiveDoctorName = selectedDoctorObj.name + 
        (selectedDoctorObj.regNo && selectedDoctorObj.regNo !== 'N/A' ? ` (${selectedDoctorObj.regNo})` : '');
    }

    const effectiveFee = isPharmacy ? 0 : consultationFee;
    const grossMedicineTotal = prescriptions.reduce((acc, p) => acc + (p.quantity * p.pricePerUnit), 0);
    const totalDiscount = prescriptions.reduce((acc, p) => acc + (p.discountAmount || 0), 0);
    const subTotal = effectiveFee + (grossMedicineTotal - totalDiscount);

    let cgst = effectiveFee * 0.09;
    let sgst = effectiveFee * 0.09;

    prescriptions.forEach(p => {
      const tax = (p.totalPrice * p.gstRate) / 100;
      cgst += tax / 2;
      sgst += tax / 2;
    });

    const totalAmount = subTotal + cgst + sgst;
    const billId = `INV-${Math.floor(1000 + Math.random() * 9000)}`;

    const invoice: Invoice = {
      id: billId,
      patient: {
        ...patient,
        complaints: rxSlipNumber ? `Rx Ref: ${rxSlipNumber}${patient.complaints ? ` | ${patient.complaints}` : ''}` : patient.complaints
      },
      doctorId,
      prescribedByDoctorName: effectiveDoctorName,
      consultationFee: effectiveFee,
      prescriptionItems: prescriptions,
      subTotal,
      totalDiscount,
      cgst,
      sgst,
      totalAmount,
      date: new Date().toISOString(),
      paymentStatus: 'Pending'
    };

    addInvoice(invoice);

    // Deduct stock from inventory
    prescriptions.forEach(p => {
      updateMedicineStock(p.medicineId, p.quantity);
    });

    // Auto-dispatch WhatsApp payment link to patient's phone
    const cleanPhone = patient.phone.replace(/\D/g, '');
    const vpa = "clinicpulse@upi";
    const upiString = `upi://pay?pa=${vpa}&pn=ClinicPulse&am=${totalAmount.toFixed(2)}&cu=INR&tn=Invoice-${billId}`;
    const medSummary = prescriptions.map(p => `• ${p.medicineName} (${p.quantity} qty)`).join('%0A');
    const billLink = getBillShareUrl(invoice, isPharmacy ? 'Medical Store & Pharmacy' : 'ClinicPulse Hospital');
    const waText = `*${isPharmacy ? 'Pharmacy Tax Invoice' : 'Medical Tax Invoice'} %26 Payment Link - Bill %23${billId}*%0A%0AHello *${patient.name}*,%0AYour medicine bill has been generated at ClinicPulse Pro.%0A%0A*Bill No:* ${billId}%0A*Prescribed By:* ${effectiveDoctorName}%0A*Amount Due:* ₹${totalAmount.toFixed(2)}%0A*Payment Link (Instant UPI):*%0A${encodeURIComponent(upiString)}%0A%0A📄 *View & Download Bill Online:*%0A${encodeURIComponent(billLink)}%0A%0A*Medicines Dispensed:*%0A${medSummary}%0A%0APlease pay using the UPI link above. Once confirmed, your official PDF bill will be generated and saved!%0A%0A*** WISH YOU A SPEEDY RECOVERY ***`;

    if (cleanPhone) {
      window.open(`https://wa.me/91${cleanPhone}?text=${waText}`, '_blank');
    }

    onComplete(invoice.id, patient.phone, totalAmount, billId);
  };

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="bg-gradient-to-r from-navy-900 via-navy-800 to-slate-900 text-white p-5 rounded-2xl shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4 border border-slate-800">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-teal-500/20 border border-teal-500/30 rounded-xl text-teal-300">
            {isPharmacy ? <Receipt className="w-6 h-6" /> : <Stethoscope className="w-6 h-6" />}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-lg font-bold tracking-tight">
                {isPharmacy ? 'Medical Store & Pharmacy Billing Counter' : 'OPD Consultation & Prescription Studio'}
              </h2>
              <span className="text-[11px] font-semibold bg-teal-500/20 text-teal-300 border border-teal-500/30 px-2 py-0.5 rounded-full">
                {isPharmacy ? 'POS Bill Generator' : 'Doctor OPD Mode'}
              </span>
            </div>
            <p className="text-xs text-slate-300 mt-0.5">
              {isPharmacy 
                ? 'Generate patient pharmacy bills, verify prescribing doctor, auto-deduct stock & dispatch WhatsApp links' 
                : 'Enter patient clinical diagnosis, select consulting doctor, prescribe medicines & generate tax invoice'}
            </p>
          </div>
        </div>

        {isPharmacy && (
          <div className="bg-emerald-500/20 border border-emerald-500/30 text-emerald-300 px-3.5 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-2 shrink-0">
            <Sparkles className="w-4 h-4 text-emerald-400" />
            <span>₹0 Consultation Fee (Pure Medicine Sale)</span>
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left: Customer/Patient Details */}
        <div className="lg:col-span-1 space-y-5">
          <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-sm font-bold text-navy-900">
                {isPharmacy ? 'Customer / Patient Details' : 'Patient Information'}
              </h3>
              <span className="text-[10px] font-semibold text-rose-600 bg-rose-50 px-2 py-0.5 rounded">
                * Mandatory
              </span>
            </div>

            <div className="space-y-3.5">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Customer / Patient Full Name *
                </label>
                <input 
                  type="text" 
                  value={patient.name} 
                  onChange={e => setPatient({...patient, name: e.target.value})} 
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 outline-none text-xs font-medium" 
                  placeholder="e.g. Suresh Babu" 
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  WhatsApp Mobile Number *
                </label>
                <div className="flex items-center">
                  <span className="px-3 py-2.5 bg-slate-100 border border-r-0 border-slate-200 rounded-l-xl text-xs text-slate-500 font-medium">
                    +91
                  </span>
                  <input 
                    type="tel" 
                    maxLength={10}
                    value={patient.phone} 
                    onChange={e => setPatient({...patient, phone: e.target.value.replace(/\D/g, '')})} 
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-r-xl focus:bg-white focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 outline-none text-xs font-mono font-medium" 
                    placeholder="10-digit number" 
                  />
                </div>
                <span className="text-[10px] text-slate-400 mt-1 block">
                  Bill PDF and instant UPI payment link will be sent to this WhatsApp number.
                </span>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Age</label>
                  <input 
                    type="number" 
                    min={0}
                    max={120}
                    value={patient.age || ''} 
                    onChange={e => setPatient({...patient, age: parseInt(e.target.value) || 0})} 
                    className="w-full p-2 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white outline-none text-xs text-center" 
                    placeholder="e.g. 35"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Gender</label>
                  <select 
                    value={patient.gender} 
                    onChange={e => setPatient({...patient, gender: e.target.value})} 
                    className="w-full p-2 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white outline-none text-xs font-medium"
                  >
                    <option>Male</option>
                    <option>Female</option>
                    <option>Other</option>
                  </select>
                </div>
              </div>

              {isPharmacy && (
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Doctor's Prescription Slip Ref # (Optional)
                  </label>
                  <input 
                    type="text" 
                    value={rxSlipNumber} 
                    onChange={e => setRxSlipNumber(e.target.value)} 
                    className="w-full p-2 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white outline-none text-xs font-mono" 
                    placeholder="e.g. RX-2026-908" 
                  />
                </div>
              )}

              {/* Vitals Collapsible Toggle */}
              <div>
                <button
                  type="button"
                  onClick={() => setShowVitals(!showVitals)}
                  className="flex items-center justify-between w-full text-xs font-semibold text-slate-600 hover:text-navy-900 py-1.5 border-t border-slate-100 transition-colors"
                >
                  <span>{isPharmacy ? 'Optional Customer Vitals & Complaints' : 'Patient Vitals & Symptoms'}</span>
                  {showVitals ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                </button>

                {showVitals && (
                  <div className="pt-2 space-y-2.5 animate-in fade-in duration-150">
                    <div className="grid grid-cols-2 gap-2 text-xs">
                      <div>
                        <label className="block text-[10px] text-slate-500 mb-0.5">BP (mmHg)</label>
                        <input type="text" value={patient.bp} onChange={e => setPatient({...patient, bp: e.target.value})} className="w-full p-1.5 border border-slate-200 rounded-lg text-xs" placeholder="120/80" />
                      </div>
                      <div>
                        <label className="block text-[10px] text-slate-500 mb-0.5">Pulse (bpm)</label>
                        <input type="text" value={patient.pulse} onChange={e => setPatient({...patient, pulse: e.target.value})} className="w-full p-1.5 border border-slate-200 rounded-lg text-xs" placeholder="72" />
                      </div>
                      <div>
                        <label className="block text-[10px] text-slate-500 mb-0.5">Temp (°F)</label>
                        <input type="text" value={patient.temp} onChange={e => setPatient({...patient, temp: e.target.value})} className="w-full p-1.5 border border-slate-200 rounded-lg text-xs" placeholder="98.6" />
                      </div>
                      <div>
                        <label className="block text-[10px] text-slate-500 mb-0.5">Weight (kg)</label>
                        <input type="text" value={patient.weight} onChange={e => setPatient({...patient, weight: e.target.value})} className="w-full p-1.5 border border-slate-200 rounded-lg text-xs" placeholder="70" />
                      </div>
                    </div>
                    <div>
                      <label className="block text-[10px] text-slate-500 mb-0.5">Symptoms / Notes</label>
                      <textarea value={patient.complaints} onChange={e => setPatient({...patient, complaints: e.target.value})} className="w-full p-2 border border-slate-200 rounded-lg text-xs h-14" placeholder="Complaints or dispensing remarks..."></textarea>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Right: Prescribed By Doctor & Medicine Studio */}
        <div className="lg:col-span-2 space-y-5">
          {/* ─── PRESCRIBED BY DOCTOR SELECTOR (REQUIRED) ─── */}
          <div className={`bg-white p-5 rounded-2xl border shadow-sm space-y-3.5 transition-all ${
            doctorValidationError ? 'border-rose-400 ring-2 ring-rose-500/20' : 'border-slate-200/80'
          }`}>
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <div className="p-1.5 bg-teal-50 text-teal-700 rounded-lg">
                  <UserCheck className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-navy-900">
                    {isPharmacy ? 'Prescribed By Doctor *' : 'Consulting Doctor *'}
                  </h3>
                  <p className="text-[11px] text-slate-500">
                    {isPharmacy 
                      ? 'Select prescribing practitioner from registered list or enter external doctor' 
                      : 'Attending consultant physician for this clinical encounter'}
                  </p>
                </div>
              </div>

              {!isPharmacy && (
                <div className="flex items-center gap-2">
                  <span className="text-xs text-slate-500 font-medium">Consultation Fee:</span>
                  <div className="relative w-28">
                    <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-xs text-slate-400">₹</span>
                    <input 
                      type="number" 
                      value={consultationFee} 
                      onChange={e => setConsultationFee(parseInt(e.target.value) || 0)} 
                      className="w-full pl-6 pr-2 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-bold text-teal-700" 
                    />
                  </div>
                </div>
              )}
            </div>

            {/* Doctor Select Dropdown */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Choose Prescribing Doctor from List:
              </label>
              <select 
                value={doctorId} 
                onChange={e => {
                  setDoctorId(e.target.value);
                  setDoctorValidationError(false);
                }} 
                className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 outline-none text-xs font-semibold text-navy-900"
              >
                <option value="">-- Select Prescribing Doctor from List * --</option>
                {doctors.map(d => (
                  <option key={d.id} value={d.id}>
                    {d.name} — {d.specialty} {d.regNo && d.regNo !== 'N/A' ? `[Reg: ${d.regNo}]` : ''}
                  </option>
                ))}
              </select>
            </div>

            {/* If External Doctor Selected */}
            {doctorId === 'doc-other' && (
              <div className="bg-amber-50/70 border border-amber-200 p-3.5 rounded-xl space-y-3 animate-in fade-in duration-150">
                <div className="text-xs font-bold text-amber-900 flex items-center gap-1.5">
                  <Building2 className="w-3.5 h-3.5 text-amber-700" />
                  <span>External Prescribing Doctor Details</span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                      Doctor Full Name *
                    </label>
                    <input 
                      type="text" 
                      value={customDoctorName} 
                      onChange={e => setCustomDoctorName(e.target.value)} 
                      placeholder="e.g. Dr. M. K. Narayanan, MD" 
                      className="w-full p-2 bg-white border border-amber-300 rounded-lg text-xs font-medium focus:ring-2 focus:ring-amber-500/20 outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                      Hospital / Clinic & Reg No (Optional)
                    </label>
                    <input 
                      type="text" 
                      value={customDoctorRegNo} 
                      onChange={e => setCustomDoctorRegNo(e.target.value)} 
                      placeholder="e.g. Apollo Clinic / Reg: 44102" 
                      className="w-full p-2 bg-white border border-amber-300 rounded-lg text-xs font-medium focus:ring-2 focus:ring-amber-500/20 outline-none"
                    />
                  </div>
                </div>
              </div>
            )}

            {/* Active Doctor Selected Pill */}
            {selectedDoctorObj && doctorId !== 'doc-other' && (
              <div className="bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-xs text-slate-700 flex flex-wrap items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <span className="font-bold text-teal-800">{selectedDoctorObj.name}</span>
                  <span className="text-slate-400">•</span>
                  <span className="text-slate-600">{selectedDoctorObj.specialty}</span>
                </div>
                {selectedDoctorObj.regNo && (
                  <span className="text-[10px] font-mono bg-white px-2 py-0.5 rounded border border-slate-200 text-slate-600 font-semibold">
                    Reg No: {selectedDoctorObj.regNo}
                  </span>
                )}
              </div>
            )}
          </div>

          {/* ─── MEDICINE SEARCH & DISPENSING TABLE ─── */}
          <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm flex flex-col space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <h3 className="text-sm font-bold text-navy-900">
                  {isPharmacy ? 'Dispensed Medicine Items' : 'Prescription Items (Rx)'}
                </h3>
                <p className="text-[11px] text-slate-500">
                  Search inventory to add batch-tracked medicines with automatic stock deduction
                </p>
              </div>
              <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-teal-50 text-teal-700 border border-teal-200">
                {prescriptions.length} {prescriptions.length === 1 ? 'Item' : 'Items'} Added
              </span>
            </div>

            {/* Medicine Search Box */}
            <div className="relative">
              <Search className="h-4 w-4 text-slate-400 absolute left-3.5 top-3" />
              <input 
                type="text" 
                value={searchQuery} 
                onChange={e => setSearchQuery(e.target.value)} 
                className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs outline-none focus:bg-white focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 transition-all font-medium" 
                placeholder="Search medicines by Brand Name, Generic Composition, or Batch No..." 
              />
              {filteredMedicines.length > 0 && (
                <div className="absolute z-20 w-full mt-1.5 bg-white border border-slate-200 rounded-xl shadow-xl max-h-56 overflow-y-auto divide-y divide-slate-100">
                  {filteredMedicines.map(med => (
                    <button
                      key={med.id}
                      onClick={() => addPrescription(med.id)}
                      className="w-full text-left px-4 py-2.5 hover:bg-teal-50/60 flex justify-between items-center transition-colors group"
                    >
                      <div>
                        <div className="font-bold text-navy-900 text-xs group-hover:text-teal-700">{med.brandName}</div>
                        <div className="text-[11px] text-slate-500">{med.genericName} • Batch: <span className="font-mono text-slate-600">{med.batchNo}</span></div>
                      </div>
                      <div className="text-right">
                        <span className={`text-[11px] font-bold px-2 py-0.5 rounded-full ${
                          med.stock <= (med.minStockAlert ?? 50) 
                            ? 'bg-amber-100 text-amber-800' 
                            : 'bg-emerald-100 text-emerald-800'
                        }`}>
                          Stock: {med.stock}
                        </span>
                        <div className="text-[11px] font-semibold text-slate-700 mt-0.5">MRP: ₹{med.sellingPrice.toFixed(2)}</div>
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Prescribed Items Table */}
            <div className="overflow-x-auto border border-slate-100 rounded-xl">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 text-slate-500 border-b border-slate-100">
                  <tr>
                    <th className="px-3 py-2.5 font-semibold">Medicine</th>
                    {!isPharmacy && <th className="px-2 py-2.5 font-semibold">Dosage</th>}
                    {!isPharmacy && <th className="px-2 py-2.5 font-semibold">Food Timing</th>}
                    {!isPharmacy && <th className="px-2 py-2.5 font-semibold text-center">Days</th>}
                    <th className="px-2 py-2.5 font-semibold text-center">Qty</th>
                    <th className="px-2 py-2.5 font-semibold text-right">MRP (₹)</th>
                    <th className="px-2 py-2.5 font-semibold text-center">Disc %</th>
                    <th className="px-2 py-2.5 font-semibold text-right">Total (₹)</th>
                    <th className="px-2 py-2.5 font-semibold text-center"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {prescriptions.map((p) => (
                    <tr key={p.id} className="hover:bg-slate-50/50 transition-colors">
                      <td className="px-3 py-2.5 font-medium text-navy-900">
                        <div>{p.medicineName}</div>
                        <div className="text-[10px] text-slate-400 font-mono">Batch: {p.batchNo}</div>
                      </td>

                      {!isPharmacy && (
                        <td className="px-2 py-2.5">
                          <select 
                            value={p.dosage} 
                            onChange={e => updatePrescription(p.id, 'dosage', e.target.value)} 
                            className="p-1 border border-slate-200 rounded text-xs bg-white font-medium"
                          >
                            <option>1-0-1</option>
                            <option>1-1-1</option>
                            <option>1-0-0</option>
                            <option>0-0-1</option>
                            <option>SOS</option>
                          </select>
                        </td>
                      )}

                      {!isPharmacy && (
                        <td className="px-2 py-2.5">
                          <select
                            value={p.foodTiming || 'After Food'}
                            onChange={e => updatePrescription(p.id, 'foodTiming', e.target.value)}
                            className="p-1 border border-slate-200 rounded text-xs font-medium"
                          >
                            <option value="After Food">After Food</option>
                            <option value="Before Food">Before Food</option>
                            <option value="With Food">With Food</option>
                            <option value="Empty Stomach">Empty Stomach</option>
                          </select>
                        </td>
                      )}

                      {!isPharmacy && (
                        <td className="px-2 py-2.5 text-center">
                          <input 
                            type="number" 
                            min={1}
                            value={p.durationDays} 
                            onChange={e => updatePrescription(p.id, 'durationDays', parseInt(e.target.value) || 1)} 
                            className="w-12 p-1 border border-slate-200 rounded text-xs text-center" 
                          />
                        </td>
                      )}

                      <td className="px-2 py-2.5 text-center">
                        <input 
                          type="number" 
                          min={1}
                          value={p.quantity} 
                          onChange={e => updatePrescription(p.id, 'quantity', e.target.value)} 
                          className="w-14 p-1 border border-slate-200 rounded text-xs text-center font-bold text-teal-700 bg-white" 
                        />
                      </td>

                      <td className="px-2 py-2.5 text-right font-medium text-slate-600">
                        ₹{p.pricePerUnit.toFixed(2)}
                      </td>

                      <td className="px-2 py-2.5 text-center">
                        <div className="inline-flex items-center gap-0.5 justify-center">
                          <input
                            type="number"
                            min="0"
                            max="100"
                            value={p.discountPercent ?? 0}
                            onChange={e => updatePrescription(p.id, 'discountPercent', parseFloat(e.target.value) || 0)}
                            className="w-11 p-1 border border-slate-200 rounded text-xs text-center font-medium focus:ring-1 focus:ring-teal-500 outline-none"
                            placeholder="0"
                          />
                          <span className="text-[10px] text-slate-400">%</span>
                        </div>
                      </td>

                      <td className="px-2 py-2.5 text-right font-bold text-navy-900">
                        ₹{p.totalPrice.toFixed(2)}
                        {(p.discountAmount ?? 0) > 0 && (
                          <div className="text-[9px] text-emerald-600 font-normal">
                            -₹{(p.discountAmount || 0).toFixed(1)} off
                          </div>
                        )}
                      </td>

                      <td className="px-2 py-2.5 text-center">
                        <button 
                          onClick={() => removePrescription(p.id)} 
                          className="text-slate-400 hover:text-rose-500 transition-colors p-1" 
                          title="Remove Item"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </td>
                    </tr>
                  ))}

                  {prescriptions.length === 0 && (
                    <tr>
                      <td colSpan={isPharmacy ? 6 : 9} className="px-4 py-8 text-center text-slate-400 text-xs">
                        No medicines added to bill yet. Search from the box above to add medicines.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            {/* Bill Financial Summary Bar */}
            {prescriptions.length > 0 && (
              <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200 flex flex-wrap items-center justify-between gap-4 text-xs">
                <div className="flex items-center gap-4 text-slate-600">
                  <span>Total Items: <strong className="text-navy-900">{prescriptions.length}</strong></span>
                  <span>Total Qty: <strong className="text-navy-900">{prescriptions.reduce((a, p) => a + p.quantity, 0)}</strong></span>
                  {prescriptions.reduce((a, p) => a + (p.discountAmount || 0), 0) > 0 && (
                    <span className="text-emerald-700 font-bold">
                      Discount Saved: -₹{prescriptions.reduce((a, p) => a + (p.discountAmount || 0), 0).toFixed(2)}
                    </span>
                  )}
                </div>

                <div className="flex items-center gap-2">
                  <span className="text-slate-600 font-semibold">Total Payable:</span>
                  <span className="text-base font-extrabold text-navy-900">
                    ₹{(
                      (isPharmacy ? 0 : consultationFee) + 
                      prescriptions.reduce((a, p) => a + p.totalPrice + ((p.totalPrice * p.gstRate) / 100), 0)
                    ).toFixed(2)}
                  </span>
                </div>
              </div>
            )}

            {/* Final Action Button */}
            <div className="pt-2 flex justify-end">
              <button
                type="button"
                onClick={handleFinalize}
                className="bg-gradient-to-r from-teal-600 via-teal-700 to-navy-900 hover:from-teal-700 hover:to-navy-800 text-white px-6 py-3 rounded-xl font-bold text-xs flex items-center gap-2 transition-all shadow-md group"
              >
                <Smartphone className="w-4 h-4 text-teal-300" />
                <span>
                  {isPharmacy ? 'Generate Pharmacy Bill & Send WhatsApp Payment Link' : 'Generate Bill & Send WhatsApp Payment Link'}
                </span>
                <ArrowRight className="w-4 h-4 text-teal-300 group-hover:translate-x-1 transition-transform" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
