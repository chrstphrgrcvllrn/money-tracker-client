import { api } from "@/api/client";
import type { CalendarEvent } from "../types/calendar.type";

export const getEvents = async (): Promise<CalendarEvent[]> => {
  const res = await api.get("/calendar-events");
  return res.data;
};

export const createEvent = async (
  event: Omit<CalendarEvent, "_id" | "createdAt">
): Promise<CalendarEvent> => {
  const res = await api.post("/calendar-events", event);
  return res.data;
};
