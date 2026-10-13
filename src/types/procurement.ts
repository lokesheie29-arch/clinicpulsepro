// Advanced Purchase & Procurement Data Types for ClinicPulse Pro ERP

export type ProcurementOrgType = 'hospital' | 'laboratory' | 'pharmacy';

export type RequisitionPriority = 'Normal' | 'Urgent' | 'Critical';

export type RequisitionStatus = 
  | 'Draft' 
  | 'Submitted' 
  | 'Pending Approval' 
  | 'Approved' 
  | 'Rejected' 
  | 'Returned for Correction' 
  | 'Cancelled' 
  | 'PO Created';

export type RfqStatus = 
  | 'Draft' 
  | 'Sent' 
  | 'Responses Received' 
  | 'Evaluated' 
  | 'Closed' 
  | 'Cancelled';

export type PurchaseOrderStatus = 
  | 'Draft' 
  | 'Pending Approval' 
  | 'Approved' 
  | 'Issued' 
  | 'Acknowledged' 
  | 'Partially Delivered' 
  | 'Delivered' 
  | 'Closed' 
  | 'Cancelled';

export type GrnStatus = 
  | 'Draft' 
  | 'Under Inspection' 
  | 'Inspected' 
  | 'Posted to Inventory' 
  | 'Rejected';

export type InspectionResult = 'Passed' | 'Partial Passed' | 'Failed' | 'Quarantined';

export type SupplierInvoiceStatus = 
  | 'Pending Match' 
  | 'Matched' 
  | 'Discrepancy Flagged' 
  | 'Approved for Payment' 
  | 'Paid' 
  | 'Rejected';

export type SupplierStatus = 'Active' | 'Inactive' | 'Under Review' | 'Blocked';

export type ItemProcurementCategory = 
  // Hospital Categories
  | 'Medicines & Pharmaceuticals'
  | 'Medical Consumables & Disposables'
  | 'Medical Devices & Equipment'
  | 'Surgical Supplies'
  | 'Housekeeping & Facility'
  | 'IT & Administrative'
  // Laboratory Categories
  | 'Reagents & Test Kits'
  | 'Lab Consumables & Plasticware'
  | 'Calibrators & Controls'
  | 'Sample Collection Materials'
  | 'Lab Equipment & Spares'
  // Pharmacy Categories
  | 'Finished Pharmaceuticals'
  | 'OTC & Healthcare'
  | 'Vaccines & Cold Chain'
  | 'Nutritional & Supplements'
  | 'Surgical & Dressings';

export interface ProcurementItemLine {
  id: string;
  itemId?: string;
  itemName: string;
  itemCode?: string;
  category: ItemProcurementCategory;
  description?: string;
  hsnCode: string;
  uom: string; // Units of Measure (Boxes, Strips, Vials, Bottles, Packs, Nos, Kg, Litres)
  requestedQty: number;
  approvedQty?: number;
  estimatedUnitPrice: number;
  quotedUnitPrice?: number;
  discountPercent?: number;
  taxableAmount?: number;
  gstRate: number; // 0, 5, 12, 18, 28
  cgstAmount?: number;
  sgstAmount?: number;
  igstAmount?: number;
  totalAmount: number;
  requiredDeliveryDate?: string;
  specifications?: string;
  batchNo?: string;
  expiryDate?: string;
  mfgDate?: string;
}

export interface SupplierMaster {
  id: string;
  organizationId: string;
  supplierCode: string;
  legalName: string;
  tradeName?: string;
  category: string;
  contactPerson: string;
  email: string;
  phone: string;
  alternatePhone?: string;
  gstin: string;
  pan: string;
  state: string;
  stateCode: string;
  billingAddress: string;
  shippingAddress: string;
  paymentTermsDays: number; // e.g., 15, 30, 45, 60 days
  creditLimit: number;
  bankDetails: {
    bankName: string;
    accountNumberMasked: string;
    ifscCode: string;
    accountHolderName: string;
  };
  productCategories: string[];
  leadTimeDays: number;
  minimumOrderValue: number;
  rating: number; // 1 to 5
  drugLicenseNumber?: string;
  status: SupplierStatus;
  createdAt: string;
  updatedAt: string;
}

export interface PurchaseRequisition {
  id: string;
  requisitionNumber: string; // e.g. PR-2026-0001
  organizationId: string;
  branch: string;
  department: string;
  requestedBy: string;
  requestedByEmail: string;
  requestDate: string;
  requiredDate: string;
  priority: RequisitionPriority;
  status: RequisitionStatus;
  businessJustification: string;
  budgetCode?: string;
  preferredSupplierId?: string;
  preferredSupplierName?: string;
  items: ProcurementItemLine[];
  subTotal: number;
  estimatedTax: number;
  estimatedTotal: number;
  approverRemarks?: string;
  approvedBy?: string;
  approvedAt?: string;
  rejectedReason?: string;
  rfqId?: string;
  purchaseOrderId?: string;
  auditTrail: {
    action: string;
    performedBy: string;
    timestamp: string;
    notes?: string;
  }[];
}

export interface SupplierQuotationEntry {
  id: string;
  rfqId: string;
  supplierId: string;
  supplierName: string;
  quotationRefNumber: string;
  quotationDate: string;
  validUntil: string;
  leadTimeDays: number;
  paymentTerms: string;
  freightCharges: number;
  otherCharges: number;
  items: {
    itemId?: string;
    itemName: string;
    quotedRate: number;
    discountPercent: number;
    gstRate: number;
    taxableAmount: number;
    totalAmount: number;
  }[];
  subTotal: number;
  totalTax: number;
  totalLandedCost: number;
  isRecommended?: boolean;
  isSelected?: boolean;
  selectionRemarks?: string;
}

