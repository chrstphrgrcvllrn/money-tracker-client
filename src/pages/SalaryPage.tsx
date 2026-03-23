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

  useEffect(() => {
    const load = async () => {
      const data = await fetchSalaries();

      // ✅ normalize expenses to always be an array
      const normalized = data.map((entry) => ({
        ...entry,
        expenses: Array.isArray(entry.expenses) ? entry.expenses : [],
      }));

      setSalaryData(normalized);
    };

    load();
  }, []);

  const handleAddSalary = async () => {
    const date = prompt("Enter date (e.g., May 1)");
    const salary = Number(prompt("Enter expected salary"));

    if (date && !isNaN(salary)) {
      const newEntry = await createSalary({
        date,
        expectedSalary: salary,
        expenses: [],
      });

      setSalaryData((prev) => [
        ...prev,
        {
          ...newEntry,
          expenses: Array.isArray(newEntry.expenses)
            ? newEntry.expenses
            : [],
        },
      ]);
    }
  };

  const handleEditSalary = async (id: string) => {
    const entry = salaryData.find((s) => s._id === id);
    if (!entry) return;

    const newSalary = Number(
      prompt("Update expected salary", entry.expectedSalary.toString())
    );

    if (!isNaN(newSalary)) {
      const updated = await updateSalary(id, {
        expectedSalary: newSalary,
      });

      setSalaryData((prev) =>
        prev.map((s) => (s._id === id ? {
          ...updated,
          expenses: Array.isArray(updated.expenses) ? updated.expenses : [],
        } : s))
      );
    }
  };

  const handleDeleteExpense = async (salaryId: string, index: number) => {
    if (!confirm("Delete this expense?")) return;

    const entry = salaryData.find((s) => s._id === salaryId);
    if (!entry) return;

    const expenses = Array.isArray(entry.expenses) ? entry.expenses : [];
    const updatedExpenses = expenses.filter((_, i) => i !== index);

    const updated = await updateSalary(salaryId, {
      expenses: updatedExpenses,
    });

    setSalaryData((prev) =>
      prev.map((s) =>
        s._id === salaryId
          ? {
              ...updated,
              expenses: Array.isArray(updated.expenses)
                ? updated.expenses
                : [],
            }
          : s
      )
    );
  };

  const handleAddExpense = async (salaryId: string) => {
    const name = prompt("Expense name");
    const amount = Number(prompt("Expense amount"));

    if (name && !isNaN(amount)) {
      const entry = salaryData.find((s) => s._id === salaryId);
      if (!entry) return;

      const expenses = Array.isArray(entry.expenses) ? entry.expenses : [];

      const updatedExpenses = [
        ...expenses,
        { name, amount, paid: false },
      ];

      const updated = await updateSalary(salaryId, {
        expenses: updatedExpenses,
      });

      setSalaryData((prev) =>
        prev.map((s) =>
          s._id === salaryId
            ? {
                ...updated,
                expenses: Array.isArray(updated.expenses)
                  ? updated.expenses
                  : [],
              }
            : s
        )
      );
    }
  };

  const handleTogglePaid = async (salaryId: string, index: number) => {
    const entry = salaryData.find((s) => s._id === salaryId);
    if (!entry) return;

    const expenses = Array.isArray(entry.expenses) ? entry.expenses : [];

    const updatedExpenses = expenses.map((e, i) =>
      i === index ? { ...e, paid: !e.paid } : e
    );

    const updated = await updateSalary(salaryId, {
      expenses: updatedExpenses,
    });

    setSalaryData((prev) =>
      prev.map((s) =>
        s._id === salaryId
          ? {
              ...updated,
              expenses: Array.isArray(updated.expenses)
                ? updated.expenses
                : [],
            }
          : s
      )
    );
  };

  const handleEditAllExpenses = (entryId: string) => {
    const entry = salaryData.find((s) => s._id === entryId);
    if (!entry) return;

    const expenses = Array.isArray(entry.expenses) ? entry.expenses : [];

    setEditingAllEntryId(entryId);
    setEditedExpenses([...expenses]);
  };

  const handleSaveAllExpenses = async (entryId: string) => {
    const updated = await updateSalary(entryId, {
      expenses: editedExpenses,
    });

    setSalaryData((prev) =>
      prev.map((s) =>
        s._id === entryId
          ? {
              ...updated,
              expenses: Array.isArray(updated.expenses)
                ? updated.expenses
                : [],
            }
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

  return (
    <div className="p-4 bg-gray-50 min-h-screen">
      <button
        onClick={handleAddSalary}
        className="mb-6 px-4 py-2 bg-blue-500 text-white rounded shadow hover:bg-blue-600"
      >
        Add Salary
      </button>

      {salaryData.map((entry) => {
        const expenses = Array.isArray(entry.expenses) ? entry.expenses : [];

        const totalExpenses = expenses.reduce(
          (sum, exp) => sum + exp.amount,
          0
        );

        const remaining = entry.expectedSalary - totalExpenses;
        const isEditingAll = editingAllEntryId === entry._id;

        return (
          <div key={entry._id} className="mb-6 bg-white shadow rounded p-4">
            <div className="flex justify-between items-center mb-2">
              <h2 className="font-semibold text-lg">{entry.date}</h2>

              <div className="flex gap-2">
                {!isEditingAll && expenses.length > 0 && (
                  <button
                    onClick={() => handleEditAllExpenses(entry._id)}
                    className="text-gray-600 text-sm"
                  >
                    Edit
                  </button>
                )}

                <button
                  onClick={() => handleAddExpense(entry._id)}
                  className="text-gray-600 text-sm"
                >
                  Add
                </button>
              </div>
            </div>

            <div className="flex justify-between text-gray-500 mb-2">
              <span>Salary</span>
              <button onClick={() => handleEditSalary(entry._id)}>
                <span className="font-semibold text-blue-600">
                  {(entry.expectedSalary ?? 0).toLocaleString()}
                </span>
              </button>
            </div>

            <ul className="border border-gray-300 rounded divide-y divide-gray-300 text-xs">
              {expenses.map((expense, idx) => (
                <li
                  key={idx}
                  className="flex justify-between items-center gap-2 m-2"
                >
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
                      className="flex-1 border px-2 py-1 rounded"
                    />
                  ) : (
                    <span
                      onClick={() => handleTogglePaid(entry._id, idx)}
                      className={`flex-1 break-words cursor-pointer ${
                        expense.paid ? "line-through text-gray-300" : ""
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
                      className="w-24 text-right border px-2 py-1 rounded"
                    />
                  ) : (
                    <span
                      className={`w-24 text-right font-medium ${
                        expense.paid ? "line-through text-gray-400" : ""
                      }`}
                    >
                      {expense.amount.toLocaleString()}
                    </span>
                  )}

                  {isEditingAll && (
                    <button
                      onClick={() => handleDeleteExpense(entry._id, idx)}
                      className="px-2 py-1 text-gray-500 text-sm border rounded"
                    >
                      Delete
                    </button>
                  )}
                </li>
              ))}
            </ul>

            {isEditingAll && (
              <div className="flex gap-2 mt-2">
                <button
                  onClick={() => handleSaveAllExpenses(entry._id)}
                  className="px-3 py-1 bg-green-200 rounded text-sm"
                >
                  Save All
                </button>
                <button
                  onClick={handleCancelEditAll}
                  className="px-3 py-1 bg-red-200 rounded text-sm"
                >
                  Cancel
                </button>
              </div>
            )}

            <div className="flex justify-between font-semibold pt-2 mb-2">
              <span className="text-gray-500">Total</span>
              <span className="text-red-600">
                {totalExpenses.toLocaleString()}
              </span>
            </div>

            <div className="flex justify-between font-semibold">
              <span></span>
              <span
                className={remaining >= 0 ? "text-green-600" : "text-red-600"}
              >
                {remaining.toLocaleString()}
              </span>
            </div>
          </div>
        );
      })}
    </div>
  );
}