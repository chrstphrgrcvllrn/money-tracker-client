import BottomNavBar from "@/layout/BottomNavBar";
import { Outlet } from "react-router-dom";

export default function AppLayout() {
  return (
    <div className="flex">
      <BottomNavBar />
      <main className="flex-1 bg-[#111111] p-0 h-[90svh] overflow-y-auto">
           <Outlet />
      </main>
    </div>
  );
}