import { SkeletonBlock } from "@/components/Skeleton";

// Full-page placeholder shown while the app asks the server whether the
// visitor is already signed in (refresh cookie), so protected pages never
// flash and login never redirects too early on a page reload.
export default function AuthSplash() {
  return (
    <div
      role="status"
      aria-busy="true"
      aria-label="Loading"
      className="min-h-screen flex flex-col items-center justify-center gap-4 px-6 bg-[var(--bg-page)]"
    >
      <SkeletonBlock className="h-6 w-40" />
      <SkeletonBlock className="h-3 w-56" />
      <span className="sr-only">Loading…</span>
    </div>
  );
}
