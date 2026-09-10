import { useState } from "react";
import { AmountsVisibilityContext } from "./AmountsVisibilityContext";

const STORAGE_KEY = "moneyTrackerShowAmounts";

// Defaults to visible (true) the very first time the app is opened, but
// once the user hides amounts anywhere (Loans, Savings, Buy List), that
// choice persists across reloads and pages instead of resetting to
// visible every time.
const getInitialShowAmounts = (): boolean => {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored === "true" || stored === "false") return stored === "true";
  } catch {
    // ignore storage errors, fall back to default below
  }
  return true;
};

export function AmountsVisibilityProvider({ children }: { children: React.ReactNode }) {
  const [showAmounts, setShowAmounts] = useState<boolean>(getInitialShowAmounts);

  const toggleShowAmounts = () => {
    setShowAmounts((prev) => {
      const next = !prev;
      try {
        localStorage.setItem(STORAGE_KEY, String(next));
      } catch {
        // ignore storage errors — visibility still toggles for this session
      }
      return next;
    });
  };

  return (
    <AmountsVisibilityContext.Provider value={{ showAmounts, toggleShowAmounts }}>
      {children}
    </AmountsVisibilityContext.Provider>
  );
}
