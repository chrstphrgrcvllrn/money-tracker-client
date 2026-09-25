import { api } from "@/api/client";

// -------------------------
// GET WATCHLIST
// -------------------------
export const getWatchlist = async () => {
  const res = await api.get("/watchlist");
  return res.data;
};

// -------------------------
// CREATE ITEM
// -------------------------
export const createWatchItem = async (item: unknown) => {
  const res = await api.post("/watchlist", item);
  return res.data;
};

// -------------------------
// UPDATE ITEM
// -------------------------
export const updateWatchItem = async (id: string, data: unknown) => {
  const res = await api.patch(`/watchlist/${id}`, data);
  return res.data;
};

// -------------------------
// DELETE ITEM
// -------------------------
export const deleteWatchItem = async (id: string) => {
  const res = await api.delete(`/watchlist/${id}`);
  return res.data;
};
