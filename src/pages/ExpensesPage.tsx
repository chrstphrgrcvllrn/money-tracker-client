import { useEffect, useState } from "react";
import {
  fetchExpenses,
  createExpense,
  updateExpense,
  deleteExpense,
} from "../api/expenses";

import type { Expense } from "../types/expenses.type";
import { TrashIcon, ReceiptPercentIcon } from "@heroicons/react/24/solid";
import Modal from "../components/Modal";
import { useToast } from "../components/useToast";
import SlidingTabs from "../components/SlidingTabs";
import { SkeletonBlock, SkeletonRows } from "../components/Skeleton";

const ExpensesPage: React.FC = () => {
  const showToast = useToast();

  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [loading, setLoading] = useState(true);
  const [text, setText] = useState("");
  const [amount, setAmount] = useState("");
  const [category, setCategory] = useState("");

  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);

  const [activeTab, setActiveTab] = useState<
    "pending" | "monthly" | "biggest" | "graph"
  >("pending");

  // =========================
  // LOAD
  // =========================
  const loadExpenses = async () => {
    try {
      const data = await fetchExpenses();
      setExpenses(data);
    } catch (error) {
      console.error("Failed to load expenses:", error);
      showToast("Failed to load expenses", "error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadExpenses();
    // eslint-disable-next-line react-hooks/exhaustive-deps
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

    try {
      if (editingId) {
        await updateExpense(editingId, payload);
        showToast("Expense updated!", "success");
      } else {
        await createExpense(payload);
        showToast("Expense added!", "success");
      }

      resetForm();
      loadExpenses();
    } catch (error) {
      console.error("Failed to save expense:", error);
      showToast("Failed to save expense", "error");
    }
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

  const handleDelete = async () => {
    if (!editingId) return;
    if (!confirm("Delete this expense?")) return;

    setDeleting(true);

    try {
      await deleteExpense(editingId);
      loadExpenses();
      showToast("Expense deleted!", "success");
      resetForm();
    } catch (error) {
      console.error("Failed to delete expense:", error);
      showToast("Failed to delete expense", "error");
    } finally {
      setDeleting(false);
    }
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
)
  .map((g) => ({
    name: g[0].category || "Uncategorized",
    total: g.reduce((s, e) => s + e.amount, 0),
  }))
  .sort((a, b) => b.total - a.total); // 👈 SORT HERE

  const totalGraph = graphData.reduce((s, i) => s + i.total, 0);

  const existingCategories = Array.from(
    new Set(expenses.map((e) => e.category).filter((c): c is string => !!c))
  ).sort((a, b) => a.localeCompare(b));

  const colors = [
    "#2DE0E6",
    "#FFFFFF",
    "#C93B8C",
    "#60A5FA",
    "#F97316",
    "#A78BFA",
  ];



  // =========================
  // RENDER
  // =========================
  if (loading) {
    return (
      <div className="text-xs max-w-md mx-auto mt-8 px-6 pb-6">
        <SkeletonBlock className="h-16 w-full mb-4" />
        <SkeletonBlock className="h-8 w-full mb-4" />
        <SkeletonRows count={5} />
      </div>
    );
  }

  return (
    <div className="text-xs max-w-md mx-auto mt-8 px-6 pb-6">

      {/* TOTALS */}
      <div className="mb-4 grid grid-cols-3 gap-2 text-lg">
        <div className="bg-[var(--bg-surface)] p-2 rounded-xl">
          <p className="text-[var(--text-primary)] font-bold">Today</p>
          <p className="text-[var(--text-primary)] font-bold">₱{totalToday.toLocaleString()}</p>
        </div>
        <div className="bg-[var(--bg-surface)] p-2 rounded-xl">
          <p className="text-[var(--text-primary)] font-bold">Week</p>
          <p className="text-[var(--text-primary)] font-bold">₱{totalWeek.toLocaleString()}</p>
        </div>
        <div className="bg-[var(--bg-surface)] p-2 rounded-xl">
          <p className="text-[var(--text-primary)] font-bold">Month</p>
          <p className="text-[var(--text-primary)] font-bold">₱{totalMonth.toLocaleString()}</p>
        </div>
      </div>

      {/* TABS */}
      <div className="flex justify-between mb-4 gap-2">
        <SlidingTabs
          tabs={[
            { value: "pending", label: "Pending" },
            { value: "monthly", label: "Monthly" },
            { value: "biggest", label: "Biggest" },
            { value: "graph", label: "Graph" },
          ]}
          active={activeTab}
          onChange={setActiveTab}
        />

        <button
          onClick={() => setShowModal(true)}
          className="px-[0.7rem] py-[0.3rem] bg-[var(--btn-bg)] text-[var(--btn-text)] font-bold rounded-4xl text-sm"
        >
          +
        </button>
      </div>

      {/* ========================= */}
      {/* BIGGEST */}
      {/* ========================= */}
      {activeTab === "biggest" &&
        sortedBiggest.map((m) => (
          <div key={m.label} className="mb-4">
            <div className="text-[var(--text-secondary)] text-[10px] mb-2">{m.label}</div>

            {m.data.map((item, idx, arr) => (
              <div
                key={item.name}
                className={`flex justify-between py-2.5 text-[var(--text-primary)] ${
                  idx !== arr.length - 1 ? "border-b border-[var(--border-subtle)]" : ""
                }`}
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
              <div className="absolute inset-0 flex flex-col items-center justify-center text-[var(--text-primary)]">
                <div className="text-lg font-bold">
                  ₱{totalGraph.toLocaleString()}
                </div>
              </div>
            </div>
          </div>

         {graphData.map((g, i) => (
            <div
              key={g.name}
              className="flex justify-between items-center p-2 rounded-xl text-[var(--text-primary)]"
            >
              <div className="flex items-center gap-2">
                <span
                  className="w-2.5 h-2.5 rounded-full"
                  style={{ backgroundColor: colors[i % colors.length] }}
                />
                <span>{g.name}</span>
              </div>

              <span>₱{g.total.toLocaleString()}</span>
            </div>
          ))}
        </div>
      )}

      {/* ========================= */}
      {/* MONTHLY */}
      {/* ========================= */}
      {activeTab === "monthly" &&
        sortedMonths.map((key, idx, arr) => {
          const list = monthly[key];
          const total = list.reduce((s, e) => s + e.amount, 0);
          const date = new Date(list[0].createdAt);

          return (
            <div
              key={key}
              className={`flex justify-between py-3 text-[var(--text-primary)] ${
                idx !== arr.length - 1 ? "border-b border-[var(--border-subtle)]" : ""
              }`}
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
          <div key={date} className="mb-4">
            <div className="text-[var(--text-secondary)] text-[10px] mb-1">
              {date === today.toDateString()
                ? "Today"
                : date === yesterday.toDateString()
                ? "Yesterday"
                : new Date(date).toLocaleDateString(undefined, {
                    month: "short",
                    day: "numeric",
                  })}
            </div>

            {grouped[date].map((exp, idx, arr) => (
              <button
                key={exp._id}
                onClick={() => handleEdit(exp)}
                className={`w-full flex items-center gap-3 py-3 text-left ${
                  idx !== arr.length - 1 ? "border-b border-[var(--border-subtle)]" : ""
                }`}
              >
                <div className="shrink-0 w-9 h-9 rounded-lg flex items-center justify-center border border-[#2DE0E6]/40">
                  <ReceiptPercentIcon className="w-4 h-4 text-[var(--text-primary)]" />
                </div>

                <div className="flex-1 min-w-0">
                  <div className="text-[var(--text-primary)] truncate">
                    {exp.text} •{" "}
                    <span className="text-[var(--text-secondary)] text-[10px]">{exp.category}</span>
                  </div>

                  <div className="text-[#C93B8C] text-xs">
                    ₱{exp.amount.toLocaleString()}
                  </div>
                </div>
              </button>
            ))}
          </div>
        ))}

      {/* ========================= */}
      {/* MODAL */}
      {/* ========================= */}
      <Modal
        open={showModal}
        onClose={resetForm}
        title={editingId ? "Edit Expense" : "Add Expense"}
      >
        <input
          className="w-full px-3 py-2 bg-[var(--bg-input)] text-[var(--text-primary)] border border-gray-600 rounded-lg focus:border-[#2DE0E6]/50 outline-none"
          placeholder="Expense"
          value={text}
          onChange={(e) => setText(e.target.value)}
        />

        <input
          className="w-full px-3 py-2 bg-[var(--bg-input)] text-[var(--text-primary)] border border-gray-600 rounded-lg focus:border-[#2DE0E6]/50 outline-none"
          placeholder="Amount"
          type="number"
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
        />

        <input
          className="w-full px-3 py-2 bg-[var(--bg-input)] text-[var(--text-primary)] border border-gray-600 rounded-lg focus:border-[#2DE0E6]/50 outline-none"
          placeholder="Category"
          list="expense-categories"
          value={category}
          onChange={(e) => setCategory(e.target.value)}
        />
        <datalist id="expense-categories">
          {existingCategories.map((cat) => (
            <option key={cat} value={cat} />
          ))}
        </datalist>

        <div className="flex items-center gap-2 pt-2">
          {editingId && (
            <button
              onClick={handleDelete}
              disabled={deleting}
              className="flex items-center justify-center gap-2 px-4 py-2 text-red-400 hover:text-red-500 border border-red-500/30 hover:border-red-500/50 rounded-lg disabled:opacity-50"
            >
              <TrashIcon className="w-4 h-4" />
              {deleting ? "Deleting..." : "Delete"}
            </button>
          )}

          <button
            onClick={resetForm}
            className="flex-1 p-2 bg-[var(--bg-input)] text-gray-400 rounded-lg hover:text-[var(--text-primary)]"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            className="flex-1 bg-[var(--btn-bg)] text-[var(--btn-text)] font-bold p-2 rounded-lg"
          >
            Save
          </button>
        </div>
      </Modal>
    </div>
  );
};

export default ExpensesPage;
