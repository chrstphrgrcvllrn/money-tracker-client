// Parses pasted spreadsheet rows (tab- or multi-space separated) into OT entries.
// Columns: Start Date, Start Time, End Date, End Time, Hours Filed.
// Dates may be "5-Sep-26", "9/12/2026", "2026-09-12"; times "HH:mm".
import type { OtEntry } from "./otPay";

const MONTHS: Record<string, number> = {
  jan: 1, feb: 2, mar: 3, apr: 4, may: 5, jun: 6,
  jul: 7, aug: 8, sep: 9, oct: 10, nov: 11, dec: 12,
};

const pad = (n: number) => String(n).padStart(2, "0");

export const parseDate = (raw: string): string | null => {
  const s = raw.trim();

  // 2026-09-12
  let m = s.match(/^(\d{4})-(\d{1,2})-(\d{1,2})$/);
  if (m) return `${m[1]}-${pad(+m[2])}-${pad(+m[3])}`;

  // 9/12/2026 or 9/12/26 (month first)
  m = s.match(/^(\d{1,2})\/(\d{1,2})\/(\d{2}|\d{4})$/);
  if (m) {
    const y = m[3].length === 2 ? 2000 + +m[3] : +m[3];
    return `${y}-${pad(+m[1])}-${pad(+m[2])}`;
  }

  // 5-Sep-26 or 5 Sep 2026
  m = s.match(/^(\d{1,2})[-\s]([A-Za-z]{3})[a-z]*[-\s](\d{2}|\d{4})$/);
  if (m) {
    const month = MONTHS[m[2].toLowerCase()];
    if (!month) return null;
    const y = m[3].length === 2 ? 2000 + +m[3] : +m[3];
    return `${y}-${pad(month)}-${pad(+m[1])}`;
  }

  return null;
};

export const parseTime = (raw: string): string | null => {
  const m = raw.trim().match(/^(\d{1,2}):(\d{2})$/);
  if (!m) return null;
  const h = +m[1];
  const mi = +m[2];
  if (h > 23 || mi > 59) return null;
  return `${pad(h)}:${pad(mi)}`;
};

export type PasteResult = {
  entries: OtEntry[];
  errors: { line: number; message: string }[];
};

export const parsePastedEntries = (text: string, idPrefix = "paste"): PasteResult => {
  const entries: OtEntry[] = [];
  const errors: PasteResult["errors"] = [];

  text.split(/\r?\n/).forEach((rawLine, i) => {
    const line = rawLine.trim();
    if (!line) return;

    const cells = line.split(/\t|\s{2,}/).map((c) => c.trim()).filter((c, idx, arr) => c !== "" || idx < arr.length - 1);
    // A header row ("Start Date ...") is skipped silently.
    if (/start/i.test(cells[0] ?? "") && !parseDate(cells[0] ?? "")) return;

    if (cells.length < 5) {
      errors.push({ line: i + 1, message: "Expected 5 columns: start date, start time, end date, end time, hours" });
      return;
    }

    const [sd, st, ed, et, hoursRaw] = cells;
    const startDate = parseDate(sd);
    const endDate = parseDate(ed);
    const startTime = parseTime(st);
    const endTime = parseTime(et);
    const hours = Number(hoursRaw);

    if (!startDate || !endDate) {
      errors.push({ line: i + 1, message: `Unreadable date: "${!startDate ? sd : ed}"` });
      return;
    }
    if (!startTime || !endTime) {
      errors.push({ line: i + 1, message: `Unreadable time: "${!startTime ? st : et}"` });
      return;
    }
    if (!Number.isFinite(hours) || hours < 0) {
      errors.push({ line: i + 1, message: `Unreadable hours: "${hoursRaw}"` });
      return;
    }

    entries.push({
      id: `${idPrefix}-${i + 1}`,
      start: `${startDate}T${startTime}`,
      end: `${endDate}T${endTime}`,
      hoursFiled: hours,
    });
  });

  return { entries, errors };
};
