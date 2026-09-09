import { useEffect, useState } from "react";
import { TrashIcon, PlusIcon } from "@heroicons/react/24/solid";

import type { TrackerCategory, TrackerEntry } from "../types/tracker.type";
import {
  fetchTrackerEntries,
  createTrackerEntry,
  updateTrackerEntry,
  deleteTrackerEntry,
} from "../api/tracker";

import Modal from "../components/Modal";
import { useToast } from "../components/useToast";
import {
  TrackerIconStyles,
  MedicalIcon,
  DentalIcon,
  MotorcycleIcon,
  CryptoIcon,
  DigitalIcon,
  AmilyarIcon,
} from "../components/icons/TrackerIcons";

const emptyForm = {
  name: "",
  details: "",
  date: new Date().toISOString().split("T")[0],
  amount: 0,
  price: 0,
  notes: "",
};

const TrackerPage: React.FC = () => {
  const showToast = useToast();

  const [activeTab, setActiveTab] = useState<TrackerCategory>("medical");
  const [entries, setEntries] = useState<TrackerEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);

  // When null we're adding a new entry; when set we're editing that entry
  const [editingEntry, setEditingEntry] = useState<TrackerEntry | null>(null);

  const [formData, setFormData] = useState(emptyForm);

  const categories: Record<TrackerCategory, string> = {
    medical: "Medical",
    dental: "Dental",
    motorcycle: "Motorcycle",
    crypto: "Crypto",
    digital: "Digital",
    amilyar: "Amilyar",
  };

  const categoryExamples: Record<TrackerCategory, string> = {
    medical: "e.g. Annual physical exam",
    dental: "e.g. Tooth cleaning",
    motorcycle: "e.g. Changed oil",
    crypto: "e.g. Bought XRP",
    digital: "e.g. Netflix subscription",
    amilyar: "e.g. Amilyar payment",
  };

  const categoryDescriptions: Record<TrackerCategory, string> = {
    medical: "Checkups, visits, and health notes",
    dental: "Cleanings, treatments, and dental visits",
    motorcycle: "Oil changes, maintenance, and repairs",
    crypto: "Purchases, trades, and coin holdings",
    digital: "Subscriptions and recurring payments",
    amilyar: "Property tax and amilyar payments",
  };

  const categoryIcons: Record<TrackerCategory, (props: { className?: string }) => React.ReactElement> = {
    medical: MedicalIcon,
    dental: DentalIcon,
    motorcycle: MotorcycleIcon,
    crypto: CryptoIcon,
    digital: DigitalIcon,
    amilyar: AmilyarIcon,
  };

  const loadEntries = async () => {
    try {
      const data = await fetchTrackerEntries();
      setEntries(data);
    } catch (error) {
      console.error("Failed to load tracker entries:", error);
      showToast("Failed to load tracker entries", "error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadEntries();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const filteredEntries = entries.filter((entry) => entry.category === activeTab);

  const closeModal = () => {
    setShowForm(false);
    setEditingEntry(null);
    setFormData(emptyForm);
  };

  const openAddModal = () => {
    setEditingEntry(null);
    setFormData(emptyForm);
    setShowForm(true);
  };

  const openEditModal = (entry: TrackerEntry) => {
    setEditingEntry(entry);
    setFormData({
      name: entry.name,
      details: entry.details || "",
      date: entry.date.split("T")[0],
      amount: entry.amount || 0,
      price: entry.price || 0,
      notes: entry.notes || "",
    });
    setShowForm(true);
  };

  const handleSaveEntry = async () => {
    if (!formData.name.trim() || !formData.date) {
      showToast("Please fill in the name and date", "error");
      return;
    }

    setSaving(true);

    try {
      if (editingEntry) {
        const updated = await updateTrackerEntry(editingEntry._id, {
          name: formData.name.trim(),
          details: formData.details.trim(),
          date: formData.date,
          amount: formData.amount,
          price: formData.price,
          notes: formData.notes.trim(),
        });

        setEntries((prev) =>
          prev.map((entry) => (entry._id === updated._id ? updated : entry))
        );
        showToast("Entry updated!", "success");
      } else {
        const newEntry = await createTrackerEntry({
          category: activeTab,
          name: formData.name.trim(),
          details: formData.details.trim(),
          date: formData.date,
          amount: formData.amount,
          price: formData.price,
          notes: formData.notes.trim(),
        });

        setEntries((prev) => [newEntry, ...prev]);
        showToast("Entry added successfully!", "success");
      }

      closeModal();
    } catch (error) {
      console.error("Failed to save tracker entry:", error);
      showToast("Failed to save entry", "error");
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteEntry = async () => {
    if (!editingEntry) return;
    if (!confirm("Delete this entry?")) return;

    const id = editingEntry._id;
    setDeleting(true);

    try {
      await deleteTrackerEntry(id);
      setEntries((prev) => prev.filter((entry) => entry._id !== id));
      showToast("Entry deleted!", "success");
      closeModal();
    } catch (error) {
      console.error("Failed to delete tracker entry:", error);
      showToast("Failed to delete entry", "error");
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div className="min-h-[calc(100vh-80px)] bg-[var(--bg-page)] text-[var(--text-primary)] px-5 pt-6 pb-10">
      <TrackerIconStyles />

      <div className="max-w-md mx-auto">
        {/* HEADER */}
        <div className="mb-4">
          <h1 className="text-lg font-semibold text-[var(--text-primary)]">Tracker</h1>
          <p className="text-[var(--text-secondary)] text-sm mt-1">Track your activities and events</p>
        </div>

        {/* CATEGORY LIST */}
        <div className="mb-6">
          {(Object.entries(categories) as [TrackerCategory, string][]).map(
            ([key, label], idx, arr) => {
              const Icon = categoryIcons[key];
              const isActive = activeTab === key;

              return (
                <button
                  key={key}
                  onClick={() => setActiveTab(key)}
                  className={`w-full flex items-center gap-4 py-4 text-left transition ${
                    idx !== arr.length - 1 ? "border-b border-[var(--border-subtle)]" : ""
                  }`}
                >
                  <div
                    className={`shrink-0 w-11 h-11 rounded-lg flex items-center justify-center border transition ${
                      isActive
                        ? "border-[#C9A374] bg-[var(--btn-bg)]/15 text-[#C9A374]"
                        : "border-[#C9A374]/40 text-[#C9A374]/80"
                    }`}
                  >
                    <Icon className="w-5 h-5" />
                  </div>

                  <div className="flex-1 min-w-0">
                    <p className={`text-[var(--text-primary)] ${isActive ? "font-semibold" : "font-medium"}`}>
                      {label}
                    </p>
                    <p className="text-xs text-[var(--text-secondary)] mt-0.5">
                      {categoryDescriptions[key]}
                    </p>
                  </div>
                </button>
              );
            }
          )}
        </div>

        {/* ADD BUTTON */}
        <button
          onClick={openAddModal}
          className="w-full flex items-center gap-2 justify-center bg-[var(--btn-bg)] text-[var(--btn-text)] font-semibold px-4 py-2 rounded-lg mb-6"
        >
          <PlusIcon className="w-4 h-4" />
          Add Entry
        </button>

        {/* ADD / EDIT MODAL */}
        <Modal
          open={showForm}
          onClose={closeModal}
          title={
            editingEntry
              ? `Edit ${categories[activeTab]} Entry`
              : `Add ${categories[activeTab]} Entry`
          }
        >
          <div>
            <label className="block text-sm text-gray-400 mb-2">Name/Title *</label>
            <input
              type="text"
              placeholder={categoryExamples[activeTab]}
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="w-full px-3 py-2 bg-[var(--bg-input)] text-[var(--text-primary)] border border-gray-600 rounded-lg focus:border-[#C9A374]/50 outline-none"
            />
          </div>

          <div>
            <label className="block text-sm text-gray-400 mb-2">Details</label>
            <textarea
              placeholder="e.g., who, what, procedure, result"
              value={formData.details}
              onChange={(e) => setFormData({ ...formData, details: e.target.value })}
              className="w-full px-3 py-2 bg-[var(--bg-input)] text-[var(--text-primary)] border border-gray-600 rounded-lg focus:border-[#C9A374]/50 outline-none resize-none"
              rows={3}
            />
          </div>

          <div>
            <label className="block text-sm text-gray-400 mb-2">Date *</label>
            <input
              type="date"
              value={formData.date}
              onChange={(e) => setFormData({ ...formData, date: e.target.value })}
              className="w-full px-3 py-2 bg-[var(--bg-input)] text-[var(--text-primary)] border border-gray-600 rounded-lg focus:border-[#C9A374]/50 outline-none"
            />
          </div>

          {(activeTab === "crypto" || activeTab === "digital" || activeTab === "amilyar") && (
            <div>
              <label className="block text-sm text-gray-400 mb-2">Amount</label>
              <input
                type="number"
                placeholder="0"
                value={formData.amount || ""}
                onChange={(e) => setFormData({ ...formData, amount: Number(e.target.value) })}
                className="w-full px-3 py-2 bg-[var(--bg-input)] text-[var(--text-primary)] border border-gray-600 rounded-lg focus:border-[#C9A374]/50 outline-none"
              />
            </div>
          )}

          {activeTab === "crypto" && (
            <div>
              <label className="block text-sm text-gray-400 mb-2">Price</label>
              <input
                type="number"
                step="any"
                placeholder="e.g. 11.02"
                value={formData.price || ""}
                onChange={(e) => setFormData({ ...formData, price: Number(e.target.value) })}
                className="w-full px-3 py-2 bg-[var(--bg-input)] text-[var(--text-primary)] border border-gray-600 rounded-lg focus:border-[#C9A374]/50 outline-none"
              />
            </div>
          )}

          <div>
            <label className="block text-sm text-gray-400 mb-2">Notes</label>
            <textarea
              placeholder="Additional notes..."
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              className="w-full px-3 py-2 bg-[var(--bg-input)] text-[var(--text-primary)] border border-gray-600 rounded-lg focus:border-[#C9A374]/50 outline-none resize-none"
              rows={2}
            />
          </div>

          <div className="flex items-center gap-2 pt-2">
            {editingEntry && (
              <button
                onClick={handleDeleteEntry}
                disabled={deleting}
                className="flex items-center justify-center gap-2 px-4 py-2 text-red-400 hover:text-red-500 border border-red-500/30 hover:border-red-500/50 rounded-lg disabled:opacity-50"
              >
                <TrashIcon className="w-4 h-4" />
                {deleting ? "Deleting..." : "Delete"}
              </button>
            )}

            <button
              onClick={closeModal}
              className="flex-1 px-4 py-2 text-gray-400 hover:text-[var(--text-primary)] border border-gray-600 rounded-lg"
            >
              Cancel
            </button>
            <button
              onClick={handleSaveEntry}
              disabled={saving}
              className="flex-1 px-4 py-2 bg-[var(--btn-bg)] text-[var(--btn-text)] font-semibold rounded-lg disabled:opacity-50"
            >
              {saving ? "Saving..." : "Save"}
            </button>
          </div>
        </Modal>

        {/* ENTRIES LIST */}
        <div className="space-y-2">
          {loading ? (
            <div className="text-center py-12 text-gray-500">Loading...</div>
          ) : filteredEntries.length === 0 ? (
            <div className="text-center py-12 text-gray-500">
              No entries yet. Add one to get started!
            </div>
          ) : (
            filteredEntries.map((entry, idx) => (
              <button
                key={entry._id}
                onClick={() => openEditModal(entry)}
                className={`w-full flex items-center gap-3 py-3 text-left transition hover:bg-[var(--btn-bg)]/[0.03] ${
                  idx !== filteredEntries.length - 1 ? "border-b border-[var(--border-subtle)]" : ""
                }`}
              >
                <span className="flex-1 min-w-0 truncate text-[var(--text-primary)] font-medium text-sm">
                  {entry.name}
                </span>
                <span className="shrink-0 text-xs text-[var(--text-secondary)]">
                  {new Date(entry.date).toLocaleDateString()}
                </span>
                {!!entry.price && entry.price > 0 && (
                  <span className="shrink-0 text-xs text-[var(--text-secondary)]">
                    {entry.price.toLocaleString()}
                  </span>
                )}
                {!!entry.amount && entry.amount > 0 && (
                  <span className="shrink-0 text-xs text-[#C9A374] font-semibold">
                    {entry.amount.toLocaleString()}
                  </span>
                )}
              </button>
            ))
          )}
        </div>
      </div>
    </div>
  );
};

export default TrackerPage;
