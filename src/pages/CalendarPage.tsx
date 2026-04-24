import { useEffect, useState } from "react";
import { getExercise, addExercise } from "../api/exercise";

type ExerciseData = {
  [key: string]: number; // "YYYY-MM-DD": minutes
};

const CalendarPage: React.FC = () => {
  const today = new Date();

  const [currentDate, setCurrentDate] = useState(today);
  const [exerciseData, setExerciseData] = useState<ExerciseData>({});

  // Load exercise data
  useEffect(() => {
    getExercise().then((data) => {
      const mapped: ExerciseData = {};

      data.forEach((item: any) => {
        mapped[item.date] = item.minutes;
      });

      setExerciseData(mapped);
    });
  }, []);

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();

  const firstDayOfMonth = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();

  const days: { day: number; month: number; year: number; currentMonth: boolean }[] = [];

  // Previous month
  const prevMonth = month - 1 < 0 ? 11 : month - 1;
  const prevYear = month - 1 < 0 ? year - 1 : year;
  const prevMonthLastDate = new Date(year, month, 0).getDate();

  for (let i = firstDayOfMonth - 1; i >= 0; i--) {
    days.push({
      day: prevMonthLastDate - i,
      month: prevMonth,
      year: prevYear,
      currentMonth: false,
    });
  }

  // Current month
  for (let d = 1; d <= daysInMonth; d++) {
    days.push({ day: d, month, year, currentMonth: true });
  }

  // Next month
  const nextMonth = month + 1 > 11 ? 0 : month + 1;
  const nextYear = month + 1 > 11 ? year + 1 : year;

  let nextDayCounter = 1;
  while (days.length % 7 !== 0) {
    days.push({
      day: nextDayCounter++,
      month: nextMonth,
      year: nextYear,
      currentMonth: false,
    });
  }

  const formatKey = (day: number, month: number, year: number) =>
    `${year}-${month + 1}-${day}`;

  const isToday = (day: number, month: number, year: number) =>
    day === today.getDate() &&
    month === today.getMonth() &&
    year === today.getFullYear();

  const handleAddMinutes = async (day: number, month: number, year: number) => {
    const key = formatKey(day, month, year);

    const input = prompt("Enter minutes:");
    if (!input) return;

    const minutes = parseInt(input);
    if (isNaN(minutes)) return;

    const updated = await addExercise(key, minutes);
    setExerciseData((prev) => ({
      ...prev,
      [key]: updated.minutes,
    }));
  };

  const changeMonth = (offset: number) => {
    setCurrentDate(new Date(year, month + offset, 1));
  };

  const monthNames = [
    "January","February","March","April","May","June",
    "July","August","September","October","November","December",
  ];

  const weekDays = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

  // ✅ Total run days
  const totalRunDays = Object.values(exerciseData).filter((m) => m > 0).length;

  // ✅ Today minutes
  const todayKey = formatKey(
    today.getDate(),
    today.getMonth(),
    today.getFullYear()
  );
  const todayMinutes = exerciseData[todayKey] || 0;

  return (
    <div className="h-screen max-w-md mx-auto bg-[#111111] flex flex-col px-4 pt-4 pb-4 text-white">

      {/* HEADER */}
      <div className="flex items-center justify-between mb-3">
        <button
          onClick={() => changeMonth(-1)}
          className="bg-[#1d1d1d] px-3 py-1 rounded-xl text-sm"
        >
          ◀
        </button>

        <h1 className="text-lg font-bold">
          {monthNames[month]} {year}
        </h1>

        <button
          onClick={() => changeMonth(1)}
          className="bg-[#1d1d1d] px-3 py-1 rounded-xl text-sm"
        >
          ▶
        </button>
      </div>

      {/* WEEK DAYS */}
      <div className="grid grid-cols-7 gap-1 mb-1 text-center text-xs">
        {weekDays.map((day, i) => (
          <div
            key={day}
            className={i === 0 || i === 6 ? "text-red-500" : "text-gray-400"}
          >
            {day}
          </div>
        ))}
      </div>

      {/* CALENDAR GRID */}
      <div className="grid grid-cols-7 gap-1">
        {days.map((d, index) => {
          const { day, month, year, currentMonth } = d;
          const key = formatKey(day, month, year);
          const minutes = exerciseData[key] || 0;

          const isCurrent = currentMonth && isToday(day, month, year);
          const dayOfWeek = index % 7;
          const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;

          const bgClass = minutes > 0
            ? "bg-[#BCFF5E] text-black"
            : isCurrent
            ? "bg-[#1d1d1d] border-2 border-[#BCFF5E]"
            : !currentMonth
            ? "bg-[#1d1d1d] text-gray-500"
            : "bg-[#1d1d1d] " + (isWeekend ? "text-gray-500" : "text-white");

          return (
            <div
              key={index}
              onClick={() =>
                currentMonth && handleAddMinutes(day, month, year)
              }
              className={`aspect-square p-0.5 flex flex-col justify-between items-center rounded-md text-[10px] font-semibold cursor-pointer ${bgClass}`}
            >
              <span className="text-sm">{day}</span>
              {minutes > 0 && (
                <span className="text-[9px] font-bold">{minutes}m</span>
              )}
            </div>
          );
        })}
      </div>

      {/* RUN PROGRESS */}
      {totalRunDays > 0 && (
        <div className="mt-3 p-3 rounded-xl bg-[#1d1d1d] text-center">

          <h2 className="text-3xl font-bold text-[#BCFF5E]">
            Day {totalRunDays} Complete 🏃
          </h2>

          <p className="text-xs text-gray-400 mt-1">
            Keep the streak going
          </p>

          {todayMinutes > 0 && (
            <p className="text-sm mt-2 text-white">
              You&apos;ve finished{" "}
              <span className="text-[#BCFF5E] font-bold">
                {todayMinutes}
              </span>{" "}
              minutes today! Good job!
            </p>
          )}

        </div>
      )}

    </div>
  );
};

export default CalendarPage;