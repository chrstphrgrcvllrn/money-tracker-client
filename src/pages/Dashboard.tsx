import { useEffect, useMemo, useState } from "react";
import { ChevronLeftIcon, ChevronRightIcon } from "@heroicons/react/24/solid";
import { getEvents } from "../api/calendar";
import type { CalendarEvent, CalendarEventType } from "../types/calendar.type";
import { useToast } from "../components/useToast";
import { useAuthStore } from "../stores/auth.store";
import { SkeletonBlock, SkeletonRows } from "../components/Skeleton";

const MONTH_NAMES = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];
const WEEKDAYS = ["S", "M", "T", "W", "T", "F", "S"];

const TYPE_LABELS: Record<CalendarEventType, string> = {
  event: "Event",
  birthday: "Birthday",
  exercise: "Exercise",
  leave: "Leave",
  ooo: "OOO",
  holiday: "Holiday",
};

const TYPE_COLORS: Record<CalendarEventType, string> = {
  event: "bg-[var(--accent)]",
  birthday: "bg-[#6CB6FF]",
  exercise: "bg-[var(--negative)]",
  holiday: "bg-[#4FC3B5]",
  leave: "bg-[#F59E4B]",
  ooo: "bg-[var(--danger)]",
};

// Event dates are "YYYY-MM-DD". Build local dates from the parts so the
// day never shifts by a timezone offset.
const toKey = (y: number, m: number, d: number) =>
  `${y}-${String(m + 1).padStart(2, "0")}-${String(d).padStart(2, "0")}`;

const eventKey = (e: CalendarEvent) => e.date.slice(0, 10);

const keyToDate = (key: string) => {
  const [y, m, d] = key.split("-").map(Number);
  return new Date(y, m - 1, d);
};

const eventTitle = (e: CalendarEvent) =>
  e.type === "exercise"
    ? `Exercise${e.minutes ? ` · ${e.minutes} min` : ""}`
    : e.title || TYPE_LABELS[e.type];

function greeting() {
  const h = new Date().getHours();
  if (h < 12) return "Good morning";
  if (h < 18) return "Good afternoon";
  return "Good evening";
}

