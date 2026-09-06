import { createContext } from "react";

export type Severity = "success" | "info" | "error";

export interface ToastContextType {
  showToast: (message: string, severity?: Severity) => void;
}

export const ToastContext = createContext<ToastContextType | undefined>(undefined);
