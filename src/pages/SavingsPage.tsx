import { useEffect, useRef, useState } from "react";
import type { Savings } from "../types/savings.type";
import {
  getSavings,
  createSavings,
  addSavingsTransaction,
  deleteSavings,
} from "../api/savings";

import { EyeIcon, EyeSlashIcon, TrashIcon, EllipsisVerticalIcon } from "@heroicons/react/24/outline";
import Modal from "../components/Modal";
import { useToast } from "../components/useToast";
import { useAmountsVisibility } from "../components/useAmountsVisibility";

export default function SavingsPage() {
  const showToast = useToast();
  const [savings, setSavings] = useState<Savings[]>([]);
  const [loading, setLoading] = useState(true);

  const [showForm, setShowForm] = useState(false);
  const [newSavingsName, setNewSavingsName] = useState("");
  const [newSavingsAmount, setNewSavingsAmount] = useState("");

  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [txAmount, setTxAmount] = useState("");
  const [txDate, setTxDate] = useState("");
  const [txType, setTxType] = useState<"+" | "-">("+");
  const [deleting, setDeleting] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);

  const { showAmounts, toggleShowAmounts } = useAmountsVisibility();

  // --- Tinder-style card stack ---
  const [currentIndex, setCurrentIndex] = useState(0);
  const [dragX, setDragX] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const [exiting, setExiting] = useState<"left" | "right" | null>(null);
  const dragStartX = useRef(0);
  const hasMovedRef = useRef(false);

  // ✅ icon paths
  const getIconPaths = (name: string) => {
    if (!name) return [];
    const formatted = name.toLowerCase().replace(/\s+/g, "");
    return [
      `/${formatted}.png`,
      `/${formatted}.jpg`,
      `/${formatted}.jpeg`,
      `/${formatted}.webp`,
    ];
  };

  useEffect(() => {
    const fetchSavings = async () => {
      try {
        const data = await getSavings();
        const normalized: Savings[] = Array.isArray(data) ? data : [data];
        const withTransactions = normalized.map((item) => ({
          ...item,
          transactions: item.transactions ?? [],
        }));
        setSavings(withTransactions);
      } catch (err) {
        console.error(err);
        showToast("Failed to load savings", "error");
      } finally {
        setLoading(false);
      }
    };
    fetchSavings();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const mask = (value: number) =>
    "*".repeat(value.toLocaleString().length);

  const selectedItem = savings.find((s) => s._id === selectedId) || null;

  const openDetails = (id: string) => {
    setSelectedId(id);
    setTxAmount("");
    setTxDate("");
    setTxType("+");
    setMenuOpen(false);
  };

  const closeDetails = () => {
    setSelectedId(null);
    setTxAmount("");
    setTxDate("");
    setTxType("+");
    setMenuOpen(false);
  };

  const handleAddSavings = async () => {
    if (!newSavingsName || !newSavingsAmount) return;

    const newItem = {
      name: newSavingsName,
      initialAmount: Number(newSavingsAmount),
      transactions: [],
    };

    try {
      const saved = await createSavings(newItem);
      setSavings((prev) => [
        ...prev,
        {
          ...saved,
          transactions: saved.transactions ?? [],
        },
      ]);

      setNewSavingsName("");
      setNewSavingsAmount("");
      setShowForm(false);
      showToast("Savings added successfully!", "success");
    } catch (err) {
      console.error(err);
      showToast("Failed to add savings", "error");
    }
  };

  const handleAddTransaction = async () => {
    if (!selectedId || !txAmount || !txDate) return;

    const value = txType === "-" ? -Math.abs(Number(txAmount)) : Number(txAmount);

    const transaction = {
      date: txDate,
      amount: value,
      type: "transaction",
    };

    try {
      const updated = await addSavingsTransaction(selectedId, transaction);
      setSavings((prev) =>
        prev.map((item) =>
          item._id === selectedId
            ? { ...updated, transactions: updated.transactions ?? [] }
            : item
        )
      );

      setTxAmount("");
      setTxDate("");
      setTxType("+");
      showToast("Transaction added!", "success");
    } catch (err) {
      console.error(err);
      showToast("Failed to add transaction", "error");
    }
  };

  const handleDeleteSavings = async () => {
    if (!selectedId) return;
    if (!confirm("Are you sure you want to delete this savings?")) return;

    setDeleting(true);

    try {
      await deleteSavings(selectedId);
      setSavings((prev) => prev.filter((s) => s._id !== selectedId));
      showToast("Savings deleted!", "success");
      closeDetails();
    } catch (err) {
      console.error(err);
      showToast("Failed to delete savings", "error");
    } finally {
      setDeleting(false);
    }
  };

  const getBalance = (item: Savings) => {
    const deposits = (item.transactions ?? []).reduce(
      (sum, t) => sum + (t.amount > 0 ? Number(t.amount) : 0),
      0
    );
    const withdrawals = (item.transactions ?? []).reduce(
      (sum, t) => sum + (t.amount < 0 ? Math.abs(Number(t.amount)) : 0),
      0
    );
    return item.initialAmount + deposits - withdrawals;
  };

  const totalBalance = savings.reduce((sum, item) => sum + getBalance(item), 0);

  // Keep the stack index in range if a card is deleted or the list reloads.
  useEffect(() => {
    setCurrentIndex((i) => Math.min(i, Math.max(0, savings.length - 1)));
  }, [savings.length]);

  // Auto-advance the fly-off animation, then hand off to the next/previous card.
  useEffect(() => {
    if (!exiting) return;

    const timer = setTimeout(() => {
      setCurrentIndex((i) => (exiting === "left" ? i + 1 : i - 1));
      setDragX(0);
      setExiting(null);
    }, 220);

    return () => clearTimeout(timer);
  }, [exiting]);

  const handlePointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    if (exiting) return;
    setIsDragging(true);
    hasMovedRef.current = false;
    dragStartX.current = e.clientX;
    e.currentTarget.setPointerCapture(e.pointerId);
  };

  const handlePointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!isDragging) return;
    const dx = e.clientX - dragStartX.current;
    if (Math.abs(dx) > 6) hasMovedRef.current = true;
    setDragX(dx);
  };

  const handlePointerUp = () => {
    if (!isDragging) return;
    setIsDragging(false);

    const SWIPE_THRESHOLD = 90;
    if (dragX <= -SWIPE_THRESHOLD && currentIndex < savings.length - 1) {
      setExiting("left");
    } else if (dragX >= SWIPE_THRESHOLD && currentIndex > 0) {
      setExiting("right");
    } else {
      setDragX(0);
    }
  };

  const handleTopCardClick = (id: string) => {
    if (hasMovedRef.current) return;
    openDetails(id);
  };

  if (loading) {
    return <div className="p-4 text-center">Loading...</div>;
  }

  return (
    <div className="pb-6 pt-8 font-sans bg-[var(--bg-page)] h-full flex flex-col">
      <style>{`
        .savings-scroll::-webkit-scrollbar { display: none; }
        .savings-scroll { scrollbar-width: none; -ms-overflow-style: none; }
      `}</style>

      <div className="px-6 max-w-md mx-auto w-full shrink-0">
        {/* HEADER */}
        <div className="mb-4 flex justify-between items-start">
          <div className="flex w-full items-center justify-between gap-3">
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
              className="px-[0.7rem] py-[0.3rem]  bg-[var(--btn-bg)] text-[var(--btn-text)]  font-bold rounded-4xl text-sm"
            >
              +
            </button>
          </div>
        </div>

        {/* ADD SAVINGS MODAL */}
        <Modal open={showForm} onClose={() => setShowForm(false)} title="Add Savings">
          <input
            type="text"
            placeholder="Savings name"
            value={newSavingsName}
            onChange={(e) => setNewSavingsName(e.target.value)}
            className="w-full px-3 py-2 bg-[var(--bg-input)] text-[var(--text-primary)] border border-gray-600 rounded-lg focus:border-[#2DE0E6]/50 outline-none"
          />

          <input
            type="number"
            placeholder="Initial amount"
            value={newSavingsAmount}
            onChange={(e) => setNewSavingsAmount(e.target.value)}
            className="w-full px-3 py-2 bg-[var(--bg-input)] text-[var(--text-primary)] border border-gray-600 rounded-lg focus:border-[#2DE0E6]/50 outline-none"
          />

          <div className="flex justify-end gap-2 pt-2">
            <button
              onClick={() => setShowForm(false)}
              className="px-3 py-1 text-gray-400"
            >
              Cancel
            </button>

            <button
              onClick={handleAddSavings}
              className="px-3 py-1 bg-[var(--btn-bg)] text-[var(--btn-text)] font-semibold rounded-lg"
            >
              Save
            </button>
          </div>
        </Modal>

        {/* SUMMARY */}
        <div className="mb-6 p-4 bg-[var(--bg-surface)] rounded-xl text-center">
          <p className="text-[var(--text-secondary)] text-sm">Total Balance</p>
          <p className="text-[2.5rem] font-bold text-[var(--text-primary)]">
            {showAmounts ? totalBalance.toLocaleString() : mask(totalBalance)}
          </p>
        </div>

        <div className="flex items-center gap-2 mb-3">
          <span className="w-1 h-4 bg-[#2DE0E6] rounded-full" />
          <h2 className="text-[var(--text-primary)] font-semibold">My Accounts</h2>
        </div>
      </div>

      {/* TINDER-STYLE CARD STACK */}
      {savings.length === 0 ? (
        <p className="px-6 max-w-md mx-auto text-[var(--text-secondary)] text-sm text-center py-8 shrink-0">
          No savings yet. Add one to get started!
        </p>
      ) : (
        <div className="flex-1 min-h-0 flex flex-col items-center px-6">
          <div className="relative flex-1 min-h-0 w-full max-w-[220px] flex items-center justify-center">
            {[2, 1, 0].map((depth) => {
              const item = savings[currentIndex + depth];
              if (!item) return null;

              const isTop = depth === 0;
              const balance = getBalance(item);
              const paths = getIconPaths(item.name);

              const topTransformX = exiting === "left" ? -600 : exiting === "right" ? 600 : dragX;
              const rotation = topTransformX / 20;

              const style: React.CSSProperties = isTop
                ? {
                    transform: `translateX(${topTransformX}px) rotate(${rotation}deg)`,
                    transition: isDragging ? "none" : "transform 0.28s ease, opacity 0.28s ease",
                    opacity: exiting ? 0 : 1,
                    zIndex: 30,
                    touchAction: "pan-y",
                  }
                : {
                    transform: `translateY(${depth * 10}px) scale(${1 - depth * 0.045})`,
                    opacity: 1 - depth * 0.25,
                    zIndex: 30 - depth * 10,
                  };

              return (
                <div
                  key={item._id}
                  className={`absolute inset-0 h-full aspect-[3/5] mx-auto flex flex-col select-none ${
                    isTop ? "" : "pointer-events-none"
                  }`}
                  style={style}
                  onPointerDown={isTop ? handlePointerDown : undefined}
                  onPointerMove={isTop ? handlePointerMove : undefined}
                  onPointerUp={isTop ? handlePointerUp : undefined}
                  onPointerCancel={isTop ? handlePointerUp : undefined}
                  onClick={isTop ? () => handleTopCardClick(item._id) : undefined}
                >
                  <div className="w-full flex-1 min-h-0 rounded-2xl overflow-hidden bg-[var(--bg-input)] border border-[#2DE0E6]/30 relative flex items-center justify-center shadow-xl cursor-grab active:cursor-grabbing">
                    <img
                      src={paths[0]}
                      alt={item.name}
                      draggable={false}
                      className="w-full h-full object-cover pointer-events-none"
                      onError={(e) => {
                        const img = e.currentTarget;
                        const pathIndex = paths.indexOf(
                          img.src.replace(window.location.origin, "")
                        );
                        const nextPath = paths[pathIndex + 1];

                        if (nextPath) {
                          img.src = nextPath;
                        } else {
                          img.style.display = "none";
                          if (img.nextSibling) {
                            (img.nextSibling as HTMLElement).style.display = "flex";
                          }
                        }
                      }}
                    />
                    <span className="hidden absolute inset-0 items-center justify-center text-2xl font-bold text-[#2DE0E6]">
                      {item.name?.charAt(0).toUpperCase()}
                    </span>
                  </div>

                  <p className="mt-2 text-sm font-semibold text-[var(--text-primary)] truncate shrink-0 text-center">
                    {item.name}
                  </p>
                  <p className="text-sm font-bold text-[var(--text-primary)] shrink-0 text-center">
                    {showAmounts ? balance.toLocaleString() : mask(balance)}
                  </p>
                </div>
              );
            })}
          </div>

          {savings.length > 1 && (
            <p className="text-xs text-[var(--text-secondary)] mt-2 shrink-0">
              {currentIndex + 1} / {savings.length} · swipe to browse
            </p>
          )}
        </div>
      )}

      {/* DETAILS MODAL */}
      <Modal open={!!selectedItem} onClose={closeDetails} title={selectedItem?.name}>
        {selectedItem && (
          <>
            <div className="w-full h-24 rounded-lg overflow-hidden bg-[var(--bg-input)] border border-[#2DE0E6]/30 relative flex items-center justify-center">
              <img
                src={getIconPaths(selectedItem.name)[0]}
                alt={selectedItem.name}
                className="w-full h-full object-cover"
                onError={(e) => {
                  const img = e.currentTarget;
                  const paths = getIconPaths(selectedItem.name);
                  const currentIndex = paths.indexOf(
                    img.src.replace(window.location.origin, "")
                  );
                  const nextPath = paths[currentIndex + 1];

                  if (nextPath) {
                    img.src = nextPath;
                  } else {
                    img.style.display = "none";
                    if (img.nextSibling) {
                      (img.nextSibling as HTMLElement).style.display = "flex";
                    }
                  }
                }}
              />
              <span className="hidden absolute inset-0 items-center justify-center text-2xl font-bold text-[#2DE0E6]">
                {selectedItem.name?.charAt(0).toUpperCase()}
              </span>
            </div>

            <div className="text-center pb-2">
              <p className="text-[var(--text-secondary)] text-xs">Balance</p>
              <p className="text-2xl font-bold text-[var(--text-primary)]">
                {showAmounts
                  ? getBalance(selectedItem).toLocaleString()
                  : mask(getBalance(selectedItem))}
              </p>
            </div>

            {(selectedItem.transactions ?? []).length > 0 && (
              <ul className="text-xs text-[var(--text-primary)] space-y-1 max-h-32 overflow-y-auto border-t border-b border-[var(--border-subtle)] py-2">
                {(selectedItem.transactions ?? []).map((t, i) => (
                  <li key={i} className="flex justify-between">
                    <span>{t.date}</span>
                    <span
                      className={
                        t.amount < 0 ? "text-[#C93B8C]" : "text-[var(--text-primary)]"
                      }
                    >
                      {t.amount > 0 ? "+" : "-"}
                      {Math.abs(t.amount).toLocaleString()}
                    </span>
                  </li>
                ))}
              </ul>
            )}

            <input
              type="date"
              value={txDate}
              onChange={(e) => setTxDate(e.target.value)}
              className="w-full px-3 py-2 bg-[var(--bg-input)] text-sm text-[var(--text-primary)] border border-gray-600 rounded-lg focus:border-[#2DE0E6]/50 outline-none"
            />

            <div className="flex gap-2">
              <select
                value={txType}
                onChange={(e) => setTxType(e.target.value as "+" | "-")}
                className="w-20 px-2 py-2 bg-[var(--bg-input)] rounded-lg text-sm text-[var(--text-primary)] border border-gray-600 focus:border-[#2DE0E6]/50 outline-none"
              >
                <option value="+">+</option>
                <option value="-">-</option>
              </select>

              <input
                type="number"
                placeholder="Enter amount"
                value={txAmount}
                onChange={(e) => setTxAmount(e.target.value)}
                className="flex-1 px-3 py-2 bg-[var(--bg-input)] rounded-lg text-sm text-[var(--text-primary)] border border-gray-600 focus:border-[#2DE0E6]/50 outline-none"
              />
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={handleAddTransaction}
                className="flex-1 bg-[var(--btn-bg)] text-[var(--btn-text)] font-bold py-2 rounded-lg text-sm"
              >
                Add Transaction
              </button>

              <div className="relative shrink-0">
                <button
                  onClick={() => setMenuOpen((prev) => !prev)}
                  className="flex items-center justify-center w-9 h-9 rounded-lg text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-input)]"
                  aria-label="More actions"
                >
                  <EllipsisVerticalIcon className="w-5 h-5" />
                </button>

                {menuOpen && (
                  <>
                    <div className="fixed inset-0 z-10" onClick={() => setMenuOpen(false)} />
                    <div className="absolute right-0 bottom-full mb-1 z-20 w-36 bg-[var(--bg-surface)] border border-[var(--border-subtle)] rounded-lg shadow-lg overflow-hidden">
                      <button
                        onClick={() => {
                          setMenuOpen(false);
                          handleDeleteSavings();
                        }}
                        disabled={deleting}
                        className="w-full flex items-center gap-2 px-3 py-2 text-sm text-red-400 hover:bg-[var(--bg-input)] disabled:opacity-50"
                      >
                        <TrashIcon className="w-4 h-4" />
                        {deleting ? "Deleting..." : "Delete"}
                      </button>
                    </div>
                  </>
                )}
              </div>
            </div>
          </>
        )}
      </Modal>
    </div>
  );
}
