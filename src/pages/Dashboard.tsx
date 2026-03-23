import { useEffect, useState } from "react";
import type { Loan } from "../types/loans.type";
import { getLoans } from "../api/loan";

const Dashboard = () => {
  const [loans, setLoans] = useState<Loan[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchLoans = async () => {
      try {
        const data = await getLoans();
        setLoans(data);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchLoans();
  }, []);

  if (loading) {
    return <div className="p-6 text-center">Loading...</div>;
  }

  const totalInitial = loans.reduce(
    (sum, loan) => sum + loan.initialAmount,
    0
  );

const totalPaid = loans.reduce(
  (sum, loan) =>
    sum +
    (loan.transactions?.reduce((s, t) => s + t.amount, 0) || 0),
  0
);

  const totalRemaining = totalInitial - totalPaid;

  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      <div className="grid grid-cols-1 sm:grid-cols-3">
        <div className="bg-white p-4 shadow rounded grid gap-2">
          <p className="text-gray-500">Loan</p>

          <p className="text-2xl font-semibold">
            {totalRemaining.toLocaleString()}
          </p>

          <div className="flex gap-10">
            <div>
              <p className="text-xs text-gray-500">Before</p>
              <p className="text-lg font-semibold">
                {totalInitial.toLocaleString()}
              </p>
            </div>

            <div>
              <p className="text-xs text-gray-500">Paid</p>
              <p className="text-lg font-semibold">
                {totalPaid.toLocaleString()}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;