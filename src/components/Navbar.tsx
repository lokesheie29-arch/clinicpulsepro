import { useState } from 'react';
import { Activity, ShieldCheck, UserCircle, LogOut, Key, Chrome } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export const Navbar = ({ onAdminClick }: { onAdminClick?: () => void }) => {
  const { user, loginWithGoogle, loginWithEmail, logout } = useAuth();
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isRegistering, setIsRegistering] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleEmailAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      await loginWithEmail(email, password, isRegistering);
      setShowLoginModal(false);
      setEmail('');
      setPassword('');
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Authentication failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleGoogle = async () => {
    setLoading(true);
    setError('');
    try {
      await loginWithGoogle();
      setShowLoginModal(false);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Google sign-in failed.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
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

            <div className="flex items-center space-x-3">
              <a href="https://wa.me/917200124136" target="_blank" rel="noreferrer" className="hidden sm:flex items-center space-x-2 bg-emerald-100 text-emerald-700 px-4 py-2 rounded-full font-medium hover:bg-emerald-200 transition-colors text-sm">
                <ShieldCheck className="h-4 w-4" />
                <span>WhatsApp Us</span>
              </a>

              {user ? (
                <div className="flex items-center space-x-2">
                  {user.role === 'admin' && (
                    <button
                      onClick={onAdminClick}
                      className="flex items-center space-x-1 text-xs font-semibold bg-navy-900 text-white px-3 py-1.5 rounded-full hover:bg-navy-800 transition-colors"
                    >
                      <Key className="h-3.5 w-3.5" />
                      <span>Admin Panel</span>
                    </button>
                  )}
                  <div className="flex flex-col items-end">
                    <span className="text-xs font-semibold text-navy-900">{user.email?.split('@')[0]}</span>
                    <span className={`text-xs font-bold uppercase ${user.role === 'admin' ? 'text-teal-600' : 'text-slate-400'}`}>{user.role}</span>
                  </div>
                  <button onClick={logout} className="p-2 text-slate-500 hover:text-red-500 rounded-full hover:bg-red-50 transition-colors">
                    <LogOut className="h-5 w-5" />
                  </button>
                </div>
              ) : (
                <button
                  onClick={() => setShowLoginModal(true)}
                  className="flex items-center space-x-2 bg-navy-900 text-white px-4 py-2 rounded-full font-medium hover:bg-navy-800 transition-colors text-sm"
                >
                  <UserCircle className="h-5 w-5" />
                  <span>Sign In</span>
                </button>
              )}
            </div>
          </div>
        </div>
      </nav>

      {/* Login Modal */}
      {showLoginModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center z-[100] p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden">
            <div className="bg-navy-900 p-6 text-white text-center">
              <Activity className="h-10 w-10 text-teal-400 mx-auto mb-2" />
              <h2 className="text-xl font-bold">ClinicPulse Pro</h2>
              <p className="text-slate-400 text-sm mt-1">{isRegistering ? 'Create your account' : 'Sign in to your account'}</p>
            </div>

            <div className="p-6">
              <button
                onClick={handleGoogle}
                disabled={loading}
                className="w-full flex items-center justify-center space-x-3 border-2 border-slate-200 hover:border-teal-300 hover:bg-teal-50 text-slate-700 px-4 py-3 rounded-xl font-medium transition-all mb-4 disabled:opacity-50"
              >
                <Chrome className="h-5 w-5 text-blue-500" />
                <span>Continue with Google</span>
              </button>

              <div className="flex items-center my-4">
                <div className="flex-1 border-t border-slate-200" />
                <span className="px-4 text-xs text-slate-400 font-medium">OR</span>
                <div className="flex-1 border-t border-slate-200" />
              </div>

              <form onSubmit={handleEmailAuth} className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-500 mb-1">Email Address</label>
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    className="w-full p-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-teal-500 outline-none text-sm"
                    placeholder="you@example.com"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-500 mb-1">Password</label>
                  <input
                    type="password"
                    required
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    className="w-full p-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-teal-500 outline-none text-sm"
                    placeholder="••••••••"
                  />
                </div>

                {error && (
                  <div className="bg-red-50 border border-red-200 text-red-600 text-sm p-3 rounded-lg">
                    {error}
                  </div>
                )}

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full bg-teal-600 hover:bg-teal-700 text-white py-3 rounded-xl font-bold transition-colors disabled:opacity-50"
                >
                  {loading ? 'Please wait...' : isRegistering ? 'Create Account & Request Access' : 'Sign In'}
                </button>
              </form>

              <p className="text-center text-sm text-slate-500 mt-4">
                {isRegistering ? 'Already have an account?' : "Don't have an account?"}{' '}
                <button onClick={() => { setIsRegistering(!isRegistering); setError(''); }} className="text-teal-600 font-semibold hover:underline">
                  {isRegistering ? 'Sign In' : 'Register'}
                </button>
              </p>

              <button onClick={() => setShowLoginModal(false)} className="w-full mt-2 text-slate-400 hover:text-slate-600 text-sm py-1 transition-colors">
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
