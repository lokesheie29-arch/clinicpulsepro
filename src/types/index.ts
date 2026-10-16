export interface Medicine {
  id: string;
  genericName: string;
  brandName: string;
  batchNo: string;
  hsn: string;
  costPrice: number;
  sellingPrice: number;
  gstRate: number; // e.g., 0, 5, 12, 18
  stock: number;
  expiryDate: string; // YYYY-MM-DD
  category: string;
  minStockAlert?: number; // Custom low stock threshold quantity
}

export interface PrescriptionItem {
  id: string;
  medicineId: string;
  medicineName: string;
  batchNo: string;
  expiryDate: string;
  hsn: string;
  dosage: string;
  durationDays: number;
  quantity: number;
  pricePerUnit: number;
  discountPercent?: number; // e.g., 5, 10
  discountAmount?: number;  // in INR
  totalPrice: number;
  gstRate: number;
  foodTiming?: 'After Food' | 'Before Food' | 'With Food' | 'Empty Stomach' | string;
}

export interface PatientDetails {
  name: string;
  age: number;
  gender: string;
  phone: string;
  complaints: string;
  bp: string;
  pulse: string;
  temp: string;
  spo2: string;
  weight: string;
}

export interface Invoice {
  id: string;
  patient: PatientDetails;
  doctorId: string;
  prescribedByDoctorName?: string;
  consultationFee: number;
  prescriptionItems: PrescriptionItem[];
  labItems?: LabTestOrder[];
  subTotal: number;
  totalDiscount?: number;
  cgst: number;
  sgst: number;
  totalAmount: number;
  date: string;
  paymentStatus: 'Pending' | 'Paid';
}

export interface Doctor {
  id: string;
  name: string;
  specialty: string;
  regNo?: string;
  phone?: string;
  clinic?: string;
}

export interface UserRole {
  uid: string;
  email: string;
  role: 'admin' | 'staff' | 'viewer';
  status: 'active' | 'pending' | 'revoked';
}

export interface LabSubTest {
  id: string;
  name: string;
  referenceRange: string;
  unit: string;
  result?: string;
}

export interface LabTest {
  id: string;
  name: string;
  category: string;
  price: number;
  referenceRange?: string;
  unit?: string;
  subTests?: LabSubTest[];
}

export interface LabTestOrder {
  id: string;
  testId: string;
  testName: string;
  price: number;
  result?: string;
  referenceRange?: string;
  unit?: string;
  subTests?: LabSubTest[];
}

export interface LabReport {
  id: string;
  patient: PatientDetails;
  doctorId: string;
  tests: LabTestOrder[];
  date: string;
  status: 'Pending' | 'Completed';
}

export type OrgType = 'hospital' | 'laboratory' | 'pharmacy';

export interface OrgTypeInfo {
  id: OrgType;
  title: string;
  badge: string;
  subtitle: string;
  description: string;
  defaultTab: string;
  allowedTabs: string[];
}
