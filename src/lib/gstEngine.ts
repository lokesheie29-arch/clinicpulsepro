import { GstRate, IndianState, TaxTreatment, InvoiceLineItem, TaxRateBreakdown } from '../types/billing';

export const INDIAN_STATES: IndianState[] = [
  { code: '01', name: 'Jammu and Kashmir' },
  { code: '02', name: 'Himachal Pradesh' },
  { code: '03', name: 'Punjab' },
  { code: '04', name: 'Chandigarh' },
  { code: '05', name: 'Uttarakhand' },
  { code: '06', name: 'Haryana' },
  { code: '07', name: 'Delhi' },
  { code: '08', name: 'Rajasthan' },
  { code: '09', name: 'Uttar Pradesh' },
  { code: '10', name: 'Bihar' },
  { code: '11', name: 'Sikkim' },
  { code: '12', name: 'Arunachal Pradesh' },
  { code: '13', name: 'Nagaland' },
  { code: '14', name: 'Manipur' },
  { code: '15', name: 'Mizoram' },
  { code: '16', name: 'Tripura' },
  { code: '17', name: 'Meghalaya' },
  { code: '18', name: 'Assam' },
  { code: '19', name: 'West Bengal' },
  { code: '20', name: 'Jharkhand' },
  { code: '21', name: 'Odisha' },
  { code: '22', name: 'Chhattisgarh' },
  { code: '23', name: 'Madhya Pradesh' },
  { code: '24', name: 'Gujarat' },
  { code: '26', name: 'Dadra and Nagar Haveli and Daman and Diu' },
  { code: '27', name: 'Maharashtra' },
  { code: '29', name: 'Karnataka' },
  { code: '30', name: 'Goa' },
  { code: '31', name: 'Lakshadweep' },
  { code: '32', name: 'Kerala' },
  { code: '33', name: 'Tamil Nadu' },
  { code: '34', name: 'Puducherry' },
  { code: '35', name: 'Andaman and Nicobar Islands' },
  { code: '36', name: 'Telangana' },
  { code: '37', name: 'Andhra Pradesh' },
  { code: '38', name: 'Ladakh' },
  { code: '97', name: 'Other Territory' }
];

export const HEALTHCARE_TAX_CLASSIFICATIONS = [
  {
    code: '999312',
    name: 'OPD & Clinical Medical Consultations',
    category: 'opd_consultation',
    defaultGstRate: 0 as GstRate,
    treatment: 'exempt' as TaxTreatment,
    description: 'Services provided by clinical establishments/doctors are exempt from GST under Notification 12/2017-CT(R).'
  },
  {
    code: '999316',
    name: 'Medical & Diagnostic Pathological Tests',
    category: 'lab_test',
    defaultGstRate: 0 as GstRate,
    treatment: 'exempt' as TaxTreatment,
    description: 'Pathology, radiology, and diagnostic lab services for diagnosis are exempt under Indian GST.'
  },
  {
    code: '999313',
    name: 'Surgical Procedures & Healthcare Care',
    category: 'procedure',
    defaultGstRate: 0 as GstRate,
    treatment: 'exempt' as TaxTreatment,
    description: 'Standard inpatient surgery, nursing, and clinical treatment services (exempt).'
  },
  {
    code: '999311',
    name: 'Hospital Room Rent (Up to ₹5,000/day or ICU)',
    category: 'room_rent',
    defaultGstRate: 0 as GstRate,
    treatment: 'exempt' as TaxTreatment,
    description: 'Standard hospital beds and intensive care units are exempt from GST.'
  },
  {
    code: '999319',
    name: 'Deluxe Hospital Room Rent (> ₹5,000/day)',
    category: 'room_rent',
    defaultGstRate: 5 as GstRate,
    treatment: 'taxable' as TaxTreatment,
    description: 'Room charges exceeding ₹5,000/day (excluding ICU) attract 5% GST without Input Tax Credit.'
  },
  {
    code: '3004',
    name: 'Pharmaceutical Medicines & Formulations',
    category: 'pharmacy',
    defaultGstRate: 12 as GstRate,
    treatment: 'taxable' as TaxTreatment,
    description: 'Prescription medicines and generic formulations (typically 12% or 5%).'
  },
  {
    code: '3005',
    name: 'Bandages, Cotton, Surgical Dressings',
    category: 'pharmacy',
    defaultGstRate: 12 as GstRate,
    treatment: 'taxable' as TaxTreatment,
    description: 'Wadding, gauze, bandages, adhesive plasters for medical/surgical use.'
  },
  {
    code: '9018',
    name: 'Medical Devices & Disposable Instruments',
    category: 'general_medical',
    defaultGstRate: 12 as GstRate,
    treatment: 'taxable' as TaxTreatment,
    description: 'Syringes, needles, diagnostic apparatus, catheters.'
  },
  {
    code: '2106',
    name: 'Nutraceuticals & Dietary Supplements',
    category: 'pharmacy',
    defaultGstRate: 18 as GstRate,
    treatment: 'taxable' as TaxTreatment,
    description: 'Vitamins, mineral food supplements, protein powders (18% GST).'
  }
];

