import { Navigate, Outlet, useLocation } from "react-router-dom";
import AuthSplash from "@/components/AuthSplash";
import { useAuthStore } from "@/stores/auth.store";

type FromState = { from?: { pathname: string; search?: string } } | null;

// /login and /register: already signed in -> go where they were headed (or home).
export default function PublicOnlyRoute() {
  const status = useAuthStore((s) => s.status);
  const location = useLocation();

  if (status === "loading") return <AuthSplash />;

  if (status === "authenticated") {
    const from = (location.state as FromState)?.from;
    return <Navigate to={from ? `${from.pathname}${from.search ?? ""}` : "/"} replace />;
  }

  return <Outlet />;
}
