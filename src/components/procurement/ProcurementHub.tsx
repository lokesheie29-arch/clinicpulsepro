import React, { useState } from 'react';
import { 
  LayoutDashboard, 
  FileText, 
  Send, 
  Scale, 
  ShoppingCart, 
  PackageCheck, 
  Receipt, 
  RotateCcw, 
  Users, 
  CheckCircle2, 
  FileSpreadsheet, 
  Building2, 
  Layers, 
  Database, 
  RefreshCw,
  Plus,
  Sparkles,
  ShieldCheck,
  ChevronRight
} from 'lucide-react';
import { useProcurement } from '../../context/ProcurementContext';
import { useAppState } from '../../context/AppStateContext';

// Procurement Sub-Modules
import { ProcurementDashboard } from './ProcurementDashboard';
import { PurchaseRequisitions } from './PurchaseRequisitions';
import { RfqManagement } from './RfqManagement';
import { QuotationComparison } from './QuotationComparison';
import { PurchaseOrders } from './PurchaseOrders';
import { GoodsReceiptNotes } from './GoodsReceiptNotes';
import { SupplierInvoiceMatching } from './SupplierInvoiceMatching';
import { PurchaseReturns } from './PurchaseReturns';
import { SupplierMaster } from './SupplierMaster';
import { ApprovalInbox } from './ApprovalInbox';
import { ProcurementReports } from './ProcurementReports';

type ProcurementTab = 
  | 'dashboard' 
  | 'requisitions' 
  | 'rfqs' 
  | 'quotations' 
  | 'orders' 
  | 'grn' 
  | 'invoices' 
  | 'returns' 
  | 'suppliers' 
  | 'approvals' 
  | 'reports';

