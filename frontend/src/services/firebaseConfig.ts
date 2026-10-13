/**
 * Firebase SDK Initialization for NeuroFusion AI
 *
 * Reads config from Vite env vars (VITE_FIREBASE_*).
 * If not configured, Firebase Auth is disabled and the app falls back to
 * the Flask API (local dev) or offline mock credentials.
 *
 * To configure:
 *   1. Copy .env.example -> .env.local
 *   2. Fill in your Firebase project web app config values
 *   3. Run: npm run build
 *   4. Run: firebase deploy --only hosting
 */

import { initializeApp, FirebaseApp } from 'firebase/app';
import {
  getAuth,
  Auth,
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  User,
  setPersistence,
  browserLocalPersistence
} from 'firebase/auth';

// ─── Firebase project config from Vite environment variables ──────────────────
const FIREBASE_CONFIG = {
  apiKey:            import.meta.env.VITE_FIREBASE_API_KEY            || '',
  authDomain:        import.meta.env.VITE_FIREBASE_AUTH_DOMAIN        || '',
  projectId:         import.meta.env.VITE_FIREBASE_PROJECT_ID         || '',
  storageBucket:     import.meta.env.VITE_FIREBASE_STORAGE_BUCKET     || '',
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || '',
  appId:             import.meta.env.VITE_FIREBASE_APP_ID             || '',
};

// Check whether Firebase is properly configured
export const FIREBASE_ENABLED =
  FIREBASE_CONFIG.apiKey.length > 0 &&
  FIREBASE_CONFIG.projectId.length > 0;

let firebaseApp: FirebaseApp | null = null;
let firebaseAuth: Auth | null = null;

if (FIREBASE_ENABLED) {
  try {
    firebaseApp = initializeApp(FIREBASE_CONFIG);
    firebaseAuth = getAuth(firebaseApp);
    // Use local persistence so sessions survive page refresh
    setPersistence(firebaseAuth, browserLocalPersistence).catch(() => {});
    console.log('[NeuroFusion] Firebase Auth initialized for project:', FIREBASE_CONFIG.projectId);
  } catch (err) {
    console.warn('[NeuroFusion] Firebase initialization failed — using offline mock auth.', err);
    firebaseApp = null;
    firebaseAuth = null;
  }
} else {
  console.info('[NeuroFusion] Firebase env vars not set — running in offline demo mode.');
}

export { firebaseAuth };
export type { User as FirebaseUser };
export { signInWithEmailAndPassword, signOut, onAuthStateChanged };

// Role claim key stored in Firebase Auth custom claims (server-set via Admin SDK)
export const FIREBASE_ROLE_CLAIM = 'role';

// Firestore collection where user role documents live (if Firestore is enabled)
export const FIRESTORE_USERS_COLLECTION = 'neurofusion_users';
