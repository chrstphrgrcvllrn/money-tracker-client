import { useEffect, useState } from "react";
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

  // ================= DATE HELPERS =================
  const now = new Date();

  const isThisWeek = (date: Date) => {
    const start = new Date(now);
    start.setDate(now.getDate() - now.getDay());
    start.setHours(0, 0, 0, 0);

    const end = new Date(start);
    end.setDate(start.getDate() + 7);

    return date >= start && date < end;
  };

  const isThisMonth = (date: Date) =>
    date.getMonth() === now.getMonth() &&
    date.getFullYear() === now.getFullYear();

  const isThisYear = (date: Date) =>
    date.getFullYear() === now.getFullYear();

  // ================= LOANS =================
  const totalLoanRemaining = loans.reduce((sum, loan) => {
    const remaining = (loan.transactions ?? []).reduce((rem, t) => {
      if (t.amount < 0) {
        // repayment → subtract absolute value
        return rem - Math.abs(t.amount);
      } else {
        // positive amount → add to remaining
        return rem + t.amount;
      }
    }, loan.initialAmount || 0);
    return sum + remaining;
  }, 0);

  // ================= SAVINGS =================
  const totalSavingsInitial = savings.reduce(
    (sum, item) => sum + (item.initialAmount || 0),
    0
  );

  const totalSavingsDeposits = savings.reduce((sum, item) => {
    const deposits = (item.transactions ?? []).reduce(
      (s, t) => s + (t.amount > 0 ? Number(t.amount) : 0),
      0
    );
    return sum + deposits;
  }, 0);

  const totalSavingsWithdrawals = savings.reduce((sum, item) => {
    const withdrawals = (item.transactions ?? []).reduce(
      (s, t) => s + (t.amount < 0 ? Math.abs(Number(t.amount)) : 0),
      0
    );
    return sum + withdrawals;
  }, 0);

  const totalSavingsBalance =
    totalSavingsInitial +
    totalSavingsDeposits -
    totalSavingsWithdrawals;

  // ================= EXPENSES =================
  const totalExpenses = expenses.reduce(
    (sum, expense) => sum + (expense.amount || 0),
    0
  );

  // ================= TIME FILTERED =================
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
    <div className="p-4 max-w-md mx-auto font-sans text-gray-800 bg-[#111111] min-h-screen space-y-4">
      <h1 className="text-lg font-semibold text-white mb-2">Dashboard</h1>

      {/* LOANS */}
      <div className="bg-[#1d1d1d] rounded-xl p-4 space-y-2">
        <p className="text-[#01E777] text-sm">Loans</p>
        <p className="text-[2rem] font-bold text-white">
          {totalLoanRemaining.toLocaleString()}
        </p>
      </div>

      {/* SAVINGS */}
      <div className="bg-[#1d1d1d] rounded-xl p-4 space-y-2">
        <p className="text-[#01E777] text-sm">Savings</p>
        <p className="text-[2rem] font-bold text-white">
          {totalSavingsBalance.toLocaleString()}
        </p>
      </div>

      {/* EXPENSES */}
      <div className="bg-[#1d1d1d] rounded-xl p-4 space-y-2">
        <p className="text-[#01E777] text-sm">Expenses</p>

        <p className="text-[2rem] font-bold text-white">
          {totalExpenses.toLocaleString()}
        </p>

        <div className="flex justify-between text-sm">
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
  );
};

export default Dashboard;