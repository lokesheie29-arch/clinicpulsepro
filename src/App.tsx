import { useState } from 'react';
import { Navbar } from './components/Navbar';
import { Footer } from './components/Footer';
import { LandingPage } from './components/LandingPage';
import { Simulator } from './components/simulator/Simulator';
import { AdminPanel } from './components/AdminPanel';
import { AuthProvider, useAuth } from './context/AuthContext';
import { AppStateProvider } from './context/AppStateContext';
import { ShieldAlert, LogOut } from 'lucide-react';

const AccessPendingScreen = ({ onLogout }: { onLogout: () => void }) => (
  <div className="min-h-[70vh] flex items-center justify-center p-4">
    <div className="bg-white max-w-md w-full rounded-2xl shadow-xl border border-slate-200 p-8 text-center">
      <div className="w-16 h-16 bg-amber-100 rounded-full flex items-center justify-center mx-auto mb-4">
        <ShieldAlert className="h-8 w-8 text-amber-600" />
      </div>
      <h2 className="text-2xl font-bold text-navy-900 mb-2">Access Pending</h2>
      <p className="text-slate-500 mb-2">
        Your account has been registered successfully. The admin is reviewing your request.
      </p>
      <p className="text-slate-500 mb-6">
        Once approved, you will have full access to ClinicPulse Pro. Please check back soon.
      </p>
      <div className="bg-slate-50 rounded-xl p-4 mb-6 text-sm text-slate-600">
        <p>📧 For faster approval, contact:</p>
        <a href="mailto:lokesheie29@gmail.com" className="text-teal-600 font-semibold">lokesheie29@gmail.com</a>
        <p className="mt-1">or WhatsApp: <a href="https://wa.me/917200124136" className="text-emerald-600 font-semibold">+91 7200124136</a></p>
      </div>
      <button onClick={onLogout} className="flex items-center space-x-2 text-slate-500 hover:text-red-500 mx-auto transition-colors">
        <LogOut className="h-4 w-4" />
        <span>Sign Out</span>
      </button>
    </div>
  </div>
);

const AppContent = () => {
  const { user, loading, logout } = useAuth();
  const [showAdmin, setShowAdmin] = useState(false);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-teal-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col font-sans">
      <Navbar onAdminClick={() => setShowAdmin(true)} />

      {user?.role === 'admin' && showAdmin && (
        <div className="bg-amber-50 border-b border-amber-200 py-2 px-4 text-center text-sm text-amber-800 font-medium">
          You are viewing the Admin Control Panel.
        </div>
      )}

      <main className="flex-grow">
        {user && user.status === 'revoked' ? (
          <div className="min-h-[70vh] flex items-center justify-center p-4">
            <div className="bg-red-50 text-red-700 p-8 rounded-2xl border border-red-200 max-w-md text-center">
              <ShieldAlert className="h-12 w-12 mx-auto mb-4 text-red-500" />
              <h2 className="font-bold text-xl mb-2">Access Revoked</h2>
              <p>Your access to ClinicPulse Pro has been revoked by the admin. Contact support for help.</p>
              <button onClick={logout} className="mt-6 text-sm text-red-500 underline">Sign Out</button>
            </div>
          </div>
        ) : user && user.status === 'pending' ? (
          <AccessPendingScreen onLogout={logout} />
        ) : showAdmin && user?.role === 'admin' ? (
          <AdminPanel onClose={() => setShowAdmin(false)} />
        ) : (
          <>
            <LandingPage />
            <Simulator />
          </>
        )}
      </main>

      <Footer />
    </div>
  );
};

function App() {
  return (
    <AuthProvider>
      <AppStateProvider>
        <AppContent />
      </AppStateProvider>
    </AuthProvider>
  );
}

export default App;
