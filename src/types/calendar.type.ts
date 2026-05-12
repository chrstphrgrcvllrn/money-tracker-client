export type CalendarEventType =
  | "exercise"
  | "ooo"
  | "birthday"
  | "holiday"
  | "leave"
  | "event";

export type CalendarEvent = {
  id: string;
  date: string; // "YYYY-MM-DD"
  type: CalendarEventType;
  title?: string;
  minutes?: number;
  createdAt?: string;
};