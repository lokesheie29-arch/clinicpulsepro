import { initializeApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider, signInWithPopup, createUserWithEmailAndPassword, signInWithEmailAndPassword, signOut, onAuthStateChanged, User } from 'firebase/auth';
import { getFirestore, doc, getDoc, setDoc, collection, getDocs, updateDoc, serverTimestamp } from 'firebase/firestore';

// ⚠️  Replace with your own Firebase project config from https://console.firebase.google.com
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || "demo-api-key",
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || "clinicpulsepro.firebaseapp.com",
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || "clinicpulsepro",
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || "clinicpulsepro.appspot.com",
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || "000000000000",
  appId: import.meta.env.VITE_FIREBASE_APP_ID || "1:000000000000:web:abc123",
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);
export const googleProvider = new GoogleAuthProvider();

export const MASTER_ADMIN_EMAIL = 'lokesheie29@gmail.com';

export type UserRole = 'admin' | 'staff' | 'viewer';
export type UserStatus = 'active' | 'pending' | 'revoked';

export interface AppUser {
  uid: string;
  email: string;
  displayName: string;
  role: UserRole;
  status: UserStatus;
  createdAt?: unknown;
}

/** Creates or fetches user doc in Firestore */
export const ensureUserDoc = async (fbUser: User): Promise<AppUser> => {
  const ref = doc(db, 'users', fbUser.uid);
  const snap = await getDoc(ref);

  if (snap.exists()) {
    return snap.data() as AppUser;
  }

  // First time – determine role
  const isMasterAdmin = fbUser.email === MASTER_ADMIN_EMAIL;
  const newUser: AppUser = {
    uid: fbUser.uid,
    email: fbUser.email || '',
    displayName: fbUser.displayName || fbUser.email?.split('@')[0] || 'User',
    role: isMasterAdmin ? 'admin' : 'viewer',
    status: isMasterAdmin ? 'active' : 'pending',
    createdAt: serverTimestamp(),
  };

  await setDoc(ref, newUser);
  return newUser;
};

export const getAllUsers = async (): Promise<AppUser[]> => {
  const snap = await getDocs(collection(db, 'users'));
  return snap.docs.map(d => d.data() as AppUser);
};

export const updateUserInFirestore = async (uid: string, data: Partial<AppUser>) => {
  await updateDoc(doc(db, 'users', uid), data);
};

export { onAuthStateChanged, signInWithPopup, createUserWithEmailAndPassword, signInWithEmailAndPassword, signOut };
