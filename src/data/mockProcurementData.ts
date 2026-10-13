import {
  SupplierMaster,
  PurchaseRequisition,
  RequestForQuotation,
  PurchaseOrder,
  GoodsReceiptNote,
  SupplierInvoiceRecord,
  PurchaseReturn
} from '../types/procurement';

export const initialSuppliers: SupplierMaster[] = [
  {
    id: 'supp-1',
    organizationId: 'org-default',
    supplierCode: 'VEN-TN-001',
    legalName: 'Apollo MedSolutions Pvt Ltd',
    tradeName: 'Apollo MedSupply',
    category: 'Pharmaceuticals & Generics',
    contactPerson: 'Srinivasan Raman',
    email: 'orders@apollomedsolutions.com',
    phone: '+91 9840123456',
    gstin: '33AAACA1234A1Z5',
    pan: 'AAACA1234A',
    state: 'Tamil Nadu',
    stateCode: '33',
    billingAddress: 'No. 12, Mount Road, Guindy, Chennai, Tamil Nadu 600032',
    shippingAddress: 'Central Logistics Park, Sriperumbudur, Tamil Nadu 602105',
    paymentTermsDays: 30,
    creditLimit: 500000,
    bankDetails: {
      bankName: 'HDFC Bank',
      accountNumberMasked: '•••• •••• 4512',
      ifscCode: 'HDFC0001234',
      accountHolderName: 'Apollo MedSolutions Pvt Ltd'
    },
    productCategories: ['Medicines & Pharmaceuticals', 'Finished Pharmaceuticals', 'Vaccines & Cold Chain'],
    leadTimeDays: 2,
    minimumOrderValue: 5000,
    rating: 4.8,
    drugLicenseNumber: 'TN-CHE-20B-112233',
    status: 'Active',
    createdAt: '2026-01-10T10:00:00Z',
    updatedAt: '2026-04-12T10:00:00Z'
  },
  {
    id: 'supp-2',
    organizationId: 'org-default',
    supplierCode: 'VEN-TN-002',
    legalName: 'Transasia Diagnostics & Scientific Supplies',
    tradeName: 'Transasia Healthcare',
    category: 'Diagnostic Reagents & Kits',
    contactPerson: 'Anitha Rajendran',
    email: 'sales@transasiadiagnostics.com',
    phone: '+91 9841234567',
    gstin: '33AABCT5678B1Z2',
    pan: 'AABCT5678B',
    state: 'Tamil Nadu',
    stateCode: '33',
    billingAddress: 'Plot 45, SIDCO Industrial Estate, Ambattur, Chennai 600058',
    shippingAddress: 'Plot 45, SIDCO Industrial Estate, Ambattur, Chennai 600058',
    paymentTermsDays: 45,
    creditLimit: 350000,
    bankDetails: {
      bankName: 'ICICI Bank',
      accountNumberMasked: '•••• •••• 8821',
      ifscCode: 'ICIC0000567',
      accountHolderName: 'Transasia Diagnostics'
    },
    productCategories: ['Reagents & Test Kits', 'Calibrators & Controls', 'Sample Collection Materials'],
    leadTimeDays: 3,
    minimumOrderValue: 8000,
    rating: 4.6,
    drugLicenseNumber: 'TN-CHE-21B-445566',
    status: 'Active',
    createdAt: '2026-01-15T11:00:00Z',
    updatedAt: '2026-05-01T11:00:00Z'
  },
  {
    id: 'supp-3',
    organizationId: 'org-default',
    supplierCode: 'VEN-MH-003',
    legalName: 'Cipla Institutional Healthcare Ltd',
    tradeName: 'Cipla Direct',
    category: 'Hospital Consumables & Antibiotics',
    contactPerson: 'Vikram Joshi',
    email: 'institutional@cipla.com',
    phone: '+91 9820345678',
    gstin: '27AAACC2233C1Z8',
    pan: 'AAACC2233C',
    state: 'Maharashtra',
    stateCode: '27',
    billingAddress: 'Cipla House, Peninsula Business Park, Lower Parel, Mumbai 400013',
    shippingAddress: 'Bhiwandi Central Warehousing, Thane, Maharashtra 421302',
    paymentTermsDays: 30,
    creditLimit: 1000000,
    bankDetails: {
      bankName: 'State Bank of India',
      accountNumberMasked: '•••• •••• 9901',
      ifscCode: 'SBIN0000300',
      accountHolderName: 'Cipla Institutional Healthcare Ltd'
    },
    productCategories: ['Medicines & Pharmaceuticals', 'Medical Consumables & Disposables', 'Surgical Supplies'],
    leadTimeDays: 4,
    minimumOrderValue: 15000,
    rating: 4.9,
    drugLicenseNumber: 'MH-MUM-20B-998877',
    status: 'Active',
    createdAt: '2026-02-01T09:30:00Z',
    updatedAt: '2026-06-15T09:30:00Z'
  },
  {
    id: 'supp-4',
    organizationId: 'org-default',
    supplierCode: 'VEN-KA-004',
    legalName: 'Bio-Rad Scientific Devices South India',
    tradeName: 'Bio-Rad South',
    category: 'Laboratory Instruments & Calibrators',
    contactPerson: 'Gautam Nambiar',
    email: 'southsales@biorad-devices.in',
    phone: '+91 9900112233',
    gstin: '29AABCB3344D1Z9',
    pan: 'AABCB3344D',
    state: 'Karnataka',
    stateCode: '29',
    billingAddress: 'Tech Boulevard, Outer Ring Road, Bellandur, Bengaluru 560103',
    shippingAddress: 'Warehouse 3, Peenya Industrial Area, Bengaluru 560058',
    paymentTermsDays: 60,
    creditLimit: 750000,
    bankDetails: {
      bankName: 'Axis Bank',
      accountNumberMasked: '•••• •••• 3314',
      ifscCode: 'UTIB0000122',
      accountHolderName: 'Bio-Rad Scientific Devices'
    },
    productCategories: ['Lab Equipment & Spares', 'Calibrators & Controls', 'Medical Devices & Equipment'],
    leadTimeDays: 5,
    minimumOrderValue: 20000,
    rating: 4.5,
    status: 'Active',
    createdAt: '2026-02-20T14:00:00Z',
    updatedAt: '2026-06-20T14:00:00Z'
  }
];

