import axios from "axios";
import type { CalendarEvent } from "../types/calendar.type";

const BASE_URL =
  import.meta.env.MODE === "production"
    ? import.meta.env.VITE_PROD_API_URL
    : import.meta.env.VITE_DEV_API_URL;

const API_URL = `${BASE_URL}/api/calendar-events`;

export const getEvents = async (): Promise<CalendarEvent[]> => {
  const res = await axios.get(API_URL);
  return res.data;
};

export const createEvent = async (
  event: Omit<CalendarEvent, "_id" | "createdAt">
): Promise<CalendarEvent> => {
  const res = await axios.post(API_URL, event);
  return res.data;
};
