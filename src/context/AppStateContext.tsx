import React, { createContext, useContext, useState, useEffect } from 'react';
import { Medicine, Invoice, LabTest, LabReport, OrgType } from '../types';
import { initialMedicines, initialInvoices, initialLabTests, initialLabReports } from '../data/mockData';
import { supabase } from '../lib/supabase';

interface AppStateContextType {
  medicines: Medicine[];
  invoices: Invoice[];
  labTests: LabTest[];
  labReports: LabReport[];
  orgType: OrgType;
  setOrgType: (type: OrgType) => void;
  addInvoice: (invoice: Invoice) => void;
  updateMedicineStock: (id: string, qtyToDeduct: number) => void;
  addMedicine: (med: Medicine) => void;
  updateMedicine: (id: string, updated: Partial<Medicine>) => void;
  restockMedicine: (id: string, qtyToAdd: number) => void;
  addLabReport: (report: LabReport) => void;
  updateLabReport: (reportId: string, updatedReport: LabReport) => void;
  addLabTest: (test: LabTest) => void;
  updateLabTest: (id: string, test: LabTest) => void;
  deleteLabTest: (id: string) => void;
  updateInvoicePaymentStatus: (id: string, status: 'Pending' | 'Paid') => void;
  bulkAddMedicines: (newMeds: Medicine[]) => void;
  bulkAddInvoices: (newInvs: Invoice[]) => void;
  resetDemoData: () => void;
}

const AppStateContext = createContext<AppStateContextType | undefined>(undefined);

const MED_STORAGE_KEY = 'clinicpulse_demo_medicines_v4';
const INV_STORAGE_KEY = 'clinicpulse_demo_invoices_v4';
const LAB_TEST_STORAGE_KEY = 'clinicpulse_demo_labtests_v1';
const LAB_REPORT_STORAGE_KEY = 'clinicpulse_demo_labreports_v1';
const ORG_TYPE_STORAGE_KEY = 'clinicpulse_org_type';

