import { useEffect, useState } from "react";
import type { WatchItem } from "../types/watchlist.type";
import {
  getWatchlist,
  createWatchItem,
  updateWatchItem,
  deleteWatchItem,
} from "../api/watch";
import {
  PencilIcon,
  XMarkIcon,
  CheckIcon,
} from "@heroicons/react/24/solid";

type Episode = {
  season: number;
  number: number;
  airdate: string;
  name: string;
};

const WatchlistPage: React.FC = () => {
  const [watchlist, setWatchlist] = useState<WatchItem[]>([]);
  const [title, setTitle] = useState("");
  const [current, setCurrent] = useState("");
  const [tab, setTab] = useState<"ongoing" | "completed">("ongoing");

  const [showAddModal, setShowAddModal] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);

  const [editItems, setEditItems] =
    useState<Record<string, Partial<WatchItem>>>({});
  const [posters, setPosters] = useState<Record<string, string>>({});
  const [episodesCache, setEpisodesCache] = useState<
    Record<string, Episode[]>
  >({});

  const [suggestions, setSuggestions] = useState<any[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [link, setLink] = useState("");


 

  const API_KEY = import.meta.env.VITE_OMDB_API_KEY;

  // -------------------------
  // WATCHLIST
  // -------------------------
  const fetchWatchlist = async () => {
    const data = await getWatchlist();
    setWatchlist(data);
  };

  useEffect(() => {
    fetchWatchlist();
  }, []);

  // -------------------------
  // TOGGLE STATUS (ONGOING <-> COMPLETED)
  // -------------------------
  const handleToggleStatus = async (item: WatchItem) => {
    const newStatus =
      item.status === "completed" ? "ongoing" : "completed";

    await updateWatchItem(item._id, { status: newStatus });
    fetchWatchlist();
  };

  // -------------------------
  // TVMAZE (EPISODES ONLY)
  // -------------------------
  const fetchEpisodes = async (title: string) => {
    if (!title || episodesCache[title]) return;

    try {
      const res = await fetch(
        `https://api.tvmaze.com/search/shows?q=${encodeURIComponent(title)}`
      );

      if (!res.ok) return;

      const data = await res.json();
      const show = data?.[0]?.show;

      if (!show?.id) return;

      const epRes = await fetch(
        `https://api.tvmaze.com/shows/${show.id}/episodes`
      );

      if (!epRes.ok) return;

      const eps = await epRes.json();

      setEpisodesCache((prev) => ({
        ...prev,
        [title]: eps || [],
      }));
    } catch (err) {
      console.error("TVMaze error:", err);
    }
  };

  // -------------------------
  // IMAGE (OMDB → TVMAZE → FALLBACK)
  // -------------------------
  const fetchPoster = async (title: string) => {
    if (!title || posters[title]) return;

    try {
      let poster = "";

      const omdbRes = await fetch(
        `https://www.omdbapi.com/?t=${encodeURIComponent(
          title
        )}&apikey=${API_KEY}`
      );

      const omdbData = await omdbRes.json();

      if (omdbData?.Poster && omdbData.Poster !== "N/A") {
        poster = omdbData.Poster;
      }

      if (!poster) {
        const tvRes = await fetch(
          `https://api.tvmaze.com/search/shows?q=${encodeURIComponent(title)}`
        );

        if (tvRes.ok) {
          const tvData = await tvRes.json();
          const show = tvData?.[0]?.show;

          if (show?.image?.medium || show?.image?.original) {
            poster =
              show.image.medium || show.image.original || "";
          }
        }
      }

      setPosters((prev) => ({
        ...prev,
        [title]: poster,
      }));
    } catch (err) {
      console.error("Image fetch error:", err);
      setPosters((prev) => ({ ...prev, [title]: "" }));
    }
  };

  useEffect(() => {
    watchlist.forEach((item) => {
      fetchPoster(item.title);
      fetchEpisodes(item.title);
    });
  }, [watchlist]);

  // -------------------------
  // SUGGESTIONS
  // -------------------------
  useEffect(() => {
    if (!title.trim()) {
      setSuggestions([]);
      setShowSuggestions(false);
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
          setShowSuggestions(false);
        }
      } catch (err) {
        console.error(err);
      }
    }, 300);

    return () => clearTimeout(timeout);
  }, [title]);

  const selectSuggestion = (item: any) => {
    setTitle(item.Title);
    setShowSuggestions(false);
  };

  // -------------------------
  // EP PARSER
  // -------------------------
  const parseEpisode = (ep?: string) => {
    if (!ep) return { season: 0, number: 0 };
    const match = ep.match(/S(\d+)E(\d+)/i);
    return match
      ? { season: +match[1], number: +match[2] }
      : { season: 0, number: 0 };
  };

  // -------------------------
  // PROGRESS LOGIC
  // -------------------------
  const getEpisodeProgress = (title: string, currentEp?: string) => {
    const eps = episodesCache[title];
    if (!eps || !currentEp) {
      return {
        availableAired: 0,
        next: null as Episode | null,
        isUpToDate: false,
      };
    }

    const today = new Date();
    const { season, number } = parseEpisode(currentEp);

    const airedUnwatched = eps.filter((e) => {
      const airedDate = new Date(e.airdate);

      const isAired = airedDate <= today;

      const isAfterCurrent =
        e.season > season ||
        (e.season === season && e.number > number);

      return isAired && isAfterCurrent;
    });

    return {
      availableAired: airedUnwatched.length,
      next: airedUnwatched[0] || null,
      isUpToDate: airedUnwatched.length === 0,
    };
  };

  // -------------------------
  // SORTING
  // -------------------------
  const today = new Date();

  const sortedFiltered = watchlist
    .filter((w) => w.status === tab)
    .map((item) => {
      const progress = getEpisodeProgress(item.title, item.current);
      const nextAired =
        progress.next && new Date(progress.next.airdate) <= today;

      return { ...item, progress, nextAired };
    })
    .sort((a, b) => {
      if (a.progress.availableAired !== b.progress.availableAired) {
        return b.progress.availableAired - a.progress.availableAired;
      }
      if (a.nextAired !== b.nextAired) {
        return a.nextAired ? -1 : 1;
      }
      return 0;
    });

  // -------------------------
  // CRUD
  // -------------------------
