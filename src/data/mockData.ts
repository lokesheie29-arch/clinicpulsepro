import { Medicine, Invoice, LabTest, LabReport } from '../types';

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
        gstRate: 12,
        foodTiming: 'After Food'
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


export const initialLabTests: LabTest[] = [
  {
    id: 'lt-1',
    name: 'Complete Blood Count (CBC)',
    category: 'Hematology',
    price: 400,
    referenceRange: 'See parameters',
    unit: '',
    subTests: [
      { id: 'sub-1', name: 'Hemoglobin (Hb)', referenceRange: '13.0 - 17.0', unit: 'g/dL' },
      { id: 'sub-2', name: 'Total WBC Count', referenceRange: '4000 - 11000', unit: 'cells/cu.mm' },
      { id: 'sub-3', name: 'RBC Count', referenceRange: '4.5 - 5.5', unit: 'mil/uL' },
      { id: 'sub-4', name: 'Platelet Count', referenceRange: '1.5 - 4.5', unit: 'lakhs/cu.mm' }
    ]
  },
  {
    id: 'lt-2',
    name: 'Fasting Blood Sugar (FBS)',
    category: 'Biochemistry',
    price: 150,
    referenceRange: '70 - 100',
    unit: 'mg/dL',
    subTests: [
      { id: 'sub-5', name: 'Fasting Blood Glucose', referenceRange: '70 - 100', unit: 'mg/dL' }
    ]
  },
  {
    id: 'lt-3',
    name: 'Lipid Profile',
    category: 'Biochemistry',
    price: 800,
    referenceRange: 'See parameters',
    unit: '',
    subTests: [
      { id: 'sub-6', name: 'Total Cholesterol', referenceRange: '< 200', unit: 'mg/dL' },
      { id: 'sub-7', name: 'HDL Cholesterol (Good)', referenceRange: '> 40', unit: 'mg/dL' },
      { id: 'sub-8', name: 'LDL Cholesterol (Bad)', referenceRange: '< 100', unit: 'mg/dL' },
      { id: 'sub-9', name: 'Serum Triglycerides', referenceRange: '< 150', unit: 'mg/dL' }
    ]
  },
  {
    id: 'lt-4',
    name: 'Thyroid Profile (T3, T4, TSH)',
    category: 'Endocrinology',
    price: 600,
    referenceRange: 'See parameters',
    unit: '',
    subTests: [
      { id: 'sub-10', name: 'Total T3', referenceRange: '0.8 - 2.0', unit: 'ng/mL' },
      { id: 'sub-11', name: 'Total T4', referenceRange: '5.1 - 14.1', unit: 'ug/dL' },
      { id: 'sub-12', name: 'TSH (Ultrasensitive)', referenceRange: '0.27 - 4.2', unit: 'uIU/mL' }
    ]
  },
  {
    id: 'lt-5',
    name: 'Urine Routine Examination',
    category: 'Pathology',
    price: 200,
    referenceRange: 'Normal',
    unit: '',
    subTests: [
      { id: 'sub-13', name: 'Color / Appearance', referenceRange: 'Pale Yellow / Clear', unit: '' },
      { id: 'sub-14', name: 'Urine pH', referenceRange: '5.0 - 7.5', unit: '' },
      { id: 'sub-15', name: 'Specific Gravity', referenceRange: '1.005 - 1.030', unit: '' },
      { id: 'sub-16', name: 'Urine Sugar', referenceRange: 'Nil', unit: '' },
      { id: 'sub-17', name: 'Urine Protein / Albumin', referenceRange: 'Nil', unit: '' }
    ]
  }
];

export const initialLabReports: LabReport[] = [];
