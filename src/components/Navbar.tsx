import { Activity, ShieldCheck, Key, UserCheck } from 'lucide-react';
import { Show, SignInButton, SignUpButton, UserButton, useUser } from '@clerk/react';

interface NavbarProps {
  onAdminClick?: () => void;
  onProfileClick?: () => void;
  showLandingPage?: boolean;
  onToggleLandingPage?: () => void;
}

export const Navbar = ({
  onAdminClick,
  onProfileClick,
  showLandingPage,
  onToggleLandingPage
}: NavbarProps) => {
  const { user } = useUser();
  const isAdmin = user?.primaryEmailAddress?.emailAddress === 'lokesheie29@gmail.com';

  return (
    <nav className="print:hidden sticky top-0 z-50 w-full bg-white/80 backdrop-blur-md border-b border-slate-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16 items-center">
          <div className="flex items-center space-x-2">
            <Activity className="h-8 w-8 text-teal-600" />
            <span className="font-bold text-xl text-navy-900">ClinicPulse Pro</span>
            <Show when="signed-in">
              <span className="hidden sm:inline-block ml-2 px-2.5 py-0.5 text-[11px] font-bold uppercase tracking-wider bg-teal-50 text-teal-700 border border-teal-200 rounded-full">
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
                  className="flex items-center space-x-1 text-xs font-semibold bg-navy-900 text-white px-3 py-1.5 rounded-full hover:bg-navy-800 transition-colors"
                >
                  <Key className="h-3.5 w-3.5" />
                  <span>Admin</span>
                </button>
              )}
              <UserButton appearance={{ elements: { avatarBox: "w-9 h-9" } }} />
            </Show>

            <Show when="signed-out">
              <div className="flex items-center space-x-2">
                <SignInButton mode="modal">
                  <button className="text-sm font-medium text-slate-600 hover:text-navy-900 transition-colors px-3 py-2">
                    Sign In
                  </button>
                </SignInButton>
                <SignUpButton mode="modal">
                  <button className="bg-teal-600 text-white px-4 py-2 rounded-full font-medium hover:bg-teal-700 transition-colors text-sm shadow-sm">
                    Register
                  </button>
                </SignUpButton>
              </div>
            </Show>
          </div>
        </div>
      </div>
    </nav>
  );
};
