import axios from "axios";
import type { TrackerEntry } from "../types/tracker.type";

const BASE_URL =
  import.meta.env.MODE === "production"
    ? import.meta.env.VITE_PROD_API_URL
    : import.meta.env.VITE_DEV_API_URL;

const API_URL = `${BASE_URL}/api/tracker`;

export const fetchTrackerEntries = async (): Promise<TrackerEntry[]> => {
  const res = await axios.get(API_URL);
  return res.data;
};

export const createTrackerEntry = async (
  data: Omit<TrackerEntry, "_id">
): Promise<TrackerEntry> => {
  const res = await axios.post(API_URL, data);
  return res.data;
};

export const updateTrackerEntry = async (
  id: string,
  data: Partial<Omit<TrackerEntry, "_id">>
): Promise<TrackerEntry> => {
  const res = await axios.put(`${API_URL}/${id}`, data);
  return res.data;
};

export const deleteTrackerEntry = async (id: string): Promise<void> => {
  await axios.delete(`${API_URL}/${id}`);
};
