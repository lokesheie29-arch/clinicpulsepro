import React from 'react';
import { Activity, Download, ShieldCheck, UserCircle, LogOut } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export const Navbar = () => {
  const { user, login, logout } = useAuth();

  const handleLogin = () => {
    // Dummy login action
    const email = prompt("Enter email to login (use lokesheie29@gmail.com for admin):");
    if (email) {
      login(email);
    }
  };

  return (
    <nav className="print:hidden sticky top-0 z-50 w-full bg-white/80 backdrop-blur-md border-b border-slate-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16 items-center">
          <div className="flex items-center space-x-2">
            <Activity className="h-8 w-8 text-teal-600" />
            <span className="font-bold text-xl text-navy-900">ClinicPulse Pro</span>
          </div>
          
          <div className="hidden md:flex space-x-8 items-center">
            <a href="#features" className="text-slate-600 hover:text-teal-600 font-medium">Features</a>
            <a href="#demo" className="text-slate-600 hover:text-teal-600 font-medium">Live Demo</a>
            <a href="#pricing" className="text-slate-600 hover:text-teal-600 font-medium">Pricing</a>
            <a href="#faq" className="text-slate-600 hover:text-teal-600 font-medium">FAQ</a>
          </div>

          <div className="flex items-center space-x-4">
            <button className="hidden lg:flex items-center space-x-2 text-slate-600 hover:text-teal-600 transition-colors">
              <Download className="h-5 w-5" />
              <span className="font-medium">Source ZIP</span>
            </button>
            <a href="https://wa.me/917200124136" target="_blank" rel="noreferrer" className="hidden sm:flex items-center space-x-2 bg-emerald-100 text-emerald-700 px-4 py-2 rounded-full font-medium hover:bg-emerald-200 transition-colors">
              <ShieldCheck className="h-4 w-4" />
              <span>WhatsApp Us</span>
            </a>
            
            {user ? (
              <div className="flex items-center space-x-3">
                <div className="flex flex-col items-end">
                  <span className="text-sm font-semibold text-navy-900">{user.email}</span>
                  <span className="text-xs text-teal-600 font-medium uppercase">{user.role}</span>
                </div>
                <button onClick={logout} className="p-2 text-slate-500 hover:text-red-500 rounded-full hover:bg-red-50 transition-colors">
                  <LogOut className="h-5 w-5" />
                </button>
              </div>
            ) : (
              <button onClick={handleLogin} className="flex items-center space-x-2 bg-navy-900 text-white px-4 py-2 rounded-full font-medium hover:bg-navy-800 transition-colors">
                <UserCircle className="h-5 w-5" />
                <span>Login</span>
              </button>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
};
