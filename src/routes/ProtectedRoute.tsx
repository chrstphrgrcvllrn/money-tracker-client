import { Navigate, Outlet, useLocation } from "react-router-dom";
import AuthSplash from "@/components/AuthSplash";
import { useAuthStore } from "@/stores/auth.store";

// Everything except /login and /register lives behind this.
export default function ProtectedRoute() {
  const status = useAuthStore((s) => s.status);
  const userId = useAuthStore((s) => s.user?.id);
  const loggedOut = useAuthStore((s) => s.loggedOut);
  const location = useLocation();

  if (status === "loading") return <AuthSplash />;

  if (status === "guest") {
    // Remember where they were headed so login can send them back, unless
    // they just chose to sign out.
    return <Navigate to="/login" replace state={loggedOut ? null : { from: location }} />;
  }

  // Keyed by user: if the signed-in user ever changes, the whole tree below
  // is thrown away and rebuilt, so no page state can carry over to the next user.
  return <Outlet key={userId} />;
}
