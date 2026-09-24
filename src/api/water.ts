import axios from "axios";
import type { WaterLog } from "../types/water.type";

const BASE_URL =
  import.meta.env.MODE === "production"
    ? import.meta.env.VITE_PROD_API_URL
    : import.meta.env.VITE_DEV_API_URL;

const API_URL = `${BASE_URL}/api/water`;

// Latest logged days, newest first.
export const getWaterLogs = async (): Promise<WaterLog[]> => {
  const res = await axios.get(API_URL);
  return res.data;
};

// Add (+1) or remove (-1) a glass for one day; returns that day's new total.
export const adjustWater = async (date: string, delta: 1 | -1): Promise<WaterLog> => {
  const res = await axios.patch(`${API_URL}/${date}`, { delta });
  return res.data;
};
