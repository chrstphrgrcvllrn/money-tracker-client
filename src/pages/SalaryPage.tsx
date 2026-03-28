import { useState, useEffect } from "react";
import type { SalaryEntry, Expense } from "../types/salary.type";
import {
  fetchSalaries,
  createSalary,
  updateSalary,
} from "../api/salary";

export default function SalaryPage() {
  const [salaryData, setSalaryData] = useState<SalaryEntry[]>([]);
  const [editingAllEntryId, setEditingAllEntryId] = useState<string | null>(null);
  const [editedExpenses, setEditedExpenses] = useState<Expense[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [newSalaryDate, setNewSalaryDate] = useState("");
  const [newSalaryAmount, setNewSalaryAmount] = useState("");
  const [activeTab, setActiveTab] = useState<"all" | "completed">("all");

  const format = (value: any) => Number(value || 0).toLocaleString();

  useEffect(() => {
    const load = async () => {
      const data = await fetchSalaries();
      const normalized = data.map((entry) => ({
        ...entry,
        expenses: Array.isArray(entry.expenses) ? entry.expenses : [],
        salary: entry.salary ?? 0,
      }));
      setSalaryData(normalized);
    };
    load();
  }, []);

  const handleAddSalary = async () => {
    if (!newSalaryDate || !newSalaryAmount) return;
    const salary = Number(newSalaryAmount);
    if (isNaN(salary)) return;

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
  };

  const handleEditSalary = async (id: string) => {
    const entry = salaryData.find((s) => s._id === id);
    if (!entry) return;

    const newSalary = Number(prompt("Update salary", String(entry.salary)));
    if (!isNaN(newSalary)) {
      const updated = await updateSalary(id, { salary: newSalary });
      setSalaryData((prev) =>
        prev.map((s) =>
          s._id === id
            ? {
                ...updated,
                expenses: Array.isArray(updated.expenses) ? updated.expenses : [],
              }
            : s
        )
      );
    }
  };

  const handleDeleteExpense = async (salaryId: string, index: number) => {
    if (!confirm("Delete this expense?")) return;
    const entry = salaryData.find((s) => s._id === salaryId);
    if (!entry) return;

    const expenses = Array.isArray(entry.expenses) ? entry.expenses : [];
    const updatedExpenses = expenses.filter((_, i) => i !== index);

    const updated = await updateSalary(salaryId, { expenses: updatedExpenses });
    setSalaryData((prev) =>
      prev.map((s) =>
        s._id === salaryId
          ? { ...updated, expenses: Array.isArray(updated.expenses) ? updated.expenses : [] }
          : s
      )
    );
  };

  const handleAddExpense = async (salaryId: string) => {
    const name = prompt("Expense name");
    const amount = Number(prompt("Expense amount"));
    if (!name || isNaN(amount)) return;

    const entry = salaryData.find((s) => s._id === salaryId);
    if (!entry) return;

    const expenses = Array.isArray(entry.expenses) ? entry.expenses : [];
    const updatedExpenses = [...expenses, { name, amount, paid: false }];
    const updated = await updateSalary(salaryId, { expenses: updatedExpenses });

    setSalaryData((prev) =>
      prev.map((s) =>
        s._id === salaryId
          ? { ...updated, expenses: Array.isArray(updated.expenses) ? updated.expenses : [] }
          : s
      )
    );
  };

  const handleTogglePaid = async (salaryId: string, index: number) => {
    const entry = salaryData.find((s) => s._id === salaryId);
    if (!entry) return;

    const expenses = Array.isArray(entry.expenses) ? entry.expenses : [];
    const updatedExpenses = expenses.map((e, i) =>
      i === index ? { ...e, paid: !e.paid } : e
    );

    const updated = await updateSalary(salaryId, { expenses: updatedExpenses });
    setSalaryData((prev) =>
      prev.map((s) =>
        s._id === salaryId
          ? { ...updated, expenses: Array.isArray(updated.expenses) ? updated.expenses : [] }
          : s
      )
    );
  };

  const handleEditAllExpenses = (entryId: string) => {
    const entry = salaryData.find((s) => s._id === entryId);
    if (!entry) return;
    setEditingAllEntryId(entryId);
    setEditedExpenses([...entry.expenses]);
  };

  const handleSaveAllExpenses = async (entryId: string) => {
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
  };

  const handleCancelEditAll = () => {
    setEditingAllEntryId(null);
    setEditedExpenses([]);
  };

  // Filter based on tab
  const filteredSalaries = salaryData.filter((entry) => {
    if (activeTab === "completed") {
      return entry.expenses.length > 0 && entry.expenses.every((e) => e.paid);
    }
    return true; // "all" tab
  });

  return (
    <div className="text-xs max-w-md mx-auto mt-8 px-6 pb-6 bg-[#111111]">
      <div className="mb-4 flex justify-between items-start">
        <h1 className="text-lg font-semibold text-white">Salary</h1>

        <div className="flex items-center gap-3">
          <button
            onClick={() => setShowForm(true)}
            title="Add Salary"
            className="mb-0 px-[0.7rem] py-[0.3rem] bg-[#01E777] text-black font-bold rounded-4xl text-sm"
          >
            +
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 mb-4">
        <button
          onClick={() => setActiveTab("all")}
          className={`px-3 py-1 rounded ${
            activeTab === "all" ? "bg-[#01E777] text-black" : "bg-gray-800 text-white"
          }`}
        >
          All
        </button>
        <button
          onClick={() => setActiveTab("completed")}
          className={`px-3 py-1 rounded ${
            activeTab === "completed" ? "bg-[#01E777] text-black" : "bg-gray-800 text-white"
          }`}
        >
          Completed
        </button>
      </div>

      {/* Salary List */}
      {filteredSalaries.map((entry) => {
        const expenses = Array.isArray(entry.expenses) ? entry.expenses : [];
        const totalExpenses = expenses.reduce((sum, exp) => sum + Number(exp.amount || 0), 0);
        const remaining = Number(entry.salary || 0) - totalExpenses;
        const isEditingAll = editingAllEntryId === entry._id;

        return (
          <div key={entry._id} className="mb-6 bg-[#1d1d1d] shadow rounded-xl p-4">
            <div className="flex justify-between items-center mb-2">
              <h2 className="font-semibold text-lg text-white">{entry.date}</h2>
              <div className="flex gap-4">
                {!isEditingAll && expenses.length > 0 && (
                  <button onClick={() => handleEditAllExpenses(entry._id)} className="text-gray-500 text-sm">
                    Edit
                  </button>
                )}
                <button onClick={() => handleAddExpense(entry._id)} className="text-gray-500 text-sm">
                  Add
                </button>
              </div>
            </div>

            <div className="flex justify-between text-gray-500 mb-2">
              <span>Salary</span>
              <button onClick={() => handleEditSalary(entry._id)}>
                <span className="font-semibold text-[#01E777]">{format(entry.salary)}</span>
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
                      className="flex-1 border border-mist-900 px-2 py-1 rounded text-white"
                    />
                  ) : (
                    <span
                      onClick={() => handleTogglePaid(entry._id, idx)}
                      className={`flex-1 break-words cursor-pointer ${
                        expense.paid ? "line-through text-gray-500" : "text-white"
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
                      className="w-24 text-right border border-mist-900 px-2 py-1 rounded text-white"
                    />
                  ) : (
                    <span
                      className={`w-24 text-right font-medium ${
                        expense.paid ? "line-through text-gray-500" : "text-white"
                      }`}
                    >
                      {format(expense.amount)}
                    </span>
                  )}

                  {isEditingAll && (
                    <button
                      onClick={() => handleDeleteExpense(entry._id, idx)}
                      className="px-2 py-1 text-white text-sm border border-mist-900 rounded"
                    >
                      Delete
                    </button>
                  )}
                </li>
              ))}
            </ul>

            {isEditingAll && (
              <div className="flex gap-2 mt-2">
                <button onClick={() => handleSaveAllExpenses(entry._id)} className="px-3 py-1 bg-[#01E777] font-bold rounded text-sm">
                  Save All
                </button>
                <button onClick={handleCancelEditAll} className="px-3 py-1 bg-[#01E777] font-bold rounded text-sm">
                  Cancel
                </button>
              </div>
            )}

            <div className="flex justify-between font-semibold pt-2 mb-2">
              <span className="text-gray-500">Total</span>
              <span className="text-white">{format(totalExpenses)}</span>
            </div>

            <div className="flex justify-between font-semibold">
              <span></span>
              <span className={`${remaining < 0 ? "text-red-500" : "text-white"}`}>{format(remaining)}</span>
            </div>
          </div>
        );
      })}
    </div>
  );
}