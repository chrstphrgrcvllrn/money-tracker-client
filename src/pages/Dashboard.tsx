import { useEffect, useState } from "react";
import type { Loan } from "../types/loans.type";
import type { Savings } from "../types/savings.type";
import { getLoans } from "../api/loan";
import { getSavings } from "../api/savings";

const Dashboard = () => {
  const [loans, setLoans] = useState<Loan[]>([]);
  const [savings, setSavings] = useState<Savings[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [loanData, savingsData] = await Promise.all([
          getLoans(),
          getSavings(),
        ]);

        setLoans(loanData || []);
        setSavings(Array.isArray(savingsData) ? savingsData : [savingsData]);
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

  // ================= LOANS =================
  const totalLoanInitial = loans.reduce(
    (sum, loan) => sum + (loan.initialAmount || 0),
    0
  );

  const totalLoanPaid = loans.reduce(
    (sum, loan) =>
      sum +
      (loan.transactions?.reduce(
        (s, t) => s + (t.amount || 0),
        0
      ) || 0),
    0
  );

  const totalLoanRemaining = totalLoanInitial - totalLoanPaid;

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
      (s, t) =>
        s + (t.amount < 0 ? Math.abs(Number(t.amount)) : 0),
      0
    );
    return sum + withdrawals;
  }, 0);

  const totalSavingsBalance =
    totalSavingsInitial +
    totalSavingsDeposits -
    totalSavingsWithdrawals;

  return (
    <div className="p-4 max-w-md mx-auto font-sans text-gray-800 bg-[#111111] min-h-screen space-y-4">
      {/* HEADER */}
      <h1 className="text-lg font-semibold text-white mb-2">
        Dashboard
      </h1>

      {/* LOANS CARD */}
      <div className="bg-[#1d1d1d] rounded-xl p-4 space-y-2">
        <p className="text-[#01E777] text-sm">Loans</p>

        <p className="text-[2rem] font-bold text-white">
          {totalLoanRemaining.toLocaleString()}
        </p>

        <div className="flex justify-between">
          <div>
            <p className="text-xs text-[#01E777]">Total</p>
            <p className="text-white font-medium">
              {totalLoanInitial.toLocaleString()}
            </p>
          </div>

          <div>
            <p className="text-xs text-[#01E777]">Paid</p>
            <p className="text-white font-medium">
              {totalLoanPaid.toLocaleString()}
            </p>
          </div>
        </div>
      </div>

      {/* SAVINGS CARD */}
      <div className="bg-[#1d1d1d] rounded-xl p-4 space-y-2">
        <p className="text-[#01E777] text-sm">Savings</p>

        <p className="text-[2rem] font-bold text-[#01E777]">
          {totalSavingsBalance.toLocaleString()}
        </p>

        <div className="flex justify-between">
          <div>
            <p className="text-xs text-[#01E777]">Total</p>
            <p className="text-white font-medium">
              {totalSavingsInitial.toLocaleString()}
            </p>
          </div>

          <div>
            <p className="text-xs text-[#01E777]">Deposits</p>
            <p className="text-white font-medium">
              {totalSavingsDeposits.toLocaleString()}
            </p>
          </div>

          <div>
            <p className="text-xs text-[#01E777]">Withdrawals</p>
            <p className="text-white font-medium">
              {totalSavingsWithdrawals.toLocaleString()}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;