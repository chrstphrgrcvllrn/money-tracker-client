import { useEffect, useState } from "react";
import type { Loan } from "../types/loans.type";
import { getLoans, createLoan, addTransaction } from "../api/loan";

import {
  BanknotesIcon,
  EyeIcon,
  EyeSlashIcon,
} from "@heroicons/react/24/outline";

export default function LoanPage() {
  const [loans, setLoans] = useState<Loan[]>([]);
  const [expanded, setExpanded] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);

  const [showForm, setShowForm] = useState(false);
  const [newLoanName, setNewLoanName] = useState("");
  const [newLoanAmount, setNewLoanAmount] = useState("");

  const [paymentInputs, setPaymentInputs] = useState<{
    [key: number]: string;
  }>({});

  const [paymentDates, setPaymentDates] = useState<{
    [key: number]: string;
  }>({});

  // ✅ NEW: toggle visibility
  const [showAmounts, setShowAmounts] = useState(true);

  useEffect(() => {
    const fetchLoans = async () => {
      try {
        const data = await getLoans();

        const normalized = Array.isArray(data) ? data : [data];

        const withTransactions = normalized.map((loan) => ({
          ...loan,
          transactions: loan.transactions ?? [],
        }));

        setLoans(withTransactions);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchLoans();
  }, []);

  const toggleExpand = (index: number) => {
    setExpanded(expanded === index ? null : index);
  };

  const mask = (value: number) =>
    "*".repeat(value.toLocaleString().length);

  const handleAddLoan = async () => {
    if (!newLoanName || !newLoanAmount) return;

    const newLoan = {
      name: newLoanName,
      initialAmount: Number(newLoanAmount),
      transactions: [],
    };

    try {
      const saved = await createLoan(newLoan);
      setLoans((prev) => [...prev, saved]);

      setNewLoanName("");
      setNewLoanAmount("");
      setShowForm(false);
    } catch (err) {
      console.error(err);
    }
  };

  const handleAddPayment = async (loanId: string, index: number) => {
    const amount = paymentInputs[index];
    const date = paymentDates[index];

    if (!amount || !date) return;

    const transaction = {
      date: date,
      amount: Number(amount),
      type: "payment",
    };

    try {
      const updatedLoan = await addTransaction(loanId, transaction);

      setLoans((prev) =>
        prev.map((loan) =>
          loan._id === loanId ? updatedLoan : loan
        )
      );

      setPaymentInputs((prev) => ({ ...prev, [index]: "" }));
      setPaymentDates((prev) => ({ ...prev, [index]: "" }));
    } catch (err) {
      console.error(err);
    }
  };

  const totalInitial = loans.reduce(
    (sum, loan) => sum + loan.initialAmount,
    0
  );

  const totalPaid = loans.reduce(
    (sum, loan) =>
      sum +
      loan.transactions.reduce(
        (s, t) => s + (t.amount > 0 ? Number(t.amount) : 0),
        0
      ),
    0
  );

  const totalAdjustments = loans.reduce(
    (sum, loan) =>
      sum +
      loan.transactions.reduce(
        (s, t) => s + (t.amount < 0 ? Math.abs(Number(t.amount)) : 0),
        0
      ),
    0
  );

  const totalRemaining =
    totalInitial + totalAdjustments - totalPaid;

  if (loading) {
    return <div className="p-4 text-center">Loading...</div>;
  }

  return (
    <div className="px-6 pb-6 mt-8 max-w-md mx-auto font-sans text-gray-800 bg-[#111111]">
      {/* HEADER */}
      <div className="mb-4 flex justify-between items-start">
        <h1 className="text-lg font-semibold text-white">
          Loans
        </h1>

        <div className="flex items-center gap-3">
          {/* Toggle Amount Visibility */}
          <button
            onClick={() => setShowAmounts((prev) => !prev)}
            className="text-gray-400"
          >
            {showAmounts ? (
              <EyeSlashIcon className="w-5 h-5" />
            ) : (
              <EyeIcon className="w-5 h-5" />
            )}
          </button>

          <button
            onClick={() => setShowForm(!showForm)}
            className="px-[0.7rem] py-[0.3rem] bg-[#01E777] font-bold text-black rounded-4xl text-sm"
          >
            +
          </button>
        </div>
      </div>

      {/* ADD LOAN MODAL */}
      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#111111]/70">
          <div className="w-full max-w-sm p-5 bg-[#1d1d1d] rounded-xl space-y-3 shadow-lg">
            <h2 className="text-white text-lg font-semibold">
              Add Loan
            </h2>

            <input
              type="text"
              placeholder="Loan name"
              value={newLoanName}
              onChange={(e) => setNewLoanName(e.target.value)}
              className="w-full px-3 py-2 rounded-lg text-sm text-white border border-gray-600 focus:border-[#01E777]/30 focus:outline-none"
            />

            <input
              type="number"
              placeholder="Initial amount"
              value={newLoanAmount}
              onChange={(e) => setNewLoanAmount(e.target.value)}
              className="w-full px-3 py-2 rounded-lg text-sm text-white border border-gray-600 focus:border-[#01E777]/30 focus:outline-none"
            />

            <div className="flex justify-end space-x-2 pt-2">
              <button
                onClick={() => setShowForm(false)}
                className="px-3 py-1 text-sm text-gray-400"
              >
                Cancel
              </button>

              <button
                onClick={handleAddLoan}
                className="px-3 py-1 bg-[#01E777] text-black font-semibold rounded-lg text-sm"
              >
                Save
              </button>
            </div>
          </div>
        </div>
      )}

      {/* SUMMARY */}
      <div className="mb-6 p-4 bg-[#1d1d1d] rounded-xl text-center">
        <p className="text-gray-400 text-sm">Total Remaining</p>
        <p className="text-[2.5rem] font-bold text-[#01E777]">
          {showAmounts
            ? totalRemaining.toLocaleString()
            : mask(totalRemaining)}
        </p>
      </div>

      {/* LIST */}
      <div className="space-y-3">
        {loans.map((loan, index) => {
          const paid = loan.transactions.reduce(
            (sum, t) => sum + (t.amount > 0 ? Number(t.amount) : 0),
            0
          );

          const adjustments = loan.transactions.reduce(
            (sum, t) =>
              sum + (t.amount < 0 ? Math.abs(Number(t.amount)) : 0),
            0
          );

          const remaining =
            loan.initialAmount + adjustments - paid;

          return (
            <div
              key={loan._id}
              className="bg-[#1d1d1d] rounded-xl overflow-hidden"
            >
              <button
                className="w-full flex justify-between items-center px-4 py-3"
                onClick={() => toggleExpand(index)}
              >
                <div className="flex items-center gap-3 text-left">
                  <div className="w-10 h-10 rounded-lg bg-gray-700 flex items-center justify-center">
                    <BanknotesIcon className="w-5 h-5 text-[#01E777]" />
                  </div>

                  <div>
                    <p className="font-medium text-[1.2rem] text-white">
                      {loan.name}
                    </p>

                    <p className="text-xs text-[#01E777]">
                      Paid:{" "}
                      <span className="text-white font-medium">
                        {showAmounts
                          ? paid.toLocaleString()
                          : mask(paid)}
                      </span>
                    </p>
                  </div>
                </div>

                <p className="font-bold text-[#01E777]">
                  {showAmounts
                    ? remaining.toLocaleString()
                    : mask(remaining)}
                </p>
              </button>

              {expanded === index && (
                <div className="border-t px-4 py-3">
                  {loan.transactions.length === 0 ? (
                    <p className="text-xs text-white">
                      No payments yet
                    </p>
                  ) : (
                    <ul className="text-xs text-white space-y-1">
                      {loan.transactions.map((t, i) => (
                        <li key={i} className="flex justify-between">
                          <span>{t.date}</span>
                          <span>
                            {t.amount > 0 ? "-" : "+"}
                            {Math.abs(t.amount).toLocaleString()}
                          </span>
                        </li>
                      ))}
                    </ul>
                  )}

                  <div className="mt-3 space-y-2">
                    <input
                      type="date"
                      value={paymentDates[index] || ""}
                      onChange={(e) =>
                        setPaymentDates((prev) => ({
                          ...prev,
                          [index]: e.target.value,
                        }))
                      }
                      className="w-full px-3 py-2 rounded-lg text-sm text-white border border-gray-600 focus:border-[#01E777]/30 focus:outline-none"
                    />

                    <input
                      type="number"
                      placeholder="Enter amount (+ / -)"
                      value={paymentInputs[index] || ""}
                      onChange={(e) =>
                        setPaymentInputs((prev) => ({
                          ...prev,
                          [index]: e.target.value,
                        }))
                      }
                      className="w-full px-3 py-2 rounded-lg text-sm text-white border border-gray-600 focus:border-[#01E777]/30 focus:outline-none"
                    />

                    <button
                      onClick={() =>
                        handleAddPayment(loan._id, index)
                      }
                      className="w-full bg-[#01E777] text-black font-bold py-2 rounded-lg text-sm"
                    >
                      Add Payment
                    </button>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}