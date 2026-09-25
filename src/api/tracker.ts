import { api } from "@/api/client";
import type { TrackerEntry } from "../types/tracker.type";

export const fetchTrackerEntries = async (): Promise<TrackerEntry[]> => {
  const res = await api.get("/tracker");
  return res.data;
};

export const createTrackerEntry = async (
  data: Omit<TrackerEntry, "_id">
): Promise<TrackerEntry> => {
  const res = await api.post("/tracker", data);
  return res.data;
};

export const updateTrackerEntry = async (
  id: string,
  data: Partial<Omit<TrackerEntry, "_id">>
): Promise<TrackerEntry> => {
  const res = await api.put(`/tracker/${id}`, data);
  return res.data;
};

export const deleteTrackerEntry = async (id: string): Promise<void> => {
  await api.delete(`/tracker/${id}`);
};
