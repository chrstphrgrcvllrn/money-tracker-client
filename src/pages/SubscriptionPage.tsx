import { useEffect, useState } from "react";
import type { Subscription } from "../types/subscription.type";
import {
  getSubscriptions,
  createSubscription,
  updateSubscription,
  deleteSubscription,
} from "../api/subscription";

import { EyeIcon, EyeSlashIcon, TrashIcon, CheckIcon, LinkIcon } from "@heroicons/react/24/outline";

import Modal from "../components/Modal";
import { useToast } from "../components/useToast";

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
  const [showAmounts, setShowAmounts] = useState(true);
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

  if (loading) {
    return <div className="p-4 text-center text-white">Loading...</div>;
  }

  return (
    <div className="px-6 pb-6 mt-8 max-w-md mx-auto font-sans bg-[#000000]">

      {/* HEADER */}
      <div className="mb-4 flex justify-between items-center">
        <h1 className="text-lg font-semibold text-white">Buy List</h1>

        <div className="flex items-center gap-3">
          <button onClick={() => setShowAmounts((p) => !p)} className="text-gray-400">
            {showAmounts ? (
              <EyeSlashIcon className="w-5 h-5" />
            ) : (
              <EyeIcon className="w-5 h-5" />
            )}
          </button>

          <button
            onClick={openAddModal}
            className="px-[0.7rem] py-[0.3rem] bg-[#DFF966] text-black font-bold rounded-4xl text-sm"
          >
            +
          </button>
        </div>
      </div>

      {/* TABS */}
      <div className="flex gap-2 mb-4">
        <button
          onClick={() => setTab("ongoing")}
          className={`px-3 py-1 rounded-full text-xs ${
            tab === "ongoing"
              ? "bg-[#DFF966] text-black font-bold"
              : "bg-[#1C1C1E] text-gray-400"
          }`}
        >
          Ongoing
        </button>

        <button
          onClick={() => setTab("completed")}
          className={`px-3 py-1 rounded-full text-xs ${
            tab === "completed"
              ? "bg-[#DFF966] text-black font-bold"
              : "bg-[#1C1C1E] text-gray-400"
          }`}
        >
          Completed
        </button>
      </div>

      {/* TOTAL */}
      <div className="mb-6 p-4 bg-[#1C1C1E] rounded-xl text-center">
        <p className="text-gray-400 text-sm">Total</p>
        <p className="text-[2rem] font-bold text-[#85D989]">
          ₱{showAmounts ? total.toLocaleString() : mask(total)}
        </p>
      </div>

      {/* LIST */}
      <div className="space-y-2">
        {filteredItems.length === 0 ? (
          <div className="text-center py-12 text-gray-500">
            {tab === "completed" ? "No completed items yet." : "No items yet. Add one to get started!"}
          </div>
        ) : (
          filteredItems.map((item) => (
            <div
              key={item._id}
              className="w-full flex items-center gap-3 bg-[#2C2C2E] border border-gray-600 rounded-xl px-4 py-3"
            >
              <button
                onClick={() => handleToggleCompleted(item)}
                className={`shrink-0 w-6 h-6 rounded-full flex items-center justify-center border transition ${
                  item.completed
                    ? "bg-[#DFF966] border-[#DFF966]"
                    : "border-gray-600 hover:border-gray-400"
                }`}
              >
                {item.completed && <CheckIcon className="w-4 h-4 text-black" />}
              </button>

              <button
                onClick={() => openEditModal(item)}
                className="flex-1 min-w-0 flex items-center gap-2 text-left"
              >
                <span
                  className={`truncate font-medium text-sm ${
                    item.completed ? "text-gray-500 line-through" : "text-white"
                  }`}
                >
                  {item.name}
                </span>
                {Number(item.quantity || 1) > 1 && (
                  <span className="shrink-0 text-xs text-gray-500">
                    x{item.quantity}
                  </span>
                )}
                {!!item.notes && (
                  <LinkIcon className="shrink-0 w-3 h-3 text-gray-500" />
                )}
              </button>

              <button
                onClick={() => openEditModal(item)}
                className={`shrink-0 text-sm font-bold ${
                  item.completed ? "text-gray-500" : "text-[#85D989]"
                }`}
              >
                ₱{showAmounts ? itemTotal(item).toLocaleString() : mask(itemTotal(item))}
              </button>
            </div>
          ))
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
            className="w-full px-3 py-2 rounded-lg bg-[#2C2C2E] text-white border border-gray-600 focus:border-[#DFF966]/50 outline-none"
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
              className="w-full px-3 py-2 rounded-lg bg-[#2C2C2E] text-white border border-gray-600 focus:border-[#DFF966]/50 outline-none"
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
              className="w-full px-3 py-2 rounded-lg bg-[#2C2C2E] text-white border border-gray-600 focus:border-[#DFF966]/50 outline-none"
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
            className="w-full px-3 py-2 rounded-lg bg-[#2C2C2E] text-white border border-gray-600 focus:border-[#DFF966]/50 outline-none resize-none"
            rows={2}
          />
        </div>

        <div className="flex items-center gap-2 pt-2">
          {editingItem && (
            <button
              onClick={handleDelete}
              disabled={deleting}
              className="flex items-center justify-center gap-2 px-4 py-2 text-red-400 hover:text-red-500 border border-red-500/30 hover:border-red-500/50 rounded-lg disabled:opacity-50"
            >
              <TrashIcon className="w-4 h-4" />
              {deleting ? "Deleting..." : "Delete"}
            </button>
          )}

          <button
            onClick={closeModal}
            className="flex-1 px-4 py-2 text-gray-400 hover:text-white border border-gray-600 rounded-lg"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={saving}
            className="flex-1 px-4 py-2 bg-[#DFF966] text-black font-semibold rounded-lg disabled:opacity-50"
          >
            {saving ? "Saving..." : "Save"}
          </button>
        </div>
      </Modal>
    </div>
  );
}
