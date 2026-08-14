import { useEffect, useMemo, useRef, useState } from "react";
import Quill from "quill";
import "quill/dist/quill.snow.css";

import Snackbar from "@mui/material/Snackbar";

import type { NotebookNote } from "../types/notebook.type";

import {
  getNotebookNotes,
  createNotebookNote,
  updateNotebookNote,
  toggleNotebookNoteStatus,
  deleteNotebookNote,
} from "../api/notebook";

import {
  PlusIcon,
  TrashIcon,
  CheckIcon,
  XMarkIcon,
} from "@heroicons/react/24/outline";

const NotebookPage: React.FC = () => {
  const [notes, setNotes] = useState<NotebookNote[]>([]);
  const [selectedNoteId, setSelectedNoteId] = useState<string | null>(null);

  const [title, setTitle] = useState("");

  const [activeTab, setActiveTab] = useState<
    "all" | "open" | "closed"
  >("open");

  const [saving, setSaving] = useState(false);

  const [snackbar, setSnackbar] = useState({
    open: false,
    message: "",
  });

  const editorRef = useRef<HTMLDivElement>(null);
  const quillRef = useRef<Quill | null>(null);

  // --------------------------------
  // Selected note
  // --------------------------------

  const selectedNote = useMemo(
    () => notes.find((note) => note._id === selectedNoteId),
    [notes, selectedNoteId]
  );

  // --------------------------------
  // Snackbar
  // --------------------------------

  const showSnackbar = (message: string) => {
    setSnackbar({
      open: true,
      message,
    });
  };

  const handleSnackbarClose = (
    _event?: React.SyntheticEvent | Event,
    reason?: string
  ) => {
    if (reason === "clickaway") return;

    setSnackbar((prev) => ({
      ...prev,
      open: false,
    }));
  };

  // --------------------------------
  // Initialize / destroy Quill
  // --------------------------------

  useEffect(() => {
    if (!selectedNoteId || !selectedNote || !editorRef.current) {
      return;
    }

    // Prevent creating multiple Quill instances
    if (quillRef.current) {
      quillRef.current = null;
    }

    const quill = new Quill(editorRef.current, {
      theme: "snow",

      modules: {
        toolbar: [
          [{ header: [1, 2, 3, false] }],
          ["bold", "italic", "underline", "strike"],
          [{ list: "ordered" }, { list: "bullet" }],
          [{ indent: "-1" }, { indent: "+1" }],
          ["blockquote", "code-block"],
          ["link"],
          ["clean"],
        ],
      },

      placeholder: "Start writing...",
    });

    quillRef.current = quill;

    // Load selected note content into Quill
    quill.root.innerHTML = selectedNote.content || "";

    return () => {
      if (quillRef.current === quill) {
        quillRef.current = null;
      }

      quill.disable();

      if (editorRef.current) {
        editorRef.current.innerHTML = "";
      }
    };
  }, [selectedNoteId, selectedNote]);

  // --------------------------------
  // Fetch notes
  // --------------------------------

  const fetchNotes = async () => {
    try {
      const data = await getNotebookNotes();

      setNotes(data);
    } catch (error) {
      console.error("Fetch notes error:", error);

      showSnackbar("Failed to load notes");
    }
  };

  useEffect(() => {
    fetchNotes();
  }, []);

  // --------------------------------
  // Open note
  // --------------------------------

  const openNote = (note: NotebookNote) => {
    setSelectedNoteId(note._id);
    setTitle(note.title);
  };

  // --------------------------------
  // Close note
  // --------------------------------

  const closeNote = () => {
    setSelectedNoteId(null);
    setTitle("");

    quillRef.current = null;
  };

  // --------------------------------
  // Create note
  // --------------------------------

  const createNote = async () => {
    try {
      const note = await createNotebookNote({
        title: "Untitled Note",
        content: "",
      });

      setNotes((prev) => [note, ...prev]);

      setSelectedNoteId(note._id);
      setTitle(note.title);

      showSnackbar("Note created");
    } catch (error) {
      console.error("Create note error:", error);

      showSnackbar("Failed to create note");
    }
  };

  // --------------------------------
  // Save note
  // --------------------------------

  const saveNote = async () => {
    console.log("🔥 SAVE BUTTON CLICKED");

    console.log("selectedNoteId:", selectedNoteId);
    console.log("title:", title);
    console.log("quill:", quillRef.current);

    if (!selectedNoteId) {
      console.log("❌ No selected note");

      showSnackbar("No note selected");

      return;
    }

    if (!title.trim()) {
      console.log("❌ Empty title");

      showSnackbar("Please enter a title");

      return;
    }

    if (!quillRef.current) {
      console.log("❌ Quill is not initialized");

      showSnackbar("Editor is not ready");

      return;
    }

    setSaving(true);

    try {
      // Quill is the source of truth for content
      const currentContent = quillRef.current.root.innerHTML;

      console.log("📝 Content:", currentContent);

      const payload = {
        title: title.trim(),
        content: currentContent,
      };

      console.log("📤 Sending update:", {
        id: selectedNoteId,
        payload,
      });

      const updatedNote = await updateNotebookNote(
        selectedNoteId,
        payload
      );

      console.log("✅ API RESPONSE:", updatedNote);

      setNotes((prev) =>
        prev.map((note) =>
          note._id === updatedNote._id
            ? updatedNote
            : note
        )
      );

      showSnackbar("Note saved successfully");
    } catch (error) {
      console.error("❌ SAVE ERROR:", error);

      showSnackbar("Failed to save note");
    } finally {
      setSaving(false);
    }
  };

  // --------------------------------
  // Toggle status
  // --------------------------------

  const toggleStatus = async () => {
    if (!selectedNoteId) return;

    try {
      const updatedNote =
        await toggleNotebookNoteStatus(selectedNoteId);

      setNotes((prev) =>
        prev.map((note) =>
          note._id === updatedNote._id
            ? updatedNote
            : note
        )
      );

      showSnackbar(
        updatedNote.status === "closed"
          ? "Note closed"
          : "Note reopened"
      );
    } catch (error: any) {
      console.error("Toggle status error:", error);

      const message =
        error?.response?.data?.message ||
        error?.message ||
        "Failed to update note status";

      showSnackbar(message);
    }
  };

  // --------------------------------
  // Delete note
  // --------------------------------

  const deleteNote = async () => {
    if (!selectedNoteId) return;

    const confirmed = window.confirm(
      "Delete this note?"
    );

    if (!confirmed) return;

    try {
      await deleteNotebookNote(selectedNoteId);

      setNotes((prev) =>
        prev.filter(
          (note) => note._id !== selectedNoteId
        )
      );

      closeNote();

      showSnackbar("Note deleted");
    } catch (error: any) {
      console.error("Delete note error:", error);

      const message =
        error?.response?.data?.message ||
        error?.message ||
        "Failed to delete note";

      showSnackbar(message);
    }
  };

  // --------------------------------
  // Filter notes
  // --------------------------------

  const filteredNotes = useMemo(() => {
    if (activeTab === "all") {
      return notes;
    }

    return notes.filter(
      (note) => note.status === activeTab
    );
  }, [notes, activeTab]);

  // --------------------------------
  // Render
  // --------------------------------

  return (
    <div className="min-h-[calc(100vh-80px)] text-xs bg-black text-white">

      {/* HEADER */}
      <div className="px-5 pt-6 pb-4 flex items-center justify-between">

        <div>
          <h1 className="text-lg font-semibold">
            Notebook
          </h1>

          <p className="text-gray-500 mt-1">
            Rich notes
          </p>
        </div>

        <button
          onClick={createNote}
          className="flex items-center gap-1 bg-[#DFF966] text-black font-semibold px-3 py-2 rounded-lg"
        >
          <PlusIcon className="w-4 h-4" />
          New
        </button>

      </div>

      {/* TABS */}
      <div className="flex gap-2 px-5 pb-5">

        {["open", "closed", "all"].map((tab) => (
          <button
            key={tab}
            onClick={() =>
              setActiveTab(
                tab as "all" | "open" | "closed"
              )
            }
            className={`px-3 py-1.5 rounded-xl capitalize ${
              activeTab === tab
                ? "bg-[#DFF966] text-black font-semibold"
                : "bg-[#1C1C1E] text-gray-400"
            }`}
          >
            {tab}
          </button>
        ))}

      </div>

      {/* NOTE LIST */}
      <div className="px-5 pb-10">

        {filteredNotes.length === 0 ? (
          <div className="text-gray-600 text-center py-16">
            No notes
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">

            {filteredNotes.map((note) => (
              <button
                key={note._id}
                onClick={() => openNote(note)}
                className="text-left p-4 bg-[#1C1C1E] hover:bg-[#242426] rounded-xl transition"
              >

                <div className="flex items-start justify-between gap-3">

                  <h2
                    className={`font-semibold text-sm truncate ${
                      note.status === "closed"
                        ? "text-gray-500"
                        : "text-white"
                    }`}
                  >
                    {note.title}
                  </h2>

                  <span
                    className={`text-[10px] px-2 py-0.5 rounded-full shrink-0 ${
                      note.status === "open"
                        ? "bg-[#DFF966] text-black"
                        : "bg-[#2A2A2C] text-gray-500"
                    }`}
                  >
                    {note.status}
                  </span>

                </div>

                {/* CONTENT PREVIEW */}
                <div
                  className="mt-3 text-gray-500 line-clamp-3 text-xs"
                  dangerouslySetInnerHTML={{
                    __html:
                      note.content ||
                      "<span>No content</span>",
                  }}
                />

                <div className="mt-4 text-[10px] text-gray-600">
                  {new Date(
                    note.updatedAt
                  ).toLocaleDateString()}
                </div>

              </button>
            ))}

          </div>
        )}

      </div>

      {/* NOTE MODAL */}
      {selectedNote && (
        <div
          className="fixed inset-0 z-[100] bg-black/70 backdrop-blur-sm flex items-center justify-center p-4"
          onMouseDown={(e) => {
            if (e.target === e.currentTarget) {
              closeNote();
            }
          }}
        >

          <div className="w-full max-w-5xl h-[90vh] bg-[#1C1C1E] rounded-2xl shadow-2xl overflow-hidden flex flex-col">

            {/* MODAL HEADER */}
            <div className="flex items-center justify-between px-5 py-4 border-b border-white/10">

              <div className="flex-1 min-w-0">

                <input
                  value={title}
                  onChange={(e) =>
                    setTitle(e.target.value)
                  }
                  className="w-full bg-transparent text-lg font-semibold text-white outline-none"
                  placeholder="Note title"
                />

                <div className="text-[10px] text-gray-500 mt-1">
                  {selectedNote.status === "open"
                    ? "Open"
                    : "Closed"}
                </div>

              </div>

              <button
                onClick={closeNote}
                className="ml-4 p-2 rounded-lg text-gray-500 hover:text-white hover:bg-[#2A2A2C]"
              >
                <XMarkIcon className="w-5 h-5" />
              </button>

            </div>

            {/* QUILL */}
            <div className="flex-1 min-h-0 overflow-hidden notebook-editor">
              <div
                ref={editorRef}
                className="h-full"
              />
            </div>

            {/* MODAL FOOTER */}
            <div className="flex items-center justify-between px-5 py-4 border-t border-white/10">

              <button
                onClick={deleteNote}
                className="flex items-center gap-2 text-gray-500 hover:text-red-400"
              >
                <TrashIcon className="w-5 h-5" />

                <span>
                  Delete
                </span>
              </button>

              <div className="flex items-center gap-2">

                <button
                  onClick={toggleStatus}
                  className="flex items-center gap-2 px-3 py-2 rounded-lg bg-[#2A2A2C] text-gray-300 hover:bg-[#333335]"
                >
                  <CheckIcon className="w-4 h-4" />

                  {selectedNote.status === "open"
                    ? "Close Note"
                    : "Reopen Note"}
                </button>

                <button
                  onClick={saveNote}
                  disabled={saving}
                  className="px-4 py-2 rounded-lg bg-[#DFF966] text-black font-semibold disabled:opacity-50"
                >
                  {saving
                    ? "Saving..."
                    : "Save"}
                </button>

              </div>

            </div>

          </div>

        </div>
      )}

      {/* SNACKBAR */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={3000}
        onClose={handleSnackbarClose}
        message={snackbar.message}
        anchorOrigin={{
          vertical: "bottom",
          horizontal: "center",
        }}
      />

    </div>
  );
};

export default NotebookPage;