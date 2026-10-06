import { useState, useMemo } from 'react';
import { Search, Trash2, ArrowRight } from 'lucide-react';
import { useAppState } from '../../context/AppStateContext';
import { doctors } from '../../data/mockData';
import { PrescriptionItem, PatientDetails } from '../../types';
import { v4 as uuidv4 } from 'uuid';

export const OpdConsultation = ({ onComplete }: { onComplete: (invoiceId: string) => void }) => {
  const { medicines, addInvoice, updateMedicineStock } = useAppState();
  
  const [patient, setPatient] = useState<PatientDetails>({
    name: '', age: 0, gender: 'Male', phone: '', complaints: '', bp: '', pulse: '', temp: '', spo2: '', weight: ''
  });
  const [doctorId, setDoctorId] = useState(doctors[0].id);
  const [consultationFee, setConsultationFee] = useState(500);
  const [prescriptions, setPrescriptions] = useState<PrescriptionItem[]>([]);
  const [searchQuery, setSearchQuery] = useState('');

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
    
    setPrescriptions([...prescriptions, {
      id: uuidv4(),
      medicineId: med.id,
      medicineName: med.brandName,
      batchNo: med.batchNo,
      expiryDate: med.expiryDate,
      hsn: med.hsn,
      dosage: '1-0-1',
      durationDays: 3,
      quantity: 6,
      pricePerUnit: med.sellingPrice,
      totalPrice: med.sellingPrice * 6,
      gstRate: med.gstRate
    }]);
    setSearchQuery('');
  };

  const updatePrescription = (id: string, field: keyof PrescriptionItem, value: any) => {
    setPrescriptions(prev => prev.map(p => {
      if (p.id === id) {
        const updated = { ...p, [field]: value };
        // Recalculate quantity and price if dosage or duration changes
        if (field === 'dosage' || field === 'durationDays') {
          const timesPerDay = (updated.dosage.match(/1/g) || []).length || (updated.dosage === 'SOS' ? 1 : 1);
          updated.quantity = timesPerDay * updated.durationDays;
          updated.totalPrice = updated.quantity * updated.pricePerUnit;
        }
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

    const subTotal = consultationFee + prescriptions.reduce((acc, p) => acc + p.totalPrice, 0);
    // Rough GST calc: assuming consultation is 18% GST (9+9) and medicines are separate.
    // For simplicity in demo, let's calculate exact CGST/SGST per item
    let cgst = consultationFee * 0.09;
    let sgst = consultationFee * 0.09;

    prescriptions.forEach(p => {
      const tax = (p.totalPrice * p.gstRate) / 100;
      cgst += tax / 2;
      sgst += tax / 2;
    });

    const invoice = {
      id: `INV-${Math.floor(1000 + Math.random() * 9000)}`,
      patient,
      doctorId,
      consultationFee,
      prescriptionItems: prescriptions,
      subTotal,
      cgst,
      sgst,
      totalAmount: subTotal + cgst + sgst,
      date: new Date().toISOString(),
      paymentStatus: 'Pending' as const
    };

    addInvoice(invoice);
    
    // Deduct stock
    prescriptions.forEach(p => {
      updateMedicineStock(p.medicineId, p.quantity);
    });

    onComplete(invoice.id);
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
          </div>
        </div>
      </div>

      {/* Right: Doctor & Prescription */}
      <div className="lg:col-span-2 space-y-6">
        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm flex flex-col md:flex-row gap-4 justify-between items-start md:items-center">
          <div className="flex-1 w-full">
            <label className="block text-xs font-medium text-slate-500 mb-1">Consulting Doctor</label>
            <select value={doctorId} onChange={e => setDoctorId(e.target.value)} className="w-full p-2 border border-slate-200 rounded-md outline-none text-sm">
              {doctors.map(d => (
                <option key={d.id} value={d.id}>{d.name} ({d.specialty})</option>
              ))}
            </select>
          </div>
          <div className="w-full md:w-48">
            <label className="block text-xs font-medium text-slate-500 mb-1">Consultation Fee (₹)</label>
            <input type="number" value={consultationFee} onChange={e => setConsultationFee(parseInt(e.target.value) || 0)} className="w-full p-2 border border-slate-200 rounded-md outline-none text-sm font-semibold text-teal-700" />
          </div>
        </div>

        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm min-h-[350px] flex flex-col">
          <h3 className="text-lg font-semibold text-navy-900 mb-4 border-b pb-2">Rx - Prescription Studio</h3>
          
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
                  <th className="px-3 py-2">Dosage</th>
                  <th className="px-3 py-2">Days</th>
                  <th className="px-3 py-2 text-center">Qty</th>
                  <th className="px-3 py-2 rounded-tr-lg"></th>
                </tr>
              </thead>
              <tbody>
                {prescriptions.map((p) => (
                  <tr key={p.id} className="border-b border-slate-100 last:border-0">
                    <td className="px-3 py-3 font-medium text-navy-900">{p.medicineName}</td>
                    <td className="px-3 py-3">
                      <select value={p.dosage} onChange={e => updatePrescription(p.id, 'dosage', e.target.value)} className="p-1 border border-slate-200 rounded text-xs bg-white">
                        <option>1-0-1</option>
                        <option>1-1-1</option>
                        <option>1-0-0</option>
                        <option>0-0-1</option>
                        <option>SOS</option>
                      </select>
                    </td>
                    <td className="px-3 py-3">
                      <input type="number" value={p.durationDays} onChange={e => updatePrescription(p.id, 'durationDays', parseInt(e.target.value) || 1)} className="w-16 p-1 border border-slate-200 rounded text-xs text-center" />
                    </td>
                    <td className="px-3 py-3 text-center font-semibold text-teal-700">{p.quantity}</td>
                    <td className="px-3 py-3 text-right">
                      <button onClick={() => removePrescription(p.id)} className="text-slate-400 hover:text-red-500 transition-colors">
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </td>
                  </tr>
                ))}
                {prescriptions.length === 0 && (
                  <tr>
                    <td colSpan={5} className="px-3 py-8 text-center text-slate-400 text-sm">
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
              <span>Finalize & Generate Tax Invoice</span>
              <ArrowRight className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
