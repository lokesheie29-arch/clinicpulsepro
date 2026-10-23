import { ShieldCheck, Key, UserCheck, Sparkles, CreditCard, Clock, AlertTriangle } from 'lucide-react';
import { Show, SignInButton, SignUpButton, UserButton, useUser } from '@clerk/react';
import { Logo } from './Logo';
import { useSubscription } from '../context/SubscriptionContext';

interface NavbarProps {
  onAdminClick?: () => void;
  onProfileClick?: () => void;
  onSubscriptionClick?: () => void;
  showLandingPage?: boolean;
  onToggleLandingPage?: () => void;
}

export const Navbar = ({
  onAdminClick,
  onProfileClick,
  onSubscriptionClick,
  showLandingPage,
  onToggleLandingPage
}: NavbarProps) => {
  const { user } = useUser();
  const { subscription, remainingDays, hasPaidAccess, isTrialActive, isTrialExpired } = useSubscription();
  const isAdmin = user?.primaryEmailAddress?.emailAddress === 'lokesheie29@gmail.com';

  const handleSubscriptionClick = () => {
    if (onSubscriptionClick) {
      onSubscriptionClick();
    } else {
      window.location.hash = '#subscription';
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  return (
    <nav className="print:hidden sticky top-0 z-50 w-full bg-white/80 backdrop-blur-md border-b border-slate-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16 items-center">
          <div className="flex items-center space-x-3">
            <Logo size="md" variant="dark" />
            <Show when="signed-in">
              <span className="hidden sm:inline-block px-2.5 py-0.5 text-[11px] font-bold uppercase tracking-wider bg-teal-50 text-teal-700 border border-teal-200 rounded-full">
                Staff Portal
              </span>
            </Show>
          </div>

          {/* Navigation Links */}
          <div className="hidden md:flex space-x-8 items-center">
            <Show when="signed-out">
              <a href="#features" className="text-slate-600 hover:text-teal-600 font-medium">Features</a>
              <a href="#demo" className="text-slate-600 hover:text-teal-600 font-medium">Live Demo</a>
              <a href="#pricing" className="text-slate-600 hover:text-teal-600 font-medium">Pricing</a>
              <a href="#faq" className="text-slate-600 hover:text-teal-600 font-medium">FAQ</a>
            </Show>
            <Show when="signed-in">
              {onToggleLandingPage && (
                <button
                  onClick={onToggleLandingPage}
                  className="text-xs font-semibold text-slate-500 hover:text-teal-600 transition-colors"
                >
                  {showLandingPage ? '← Back to Clinic Modules' : 'Preview Public Website ↗'}
                </button>
              )}
            </Show>
          </div>

          <div className="flex items-center space-x-3">
            <a
              href="https://wa.me/917200124136"
              target="_blank"
              rel="noreferrer"
              className="hidden sm:flex items-center space-x-1.5 bg-emerald-100 text-emerald-700 px-3.5 py-1.5 rounded-full font-medium hover:bg-emerald-200 transition-colors text-xs"
            >
              <ShieldCheck className="h-4 w-4" />
              <span>Helpline</span>
            </a>

            <Show when="signed-in">
              {/* Subscription Status & Upgrade Button */}
              <button
                onClick={handleSubscriptionClick}
                className={`flex items-center space-x-1.5 text-xs font-bold px-3 py-1.5 rounded-full transition-all border ${
                  hasPaidAccess
                    ? 'bg-emerald-50 text-emerald-800 border-emerald-200 hover:bg-emerald-100'
                    : isTrialActive
                    ? remainingDays <= 3
                      ? 'bg-rose-50 text-rose-800 border-rose-300 hover:bg-rose-100 animate-pulse'
                      : 'bg-teal-50 text-teal-800 border-teal-200 hover:bg-teal-100'
                    : 'bg-rose-100 text-rose-900 border-rose-300 hover:bg-rose-200'
                }`}
                title="Manage Subscription, Invoices & Licenses"
              >
                {hasPaidAccess ? (
                  <>
                    <Sparkles className="h-3.5 w-3.5 text-emerald-600" />
                    <span>Commercial ERP ✓</span>
                  </>
                ) : isTrialActive ? (
                  <>
                    <Clock className="h-3.5 w-3.5 text-teal-600" />
                    <span>Trial: {remainingDays}d left</span>
                  </>
                ) : (
                  <>
                    <AlertTriangle className="h-3.5 w-3.5 text-rose-600" />
                    <span>Trial Expired • Renew</span>
                  </>
                )}
              </button>

              {/* Profile Settings Button */}
              <button
                onClick={onProfileClick}
                className="flex items-center space-x-1.5 text-xs font-semibold bg-slate-100 text-slate-700 hover:bg-slate-200 hover:text-slate-900 px-3 py-1.5 rounded-full transition-colors border border-slate-200"
                title="Edit Practitioner Profile"
              >
                <UserCheck className="h-3.5 w-3.5 text-teal-600" />
                <span className="hidden sm:inline">My Profile</span>
              </button>

              {isAdmin && (
                <button
                  onClick={onAdminClick}
                  className="flex items-center space-x-1 text-xs font-semibold bg-slate-900 text-white px-3 py-1.5 rounded-full hover:bg-slate-800 transition-colors shadow-sm"
                >
                  <Key className="h-3.5 w-3.5 text-teal-400" />
                  <span>Admin</span>
                </button>
              )}
              <UserButton appearance={{ elements: { avatarBox: "w-9 h-9" } }} />
            </Show>

            <Show when="signed-out">
              <div className="flex items-center space-x-2">
                <SignInButton mode="modal">
                  <button className="text-sm font-medium text-slate-600 hover:text-slate-900 transition-colors px-3 py-2">
                    Sign In
                  </button>
                </SignInButton>
                <button
                  onClick={() => {
                    window.location.hash = 'checkout?plan=professional&billing=annual';
                    window.scrollTo({ top: 0, behavior: 'smooth' });
                  }}
                  className="bg-gradient-to-r from-teal-600 via-teal-700 to-slate-900 text-white px-4 py-2 rounded-full font-bold hover:from-teal-700 hover:to-slate-800 transition-all text-xs shadow-sm flex items-center gap-1.5"
                >
                  <Sparkles className="w-3.5 h-3.5 text-teal-300" />
                  <span>Subscribe</span>
                </button>
              </div>
            </Show>
          </div>
        </div>
      </div>
    </nav>
  );
};
