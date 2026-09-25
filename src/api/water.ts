import { api } from "@/api/client";
import type { WaterLog } from "../types/water.type";

// Latest logged days, newest first.
export const getWaterLogs = async (): Promise<WaterLog[]> => {
  const res = await api.get("/water");
  return res.data;
};

// Add (+1) or remove (-1) a glass for one day; returns that day's new total.
export const adjustWater = async (date: string, delta: 1 | -1): Promise<WaterLog> => {
  const res = await api.patch(`/water/${date}`, { delta });
  return res.data;
};
