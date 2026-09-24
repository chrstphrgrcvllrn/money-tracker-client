import { useEffect, useMemo, useState } from "react";
import {
  ChevronLeftIcon,
  ChevronRightIcon,
  PaperAirplaneIcon,
} from "@heroicons/react/24/solid";
import Modal from "./Modal";
import SlidingTabs from "./SlidingTabs";
import { SkeletonBlock } from "./Skeleton";
import { useToast } from "./useToast";
import { createEvent, getEvents } from "../api/calendar";
import type { CalendarEvent, CalendarEventType } from "../types/calendar.type";

type Tab = "month" | "upcoming" | "past";

const MONTH_NAMES = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];

const WEEKDAYS = ["S", "M", "T", "W", "T", "F", "S"];

const EVENT_TYPES: { value: CalendarEventType; label: string }[] = [
  { value: "event", label: "Event" },
  { value: "birthday", label: "Birthday" },
  { value: "exercise", label: "Exercise" },
  { value: "leave", label: "Leave" },
  { value: "ooo", label: "OOO" },
  { value: "holiday", label: "Holiday" },
];

const TYPE_LABELS = Object.fromEntries(
  EVENT_TYPES.map((t) => [t.value, t.label])
) as Record<CalendarEventType, string>;

// Full class strings so Tailwind can see them.
const TYPE_COLORS: Record<CalendarEventType, string> = {
  event: "bg-[var(--accent)]",
  birthday: "bg-[#6CB6FF]",
  exercise: "bg-[var(--negative)]",
  holiday: "bg-[#4FC3B5]",
  leave: "bg-[#F59E4B]",
  ooo: "bg-[var(--danger)]",
};

const INPUT_CLASS =
  "bg-[var(--bg-input)] px-4 py-2.5 rounded-full text-sm text-[var(--text-primary)] border border-[var(--border-strong)] focus:border-[var(--accent)]/50 outline-none";

// Events are stored as "YYYY-MM-DD" strings. Work with those keys (and build
// local dates from their parts) instead of `new Date("YYYY-MM-DD")`, which
// parses as UTC and can land on the previous day in western timezones.
const toKey = (y: number, m: number, d: number) =>
  `${y}-${String(m + 1).padStart(2, "0")}-${String(d).padStart(2, "0")}`;

const eventKey = (e: CalendarEvent) => e.date.slice(0, 10);

const keyToDate = (key: string) => {
  const [y, m, d] = key.split("-").map(Number);
  return new Date(y, m - 1, d);
};

const formatLongDate = (key: string) =>
  keyToDate(key).toLocaleDateString("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
  });

const formatShortDate = (key: string) =>
  keyToDate(key).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });

const eventTitle = (e: CalendarEvent) =>
  e.type === "exercise"
    ? `Exercise${e.minutes ? ` · ${e.minutes} min` : ""}`
    : e.title || TYPE_LABELS[e.type];

function EventRow({ event, showDate = false }: { event: CalendarEvent; showDate?: boolean }) {
  return (
    <div className="flex items-stretch gap-3 rounded-xl bg-[var(--bg-page)] p-3">
      <span className={`w-1 shrink-0 rounded-full ${TYPE_COLORS[event.type]}`} />
      <div className="min-w-0">
        <p className="text-sm font-medium text-[var(--text-primary)] truncate">
          {eventTitle(event)}
        </p>
        <p className="text-[11px] text-[var(--text-secondary)] mt-0.5">
          {TYPE_LABELS[event.type]}
          {showDate && ` • ${formatShortDate(eventKey(event))}`}
        </p>
      </div>
    </div>
  );
}

