import { useContext } from "react";
import { AmountsVisibilityContext } from "./AmountsVisibilityContext";

export function useAmountsVisibility() {
  const ctx = useContext(AmountsVisibilityContext);
  if (!ctx) {
    throw new Error("useAmountsVisibility must be used within an AmountsVisibilityProvider");
  }
  return ctx;
}