export interface RequestForQuotation {
  id: string;
  rfqNumber: string; // e.g. RFQ-2026-0001
  organizationId: string;
  requisitionId?: string;
  requisitionNumber?: string;
  title: string;
  enquiryDate: string;
  submissionDeadline: string;
  status: RfqStatus;
  selectedSuppliers: {
    supplierId: string;
    supplierName: string;
    email: string;
    status: 'Pending' | 'Quotation Received' | 'Declined';
  }[];
  items: ProcurementItemLine[];
  termsAndConditions: string;
  quotations: SupplierQuotationEntry[];
  selectedQuotationId?: string;
  evaluationRemarks?: string;
  createdAt: string;
  createdBy: string;
}

export interface PurchaseOrder {
  id: string;
  poNumber: string; // e.g. PO-2026-0001
  revisionNumber: number; // 0, 1, 2...
  organizationId: string;
  branch: string;
  department: string;
  supplierId: string;
  supplierName: string;
  supplierGstin: string;
  supplierAddress: string;
  supplierEmail: string;
  supplierPhone: string;
  rfqId?: string;
  requisitionId?: string;
  poDate: string;
  expectedDeliveryDate: string;
  paymentTerms: string;
  deliveryTerms: string;
  billToAddress: string;
  shipToAddress: string;
  status: PurchaseOrderStatus;
  items: ProcurementItemLine[];
  subTotal: number;
  totalDiscount: number;
  taxableAmount: number;
  cgstTotal: number;
  sgstTotal: number;
  igstTotal: number;
  freightCharges: number;
  totalAmount: number;
  termsAndConditions: string;
  authorizedSignatory: string;
  approvedBy?: string;
  approvedAt?: string;
  deliveredQuantitySummary?: {
    totalOrderedQty: number;
    totalReceivedQty: number;
    totalPendingQty: number;
  };
  auditTrail: {
    action: string;
    performedBy: string;
    timestamp: string;
    notes?: string;
  }[];
  createdAt: string;
}

export interface GoodsReceiptNote {
  id: string;
  grnNumber: string; // e.g. GRN-2026-0001
  organizationId: string;
  purchaseOrderId: string;
  poNumber: string;
  supplierId: string;
  supplierName: string;
  deliveryChallanNumber: string;
  deliveryChallanDate: string;
  receiptDate: string;
  receivedBy: string;
  inspectionResult: InspectionResult;
  status: GrnStatus;
  storageLocation: string; // Warehouse / Main Pharmacy / Central Store
  items: {
    id: string;
    itemName: string;
    orderedQty: number;
    receivedQty: number;
    acceptedQty: number;
    rejectedQty: number;
    damagedQty: number;
    unitPrice: number;
    batchNo: string;
    expiryDate: string;
    mfgDate?: string;
    rejectionReason?: string;
    isStockPosted?: boolean;
  }[];
  totalAcceptedQty: number;
  totalRejectedQty: number;
  qualityRemarks?: string;
  postedToInventoryAt?: string;
  createdAt: string;
}

export interface SupplierInvoiceRecord {
  id: string;
  invoiceNumber: string; // Supplier's invoice #
  systemInvoiceId: string; // e.g. PINV-2026-0001
  organizationId: string;
  supplierId: string;
  supplierName: string;
  supplierGstin: string;
  invoiceDate: string;
  dueDate: string;
  purchaseOrderId: string;
  poNumber: string;
  grnId: string;
  grnNumber: string;
  items: {
    itemName: string;
    billedQty: number;
    grnAcceptedQty: number;
    unitPrice: number;
    poUnitPrice: number;
    taxableAmount: number;
    gstAmount: number;
    totalAmount: number;
    varianceFlag?: boolean;
  }[];
  subTotal: number;
  taxTotal: number;
  freightCharges: number;
  totalInvoiceAmount: number;
  threeWayMatchResult: {
    quantityMatch: boolean;
    priceMatch: boolean;
    taxMatch: boolean;
    discrepancyNotes?: string;
  };
  status: SupplierInvoiceStatus;
  paymentRecord?: {
    paymentDate: string;
    paymentMode: 'NEFT' | 'RTGS' | 'Cheque' | 'UPI';
    transactionRef: string;
    amountPaid: number;
  };
  createdAt: string;
}

export interface PurchaseReturn {
  id: string;
  returnNumber: string; // e.g. PRT-2026-0001
  organizationId: string;
  supplierId: string;
  supplierName: string;
  grnId: string;
  grnNumber: string;
  invoiceId?: string;
  returnDate: string;
  items: {
    itemName: string;
    batchNo: string;
    returnQty: number;
    unitPrice: number;
    totalAmount: number;
    reason: 'Damaged' | 'Expired' | 'Quality Failed' | 'Excess Delivery';
  }[];
  totalReturnAmount: number;
  debitNoteNumber: string;
  status: 'Pending Dispatch' | 'Dispatched to Vendor' | 'Credit Note Received';
  createdAt: string;
}

export interface ProcurementAuditLog {
  id: string;
  organizationId: string;
  entityType: 'Requisition' | 'RFQ' | 'PurchaseOrder' | 'GRN' | 'Invoice' | 'Supplier' | 'Inventory';
  entityId: string;
  action: string;
  performedBy: string;
  timestamp: string;
  details: string;
}
