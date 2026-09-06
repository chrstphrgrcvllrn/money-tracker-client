import { BrowserRouter } from "react-router-dom";
import AppRoutes from "@/routes/AppRoutes";
import { ToastProvider } from "@/components/ToastProvider";
// import FloatingCalculatorButton from '@/layout/FloatingCalculatorButton'

export default function App() {
  return (
    <ToastProvider>
      <BrowserRouter>
      {/* <FloatingCalculatorButton/> */}
        <AppRoutes />
      </BrowserRouter>
    </ToastProvider>
  );
}
