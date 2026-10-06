import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import {
  auth, db, googleProvider, ensureUserDoc, MASTER_ADMIN_EMAIL,
  onAuthStateChanged, signInWithPopup, createUserWithEmailAndPassword,
  signInWithEmailAndPassword, signOut,
  AppUser
} from '../lib/firebase';
import { doc, onSnapshot } from 'firebase/firestore';

interface AuthContextType {
  user: AppUser | null;
  loading: boolean;
  loginWithGoogle: () => Promise<void>;
  loginWithEmail: (email: string, password: string, isRegister: boolean) => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<AppUser | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubAuth = onAuthStateChanged(auth, async (fbUser) => {
      if (fbUser) {
        try {
          const appUser = await ensureUserDoc(fbUser);
          // Listen for real-time role/status changes from Firestore
          const unsub = onSnapshot(doc(db, 'users', fbUser.uid), (snap) => {
            if (snap.exists()) {
              setUser(snap.data() as AppUser);
            }
          });
          setUser(appUser);
          setLoading(false);
          return unsub;
        } catch {
          // Firestore might be unavailable (demo mode) – fallback
          const isMasterAdmin = fbUser.email === MASTER_ADMIN_EMAIL;
          setUser({
            uid: fbUser.uid,
            email: fbUser.email || '',
            displayName: fbUser.displayName || fbUser.email?.split('@')[0] || 'User',
            role: isMasterAdmin ? 'admin' : 'viewer',
            status: isMasterAdmin ? 'active' : 'pending',
          });
          setLoading(false);
        }
      } else {
        setUser(null);
        setLoading(false);
      }
    });
    return () => unsubAuth();
  }, []);

  const loginWithGoogle = async () => {
    const result = await signInWithPopup(auth, googleProvider);
    await ensureUserDoc(result.user);
  };

  const loginWithEmail = async (email: string, password: string, isRegister: boolean) => {
    if (isRegister) {
      const result = await createUserWithEmailAndPassword(auth, email, password);
      await ensureUserDoc(result.user);
    } else {
      const result = await signInWithEmailAndPassword(auth, email, password);
      await ensureUserDoc(result.user);
    }
  };

  const logout = async () => {
    await signOut(auth);
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, loading, loginWithGoogle, loginWithEmail, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used inside AuthProvider');
  return ctx;
};
