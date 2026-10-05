import { useState } from "react";
import CalculatorModal from "@/components/CalculatorModal";

// The Calculator is the only quick action left as a modal; Calendar and Water
// are full pages now (see navConfig). Shared by BottomNavBar and SidebarNav.
export function useQuickActionModals() {
  const [calculatorOpen, setCalculatorOpen] = useState(false);

  const modals = (
    <CalculatorModal open={calculatorOpen} onClose={() => setCalculatorOpen(false)} />
  );

  return {
    openCalculator: () => setCalculatorOpen(true),
    modals,
  };
}