/**
 * Validates the format of an Indian Goods & Services Tax Identification Number (GSTIN)
 * Format: 2 digits State Code + 10 digits PAN + 1 entity + 'Z' + 1 checksum char
 */
export const validateGstin = (gstin: string): {
  isValid: boolean;
  stateCode?: string;
  stateName?: string;
  pan?: string;
  error?: string;
} => {
  const cleanGstin = gstin.trim().toUpperCase();
  if (!cleanGstin) {
    return { isValid: false, error: 'GSTIN cannot be empty' };
  }

  const gstinRegex = /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/;
  if (!gstinRegex.test(cleanGstin)) {
    return {
      isValid: false,
      error: 'Invalid GSTIN format. Expected 15 characters (e.g. 33AAAAA0000A1Z5)'
    };
  }

  const stateCode = cleanGstin.substring(0, 2);
  const matchedState = INDIAN_STATES.find(s => s.code === stateCode);

  if (!matchedState) {
    return {
      isValid: false,
      stateCode,
      error: `Invalid state code (${stateCode}) in GSTIN`
    };
  }

  const pan = cleanGstin.substring(2, 12);

  return {
    isValid: true,
    stateCode,
    stateName: matchedState.name,
    pan
  };
};

/**
 * Determines whether a transaction is Inter-State (IGST) or Intra-State (CGST + SGST)
 * based on Supplier State Code vs Place of Supply State Code.
 */
export const isInterStateTransaction = (
  supplierStateCode: string,
  placeOfSupplyStateCode: string
): boolean => {
  if (!supplierStateCode || !placeOfSupplyStateCode) return false;
  return supplierStateCode.trim() !== placeOfSupplyStateCode.trim();
};

/**
 * Decimal-safe half-up rounding to two decimal places
 */
export const roundPaise = (num: number): number => {
  return Math.round((num + Number.EPSILON) * 100) / 100;
};

export interface LineGstInput {
  unitPrice: number;
  quantity: number;
  discountPercent?: number;
  discountAmount?: number;
  gstRate: GstRate;
  isInterState: boolean;
  priceType: 'exclusive' | 'inclusive';
  treatment?: TaxTreatment;
}

export interface LineGstOutput {
  grossAmount: number;
  discountAmount: number;
  taxableAmount: number;
  gstRate: GstRate;
  cgstRate: number;
  cgstAmount: number;
  sgstRate: number;
  sgstAmount: number;
  igstRate: number;
  igstAmount: number;
  totalTax: number;
  totalAmount: number;
}

/**
 * Computes exact GST, discounts, and taxable amounts for an invoice line item
 */
