import React, { createContext, useContext, useState, useEffect } from 'react';
// import { auth } from '../lib/firebase';
// Firebase is mocked here for the setup since we don't have real credentials
// For a production app, this would use firebase/auth
import { UserRole } from '../types';

interface AuthContextType {
  user: UserRole | null;
  loading: boolean;
  login: (email: string) => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<UserRole | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Mock check for existing user
    const savedUser = localStorage.getItem('clinicpulse_user');
    if (savedUser) {
      setUser(JSON.parse(savedUser));
    }
    setLoading(false);
  }, []);

  const login = async (email: string) => {
    // Mock login logic
    const role: 'admin' | 'staff' = email === 'lokesheie29@gmail.com' ? 'admin' : 'staff';
    const newUser: UserRole = {
      uid: 'user-' + Date.now(),
      email,
      role,
      status: 'active'
    };
    setUser(newUser);
    localStorage.setItem('clinicpulse_user', JSON.stringify(newUser));
  };

  const logout = async () => {
    setUser(null);
    localStorage.removeItem('clinicpulse_user');
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within AuthProvider');
  return context;
};
