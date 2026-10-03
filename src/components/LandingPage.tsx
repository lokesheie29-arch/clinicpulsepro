import React from 'react';
import { ShieldCheck, Zap, Database, Users, MessageCircle, FileText, CheckCircle, ChevronDown } from 'lucide-react';

export const LandingPage = () => {
  return (
    <div className="print:hidden">
      {/* Hero Section */}
      <section className="relative overflow-hidden bg-navy-900 text-white pt-24 pb-32">
        <div className="absolute inset-0 opacity-10 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-teal-400 via-navy-900 to-navy-900"></div>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 text-center">
          <div className="inline-flex items-center space-x-2 bg-white/10 rounded-full px-4 py-1.5 mb-8 border border-white/20">
            <ShieldCheck className="h-4 w-4 text-teal-400" />
            <span className="text-sm font-medium">100% GST & FEFO Compliant for Indian Clinics</span>
          </div>
          <h1 className="text-5xl md:text-7xl font-extrabold tracking-tight mb-6">
            Smart Clinic ERP with <br className="hidden md:block" />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-teal-400 to-emerald-400">
              1-Click WhatsApp Billing
            </span>
          </h1>
          <p className="text-lg md:text-xl text-slate-300 max-w-3xl mx-auto mb-10">
            Replace 5 different software tools with one modern, fast, and compliant system. Handle OPD, Pharmacy, Inventory, and GST Billing effortlessly.
          </p>
          <div className="flex flex-col sm:flex-row justify-center items-center space-y-4 sm:space-y-0 sm:space-x-6">
            <a href="#demo" className="bg-teal-500 hover:bg-teal-600 text-white px-8 py-4 rounded-full font-bold text-lg transition-all shadow-lg hover:shadow-teal-500/30 w-full sm:w-auto">
              Explore Live Interactive Demo
            </a>
            <a href="https://wa.me/917200124136" target="_blank" rel="noreferrer" className="bg-white/10 hover:bg-white/20 text-white px-8 py-4 rounded-full font-bold text-lg transition-all border border-white/20 w-full sm:w-auto flex justify-center items-center space-x-2">
              <MessageCircle className="h-5 w-5" />
              <span>Book 1-on-1 Walkthrough</span>
            </a>
          </div>
          
          {/* Live Metrics Strip */}
          <div className="mt-16 grid grid-cols-1 sm:grid-cols-3 gap-6 max-w-4xl mx-auto border-t border-white/10 pt-8">
            <div className="text-center">
              <div className="text-3xl font-bold text-teal-400">99.4%</div>
              <div className="text-sm text-slate-400 mt-1">On-Time Billing</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-teal-400">40s</div>
              <div className="text-sm text-slate-400 mt-1">OPD Turn-around</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-teal-400">100%</div>
              <div className="text-sm text-slate-400 mt-1">FEFO Accuracy</div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Grid */}
      <section id="features" className="py-24 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-navy-900 mb-4">Everything your clinic needs to grow</h2>
            <p className="text-slate-600 max-w-2xl mx-auto">Built from the ground up to solve real operational bottlenecks faced by doctors and clinic managers in India.</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            <FeatureCard 
              icon={<MessageCircle className="h-8 w-8 text-teal-600" />}
              title="WhatsApp Paperless Billing"
              desc="Send professional GST invoices and prescription dosage instructions directly to patients' WhatsApp instantly."
            />
            <FeatureCard 
              icon={<Zap className="h-8 w-8 text-amber-500" />}
              title="Dynamic UPI QRs"
              desc="Generate precise amount UPI QRs on the invoice to eliminate counter change issues and speed up collections."
            />
            <FeatureCard 
              icon={<ShieldCheck className="h-8 w-8 text-emerald-600" />}
              title="FEFO Expiry Safeguards"
              desc="First-Expiry-First-Out logic automatically deducts the oldest batch stock. Visual alerts for near-expiry medicines."
            />
            <FeatureCard 
              icon={<FileText className="h-8 w-8 text-indigo-600" />}
              title="GST Schedule Reports"
              desc="Export B2C and B2B sales data in CA-ready formats. Separates CGST and SGST accurately."
            />
            <FeatureCard 
              icon={<Users className="h-8 w-8 text-rose-500" />}
              title="Multi-Doctor Scheduling"
              desc="Manage different consultation fees, timings, and OPD queues for multiple visiting specialists seamlessly."
            />
            <FeatureCard 
              icon={<Database className="h-8 w-8 text-blue-600" />}
              title="Secure Cloud Backup"
              desc="Bank-grade encryption for patient data with automated daily backups. Access your clinic data from anywhere."
            />
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section id="pricing" className="py-24 bg-slate-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-navy-900 mb-4">Transparent India-First Pricing</h2>
            <p className="text-slate-600">No hidden charges. No per-patient fees.</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-5xl mx-auto">
            <PricingCard 
              title="Starter Clinic"
              price="₹999"
              period="/month"
              features={['1 Doctor Profile', 'OPD + Billing', '100 WhatsApp Invoices/mo', 'Basic Support']}
            />
            <PricingCard 
              title="Growth Clinic"
              price="₹2,499"
              period="/month"
              features={['Up to 3 Doctors', 'Full ERP + Pharmacy', 'Unlimited WhatsApp Billing', 'GST Reports', 'Priority Support']}
              isPopular
            />
            <PricingCard 
              title="Polyclinic"
              price="₹4,999"
              period="/month"
              features={['Unlimited Doctors', 'Multiple Locations', 'Custom Analytics API', 'Dedicated Account Manager']}
            />
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="py-24 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl md:text-4xl font-bold text-navy-900 text-center mb-16">Trusted by 500+ Clinics</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <Testimonial 
              quote="ClinicPulse Pro cut down our billing time from 3 minutes to just 30 seconds. The WhatsApp integration is something our patients absolutely love."
              name="Dr. Ananya Reddy"
              role="Lead Pediatrician, CareWell Clinic"
              location="Bengaluru"
            />
            <Testimonial 
              quote="The FEFO pharmacy tracking saved us over ₹50,000 in expired medicines last quarter alone. The ROI is immediate."
              name="Dr. Vikram Singh"
              role="Owner, Apollo Associates"
              location="Mumbai"
            />
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section id="faq" className="py-24 bg-slate-50">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl md:text-4xl font-bold text-navy-900 text-center mb-12">Frequently Asked Questions</h2>
          <div className="space-y-4">
            <FaqItem 
              question="Do I need a separate WhatsApp API account?"
              answer="No, ClinicPulse Pro includes a built-in WhatsApp Cloud API integration. For the Growth plan and above, standard template message costs are included."
            />
            <FaqItem 
              question="Is the software Drug License & GST compliant?"
              answer="Yes, all tax invoices follow the strict guidelines set by the Government of India, including HSN codes, SAC codes, and proper CGST/SGST splitting. It fully supports Schedule H & H1 drug logging."
            />
            <FaqItem 
              question="Can I migrate my existing patient data?"
              answer="Absolutely. We provide a simple Excel/CSV upload utility to import your existing patient records, medicine inventory, and past consultation history during onboarding."
            />
            <FaqItem 
              question="Does it work offline?"
              answer="ClinicPulse Pro is a cloud-first application ensuring your data is backed up. However, it uses modern PWA technologies allowing the billing screen to function during temporary internet outages and syncs automatically when reconnected."
            />
          </div>
        </div>
      </section>
    </div>
  );
};

