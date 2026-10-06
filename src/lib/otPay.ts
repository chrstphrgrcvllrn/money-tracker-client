// Pure OT / premium-pay calculator (Philippines, monthly-paid employee).
// No database, no UI, no React — everything is driven by its inputs so it
// can be unit-tested directly.

export type DayType = "regular" | "special" | "regular_holiday";
export type Weekday = "Sun" | "Mon" | "Tue" | "Wed" | "Thu" | "Fri" | "Sat";

export type OtSettings = {
  monthlySalary: number; // e.g. 94615.22
  workDaysPerYear: number; // company factor: 261 | 262 | 313 | 365
  restDays: Weekday[]; // e.g. ["Sat", "Sun"]
  taxablePerCutoff: number; // taxable allowances per cutoff (tax estimate only)
};

export type Holiday = { date: string; name: string; type: "regular_holiday" | "special" };

export type OtEntry = {
  id: string;
  start: string; // "YYYY-MM-DDTHH:mm" local wall-clock
  end: string; // may be on the next calendar day
  breakStart?: string;
  breakMinutes?: number;
  hoursFiled: number;
  actualPaid?: number;
  cutoff?: string; // label of the pay cutoff this shift is placed in
  dayType?: DayType; // manual tag; absent = from the holiday table, else regular
};

export type Line = {
  date: string;
  dayType: DayType;
  isRestDay: boolean;
  kind: "REG" | "OT" | "NIGHT";
  hours: number; // hours (not slices) covered by this line
  multiplier: number;
  amount: number; // rounded to 2 decimals
  ranges: string[]; // clock windows this line covers, e.g. "22:00–23:00"
};

export type EntryResult = {
  id: string;
  lines: Line[];
  gross: number;
  workedHours: number;
  breakMinutes: number;
  filedMismatch: boolean; // computed worked hours differ from hoursFiled
};

const SLICE_MIN = 15;
const OT_AFTER_MIN = 8 * 60;

// Multiplier table from the spec. `first` = extra pay on top of salary for
// the first 8 hours; `ot` = OT hours; `full` = full rate used for night diff
// on the first 8 hours.
const MULT: Record<DayType, Record<"rest" | "workday", { first: number; ot: number; full: number }>> = {
  regular: {
    workday: { first: 0, ot: 1.25, full: 1.0 },
    rest: { first: 1.3, ot: 1.69, full: 1.3 },
  },
  special: {
    workday: { first: 0.3, ot: 1.69, full: 1.3 },
    rest: { first: 1.5, ot: 1.95, full: 1.5 },
  },
  regular_holiday: {
    workday: { first: 1.0, ot: 2.6, full: 2.0 },
    rest: { first: 2.6, ot: 3.38, full: 2.6 },
  },
};

const WEEKDAYS: Weekday[] = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

const round2 = (n: number) => Math.round((n + Number.EPSILON) * 100) / 100;

// Parse "YYYY-MM-DDTHH:mm" into minutes on a naive clock (UTC used purely as
// a timezone-free calendar, so DST and the machine's TZ never matter).
const parseLocal = (s: string): number => {
  const [date, time = "00:00"] = s.split("T");
  const [y, mo, d] = date.split("-").map(Number);
  const [h, mi] = time.split(":").map(Number);
  return Date.UTC(y, mo - 1, d, h, mi) / 60000;
};

