import { useEffect, useState } from "react";
import type { Thought } from "../types/thoughts.type";
import { getThoughts, createThought } from "../api/thought";

const ThoughtsPage: React.FC = () => {
  const [thoughts, setThoughts] = useState<Thought[]>([]);
  const [text, setText] = useState("");

  const fetchThoughts = async () => {
    const data = await getThoughts();
    setThoughts([...data]); // force re-render
  };

  useEffect(() => {
    fetchThoughts();
  }, []);

  const addThought = async () => {
    if (!text.trim()) return;

    await createThought(text.trim());
    setText("");
    fetchThoughts();
  };

  return (
    <div className="text-xs max-w-md mx-auto mt-8 px-6 pb-6 bg-[#111111]">
      <h1 className="text-lg font-semibold text-white mb-4">Thoughts</h1>

      {/* INPUT */}
      <div className="flex gap-2 mb-4">
        <input
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="Write a thought..."
          className="flex-1 bg-[#1d1d1d] px-2 py-1 rounded text-white"
        />

        <button
          onClick={addThought}
          className="bg-[#01E777] text-black font-bold px-2 py-1 rounded"
        >
          Add
        </button>
      </div>

      {/* LIST */}
      <ul className="space-y-2">
        {thoughts.map((t) => (
          <li
            key={t._id}
            className="p-2 bg-[#1d1d1d] rounded text-white"
          >
            {t.text}
          </li>
        ))}
      </ul>
    </div>
  );
};

export default ThoughtsPage;