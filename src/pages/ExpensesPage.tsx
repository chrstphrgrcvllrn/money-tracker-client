import { useEffect, useState } from "react";
import {
  fetchExpenses,
  createExpense,
  toggleExpense,
} from "../api/expenses";

import { CheckIcon } from "@heroicons/react/24/solid";

type Expense = {
  _id: string;
  text: string;
  amount: number;
  done: boolean;
  createdAt: string; // required for totals
};

const ExpensesPage: React.FC = () => {
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [text, setText] = useState("");
  const [amount, setAmount] = useState("");
  const [showModal, setShowModal] = useState(false);

  const [activeTab, setActiveTab] = useState<"pending" | "done">("pending");

  const loadExpenses = async () => {
    const data = await fetchExpenses();
    setExpenses(data);
  };

  useEffect(() => {
    loadExpenses();
  }, []);

  const addExpense = async () => {
    if (!text.trim() || !amount) return;

    await createExpense({
      text: text.trim(),
      amount: Number(amount),
    });

    setText("");
    setAmount("");
    setShowModal(false);
    loadExpenses();
  };

  const handleToggle = async (id: string) => {
    await toggleExpense(id);
    loadExpenses();
  };

  // =========================
  // DATE HELPERS
  // =========================
  const today = new Date();

  const isToday = (dateStr: string) => {
    const d = new Date(dateStr);
    return d.toDateString() === today.toDateString();
  };

  const isThisWeek = (dateStr: string) => {
    const d = new Date(dateStr);

    const startOfWeek = new Date(today);
    startOfWeek.setDate(today.getDate() - today.getDay()); // Sunday start

    const endOfWeek = new Date(startOfWeek);
    endOfWeek.setDate(startOfWeek.getDate() + 6);

    return d >= startOfWeek && d <= endOfWeek;
  };

  const isThisMonth = (dateStr: string) => {
    const d = new Date(dateStr);
    return (
      d.getMonth() === today.getMonth() &&
      d.getFullYear() === today.getFullYear()
    );
  };

  // =========================
  // TOTALS
  // =========================
  const totalToday = expenses
    .filter((e) => isToday(e.createdAt))
    .reduce((sum, e) => sum + e.amount, 0);

  const totalWeek = expenses
    .filter((e) => isThisWeek(e.createdAt))
    .reduce((sum, e) => sum + e.amount, 0);

  const totalMonth = expenses
    .filter((e) => isThisMonth(e.createdAt))
    .reduce((sum, e) => sum + e.amount, 0);

  // =========================
  // FILTERED LIST
  // =========================
  const filteredExpenses = expenses.filter((exp) => {
    if (activeTab === "done") return exp.done;
    return !exp.done;
  });

  return (
    <div className="text-xs max-w-md mx-auto mt-8 px-6 pb-6 bg-[#111111]">
      {/* HEADER */}
      <div className="mb-4 flex justify-between items-center">
        <h1 className="text-lg font-semibold text-white">Expenses</h1>

        <button
          onClick={() => setShowModal(true)}
          className="bg-[#01E777] text-black font-bold px-3 py-1 rounded-full"
        >
          +
        </button>
      </div>

      {/* TOTALS */}
      <div className="mb-4 grid grid-cols-3 gap-2 text-xs">
        <div className="bg-[#1d1d1d] p-2 rounded-xl">
          <p className="text-gray-400">Today</p>
          <p className="text-[#01E777] font-bold">
            ₱{totalToday.toLocaleString()}
          </p>
        </div>

        <div className="bg-[#1d1d1d] p-2 rounded-xl">
          <p className="text-gray-400">Week</p>
          <p className="text-[#01E777] font-bold">
            ₱{totalWeek.toLocaleString()}
          </p>
        </div>

        <div className="bg-[#1d1d1d] p-2 rounded-xl">
          <p className="text-gray-400">Month</p>
          <p className="text-[#01E777] font-bold">
            ₱{totalMonth.toLocaleString()}
          </p>
        </div>
      </div>

      {/* TABS */}
      <div className="flex gap-2 mb-4">
        {["pending", "done"].map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab as any)}
            className={`px-2 py-1 rounded-xl text-xs capitalize ${
              activeTab === tab
                ? "bg-[#01E777] text-black font-bold"
                : "bg-[#1d1d1d] text-gray-400"
            }`}
          >
            {tab}
          </button>
        ))}
      </div>

      {/* LIST */}
      <ul className="space-y-2 text-sm">
        {filteredExpenses.map((exp) => (
          <li
            key={exp._id}
            className={`flex justify-between items-center p-2 bg-[#1d1d1d] rounded-xl ${
              exp.done ? "text-gray-700 line-through" : ""
            }`}
          >
            <div className="flex flex-col">
              <span
                className={`font-medium ${
                  exp.done ? "text-gray-700" : "text-white"
                }`}
              >
                {exp.text}
              </span>
              <span className="text-[#01E777] text-xs">
                ₱{exp.amount.toLocaleString()}
              </span>
            </div>

            <button
              onClick={() => handleToggle(exp._id)}
              className="flex items-center justify-center px-2 py-1 rounded hover:text-[#01E777]"
            >
              <CheckIcon
                className={`w-5 h-5 ${
                  exp.done ? "text-[#01E777]" : "text-gray-500"
                }`}
              />
            </button>
          </li>
        ))}
      </ul>

      {/* MODAL */}
      {showModal && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center">
          <div className="bg-[#1d1d1d] p-4 rounded-xl w-[90%] max-w-sm">
            <h2 className="text-white mb-3 font-semibold">Add Expense</h2>

            <input
              type="text"
              placeholder="Expense name"
              value={text}
              onChange={(e) => setText(e.target.value)}
              className="w-full mb-2 bg-[#111] px-2 py-2 rounded text-white"
            />

            <input
              type="number"
              placeholder="Amount"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              className="w-full mb-3 bg-[#111] px-2 py-2 rounded text-white"
            />

            <div className="flex justify-end gap-2">
              <button
                onClick={() => setShowModal(false)}
                className="px-3 py-1 text-gray-400"
              >
                Cancel
              </button>

              <button
                onClick={addExpense}
                className="bg-[#01E777] text-black px-3 py-1 rounded font-bold"
              >
                Save
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ExpensesPage;