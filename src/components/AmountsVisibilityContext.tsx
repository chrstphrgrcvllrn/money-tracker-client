import { createContext } from "react";

export interface AmountsVisibilityContextType {
  showAmounts: boolean;
  toggleShowAmounts: () => void;
}

export const AmountsVisibilityContext = createContext<AmountsVisibilityContextType | undefined>(
  undefined
);
