import { useEffect, useRef, useState } from "react";
import type { Thought } from "../types/thoughts.type";
import { getThoughts, createThought } from "../api/thought";
import { PaperAirplaneIcon } from "@heroicons/react/24/solid";
import { useToast } from "../components/useToast";

const formatTime = (ts: number) =>
  new Date(ts).toLocaleTimeString(undefined, { hour: "numeric", minute: "2-digit" });

const formatDateLabel = (ts: number) => {
  const d = new Date(ts);
  const today = new Date();
  const yesterday = new Date(today);
  yesterday.setDate(today.getDate() - 1);

  if (d.toDateString() === today.toDateString()) return "Today";
  if (d.toDateString() === yesterday.toDateString()) return "Yesterday";

  return d.toLocaleDateString(undefined, { month: "long", day: "numeric", year: "numeric" });
};

const ThoughtsPage: React.FC = () => {
  const showToast = useToast();

  const [thoughts, setThoughts] = useState<Thought[]>([]);
  const [text, setText] = useState("");
  const [sending, setSending] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

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

  // Chat views open scrolled to the latest message.
  useEffect(() => {
    const el = scrollRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [thoughts.length]);

  // createdAt comes back from the API as an ISO date string despite the
  // `number` type — go through `new Date(...)` so the comparison actually
  // works regardless of whether it's a string or a numeric epoch value.
  const sortedThoughts = [...thoughts].sort(
    (a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
  );

  const addThought = async () => {
    if (!text.trim() || sending) return;

    setSending(true);
    try {
      await createThought(text.trim());
      setText("");
      await fetchThoughts();
    } catch (error) {
      console.error("Failed to add thought:", error);
      showToast("Failed to add thought", "error");
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="h-full flex flex-col bg-[var(--bg-page)]">
      {/* HEADER */}
      <div className="px-6 pt-6 pb-3 shrink-0">
        <h1 className="text-lg font-semibold text-[var(--text-primary)]">Thoughts</h1>
      </div>

      {/* MESSAGE LIST */}
      <div ref={scrollRef} className="flex-1 min-h-0 overflow-y-auto px-4 pb-3">
        {sortedThoughts.length === 0 ? (
          <p className="text-center text-[var(--text-secondary)] text-sm py-8">
            No thoughts yet. Write your first one below.
          </p>
        ) : (
          sortedThoughts.map((t, idx) => {
            const prev = sortedThoughts[idx - 1];
            const showDateSeparator =
              !prev || formatDateLabel(prev.createdAt) !== formatDateLabel(t.createdAt);

            // Purely presentational — there's only one author — alternating
            // sides just gives it the back-and-forth look of a conversation.
            const isRight = idx % 2 === 1;

            return (
              <div key={t._id}>
                {showDateSeparator && (
                  <div className="text-center text-[10px] text-[var(--text-secondary)] my-3">
                    {formatDateLabel(t.createdAt)}
                  </div>
                )}

                <div className={`flex ${isRight ? "justify-end" : "justify-start"}`}>
                  <div
                    className={`max-w-[75%] rounded-2xl px-3 py-2 mt-1 ${
                      isRight
                        ? "bg-[var(--btn-bg)] text-[var(--btn-text)] rounded-br-md"
                        : "bg-[var(--bg-surface)] text-[var(--text-primary)] rounded-bl-md"
                    }`}
                  >
                    <p className="text-sm whitespace-pre-wrap break-words">{t.text}</p>
                  </div>
                </div>

                <div className={`flex mt-0.5 mb-2 ${isRight ? "justify-end" : "justify-start"}`}>
                  <span
                    className={`text-[10px] text-[var(--text-secondary)] ${
                      isRight ? "pr-1" : "pl-1"
                    }`}
                  >
                    {formatTime(t.createdAt)}
                  </span>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* COMPOSER */}
      <div className="shrink-0 flex items-center gap-2 px-4 py-3 border-t border-[var(--border-subtle)]">
        <input
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") addThought();
          }}
          placeholder="Write a thought..."
          className="flex-1 bg-[var(--bg-input)] px-4 py-2.5 rounded-full text-sm text-[var(--text-primary)] border border-gray-600 focus:border-[#2DE0E6]/50 outline-none"
        />

        <button
          onClick={addThought}
          disabled={!text.trim() || sending}
          aria-label="Send"
          className="shrink-0 w-10 h-10 rounded-full flex items-center justify-center bg-[var(--btn-bg)] text-[var(--btn-text)] disabled:opacity-40"
        >
          <PaperAirplaneIcon className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};

export default ThoughtsPage;
