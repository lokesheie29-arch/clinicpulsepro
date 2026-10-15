import React, { useState } from 'react';
import { 
  LayoutDashboard, 
  Receipt, 
  QrCode, 
  Landmark, 
  FileSpreadsheet, 
  FlaskConical, 
  CreditCard, 
  ShieldCheck, 
  Clock, 
  Building2,
  ChevronRight,
  Sparkles
} from 'lucide-react';
import { usePayment } from '../../context/PaymentContext';
import { useAppState } from '../../context/AppStateContext';

// Subcomponents
import { PaymentDashboard } from './PaymentDashboard';
import { TransactionLedger } from './TransactionLedger';
import { PatientPaymentPortal } from './PatientPaymentPortal';
import { BankGatewaySettings } from './BankGatewaySettings';
import { PaymentReports } from './PaymentReports';
import { SandboxTestingSuite } from './SandboxTestingSuite';

type PaymentTab = 'dashboard' | 'transactions' | 'checkout' | 'settings' | 'reports' | 'sandbox';

export const PaymentHub: React.FC = () => {
  const [activeTab, setActiveTab] = useState<PaymentTab>('dashboard');
  const { orgType } = useAppState();
  const { activeConfig, metrics, filteredTransactions } = usePayment();

  const pendingCount = metrics.pendingCount;

  const tabs = [
    { 
      id: 'dashboard' as const, 
      label: 'Payment Dashboard', 
      icon: <LayoutDashboard className="w-4 h-4" /> 
    },
    { 
      id: 'transactions' as const, 
      label: 'Transaction Ledger', 
      icon: <Receipt className="w-4 h-4" />,
      badge: filteredTransactions.length,
      badgeColor: 'bg-slate-100 text-slate-700'
    },
    { 
      id: 'checkout' as const, 
      label: 'Patient UPI & Checkout', 
      icon: <QrCode className="w-4 h-4" /> 
    },
    { 
      id: 'settings' as const, 
      label: 'Bank & Gateway Setup', 
      icon: <Landmark className="w-4 h-4" /> 
    },
    { 
      id: 'reports' as const, 
      label: 'Settlement Reports', 
      icon: <FileSpreadsheet className="w-4 h-4" /> 
    },
    { 
      id: 'sandbox' as const, 
      label: 'Sandbox Tester', 
      icon: <FlaskConical className="w-4 h-4" />,
      badge: activeConfig.environmentMode === 'sandbox' ? 'TEST' : undefined,
      badgeColor: 'bg-amber-100 text-amber-800'
    }
  ];

  const orgTypeLabel = 
    orgType === 'hospital' ? 'Multispecialty Hospital' :
    orgType === 'laboratory' ? 'Testing & Diagnostic Laboratory' :
    orgType === 'pharmacy' ? 'Medical Store & Retail Pharmacy' :
    'Healthcare Enterprise';

  return (
    <div className="space-y-6">
      {/* Module Navigation Header */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm p-4 sm:p-5">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-slate-100">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-gradient-to-br from-teal-500 to-teal-700 text-white rounded-2xl shadow-sm">
              <CreditCard className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl font-extrabold text-navy-900 tracking-tight">
                  Payment Collection & Bank/UPI Integration
                </h1>
                <span className="text-[11px] font-semibold bg-teal-50 text-teal-700 border border-teal-200 px-2 py-0.5 rounded-full">
                  NPCI UPI & Gateway Compliant
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-0.5 flex items-center gap-2">
                <span>Facility: <strong>{activeConfig.organizationName}</strong> ({orgTypeLabel})</span>
                <span>•</span>
                <span>Settles to: <strong className="text-navy-900">{activeConfig.bankAccount.bankName}</strong></span>
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 self-start md:self-auto">
            <div className="text-right hidden sm:block">
              <span className="text-[10px] text-slate-400 block uppercase font-bold tracking-wider">Settled to Date</span>
              <span className="text-sm font-extrabold text-teal-700">₹{metrics.netSettledToBank.toFixed(2)}</span>
            </div>
            <button
              onClick={() => setActiveTab('checkout')}
              className="bg-navy-900 hover:bg-navy-800 text-white px-4 py-2 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-all shadow-sm"
            >
              <QrCode className="w-3.5 h-3.5 text-teal-400" />
              <span>Collect Payment Now</span>
            </button>
          </div>
        </div>

        {/* Horizontal Navigation Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto pt-3 no-scrollbar">
          {tabs.map((tab) => {
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition-all ${
                  isActive
                    ? 'bg-teal-500/15 text-teal-800 border border-teal-500/30 shadow-xs'
                    : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                }`}
              >
                <span className={isActive ? 'text-teal-600' : 'text-slate-400'}>
                  {tab.icon}
                </span>
                <span>{tab.label}</span>
                {tab.badge !== undefined && (
                  <span className={`text-[10px] font-bold px-1.5 py-0.2 rounded-full ${tab.badgeColor || 'bg-slate-100 text-slate-600'}`}>
                    {tab.badge}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Tab Content Rendering */}
      <div>
        {activeTab === 'dashboard' && <PaymentDashboard onNavigateToTab={setActiveTab} />}
        {activeTab === 'transactions' && <TransactionLedger />}
        {activeTab === 'checkout' && <PatientPaymentPortal onPaymentSuccess={() => {}} />}
        {activeTab === 'settings' && <BankGatewaySettings />}
        {activeTab === 'reports' && <PaymentReports />}
        {activeTab === 'sandbox' && <SandboxTestingSuite />}
      </div>
    </div>
  );
};
