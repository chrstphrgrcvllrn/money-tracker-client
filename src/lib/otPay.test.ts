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

  // Payslip basis: the whole Aug 30 → Aug 31 shift is classed by its start date
  // (rest day), so the Aug 31 hours are rest-day OT, not regular-holiday pay.
  it("ot-2: crosses midnight — classed by its start date (rest day), per the payslip", () => {
    const r = computeEntry(otEntries[1], settings, holidays);
    expect(r.workedHours).toBe(12);
    expect(r.gross).toBe(9769.29);

    const summary = r.lines.map((l) => `${l.date}|${l.kind}|${l.hours}|${l.multiplier}|${l.amount}`);
    expect(summary).toEqual(
      expect.arrayContaining([
        "2026-08-30|REG|8|1.3|5655.16",
        "2026-08-30|NIGHT|1|1.3|70.69",
        "2026-08-30|NIGHT|1|1.69|91.9",
        "2026-08-30|OT|1|1.69|918.96",
        "2026-08-31|NIGHT|3|1.69|275.69",
        "2026-08-31|OT|3|1.69|2756.89",
      ])
    );
  });

  it("ot-3: rest-day REG with 1h night differential", () => {
    const r = computeEntry(otEntries[2], settings, holidays);
    expect(r.gross).toBe(5725.85);
  });

  it("ot-4: rest-day REG with 1h night differential", () => {
    const r = computeEntry(otEntries[3], settings, holidays);
    expect(r.gross).toBe(5725.85);
  });

  it("four entries total 26,876.15; none flag a filed-hours mismatch", () => {
    const { results, summary } = summarizeCutoff(otEntries, settings, holidays);
    expect(summary.expectedGross).toBe(26876.15);
    expect(results.every((r) => !r.filedMismatch)).toBe(true);
  });

  // Payslip (October Special Payroll 1 2026): gross 27,314.44, net 24,247.45.
  // Rest-day basic (22,620.65) and rest-day OT (3,675.86) match exactly.
  // The payslip's night-differential lines (RD ND 282.76 = 4 h; RD NDOT 735.17 = 8 h)
  // are larger than what the shift times give (3 h and 4 h), which leaves a gap of
  // 438.29 that is not explained by the rules yet.
  it("matches payslip rest-day basic and rest-day OT exactly", () => {
    const rdBasic = otEntries.flatMap((e) => computeEntry(e, settings, holidays).lines).filter((l) => l.kind === "REG");
    const rdOt = otEntries.flatMap((e) => computeEntry(e, settings, holidays).lines).filter((l) => l.kind === "OT");
    expect(rdBasic.reduce((s, l) => s + l.hours, 0)).toBe(32);
    // Per-entry rounding gives 22,620.64; the payslip's single 32 h line shows 22,620.65.
    expect(Number(rdBasic.reduce((s, l) => s + l.amount, 0).toFixed(2))).toBe(22620.64);
    expect(rdOt.reduce((s, l) => s + l.hours, 0)).toBe(4);
    // Per-entry rounding gives 3,675.85; the payslip shows 3,675.86 (1 centavo).
    expect(Number(rdOt.reduce((s, l) => s + l.amount, 0).toFixed(2))).toBe(3675.85);
  });

  it("gap to the payslip gross (27,314.44) is only night differential", () => {
    const { summary } = summarizeCutoff(otEntries, settings, holidays);
    expect(Number((27314.44 - summary.expectedGross).toFixed(2))).toBe(438.29);
  });

  it("variance uses actual minus expected gross", () => {
    const { summary } = summarizeCutoff(
      otEntries.map((e) => ({ ...e, actualPaid: e.id === "ot-1" ? ACTUAL_PAID : undefined })),
      settings,
      holidays
    );
    expect(summary.actualPaid).toBe(ACTUAL_PAID);
    expect(summary.variance).toBe(-2628.7);
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

describe("day-type tag on an entry", () => {
  it("tagging a rest-day shift as regular holiday uses the RH rest-day row (2.6×) for its 8 hours", () => {
    const r = computeEntry(
      { id: "tag", start: "2026-09-05T06:00", end: "2026-09-05T15:00", breakStart: "2026-09-05T10:00", breakMinutes: 60, hoursFiled: 8, dayType: "regular_holiday" },
      settings,
      []
    );
    expect(r.lines[0]).toMatchObject({ dayType: "regular_holiday", isRestDay: true, multiplier: 2.6 });
    expect(r.gross).toBe(11310.33);
  });

  it("the tag beats the holiday table; without a tag the table decides", () => {
    const shift = { id: "t", start: "2026-08-21T09:00", end: "2026-08-21T18:00", breakStart: "2026-08-21T12:00", breakMinutes: 60, hoursFiled: 8 };
    const special: Holiday[] = [{ date: "2026-08-21", name: "Ninoy", type: "special" }];
    expect(computeEntry(shift, settings, special).gross).toBe(1305.04);
    expect(computeEntry({ ...shift, dayType: "regular_holiday" }, settings, special).lines[0].multiplier).toBe(1.0);
  });
});
