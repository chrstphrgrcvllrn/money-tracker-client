import { useEffect, useState } from "react";
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

  const [paymentDates, setPaymentDates] = useState<{
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

  // ✅ Add Payment (with manual date)
  const handleAddPayment = async (loanId: string, index: number) => {
    const amount = paymentInputs[index];
    const date = paymentDates[index];

    if (!amount || !date) return;

    const transaction = {
      date: date, // ✅ manual date
      amount: Number(amount), // supports + / -
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

  // Totals
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
    <div className="p-4 max-w-md mx-auto font-sans text-gray-800 bg-black">
      {/* HEADER */}
      <div className="mb-4 flex justify-between items-center">
        <h1 className="text-lg font-semibold text-[#CEE36E]">Loans</h1>
        <button
          onClick={() => setShowForm(!showForm)}
          className="px-[0.7rem] py-[0.3rem] bg-[#CEE36E] font-bold text-black rounded-4xl text-sm"
        >
          +
        </button>
      </div>

    {/* ADD LOAN MODAL */}
{showForm && (
  <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70">
    
    {/* Modal Box */}
    <div className="w-full max-w-sm p-5 bg-mist-900 rounded-xl space-y-3 shadow-lg">
      
      <h2 className="text-white text-lg font-semibold">
        Add Loan
      </h2>

      <input
        type="text"
        placeholder="Loan name"
        value={newLoanName}
        onChange={(e) => setNewLoanName(e.target.value)}
        className="w-full px-3 py-2 rounded-lg text-sm text-white
                   border border-gray-600 focus:border-[#CEE36E]/30 focus:outline-none"
      />

      <input
        type="number"
        placeholder="Initial amount"
        value={newLoanAmount}
        onChange={(e) => setNewLoanAmount(e.target.value)}
        className="w-full px-3 py-2 rounded-lg text-sm text-white
                   border border-gray-600 focus:border-[#CEE36E]/30 focus:outline-none"
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
          className="px-3 py-1 bg-[#CEE36E] text-black font-semibold rounded-lg text-sm"
        >
          Save
        </button>
      </div>
    </div>
  </div>
)}

      {/* SUMMARY */}
      <div className="mb-6 p-4 bg-mist-900 rounded-xl text-center">
        <p className="text-gray-400 text-sm">Total Remaining</p>
        <p className="text-[2.5rem] font-bold text-[#CEE36E]">
          {totalRemaining.toLocaleString()}
        </p>
      </div>

      <div className="mb-6 p-2 bg-mist-900 rounded-xl flex justify-between">
        <div>
          <p className="text-white text-sm">Total Loan</p>
          <p className="text-md font-medium text-[#CEE36E]">
            {totalInitial.toLocaleString()}
          </p>
        </div>
        <div>
          <p className="text-white text-sm">Total Paid</p>
          <p className="text-md font-medium text-[#CEE36E]">
            {totalPaid.toLocaleString()}
          </p>
        </div>
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
              className="bg-mist-900 rounded-xl overflow-hidden"
            >
              <button
                className="w-full flex justify-between items-center px-4 py-3"
                onClick={() => toggleExpand(index)}
              >
                <div className="text-left">
                  <p className="font-medium text-[1.2rem] text-white">
                    {loan.name}
                  </p>

                  <p className="text-xs text-[#CEE36E]">
                    Paid:{" "}
                    <span className="text-white font-medium">
                      {paid.toLocaleString()}
                    </span>
                  </p>
                </div>

                <p className="font-bold text-[#CEE36E]">
                  {remaining.toLocaleString()}
                </p>
              </button>

              {expanded === index && (
                <div className="border-t px-4 py-3">
                  {/* Transactions */}
                  {loan.transactions.length === 0 ? (
                    <p className="text-xs text-white">
                      No payments yet
                    </p>
                  ) : (
                    <ul className="text-xs text-white space-y-1">
                      {loan.transactions.map((t, i) => (
                        <li
                          key={i}
                          className="flex justify-between"
                        >
                          <span>{t.date}</span>
                          <span>
                            {t.amount > 0 ? "-" : "+"}
                            {Math.abs(t.amount).toLocaleString()}
                          </span>
                        </li>
                      ))}
                    </ul>
                  )}

                  {/* Add Payment */}
                  <div className="mt-3 space-y-2">
                    {/* Date Input */}
                    <input
                      type="date"
                      value={paymentDates[index] || ""}
                      onChange={(e) =>
                        setPaymentDates((prev) => ({
                          ...prev,
                          [index]: e.target.value,
                        }))
                      }
                      className="w-full px-3 py-2 rounded-lg text-sm text-white border border-mist-700
                                  border border-gray-600 focus:border-[#CEE36E]/30 focus:outline-none
                      "
                    />

                    {/* Amount Input */}
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
                      className="w-full px-3 py-2 rounded-lg text-sm text-white border border-mist-700
                                  border border-gray-600 focus:border-[#CEE36E]/30 focus:outline-none"
                    />

                    <button
                      onClick={() =>
                        handleAddPayment(loan._id, index)
                      }
                      className="w-full bg-[#CEE36E] text-black font-bold py-2 rounded-lg text-sm"
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