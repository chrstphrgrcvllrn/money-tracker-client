import BottomNavBar from "@/layout/BottomNavBar";
import { Outlet } from "react-router-dom";

export default function AppLayout() {
  return (
    <div className="flex">
      <BottomNavBar />
      <main className="flex-1 p-0 h-[90svh] overflow-y-auto bg-[var(--bg-page)]">
           <Outlet />
      </main>
    </div>
  );
}