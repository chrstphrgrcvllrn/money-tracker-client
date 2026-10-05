import { describe, expect, it } from "vitest";
import {
  computeEntry,
  dailyRate,
  estimateNetOt,
  hourlyRate,
  summarizeCutoff,
  withholdingTax,
  type Holiday,
  type OtEntry,
  type OtSettings,
} from "./otPay";

// Mirrors ot-sample-data.json (employee, holidays, otEntries, expected).
const settings: OtSettings = {
  monthlySalary: 94615.22,
  workDaysPerYear: 261,
  restDays: ["Sat", "Sun"],
  taxablePerCutoff: 1250,
};

const holidays: Holiday[] = [
  { date: "2026-08-21", name: "Ninoy Aquino Day", type: "special" },
  { date: "2026-08-31", name: "National Heroes Day", type: "regular_holiday" },
];

const otEntries: OtEntry[] = [
  { id: "ot-1", start: "2026-09-05T06:00", end: "2026-09-05T15:00", breakStart: "2026-09-05T10:00", breakMinutes: 60, hoursFiled: 8 },
  { id: "ot-2", start: "2026-08-30T14:00", end: "2026-08-31T03:00", breakStart: "2026-08-30T18:00", breakMinutes: 60, hoursFiled: 12 },
  { id: "ot-3", start: "2026-08-15T14:00", end: "2026-08-15T23:00", breakStart: "2026-08-15T18:00", breakMinutes: 60, hoursFiled: 8 },
  { id: "ot-4", start: "2026-08-16T14:00", end: "2026-08-16T23:00", breakStart: "2026-08-16T18:00", breakMinutes: 60, hoursFiled: 8 },
];

const ACTUAL_PAID = 24247.45;

describe("rates", () => {
  it("derives the daily and hourly rate from the factor", () => {
    expect(Number(dailyRate(settings).toFixed(2))).toBe(4350.13);
    expect(Number(hourlyRate(settings).toFixed(2))).toBe(543.77);
  });
});

describe("computeEntry — acceptance entries", () => {
  it("ot-1: rest-day REG only, 8h", () => {
    const r = computeEntry(otEntries[0], settings, holidays);
    expect(r.workedHours).toBe(8);
    expect(r.gross).toBe(5655.16);
    expect(r.lines).toHaveLength(1);
    expect(r.lines[0]).toMatchObject({ kind: "REG", hours: 8, multiplier: 1.3, amount: 5655.16 });
  });

  it("ot-2: crosses midnight into Heroes Day — 6 lines match the JSON", () => {
    const r = computeEntry(otEntries[1], settings, holidays);
    expect(r.workedHours).toBe(12);
    expect(r.gross).toBe(11402.22);

    const summary = r.lines.map((l) => `${l.date}|${l.kind}|${l.hours}|${l.multiplier}|${l.amount}`);
    expect(summary).toEqual(
      expect.arrayContaining([
        "2026-08-30|REG|8|1.3|5655.16",
        "2026-08-30|NIGHT|1|1.3|70.69",
        "2026-08-30|OT|1|1.69|918.96",
        "2026-08-30|NIGHT|1|1.69|91.9",
        "2026-08-31|OT|3|2.6|4241.37",
        "2026-08-31|NIGHT|3|2.6|424.14",
      ])
    );
    expect(r.lines).toHaveLength(6);
  });

  it("ot-3: rest-day REG with 1h night differential", () => {
    const r = computeEntry(otEntries[2], settings, holidays);
    expect(r.gross).toBe(5725.85);
  });

  it("ot-4: rest-day REG with 1h night differential", () => {
    const r = computeEntry(otEntries[3], settings, holidays);
    expect(r.gross).toBe(5725.85);
  });

  it("all four entries total 28,509.08 and none flag a filed-hours mismatch", () => {
    const { results, summary } = summarizeCutoff(otEntries, settings, holidays);
    expect(summary.expectedGross).toBe(28509.08);
    expect(results.every((r) => !r.filedMismatch)).toBe(true);
  });

  it("reconciles: payroll paid 24,247.45 → variance −4,261.63", () => {
    const { summary } = summarizeCutoff(
      otEntries.map((e) => ({ ...e, actualPaid: e.id === "ot-1" ? ACTUAL_PAID : undefined })),
      settings,
      holidays
    );
    expect(summary.actualPaid).toBe(ACTUAL_PAID);
    expect(summary.variance).toBe(-4261.63);
  });
});

describe("computeEntry — extra tests from the JSON", () => {
  it("weekday 10h shift: night diff 00:00–06:00 and 2h OT → 1,631.29", () => {
    const r = computeEntry(
      { id: "t1", start: "2026-09-08T00:00", end: "2026-09-08T11:00", breakStart: "2026-09-08T04:00", breakMinutes: 60, hoursFiled: 10 },
      settings,
      holidays
    );
    expect(r.workedHours).toBe(10);
    expect(r.gross).toBe(1631.29);

    const night = r.lines.find((l) => l.kind === "NIGHT");
    const ot = r.lines.find((l) => l.kind === "OT");
    expect(night).toMatchObject({ hours: 5, amount: 271.88 });
    expect(ot).toMatchObject({ hours: 2, multiplier: 1.25, amount: 1359.41 });
  });

  it("special holiday workday, 8h → 1,305.04", () => {
    const r = computeEntry(
      { id: "t2", start: "2026-08-21T09:00", end: "2026-08-21T18:00", breakStart: "2026-08-21T12:00", breakMinutes: 60, hoursFiled: 8 },
      settings,
      holidays
    );
    expect(r.gross).toBe(1305.04);
    expect(r.lines[0]).toMatchObject({ dayType: "special", multiplier: 0.3, amount: 1305.04 });
  });
});

describe("withholding tax (BIR TRAIN semi-monthly)", () => {
  it("base 47,307.61 + 1,250 with no OT → 8,076.85 (matches 1st-cutoff payslip)", () => {
    expect(Number(withholdingTax(47307.61 + 1250).toFixed(2))).toBe(8076.85);
  });

  it("zero tax at the 10,417 threshold", () => {
    expect(withholdingTax(10417)).toBe(0);
  });
});

describe("estimateNetOt", () => {
  it("net is gross minus the marginal tax the OT pushes into", () => {
    const { net, tax } = estimateNetOt(5000, settings);
    expect(tax).toBeGreaterThan(0);
    expect(net).toBe(Number((5000 - tax).toFixed(2)));
  });
});
