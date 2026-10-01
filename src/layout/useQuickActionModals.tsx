import { useState } from "react";
import CalculatorModal from "@/components/CalculatorModal";
import CalendarModal from "@/components/CalendarModal";
import WaterModal from "@/components/WaterModal";

// The Calculator/Calendar/Water modals are opened from both BottomNavBar and
// SidebarNav. This hook holds the open/close state and the modal elements
// once so neither nav has to repeat it (each still gets its own instance —
// harmless, since only one nav is ever visible at a time).
export function useQuickActionModals() {
  const [calculatorOpen, setCalculatorOpen] = useState(false);
  const [calendarOpen, setCalendarOpen] = useState(false);
  const [waterOpen, setWaterOpen] = useState(false);

  const modals = (
    <>
      <CalculatorModal open={calculatorOpen} onClose={() => setCalculatorOpen(false)} />
      <CalendarModal open={calendarOpen} onClose={() => setCalendarOpen(false)} />
      <WaterModal open={waterOpen} onClose={() => setWaterOpen(false)} />
    </>
  );

  return {
    openCalculator: () => setCalculatorOpen(true),
    openCalendar: () => setCalendarOpen(true),
    openWater: () => setWaterOpen(true),
    modals,
  };
}
