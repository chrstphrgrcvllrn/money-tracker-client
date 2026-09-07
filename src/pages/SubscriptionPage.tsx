import { useEffect, useState } from "react";
import type { Subscription } from "../types/subscription.type";
import {
  getSubscriptions,
  createSubscription,
  updateSubscription,
  deleteSubscription,
} from "../api/subscription";

import { EyeIcon, EyeSlashIcon, TrashIcon } from "@heroicons/react/24/outline";

import Modal from "../components/Modal";
import { useToast } from "../components/useToast";

const emptyForm = {
  name: "",
  amount: 0,
};

export default function SubscriptionPage() {
  const showToast = useToast();

  const [items, setItems] = useState<Subscription[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAmounts, setShowAmounts] = useState(true);

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
    setForm({ name: item.name ?? "", amount: item.amount ?? 0 });
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
        });

        setItems((prev) =>
          prev.map((item) => (item._id === updated._id ? updated : item))
        );
        showToast("Item updated!", "success");
      } else {
        const created = await createSubscription({
          name: form.name.trim(),
          amount: form.amount,
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

  const total = items.reduce((sum, item) => sum + Number(item.amount || 0), 0);

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

      {/* TOTAL */}
      <div className="mb-6 p-4 bg-[#1C1C1E] rounded-xl text-center">
        <p className="text-gray-400 text-sm">Total</p>
        <p className="text-[2rem] font-bold text-[#85D989]">
          ₱{showAmounts ? total.toLocaleString() : mask(total)}
        </p>
      </div>

      {/* LIST */}
      <div className="space-y-2">
        {items.length === 0 ? (
          <div className="text-center py-12 text-gray-500">
            No items yet. Add one to get started!
          </div>
        ) : (
          items.map((item) => (
            <button
              key={item._id}
              onClick={() => openEditModal(item)}
              className="w-full flex items-center gap-3 bg-[#1C1C1E] hover:bg-[#242426] rounded-xl px-4 py-3 text-left transition"
            >
              <span className="flex-1 min-w-0 truncate text-white font-medium text-sm">
                {item.name}
              </span>
              <span className="shrink-0 text-sm font-bold text-[#85D989]">
                ₱{showAmounts ? Number(item.amount || 0).toLocaleString() : mask(Number(item.amount || 0))}
              </span>
            </button>
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

        <div>
          <label className="block text-sm text-gray-400 mb-2">Price</label>
          <input
            type="number"
            placeholder="0"
            value={form.amount || ""}
            onChange={(e) => setForm((p) => ({ ...p, amount: Number(e.target.value) }))}
            className="w-full px-3 py-2 rounded-lg bg-[#2C2C2E] text-white border border-gray-600 focus:border-[#DFF966]/50 outline-none"
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
