import React, { useState } from 'react';
import { 
  LayoutDashboard, 
  Receipt, 
  PlusCircle, 
  FileSpreadsheet, 
  RotateCcw, 
  Settings, 
  ShieldCheck,
  Building2,
  HelpCircle,
  Sparkles
} from 'lucide-react';
import { useBilling } from '../../context/BillingContext';
import { BillingDashboard } from './BillingDashboard';
import { InvoiceList } from './InvoiceList';
import { NewInvoiceView } from './NewInvoiceView';
import { InvoiceDetailView } from './InvoiceDetailView';
import { GstReportsHub } from './GstReportsHub';
import { CreditNotesManager } from './CreditNotesManager';
import { TaxSettingsView } from './TaxSettingsView';
import { EnhancedInvoice } from '../../types/billing';

export type BillingTab = 
  | 'dashboard' 
  | 'invoices' 
  | 'new_invoice' 
  | 'invoice_detail' 
  | 'reports' 
  | 'credit_notes' 
  | 'settings';

export const BillingHub: React.FC = () => {
  const { selectedInvoice, setSelectedInvoice, taxProfile } = useBilling();
  const [activeTab, setActiveTab] = useState<BillingTab>('dashboard');
  const [creditNoteTargetInvoice, setCreditNoteTargetInvoice] = useState<EnhancedInvoice | null>(null);

  // Switch to invoice details view
  const handleSelectInvoice = (invoice: EnhancedInvoice) => {
    setSelectedInvoice(invoice);
    setActiveTab('invoice_detail');
  };

  // Switch to credit note creation
  const handleInitiateCreditNote = (invoice: EnhancedInvoice) => {
    setCreditNoteTargetInvoice(invoice);
    setActiveTab('credit_notes');
  };

  // After creating new invoice successfully
  const handleInvoiceCreated = (invoice: EnhancedInvoice) => {
    setSelectedInvoice(invoice);
    setActiveTab('invoice_detail');
  };

  return (
    <div className="min-h-screen bg-slate-50/50 pb-16">
      {/* Top Navigation Bar */}
      <div className="bg-white border-b border-slate-200/80 sticky top-0 z-30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            {/* Brand / Module Title */}
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-600 to-violet-600 text-white flex items-center justify-center shadow-md shadow-indigo-500/20">
                <Receipt className="w-5 h-5" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h1 className="text-base font-bold text-slate-900 tracking-tight">
                    Billing & Indian GST
                  </h1>
                  <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-100 text-emerald-800">
                    GST Ready
                  </span>
                </div>
                <p className="text-xs text-slate-500 font-mono">
                  {taxProfile.gstin ? `GSTIN: ${taxProfile.gstin}` : 'Setup GSTIN'} • {taxProfile.tradeName || taxProfile.businessName}
                </p>
              </div>
            </div>

            {/* Quick Action Button */}
            {activeTab !== 'new_invoice' && (
              <button
                onClick={() => setActiveTab('new_invoice')}
                className="hidden sm:inline-flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold rounded-xl shadow-sm transition-all"
              >
                <PlusCircle className="w-4 h-4" />
                <span>New Invoice</span>
              </button>
            )}
          </div>

          {/* Navigation Tabs */}
          <div className="flex space-x-1 overflow-x-auto scrollbar-none py-1 border-t border-slate-100 text-xs font-medium">
            <button
              onClick={() => setActiveTab('dashboard')}
              className={`flex items-center gap-2 px-3 py-2 rounded-lg font-semibold whitespace-nowrap transition-colors ${
                activeTab === 'dashboard'
                  ? 'bg-indigo-50 text-indigo-700'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
              }`}
            >
              <LayoutDashboard className="w-4 h-4" />
              <span>Dashboard</span>
            </button>

            <button
              onClick={() => setActiveTab('invoices')}
              className={`flex items-center gap-2 px-3 py-2 rounded-lg font-semibold whitespace-nowrap transition-colors ${
                activeTab === 'invoices' || activeTab === 'invoice_detail'
                  ? 'bg-indigo-50 text-indigo-700'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
              }`}
            >
              <Receipt className="w-4 h-4" />
              <span>Invoices & Sales</span>
            </button>

            <button
              onClick={() => setActiveTab('new_invoice')}
              className={`flex items-center gap-2 px-3 py-2 rounded-lg font-semibold whitespace-nowrap transition-colors ${
                activeTab === 'new_invoice'
                  ? 'bg-indigo-50 text-indigo-700'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
              }`}
            >
              <PlusCircle className="w-4 h-4" />
              <span>Create Invoice</span>
            </button>

            <button
              onClick={() => setActiveTab('reports')}
              className={`flex items-center gap-2 px-3 py-2 rounded-lg font-semibold whitespace-nowrap transition-colors ${
                activeTab === 'reports'
                  ? 'bg-indigo-50 text-indigo-700'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
              }`}
            >
              <FileSpreadsheet className="w-4 h-4" />
              <span>GST Reports & Filings</span>
            </button>

            <button
              onClick={() => {
                setCreditNoteTargetInvoice(null);
                setActiveTab('credit_notes');
              }}
              className={`flex items-center gap-2 px-3 py-2 rounded-lg font-semibold whitespace-nowrap transition-colors ${
                activeTab === 'credit_notes'
                  ? 'bg-indigo-50 text-indigo-700'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
              }`}
            >
              <RotateCcw className="w-4 h-4" />
              <span>Credit Notes</span>
            </button>

            <button
              onClick={() => setActiveTab('settings')}
              className={`flex items-center gap-2 px-3 py-2 rounded-lg font-semibold whitespace-nowrap transition-colors ${
                activeTab === 'settings'
                  ? 'bg-indigo-50 text-indigo-700'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
              }`}
            >
              <Settings className="w-4 h-4" />
              <span>Tax Profile & Settings</span>
            </button>
          </div>
        </div>
      </div>

      {/* Main Content Body */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-6">
        {activeTab === 'dashboard' && (
          <BillingDashboard
            onNewInvoice={() => setActiveTab('new_invoice')}
            onViewReports={() => setActiveTab('reports')}
            onViewCreditNotes={() => setActiveTab('credit_notes')}
          />
        )}

        {activeTab === 'invoices' && (
          <InvoiceList
            onSelectInvoice={handleSelectInvoice}
            onNewInvoice={() => setActiveTab('new_invoice')}
            onIssueCreditNote={handleInitiateCreditNote}
          />
        )}

        {activeTab === 'new_invoice' && (
          <NewInvoiceView
            onBack={() => setActiveTab('invoices')}
            onSuccess={handleInvoiceCreated}
          />
        )}

        {activeTab === 'invoice_detail' && (
          selectedInvoice ? (
            <InvoiceDetailView
              invoice={selectedInvoice}
              onBack={() => setActiveTab('invoices')}
              onIssueCreditNote={handleInitiateCreditNote}
            />
          ) : (
            <div className="bg-white p-12 text-center rounded-2xl border border-slate-200">
              <p className="text-slate-500">No invoice selected.</p>
              <button
                onClick={() => setActiveTab('invoices')}
                className="mt-4 px-4 py-2 bg-indigo-600 text-white rounded-xl text-sm font-semibold"
              >
                Go to Invoices
              </button>
            </div>
          )
        )}

        {activeTab === 'reports' && (
          <GstReportsHub />
        )}

        {activeTab === 'credit_notes' && (
          <CreditNotesManager
            preselectedInvoice={creditNoteTargetInvoice}
            onClearPreselected={() => setCreditNoteTargetInvoice(null)}
            onViewInvoice={handleSelectInvoice}
          />
        )}

        {activeTab === 'settings' && (
          <TaxSettingsView />
        )}
      </main>
    </div>
  );
};