export const AppStateProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [medicines, setMedicines] = useState<Medicine[]>([]);
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [labTests, setLabTests] = useState<LabTest[]>([]);
  const [labReports, setLabReports] = useState<LabReport[]>([]);
  const [orgType, setOrgTypeState] = useState<OrgType>(() => {
    const cached = localStorage.getItem(ORG_TYPE_STORAGE_KEY) as OrgType | null;
    return (cached === 'hospital' || cached === 'laboratory' || cached === 'pharmacy') ? cached : 'hospital';
  });
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    const loadData = async () => {
      // 1. Load from local cache first for instant responsiveness
      const storedMeds = localStorage.getItem(MED_STORAGE_KEY);
      const storedInvs = localStorage.getItem(INV_STORAGE_KEY);
      const storedLabTests = localStorage.getItem(LAB_TEST_STORAGE_KEY);
      const storedLabReports = localStorage.getItem(LAB_REPORT_STORAGE_KEY);

      const localMeds = storedMeds ? JSON.parse(storedMeds) : initialMedicines;
      const localInvs = storedInvs ? JSON.parse(storedInvs) : initialInvoices;
      const localTests = storedLabTests ? JSON.parse(storedLabTests) : initialLabTests;
      const localReports = storedLabReports ? JSON.parse(storedLabReports) : initialLabReports;

      setMedicines(localMeds);
      setInvoices(localInvs);
      setLabTests(localTests);
      setLabReports(localReports);

      // 2. Fetch and merge latest data from Supabase in the background
      try {
        const { data: supaInvoices } = await supabase
          .from('invoices')
          .select('*')
          .order('created_at', { ascending: false });

        if (supaInvoices && supaInvoices.length > 0) {
          const mappedInvoices: Invoice[] = supaInvoices.map(row => ({
            id: row.id,
            patient: {
              name: row.patient_name,
              phone: row.patient_phone || '',
              age: row.patient_age || 0,
              gender: row.patient_gender || 'Male',
              complaints: '',
              bp: '',
              pulse: '',
              temp: '',
              spo2: '',
              weight: ''
            },
            doctorId: row.doctor_id || 'doc-1',
            consultationFee: Number(row.consultation_fee || 0),
            prescriptionItems: row.prescription_items || [],
            labItems: row.lab_items || [],
            subTotal: Number(row.sub_total || 0),
            cgst: Number(row.cgst || 0),
            sgst: Number(row.sgst || 0),
            totalAmount: Number(row.total_amount || 0),
            date: row.created_at,
            paymentStatus: row.payment_status || 'Pending'
          }));
          setInvoices(mappedInvoices);
        }

        const { data: supaReports } = await supabase
          .from('lab_reports')
          .select('*')
          .order('date', { ascending: false });

        if (supaReports && supaReports.length > 0) {
          setLabReports(supaReports.map(row => ({
            id: row.id,
            patient: row.patient,
            doctorId: row.doctor_id,
            tests: row.tests || [],
            status: row.status,
            date: row.date
          })));
        }

        const { data: supaMedicines } = await supabase.from('medicines').select('*');
        if (supaMedicines && supaMedicines.length > 0) {
          setMedicines(supaMedicines.map(m => ({
            id: m.id,
            genericName: m.generic_name,
            brandName: m.brand_name,
            batchNo: m.batch_no,
            hsn: m.hsn,
            costPrice: Number(m.cost_price),
            sellingPrice: Number(m.selling_price),
            gstRate: Number(m.gst_rate),
            stock: Number(m.stock),
            expiryDate: m.expiry_date,
            category: m.category
          })));
        }
      } catch (err) {
        console.warn('Supabase offline or empty, using cached clinic data:', err);
      }

      setIsLoaded(true);
    };

    loadData();
  }, []);

  useEffect(() => {
    if (isLoaded) {
      localStorage.setItem(MED_STORAGE_KEY, JSON.stringify(medicines));
      localStorage.setItem(INV_STORAGE_KEY, JSON.stringify(invoices));
      localStorage.setItem(LAB_TEST_STORAGE_KEY, JSON.stringify(labTests));
      localStorage.setItem(LAB_REPORT_STORAGE_KEY, JSON.stringify(labReports));
    }
  }, [medicines, invoices, labTests, labReports, isLoaded]);

  const addInvoice = (invoice: Invoice) => {
    setInvoices(prev => [invoice, ...prev]);
    supabase.from('invoices').insert({
      id: invoice.id,
      patient_name: invoice.patient.name,
      patient_phone: invoice.patient.phone,
      patient_age: invoice.patient.age,
      patient_gender: invoice.patient.gender,
      doctor_id: invoice.doctorId,
      consultation_fee: invoice.consultationFee,
      prescription_items: invoice.prescriptionItems,
      lab_items: invoice.labItems || [],
      sub_total: invoice.subTotal,
      cgst: invoice.cgst,
      sgst: invoice.sgst,
      total_amount: invoice.totalAmount,
      payment_status: invoice.paymentStatus,
      created_at: invoice.date
    }).then(({ error }) => {
      if (error) console.error('Failed to sync invoice to Supabase:', error.message);
    });
  };

  const addMedicine = (med: Medicine) => {
    setMedicines(prev => [...prev, med]);
    supabase.from('medicines').insert({
      id: med.id,
      generic_name: med.genericName,
      brand_name: med.brandName,
      batch_no: med.batchNo,
      hsn: med.hsn,
      cost_price: med.costPrice,
      selling_price: med.sellingPrice,
      gst_rate: med.gstRate,
      stock: med.stock,
      expiry_date: med.expiryDate,
      category: med.category
    }).then(({ error }) => {
      if (error) console.error('Failed to sync medicine to Supabase:', error.message);
    });
  };

  const updateMedicine = (id: string, updated: Partial<Medicine>) => {
    setMedicines(prev => prev.map(med => med.id === id ? { ...med, ...updated } : med));
  };

  const addLabReport = (report: LabReport) => {
    setLabReports(prev => [report, ...prev]);
    supabase.from('lab_reports').insert({
      id: report.id,
      patient: report.patient,
      doctor_id: report.doctorId,
      tests: report.tests,
      status: report.status,
      date: report.date
    }).then(({ error }) => {
      if (error) console.error('Failed to sync lab report to Supabase:', error.message);
    });
  };

  const updateLabReport = (reportId: string, updatedReport: LabReport) => {
    setLabReports(prev => prev.map(rep => rep.id === reportId ? updatedReport : rep));
    supabase.from('lab_reports').update({
      tests: updatedReport.tests,
      status: updatedReport.status
    }).eq('id', reportId).then(({ error }) => {
      if (error) console.error('Failed to update lab report in Supabase:', error.message);
    });
  };

  const addLabTest = (test: LabTest) => {
    setLabTests(prev => [...prev, test]);
  };

  const updateLabTest = (id: string, updatedTest: LabTest) => {
    setLabTests(prev => prev.map(t => t.id === id ? updatedTest : t));
  };

  const deleteLabTest = (id: string) => {
    setLabTests(prev => prev.filter(t => t.id !== id));
  };

  const updateInvoicePaymentStatus = (id: string, status: 'Pending' | 'Paid') => {
    setInvoices(prev => prev.map(inv => inv.id === id ? { ...inv, paymentStatus: status } : inv));
    supabase.from('invoices').update({
      payment_status: status
    }).eq('id', id).then(({ error }) => {
      if (error) console.error('Failed to update invoice payment status in Supabase:', error.message);
    });
  };

  const updateMedicineStock = (id: string, qtyToDeduct: number) => {
    setMedicines(prev => prev.map(med => {
      if (med.id === id) {
        const newStock = Math.max(0, med.stock - qtyToDeduct);
        supabase.from('medicines').update({ stock: newStock }).eq('id', id).then();
        return { ...med, stock: newStock };
      }
      return med;
    }));
  };

  const restockMedicine = (id: string, qtyToAdd: number) => {
    setMedicines(prev => prev.map(med => {
      if (med.id === id) {
        const newStock = med.stock + qtyToAdd;
        supabase.from('medicines').update({ stock: newStock }).eq('id', id).then();
        return { ...med, stock: newStock };
      }
      return med;
    }));
  };

  const bulkAddMedicines = (newMeds: Medicine[]) => {
    setMedicines(prev => [...newMeds, ...prev]);
    supabase.from('medicines').insert(newMeds.map(med => ({
      id: med.id,
      generic_name: med.genericName,
      brand_name: med.brandName,
      batch_no: med.batchNo,
      hsn: med.hsn,
      cost_price: med.costPrice,
      selling_price: med.sellingPrice,
      gst_rate: med.gstRate,
      stock: med.stock,
      expiry_date: med.expiryDate,
      category: med.category
    }))).then();
  };

  const bulkAddInvoices = (newInvs: Invoice[]) => {
    setInvoices(prev => [...newInvs, ...prev]);
    supabase.from('invoices').insert(newInvs.map(invoice => ({
      id: invoice.id,
      patient_name: invoice.patient.name,
      patient_phone: invoice.patient.phone,
      patient_age: invoice.patient.age,
      patient_gender: invoice.patient.gender,
      doctor_id: invoice.doctorId,
      consultation_fee: invoice.consultationFee,
      prescription_items: invoice.prescriptionItems,
      lab_items: invoice.labItems || [],
      sub_total: invoice.subTotal,
      cgst: invoice.cgst,
      sgst: invoice.sgst,
      total_amount: invoice.totalAmount,
      payment_status: invoice.paymentStatus,
      created_at: invoice.date
    }))).then();
  };

  const setOrgType = (type: OrgType) => {
    setOrgTypeState(type);
    localStorage.setItem(ORG_TYPE_STORAGE_KEY, type);
  };

  const resetDemoData = () => {
    setMedicines(initialMedicines);
    setInvoices(initialInvoices);
    setLabTests(initialLabTests);
    setLabReports(initialLabReports);
    localStorage.setItem(MED_STORAGE_KEY, JSON.stringify(initialMedicines));
    localStorage.setItem(INV_STORAGE_KEY, JSON.stringify(initialInvoices));
    localStorage.setItem(LAB_TEST_STORAGE_KEY, JSON.stringify(initialLabTests));
    localStorage.setItem(LAB_REPORT_STORAGE_KEY, JSON.stringify(initialLabReports));
  };

  return (
    <AppStateContext.Provider value={{
      medicines, invoices, labTests, labReports,
      orgType, setOrgType,
      addInvoice, updateMedicineStock, addMedicine, updateMedicine, restockMedicine,
      addLabReport, updateLabReport, addLabTest, updateLabTest, deleteLabTest,
      updateInvoicePaymentStatus,
      bulkAddMedicines, bulkAddInvoices, resetDemoData
    }}>
      {children}
    </AppStateContext.Provider>
  );
};

export const useAppState = () => {
  const context = useContext(AppStateContext);
  if (!context) throw new Error('useAppState must be used within AppStateProvider');
  return context;
};
