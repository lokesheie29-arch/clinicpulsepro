import { useState, useMemo, useEffect } from 'react';
import { Search, Trash2, ArrowRight, Smartphone, CheckCircle } from 'lucide-react';
import { useAppState } from '../../context/AppStateContext';
import { doctors } from '../../data/mockData';
import { PrescriptionItem, PatientDetails } from '../../types';
import { v4 as uuidv4 } from 'uuid';

export const OpdConsultation = ({ onComplete }: { onComplete: (invoiceId: string, patientPhone: string, total: number, billId: string) => void }) => {
  const { medicines, addInvoice, updateMedicineStock, orgType } = useAppState();
  const isPharmacy = orgType === 'pharmacy';

  const [patient, setPatient] = useState<PatientDetails>({
    name: '', age: 0, gender: 'Male', phone: '', complaints: '', bp: '', pulse: '', temp: '', spo2: '', weight: ''
  });
  const [doctorId, setDoctorId] = useState(doctors[0].id);
  // Pharmacy has no consultation fee
  const [consultationFee, setConsultationFee] = useState(isPharmacy ? 0 : 500);
  const [prescriptions, setPrescriptions] = useState<PrescriptionItem[]>([]);
  const [searchQuery, setSearchQuery] = useState('');

  // Keep fee at 0 if orgType switches to pharmacy
  useEffect(() => {
    if (isPharmacy) setConsultationFee(0);
  }, [isPharmacy]);

  const filteredMedicines = useMemo(() => {
    if (!searchQuery) return [];
    return medicines.filter(m =>
      m.brandName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      m.genericName.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [searchQuery, medicines]);

  const addPrescription = (medId: string) => {
    const med = medicines.find(m => m.id === medId);
    if (!med) return;
    
    const qty = 6;
    const gross = med.sellingPrice * qty;
    setPrescriptions([...prescriptions, {
      id: uuidv4(),
      medicineId: med.id,
      medicineName: med.brandName,
      batchNo: med.batchNo,
      expiryDate: med.expiryDate,
      hsn: med.hsn,
      dosage: '1-0-1',
      durationDays: 3,
      quantity: qty,
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
        // Recalculate quantity and price if dosage, duration or discount changes
        if (field === 'dosage' || field === 'durationDays') {
          const timesPerDay = (updated.dosage.match(/1/g) || []).length || (updated.dosage === 'SOS' ? 1 : 1);
          updated.quantity = timesPerDay * updated.durationDays;
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

  const handleFinalize = () => {
    if (!patient.name || !patient.phone) {
      alert('Please fill at least Patient Name and Phone.');
      return;
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

    const invoice = {
      id: billId,
      patient,
      doctorId,
      consultationFee: effectiveFee,
      prescriptionItems: prescriptions,
      subTotal,
      totalDiscount,
      cgst,
      sgst,
      totalAmount,
      date: new Date().toISOString(),
      paymentStatus: 'Pending' as const
    };

    addInvoice(invoice);

    // Deduct stock
    prescriptions.forEach(p => {
      updateMedicineStock(p.medicineId, p.quantity);
    });

    // Auto-dispatch WhatsApp payment link to patient's phone
    const cleanPhone = patient.phone.replace(/\D/g, '');
    const vpa = "clinicpulse@upi";
    const upiString = `upi://pay?pa=${vpa}&pn=ClinicPulse&am=${totalAmount.toFixed(2)}&cu=INR&tn=Invoice-${billId}`;
    const medSummary = prescriptions.map(p => `• ${p.medicineName} (${p.quantity} qty)`).join('%0A');
    const waText = `*${isPharmacy ? 'Pharmacy Bill' : 'Medical Tax Invoice'} %26 Payment Link - Bill %23${billId}*%0A%0AHello *${patient.name}*,%0AYour medical bill has been generated.%0A%0A*Amount Due:* ₹${totalAmount.toFixed(2)}%0A*Payment Link (Instant UPI):*%0A${encodeURIComponent(upiString)}%0A%0A*Medicines:*%0A${medSummary}%0A%0APlease pay using the UPI link above. Once payment is done, your official PDF bill will be generated and sent automatically!%0A%0A*** WISH YOU A SPEEDY RECOVERY ***`;

    if (cleanPhone) {
      window.open(`https://wa.me/91${cleanPhone}?text=${waText}`, '_blank');
    }

    onComplete(invoice.id, patient.phone, totalAmount, billId);
  };


  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
      {/* Left: Patient Details & Vitals */}
      <div className="lg:col-span-1 space-y-6">
        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
          <h3 className="text-lg font-semibold text-navy-900 mb-4 border-b pb-2">Patient Details</h3>
          <div className="space-y-4">
            <div>
              <label className="block text-xs font-medium text-slate-500 mb-1">Full Name *</label>
              <input type="text" value={patient.name} onChange={e => setPatient({...patient, name: e.target.value})} className="w-full p-2 border border-slate-200 rounded-md focus:ring-2 focus:ring-teal-500 outline-none text-sm" placeholder="e.g. Rahul Sharma" />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium text-slate-500 mb-1">Age</label>
                <input type="number" value={patient.age || ''} onChange={e => setPatient({...patient, age: parseInt(e.target.value) || 0})} className="w-full p-2 border border-slate-200 rounded-md focus:ring-2 focus:ring-teal-500 outline-none text-sm" />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-500 mb-1">Gender</label>
                <select value={patient.gender} onChange={e => setPatient({...patient, gender: e.target.value})} className="w-full p-2 border border-slate-200 rounded-md focus:ring-2 focus:ring-teal-500 outline-none text-sm">
                  <option>Male</option><option>Female</option><option>Other</option>
                </select>
              </div>
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-500 mb-1">WhatsApp Phone *</label>
              <input type="tel" value={patient.phone} onChange={e => setPatient({...patient, phone: e.target.value})} className="w-full p-2 border border-slate-200 rounded-md focus:ring-2 focus:ring-teal-500 outline-none text-sm" placeholder="10-digit number" />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-500 mb-1">Chief Complaints</label>
              <textarea value={patient.complaints} onChange={e => setPatient({...patient, complaints: e.target.value})} className="w-full p-2 border border-slate-200 rounded-md focus:ring-2 focus:ring-teal-500 outline-none text-sm h-20" placeholder="Symptoms..."></textarea>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
          <h3 className="text-lg font-semibold text-navy-900 mb-4 border-b pb-2">Vitals</h3>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-slate-500 mb-1">BP (mmHg)</label>
              <input type="text" value={patient.bp} onChange={e => setPatient({...patient, bp: e.target.value})} className="w-full p-2 border border-slate-200 rounded-md outline-none text-sm" placeholder="120/80" />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-500 mb-1">Pulse (bpm)</label>
              <input type="text" value={patient.pulse} onChange={e => setPatient({...patient, pulse: e.target.value})} className="w-full p-2 border border-slate-200 rounded-md outline-none text-sm" placeholder="72" />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-500 mb-1">Temp (°F)</label>
              <input type="text" value={patient.temp} onChange={e => setPatient({...patient, temp: e.target.value})} className="w-full p-2 border border-slate-200 rounded-md outline-none text-sm" placeholder="98.6" />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-500 mb-1">SpO2 (%)</label>
              <input type="text" value={patient.spo2} onChange={e => setPatient({...patient, spo2: e.target.value})} className="w-full p-2 border border-slate-200 rounded-md outline-none text-sm" placeholder="99" />
            </div>
            <div className="col-span-2">
              <label className="block text-xs font-medium text-slate-500 mb-1">Weight (kg)</label>
              <input type="text" value={patient.weight} onChange={e => setPatient({...patient, weight: e.target.value})} className="w-full p-2 border border-slate-200 rounded-md outline-none text-sm" placeholder="e.g. 70" />
            </div>
          </div>
        </div>
      </div>

      {/* Right: Doctor & Prescription */}
      <div className="lg:col-span-2 space-y-6">
        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm flex flex-col md:flex-row gap-4 justify-between items-start md:items-center">
          <div className="flex-1 w-full">
            <label className="block text-xs font-medium text-slate-500 mb-1">
              {isPharmacy ? 'Prescribing Doctor (Optional / Direct)' : 'Consulting Doctor'}
            </label>
            <select value={doctorId} onChange={e => setDoctorId(e.target.value)} className="w-full p-2 border border-slate-200 rounded-md outline-none text-sm">
              {doctors.map(d => (
                <option key={d.id} value={d.id}>{d.name} ({d.specialty})</option>
              ))}
            </select>
          </div>
          {isPharmacy ? (
            <div className="w-full md:w-56 p-2.5 bg-amber-50 border border-amber-200 rounded-lg text-xs text-amber-800 flex items-center justify-center font-medium">
              <span>💊 Pharmacy Sale (Zero Consultation Fee)</span>
            </div>
          ) : (
            <div className="w-full md:w-48">
              <label className="block text-xs font-medium text-slate-500 mb-1">Consultation Fee (₹)</label>
              <input type="number" value={consultationFee} onChange={e => setConsultationFee(parseInt(e.target.value) || 0)} className="w-full p-2 border border-slate-200 rounded-md outline-none text-sm font-semibold text-teal-700" />
            </div>
          )}
        </div>

        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm min-h-[350px] flex flex-col">
          <div className="flex justify-between items-center mb-4 border-b pb-2">
            <h3 className="text-lg font-semibold text-navy-900">
              {isPharmacy ? 'Pharmacy Dispensing Studio' : 'Rx - Prescription Studio'}
            </h3>
            {isPharmacy && (
              <span className="text-xs bg-teal-50 text-teal-700 font-semibold px-2.5 py-1 rounded-full border border-teal-200">
                Medical Store POS
              </span>
            )}
          </div>
          
          <div className="relative mb-6">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Search className="h-4 w-4 text-slate-400" />
            </div>
            <input
              type="text"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="w-full pl-10 p-3 border border-slate-200 rounded-lg focus:ring-2 focus:ring-teal-500 outline-none text-sm"
              placeholder="Search medicines by brand or generic name..."
            />
            {filteredMedicines.length > 0 && (
              <div className="absolute z-10 w-full mt-1 bg-white border border-slate-200 rounded-lg shadow-lg max-h-48 overflow-y-auto">
                {filteredMedicines.map(med => (
                  <button
                    key={med.id}
                    onClick={() => addPrescription(med.id)}
                    className="w-full text-left px-4 py-2 hover:bg-slate-50 border-b last:border-0 flex justify-between items-center"
                  >
                    <div>
                      <div className="font-medium text-navy-900 text-sm">{med.brandName}</div>
                      <div className="text-xs text-slate-500">{med.genericName}</div>
                    </div>
                    <div className="text-xs font-medium text-teal-600">Stock: {med.stock}</div>
                  </button>
                ))}
              </div>
            )}
          </div>

          <div className="flex-1 overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead className="text-xs text-slate-500 bg-slate-50">
                <tr>
                  <th className="px-3 py-2 rounded-tl-lg">Medicine</th>
                  <th className="px-2 py-2">Dosage</th>
                  <th className="px-2 py-2">Food Timing</th>
                  <th className="px-2 py-2 text-center">Days</th>
                  <th className="px-2 py-2 text-center">Qty</th>
                  <th className="px-2 py-2 text-right">MRP (₹)</th>
                  <th className="px-2 py-2 text-center">Disc %</th>
                  <th className="px-2 py-2 text-right">Total (₹)</th>
                  <th className="px-2 py-2 rounded-tr-lg"></th>
                </tr>
              </thead>
              <tbody>
                {prescriptions.map((p) => (
                  <tr key={p.id} className="border-b border-slate-100 last:border-0 hover:bg-slate-50/50">
                    <td className="px-3 py-3 font-medium text-navy-900">{p.medicineName}</td>
                    <td className="px-2 py-3">
                      <select value={p.dosage} onChange={e => updatePrescription(p.id, 'dosage', e.target.value)} className="p-1 border border-slate-200 rounded text-xs bg-white font-medium">
                        <option>1-0-1</option>
                        <option>1-1-1</option>
                        <option>1-0-0</option>
                        <option>0-0-1</option>
                        <option>SOS</option>
                      </select>
                    </td>
                    <td className="px-2 py-3">
                      <select
                        value={p.foodTiming || 'After Food'}
                        onChange={e => updatePrescription(p.id, 'foodTiming', e.target.value)}
                        className={`p-1.5 border rounded text-xs font-semibold ${
                          (p.foodTiming || 'After Food') === 'After Food'
                            ? 'bg-blue-50 text-blue-700 border-blue-200'
                            : (p.foodTiming || 'After Food') === 'Before Food'
                            ? 'bg-amber-50 text-amber-700 border-amber-200'
                            : (p.foodTiming || 'After Food') === 'Empty Stomach'
                            ? 'bg-rose-50 text-rose-700 border-rose-200'
                            : 'bg-emerald-50 text-emerald-700 border-emerald-200'
                        }`}
                      >
                        <option value="After Food">After Food (Post-Meal)</option>
                        <option value="Before Food">Before Food (Pre-Meal)</option>
                        <option value="With Food">With Food</option>
                        <option value="Empty Stomach">Empty Stomach</option>
                      </select>
                    </td>
                    <td className="px-2 py-3 text-center">
                      <input type="number" value={p.durationDays} onChange={e => updatePrescription(p.id, 'durationDays', parseInt(e.target.value) || 1)} className="w-14 p-1 border border-slate-200 rounded text-xs text-center" />
                    </td>
                    <td className="px-2 py-3 text-center font-semibold text-teal-700">{p.quantity}</td>
                    <td className="px-2 py-3 text-right font-medium text-slate-600">
                      ₹{p.pricePerUnit.toFixed(2)}
                    </td>
                    <td className="px-2 py-3 text-center">
                      <div className="inline-flex items-center gap-0.5 justify-center">
                        <input
                          type="number"
                          min="0"
                          max="100"
                          value={p.discountPercent ?? 0}
                          onChange={e => updatePrescription(p.id, 'discountPercent', parseFloat(e.target.value) || 0)}
                          className="w-12 p-1 border border-slate-200 rounded text-xs text-center font-medium focus:ring-1 focus:ring-teal-500 outline-none"
                          placeholder="0"
                        />
                        <span className="text-[10px] text-slate-400">%</span>
                      </div>
                    </td>
                    <td className="px-2 py-3 text-right font-bold text-slate-800">
                      ₹{p.totalPrice.toFixed(2)}
                      {(p.discountAmount ?? 0) > 0 && (
                        <div className="text-[10px] text-emerald-600 font-normal">
                          -₹{(p.discountAmount || 0).toFixed(1)} off
                        </div>
                      )}
                    </td>
                    <td className="px-2 py-3 text-right">
                      <button onClick={() => removePrescription(p.id)} className="text-slate-400 hover:text-red-500 transition-colors p-1" title="Remove Medicine">
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </td>
                  </tr>
                ))}
                {prescriptions.length === 0 && (
                  <tr>
                    <td colSpan={9} className="px-3 py-8 text-center text-slate-400 text-sm">
                      No medicines added yet. Search above to add.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
          
          <div className="mt-4 pt-4 border-t border-slate-200 flex justify-end">
            <button
              onClick={handleFinalize}
              className="flex items-center space-x-2 bg-teal-600 hover:bg-teal-700 text-white px-6 py-3 rounded-lg font-medium transition-colors shadow-sm"
            >
              <Smartphone className="h-4 w-4" />
              <span>Generate Bill & Send WhatsApp Payment Link</span>
              <ArrowRight className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