export const initialRequisitions: PurchaseRequisition[] = [
  {
    id: 'pr-101',
    requisitionNumber: 'PR-2026-0001',
    organizationId: 'org-default',
    branch: 'Main Hospital Center',
    department: 'Pharmacy Dispensary',
    requestedBy: 'Dr. Suresh Kumar (Chief Pharmacist)',
    requestedByEmail: 'pharmacist@clinicpulsepro.com',
    requestDate: '2026-10-10',
    requiredDate: '2026-10-18',
    priority: 'Urgent',
    status: 'Approved',
    businessJustification: 'Critical monthly replenishments for emergency ward antipyretics and broad-spectrum antibiotics.',
    budgetCode: 'BUD-MED-2026-Q4',
    preferredSupplierId: 'supp-1',
    preferredSupplierName: 'Apollo MedSolutions Pvt Ltd',
    items: [
      {
        id: 'item-1',
        itemName: 'Paracetamol 650mg Tablets (Dolo 650)',
        itemCode: 'MED-PCM-650',
        category: 'Medicines & Pharmaceuticals',
        hsnCode: '3004',
        uom: 'Strips (15 tabs)',
        requestedQty: 500,
        approvedQty: 500,
        estimatedUnitPrice: 24.50,
        gstRate: 12,
        totalAmount: 13720.00,
        specifications: 'Standard blister pack of 15s. Min 24 months shelf life remaining.'
      },
      {
        id: 'item-2',
        itemName: 'Amoxicillin + Clavulanic Acid 625mg (Augmentin)',
        itemCode: 'MED-AMX-625',
        category: 'Medicines & Pharmaceuticals',
        hsnCode: '3004',
        uom: 'Strips (10 tabs)',
        requestedQty: 200,
        approvedQty: 200,
        estimatedUnitPrice: 145.00,
        gstRate: 12,
        totalAmount: 32480.00,
        specifications: 'Alu-alu blister packaging with moisture barrier.'
      }
    ],
    subTotal: 41250.00,
    estimatedTax: 4950.00,
    estimatedTotal: 46200.00,
    approverRemarks: 'Approved based on stock depletion alerts from emergency OPD ward.',
    approvedBy: 'Medical Director',
    approvedAt: '2026-10-11T14:30:00Z',
    purchaseOrderId: 'po-301',
    auditTrail: [
      {
        action: 'Requisition Created',
        performedBy: 'Dr. Suresh Kumar',
        timestamp: '2026-10-10T09:15:00Z',
        notes: 'Raised after FEFO stock reorder threshold triggered.'
      },
      {
        action: 'Requisition Approved',
        performedBy: 'Medical Director',
        timestamp: '2026-10-11T14:30:00Z',
        notes: 'Approved under Q4 operating budget.'
      }
    ]
  },
  {
    id: 'pr-102',
    requisitionNumber: 'PR-2026-0002',
    organizationId: 'org-default',
    branch: 'Clinical Pathology Lab',
    department: 'Hematology & Biochemistry',
    requestedBy: 'Kavitha S. (Senior Lab Technologist)',
    requestedByEmail: 'lab@clinicpulsepro.com',
    requestDate: '2026-10-12',
    requiredDate: '2026-10-22',
    priority: 'Normal',
    status: 'Pending Approval',
    businessJustification: 'Reagents required for routine CBC, Liver Function and Renal function tests.',
    budgetCode: 'BUD-LAB-2026-Q4',
    preferredSupplierId: 'supp-2',
    preferredSupplierName: 'Transasia Diagnostics & Scientific Supplies',
    items: [
      {
        id: 'item-3',
        itemName: 'Complete Blood Count (CBC) 5-Part Diluent 20L',
        itemCode: 'LAB-REAG-CBC5',
        category: 'Reagents & Test Kits',
        hsnCode: '3822',
        uom: 'Canister (20 Litres)',
        requestedQty: 5,
        estimatedUnitPrice: 3200.00,
        gstRate: 18,
        totalAmount: 18880.00,
        specifications: 'Compatible with automated cell counter analyzer.'
      },
      {
        id: 'item-4',
        itemName: 'K2-EDTA Vacutainer Blood Collection Tubes (2ml)',
        itemCode: 'LAB-TUB-EDTA',
        category: 'Sample Collection Materials',
        hsnCode: '9018',
        uom: 'Box (100 Tubes)',
        requestedQty: 10,
        estimatedUnitPrice: 650.00,
        gstRate: 12,
        totalAmount: 7280.00,
        specifications: 'Sterile, lavender top, vacuum seal intact.'
      }
    ],
    subTotal: 22500.00,
    estimatedTax: 3660.00,
    estimatedTotal: 26160.00,
    auditTrail: [
      {
        action: 'Requisition Submitted',
        performedBy: 'Kavitha S.',
        timestamp: '2026-10-12T11:00:00Z',
        notes: 'Submitted for Lab Director review.'
      }
    ]
  }
];

