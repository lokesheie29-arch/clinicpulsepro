import { useState } from 'react';
import { Navbar } from './components/Navbar';
import { Footer } from './components/Footer';
import { LandingPage } from './components/LandingPage';
import { Simulator } from './components/simulator/Simulator';
import { AppStateProvider } from './context/AppStateContext';

const AppContent = () => {
  const [showAdmin, setShowAdmin] = useState(false);

  return (
    <div className="min-h-screen flex flex-col font-sans">
      <Navbar onAdminClick={() => setShowAdmin(!showAdmin)} />

      {showAdmin && (
        <div className="bg-amber-50 border-b border-amber-200 py-2 px-4 text-center text-sm text-amber-800 font-medium">
          Admin Panel mode is currently in Preview.
        </div>
      )}

      <main className="flex-grow">
        <LandingPage />
        <Simulator />
      </main>

      <Footer />
    </div>
  );
};

function App() {
  return (
    <AppStateProvider>
      <AppContent />
    </AppStateProvider>
  );
}

export default App;
