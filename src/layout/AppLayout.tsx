import BottomNavBar from "@/layout/BottomNavBar";
import { Outlet } from "react-router-dom";

export default function AppLayout() {
  return (
    <div className="flex">
      <BottomNavBar />
      {/* The bottom nav is fixed and measures ~113px tall (2 rows of icon+label),
          not the 10% of viewport height the old 90svh guess assumed — that gap
          let the nav overlap the bottom of page content. calc() ties this to
          the nav's real height instead of a viewport-height approximation. */}
      <main className="flex-1 p-0 h-[calc(100svh-113px)] overflow-y-auto bg-[var(--bg-page)]">
           <Outlet />
      </main>
    </div>
  );
}