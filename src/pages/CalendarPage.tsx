import { useRef, useEffect, useMemo, useState } from "react";
import { createEvent, getEvents } from "../api/calendar";
import type { CalendarEvent } from "../types/calendar.type";

type ActionType =
  | "exercise"
  | "ooo"
  | "birthday"
  | "leave"
  | "event"
  | "holiday"
  | "";

const CalendarPage: React.FC = () => {
  const today = new Date();

  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [modalOpen, setModalOpen] = useState(false);
  const [listModalOpen, setListModalOpen] = useState(false);

  const [selectedDate, setSelectedDate] = useState("");
  const [actionType, setActionType] = useState<ActionType>("");
  const [inputValue, setInputValue] = useState("");
  const [minutes, setMinutes] = useState<number | "">("");
  const monthRefs = useRef<(HTMLDivElement | null)[]>([]);

  const [tab, setTab] = useState<"upcoming" | "past">("upcoming");

  const currentYear = today.getFullYear();

  const monthNames = [
    "January","February","March","April","May","June",
    "July","August","September","October","November","December",
  ];

  // =========================
  // HELPERS
  // =========================
  const formatKey = (d: number, m: number, y: number) =>
    `${y}-${String(m + 1).padStart(2, "0")}-${String(d).padStart(2, "0")}`;

  const normalizeDate = (date: string) => {
    const d = new Date(date);
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(
      d.getDate()
    ).padStart(2, "0")}`;
  };

  const getDayTime = (date: string) => {
    const d = new Date(date);
    return new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime();
  };

  const todayTime = new Date(
    today.getFullYear(),
    today.getMonth(),
    today.getDate()
  ).getTime();

  const isToday = (d: number, m: number, y: number) =>
    d === today.getDate() &&
    m === today.getMonth() &&
    y === today.getFullYear();

  // =========================
  // LOAD EVENTS
  // =========================
  useEffect(() => {
    const load = async () => {
      const data = await getEvents();
      setEvents(data);
    };
    load();
  }, []);

  // =========================
  // GROUP EVENTS (CALENDAR)
  // =========================
  const eventMap = useMemo(() => {
    const map: Record<string, CalendarEvent[]> = {};

    events.forEach((e) => {
      const key = normalizeDate(e.date);
      if (!map[key]) map[key] = [];
      map[key].push(e);
    });

    return map;
  }, [events]);

  // =========================
  // SORT EVENTS
  // =========================
  const sortedEvents = [...events].sort(
    (a, b) => getDayTime(a.date) - getDayTime(b.date)
  );

  const upcomingEvents = sortedEvents.filter(
    (e) => getDayTime(e.date) >= todayTime
  );

  const pastEvents = sortedEvents.filter(
    (e) => getDayTime(e.date) < todayTime
  );

  // =========================
  // GROUP EVENTS (MODAL)
  // =========================
  const groupedEvents = useMemo(() => {
    const grouped: Record<string, CalendarEvent[]> = {};

    const list = tab === "upcoming" ? upcomingEvents : pastEvents;

    list.forEach((e) => {
      const d = new Date(e.date);
      const key = `${monthNames[d.getMonth()]} ${d.getFullYear()}`;

      if (!grouped[key]) grouped[key] = [];
      grouped[key].push(e);
    });

    return grouped;
  }, [tab, events]);

  // =========================
  // CREATE EVENT
  // =========================
  const addEvent = async (
    type: CalendarEvent["type"],
    date: string,
    title?: string,
    minutes?: number
  ) => {
    const newEvent = await createEvent({
      type,
      date,
      title,
      minutes,
    });

    setEvents((prev) => [...prev, newEvent]);
  };

  // =========================
  // CALENDAR DAYS
  // =========================
  const generateCalendarDays = (month: number, year: number) => {
    const firstDay = new Date(year, month, 1).getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();

    const days: any[] = [];

    for (let i = 0; i < firstDay; i++) days.push(null);

    for (let d = 1; d <= daysInMonth; d++) {
      days.push({ day: d, month, year });
    }

    return days;
  };

  // =========================
  // MODAL HANDLER
  // =========================
  const openModal = (d: number, m: number, y: number) => {
    setSelectedDate(formatKey(d, m, y));
    setActionType("");
    setInputValue("");
    setMinutes("");
    setModalOpen(true);
  };

  const handleSubmit = async () => {
    if (!actionType) return;

    await addEvent(
      actionType as CalendarEvent["type"],
      selectedDate,
      actionType === "exercise" ? undefined : inputValue,
      actionType === "exercise" ? Number(minutes) : undefined
    );

    setModalOpen(false);
  };

  const typeDotColorMap: Record<string, string> = {
  birthday: "bg-[#A1B4F2]",
  event: "bg-[#555BCA]",
  ooo: "bg-[#EF6C54]",
  holiday: "bg-[#85D989]",
  exercise: "bg-[#B2597C]",
  leave: "bg-[#DFF966]",
};

  // =========================
  // COLORS
  // =========================
const typeColorMap: Record<string, string> = {
  birthday: "border-[#A1B4F2]",
  event: "border-[#555BCA]",
  ooo: "border-[#EF6C54]",
  holiday: "border-[#DFF966]",
  exercise: "border-[#B2597C]",
  leave: "border-[#DFF966]",
};

useEffect(() => {
  const currentMonth = today.getMonth();

  monthRefs.current[currentMonth]?.scrollIntoView({
    behavior: "smooth",
    block: "start",
  });
}, []);


  // =========================
  // UI
  // =========================
  return (
    <div className="h-screen max-w-md mx-auto bg-black text-white px-4 pt-4 pb-10 overflow-y-auto">

      <h1 className="text-3xl font-bold mb-5">
        {currentYear} Calendar
      </h1>

      {/* FLOAT BUTTON */}
      <button
        onClick={() => setListModalOpen(true)}
        className="fixed top-6 right-6  bg-[#DFF966] text-black px-4 py-2 rounded-full text-sm font-semibold z-50"
          // className="px-[0.7rem] py-[0.3rem]  bg-[#DFF966] text-black font-bold   rounded-4xl text-sm"
      >
        View Events
      </button>

      {/* =========================
          EVENTS MODAL
      ========================= */}
      {listModalOpen && (
        <div className="fixed inset-0 bg-black/30 backdrop-blur-xl flex items-center justify-center z-[9999]">
          <div className="bg-[#1C1C1E] w-[90%] max-w-md rounded-xl p-4 max-h-[80vh] overflow-y-auto">

            {/* HEADER */}
            <div className="flex justify-between items-center mb-3">
              <h2 className="font-bold text-lg">Events</h2>
              <button
                onClick={() => setListModalOpen(false)}
                className="text-gray-400 text-sm"
              >
                Close
              </button>
            </div>

            {/* TABS */}
            <div className="flex gap-2 mb-4">
              <button
                onClick={() => setTab("upcoming")}
                className={`px-3 py-1 rounded text-xs ${
                  tab === "upcoming"
                    ? "bg-[#DFF966] text-black"
                    : "bg-black text-gray-400"
                }`}
              >
                Upcoming
              </button>

              <button
                onClick={() => setTab("past")}
                className={`px-3 py-1 rounded text-xs ${
                  tab === "past"
                    ? "bg-white text-black"
                    : "bg-black text-gray-400"
                }`}
              >
                Past
              </button>
            </div>

            {/* LIST */}
            {Object.entries(groupedEvents).map(([monthLabel, items]) => (
              <div key={monthLabel} className="mb-6">

                {/* MONTH SEPARATOR */}
                <div className="sticky top-0 bg-[#1C1C1E] py-2 mb-3 border-b border-white/10">
                  <div className="text-xs uppercase tracking-widest text-gray-400">
                    {monthLabel}
                  </div>
                </div>

                {/* EVENTS */}
                <div className="space-y-2">
                  {items.map((e) => {
                    const isPast = getDayTime(e.date) < todayTime;
                    const color =
                      typeColorMap[e.type] || "bg-gray-500 border-gray-500";

                    return (
                      <div
                        key={`${e.date}-${e.type}-${e.title}`}
                        className={`p-3 rounded bg-black border-l-4 ${color} ${
                          isPast ? "opacity-40" : ""
                        }`}
                      >
                        <div className="text-sm font-medium">
                          {e.title || "No title"}
                        </div>

                        <div className="text-[11px] text-gray-400 mt-1">
                          {e.type.toUpperCase()} •{" "}
                          {new Date(e.date).toLocaleDateString("en-US", {
                        month: "long",
                        day: "numeric",
                        year: "numeric",
                      })}
                        </div>
                      </div>
                    );
                  })}
                </div>

              </div>
            ))}
          </div>
        </div>
      )}


      {/* =========================
          CALENDAR GRID
      ========================= */}
     <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
  {Array.from({ length: 12 }).map((_, monthIndex) => {
    const days = generateCalendarDays(monthIndex, currentYear);

    return (
    <div
  key={monthIndex}
ref={(el) => {
  monthRefs.current[monthIndex] = el;
}}
  className="bg-[#0D0D0D] rounded-xl p-3"

      >

        {/* MONTH TITLE */}
        <div className="text-center font-bold mb-3">
          {monthNames[monthIndex]}
        </div>

        {/* WEEK HEADER */}
        <div className="grid grid-cols-7 gap-1 text-[10px] text-center text-gray-400 mb-1">
          {["S", "M", "T", "W", "T", "F", "S"].map((d, i) => (
            <div key={i}>{d}</div>
          ))}
        </div>

        {/* DAYS */}
        <div className="grid grid-cols-7 gap-1">
          {days.map((d, i) => {
            if (!d) return <div key={i} />;

            const key = formatKey(d.day, d.month, d.year);
            const isCurrent = isToday(d.day, d.month, d.year);
            const dayEvents = eventMap[key] || [];

            return (
              <div
                key={key}
                onClick={() => openModal(d.day, d.month, d.year)}
                className={`aspect-square flex flex-col items-center justify-center rounded text-[10px] cursor-pointer transition ${
                  isCurrent
                    ? "border border-red-500"
                    : "bg-[#1C1C1E]"
                }`}
              >

                {/* DAY NUMBER */}
                <span>{d.day}</span>

                {/* DOTS */}
                <div className="flex gap-[2px] mt-1">
                  {dayEvents.slice(0, 3).map((e, idx) => (
                    <span
                      key={idx}
                      className={`w-1.5 h-1.5 rounded-full ${
                        typeDotColorMap[e.type] || "bg-gray-500"
                      }`}
                    />
                  ))}

                  {/* + indicator if more than 3 events */}
                  {dayEvents.length > 3 && (
                    <span className="text-[8px] text-gray-400 ml-1">
                      +{dayEvents.length - 3}
                    </span>
                  )}
                </div>

              </div>
            );
          })}
        </div>

      </div>
    );
  })}
</div>

      {/* =========================
          CREATE EVENT MODAL
      ========================= */}
      {modalOpen && (
<div className="fixed inset-0 bg-black/30 backdrop-blur-xl flex items-center justify-center z-[9999]">
    <div className="bg-[#1C1C1E] p-4 rounded-xl w-[90%] max-w-sm relative">

      {/* CLOSE BUTTON */}
      <button
        onClick={() => setModalOpen(false)}
        className="absolute top-3 right-3 text-gray-400 text-sm hover:text-white"
      >
        ✕
      </button>

      <h2 className="text-sm mb-3">Create Event</h2>

      {/* TYPE SELECT */}
      <select
        className="w-full mb-2 p-2 bg-black rounded"
        value={actionType}
        onChange={(e) => setActionType(e.target.value as ActionType)}
      >
        <option value="">Select type</option>
        <option value="event">Event</option>
        <option value="birthday">Birthday</option>
        <option value="exercise">Exercise</option>
        <option value="leave">Leave</option>
        <option value="ooo">OOO</option>
        <option value="holiday">Holiday</option>
      </select>

      {/* TITLE INPUT */}
      {actionType !== "exercise" && (
        <input
          className="w-full mb-2 p-2 bg-black rounded"
          placeholder="Title"
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
        />
      )}

      {/* MINUTES INPUT */}
      {actionType === "exercise" && (
        <input
          type="number"
          className="w-full mb-2 p-2 bg-black rounded"
          placeholder="Minutes"
          value={minutes}
          onChange={(e) => setMinutes(Number(e.target.value))}
        />
      )}

      {/* SAVE BUTTON */}
      <button
        onClick={handleSubmit}
        className="w-full bg-[#DFF966] text-black py-2 rounded"
      >
        Save
      </button>

    </div>
  </div>
)}

    </div>
  );
};

export default CalendarPage;