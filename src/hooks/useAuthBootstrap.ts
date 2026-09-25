import { useEffect } from "react";
import { refreshSession } from "@/api/client";
import { useAuthStore } from "@/stores/auth.store";

// The old client-side password screen stored this flag; it no longer means anything.
const LEGACY_GATE_KEY = "moneyTrackerAccessGranted";

// On app start, ask the server for a session using the refresh cookie.
export function useAuthBootstrap() {
  useEffect(() => {
    try {
      localStorage.removeItem(LEGACY_GATE_KEY);
    } catch {
      // storage unavailable
    }

    let active = true;

    // refreshSession() shares one in-flight request, so React StrictMode's
    // double effect run in development makes a single network call.
    refreshSession()
      .then((session) => {
        if (active) useAuthStore.getState().setAuth(session);
      })
      .catch(() => {
        if (active) useAuthStore.getState().clearAuth();
      });

    return () => {
      active = false;
    };
  }, []);
}
