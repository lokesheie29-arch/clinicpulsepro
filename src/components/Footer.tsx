import React from 'react';
import { Activity, Mail, Phone, MapPin } from 'lucide-react';

export const Footer = () => {
  return (
    <footer className="print:hidden bg-navy-900 text-slate-300 py-12 border-t border-navy-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          <div className="col-span-1 md:col-span-1">
            <div className="flex items-center space-x-2 mb-4">
              <Activity className="h-8 w-8 text-teal-400" />
              <span className="font-bold text-xl text-white">ClinicPulse Pro</span>
            </div>
            <p className="text-sm text-slate-400 mb-6">
              Smart Clinic ERP, FEFO Pharmacy & 1-Click WhatsApp Billing built for modern Indian clinics.
            </p>
            <button className="bg-white/10 hover:bg-white/20 text-white px-4 py-2 rounded font-medium transition-colors text-sm w-full">
              Download Source ZIP
            </button>
          </div>
          
          <div>
            <h3 className="font-semibold text-white mb-4">Product</h3>
            <ul className="space-y-2 text-sm">
              <li><a href="#features" className="hover:text-teal-400 transition-colors">Features</a></li>
              <li><a href="#demo" className="hover:text-teal-400 transition-colors">Interactive Demo</a></li>
              <li><a href="#pricing" className="hover:text-teal-400 transition-colors">Pricing</a></li>
              <li><a href="#faq" className="hover:text-teal-400 transition-colors">FAQ</a></li>
            </ul>
          </div>
          
          <div>
            <h3 className="font-semibold text-white mb-4">Legal & Compliance</h3>
            <ul className="space-y-2 text-sm">
              <li><a href="#" className="hover:text-teal-400 transition-colors">Privacy Policy</a></li>
              <li><a href="#" className="hover:text-teal-400 transition-colors">Terms of Service</a></li>
              <li><a href="#" className="hover:text-teal-400 transition-colors">GST Compliance</a></li>
              <li><a href="#" className="hover:text-teal-400 transition-colors">Drug License Guide</a></li>
            </ul>
          </div>

          <div>
            <h3 className="font-semibold text-white mb-4">Contact Us</h3>
            <ul className="space-y-3 text-sm">
              <li className="flex items-start space-x-3">
                <MapPin className="h-5 w-5 text-teal-400 shrink-0" />
                <span>Clinic Support Hub, Chennai, Tamil Nadu, India</span>
              </li>
              <li className="flex items-center space-x-3">
                <Mail className="h-5 w-5 text-teal-400 shrink-0" />
                <a href="mailto:lokesheie29@gmail.com" className="hover:text-white transition-colors">lokesheie29@gmail.com</a>
              </li>
              <li className="flex items-center space-x-3">
                <Phone className="h-5 w-5 text-teal-400 shrink-0" />
                <a href="https://wa.me/917200124136" target="_blank" rel="noreferrer" className="hover:text-white transition-colors">+91 7200124136 (WhatsApp)</a>
              </li>
            </ul>
          </div>
        </div>
        
        <div className="border-t border-navy-800 mt-12 pt-8 text-center text-sm text-slate-500">
          <p>&copy; {new Date().getFullYear()} ClinicPulse Pro. All rights reserved.</p>
        </div>
      </div>
    </footer>
  );
};
