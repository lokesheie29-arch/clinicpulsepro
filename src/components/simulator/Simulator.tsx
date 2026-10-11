import { useState, useEffect } from 'react';
import {
  Stethoscope,
  Receipt,
  Pill,
  BarChart3,
  RefreshCw,
  Microscope,
  Building2,
  SlidersHorizontal,
  Check
} from 'lucide-react';
import { OpdConsultation } from './OpdConsultation';
import { InvoiceHub } from './InvoiceHub';
import { PharmacyInventory } from './PharmacyInventory';
import { Analytics } from './Analytics';
import { LabDiagnostics } from './LabDiagnostics';
import { useAppState } from '../../context/AppStateContext';

export const Simulator = () => {
  const { orgType, resetDemoData } = useAppState();

  const getDefaultTab = () => {
    if (orgType === 'laboratory') return 'lab';
    if (orgType === 'pharmacy') return 'pharmacy';
    return 'opd';
  };

  const [activeTab, setActiveTab] = useState(getDefaultTab());
  const [selectedInvoiceId, setSelectedInvoiceId] = useState<string | null>(null);
  const [showAllModules, setShowAllModules] = useState(false);

  // Sync default tab when orgType switches
  useEffect(() => {
    if (!showAllModules) {
      if (orgType === 'laboratory' && !['lab', 'invoice', 'analytics'].includes(activeTab)) {
        setActiveTab('lab');
      } else if (orgType === 'pharmacy' && !['pharmacy', 'invoice', 'analytics'].includes(activeTab)) {
        setActiveTab('pharmacy');
      } else if (orgType === 'hospital' && !['opd', 'lab', 'invoice', 'pharmacy', 'analytics'].includes(activeTab)) {
        setActiveTab('opd');
      }
    }
  }, [orgType, showAllModules]);

  const handleInvoiceGenerated = (invoiceId: string) => {
    setSelectedInvoiceId(invoiceId);
    setActiveTab('invoice');
  };

  const renderTab = () => {
    switch (activeTab) {
      case 'opd': return <OpdConsultation onComplete={handleInvoiceGenerated} />;
      case 'lab': return <LabDiagnostics onSwitchTab={setActiveTab} />;
      case 'invoice': return <InvoiceHub selectedInvoiceId={selectedInvoiceId} />;
      case 'pharmacy': return <PharmacyInventory />;
      case 'analytics': return <Analytics />;
      default: return <OpdConsultation onComplete={handleInvoiceGenerated} />;
    }
  };

  // Define tabs configuration
  const allTabs = [
    {
      id: 'opd',
      label: '1. OPD Studio',
      icon: <Stethoscope className="h-5 w-5" />,
      types: ['hospital']
    },
    {
      id: 'lab',
      label: orgType === 'laboratory' && !showAllModules ? '1. Lab & Diagnostics' : '2. Lab & Diagnostics',
      icon: <Microscope className="h-5 w-5" />,
      types: ['hospital', 'laboratory']
    },
    {
      id: 'invoice',
      label: orgType === 'laboratory' && !showAllModules
        ? '2. Lab Billing & WhatsApp'
        : orgType === 'pharmacy' && !showAllModules
        ? '2. Medicine Billing & WhatsApp'
        : '3. Billing & WhatsApp',
      icon: <Receipt className="h-5 w-5" />,
      types: ['hospital', 'laboratory', 'pharmacy']
    },
    {
      id: 'pharmacy',
      label: orgType === 'pharmacy' && !showAllModules ? '1. FEFO Pharmacy Inventory' : '4. FEFO Pharmacy',
      icon: <Pill className="h-5 w-5" />,
      types: ['hospital', 'pharmacy']
    },
    {
      id: 'analytics',
      label: (!showAllModules && (orgType === 'laboratory' || orgType === 'pharmacy'))
        ? '3. Financial Analytics'
        : '5. Financial Analytics',
      icon: <BarChart3 className="h-5 w-5" />,
      types: ['hospital', 'laboratory', 'pharmacy']
    }
  ];

  const visibleTabs = showAllModules
    ? allTabs
    : allTabs.filter(t => t.types.includes(orgType));

  const getOrgMeta = () => {
    switch (orgType) {
      case 'laboratory':
        return {
          title: 'Testing Laboratory ERP',
          icon: <Microscope className="h-4 w-4 text-purple-600" />,
          badgeColor: 'text-purple-700 bg-purple-50 border-purple-200'
        };
      case 'pharmacy':
        return {
          title: 'Medical Store & Pharmacy ERP',
          icon: <Pill className="h-4 w-4 text-amber-600" />,
          badgeColor: 'text-amber-800 bg-amber-50 border-amber-200'
        };
      default:
        return {
          title: 'Hospital / Multispecialty ERP',
          icon: <Building2 className="h-4 w-4 text-teal-600" />,
          badgeColor: 'text-teal-700 bg-teal-50 border-teal-200'
        };
    }
  };

  const orgMeta = getOrgMeta();

  return (
    <div id="demo" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 print:py-0 print:px-0">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end mb-6 gap-4 print:hidden">
        <div>
          <div className="inline-flex items-center gap-2 mb-2">
            <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold border shadow-xs ${orgMeta.badgeColor}`}>
              {orgMeta.icon}
              <span>{orgMeta.title}</span>
            </span>
            <span className="text-xs text-slate-400">
              {showAllModules ? '(All Modules View)' : `(${visibleTabs.length} Tailored Modules)`}
            </span>
          </div>
          <h2 className="text-3xl font-bold text-navy-900">Live Healthcare ERP Simulator</h2>
          <p className="text-slate-600 text-sm mt-1">
            Tailored operations workflow based on your organization type.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => setShowAllModules(!showAllModules)}
            className="flex items-center space-x-2 text-xs font-semibold text-slate-600 hover:text-navy-900 transition-colors bg-white px-3.5 py-2 rounded-xl shadow-xs border border-slate-200"
            title="Toggle between organization-specific modules and the full ERP suite"
          >
            <SlidersHorizontal className="h-3.5 w-3.5 text-teal-600" />
            <span>{showAllModules ? 'Filter by Org Type' : 'Show All Modules (5)'}</span>
          </button>

          <button 
            onClick={resetDemoData}
            className="flex items-center space-x-2 text-xs font-semibold text-slate-500 hover:text-teal-600 transition-colors bg-white px-3.5 py-2 rounded-xl shadow-xs border border-slate-200"
          >
            <RefreshCw className="h-3.5 w-3.5" />
            <span>Reset Demo Data</span>
          </button>
        </div>
      </div>

      <div className="bg-white rounded-3xl shadow-xl overflow-hidden border border-slate-200 print:border-none print:shadow-none print:rounded-none">
        <div className="flex flex-col md:flex-row">
          <div className="flex flex-col md:w-64 shrink-0 border-b md:border-b-0 md:border-r border-slate-200 bg-slate-50/50 print:hidden divide-y divide-slate-200">
            {visibleTabs.map(tab => (
              <TabButton
                key={tab.id}
                id={tab.id}
                active={activeTab}
                setActive={setActiveTab}
                icon={tab.icon}
                label={tab.label}
              />
            ))}
          </div>
          
          <div className="flex-1 p-6 md:p-8 min-h-[600px] bg-slate-50/30 print:p-0 print:bg-white print:min-h-0">
            {renderTab()}
          </div>
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
      className={`flex items-center space-x-3 px-6 py-4 font-medium text-sm w-full transition-all border-l-4 ${
        isActive 
          ? 'border-teal-600 text-teal-700 bg-white shadow-xs' 
          : 'border-transparent text-slate-500 hover:text-slate-700 hover:bg-slate-50'
      }`}
    >
      {icon}
      <span>{label}</span>
    </button>
  );
};

