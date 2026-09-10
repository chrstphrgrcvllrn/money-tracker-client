import { useEffect, useState } from "react";
import type { Note } from "../types/notes.type";
import {
  getNotes,
  createNote,
  toggleNote,
  // deleteNote,
} from "../api/note";
import { CheckIcon, PaperAirplaneIcon } from "@heroicons/react/24/solid";
import { DocumentTextIcon } from "@heroicons/react/24/outline";
import { useToast } from "../components/useToast";
import { SkeletonRows } from "../components/Skeleton";

const NotesPage: React.FC = () => {
  const showToast = useToast();

  const [notes, setNotes] = useState<Note[]>([]);
  const [loading, setLoading] = useState(true);
  const [text, setText] = useState("");
  const [category, setCategory] = useState<Note["category"]>("work");

  const [activeTab, setActiveTab] = useState<
    "all" | "done" | "pending" | "work" | "personal" | "others" | "to buy"
  >("pending");

  const fetchNotes = async () => {
    try {
      const data = await getNotes();
      setNotes(data);
    } catch (error) {
      console.error("Failed to load notes:", error);
      showToast("Failed to load notes", "error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchNotes();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const addNote = async () => {
    if (!text.trim()) return;

    try {
      await createNote({
        text: text.trim(),
        category,
      });

      setText("");
      fetchNotes();
      showToast("Note added!", "success");
    } catch (error) {
      console.error("Failed to add note:", error);
      showToast("Failed to add note", "error");
    }
  };

  const handleToggle = async (id: string) => {
    try {
      await toggleNote(id);
      fetchNotes();
    } catch (error) {
      console.error("Failed to toggle note:", error);
      showToast("Failed to update note", "error");
    }
  };

const filteredNotes = notes.filter((note) => {
  if (activeTab === "done") return note.done;
  if (activeTab === "pending") return !note.done && note.category !== "others"; // <- exclude "others"
  if (activeTab === "work") return note.category === "work";
  if (activeTab === "personal") return note.category === "personal";
  if (activeTab === "others") return note.category === "others";
  if (activeTab === "to buy") return note.category === "to buy";
  return true;
});

  // Sort undone first, done last
  const sortedNotes = filteredNotes.sort((a, b) => {
    if (a.done === b.done) return 0;
    return a.done ? 1 : -1; // undone first
  });

// Highlight [bracketed] text only if note is not done
// const highlightBrackets = (text: string, done: boolean) => {
//   const parts = text.split(/(\[.*?\])/g);
//   return parts.map((part, idx) =>
//     part.startsWith("[") && part.endsWith("]") && !done ? (
//       <span key={idx} className="text-[var(--text-primary)]">
//         {part}
//       </span>
//     ) : (
//       part
//     )
//   );
// };

const highlightText = (text: string, done: boolean) => {
  if (done) return text;

  const regex = /(Watch:|Upcoming Holiday:|Upcoming Leave:)/g;

  const parts = text.split(regex);

  return parts.map((part, idx) => {
    if (part === "Watch:") {
      return (
        <span key={idx} className="text-[var(--text-primary)] font-medium">
          {part}
        </span>
      );
    }

    if (part === "Upcoming Holiday:") {
      return (
        <span key={idx} className="text-[#01E4E7] font-medium">
          {part}
        </span>
      );
    }

    if (part === "Upcoming Leave:") {
      return (
        <span key={idx} className="text-[#e70171] font-medium">
          {part}
        </span>
      );
    }

    // keep bracket highlight
    const bracketParts = part.split(/(\[.*?\])/g);
    return bracketParts.map((bp, i) =>
      bp.startsWith("[") && bp.endsWith("]") ? (
        <span key={`${idx}-${i}`} className="text-[var(--text-primary)]">
          {bp}
        </span>
      ) : (
        <span key={`${idx}-${i}`}>{bp}</span>
      )
    );
  });
};


  return (
    <div className="h-full flex flex-col bg-[var(--bg-page)] text-xs">
      {/* HEADER + TABS */}
      <div className="px-6 pt-6 pb-3 shrink-0">
        <h1 className="text-lg font-semibold text-[var(--text-primary)] mb-3">Notes</h1>

        <div className="flex gap-2 flex-wrap">
          {["pending", "work", "personal", "others", "to buy", "done"].map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab as "all" | "done" | "pending" | "work" | "personal" | "others" | "to buy")}
              className={`px-2 py-1 rounded-xl text-xs capitalize ${
                activeTab === tab
                  ? "bg-[var(--btn-bg)] text-[var(--btn-text)] font-bold"
                  : "bg-[var(--bg-surface)] text-[var(--text-secondary)]"
              }`}
            >
              {tab}
            </button>
          ))}
        </div>
      </div>

      {/* LIST */}
      <ul className="flex-1 min-h-0 overflow-y-auto px-6 text-sm">
        {loading ? (
          <SkeletonRows count={6} withValue={false} />
        ) : (
        sortedNotes.map((note, idx, arr) => (
          <li
            key={note._id}
            className={`flex items-center gap-3 py-3 ${
              idx !== arr.length - 1 ? "border-b border-[var(--border-subtle)]" : ""
            }`}
          >
            <div className="shrink-0 w-9 h-9 rounded-lg flex items-center justify-center border border-[#2DE0E6]/40">
              <DocumentTextIcon className="w-4 h-4 text-[var(--text-primary)]" />
            </div>

            <div className="flex-1 min-w-0">
              <span
                className={`font-medium ${
                  note.done ? "text-[var(--text-secondary)] line-through" : "text-[var(--text-primary)]"
                }`}
              >
                  {highlightText(note.text, note.done)}
              </span>
            </div>

            <button
              onClick={() => handleToggle(note._id)}
              className="shrink-0 flex items-center justify-center px-2 py-1 rounded text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
            >
              <CheckIcon
                className={`w-5 h-5 ${
                  note.done ? "text-[var(--text-primary)]" : "text-[var(--text-secondary)]"
                }`}
              />
            </button>
          </li>
        ))
        )}
      </ul>

      {/* COMPOSER */}
      <div className="shrink-0 flex items-center gap-2 px-4 py-3 border-t border-[var(--border-subtle)]">
        <select
          value={category}
          onChange={(e) => setCategory(e.target.value as Note["category"])}
          className="shrink-0 bg-[var(--bg-input)] px-3 py-2.5 rounded-full text-sm text-[var(--text-primary)] border border-gray-600 focus:border-[#2DE0E6]/50 outline-none"
        >
          <option value="work">Work</option>
          <option value="personal">Personal</option>
          <option value="to buy">To Buy</option>
          <option value="others">Others</option>
        </select>

        <input
          type="text"
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") addNote();
          }}
          placeholder="Enter note"
          className="flex-1 min-w-0 bg-[var(--bg-input)] px-4 py-2.5 rounded-full text-sm text-[var(--text-primary)] border border-gray-600 focus:border-[#2DE0E6]/50 outline-none"
        />

        <button
          onClick={addNote}
          disabled={!text.trim()}
          aria-label="Add note"
          className="shrink-0 w-10 h-10 rounded-full flex items-center justify-center bg-[var(--btn-bg)] text-[var(--btn-text)] disabled:opacity-40"
        >
          <PaperAirplaneIcon className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};

export default NotesPage;