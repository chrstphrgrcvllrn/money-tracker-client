import { useEffect, useState } from "react";
import {
  fetchBills,
  createBill,
  updateBill,
} from "../api/bills";

type Bill = {
  name: string;
  amount: number;
  dueDate: string;
  paid: boolean;
};

type BillsEntry = {
  _id: string;
  month: string;
  bills: Bill[];
};

export default function BillsPage() {
  const [data, setData] = useState<BillsEntry[]>([]);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editedBills, setEditedBills] = useState<Bill[]>([]);

  const [showForm, setShowForm] = useState(false);
  const [newMonth, setNewMonth] = useState("");

  const [tab, setTab] = useState<"ongoing" | "done">("ongoing");

  // ADD BILL MODAL
  const [showBillModal, setShowBillModal] = useState(false);
  const [activeMonthId, setActiveMonthId] = useState<string | null>(null);
  const [billName, setBillName] = useState("");
  const [billAmount, setBillAmount] = useState("");
  const [billDueDate, setBillDueDate] = useState("");

  // DUPLICATE MODAL
  const [showDuplicateModal, setShowDuplicateModal] = useState(false);
  const [duplicateMonthName, setDuplicateMonthName] = useState("");
  const [duplicateSource, setDuplicateSource] =
    useState<BillsEntry | null>(null);

  const format = (val: any) =>
    Number(val || 0).toLocaleString();

  // ✅ PARSE MONTH
  const parseMonth = (monthStr: string) => new Date(monthStr);

  useEffect(() => {
    const load = async () => {
      const res = await fetchBills();

      const normalized = res.map((e: any) => ({
        ...e,
        bills: Array.isArray(e.bills) ? e.bills : [],
      }));

      setData(normalized);
    };

    load();
  }, []);

  // CREATE MONTH
  const handleAddMonth = async () => {
    if (!newMonth) return;

    const newEntry = await createBill({
      month: newMonth,
      bills: [],
    });

    setData((prev) => [...prev, newEntry]);
    setNewMonth("");
    setShowForm(false);
  };

  // OPEN ADD BILL MODAL
  const handleAddBill = (id: string) => {
    setActiveMonthId(id);
    setShowBillModal(true);
  };

  // SAVE BILL
  const handleSaveBill = async () => {
    if (!activeMonthId || !billName || !billAmount || !billDueDate) return;

    const entry = data.find((d) => d._id === activeMonthId);
    if (!entry) return;

    const updated = await updateBill(activeMonthId, {
      bills: [
        ...entry.bills,
        {
          name: billName,
          amount: Number(billAmount),
          dueDate: billDueDate,
          paid: false,
        },
      ],
    });

    setData((prev) =>
      prev.map((d) =>
        d._id === activeMonthId ? updated : d
      )
    );

    setShowBillModal(false);
    setBillName("");
    setBillAmount("");
    setBillDueDate("");
    setActiveMonthId(null);
  };

  // OPEN DUPLICATE MODAL
  const handleDuplicateMonth = (entry: BillsEntry) => {
    setDuplicateSource(entry);
    setShowDuplicateModal(true);
  };

  // SAVE DUPLICATE
  const handleSaveDuplicate = async () => {
    if (!duplicateSource || !duplicateMonthName) return;

    const duplicatedBills = duplicateSource.bills.map((b) => ({
      ...b,
      paid: false,
    }));

    const newEntry = await createBill({
      month: duplicateMonthName,
      bills: duplicatedBills,
    });

    setData((prev) => [...prev, newEntry]);

    setShowDuplicateModal(false);
    setDuplicateMonthName("");
    setDuplicateSource(null);
  };

  // TOGGLE PAID
  const handleToggle = async (id: string, index: number) => {
    const entry = data.find((d) => d._id === id);
    if (!entry) return;

    const updatedBills = entry.bills.map((b, i) =>
      i === index ? { ...b, paid: !b.paid } : b
    );

    const updated = await updateBill(id, {
      bills: updatedBills,
    });

    setData((prev) =>
      prev.map((d) => (d._id === id ? updated : d))
    );
  };

  // EDIT MODE
  const handleEditAll = (id: string) => {
    const entry = data.find((d) => d._id === id);
    if (!entry) return;

    setEditingId(id);
    setEditedBills([...entry.bills]);
  };

  const handleSaveAll = async (id: string) => {
    const updated = await updateBill(id, {
      bills: editedBills,
    });

    setData((prev) =>
      prev.map((d) => (d._id === id ? updated : d))
    );

    setEditingId(null);
    setEditedBills([]);
  };

  const handleDelete = async (id: string, index: number) => {
    const entry = data.find((d) => d._id === id);
    if (!entry) return;

    const updated = await updateBill(id, {
      bills: entry.bills.filter((_, i) => i !== index),
    });

    setData((prev) =>
      prev.map((d) => (d._id === id ? updated : d))
    );
  };

  // FILTER + SORT
  const filteredData = data
    .filter((entry) => {
      const hasPending = entry.bills.some((b) => !b.paid);
      return tab === "ongoing" ? hasPending : !hasPending;
    })
    .sort(
      (a, b) =>
        parseMonth(a.month).getTime() -
        parseMonth(b.month).getTime()
    );

  return (
    <div className="px-6 pb-6 mt-8 bg-[#111111] min-h-screen">
      {/* HEADER */}
      <div className="mb-4 flex justify-between items-start">
        <h1 className="text-lg font-semibold text-white">
          Bills
        </h1>

        <button
          onClick={() => setShowForm(true)}
          className="px-[0.7rem] py-[0.3rem] bg-[#01E777] text-black font-bold rounded-4xl text-sm"
        >
          +
        </button>
      </div>

      {/* TABS */}
      <div className="flex gap-2 mb-4">
        <button
          onClick={() => setTab("ongoing")}
          className={`px-3 py-1 rounded-full text-xs ${
            tab === "ongoing"
              ? "bg-[#01E777] text-black"
              : "bg-[#1d1d1d] text-gray-400"
          }`}
        >
          Ongoing
        </button>

        <button
          onClick={() => setTab("done")}
          className={`px-3 py-1 rounded-full text-xs ${
            tab === "done"
              ? "bg-[#01E777] text-black"
              : "bg-[#1d1d1d] text-gray-400"
          }`}
        >
          Done
        </button>
      </div>

      {/* ADD MONTH MODAL */}
      {showForm && (
        <div className="fixed inset-0 flex items-center justify-center bg-black/60">
          <div className="bg-[#1d1d1d] p-5 rounded-xl w-full max-w-sm">
            <h2 className="text-white mb-3">Add Month</h2>

            <input
              value={newMonth}
              onChange={(e) => setNewMonth(e.target.value)}
              placeholder="May 2026"
              className="w-full px-3 py-2 mb-3 rounded bg-transparent border border-gray-600 text-white"
            />

            <div className="flex justify-end gap-2">
              <button onClick={() => setShowForm(false)}>Cancel</button>
              <button
                onClick={handleAddMonth}
                className="bg-[#01E777] px-3 py-1 rounded"
              >
                Save
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ADD BILL MODAL */}
      {showBillModal && (
        <div className="fixed inset-0 flex items-center justify-center bg-black/60">
          <div className="bg-[#1d1d1d] p-5 rounded-xl w-full max-w-sm">
            <h2 className="text-white mb-3">Add Bill</h2>

            <input
              value={billName}
              onChange={(e) => setBillName(e.target.value)}
              placeholder="Bill name"
              className="w-full px-3 py-2 mb-2 rounded bg-transparent border border-gray-600 text-white"
            />

            <input
              value={billDueDate}
              onChange={(e) => setBillDueDate(e.target.value)}
              placeholder="Due date"
              className="w-full px-3 py-2 mb-2 rounded bg-transparent border border-gray-600 text-white"
            />

            <input
              type="number"
              value={billAmount}
              onChange={(e) => setBillAmount(e.target.value)}
              placeholder="Amount"
              className="w-full px-3 py-2 mb-3 rounded bg-transparent border border-gray-600 text-white"
            />

            <div className="flex justify-end gap-2">
              <button onClick={() => setShowBillModal(false)}>Cancel</button>
              <button
                onClick={handleSaveBill}
                className="bg-[#01E777] px-3 py-1 rounded"
              >
                Save
              </button>
            </div>
          </div>
        </div>
      )}

      {/* DUPLICATE MODAL */}
      {showDuplicateModal && (
        <div className="fixed inset-0 flex items-center justify-center bg-black/60">
          <div className="bg-[#1d1d1d] p-5 rounded-xl w-full max-w-sm">
            <h2 className="text-white mb-3">Duplicate Month</h2>

            <input
              value={duplicateMonthName}
              onChange={(e) => setDuplicateMonthName(e.target.value)}
              placeholder="New month"
              className="w-full px-3 py-2 mb-3 rounded bg-transparent border border-gray-600 text-white"
            />

            <div className="flex justify-end gap-2">
              <button onClick={() => setShowDuplicateModal(false)}>Cancel</button>
              <button
                onClick={handleSaveDuplicate}
                className="bg-[#01E777] px-3 py-1 rounded"
              >
                Save
              </button>
            </div>
          </div>
        </div>
      )}

      {/* LIST */}
      {filteredData.map((entry) => {
        const isEditing = editingId === entry._id;

        const total = entry.bills.reduce(
          (s, b) => s + Number(b.amount || 0),
          0
        );

        const paidTotal = entry.bills
          .filter((b) => b.paid)
          .reduce((s, b) => s + Number(b.amount || 0), 0);

        const pendingTotal = total - paidTotal;

        return (
          <div key={entry._id} className="mb-6 bg-[#1d1d1d] p-4 rounded-xl">
            <div className="flex justify-between mb-2">
              <h2 className="text-white font-semibold">
                {entry.month}
              </h2>

              <div className="flex gap-3 text-sm text-gray-500">
                <button onClick={() => handleEditAll(entry._id)}>
                  Edit
                </button>
                <button onClick={() => handleAddBill(entry._id)}>
                  Add
                </button>
                <button onClick={() => handleDuplicateMonth(entry)}>
                  Duplicate
                </button>
              </div>
            </div>

            <ul className="text-xs space-y-2">
              {entry.bills.map((bill, i) => (
                <li key={i} className="flex justify-between items-center gap-2">
                  {isEditing ? (
                    <>
                      <input
                        value={editedBills[i]?.name || ""}
                        onChange={(e) => {
                          const copy = [...editedBills];
                          copy[i].name = e.target.value;
                          setEditedBills(copy);
                        }}
                        className="flex-1 bg-transparent border px-2 text-white"
                      />

                      <input
                        value={editedBills[i]?.dueDate || ""}
                        onChange={(e) => {
                          const copy = [...editedBills];
                          copy[i].dueDate = e.target.value;
                          setEditedBills(copy);
                        }}
                        className="w-28 bg-transparent border px-2 text-white"
                      />

                      <input
                        type="number"
                        value={editedBills[i]?.amount || ""}
                        onChange={(e) => {
                          const copy = [...editedBills];
                          copy[i].amount = Number(e.target.value);
                          setEditedBills(copy);
                        }}
                        className="w-24 bg-transparent border px-2 text-white text-right"
                      />
                    </>
                  ) : (
                    <div
                      onClick={() => handleToggle(entry._id, i)}
                      className={`flex-1 cursor-pointer ${
                        bill.paid
                          ? "line-through text-gray-500"
                          : "text-white"
                      }`}
                    >
                      {bill.name} • {bill.dueDate}
                    </div>
                  )}

                  {!isEditing && (
                    <span
                      className={`w-24 text-right ${
                        bill.paid
                          ? "line-through text-gray-500"
                          : "text-white"
                      }`}
                    >
                      {format(bill.amount)}
                    </span>
                  )}

                  {isEditing && (
                    <button onClick={() => handleDelete(entry._id, i)}>
                      X
                    </button>
                  )}
                </li>
              ))}
            </ul>

            {isEditing && (
              <button
                onClick={() => handleSaveAll(entry._id)}
                className="mt-2 bg-[#01E777] px-3 py-1 rounded text-sm"
              >
                Save
              </button>
            )}

            <div className="mt-3 text-xs space-y-1">
              <div className="flex justify-between text-gray-400">
                <span>Total</span>
                <span>{format(total)}</span>
              </div>

              <div className="flex justify-between text-green-400">
                <span>Paid</span>
                <span>{format(paidTotal)}</span>
              </div>

              <div className="flex justify-between text-red-400">
                <span>Pending</span>
                <span>{format(pendingTotal)}</span>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}