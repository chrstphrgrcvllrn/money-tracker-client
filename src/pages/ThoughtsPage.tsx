import { useEffect, useState } from "react";
import type { Thought } from "../types/thoughts.type";
import { getThoughts, createThought } from "../api/thought";
import { ChatBubbleLeftIcon } from "@heroicons/react/24/outline";
import { useToast } from "../components/useToast";

const ThoughtsPage: React.FC = () => {
  const showToast = useToast();

  const [thoughts, setThoughts] = useState<Thought[]>([]);
  const [text, setText] = useState("");
  const [expanded, setExpanded] = useState<Set<string>>(new Set());


  const fetchThoughts = async () => {
    try {
      const data = await getThoughts();
      setThoughts([...data]);
    } catch (error) {
      console.error("Failed to load thoughts:", error);
      showToast("Failed to load thoughts", "error");
    }
  };

  useEffect(() => {
    fetchThoughts();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const addThought = async () => {
    if (!text.trim()) return;

    try {
      await createThought(text.trim());
      setText("");
      fetchThoughts();
      showToast("Thought added!", "success");
    } catch (error) {
      console.error("Failed to add thought:", error);
      showToast("Failed to add thought", "error");
    }
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
    <div className="text-xs max-w-md mx-auto mt-8 px-6 pb-6 bg-[var(--bg-page)]">
      {/* INPUT */}
      <div className="flex gap-2 mb-4">
        <input
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="Write a thought..."
          className="flex-1 bg-[var(--bg-input)] px-2 py-7 rounded text-[var(--text-primary)] border border-gray-600 focus:border-[#C9A374]/50 outline-none"
        />

        <button
          onClick={addThought}
          className="bg-[var(--btn-bg)] text-[var(--btn-text)] font-bold px-2 py-1 rounded"
        >
          Add
        </button>
      </div>

      {/* LIST */}
      <ul>
        {thoughts.map((t, idx, arr) => {
          const isOpen = expanded.has(t._id);

          return (
            <li
              key={t._id}
              className={idx !== arr.length - 1 ? "border-b border-[var(--border-subtle)]" : ""}
            >
              <button
                onClick={() => toggleThought(t._id)}
                className="w-full flex items-start gap-3 py-4 text-left text-[var(--text-primary)] cursor-pointer"
              >
                <div className="shrink-0 w-9 h-9 rounded-lg flex items-center justify-center border border-[#C9A374]/40">
                  <ChatBubbleLeftIcon className="w-4 h-4 text-[#C9A374]" />
                </div>

                {isOpen ? (
                  <div className="flex-1 min-w-0">"{t.text}"</div>
                ) : (
                   <div className="flex-1 min-w-0 line-clamp-2">"{t.text}"</div>
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
