import { Activity, ShieldCheck, Key } from 'lucide-react';
import { Show, SignInButton, SignUpButton, UserButton, useUser } from '@clerk/react';

export const Navbar = ({ onAdminClick }: { onAdminClick?: () => void }) => {
  const { user } = useUser();
  const isAdmin = user?.primaryEmailAddress?.emailAddress === 'lokesheie29@gmail.com';

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
            <a href="https://wa.me/917200124136" target="_blank" rel="noreferrer" className="hidden sm:flex items-center space-x-2 bg-emerald-100 text-emerald-700 px-4 py-2 rounded-full font-medium hover:bg-emerald-200 transition-colors text-sm">
              <ShieldCheck className="h-4 w-4" />
              <span>WhatsApp Us</span>
            </a>

            <Show when="signed-in">
              {isAdmin && (
                <button
                  onClick={onAdminClick}
                  className="flex items-center space-x-1 text-xs font-semibold bg-navy-900 text-white px-3 py-1.5 rounded-full hover:bg-navy-800 transition-colors"
                >
                  <Key className="h-3.5 w-3.5" />
                  <span>Admin Panel</span>
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
