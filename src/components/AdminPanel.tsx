import { useState, useEffect } from 'react';
import { ShieldAlert, Users, Key, CheckCircle, XCircle, RefreshCw, Shield } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { getAllUsers, updateUserInFirestore, AppUser, UserRole, UserStatus } from '../lib/firebase';

export const AdminPanel = ({ onClose }: { onClose: () => void }) => {
  const { user } = useAuth();
  const [users, setUsers] = useState<AppUser[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const all = await getAllUsers();
      setUsers(all.sort((a, b) => {
        // pending first, then active, then revoked
        const order: Record<UserStatus, number> = { pending: 0, active: 1, revoked: 2 };
        return order[a.status] - order[b.status];
      }));
    } catch {
      // demo mode — show placeholder
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchUsers(); }, []);

  if (user?.role !== 'admin') {
    return (
      <div className="max-w-7xl mx-auto px-4 py-16">
        <div className="bg-red-50 text-red-700 p-6 rounded-xl border border-red-200 flex items-center space-x-4">
          <ShieldAlert className="h-8 w-8 shrink-0" />
          <div>
            <h3 className="font-bold text-lg">Access Denied</h3>
            <p>You do not have master administrator privileges.</p>
          </div>
        </div>
      </div>
    );
  }

  const handleStatusToggle = async (u: AppUser) => {
    const newStatus: UserStatus = u.status === 'active' ? 'revoked' : 'active';
    await updateUserInFirestore(u.uid, { status: newStatus });
    setUsers(prev => prev.map(x => x.uid === u.uid ? { ...x, status: newStatus } : x));
  };

  const handleRoleChange = async (u: AppUser, role: UserRole) => {
    await updateUserInFirestore(u.uid, { role });
    setUsers(prev => prev.map(x => x.uid === u.uid ? { ...x, role } : x));
  };

  const handleApprove = async (u: AppUser) => {
    await updateUserInFirestore(u.uid, { status: 'active', role: 'staff' });
    setUsers(prev => prev.map(x => x.uid === u.uid ? { ...x, status: 'active', role: 'staff' } : x));
  };

  const pendingCount = users.filter(u => u.status === 'pending').length;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center space-x-3">
          <div className="p-2 bg-navy-900 rounded-xl">
            <Key className="h-7 w-7 text-teal-400" />
          </div>
          <div>
            <h2 className="text-2xl font-bold text-navy-900">Admin Access Control Center</h2>
            <p className="text-slate-500 text-sm">Manage user roles, approve registrations, and revoke access.</p>
          </div>
        </div>
        <button onClick={onClose} className="text-slate-400 hover:text-slate-600 text-sm font-medium">
          ← Back to App
        </button>
      </div>

      {/* Pending approval alert */}
      {pendingCount > 0 && (
        <div className="mb-6 bg-amber-50 border border-amber-200 text-amber-800 px-5 py-4 rounded-xl flex items-center space-x-3">
          <Shield className="h-5 w-5 text-amber-500 shrink-0" />
          <span className="font-medium">{pendingCount} user(s) are waiting for access approval.</span>
        </div>
      )}

      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="p-5 border-b border-slate-200 bg-slate-50 flex justify-between items-center">
          <div className="flex items-center space-x-2">
            <Users className="h-5 w-5 text-slate-500" />
            <h3 className="font-semibold text-navy-900">Registered Users ({users.length})</h3>
          </div>
          <button onClick={fetchUsers} className="flex items-center space-x-1 text-sm text-slate-500 hover:text-teal-600 transition-colors">
            <RefreshCw className="h-4 w-4" />
            <span>Refresh</span>
          </button>
        </div>

        {loading ? (
          <div className="p-12 text-center text-slate-400">Loading users...</div>
        ) : users.length === 0 ? (
          <div className="p-12 text-center text-slate-400">No users registered yet.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead className="text-xs text-slate-500 uppercase tracking-wider border-b border-slate-200 bg-white">
                <tr>
                  <th className="px-6 py-4">User</th>
                  <th className="px-6 py-4">Role</th>
                  <th className="px-6 py-4 text-center">Status</th>
                  <th className="px-6 py-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {users.map(u => (
                  <tr key={u.uid} className={`border-b border-slate-100 last:border-0 hover:bg-slate-50 ${u.status === 'pending' ? 'bg-amber-50/50' : ''}`}>
                    <td className="px-6 py-4">
                      <div className="font-semibold text-navy-900">{u.displayName}</div>
                      <div className="text-xs text-slate-500">{u.email}</div>
                    </td>
                    <td className="px-6 py-4">
                      <select
                        value={u.role}
                        onChange={e => handleRoleChange(u, e.target.value as UserRole)}
                        disabled={u.email === 'lokesheie29@gmail.com'}
                        className="p-1.5 border border-slate-200 rounded-lg text-xs bg-white focus:ring-1 focus:ring-teal-500 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        <option value="admin">Admin</option>
                        <option value="staff">Staff</option>
                        <option value="viewer">Viewer</option>
                      </select>
                    </td>
                    <td className="px-6 py-4 text-center">
                      <span className={`inline-flex items-center space-x-1.5 px-3 py-1 rounded-full text-xs font-bold ${
                        u.status === 'active' ? 'bg-emerald-50 text-emerald-700' :
                        u.status === 'pending' ? 'bg-amber-50 text-amber-700' :
                        'bg-red-50 text-red-700'
                      }`}>
                        {u.status === 'active' ? <CheckCircle className="h-3 w-3" /> : <XCircle className="h-3 w-3" />}
                        <span className="capitalize">{u.status}</span>
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end space-x-2">
                        {u.status === 'pending' && (
                          <button
                            onClick={() => handleApprove(u)}
                            className="text-xs font-bold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 px-3 py-1.5 rounded-lg transition-colors"
                          >
                            ✓ Approve
                          </button>
                        )}
                        <button
                          onClick={() => handleStatusToggle(u)}
                          disabled={u.email === 'lokesheie29@gmail.com'}
                          className={`text-xs font-bold px-3 py-1.5 rounded-lg transition-colors disabled:opacity-40 disabled:cursor-not-allowed ${
                            u.status === 'active'
                              ? 'text-red-600 bg-red-50 hover:bg-red-100'
                              : 'text-teal-600 bg-teal-50 hover:bg-teal-100'
                          }`}
                        >
                          {u.status === 'active' ? 'Revoke' : 'Restore'}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};
