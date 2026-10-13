/**
 * NeuroFusion AI — Unified Authentication Service
 *
 * Priority chain for login:
 *   1. Firebase Authentication  (when VITE_FIREBASE_* env vars are configured)
 *   2. Flask REST API           (when running locally with backend on :5000)
 *   3. Offline mock credentials (demo fallback — always available)
 *
 * For Firebase Hosting (no Flask backend), auth resolves via Firebase Auth
 * or, if Firebase Auth is not configured, via the signed offline mock.
 *
 * Demo accounts:
 *   Doctor:    doctor.demo@neurofusion.ai  / DoctorDemo2026!
 *   Developer: developer.demo@neurofusion.ai / DeveloperDemo2026!
 */

import axios from 'axios';
import { UserProfile, UserRole } from '../types';
import {
  FIREBASE_ENABLED,
  firebaseAuth,
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  FirebaseUser,
  FIREBASE_ROLE_CLAIM,
} from './firebaseConfig';
import { MOCK_USERS } from './mockData';

// ─── Storage Keys ──────────────────────────────────────────────────────────────
const STORAGE_KEY_TOKEN = 'neuro_token';
const STORAGE_KEY_USER  = 'neuro_user';
const STORAGE_KEY_LIVE  = 'neuro_backend_live';

// ─── Helpers ───────────────────────────────────────────────────────────────────

/** Return true when an Axios error came from Firebase Hosting (404/HTML fallback) */
function isOfflineError(err: unknown): boolean {
  if (!err || typeof err !== 'object') return true;
  const axiosErr = err as { response?: { status?: number; headers?: Record<string, string> } };
  if (!axiosErr.response) return true; // Network error / timeout
  const ct = axiosErr.response?.headers?.['content-type'] || '';
  const st = axiosErr.response?.status ?? 0;
  return st === 404 || st === 500 || ct.includes('text/html');
}

/** Parse a stored user from localStorage safely */
function loadStoredUser(): UserProfile | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY_USER);
    if (raw) return JSON.parse(raw) as UserProfile;
  } catch { /* ignore */ }
  return null;
}

/** Persist user profile to localStorage */
function saveStoredUser(user: UserProfile, token: string): void {
  localStorage.setItem(STORAGE_KEY_TOKEN, token);
  localStorage.setItem(STORAGE_KEY_USER, JSON.stringify(user));
}

/** Derive role from Firebase Auth user (custom claim, then email heuristic) */
async function getRoleFromFirebaseUser(fbUser: FirebaseUser): Promise<UserRole> {
  try {
    const idTokenResult = await fbUser.getIdTokenResult(/* forceRefresh */ false);
    const roleClaim = idTokenResult.claims[FIREBASE_ROLE_CLAIM] as string | undefined;
    if (roleClaim === 'doctor' || roleClaim === 'developer') return roleClaim;
  } catch { /* ignore */ }

  // Fallback: derive role from email pattern
  const email = fbUser.email?.toLowerCase() || '';
  if (email.includes('doctor') || email.includes('dr.') || email.includes('md')) return 'doctor';
  return 'developer';
}

/** Build a UserProfile from a Firebase Auth user */
async function buildProfileFromFirebaseUser(fbUser: FirebaseUser): Promise<UserProfile> {
  const role = await getRoleFromFirebaseUser(fbUser);
  // Check if there's a matching mock user for richer profile data
  const mockUser = MOCK_USERS[fbUser.email?.toLowerCase() || ''];
  if (mockUser) {
    const { password_hash: _, ...profile } = mockUser;
    return { ...profile, id: fbUser.uid };
  }
  return {
    id: fbUser.uid,
    email: fbUser.email || '',
    username: (fbUser.email || '').split('@')[0],
    name: fbUser.displayName || (fbUser.email || '').split('@')[0],
    role,
    title: role === 'doctor' ? 'Clinician' : 'Research Engineer',
    department: role === 'doctor' ? 'Clinical Division' : 'AI Research Lab',
    institution: 'NeuroFusion AI Platform',
    permissions: role === 'doctor'
      ? ['analysis:create', 'analysis:read', 'analysis:clinical', 'reports:generate']
      : ['models:inspect', 'experiments:read', 'datasets:inspect', 'metrics:evaluate'],
    approval_status: 'Approved',
  };
}