export const initialRfqs: RequestForQuotation[] = [
  {
    id: 'rfq-201',
    rfqNumber: 'RFQ-2026-0001',
    organizationId: 'org-default',
    requisitionId: 'pr-101',
    requisitionNumber: 'PR-2026-0001',
    title: 'Emergency Antipyretics & Antibiotics Bulk Procurement',
    enquiryDate: '2026-10-11',
    submissionDeadline: '2026-10-14',
    status: 'Evaluated',
    selectedSuppliers: [
      {
        supplierId: 'supp-1',
        supplierName: 'Apollo MedSolutions Pvt Ltd',
        email: 'orders@apollomedsolutions.com',
        status: 'Quotation Received'
      },
      {
        supplierId: 'supp-3',
        supplierName: 'Cipla Institutional Healthcare Ltd',
        email: 'institutional@cipla.com',
        status: 'Quotation Received'
      }
    ],
    items: [
      {
        id: 'item-1',
        itemName: 'Paracetamol 650mg Tablets (Dolo 650)',
        category: 'Medicines & Pharmaceuticals',
        hsnCode: '3004',
        uom: 'Strips (15 tabs)',
        requestedQty: 500,
        estimatedUnitPrice: 24.50,
        gstRate: 12,
        totalAmount: 13720.00
      },
      {
        id: 'item-2',
        itemName: 'Amoxicillin + Clavulanic Acid 625mg (Augmentin)',
        category: 'Medicines & Pharmaceuticals',
        hsnCode: '3004',
        uom: 'Strips (10 tabs)',
        requestedQty: 200,
        estimatedUnitPrice: 145.00,
        gstRate: 12,
        totalAmount: 32480.00
      }
    ],
    termsAndConditions: 'Door delivery to Hospital Central Store. Minimum 85% shelf life at receipt.',
    quotations: [
      {
        id: 'quote-1',
        rfqId: 'rfq-201',
        supplierId: 'supp-1',
        supplierName: 'Apollo MedSolutions Pvt Ltd',
        quotationRefNumber: 'AMS-Q-8921',
        quotationDate: '2026-10-12',
        validUntil: '2026-11-12',
        leadTimeDays: 2,
        paymentTerms: 'Net 30 Days',
        freightCharges: 0,
        otherCharges: 0,
        items: [
          {
            itemName: 'Paracetamol 650mg Tablets (Dolo 650)',
            quotedRate: 22.80,
            discountPercent: 5,
            gstRate: 12,
            taxableAmount: 10830.00,
            totalAmount: 12129.60
          },
          {
            itemName: 'Amoxicillin + Clavulanic Acid 625mg (Augmentin)',
            quotedRate: 138.00,
            discountPercent: 4,
            gstRate: 12,
            taxableAmount: 26496.00,
            totalAmount: 29675.52
          }
        ],
        subTotal: 37326.00,
        totalTax: 4479.12,
        totalLandedCost: 41805.12,
        isRecommended: true,
        isSelected: true,
        selectionRemarks: 'Lowest landed cost, zero freight charge, and fastest 2-day delivery lead time.'
      },
      {
        id: 'quote-2',
        rfqId: 'rfq-201',
        supplierId: 'supp-3',
        supplierName: 'Cipla Institutional Healthcare Ltd',
        quotationRefNumber: 'CIP-INST-4431',
        quotationDate: '2026-10-13',
        validUntil: '2026-11-13',
        leadTimeDays: 4,
        paymentTerms: 'Net 30 Days',
        freightCharges: 450,
        otherCharges: 0,
        items: [
          {
            itemName: 'Paracetamol 650mg Tablets (Dolo 650)',
            quotedRate: 23.50,
            discountPercent: 3,
            gstRate: 12,
            taxableAmount: 11397.50,
            totalAmount: 12765.20
          },
          {
            itemName: 'Amoxicillin + Clavulanic Acid 625mg (Augmentin)',
            quotedRate: 142.00,
            discountPercent: 5,
            gstRate: 12,
            taxableAmount: 26980.00,
            totalAmount: 30217.60
          }
        ],
        subTotal: 38377.50,
        totalTax: 4605.30,
        totalLandedCost: 43432.80,
        isRecommended: false,
        isSelected: false
      }
    ],
    selectedQuotationId: 'quote-1',
    evaluationRemarks: 'Awarded to Apollo MedSolutions after comparative savings analysis (Savings: ₹1,627.68).',
    createdAt: '2026-10-11T15:00:00Z',
    createdBy: 'Procurement Manager'
  }
];

