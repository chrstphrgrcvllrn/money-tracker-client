import axios, { type InternalAxiosRequestConfig } from "axios";
import { env } from "@/config/env";
import { useAuthStore } from "@/stores/auth.store";
import type { AuthResponse } from "@/types/auth.type";

// Auth endpoints: no interceptors (a 401 from /login must not trigger a
// refresh), cookies included, and the header the server requires on
// cookie-only endpoints (CSRF defence).
export const authHttp = axios.create({
  baseURL: env.apiBaseUrl,
  withCredentials: true,
  headers: { "X-Requested-With": "XMLHttpRequest" },
});

// Everything else. This file is the only place that attaches the access token
// and handles 401 -> refresh -> retry.
export const api = axios.create({
  baseURL: env.apiBaseUrl,
  withCredentials: true,
});

// One refresh at a time: every request that hits a 401 while a refresh is in
// flight waits on the same promise instead of starting its own.
let refreshInFlight: Promise<AuthResponse> | null = null;

export const refreshSession = (): Promise<AuthResponse> => {
  if (!refreshInFlight) {
    refreshInFlight = authHttp
      .post<AuthResponse>("/auth/refresh")
      .then((res) => res.data)
      .finally(() => {
        refreshInFlight = null;
      });
  }
  return refreshInFlight;
};

type RetryableConfig = InternalAxiosRequestConfig & { _retried?: boolean };

api.interceptors.request.use((config) => {
  const token = useAuthStore.getState().accessToken;
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const original: RetryableConfig | undefined = error.config;

    if (error.response?.status !== 401 || !original || original._retried) {
      return Promise.reject(error);
    }
    original._retried = true;

    try {
      const session = await refreshSession();
      useAuthStore.getState().setAuth(session);
      original.headers.Authorization = `Bearer ${session.accessToken}`;
      return api(original);
    } catch {
      // Refresh failed: the session is over. Flipping status to "guest" makes
      // ProtectedRoute unmount the app and send the user to /login.
      useAuthStore.getState().clearAuth();
      return Promise.reject(error);
    }
  }
);