// ─── Offline / Mock credential authentication ──────────────────────────────────

function mockLogin(email: string, password: string, role: UserRole): UserProfile {
  const normalEmail = email.trim().toLowerCase();
  const normalPass  = password.trim();

  // Exact email lookup
  let matched = MOCK_USERS[normalEmail];

  // Username lookup
  if (!matched) {
    matched = Object.values(MOCK_USERS).find(u => u.username === normalEmail) as typeof matched;
  }

  // Role-based default fallback (no email provided)
  if (!matched) {
    matched = role === 'doctor'
      ? MOCK_USERS['doctor.demo@neurofusion.ai']
      : MOCK_USERS['developer.demo@neurofusion.ai'];
  }

  if (!matched) {
    throw new AuthError('Invalid credentials. No matching account found.', 'auth/user-not-found');
  }

  const validPassword =
    !normalPass ||                          // empty = allow in demo mode
    normalPass === matched.password_hash || // exact match
    normalPass === 'neuro123';              // universal demo passphrase

  if (!validPassword) {
    throw new AuthError('Invalid authentication credentials.', 'auth/wrong-password');
  }

  // Ensure role matches requested role (no cross-role elevation)
  if (matched.role !== role) {
    throw new AuthError(
      `This account is registered as "${matched.role}". Please select the correct role tab.`,
      'auth/wrong-role'
    );
  }

  const { password_hash: _, ...profile } = matched;
  return profile;
}

// ─── Custom Error Class ────────────────────────────────────────────────────────

export class AuthError extends Error {
  public readonly code: string;
  constructor(message: string, code = 'auth/error') {
    super(message);
    this.name = 'AuthError';
    this.code = code;
  }
}

// ─── Main Auth Service ─────────────────────────────────────────────────────────

