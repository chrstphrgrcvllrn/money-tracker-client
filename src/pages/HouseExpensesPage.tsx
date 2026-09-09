import { useEffect, useState } from "react";
import {
  fetchHouseExpenses,
  createHouseExpense,
  updateHouseExpense,
  deleteHouseExpense,
} from "../api/houseExpenses";

import type { HouseExpense } from "../types/houseExpense.type";
import { TrashIcon } from "@heroicons/react/24/solid";
import { HomeIcon } from "@heroicons/react/24/outline";

import Modal from "../components/Modal";
import { useToast } from "../components/useToast";

const BUDGET_STORAGE_KEY = "houseExpenseBudgets";

const HouseExpensesPage: React.FC = () => {
  const showToast = useToast();

  const [expenses, setExpenses] = useState<HouseExpense[]>([]);
  const [text, setText] = useState("");
  const [amount, setAmount] = useState("");
  const [category, setCategory] = useState("");

  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);

  const [activeTab, setActiveTab] = useState<
    "monthly" | "pending" | "biggest" | "graph"
  >("monthly");

  const [monthlyBudgets, setMonthlyBudgets] = useState<Record<string, number>>(() => {
    try {
      const saved = localStorage.getItem(BUDGET_STORAGE_KEY);
      return saved ? JSON.parse(saved) : {};
    } catch {
      return {};
    }
  });
  const [editingBudgetMonth, setEditingBudgetMonth] = useState<string | null>(null);
  const [budgetInput, setBudgetInput] = useState("");

  // =========================
  // LOAD
  // =========================
  const loadExpenses = async () => {
    try {
      const data = await fetchHouseExpenses();
      setExpenses(data);
    } catch (error) {
      console.error("Failed to load house expenses:", error);
      showToast("Failed to load expenses", "error");
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
      category,
    };

    try {
      if (editingId) {
        await updateHouseExpense(editingId, payload);
        showToast("Expense updated!", "success");
      } else {
        await createHouseExpense(payload);
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

  const handleEdit = (exp: HouseExpense) => {
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
      await deleteHouseExpense(editingId);
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

  const handleSaveBudget = (month: string) => {
    const budget = Number(budgetInput);
    if (isNaN(budget) || budget < 0) {
      showToast("Please enter a valid budget amount", "error");
      return;
    }

    const updated = { ...monthlyBudgets, [month]: budget };
    setMonthlyBudgets(updated);
    localStorage.setItem(BUDGET_STORAGE_KEY, JSON.stringify(updated));
    setEditingBudgetMonth(null);
    setBudgetInput("");
    showToast("Budget updated!", "success");
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

  // Billing cycle runs the 20th of one month through the 19th of the next
  // (e.g. September 20 - October 19), rather than a calendar month.
  const getCycleKey = (dateInput: string | Date) => {
    const d = new Date(dateInput);
    let year = d.getFullYear();
    let month = d.getMonth(); // 0-indexed

    if (d.getDate() < 20) {
      // belongs to the cycle that started the previous month
      month -= 1;
      if (month < 0) {
        month = 11;
        year -= 1;
      }
    }

    return `${year}-${String(month + 1).padStart(2, "0")}`;
  };

  const getCycleLabel = (key: string) => {
    const [yearStr, monthStr] = key.split("-");
    const year = parseInt(yearStr, 10);
    const month = parseInt(monthStr, 10) - 1;

    const startDate = new Date(year, month, 20);

    let endMonth = month + 1;
    let endYear = year;
    if (endMonth > 11) {
      endMonth = 0;
      endYear += 1;
    }
    const endDate = new Date(endYear, endMonth, 19);

    const startLabel = startDate.toLocaleDateString(undefined, {
      month: "long",
      day: "numeric",
    });
    const endLabel = endDate.toLocaleDateString(undefined, {
      month: "long",
      day: "numeric",
      year: "numeric",
    });

    return `${startLabel} - ${endLabel}`;
  };

  const isThisMonth = (d: string) => getCycleKey(d) === getCycleKey(today);

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

  const grouped: Record<string, HouseExpense[]> = {};
  pending.forEach((e) => {
    const key = new Date(e.createdAt).toDateString();
    if (!grouped[key]) grouped[key] = [];
    grouped[key].push(e);
  });

  const sortedDates = Object.keys(grouped).sort(
    (a, b) => new Date(b).getTime() - new Date(a).getTime()
  );

  // =========================
  // MONTHLY GROUP (key = cycle start YYYY-MM, e.g. "2026-09" for Sep 20 - Oct 19)
  // =========================
  const monthly: Record<string, HouseExpense[]> = {};

  expenses.forEach((e) => {
    const key = getCycleKey(e.createdAt);

    if (!monthly[key]) monthly[key] = [];
    monthly[key].push(e);
  });

  const sortedMonths = Object.keys(monthly).sort(
    (a, b) => new Date(b).getTime() - new Date(a).getTime()
  );

  // =========================
  // BIGGEST BY CATEGORY PER MONTH
  // =========================
  const biggest = Object.entries(monthly).map(([key, monthGroup]) => {
    const groupedByCategory = Object.values(
      monthGroup.reduce((acc: Record<string, HouseExpense[]>, e) => {
        const catKey = e.category || "Uncategorized";
        if (!acc[catKey]) acc[catKey] = [];
        acc[catKey].push(e);
        return acc;
      }, {})
    )
      .map((g) => ({
        name: g[0].category || "Uncategorized",
        total: g.reduce((s, e) => s + e.amount, 0),
      }))
      .sort((a, b) => b.total - a.total);

    return {
      key,
      label: getCycleLabel(key),
      data: groupedByCategory,
    };
  });

  const sortedBiggest = [...biggest].sort((a, b) => (a.key < b.key ? 1 : -1));

  // =========================
  // GRAPH DATA (CATEGORY PIE)
  // =========================
  const graphData = Object.values(
    expenses.reduce((acc: Record<string, HouseExpense[]>, e) => {
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
  return (
    <div className="text-xs max-w-md mx-auto mt-8 px-6 pb-6 bg-[var(--bg-page)] text-[var(--text-primary)]">

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
      <div className="flex justify-between mb-4">
        <div className="flex gap-2 flex-wrap">
          {["monthly", "pending", "biggest", "graph"].map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab as "monthly" | "pending" | "biggest" | "graph")}
              className={`px-2 py-1 rounded-xl text-xs capitalize ${
                activeTab === tab
                  ? "bg-[var(--btn-bg)] text-[var(--btn-text)] font-bold"
                  : "bg-[var(--bg-surface)] text-[var(--text-secondary)]"
              }`}
            >
              {tab}
            </button>
          ))}
        </div>

        <button
          onClick={() => setShowModal(true)}
          className="px-[0.7rem] py-[0.3rem] bg-[var(--btn-bg)] text-[var(--btn-text)] font-bold rounded-4xl text-sm"
        >
          +
        </button>
      </div>

      {/* ========================= */}
      {/* MONTHLY (with BUDGET + REMAINING) */}
      {/* ========================= */}
      {activeTab === "monthly" && (
        <div className="space-y-4">
          {sortedMonths.length === 0 ? (
            <div className="text-[var(--text-secondary)] text-center py-8">No expenses yet</div>
          ) : (
            sortedMonths.map((month) => {
              const monthExpenses = monthly[month];
              const monthTotal = monthExpenses.reduce((s, e) => s + e.amount, 0);
              const budget = monthlyBudgets[month] || 0;
              const remaining = budget - monthTotal;
              const monthLabel = getCycleLabel(month);

              return (
                <div key={month} className="bg-[var(--bg-surface)] rounded-xl p-4">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="shrink-0 w-9 h-9 rounded-lg flex items-center justify-center border border-[#2DE0E6]/40">
                      <HomeIcon className="w-4 h-4 text-[var(--text-primary)]" />
                    </div>
                    <h3 className="text-[var(--text-primary)] font-semibold">{monthLabel}</h3>
                  </div>

                  {/* BUDGET & REMAINING */}
                  <div className="space-y-2 mb-3">
                    <div className="bg-[var(--bg-input)] rounded-lg p-2">
                      <p className="text-[var(--text-secondary)] text-[10px]">Budget</p>
                      {editingBudgetMonth === month ? (
                        <div className="flex gap-1 mt-2">
                          <input
                            type="number"
                            value={budgetInput}
                            onChange={(e) => setBudgetInput(e.target.value)}
                            placeholder="0"
                            className="flex-1 px-2 py-2 bg-[var(--bg-surface)] text-[var(--text-primary)] border border-gray-600 rounded focus:border-[#2DE0E6]/50 outline-none text-sm"
                            autoFocus
                          />
                          <button
                            onClick={() => handleSaveBudget(month)}
                            className="px-3 py-2 bg-[var(--btn-bg)] text-[var(--btn-text)] text-xs font-bold rounded"
                          >
                            ✓
                          </button>
                          <button
                            onClick={() => setEditingBudgetMonth(null)}
                            className="px-3 py-2 bg-[var(--bg-input)] text-[var(--text-secondary)] text-xs font-bold rounded"
                          >
                            ✕
                          </button>
                        </div>
                      ) : (
                        <button
                          onClick={() => {
                            setEditingBudgetMonth(month);
                            setBudgetInput(String(budget));
                          }}
                          className="text-[#2DE0E6] font-bold mt-2 hover:underline text-sm"
                        >
                          {budget > 0 ? `₱${budget.toLocaleString()}` : "Set Budget"}
                        </button>
                      )}
                    </div>

                    <div className={`rounded-lg p-2 ${remaining >= 0 ? "bg-green-900/30" : "bg-red-900/30"}`}>
                      <p className="text-[var(--text-secondary)] text-[10px]">Remaining</p>
                      <p className={`font-bold mt-2 text-sm ${remaining >= 0 ? "text-[var(--text-primary)]" : "text-[#E23A55]"}`}>
                        {remaining < 0 ? "-" : ""}₱{Math.abs(remaining).toLocaleString()}
                      </p>
                    </div>
                  </div>

                  {/* TOTAL SPENT */}
                  <div className="mb-3 pb-3 border-b border-[var(--border-subtle)] flex justify-between text-[var(--text-primary)]">
                    <span>Total Spent</span>
                    <span className="font-bold text-[#2DE0E6]">₱{monthTotal.toLocaleString()}</span>
                  </div>

                  {/* EXPENSES LIST */}
                  <div className="space-y-2">
                    {monthExpenses.map((exp) => (
                      <button
                        key={exp._id}
                        onClick={() => handleEdit(exp)}
                        className="w-full flex justify-between items-center text-sm bg-[var(--bg-input)] p-2 rounded text-left"
                      >
                        <div className="flex-1 min-w-0">
                          <p className="text-[var(--text-primary)] truncate">{exp.text}</p>
                          <p className="text-[var(--text-secondary)] text-[10px]">{exp.category}</p>
                        </div>
                        <span className="text-[var(--text-secondary)] font-medium shrink-0">₱{exp.amount.toLocaleString()}</span>
                      </button>
                    ))}
                  </div>
                </div>
              );
            })
          )}
        </div>
      )}

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
                className={`w-full flex items-center gap-3 justify-between py-3 text-[var(--text-primary)] text-left ${
                  idx !== arr.length - 1 ? "border-b border-[var(--border-subtle)]" : ""
                }`}
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div className="shrink-0 w-9 h-9 rounded-lg flex items-center justify-center border border-[#2DE0E6]/40">
                    <HomeIcon className="w-4 h-4 text-[#2DE0E6]" />
                  </div>

                  <div className="min-w-0">
                    <div className="truncate">{exp.text} •   <span className="text-[var(--text-secondary)] text-[10px]">{exp.category}</span></div>

                    <div className="text-[#C93B8C] text-xs">
                      ₱{exp.amount.toLocaleString()}
                    </div>
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
          list="house-expense-categories"
          value={category}
          onChange={(e) => setCategory(e.target.value)}
        />
        <datalist id="house-expense-categories">
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

export default HouseExpensesPage;
