import { Routes, Route } from "react-router-dom";
import AppLayout from "@/layout/AppLayout";
import Dashboard from "@/pages/Dashboard"
import SalaryPage from "@/pages/SalaryPage";
import LoansPage from "@/pages/LoanPage";
import BillsPage from "@/pages/BillsPage";
import NotesPage from "@/pages/NotesPage";
import SavingsPage from "@/pages/SavingsPage";
import ExpensesPage from "@/pages/ExpensesPage";
import Calculator from "@/pages/Calculator"
// import PatientDetails from "@/pages/Patients/PatientDetails";
// import AppointmentsList from "@/pages/Appointments/AppointmentsList"


export default function AppRoutes() {
  return (
    <Routes>
      <Route element={<AppLayout />}>
        <Route path="/" element={<Dashboard />} />
        <Route path="loans" element={<LoansPage />} />
        <Route path="salary" element={<SalaryPage/>} />
        <Route path="bills" element={<BillsPage/>} />
        <Route path="notes" element={<NotesPage/>} />
        <Route path="savings" element={<SavingsPage/>} />
        <Route path="expenses" element={<ExpensesPage/>} />
        <Route path="calculator" element={<Calculator/>} />
        
        {/* <Route path="patients/:id" element={<PatientDetails />} /> */}
        {/* <Route path="appointments" element={<AppointmentsList />} /> */}
        {/* <Route path="patients/:id" element={<PatientDetails />} /> */}
      </Route>
    </Routes>
  );
}