export const authService = {

  /**
   * Sign in with email + password.
   * Tries Firebase Auth → Flask API → offline mock (in that order).
   */
  async login(role: UserRole, email: string, password: string): Promise<{ user: UserProfile; token: string }> {
    const normalEmail = (email || '').trim().toLowerCase();

    // ── 1. Firebase Authentication ───────────────────────────────────────────
    if (FIREBASE_ENABLED && firebaseAuth) {
      try {
        const cred = await signInWithEmailAndPassword(firebaseAuth, normalEmail, password);
        const profile = await buildProfileFromFirebaseUser(cred.user);

        // Role isolation: reject cross-role logins
        if (profile.role !== role) {
          await signOut(firebaseAuth);
          throw new AuthError(
            `This account is registered as "${profile.role}". Please select the correct role tab.`,
            'auth/wrong-role'
          );
        }

        const token = await cred.user.getIdToken();
        saveStoredUser(profile, token);
        localStorage.setItem(STORAGE_KEY_LIVE, 'firebase');
        return { user: profile, token };
      } catch (err) {
        // Re-throw real Firebase auth errors (wrong password, user disabled, etc.)
        if (err instanceof AuthError) throw err;
        const fbErr = err as { code?: string };
        if (fbErr.code === 'auth/wrong-password' || fbErr.code === 'auth/user-not-found' || fbErr.code === 'auth/invalid-email' || fbErr.code === 'auth/user-disabled') {
          const msg = fbErr.code === 'auth/wrong-password' ? 'Invalid password. Please try again.'
            : fbErr.code === 'auth/user-not-found' ? 'No account found with this email address.'
            : fbErr.code === 'auth/user-disabled' ? 'This account has been disabled.'
            : 'Invalid email address.';
          throw new AuthError(msg, fbErr.code);
        }
        // Firebase not configured / network error — fall through to next provider
        console.warn('[NeuroFusion] Firebase Auth failed, trying Flask API:', fbErr.code);
      }
    }

    // ── 2. Flask REST API (local development only) ───────────────────────────
    const isLocal = typeof window !== 'undefined' &&
      (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1');

    if (isLocal) {
      try {
        const res = await axios.post('/api/auth/login', { role, email: normalEmail, password }, { timeout: 3000 });
        const ct = String(res.headers?.['content-type'] || '');
        if (
          typeof res.data === 'object' &&
          res.data !== null &&
          !ct.includes('text/html') &&
          res.data?.token &&
          res.data?.user
        ) {
          const profile = res.data.user as UserProfile;
          if (profile.role !== role) {
            throw new AuthError(`This account is registered as "${profile.role}". Please select the correct role tab.`, 'auth/wrong-role');
          }
          saveStoredUser(profile, res.data.token);
          localStorage.setItem(STORAGE_KEY_LIVE, 'flask');
          return { user: profile, token: res.data.token };
        }
      } catch (err) {
        if (err instanceof AuthError) throw err;
        if (!isOfflineError(err)) {
          // Backend is reachable but returned a real auth error
          const axiosErr = err as { response?: { data?: { error?: string } } };
          const backendMsg = axiosErr.response?.data?.error;
          if (backendMsg) throw new AuthError(backendMsg, 'auth/api-error');
          throw err;
        }
        // Backend unavailable — fall through to offline mock
        console.info('[NeuroFusion] Flask API unavailable — using offline demo credentials.');
      }
    }

    // ── 3. Offline Mock Credentials (always available) ───────────────────────
    const profile = mockLogin(normalEmail, password, role);
    const token = `demo_${role}_${Date.now()}`;
    saveStoredUser(profile, token);
    localStorage.setItem(STORAGE_KEY_LIVE, 'mock');
    return { user: profile, token };
  },

  /** Return the currently authenticated user, restoring from storage if needed. */
  async getCurrentUser(): Promise<UserProfile | null> {
    const token = localStorage.getItem(STORAGE_KEY_TOKEN);
    if (!token) return null;

    // Firebase Auth session — wait for auth state
    if (FIREBASE_ENABLED && firebaseAuth && !token.startsWith('demo_')) {
      return new Promise<UserProfile | null>((resolve) => {
        const unsub = onAuthStateChanged(firebaseAuth!, async (fbUser) => {
          unsub();
          if (!fbUser) {
            localStorage.removeItem(STORAGE_KEY_TOKEN);
            localStorage.removeItem(STORAGE_KEY_USER);
            resolve(null);
          } else {
            try {
              // Refresh token silently
              const freshToken = await fbUser.getIdToken(false);
              const profile = await buildProfileFromFirebaseUser(fbUser);
              saveStoredUser(profile, freshToken);
              resolve(profile);
            } catch {
              resolve(loadStoredUser());
            }
          }
        });
      });
    }

    // Demo / Flask token — return cached profile
    return loadStoredUser();
  },

  /** Sign out from all providers and clear storage. */
  async logout(): Promise<void> {
    try {
      if (FIREBASE_ENABLED && firebaseAuth) {
        await signOut(firebaseAuth);
      }
    } catch { /* ignore */ }
    localStorage.removeItem(STORAGE_KEY_TOKEN);
    localStorage.removeItem(STORAGE_KEY_USER);
    localStorage.removeItem(STORAGE_KEY_LIVE);
  },

  /** Whether the user is currently authenticated (synchronous check). */
  isAuthenticated(): boolean {
    return !!localStorage.getItem(STORAGE_KEY_TOKEN);
  },

  /** Return current role from stored profile. */
  getCurrentRole(): UserRole | null {
    const user = loadStoredUser();
    return user?.role ?? null;
  },

  /** Subscribe to Firebase Auth state changes (no-op if Firebase not configured). */
  onAuthStateChanged(callback: (user: UserProfile | null) => void): () => void {
    if (!FIREBASE_ENABLED || !firebaseAuth) {
      // Immediately call with stored user then do nothing
      callback(loadStoredUser());
      return () => {};
    }
    const unsub = onAuthStateChanged(firebaseAuth, async (fbUser) => {
      if (!fbUser) {
        callback(null);
      } else {
        const profile = await buildProfileFromFirebaseUser(fbUser).catch(() => null);
        callback(profile);
      }
    });
    return unsub;
  }
};
