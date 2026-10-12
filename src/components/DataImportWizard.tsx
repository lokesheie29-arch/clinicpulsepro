import React, { useState } from 'react';
import {
  Upload,
  FileSpreadsheet,
  Download,
  CheckCircle,
  AlertCircle,
  X,
  FileText,
  Pill,
  Users,
  Stethoscope,
  ArrowRight,
  Database
} from 'lucide-react';
import { useAppState } from '../context/AppStateContext';
import { Medicine, Invoice } from '../types';
import confetti from 'canvas-confetti';

interface DataImportWizardProps {
  isOpen: boolean;
  onClose: () => void;
}

type ImportType = 'medicines' | 'patients' | 'consultations';

export const DataImportWizard: React.FC<DataImportWizardProps> = ({ isOpen, onClose }) => {
  const { bulkAddMedicines, bulkAddInvoices } = useAppState();

  const [activeType, setActiveType] = useState<ImportType>('medicines');
  const [parsedData, setParsedData] = useState<any[]>([]);
  const [fileName, setFileName] = useState('');
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [isImporting, setIsImporting] = useState(false);

  if (!isOpen) return null;

  // 1. Download Sample Templates
  const downloadSampleTemplate = (type: ImportType) => {
    let csvContent = '';
    let downloadName = '';

    if (type === 'medicines') {
      csvContent = `generic_name,brand_name,category,batch_no,hsn,cost_price,selling_price,gst_rate,stock,expiry_date\n` +
        `Paracetamol 650mg,Dolo 650,Antipyretic,DL-8910,3004,1.80,3.50,12,120,2027-04-30\n` +
        `Amoxicillin 500mg,Mox 500,Antibiotic,MX-4421,3004,6.20,11.00,12,85,2026-11-30\n` +
        `Azithromycin 500mg,Azee 500,Antibiotic,AZ-2091,3004,18.00,28.50,12,45,2027-01-31\n` +
        `Cetirizine 10mg,Cetzine,Antihistamine,CZ-1102,3004,1.20,2.80,12,200,2027-08-31\n` +
        `Pantoprazole 40mg,Pan 40,Antacid,PN-7788,3004,4.50,9.00,12,90,2026-12-31`;
      downloadName = 'sample_medicines_inventory.csv';
    } else if (type === 'patients') {
      csvContent = `name,phone,age,gender,complaints,bp,pulse,temp,spo2,weight\n` +
        `Ramesh Babu,9876543210,48,Male,Fever & persistent bodyache,120/80,78,99.1,98%,72\n` +
        `Sunita Devi,9876543211,36,Female,Dry cough & throat irritation,118/76,72,98.6,99%,58\n` +
        `Vigneshwaran K,9876543212,29,Male,Acute acidity & indigestion,130/85,82,98.4,97%,68\n` +
        `Lakshmi Narayanan,9876543213,62,Male,Routine diabetic checkup,135/88,75,98.6,98%,75`;
      downloadName = 'sample_patients_directory.csv';
    } else {
      csvContent = `patient_name,patient_phone,doctor_name,date,consultation_fee,diagnosis,total_amount,payment_status\n` +
        `Arun Kumar,9840123456,Dr. Rahul Sharma,2026-10-01,500,Viral Pyrexia,750,Paid\n` +
        `Meenakshi S,9840123457,Dr. Priya Desai,2026-10-02,600,Upper Respiratory Infection,920,Paid\n` +
        `Karthik Raj,9840123458,Dr. Rahul Sharma,2026-10-03,500,Gastroenteritis,680,Paid`;
      downloadName = 'sample_past_consultations.csv';
    }

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', downloadName);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // 2. Parse CSV Client-Side
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setFileName(file.name);
    setError('');
    setSuccessMsg('');

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const text = event.target?.result as string;
        const lines = text.split(/\r?\n/).filter(line => line.trim() !== '');

        if (lines.length < 2) {
          setError('CSV file appears to be empty or missing data rows.');
          return;
        }

        const headers = lines[0].split(',').map(h => h.trim().toLowerCase().replace(/["']/g, ''));
        const rows: any[] = [];

        for (let i = 1; i < lines.length; i++) {
          // Simple CSV splitter handling potential basic commas
          const currentLine = lines[i].split(',').map(item => item.trim().replace(/^["']|["']$/g, ''));
          if (currentLine.length >= 2) {
            const rowObj: any = {};
            headers.forEach((header, index) => {
              rowObj[header] = currentLine[index] || '';
            });
            rows.push(rowObj);
          }
        }

        setParsedData(rows);
      } catch (err) {
        console.error('Failed to parse file:', err);
        setError('Error reading CSV file. Please ensure it is a valid CSV format.');
      }
    };
    reader.readAsText(file);
  };

  // 3. Ingest into AppState
  const handleConfirmImport = () => {
    if (parsedData.length === 0) return;
    setIsImporting(true);

    try {
      if (activeType === 'medicines') {
        const newMedicines: Medicine[] = parsedData.map((row, idx) => ({
          id: `med-import-${Date.now()}-${idx}`,
          genericName: row.generic_name || row.genericname || 'Generic Medicine',
          brandName: row.brand_name || row.brandname || 'Brand Medicine',
          category: row.category || 'General',
          batchNo: row.batch_no || row.batch || `BTH-${Math.floor(1000 + Math.random() * 9000)}`,
          hsn: row.hsn || '3004',
          costPrice: Number(row.cost_price || row.costprice) || 0,
          sellingPrice: Number(row.selling_price || row.sellingprice || row.price) || 10,
          gstRate: Number(row.gst_rate || row.gstrate) || 12,
          stock: Number(row.stock || row.quantity || row.qty) || 50,
          expiryDate: row.expiry_date || row.expiry || new Date(Date.now() + 31536000000).toISOString().split('T')[0]
        }));

        bulkAddMedicines(newMedicines);
        setSuccessMsg(`Successfully imported ${newMedicines.length} medicine records into your FEFO pharmacy inventory!`);
      } else if (activeType === 'consultations') {
        const newInvoices: Invoice[] = parsedData.map((row, idx) => ({
          id: `INV-IMP-${Date.now()}-${idx}`,
          patient: {
            name: row.patient_name || 'Imported Patient',
            phone: row.patient_phone || row.phone || '9876543210',
            age: Number(row.age) || 35,
            gender: 'Male',
            complaints: row.diagnosis || 'Past Consultation',
            bp: row.bp || '120/80',
            pulse: row.pulse || '72',
            temp: row.temp || '98.6',
            spo2: row.spo2 || '98%',
            weight: row.weight || '65'
          },
          doctorId: 'doc-1',
          consultationFee: Number(row.consultation_fee) || 500,
          prescriptionItems: [],
          subTotal: Number(row.total_amount) || 500,
          cgst: 0,
          sgst: 0,
          totalAmount: Number(row.total_amount) || 500,
          date: row.date ? new Date(row.date).toISOString() : new Date().toISOString(),
          paymentStatus: (row.payment_status?.toLowerCase() === 'paid' ? 'Paid' : 'Pending') as 'Paid' | 'Pending'
        }));

        bulkAddInvoices(newInvoices);
        setSuccessMsg(`Successfully imported ${newInvoices.length} historical consultation & billing records!`);
      } else if (activeType === 'patients') {
        // Patient directory import: save to local patients storage
        const currentSaved = JSON.parse(localStorage.getItem('clinicpulse_patient_directory') || '[]');
        const updated = [...parsedData, ...currentSaved];
        localStorage.setItem('clinicpulse_patient_directory', JSON.stringify(updated));
        setSuccessMsg(`Successfully imported ${parsedData.length} patient profiles into your clinic directory!`);
      }

      confetti({
        particleCount: 80,
        spread: 60,
        origin: { y: 0.6 }
      });

      setParsedData([]);
      setFileName('');
      setTimeout(() => {
        setSuccessMsg('');
        onClose();
      }, 1800);
    } catch (err) {
      console.error('Import failed:', err);
      setError('Failed to import records. Please check the data rows and try again.');
    } finally {
      setIsImporting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
      <div className="bg-white rounded-3xl shadow-2xl border border-slate-200 w-full max-w-3xl overflow-hidden flex flex-col max-h-[90vh]">
        
        {/* Header */}
        <div className="bg-gradient-to-r from-teal-900 via-navy-900 to-slate-900 text-white p-6 relative shrink-0">
          <button
            onClick={onClose}
            className="absolute top-5 right-5 text-slate-400 hover:text-white p-1 rounded-xl transition-colors"
          >
            <X className="h-5 w-5" />
          </button>

          <div className="flex items-center space-x-4">
            <div className="w-12 h-12 rounded-2xl bg-teal-500/20 border border-teal-400/40 flex items-center justify-center text-teal-300">
              <FileSpreadsheet className="h-6 w-6" />
            </div>
            <div>
              <h2 className="text-xl font-bold">Onboarding & Data Migration Wizard</h2>
              <p className="text-teal-300 text-xs mt-0.5">
                Import your existing CSV/Excel spreadsheets directly into your clinic database
              </p>
            </div>
          </div>

          {/* Migration Type Selectors */}
          <div className="flex space-x-2 mt-6 border-b border-white/10 pb-0">
            <button
              onClick={() => { setActiveType('medicines'); setParsedData([]); setFileName(''); setError(''); }}
              className={`pb-2.5 px-3 text-xs font-semibold flex items-center gap-2 border-b-2 transition-all ${
                activeType === 'medicines'
                  ? 'border-teal-400 text-teal-300'
                  : 'border-transparent text-slate-300 hover:text-white'
              }`}
            >
              <Pill className="h-3.5 w-3.5" />
              <span>Medicine Inventory</span>
            </button>
            <button
              onClick={() => { setActiveType('patients'); setParsedData([]); setFileName(''); setError(''); }}
              className={`pb-2.5 px-3 text-xs font-semibold flex items-center gap-2 border-b-2 transition-all ${
                activeType === 'patients'
                  ? 'border-teal-400 text-teal-300'
                  : 'border-transparent text-slate-300 hover:text-white'
              }`}
            >
              <Users className="h-3.5 w-3.5" />
              <span>Patient Records</span>
            </button>
            <button
              onClick={() => { setActiveType('consultations'); setParsedData([]); setFileName(''); setError(''); }}
              className={`pb-2.5 px-3 text-xs font-semibold flex items-center gap-2 border-b-2 transition-all ${
                activeType === 'consultations'
                  ? 'border-teal-400 text-teal-300'
                  : 'border-transparent text-slate-300 hover:text-white'
              }`}
            >
              <Stethoscope className="h-3.5 w-3.5" />
              <span>Past Consultations & Bills</span>
            </button>
          </div>
        </div>

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto flex-1 space-y-6">
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-600 text-xs p-3.5 rounded-xl flex items-center gap-2">
              <AlertCircle className="h-4 w-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}
          {successMsg && (
            <div className="bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs p-3.5 rounded-xl flex items-center gap-2">
              <CheckCircle className="h-4 w-4 text-emerald-600 shrink-0" />
              <span>{successMsg}</span>
            </div>
          )}

          {/* Step 1: Download Template */}
          <div className="bg-slate-50 border border-slate-200 p-4 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h4 className="text-xs font-bold uppercase tracking-wider text-navy-900">
                Step 1: Download Standard Template
              </h4>
              <p className="text-xs text-slate-500 mt-0.5">
                Download the pre-formatted CSV template with the expected column headers.
              </p>
            </div>
            <button
              type="button"
              onClick={() => downloadSampleTemplate(activeType)}
              className="inline-flex items-center gap-2 px-3.5 py-2 bg-white border border-slate-200 hover:border-teal-500 hover:text-teal-700 text-slate-700 text-xs font-bold rounded-xl transition-all shadow-sm shrink-0"
            >
              <Download className="h-3.5 w-3.5" />
              <span>Download Sample CSV</span>
            </button>
          </div>

          {/* Step 2: Upload File */}
          <div className="border-2 border-dashed border-slate-300 hover:border-teal-500 rounded-2xl p-8 text-center transition-colors bg-slate-50/50">
            <Upload className="h-10 w-10 text-slate-400 mx-auto mb-3" />
            <h4 className="text-sm font-bold text-navy-900 mb-1">
              Step 2: Upload your populated CSV file
            </h4>
            <p className="text-xs text-slate-500 mb-4 max-w-sm mx-auto">
              Choose your CSV export from your old software or Excel sheet.
            </p>

            <label className="inline-flex items-center gap-2 px-5 py-2.5 bg-teal-600 hover:bg-teal-700 text-white rounded-xl text-xs font-bold cursor-pointer transition-colors shadow-sm">
              <FileText className="h-4 w-4" />
              <span>{fileName ? `Change File (${fileName})` : 'Select CSV File'}</span>
              <input
                type="file"
                accept=".csv,.txt"
                className="hidden"
                onChange={handleFileUpload}
              />
            </label>
          </div>

          {/* Step 3: Preview Data */}
          {parsedData.length > 0 && (
            <div>
              <div className="flex items-center justify-between mb-3">
                <h4 className="text-xs font-bold uppercase tracking-wider text-navy-900 flex items-center gap-2">
                  <Database className="h-3.5 w-3.5 text-teal-600" />
                  <span>Preview Data ({parsedData.length} records detected)</span>
                </h4>
                <span className="text-[11px] text-slate-500 font-medium">Ready to import</span>
              </div>

              <div className="border border-slate-200 rounded-2xl overflow-hidden max-h-56 overflow-y-auto">
                <table className="w-full text-xs text-left">
                  <thead className="bg-slate-100 text-slate-600 font-semibold border-b border-slate-200 sticky top-0">
                    <tr>
                      {Object.keys(parsedData[0]).slice(0, 5).map(header => (
                        <th key={header} className="p-2.5 uppercase tracking-wider text-[10px]">
                          {header.replace(/_/g, ' ')}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 bg-white">
                    {parsedData.slice(0, 8).map((row, idx) => (
                      <tr key={idx} className="hover:bg-slate-50">
                        {Object.values(row).slice(0, 5).map((val: any, vIdx) => (
                          <td key={vIdx} className="p-2.5 font-medium text-slate-800 truncate max-w-[150px]">
                            {String(val || '-')}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              {parsedData.length > 8 && (
                <p className="text-[11px] text-slate-400 mt-1 italic">
                  Showing first 8 of {parsedData.length} total rows.
                </p>
              )}
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="p-5 border-t border-slate-100 bg-slate-50 flex items-center justify-between shrink-0">
          <p className="text-xs text-slate-400">
            Records will be synced to your clinic database and FEFO inventory.
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
              disabled={parsedData.length === 0 || isImporting}
              onClick={handleConfirmImport}
              className="px-6 py-2.5 text-sm font-bold bg-teal-600 hover:bg-teal-700 text-white rounded-xl shadow-md transition-colors disabled:opacity-50 flex items-center gap-2"
            >
              {isImporting ? 'Ingesting Records...' : `Import ${parsedData.length} Records`}
              <ArrowRight className="h-4 w-4" />
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};