export const initialPurchaseOrders: PurchaseOrder[] = [
  {
    id: 'po-301',
    poNumber: 'PO-2026-0001',
    revisionNumber: 0,
    organizationId: 'org-default',
    branch: 'Main Hospital Center',
    department: 'Central Pharmacy',
    supplierId: 'supp-1',
    supplierName: 'Apollo MedSolutions Pvt Ltd',
    supplierGstin: '33AAACA1234A1Z5',
    supplierAddress: 'No. 12, Mount Road, Guindy, Chennai, Tamil Nadu 600032',
    supplierEmail: 'orders@apollomedsolutions.com',
    supplierPhone: '+91 9840123456',
    rfqId: 'rfq-201',
    requisitionId: 'pr-101',
    poDate: '2026-10-12',
    expectedDeliveryDate: '2026-10-15',
    paymentTerms: 'Net 30 Days',
    deliveryTerms: 'Door Delivery to Hospital Central Pharmacy Store',
    billToAddress: 'ClinicPulse Pro Healthcare Center, No.29, Kamarajar Street, Pallavan Nagar, TNHB, Kancheepuram, Tamil Nadu. 631501',
    shipToAddress: 'ClinicPulse Pro Healthcare Center, No.29, Kamarajar Street, Pallavan Nagar, TNHB, Kancheepuram, Tamil Nadu. 631501',
    status: 'Approved',
    items: [
      {
        id: 'item-1',
        itemName: 'Paracetamol 650mg Tablets (Dolo 650)',
        category: 'Medicines & Pharmaceuticals',
        hsnCode: '3004',
        uom: 'Strips (15 tabs)',
        requestedQty: 500,
        estimatedUnitPrice: 21.66,
        gstRate: 12,
        totalAmount: 12129.60,
        specifications: 'Batch with minimum 2-year shelf life.'
      },
      {
        id: 'item-2',
        itemName: 'Amoxicillin + Clavulanic Acid 625mg (Augmentin)',
        category: 'Medicines & Pharmaceuticals',
        hsnCode: '3004',
        uom: 'Strips (10 tabs)',
        requestedQty: 200,
        estimatedUnitPrice: 132.48,
        gstRate: 12,
        totalAmount: 29675.52,
        specifications: 'Alu-alu blister packaging with cold pack.'
      }
    ],
    subTotal: 37326.00,
    totalDiscount: 1800.00,
    taxableAmount: 37326.00,
    cgstTotal: 2239.56,
    sgstTotal: 2239.56,
    igstTotal: 0,
    freightCharges: 0,
    totalAmount: 41805.12,
    termsAndConditions: '1. Damaged or near-expiry goods will be rejected at GRN inspection.\n2. Invoices must include GSTIN, PO number, and batch certificates.\n3. Goods must arrive between 09:00 AM and 05:00 PM.',
    authorizedSignatory: 'Dr. Lokesh K. (Medical Superintendent)',
    approvedBy: 'Procurement Committee',
    approvedAt: '2026-10-12T16:00:00Z',
    deliveredQuantitySummary: {
      totalOrderedQty: 700,
      totalReceivedQty: 700,
      totalPendingQty: 0
    },
    auditTrail: [
      {
        action: 'PO Generated from RFQ-2026-0001',
        performedBy: 'Procurement Specialist',
        timestamp: '2026-10-12T15:30:00Z',
        notes: 'Awarded to Apollo MedSolutions.'
      },
      {
        action: 'PO Approved & Issued',
        performedBy: 'Dr. Lokesh K.',
        timestamp: '2026-10-12T16:00:00Z',
        notes: 'Authorized for purchase dispatch.'
      }
    ],
    createdAt: '2026-10-12T15:30:00Z'
  }
];

