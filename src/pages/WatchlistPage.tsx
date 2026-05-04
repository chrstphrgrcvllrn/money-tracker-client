import { useEffect, useState } from "react";
import type { WatchItem } from "../types/watchlist.type";
import {
  getWatchlist,
  createWatchItem,
  updateWatchItem,
} from "../api/watch";
import { PencilIcon, XMarkIcon } from "@heroicons/react/24/solid";

const WatchlistPage: React.FC = () => {
  const [watchlist, setWatchlist] = useState<WatchItem[]>([]);

  const [title, setTitle] = useState("");
  const [current, setCurrent] = useState("");
  const [nextRelease, setNextRelease] = useState("");

  const [tab, setTab] = useState<"ongoing" | "completed">("ongoing");

  const [showAddModal, setShowAddModal] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);

  const [editItems, setEditItems] = useState<Record<string, Partial<WatchItem>>>(
    {}
  );

  const [posters, setPosters] = useState<Record<string, string>>({});

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

  const fetchPoster = async (title: string) => {
    if (!title || posters[title]) return;

    try {
      const res = await fetch(
        `https://www.omdbapi.com/?t=${encodeURIComponent(
          title
        )}&apikey=${API_KEY}`
      );

      const data = await res.json();

      if (data?.Poster && data.Poster !== "N/A") {
        setPosters((prev) => ({
          ...prev,
          [title]: data.Poster,
        }));
      }
    } catch (err) {
      console.error("Poster fetch failed:", err);
    }
  };

  useEffect(() => {
    watchlist.forEach((item) => {
      fetchPoster(item.title);
    });
  }, [watchlist]);

  useEffect(() => {
    if (!title.trim()) {
      setSuggestions([]);
      return;
    }

    const timeout = setTimeout(async () => {
      try {
        const res = await fetch(
          `https://www.omdbapi.com/?s=${encodeURIComponent(
            title
          )}&apikey=${API_KEY}`
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
    setShowAddModal(false);

    fetchWatchlist();
  };

  const startEditAll = () => {
    const initial: Record<string, Partial<WatchItem>> = {};

    watchlist.forEach((item) => {
      initial[item._id] = {
        title: item.title,
        current: item.current,
        nextRelease: item.nextRelease,
      };
    });

    setEditItems(initial);
    setIsEditMode(true);
  };

  const cancelEdit = () => {
    setEditItems({});
    setIsEditMode(false);
  };

  const saveAll = async () => {
    const updates = Object.entries(editItems).map(([id, data]) =>
      updateWatchItem(id, data)
    );

    await Promise.all(updates);

    cancelEdit();
    fetchWatchlist();
  };

  const updateEditField = (
    id: string,
    field: "title" | "current" | "nextRelease",
    value: string
  ) => {
    setEditItems((prev) => ({
      ...prev,
      [id]: {
        ...prev[id],
        [field]: value,
      },
    }));
  };
  const formatEpisode = (value?: string) => {
  if (!value) return "";
  return value.replace(/(S\d+)(E[P]?\d+)/i, "$1 $2");
};

  const filtered = watchlist.filter((w) => w.status === tab);

  return (
    <div className="text-xs max-w-md mx-auto mt-8 px-6 pb-6 bg-[#000000]">
      <div className="flex gap-2 mb-4 justify-between">
        <div className="mb-4">
          {["ongoing", "completed"].map((t) => (
            <button
              key={t}
              onClick={() => setTab(t as "ongoing" | "completed")}
              className={`px-2 py-1 rounded-xl capitalize ${
                tab === t
                  ? "bg-[#EB5647] text-white font-bold"
                  : "bg-[#1C1C1E] text-gray-400"
              }`}
            >
              {t}
            </button>
          ))}
        </div>

        <div className="mb-4 flex gap-2">
          {!isEditMode ? (
            <>
              <button
                onClick={startEditAll}
                className="px-[0.7rem] py-[0.3rem] bg-[#1C1C1E] text-white rounded-4xl"
              >
                <PencilIcon className="w-4 h-4" />
              </button>

              <button
                onClick={() => setShowAddModal(true)}
                className="px-[0.7rem] py-[0.3rem] bg-[#EB5647] text-white font-bold rounded-4xl text-sm"
              >
                +
              </button>
            </>
          ) : (
            <>
              <button
                onClick={saveAll}
                className="px-3 py-1 bg-[#EB5647] text-white rounded-4xl font-semibold"
              >
                Save
              </button>

              <button
                onClick={cancelEdit}
                className="px-[0.7rem] py-[0.3rem] bg-[#1C1C1E] text-white rounded-4xl"
              >
                <XMarkIcon className="w-4 h-4" />
              </button>
            </>
          )}
        </div>
      </div>

      <ul className="space-y-2">
        {filtered.map((item) => {
          const edited = editItems[item._id];

          return (
            <li
              key={item._id}
              className="p-2 bg-[#1C1C1E] rounded text-white"
            >
              {!isEditMode ? (
                <div className="flex gap-3 items-center">
                  {posters[item.title] ? (
                    <img
                      src={posters[item.title]}
                      alt={item.title}
                      className="w-12 h-16 object-cover rounded"
                    />
                  ) : (
                    <div className="w-12 h-16 rounded bg-[#3a3a3c] flex items-center justify-center text-[9px] text-gray-400 text-center px-1 leading-tight">
                      No thumbnail
                    </div>
                  )}

                  <div className="flex-1 min-w-0">
                    <div className="font-medium text-sm truncate">
                      {item.title}
                    </div>
                  </div>

                  <div className="text-right leading-tight shrink-0">
                    {item.current && (
                      <div className="text-white text-sm font-medium">
                       {formatEpisode(item.current)}
                      </div>
                    )}

                    {item.nextRelease && (
                      <div className="text-gray-300 text-sm font-semibold mt-0.5">
                        {item.nextRelease}
                      </div>
                    )}
                  </div>
                </div>
              ) : (
                <div className="space-y-2">
                  <input
                    value={edited?.title || ""}
                    onChange={(e) =>
                      updateEditField(item._id, "title", e.target.value)
                    }
                    className="w-full bg-black px-2 py-1 rounded"
                  />

                  <div className="flex gap-2">
                    <input
                      value={edited?.current || ""}
                      onChange={(e) =>
                        updateEditField(item._id, "current", e.target.value)
                      }
                      className="flex-1 bg-black px-2 py-1 rounded"
                    />

                    <input
                      value={edited?.nextRelease || ""}
                      onChange={(e) =>
                        updateEditField(
                          item._id,
                          "nextRelease",
                          e.target.value
                        )
                      }
                      className="flex-1 bg-black px-2 py-1 rounded"
                    />
                  </div>
                </div>
              )}
            </li>
          );
        })}
      </ul>

      {showAddModal && (
        <div className="fixed inset-0 z-50 bg-black/70 flex items-center justify-center px-4">
          <div className="w-full max-w-md bg-[#111111] rounded-xl p-4">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-white font-semibold text-sm">
                Add new movie
              </h2>

              <button onClick={() => setShowAddModal(false)}>
                <XMarkIcon className="w-5 h-5 text-gray-400" />
              </button>
            </div>

            <div className="space-y-2">
              <div className="relative">
                <input
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  onFocus={() => title && setShowSuggestions(true)}
                  placeholder="Title"
                  className="w-full bg-[#1C1C1E] px-2 py-4 rounded text-white"
                />

                {showSuggestions && suggestions.length > 0 && (
                  <ul className="absolute z-10 w-full bg-[#1C1C1E] mt-1 rounded shadow-lg max-h-48 overflow-auto">
                    {suggestions.map((s) => (
                      <li
                        key={s.imdbID}
                        onClick={() => selectSuggestion(s)}
                        className="flex items-center gap-2 px-2 py-3 hover:bg-[#2a2a2a] cursor-pointer"
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
                  className="flex-1 bg-[#1C1C1E] px-2 py-2 rounded text-white"
                />

                <input
                  value={nextRelease}
                  onChange={(e) => setNextRelease(e.target.value)}
                  placeholder="Next release"
                  className="flex-1 bg-[#1C1C1E] px-2 py-2 rounded text-white"
                />
              </div>

              <button
                onClick={addItem}
                className="w-full bg-[#EB5647] text-white font-bold px-2 py-2 rounded"
              >
                Add
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default WatchlistPage;