export const calculateLineGst = (input: LineGstInput): LineGstOutput => {
  const {
    unitPrice,
    quantity,
    discountPercent = 0,
    discountAmount: rawDiscountAmount = 0,
    gstRate,
    isInterState,
    priceType,
    treatment = 'taxable'
  } = input;

  const validQty = Math.max(0, quantity);
  const validPrice = Math.max(0, unitPrice);
  const grossAmount = roundPaise(validQty * validPrice);

  // 1. Calculate line discount
  let computedDiscount = 0;
  if (discountPercent > 0) {
    computedDiscount = roundPaise((grossAmount * discountPercent) / 100);
  } else if (rawDiscountAmount > 0) {
    computedDiscount = Math.min(grossAmount, roundPaise(rawDiscountAmount));
  }
  const netAfterDiscount = roundPaise(Math.max(0, grossAmount - computedDiscount));

  // If item is exempt, nil rated, or GST is 0%
  const effectiveGstRate = treatment === 'exempt' || treatment === 'nil_rated' || treatment === 'non_gst' ? 0 : gstRate;

  let taxableAmount = 0;
  let totalTax = 0;
  let totalAmount = 0;

  if (effectiveGstRate === 0) {
    taxableAmount = netAfterDiscount;
    totalTax = 0;
    totalAmount = netAfterDiscount;
  } else if (priceType === 'inclusive') {
    // Price includes GST
    // Net After Discount = Taxable * (1 + Rate / 100)
    taxableAmount = roundPaise(netAfterDiscount / (1 + effectiveGstRate / 100));
    totalTax = roundPaise(netAfterDiscount - taxableAmount);
    totalAmount = netAfterDiscount;
  } else {
    // Price is exclusive of GST
    taxableAmount = netAfterDiscount;
    totalTax = roundPaise((taxableAmount * effectiveGstRate) / 100);
    totalAmount = roundPaise(taxableAmount + totalTax);
  }

  // Split into CGST/SGST or IGST
  let cgstRate = 0;
  let cgstAmount = 0;
  let sgstRate = 0;
  let sgstAmount = 0;
  let igstRate = 0;
  let igstAmount = 0;

  if (effectiveGstRate > 0) {
    if (isInterState) {
      igstRate = effectiveGstRate;
      igstAmount = totalTax;
    } else {
      cgstRate = effectiveGstRate / 2;
      sgstRate = effectiveGstRate / 2;
      cgstAmount = roundPaise(totalTax / 2);
      sgstAmount = roundPaise(totalTax - cgstAmount); // Balance paise allocated to SGST
    }
  }

  return {
    grossAmount,
    discountAmount: computedDiscount,
    taxableAmount,
    gstRate: effectiveGstRate,
    cgstRate,
    cgstAmount,
    sgstRate,
    sgstAmount,
    igstRate,
    igstAmount,
    totalTax,
    totalAmount
  };
};

/**
 * Calculates whole invoice summary, rate-wise tax breakdowns, and rounding
 */
export const calculateInvoiceSummary = (
  items: InvoiceLineItem[],
  enableRoundOff: boolean = true
): {
  subTotal: number;
  totalDiscount: number;
  totalTaxable: number;
  totalCgst: number;
  totalSgst: number;
  totalIgst: number;
  totalTax: number;
  roundOff: number;
  grandTotal: number;
  taxBreakdowns: TaxRateBreakdown[];
} => {
  let subTotal = 0;
  let totalDiscount = 0;
  let totalTaxable = 0;
  let totalCgst = 0;
  let totalSgst = 0;
  let totalIgst = 0;
  let totalTax = 0;

  // Rate Breakdown Map
  const breakdownMap: Record<GstRate, TaxRateBreakdown> = {
    0: { rate: 0, taxableValue: 0, cgstAmount: 0, sgstAmount: 0, igstAmount: 0, totalTax: 0 },
    5: { rate: 5, taxableValue: 0, cgstAmount: 0, sgstAmount: 0, igstAmount: 0, totalTax: 0 },
    12: { rate: 12, taxableValue: 0, cgstAmount: 0, sgstAmount: 0, igstAmount: 0, totalTax: 0 },
    18: { rate: 18, taxableValue: 0, cgstAmount: 0, sgstAmount: 0, igstAmount: 0, totalTax: 0 },
    28: { rate: 28, taxableValue: 0, cgstAmount: 0, sgstAmount: 0, igstAmount: 0, totalTax: 0 }
  };

  items.forEach(item => {
    const gross = roundPaise(item.unitPrice * item.quantity);
    subTotal += gross;
    totalDiscount += item.discountAmount;
    totalTaxable += item.taxableAmount;
    totalCgst += item.cgstAmount;
    totalSgst += item.sgstAmount;
    totalIgst += item.igstAmount;
    totalTax += item.totalTax;

    const rateKey = item.gstRate in breakdownMap ? item.gstRate : 0;
    breakdownMap[rateKey].taxableValue += item.taxableAmount;
    breakdownMap[rateKey].cgstAmount += item.cgstAmount;
    breakdownMap[rateKey].sgstAmount += item.sgstAmount;
    breakdownMap[rateKey].igstAmount += item.igstAmount;
    breakdownMap[rateKey].totalTax += item.totalTax;
  });

  subTotal = roundPaise(subTotal);
  totalDiscount = roundPaise(totalDiscount);
  totalTaxable = roundPaise(totalTaxable);
  totalCgst = roundPaise(totalCgst);
  totalSgst = roundPaise(totalSgst);
  totalIgst = roundPaise(totalIgst);
  totalTax = roundPaise(totalTax);

  const rawGrandTotal = roundPaise(totalTaxable + totalTax);

  let roundOff = 0;
  let grandTotal = rawGrandTotal;

  if (enableRoundOff) {
    const rounded = Math.round(rawGrandTotal);
    roundOff = roundPaise(rounded - rawGrandTotal);
    grandTotal = rounded;
  }

  // Filter out rates with 0 taxable value, but preserve 0% if items exist
  const taxBreakdowns: TaxRateBreakdown[] = Object.values(breakdownMap)
    .filter(b => b.taxableValue > 0)
    .map(b => ({
      rate: b.rate,
      taxableValue: roundPaise(b.taxableValue),
      cgstAmount: roundPaise(b.cgstAmount),
      sgstAmount: roundPaise(b.sgstAmount),
      igstAmount: roundPaise(b.igstAmount),
      totalTax: roundPaise(b.totalTax)
    }));

  return {
    subTotal,
    totalDiscount,
    totalTaxable,
    totalCgst,
    totalSgst,
    totalIgst,
    totalTax,
    roundOff,
    grandTotal,
    taxBreakdowns
  };
};