const addItem = async () => {
  if (!title) return;

  await createWatchItem({
    title,
    current,
    link,
  });

  setTitle("");
  setCurrent("");
  setLink("");
  setShowAddModal(false);

  fetchWatchlist();
};

  const startEdit = () => {
    const init: Record<string, Partial<WatchItem>> = {};
    watchlist.forEach((item) => {
      init[item._id] = item;
    });
    setEditItems(init);
    setIsEditMode(true);
  };

  const cancelEdit = () => {
    setIsEditMode(false);
    setEditItems({});
  };

  const saveAll = async () => {
    await Promise.all(
      Object.entries(editItems).map(([id, data]) =>
        updateWatchItem(id, data)
      )
    );

    cancelEdit();
    fetchWatchlist();
  };

const handleDelete = async (id: string) => {
  if (!confirm("Delete this item?")) return;

  await deleteWatchItem(id);

  // ✅ FIX: remove from edit state immediately
  setEditItems((prev) => {
    const copy = { ...prev };
    delete copy[id];
    return copy;
  });

  fetchWatchlist();
};

  const updateEditField = (id: string, field: string, value: string) => {
    setEditItems((prev) => ({
      ...prev,
      [id]: { ...prev[id], [field]: value },
    }));
  };


// const openStreamingLink = (link?: string) => {
//   if (!link) return;

//   // NETFLIX
//   if (link.includes("netflix.com")) {
//     const netflixIdMatch = link.match(/title\/(\d+)/);

//     if (netflixIdMatch?.[1]) {
//       const id = netflixIdMatch[1];

//       const appUrl = `nflx://www.netflix.com/title/${id}`;

//       window.location.href = appUrl;

//       setTimeout(() => {
//         window.open(link, "_blank");
//       }, 800);

//       return;
//     }
//   }

