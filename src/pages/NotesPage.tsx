import { useEffect, useState } from "react";
import type { Note } from "../types/notes.type";
import {
  getNotes,
  createNote,
  toggleNote,
  // deleteNote,
} from "../api/note";

const NotesPage: React.FC = () => {
  const [notes, setNotes] = useState<Note[]>([]);
  const [text, setText] = useState("");
  const [category, setCategory] = useState<Note["category"]>("work");

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

  // const handleDelete = async (id: string) => {
  //   await deleteNote(id);
  //   fetchNotes();
  // };

  return (
    <div className="text-xs max-w-md mx-auto mt-8 p-6  bg-[#111111]">
      {/* <h1 className="text-xl font-bold mb-4">My Notes</h1> */}

      <div className="flex gap-2 mb-4 h-[7vh]">
        <input
          type="text"
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="Enter note"
          className="flex-1  bg-[#1d1d1d] px-2 py-1 rounded   text-white"
        />

        <select
          value={category}
          onChange={(e) =>
            setCategory(e.target.value as Note["category"])
          }
          className="bg-[#1d1d1d] px-2 py-1 rounded  text-[#fff]"
        >
          <option value="work">Work</option>
          <option value="personal">Personal</option>
          <option value="others">Others</option>
        </select>

        <button
          onClick={addNote}
          className="bg-[#F2F211] text-black font-bold px-2 py-1 rounded"
        >
          Add
        </button>
      </div>

      <ul className="space-y-2 text-sm">
        {notes.map((note) => (
          <li
            key={note._id}
            className={`flex justify-between items-center p-2 bg-[#1d1d1d] rounded ${
              note.done ? "text-gray-600 line-through" : ""
            }`}
          >
            <div>
              <span className={`font-medium text-white${
              note.done ? "text-gray-600 line-through" : ""
            }`}
              
              >{note.text}</span>{" "}
              <span className="text-gray-500">
                {note.category}
              </span>
            </div>

            <div className="flex gap-2">
              <button
                onClick={() => handleToggle(note._id)}
                className="text-sm px-2 py-1   rounded   text-mist-500"
              >
                {note.done ? "Undo" : "Done"}
              </button>

              {/* <button
                onClick={() => handleDelete(note._id)}
                className="text-sm px-2 py-1 border rounded text-red-500"
              >
                Archived
              </button> */}
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
};

export default NotesPage;