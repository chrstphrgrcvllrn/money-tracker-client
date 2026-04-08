import { useEffect, useState } from "react";
import type { Savings } from "../types/savings.type";
import {
  getSavings,
  createSavings,
  addSavingsTransaction,
  deleteSavings,
} from "../api/savings";

import { EyeIcon, EyeSlashIcon } from "@heroicons/react/24/outline";

export default function SavingsPage() {
  const [savings, setSavings] = useState<Savings[]>([]);
  const [expanded, setExpanded] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);

  const [showForm, setShowForm] = useState(false);
  const [newSavingsName, setNewSavingsName] = useState("");
  const [newSavingsAmount, setNewSavingsAmount] = useState("");

  const [amountInputs, setAmountInputs] = useState<Record<number, string>>({});
  const [dateInputs, setDateInputs] = useState<Record<number, string>>({});
  const [transactionType, setTransactionType] = useState<Record<number, "+" | "-">>({});

  const [showAmounts, setShowAmounts] = useState(true);

  // ✅ icon paths
  const getIconPaths = (name: string) => {
    if (!name) return [];
    const formatted = name.toLowerCase().replace(/\s+/g, "");
    return [
      `/${formatted}.png`,
      `/${formatted}.jpg`,
      `/${formatted}.jpeg`,
      `/${formatted}.webp`,
    ];
  };

  useEffect(() => {
    const fetchSavings = async () => {
      try {
        const data = await getSavings();
        const normalized: Savings[] = Array.isArray(data) ? data : [data];
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

  const mask = (value: number) =>
    "*".repeat(value.toLocaleString().length);

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
    index: number,
    type: "+" | "-"
  ) => {
    const amount = amountInputs[index];
    const date = dateInputs[index];
    if (!amount || !date) return;

    const value = type === "-" ? -Math.abs(Number(amount)) : Number(amount);

    const transaction = {
      date,
      amount: value,
      type: "transaction",
    };

    try {
      const updated = await addSavingsTransaction(savingsId, transaction);
      setSavings((prev) =>
        prev.map((item) =>
          item._id === savingsId
            ? { ...updated, transactions: updated.transactions ?? [] }
            : item
        )
      );

      setAmountInputs((prev) => ({ ...prev, [index]: "" }));
      setDateInputs((prev) => ({ ...prev, [index]: "" }));
      setTransactionType((prev) => ({ ...prev, [index]: "+" }));
    } catch (err) {
      console.error(err);
    }
  };

  const handleDeleteSavings = async (id: string) => {
    if (!confirm("Are you sure you want to delete this savings?")) return;

    try {
      await deleteSavings(id);
      setSavings((prev) => prev.filter((s) => s._id !== id));
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
      (s, t) => s + (t.amount < 0 ? Math.abs(Number(t.amount)) : 0),
      0
    );
    return sum + withdrawals;
  }, 0);

  const totalBalance = totalInitial + totalDeposits - totalWithdrawals;

  if (loading) {
    return <div className="p-4 text-center">Loading...</div>;
  }

  return (
    <div className="px-6 pb-6 mt-8 max-w-md mx-auto font-sans text-gray-800 bg-[#111111]">
      {/* HEADER */}
      <div className="mb-4 flex justify-between items-start">
        <h1 className="text-lg font-semibold text-white">Savings</h1>

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

      {/* ✅ MODAL (restored) */}
      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#111111]/70">
          <div className="w-full max-w-sm p-5 bg-[#1d1d1d] rounded-xl space-y-3 shadow-lg">
            <h2 className="text-white text-lg font-semibold">Add Savings</h2>

            <input
              type="text"
              placeholder="Savings name"
              value={newSavingsName}
              onChange={(e) => setNewSavingsName(e.target.value)}
              className="w-full px-3 py-2 rounded-lg text-sm text-white border border-gray-600 focus:border-[#01E777]/30 focus:outline-none"
            />

            <input
              type="number"
              placeholder="Initial amount"
              value={newSavingsAmount}
              onChange={(e) => setNewSavingsAmount(e.target.value)}
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
                onClick={handleAddSavings}
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
        <p className="text-gray-400 text-sm">Total Balance</p>
        <p className="text-[2.5rem] font-bold text-[#01E777]">
          {showAmounts ? totalBalance.toLocaleString() : mask(totalBalance)}
        </p>
      </div>

      {/* LIST */}
      <div className="space-y-3">
        {savings.map((item, index) => {
          const deposits = (item.transactions ?? []).reduce(
            (sum, t) => sum + (t.amount > 0 ? Number(t.amount) : 0),
            0
          );

          const withdrawals = (item.transactions ?? []).reduce(
            (sum, t) => sum + (t.amount < 0 ? Math.abs(Number(t.amount)) : 0),
            0
          );

          const balance = item.initialAmount + deposits - withdrawals;
          const paths = getIconPaths(item.name);

          return (
            <div key={item._id} className="bg-[#1d1d1d] rounded-xl overflow-hidden">
              <button
                className="w-full flex justify-between items-center px-4 py-3"
                onClick={() => toggleExpand(index)}
              >
                <div className="flex items-center gap-3 text-left">
                  {/* ✅ ICON */}
                  <div className="w-10 h-10 rounded-lg bg-gray-700 flex items-center justify-center overflow-hidden">
                    <img
                      src={paths[0]}
                      alt={item.name}
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        const img = e.currentTarget;
                        const currentIndex = paths.indexOf(
                          img.src.replace(window.location.origin, "")
                        );
                        const nextPath = paths[currentIndex + 1];

                        if (nextPath) {
                          img.src = nextPath;
                        } else {
                          img.style.display = "none";
                          if (img.nextSibling) {
                            (img.nextSibling as HTMLElement).style.display = "block";
                          }
                        }
                      }}
                    />
                    <span className="text-white font-semibold hidden">
                      {item.name?.charAt(0).toUpperCase()}
                    </span>
                  </div>

                  <div>
                    <p className="font-medium text-[1.2rem] text-white">
                      {item.name}
                    </p>

                    <p className="text-xs text-gray-500">
                      Deposits:{" "}
                      <span className="text-gray-500 font-medium">
                        {showAmounts ? deposits.toLocaleString() : mask(deposits)}
                      </span>
                    </p>
                  </div>
                </div>

                <p className="font-bold text-[#01E777]">
                  {showAmounts ? balance.toLocaleString() : mask(balance)}
                </p>
              </button>

              {expanded === index && (
                <div className="border-t px-4 py-3">
                  <ul className="text-xs text-white space-y-1">
                    {(item.transactions ?? []).map((t, i) => (
                      <li key={i} className="flex justify-between">
                        <span>{t.date}</span>
                        <span
                          className={`${
                            t.amount < 0
                              ? "text-red-400"
                              : t.amount > 0
                              ? "text-green-400"
                              : "text-white"
                          }`}
                        >
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
                        setDateInputs((prev) => ({ ...prev, [index]: e.target.value }))
                      }
                      className="w-full px-3 py-2 rounded-lg text-sm text-white border border-gray-600"
                    />

                    <div className="flex gap-2">
                      <select
                        value={transactionType[index] || "+"}
                        onChange={(e) =>
                          setTransactionType((prev) => ({
                            ...prev,
                            [index]: e.target.value as "+" | "-",
                          }))
                        }
                        className="w-20 px-2 py-2 rounded-lg text-sm text-white bg-[#1d1d1d] border border-gray-600"
                      >
                        <option value="+">+</option>
                        <option value="-">-</option>
                      </select>

                      <input
                        type="number"
                        placeholder="Enter amount"
                        value={amountInputs[index] || ""}
                        onChange={(e) =>
                          setAmountInputs((prev) => ({ ...prev, [index]: e.target.value }))
                        }
                        className="flex-1 px-3 py-2 rounded-lg text-sm text-white border border-gray-600"
                      />
                    </div>

                    <button
                      onClick={() =>
                        handleAddTransaction(item._id, index, transactionType[index] || "+")
                      }
                      className="w-full bg-[#01E777] text-black font-bold py-2 rounded-lg text-sm"
                    >
                      Add Transaction
                    </button>
                  </div>

                  <div className="mt-2 flex justify-end">
                    <button
                      onClick={() => handleDeleteSavings(item._id)}
                      className="px-3 py-1 bg-red-500 text-white font-semibold rounded-lg text-sm"
                    >
                      Delete
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