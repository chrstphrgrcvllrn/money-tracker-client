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

  const [paymentInputs, setPaymentInputs] = useState<{ [key: number]: string }>({});
  const [paymentDates, setPaymentDates] = useState<{ [key: number]: string }>({});
  const [transactionTypes, setTransactionTypes] = useState<{ [key: number]: "+" | "-" }>({});

  const [showAmounts, setShowAmounts] = useState(true);

  useEffect(() => {
    const fetchLoans = async () => {
      try {
        const data = await getLoans();
        const normalized = Array.isArray(data) ? data : [data];
        const withTransactions = normalized.map((loan) => ({
          ...loan,
          transactions: Array.isArray(loan.transactions) ? loan.transactions : [],
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

  const handleAddPayment = async (loanId: string, index: number, amount: number) => {
    const date = paymentDates[index];
    if (!amount || !date) return;

    const transaction = { date, amount, type: "payment" };

    // Optimistic UI update
    setLoans((prev) =>
      prev.map((loan) =>
        loan._id === loanId
          ? { ...loan, transactions: [...(loan.transactions || []), transaction] }
          : loan
      )
    );

    try {
      await addTransaction(loanId, transaction);
    } catch (err) {
      console.error(err);
      // Optionally: remove transaction if failed
      setLoans((prev) =>
        prev.map((loan) =>
          loan._id === loanId
            ? {
                ...loan,
                transactions: (loan.transactions || []).filter(
                  (t) => t !== transaction
                ),
              }
            : loan
        )
      );
    }

    // Clear inputs
    setPaymentInputs((prev) => ({ ...prev, [index]: "" }));
    setPaymentDates((prev) => ({ ...prev, [index]: "" }));
    setTransactionTypes((prev) => ({ ...prev, [index]: "+" }));
  };

  const totalRemaining = loans.reduce((sum, loan) => {
    const transactionsSum = (loan.transactions || []).reduce(
      (s, t) => s + Number(t.amount),
      0
    );
    return sum + Number(loan.initialAmount) + transactionsSum;
  }, 0);

  if (loading) {
    return <div className="p-4 text-center">Loading...</div>;
  }

  return (
    <div className="px-6 pb-6 mt-8 max-w-md mx-auto font-sans text-gray-800 bg-[#111111]">
      {/* HEADER */}
      <div className="mb-4 flex justify-between items-start">
        <h1 className="text-lg font-semibold text-white">Loans</h1>

        <div className="flex items-center gap-3">
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
            <h2 className="text-white text-lg font-semibold">Add Loan</h2>

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
          {showAmounts ? totalRemaining.toLocaleString() : mask(totalRemaining)}
        </p>
      </div>

      {/* LIST */}
     <div className="space-y-3">
      {/*    {loans.map((loan, index) => {
          const loanTransactions = loan.transactions || [];
          const loanSum = loanTransactions.reduce((s, t) => s + Number(t.amount), 0);
          const remaining = Number(loan.initialAmount) + loanSum; */}

  {loans
    .slice() // make a copy so we don’t mutate state
    .sort((a, b) => {
      const aRemaining =
        Number(a.initialAmount) +
        (a.transactions || []).reduce((s, t) => s + Number(t.amount), 0);
      const bRemaining =
        Number(b.initialAmount) +
        (b.transactions || []).reduce((s, t) => s + Number(t.amount), 0);
      return bRemaining - aRemaining; // highest first
    })
    .map((loan, index) => {
      const loanTransactions = loan.transactions || [];
      const loanSum = loanTransactions.reduce((s, t) => s + Number(t.amount), 0);
      const remaining = Number(loan.initialAmount) + loanSum;


          return (
            <div
              key={loan._id || index} 
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
                    <p className="font-medium text-[1.2rem] text-white">{loan.name}</p>
                   <p className="text-xs text-[#01E777]">
  Paid:{" "}
  <span className="text-white font-medium">
    {showAmounts
      ? loanTransactions
          .filter((t) => t.amount < 0)
          .reduce((s, t) => s + Math.abs(Number(t.amount)), 0)
          .toLocaleString()
      : mask(
          loanTransactions
            .filter((t) => t.amount < 0)
            .reduce((s, t) => s + Math.abs(Number(t.amount)), 0)
        )}
  </span>
</p>
                  </div>
                </div>

                <p className="font-bold text-[#01E777]">
                  {showAmounts ? remaining.toLocaleString() : mask(remaining)}
                </p>
              </button>

              {expanded === index && (
                <div className="border-t px-4 py-3">
                  {loanTransactions.length === 0 ? (
                    <p className="text-xs text-white">No payments yet</p>
                  ) : (
                   <ul className="text-xs text-white space-y-1">
                  {loanTransactions.map((t, i) => (
                    <li
                      key={`${t.date}-${t.amount}-${t.type}-${i}`}
                      className="flex justify-between"
                    >
                      <span>
                        {new Date(t.date).toLocaleDateString("en-PH", {
                          month: "short",
                          day: "numeric",
                          year: "numeric",
                        })}
                      </span>

                      <span
                        className={`${
                          Number(t.amount) < 0 ? "text-red-400" : "text-white"
                        }`}
                      >
                        {Number(t.amount).toLocaleString("en-PH")}
                      </span>
                    </li>
                  ))}
                </ul>
                  )}

                  <div className="mt-3 space-y-2 flex flex-col gap-2">
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

                    <div className="flex gap-2">
                      <select
                        value={transactionTypes[index] || "+"}
                        onChange={(e) =>
                          setTransactionTypes((prev) => ({
                            ...prev,
                            [index]: e.target.value as "+" | "-",
                          }))
                        }
                        className="px-3 py-2 rounded-lg text-sm text-white bg-[#1d1d1d] border border-gray-600 focus:border-[#01E777]/30 focus:outline-none"
                      >
                        <option value="+">+</option>
                        <option value="-">-</option>
                      </select>

                      <input
                        type="number"
                        placeholder="Enter amount"
                        value={paymentInputs[index] || ""}
                        onChange={(e) =>
                          setPaymentInputs((prev) => ({
                            ...prev,
                            [index]: e.target.value,
                          }))
                        }
                        className="flex-1 px-3 py-2 rounded-lg text-sm text-white border border-gray-600 focus:border-[#01E777]/30 focus:outline-none"
                      />
                    </div>

                    <button
                      onClick={() => {
                        const type = transactionTypes[index] || "+";
                        const rawValue = paymentInputs[index] || "0";
                        const value = Number(rawValue) * (type === "-" ? -1 : 1);

                        if (isNaN(value) || !paymentDates[index]) return;

                        handleAddPayment(loan._id, index, value);
                      }}
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