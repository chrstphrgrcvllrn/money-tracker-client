import { useEffect, useState } from "react";
import type { Note } from "../types/notes.type";
import {
  getNotes,
  createNote,
  toggleNote,
  // deleteNote,
} from "../api/note";
import { CheckIcon } from "@heroicons/react/24/solid";

const NotesPage: React.FC = () => {
  const [notes, setNotes] = useState<Note[]>([]);
  const [text, setText] = useState("");
  const [category, setCategory] = useState<Note["category"]>("work");

  const [activeTab, setActiveTab] = useState<
    "all" | "done" | "pending" | "work" | "personal" | "others" | "to buy"
  >("pending");

  const fetchNotes = async () => {
    const data = await getNotes();
    setNotes(data);
  };

  useEffect(() => {
    fetchNotes();
  }, []);

  const addNote = async () => {
    if (!text.trim()) return;

    await createNote({
      text: text.trim(),
      category,
    });

    setText("");
    fetchNotes();
  };

  const handleToggle = async (id: string) => {
    await toggleNote(id);
    fetchNotes();
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
const highlightBrackets = (text: string, done: boolean) => {
  const parts = text.split(/(\[.*?\])/g);
  return parts.map((part, idx) =>
    part.startsWith("[") && part.endsWith("]") && !done ? (
      <span key={idx} className="text-[#01E777]">
        {part}
      </span>
    ) : (
      part
    )
  );
};
  return (
    <div className="text-xs max-w-md mx-auto mt-8 px-6 pb-6 bg-[#111111]">
      {/* HEADER */}
      <div className="mb-4 flex justify-between items-center">
        <h1 className="text-lg font-semibold text-white">Notes</h1>
        <div className="flex items-center gap-3"></div>
      </div>

      {/* INPUT */}
      <div className="flex gap-2 mb-4 h-[7vh]">
        <input
          type="text"
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="Enter note"
          className="flex-1 bg-[#1d1d1d] px-2 py-1 rounded text-white"
        />

        <select
          value={category}
          onChange={(e) =>
            setCategory(e.target.value as Note["category"])
          }
          className="bg-[#1d1d1d] px-2 py-1 rounded text-[#fff]"
        >
          <option value="work">Work</option>
          <option value="personal">Personal</option>
          <option value="to buy">To Buy</option>
          <option value="others">Others</option>
        </select>

        <button
          onClick={addNote}
          className="bg-[#01E777] text-black font-bold px-2 py-1 rounded"
        >
          Add
        </button>
      </div>

      {/* TABS */}
      <div className="flex gap-2 mb-4">
        {["pending", "work", "personal", "others", "to buy", "done"].map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab as any)}
            className={`px-2 py-1 rounded-xl text-xs capitalize ${
              activeTab === tab
                ? "bg-[#01E777] text-black font-bold"
                : "bg-[#1d1d1d] text-gray-400"
            }`}
          >
            {tab}
          </button>
        ))}
      </div>

      {/* LIST */}
      <ul className="space-y-2 text-sm">
        {sortedNotes.map((note) => (
          <li
            key={note._id}
            className={`flex justify-between items-center p-2 bg-[#1d1d1d] rounded-xl ${
              note.done ? "text-gray-700 line-through" : ""
            }`}
          >
            <div>
              <span
                className={`font-medium ${
                  note.done ? "text-gray-700 line-through" : "text-white"
                }`}
              >
                  {highlightBrackets(note.text, note.done)}
              </span>
            </div>

            <div className="flex gap-2">
              <button
                onClick={() => handleToggle(note._id)}
                className="flex items-center justify-center px-2 py-1 rounded text-mist-500 hover:text-[#01E777]"
              >
                <CheckIcon
                  className={`w-5 h-5 ${
                    note.done ? "text-[#01E777]" : "text-gray-500"
                  }`}
                />
              </button>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
};

export default NotesPage;