import { describe, expect, it } from "vitest";
import {
  computeEntry,
  summarizeCutoff,
  withholdingTax,
  estimateNetOt,
  type Holiday,
  type OtSettings,
} from "./otPay";

const settings: OtSettings = {
  monthlySalary: 94615.22,
  workDaysPerYear: 261,
  restDays: ["Sat", "Sun"],
  taxablePerCutoff: 1250,
};

// Only the holidays the acceptance tests depend on. The full PH proclamation
// list still needs to be seeded from the official source.
const holidays: Holiday[] = [
  { date: "2026-08-31", name: "National Heroes Day", type: "regular_holiday" },
];

describe("computeEntry — acceptance table", () => {
  it("ot-1: Sat Sep 5 06:00–15:00 (rest day, 8h + 1h break)", () => {
    const r = computeEntry(
      { id: "ot-1", start: "2026-09-05T06:00", end: "2026-09-05T15:00", hoursFiled: 8 },
      settings,
      holidays
    );
    expect(r.gross).toBe(5655.16);
  });

  it("ot-2: Sun Aug 30 14:00 → Mon Aug 31 03:00 (Heroes Day after midnight)", () => {
    const r = computeEntry(
      { id: "ot-2", start: "2026-08-30T14:00", end: "2026-08-31T03:00", hoursFiled: 12 },
      settings,
      holidays
    );
    expect(r.gross).toBe(11402.22);
  });

  it("ot-3: Sat Aug 15 14:00–23:00 (rest day with night diff)", () => {
    const r = computeEntry(
      { id: "ot-3", start: "2026-08-15T14:00", end: "2026-08-15T23:00", hoursFiled: 8 },
      settings,
      holidays
    );
    expect(r.gross).toBe(5725.85);
  });

  it("ot-4: Sun Aug 16 14:00–23:00 (rest day with night diff)", () => {
    const r = computeEntry(
      { id: "ot-4", start: "2026-08-16T14:00", end: "2026-08-16T23:00", hoursFiled: 8 },
      settings,
      holidays
    );
    expect(r.gross).toBe(5725.85);
  });

  it("the four entries total 28,509.08", () => {
    const { summary } = summarizeCutoff(
      [
        { id: "ot-1", start: "2026-09-05T06:00", end: "2026-09-05T15:00", hoursFiled: 8 },
        { id: "ot-2", start: "2026-08-30T14:00", end: "2026-08-31T03:00", hoursFiled: 12 },
        { id: "ot-3", start: "2026-08-15T14:00", end: "2026-08-15T23:00", hoursFiled: 8 },
        { id: "ot-4", start: "2026-08-16T14:00", end: "2026-08-16T23:00", hoursFiled: 8 },
      ],
      settings,
      holidays
    );
    expect(summary.expectedGross).toBe(28509.08);
  });

  it("reconciles payroll paid 24,247.45 → variance −4,261.63 against the gross", () => {
    // The spec's variance is computed against the gross total, not the
    // tax-adjusted net. Checked here so the sign and arithmetic are pinned down.
    const gross = 28509.08;
    expect(Number((24247.45 - gross).toFixed(2))).toBe(-4261.63);
  });
});

describe("withholding tax (BIR TRAIN semi-monthly)", () => {
  it("base 47,307.61 + 1,250 with no OT → 8,076.85 (matches 1st-cutoff payslip)", () => {
    const tax = withholdingTax(47307.61 + 1250);
    expect(Number(tax.toFixed(2))).toBe(8076.85);
  });

  it("zero tax at or below the 10,417 threshold", () => {
    expect(withholdingTax(10417)).toBe(0);
  });
});

describe("estimateNetOt", () => {
  it("net is gross minus the marginal tax the OT pushes into", () => {
    const { net, tax } = estimateNetOt(5000, settings);
    expect(net).toBe(Number((5000 - tax).toFixed(2)));
    expect(tax).toBeGreaterThan(0);
  });
});
