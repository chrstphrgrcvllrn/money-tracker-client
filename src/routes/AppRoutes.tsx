import { Routes, Route, Navigate } from "react-router-dom";
import AppLayout from "@/layout/AppLayout";
import ProtectedRoute from "@/routes/ProtectedRoute";
import PublicOnlyRoute from "@/routes/PublicOnlyRoute";
import LoginPage from "@/pages/LoginPage";
import RegisterPage from "@/pages/RegisterPage";
import AccountPage from "@/pages/AccountPage";
import SalaryPage from "@/pages/SalaryPage";
import LoansPage from "@/pages/LoanPage";
import BillsPage from "@/pages/BillsPage";
import NotesPage from "@/pages/NotesPage";
import SavingsPage from "@/pages/SavingsPage";
import ExpensesPage from "@/pages/ExpensesPage";
import HouseExpensesPage from "@/pages/HouseExpensesPage"
import ThoughtsPage from "@/pages/ThoughtsPage"
import SubscriptionPage from "@/pages/SubscriptionPage";
import NotebookPage from "@/pages/NotebookPage";
import TrackerPage from "@/pages/TrackerPage";


export default function AppRoutes() {
  return (
    <Routes>
      {/* Signed-out only: signed-in visitors are sent into the app */}
      <Route element={<PublicOnlyRoute />}>
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
      </Route>

      {/* Everything else needs a session */}
      <Route element={<ProtectedRoute />}>
        <Route element={<AppLayout />}>
          <Route path="/" element={<Navigate to="/loans" replace />} />
          <Route path="loans" element={<LoansPage />} />
          <Route path="salary" element={<SalaryPage/>} />
          <Route path="bills" element={<BillsPage/>} />
          <Route path="notes" element={<NotesPage/>} />
          <Route path="savings" element={<SavingsPage/>} />
          <Route path="expenses" element={<ExpensesPage/>} />
          <Route path="/house-expenses" element={<HouseExpensesPage />} />
          <Route path="thoughts" element={<ThoughtsPage/>} />
          <Route path="subscription" element={<SubscriptionPage/>} />
          <Route path="notebook" element={<NotebookPage />} />
          <Route path="tracker" element={<TrackerPage />} />
          <Route path="account" element={<AccountPage />} />
        </Route>
      </Route>

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
