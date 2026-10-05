import { useEffect, useMemo, useState } from "react";
import type { Loan, Transaction } from "../types/loans.type";
import { getLoans, createLoan, addTransaction, deleteTransaction, updateLoan, deleteLoan, updateTransactionNotes } from "../api/loan";

import { UserIcon, CreditCardIcon, AcademicCapIcon, TrashIcon } from "@heroicons/react/24/solid";
import {
  EyeIcon,
  EyeSlashIcon,
  EllipsisVerticalIcon,
} from "@heroicons/react/24/outline";

import Modal from "../components/Modal";
import MotorcycleSolidIcon from "../components/icons/MotorcycleSolidIcon";
import { useToast } from "../components/useToast";
import { useAmountsVisibility } from "../components/useAmountsVisibility";
import SlidingTabs from "../components/SlidingTabs";
import { SkeletonBlock, SkeletonRows } from "../components/Skeleton";

// Teams-style avatar backgrounds (Fluent named avatar colors). Full class
// strings so Tailwind can see them. Loans are assigned one in creation order
// (see avatarColors in LoanPage) so no two loans share a color until there
// are more loans than colors.
const AVATAR_COLORS = [
  "bg-[#4F6BED]", // cornflower
  "bg-[#038387]", // teal
  "bg-[#CA5010]", // pumpkin
  "bg-[#BF0077]", // magenta
  "bg-[#498205]", // forest
  "bg-[#8764B8]", // purple
  "bg-[#C50F1F]", // cranberry
  "bg-[#0078D4]", // blue
  "bg-[#986F0B]", // brass
  "bg-[#B146C2]", // lilac
  "bg-[#0B6A0B]", // dark green
  "bg-[#E3008C]", // pink
  "bg-[#0027B4]", // navy
  "bg-[#8E562E]", // brown
  "bg-[#005B70]", // steel
  "bg-[#750B1C]", // dark red
  "bg-[#7160E8]", // lavender
  "bg-[#77004D]", // plum
  "bg-[#394146]", // anchor
  "bg-[#D13438]", // red
];

type LoanIcon = React.ComponentType<{ className?: string }>;

// A loan whose name contains the keyword gets that icon; everyone else is
// shown as a person. First match wins.
const LOAN_ICON_RULES: { keyword: string; icon: LoanIcon }[] = [
  { keyword: "v4", icon: MotorcycleSolidIcon },
  { keyword: "credit card", icon: CreditCardIcon },
  { keyword: "icct", icon: AcademicCapIcon },
];

const getLoanIcon = (name: string): LoanIcon => {
  const lower = (name || "").toLowerCase();
  const rule = LOAN_ICON_RULES.find((r) => lower.includes(r.keyword));
  return rule ? rule.icon : UserIcon;
};

