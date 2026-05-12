import {
  // useEffect,
  useMemo,
  // useRef,
  useState,
} from "react";

import {
  // getEvents,
  createEvent,
} from "../api/calendar";

import type {
  CalendarEvent,
} from "../types/calendar.type";

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

  const [events, setEvents] = useState<
    CalendarEvent[]
  >([]);

  // MODAL STATE
  const [modalOpen, setModalOpen] =
    useState(false);

  const [selectedDate, setSelectedDate] =
    useState<string>("");

  const [actionType, setActionType] =
    useState<ActionType>("");

  const [inputValue, setInputValue] =
    useState("");

  const [minutes, setMinutes] =
    useState<number | "">("");

  // const currentMonthRef =
  //   useRef<HTMLDivElement | null>(null);

  // useEffect(() => {
  //   getEvents().then(setEvents);
  // }, []);

  const currentYear = today.getFullYear();
  // const currentMonth = today.getMonth();

  const monthNames = [
    "January","February","March","April","May","June",
    "July","August","September","October","November","December",
  ];

  const formatKey = (
    d: number,
    m: number,
    y: number
  ) => `${y}-${m + 1}-${d}`;

  const isToday = (
    d: number,
    m: number,
    y: number
  ) =>
    d === today.getDate() &&
    m === today.getMonth() &&
    y === today.getFullYear();

  // GROUP EVENTS
  const eventMap = useMemo(() => {
    const map: Record<string, CalendarEvent[]> = {};

    events.forEach((e) => {
      if (!map[e.date]) map[e.date] = [];
      map[e.date].push(e);
    });

    return map;
  }, [events]);

  // CREATE EVENT
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

  // OPEN MODAL
  const openModal = (
    d: number,
    m: number,
    y: number
  ) => {
    setSelectedDate(formatKey(d, m, y));
    setActionType("");
    setInputValue("");
    setMinutes("");
    setModalOpen(true);
  };

  // SUBMIT
  const handleSubmit = async () => {
    if (!actionType) return;

    if (actionType === "exercise") {
      await addEvent(
        "exercise",
        selectedDate,
        undefined,
        Number(minutes)
      );
    }

    if (actionType === "ooo") {
      await addEvent(
        "ooo",
        selectedDate,
        inputValue
      );
    }

    if (actionType === "birthday") {
      await addEvent(
        "birthday",
        selectedDate,
        inputValue
      );
    }

    if (actionType === "leave") {
      await addEvent(
        "leave",
        selectedDate,
        inputValue
      );
    }

    if (actionType === "event") {
      await addEvent(
        "event",
        selectedDate,
        inputValue
      );
    }
    if (actionType === "holiday") {
  await addEvent(
    "holiday",
    selectedDate,
    inputValue
  );
}

    setModalOpen(false);
  };

  const generateCalendarDays = (
    month: number,
    year: number
  ) => {
    const firstDay = new Date(year, month, 1).getDay();
    const daysInMonth = new Date(
      year,
      month + 1,
      0
    ).getDate();

    const days: any[] = [];

    for (let i = 0; i < firstDay; i++) {
      days.push(null);
    }

    for (let d = 1; d <= daysInMonth; d++) {
      days.push({
        day: d,
        month,
        year,
      });
    }

    return days;
  };

  return (
    <div className="h-screen max-w-md mx-auto bg-black text-white px-4 pt-4 pb-10 overflow-y-auto">

      {/* TITLE */}
      <h1 className="text-3xl font-bold mb-5">
        {currentYear} Calendar
      </h1>

      {/* MODAL */}
      {modalOpen && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center">
          <div className="bg-[#1C1C1E] p-4 rounded-xl w-72">

            <h2 className="font-bold mb-3">
              Add Event
            </h2>

            {/* RADIO BUTTONS */}
            <div className="flex flex-col gap-2 text-sm">

              {[
                  "exercise",
                  "ooo",
                  "birthday",
                  "leave",
                  "event",
                  "holiday",
                ].map((type, i) => (
                  <label
                    key={`${type}-${i}`}
                    className="flex items-center gap-2"
                  >
                    <input
                      type="radio"
                      name="type"
                      value={type}
                      checked={actionType === type}
                      onChange={() =>
                        setActionType(type as ActionType)
                      }
                    />
                    {type.toUpperCase()}
                  </label>
                ))}
            </div>

            {/* INPUTS */}
            {actionType === "exercise" && (
              <input
                type="number"
                placeholder="Minutes"
                className="mt-3 w-full p-2 bg-black rounded"
                value={minutes}
                onChange={(e) =>
                  setMinutes(
                    Number(e.target.value)
                  )
                }
              />
            )}

            {actionType &&
              actionType !== "exercise" && (
                <input
                  type="text"
                  placeholder="Title / Reason"
                  className="mt-3 w-full p-2 bg-black rounded"
                  value={inputValue}
                  onChange={(e) =>
                    setInputValue(
                      e.target.value
                    )
                  }
                />
              )}

            {/* ACTIONS */}
            <div className="flex justify-between mt-4">
              <button
                onClick={() =>
                  setModalOpen(false)
                }
              >
                Cancel
              </button>

              <button
                onClick={handleSubmit}
                className="text-green-400"
              >
                Save
              </button>
            </div>
          </div>
        </div>
      )}

      {/* GRID */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">

        {Array.from({ length: 12 }).map((_, monthIndex) => {

          const days =
            generateCalendarDays(
              monthIndex,
              currentYear
            );

          return (
            <div
              key={monthIndex}
              className="bg-[#0D0D0D] rounded-xl p-3"
            >

              {/* MONTH TITLE */}
              <div className="text-center font-bold mb-3">
                {monthNames[monthIndex]}
              </div>

              {/* WEEK HEADER */}
              <div className="grid grid-cols-7 gap-1 text-[10px] text-center text-gray-400 mb-1">
                {["S","M","T","W","T","F","S"].map((d, i) => (
                  <div key={`${d}-${i}`}>{d}</div>
                ))}
              </div>

              {/* DAYS */}
              <div className="grid grid-cols-7 gap-1">

                {days.map((d, i) => {

                  if (!d) return <div key={i} />;

                  const key = formatKey(
                    d.day,
                    d.month,
                    d.year
                  );

                  const dayEvents =
                    eventMap[key] || [];

                  const hasExercise =
                    dayEvents.some(e => e.type === "exercise");

                  const hasBirthday =
                    dayEvents.some(e => e.type === "birthday");

                  const hasOOO =
                    dayEvents.some(e => e.type === "ooo");

                  const hasLeave =
                    dayEvents.some(e => e.type === "leave");

                  const hasEvent =
                    dayEvents.some(e => e.type === "event");

                    const hasHoliday =
                    dayEvents.some(e => e.type === "holiday");

                  const isCurrent =
                    isToday(
                      d.day,
                      d.month,
                      d.year
                    );

                  const baseStyle = isCurrent
                    ? "border border-[#EB5647]"
                    : "bg-[#1C1C1E]";

                  return (
                    <div
                      key={key}
                      onClick={() =>
                        openModal(
                          d.day,
                          d.month,
                          d.year
                        )
                      }
                      className={`aspect-square flex flex-col items-center justify-center rounded text-[10px] cursor-pointer ${baseStyle}`}
                    >
                      {/* DAY */}
                      <span>{d.day}</span>

                      {/* DOT INDICATORS */}
                    <div className="flex gap-[2px] mt-1">
                      {hasExercise && (
                        <span className="w-1.5 h-1.5 rounded-full bg-red-500" />
                      )}

                      {hasBirthday && (
                        <span className="w-1.5 h-1.5 rounded-full bg-pink-500" />
                      )}

                      {hasEvent && (
                        <span className="w-1.5 h-1.5 rounded-full bg-purple-500" />
                      )}

                      {hasOOO && (
                        <span className="w-1.5 h-1.5 rounded-full bg-orange-400" />
                      )}

                      {hasLeave && (
                        <span className="w-1.5 h-1.5 rounded-full bg-yellow-400" />
                      )}

                      {hasHoliday && (
                        <span className="w-1.5 h-1.5 rounded-full bg-green-500" />
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
    </div>
  );
};

export default CalendarPage;