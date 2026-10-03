import React, { useState } from 'react';
import { ShieldAlert, Users, Key, CheckCircle, XCircle } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export const AdminPanel = () => {
  const { user } = useAuth();
  
  // Dummy users
  const [users, setUsers] = useState([
    { id: 'u1', email: 'lokesheie29@gmail.com', role: 'admin', status: 'active' },
    { id: 'u2', email: 'staff1@clinic.com', role: 'staff', status: 'active' },
    { id: 'u3', email: 'newdoc@clinic.com', role: 'viewer', status: 'pending' },
  ]);

  if (user?.email !== 'lokesheie29@gmail.com' && user?.role !== 'admin') {
    return (
      <div className="max-w-7xl mx-auto px-4 py-16">
        <div className="bg-red-50 text-red-700 p-6 rounded-xl border border-red-200 flex items-center space-x-4">
          <ShieldAlert className="h-8 w-8" />
          <div>
            <h3 className="font-bold text-lg">Access Denied</h3>
            <p>You do not have master administrator privileges to view this section.</p>
          </div>
        </div>
      </div>
    );
  }

  const toggleStatus = (id: string) => {
    setUsers(users.map(u => {
      if (u.id === id) {
        return { ...u, status: u.status === 'active' ? 'revoked' : 'active' };
      }
      return u;
    }));
  };

  const changeRole = (id: string, role: string) => {
    setUsers(users.map(u => u.id === id ? { ...u, role } : u));
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
      <div className="flex items-center space-x-3 mb-8">
        <Key className="h-8 w-8 text-teal-600" />
        <h2 className="text-3xl font-bold text-navy-900">Admin Access Control Center</h2>
      </div>

      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="p-6 border-b border-slate-200 bg-slate-50 flex justify-between items-center">
          <div className="flex items-center space-x-2">
            <Users className="h-5 w-5 text-slate-500" />
            <h3 className="font-semibold text-navy-900">User Management</h3>
          </div>
          <button className="bg-teal-600 hover:bg-teal-700 text-white px-4 py-2 rounded font-medium text-sm transition-colors">
            Pre-Authorize User
          </button>
        </div>
        
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="text-xs text-slate-500 bg-white uppercase tracking-wider border-b border-slate-200">
              <tr>
                <th className="px-6 py-4">User Email</th>
                <th className="px-6 py-4">Role</th>
                <th className="px-6 py-4 text-center">Status</th>
                <th className="px-6 py-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {users.map(u => (
                <tr key={u.id} className="border-b border-slate-100 last:border-0 hover:bg-slate-50">
                  <td className="px-6 py-4 font-medium text-navy-900">{u.email}</td>
                  <td className="px-6 py-4">
                    <select 
                      value={u.role} 
                      onChange={(e) => changeRole(u.id, e.target.value)}
                      disabled={u.email === 'lokesheie29@gmail.com'}
                      className="p-1 border border-slate-200 rounded text-xs bg-white focus:ring-1 focus:ring-teal-500 disabled:opacity-50"
                    >
                      <option value="admin">Admin</option>
                      <option value="staff">Staff</option>
                      <option value="viewer">Viewer</option>
                    </select>
                  </td>
                  <td className="px-6 py-4 text-center">
                    <span className={`inline-flex items-center space-x-1 px-2.5 py-1 rounded-full text-xs font-semibold ${
                      u.status === 'active' ? 'bg-emerald-50 text-emerald-600' : 
                      u.status === 'pending' ? 'bg-amber-50 text-amber-600' : 'bg-red-50 text-red-600'
                    }`}>
                      {u.status === 'active' ? <CheckCircle className="h-3 w-3" /> : <XCircle className="h-3 w-3" />}
                      <span className="capitalize">{u.status}</span>
                    </span>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <button 
                      onClick={() => toggleStatus(u.id)}
                      disabled={u.email === 'lokesheie29@gmail.com'}
                      className={`text-xs font-medium px-3 py-1.5 rounded transition-colors disabled:opacity-50 ${
                        u.status === 'active' 
                          ? 'text-red-600 bg-red-50 hover:bg-red-100' 
                          : 'text-emerald-600 bg-emerald-50 hover:bg-emerald-100'
                      }`}
                    >
                      {u.status === 'active' ? 'Revoke Access' : 'Grant Access'}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