export const initialGoodsReceiptNotes: GoodsReceiptNote[] = [
  {
    id: 'grn-401',
    grnNumber: 'GRN-2026-0001',
    organizationId: 'org-default',
    purchaseOrderId: 'po-301',
    poNumber: 'PO-2026-0001',
    supplierId: 'supp-1',
    supplierName: 'Apollo MedSolutions Pvt Ltd',
    deliveryChallanNumber: 'DC-AMS-9981',
    deliveryChallanDate: '2026-10-13',
    receiptDate: '2026-10-13',
    receivedBy: 'Store Supervisor (K. Ramesh)',
    inspectionResult: 'Passed',
    status: 'Posted to Inventory',
    storageLocation: 'Central Pharmacy Warehouse Rack-B2',
    items: [
      {
        id: 'item-1',
        itemName: 'Paracetamol 650mg Tablets (Dolo 650)',
        orderedQty: 500,
        receivedQty: 500,
        acceptedQty: 500,
        rejectedQty: 0,
        damagedQty: 0,
        unitPrice: 21.66,
        batchNo: 'B202610A',
        expiryDate: '2028-09-30',
        mfgDate: '2026-09-01',
        isStockPosted: true
      },
      {
        id: 'item-2',
        itemName: 'Amoxicillin + Clavulanic Acid 625mg (Augmentin)',
        orderedQty: 200,
        receivedQty: 200,
        acceptedQty: 195,
        rejectedQty: 5,
        damagedQty: 5,
        unitPrice: 132.48,
        batchNo: 'B202610B',
        expiryDate: '2028-08-31',
        mfgDate: '2026-08-15',
        rejectionReason: 'Outer foil crushed during transit.',
        isStockPosted: true
      }
    ],
    totalAcceptedQty: 695,
    totalRejectedQty: 5,
    qualityRemarks: 'Quality verification passed. Certificate of Analysis (CoA) verified. 5 strips Augmentin rejected due to damaged blister foil.',
    postedToInventoryAt: '2026-10-13T14:00:00Z',
    createdAt: '2026-10-13T11:00:00Z'
  }
];

