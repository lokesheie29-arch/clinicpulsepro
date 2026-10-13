import React, { createContext, useContext, useState, useEffect, useMemo } from 'react';
import {
  SupplierMaster,
  PurchaseRequisition,
  RequestForQuotation,
  SupplierQuotationEntry,
  PurchaseOrder,
  GoodsReceiptNote,
  SupplierInvoiceRecord,
  PurchaseReturn,
  ProcurementOrgType
} from '../types/procurement';
import {
  initialSuppliers,
  initialRequisitions,
  initialRfqs,
  initialPurchaseOrders,
  initialGoodsReceiptNotes,
  initialSupplierInvoices,
  initialPurchaseReturns
} from '../data/mockProcurementData';
import { supabase } from '../lib/supabase';
import { useAppState } from './AppStateContext';
import { useUser } from '@clerk/react';
import { v4 as uuidv4 } from 'uuid';

interface ProcurementContextType {
  // Master state
  suppliers: SupplierMaster[];
  requisitions: PurchaseRequisition[];
  rfqs: RequestForQuotation[];
  purchaseOrders: PurchaseOrder[];
  grns: GoodsReceiptNote[];
  supplierInvoices: SupplierInvoiceRecord[];
  purchaseReturns: PurchaseReturn[];

  // Tenant / Filtering
  activeBranch: string;
  setActiveBranch: (branch: string) => void;
  activeDepartment: string;
  setActiveDepartment: (dept: string) => void;

  // Supplier Actions
  addSupplier: (supplier: SupplierMaster) => void;
  updateSupplier: (id: string, updated: Partial<SupplierMaster>) => void;
  toggleSupplierStatus: (id: string) => void;

  // Requisition Actions
  createRequisition: (req: PurchaseRequisition) => void;
  approveRequisition: (id: string, approverName: string, remarks?: string) => void;
  rejectRequisition: (id: string, reason: string) => void;

  // RFQ Actions
  createRfq: (rfq: RequestForQuotation) => void;
  recordSupplierQuotation: (rfqId: string, quote: SupplierQuotationEntry) => void;
  selectQuotation: (rfqId: string, quoteId: string, remarks: string) => void;

  // Purchase Order Actions
  createPurchaseOrder: (po: PurchaseOrder) => void;
  approvePurchaseOrder: (id: string, approverName: string) => void;
  cancelPurchaseOrder: (id: string, reason: string) => void;

  // GRN Actions
  createGoodsReceipt: (grn: GoodsReceiptNote) => void;
  postGrnToInventory: (grnId: string) => void;

  // Supplier Invoice Actions
  createSupplierInvoice: (inv: SupplierInvoiceRecord) => void;
  approveSupplierInvoiceForPayment: (id: string) => void;

  // Return Actions
  createPurchaseReturn: (ret: PurchaseReturn) => void;

  // Reset
  resetProcurementData: () => void;
}

const ProcurementContext = createContext<ProcurementContextType | undefined>(undefined);

const STORAGE_KEYS = {
  SUPPLIERS: 'clinicpulse_proc_suppliers_v1',
  REQUISITIONS: 'clinicpulse_proc_requisitions_v1',
  RFQS: 'clinicpulse_proc_rfqs_v1',
  POS: 'clinicpulse_proc_pos_v1',
  GRNS: 'clinicpulse_proc_grns_v1',
  INVOICES: 'clinicpulse_proc_invoices_v1',
  RETURNS: 'clinicpulse_proc_returns_v1',
  BRANCH: 'clinicpulse_proc_branch_v1',
  DEPT: 'clinicpulse_proc_dept_v1'
};

