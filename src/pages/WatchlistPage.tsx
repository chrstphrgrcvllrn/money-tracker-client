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
  const [status, setStatus] = useState<WatchItem["status"]>("ongoing");

  const [tab, setTab] = useState<"ongoing" | "completed">("ongoing");

  // 👇 EDIT STATE
  const [editId, setEditId] = useState<string | null>(null);
  const [editData, setEditData] = useState({
    title: "",
    current: "",
    nextRelease: "",
  });

  const fetchWatchlist = async () => {
    const data = await getWatchlist();
    setWatchlist([...data]);
  };

  useEffect(() => {
    fetchWatchlist();
  }, []);

  // CREATE
  const addItem = async () => {
    if (!title.trim()) return;

    await createWatchItem({
      title,
      current,
      nextRelease,
      status,
    });

    setTitle("");
    setCurrent("");
    setNextRelease("");
    fetchWatchlist();
  };

  // START EDIT
  const startEdit = (item: WatchItem) => {
    setEditId(item._id);
    setEditData({
      title: item.title,
      current: item.current,
      nextRelease: item.nextRelease,
    });
  };

  // CANCEL EDIT
  const cancelEdit = () => {
    setEditId(null);
    setEditData({ title: "", current: "", nextRelease: "" });
  };

  // SAVE EDIT
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
        <input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Title"
          className="w-full bg-[#1d1d1d] px-2 py-1 rounded text-white"
        />

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
              {/* VIEW MODE */}
              {!isEditing ? (
                <div className="flex justify-between items-center">
                  <div>
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
                // EDIT MODE
                <div className="space-y-2">
                  <input
                    value={editData.title}
                    onChange={(e) =>
                      setEditData({
                        ...editData,
                        title: e.target.value,
                      })
                    }
                    className="w-full bg-black px-2 py-1 rounded"
                  />

                  <div className="flex gap-2">
                    <input
                      value={editData.current}
                      onChange={(e) =>
                        setEditData({
                          ...editData,
                          current: e.target.value,
                        })
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