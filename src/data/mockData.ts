import { Medicine, Invoice } from '../types';

export const initialMedicines: Medicine[] = [
  {
    id: 'med-1',
    genericName: 'Paracetamol 500mg',
    brandName: 'Dolo 500',
    batchNo: 'B202301',
    hsn: '3004',
    costPrice: 1.5,
    sellingPrice: 2.0,
    gstRate: 12,
    stock: 500,
    expiryDate: '2026-12-31',
    category: 'Analgesics',
  },
  {
    id: 'med-2',
    genericName: 'Amoxicillin 250mg',
    brandName: 'Amoxil',
    batchNo: 'B202302',
    hsn: '3004',
    costPrice: 5.0,
    sellingPrice: 7.5,
    gstRate: 12,
    stock: 200,
    expiryDate: '2025-05-31',
    category: 'Antibiotics',
  },
  {
    id: 'med-3',
    genericName: 'Pantoprazole 40mg',
    brandName: 'Pan 40',
    batchNo: 'B202303',
    hsn: '3004',
    costPrice: 3.0,
    sellingPrice: 4.5,
    gstRate: 12,
    stock: 50,
    expiryDate: '2024-06-30', // Approaching expiry for demo
    category: 'Antacids',
  },
  {
    id: 'med-4',
    genericName: 'Vitamin C + Zinc',
    brandName: 'Zincovit',
    batchNo: 'B202304',
    hsn: '3004',
    costPrice: 2.5,
    sellingPrice: 4.0,
    gstRate: 18,
    stock: 300,
    expiryDate: '2027-01-01',
    category: 'Vitamins',
  }
];

export const initialInvoices: Invoice[] = [
  {
    id: 'INV-1001',
    patient: {
      name: 'Ramesh Kumar',
      age: 45,
      gender: 'Male',
      phone: '9876543210',
      complaints: 'Fever and body ache',
      bp: '120/80',
      pulse: '85',
      temp: '101',
      spo2: '98',
      weight: '70'
    },
    doctorId: 'doc-1',
    consultationFee: 500,
    prescriptionItems: [
      {
        id: 'pi-1',
        medicineId: 'med-1',
        medicineName: 'Dolo 500',
        batchNo: 'B202301',
        expiryDate: '2026-12-31',
        hsn: '3004',
        dosage: '1-0-1',
        durationDays: 3,
        quantity: 6,
        pricePerUnit: 2.0,
        totalPrice: 12.0,
        gstRate: 12
      }
    ],
    subTotal: 512,
    cgst: 30.72,
    sgst: 30.72,
    totalAmount: 573.44,
    date: new Date(Date.now() - 86400000).toISOString(), // Yesterday
    paymentStatus: 'Paid'
  }
];

export const doctors = [
  { id: 'doc-1', name: 'Dr. Rahul Sharma', specialty: 'General Physician', regNo: 'MCI-12345' },
  { id: 'doc-2', name: 'Dr. Priya Desai', specialty: 'Pediatrician', regNo: 'MCI-67890' },
];
