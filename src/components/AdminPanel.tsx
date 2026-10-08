import { ShieldAlert, Users, Key, RefreshCw } from 'lucide-react';

export const AdminPanel = ({ onClose }: { onClose: () => void }) => {
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center space-x-3">
          <div className="p-2 bg-navy-900 rounded-xl">
            <Key className="h-7 w-7 text-teal-400" />
          </div>
          <div>
            <h2 className="text-2xl font-bold text-navy-900">Admin Access Control Center</h2>
            <p className="text-slate-500 text-sm">Manage user roles using Clerk directly from the Clerk Dashboard.</p>
          </div>
        </div>
        <button onClick={onClose} className="text-slate-400 hover:text-slate-600 text-sm font-medium">
          ← Back to App
        </button>
      </div>

      <div className="bg-amber-50 border border-amber-200 text-amber-800 px-5 py-6 rounded-xl flex items-start space-x-4">
        <ShieldAlert className="h-6 w-6 text-amber-500 shrink-0 mt-1" />
        <div>
          <h3 className="font-bold text-lg mb-1">Role Management Moved to Clerk</h3>
          <p className="mb-4 text-sm">
            We have successfully migrated the authentication system from Firebase to Clerk! 
            To manage users, approve sign-ups, or change roles, please use the powerful Clerk Dashboard.
          </p>
          <a href="https://dashboard.clerk.com" target="_blank" rel="noreferrer" className="inline-block bg-white border border-amber-300 text-amber-900 px-4 py-2 rounded-lg text-sm font-semibold hover:bg-amber-100 transition-colors">
            Open Clerk Dashboard ↗
          </a>
        </div>
      </div>
    </div>
  );
};