const dateKeyOf = (minutes: number): string => {
  const d = new Date(minutes * 60000);
  const y = d.getUTCFullYear();
  const m = String(d.getUTCMonth() + 1).padStart(2, "0");
  const day = String(d.getUTCDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
};

const weekdayOf = (minutes: number): Weekday => WEEKDAYS[new Date(minutes * 60000).getUTCDay()];

export const dailyRate = (s: OtSettings) => (s.monthlySalary * 12) / s.workDaysPerYear;
export const hourlyRate = (s: OtSettings) => dailyRate(s) / 8;

// Computes one OT entry line by line, walking it in 15-minute slices.
export const computeEntry = (
  entry: OtEntry,
  settings: OtSettings,
  holidays: Holiday[]
): EntryResult => {
  const start = parseLocal(entry.start);
  const end = parseLocal(entry.end);
  const span = end - start;

  // Default break: 60 min for shifts of 8h or more; placed at the midpoint
  // of the span unless an explicit breakStart is given.
  const breakMinutes = entry.breakMinutes ?? (span >= 8 * 60 ? 60 : 0);
  const breakStart = entry.breakStart
    ? parseLocal(entry.breakStart)
    : start + Math.floor((span - breakMinutes) / 2);
  const breakEnd = breakStart + breakMinutes;

  const holidayByDate = new Map(holidays.map((h) => [h.date, h.type as DayType]));
  const hourly = hourlyRate(settings);

  // Payroll classifies a whole shift by its START date (per the October 2026
  // payslip: the Aug 30 → Aug 31 shift was paid entirely as rest-day OT, with no
  // regular-holiday line). So day type and rest-day status come from the start.
  const shiftDateKey = dateKeyOf(start);
  const shiftDayType: DayType = entry.dayType ?? holidayByDate.get(shiftDateKey) ?? "regular";
  const shiftIsRestDay = settings.restDays.includes(weekdayOf(start));

  // Accumulate hours per (date, dayType, isRest, kind, multiplier).
  const buckets = new Map<string, Line>();
  // Continuous clock segments per bucket, as [startMin, endMin] on the naive clock.
  const segments = new Map<string, [number, number][]>();
  let workedMin = 0;

  for (let t = start; t < end; t += SLICE_MIN) {
    if (t >= breakStart && t < breakEnd) continue;

    const dateKey = dateKeyOf(t);
    const dayType = shiftDayType;
    const isRestDay = shiftIsRestDay;
    const kindOf = workedMin >= OT_AFTER_MIN ? "OT" : "REG";
    const hourOfDay = new Date(t * 60000).getUTCHours();
    const isNight = hourOfDay >= 22 || hourOfDay < 6;

    const mult = MULT[dayType][isRestDay ? "rest" : "workday"];
    const baseMult = kindOf === "OT" ? mult.ot : mult.first;

    const hoursSlice = SLICE_MIN / 60;
    const addTo = (kind: Line["kind"], multiplier: number, hours: number) => {
      const key = `${dateKey}|${dayType}|${isRestDay}|${kind}|${multiplier}`;
      const existing = buckets.get(key);
      if (existing) {
        existing.hours += hours;
      } else {
        buckets.set(key, {
          date: dateKey,
          dayType,
          isRestDay,
          kind,
          hours,
          multiplier,
          amount: 0,
          ranges: [],
        });
      }
      // Extend the last segment when this slice starts where it ends.
      const segs = segments.get(key) ?? [];
      const last = segs[segs.length - 1];
      if (last && last[1] === t) last[1] = t + SLICE_MIN;
      else segs.push([t, t + SLICE_MIN]);
      segments.set(key, segs);
    };

    // Base pay on the slice (only the extra premium over salary is paid).
    if (baseMult > 0) addTo(kindOf, baseMult, hoursSlice);

    // Night differential, 10% of the hourly rate on top of the applicable rate.
    if (isNight) {
      const nightMult = kindOf === "OT" ? mult.ot : mult.full;
      addTo("NIGHT", nightMult, hoursSlice);
    }

    workedMin += SLICE_MIN;
  }

  const clock = (min: number) => {
    const m = min % (24 * 60);
    return `${String(Math.floor(m / 60)).padStart(2, "0")}:${String(m % 60).padStart(2, "0")}`;
  };
  const lines: Line[] = [];
  for (const [key, line] of buckets.entries()) {
    const rate = line.kind === "NIGHT" ? 0.1 : 1;
    const amount = line.hours * hourly * line.multiplier * rate;
    const ranges = (segments.get(key) ?? []).map(([a, b]) => {
      // Midnight at the end of a window reads as 24:00, not 00:00.
      const end = b % (24 * 60) === 0 ? "24:00" : clock(b);
      return `${clock(a)}–${end}`;
    });
    lines.push({ ...line, amount: round2(amount), ranges });
  }
  lines.sort((a, b) => (a.date === b.date ? a.kind.localeCompare(b.kind) : a.date.localeCompare(b.date)));

  const gross = round2(lines.reduce((s, l) => s + l.amount, 0));
  const workedHours = workedMin / 60;
  const filedMismatch = Math.abs(workedHours - entry.hoursFiled) > 0.01;

  return {
    id: entry.id,
    lines,
    gross,
    workedHours,
    breakMinutes,
    filedMismatch,
  };
};

// BIR TRAIN semi-monthly withholding table (2023 onwards).
export const withholdingTax = (taxableCompPerCutoff: number): number => {
  const x = taxableCompPerCutoff;
  if (x <= 10417) return 0;
  if (x <= 16667) return 0.15 * (x - 10417);
  if (x <= 33333) return 937.5 + 0.2 * (x - 16667);
  if (x <= 83333) return 4270.7 + 0.25 * (x - 33333);
  if (x <= 333333) return 16770.7 + 0.3 * (x - 83333);
  return 91770.7 + 0.35 * (x - 333333);
};

// Semi-monthly basic salary (the payslip cutoff amount).
export const cutoffBasic = (s: OtSettings) => s.monthlySalary / 2;

// Estimated net OT = tax(base + allowance + OT) − tax(base + allowance), subtracted from OT gross.
export const estimateNetOt = (otGross: number, s: OtSettings): { net: number; tax: number } => {
  const base = cutoffBasic(s) + s.taxablePerCutoff;
  const tax = withholdingTax(base + otGross) - withholdingTax(base);
  return { net: round2(otGross - tax), tax: round2(tax) };
};

export type CutoffSummary = {
  expectedGross: number;
  estimatedTax: number;
  estimatedNet: number;
  actualPaid: number;
  variance: number; // actualPaid − expectedGross (spec definition); negative = underpaid
};

export const summarizeCutoff = (
  entries: OtEntry[],
  settings: OtSettings,
  holidays: Holiday[]
): { results: EntryResult[]; summary: CutoffSummary } => {
  const results = entries.map((e) => computeEntry(e, settings, holidays));
  const expectedGross = round2(results.reduce((s, r) => s + r.gross, 0));
  const { net, tax } = estimateNetOt(expectedGross, settings);
  const actualPaid = round2(entries.reduce((s, e) => s + (e.actualPaid ?? 0), 0));
  return {
    results,
    summary: {
      expectedGross,
      estimatedTax: tax,
      estimatedNet: net,
      actualPaid,
      variance: round2(actualPaid - expectedGross),
    },
  };
};
