import { useEffect, useState } from "react";
import type { WatchItem } from "../types/watchlist.type";
import {
  getWatchlist,
  createWatchItem,
  updateWatchItem,
} from "../api/watch";
import { CheckIcon, PencilIcon, XMarkIcon } from "@heroicons/react/24/solid";

const WatchlistPage: React.FC = () => {
  const [watchlist, setWatchlist] = useState<WatchItem[]>([]);

  const [title, setTitle] = useState("");
  const [current, setCurrent] = useState("");
  const [nextRelease, setNextRelease] = useState("");

  const [tab, setTab] = useState<"ongoing" | "completed">("ongoing");

  // EDIT STATE
  const [editId, setEditId] = useState<string | null>(null);
  const [editData, setEditData] = useState({
    title: "",
    current: "",
    nextRelease: "",
  });

  // POSTERS CACHE
  const [posters, setPosters] = useState<Record<string, string>>({});

  // SUGGESTIONS
  const [suggestions, setSuggestions] = useState<any[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);

  const API_KEY = import.meta.env.VITE_OMDB_API_KEY;

  const fetchWatchlist = async () => {
    const data = await getWatchlist();
    setWatchlist(data);
  };

  useEffect(() => {
    fetchWatchlist();
  }, []);

  // FETCH POSTER
  const fetchPoster = async (title: string) => {
    if (!title || posters[title]) return;

    try {
      const res = await fetch(
        `https://www.omdbapi.com/?t=${encodeURIComponent(title)}&apikey=${API_KEY}`
      );
      const data = await res.json();

      if (data?.Poster && data.Poster !== "N/A") {
        setPosters((prev) => ({ ...prev, [title]: data.Poster }));
      }
    } catch (err) {
      console.error("Poster fetch failed:", err);
    }
  };

  // FETCH POSTERS WHEN LIST CHANGES
  useEffect(() => {
    watchlist.forEach((item) => {
      fetchPoster(item.title);
    });
  }, [watchlist]);

  // SUGGESTION SEARCH (debounced)
  useEffect(() => {
    if (!title.trim()) {
      setSuggestions([]);
      return;
    }

    const timeout = setTimeout(async () => {
      try {
        const res = await fetch(
          `https://www.omdbapi.com/?s=${encodeURIComponent(title)}&apikey=${API_KEY}`
        );
        const data = await res.json();

        if (data?.Search) {
          setSuggestions(data.Search.slice(0, 5));
          setShowSuggestions(true);
        } else {
          setSuggestions([]);
        }
      } catch (err) {
        console.error("Search failed:", err);
      }
    }, 400);

    return () => clearTimeout(timeout);
  }, [title]);

  // SELECT SUGGESTION
  const selectSuggestion = (item: any) => {
    setTitle(item.Title);
    setShowSuggestions(false);

    if (item.Poster && item.Poster !== "N/A") {
      setPosters((prev) => ({
        ...prev,
        [item.Title]: item.Poster,
      }));
    }
  };

  // CREATE
  const addItem = async () => {
    if (!title.trim()) return;

    await createWatchItem({
      title,
      current,
      nextRelease,
    });

    setTitle("");
    setCurrent("");
    setNextRelease("");
    setSuggestions([]);
    setShowSuggestions(false);

    fetchWatchlist();
  };

  // EDIT START
  const startEdit = (item: WatchItem) => {
    setEditId(item._id);
    setEditData({
      title: item.title,
      current: item.current,
      nextRelease: item.nextRelease,
    });
  };

  // CANCEL
  const cancelEdit = () => {
    setEditId(null);
    setEditData({ title: "", current: "", nextRelease: "" });
  };

  // SAVE
  const saveEdit = async (id: string) => {
    await updateWatchItem(id, editData);
    cancelEdit();
    fetchWatchlist();
  };

  const filtered = watchlist.filter((w) => w.status === tab);

  return (
    <div className="text-xs max-w-md mx-auto mt-8 px-6 pb-6 bg-[#111111]">
      <h1 className="text-lg font-semibold text-white mb-4">Watchlist</h1>

      {/* INPUT */}
      <div className="space-y-2 mb-4">
        <div className="relative">
          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            onFocus={() => title && setShowSuggestions(true)}
            placeholder="Title"
            className="w-full bg-[#1d1d1d] px-2 py-1 rounded text-white"
          />

          {/* SUGGESTIONS */}
          {showSuggestions && suggestions.length > 0 && (
            <ul className="absolute z-10 w-full bg-[#1d1d1d] mt-1 rounded shadow-lg max-h-48 overflow-auto">
              {suggestions.map((s) => (
                <li
                  key={s.imdbID}
                  onClick={() => selectSuggestion(s)}
                  className="flex items-center gap-2 px-2 py-1 hover:bg-[#2a2a2a] cursor-pointer"
                >
                  <img
                    src={
                      s.Poster !== "N/A"
                        ? s.Poster
                        : "https://via.placeholder.com/30x45"
                    }
                    className="w-6 h-8 object-cover rounded"
                  />
                  <span className="text-white text-xs">
                    {s.Title} ({s.Year})
                  </span>
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className="flex gap-2">
          <input
            value={current}
            onChange={(e) => setCurrent(e.target.value)}
            placeholder="S01E02"
            className="flex-1 bg-[#1d1d1d] px-2 py-1 rounded text-white"
          />

          <input
            value={nextRelease}
            onChange={(e) => setNextRelease(e.target.value)}
            placeholder="Next release"
            className="flex-1 bg-[#1d1d1d] px-2 py-1 rounded text-white"
          />
        </div>

        <button
          onClick={addItem}
          className="bg-[#01E777] text-black font-bold px-2 py-1 rounded"
        >
          Add
        </button>
      </div>

      {/* TABS */}
      <div className="flex gap-2 mb-4">
        {["ongoing", "completed"].map((t) => (
          <button
            key={t}
            onClick={() => setTab(t as any)}
            className={`px-2 py-1 rounded-xl capitalize ${
              tab === t
                ? "bg-[#01E777] text-black font-bold"
                : "bg-[#1d1d1d] text-gray-400"
            }`}
          >
            {t}
          </button>
        ))}
      </div>

      {/* LIST */}
      <ul className="space-y-2">
        {filtered.map((item) => {
          const isEditing = editId === item._id;

          return (
            <li
              key={item._id}
              className="p-2 bg-[#1d1d1d] rounded text-white"
            >
              {!isEditing ? (
                <div className="flex gap-3 items-center">
                  <img
                    src={
                      posters[item.title] ||
                      "https://via.placeholder.com/50x75?text=No+Image"
                    }
                    alt={item.title}
                    className="w-12 h-16 object-cover rounded"
                  />

                  <div className="flex-1">
                    <div className="font-medium">{item.title}</div>
                    <div className="text-gray-400 text-xs">
                      {item.current} • Next: {item.nextRelease}
                    </div>
                  </div>

                  <div className="flex gap-2">
                    <button onClick={() => startEdit(item)}>
                      <PencilIcon className="w-4 h-4 text-gray-400 hover:text-white" />
                    </button>

                    <button
                      onClick={async () => {
                        await updateWatchItem(item._id, {
                          status:
                            item.status === "ongoing"
                              ? "completed"
                              : "ongoing",
                        });
                        fetchWatchlist();
                      }}
                    >
                      <CheckIcon className="w-5 h-5 text-[#01E777]" />
                    </button>
                  </div>
                </div>
              ) : (
                <div className="space-y-2">
                  <input
                    value={editData.title}
                    onChange={(e) =>
                      setEditData({ ...editData, title: e.target.value })
                    }
                    className="w-full bg-black px-2 py-1 rounded"
                  />

                  <div className="flex gap-2">
                    <input
                      value={editData.current}
                      onChange={(e) =>
                        setEditData({ ...editData, current: e.target.value })
                      }
                      className="flex-1 bg-black px-2 py-1 rounded"
                    />

                    <input
                      value={editData.nextRelease}
                      onChange={(e) =>
                        setEditData({
                          ...editData,
                          nextRelease: e.target.value,
                        })
                      }
                      className="flex-1 bg-black px-2 py-1 rounded"
                    />
                  </div>

                  <div className="flex gap-2">
                    <button
                      onClick={() => saveEdit(item._id)}
                      className="bg-[#01E777] text-black px-2 py-1 rounded"
                    >
                      Save
                    </button>

                    <button onClick={cancelEdit}>
                      <XMarkIcon className="w-5 h-5 text-red-400" />
                    </button>
                  </div>
                </div>
              )}
            </li>
          );
        })}
      </ul>
    </div>
  );
};

export default WatchlistPage;