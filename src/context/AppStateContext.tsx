import React, { createContext, useContext, useState, useEffect } from 'react';
import { Medicine, Invoice } from '../types';
import { initialMedicines, initialInvoices } from '../data/mockData';

interface AppStateContextType {
  medicines: Medicine[];
  invoices: Invoice[];
  addInvoice: (invoice: Invoice) => void;
  updateMedicineStock: (id: string, qtyToDeduct: number) => void;
  addMedicine: (med: Medicine) => void;
  restockMedicine: (id: string, qtyToAdd: number) => void;
  resetDemoData: () => void;
}

const AppStateContext = createContext<AppStateContextType | undefined>(undefined);

const MED_STORAGE_KEY = 'clinicpulse_demo_medicines_v4';
const INV_STORAGE_KEY = 'clinicpulse_demo_invoices_v4';

export const AppStateProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [medicines, setMedicines] = useState<Medicine[]>([]);
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    const storedMeds = localStorage.getItem(MED_STORAGE_KEY);
    const storedInvs = localStorage.getItem(INV_STORAGE_KEY);

    if (storedMeds) {
      setMedicines(JSON.parse(storedMeds));
    } else {
      setMedicines(initialMedicines);
      localStorage.setItem(MED_STORAGE_KEY, JSON.stringify(initialMedicines));
    }

    if (storedInvs) {
      setInvoices(JSON.parse(storedInvs));
    } else {
      setInvoices(initialInvoices);
      localStorage.setItem(INV_STORAGE_KEY, JSON.stringify(initialInvoices));
    }
    
    setIsLoaded(true);
  }, []);

  useEffect(() => {
    if (isLoaded) {
      localStorage.setItem(MED_STORAGE_KEY, JSON.stringify(medicines));
    }
  }, [medicines, isLoaded]);

  useEffect(() => {
    if (isLoaded) {
      localStorage.setItem(INV_STORAGE_KEY, JSON.stringify(invoices));
    }
  }, [invoices, isLoaded]);

  const addInvoice = (invoice: Invoice) => {
    setInvoices(prev => [invoice, ...prev]);
  };

  const updateMedicineStock = (id: string, qtyToDeduct: number) => {
    setMedicines(prev => prev.map(med => 
      med.id === id ? { ...med, stock: Math.max(0, med.stock - qtyToDeduct) } : med
    ));
  };

  const addMedicine = (med: Medicine) => {
    setMedicines(prev => [...prev, med]);
  };

  const restockMedicine = (id: string, qtyToAdd: number) => {
    setMedicines(prev => prev.map(med => 
      med.id === id ? { ...med, stock: med.stock + qtyToAdd } : med
    ));
  };

  const resetDemoData = () => {
    setMedicines(initialMedicines);
    setInvoices(initialInvoices);
    localStorage.setItem(MED_STORAGE_KEY, JSON.stringify(initialMedicines));
    localStorage.setItem(INV_STORAGE_KEY, JSON.stringify(initialInvoices));
  };

  return (
    <AppStateContext.Provider value={{
      medicines, invoices, addInvoice, updateMedicineStock, addMedicine, restockMedicine, resetDemoData
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
