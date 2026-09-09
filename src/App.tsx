import { BrowserRouter } from "react-router-dom";
import AppRoutes from "@/routes/AppRoutes";
import { ToastProvider } from "@/components/ToastProvider";
import { PasswordGate } from "@/components/PasswordGate";
import { ThemeProvider } from "@/components/ThemeProvider";
// import FloatingCalculatorButton from '@/layout/FloatingCalculatorButton'

export default function App() {
  return (
    <ThemeProvider>
      <PasswordGate>
        <ToastProvider>
          <BrowserRouter>
          {/* <FloatingCalculatorButton/> */}
            <AppRoutes />
          </BrowserRouter>
        </ToastProvider>
      </PasswordGate>
    </ThemeProvider>
  );
}
