import  { useEffect, useState } from "react";
import type { MonthlyBills } from "../types/bills.type";
import {
  getMonthlyBills,
  addBill,
  updateBillStatus,
  deleteBill,
} from "../api/bills";

export default function BillsPage() {
  const [monthlyBills, setMonthlyBills] = useState<MonthlyBills[]>([]);
  const [editingMonthId, setEditingMonthId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  // Fetch data
  useEffect(() => {
    const fetchData = async () => {
      try {
        const data = await getMonthlyBills();
        setMonthlyBills(data);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  // Add bill
  const handleAddBill = async (monthId: string) => {
    const name = prompt("Bill name");
    const amount = Number(prompt("Bill amount"));
    const datePaid = prompt("Date paid (e.g., Jan 2)");

    if (!name || isNaN(amount) || !datePaid) return;

    try {
      const updated = await addBill(monthId, {
        name,
        amount,
        datePaid,
        status: "Pending",
      });

      setMonthlyBills((prev) =>
        prev.map((m) => (m._id === monthId ? updated : m))
      );
    } catch (err) {
      console.error(err);
    }
  };

  // Update status
  const handleStatusChange = async (
    monthId: string,
    billId: string,
    status: "Paid" | "Pending"
  ) => {
    try {
      const updated = await updateBillStatus(monthId, billId, status);

      setMonthlyBills((prev) =>
        prev.map((m) => (m._id === monthId ? updated : m))
      );
    } catch (err) {
      console.error(err);
    }
  };

  // Delete bill
  const handleDeleteBill = async (monthId: string, billId: string) => {
    if (!confirm("Delete this bill?")) return;

    try {
      const updated = await deleteBill(monthId, billId);

      setMonthlyBills((prev) =>
        prev.map((m) => (m._id === monthId ? updated : m))
      );
    } catch (err) {
      console.error(err);
    }
  };

  if (loading) {
    return <div className="p-4 text-center">Loading...</div>;
  }

  return (
    <div className="p-4 bg-gray-50 min-h-screen">
      {monthlyBills.map((month) => {
        const isEditing = editingMonthId === month._id;

        return (
          <div key={month._id} className="mb-6 bg-white shadow rounded p-4">
            <div className="flex justify-between items-center mb-2">
              <h3 className="text-lg font-semibold">{month.month}</h3>

              <button
                onClick={() => handleAddBill(month._id!)}
                className="px-3 py-1 text-green-500 rounded text-sm"
              >
                + Bill
              </button>
            </div>

            <ul className="border border-gray-300 rounded divide-y divide-gray-300 text-xs">
              {month.bills.map((bill) => (
                <li
                  key={bill._id}
                  className={`flex justify-between items-center gap-2 p-2 ${
                    bill.status === "Paid" ? "text-gray-400" : ""
                  }`}
                >
                  <span className="flex-1 break-words">{bill.name}</span>
                  <span className="w-12 text-right">
                    {bill.amount.toLocaleString()}
                  </span>
                  <span className="w-10 text-center">{bill.datePaid}</span>

                  {isEditing ? (
                    <select
                      value={bill.status}
                      onChange={(e) =>
                        handleStatusChange(
                          month._id!,
                          bill._id!,
                          e.target.value as "Paid" | "Pending"
                        )
                      }
                      className="w-16 text-center border border-gray-300 px-2 py-1 rounded"
                    >
                      <option value="Paid">Paid</option>
                      <option value="Pending">Pending</option>
                    </select>
                  ) : (
                    <span
                      className={`w-12 text-center font-medium ${
                        bill.status === "Paid"
                          ? "text-gray-400"
                          : "text-yellow-600"
                      }`}
                    >
                      {bill.status}
                    </span>
                  )}

                  {isEditing && (
                    <button
                      onClick={() =>
                        handleDeleteBill(month._id!, bill._id!)
                      }
                      className="px-2 py-1 text-gray-500 rounded text-sm border border-gray-300 hover:bg-gray-100"
                    >
                      Delete
                    </button>
                  )}
                </li>
              ))}
            </ul>

            <div className="mt-2 flex gap-2">
              {isEditing ? (
                <button
                  onClick={() => setEditingMonthId(null)}
                  className="px-3 py-1 bg-red-200 rounded text-sm"
                >
                  Done
                </button>
              ) : (
                <button
                  onClick={() => setEditingMonthId(month._id!)}
                  className="px-3 py-1 bg-gray-200 rounded text-sm"
                >
                  Edit Status
                </button>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}