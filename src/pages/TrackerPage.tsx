import { useState } from "react";
import Snackbar from "@mui/material/Snackbar";
import Alert from "@mui/material/Alert";
import { TrashIcon, PlusIcon } from "@heroicons/react/24/solid";

type TrackerCategory = "medical" | "dental" | "motorcycle" | "crypto" | "digital" | "family";

interface TrackerEntry {
  _id?: string;
  category: TrackerCategory;
  name: string;
  details: string;
  date: string;
  amount?: number;
  notes?: string;
}

const TrackerPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState<TrackerCategory>("medical");
  const [entries, setEntries] = useState<TrackerEntry[]>([]);
  const [showForm, setShowForm] = useState(false);

  const [formData, setFormData] = useState<TrackerEntry>({
    category: "medical",
    name: "",
    details: "",
    date: new Date().toISOString().split('T')[0],
    amount: 0,
    notes: "",
  });

  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState("");
  const [snackbarSeverity, setSnackbarSeverity] = useState<"success" | "info" | "error">("info");

  const categories: Record<TrackerCategory, string> = {
    medical: "Medical",
    dental: "Dental",
    motorcycle: "Motorcycle",
    crypto: "Crypto",
    digital: "Digital",
    family: "Family",
  };

  const categoryExamples: Record<TrackerCategory, string[]> = {
    medical: ["Annual physical exam", "Stomach ache", "Check-up"],
    dental: ["Tooth paste", "Tooth cleaning", "Extraction"],
    motorcycle: ["Changed oil", "Changed battery", "CVT Cleaning", "Fi Cleaning", "Registration"],
    crypto: ["Purchase", "Stake", "Withdrawal"],
    digital: ["Google One", "Netflix", "Railway", "Claude"],
    family: ["Family member", "Event", "Expense"],
  };

  const showSnackbar = (message: string, severity: "success" | "info" | "error" = "info") => {
    setSnackbarMessage(message);
    setSnackbarSeverity(severity);
    setSnackbarOpen(true);
  };

  const handleCloseSnackbar = () => setSnackbarOpen(false);

  const filteredEntries = entries.filter((entry) => entry.category === activeTab);

  const handleAddEntry = () => {
    if (!formData.name || !formData.details || !formData.date) {
      showSnackbar("Please fill in all required fields", "error");
      return;
    }

    const newEntry: TrackerEntry = {
      _id: Date.now().toString(),
      ...formData,
      category: activeTab,
    };

    setEntries((prev) => [newEntry, ...prev]);
    setFormData({
      category: activeTab,
      name: "",
      details: "",
      date: new Date().toISOString().split('T')[0],
      amount: 0,
      notes: "",
    });
    setShowForm(false);
    showSnackbar("Entry added successfully!", "success");
  };

  const handleDeleteEntry = (id: string | undefined) => {
    if (!id) return;
    if (!confirm("Delete this entry?")) return;

    setEntries((prev) => prev.filter((entry) => entry._id !== id));
    showSnackbar("Entry deleted!", "success");
  };

  return (
    <div className="min-h-[calc(100vh-80px)] bg-black text-white px-5 pt-6 pb-10">
      <div className="max-w-md mx-auto">
        {/* HEADER */}
        <style>{`
          @keyframes scale-in {
            from { opacity: 0; transform: scale(0.95); }
            to { opacity: 1; transform: scale(1); }
          }
          .animate-scale { animation: scale-in 0.3s cubic-bezier(0.34, 1.56, 0.64, 1); }
        `}</style>
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
        {showForm && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
            <div className="w-full max-w-sm bg-[#1C1C1E] rounded-xl p-6 space-y-4 animate-scale">
              <h2 className="text-white text-lg font-semibold">Add {categories[activeTab]} Entry</h2>

              <div>
                <label className="block text-sm text-gray-400 mb-2">Name/Title *</label>
                <input
                  type="text"
                  placeholder={categoryExamples[activeTab][0]}
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-3 py-2 bg-[#2C2C2E] text-white border border-gray-600 rounded-lg focus:border-[#DFF966]/50 outline-none"
                />
              </div>

              <div>
                <label className="block text-sm text-gray-400 mb-2">Details *</label>
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
                    value={formData.amount || 0}
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
                  onClick={() => setShowForm(false)}
                  className="flex-1 px-4 py-2 text-gray-400 hover:text-white border border-gray-600 rounded-lg"
                >
                  Cancel
                </button>
                <button
                  onClick={handleAddEntry}
                  className="flex-1 px-4 py-2 bg-[#DFF966] text-black font-semibold rounded-lg"
                >
                  Save
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ENTRIES LIST */}
        <div className="space-y-3">
          {filteredEntries.length === 0 ? (
            <div className="text-center py-12 text-gray-500">
              No entries yet. Add one to get started!
            </div>
          ) : (
            filteredEntries.map((entry) => (
              <div key={entry._id} className="bg-[#1C1C1E] rounded-xl p-4 space-y-2">
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="font-semibold text-white">{entry.name}</h3>
                    <p className="text-sm text-gray-400">{entry.details}</p>
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
                  {entry.amount !== undefined && entry.amount > 0 && (
                    <span className="text-[#DFF966]">{entry.amount.toLocaleString()}</span>
                  )}
                </div>

                {entry.notes && (
                  <p className="text-xs text-gray-400 italic">"{entry.notes}"</p>
                )}
              </div>
            ))
          )}
        </div>
      </div>

      {/* SNACKBAR */}
      <Snackbar
        open={snackbarOpen}
        autoHideDuration={2000}
        onClose={handleCloseSnackbar}
        anchorOrigin={{ vertical: "top", horizontal: "center" }}
      >
        <Alert
          onClose={handleCloseSnackbar}
          severity={snackbarSeverity}
          sx={{
            width: "100%",
            backgroundColor: "rgba(0,0,0,0.6)",
            color: "white",
            backdropFilter: "blur(8px)",
            borderRadius: "8px",
          }}
        >
          {snackbarMessage}
        </Alert>
      </Snackbar>
    </div>
  );
};

export default TrackerPage;
