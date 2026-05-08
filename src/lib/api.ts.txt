/**
 * api.ts — OmniSocial Axios Instance
 *
 * - Base URL from VITE_API_URL env variable (falls back to localhost:3001)
 * - Request interceptor: attaches JWT from localStorage to every request
 * - Response interceptor: on 401, clears the stored token and redirects
 *   to "/" so AuthProvider can react to the cleared state on next render
 */

import axios, {
  type AxiosInstance,
  type InternalAxiosRequestConfig,
  type AxiosResponse,
  type AxiosError,
} from "axios";

// ─── Constants ─────────────────────────────────────────────────────────────────

const BASE_URL  = import.meta.env.VITE_API_URL ?? "http://localhost:3001";
const TOKEN_KEY = "omni_token"; // must match AuthContext

// ─── Instance ──────────────────────────────────────────────────────────────────

export const api: AxiosInstance = axios.create({
  baseURL: `${BASE_URL}/api`,
  timeout: 15_000,
  headers: {
    "Content-Type": "application/json",
  },
  withCredentials: true, // send cookies for refresh-token flows
});

// ─── Request interceptor — attach Bearer token ─────────────────────────────────

api.interceptors.request.use(
  (config: InternalAxiosRequestConfig): InternalAxiosRequestConfig => {
    const token = localStorage.getItem(TOKEN_KEY);
    if (token && config.headers) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error: AxiosError) => Promise.reject(error)
);

// ─── Response interceptor — handle 401 globally ────────────────────────────────

api.interceptors.response.use(
  (response: AxiosResponse) => response,
  (error: AxiosError) => {
    if (error.response?.status === 401) {
      // Token is invalid or expired — wipe session and kick to login
      localStorage.removeItem(TOKEN_KEY);
      localStorage.removeItem("omni_user");

      // Only redirect if we're not already on the auth page
      if (!window.location.pathname.startsWith("/auth")) {
        window.location.href = "/";
      }
    }
    return Promise.reject(error);
  }
);

// ─── Typed helpers (optional convenience wrappers) ─────────────────────────────

/** GET with automatic generic return type. */
export const get  = <T>(url: string, params?: Record<string, unknown>) =>
  api.get<T>(url, { params }).then((r) => r.data);

/** POST with automatic generic return type. */
export const post = <T>(url: string, body?: unknown) =>
  api.post<T>(url, body).then((r) => r.data);

/** PATCH with automatic generic return type. */
export const patch = <T>(url: string, body?: unknown) =>
  api.patch<T>(url, body).then((r) => r.data);

/** DELETE with automatic generic return type. */
export const del = <T>(url: string) =>
  api.delete<T>(url).then((r) => r.data);
