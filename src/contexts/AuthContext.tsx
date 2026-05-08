/**
 * AuthContext.tsx — OmniSocial Authentication Layer
 *
 * Provides:
 *  - AuthProvider: wraps the app, restores session from localStorage on mount
 *  - useAuth: hook exposing user, token, login, logout, updateUser
 *
 * JWT is stored in localStorage under the key "omni_token".
 * The decoded payload is stored as the `user` object in context so
 * downstream consumers never need to decode it themselves.
 *
 * Compatible with Capacitor (localStorage works on iOS/Android).
 */

import {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
  type ReactNode,
} from "react";
import { api } from "../lib/api";

// ─── Types ─────────────────────────────────────────────────────────────────────

export interface AuthUser {
  id: string;
  username: string;
  displayName: string;
  avatar?: string;
  email: string;
  isVerified?: boolean;
}

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface RegisterCredentials {
  email: string;
  password: string;
  username: string;
  displayName: string;
}

export interface AuthContextValue {
  user: AuthUser | null;
  token: string | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (credentials: LoginCredentials) => Promise<void>;
  register: (credentials: RegisterCredentials) => Promise<void>;
  logout: () => void;
  updateUser: (patch: Partial<AuthUser>) => void;
}

// ─── Constants ─────────────────────────────────────────────────────────────────

const TOKEN_KEY = "omni_token";
const USER_KEY  = "omni_user";

// ─── Helpers ───────────────────────────────────────────────────────────────────

function persistSession(token: string, user: AuthUser) {
  localStorage.setItem(TOKEN_KEY, token);
  localStorage.setItem(USER_KEY, JSON.stringify(user));
}

function clearSession() {
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(USER_KEY);
}

function loadSession(): { token: string; user: AuthUser } | null {
  const token = localStorage.getItem(TOKEN_KEY);
  const raw   = localStorage.getItem(USER_KEY);
  if (!token || !raw) return null;
  try {
    return { token, user: JSON.parse(raw) as AuthUser };
  } catch {
    return null;
  }
}

// ─── Context ───────────────────────────────────────────────────────────────────

const AuthContext = createContext<AuthContextValue | null>(null);

// ─── Provider ──────────────────────────────────────────────────────────────────

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user,      setUser]      = useState<AuthUser | null>(null);
  const [token,     setToken]     = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true); // true until session restore completes

  // ── Restore session on mount ──────────────────────────────────────────────
  useEffect(() => {
    const session = loadSession();
    if (session) {
      setToken(session.token);
      setUser(session.user);
      // Silently refresh profile from server in background
      api.get<AuthUser>("/auth/me")
        .then(({ data }) => {
          setUser(data);
          persistSession(session.token, data);
        })
        .catch(() => {
          // Token expired or invalid — clear session
          clearSession();
          setToken(null);
          setUser(null);
        })
        .finally(() => setIsLoading(false));
    } else {
      setIsLoading(false);
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // ── Login ─────────────────────────────────────────────────────────────────
  const login = useCallback(async (credentials: LoginCredentials) => {
    const { data } = await api.post<{ token: string; user: AuthUser }>(
      "/auth/login",
      credentials
    );
    persistSession(data.token, data.user);
    setToken(data.token);
    setUser(data.user);
  }, []);

  // ── Register ──────────────────────────────────────────────────────────────
  const register = useCallback(async (credentials: RegisterCredentials) => {
    const { data } = await api.post<{ token: string; user: AuthUser }>(
      "/auth/register",
      credentials
    );
    persistSession(data.token, data.user);
    setToken(data.token);
    setUser(data.user);
  }, []);

  // ── Logout ────────────────────────────────────────────────────────────────
  const logout = useCallback(() => {
    clearSession();
    setToken(null);
    setUser(null);
    // Best-effort server-side session invalidation
    api.post("/auth/logout").catch(() => {});
  }, []);

  // ── Patch local user (e.g. after profile edit) ────────────────────────────
  const updateUser = useCallback((patch: Partial<AuthUser>) => {
    setUser((prev) => {
      if (!prev) return prev;
      const updated = { ...prev, ...patch };
      if (token) persistSession(token, updated);
      return updated;
    });
  }, [token]);

  // ─────────────────────────────────────────────────────────────────────────

  const value: AuthContextValue = {
    user,
    token,
    isLoading,
    isAuthenticated: !!user && !!token,
    login,
    register,
    logout,
    updateUser,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

// ─── Hook ──────────────────────────────────────────────────────────────────────

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within <AuthProvider>");
  return ctx;
}
