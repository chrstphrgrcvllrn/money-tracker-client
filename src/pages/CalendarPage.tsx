import { useEffect, useState } from "react";
import { getExercise, addExercise } from "../api/exercise";

type ExerciseData = {
  [key: string]: number; // "YYYY-MM-DD": minutes
};

type RunEntry = { date: string; minutes: number };

const CalendarPage: React.FC = () => {
  const today = new Date();

  const [currentDate, setCurrentDate] = useState(today);
  const [exerciseData, setExerciseData] = useState<ExerciseData>({});
  const [recentRuns, setRecentRuns] = useState<RunEntry[]>([]);

  // Load exercise data
  useEffect(() => {
    getExercise().then((data) => {
      const mapped: ExerciseData = {};
      const runs: RunEntry[] = [];

      data.forEach((item: any) => {
        mapped[item.date] = item.minutes;
        if (item.minutes > 0) runs.push({ date: item.date, minutes: item.minutes });
      });

      runs.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

      setExerciseData(mapped);
      setRecentRuns(runs);
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
    const updatedData = { ...exerciseData, [key]: updated.minutes };
    setExerciseData(updatedData);

    // Update recent runs
    const newRuns = recentRuns.filter((r) => r.date !== key);
    newRuns.unshift({ date: key, minutes: updated.minutes });
    setRecentRuns(newRuns);
  };

  const changeMonth = (offset: number) => {
    setCurrentDate(new Date(year, month + offset, 1));
  };

  const monthNames = [
    "January","February","March","April","May","June",
    "July","August","September","October","November","December",
  ];

  const weekDays = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

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
              onClick={() => currentMonth && handleAddMinutes(day, month, year)}
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

{/* RECENT RUNS */}
{recentRuns.length > 0 && (
  <div className="mt-2 p-2 rounded-xl text-sm flex-1 flex flex-col overflow-y-auto">
    <h2 className="font-bold mb-1">Recent Runs:</h2>
    <ul className="space-y-1 flex-1 overflow-y-auto">
      {recentRuns.map((run) => {
        // Convert date string to formatted version
        const [year, month, day] = run.date.split("-").map(Number);
        const dateObj = new Date(year, month - 1, day);
        const formattedDate = `${dateObj.toLocaleString("en-US", { month: "short" })} ${dateObj.getDate()} ${year}`;

        return (
          <li key={run.date} className="flex justify-between items-center px-2 py-2 bg-[#1d1d1d] rounded-lg">
            <span className="flex items-center gap-2">
              {/* Circle icon like logo */}
              <span className="w-8 h-8 rounded-full border border-[#BCFF5E] flex items-center justify-center text-black">
                🏃
              </span>
              <span>{formattedDate}</span>
            </span>
            <span className="font-bold  text-[#BCFF5E]">{run.minutes} min</span>
          </li>
        );
      })}
    </ul>
  </div>
)}
    </div>
  );
};

export default CalendarPage;