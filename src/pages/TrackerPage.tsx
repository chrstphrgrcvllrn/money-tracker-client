import { useEffect, useState } from "react";
import { TrashIcon, PlusIcon } from "@heroicons/react/24/solid";

import type { TrackerCategory, TrackerEntry } from "../types/tracker.type";
import {
  fetchTrackerEntries,
  createTrackerEntry,
  deleteTrackerEntry,
} from "../api/tracker";

import Modal from "../components/Modal";
import { useToast } from "../components/useToast";

const TrackerPage: React.FC = () => {
  const showToast = useToast();

  const [activeTab, setActiveTab] = useState<TrackerCategory>("medical");
  const [entries, setEntries] = useState<TrackerEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [saving, setSaving] = useState(false);

  const [formData, setFormData] = useState({
    name: "",
    details: "",
    date: new Date().toISOString().split("T")[0],
    amount: 0,
    notes: "",
  });

  const categories: Record<TrackerCategory, string> = {
    medical: "Medical",
    dental: "Dental",
    motorcycle: "Motorcycle",
    crypto: "Crypto",
    digital: "Digital",
    family: "Family",
  };

  const categoryExamples: Record<TrackerCategory, string> = {
    medical: "e.g. Annual physical exam",
    dental: "e.g. Tooth cleaning",
    motorcycle: "e.g. Changed oil",
    crypto: "e.g. Bought XRP",
    digital: "e.g. Netflix subscription",
    family: "e.g. Amilyar",
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

  const resetForm = () => {
    setFormData({
      name: "",
      details: "",
      date: new Date().toISOString().split("T")[0],
      amount: 0,
      notes: "",
    });
  };

  const handleAddEntry = async () => {
    if (!formData.name.trim() || !formData.date) {
      showToast("Please fill in the name and date", "error");
      return;
    }

    setSaving(true);

    try {
      const newEntry = await createTrackerEntry({
        category: activeTab,
        name: formData.name.trim(),
        details: formData.details.trim(),
        date: formData.date,
        amount: formData.amount,
        notes: formData.notes.trim(),
      });

      setEntries((prev) => [newEntry, ...prev]);
      resetForm();
      setShowForm(false);
      showToast("Entry added successfully!", "success");
    } catch (error) {
      console.error("Failed to add tracker entry:", error);
      showToast("Failed to add entry", "error");
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteEntry = async (id: string) => {
    if (!confirm("Delete this entry?")) return;

    // Optimistic update
    const previousEntries = entries;
    setEntries((prev) => prev.filter((entry) => entry._id !== id));

    try {
      await deleteTrackerEntry(id);
      showToast("Entry deleted!", "success");
    } catch (error) {
      console.error("Failed to delete tracker entry:", error);
      setEntries(previousEntries);
      showToast("Failed to delete entry", "error");
    }
  };

  return (
    <div className="min-h-[calc(100vh-80px)] bg-black text-white px-5 pt-6 pb-10">
      <div className="max-w-md mx-auto">
        {/* HEADER */}
        <div className="mb-6">
          <h1 className="text-lg font-semibold">Tracker</h1>
          <p className="text-gray-500 text-sm mt-1">Track your activities and events</p>
        </div>

        {/* TABS */}
        <div className="flex gap-2 mb-6 overflow-x-auto pb-2">
          {(Object.entries(categories) as [TrackerCategory, string][]).map(([key, label]) => (
            <button
              key={key}
              onClick={() => setActiveTab(key)}
              className={`px-3 py-1.5 rounded-xl whitespace-nowrap text-sm transition ${
                activeTab === key
                  ? "bg-[#DFF966] text-black font-semibold"
                  : "bg-[#1C1C1E] text-gray-400 hover:text-white"
              }`}
            >
              {label}
            </button>
          ))}
        </div>

        {/* ADD BUTTON */}
        <button
          onClick={() => setShowForm(true)}
          className="w-full flex items-center gap-2 justify-center bg-[#DFF966] text-black font-semibold px-4 py-2 rounded-lg mb-6"
        >
          <PlusIcon className="w-4 h-4" />
          Add Entry
        </button>

        {/* ADD FORM MODAL */}
        <Modal
          open={showForm}
          onClose={() => {
            setShowForm(false);
            resetForm();
          }}
          title={`Add ${categories[activeTab]} Entry`}
        >
          <div>
            <label className="block text-sm text-gray-400 mb-2">Name/Title *</label>
            <input
              type="text"
              placeholder={categoryExamples[activeTab]}
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="w-full px-3 py-2 bg-[#2C2C2E] text-white border border-gray-600 rounded-lg focus:border-[#DFF966]/50 outline-none"
            />
          </div>

          <div>
            <label className="block text-sm text-gray-400 mb-2">Details</label>
            <textarea
              placeholder="e.g., who, what, procedure, result"
              value={formData.details}
              onChange={(e) => setFormData({ ...formData, details: e.target.value })}
              className="w-full px-3 py-2 bg-[#2C2C2E] text-white border border-gray-600 rounded-lg focus:border-[#DFF966]/50 outline-none resize-none"
              rows={3}
            />
          </div>

          <div>
            <label className="block text-sm text-gray-400 mb-2">Date *</label>
            <input
              type="date"
              value={formData.date}
              onChange={(e) => setFormData({ ...formData, date: e.target.value })}
              className="w-full px-3 py-2 bg-[#2C2C2E] text-white border border-gray-600 rounded-lg focus:border-[#DFF966]/50 outline-none"
            />
          </div>

          {(activeTab === "crypto" || activeTab === "digital" || activeTab === "family") && (
            <div>
              <label className="block text-sm text-gray-400 mb-2">Amount</label>
              <input
                type="number"
                placeholder="0"
                value={formData.amount || ""}
                onChange={(e) => setFormData({ ...formData, amount: Number(e.target.value) })}
                className="w-full px-3 py-2 bg-[#2C2C2E] text-white border border-gray-600 rounded-lg focus:border-[#DFF966]/50 outline-none"
              />
            </div>
          )}

          <div>
            <label className="block text-sm text-gray-400 mb-2">Notes</label>
            <textarea
              placeholder="Additional notes..."
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              className="w-full px-3 py-2 bg-[#2C2C2E] text-white border border-gray-600 rounded-lg focus:border-[#DFF966]/50 outline-none resize-none"
              rows={2}
            />
          </div>

          <div className="flex gap-2 pt-2">
            <button
              onClick={() => {
                setShowForm(false);
                resetForm();
              }}
              className="flex-1 px-4 py-2 text-gray-400 hover:text-white border border-gray-600 rounded-lg"
            >
              Cancel
            </button>
            <button
              onClick={handleAddEntry}
              disabled={saving}
              className="flex-1 px-4 py-2 bg-[#DFF966] text-black font-semibold rounded-lg disabled:opacity-50"
            >
              {saving ? "Saving..." : "Save"}
            </button>
          </div>
        </Modal>

        {/* ENTRIES LIST */}
        <div className="space-y-3">
          {loading ? (
            <div className="text-center py-12 text-gray-500">Loading...</div>
          ) : filteredEntries.length === 0 ? (
            <div className="text-center py-12 text-gray-500">
              No entries yet. Add one to get started!
            </div>
          ) : (
            filteredEntries.map((entry) => (
              <div key={entry._id} className="bg-[#1C1C1E] rounded-xl p-4 space-y-2">
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="font-semibold text-white">{entry.name}</h3>
                    {entry.details && (
                      <p className="text-sm text-gray-400">{entry.details}</p>
                    )}
                  </div>
                  <button
                    onClick={() => handleDeleteEntry(entry._id)}
                    className="text-red-400 hover:text-red-500 p-2"
                  >
                    <TrashIcon className="w-4 h-4" />
                  </button>
                </div>

                <div className="flex justify-between items-center text-xs text-gray-500">
                  <span>{new Date(entry.date).toLocaleDateString()}</span>
                  {!!entry.amount && entry.amount > 0 && (
                    <span className="text-[#DFF966]">{entry.amount.toLocaleString()}</span>
                  )}
                </div>

                {entry.notes && (
                  <p className="text-xs text-gray-400 italic">&quot;{entry.notes}&quot;</p>
                )}
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};

export default TrackerPage;