const FeatureCard = ({ icon, title, desc }: any) => (
  <div className="p-8 rounded-2xl bg-slate-50 border border-slate-100 hover:border-teal-100 hover:shadow-lg hover:shadow-teal-100/50 transition-all group">
    <div className="mb-4 p-3 bg-white rounded-xl inline-block shadow-sm group-hover:scale-110 transition-transform">{icon}</div>
    <h3 className="text-xl font-bold text-navy-900 mb-3">{title}</h3>
    <p className="text-slate-600 leading-relaxed">{desc}</p>
  </div>
);

const PricingCard = ({ title, price, period, features, isPopular }: any) => (
  <div className={`relative p-8 rounded-2xl bg-white border ${isPopular ? 'border-teal-500 shadow-xl shadow-teal-100' : 'border-slate-200 shadow-sm'} flex flex-col`}>
    {isPopular && <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-teal-500 text-white px-4 py-1 rounded-full text-xs font-bold uppercase tracking-wide">Most Popular</div>}
    <h3 className="text-xl font-bold text-navy-900 mb-2">{title}</h3>
    <div className="mb-6">
      <span className="text-4xl font-extrabold text-navy-900">{price}</span>
      <span className="text-slate-500">{period}</span>
    </div>
    <ul className="space-y-4 mb-8 flex-1">
      {features.map((f: string, i: number) => (
        <li key={i} className="flex items-start space-x-3">
          <CheckCircle className="h-5 w-5 text-teal-500 shrink-0 mt-0.5" />
          <span className="text-slate-700">{f}</span>
        </li>
      ))}
    </ul>
    <button className={`w-full py-3 rounded-lg font-bold transition-colors ${isPopular ? 'bg-teal-600 hover:bg-teal-700 text-white' : 'bg-slate-100 hover:bg-slate-200 text-navy-900'}`}>
      Get Started
    </button>
  </div>
);

const Testimonial = ({ quote, name, role, location }: any) => (
  <div className="bg-slate-50 p-8 rounded-2xl border border-slate-100 relative">
    <div className="absolute top-8 left-8 text-6xl text-teal-200 opacity-50 font-serif">"</div>
    <p className="text-lg text-slate-700 italic relative z-10 mb-6 pl-6">{quote}</p>
    <div className="flex items-center space-x-4 pl-6">
      <div className="h-12 w-12 rounded-full bg-teal-100 flex items-center justify-center text-teal-700 font-bold text-xl">
        {name[4]}
      </div>
      <div>
        <h4 className="font-bold text-navy-900">{name}</h4>
        <p className="text-sm text-slate-500">{role}, {location}</p>
      </div>
    </div>
  </div>
);

const FaqItem = ({ question, answer }: any) => {
  const [isOpen, setIsOpen] = React.useState(false);
  return (
    <div className="border border-slate-200 rounded-xl bg-white overflow-hidden">
      <button 
        onClick={() => setIsOpen(!isOpen)} 
        className="w-full flex justify-between items-center p-6 text-left hover:bg-slate-50 transition-colors"
      >
        <span className="font-bold text-navy-900">{question}</span>
        <ChevronDown className={`h-5 w-5 text-slate-400 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>
      {isOpen && (
        <div className="px-6 pb-6 text-slate-600 leading-relaxed border-t border-slate-100 pt-4">
          {answer}
        </div>
      )}
    </div>
  );
};
