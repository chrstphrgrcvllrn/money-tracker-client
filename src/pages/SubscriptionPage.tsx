import { useEffect, useState } from "react";
import type { Subscription } from "../types/subscription.type";
import {
  getSubscriptions,
  createSubscription,
  updateSubscription,
  deleteSubscription,
} from "../api/subscription";

import {
  EyeIcon,
  EyeSlashIcon,
  TrashIcon,
  CheckIcon,
  LinkIcon,
  ShoppingBagIcon,
  TvIcon,
  WrenchScrewdriverIcon,
  SparklesIcon,
  DevicePhoneMobileIcon,
  ScissorsIcon,
} from "@heroicons/react/24/outline";

type ItemIcon = React.ComponentType<{ className?: string }>;

// Best-effort icon by keyword match on the item name — the Buy List has no
// category field, so this is inferred rather than stored.
const ICON_RULES: { keywords: string[]; icon: ItemIcon }[] = [
  { keywords: ["haircut", "salon", "spa", "massage"], icon: ScissorsIcon },
  { keywords: ["load", "sim", "data plan", "prepaid"], icon: DevicePhoneMobileIcon },
  {
    keywords: ["tv", "television", "cctv", "camera", "speaker", "router", "laptop", "computer"],
    icon: TvIcon,
  },
  {
    keywords: [
      "tile",
      "hagdan",
      "window",
      "steel",
      "grille",
      "solar",
      "light",
      "cement",
      "paint",
      "lababo",
    ],
    icon: WrenchScrewdriverIcon,
  },
  {
    keywords: [
      "wipe",
      "perfume",
      "wax",
      "deo",
      "spray",
      "towel",
      "tuwalya",
      "shampoo",
      "soap",
      "lotion",
    ],
    icon: SparklesIcon,
  },
];

const getItemIcon = (name: string): ItemIcon => {
  const lower = (name || "").toLowerCase();
  const rule = ICON_RULES.find((r) => r.keywords.some((kw) => lower.includes(kw)));
  return rule ? rule.icon : ShoppingBagIcon;
};

import Modal from "../components/Modal";
import { useToast } from "../components/useToast";
import { useAmountsVisibility } from "../components/useAmountsVisibility";
import SlidingTabs from "../components/SlidingTabs";

const emptyForm = {
  name: "",
  amount: 0,
  quantity: 1,
  notes: "",
};

const itemTotal = (item: Subscription) =>
  Number(item.amount || 0) * Number(item.quantity || 1);

