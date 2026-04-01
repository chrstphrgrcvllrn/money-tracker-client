import { useEffect, useState } from "react";
import {
  BanknotesIcon,
  BuildingLibraryIcon,
  ReceiptPercentIcon,
} from "@heroicons/react/24/outline";
import type { Loan } from "../types/loans.type";
import type { Savings } from "../types/savings.type";
import type { Expense } from "../types/expenses.type";

import { getLoans } from "../api/loan";
import { getSavings } from "../api/savings";
import { fetchExpenses } from "../api/expenses";

const Dashboard = () => {
  const [loans, setLoans] = useState<Loan[]>([]);
  const [savings, setSavings] = useState<Savings[]>([]);
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [loanData, savingsData, expenseData] = await Promise.all([
          getLoans(),
          getSavings(),
          fetchExpenses(),
        ]);
        setLoans(loanData || []);
        setSavings(Array.isArray(savingsData) ? savingsData : [savingsData]);
        setExpenses(expenseData || []);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  if (loading) {
    return <div className="p-4 text-center text-white">Loading...</div>;
  }

  // ================= TIME-BASED GREETING =================
  const now = new Date();
  let greeting = "Good morning";
  const hour = now.getHours();
  if (hour >= 12 && hour < 18) greeting = "Good afternoon";
  else if (hour >= 18 || hour < 5) greeting = "Good evening";

  // ================= LOANS =================
  const totalLoanRemaining = loans.reduce((sum, loan) => {
    const remaining = (loan.transactions ?? []).reduce((rem, t) => {
      if (t.amount < 0) return rem - Math.abs(t.amount);
      return rem + t.amount;
    }, loan.initialAmount || 0);
    return sum + remaining;
  }, 0);

  // ================= SAVINGS =================
  const totalSavingsInitial = savings.reduce((sum, item) => sum + (item.initialAmount || 0), 0);
  const totalSavingsDeposits = savings.reduce(
    (sum, item) =>
      sum +
      (item.transactions ?? []).reduce((s, t) => s + (t.amount > 0 ? Number(t.amount) : 0), 0),
    0
  );
  const totalSavingsWithdrawals = savings.reduce(
    (sum, item) =>
      sum +
      (item.transactions ?? []).reduce((s, t) => s + (t.amount < 0 ? Math.abs(Number(t.amount)) : 0), 0),
    0
  );
  const totalSavingsBalance = totalSavingsInitial + totalSavingsDeposits - totalSavingsWithdrawals;

  // ================= EXPENSES =================
  const totalExpenses = expenses.reduce((sum, expense) => sum + (expense.amount || 0), 0);

  const isThisWeek = (date: Date) => {
    const start = new Date(now);
    start.setDate(now.getDate() - now.getDay());
    start.setHours(0, 0, 0, 0);
    const end = new Date(start);
    end.setDate(start.getDate() + 7);
    return date >= start && date < end;
  };
  const isThisMonth = (date: Date) => date.getMonth() === now.getMonth() && date.getFullYear() === now.getFullYear();
  const isThisYear = (date: Date) => date.getFullYear() === now.getFullYear();

  const weeklyExpenses = expenses.reduce((sum, expense) => {
    if (!expense.createdAt) return sum;
    const date = new Date(expense.createdAt);
    return isThisWeek(date) ? sum + expense.amount : sum;
  }, 0);

  const monthlyExpenses = expenses.reduce((sum, expense) => {
    if (!expense.createdAt) return sum;
    const date = new Date(expense.createdAt);
    return isThisMonth(date) ? sum + expense.amount : sum;
  }, 0);

  const yearlyExpenses = expenses.reduce((sum, expense) => {
    if (!expense.createdAt) return sum;
    const date = new Date(expense.createdAt);
    return isThisYear(date) ? sum + expense.amount : sum;
  }, 0);

  return (
    <div className="bg-[#111111] min-h-screen flex justify-center items-start py-6">
      {/* iPhone-like container */}
      <div className="bg-[#1c1c1c] w-[375px] rounded-3xl shadow-2xl overflow-hidden flex flex-col space-y-4 p-4">
        {/* GREETING */}
        <div className="bg-gradient-to-r from-[#01E777]/50 via-[#01E777]/30 to-[#01E777]/50 rounded-xl p-4 shadow-md">
          <h2 className="text-xl font-semibold text-white">Hi Moks, {greeting}</h2>
          <p className="text-gray-200 text-sm mt-1">Your financial overview today</p>
        </div>

        {/* CARDS */}
        <div className="space-y-3">
          {/* LOANS */}
          <div className="bg-[#2a2a2a] rounded-2xl p-4 flex items-center shadow hover:shadow-[#01E777]/50 transition-shadow duration-300">
            <BanknotesIcon className="w-8 h-8 text-[#01E777]" />
            <div className="ml-3">
              <p className="text-[#01E777] text-sm">Loans</p>
              <p className="text-[1.75rem] font-bold text-white">{totalLoanRemaining.toLocaleString()}</p>
            </div>
          </div>

          {/* SAVINGS */}
          <div className="bg-[#2a2a2a] rounded-2xl p-4 flex items-center shadow hover:shadow-[#01E777]/50 transition-shadow duration-300">
            <BuildingLibraryIcon className="w-8 h-8 text-[#01E777]" />
            <div className="ml-3">
              <p className="text-[#01E777] text-sm">Savings</p>
              <p className="text-[1.75rem] font-bold text-white">{totalSavingsBalance.toLocaleString()}</p>
            </div>
          </div>

          {/* EXPENSES */}
          <div className="bg-[#2a2a2a] rounded-2xl p-4 shadow hover:shadow-[#01E777]/50 transition-shadow duration-300">
            <div className="flex items-center mb-2">
              <ReceiptPercentIcon className="w-8 h-8 text-[#01E777]" />
              <p className="ml-3 text-[#01E777] font-semibold">Expenses</p>
            </div>
            <p className="text-[1.75rem] font-bold text-white">{totalExpenses.toLocaleString()}</p>

            <div className="flex justify-between text-sm mt-2">
              <div>
                <p className="text-[#01E777]">Week</p>
                <p className="text-white">{weeklyExpenses.toLocaleString()}</p>
              </div>
              <div>
                <p className="text-[#01E777]">Month</p>
                <p className="text-white">{monthlyExpenses.toLocaleString()}</p>
              </div>
              <div>
                <p className="text-[#01E777]">Year</p>
                <p className="text-white">{yearlyExpenses.toLocaleString()}</p>
              </div>
            </div>
          </div>
        </div>

        {/* BOTTOM SAFE SPACE */}
        <div className="h-6" />
      </div>
    </div>
  );
};

export default Dashboard;