import BottomNavBar from "@/layout/BottomNavBar";
import { Outlet } from "react-router-dom";
import { useTheme } from "@/components/useTheme";

export default function AppLayout() {
  const { theme } = useTheme();

  return (
    <div className="flex">
      <BottomNavBar />
      <main
        className={`flex-1 p-0 h-[90svh] overflow-y-auto ${
          theme === "light" ? "bg-[#FAF7F1]" : "bg-[#000000]"
        }`}
      >
           <Outlet />
      </main>
    </div>
  );
}