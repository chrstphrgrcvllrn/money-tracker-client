import type { CalendarEvent } from "../types/calendar.type";

const API_URL =
  import.meta.env.PROD
    ? `${import.meta.env.VITE_PROD_API_URL}/api/calendar-events`
    : `${import.meta.env.VITE_DEV_API_URL}/api/calendar-events`;

// GET all events
export const getEvents = async (): Promise<
  CalendarEvent[]
> => {
  const res = await fetch(API_URL);
  return res.json();
};

// CREATE event
export const createEvent = async (
  event: Omit<CalendarEvent, "id">
): Promise<CalendarEvent> => {
  const res = await fetch(API_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(event),
  });

  return res.json();
};