export const initialSupplierInvoices: SupplierInvoiceRecord[] = [
  {
    id: 'pinv-501',
    invoiceNumber: 'INV-AMS-88912',
    systemInvoiceId: 'PINV-2026-0001',
    organizationId: 'org-default',
    supplierId: 'supp-1',
    supplierName: 'Apollo MedSolutions Pvt Ltd',
    supplierGstin: '33AAACA1234A1Z5',
    invoiceDate: '2026-10-13',
    dueDate: '2026-11-12',
    purchaseOrderId: 'po-301',
    poNumber: 'PO-2026-0001',
    grnId: 'grn-401',
    grnNumber: 'GRN-2026-0001',
    items: [
      {
        itemName: 'Paracetamol 650mg Tablets (Dolo 650)',
        billedQty: 500,
        grnAcceptedQty: 500,
        unitPrice: 21.66,
        poUnitPrice: 21.66,
        taxableAmount: 10830.00,
        gstAmount: 1299.60,
        totalAmount: 12129.60,
        varianceFlag: false
      },
      {
        itemName: 'Amoxicillin + Clavulanic Acid 625mg (Augmentin)',
        billedQty: 195,
        grnAcceptedQty: 195,
        unitPrice: 132.48,
        poUnitPrice: 132.48,
        taxableAmount: 25833.60,
        gstAmount: 3100.03,
        totalAmount: 28933.63,
        varianceFlag: false
      }
    ],
    subTotal: 36663.60,
    taxTotal: 4399.63,
    freightCharges: 0,
    totalInvoiceAmount: 41063.23,
    threeWayMatchResult: {
      quantityMatch: true,
      priceMatch: true,
      taxMatch: true,
      discrepancyNotes: '3-Way Match Verified (PO vs GRN vs Supplier Invoice). Adjusted for 5 damaged strips at GRN.'
    },
    status: 'Approved for Payment',
    createdAt: '2026-10-13T14:30:00Z'
  }
];

export const initialPurchaseReturns: PurchaseReturn[] = [
  {
    id: 'prt-601',
    returnNumber: 'PRT-2026-0001',
    organizationId: 'org-default',
    supplierId: 'supp-1',
    supplierName: 'Apollo MedSolutions Pvt Ltd',
    grnId: 'grn-401',
    grnNumber: 'GRN-2026-0001',
    invoiceId: 'pinv-501',
    returnDate: '2026-10-13',
    items: [
      {
        itemName: 'Amoxicillin + Clavulanic Acid 625mg (Augmentin)',
        batchNo: 'B202610B',
        returnQty: 5,
        unitPrice: 132.48,
        totalAmount: 662.40,
        reason: 'Damaged'
      }
    ],
    totalReturnAmount: 741.89, // With 12% GST
    debitNoteNumber: 'DN-2026-0001',
    status: 'Dispatched to Vendor',
    createdAt: '2026-10-13T15:00:00Z'
  }
];
