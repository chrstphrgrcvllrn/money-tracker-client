import { BrowserRouter } from "react-router-dom";
import AppRoutes from "@/routes/AppRoutes";
import { ToastProvider } from "@/components/ToastProvider";
import { ThemeProvider } from "@/components/ThemeProvider";
import { AmountsVisibilityProvider } from "@/components/AmountsVisibilityProvider";
import { useAuthBootstrap } from "@/hooks/useAuthBootstrap";

function AppContent() {
  useAuthBootstrap();
  return <AppRoutes />;
}

export default function App() {
  return (
    <ThemeProvider>
      <AmountsVisibilityProvider>
        <ToastProvider>
          <BrowserRouter>
            <AppContent />
          </BrowserRouter>
        </ToastProvider>
      </AmountsVisibilityProvider>
    </ThemeProvider>
  );
}
