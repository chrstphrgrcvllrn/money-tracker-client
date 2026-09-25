import { create } from "zustand";
import type { AuthResponse, User } from "@/types/auth.type";

export type AuthStatus = "loading" | "authenticated" | "guest";

type AuthState = {
  user: User | null;
  // Kept in memory only: never written to localStorage/sessionStorage. A page
  // reload gets a fresh one from the httpOnly refresh cookie.
  accessToken: string | null;
  status: AuthStatus;
  // True when the user chose to sign out (as opposed to a session that simply
  // expired or never existed). ProtectedRoute uses it to decide whether to
  // remember the page for "return here after login".
  loggedOut: boolean;
  setAuth: (session: AuthResponse) => void;
  clearAuth: (options?: { loggedOut?: boolean }) => void;
};

export const useAuthStore = create<AuthState>()((set) => ({
  user: null,
  accessToken: null,
  status: "loading",
  loggedOut: false,
  setAuth: ({ accessToken, user }) =>
    set({ accessToken, user, status: "authenticated", loggedOut: false }),
  clearAuth: (options) =>
    set({ accessToken: null, user: null, status: "guest", loggedOut: options?.loggedOut ?? false }),
}));
