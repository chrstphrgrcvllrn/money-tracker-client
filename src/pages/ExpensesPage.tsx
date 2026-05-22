import { useEffect, useState } from "react";
import {
  fetchExpenses,
  createExpense,
  updateExpense,
  deleteExpense,
} from "../api/expenses";

import type { Expense } from "../types/expenses.type";
import { PencilIcon, TrashIcon } from "@heroicons/react/24/solid";

const ExpensesPage: React.FC = () => {
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [text, setText] = useState("");
  const [amount, setAmount] = useState("");
  const [category, setCategory] = useState("");

  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  const [activeTab, setActiveTab] = useState<
    "pending" | "monthly" | "biggest" | "graph"
  >("pending");

  // =========================
  // LOAD
  // =========================
  const loadExpenses = async () => {
    const data = await fetchExpenses();
    setExpenses(data);
  };

  useEffect(() => {
    loadExpenses();
  }, []);

  // =========================
  // SAVE
  // =========================
  const handleSave = async () => {
    if (!text.trim() || !amount) return;

    const payload = {
       text: text.trim(),
      amount: Number(amount),
      category, // 👈 add this
    };

    if (editingId) {
      await updateExpense(editingId, payload);
    } else {
      await createExpense(payload);
    }

    resetForm();
    loadExpenses();
  };

  const resetForm = () => {
    setText("");
    setAmount("");
    setCategory("");
    setEditingId(null);
    setShowModal(false);
  };

  const handleEdit = (exp: Expense) => {
    setText(exp.text);
    setAmount(String(exp.amount));
    setCategory(exp.category || "");
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
  const yesterday = new Date();
  yesterday.setDate(today.getDate() - 1);

  const isToday = (d: string) =>
    new Date(d).toDateString() === today.toDateString();

  const isThisWeek = (d: string) => {
    const date = new Date(d);
    const start = new Date(today);
    start.setDate(today.getDate() - today.getDay());

    const end = new Date(start);
    end.setDate(start.getDate() + 6);

    return date >= start && date <= end;
  };

  const isThisMonth = (d: string) =>
    new Date(d).getMonth() === today.getMonth() &&
    new Date(d).getFullYear() === today.getFullYear();

  // =========================
  // TOTALS
  // =========================
  const totalToday = expenses
    .filter((e) => isToday(e.createdAt))
    .reduce((s, e) => s + e.amount, 0);

  const totalWeek = expenses
    .filter((e) => isThisWeek(e.createdAt))
    .reduce((s, e) => s + e.amount, 0);

  const totalMonth = expenses
    .filter((e) => isThisMonth(e.createdAt))
    .reduce((s, e) => s + e.amount, 0);

  // =========================
  // PENDING GROUP
  // =========================
  const pending = expenses;

  const grouped: Record<string, Expense[]> = {};
  pending.forEach((e) => {
    const key = new Date(e.createdAt).toDateString();
    if (!grouped[key]) grouped[key] = [];
    grouped[key].push(e);
  });

  const sortedDates = Object.keys(grouped).sort(
    (a, b) => new Date(b).getTime() - new Date(a).getTime()
  );

  // =========================
  // MONTHLY GROUP
  // =========================
  const monthly: Record<string, Expense[]> = {};

  expenses.forEach((e) => {
    const d = new Date(e.createdAt);
    const key = `${d.getFullYear()}-${d.getMonth()}`;

    if (!monthly[key]) monthly[key] = [];
    monthly[key].push(e);
  });

  const sortedMonths = Object.keys(monthly).sort(
    (a, b) => new Date(b).getTime() - new Date(a).getTime()
  );

  // =========================
  // BIGGEST BY CATEGORY PER MONTH
  // =========================
  const biggest = Object.values(monthly).map((monthGroup) => {
    const groupedByCategory = Object.values(
      monthGroup.reduce((acc: Record<string, Expense[]>, e) => {
        const key = e.category || "Uncategorized";
        if (!acc[key]) acc[key] = [];
        acc[key].push(e);
        return acc;
      }, {})
    )
      .map((g) => ({
        name: g[0].category || "Uncategorized",
        total: g.reduce((s, e) => s + e.amount, 0),
      }))
      .sort((a, b) => b.total - a.total);

    const date = new Date(monthGroup[0].createdAt);

    return {
      label: date.toLocaleDateString(undefined, {
        month: "long",
        year: "numeric",
      }),
      data: groupedByCategory,
    };
  });

  const sortedBiggest = [...biggest].sort(
    (a, b) => new Date(b.label).getTime() - new Date(a.label).getTime()
  );

  // =========================
  // GRAPH DATA (CATEGORY PIE)
  // =========================
  const graphData = Object.values(
    expenses.reduce((acc: Record<string, Expense[]>, e) => {
      const key = e.category || "Uncategorized";
      if (!acc[key]) acc[key] = [];
      acc[key].push(e);
      return acc;
    }, {})
  ).map((g) => ({
    name: g[0].category || "Uncategorized",
    total: g.reduce((s, e) => s + e.amount, 0),
  }));

  const totalGraph = graphData.reduce((s, i) => s + i.total, 0);

  const colors = [
    "#DFF966",
    "#85D989",
    "#B2597C",
    "#60A5FA",
    "#F97316",
    "#A78BFA",
  ];

  // =========================
  // RENDER
  // =========================
  return (
    <div className="text-xs max-w-md mx-auto mt-8 px-6 pb-6">

      {/* TOTALS */}
      <div className="mb-4 grid grid-cols-3 gap-2 text-lg">
        <div className="bg-[#1C1C1E] p-2 rounded-xl">
          <p className="text-white font-bold">Today</p>
          <p className="text-[#85D989] font-bold">₱{totalToday.toLocaleString()}</p>
        </div>
        <div className="bg-[#1C1C1E] p-2 rounded-xl">
          <p className="text-white font-bold">Week</p>
          <p className="text-[#85D989] font-bold">₱{totalWeek.toLocaleString()}</p>
        </div>
        <div className="bg-[#1C1C1E] p-2 rounded-xl">
          <p className="text-white font-bold">Month</p>
          <p className="text-[#85D989] font-bold">₱{totalMonth.toLocaleString()}</p>
        </div>
      </div>

      {/* TABS */}
      <div className="flex justify-between mb-4">
        <div className="flex gap-2 flex-wrap">
          {["pending", "monthly", "biggest", "graph"].map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab as any)}
              className={`px-2 py-1 rounded-xl text-xs capitalize ${
                activeTab === tab
                  ? "bg-[#DFF966] text-black font-bold"
                  : "bg-[#1C1C1E] text-gray-400"
              }`}
            >
              {tab}
            </button>
          ))}
        </div>

        <button
          onClick={() => setShowModal(true)}
          className="px-[0.7rem] py-[0.3rem] bg-[#DFF966] text-black font-bold rounded-4xl text-sm"
        >
          +
        </button>
      </div>

      {/* ========================= */}
      {/* BIGGEST */}
      {/* ========================= */}
      {activeTab === "biggest" &&
        sortedBiggest.map((m) => (
          <div key={m.label} className="mb-3">
            <div className="text-gray-400 text-[10px] mb-2">{m.label}</div>

            {m.data.map((item) => (
              <div
                key={item.name}
                className="flex justify-between bg-[#1C1C1E] p-3 rounded-xl mb-2 text-white"
              >
                <span>{item.name}</span>
                <span>₱{item.total.toLocaleString()}</span>
              </div>
            ))}
          </div>
        ))}

      {/* ========================= */}
      {/* GRAPH */}
      {/* ========================= */}
      {activeTab === "graph" && (
        <div className="space-y-3">

          <div className="flex justify-center">
            <div
              className="w-48 h-48 rounded-full relative"
              style={{
                background: `conic-gradient(${graphData
                  .map((item, i) => {
                    const start =
                      graphData
                        .slice(0, i)
                        .reduce((s, d) => s + d.total, 0) / totalGraph;

                    const end = start + item.total / totalGraph;

                    return `${colors[i % colors.length]} ${
                      start * 360
                    }deg ${end * 360}deg`;
                  })
                  .join(", ")})`,
              }}
            >
              <div className="absolute inset-0 flex flex-col items-center justify-center text-white">
                <div className="text-lg font-bold">
                  ₱{totalGraph.toLocaleString()}
                </div>
              </div>
            </div>
          </div>

          {graphData.map((g) => (
            <div
              key={g.name}
              className="flex justify-between bg-[#1C1C1E] p-2 rounded-xl text-white"
            >
              <span>{g.name}</span>
              <span>₱{g.total.toLocaleString()}</span>
            </div>
          ))}
        </div>
      )}

      {/* ========================= */}
      {/* MONTHLY */}
      {/* ========================= */}
      {activeTab === "monthly" &&
        sortedMonths.map((key) => {
          const list = monthly[key];
          const total = list.reduce((s, e) => s + e.amount, 0);
          const date = new Date(list[0].createdAt);

          return (
            <div
              key={key}
              className="flex justify-between bg-[#1C1C1E] p-3 rounded-xl mb-2 text-white"
            >
              <span>
                {date.toLocaleDateString(undefined, {
                  month: "long",
                  year: "numeric",
                })}
              </span>
              <span>₱{total.toLocaleString()}</span>
            </div>
          );
        })}

      {/* ========================= */}
      {/* PENDING */}
      {/* ========================= */}
      {activeTab === "pending" &&
        sortedDates.map((date) => (
          <div key={date} className="mb-3">
            <div className="text-gray-400 text-[10px] mb-1">
              {date === today.toDateString()
                ? "Today"
                : date === yesterday.toDateString()
                ? "Yesterday"
                : new Date(date).toLocaleDateString(undefined, {
                    month: "short",
                    day: "numeric",
                  })}
            </div>

            {grouped[date].map((exp) => (
              <div
                key={exp._id}
                className="flex justify-between bg-[#1C1C1E] p-2 rounded-xl mb-2 text-white"
              >
                <div>
                  <div>{exp.text} •   <span className="text-gray-400 text-[10px]">{exp.category}</span></div>
                 


                  <div className="text-[#B2597C] text-xs">
                    ₱{exp.amount.toLocaleString()}
                  </div>
                </div>

                <div className="flex gap-2">
                  <button onClick={() => handleEdit(exp)}>
                    <PencilIcon className="w-4 h-4" />
                  </button>
                  <button onClick={() => handleDelete(exp._id)}>
                    <TrashIcon className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        ))}

      {/* ========================= */}
      {/* MODAL */}
      {/* ========================= */}
      {showModal && (
        <div className="fixed inset-0 bg-black/30 flex items-center justify-center">
          <div className="bg-[#1C1C1E] p-4 rounded-xl w-[90%] max-w-sm">

            <input
              className="w-full mb-2 p-2 bg-black text-white"
              placeholder="Expense"
              value={text}
              onChange={(e) => setText(e.target.value)}
            />

            <input
              className="w-full mb-2 p-2 bg-black text-white"
              placeholder="Amount"
              type="number"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
            />

            <input
              className="w-full mb-3 p-2 bg-black text-white"
              placeholder="Category"
              value={category}
              onChange={(e) => setCategory(e.target.value)}
            />

            <button
              onClick={handleSave}
              className="w-full bg-[#DFF966] text-black font-bold p-2 rounded"
            >
              Save
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default ExpensesPage;