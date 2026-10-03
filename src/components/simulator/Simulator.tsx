import React, { useState } from 'react';
import { Stethoscope, Receipt, Pill, BarChart3, RefreshCw } from 'lucide-react';
import { OpdConsultation } from './OpdConsultation';
import { InvoiceHub } from './InvoiceHub';
import { PharmacyInventory } from './PharmacyInventory';
import { Analytics } from './Analytics';
import { useAppState } from '../../context/AppStateContext';

export const Simulator = () => {
  const [activeTab, setActiveTab] = useState('opd');
  const [selectedInvoiceId, setSelectedInvoiceId] = useState<string | null>(null);
  const { resetDemoData } = useAppState();

  const handleInvoiceGenerated = (invoiceId: string) => {
    setSelectedInvoiceId(invoiceId);
    setActiveTab('invoice');
  };

  const renderTab = () => {
    switch (activeTab) {
      case 'opd': return <OpdConsultation onComplete={handleInvoiceGenerated} />;
      case 'invoice': return <InvoiceHub selectedInvoiceId={selectedInvoiceId} />;
      case 'pharmacy': return <PharmacyInventory />;
      case 'analytics': return <Analytics />;
      default: return <OpdConsultation onComplete={handleInvoiceGenerated} />;
    }
  };

  return (
    <div id="demo" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 print:py-0 print:px-0">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end mb-8 gap-4 print:hidden">
        <div>
          <h2 className="text-3xl font-bold text-navy-900 mb-2">Live Clinic Simulator</h2>
          <p className="text-slate-600">Experience the workflow from patient entry to WhatsApp billing in real-time.</p>
        </div>
        <button 
          onClick={resetDemoData}
          className="flex items-center space-x-2 text-sm text-slate-500 hover:text-teal-600 transition-colors bg-white px-4 py-2 rounded-lg shadow-sm border border-slate-200"
        >
          <RefreshCw className="h-4 w-4" />
          <span>Reset Demo Data</span>
        </button>
      </div>

      <div className="bg-white rounded-2xl shadow-xl overflow-hidden border border-slate-200 print:border-none print:shadow-none print:rounded-none">
        <div className="flex overflow-x-auto border-b border-slate-200 bg-slate-50/50 print:hidden">
          <TabButton id="opd" active={activeTab} setActive={setActiveTab} icon={<Stethoscope className="h-5 w-5"/>} label="1. OPD Studio" />
          <TabButton id="invoice" active={activeTab} setActive={setActiveTab} icon={<Receipt className="h-5 w-5"/>} label="2. Billing & WhatsApp" />
          <TabButton id="pharmacy" active={activeTab} setActive={setActiveTab} icon={<Pill className="h-5 w-5"/>} label="3. FEFO Pharmacy" />
          <TabButton id="analytics" active={activeTab} setActive={setActiveTab} icon={<BarChart3 className="h-5 w-5"/>} label="4. Financial Analytics" />
        </div>
        
        <div className="p-6 md:p-8 min-h-[600px] bg-slate-50/30 print:p-0 print:bg-white print:min-h-0">
          {renderTab()}
        </div>
      </div>
    </div>
  );
};

const TabButton = ({ id, active, setActive, icon, label }: any) => {
  const isActive = active === id;
  return (
    <button
      onClick={() => setActive(id)}
      className={`flex items-center space-x-2 px-6 py-4 font-medium text-sm whitespace-nowrap transition-all border-b-2 ${
        isActive 
          ? 'border-teal-600 text-teal-700 bg-white' 
          : 'border-transparent text-slate-500 hover:text-slate-700 hover:bg-slate-50'
      }`}
    >
      {icon}
      <span>{label}</span>
    </button>
  );
};
