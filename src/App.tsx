import { BrowserRouter } from "react-router-dom";
import AppRoutes from "@/routes/AppRoutes";
import { ToastProvider } from "@/components/ToastProvider";
import { PasswordGate } from "@/components/PasswordGate";
// import FloatingCalculatorButton from '@/layout/FloatingCalculatorButton'

export default function App() {
  return (
    <PasswordGate>
      <ToastProvider>
        <BrowserRouter>
        {/* <FloatingCalculatorButton/> */}
          <AppRoutes />
        </BrowserRouter>
      </ToastProvider>
    </PasswordGate>
  );
}