/**
 * Returns current Indian financial year string (e.g. "2026-2027")
 * In India, FY starts April 1st and ends March 31st.
 */
export const getCurrentFinancialYear = (date: Date = new Date()): string => {
  const month = date.getMonth(); // 0 = Jan, 3 = April
  const year = date.getFullYear();

  if (month >= 3) {
    // April to Dec: current year to next year
    return `${year}-${year + 1}`;
  } else {
    // Jan to March: previous year to current year
    return `${year - 1}-${year}`;
  }
};

/**
 * Formats a number to Indian Currency style (₹1,24,500.00)
 */
export const formatInr = (amount: number, showDecimals: boolean = true): string => {
  if (isNaN(amount) || amount === null || amount === undefined) return '₹0.00';
  const isNegative = amount < 0;
  const absAmount = Math.abs(amount);

  const parts = absAmount.toFixed(showDecimals ? 2 : 0).split('.');
  let lastThree = parts[0].substring(parts[0].length - 3);
  const otherNumbers = parts[0].substring(0, parts[0].length - 3);
  if (otherNumbers !== '') {
    lastThree = ',' + lastThree;
  }
  const formattedInteger = otherNumbers.replace(/\B(?=(\d{2})+(?!\d))/g, ',') + lastThree;
  const result = showDecimals ? `${formattedInteger}.${parts[1]}` : formattedInteger;
  
  return `${isNegative ? '-' : ''}₹${result}`;
};

/**
 * Converts numbers into official Indian Rupee words format
 */
export const numberToIndianWords = (num: number): string => {
  if (num === 0) return 'Rupees Zero Only';

  const ones = [
    '', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine',
    'Ten', 'Eleven', 'Twelve', 'Thirteen', 'Fourteen', 'Fifteen', 'Sixteen',
    'Seventeen', 'Eighteen', 'Nineteen'
  ];
  const tens = ['', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety'];

  const convertGroup = (n: number): string => {
    if (n < 20) return ones[n];
    if (n < 100) return tens[Math.floor(n / 10)] + (n % 10 ? ' ' + ones[n % 10] : '');
    if (n < 1000) return ones[Math.floor(n / 100)] + ' Hundred' + (n % 100 ? ' and ' + convertGroup(n % 100) : '');
    if (n < 100000) return convertGroup(Math.floor(n / 1000)) + ' Thousand' + (n % 1000 ? ' ' + convertGroup(n % 1000) : '');
    if (n < 10000000) return convertGroup(Math.floor(n / 100000)) + ' Lakh' + (n % 100000 ? ' ' + convertGroup(n % 100000) : '');
    return convertGroup(Math.floor(n / 10000000)) + ' Crore' + (n % 10000000 ? ' ' + convertGroup(n % 10000000) : '');
  };

  const rupees = Math.floor(Math.abs(num));
  const paise = Math.round((Math.abs(num) - rupees) * 100);

  let result = (num < 0 ? 'Minus ' : '') + 'Rupees ' + convertGroup(rupees);
  if (paise > 0) {
    result += ' and ' + convertGroup(paise) + ' Paise';
  }
  return result + ' Only';
};