function CalendarBody() {
  const showToast = useToast();

  const today = new Date();
  const todayKey = toKey(today.getFullYear(), today.getMonth(), today.getDate());

  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<Tab>("month");

  const [viewYear, setViewYear] = useState(today.getFullYear());
  const [viewMonth, setViewMonth] = useState(today.getMonth());
  const [selectedKey, setSelectedKey] = useState(todayKey);

  const [newType, setNewType] = useState<CalendarEventType>("event");
  const [newTitle, setNewTitle] = useState("");
  const [newMinutes, setNewMinutes] = useState("");
  const [saving, setSaving] = useState(false);

  // =========================
  // LOAD
  // =========================
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

  // =========================
  // DERIVED
  // =========================
  const eventsByKey = useMemo(() => {
    const map: Record<string, CalendarEvent[]> = {};
    events.forEach((e) => {
      const key = eventKey(e);
      if (!map[key]) map[key] = [];
      map[key].push(e);
    });
    return map;
  }, [events]);

  const groupByMonth = (list: CalendarEvent[]) => {
    const groups = new Map<string, CalendarEvent[]>();
    list.forEach((e) => {
      const [y, m] = eventKey(e).split("-").map(Number);
      const label = `${MONTH_NAMES[m - 1]} ${y}`;
      groups.set(label, [...(groups.get(label) ?? []), e]);
    });
    return [...groups.entries()];
  };

  const upcomingGroups = useMemo(
    () =>
      groupByMonth(
        events
          .filter((e) => eventKey(e) >= todayKey)
          .sort((a, b) => eventKey(a).localeCompare(eventKey(b)))
      ),
    [events, todayKey]
  );

  const pastGroups = useMemo(
    () =>
      groupByMonth(
        events
          .filter((e) => eventKey(e) < todayKey)
          .sort((a, b) => eventKey(b).localeCompare(eventKey(a)))
      ),
    [events, todayKey]
  );

  const firstWeekday = new Date(viewYear, viewMonth, 1).getDay();
  const daysInMonth = new Date(viewYear, viewMonth + 1, 0).getDate();
  const selectedEvents = eventsByKey[selectedKey] ?? [];

  // =========================
  // HANDLERS
  // =========================
  const shiftMonth = (delta: number) => {
    const d = new Date(viewYear, viewMonth + delta, 1);
    setViewYear(d.getFullYear());
    setViewMonth(d.getMonth());
  };

  const goToToday = () => {
    setViewYear(today.getFullYear());
    setViewMonth(today.getMonth());
    setSelectedKey(todayKey);
  };

  const isExercise = newType === "exercise";
  const canSave = !saving && (!isExercise || Number(newMinutes) > 0);

  const handleAdd = async () => {
    if (!canSave) return;

    setSaving(true);
    try {
      const created = await createEvent({
        type: newType,
        date: selectedKey,
        title: isExercise ? undefined : newTitle.trim() || undefined,
        minutes: isExercise ? Number(newMinutes) : undefined,
      });
      setEvents((prev) => [...prev, created]);
      setNewTitle("");
      setNewMinutes("");
      showToast("Event added!", "success");
    } catch (error) {
      console.error("Failed to add event:", error);
      showToast("Failed to add event", "error");
    } finally {
      setSaving(false);
    }
  };

  // =========================
  // RENDER
  // =========================
  if (loading) {
    return (
      <div className="space-y-3">
        <SkeletonBlock className="h-8 w-full" />
        <SkeletonBlock className="h-56 w-full rounded-xl" />
        <SkeletonBlock className="h-14 w-full rounded-xl" />
      </div>
    );
  }

  const renderAgenda = (groups: [string, CalendarEvent[]][], emptyText: string) =>
    groups.length === 0 ? (
      <p className="text-center text-sm text-[var(--text-secondary)] py-6">{emptyText}</p>
    ) : (
      <div className="space-y-4">
        {groups.map(([label, items]) => (
          <div key={label}>
            <div className="text-[10px] uppercase tracking-widest text-[var(--text-secondary)] mb-2">
              {label}
            </div>
            <div className="space-y-2">
              {items.map((e) => (
                <EventRow key={e._id} event={e} showDate />
              ))}
            </div>
          </div>
        ))}
      </div>
    );

  return (
    <div className="space-y-4">
      <SlidingTabs
        tabs={[
          { value: "month", label: "Month" },
          { value: "upcoming", label: "Upcoming" },
          { value: "past", label: "Past" },
        ]}
        active={tab}
        onChange={setTab}
      />

      {tab === "upcoming" && renderAgenda(upcomingGroups, "No upcoming events")}
      {tab === "past" && renderAgenda(pastGroups, "No past events")}

      {tab === "month" && (
        <>
          {/* MONTH NAV */}
          <div className="flex items-center justify-between">
            <button
              onClick={() => shiftMonth(-1)}
              aria-label="Previous month"
              className="w-9 h-9 rounded-full flex items-center justify-center text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-input)]"
            >
              <ChevronLeftIcon className="w-4 h-4" />
            </button>

            <div className="flex items-center gap-2">
              <h3 className="font-semibold text-[var(--text-primary)]">
                {MONTH_NAMES[viewMonth]} {viewYear}
              </h3>
              <button
                onClick={goToToday}
                className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-[var(--accent-soft)] text-[var(--accent)]"
              >
                Today
              </button>
            </div>

            <button
              onClick={() => shiftMonth(1)}
              aria-label="Next month"
              className="w-9 h-9 rounded-full flex items-center justify-center text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-input)]"
            >
              <ChevronRightIcon className="w-4 h-4" />
            </button>
          </div>

          {/* GRID */}
          <div>
            <div className="grid grid-cols-7 text-[10px] text-center text-[var(--text-secondary)] mb-1">
              {WEEKDAYS.map((d, i) => (
                <div key={i}>{d}</div>
              ))}
            </div>

            <div className="grid grid-cols-7 gap-y-1">
              {Array.from({ length: firstWeekday }).map((_, i) => (
                <div key={`blank-${i}`} />
              ))}

              {Array.from({ length: daysInMonth }).map((_, i) => {
                const day = i + 1;
                const key = toKey(viewYear, viewMonth, day);
                const isToday = key === todayKey;
                const isSelected = key === selectedKey;
                const dayEvents = eventsByKey[key] ?? [];

                return (
                  <button
                    key={key}
                    onClick={() => setSelectedKey(key)}
                    aria-label={formatLongDate(key)}
                    aria-pressed={isSelected}
                    className="flex flex-col items-center gap-0.5 py-0.5"
                  >
                    <span
                      className={`w-8 h-8 rounded-full flex items-center justify-center text-sm ${
                        isToday
                          ? "bg-[var(--accent)] text-[var(--accent-ink)] font-bold"
                          : isSelected
                          ? "bg-[var(--accent-soft)] text-[var(--accent)] font-semibold"
                          : "text-[var(--text-primary)]"
                      }`}
                    >
                      {day}
                    </span>

                    <span className="flex h-1.5 gap-[2px]">
                      {dayEvents.slice(0, 3).map((e) => (
                        <span
                          key={e._id}
                          className={`w-1.5 h-1.5 rounded-full ${TYPE_COLORS[e.type]}`}
                        />
                      ))}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* SELECTED DAY */}
          <div className="space-y-2">
            <h4 className="text-sm font-semibold text-[var(--text-primary)]">
              {selectedKey === todayKey ? "Today" : formatLongDate(selectedKey)}
              {selectedKey === todayKey && (
                <span className="ml-2 text-xs font-normal text-[var(--text-secondary)]">
                  {formatLongDate(selectedKey)}
                </span>
              )}
            </h4>

            {selectedEvents.length === 0 ? (
              <p className="text-sm text-[var(--text-secondary)] py-1">No events</p>
            ) : (
              selectedEvents.map((e) => <EventRow key={e._id} event={e} />)
            )}
          </div>

          {/* COMPOSER */}
          <div className="flex items-center gap-2">
            <select
              value={newType}
              onChange={(e) => setNewType(e.target.value as CalendarEventType)}
              aria-label="Event type"
              className={`shrink-0 ${INPUT_CLASS}`}
            >
              {EVENT_TYPES.map((t) => (
                <option key={t.value} value={t.value}>
                  {t.label}
                </option>
              ))}
            </select>

            {isExercise ? (
              <input
                type="number"
                inputMode="numeric"
                value={newMinutes}
                onChange={(e) => setNewMinutes(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") handleAdd();
                }}
                placeholder="Minutes"
                className={`flex-1 min-w-0 ${INPUT_CLASS}`}
              />
            ) : (
              <input
                value={newTitle}
                onChange={(e) => setNewTitle(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") handleAdd();
                }}
                placeholder="Title"
                className={`flex-1 min-w-0 ${INPUT_CLASS}`}
              />
            )}

            <button
              onClick={handleAdd}
              disabled={!canSave}
              aria-label="Add event"
              className="shrink-0 w-10 h-10 rounded-full flex items-center justify-center bg-[var(--btn-bg)] text-[var(--btn-text)] disabled:opacity-40"
            >
              <PaperAirplaneIcon className="w-4 h-4" />
            </button>
          </div>
        </>
      )}
    </div>
  );
}

interface CalendarModalProps {
  open: boolean;
  onClose: () => void;
}

// The body is only mounted while the modal is open, so each open starts on
// today's month with a fresh fetch.
export default function CalendarModal({ open, onClose }: CalendarModalProps) {
  return (
    <Modal open={open} onClose={onClose} title="Calendar" maxWidth="max-w-md">
      <CalendarBody />
    </Modal>
  );
}
