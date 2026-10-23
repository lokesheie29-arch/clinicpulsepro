import { useState, useEffect } from 'react';
import { useUser } from '@clerk/react';
import { Navbar } from './components/Navbar';
import { Footer } from './components/Footer';
import { LandingPage } from './components/LandingPage';
import { Simulator } from './components/simulator/Simulator';
import { ProfileModal } from './components/ProfileModal';
import { DataImportWizard } from './components/DataImportWizard';
import { OrgTypeSelectionModal } from './components/OrgTypeSelectionModal';
import { LegalModal, LegalTab } from './components/LegalModal';
import { PatientBillView } from './components/PatientBillView';
import { CheckoutPage, PlanId, BillingCycle } from './components/CheckoutPage';
import { AppStateProvider, useAppState } from './context/AppStateContext';
import { ProcurementProvider } from './context/ProcurementContext';
import { PaymentProvider } from './context/PaymentContext';
import {
  Building2,
  UserCircle2,
  Calendar,
  ShieldCheck,
  FileSpreadsheet,
  Microscope,
  Pill,
  Sparkles
} from 'lucide-react';

const AppContent = () => {
  const { isSignedIn, user, isLoaded } = useUser();
  const { orgType, setOrgType } = useAppState();
  const [showAdmin, setShowAdmin] = useState(false);
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [showImportWizard, setShowImportWizard] = useState(false);
  const [showOrgTypeModal, setShowOrgTypeModal] = useState(false);
  const [showLandingPage, setShowLandingPage] = useState(false);
  const [legalModalTab, setLegalModalTab] = useState<LegalTab | null>(null);
  const [billViewData, setBillViewData] = useState<{ id?: string; data?: string } | null>(null);
  const [checkoutParams, setCheckoutParams] = useState<{ plan?: PlanId; billing?: BillingCycle } | null>(null);

  // Listen to URL hash for direct links (#privacy, #terms, #gst, #drug-license, #view-bill, #checkout)
  useEffect(() => {
    const handleHashChange = () => {
      const fullHash = window.location.hash.replace(/^#/, '');

      // Check for subscription checkout route: #checkout or #checkout?plan=professional&billing=annual
      if (fullHash.startsWith('checkout')) {
        const qIndex = fullHash.indexOf('?');
        if (qIndex !== -1) {
          const params = new URLSearchParams(fullHash.slice(qIndex + 1));
          setCheckoutParams({
            plan: (params.get('plan') as PlanId) || 'professional',
            billing: (params.get('billing') as BillingCycle) || 'annual'
          });
        } else {
          setCheckoutParams({ plan: 'professional', billing: 'annual' });
        }
        return;
      } else {
        setCheckoutParams(null);
      }

      if (fullHash.startsWith('view-bill') || fullHash.startsWith('bill')) {
        const qIndex = fullHash.indexOf('?');
        if (qIndex !== -1) {
          const params = new URLSearchParams(fullHash.slice(qIndex + 1));
          setBillViewData({
            id: params.get('id') || undefined,
            data: params.get('data') || undefined
          });
        } else {
          setBillViewData({ id: undefined, data: undefined });
        }
        return;
      }

      const hash = fullHash.toLowerCase();
      if (hash === 'privacy' || hash === 'terms' || hash === 'gst' || hash === 'drug-license') {
        setLegalModalTab(hash as LegalTab);
      }
    };

    handleHashChange();
    window.addEventListener('hashchange', handleHashChange);
    return () => window.removeEventListener('hashchange', handleHashChange);
  }, []);

  // Check if organization type selection is needed on initial registration/login
  const hasSelectedOrgType = !!(
    user?.unsafeMetadata?.orgType ||
    localStorage.getItem('clinicpulse_org_type_selected')
  );

  useEffect(() => {
    if (isSignedIn && !hasSelectedOrgType) {
      setShowOrgTypeModal(true);
    }
  }, [isSignedIn, hasSelectedOrgType]);

  // Sync orgType from Clerk metadata if present
  useEffect(() => {
    if (user?.unsafeMetadata?.orgType) {
      const metaType = user.unsafeMetadata.orgType as any;
      if (['hospital', 'laboratory', 'pharmacy'].includes(metaType) && metaType !== orgType) {
        setOrgType(metaType);
      }
    }
  }, [user?.unsafeMetadata?.orgType]);

  // Fallback while Clerk auth state is initializing
  if (!isLoaded) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="flex flex-col items-center space-y-3">
          <div className="w-10 h-10 border-4 border-teal-600 border-t-transparent rounded-full animate-spin" />
          <p className="text-slate-500 font-medium text-sm">Loading ClinicPulse Pro...</p>
        </div>
      </div>
    );
  }

  const staffName = user?.firstName
    ? `${user.firstName} ${user.lastName || ''}`.trim()
    : user?.primaryEmailAddress?.emailAddress?.split('@')[0] || 'Staff Member';

  const roleTitle = (user?.unsafeMetadata?.roleTitle as string) || 'Consultant / Staff';
  const clinicName = (user?.unsafeMetadata?.clinicName as string) || 'ClinicPulse Pro Center';

  return (
    <div className="min-h-screen flex flex-col font-sans bg-slate-50 overflow-x-hidden">
      <Navbar
        onAdminClick={() => setShowAdmin(!showAdmin)}
        onProfileClick={() => setShowProfileModal(true)}
        showLandingPage={showLandingPage}
        onToggleLandingPage={() => setShowLandingPage(!showLandingPage)}
      />

      {showAdmin && (
        <div className="bg-amber-50 border-b border-amber-200 py-2.5 px-4 text-center text-sm text-amber-800 font-medium flex items-center justify-center gap-2">
          <ShieldCheck className="h-4 w-4 text-amber-600" />
          <span>Admin Access Active: Master Account ({user?.primaryEmailAddress?.emailAddress})</span>
        </div>
      )}

      <main className="flex-grow">
        {/* If user is checking out a subscription, show CheckoutPage */}
        {checkoutParams ? (
          <CheckoutPage
            initialPlan={checkoutParams.plan}
            initialBilling={checkoutParams.billing}
            onBack={() => {
              setCheckoutParams(null);
              window.location.hash = '';
            }}
            onSuccess={() => {
              setCheckoutParams(null);
              window.location.hash = '';
            }}
          />
        ) : isSignedIn && !showLandingPage ? (
          <div className="max-w-[1600px] w-full mx-auto px-4 sm:px-6 lg:px-8 pt-6 pb-12">
            {/* Staff Welcome & Clinic Info Header */}
            <div className="bg-gradient-to-r from-navy-900 via-navy-800 to-slate-900 rounded-3xl p-6 sm:p-8 text-white shadow-lg mb-8 relative overflow-hidden">
              <div className="absolute right-0 top-0 bottom-0 w-1/3 bg-teal-500/10 skew-x-12 pointer-events-none" />
              
              <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
                <div>
                  <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-teal-500/20 text-teal-300 text-xs font-semibold mb-3 border border-teal-500/30">
                    <span className="w-2 h-2 rounded-full bg-teal-400 animate-pulse" />
                    <span>Clinic Operational System • Live</span>
                  </div>
                  <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
                    Welcome back, {staffName}
                  </h1>
                  <p className="text-slate-300 text-sm mt-1.5 flex flex-wrap items-center gap-3">
                    <span className="flex items-center gap-1.5">
                      <UserCircle2 className="h-4 w-4 text-teal-400" />
                      {roleTitle}
                    </span>
                    <span>•</span>
                    <span className="flex items-center gap-1.5">
                      <Building2 className="h-4 w-4 text-teal-400" />
                      {clinicName}
                    </span>
                    <span>•</span>
                    <span className="flex items-center gap-1.5 font-medium">
                      {orgType === 'laboratory' ? (
                        <>
                          <Microscope className="h-4 w-4 text-purple-400" />
                          <span className="text-purple-300">Testing Laboratory Mode</span>
                        </>
                      ) : orgType === 'pharmacy' ? (
                        <>
                          <Pill className="h-4 w-4 text-amber-400" />
                          <span className="text-amber-300">Medical Store / Pharmacy Mode</span>
                        </>
                      ) : (
                        <>
                          <Building2 className="h-4 w-4 text-teal-400" />
                          <span className="text-teal-300">Multispecialty Hospital Mode</span>
                        </>
                      )}
                    </span>
                    <span>•</span>
                    <span className="flex items-center gap-1.5 text-slate-400">
                      <Calendar className="h-4 w-4" />
                      {new Date().toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' })}
                    </span>
                  </p>
                </div>

                <div className="flex flex-wrap items-center gap-3">
                  <button
                    onClick={() => setShowOrgTypeModal(true)}
                    className="bg-purple-500/20 hover:bg-purple-500/30 text-purple-200 border border-purple-500/40 px-4 py-2.5 rounded-xl text-xs font-semibold transition-all backdrop-blur-sm flex items-center gap-2 shadow-sm"
                  >
                    <Sparkles className="h-4 w-4 text-purple-300" />
                    <span>Facility Type: {orgType === 'laboratory' ? 'Lab' : orgType === 'pharmacy' ? 'Pharmacy' : 'Hospital'}</span>
                  </button>

                  <button
                    onClick={() => setShowImportWizard(true)}
                    className="bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 border border-emerald-500/40 px-4 py-2.5 rounded-xl text-xs font-semibold transition-all backdrop-blur-sm flex items-center gap-2 shadow-sm"
                  >
                    <FileSpreadsheet className="h-4 w-4 text-emerald-400" />
                    <span>Import Excel / CSV Data</span>
                  </button>

                  <button
                    onClick={() => setShowProfileModal(true)}
                    className="bg-white/10 hover:bg-white/20 text-white border border-white/20 px-4 py-2.5 rounded-xl text-xs font-semibold transition-all backdrop-blur-sm flex items-center gap-2"
                  >
                    <UserCircle2 className="h-4 w-4 text-teal-400" />
                    <span>Edit Profile Details</span>
                  </button>
                </div>
              </div>
            </div>

            {/* DIRECT ACCESS TO MODULES */}
            <Simulator />
          </div>
        ) : (
          /* When signed out or explicitly previewing public website: Show Landing Page */
          <>
            <LandingPage />
            <div className="max-w-[1600px] w-full mx-auto px-4 sm:px-6 lg:px-8 pb-12">
              <Simulator />
            </div>
          </>
        )}
      </main>

      <Footer onOpenLegal={(tab) => setLegalModalTab(tab)} />

      {/* Profile Modal */}
      <ProfileModal
        isOpen={showProfileModal}
        onClose={() => setShowProfileModal(false)}
      />

      {/* Excel / CSV Onboarding Wizard */}
      <DataImportWizard
        isOpen={showImportWizard}
        onClose={() => setShowImportWizard(false)}
      />

      {/* Organization Type Selection / Onboarding Modal */}
      <OrgTypeSelectionModal
        isOpen={showOrgTypeModal}
        onClose={() => setShowOrgTypeModal(false)}
        isOnboarding={isSignedIn && !hasSelectedOrgType}
      />

      {/* Legal & Compliance Modal */}
      <LegalModal
        isOpen={legalModalTab !== null}
        initialTab={legalModalTab || 'privacy'}
        onClose={() => {
          setLegalModalTab(null);
          if (window.location.hash) {
            history.replaceState(null, '', window.location.pathname);
          }
        }}
      />

      {/* Patient Public Bill & Official PDF Viewer */}
      {billViewData && (
        <PatientBillView
          billData={billViewData}
          onClose={() => {
            setBillViewData(null);
            if (window.location.hash.startsWith('#view-bill') || window.location.hash.startsWith('#bill')) {
              history.replaceState(null, '', window.location.pathname);
            }
          }}
        />
      )}
    </div>
  );
};

function App() {
  return (
    <AppStateProvider>
      <PaymentProvider>
        <ProcurementProvider>
          <AppContent />
        </ProcurementProvider>
      </PaymentProvider>
    </AppStateProvider>
  );
}

export default App;
