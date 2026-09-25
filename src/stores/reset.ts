import { useAuthStore } from "@/stores/auth.store";

// Everything that must be wiped when a session ends (logout, failed refresh,
// switching account). Add any future domain store's reset here so the next
// person to log in on this browser can never see the previous user's data.
export const resetAllStores = (options?: { loggedOut?: boolean }) => {
  useAuthStore.getState().clearAuth(options);
};
