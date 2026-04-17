import { Routes, Route, Navigate } from "react-router-dom";
import AppLayout from "@/layout/AppLayout";
// import Dashboard from "@/pages/Dashboard"
import SalaryPage from "@/pages/SalaryPage";
import LoansPage from "@/pages/LoanPage";
import BillsPage from "@/pages/BillsPage";
import NotesPage from "@/pages/NotesPage";
import SavingsPage from "@/pages/SavingsPage";
import ExpensesPage from "@/pages/ExpensesPage";
import Calculator from "@/pages/Calculator"
import CalendarPage from "@/pages/CalendarPage"
import ThoughtsPage from "@/pages/ThoughtsPage"
import WatchlistPage from "@/pages/WatchlistPage"
// import PatientDetails from "@/pages/Patients/PatientDetails";
// import AppointmentsList from "@/pages/Appointments/AppointmentsList"


export default function AppRoutes() {
  return (
    <Routes>
      <Route element={<AppLayout />}>
        {/* <Route path="/" element={<Dashboard />} /> */}
        <Route path="/" element={<Navigate to="/loans" replace />} />
        <Route path="loans" element={<LoansPage />} />
        <Route path="salary" element={<SalaryPage/>} />
        <Route path="bills" element={<BillsPage/>} />
        <Route path="notes" element={<NotesPage/>} />
        <Route path="savings" element={<SavingsPage/>} />
        <Route path="expenses" element={<ExpensesPage/>} />
        <Route path="calculator" element={<Calculator/>} />
        <Route path="calendar" element={<CalendarPage/>} />
        <Route path="thoughts" element={<ThoughtsPage/>} />
        <Route path="watchlist" element={<WatchlistPage/>} />
        
        {/* <Route path="patients/:id" element={<PatientDetails />} /> */}
        {/* <Route path="appointments" element={<AppointmentsList />} /> */}
        {/* <Route path="patients/:id" element={<PatientDetails />} /> */}
      </Route>
    </Routes>
  );
}