export const ProcurementHub: React.FC = () => {
  const [activeTab, setActiveTab] = useState<ProcurementTab>('dashboard');
  const { orgType } = useAppState();
  const { 
    requisitions, 
    purchaseOrders, 
    supplierInvoices, 
    suppliers,
    activeBranch,
    setActiveBranch,
    activeDepartment,
    setActiveDepartment,
    resetProcurementData 
  } = useProcurement();

  // Pending counts for badges
  const pendingPRCount = requisitions.filter(r => r.status === 'Submitted').length;
  const pendingPOCount = purchaseOrders.filter(p => p.status === 'Draft' || p.status === 'Pending Approval').length;
  const pendingInvCount = supplierInvoices.filter(i => i.status === 'Pending Match' || i.status === 'Discrepancy Flagged').length;
  const totalApprovalCount = pendingPRCount + pendingPOCount + pendingInvCount;

  // Organization Display
  const orgTypeLabel = 
    orgType === 'hospital' ? 'Multispecialty Hospital' :
    orgType === 'laboratory' ? 'Testing & Diagnostic Laboratory' :
    orgType === 'pharmacy' ? 'Medical Store & Retail Pharmacy' :
    'Healthcare Enterprise';

  const tabs = [
    { id: 'dashboard' as const, label: 'Dashboard', icon: <LayoutDashboard className="w-4 h-4" /> },
    { 
      id: 'requisitions' as const, 
      label: 'Requisitions', 
      icon: <FileText className="w-4 h-4" />, 
      badge: pendingPRCount > 0 ? pendingPRCount : undefined,
      badgeColor: 'bg-blue-100 text-blue-700'
    },
    { id: 'rfqs' as const, label: 'RFQ & Enquiries', icon: <Send className="w-4 h-4" /> },
    { id: 'quotations' as const, label: 'Quote Comparison', icon: <Scale className="w-4 h-4" /> },
    { 
      id: 'orders' as const, 
      label: 'Purchase Orders', 
      icon: <ShoppingCart className="w-4 h-4" />,
      badge: pendingPOCount > 0 ? pendingPOCount : undefined,
      badgeColor: 'bg-amber-100 text-amber-800'
    },
    { id: 'grn' as const, label: 'Goods Receipt (GRN)', icon: <PackageCheck className="w-4 h-4" /> },
    { 
      id: 'invoices' as const, 
      label: '3-Way Match & Invoices', 
      icon: <Receipt className="w-4 h-4" />,
      badge: pendingInvCount > 0 ? pendingInvCount : undefined,
      badgeColor: 'bg-purple-100 text-purple-800'
    },
    { id: 'returns' as const, label: 'Purchase Returns', icon: <RotateCcw className="w-4 h-4" /> },
    { id: 'suppliers' as const, label: 'Supplier Master', icon: <Users className="w-4 h-4" /> },
    { 
      id: 'approvals' as const, 
      label: 'Approval Inbox', 
      icon: <CheckCircle2 className="w-4 h-4" />,
      badge: totalApprovalCount > 0 ? totalApprovalCount : undefined,
      badgeColor: 'bg-rose-500 text-white'
    },
    { id: 'reports' as const, label: 'Reports & Tax ITC', icon: <FileSpreadsheet className="w-4 h-4" /> },
  ];

  return (
    <div className="space-y-6">
      {/* Top Enterprise Procurement Header */}
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white p-6 rounded-3xl shadow-xl relative overflow-hidden border border-slate-800">
        <div className="absolute top-0 right-0 w-96 h-96 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div>
            <div className="flex items-center gap-2 mb-2 flex-wrap">
              <span className="px-2.5 py-1 bg-indigo-500/20 text-indigo-300 rounded-lg text-xs font-semibold border border-indigo-500/30 flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5" />
                Enterprise Procurement ERP
              </span>
              <span className="px-2.5 py-1 bg-emerald-500/20 text-emerald-300 rounded-lg text-xs font-semibold border border-emerald-500/30 flex items-center gap-1.5">
                <Database className="w-3.5 h-3.5" />
                Supabase PostgreSQL Connected
              </span>
              <span className="px-2.5 py-1 bg-white/10 text-slate-300 rounded-lg text-xs font-medium">
                {orgTypeLabel}
              </span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white flex items-center gap-3">
              Purchase & Procurement Management
            </h1>
            <p className="text-slate-400 text-xs sm:text-sm mt-1 max-w-2xl">
              End-to-end procurement lifecycle from purchase requisitions, RFQ comparison, purchase orders, GRN batch inspection, 3-way invoice reconciliation to supplier ledger management.
            </p>
          </div>

          {/* Tenant Branch & Department Selectors */}
          <div className="flex flex-wrap items-center gap-3 bg-white/5 p-3 rounded-2xl border border-white/10 backdrop-blur-md">
            <div>
              <label className="text-[10px] uppercase font-bold text-slate-400 block mb-1 flex items-center gap-1">
                <Building2 className="w-3 h-3 text-indigo-400" /> Branch
              </label>
              <select
                value={activeBranch}
                onChange={(e) => setActiveBranch(e.target.value)}
                className="bg-slate-800 text-white border border-slate-700 text-xs rounded-xl px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                <option value="All Branches">All Branches</option>
                <option value="Main Campus - Central">Main Campus - Central</option>
                <option value="South Wing Medical Centre">South Wing Medical Centre</option>
                <option value="North City PolyClinic">North City PolyClinic</option>
              </select>
            </div>

            <div>
              <label className="text-[10px] uppercase font-bold text-slate-400 block mb-1 flex items-center gap-1">
                <Layers className="w-3 h-3 text-indigo-400" /> Department
              </label>
              <select
                value={activeDepartment}
                onChange={(e) => setActiveDepartment(e.target.value)}
                className="bg-slate-800 text-white border border-slate-700 text-xs rounded-xl px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                <option value="All Departments">All Departments</option>
                <option value="Pharmacy & Consumables">Pharmacy & Consumables</option>
                <option value="Pathology & Diagnostics">Pathology & Diagnostics</option>
                <option value="Radiology & Imaging">Radiology & Imaging</option>
                <option value="Central Sterile Services (CSSD)">CSSD</option>
                <option value="Surgery & OR">Surgery & OR</option>
                <option value="Biomedical Engineering">Biomedical Engineering</option>
              </select>
            </div>

            <div className="pt-4 sm:pt-0">
              <button
                onClick={resetProcurementData}
                title="Reset sample procurement data"
                className="p-2 bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white rounded-xl border border-slate-700 transition-colors flex items-center gap-1 text-xs"
              >
                <RefreshCw className="w-4 h-4" />
                <span className="hidden sm:inline">Reset</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Sub-Navigation Navigation Bar */}
      <div className="bg-white p-2 rounded-2xl border border-slate-200 shadow-sm overflow-x-auto">
        <div className="flex items-center gap-1.5 min-w-max">
          {tabs.map((tab) => {
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-all ${
                  isActive
                    ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/20'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                }`}
              >
                {tab.icon}
                <span>{tab.label}</span>
                {tab.badge !== undefined && (
                  <span className={`px-1.5 py-0.5 rounded-full text-[10px] font-bold ${
                    isActive ? 'bg-white/20 text-white' : tab.badgeColor
                  }`}>
                    {tab.badge}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Active Tab View */}
      <div className="transition-all">
        {activeTab === 'dashboard' && <ProcurementDashboard onNavigateTab={(tab) => setActiveTab(tab as any)} />}
        {activeTab === 'requisitions' && <PurchaseRequisitions />}
        {activeTab === 'rfqs' && <RfqManagement onOpenComparison={(rfqId) => setActiveTab('quotations')} />}
        {activeTab === 'quotations' && <QuotationComparison />}
        {activeTab === 'orders' && <PurchaseOrders />}
        {activeTab === 'grn' && <GoodsReceiptNotes />}
        {activeTab === 'invoices' && <SupplierInvoiceMatching />}
        {activeTab === 'returns' && <PurchaseReturns />}
        {activeTab === 'suppliers' && <SupplierMaster />}
        {activeTab === 'approvals' && <ApprovalInbox />}
        {activeTab === 'reports' && <ProcurementReports />}
      </div>
    </div>
  );
};
