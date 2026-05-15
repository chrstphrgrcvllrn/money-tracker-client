import { useEffect, useState } from "react";
import type { Thought } from "../types/thoughts.type";
import { getThoughts, createThought } from "../api/thought";

const ThoughtsPage: React.FC = () => {
  const [thoughts, setThoughts] = useState<Thought[]>([]);
  const [text, setText] = useState("");
  const [expanded, setExpanded] = useState<Set<string>>(new Set());


  const fetchThoughts = async () => {
    const data = await getThoughts();
    setThoughts([...data]);
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

  const toggleThought = (id: string) => {
    setExpanded((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  return (
    <div className="text-xs max-w-md mx-auto mt-8 px-6 pb-6 bg-[#000000]">
      {/* INPUT */}
      <div className="flex gap-2 mb-4">
        <input
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="Write a thought..."
          className="flex-1 bg-[#1f1b1c] px-2 py-7 rounded text-white"
        />

        <button
          onClick={addThought}
          className="bg-[#DFF966] text-black font-bold px-2 py-1 rounded"
        >
          Add
        </button>
      </div>

      {/* LIST */}
      <ul className="space-y-2">
        {thoughts.map((t) => {
          const isOpen = expanded.has(t._id);

          return (
            <li
              key={t._id}
              className="px-4 py-5 bg-[#1f1b1c] rounded text-white cursor-pointer"
            >
              <button
                onClick={() => toggleThought(t._id)}
                className="w-full text-left"
              >
                {isOpen ? (
                  <div>
                    {/* <div className="text-[10px] text-gray-400"> */}
                      {/* Click to collapse */}
                    {/* </div> */}
                    "{t.text}"
                  </div>
                ) : (
                   <div className="line-clamp-2">"{t.text}"</div>
                )}
              </button>
            </li>
          );
        })}
      </ul>
    </div>
  );
};

export default ThoughtsPage;