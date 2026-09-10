import { useEffect, useState } from "react";
import {
  fetchBills,
  createBill,
  updateBill,
} from "../api/bills";

import type { BillsEntry, Bill } from "../types/bills.type";
import { CalendarDaysIcon, EllipsisVerticalIcon } from "@heroicons/react/24/outline";
import Modal from "../components/Modal";
import { useToast } from "../components/useToast";
import SlidingTabs from "../components/SlidingTabs";

export default function BillsPage() {
  const showToast = useToast();

  const [data, setData] = useState<BillsEntry[]>([]);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editedBills, setEditedBills] = useState<Bill[]>([]);

  const [showForm, setShowForm] = useState(false);
  const [newMonth, setNewMonth] = useState("");

  const [tab, setTab] = useState<"ongoing" | "done">("ongoing");
  const [menuOpenFor, setMenuOpenFor] = useState<string | null>(null);

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

  const format = (val: unknown) =>
    Number(val || 0).toLocaleString();

  // ✅ PARSE MONTH
  const parseMonth = (monthStr: string) => new Date(monthStr);

  useEffect(() => {
    const load = async () => {
      try {
        const res = await fetchBills();

        const normalized = res.map((e: BillsEntry) => ({
          ...e,
          bills: Array.isArray(e.bills) ? e.bills : [],
        }));

        setData(normalized);
      } catch (error) {
        console.error("Failed to load bills:", error);
        showToast("Failed to load bills", "error");
      }
    };

    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // CREATE MONTH
  const handleAddMonth = async () => {
    if (!newMonth) return;

    try {
      const newEntry = await createBill({
        month: newMonth,
        bills: [],
      });

      setData((prev) => [...prev, newEntry]);
      setNewMonth("");
      setShowForm(false);
      showToast("Month added!", "success");
    } catch (error) {
      console.error("Failed to add month:", error);
      showToast("Failed to add month", "error");
    }
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

    try {
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
      showToast("Bill added!", "success");
    } catch (error) {
      console.error("Failed to add bill:", error);
      showToast("Failed to add bill", "error");
    }
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

    try {
      const newEntry = await createBill({
        month: duplicateMonthName,
        bills: duplicatedBills,
      });

      setData((prev) => [...prev, newEntry]);

      setShowDuplicateModal(false);
      setDuplicateMonthName("");
      setDuplicateSource(null);
      showToast("Month duplicated!", "success");
    } catch (error) {
      console.error("Failed to duplicate month:", error);
      showToast("Failed to duplicate month", "error");
    }
  };

  // TOGGLE PAID
  const handleToggle = async (id: string, index: number) => {
    const entry = data.find((d) => d._id === id);
    if (!entry) return;

    const updatedBills = entry.bills.map((b, i) =>
      i === index ? { ...b, paid: !b.paid } : b
    );

    try {
      const updated = await updateBill(id, {
        bills: updatedBills,
      });

      setData((prev) =>
        prev.map((d) => (d._id === id ? updated : d))
      );
    } catch (error) {
      console.error("Failed to toggle bill:", error);
      showToast("Failed to update bill", "error");
    }
  };

  // EDIT MODE
  const handleEditAll = (id: string) => {
    const entry = data.find((d) => d._id === id);
    if (!entry) return;

    setEditingId(id);
    setEditedBills([...entry.bills]);
  };

  const handleSaveAll = async (id: string) => {
    try {
      const updated = await updateBill(id, {
        bills: editedBills,
      });

      setData((prev) =>
        prev.map((d) => (d._id === id ? updated : d))
      );

      setEditingId(null);
      setEditedBills([]);
      showToast("Bills updated!", "success");
    } catch (error) {
      console.error("Failed to save bills:", error);
      showToast("Failed to save bills", "error");
    }
  };

  const handleDelete = async (id: string, index: number) => {
    const entry = data.find((d) => d._id === id);
    if (!entry) return;

    try {
      const updated = await updateBill(id, {
        bills: entry.bills.filter((_, i) => i !== index),
      });

      setData((prev) =>
        prev.map((d) => (d._id === id ? updated : d))
      );
      showToast("Bill deleted!", "success");
    } catch (error) {
      console.error("Failed to delete bill:", error);
      showToast("Failed to delete bill", "error");
    }
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
    <div className="text-xs max-w-md mx-auto mt-8 px-6 pb-6 bg-[var(--bg-page)]">
      {/* TABS */}
       <div className="flex gap-2 mb-4 justify-between">
          <SlidingTabs
            tabs={[
              { value: "ongoing", label: "Ongoing" },
              { value: "done", label: "Done" },
            ]}
            active={tab}
            onChange={setTab}
          />

            <div className="mb-4 flex justify-between items-start">
            <button
              onClick={() => setShowForm(true)}
              className="px-[0.7rem] py-[0.3rem]  bg-[var(--btn-bg)] text-[var(--btn-text)] font-bold rounded-4xl text-sm"
            >
              +
            </button>
          </div>
        </div>

      {/* ADD MONTH MODAL */}
      <Modal open={showForm} onClose={() => setShowForm(false)} title="Add Month">
        <input
          value={newMonth}
          onChange={(e) => setNewMonth(e.target.value)}
          placeholder="May 2026"
          className="w-full px-3 py-2 bg-[var(--bg-input)] text-[var(--text-primary)] border border-gray-600 rounded-lg focus:border-[#2DE0E6]/50 outline-none"
        />

        <div className="flex justify-end gap-2 pt-2">
          <button onClick={() => setShowForm(false)} className="px-3 py-1 text-gray-400">
            Cancel
          </button>
          <button
            onClick={handleAddMonth}
            className="bg-[var(--btn-bg)] text-[var(--btn-text)] font-semibold px-3 py-1 rounded"
          >
            Save
          </button>
        </div>
      </Modal>

      {/* ADD BILL MODAL */}
      <Modal open={showBillModal} onClose={() => setShowBillModal(false)} title="Add Bill">
        <input
          value={billName}
          onChange={(e) => setBillName(e.target.value)}
          placeholder="Bill name"
          className="w-full px-3 py-2 bg-[var(--bg-input)] text-[var(--text-primary)] border border-gray-600 rounded-lg focus:border-[#2DE0E6]/50 outline-none"
        />

        <input
          value={billDueDate}
          onChange={(e) => setBillDueDate(e.target.value)}
          placeholder="Due date"
          className="w-full px-3 py-2 bg-[var(--bg-input)] text-[var(--text-primary)] border border-gray-600 rounded-lg focus:border-[#2DE0E6]/50 outline-none"
        />

        <input
          type="number"
          value={billAmount}
          onChange={(e) => setBillAmount(e.target.value)}
          placeholder="Amount"
          className="w-full px-3 py-2 bg-[var(--bg-input)] text-[var(--text-primary)] border border-gray-600 rounded-lg focus:border-[#2DE0E6]/50 outline-none"
        />

        <div className="flex justify-end gap-2 pt-2">
          <button onClick={() => setShowBillModal(false)} className="px-3 py-1 text-gray-400">
            Cancel
          </button>
          <button
            onClick={handleSaveBill}
            className="bg-[var(--btn-bg)] text-[var(--btn-text)] font-semibold px-3 py-1 rounded"
          >
            Save
          </button>
        </div>
      </Modal>

      {/* DUPLICATE MODAL */}
      <Modal open={showDuplicateModal} onClose={() => setShowDuplicateModal(false)} title="Duplicate Month">
        <input
          value={duplicateMonthName}
          onChange={(e) => setDuplicateMonthName(e.target.value)}
          placeholder="New month"
          className="w-full px-3 py-2 bg-[var(--bg-input)] text-[var(--text-primary)] border border-gray-600 rounded-lg focus:border-[#2DE0E6]/50 outline-none"
        />

        <div className="flex justify-end gap-2 pt-2">
          <button onClick={() => setShowDuplicateModal(false)} className="px-3 py-1 text-gray-400">
            Cancel
          </button>
          <button
            onClick={handleSaveDuplicate}
            className="bg-[var(--btn-bg)] text-[var(--btn-text)] font-semibold px-3 py-1 rounded"
          >
            Save
          </button>
        </div>
      </Modal>

      {/* LIST */}
      {filteredData.map((entry, entryIdx, entryArr) => {
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
          <div
            key={entry._id}
            className={`py-4 ${entryIdx !== entryArr.length - 1 ? "border-b border-[var(--border-subtle)]" : ""}`}
          >
            <div className="flex justify-between items-center pb-3 mb-2">
              <div className="flex items-center gap-3">
                <div className="shrink-0 w-10 h-10 rounded-lg flex items-center justify-center border border-[#2DE0E6]/40">
                  <CalendarDaysIcon className="w-5 h-5 text-[var(--text-primary)]" />
                </div>
                <h2 className="text-[var(--text-primary)] font-semibold text-[1.5rem]">
                  {entry.month}
                </h2>
              </div>

              <div className="relative shrink-0">
                <button
                  onClick={() =>
                    setMenuOpenFor((prev) => (prev === entry._id ? null : entry._id))
                  }
                  className="flex items-center justify-center w-8 h-8 rounded-lg text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-input)]"
                  aria-label="More actions"
                >
                  <EllipsisVerticalIcon className="w-5 h-5" />
                </button>

                {menuOpenFor === entry._id && (
                  <>
                    <div className="fixed inset-0 z-10" onClick={() => setMenuOpenFor(null)} />
                    <div className="absolute right-0 top-full mt-1 z-20 w-36 bg-[var(--bg-surface)] border border-[var(--border-subtle)] rounded-lg shadow-lg overflow-hidden">
                      <button
                        onClick={() => {
                          handleEditAll(entry._id);
                          setMenuOpenFor(null);
                        }}
                        className="w-full text-left px-3 py-2 text-sm text-[var(--text-primary)] hover:bg-[var(--bg-input)]"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => {
                          handleAddBill(entry._id);
                          setMenuOpenFor(null);
                        }}
                        className="w-full text-left px-3 py-2 text-sm text-[var(--text-primary)] hover:bg-[var(--bg-input)]"
                      >
                        Add Bill
                      </button>
                      <button
                        onClick={() => {
                          handleDuplicateMonth(entry);
                          setMenuOpenFor(null);
                        }}
                        className="w-full text-left px-3 py-2 text-sm text-[var(--text-primary)] hover:bg-[var(--bg-input)]"
                      >
                        Duplicate
                      </button>
                    </div>
                  </>
                )}
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
                        className="flex-1 bg-transparent border px-2 text-[var(--text-primary)]"
                      />

                      <input
                        value={editedBills[i]?.dueDate || ""}
                        onChange={(e) => {
                          const copy = [...editedBills];
                          copy[i].dueDate = e.target.value;
                          setEditedBills(copy);
                        }}
                        className="w-28 bg-transparent border px-2 text-[var(--text-primary)]"
                      />

                      <input
                        type="number"
                        value={editedBills[i]?.amount || ""}
                        onChange={(e) => {
                          const copy = [...editedBills];
                          copy[i].amount = Number(e.target.value);
                          setEditedBills(copy);
                        }}
                        className="w-24 bg-transparent border px-2 text-[var(--text-primary)] text-right"
                      />
                    </>
                  ) : (
                    <div
                      onClick={() => handleToggle(entry._id, i)}
                      className={`flex-1 cursor-pointer ${
                        bill.paid
                          ? "line-through text-[var(--text-secondary)]"
                          : "text-[var(--text-primary)]"
                      }`}
                    >
                      {bill.name} • {bill.dueDate}
                    </div>
                  )}

                  {!isEditing && (
                    <span
                      className={`w-24 text-right ${
                        bill.paid
                          ? "line-through text-[var(--text-secondary)]"
                          : "text-[var(--text-primary)]"
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
                className="mt-2 bg-[var(--btn-bg)] text-[var(--btn-text)] px-3 py-1 rounded text-sm"
              >
                Save
              </button>
            )}

            <div className="mt-3 text-xs space-y-1 mb-3 pt-2 ">
              <div className="flex justify-between text-[var(--text-secondary)]">
                <span>Total</span>
                <span>{format(total)}</span>
              </div>

              <div className="flex justify-between text-[var(--text-primary)]">
                <span>Paid</span>
                <span>{format(paidTotal)}</span>
              </div>

              <div className="flex justify-between text-[#C93B8C]">
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
