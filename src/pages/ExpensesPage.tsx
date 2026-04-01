import { useEffect, useState } from "react";
import {
  fetchExpenses,
  createExpense,
  toggleExpense,
  updateExpense,
  deleteExpense,
} from "../api/expenses";

import { CheckIcon, PencilIcon, TrashIcon } from "@heroicons/react/24/solid";

type Expense = {
  _id: string;
  text: string;
  amount: number;
  done: boolean;
  createdAt: string;
};

const ExpensesPage: React.FC = () => {
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [text, setText] = useState("");
  const [amount, setAmount] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  // ✅ added monthly
  const [activeTab, setActiveTab] = useState<
    "pending" | "done" | "monthly"
  >("pending");

  const loadExpenses = async () => {
    const data = await fetchExpenses();
    setExpenses(data);
  };

  useEffect(() => {
    loadExpenses();
  }, []);

  // =========================
  // ADD OR UPDATE
  // =========================
  const handleSave = async () => {
    if (!text.trim() || !amount) return;

    if (editingId) {
      await updateExpense(editingId, {
        text: text.trim(),
        amount: Number(amount),
      });
    } else {
      await createExpense({
        text: text.trim(),
        amount: Number(amount),
      });
    }

    resetForm();
    loadExpenses();
  };

  const resetForm = () => {
    setText("");
    setAmount("");
    setEditingId(null);
    setShowModal(false);
  };

  // =========================
  // ACTIONS
  // =========================
  const handleToggle = async (id: string) => {
    await toggleExpense(id);
    loadExpenses();
  };

  const handleEdit = (exp: Expense) => {
    setText(exp.text);
    setAmount(String(exp.amount));
    setEditingId(exp._id);
    setShowModal(true);
  };

  const handleDelete = async (id: string) => {
    await deleteExpense(id);
    loadExpenses();
  };

  // =========================
  // DATE HELPERS
  // =========================
  const today = new Date();
  const yesterday = new Date(today);
  yesterday.setDate(today.getDate() - 1);

  const isToday = (dateStr: string) =>
    new Date(dateStr).toDateString() === today.toDateString();

  const isThisWeek = (dateStr: string) => {
    const d = new Date(dateStr);
    const startOfWeek = new Date(today);
    startOfWeek.setDate(today.getDate() - today.getDay());
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
  // FILTERED LIST (pending/done)
  // =========================
  const filteredExpenses = expenses
    .filter((exp) =>
      activeTab === "done"
        ? exp.done
        : activeTab === "pending"
        ? !exp.done
        : true
    )
    .sort(
      (a, b) =>
        new Date(b.createdAt).getTime() -
        new Date(a.createdAt).getTime()
    );

  // =========================
  // GROUP BY DATE
  // =========================
  const groupedExpenses: Record<string, Expense[]> = {};
  filteredExpenses.forEach((exp) => {
    const dateKey = new Date(exp.createdAt).toDateString();
    if (!groupedExpenses[dateKey]) groupedExpenses[dateKey] = [];
    groupedExpenses[dateKey].push(exp);
  });

  const sortedDates = Object.keys(groupedExpenses).sort(
    (a, b) => new Date(b).getTime() - new Date(a).getTime()
  );

  // =========================
  // GROUP BY MONTH (for totals only)
  // =========================
  const monthlyExpenses: Record<string, Expense[]> = {};

  expenses.forEach((exp) => {
    const d = new Date(exp.createdAt);
    const key = `${d.getFullYear()}-${d.getMonth()}`;

    if (!monthlyExpenses[key]) monthlyExpenses[key] = [];
    monthlyExpenses[key].push(exp);
  });

  const sortedMonths = Object.keys(monthlyExpenses).sort(
    (a, b) => new Date(b).getTime() - new Date(a).getTime()
  );

  // =========================
  // RENDER
  // =========================
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
      <div className="mb-4 grid grid-cols-3 gap-2 text-lg">
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
        {["pending", "done", "monthly"].map((tab) => (
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
        {activeTab === "monthly"
          ? sortedMonths.map((monthKey) => {
              const monthList = monthlyExpenses[monthKey];

              const total = monthList.reduce(
                (sum, e) => sum + e.amount,
                0
              );

              const date = new Date(monthList[0].createdAt);
              const label = date.toLocaleDateString(undefined, {
                month: "long",
                year: "numeric",
              });

              return (
                <li key={monthKey}>
                  <div className="flex justify-between items-center p-3 bg-[#1d1d1d] rounded-xl">
                    <span className="text-white font-medium">
                      {label}
                    </span>
                    <span className="text-[#01E777] font-bold">
                      ₱{total.toLocaleString()}
                    </span>
                  </div>
                </li>
              );
            })
          : sortedDates.map((date) => (
              <li key={date}>
                <div className="text-gray-400 text-[10px] mb-1 font-semibold">
                  {date === today.toDateString()
                    ? "Today"
                    : date === yesterday.toDateString()
                    ? "Yesterday"
                    : new Date(date).toLocaleDateString(undefined, {
                        month: "short",
                        day: "numeric",
                      })}
                </div>

                {groupedExpenses[date].map((exp) => (
                  <div
                    key={exp._id}
                    className={`flex justify-between items-center p-2 bg-[#1d1d1d] rounded-xl ${
                      exp.done ? "text-gray-700 line-through" : ""
                    }`}
                  >
                    <div className="flex flex-col">
                      <span
                        className={
                          exp.done ? "text-gray-700" : "text-white"
                        }
                      >
                        {exp.text}
                      </span>
                      <span className="text-[#01E777] text-xs">
                        ₱{exp.amount.toLocaleString()}
                      </span>
                      <span className="text-gray-600 text-[10px]">
                        {new Date(exp.createdAt).toLocaleTimeString(
                          undefined,
                          {
                            hour: "2-digit",
                            minute: "2-digit",
                          }
                        )}
                      </span>
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => handleEdit(exp)}
                        className="text-gray-400 hover:text-blue-400"
                      >
                        <PencilIcon className="w-4 h-4" />
                      </button>

                      <button
                        onClick={() => handleDelete(exp._id)}
                        className="text-gray-400 hover:text-red-500"
                      >
                        <TrashIcon className="w-4 h-4" />
                      </button>

                      <button onClick={() => handleToggle(exp._id)}>
                        <CheckIcon
                          className={`w-5 h-5 ${
                            exp.done
                              ? "text-[#01E777]"
                              : "text-gray-500"
                          }`}
                        />
                      </button>
                    </div>
                  </div>
                ))}
              </li>
            ))}
      </ul>

      {/* MODAL */}
      {showModal && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center">
          <div className="bg-[#1d1d1d] p-4 rounded-xl w-[90%] max-w-sm">
            <h2 className="text-white mb-3 font-semibold">
              {editingId ? "Edit Expense" : "Add Expense"}
            </h2>

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
              <button onClick={resetForm} className="px-3 py-1 text-gray-400">
                Cancel
              </button>

              <button
                onClick={handleSave}
                className="bg-[#01E777] text-black px-3 py-1 rounded font-bold"
              >
                {editingId ? "Update" : "Save"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ExpensesPage;