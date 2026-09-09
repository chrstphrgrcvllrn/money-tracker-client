import { useState, useEffect } from "react";
import type { SalaryEntry, Expense } from "../types/salary.type";
import {
  fetchSalaries,
  createSalary,
  updateSalary,
  deleteSalary
} from "../api/salary";

import { TrashIcon } from "@heroicons/react/24/solid";
import { CurrencyDollarIcon } from "@heroicons/react/24/outline";

import Modal from "../components/Modal";
import { useToast } from "../components/useToast";

export default function SalaryPage() {
  const showToast = useToast();

  const [salaryData, setSalaryData] = useState<SalaryEntry[]>([]);
  const [editingAllEntryId, setEditingAllEntryId] = useState<string | null>(null);
  const [editedExpenses, setEditedExpenses] = useState<Expense[]>([]);
  const [openMenuId, setOpenMenuId] = useState<string | null>(null);

  // ✅ MODAL STATE
  const [showForm, setShowForm] = useState(false);
  const [newSalaryDate, setNewSalaryDate] = useState("");
  const [newSalaryAmount, setNewSalaryAmount] = useState("");

  // ✅ EXPENSE MODAL STATE
  const [showExpenseForm, setShowExpenseForm] = useState(false);
  const [expenseName, setExpenseName] = useState("");
  const [expenseAmount, setExpenseAmount] = useState("");
  const [currentSalaryId, setCurrentSalaryId] = useState<string | null>(null);

  // ✅ DELETE SALARY MODAL STATE
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [salaryToDelete, setSalaryToDelete] = useState<string | null>(null);

  // ✅ TAB STATE
  const [activeTab, setActiveTab] = useState<"active" | "completed" | "totals">("active");

  const format = (value: unknown) => Number(value || 0).toLocaleString();

  useEffect(() => {
    const load = async () => {
      try {
        const data = await fetchSalaries();

        const normalized = data.map((entry) => ({
          ...entry,
          expenses: Array.isArray(entry.expenses) ? entry.expenses : [],
          salary: entry.salary ?? 0,
        }));

        setSalaryData(normalized);
      } catch (error) {
        console.error("Failed to load salaries:", error);
        showToast("Failed to load salaries", "error");
      }
    };

    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleAddSalary = async () => {
    if (!newSalaryDate || !newSalaryAmount) return;

    const salary = Number(newSalaryAmount);
    if (isNaN(salary)) return;

    try {
      const newEntry = await createSalary({
        date: newSalaryDate,
        salary,
        expenses: [],
      });

      setSalaryData((prev) => [
        ...prev,
        {
          ...newEntry,
          expenses: Array.isArray(newEntry.expenses) ? newEntry.expenses : [],
        },
      ]);

      setNewSalaryDate("");
      setNewSalaryAmount("");
      setShowForm(false);
      showToast("Salary added successfully!", "success");
    } catch (error) {
      console.error("Failed to add salary:", error);
      showToast("Failed to add salary", "error");
    }
  };

  const handleDuplicateSalary = async (entry: SalaryEntry) => {
    try {
      const duplicateEntry = await createSalary({
        date: entry.date + " (Copy)",
        salary: entry.salary,
        expenses: [...(entry.expenses ?? [])],
      });

      setSalaryData((prev) => [
        ...prev,
        {
          ...duplicateEntry,
          expenses: Array.isArray(duplicateEntry.expenses) ? duplicateEntry.expenses : [],
        },
      ]);
      showToast("Salary duplicated!", "success");
    } catch (error) {
      console.error("Failed to duplicate salary:", error);
      showToast("Failed to duplicate salary", "error");
    }
  };

  const handleEditSalary = async (id: string) => {
    const entry = salaryData.find((s) => s._id === id);
    if (!entry) return;

    const newSalary = Number(prompt("Update salary", String(entry.salary)));
    if (!isNaN(newSalary)) {
      try {
        const updated = await updateSalary(id, { salary: newSalary });

        setSalaryData((prev) =>
          prev.map((s) =>
            s._id === id
              ? { ...updated, expenses: Array.isArray(updated.expenses) ? updated.expenses : [] }
              : s
          )
        );
        showToast("Salary updated!", "success");
      } catch (error) {
        console.error("Failed to update salary:", error);
        showToast("Failed to update salary", "error");
      }
    }
  };

  const openDeleteSalaryModal = (id: string) => {
    setSalaryToDelete(id);
    setShowDeleteModal(true);
  };

  const handleConfirmDeleteSalary = async () => {
    if (!salaryToDelete) return;

    try {
      await deleteSalary(salaryToDelete);
      setSalaryData((prev) => prev.filter((s) => s._id !== salaryToDelete));
      setSalaryToDelete(null);
      setShowDeleteModal(false);
      showToast("Salary deleted!", "success");
    } catch (err) {
      console.error("Failed to delete salary:", err);
      showToast("Failed to delete salary", "error");
    }
  };

  const openAddExpenseModal = (salaryId: string) => {
    setCurrentSalaryId(salaryId);
    setExpenseName("");
    setExpenseAmount("");
    setShowExpenseForm(true);
  };

  const handleSaveExpense = async () => {
    if (!currentSalaryId || !expenseName || !expenseAmount) return;
    const amount = Number(expenseAmount);
    if (isNaN(amount)) return;

    const entry = salaryData.find((s) => s._id === currentSalaryId);
    if (!entry) return;

    const expenses = Array.isArray(entry.expenses) ? entry.expenses : [];
    const updatedExpenses = [...expenses, { name: expenseName, amount, paid: false }];

    try {
      const updated = await updateSalary(currentSalaryId, { expenses: updatedExpenses });

      setSalaryData((prev) =>
        prev.map((s) =>
          s._id === currentSalaryId
            ? { ...updated, expenses: Array.isArray(updated.expenses) ? updated.expenses : [] }
            : s
        )
      );

      setShowExpenseForm(false);
      setCurrentSalaryId(null);
      showToast("Expense added!", "success");
    } catch (error) {
      console.error("Failed to add expense:", error);
      showToast("Failed to add expense", "error");
    }
  };

  const handleTogglePaid = async (salaryId: string, index: number) => {
    const entry = salaryData.find((s) => s._id === salaryId);
    if (!entry) return;

    const expenses = Array.isArray(entry.expenses) ? entry.expenses : [];
    const updatedExpenses = expenses.map((e, i) =>
      i === index ? { ...e, paid: !e.paid } : e
    );

    try {
      const updated = await updateSalary(salaryId, { expenses: updatedExpenses });

      setSalaryData((prev) =>
        prev.map((s) =>
          s._id === salaryId
            ? { ...updated, expenses: Array.isArray(updated.expenses) ? updated.expenses : [] }
            : s
        )
      );
    } catch (error) {
      console.error("Failed to toggle expense:", error);
      showToast("Failed to update expense", "error");
    }
  };

  const handleEditAllExpenses = (entryId: string) => {
    const entry = salaryData.find((s) => s._id === entryId);
    if (!entry) return;

    const expenses = Array.isArray(entry.expenses) ? entry.expenses : [];
    setEditingAllEntryId(entryId);
    setEditedExpenses([...expenses]);
    setOpenMenuId(null);
  };

  const handleSaveAllExpenses = async (entryId: string) => {
    try {
      const updated = await updateSalary(entryId, { expenses: editedExpenses });

      setSalaryData((prev) =>
        prev.map((s) =>
          s._id === entryId
            ? { ...updated, expenses: Array.isArray(updated.expenses) ? updated.expenses : [] }
            : s
        )
      );

      setEditingAllEntryId(null);
      setEditedExpenses([]);
      showToast("Expenses updated successfully!", "success");
    } catch {
      showToast("Failed to update expenses.", "error");
    }
  };

  const handleCancelEditAll = () => {
    setEditingAllEntryId(null);
    setEditedExpenses([]);
  };

  const handleDeleteExpenseInEdit = (index: number) => {
    const newExpenses = editedExpenses.filter((_, i) => i !== index);
    setEditedExpenses(newExpenses);
  };

  const displayedSalaries = salaryData.filter((entry) => {
    const allPaid = entry.expenses.length > 0 && entry.expenses.every((e) => e.paid);

    if (activeTab === "completed") return allPaid;
    if (activeTab === "active") return !allPaid;
    if (activeTab === "totals") return false;
    return true;
  });

  const handleEditSalaryName = async (id: string) => {
    const entry = salaryData.find((s) => s._id === id);
    if (!entry) return;

    const newDate = prompt("Update salary name/date", entry.date);
    if (!newDate) return;

    try {
      const updated = await updateSalary(id, { date: newDate });

      setSalaryData((prev) =>
        prev.map((s) =>
          s._id === id ? { ...updated, expenses: Array.isArray(updated.expenses) ? updated.expenses : [] } : s
        )
      );

      showToast("Salary name updated!", "success");
    } catch (error) {
      showToast("Failed to update salary name.", "error");
      console.error(error);
    }
  };

  // Compute totals by expense name, sorted highest to lowest
  const calculateTotals = () => {
    const totalsMap: Record<string, number> = {};

    salaryData.forEach((entry) => {
      const expenses = Array.isArray(entry.expenses) ? entry.expenses : [];
      expenses.forEach((expense) => {
        if (!totalsMap[expense.name]) {
          totalsMap[expense.name] = 0;
        }
        totalsMap[expense.name] += Number(expense.amount || 0);
      });
    });

    return Object.entries(totalsMap)
      .map(([name, total]) => ({ name, total }))
      .sort((a, b) => b.total - a.total);
  };

  const totals = calculateTotals();

  return (
    <div className="text-xs max-w-md mx-auto mt-8 px-6 pb-6 bg-[#000000]">

      {/* ADD SALARY MODAL */}
      <Modal open={showForm} onClose={() => setShowForm(false)} title="Add Salary">
        <input
          type="text"
          placeholder="Date (e.g., May 2026)"
          value={newSalaryDate}
          onChange={(e) => setNewSalaryDate(e.target.value)}
          className="w-full px-3 py-2 bg-[#2C2C2E] text-sm text-[#EFE6D8] border border-gray-600 rounded-lg focus:border-[#C9A374]/50 outline-none"
        />
        <input
          type="number"
          placeholder="Salary amount"
          value={newSalaryAmount}
          onChange={(e) => setNewSalaryAmount(e.target.value)}
          className="w-full px-3 py-2 bg-[#2C2C2E] text-sm text-[#EFE6D8] border border-gray-600 rounded-lg focus:border-[#C9A374]/50 outline-none"
        />
        <div className="flex justify-end space-x-2 pt-2">
          <button
            onClick={() => setShowForm(false)}
            className="px-3 py-1 text-sm text-[#9C8F80]"
          >
            Cancel
          </button>
          <button
            onClick={handleAddSalary}
            className="px-3 py-1 bg-[#B5651D] text-black font-semibold rounded-lg text-sm"
          >
            Save
          </button>
        </div>
      </Modal>

      {/* ADD EXPENSE MODAL */}
      <Modal open={showExpenseForm} onClose={() => setShowExpenseForm(false)} title="Add Expense">
        <input
          type="text"
          placeholder="Expense name"
          value={expenseName}
          onChange={(e) => setExpenseName(e.target.value)}
          className="w-full px-3 py-2 bg-[#2C2C2E] text-sm text-[#EFE6D8] border border-gray-600 rounded-lg focus:border-[#C9A374]/50 outline-none"
        />
        <input
          type="number"
          placeholder="Expense amount"
          value={expenseAmount}
          onChange={(e) => setExpenseAmount(e.target.value)}
          className="w-full px-3 py-2 bg-[#2C2C2E] text-sm text-[#EFE6D8] border border-gray-600 rounded-lg focus:border-[#C9A374]/50 outline-none"
        />
        <div className="flex justify-end space-x-2 pt-2">
          <button
            onClick={() => setShowExpenseForm(false)}
            className="px-3 py-1 text-sm text-[#9C8F80]"
          >
            Cancel
          </button>
          <button
            onClick={handleSaveExpense}
            className="px-3 py-1 bg-[#B5651D] text-black font-semibold rounded-lg text-sm"
          >
            Save
          </button>
        </div>
      </Modal>

      {/* DELETE CONFIRM MODAL */}
      <Modal open={showDeleteModal} onClose={() => setShowDeleteModal(false)} title="Confirm Delete">
        <p className="text-[#9C8F80]">Are you sure you want to delete this salary?</p>
        <div className="flex justify-end space-x-2 pt-2">
          <button
            onClick={() => setShowDeleteModal(false)}
            className="px-3 py-1 text-sm text-[#9C8F80]"
          >
            Cancel
          </button>
          <button
            onClick={handleConfirmDeleteSalary}
            className="px-3 py-1 bg-red-500 text-[#EFE6D8] font-semibold rounded-lg text-sm"
          >
            Delete
          </button>
        </div>
      </Modal>

      <div className="flex mb-4 gap-2 justify-between flex-wrap">
        <div className="flex mb-4 gap-2">
          <button
            className={`px-3 py-1 rounded text-sm ${
              activeTab === "active" ? " bg-[#B5651D] text-black  font-bold" : "bg-[#1C1C1E] text-[#EFE6D8]"
            }`}
            onClick={() => setActiveTab("active")}
          >
            Active
          </button>
          <button
            className={`px-3 py-1 rounded text-sm ${
              activeTab === "completed" ? " bg-[#1C1C1E] text-[#EF6C54]  font-bold" : "bg-[#1C1C1E] text-[#9C8F80]"
            }`}
            onClick={() => setActiveTab("completed")}
          >
            Completed
          </button>
          <button
            className={`px-3 py-1 rounded text-sm ${
              activeTab === "totals" ? " bg-[#1C1C1E] text-[#FFFFFF]  font-bold" : "bg-[#1C1C1E] text-[#9C8F80]"
            }`}
            onClick={() => setActiveTab("totals")}
          >
            Totals
          </button>
        </div>

        <div className="mb-4 flex justify-between items-start">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setShowForm(true)}
              title="Add Salary"
              className="px-[0.7rem] py-[0.3rem]  bg-[#B5651D] text-black font-bold   rounded-4xl text-sm"
            >
              +
            </button>
          </div>
        </div>
      </div>

      {activeTab === "totals" ? (
        <div>
          {totals.length === 0 ? (
            <div className="text-[#9C8F80] text-center py-8">No expenses to show</div>
          ) : (
            totals.map((item, idx, arr) => (
              <div
                key={idx}
                className={`flex justify-between items-center py-3 ${
                  idx !== arr.length - 1 ? "border-b border-[#2A2420]" : ""
                }`}
              >
                <span className="text-[#EFE6D8] font-semibold">{item.name}</span>
                <span className="text-[#B5651D] font-bold">{format(item.total)}</span>
              </div>
            ))
          )}
        </div>
      ) : (
        displayedSalaries.map((entry) => {
          const expenses = Array.isArray(entry.expenses) ? entry.expenses : [];
          const totalExpenses = expenses.reduce((sum, exp) => sum + Number(exp.amount || 0), 0);
          const remaining = Number(entry.salary || 0) - totalExpenses;
          const isEditingAll = editingAllEntryId === entry._id;

          return (
            <div key={entry._id} className="mb-6 bg-[#1C1C1E] shadow rounded-xl p-4">
              <div className="flex justify-between items-center mb-2">
                <button onClick={() => handleEditSalaryName(entry._id)} className="flex items-center gap-3">
                  <div className="shrink-0 w-9 h-9 rounded-lg flex items-center justify-center border border-[#C9A374]/40">
                    <CurrencyDollarIcon className="w-4 h-4 text-[#C9A374]" />
                  </div>
                  <h2 className="font-semibold text-[1.5rem] text-[#EFE6D8]">{entry.date}</h2>
                </button>

                <div className="relative flex items-center">
                  <button
                    onClick={() =>
                      setOpenMenuId(openMenuId === entry._id ? null : entry._id)
                    }
                    className="text-[#9C8F80] text-lg px-2 leading-none"
                  >
                    •••
                  </button>

                  {openMenuId === entry._id && (
                    <div className="absolute right-0 top-7 min-w-[130px] bg-[#1C1C1E] border border-gray-800 rounded-xl shadow-lg z-30 py-1">
                      {!isEditingAll && expenses.length > 0 && (
                        <button
                          onClick={() => {
                            handleEditAllExpenses(entry._id);
                            setOpenMenuId(null);
                          }}
                          className="w-full text-left px-4 py-2 text-sm text-[#9C8F80] hover:bg-[#2A2A2D]"
                        >
                          Edit
                        </button>
                      )}

                      <button
                        onClick={() => {
                          openAddExpenseModal(entry._id);
                          setOpenMenuId(null);
                        }}
                        className="w-full text-left px-4 py-2 text-sm text-[#9C8F80] hover:bg-[#2A2A2D]"
                      >
                        Add
                      </button>

                      <button
                        onClick={() => {
                          handleDuplicateSalary(entry);
                          setOpenMenuId(null);
                        }}
                        className="w-full text-left px-4 py-2 text-sm text-[#9C8F80] hover:bg-[#2A2A2D]"
                      >
                        Duplicate
                      </button>

                      <button
                        onClick={() => {
                          openDeleteSalaryModal(entry._id);
                          setOpenMenuId(null);
                        }}
                        className="w-full text-left px-4 py-2 text-sm text-[#EF6C54] hover:bg-[#2A2A2D]"
                      >
                        Delete
                      </button>
                    </div>
                  )}
                </div>
              </div>

              <div className="flex justify-between text-[#EFE6D8] mb-2">
                <span>Salary</span>
                <button onClick={() => handleEditSalary(entry._id)}>
                  <span className="font-semibold text-[#C9A374]">{format(entry.salary)}</span>
                </button>
              </div>

              <ul className="border border-gray-800 rounded divide-y divide-mist-900 text-xs">
                {expenses.map((expense, idx) => (
                  <li key={idx} className="flex justify-between items-center gap-2 m-2">
                    {isEditingAll ? (
                      <input
                        type="text"
                        value={editedExpenses[idx]?.name || ""}
                        onChange={(e) => {
                          const newExpenses = [...editedExpenses];
                          if (newExpenses[idx]) {
                            newExpenses[idx].name = e.target.value;
                            setEditedExpenses(newExpenses);
                          }
                        }}
                        className="flex-1 border border-mist-900 px-2 py-1 rounded text-[#EFE6D8]"
                      />
                    ) : (
                      <span
                        onClick={() => handleTogglePaid(entry._id, idx)}
                        className={`flex-1 break-words cursor-pointer ${
                          expense.paid ? "line-through text-[#9C8F80]" : "text-[#EFE6D8]"
                        }`}
                      >
                        {expense.name}
                      </span>
                    )}

                    {isEditingAll ? (
                      <input
                        type="number"
                        value={editedExpenses[idx]?.amount || 0}
                        onChange={(e) => {
                          const newExpenses = [...editedExpenses];
                          if (newExpenses[idx]) {
                            newExpenses[idx].amount = Number(e.target.value);
                            setEditedExpenses(newExpenses);
                          }
                        }}
                        className="w-24 text-right border border-mist-900 px-2 py-1 rounded text-[#EFE6D8]"
                      />
                    ) : (
                      <span
                        className={`w-24 text-right font-medium ${
                          expense.paid ? "line-through text-[#9C8F80]" : "text-[#EFE6D8]"
                        }`}
                      >
                        {format(expense.amount)}
                      </span>
                    )}

                    {isEditingAll && (
                      <button
                        onClick={() => handleDeleteExpenseInEdit(idx)}
                        className="px-2 py-1 text-[#EFE6D8] text-sm border border-red-500 rounded hover:bg-red-500/20"
                      >
                        <TrashIcon className="w-4 h-4 text-red-400" />
                      </button>
                    )}
                  </li>
                ))}
              </ul>

              {isEditingAll && (
                <div className="flex gap-2 mt-2">
                  <button
                    onClick={() => handleSaveAllExpenses(entry._id)}
                    className="px-3 py-1 bg-[#B5651D] text-black font-bold rounded text-sm"
                  >
                    Save All
                  </button>
                  <button
                    onClick={handleCancelEditAll}
                    className="px-3 py-1 bg-[#B5651D] text-black font-bold rounded text-sm"
                  >
                    Cancel
                  </button>
                </div>
              )}

              <div className="flex justify-between font-semibold pt-2 mb-2">
                <span className="text-[#EFE6D8]">Total</span>
                <span className="text-[#B2597C]">{format(totalExpenses)}</span>
              </div>

              <div className="flex justify-between font-semibold">
                <span></span>
                <span className={`${remaining < 0 ? "text-[#B2597C]" : "text-[#FFFFFF]"}`}>
                  {format(remaining)}
                </span>
              </div>
            </div>
          );
        })
      )}
    </div>
  );
}
