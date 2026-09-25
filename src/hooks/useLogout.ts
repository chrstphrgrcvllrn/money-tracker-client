import { useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { logout } from "@/api/auth";
import { useToast } from "@/components/useToast";
import { resetAllStores } from "@/stores/reset";

export function useLogout() {
  const navigate = useNavigate();
  const showToast = useToast();

  return useCallback(async () => {
    try {
      await logout(); // clears the refresh cookie on the server
    } catch {
      // Even if the request fails (offline), end the session locally.
    } finally {
      // Wipe in-memory auth and every store. ProtectedRoute then unmounts all
      // pages (dropping any user data they held) and sends us to /login;
      // loggedOut stops it remembering this page, so the next person to sign in
      // on this browser isn't dropped onto the previous user's last screen.
      resetAllStores({ loggedOut: true });
      navigate("/login", { replace: true });
      showToast("Signed out", "success");
    }
  }, [navigate, showToast]);
}
