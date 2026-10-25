/**
 * Automated Test Suite for ClinicPulse Pro Indian GST Calculation Engine
 * 
 * Tests compliance with:
 * - Central Goods and Services Tax (CGST) Act, 2017
 * - Notification No. 12/2017-Central Tax (Healthcare Exemptions under SAC 999312)
 * - Section 12 & 13 for Place of Supply (Intra vs Inter-State)
 * - Half-up paise rounding and reverse MRP tax extraction
 */

import {
  isInterStateTransaction,
  validateGstin,
  calculateLineGst,
  calculateInvoiceSummary,
  formatInr,
  numberToIndianWords,
  roundPaise,
  getCurrentFinancialYear,
  HEALTHCARE_TAX_CLASSIFICATIONS
} from '../lib/gstEngine';
import { InvoiceLineItem } from '../types/billing';

export function runGstEngineTests(): { passed: number; failed: number; results: { test: string; status: 'PASS' | 'FAIL'; error?: string }[] } {
  const results: { test: string; status: 'PASS' | 'FAIL'; error?: string }[] = [];
  let passed = 0;
  let failed = 0;

  function assert(testName: string, condition: boolean, errorMsg?: string) {
    if (condition) {
      results.push({ test: testName, status: 'PASS' });
      passed++;
    } else {
      results.push({ test: testName, status: 'FAIL', error: errorMsg || 'Assertion failed' });
      failed++;
    }
  }

  // TEST 1: Intra-state vs Inter-state Place of Supply
  try {
    const intraState = isInterStateTransaction('33', '33'); // Tamil Nadu to Tamil Nadu
    assert('Intra-state detection (33 -> 33 = false)', intraState === false);

    const interState = isInterStateTransaction('33', '29'); // Tamil Nadu to Karnataka
    assert('Inter-state detection (33 -> 29 = true)', interState === true);
  } catch (e: any) {
    assert('Place of Supply test', false, e.message);
  }

  // TEST 2: GSTIN 15-character validation and State Code / PAN extraction
  try {
    const validGstin = '33AAAAA0000A1Z5';
    const v1 = validateGstin(validGstin);
    assert('Valid GSTIN format accepted', v1.isValid && v1.stateCode === '33' && v1.pan === 'AAAAA0000A');

    const invalidShort = validateGstin('33AAAAA0000A');
    assert('Short GSTIN rejected', invalidShort.isValid === false);

    const invalidStateCode = validateGstin('99AAAAA0000A1Z5');
    assert('Invalid state code rejected', invalidStateCode.isValid === false);
  } catch (e: any) {
    assert('GSTIN Validation test', false, e.message);
  }

  // TEST 3: Tax-Exclusive Line Calculation (B2B standard)
  try {
    // 10 units @ ₹100 = ₹1,000. 10% discount = ₹100 -> ₹900 taxable. 12% GST = ₹108 (CGST 54 + SGST 54)
    const lineExclusiveIntra = calculateLineGst({
      quantity: 10,
      unitPrice: 100,
      discountPercent: 10,
      gstRate: 12,
      priceType: 'exclusive',
      isInterState: false
    });

    assert('Tax-exclusive taxable amount', lineExclusiveIntra.taxableAmount === 900);
    assert('Tax-exclusive CGST amount (6%)', lineExclusiveIntra.cgstAmount === 54);
    assert('Tax-exclusive SGST amount (6%)', lineExclusiveIntra.sgstAmount === 54);
    assert('Tax-exclusive IGST amount (0%)', lineExclusiveIntra.igstAmount === 0);
    assert('Tax-exclusive line total', lineExclusiveIntra.totalAmount === 1008);
  } catch (e: any) {
    assert('Tax-exclusive calculation test', false, e.message);
  }

  // TEST 4: Tax-Exclusive Inter-state (IGST)
  try {
    const lineExclusiveInter = calculateLineGst({
      quantity: 2,
      unitPrice: 500,
      discountPercent: 0,
      gstRate: 18,
      priceType: 'exclusive',
      isInterState: true
    });

    assert('Inter-state IGST rate (18%)', lineExclusiveInter.igstAmount === 180);
    assert('Inter-state CGST zeroed', lineExclusiveInter.cgstAmount === 0);
    assert('Inter-state SGST zeroed', lineExclusiveInter.sgstAmount === 0);
    assert('Inter-state line total', lineExclusiveInter.totalAmount === 1180);
  } catch (e: any) {
    assert('Inter-state IGST calculation test', false, e.message);
  }

  // TEST 5: Tax-Inclusive Line Calculation (MRP back-calculation - Pharmacy standard)
  try {
    // 1 unit @ ₹112 inclusive of 12% GST. Base price = 112 / 1.12 = ₹100. GST = ₹12 (CGST 6 + SGST 6)
    const lineInclusive = calculateLineGst({
      quantity: 1,
      unitPrice: 112,
      discountPercent: 0,
      gstRate: 12,
      priceType: 'inclusive',
      isInterState: false
    });

    assert('Tax-inclusive taxable amount extracted', lineInclusive.taxableAmount === 100);
    assert('Tax-inclusive CGST extracted', lineInclusive.cgstAmount === 6);
    assert('Tax-inclusive SGST extracted', lineInclusive.sgstAmount === 6);
    assert('Tax-inclusive total matches gross', lineInclusive.totalAmount === 112);
  } catch (e: any) {
    assert('Tax-inclusive calculation test', false, e.message);
  }

  // TEST 6: Healthcare Exemption (SAC 999312 @ 0%)
  try {
    const doctorConsultation = calculateLineGst({
      quantity: 1,
      unitPrice: 500,
      discountPercent: 0,
      gstRate: 0, // Exempt
      priceType: 'exclusive',
      isInterState: false
    });

    assert('Doctor consultation 0% GST total', doctorConsultation.totalAmount === 500);
    assert('Doctor consultation zero CGST', doctorConsultation.cgstAmount === 0);
    assert('Doctor consultation zero SGST', doctorConsultation.sgstAmount === 0);
  } catch (e: any) {
    assert('Healthcare Exemption test', false, e.message);
  }

  // TEST 7: Full Invoice Summary with Round-Off
  try {
    const dummyItems: InvoiceLineItem[] = [
      {
        id: '1',
        name: 'Doctor OPD Consultation',
        category: 'opd_consultation',
        hsnSacCode: '999312',
        quantity: 1,
        unit: 'Consultation',
        unitPrice: 450,
        discountPercent: 0,
        discountAmount: 0,
        taxableAmount: 450,
        gstRate: 0,
        isExempt: true,
        taxTreatment: 'exempt',
        cgstRate: 0,
        cgstAmount: 0,
        sgstRate: 0,
        sgstAmount: 0,
        igstRate: 0,
        igstAmount: 0,
        totalTax: 0,
        totalAmount: 450
      },
      {
        id: '2',
        name: 'Paracetamol 650mg Tab',
        category: 'pharmacy',
        hsnSacCode: '3004',
        quantity: 10,
        unit: 'Tabs',
        unitPrice: 3.55,
        discountPercent: 0,
        discountAmount: 0,
        taxableAmount: 35.50,
        gstRate: 12,
        isExempt: false,
        taxTreatment: 'taxable',
        cgstRate: 6,
        cgstAmount: 2.13,
        sgstRate: 6,
        sgstAmount: 2.13,
        igstRate: 0,
        igstAmount: 0,
        totalTax: 4.26,
        totalAmount: 39.76
      }
    ];

    const summary = calculateInvoiceSummary(dummyItems, true);
    // Subtotal: 450 + 35.50 = 485.50. Taxable: 485.50. CGST: 2.13. SGST: 2.13. Exact: 489.76.
    // Round-off to nearest rupee: 489.76 -> +0.24 -> ₹490.00
    assert('Grand Total rounded to clean rupee (490)', summary.grandTotal === 490);
    assert('Paise round off delta is +0.24', Math.abs(summary.roundOff - 0.24) < 0.001);
  } catch (e: any) {
    assert('Invoice Summary calculation test', false, e.message);
  }

  // TEST 8: Indian Currency Formatter (Lakh & Crore comma separators)
  try {
    const f1 = formatInr(124500);
    assert('Indian currency format with lakhs (₹1,24,500.00)', f1 === '₹1,24,500.00');

    const f2 = formatInr(500);
    assert('Indian currency format small (₹500.00)', f2 === '₹500.00');
  } catch (e: any) {
    assert('Indian currency formatter test', false, e.message);
  }

  // TEST 9: Number to Indian Words Conversion
  try {
    const words1 = numberToIndianWords(1500);
    assert('Words conversion for 1,500', words1.includes('One Thousand Five Hundred'));

    const words2 = numberToIndianWords(125.50);
    assert('Words conversion with Paise', words2.includes('One Hundred And Twenty Five') && words2.includes('Fifty Paise'));
  } catch (e: any) {
    assert('Number to words test', false, e.message);
  }

  return { passed, failed, results };
}
