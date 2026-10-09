import { useState } from 'react';
import { Microscope, Search, Plus, Trash2, ArrowRight, CheckCircle, Share2, Mail, FileText } from 'lucide-react';
import { useAppState } from '../../context/AppStateContext';
import { LabTest, LabTestOrder, LabReport, PatientDetails, Invoice } from '../../types';
import { v4 as uuidv4 } from 'uuid';

export const LabDiagnostics = ({ onSwitchTab }: { onSwitchTab: (tab: string) => void }) => {
  const { labTests, labReports, addLabReport, addInvoice, updateLabReport } = useAppState();
  
  // Left Side: Ordering
  const [patient, setPatient] = useState<PatientDetails>({
    name: '', age: 0, gender: 'Male', phone: '',
    complaints: 'Lab Tests', bp: '', pulse: '', temp: '', spo2: '', weight: ''
  });
  
  const [searchQuery, setSearchQuery] = useState('');
  const [orderedTests, setOrderedTests] = useState<LabTestOrder[]>([]);
  
  // Right Side: Reports
  const [selectedReportId, setSelectedReportId] = useState<string | null>(null);
  const selectedReport = labReports.find(r => r.id === selectedReportId);

  const filteredTests = labTests.filter(t => 
    t.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
    t.category.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleAddTest = (test: LabTest) => {
    if (!orderedTests.find(t => t.testId === test.id)) {
      setOrderedTests([...orderedTests, {
        id: uuidv4(),
        testId: test.id,
        testName: test.name,
        price: test.price,
        referenceRange: test.referenceRange,
        unit: test.unit
      }]);
    }
  };

  const removeTest = (id: string) => setOrderedTests(orderedTests.filter(t => t.id !== id));

  const totalCost = orderedTests.reduce((sum, t) => sum + t.price, 0);

  const handleFinalizeOrder = () => {
    if (!patient.name || orderedTests.length === 0) return alert('Enter patient name and select tests.');

    const newReport: LabReport = {
      id: `LR-${Math.floor(1000 + Math.random() * 9000)}`,
      patient,
      doctorId: 'doc-1', // Default or selected doctor
      tests: orderedTests,
      date: new Date().toISOString(),
      status: 'Pending'
    };

    const newInvoice: Invoice = {
      id: `INV-LAB-${Math.floor(1000 + Math.random() * 9000)}`,
      patient,
      doctorId: 'doc-1',
      consultationFee: 0,
      prescriptionItems: [],
      labItems: orderedTests,
      subTotal: totalCost,
      cgst: 0,
      sgst: 0,
      totalAmount: totalCost,
      date: new Date().toISOString(),
      paymentStatus: 'Pending'
    };

    addLabReport(newReport);
    addInvoice(newInvoice);
    
    // Reset form
    setPatient({ name: '', age: 0, gender: 'Male', phone: '', complaints: 'Lab Tests', bp: '', pulse: '', temp: '', spo2: '', weight: '' });
    setOrderedTests([]);
    setSelectedReportId(newReport.id);
  };

  const handleUpdateResult = (testOrderId: string, resultValue: string) => {
    if (!selectedReport) return;
    const updatedTests = selectedReport.tests.map(t => t.id === testOrderId ? { ...t, result: resultValue } : t);
    
    updateLabReport(selectedReport.id, {
      ...selectedReport,
      tests: updatedTests,
      status: updatedTests.every(t => t.result && t.result.trim() !== '') ? 'Completed' : 'Pending'
    });
  };

  const generateAndSharePDF = async (method: 'whatsapp' | 'email') => {
    if (!selectedReport) return;

    const element = document.getElementById('printable-lab-report');
    if (!element) return;

    // We dynamically import to avoid breaking SSR if that ever becomes a thing,
    // though this is Vite. But it's good practice.
    const html2canvas = (await import('html2canvas')).default;
    const jsPDF = (await import('jspdf')).default;

    // Temporarily hide inputs and show text for printing
    const inputs = element.querySelectorAll('input');
    inputs.forEach(input => {
      const span = document.createElement('span');
      span.textContent = input.value;
      span.className = 'pdf-result-span font-bold';
      input.style.display = 'none';
      input.parentNode?.insertBefore(span, input);
    });

    try {
      const canvas = await html2canvas(element, { scale: 2, useCORS: true });
      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF('p', 'mm', 'a4');
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = (canvas.height * pdfWidth) / canvas.width;
      
      pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight);
      
      const pdfBlob = pdf.output('blob');
      const fileName = `LabReport_${selectedReport.patient.name.replace(/\s+/g, '_')}.pdf`;
      const file = new File([pdfBlob], fileName, { type: 'application/pdf' });

      // Try Web Share API for Mobile/Safari/Edge
      if (navigator.canShare && navigator.canShare({ files: [file] })) {
        await navigator.share({
          files: [file],
          title: `Lab Report - ${selectedReport.patient.name}`,
          text: `Please find attached the lab report for ${selectedReport.patient.name}.`,
        });
      } else {
        // Fallback for Desktop Chrome/Firefox
        pdf.save(fileName);
        
        // Open the respective app
        if (method === 'whatsapp') {
          const text = `Hi, I have downloaded your lab report. I will attach the PDF file to this chat.`;
          window.open(`https://wa.me/91${selectedReport.patient.phone}?text=${encodeURIComponent(text)}`, '_blank');
        } else if (method === 'email') {
          const subject = `Lab Report - ${selectedReport.patient.name}`;
          const body = `Hi,\n\nI have generated your lab report PDF. (Please attach the downloaded PDF file here).\n\nThank you,\nClinicPulse Pro Diagnostics`;
          window.location.href = `mailto:?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
        }
      }
    } catch (error) {
      console.error('Error generating PDF:', error);
      alert('Failed to generate PDF. Please try again.');
    } finally {
      // Restore inputs
      inputs.forEach(input => {
        input.style.display = 'block';
        const span = input.parentNode?.querySelector('.pdf-result-span');
        if (span) span.remove();
      });
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 print:block">
      {/* LEFT: Order new tests */}
      <div className="print:hidden bg-white p-6 rounded-2xl shadow-sm border border-slate-200 flex flex-col h-[700px]">
        <div className="flex items-center space-x-3 mb-6">
          <div className="p-2 bg-purple-100 text-purple-600 rounded-xl"><Microscope className="h-6 w-6" /></div>
          <h2 className="text-xl font-bold text-navy-900">New Lab Order</h2>
        </div>

        <div className="space-y-4 mb-6">
          <div className="grid grid-cols-2 gap-4">
            <input type="text" placeholder="Patient Name" value={patient.name} onChange={e => setPatient({...patient, name: e.target.value})} className="p-2 border border-slate-200 rounded-lg text-sm focus:ring-1 focus:ring-purple-500 outline-none" />
            <input type="text" placeholder="Phone (WhatsApp)" value={patient.phone} onChange={e => setPatient({...patient, phone: e.target.value})} className="p-2 border border-slate-200 rounded-lg text-sm focus:ring-1 focus:ring-purple-500 outline-none" />
          </div>
        </div>

        <div className="relative mb-4">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
          <input type="text" placeholder="Search lab tests..." value={searchQuery} onChange={e => setSearchQuery(e.target.value)} className="w-full pl-9 pr-4 py-2 border border-slate-200 rounded-lg text-sm focus:ring-1 focus:ring-purple-500 outline-none" />
        </div>

        <div className="flex-1 overflow-y-auto mb-4 border border-slate-100 rounded-xl p-2 bg-slate-50">
          {filteredTests.map(test => (
            <div key={test.id} className="flex items-center justify-between p-2 hover:bg-white rounded-lg transition-colors border-b border-slate-100 last:border-0">
              <div>
                <div className="font-medium text-sm text-navy-900">{test.name}</div>
                <div className="text-xs text-slate-500">{test.category} • ₹{test.price}</div>
              </div>
              <button onClick={() => handleAddTest(test)} className="p-1.5 bg-purple-50 text-purple-600 rounded-lg hover:bg-purple-100">
                <Plus className="h-4 w-4" />
              </button>
            </div>
          ))}
        </div>

        <div className="bg-slate-50 p-4 rounded-xl border border-slate-200">
          <h3 className="font-semibold text-sm text-navy-900 mb-3">Order Cart ({orderedTests.length})</h3>
          <div className="max-h-32 overflow-y-auto space-y-2 mb-3">
            {orderedTests.map(t => (
              <div key={t.id} className="flex items-center justify-between text-sm bg-white p-2 rounded border border-slate-100">
                <span className="truncate pr-2">{t.testName}</span>
                <div className="flex items-center space-x-3 shrink-0">
                  <span className="font-medium text-slate-700">₹{t.price}</span>
                  <button onClick={() => removeTest(t.id)} className="text-red-400 hover:text-red-600"><Trash2 className="h-4 w-4" /></button>
                </div>
              </div>
            ))}
            {orderedTests.length === 0 && <p className="text-xs text-slate-400 italic">No tests added yet.</p>}
          </div>
          
          <div className="flex items-center justify-between pt-3 border-t border-slate-200 mb-4">
            <span className="font-bold text-navy-900">Total Cost</span>
            <span className="font-bold text-lg text-purple-600">₹{totalCost}</span>
          </div>

          <button onClick={handleFinalizeOrder} disabled={orderedTests.length === 0} className="w-full flex items-center justify-center space-x-2 bg-purple-600 text-white py-2.5 rounded-xl font-bold hover:bg-purple-700 disabled:opacity-50 transition-colors">
            <span>Generate Bill & Order</span>
            <ArrowRight className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* RIGHT: Results & Reports */}
      <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 flex flex-col h-[700px] print:h-auto print:border-none print:shadow-none print:p-0">
        <div className="flex items-center justify-between mb-6 print:hidden">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-emerald-100 text-emerald-600 rounded-xl"><FileText className="h-6 w-6" /></div>
            <h2 className="text-xl font-bold text-navy-900">Test Reports</h2>
          </div>
          <select 
            value={selectedReportId || ''} 
            onChange={(e) => setSelectedReportId(e.target.value)}
            className="p-2 border border-slate-200 rounded-lg text-sm bg-slate-50 focus:outline-none"
          >
            <option value="">Select a Report...</option>
            {labReports.map(r => (
              <option key={r.id} value={r.id}>{r.patient.name} ({r.id}) - {r.status}</option>
            ))}
          </select>
        </div>

        {selectedReport ? (
          <div className="flex-1 flex flex-col h-full">
            <div id="printable-lab-report" className="flex-1 border border-slate-200 rounded-xl p-6 bg-white overflow-y-auto print:border-none print:p-0">
              {/* Header */}
              <div className="border-b-2 border-purple-600 pb-4 mb-6">
                <div className="flex justify-between items-start">
                  <div>
                    <h1 className="text-2xl font-black text-navy-900 tracking-tight">CLINICPULSE PRO LABS</h1>
                    <p className="text-sm text-slate-500 font-medium mt-1">Advanced Diagnostic Center</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-bold text-navy-900">Report ID: {selectedReport.id}</p>
                    <p className="text-xs text-slate-500 mt-0.5">Date: {new Date(selectedReport.date).toLocaleDateString()}</p>
                    <div className={`mt-2 inline-flex px-2 py-1 rounded text-xs font-bold ${selectedReport.status === 'Completed' ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'}`}>
                      {selectedReport.status}
                    </div>
                  </div>
                </div>
              </div>

              {/* Patient Details */}
              <div className="bg-slate-50 rounded-xl p-4 mb-6 border border-slate-100 print:bg-white print:border-slate-300">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                  <div><span className="text-slate-500 text-xs block">Patient Name</span><span className="font-semibold text-navy-900">{selectedReport.patient.name}</span></div>
                  <div><span className="text-slate-500 text-xs block">Age / Gender</span><span className="font-semibold text-navy-900">{selectedReport.patient.age || '--'} Yrs / {selectedReport.patient.gender}</span></div>
                  <div><span className="text-slate-500 text-xs block">Referred By</span><span className="font-semibold text-navy-900">Dr. Internal</span></div>
                  <div><span className="text-slate-500 text-xs block">Phone</span><span className="font-semibold text-navy-900">{selectedReport.patient.phone || '--'}</span></div>
                </div>
              </div>

              {/* Test Results Table */}
              <div className="mb-6">
                <h3 className="font-bold text-navy-900 border-b border-slate-200 pb-2 mb-4">Investigation Results</h3>
                <table className="w-full text-sm">
                  <thead>
                    <tr className="text-left text-slate-500 border-b border-slate-200">
                      <th className="pb-2 font-medium">Test Name</th>
                      <th className="pb-2 font-medium">Result</th>
                      <th className="pb-2 font-medium">Unit</th>
                      <th className="pb-2 font-medium">Reference Range</th>
                    </tr>
                  </thead>
                  <tbody>
                    {selectedReport.tests.map(test => (
                      <tr key={test.id} className="border-b border-slate-100">
                        <td className="py-3 font-medium text-navy-900">{test.testName}</td>
                        <td className="py-3">
                          <input 
                            type="text" 
                            value={test.result || ''}
                            onChange={(e) => handleUpdateResult(test.id, e.target.value)}
                            placeholder="Enter result..."
                            className="w-full max-w-[120px] p-1.5 border border-slate-200 rounded bg-slate-50 focus:bg-white focus:ring-1 focus:ring-purple-500 outline-none print:border-none print:bg-transparent print:p-0 print:font-bold"
                          />
                        </td>
                        <td className="py-3 text-slate-500">{test.unit}</td>
                        <td className="py-3 text-slate-500">{test.referenceRange}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Footer */}
              <div className="mt-12 text-center text-xs text-slate-400 print:mt-24">
                <p>This is a computer-generated report and does not require a physical signature.</p>
                <p className="mt-1">Generated by ClinicPulse Pro Diagnostics Module</p>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="mt-4 pt-4 border-t border-slate-100 grid grid-cols-3 gap-3 print:hidden">
              <button onClick={() => window.print()} className="flex items-center justify-center space-x-2 bg-slate-100 text-slate-700 py-2.5 rounded-xl font-semibold hover:bg-slate-200 transition-colors text-sm">
                <FileText className="h-4 w-4" />
                <span>Print PDF</span>
              </button>
              <button onClick={() => generateAndSharePDF('whatsapp')} className="flex items-center justify-center space-x-2 bg-[#25D366] text-white py-2.5 rounded-xl font-semibold hover:bg-[#128C7E] transition-colors text-sm">
                <Share2 className="h-4 w-4" />
                <span>WhatsApp</span>
              </button>
              <button onClick={() => generateAndSharePDF('email')} className="flex items-center justify-center space-x-2 bg-blue-600 text-white py-2.5 rounded-xl font-semibold hover:bg-blue-700 transition-colors text-sm">
                <Mail className="h-4 w-4" />
                <span>Email</span>
              </button>
            </div>
          </div>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center text-slate-400 print:hidden">
            <Microscope className="h-16 w-16 mb-4 opacity-20" />
            <p>Select a report to view or enter results</p>
          </div>
        )}
      </div>
    </div>
  );
};