export const ProcurementProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { addMedicine, restockMedicine, medicines } = useAppState();
  const { user } = useUser();

  const [suppliers, setSuppliers] = useState<SupplierMaster[]>([]);
  const [requisitions, setRequisitions] = useState<PurchaseRequisition[]>([]);
  const [rfqs, setRfqs] = useState<RequestForQuotation[]>([]);
  const [purchaseOrders, setPurchaseOrders] = useState<PurchaseOrder[]>([]);
  const [grns, setGrns] = useState<GoodsReceiptNote[]>([]);
  const [supplierInvoices, setSupplierInvoices] = useState<SupplierInvoiceRecord[]>([]);
  const [purchaseReturns, setPurchaseReturns] = useState<PurchaseReturn[]>([]);

  const [activeBranch, setActiveBranch] = useState<string>(() => {
    return localStorage.getItem(STORAGE_KEYS.BRANCH) || 'All Branches';
  });

  const [activeDepartment, setActiveDepartment] = useState<string>(() => {
    return localStorage.getItem(STORAGE_KEYS.DEPT) || 'All Departments';
  });

  const [isLoaded, setIsLoaded] = useState(false);

  // 1. Initial Load: Local Cache first, then Supabase in background
  useEffect(() => {
    const loadProcurementData = async () => {
      // Load Local Storage
      const cachedSuppliers = localStorage.getItem(STORAGE_KEYS.SUPPLIERS);
      const cachedReqs = localStorage.getItem(STORAGE_KEYS.REQUISITIONS);
      const cachedRfqs = localStorage.getItem(STORAGE_KEYS.RFQS);
      const cachedPos = localStorage.getItem(STORAGE_KEYS.POS);
      const cachedGrns = localStorage.getItem(STORAGE_KEYS.GRNS);
      const cachedInvs = localStorage.getItem(STORAGE_KEYS.INVOICES);
      const cachedReturns = localStorage.getItem(STORAGE_KEYS.RETURNS);

      setSuppliers(cachedSuppliers ? JSON.parse(cachedSuppliers) : initialSuppliers);
      setRequisitions(cachedReqs ? JSON.parse(cachedReqs) : initialRequisitions);
      setRfqs(cachedRfqs ? JSON.parse(cachedRfqs) : initialRfqs);
      setPurchaseOrders(cachedPos ? JSON.parse(cachedPos) : initialPurchaseOrders);
      setGrns(cachedGrns ? JSON.parse(cachedGrns) : initialGoodsReceiptNotes);
      setSupplierInvoices(cachedInvs ? JSON.parse(cachedInvs) : initialSupplierInvoices);
      setPurchaseReturns(cachedReturns ? JSON.parse(cachedReturns) : initialPurchaseReturns);

      // Attempt Supabase Fetch
      try {
        const { data: supaSuppliers } = await supabase.from('procurement_suppliers').select('*');
        if (supaSuppliers && supaSuppliers.length > 0) {
          setSuppliers(supaSuppliers.map((s: any) => ({
            id: s.id,
            organizationId: s.organization_id,
            supplierCode: s.supplier_code,
            legalName: s.legal_name,
            tradeName: s.trade_name,
            category: s.category,
            contactPerson: s.contact_person,
            email: s.email,
            phone: s.phone,
            alternatePhone: s.alternate_phone,
            gstin: s.gstin,
            pan: s.pan,
            state: s.state,
            stateCode: s.state_code,
            billingAddress: s.billing_address,
            shippingAddress: s.shipping_address,
            paymentTermsDays: Number(s.payment_terms_days),
            creditLimit: Number(s.credit_limit),
            bankDetails: s.bank_details || {},
            productCategories: s.product_categories || [],
            leadTimeDays: Number(s.lead_time_days),
            minimumOrderValue: Number(s.minimum_order_value),
            rating: Number(s.rating),
            drugLicenseNumber: s.drug_license_number,
            status: s.status,
            createdAt: s.created_at,
            updatedAt: s.updated_at
          })));
        }

        const { data: supaPOs } = await supabase.from('procurement_purchase_orders').select('*');
        if (supaPOs && supaPOs.length > 0) {
          setPurchaseOrders(supaPOs.map((p: any) => ({
            id: p.id,
            poNumber: p.po_number,
            revisionNumber: Number(p.revision_number),
            organizationId: p.organization_id,
            branch: p.branch,
            department: p.department,
            supplierId: p.supplier_id,
            supplierName: p.supplier_name,
            supplierGstin: p.supplier_gstin,
            supplierAddress: p.supplier_address,
            supplierEmail: p.supplier_email,
            supplierPhone: p.supplier_phone,
            rfqId: p.rfq_id,
            requisitionId: p.requisition_id,
            poDate: p.po_date,
            expectedDeliveryDate: p.expected_delivery_date,
            paymentTerms: p.payment_terms,
            deliveryTerms: p.delivery_terms,
            billToAddress: p.bill_to_address,
            shipToAddress: p.ship_to_address,
            status: p.status,
            items: p.items || [],
            subTotal: Number(p.sub_total),
            totalDiscount: Number(p.total_discount),
            taxableAmount: Number(p.taxable_amount),
            cgstTotal: Number(p.cgst_total),
            sgstTotal: Number(p.sgst_total),
            igstTotal: Number(p.igst_total),
            freightCharges: Number(p.freight_charges),
            totalAmount: Number(p.total_amount),
            termsAndConditions: p.terms_and_conditions,
            authorizedSignatory: p.authorized_signatory,
            approvedBy: p.approved_by,
            approvedAt: p.approved_at,
            deliveredQuantitySummary: p.delivered_quantity_summary,
            auditTrail: p.audit_trail || [],
            createdAt: p.created_at
          })));
        }
      } catch (err) {
        console.warn('Procurement Supabase sync in offline/demo mode:', err);
      }

      setIsLoaded(true);
    };

    loadProcurementData();
  }, []);

  // 2. Persist to Local Storage
  useEffect(() => {
    if (isLoaded) {
      localStorage.setItem(STORAGE_KEYS.SUPPLIERS, JSON.stringify(suppliers));
      localStorage.setItem(STORAGE_KEYS.REQUISITIONS, JSON.stringify(requisitions));
      localStorage.setItem(STORAGE_KEYS.RFQS, JSON.stringify(rfqs));
      localStorage.setItem(STORAGE_KEYS.POS, JSON.stringify(purchaseOrders));
      localStorage.setItem(STORAGE_KEYS.GRNS, JSON.stringify(grns));
      localStorage.setItem(STORAGE_KEYS.INVOICES, JSON.stringify(supplierInvoices));
      localStorage.setItem(STORAGE_KEYS.RETURNS, JSON.stringify(purchaseReturns));
      localStorage.setItem(STORAGE_KEYS.BRANCH, activeBranch);
      localStorage.setItem(STORAGE_KEYS.DEPT, activeDepartment);
    }
  }, [suppliers, requisitions, rfqs, purchaseOrders, grns, supplierInvoices, purchaseReturns, activeBranch, activeDepartment, isLoaded]);

  // Supplier Handlers
  const addSupplier = (supplier: SupplierMaster) => {
    setSuppliers(prev => [supplier, ...prev]);
    supabase.from('procurement_suppliers').insert({
      id: supplier.id,
      organization_id: supplier.organizationId,
      supplier_code: supplier.supplierCode,
      legal_name: supplier.legalName,
      trade_name: supplier.tradeName,
      category: supplier.category,
      contact_person: supplier.contactPerson,
      email: supplier.email,
      phone: supplier.phone,
      gstin: supplier.gstin,
      pan: supplier.pan,
      state: supplier.state,
      state_code: supplier.stateCode,
      billing_address: supplier.billingAddress,
      shipping_address: supplier.shippingAddress,
      payment_terms_days: supplier.paymentTermsDays,
      credit_limit: supplier.creditLimit,
      bank_details: supplier.bankDetails,
      product_categories: supplier.productCategories,
      status: supplier.status
    }).then();
  };

  const updateSupplier = (id: string, updated: Partial<SupplierMaster>) => {
    setSuppliers(prev => prev.map(s => s.id === id ? { ...s, ...updated } : s));
  };

  const toggleSupplierStatus = (id: string) => {
    setSuppliers(prev => prev.map(s => {
      if (s.id === id) {
        const nextStatus = s.status === 'Active' ? 'Blocked' : 'Active';
        return { ...s, status: nextStatus };
      }
      return s;
    }));
  };

  // Requisition Handlers
  const createRequisition = (req: PurchaseRequisition) => {
    setRequisitions(prev => [req, ...prev]);
    supabase.from('procurement_requisitions').insert({
      id: req.id,
      requisition_number: req.requisitionNumber,
      organization_id: req.organizationId,
      branch: req.branch,
      department: req.department,
      requested_by: req.requestedBy,
      requested_by_email: req.requestedByEmail,
      request_date: req.requestDate,
      required_date: req.requiredDate,
      priority: req.priority,
      status: req.status,
      business_justification: req.businessJustification,
      items: req.items,
      sub_total: req.subTotal,
      estimated_tax: req.estimatedTax,
      estimated_total: req.estimatedTotal,
      audit_trail: req.auditTrail
    }).then();
  };

  const approveRequisition = (id: string, approverName: string, remarks?: string) => {
    setRequisitions(prev => prev.map(r => {
      if (r.id === id) {
        return {
          ...r,
          status: 'Approved',
          approvedBy: approverName,
          approvedAt: new Date().toISOString(),
          approverRemarks: remarks || 'Approved for procurement enquiry.',
          auditTrail: [
            ...r.auditTrail,
            {
              action: 'Approved by ' + approverName,
              performedBy: approverName,
              timestamp: new Date().toISOString(),
              notes: remarks
            }
          ]
        };
      }
      return r;
    }));
  };

  const rejectRequisition = (id: string, reason: string) => {
    setRequisitions(prev => prev.map(r => {
      if (r.id === id) {
        return {
          ...r,
          status: 'Rejected',
          rejectedReason: reason,
          auditTrail: [
            ...r.auditTrail,
            {
              action: 'Rejected',
              performedBy: 'Approver',
              timestamp: new Date().toISOString(),
              notes: reason
            }
          ]
        };
      }
      return r;
    }));
  };

  // RFQ Handlers
  const createRfq = (rfq: RequestForQuotation) => {
    setRfqs(prev => [rfq, ...prev]);
  };

  const recordSupplierQuotation = (rfqId: string, quote: SupplierQuotationEntry) => {
    setRfqs(prev => prev.map(rfq => {
      if (rfq.id === rfqId) {
        const existingQuotes = rfq.quotations || [];
        return {
          ...rfq,
          status: 'Responses Received',
          quotations: [...existingQuotes, quote]
        };
      }
      return rfq;
    }));
  };

  const selectQuotation = (rfqId: string, quoteId: string, remarks: string) => {
    setRfqs(prev => prev.map(rfq => {
      if (rfq.id === rfqId) {
        const updatedQuotes = rfq.quotations.map(q => ({
          ...q,
          isSelected: q.id === quoteId,
          selectionRemarks: q.id === quoteId ? remarks : undefined
        }));
        return {
          ...rfq,
          status: 'Evaluated',
          selectedQuotationId: quoteId,
          evaluationRemarks: remarks,
          quotations: updatedQuotes
        };
      }
      return rfq;
    }));
  };

  // Purchase Order Handlers
  const createPurchaseOrder = (po: PurchaseOrder) => {
    setPurchaseOrders(prev => [po, ...prev]);
    supabase.from('procurement_purchase_orders').insert({
      id: po.id,
      po_number: po.poNumber,
      revision_number: po.revisionNumber,
      organization_id: po.organizationId,
      branch: po.branch,
      department: po.department,
      supplier_id: po.supplierId,
      supplier_name: po.supplierName,
      supplier_gstin: po.supplierGstin,
      supplier_address: po.supplierAddress,
      supplier_email: po.supplierEmail,
      supplier_phone: po.supplierPhone,
      po_date: po.poDate,
      expected_delivery_date: po.expectedDeliveryDate,
      payment_terms: po.paymentTerms,
      delivery_terms: po.deliveryTerms,
      status: po.status,
      items: po.items,
      sub_total: po.subTotal,
      taxable_amount: po.taxableAmount,
      cgst_total: po.cgstTotal,
      sgst_total: po.sgstTotal,
      total_amount: po.totalAmount,
      authorized_signatory: po.authorizedSignatory,
      audit_trail: po.auditTrail
    }).then();
  };

  const approvePurchaseOrder = (id: string, approverName: string) => {
    setPurchaseOrders(prev => prev.map(po => {
      if (po.id === id) {
        return {
          ...po,
          status: 'Issued',
          approvedBy: approverName,
          approvedAt: new Date().toISOString(),
          auditTrail: [
            ...po.auditTrail,
            {
              action: 'Approved & Issued to Supplier',
              performedBy: approverName,
              timestamp: new Date().toISOString()
            }
          ]
        };
      }
      return po;
    }));
  };

  const cancelPurchaseOrder = (id: string, reason: string) => {
    setPurchaseOrders(prev => prev.map(po => {
      if (po.id === id) {
        return {
          ...po,
          status: 'Cancelled',
          auditTrail: [
            ...po.auditTrail,
            {
              action: 'PO Cancelled',
              performedBy: 'Procurement Authority',
              timestamp: new Date().toISOString(),
              notes: reason
            }
          ]
        };
      }
      return po;
    }));
  };

  // Goods Receipt Note Handlers & FEFO Inventory Integration
  const createGoodsReceipt = (grn: GoodsReceiptNote) => {
    setGrns(prev => [grn, ...prev]);
  };

  const postGrnToInventory = (grnId: string) => {
    setGrns(prev => prev.map(grn => {
      if (grn.id === grnId && grn.status !== 'Posted to Inventory') {
        // Reconcile and post accepted items into ClinicPulse inventory
        grn.items.forEach(item => {
          if (item.acceptedQty > 0) {
            // Check if item already exists in medicines catalog
            const existingMed = medicines.find(
              m => m.brandName.toLowerCase().includes(item.itemName.toLowerCase()) ||
                   item.itemName.toLowerCase().includes(m.brandName.toLowerCase())
            );

            if (existingMed) {
              // Restock existing SKU
              restockMedicine(existingMed.id, item.acceptedQty);
            } else {
              // Add as a new verified FEFO catalog entry
              addMedicine({
                id: `med-${uuidv4().substring(0, 8)}`,
                brandName: item.itemName,
                genericName: item.itemName,
                batchNo: item.batchNo || `B${new Date().getFullYear()}`,
                hsn: '3004',
                costPrice: item.unitPrice,
                sellingPrice: item.unitPrice * 1.35, // 35% margin
                gstRate: 12,
                stock: item.acceptedQty,
                minStockAlert: 50,
                expiryDate: item.expiryDate || new Date(Date.now() + 500 * 86400000).toISOString().split('T')[0],
                category: 'Pharmaceuticals'
              });
            }
          }
        });

        // Update PO Delivered Summary
        setPurchaseOrders(prevPos => prevPos.map(po => {
          if (po.id === grn.purchaseOrderId || po.poNumber === grn.poNumber) {
            const currentSummary = po.deliveredQuantitySummary || {
              totalOrderedQty: po.items.reduce((a, b) => a + b.requestedQty, 0),
              totalReceivedQty: 0,
              totalPendingQty: 0
            };
            const newReceived = currentSummary.totalReceivedQty + grn.totalAcceptedQty;
            const newPending = Math.max(0, currentSummary.totalOrderedQty - newReceived);
            const newStatus = newPending === 0 ? 'Delivered' : 'Partially Delivered';

            return {
              ...po,
              status: newStatus,
              deliveredQuantitySummary: {
                totalOrderedQty: currentSummary.totalOrderedQty,
                totalReceivedQty: newReceived,
                totalPendingQty: newPending
              }
            };
          }
          return po;
        }));

        return {
          ...grn,
          status: 'Posted to Inventory',
          postedToInventoryAt: new Date().toISOString()
        };
      }
      return grn;
    }));
  };

  // Supplier Invoices & 3-Way Matching Handlers
  const createSupplierInvoice = (inv: SupplierInvoiceRecord) => {
    setSupplierInvoices(prev => [inv, ...prev]);
  };

  const approveSupplierInvoiceForPayment = (id: string) => {
    setSupplierInvoices(prev => prev.map(inv => {
      if (inv.id === id) {
        return {
          ...inv,
          status: 'Approved for Payment'
        };
      }
      return inv;
    }));
  };

  // Purchase Return Handlers
  const createPurchaseReturn = (ret: PurchaseReturn) => {
    setPurchaseReturns(prev => [ret, ...prev]);
  };

  // Reset
  const resetProcurementData = () => {
    setSuppliers(initialSuppliers);
    setRequisitions(initialRequisitions);
    setRfqs(initialRfqs);
    setPurchaseOrders(initialPurchaseOrders);
    setGrns(initialGoodsReceiptNotes);
    setSupplierInvoices(initialSupplierInvoices);
    setPurchaseReturns(initialPurchaseReturns);
    localStorage.removeItem(STORAGE_KEYS.SUPPLIERS);
    localStorage.removeItem(STORAGE_KEYS.REQUISITIONS);
    localStorage.removeItem(STORAGE_KEYS.RFQS);
    localStorage.removeItem(STORAGE_KEYS.POS);
    localStorage.removeItem(STORAGE_KEYS.GRNS);
    localStorage.removeItem(STORAGE_KEYS.INVOICES);
    localStorage.removeItem(STORAGE_KEYS.RETURNS);
  };

  return (
    <ProcurementContext.Provider value={{
      suppliers,
      requisitions,
      rfqs,
      purchaseOrders,
      grns,
      supplierInvoices,
      purchaseReturns,
      activeBranch,
      setActiveBranch,
      activeDepartment,
      setActiveDepartment,
      addSupplier,
      updateSupplier,
      toggleSupplierStatus,
      createRequisition,
      approveRequisition,
      rejectRequisition,
      createRfq,
      recordSupplierQuotation,
      selectQuotation,
      createPurchaseOrder,
      approvePurchaseOrder,
      cancelPurchaseOrder,
      createGoodsReceipt,
      postGrnToInventory,
      createSupplierInvoice,
      approveSupplierInvoiceForPayment,
      createPurchaseReturn,
      resetProcurementData
    }}>
      {children}
    </ProcurementContext.Provider>
  );
};

export const useProcurement = () => {
  const context = useContext(ProcurementContext);
  if (!context) throw new Error('useProcurement must be used within ProcurementProvider');
  return context;
};
