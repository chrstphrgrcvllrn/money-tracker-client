import { BrowserRouter } from "react-router-dom";
import AppRoutes from "@/routes/AppRoutes";
// import FloatingCalculatorButton from '@/layout/FloatingCalculatorButton'

export default function App() {
  return (
    <BrowserRouter>
    {/* <FloatingCalculatorButton/> */}
      <AppRoutes />
    </BrowserRouter>
  );
}
