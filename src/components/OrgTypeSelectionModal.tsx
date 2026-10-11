import React, { useState } from 'react';
import { useUser } from '@clerk/react';
import {
  Building2,
  Microscope,
  Pill,
  CheckCircle2,
  ArrowRight,
  ShieldCheck,
  X,
  Stethoscope,
  Receipt,
  BarChart3,
  Sparkles
} from 'lucide-react';
import { OrgType } from '../types';
import { useAppState } from '../context/AppStateContext';
import confetti from 'canvas-confetti';

interface OrgTypeSelectionModalProps {
  isOpen: boolean;
  onClose: () => void;
  isOnboarding?: boolean;
}

interface FacilityOption {
  type: OrgType;
  title: string;
  badge: string;
  badgeColor: string;
  borderColor: string;
  activeBg: string;
  iconBg: string;
  iconColor: string;
  description: string;
  icon: React.ReactNode;
  modules: { name: string; icon: React.ReactNode }[];
}

export const OrgTypeSelectionModal: React.FC<OrgTypeSelectionModalProps> = ({
  isOpen,
  onClose,
  isOnboarding = false
}) => {
  const { user } = useUser();
  const { orgType, setOrgType } = useAppState();
  const [selectedType, setSelectedType] = useState<OrgType>(orgType || 'hospital');
  const [isSaving, setIsSaving] = useState(false);

  if (!isOpen) return null;

  const facilityOptions: FacilityOption[] = [
    {
      type: 'hospital',
      title: 'Hospital / Multispecialty Hospital',
      badge: 'Complete Healthcare ERP',
      badgeColor: 'bg-teal-50 text-teal-700 border-teal-200',
      borderColor: 'border-teal-500 ring-2 ring-teal-500/20 bg-teal-50/20',
      iconBg: 'bg-teal-100 text-teal-700',
      iconColor: 'text-teal-600',
      activeBg: 'from-teal-500/10 to-emerald-500/10',
      description: 'For hospitals, multispecialty hospitals, clinics, and comprehensive healthcare facilities.',
      icon: <Building2 className="h-7 w-7" />,
      modules: [
        { name: 'OPD Studio', icon: <Stethoscope className="h-3.5 w-3.5" /> },
        { name: 'Lab & Diagnostics', icon: <Microscope className="h-3.5 w-3.5" /> },
        { name: 'Billing & WhatsApp', icon: <Receipt className="h-3.5 w-3.5" /> },
        { name: 'FEFO Pharmacy', icon: <Pill className="h-3.5 w-3.5" /> },
        { name: 'Financial Analytics', icon: <BarChart3 className="h-3.5 w-3.5" /> }
      ]
    },
    {
      type: 'laboratory',
      title: 'Testing Laboratory',
      badge: 'Diagnostics & Pathology ERP',
      badgeColor: 'bg-purple-50 text-purple-700 border-purple-200',
      borderColor: 'border-purple-500 ring-2 ring-purple-500/20 bg-purple-50/20',
      iconBg: 'bg-purple-100 text-purple-700',
      iconColor: 'text-purple-600',
      activeBg: 'from-purple-500/10 to-indigo-500/10',
      description: 'For medical diagnostic laboratories, pathology labs, and clinical testing facilities.',
      icon: <Microscope className="h-7 w-7" />,
      modules: [
        { name: 'Lab & Diagnostics', icon: <Microscope className="h-3.5 w-3.5" /> },
        { name: 'Investigation Billing & WhatsApp', icon: <Receipt className="h-3.5 w-3.5" /> },
        { name: 'Financial Analytics', icon: <BarChart3 className="h-3.5 w-3.5" /> }
      ]
    },
    {
      type: 'pharmacy',
      title: 'Medical Store / Pharmacy',
      badge: 'Retail Pharmacy & Dispensing POS',
      badgeColor: 'bg-amber-50 text-amber-800 border-amber-200',
      borderColor: 'border-amber-500 ring-2 ring-amber-500/20 bg-amber-50/20',
      iconBg: 'bg-amber-100 text-amber-800',
      iconColor: 'text-amber-600',
      activeBg: 'from-amber-500/10 to-orange-500/10',
      description: 'For retail medical shops, pharmacies, chemist counters, and medicine dispensaries.',
      icon: <Pill className="h-7 w-7" />,
      modules: [
        { name: 'FEFO Pharmacy Inventory', icon: <Pill className="h-3.5 w-3.5" /> },
        { name: 'Medicine Billing & WhatsApp', icon: <Receipt className="h-3.5 w-3.5" /> },
        { name: 'Financial Analytics', icon: <BarChart3 className="h-3.5 w-3.5" /> }
      ]
    }
  ];

  const handleConfirm = async () => {
    setIsSaving(true);
    try {
      setOrgType(selectedType);
      localStorage.setItem('clinicpulse_org_type_selected', 'true');

      if (user) {
        await user.update({
          unsafeMetadata: {
            ...user.unsafeMetadata,
            orgType: selectedType
          }
        });
      }

      confetti({
        particleCount: 65,
        spread: 60,
        origin: { y: 0.6 }
      });

      onClose();
    } catch (err) {
      console.error('Failed to update organization type:', err);
      // Still apply locally
      setOrgType(selectedType);
      onClose();
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
      <div className="bg-white rounded-3xl shadow-2xl border border-slate-200 w-full max-w-3xl overflow-hidden flex flex-col max-h-[92vh]">
        {/* Header */}
        <div className="bg-gradient-to-r from-navy-900 via-navy-800 to-slate-900 text-white p-6 sm:p-7 relative shrink-0">
          {!isOnboarding && (
            <button
              onClick={onClose}
              className="absolute top-5 right-5 text-slate-400 hover:text-white p-1 rounded-xl transition-colors"
            >
              <X className="h-5 w-5" />
            </button>
          )}

          <div className="flex items-center space-x-3.5">
            <div className="w-12 h-12 rounded-2xl bg-teal-500/20 border border-teal-400/30 flex items-center justify-center text-teal-300">
              <Sparkles className="h-6 w-6" />
            </div>
            <div>
              <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-teal-500/20 text-teal-300 text-xs font-semibold mb-1 border border-teal-500/30">
                <ShieldCheck className="h-3.5 w-3.5" />
                <span>{isOnboarding ? 'Mandatory Setup • Step 1 of 1' : 'Facility Configuration'}</span>
              </div>
              <h2 className="text-xl sm:text-2xl font-bold">
                Select Your Organization Type
              </h2>
              <p className="text-slate-300 text-xs sm:text-sm mt-1">
                ClinicPulse Pro tailors your daily ERP modules, billing headers, and clinical workflows to match your establishment.
              </p>
            </div>
          </div>
        </div>

        {/* Card Selection Options */}
        <div className="p-6 overflow-y-auto flex-1 space-y-4">
          <div className="grid grid-cols-1 gap-4">
            {facilityOptions.map((option) => {
              const isSelected = selectedType === option.type;
              return (
                <div
                  key={option.type}
                  onClick={() => setSelectedType(option.type)}
                  className={`p-5 rounded-2xl border-2 cursor-pointer transition-all relative text-left flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 ${
                    isSelected
                      ? option.borderColor
                      : 'border-slate-200 hover:border-slate-300 hover:bg-slate-50/50 bg-white'
                  }`}
                >
                  <div className="flex items-start gap-4">
                    <div className={`w-14 h-14 rounded-2xl flex items-center justify-center shrink-0 shadow-sm ${option.iconBg}`}>
                      {option.icon}
                    </div>

                    <div>
                      <div className="flex flex-wrap items-center gap-2 mb-1">
                        <h3 className="font-bold text-slate-900 text-base">
                          {option.title}
                        </h3>
                        <span className={`text-[11px] font-semibold px-2 py-0.5 rounded-full border ${option.badgeColor}`}>
                          {option.badge}
                        </span>
                      </div>

                      <p className="text-xs text-slate-600 leading-relaxed mb-3">
                        {option.description}
                      </p>

                      {/* Tailored Modules Pill Preview */}
                      <div className="flex flex-wrap items-center gap-1.5">
                        <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider mr-1">
                          Included Modules:
                        </span>
                        {option.modules.map((m, idx) => (
                          <span
                            key={idx}
                            className={`inline-flex items-center gap-1 text-[11px] font-medium px-2 py-0.5 rounded-lg border ${
                              isSelected
                                ? 'bg-white text-slate-800 border-slate-300 shadow-xs'
                                : 'bg-slate-100 text-slate-600 border-slate-200'
                            }`}
                          >
                            {m.icon}
                            <span>{m.name}</span>
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* Radio / Checkmark Icon */}
                  <div className="sm:self-center shrink-0">
                    <div
                      className={`w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all ${
                        isSelected
                          ? 'border-teal-600 bg-teal-600 text-white'
                          : 'border-slate-300 bg-white'
                      }`}
                    >
                      {isSelected && <CheckCircle2 className="h-4 w-4" />}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Footer Actions */}
        <div className="p-5 border-t border-slate-100 bg-slate-50 flex items-center justify-between shrink-0">
          <p className="text-xs text-slate-500">
            You can modify your organization type anytime in Profile Settings.
          </p>

          <div className="flex items-center space-x-3">
            {!isOnboarding && (
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 text-sm font-medium text-slate-600 hover:text-slate-800 transition-colors"
              >
                Cancel
              </button>
            )}

            <button
              type="button"
              onClick={handleConfirm}
              disabled={isSaving}
              className="px-6 py-2.5 text-sm font-bold bg-teal-600 hover:bg-teal-700 text-white rounded-xl shadow-md transition-all disabled:opacity-50 flex items-center gap-2"
            >
              <span>{isSaving ? 'Configuring ERP...' : 'Confirm Facility Type'}</span>
              <ArrowRight className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
