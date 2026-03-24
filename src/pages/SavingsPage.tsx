import { useEffect, useState } from "react";
import type { Savings } from "../types/savings.type";
import {
  getSavings,
  createSavings,
  addSavingsTransaction,
} from "../api/savings";

export default function SavingsPage() {
  const [savings, setSavings] = useState<Savings[]>([]);
  const [expanded, setExpanded] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);

  const [showForm, setShowForm] = useState(false);
  const [newSavingsName, setNewSavingsName] = useState("");
  const [newSavingsAmount, setNewSavingsAmount] = useState("");

  const [amountInputs, setAmountInputs] = useState<Record<number, string>>(
    {}
  );
  const [dateInputs, setDateInputs] = useState<Record<number, string>>({});

  useEffect(() => {
    const fetchSavings = async () => {
      try {
        const data = await getSavings();

        const normalized: Savings[] = Array.isArray(data)
          ? data
          : [data];

        const withTransactions = normalized.map((item) => ({
          ...item,
          transactions: item.transactions ?? [],
        }));

        setSavings(withTransactions);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchSavings();
  }, []);

  const toggleExpand = (index: number) => {
    setExpanded((prev) => (prev === index ? null : index));
  };

  const handleAddSavings = async () => {
    if (!newSavingsName || !newSavingsAmount) return;

    const newItem = {
      name: newSavingsName,
      initialAmount: Number(newSavingsAmount),
      transactions: [],
    };

    try {
      const saved = await createSavings(newItem);

      setSavings((prev) => [
        ...prev,
        {
          ...saved,
          transactions: saved.transactions ?? [],
        },
      ]);

      setNewSavingsName("");
      setNewSavingsAmount("");
      setShowForm(false);
    } catch (err) {
      console.error(err);
    }
  };

  const handleAddTransaction = async (
    savingsId: string,
    index: number
  ) => {
    const amount = amountInputs[index];
    const date = dateInputs[index];

    if (!amount || !date) return;

    const transaction = {
      date,
      amount: Number(amount),
      type: "transaction",
    };

    try {
      const updated = await addSavingsTransaction(
        savingsId,
        transaction
      );

      setSavings((prev) =>
        prev.map((item) =>
          item._id === savingsId
            ? { ...updated, transactions: updated.transactions ?? [] }
            : item
        )
      );

      setAmountInputs((prev) => ({ ...prev, [index]: "" }));
      setDateInputs((prev) => ({ ...prev, [index]: "" }));
    } catch (err) {
      console.error(err);
    }
  };

  const totalInitial = savings.reduce(
    (sum, item) => sum + (item.initialAmount || 0),
    0
  );

  const totalDeposits = savings.reduce((sum, item) => {
    const deposits = (item.transactions ?? []).reduce(
      (s, t) => s + (t.amount > 0 ? Number(t.amount) : 0),
      0
    );
    return sum + deposits;
  }, 0);

  const totalWithdrawals = savings.reduce((sum, item) => {
    const withdrawals = (item.transactions ?? []).reduce(
      (s, t) =>
        s + (t.amount < 0 ? Math.abs(Number(t.amount)) : 0),
      0
    );
    return sum + withdrawals;
  }, 0);

  const totalBalance =
    totalInitial + totalDeposits - totalWithdrawals;

  if (loading) {
    return <div className="p-4 text-center">Loading...</div>;
  }

  return (
    <div className="p-4 max-w-md mx-auto font-sans text-gray-800 bg-black">
      {/* HEADER */}
      <div className="mb-4 flex justify-between items-center">
        <h1 className="text-lg font-semibold text-[#CEE36E]">
          Savings
        </h1>

        <button
          onClick={() => setShowForm(!showForm)}
          className="px-[0.7rem] py-[0.3rem] bg-[#CEE36E] font-bold text-black rounded-4xl text-sm"
        >
          +
        </button>
      </div>

      {/* MODAL */}
      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70">
          <div className="w-full max-w-sm p-5 bg-mist-900 rounded-xl space-y-3 shadow-lg">
            <h2 className="text-white text-lg font-semibold">
              Add Savings
            </h2>

            <input
              type="text"
              placeholder="Savings name"
              value={newSavingsName}
              onChange={(e) => setNewSavingsName(e.target.value)}
              className="w-full px-3 py-2 rounded-lg text-sm text-white border border-gray-600 focus:border-[#CEE36E]/30 focus:outline-none"
            />

            <input
              type="number"
              placeholder="Initial amount"
              value={newSavingsAmount}
              onChange={(e) => setNewSavingsAmount(e.target.value)}
              className="w-full px-3 py-2 rounded-lg text-sm text-white border border-gray-600 focus:border-[#CEE36E]/30 focus:outline-none"
            />

            <div className="flex justify-end space-x-2 pt-2">
              <button
                onClick={() => setShowForm(false)}
                className="px-3 py-1 text-sm text-gray-400"
              >
                Cancel
              </button>

              <button
                onClick={handleAddSavings}
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
        <p className="text-gray-400 text-sm">Total Balance</p>
        <p className="text-[2.5rem] font-bold text-[#CEE36E]">
          {totalBalance.toLocaleString()}
        </p>
      </div>

      {/* LIST */}
      <div className="space-y-3">
        {savings.map((item, index) => {
          const deposits = (item.transactions ?? []).reduce(
            (sum, t) =>
              sum + (t.amount > 0 ? Number(t.amount) : 0),
            0
          );

          const withdrawals = (item.transactions ?? []).reduce(
            (sum, t) =>
              sum + (t.amount < 0 ? Math.abs(Number(t.amount)) : 0),
            0
          );

          const balance =
            item.initialAmount + deposits - withdrawals;

          return (
            <div
              key={item._id}
              className="bg-mist-900 rounded-xl overflow-hidden"
            >
              <button
                className="w-full flex justify-between items-center px-4 py-3"
                onClick={() => toggleExpand(index)}
              >
                <div className="flex items-center gap-3 text-left">
                  
                  {/* ICON (initial only) */}
                  <div className="w-10 h-10 rounded-lg bg-gray-700 flex items-center justify-center">
                    <span className="text-white font-semibold">
                      {item.name?.charAt(0).toUpperCase()}
                    </span>
                  </div>

                  {/* TEXT */}
                  <div>
                    <p className="font-medium text-[1.2rem] text-white">
                      {item.name}
                    </p>

                    <p className="text-xs text-[#CEE36E]">
                      Deposits:{" "}
                      <span className="text-white font-medium">
                        {deposits.toLocaleString()}
                      </span>
                    </p>
                  </div>
                </div>

                {/* BALANCE */}
                <p className="font-bold text-[#CEE36E]">
                  {balance.toLocaleString()}
                </p>
              </button>

              {expanded === index && (
                <div className="border-t px-4 py-3">
                  <ul className="text-xs text-white space-y-1">
                    {(item.transactions ?? []).map((t, i) => (
                      <li key={i} className="flex justify-between">
                        <span>{t.date}</span>
                        <span>
                          {t.amount > 0 ? "+" : "-"}
                          {Math.abs(t.amount).toLocaleString()}
                        </span>
                      </li>
                    ))}
                  </ul>

                  <div className="mt-3 space-y-2">
                    <input
                      type="date"
                      value={dateInputs[index] || ""}
                      onChange={(e) =>
                        setDateInputs((prev) => ({
                          ...prev,
                          [index]: e.target.value,
                        }))
                      }
                      className="w-full px-3 py-2 rounded-lg text-sm text-white border border-gray-600 focus:border-[#CEE36E]/30 focus:outline-none"
                    />

                    <input
                      type="number"
                      placeholder="Enter amount"
                      value={amountInputs[index] || ""}
                      onChange={(e) =>
                        setAmountInputs((prev) => ({
                          ...prev,
                          [index]: e.target.value,
                        }))
                      }
                      className="w-full px-3 py-2 rounded-lg text-sm text-white border border-gray-600 focus:border-[#CEE36E]/30 focus:outline-none"
                    />

                    <button
                      onClick={() =>
                        handleAddTransaction(item._id, index)
                      }
                      className="w-full bg-[#CEE36E] text-black font-bold py-2 rounded-lg text-sm"
                    >
                      Add Transaction
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