export default function SubscriptionPage() {
  const showToast = useToast();

  const [items, setItems] = useState<Subscription[]>([]);
  const [loading, setLoading] = useState(true);
  const { showAmounts, toggleShowAmounts } = useAmountsVisibility();
  const [tab, setTab] = useState<"ongoing" | "completed">("ongoing");

  const [showForm, setShowForm] = useState(false);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);

  // When null we're adding a new item; when set we're editing that item
  const [editingItem, setEditingItem] = useState<Subscription | null>(null);
  const [form, setForm] = useState(emptyForm);

  const load = async () => {
    try {
      const data = await getSubscriptions();
      setItems(data);
    } catch (err) {
      console.error(err);
      showToast("Failed to load buy list", "error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const mask = (value: number) => "*".repeat(value.toLocaleString().length);

  const closeModal = () => {
    setShowForm(false);
    setEditingItem(null);
    setForm(emptyForm);
  };

  const openAddModal = () => {
    setEditingItem(null);
    setForm(emptyForm);
    setShowForm(true);
  };

  const openEditModal = (item: Subscription) => {
    setEditingItem(item);
    setForm({
      name: item.name ?? "",
      amount: item.amount ?? 0,
      quantity: item.quantity ?? 1,
      notes: item.notes ?? "",
    });
    setShowForm(true);
  };

  const handleSave = async () => {
    if (!form.name.trim()) {
      showToast("Please enter an item name", "error");
      return;
    }

    setSaving(true);

    try {
      if (editingItem) {
        const updated = await updateSubscription(editingItem._id, {
          name: form.name.trim(),
          amount: form.amount,
          quantity: form.quantity || 1,
          notes: form.notes.trim(),
        });

        setItems((prev) =>
          prev.map((item) => (item._id === updated._id ? updated : item))
        );
        showToast("Item updated!", "success");
      } else {
        const created = await createSubscription({
          name: form.name.trim(),
          amount: form.amount,
          quantity: form.quantity || 1,
          notes: form.notes.trim(),
        });

        setItems((prev) => [created, ...prev]);
        showToast("Item added!", "success");
      }

      closeModal();
    } catch (err) {
      console.error("SAVE ERROR:", err);
      showToast("Failed to save item", "error");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!editingItem) return;
    if (!confirm("Delete this item?")) return;

    const id = editingItem._id;
    setDeleting(true);

    try {
      await deleteSubscription(id);
      setItems((prev) => prev.filter((item) => item._id !== id));
      showToast("Item deleted!", "success");
      closeModal();
    } catch (err) {
      console.error("DELETE ERROR:", err);
      showToast("Failed to delete item", "error");
    } finally {
      setDeleting(false);
    }
  };

  const handleToggleCompleted = async (item: Subscription) => {
    // Optimistic update
    setItems((prev) =>
      prev.map((i) => (i._id === item._id ? { ...i, completed: !i.completed } : i))
    );

    try {
      await updateSubscription(item._id, { completed: !item.completed });
    } catch (err) {
      console.error("TOGGLE COMPLETED ERROR:", err);
      // Roll back on failure
      setItems((prev) =>
        prev.map((i) => (i._id === item._id ? { ...i, completed: item.completed } : i))
      );
      showToast("Failed to update item", "error");
    }
  };

  const filteredItems = items.filter((item) =>
    tab === "completed" ? item.completed : !item.completed
  );

  const total = filteredItems.reduce((sum, item) => sum + itemTotal(item), 0);

  // Keep the modal's view of the item in sync with optimistic updates
  // (e.g. toggling completed) made to the `items` list while it's open.
  const editingItemLive = editingItem
    ? items.find((i) => i._id === editingItem._id) ?? editingItem
    : null;

  if (loading) {
    return <div className="p-4 text-center text-[var(--text-primary)]">Loading...</div>;
  }

  return (
    <div className="px-6 pb-6 mt-8 max-w-md mx-auto font-sans bg-[var(--bg-page)]">

      {/* HEADER */}
      <div className="mb-4 flex justify-between items-center">
        <h1 className="text-lg font-semibold text-[var(--text-primary)]">Buy List</h1>

        <div className="flex items-center gap-3">
          <button onClick={toggleShowAmounts} className="text-[var(--text-secondary)]">
            {showAmounts ? (
              <EyeSlashIcon className="w-5 h-5" />
            ) : (
              <EyeIcon className="w-5 h-5" />
            )}
          </button>

          <button
            onClick={openAddModal}
            className="px-[0.7rem] py-[0.3rem] bg-[var(--btn-bg)] text-[var(--btn-text)] font-bold rounded-4xl text-sm"
          >
            +
          </button>
        </div>
      </div>

      {/* TABS */}
      <SlidingTabs
        className="mb-4"
        tabs={[
          { value: "ongoing", label: "Ongoing" },
          { value: "completed", label: "Completed" },
        ]}
        active={tab}
        onChange={setTab}
      />

      {/* TOTAL */}
      <div className="mb-6 p-4 bg-[var(--bg-surface)] rounded-xl text-center">
        <p className="text-[var(--text-secondary)] text-sm">Total</p>
        <p className="text-[2rem] font-bold text-[var(--text-primary)]">
          ₱{showAmounts ? total.toLocaleString() : mask(total)}
        </p>
      </div>

      {/* LIST */}
      <div>
        {filteredItems.length === 0 ? (
          <div className="text-center py-12 text-[var(--text-secondary)]">
            {tab === "completed" ? "No completed items yet." : "No items yet. Add one to get started!"}
          </div>
        ) : (
          filteredItems.map((item, idx, arr) => {
            const Icon = getItemIcon(item.name);

            return (
            <div
              key={item._id}
              className={`w-full flex items-center gap-3 py-3 ${
                idx !== arr.length - 1 ? "border-b border-[var(--border-subtle)]" : ""
              }`}
            >
              <div className="shrink-0 w-9 h-9 rounded-lg flex items-center justify-center border border-[#2DE0E6]/40">
                <Icon className="w-4 h-4 text-[var(--text-primary)]" />
              </div>

              <button
                onClick={() => openEditModal(item)}
                className="flex-1 min-w-0 flex items-center gap-2 text-left"
              >
                <span
                  className={`truncate font-medium text-sm ${
                    item.completed ? "text-[var(--text-secondary)] line-through" : "text-[var(--text-primary)]"
                  }`}
                >
                  {item.name}
                </span>
                {Number(item.quantity || 1) > 1 && (
                  <span className="shrink-0 text-xs text-[var(--text-secondary)]">
                    x{item.quantity}
                  </span>
                )}
                {!!item.notes && (
                  <LinkIcon className="shrink-0 w-3 h-3 text-[var(--text-secondary)]" />
                )}
              </button>

              <button
                onClick={() => openEditModal(item)}
                className={`shrink-0 text-sm font-bold ${
                  item.completed ? "text-[var(--text-secondary)]" : "text-[var(--text-primary)]"
                }`}
              >
                ₱{showAmounts ? itemTotal(item).toLocaleString() : mask(itemTotal(item))}
              </button>
            </div>
            );
          })
        )}
      </div>

      {/* ADD / EDIT MODAL */}
      <Modal
        open={showForm}
        onClose={closeModal}
        title={editingItem ? "Edit Item" : "Add Item"}
      >
        <div>
          <label className="block text-sm text-gray-400 mb-2">Item</label>
          <input
            placeholder="e.g. Netflix"
            value={form.name}
            onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))}
            className="w-full px-3 py-2 rounded-lg bg-[var(--bg-input)] text-[var(--text-primary)] border border-gray-600 focus:border-[#2DE0E6]/50 outline-none"
          />
        </div>

        <div className="flex gap-2">
          <div className="flex-1">
            <label className="block text-sm text-gray-400 mb-2">Price</label>
            <input
              type="number"
              placeholder="0"
              value={form.amount || ""}
              onChange={(e) => setForm((p) => ({ ...p, amount: Number(e.target.value) }))}
              className="w-full px-3 py-2 rounded-lg bg-[var(--bg-input)] text-[var(--text-primary)] border border-gray-600 focus:border-[#2DE0E6]/50 outline-none"
            />
          </div>

          <div className="w-24">
            <label className="block text-sm text-gray-400 mb-2">Qty</label>
            <input
              type="number"
              min={1}
              placeholder="1"
              value={form.quantity || ""}
              onChange={(e) => setForm((p) => ({ ...p, quantity: Number(e.target.value) }))}
              className="w-full px-3 py-2 rounded-lg bg-[var(--bg-input)] text-[var(--text-primary)] border border-gray-600 focus:border-[#2DE0E6]/50 outline-none"
            />
          </div>
        </div>

        {form.amount > 0 && form.quantity > 1 && (
          <p className="text-xs text-gray-500">
            {form.amount.toLocaleString()} × {form.quantity} = ₱
            {(form.amount * form.quantity).toLocaleString()}
          </p>
        )}

        <div>
          <label className="block text-sm text-gray-400 mb-2">Notes</label>
          <textarea
            placeholder="Where to buy, links, etc."
            value={form.notes}
            onChange={(e) => setForm((p) => ({ ...p, notes: e.target.value }))}
            className="w-full px-3 py-2 rounded-lg bg-[var(--bg-input)] text-[var(--text-primary)] border border-gray-600 focus:border-[#2DE0E6]/50 outline-none resize-none"
            rows={2}
          />
        </div>

        <div className="flex items-center gap-2 pt-2">
          {editingItemLive && (
            <>
              <button
                onClick={() => handleToggleCompleted(editingItemLive)}
                title={editingItemLive.completed ? "Mark as ongoing" : "Mark as completed"}
                className={`shrink-0 flex items-center justify-center w-10 h-10 rounded-lg border transition ${
                  editingItemLive.completed
                    ? "bg-[var(--btn-bg)] border-[#2DE0E6]"
                    : "border-[#2DE0E6]/40 hover:border-[#2DE0E6]"
                }`}
              >
                <CheckIcon
                  className={`w-4 h-4 ${
                    editingItemLive.completed ? "text-[var(--btn-text)]" : "text-[var(--text-secondary)]"
                  }`}
                />
              </button>

              <button
                onClick={handleDelete}
                disabled={deleting}
                className="flex items-center justify-center gap-2 px-4 py-2 text-red-400 hover:text-red-500 border border-red-500/30 hover:border-red-500/50 rounded-lg disabled:opacity-50"
              >
                <TrashIcon className="w-4 h-4" />
                {deleting ? "Deleting..." : "Delete"}
              </button>
            </>
          )}

          <button
            onClick={closeModal}
            className="flex-1 px-4 py-2 text-gray-400 hover:text-[var(--text-primary)] border border-gray-600 rounded-lg"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={saving}
            className="flex-1 px-4 py-2 bg-[var(--btn-bg)] text-[var(--btn-text)] font-semibold rounded-lg disabled:opacity-50"
          >
            {saving ? "Saving..." : "Save"}
          </button>
        </div>
      </Modal>
    </div>
  );
}
