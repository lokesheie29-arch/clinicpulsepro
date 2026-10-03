import React, { useState } from 'react';
import { Navbar } from './components/Navbar';
import { Footer } from './components/Footer';
import { LandingPage } from './components/LandingPage';
import { Simulator } from './components/simulator/Simulator';
import { AdminPanel } from './components/AdminPanel';
import { AuthProvider, useAuth } from './context/AuthContext';
import { AppStateProvider } from './context/AppStateContext';

const AppContent = () => {
  const { user } = useAuth();
  const [showAdmin, setShowAdmin] = useState(false);

  return (
    <div className="min-h-screen flex flex-col font-sans">
      <Navbar />
      
      {user?.role === 'admin' && (
        <div className="bg-teal-700 text-white py-2 px-4 text-center text-sm font-medium flex justify-center items-center space-x-4">
          <span>Logged in as Master Admin</span>
          <button 
            onClick={() => setShowAdmin(!showAdmin)}
            className="underline hover:text-teal-200"
          >
            {showAdmin ? 'View App' : 'Go to Admin Panel'}
          </button>
        </div>
      )}

      <main className="flex-grow">
        {showAdmin && user?.role === 'admin' ? (
          <AdminPanel />
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
