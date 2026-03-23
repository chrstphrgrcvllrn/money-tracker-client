import  { useEffect, useState } from "react";
import type { Loan } from "../types/loans.type";
import { getLoans, createLoan, addTransaction } from "../api/loan";

export default function LoanPage() {
  const [loans, setLoans] = useState<Loan[]>([]);
  const [expanded, setExpanded] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);

  // Add Loan
  const [showForm, setShowForm] = useState(false);
  const [newLoanName, setNewLoanName] = useState("");
  const [newLoanAmount, setNewLoanAmount] = useState("");

  // Payment inputs
  const [paymentInputs, setPaymentInputs] = useState<{
    [key: number]: string;
  }>({});

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

  // ✅ Add Loan
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

  // ✅ Add Payment
  const handleAddPayment = async (loanId: string, index: number) => {
    const amount = paymentInputs[index];
    if (!amount) return;

    const transaction = {
      date: new Date().toLocaleDateString(),
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
    } catch (err) {
      console.error(err);
    }
  };

  // Totals
  const totalInitial = loans.reduce(
    (sum, loan) => sum + loan.initialAmount,
    0
  );

  const totalPaid = loans.reduce(
    (sum, loan) =>
      sum +
      loan.transactions.reduce((s, t) => s + Number(t.amount), 0),
    0
  );

  const totalRemaining = totalInitial - totalPaid;

  if (loading) {
    return <div className="p-4 text-center">Loading...</div>;
  }

  return (
    <div className="p-4 max-w-md mx-auto font-sans text-gray-800">
      {/* HEADER */}
      <div className="mb-4 flex justify-between items-center">
        <h1 className="text-lg font-semibold">Loans</h1>
        <button
          onClick={() => setShowForm(!showForm)}
          className="px-3 py-1 bg-black text-white rounded-lg text-sm"
        >
          + Add Loan
        </button>
      </div>

      {/* ADD LOAN FORM */}
      {showForm && (
        <div className="mb-6 p-4 bg-white rounded-xl shadow-sm space-y-3">
          <input
            type="text"
            placeholder="Loan name"
            value={newLoanName}
            onChange={(e) => setNewLoanName(e.target.value)}
            className="w-full border px-3 py-2 rounded-lg text-sm"
          />

          <input
            type="number"
            placeholder="Initial amount"
            value={newLoanAmount}
            onChange={(e) => setNewLoanAmount(e.target.value)}
            className="w-full border px-3 py-2 rounded-lg text-sm"
          />

          <div className="flex justify-end space-x-2">
            <button
              onClick={() => setShowForm(false)}
              className="px-3 py-1 text-sm text-gray-500"
            >
              Cancel
            </button>

            <button
              onClick={handleAddLoan}
              className="px-3 py-1 bg-black text-white rounded-lg text-sm"
            >
              Save
            </button>
          </div>
        </div>
      )}

      {/* SUMMARY */}
      <div className="mb-6 p-4 bg-white rounded-xl shadow-sm text-center">
        <p className="text-gray-400 text-sm">Total Remaining</p>
        <p className="text-[2.5rem] font-bold text-red-600">
          {totalRemaining.toLocaleString()}
        </p>
      </div>

      <div className="mb-6 p-2 bg-white rounded-xl shadow-sm flex justify-between w-full">
        <div>
          <p className="text-gray-400 text-sm">Total Loan</p>
          <p className="text-md font-medium">
            {totalInitial.toLocaleString()}
          </p>
        </div>
        <div>
          <p className="text-gray-400 text-sm">Total Paid</p>
          <p className="text-md font-medium">
            {totalPaid.toLocaleString()}
          </p>
        </div>
      </div>

      {/* LIST */}
      <div className="space-y-3">
        {loans.map((loan, index) => {
          const paid = loan.transactions.reduce(
            (sum, t) => sum + Number(t.amount),
            0
          );

          const remaining = loan.initialAmount - paid;

          return (
            <div
              key={loan._id}
              className="bg-white rounded-xl shadow-sm overflow-hidden"
            >
              <button
                className="w-full flex justify-between items-center px-4 py-3"
                onClick={() => toggleExpand(index)}
              >
                <div className="text-left">
                    <p className="font-medium text-[1.2rem]">{loan.name}</p>

                    <div className="text-xs text-gray-500 space-y-0.5">
                      <p>
                        Paid:{" "}
                        <span className="text-gray-600 font-medium">
                          {paid.toLocaleString()}
                        </span>
                      </p>
                      {/* <p>
                        Remaining:{" "}
                        <span className="text-red-600 font-medium">
                          {remaining.toLocaleString()}
                        </span>
                      </p> */}
                    </div>
                  </div>

                <p className="font-bold text-red-600">
                  {remaining.toLocaleString()}
                </p>
              </button>

              {expanded === index && (
                <div className="border-t px-4 py-3 bg-gray-50">
                  {/* Transactions */}
                  {loan.transactions.length === 0 ? (
                    <p className="text-xs text-gray-400">
                      No payments yet
                    </p>
                  ) : (
                    <ul className="text-xs space-y-1">
                      {loan.transactions.map((t, i) => (
                        <li key={i} className="flex justify-between">
                          <span>{t.date}</span>
                          <span>-{t.amount.toLocaleString()}</span>
                        </li>
                      ))}
                    </ul>
                  )}

                  {/* Add Payment */}
                  <div className="mt-3 space-y-2">
                    <input
                      type="number"
                      placeholder="Enter payment"
                      value={paymentInputs[index] || ""}
                      onChange={(e) =>
                        setPaymentInputs((prev) => ({
                          ...prev,
                          [index]: e.target.value,
                        }))
                      }
                      className="w-full border px-3 py-2 rounded-lg text-sm"
                    />

                    <button
                      onClick={() => handleAddPayment(loan._id, index)}
                      className="w-full bg-black text-white py-2 rounded-lg text-sm"
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