import BottomNavBar from "@/layout/BottomNavBar";
import { Outlet } from "react-router-dom";

export default function AppLayout() {
  return (
    <div className="flex">
      <BottomNavBar />
      <main className="flex-1 bg-black p-0 h-[90vh] overflow-y-auto">
           <Outlet />
      </main>
    </div>
  );
}