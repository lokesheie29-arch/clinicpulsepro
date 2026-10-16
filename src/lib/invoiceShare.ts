import { Invoice } from '../types';

export interface DecodedBillData {
  id: string;
  patient: {
    name: string;
    phone: string;
    age?: number;
    gender?: string;
    complaints?: string;
  };
  prescribedByDoctorName?: string;
  consultationFee: number;
  prescriptionItems: {
    medicineName: string;
    batchNo: string;
    expiryDate: string;
    hsn: string;
    quantity: number;
    pricePerUnit: number;
    discountPercent?: number;
    discountAmount?: number;
    totalPrice: number;
    gstRate: number;
  }[];
  subTotal: number;
  cgst: number;
  sgst: number;
  totalAmount: number;
  date: string;
  paymentStatus: 'Pending' | 'Paid';
  orgName: string;
  orgGstin?: string;
  orgDl?: string;
  orgAddress?: string;
}

/**
 * Encodes an invoice object into a safe, compact URL parameter.
 * Allows any patient to view their exact official bill from WhatsApp
 * without requiring login or access to the clinic's local database.
 */
export const encodeInvoiceForUrl = (
  invoice: Invoice,
  orgName: string,
  orgGstin?: string,
  orgPhone?: string,
  orgAddress?: string
): string => {
  try {
    const payload = {
      i: invoice.id,
      p: {
        n: invoice.patient.name,
        ph: invoice.patient.phone,
        a: invoice.patient.age,
        g: invoice.patient.gender,
        c: invoice.patient.complaints || '',
      },
      d: invoice.prescribedByDoctorName || '',
      cf: invoice.consultationFee || 0,
      items: (invoice.prescriptionItems || []).map(item => ({
        n: item.medicineName,
        b: item.batchNo,
        e: item.expiryDate,
        h: item.hsn,
        q: item.quantity,
        r: item.pricePerUnit,
        dp: item.discountPercent || 0,
        da: item.discountAmount || 0,
        t: item.totalPrice,
        g: item.gstRate
      })),
      sub: invoice.subTotal,
      cgst: invoice.cgst,
      sgst: invoice.sgst,
      tot: invoice.totalAmount,
      dt: invoice.date,
      st: invoice.paymentStatus,
      org: orgName,
      gst: orgGstin || '33ABCDE1234F1Z5',
      dl: 'DL-20B/21B-45892',
      addr: orgAddress || '100 Feet Road, Indiranagar, Bengaluru - 560038'
    };
    return encodeURIComponent(btoa(encodeURIComponent(JSON.stringify(payload))));
  } catch (err) {
    console.warn('Failed to encode invoice for URL:', err);
    return encodeURIComponent(invoice.id);
  }
};

/**
 * Decodes an encoded invoice string from a WhatsApp bill URL.
 */
export const decodeInvoiceFromUrl = (dataStr: string): DecodedBillData | null => {
  try {
    const jsonStr = decodeURIComponent(atob(decodeURIComponent(dataStr)));
    const p = JSON.parse(jsonStr);
    return {
      id: p.i,
      patient: {
        name: p.p?.n || 'Patient',
        phone: p.p?.ph || '',
        age: p.p?.a,
        gender: p.p?.g,
        complaints: p.p?.c || ''
      },
      prescribedByDoctorName: p.d || '',
      consultationFee: p.cf || 0,
      prescriptionItems: (p.items || []).map((it: any) => ({
        medicineName: it.n,
        batchNo: it.b,
        expiryDate: it.e,
        hsn: it.h,
        quantity: it.q,
        pricePerUnit: it.r,
        discountPercent: it.dp || 0,
        discountAmount: it.da || 0,
        totalPrice: it.t,
        gstRate: it.g
      })),
      subTotal: p.sub,
      cgst: p.cgst,
      sgst: p.sgst,
      totalAmount: p.tot,
      date: p.dt,
      paymentStatus: p.st,
      orgName: p.org || 'ClinicPulse Pro Healthcare',
      orgGstin: p.gst || '33ABCDE1234F1Z5',
      orgDl: p.dl || 'DL-20B/21B-45892',
      orgAddress: p.addr || '100 Feet Road, Indiranagar, Bengaluru - 560038'
    };
  } catch (err) {
    console.warn('Failed to decode invoice from URL:', err);
    return null;
  }
};

/**
 * Constructs the canonical public URL to view and download the official PDF bill.
 */
export const getBillShareUrl = (
  invoice: Invoice,
  orgName: string,
  orgGstin?: string,
  orgAddress?: string
): string => {
  const base = `${window.location.origin}${window.location.pathname}`;
  const encoded = encodeInvoiceForUrl(invoice, orgName, orgGstin, undefined, orgAddress);
  return `${base}#view-bill?id=${invoice.id}&data=${encoded}`;
};