//   // DEFAULT
//   window.open(link, "_blank");
// };


  // -------------------------
  // UI
  // -------------------------
  return (
    <div className="text-xs max-w-md mx-auto mt-8 px-6 pb-6 bg-black">

      {/* TOP BAR */}
      <div className="flex justify-between mb-4">
        <div className="flex gap-2">
          {["ongoing", "completed"].map((t) => (
            <button
              key={t}
              onClick={() => setTab(t as any)}
              className={`px-2 py-1 rounded ${
                tab === t
                  ? "bg-[#1c1c1e] text-[#EB5647]"
                  : "bg-[#1C1C1E] text-gray-400"
              }`}
            >
              {t}
            </button>
          ))}
        </div>

        <div className="flex gap-2">
          {!isEditMode ? (
            <>
              <button onClick={startEdit} 
              // className="bg-[#1C1C1E] p-2 rounded"
               className="mb-0 px-[0.7rem] py-[0.3rem]   bg-[#1c1c1e] text-[#EB5647] font-bold rounded-4xl text-sm"
              >
                <PencilIcon className="w-4 h-4 text-white" />
              </button>

              <button
                onClick={() => setShowAddModal(true)}
                // className=" bg-[#1c1c1e] text-[#EB5647] px-2 py-1 rounded "
                 className="mb-0 px-[0.7rem] py-[0.3rem]   bg-[#1c1c1e] text-[#EB5647] font-bold rounded-4xl text-sm"
              >
                +
              </button>
            </>
          ) : (
            <>
              <button onClick={saveAll} className="bg-[#EB5647] px-2 py-1 rounded">
                Save
              </button>

              <button onClick={cancelEdit} className="bg-[#1C1C1E] p-2 rounded">
                <XMarkIcon className="w-4 h-4 text-white" />
              </button>
            </>
          )}
        </div>
      </div>

      {/* LIST */}
      <ul className="space-y-2">
        {sortedFiltered.map((item) => {
          const progress = item.progress;
          const editing = isEditMode;

          const epLabel =
            progress.availableAired > 0
              ? `${progress.availableAired} new EP${
                  progress.availableAired > 1 ? "s" : ""
                } aired`
              : null;

          return (
         <li
  key={item._id}
  // onClick={() => openStreamingLink(item.link)}
  className={`p-2 bg-[#1C1C1E] rounded text-white ${
    item.link ? "cursor-pointer" : ""
  }`}
>
              <div className="flex gap-3">

                {posters[item.title] ? (
                  <img
                    src={posters[item.title]}
                    className="w-12 h-16 object-cover rounded"
                  />
                ) : (
                  <div className="w-12 h-16 bg-[#333] flex items-center justify-center text-[10px] text-gray-400 text-center px-1">
                    No image
                  </div>
                )}

                <div className="flex-1">
                  {!editing ? (
                    <>
                      <div className="flex justify-between items-start">
                        <div className="font-medium text-lg">
                          {item.title}
                        </div>
                        

                                          

                        {/* CHECK / UNDO */}
                        <button
                          onClick={() => handleToggleStatus(item)}
                          className={`${
                            tab === "completed"
                              ? "text-yellow-400"
                              : "text-green-400"
                          }`}
                          title={
                            tab === "completed"
                              ? "Undo completed"
                              : "Mark completed"
                          }
                        >
                          <CheckIcon className="w-4 h-4" />
                        </button>
                      </div>

                      {item.current?.trim() && (
                        <div className="text-gray-400">
                          Recent watched: {item.current}
                        </div>
                      )}

                      {epLabel && (
                        <div className="text-green-400">{epLabel}</div>
                      )}

                      {progress.next && (
                        <div className="text-gray-400">
                          Next: S{progress.next.season}E
                          {progress.next.number}
                        </div>
                      )}
                      {item.link && (
                    <button
                      onClick={() => window.open(item.link, "_blank")}
                      className="mt-2 text-xs bg-[#2d2d2e] text-gray-400  px-8 py-1 rounded"
                    >
                      Watch on netflix
                    </button>
                  )}
                    </>
                  ) : (
                    <div className="space-y-1">
                      <input
                        value={editItems[item._id]?.title || item.title}
                        onChange={(e) =>
                          updateEditField(item._id, "title", e.target.value)
                        }
                        className="w-full bg-black p-1 rounded"
                      />

                      <input
                        value={editItems[item._id]?.current || item.current}
                        onChange={(e) =>
                          updateEditField(item._id, "current", e.target.value)
                        }
                        className="w-full bg-black p-1 rounded"
                      />

                      <input
                        value={editItems[item._id]?.link || item.link || ""}
                        onChange={(e) =>
                          updateEditField(item._id, "link", e.target.value)
                        }
                        placeholder="Streaming link"
                        className="w-full bg-black p-1 rounded"
                      />
                      <button
                        onClick={() => handleDelete(item._id)}
                        className="text-red-400 text-xs"
                      >
                        Delete
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </li>
          );
        })}
      </ul>

{showAddModal && (
  <div className="fixed inset-0 bg-black/30 backdrop-blur-xl flex items-center justify-center">
    <div className="bg-[#111] p-4 w-80 rounded text-white">

      <input
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        placeholder="Title"
        className="w-full p-2 bg-[#1C1C1E] rounded"
      />

      {/* SUGGESTIONS */}
      {showSuggestions && suggestions.length > 0 && (
        <ul className="bg-[#1C1C1E] mt-1 rounded max-h-60 overflow-auto">
          {suggestions.map((item, idx) => (
            <li
              key={idx}
              onClick={() => selectSuggestion(item)}
              className="p-2 hover:bg-[#333] cursor-pointer flex gap-2 items-center"
            >
              {item.Poster && item.Poster !== "N/A" ? (
                <img
                  src={item.Poster}
                  className="w-8 h-10 object-cover rounded"
                />
              ) : (
                <div className="w-8 h-10 bg-[#333] rounded flex items-center justify-center text-[8px]">
                  No
                </div>
              )}

              <span className="text-white">{item.Title}</span>
            </li>
          ))}
        </ul>
      )}

      <input
        value={current}
        onChange={(e) => setCurrent(e.target.value)}
        placeholder="S1E1"
        className="w-full p-2 mt-2 bg-[#1C1C1E] rounded"
      />
      <input
  value={link}
  onChange={(e) => setLink(e.target.value)}
  placeholder="Netflix / Crunchyroll / Any Link"
  className="w-full p-2 mt-2 bg-[#1C1C1E] rounded"
/>

      <button
        onClick={addItem}
        className="w-full mt-3 bg-[#EB5647] p-2 rounded text-white"
      >
        Add
      </button>

      <button
        onClick={() => setShowAddModal(false)}
        className="w-full mt-2 text-gray-300"
      >
        Cancel
      </button>

    </div>
  </div>
)}

    </div>
  );
};

export default WatchlistPage;