export default function Dashboard() {
  const showToast = useToast();
  const username = useAuthStore((s) => s.user?.username);

  const today = new Date();
  const todayKey = toKey(today.getFullYear(), today.getMonth(), today.getDate());

  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [loading, setLoading] = useState(true);

  const [viewYear, setViewYear] = useState(today.getFullYear());
  const [viewMonth, setViewMonth] = useState(today.getMonth());
  const [selectedKey, setSelectedKey] = useState(todayKey);

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      try {
        const data = await getEvents();
        if (!cancelled) setEvents(data);
      } catch (error) {
        console.error("Failed to load events:", error);
        showToast("Failed to load events", "error");
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    load();
    return () => {
      cancelled = true;
    };
  }, [showToast]);

  const eventsByKey = useMemo(() => {
    const map: Record<string, CalendarEvent[]> = {};
    events.forEach((e) => {
      const key = eventKey(e);
      (map[key] ??= []).push(e);
    });
    return map;
  }, [events]);

  const upcoming = useMemo(
    () =>
      events
        .filter((e) => eventKey(e) >= todayKey)
        .sort((a, b) => eventKey(a).localeCompare(eventKey(b)))
        .slice(0, 8),
    [events, todayKey]
  );

  const firstWeekday = new Date(viewYear, viewMonth, 1).getDay();
  const daysInMonth = new Date(viewYear, viewMonth + 1, 0).getDate();
  const selectedEvents = eventsByKey[selectedKey] ?? [];

  const shiftMonth = (delta: number) => {
    const d = new Date(viewYear, viewMonth + delta, 1);
    setViewYear(d.getFullYear());
    setViewMonth(d.getMonth());
  };

  return (
    <div className="text-xs max-w-md mx-auto mt-8 px-6 pb-6 bg-[var(--bg-page)] text-[var(--text-primary)]">
      {/* GREETING */}
      <div className="mb-6">
        <p className="text-[var(--text-secondary)] text-sm">{greeting()}{username ? "," : ""}</p>
        <h1 className="text-xl font-semibold">{username ?? "Welcome back"}</h1>
      </div>

      {/* UPCOMING */}
      <section className="bg-[var(--bg-surface)] rounded-xl p-4 mb-4">
        <div className="flex items-center gap-2 mb-3">
          <span className="w-1 h-4 bg-[var(--accent)] rounded-full" />
          <h2 className="font-semibold">Upcoming</h2>
        </div>

        {loading ? (
          <SkeletonRows count={3} withValue={false} divided={false} />
        ) : upcoming.length === 0 ? (
          <p className="text-[var(--text-secondary)] text-sm py-4 text-center">
            Nothing coming up. Add events from the Calendar.
          </p>
        ) : (
          <ul className="space-y-2">
            {upcoming.map((e) => {
              const d = keyToDate(eventKey(e));
              const isToday = eventKey(e) === todayKey;
              return (
                <li key={e._id} className="flex items-stretch gap-3 rounded-lg bg-[var(--bg-page)] p-3">
                  <div className="shrink-0 w-11 text-center">
                    <p className="text-[10px] uppercase text-[var(--text-secondary)]">
                      {d.toLocaleDateString("en-US", { weekday: "short" })}
                    </p>
                    <p className="text-base font-bold">{d.getDate()}</p>
                  </div>
                  <span className={`w-1 shrink-0 rounded-full ${TYPE_COLORS[e.type]}`} />
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium truncate">{eventTitle(e)}</p>
                    <p className="text-[11px] text-[var(--text-secondary)] mt-0.5">
                      {TYPE_LABELS[e.type]}
                      {isToday && " • Today"}
                    </p>
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </section>

      {/* MONTH CALENDAR */}
      <section className="bg-[var(--bg-surface)] rounded-xl p-4">
        <div className="flex items-center justify-between mb-3">
          <button onClick={() => shiftMonth(-1)} aria-label="Previous month" className="p-1 text-[var(--text-secondary)]">
            <ChevronLeftIcon className="w-4 h-4" />
          </button>
          <h2 className="font-semibold">
            {MONTH_NAMES[viewMonth]} {viewYear}
          </h2>
          <button onClick={() => shiftMonth(1)} aria-label="Next month" className="p-1 text-[var(--text-secondary)]">
            <ChevronRightIcon className="w-4 h-4" />
          </button>
        </div>

        {loading ? (
          <SkeletonBlock className="h-48 w-full rounded-lg" />
        ) : (
          <>
            <div className="grid grid-cols-7 gap-1 text-center text-[10px] text-[var(--text-secondary)] mb-1">
              {WEEKDAYS.map((w, i) => (
                <span key={i}>{w}</span>
              ))}
            </div>
            <div className="grid grid-cols-7 gap-1">
              {Array.from({ length: firstWeekday }).map((_, i) => (
                <span key={`b${i}`} />
              ))}
              {Array.from({ length: daysInMonth }).map((_, i) => {
                const day = i + 1;
                const key = toKey(viewYear, viewMonth, day);
                const dayEvents = eventsByKey[key] ?? [];
                const isSelected = key === selectedKey;
                const isToday = key === todayKey;
                return (
                  <button
                    key={key}
                    onClick={() => setSelectedKey(key)}
                    className={`relative aspect-square rounded-lg text-xs flex flex-col items-center justify-center ${
                      isSelected ? "bg-[var(--btn-bg)] text-[var(--btn-text)] font-bold" : ""
                    } ${isToday && !isSelected ? "ring-1 ring-[var(--accent)]" : ""}`}
                  >
                    {day}
                    {dayEvents.length > 0 && (
                      <span
                        className={`absolute bottom-1 h-1 w-1 rounded-full ${
                          isSelected ? "bg-[var(--btn-text)]" : TYPE_COLORS[dayEvents[0].type]
                        }`}
                      />
                    )}
                  </button>
                );
              })}
            </div>

            <div className="mt-4 space-y-2">
              {selectedEvents.length === 0 ? (
                <p className="text-[var(--text-secondary)] text-center py-2">
                  No events on {keyToDate(selectedKey).toLocaleDateString("en-US", { month: "short", day: "numeric" })}.
                </p>
              ) : (
                selectedEvents.map((e) => (
                  <div key={e._id} className="flex items-center gap-3 rounded-lg bg-[var(--bg-page)] p-3">
                    <span className={`w-1 self-stretch rounded-full ${TYPE_COLORS[e.type]}`} />
                    <div className="min-w-0">
                      <p className="text-sm font-medium truncate">{eventTitle(e)}</p>
                      <p className="text-[11px] text-[var(--text-secondary)]">{TYPE_LABELS[e.type]}</p>
                    </div>
                  </div>
                ))
              )}
            </div>
          </>
        )}
      </section>
    </div>
  );
}
