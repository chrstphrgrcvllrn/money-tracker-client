import { useState, useEffect } from "react";
import type { SalaryEntry, Expense } from "../types/salary.type";
import {
  fetchSalaries,
  createSalary,
  updateSalary,
  deleteSalary
} from "../api/salary";
import Snackbar from "@mui/material/Snackbar";
import Alert from "@mui/material/Alert";
import { TrashIcon } from "@heroicons/react/24/solid";

export default function SalaryPage() {
  const [salaryData, setSalaryData] = useState<SalaryEntry[]>([]);
  const [editingAllEntryId, setEditingAllEntryId] = useState<string | null>(null);
  const [editedExpenses, setEditedExpenses] = useState<Expense[]>([]);

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
  const [activeTab, setActiveTab] = useState<"active" | "completed">("active");


  

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

  // ✅ ADD SALARY (MODAL)
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

  // ✅ DUPLICATE SALARY
  const handleDuplicateSalary = async (entry: SalaryEntry) => {
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
  };

  // ✅ EDIT SALARY
  const handleEditSalary = async (id: string) => {
    const entry = salaryData.find((s) => s._id === id);
    if (!entry) return;

    const newSalary = Number(prompt("Update salary", String(entry.salary)));
    if (!isNaN(newSalary)) {
      const updated = await updateSalary(id, { salary: newSalary });

      setSalaryData((prev) =>
        prev.map((s) =>
          s._id === id
            ? { ...updated, expenses: Array.isArray(updated.expenses) ? updated.expenses : [] }
            : s
        )
      );
    }
  };

  // ✅ OPEN DELETE MODAL
  const openDeleteSalaryModal = (id: string) => {
    setSalaryToDelete(id);
    setShowDeleteModal(true);
  };

// ✅ CONFIRM DELETE SALARY
const handleConfirmDeleteSalary = async () => {
  if (!salaryToDelete) return;

  try {
    // Call your backend delete API
    await deleteSalary(salaryToDelete);

    // Remove it from local state
    setSalaryData((prev) => prev.filter((s) => s._id !== salaryToDelete));

    setSalaryToDelete(null);
    setShowDeleteModal(false);
  } catch (err) {
    console.error("Failed to delete salary:", err);
  }
};

  // ✅ DELETE EXPENSE
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

  // ✅ OPEN ADD EXPENSE MODAL
  const openAddExpenseModal = (salaryId: string) => {
    setCurrentSalaryId(salaryId);
    setExpenseName("");
    setExpenseAmount("");
    setShowExpenseForm(true);
  };

  // ✅ SAVE EXPENSE
  const handleSaveExpense = async () => {
    if (!currentSalaryId || !expenseName || !expenseAmount) return;
    const amount = Number(expenseAmount);
    if (isNaN(amount)) return;

    const entry = salaryData.find((s) => s._id === currentSalaryId);
    if (!entry) return;

    const expenses = Array.isArray(entry.expenses) ? entry.expenses : [];
    const updatedExpenses = [...expenses, { name: expenseName, amount, paid: false }];

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
  };

  // ✅ TOGGLE PAID
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

  // ✅ EDIT ALL EXPENSES
  const handleEditAllExpenses = (entryId: string) => {
    const entry = salaryData.find((s) => s._id === entryId);
    if (!entry) return;

    const expenses = Array.isArray(entry.expenses) ? entry.expenses : [];
    setEditingAllEntryId(entryId);
    setEditedExpenses([...expenses]);
  };

// ✅ UPDATE handleSaveAllExpenses TO SHOW SNACKBAR
const handleSaveAllExpenses = async (entryId: string) => {
  try {
    showSnackbar("Updating...", "info"); // Show updating
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
    showSnackbar("Expenses updated successfully!", "success"); // Show completed
  } catch (err) {
    showSnackbar("Failed to update expenses.", "error");
  }
};

  const handleCancelEditAll = () => {
    setEditingAllEntryId(null);
    setEditedExpenses([]);
  };

  // ✅ Filter salaries by tab
  const displayedSalaries = salaryData.filter((entry) => {
    const allPaid = entry.expenses.length > 0 && entry.expenses.every((e) => e.paid);

    if (activeTab === "completed") return allPaid;
    if (activeTab === "active") return !allPaid;
    return true;
  });

// ✅ SNACKBAR STATE
const [snackbarOpen, setSnackbarOpen] = useState(false);
const [snackbarMessage, setSnackbarMessage] = useState("");
const [snackbarSeverity, setSnackbarSeverity] = useState<"success" | "info" | "error">("info");

const showSnackbar = (message: string, severity: "success" | "info" | "error" = "info") => {
  setSnackbarMessage(message);
  setSnackbarSeverity(severity);
  setSnackbarOpen(true);
};

// Close handler
const handleCloseSnackbar = () => setSnackbarOpen(false);



// ✅ SNACKBAR COMPONENT IN R


// Function to update salary "date" (name)
const handleEditSalaryName = async (id: string) => {
  const entry = salaryData.find((s) => s._id === id);
  if (!entry) return;

  // Prompt user for new name/date
  const newDate = prompt("Update salary name/date", entry.date);
  if (!newDate) return;

  try {
    // Call API to update the salary date
    const updated = await updateSalary(id, { date: newDate });

    // Update local state
    setSalaryData((prev) =>
      prev.map((s) =>
        s._id === id ? { ...updated, expenses: Array.isArray(updated.expenses) ? updated.expenses : [] } : s
      )
    );

    showSnackbar("Salary name updated!", "success"); // optional feedback
  } catch (err) {
    showSnackbar("Failed to update salary name.", "error");
    console.error(err);
  }
};



  return (
    <div className="text-xs max-w-md mx-auto mt-8 px-6 pb-6 bg-[#111111]">
      {/* HEADER */}
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

      {/* TABS */}
      <div className="flex mb-4 gap-2">
        <button
          className={`px-3 py-1 rounded ${
            activeTab === "active" ? "bg-[#01E777] text-black font-bold" : "bg-[#1d1d1d] text-white "
          }`}
          onClick={() => setActiveTab("active")}
        >
          Active
        </button>
        <button
          className={`px-3 py-1 rounded ${
            activeTab === "completed" ? "bg-[#01E777] text-black font-bold" : "bg-[#1d1d1d] text-white "
          }`}
          onClick={() => setActiveTab("completed")}
        >
          Completed
        </button>
      </div>

      {/* ADD SALARY MODAL */}
      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#111111]/70">
          <div className="w-full max-w-sm p-5 bg-[#1d1d1d] rounded-xl space-y-3 shadow-lg">
            <h2 className="text-white text-lg font-semibold">Add Salary</h2>
            <input
              type="text"
              placeholder="Date (e.g., May 2026)"
              value={newSalaryDate}
              onChange={(e) => setNewSalaryDate(e.target.value)}
              className="w-full px-3 py-2 rounded-lg text-sm text-white border border-gray-600 focus:border-[#01E777]/40 focus:outline-none"
            />
            <input
              type="number"
              placeholder="Salary amount"
              value={newSalaryAmount}
              onChange={(e) => setNewSalaryAmount(e.target.value)}
              className="w-full px-3 py-2 rounded-lg text-sm text-white border border-gray-600 focus:border-[#01E777]/40 focus:outline-none"
            />
            <div className="flex justify-end space-x-2 pt-2">
              <button
                onClick={() => setShowForm(false)}
                className="px-3 py-1 text-sm text-gray-400"
              >
                Cancel
              </button>
              <button
                onClick={handleAddSalary}
                className="px-3 py-1 bg-[#01E777] text-black font-semibold rounded-lg text-sm"
              >
                Save
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ADD EXPENSE MODAL */}
      {showExpenseForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#111111]/70">
          <div className="w-full max-w-sm p-5 bg-[#1d1d1d] rounded-xl space-y-3 shadow-lg">
            <h2 className="text-white text-lg font-semibold">Add Expense</h2>
            <input
              type="text"
              placeholder="Expense name"
              value={expenseName}
              onChange={(e) => setExpenseName(e.target.value)}
              className="w-full px-3 py-2 rounded-lg text-sm text-white border border-gray-600 focus:border-[#01E777]/40 focus:outline-none"
            />
            <input
              type="number"
              placeholder="Expense amount"
              value={expenseAmount}
              onChange={(e) => setExpenseAmount(e.target.value)}
              className="w-full px-3 py-2 rounded-lg text-sm text-white border border-gray-600 focus:border-[#01E777]/40 focus:outline-none"
            />
            <div className="flex justify-end space-x-2 pt-2">
              <button
                onClick={() => setShowExpenseForm(false)}
                className="px-3 py-1 text-sm text-gray-400"
              >
                Cancel
              </button>
              <button
                onClick={handleSaveExpense}
                className="px-3 py-1 bg-[#01E777] text-black font-semibold rounded-lg text-sm"
              >
                Save
              </button>
            </div>
          </div>
        </div>
      )}

      {/* DELETE SALARY MODAL */}
      {showDeleteModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#111111]/70">
          <div className="w-full max-w-sm p-5 bg-[#1d1d1d] rounded-xl space-y-3 shadow-lg">
            <h2 className="text-white text-lg font-semibold">Confirm Delete</h2>
            <p className="text-gray-400">Are you sure you want to delete this salary?</p>
            <div className="flex justify-end space-x-2 pt-2">
              <button
                onClick={() => setShowDeleteModal(false)}
                className="px-3 py-1 text-sm text-gray-400"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmDeleteSalary}
                className="px-3 py-1 bg-red-500 text-white font-semibold rounded-lg text-sm"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}

      {/* SALARY LIST */}
      {displayedSalaries.map((entry) => {
        const expenses = Array.isArray(entry.expenses) ? entry.expenses : [];
        const totalExpenses = expenses.reduce((sum, exp) => sum + Number(exp.amount || 0), 0);
        const remaining = Number(entry.salary || 0) - totalExpenses;
        const isEditingAll = editingAllEntryId === entry._id;

        return (
          <div key={entry._id} className="mb-6 bg-[#1d1d1d] shadow rounded-xl p-4">
            <div className="flex justify-between items-center mb-2">
              {/* <h2 className="font-semibold text-lg text-white">{entry.date}</h2> */}

<button onClick={() => handleEditSalaryName(entry._id)} >
  {/* {entry.date} */}
  <h2 className="font-semibold text-lg text-white">{entry.date}</h2> 
</button>

              <div className="flex gap-4 items-center">
                {!isEditingAll && expenses.length > 0 && (
                  <button
                    onClick={() => handleEditAllExpenses(entry._id)}
                    className="text-gray-500 text-sm"
                  >
                    Edit
                  </button>
                )}
                <button
                  onClick={() => openAddExpenseModal(entry._id)}
                  className="text-gray-500 text-sm"
                >
                  Add
                </button>
                <button
                  onClick={() => handleDuplicateSalary(entry)}
                  className="text-gray-500 text-sm"
                >
                  Duplicate
                </button>
                <button
                  onClick={() => openDeleteSalaryModal(entry._id)}
                  className="text-red-500 text-sm"
                >
                  Delete
                </button>
              </div>
            </div>

            {/* Salary & Expenses */}
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

  {/* ✅ Always show Delete button */}
  <button
    onClick={() => handleDeleteExpense(entry._id, idx)}
    className="px-2 py-1 text-white text-sm border border-mist-900 rounded"
  >
     <TrashIcon className="w-4 h-4 text-gray-500" />
  </button>
</li>
              ))}
            </ul>

            {isEditingAll && (
              <div className="flex gap-2 mt-2">
                <button
                  onClick={() => handleSaveAllExpenses(entry._id)}
                  className="px-3 py-1 bg-[#01E777] font-bold rounded text-sm"
                >
                  Save All
                </button>
                <button
                  onClick={handleCancelEditAll}
                  className="px-3 py-1 bg-[#01E777] font-bold rounded text-sm"
                >
                  Cancel
                </button>
              </div>
            )}

            {/* Totals */}
            <div className="flex justify-between font-semibold pt-2 mb-2">
              <span className="text-gray-500">Total</span>
              <span className="text-white">{format(totalExpenses)}</span>
            </div>

            <div className="flex justify-between font-semibold">
              <span></span>
              <span className={`${remaining < 0 ? "text-red-500" : "text-white"}`}>
                {format(remaining)}
              </span>
            </div>
          </div>
        );
      })}


{/* ✅ SNACKBAR */}
      <Snackbar
        open={snackbarOpen}
        autoHideDuration={2000}
        onClose={handleCloseSnackbar}
        anchorOrigin={{  vertical: "top", horizontal: "center" }}
      >
        <Alert onClose={handleCloseSnackbar} severity={snackbarSeverity} sx={{ width: "100%",
                backgroundColor: "rgba(0,0,0,0.6)", // semi-transparent black
      color: "white",
      backdropFilter: "blur(8px)",       // blur effect
      borderRadius: "8px",
         }}>
          {snackbarMessage}
        </Alert>
      </Snackbar>

    </div>
  );
}