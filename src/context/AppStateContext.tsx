import React, { createContext, useContext, useState, useEffect } from 'react';
import { Medicine, Invoice, LabTest, LabReport } from '../types';
import { initialMedicines, initialInvoices, initialLabTests, initialLabReports } from '../data/mockData';

interface AppStateContextType {
  medicines: Medicine[];
  invoices: Invoice[];
  labTests: LabTest[];
  labReports: LabReport[];
  addInvoice: (invoice: Invoice) => void;
  updateMedicineStock: (id: string, qtyToDeduct: number) => void;
  addMedicine: (med: Medicine) => void;
  restockMedicine: (id: string, qtyToAdd: number) => void;
  addLabReport: (report: LabReport) => void;
  updateLabReport: (reportId: string, updatedReport: LabReport) => void;
  resetDemoData: () => void;
}

const AppStateContext = createContext<AppStateContextType | undefined>(undefined);

const MED_STORAGE_KEY = 'clinicpulse_demo_medicines_v4';
const INV_STORAGE_KEY = 'clinicpulse_demo_invoices_v4';
const LAB_TEST_STORAGE_KEY = 'clinicpulse_demo_labtests_v1';
const LAB_REPORT_STORAGE_KEY = 'clinicpulse_demo_labreports_v1';

export const AppStateProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [medicines, setMedicines] = useState<Medicine[]>([]);
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [labTests, setLabTests] = useState<LabTest[]>([]);
  const [labReports, setLabReports] = useState<LabReport[]>([]);
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    const storedMeds = localStorage.getItem(MED_STORAGE_KEY);
    const storedInvs = localStorage.getItem(INV_STORAGE_KEY);
    const storedLabTests = localStorage.getItem(LAB_TEST_STORAGE_KEY);
    const storedLabReports = localStorage.getItem(LAB_REPORT_STORAGE_KEY);

    if (storedMeds) setMedicines(JSON.parse(storedMeds));
    else { setMedicines(initialMedicines); localStorage.setItem(MED_STORAGE_KEY, JSON.stringify(initialMedicines)); }

    if (storedInvs) setInvoices(JSON.parse(storedInvs));
    else { setInvoices(initialInvoices); localStorage.setItem(INV_STORAGE_KEY, JSON.stringify(initialInvoices)); }

    if (storedLabTests) setLabTests(JSON.parse(storedLabTests));
    else { setLabTests(initialLabTests); localStorage.setItem(LAB_TEST_STORAGE_KEY, JSON.stringify(initialLabTests)); }

    if (storedLabReports) setLabReports(JSON.parse(storedLabReports));
    else { setLabReports(initialLabReports); localStorage.setItem(LAB_REPORT_STORAGE_KEY, JSON.stringify(initialLabReports)); }
    
    setIsLoaded(true);
  }, []);

  useEffect(() => {
    if (isLoaded) {
      localStorage.setItem(MED_STORAGE_KEY, JSON.stringify(medicines));
      localStorage.setItem(INV_STORAGE_KEY, JSON.stringify(invoices));
      localStorage.setItem(LAB_TEST_STORAGE_KEY, JSON.stringify(labTests));
      localStorage.setItem(LAB_REPORT_STORAGE_KEY, JSON.stringify(labReports));
    }
  }, [medicines, invoices, labTests, labReports, isLoaded]);

  const addInvoice = (invoice: Invoice) => setInvoices(prev => [invoice, ...prev]);
  const addMedicine = (med: Medicine) => setMedicines(prev => [...prev, med]);
  const addLabReport = (report: LabReport) => setLabReports(prev => [report, ...prev]);

  const updateMedicineStock = (id: string, qtyToDeduct: number) => {
    setMedicines(prev => prev.map(med => 
      med.id === id ? { ...med, stock: Math.max(0, med.stock - qtyToDeduct) } : med
    ));
  };

  const restockMedicine = (id: string, qtyToAdd: number) => {
    setMedicines(prev => prev.map(med => 
      med.id === id ? { ...med, stock: med.stock + qtyToAdd } : med
    ));
  };

  const updateLabReport = (reportId: string, updatedReport: LabReport) => {
    setLabReports(prev => prev.map(rep => rep.id === reportId ? updatedReport : rep));
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
      addInvoice, updateMedicineStock, addMedicine, restockMedicine,
      addLabReport, updateLabReport, resetDemoData
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
