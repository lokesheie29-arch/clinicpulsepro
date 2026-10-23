import React, { useState } from 'react';
import { ShieldAlert, Users, Key, CreditCard, Sparkles, Clock } from 'lucide-react';
import { AdminSubscriptionManager } from './admin/AdminSubscriptionManager';

interface AdminPanelProps {
  onClose: () => void;
}

export const AdminPanel: React.FC<AdminPanelProps> = ({ onClose }) => {
  const [activeTab, setActiveTab] = useState<'subscriptions' | 'roles'>('subscriptions');

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between pb-6 mb-6 border-b border-slate-200 gap-4">
        <div className="flex items-center space-x-3">
          <div className="p-2.5 bg-slate-900 rounded-2xl text-teal-400 shadow-md">
            <Key className="h-6 w-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-2xl font-black text-slate-900 tracking-tight">Master Admin Control Center</h2>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-teal-50 text-teal-700 border border-teal-200">
                Superuser Active
              </span>
            </div>
            <p className="text-slate-500 text-xs sm:text-sm mt-0.5">
              Manage 30-day evaluation trials, commercial subscriptions, and staff permissions.
            </p>
          </div>
        </div>

        <button 
          onClick={onClose} 
          className="px-4 py-2 text-xs font-semibold text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-xl transition-colors"
        >
          ← Return to Clinic Modules
        </button>
      </div>

      {/* Tabs */}
      <div className="flex items-center space-x-2 border-b border-slate-200 mb-6 pb-2">
        <button
          onClick={() => setActiveTab('subscriptions')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all ${
            activeTab === 'subscriptions'
              ? 'bg-slate-900 text-white shadow-md'
              : 'text-slate-500 hover:text-slate-900 hover:bg-slate-100'
          }`}
        >
          <CreditCard className="w-4 h-4 text-teal-400" />
          <span>30-Day Free Trials & Subscriptions</span>
        </button>
        <button
          onClick={() => setActiveTab('roles')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all ${
            activeTab === 'roles'
              ? 'bg-slate-900 text-white shadow-md'
              : 'text-slate-500 hover:text-slate-900 hover:bg-slate-100'
          }`}
        >
          <Users className="w-4 h-4" />
          <span>User Authentication & Roles</span>
        </button>
      </div>

      {/* Tab 1: Subscriptions & Trials */}
      {activeTab === 'subscriptions' && (
        <AdminSubscriptionManager />
      )}

      {/* Tab 2: User Roles */}
      {activeTab === 'roles' && (
        <div className="bg-amber-50 border border-amber-200 text-amber-800 p-6 rounded-2xl flex items-start space-x-4">
          <ShieldAlert className="h-6 w-6 text-amber-500 shrink-0 mt-1" />
          <div>
            <h3 className="font-bold text-base mb-1">User & Role Management via Clerk</h3>
            <p className="mb-4 text-xs sm:text-sm text-amber-900/80 leading-relaxed">
              Authentication and single-sign-on for ClinicPulse Pro are handled securely by Clerk. 
              To invite team members, adjust multi-factor authentication (MFA), or assign doctor/admin roles, access the Clerk Dashboard directly.
            </p>
            <a 
              href="https://dashboard.clerk.com" 
              target="_blank" 
              rel="noreferrer" 
              className="inline-flex items-center gap-2 bg-white border border-amber-300 text-amber-900 px-4 py-2 rounded-xl text-xs font-bold hover:bg-amber-100 transition-colors shadow-sm"
            >
              <span>Launch Clerk Dashboard</span>
              <span>↗</span>
            </a>
          </div>
        </div>
      )}
    </div>
  );
};
