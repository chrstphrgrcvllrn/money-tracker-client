import SidebarNav from "@/layout/SidebarNav";
import BottomNavBar from "@/layout/BottomNavBar";
import { Outlet } from "react-router-dom";

export default function AppLayout() {
  return (
    <div className="flex">
      {/* Desktop (md+): a persistent left column. Hidden below md. */}
      <SidebarNav />

      {/* Mobile: the bottom nav is fixed and measures ~113px tall (2 rows of
          icon+label), not the 10% of viewport height the old 90svh guess assumed —
          that gap let the nav overlap the bottom of page content. calc() ties this
          to the nav's real height instead of a viewport-height approximation.
          Desktop: there's no bottom nav (replaced by the sidebar), so main just
          fills the screen. */}
      <main className="flex-1 min-w-0 h-[calc(100svh-113px)] md:h-screen overflow-y-auto bg-[var(--bg-page)]">
           <Outlet />
      </main>

      {/* Mobile only: fixed to the bottom, hidden at md+. */}
      <BottomNavBar />
    </div>
  );
}
