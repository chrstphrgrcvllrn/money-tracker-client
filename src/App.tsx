import { BrowserRouter } from "react-router-dom";
import AppRoutes from "@/routes/AppRoutes";
import { ToastProvider } from "@/components/ToastProvider";
import { PasswordGate } from "@/components/PasswordGate";
import { ThemeProvider } from "@/components/ThemeProvider";
import { AmountsVisibilityProvider } from "@/components/AmountsVisibilityProvider";
// import FloatingCalculatorButton from '@/layout/FloatingCalculatorButton'

export default function App() {
  return (
    <ThemeProvider>
      <PasswordGate>
        <AmountsVisibilityProvider>
          <ToastProvider>
            <BrowserRouter>
            {/* <FloatingCalculatorButton/> */}
              <AppRoutes />
            </BrowserRouter>
          </ToastProvider>
        </AmountsVisibilityProvider>
      </PasswordGate>
    </ThemeProvider>
  );
}
