import { useEffect, useMemo, useRef, useState } from "react";
import Quill from "quill";
import "quill/dist/quill.snow.css";

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
  PencilIcon,
} from "@heroicons/react/24/outline";

import { useToast } from "../components/useToast";

const getErrorMessage = (error: unknown, fallback: string): string => {
  if (error && typeof error === "object") {
    const err = error as { response?: { data?: { message?: string } }; message?: string };
    return err.response?.data?.message || err.message || fallback;
  }
  return fallback;
};

const NotebookPage: React.FC = () => {
  const showToast = useToast();

  const [notes, setNotes] = useState<NotebookNote[]>([]);
  const [selectedNoteId, setSelectedNoteId] = useState<string | null>(null);

  const [title, setTitle] = useState("");

  const [activeTab, setActiveTab] = useState<
    "all" | "open" | "closed"
  >("open");

  const [saving, setSaving] = useState(false);

  const editorRef = useRef<HTMLDivElement>(null);
  const quillRef = useRef<Quill | null>(null);

  // Keep a ref to the latest notes so the Quill init effect can read
  // initial content without depending on `notes` (which changes on every
  // save and would otherwise tear down + recreate the editor + toolbar).
  const notesRef = useRef<NotebookNote[]>(notes);
  useEffect(() => {
    notesRef.current = notes;
  }, [notes]);

  // --------------------------------
  // Selected note
  // --------------------------------

  const selectedNote = useMemo(
    () => notes.find((note) => note._id === selectedNoteId),
    [notes, selectedNoteId]
  );

  // --------------------------------
  // Initialize / destroy Quill
  // --------------------------------
  // Only re-creates the editor when a DIFFERENT note is opened
  // (selectedNoteId changes) — not on every save, which previously caused
  // the toolbar (a sibling DOM node Quill inserts before the container) to
  // be duplicated on every save since it was never removed on cleanup.

  useEffect(() => {
    if (!selectedNoteId || !editorRef.current) {
      return;
    }

    const editorNode = editorRef.current;
    const noteAtOpen = notesRef.current.find((n) => n._id === selectedNoteId);

    if (quillRef.current) {
      quillRef.current = null;
    }

    const quill = new Quill(editorNode, {
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

    // Load note content into Quill (only on open, not on every save)
    quill.root.innerHTML = noteAtOpen?.content || "";

    const toolbarModule = quill.getModule("toolbar") as { container?: HTMLElement };
    const toolbarEl = toolbarModule?.container;

    return () => {
      if (quillRef.current === quill) {
        quillRef.current = null;
      }

      quill.disable();

      editorNode.innerHTML = "";

      // Quill inserts the toolbar as a SIBLING before the editor container,
      // not inside it — must be removed explicitly or it duplicates on
      // every re-init.
      if (toolbarEl && toolbarEl.parentNode) {
        toolbarEl.parentNode.removeChild(toolbarEl);
      }
    };
  }, [selectedNoteId]);

  // --------------------------------
  // Fetch notes
  // --------------------------------

  const fetchNotes = async () => {
    try {
      const data = await getNotebookNotes();

      setNotes(data);
    } catch (error) {
      console.error("Fetch notes error:", error);

      showToast("Failed to load notes", "error");
    }
  };

  useEffect(() => {
    fetchNotes();
    // eslint-disable-next-line react-hooks/exhaustive-deps
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

      showToast("Note created", "success");
    } catch (error) {
      console.error("Create note error:", error);

      showToast("Failed to create note", "error");
    }
  };

  // --------------------------------
  // Save note
  // --------------------------------

  const saveNote = async () => {
    if (!selectedNoteId) {
      showToast("No note selected", "error");
      return;
    }

    if (!title.trim()) {
      showToast("Please enter a title", "error");
      return;
    }

    if (!quillRef.current) {
      showToast("Editor is not ready", "error");
      return;
    }

    setSaving(true);

    try {
      // Quill is the source of truth for content
      const currentContent = quillRef.current.root.innerHTML;

      const payload = {
        title: title.trim(),
        content: currentContent,
      };

      const updatedNote = await updateNotebookNote(
        selectedNoteId,
        payload
      );

      setNotes((prev) =>
        prev.map((note) =>
          note._id === updatedNote._id
            ? updatedNote
            : note
        )
      );

      showToast("Note saved successfully", "success");
    } catch (error) {
      console.error("Save note error:", error);

      showToast("Failed to save note", "error");
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

      showToast(
        updatedNote.status === "closed"
          ? "Note closed"
          : "Note reopened",
        "success"
      );
    } catch (error: unknown) {
      console.error("Toggle status error:", error);

      const message = getErrorMessage(error, "Failed to update note status");

      showToast(message, "error");
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

      showToast("Note deleted", "success");
    } catch (error: unknown) {
      console.error("Delete note error:", error);

      const message = getErrorMessage(error, "Failed to delete note");

      showToast(message, "error");
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
    <div className="min-h-[calc(100vh-80px)] text-xs bg-[var(--bg-page)] text-[var(--text-primary)]">
      <style>{`
        @keyframes modal-scale-in {
          from { opacity: 0; transform: scale(0.95); }
          to { opacity: 1; transform: scale(1); }
        }
        .modal-animate {
          animation: modal-scale-in 0.2s cubic-bezier(0.34, 1.56, 0.64, 1);
        }
      `}</style>

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
          className="flex items-center gap-1 bg-[var(--btn-bg)] text-[var(--btn-text)] font-semibold px-3 py-2 rounded-lg"
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
                ? "bg-[var(--btn-bg)] text-[var(--btn-text)] font-semibold"
                : "bg-[var(--bg-surface)] text-gray-400"
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
                className="text-left p-4 bg-[var(--bg-surface)] hover:bg-[#242426] rounded-xl transition"
              >

                <div className="flex items-start justify-between gap-3">

                  <h2
                    className={`font-semibold text-sm truncate ${
                      note.status === "closed"
                        ? "text-gray-500"
                        : "text-[var(--text-primary)]"
                    }`}
                  >
                    {note.title}
                  </h2>

                  <span
                    className={`text-[10px] px-2 py-0.5 rounded-full shrink-0 ${
                      note.status === "open"
                        ? "bg-[var(--btn-bg)] text-[var(--btn-text)]"
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

          <div className="w-full max-w-5xl h-[90vh] bg-[var(--bg-surface)] rounded-2xl shadow-2xl overflow-hidden flex flex-col modal-animate">

            {/* MODAL HEADER */}
            <div className="flex items-center justify-between px-5 py-4 border-b border-white/10">

              <div className="flex-1 min-w-0">

                <input
                  value={title}
                  onChange={(e) =>
                    setTitle(e.target.value)
                  }
                  className="w-full bg-transparent text-lg font-semibold text-[var(--text-primary)] outline-none"
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
                className="ml-4 p-2 rounded-lg text-gray-500 hover:text-[var(--text-primary)] hover:bg-[#2A2A2C]"
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
                onClick={toggleStatus}
                className="flex items-center gap-2 px-3 py-2 rounded-lg bg-[#2A2A2C] text-gray-300 hover:bg-[#333335]"
              >
                <CheckIcon className="w-4 h-4" />

                {selectedNote.status === "open"
                  ? "Close Note"
                  : "Reopen Note"}
              </button>

              <div className="flex items-center gap-2">

                <button
                  onClick={deleteNote}
                  className="flex items-center gap-2 text-gray-500 hover:text-red-400"
                >
                  <TrashIcon className="w-5 h-5" />

                  <span>
                    Delete
                  </span>
                </button>

                <button
                  onClick={saveNote}
                  disabled={saving}
                  className="flex items-center gap-2 px-4 py-2 rounded-lg bg-[var(--btn-bg)] text-[var(--btn-text)] font-semibold disabled:opacity-50"
                >
                  {saving ? (
                    <>
                      <PencilIcon className="w-4 h-4 animate-spin" />
                      Saving...
                    </>
                  ) : (
                    "Save"
                  )}
                </button>

              </div>

            </div>

          </div>

        </div>
      )}

    </div>
  );
};

export default NotebookPage;