export default function LoanPage() {
  const showToast = useToast();

  const [loans, setLoans] = useState<Loan[]>([]);
  const [expanded, setExpanded] = useState<number | null>(null);
  // Edit mode reveals the per-entry pencil/delete buttons and the initial-amount editor.
  const [editMode, setEditMode] = useState(false);
  const [loading, setLoading] = useState(true);

  const [showForm, setShowForm] = useState(false);
  const [newLoanName, setNewLoanName] = useState("");
  const [newLoanAmount, setNewLoanAmount] = useState("");

  const [paymentInputs, setPaymentInputs] = useState<{ [key: number]: string }>({});
  const [paymentDates, setPaymentDates] = useState<{ [key: number]: string }>({});
  const [paymentNotes, setPaymentNotes] = useState<{ [key: number]: string }>({});
  const [transactionTypes, setTransactionTypes] = useState<{ [key: number]: "+" | "-" }>({});
  // Desktop only: which loan's details are open in a modal (the mobile
  // accordion uses `expanded` instead; see the table's row onClick).
  // Keyed by loan id, not array position: sortedLoans re-sorts by remaining
  // amount, so adding a payment can move a loan to a different index —
  // an index-based key would then silently show the wrong loan.
  const [desktopLoanId, setDesktopLoanId] = useState<string | null>(null);

  const { showAmounts, toggleShowAmounts } = useAmountsVisibility();
  const [activeTab, setActiveTab] = useState<"active" | "archived" | "monthly">("active");
  const [expandedMonth, setExpandedMonth] = useState<string | null>(null);
  const [menuOpenFor, setMenuOpenFor] = useState<number | null>(null);

  useEffect(() => {
    const fetchLoans = async () => {
      try {
        const data = await getLoans();
        const normalized = Array.isArray(data) ? data : [data];
        const withTransactions = normalized.map((loan) => ({
          ...loan,
          transactions: Array.isArray(loan.transactions) ? loan.transactions : [],
          archived: loan.archived || false,
        }));
        setLoans(withTransactions);
      } catch (err) {
        console.error(err);
        showToast("Failed to load loans", "error");
      } finally {
        setLoading(false);
      }
    };

    fetchLoans();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const toggleExpand = (index: number) => {
    setExpanded(expanded === index ? null : index);
  };

  const mask = (value: number) =>
    "*".repeat(value.toLocaleString().length);

  const handleAddLoan = async () => {
    if (!newLoanName || !newLoanAmount) return;

    const newLoan = {
      name: newLoanName,
      initialAmount: Number(newLoanAmount),
      transactions: [],
      archived: false,
    };

    try {
      const saved = await createLoan(newLoan);
      setLoans((prev) => [...prev, { ...saved, archived: false }]);
      setNewLoanName("");
      setNewLoanAmount("");
      setShowForm(false);
      showToast("Loan added successfully!", "success");
    } catch (err) {
      console.error(err);
      showToast("Failed to add loan", "error");
    }
  };

  const handleArchiveLoan = async (loanId: string) => {
    // Optimistic update
    setLoans((prev) =>
      prev.map((loan) =>
        loan._id === loanId ? { ...loan, archived: true } : loan
      )
    );

    try {
      await updateLoan(loanId, { archived: true });
      showToast("Loan archived!", "success");
    } catch (err) {
      console.error(err);
      // Roll back on failure
      setLoans((prev) =>
        prev.map((loan) =>
          loan._id === loanId ? { ...loan, archived: false } : loan
        )
      );
      showToast("Failed to archive loan", "error");
    }
  };

  const handleUnarchiveLoan = async (loanId: string) => {
    // Optimistic update
    setLoans((prev) =>
      prev.map((loan) =>
        loan._id === loanId ? { ...loan, archived: false } : loan
      )
    );

    try {
      await updateLoan(loanId, { archived: false });
      showToast("Loan unarchived!", "success");
    } catch (err) {
      console.error(err);
      // Roll back on failure
      setLoans((prev) =>
        prev.map((loan) =>
          loan._id === loanId ? { ...loan, archived: true } : loan
        )
      );
      showToast("Failed to unarchive loan", "error");
    }
  };

  const handleAddPayment = async (loanId: string, index: number, amount: number) => {
    const date = paymentDates[index];
    if (!amount || !date) return;

    const notes = (paymentNotes[index] || "").trim();
    const transaction = { date, amount, type: "payment", notes };

    // Optimistic UI update
    setLoans((prev) =>
      prev.map((loan) =>
        loan._id === loanId
          ? { ...loan, transactions: [...(loan.transactions || []), transaction] }
          : loan
      )
    );

    try {
      // Replace with the server's copy: it has the new entry's real _id
      // (needed to delete it later), which the optimistic version above lacks.
      const updatedLoan = await addTransaction(loanId, transaction);
      setLoans((prev) => prev.map((loan) => (loan._id === loanId ? updatedLoan : loan)));
      setPaymentNotes((prev) => ({ ...prev, [index]: "" }));
      showToast("Payment added!", "success");
    } catch (err) {
      console.error(err);
      // Optionally: remove transaction if failed
      setLoans((prev) =>
        prev.map((loan) =>
          loan._id === loanId
            ? {
                ...loan,
                transactions: (loan.transactions || []).filter(
                  (t) => t !== transaction
                ),
              }
            : loan
        )
      );
      showToast("Failed to add payment", "error");
    }

    // Clear inputs
    setPaymentInputs((prev) => ({ ...prev, [index]: "" }));
    setPaymentDates((prev) => ({ ...prev, [index]: "" }));
    setTransactionTypes((prev) => ({ ...prev, [index]: "+" }));
  };

  // Permanently delete a whole loan (and its payments). Confirmed first.
  const handleDeleteLoan = async (loan: Loan) => {
    if (!confirm(`Delete "${loan.name}" permanently? All of its payments will be lost. This can't be undone.`)) return;

    try {
      await deleteLoan(loan._id);
      setLoans((prev) => prev.filter((l) => l._id !== loan._id));
      showToast("Loan deleted!", "success");
    } catch (error) {
      console.error("Failed to delete loan:", error);
      showToast("Failed to delete loan", "error");
    }
  };

  // Change a loan's initial amount (edit mode only).
  const handleEditInitialAmount = async (loan: Loan) => {
    const next = prompt("Initial amount", String(loan.initialAmount));
    if (next === null) return;
    const value = Number(next);
    if (!Number.isFinite(value) || value < 0) {
      showToast("Enter a valid amount", "error");
      return;
    }

    try {
      const updated = await updateLoan(loan._id, { initialAmount: value });
      setLoans((prev) => prev.map((l) => (l._id === loan._id ? { ...l, initialAmount: updated.initialAmount } : l)));
      showToast("Initial amount updated!", "success");
    } catch (error) {
      console.error("Failed to update initial amount:", error);
      showToast("Failed to update initial amount", "error");
    }
  };

  // Add or change the reminder note on an existing entry.
  const handleEditNotes = async (loanId: string, transactionId: string, current: string) => {
    const next = prompt("Note for this entry (leave empty to clear)", current);
    if (next === null) return;

    try {
      const updatedLoan = await updateTransactionNotes(loanId, transactionId, next.trim());
      setLoans((prev) => prev.map((loan) => (loan._id === loanId ? updatedLoan : loan)));
      showToast("Note saved!", "success");
    } catch (error) {
      console.error("Failed to save note:", error);
      showToast("Failed to save note", "error");
    }
  };

  // Delete a mis-entered payment/transaction.
  const handleDeleteTransaction = async (loanId: string, transactionId: string) => {
    if (!confirm("Delete this entry?")) return;

    try {
      const updatedLoan = await deleteTransaction(loanId, transactionId);
      setLoans((prev) => prev.map((loan) => (loan._id === loanId ? updatedLoan : loan)));
      showToast("Entry deleted!", "success");
    } catch (err) {
      console.error(err);
      showToast("Failed to delete entry", "error");
    }
  };

  // Keyed by _id and ordered by it (ids are creation-ordered) so a loan keeps
  // its color across tabs and re-sorts, and colors don't repeat.
  const avatarColors = useMemo(() => {
    const colors = new Map<string, string>();
    [...loans]
      .sort((a, b) => a._id.localeCompare(b._id))
      .forEach((loan, i) => colors.set(loan._id, AVATAR_COLORS[i % AVATAR_COLORS.length]));
    return colors;
  }, [loans]);

  const filteredLoans = loans.filter((loan) => {
    if (activeTab === "active") return !loan.archived;
    if (activeTab === "archived") return loan.archived;
    return true;
  });

  const sortedLoans = filteredLoans
    .slice() // make a copy so we don't mutate state
    .sort((a, b) => {
      const aRemaining =
        Number(a.initialAmount) +
        (a.transactions || []).reduce((s, t) => s + Number(t.amount), 0);
      const bRemaining =
        Number(b.initialAmount) +
        (b.transactions || []).reduce((s, t) => s + Number(t.amount), 0);
      return bRemaining - aRemaining; // highest first
    });

  // Sum of every payment made (negative transactions) on the loans in view.
  const totalPaid = loans.reduce(
    (sum, loan) =>
      sum +
      (loan.transactions || [])
        .filter((t) => t.amount < 0)
        .reduce((s, t) => s + Math.abs(Number(t.amount)), 0),
    0
  );

  // Payments grouped by calendar month (all loans, archived included).
  const monthlyPaid = useMemo(() => {
    type Item = { loan: string; date: Date; amount: number; notes?: string };
    const months = new Map<string, { paid: number; added: number; items: Item[] }>();
    loans.forEach((loan) =>
      (loan.transactions || []).forEach((t) => {
        const d = new Date(t.date);
        if (Number.isNaN(d.getTime())) return;
        const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
        const bucket = months.get(key) ?? { paid: 0, added: 0, items: [] };
        const amount = Number(t.amount);
        if (amount < 0) bucket.paid += Math.abs(amount);
        else bucket.added += amount;
        bucket.items.push({ loan: loan.name, date: d, amount, notes: t.notes });
        months.set(key, bucket);
      })
    );
    return [...months.entries()]
      .sort(([a], [b]) => b.localeCompare(a))
      .map(([key, { paid, added, items }]) => {
        const [y, m] = key.split("-").map(Number);
        return {
          key,
          total: paid,
          added,
          net: paid - added,
          items: items.sort((a, b) => b.date.getTime() - a.date.getTime()),
          label: new Date(y, m - 1, 1).toLocaleDateString("en-PH", { month: "long", year: "numeric" }),
        };
      });
  }, [loans]);

  const monthlyAverage = monthlyPaid.length
    ? monthlyPaid.reduce((s, m) => s + m.total, 0) / monthlyPaid.length
    : 0;
  const monthlyMax = monthlyPaid.reduce((mx, m) => Math.max(mx, m.total), 0);

  const totalRemaining = loans.reduce((sum, loan) => {
    const transactionsSum = (loan.transactions || []).reduce(
      (s, t) => s + Number(t.amount),
      0
    );
    return sum + Number(loan.initialAmount) + transactionsSum;
  }, 0);

  // Payment history + add-payment form + archive menu for one loan. Shared by
  // the mobile accordion (expands in place) and the desktop table (opens in a
  // Modal) so the two don't drift apart.
  const renderLoanDetails = (loan: Loan, index: number, loanTransactions: Transaction[]) => (
    <>
      <div className="flex items-center justify-between text-xs mb-2 text-[var(--text-primary)]">
        <span>Initial amount</span>
        <span className="flex items-center gap-2">
          <span className="font-semibold">{showAmounts ? Number(loan.initialAmount).toLocaleString() : mask(Number(loan.initialAmount))}</span>
          {editMode && (
            <button
              onClick={() => handleEditInitialAmount(loan)}
              title="Edit initial amount"
              aria-label="Edit initial amount"
              className="text-[var(--text-secondary)] hover:text-[var(--text-primary)] text-[11px]"
            >
              ✎
            </button>
          )}
        </span>
      </div>

      {loanTransactions.length === 0 ? (
        <p className="text-xs text-[var(--text-primary)]">No payments yet</p>
      ) : (
        <ul className="text-xs text-[var(--text-primary)] space-y-1">
          {loanTransactions.map((t, i) => (
            <li key={t._id ?? `${t.date}-${t.amount}-${t.type}-${i}`} className="flex items-center justify-between gap-2">
              <span className="flex items-baseline gap-2 min-w-0">
                <span className="shrink-0">
                  {new Date(t.date).toLocaleDateString("en-PH", {
                    month: "short",
                    day: "numeric",
                    year: "numeric",
                  })}
                </span>
                {t.notes && (
                  <span className="truncate text-[11px] italic text-[var(--text-secondary)]">{t.notes}</span>
                )}
              </span>

              <span className="flex items-center gap-2">
                <span
                  className={`${
                    Number(t.amount) < 0 ? "text-[var(--negative)]" : "text-[var(--text-primary)]"
                  }`}
                >
                  {Number(t.amount).toLocaleString("en-PH")}
                </span>

                {editMode && t._id && (
                  <button
                    onClick={() => handleEditNotes(loan._id, t._id as string, t.notes ?? "")}
                    title="Edit note"
                    aria-label="Edit note"
                    className="shrink-0 text-[var(--text-secondary)] hover:text-[var(--text-primary)] text-[11px]"
                  >
                    ✎
                  </button>
                )}

                {editMode && t._id && (
                  <button
                    onClick={() => handleDeleteTransaction(loan._id, t._id as string)}
                    title="Delete entry"
                    aria-label="Delete entry"
                    className="shrink-0 text-[var(--text-secondary)] hover:text-[var(--danger)]"
                  >
                    <TrashIcon className="w-3.5 h-3.5" />
                  </button>
                )}
              </span>

            </li>
          ))}
        </ul>
      )}

      <div className="mt-3 space-y-2 flex flex-col gap-2">
        <input
          type="text"
          maxLength={500}
          placeholder="Note (optional)"
          value={paymentNotes[index] || ""}
          onChange={(e) => setPaymentNotes((prev) => ({ ...prev, [index]: e.target.value }))}
          className="w-full px-3 py-2 bg-[var(--bg-input)] text-sm text-[var(--text-primary)] border border-[var(--border-strong)] rounded-lg focus:border-[var(--accent)]/50 outline-none"
        />

        <input
          type="date"
          value={paymentDates[index] || ""}
          onChange={(e) =>
            setPaymentDates((prev) => ({
              ...prev,
              [index]: e.target.value,
            }))
          }
          className="w-full px-3 py-2 bg-[var(--bg-input)] text-sm text-[var(--text-primary)] border border-[var(--border-strong)] rounded-lg focus:border-[var(--accent)]/50 outline-none"
        />

        <div className="flex gap-2">
          <select
            value={transactionTypes[index] || "+"}
            onChange={(e) =>
              setTransactionTypes((prev) => ({
                ...prev,
                [index]: e.target.value as "+" | "-",
              }))
            }
            className="px-3 py-2 bg-[var(--bg-input)] rounded-lg text-sm text-[var(--text-primary)] border border-[var(--border-strong)] focus:border-[var(--accent)]/50 outline-none"
          >
            <option value="+">+</option>
            <option value="-">-</option>
          </select>

          <input
            type="number"
            placeholder="Enter amount"
            value={paymentInputs[index] || ""}
            onChange={(e) =>
              setPaymentInputs((prev) => ({
                ...prev,
                [index]: e.target.value,
              }))
            }
            className="flex-1 px-3 py-2 bg-[var(--bg-input)] rounded-lg text-sm text-[var(--text-primary)] border border-[var(--border-strong)] focus:border-[var(--accent)]/50 outline-none"
          />
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => {
              const type = transactionTypes[index] || "+";
              const rawValue = paymentInputs[index] || "0";
              const value = Number(rawValue) * (type === "-" ? -1 : 1);

              if (isNaN(value) || !paymentDates[index]) return;

              handleAddPayment(loan._id, index, value);
            }}
            className="flex-1 bg-[var(--btn-bg)] text-[var(--btn-text)] font-bold py-2 rounded-lg text-sm"
          >
            Add Payment
          </button>

          <div className="relative shrink-0">
            <button
              onClick={() => setMenuOpenFor((prev) => (prev === index ? null : index))}
              className="flex items-center justify-center w-9 h-9 rounded-lg text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-input)]"
              aria-label="More actions"
            >
              <EllipsisVerticalIcon className="w-5 h-5" />
            </button>

            {menuOpenFor === index && (
              <>
                <div className="fixed inset-0 z-10" onClick={() => setMenuOpenFor(null)} />
                <div className="absolute right-0 bottom-full mb-1 z-20 w-40 bg-[var(--bg-surface)] border border-[var(--border-subtle)] rounded-lg shadow-lg overflow-hidden">
                  {activeTab === "active" ? (
                    <button
                      onClick={() => {
                        setMenuOpenFor(null);
                        if (!confirm(`Archive "${loan.name}"? You can unarchive it later.`)) return;
                        handleArchiveLoan(loan._id);
                      }}
                      className="w-full text-left px-3 py-2 text-sm text-[var(--danger)] hover:bg-[var(--bg-input)]"
                    >
                      Archive Loan
                    </button>
                  ) : (
                    <button
                      onClick={() => {
                        handleUnarchiveLoan(loan._id);
                        setMenuOpenFor(null);
                      }}
                      className="w-full text-left px-3 py-2 text-sm text-[var(--text-primary)] hover:bg-[var(--bg-input)]"
                    >
                      Unarchive Loan
                    </button>
                  )}

                  <button
                    onClick={() => {
                      setMenuOpenFor(null);
                      handleDeleteLoan(loan);
                    }}
                    className="w-full text-left px-3 py-2 text-sm text-[var(--danger)] hover:bg-[var(--bg-input)] border-t border-[var(--border-subtle)]"
                  >
                    Delete Loan
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </>
  );

  if (loading) {
    return (
      <div className="px-6 pb-6 mt-8 max-w-md md:max-w-5xl mx-auto font-sans bg-[var(--bg-page)]">
        <SkeletonBlock className="h-8 w-full mb-6 rounded-xl" />
        <SkeletonRows count={5} />
      </div>
    );
  }

  return (
    <div className="px-6 pb-6 mt-8 max-w-md md:max-w-5xl mx-auto font-sans bg-[var(--bg-page)]">
      {/* HEADER */}
      <div className="mb-4 flex justify-end items-center">
        <div className="flex items-center justify-end gap-3">
          <button
            onClick={toggleShowAmounts}
            className="text-[var(--text-secondary)]"
          >
            {showAmounts ? (
              <EyeSlashIcon className="w-5 h-5" />
            ) : (
              <EyeIcon className="w-5 h-5" />
            )}
          </button>

          <button
            onClick={() => setShowForm(!showForm)}
            className="px-[0.7rem] py-[0.3rem]  bg-[var(--btn-bg)] text-[var(--btn-text)] font-bold   rounded-4xl text-sm"
          >
            +
          </button>
        </div>
      </div>

      {/* ADD LOAN MODAL */}
      <Modal open={showForm} onClose={() => setShowForm(false)} title="Add Loan">
        <input
          type="text"
          placeholder="Loan name"
          value={newLoanName}
          onChange={(e) => setNewLoanName(e.target.value)}
          className="w-full px-3 py-2 bg-[var(--bg-input)] text-[var(--text-primary)] border border-[var(--border-strong)] rounded-lg focus:border-[var(--accent)]/50 outline-none"
        />

        <input
          type="number"
          placeholder="Initial amount"
          value={newLoanAmount}
          onChange={(e) => setNewLoanAmount(e.target.value)}
          className="w-full px-3 py-2 bg-[var(--bg-input)] text-[var(--text-primary)] border border-[var(--border-strong)] rounded-lg focus:border-[var(--accent)]/50 outline-none"
        />

        <div className="flex justify-end gap-2 pt-2">
          <button
            onClick={() => setShowForm(false)}
            className="px-3 py-1 text-[var(--text-secondary)]"
          >
            Cancel
          </button>

          <button
            onClick={handleAddLoan}
            className="px-3 py-1 bg-[var(--btn-bg)] text-[var(--btn-text)] font-semibold rounded-lg"
          >
            Save
          </button>
        </div>
      </Modal>

      {/* SUMMARY */}
      <div className="mb-6 p-4 bg-[var(--bg-surface)] rounded-xl text-center">
        <p className="text-[var(--text-secondary)] text-sm">Total Remaining</p>
        <p className="text-[2.5rem] font-bold text-[var(--text-primary)]">
          {showAmounts ? totalRemaining.toLocaleString() : mask(totalRemaining)}
        </p>
        <p className="text-xs text-[var(--text-secondary)] mt-1">
          Total paid{" "}
          <span className="font-semibold text-[var(--text-primary)]">
            {showAmounts ? totalPaid.toLocaleString() : mask(totalPaid)}
          </span>
        </p>
      </div>

      <div className="mb-4">
        <SlidingTabs
          tabs={[
            { value: "active", label: "Active" },
            { value: "archived", label: "Archive" },
            { value: "monthly", label: "Monthly" },
          ]}
          active={activeTab}
          onChange={setActiveTab}
        />
      </div>

      <div className="flex justify-end mb-2">
        <button
          onClick={() => setEditMode((v) => !v)}
          className={`text-xs px-3 py-1 rounded-full border ${
            editMode
              ? "bg-[var(--btn-bg)] text-[var(--btn-text)] border-transparent font-semibold"
              : "border-[var(--border-strong)] text-[var(--text-secondary)]"
          }`}
        >
          {editMode ? "Done" : "Edit"}
        </button>
      </div>

      {activeTab === "monthly" ? (
        <div className="bg-[var(--bg-surface)] rounded-xl p-4 space-y-4">
          <div className="flex justify-between text-xs text-[var(--text-secondary)]">
            <span>Average per month</span>
            <span className="font-semibold text-[var(--text-primary)]">
              {showAmounts ? monthlyAverage.toLocaleString(undefined, { maximumFractionDigits: 0 }) : mask(monthlyAverage)}
            </span>
          </div>

          {monthlyPaid.length === 0 ? (
            <p className="text-xs text-[var(--text-secondary)] text-center py-4">No payments yet.</p>
          ) : (
            monthlyPaid.map((m) => {
              return (
                <div key={m.key} className="space-y-1">
                  <button
                    onClick={() => setExpandedMonth((cur) => (cur === m.key ? null : m.key))}
                    aria-expanded={expandedMonth === m.key}
                    className="w-full text-left space-y-1"
                  >
                  <div className="flex justify-between items-baseline text-sm">
                    <span className="text-[var(--text-primary)]">{m.label}</span>
                    <span className="font-semibold text-[var(--text-primary)]">
                      {showAmounts ? m.total.toLocaleString() : mask(m.total)}
                    </span>
                  </div>
                  <p className="text-[11px] text-[var(--text-secondary)]">
                    {showAmounts
                      ? `Added +${m.added.toLocaleString()} · Net ${m.net.toLocaleString()}`
                      : `Added ${mask(m.added)} · Net ${mask(m.net)}`}
                  </p>
                  <div className="h-2 rounded-full bg-[var(--bg-input)] overflow-hidden">
                    <div
                      className="h-full rounded-full bg-[var(--accent)]"
                      style={{ width: `${monthlyMax ? (m.total / monthlyMax) * 100 : 0}%` }}
                    />
                  </div>
                  </button>

                  {expandedMonth === m.key && (
                    <ul className="pt-2 space-y-2 border-t border-[var(--border-subtle)]">
                      {m.items.map((item, i) => (
                        <li key={i} className="flex justify-between gap-3 text-xs">
                          <div className="min-w-0">
                            <p className="flex items-baseline gap-2 min-w-0">
                              <span className="shrink-0 text-[var(--text-primary)]">{item.loan}</span>
                              <span className="shrink-0 text-[var(--text-secondary)]">
                                {item.date.toLocaleDateString("en-PH", { month: "short", day: "numeric" })}
                              </span>
                              {item.notes && (
                                <span className="truncate min-w-0 italic text-[var(--text-secondary)]">{item.notes}</span>
                              )}
                            </p>
                          </div>
                          <span
                            className={`font-semibold shrink-0 ${
                              item.amount < 0 ? "text-[var(--text-primary)]" : "text-[var(--accent)]"
                            }`}
                          >
                            {showAmounts
                              ? `${item.amount > 0 ? "+" : ""}${item.amount.toLocaleString()}`
                              : mask(item.amount)}
                          </span>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              );
            })
          )}
        </div>
      ) : (
      <>
      {/* LIST — accordion rows on mobile; a sortable-looking table on desktop. */}
      <div className="md:hidden">
        {sortedLoans.map((loan, index, arr) => {
          const loanTransactions = loan.transactions || [];
          const loanSum = loanTransactions.reduce((s, t) => s + Number(t.amount), 0);
          const remaining = Number(loan.initialAmount) + loanSum;
          const LoanAvatarIcon = getLoanIcon(loan.name);

          return (
            <div
              key={loan._id || index}
              className={index !== arr.length - 1 ? "border-b border-[var(--border-subtle)]" : ""}
            >
              <button
                className="w-full flex justify-between items-center py-4"
                onClick={() => toggleExpand(index)}
              >
                <div className="flex items-center gap-3 text-left">
                  <div
                    className={`shrink-0 w-11 h-11 rounded-full flex items-center justify-center ${avatarColors.get(loan._id) ?? AVATAR_COLORS[0]}`}
                  >
                    <LoanAvatarIcon className="w-6 h-6 text-white/90" />
                  </div>

                  <div>
                    <p className="font-medium text-[1.2rem] text-[var(--text-primary)]">{loan.name}</p>
                   <p className="text-xs text-[var(--text-secondary)]">
                  Paid:{" "}
                  <span className="text-[var(--text-secondary)] font-medium">
                    {showAmounts
                      ? loanTransactions
                          .filter((t) => t.amount < 0)
                          .reduce((s, t) => s + Math.abs(Number(t.amount)), 0)
                          .toLocaleString()
                      : mask(
                          loanTransactions
                            .filter((t) => t.amount < 0)
                            .reduce((s, t) => s + Math.abs(Number(t.amount)), 0)
                        )}
                  </span>
                </p>
                  </div>
                </div>

                <p className="font-bold text-[var(--danger)]">
                  {showAmounts ? remaining.toLocaleString() : mask(remaining)}
                </p>
              </button>

              <div
                className="grid transition-[grid-template-rows] duration-300 ease-in-out"
                style={{ gridTemplateRows: expanded === index ? "1fr" : "0fr" }}
              >
                <div className="overflow-hidden">
                  <div className="pb-4">{renderLoanDetails(loan, index, loanTransactions)}</div>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <table className="hidden md:table w-full text-sm border-separate border-spacing-y-1">
        <thead>
          <tr className="text-left text-[var(--text-secondary)]">
            <th className="font-medium pb-2 pl-1">Loan</th>
            <th className="font-medium pb-2 text-right">Paid</th>
            <th className="font-medium pb-2 text-right pr-1">Remaining</th>
          </tr>
        </thead>
        <tbody>
          {sortedLoans.map((loan, index) => {
            const loanTransactions = loan.transactions || [];
            const loanSum = loanTransactions.reduce((s, t) => s + Number(t.amount), 0);
            const remaining = Number(loan.initialAmount) + loanSum;
            const paid = loanTransactions
              .filter((t) => t.amount < 0)
              .reduce((s, t) => s + Math.abs(Number(t.amount)), 0);
            const LoanAvatarIcon = getLoanIcon(loan.name);

            return (
              <tr
                key={loan._id || index}
                onClick={() => setDesktopLoanId(loan._id)}
                className="cursor-pointer bg-[var(--bg-surface)] hover:bg-[var(--bg-input)]"
              >
                <td className="py-2.5 pl-3 rounded-l-xl">
                  <div className="flex items-center gap-3">
                    <div
                      className={`shrink-0 w-8 h-8 rounded-full flex items-center justify-center ${avatarColors.get(loan._id) ?? AVATAR_COLORS[0]}`}
                    >
                      <LoanAvatarIcon className="w-4 h-4 text-white/90" />
                    </div>
                    <span className="font-medium text-[var(--text-primary)]">{loan.name}</span>
                  </div>
                </td>
                <td className="py-2.5 text-right text-[var(--text-secondary)]">
                  {showAmounts ? paid.toLocaleString() : mask(paid)}
                </td>
                <td className="py-2.5 pr-3 rounded-r-xl text-right font-bold text-[var(--danger)]">
                  {showAmounts ? remaining.toLocaleString() : mask(remaining)}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>

      </>
      )}

      {/* Desktop only: the mobile accordion expands in place; here the same
          payment history/add-payment/archive content opens in a modal.
          Looked up by id each render, since sortedLoans re-sorts by remaining
          amount whenever a payment is added or removed. */}
      {(() => {
        const desktopIndex = desktopLoanId
          ? sortedLoans.findIndex((loan) => loan._id === desktopLoanId)
          : -1;
        const desktopLoan = desktopIndex >= 0 ? sortedLoans[desktopIndex] : null;
        if (!desktopLoan) return null;

        return (
          <Modal open onClose={() => setDesktopLoanId(null)} title={desktopLoan.name}>
            {renderLoanDetails(desktopLoan, desktopIndex, desktopLoan.transactions || [])}
          </Modal>
        );
      })()}
    </div>
  );
}
