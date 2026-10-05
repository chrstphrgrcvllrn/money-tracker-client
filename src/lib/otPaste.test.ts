import { summarizeCutoff, type Holiday, type OtSettings } from "./otPay";
import { describe, expect, it } from "vitest";
import { parseDate, parsePastedEntries, parseTime } from "./otPaste";

describe("parseDate", () => {
  it("reads 5-Sep-26 style", () => {
    expect(parseDate("5-Sep-26")).toBe("2026-09-05");
    expect(parseDate("30-Aug-26")).toBe("2026-08-30");
  });
  it("reads 9/12/2026 style (month first)", () => {
    expect(parseDate("9/12/2026")).toBe("2026-09-12");
    expect(parseDate("9/19/2026")).toBe("2026-09-19");
  });
  it("reads ISO and rejects junk", () => {
    expect(parseDate("2026-09-12")).toBe("2026-09-12");
    expect(parseDate("hello")).toBeNull();
    expect(parseDate("5-Foo-26")).toBeNull();
  });
});

describe("parseTime", () => {
  it("accepts HH:mm and rejects out-of-range", () => {
    expect(parseTime("06:00")).toBe("06:00");
    expect(parseTime("14:00")).toBe("14:00");
    expect(parseTime("25:00")).toBeNull();
  });
});

describe("parsePastedEntries", () => {
  it("parses the sheet the user pasted, skipping the header and blank rows", () => {
    const text = [
      "Start Date\tStart Time\tEnd Date\tEnd Time\tHours Filed",
      "5-Sep-26\t06:00\t5-Sep-26\t15:00\t8",
      "30-Aug-26\t14:00\t31-Aug-26\t03:00\t12",
      "15-Aug-26\t14:00\t15-Aug-26\t23:00\t8",
      "16-Aug-26\t14:00\t16-Aug-26\t23:00\t8",
      "\t\t\t\t",
      "9/12/2026\t14:00\t9/13/2026\t03:00\t12",
      "9/19/2026\t14:00\t9/20/2026\t03:00\t12",
    ].join("\n");

    const { entries, errors } = parsePastedEntries(text);
    expect(errors).toEqual([]);
    expect(entries).toHaveLength(6);
    expect(entries[0]).toMatchObject({ start: "2026-09-05T06:00", end: "2026-09-05T15:00", hoursFiled: 8 });
    expect(entries[1]).toMatchObject({ start: "2026-08-30T14:00", end: "2026-08-31T03:00", hoursFiled: 12 });
    expect(entries[5]).toMatchObject({ start: "2026-09-19T14:00", end: "2026-09-20T03:00", hoursFiled: 12 });
  });

  it("reports rows it cannot read instead of dropping them silently", () => {
    const { entries, errors } = parsePastedEntries("5-Sep-26\t6:0x\t5-Sep-26\t15:00\t8");
    expect(entries).toHaveLength(0);
    expect(errors[0].message).toMatch(/Unreadable time/);
  });
});


describe("pasted rows feed the calculator", () => {
  const settings: OtSettings = { monthlySalary: 94615.22, workDaysPerYear: 261, restDays: ["Sat", "Sun"], taxablePerCutoff: 1250 };
  const holidays: Holiday[] = [{ date: "2026-08-31", name: "National Heroes Day", type: "regular_holiday" }];

  it("the first four pasted rows (no breaks given) still total 28,509.08", () => {
    const text = [
      "5-Sep-26\t06:00\t5-Sep-26\t15:00\t8",
      "30-Aug-26\t14:00\t31-Aug-26\t03:00\t12",
      "15-Aug-26\t14:00\t15-Aug-26\t23:00\t8",
      "16-Aug-26\t14:00\t16-Aug-26\t23:00\t8",
    ].join("\n");
    const { entries } = parsePastedEntries(text);
    expect(summarizeCutoff(entries, settings, holidays).summary.expectedGross).toBe(28509.08);
  });
});
