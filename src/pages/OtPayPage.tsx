import { useEffect, useMemo, useState } from "react";
import { getOtPay, saveOtPay, type OtPayState } from "@/api/otPay";
import { useToast } from "@/components/useToast";
import { SkeletonBlock, SkeletonRows } from "@/components/Skeleton";
import {
  summarizeCutoff,
  type DayType,
  type Holiday,
  type OtEntry,
  type OtSettings,
  type Weekday,
} from "@/lib/otPay";
import { parsePastedEntries } from "@/lib/otPaste";

const WEEKDAYS: Weekday[] = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const FACTORS = [261, 262, 313, 365];

const DAY_LABEL: Record<DayType, string> = {
  regular: "Regular",
  special: "Special holiday",
  regular_holiday: "Regular holiday",
};

const money = (n: number) => n.toLocaleString("en-PH", { minimumFractionDigits: 2, maximumFractionDigits: 2 });

const fmtDay = (iso: string) => {
  const [y, m, d] = iso.slice(0, 10).split("-").map(Number);
  return new Date(y, m - 1, d).toLocaleDateString("en-US", { month: "short", day: "numeric" });
};

const fmtRange = (e: OtEntry) => {
  const [sd, st] = e.start.split("T");
  const [ed, et] = e.end.split("T");
  return `${fmtDay(sd)} ${st} → ${sd === ed ? et : `${fmtDay(ed)} ${et}`}`;
};

const KIND_LABEL = { REG: "", OT: " OT", NIGHT: " night diff" } as const;

const INPUT =
  "w-full bg-[var(--bg-input)] px-3 py-2 rounded-lg text-sm text-[var(--text-primary)] border border-[var(--border-strong)] outline-none focus:border-[var(--accent)]/50";

export default function OtPayPage() {
  const showToast = useToast();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [settings, setSettings] = useState<OtSettings>({
    monthlySalary: 0,
    workDaysPerYear: 261,
    restDays: ["Sat", "Sun"],
    taxablePerCutoff: 0,
  });
  const [holidays, setHolidays] = useState<Holiday[]>([]);
  const [entries, setEntries] = useState<OtEntry[]>([]);
  const [pasteText, setPasteText] = useState("");
  const [openEntryId, setOpenEntryId] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    getOtPay()
      .then((state) => {
        if (cancelled) return;
        setSettings(state.settings);
        setHolidays(state.holidays ?? []);
        setEntries(state.entries ?? []);
      })
      .catch((err) => {
        console.error(err);
        showToast("Failed to load OT pay", "error");
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [showToast]);

  const { results, summary } = useMemo(
    () => summarizeCutoff(entries, settings, holidays),
    [entries, settings, holidays]
  );
  const resultById = useMemo(() => new Map(results.map((r) => [r.id, r])), [results]);

  const paste = useMemo(() => (pasteText.trim() ? parsePastedEntries(pasteText, `p${Date.now()}`) : null), [pasteText]);

  const toggleRest = (day: Weekday) =>
    setSettings((s) => ({
      ...s,
      restDays: s.restDays.includes(day) ? s.restDays.filter((d) => d !== day) : [...s.restDays, day],
    }));

  const addPasted = () => {
    if (!paste || paste.entries.length === 0) return;
    setEntries((prev) => [...prev, ...paste.entries]);
    setPasteText("");
    showToast(`Added ${paste.entries.length} entr${paste.entries.length === 1 ? "y" : "ies"}`, "success");
  };

  const updateEntry = (id: string, patch: Partial<OtEntry>) =>
    setEntries((prev) => prev.map((e) => (e.id === id ? { ...e, ...patch } : e)));

  const removeEntry = (id: string) => setEntries((prev) => prev.filter((e) => e.id !== id));

  const save = async () => {
    setSaving(true);
    try {
      const state: OtPayState = { settings, holidays, entries };
      const saved = await saveOtPay(state);
      setSettings(saved.settings);
      setHolidays(saved.holidays ?? []);
      setEntries(saved.entries ?? []);
      showToast("OT pay saved", "success");
    } catch (err) {
      console.error(err);
      showToast("Failed to save OT pay", "error");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="max-w-md md:max-w-2xl mx-auto px-6 pt-8 pb-10 space-y-6 text-[var(--text-primary)]">
        <SkeletonBlock className="h-8 w-40" />
        <SkeletonBlock className="h-40 w-full rounded-xl" />
        <SkeletonRows count={4} />
      </div>
    );
  }

  return (
    <div className="max-w-md md:max-w-2xl mx-auto px-6 pt-8 pb-10 space-y-8 text-[var(--text-primary)] text-sm">
      <div className="flex items-center justify-between">
        <h1 className="text-lg font-semibold">OT Pay</h1>
        <button
          onClick={save}
          disabled={saving}
          className="bg-[var(--btn-bg)] text-[var(--btn-text)] font-semibold px-4 py-2 rounded-lg disabled:opacity-50"
        >
          {saving ? "Saving…" : "Save"}
        </button>
      </div>

      {/* SUMMARY */}
      <section className="bg-[var(--bg-surface)] rounded-xl p-4 space-y-2">
        <h2 className="font-semibold mb-1">This cutoff</h2>
        <Row label="Expected OT gross" value={money(summary.expectedGross)} />
        <Row label="Estimated tax" value={`− ${money(summary.estimatedTax)}`} />
        <Row label="Estimated net OT" value={money(summary.estimatedNet)} bold />
        <Row label="Actual paid" value={money(summary.actualPaid)} />
        <div className="flex justify-between pt-2 border-t border-[var(--border-subtle)]">
          <span className="font-semibold">Variance</span>
          <span className={`font-bold ${summary.variance < 0 ? "text-[var(--danger)]" : "text-[var(--text-primary)]"}`}>
            {summary.variance < 0 ? "−" : "+"}
            {money(Math.abs(summary.variance))}
          </span>
        </div>
        <p className="text-[11px] text-[var(--text-secondary)]">
          Variance is actual paid minus expected gross. Negative means underpaid.
        </p>
      </section>

      {/* PASTE */}
      <section className="space-y-3">
        <h2 className="font-semibold">Add entries</h2>
        <p className="text-[var(--text-secondary)] text-xs">
          Paste rows copied from your sheet: start date, start time, end date, end time, hours filed.
        </p>
        <textarea
          value={pasteText}
          onChange={(e) => setPasteText(e.target.value)}
          placeholder={"5-Sep-26\t06:00\t5-Sep-26\t15:00\t8"}
          rows={5}
          className={`${INPUT} font-mono text-xs`}
        />
        {paste && (
          <div className="text-xs space-y-1">
            <p className="text-[var(--text-secondary)]">
              {paste.entries.length} row{paste.entries.length === 1 ? "" : "s"} ready
            </p>
            {paste.errors.map((err) => (
              <p key={err.line} className="text-[var(--danger)]">
                Line {err.line}: {err.message}
              </p>
            ))}
          </div>
        )}
        <button
          onClick={addPasted}
          disabled={!paste || paste.entries.length === 0}
          className="bg-[var(--btn-bg)] text-[var(--btn-text)] font-semibold px-4 py-2 rounded-lg disabled:opacity-40"
        >
          Add {paste?.entries.length ? paste.entries.length : ""} entries
        </button>
      </section>

      {/* ENTRIES */}
      <section className="space-y-2">
        <h2 className="font-semibold">Entries</h2>
        {entries.length === 0 && <p className="text-[var(--text-secondary)] text-xs">No entries yet.</p>}
        {entries.map((e) => {
          const r = resultById.get(e.id);
          const open = openEntryId === e.id;
          return (
            <div key={e.id} className="bg-[var(--bg-surface)] rounded-xl p-3 space-y-2">
              <button onClick={() => setOpenEntryId(open ? null : e.id)} className="w-full text-left">
                <div className="flex justify-between gap-2">
                  <span className="font-medium">{fmtRange(e)}</span>
                  <span className="font-semibold">{money(r?.gross ?? 0)}</span>
                </div>
                <div className="text-[11px] text-[var(--text-secondary)] flex gap-2 mt-0.5">
                  <span>{(r?.workedHours ?? 0).toFixed(2)} h worked</span>
                  {r?.filedMismatch && <span className="text-[var(--danger)]">· filed {e.hoursFiled} h, mismatch</span>}
                </div>
              </button>

              <label className="flex items-center gap-2 text-xs text-[var(--text-secondary)]">
                Actual paid
                <input
                  type="number"
                  inputMode="decimal"
                  value={e.actualPaid ?? ""}
                  onChange={(ev) =>
                    updateEntry(e.id, { actualPaid: ev.target.value === "" ? undefined : Number(ev.target.value) })
                  }
                  className={`${INPUT} py-1 text-right`}
                />
              </label>

              {open && r && (
                <div className="space-y-2 pt-2 border-t border-[var(--border-subtle)]">
                  <table className="w-full text-xs">
                    <thead className="text-[var(--text-secondary)]">
                      <tr>
                        <th className="text-left font-normal">Date</th>
                        <th className="text-left font-normal">Type</th>
                        <th className="text-right font-normal">Hours</th>
                        <th className="text-right font-normal">Mult.</th>
                        <th className="text-right font-normal">Amount</th>
                      </tr>
                    </thead>
                    <tbody>
                      {r.lines.map((l, i) => (
                        <tr key={i}>
                          <td>{fmtDay(l.date)}</td>
                          <td>
                            {DAY_LABEL[l.dayType]}
                            {l.isRestDay ? " · rest day" : ""}
                            {KIND_LABEL[l.kind]}
                          </td>
                          <td className="text-right">{l.hours.toFixed(2)}</td>
                          <td className="text-right">×{l.multiplier}</td>
                          <td className="text-right">{money(l.amount)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  <button onClick={() => removeEntry(e.id)} className="text-xs text-[var(--danger)]">
                    Remove entry
                  </button>
                </div>
              )}
            </div>
          );
        })}
      </section>

      {/* SETTINGS */}
      <section className="bg-[var(--bg-surface)] rounded-xl p-4 space-y-4">
        <h2 className="font-semibold">Pay settings</h2>
        <label className="block text-xs text-[var(--text-secondary)]">
          Monthly salary
          <input
            type="number"
            value={settings.monthlySalary || ""}
            onChange={(e) => setSettings((s) => ({ ...s, monthlySalary: Number(e.target.value) }))}
            className={`${INPUT} mt-1`}
          />
        </label>
        <label className="block text-xs text-[var(--text-secondary)]">
          Work days per year (company factor)
          <select
            value={settings.workDaysPerYear}
            onChange={(e) => setSettings((s) => ({ ...s, workDaysPerYear: Number(e.target.value) }))}
            className={`${INPUT} mt-1`}
          >
            {FACTORS.map((f) => (
              <option key={f} value={f}>
                {f}
              </option>
            ))}
          </select>
        </label>
        <div>
          <p className="text-xs text-[var(--text-secondary)] mb-2">Rest days</p>
          <div className="flex flex-wrap gap-2">
            {WEEKDAYS.map((d) => (
              <button
                key={d}
                type="button"
                onClick={() => toggleRest(d)}
                className={`px-3 py-1 rounded-full text-xs ${
                  settings.restDays.includes(d)
                    ? "bg-[var(--btn-bg)] text-[var(--btn-text)] font-semibold"
                    : "bg-[var(--bg-input)] text-[var(--text-secondary)]"
                }`}
              >
                {d}
              </button>
            ))}
          </div>
        </div>
        <label className="block text-xs text-[var(--text-secondary)]">
          Taxable allowance per cutoff
          <input
            type="number"
            value={settings.taxablePerCutoff || ""}
            onChange={(e) => setSettings((s) => ({ ...s, taxablePerCutoff: Number(e.target.value) }))}
            className={`${INPUT} mt-1`}
          />
        </label>
        <p className="text-[11px] text-[var(--text-secondary)]">
          Daily rate {money((settings.monthlySalary * 12) / settings.workDaysPerYear)} · hourly{" "}
          {money((settings.monthlySalary * 12) / settings.workDaysPerYear / 8)}
        </p>
      </section>

      {/* HOLIDAYS */}
      <section className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="font-semibold">Holidays</h2>
          <button
            onClick={() => setHolidays((h) => [...h, { date: "", name: "", type: "regular_holiday" }])}
            className="text-xs text-[var(--accent)]"
          >
            + Add
          </button>
        </div>
        {holidays.length === 0 && <p className="text-[var(--text-secondary)] text-xs">No holidays. Days without one count as regular.</p>}
        {holidays.map((h, i) => (
          <div key={i} className="bg-[var(--bg-surface)] rounded-xl p-3 grid grid-cols-2 gap-2">
            <input
              type="date"
              value={h.date}
              onChange={(e) => setHolidays((all) => all.map((x, j) => (j === i ? { ...x, date: e.target.value } : x)))}
              className={INPUT}
            />
            <select
              value={h.type}
              onChange={(e) =>
                setHolidays((all) => all.map((x, j) => (j === i ? { ...x, type: e.target.value as Holiday["type"] } : x)))
              }
              className={INPUT}
            >
              <option value="regular_holiday">Regular</option>
              <option value="special">Special</option>
            </select>
            <input
              placeholder="Name"
              value={h.name}
              onChange={(e) => setHolidays((all) => all.map((x, j) => (j === i ? { ...x, name: e.target.value } : x)))}
              className={`${INPUT} col-span-1`}
            />
            <button
              onClick={() => setHolidays((all) => all.filter((_, j) => j !== i))}
              className="text-xs text-[var(--danger)]"
            >
              Remove
            </button>
          </div>
        ))}
      </section>
    </div>
  );
}

function Row({ label, value, bold = false }: { label: string; value: string; bold?: boolean }) {
  return (
    <div className="flex justify-between">
      <span className="text-[var(--text-secondary)]">{label}</span>
      <span className={bold ? "font-semibold" : ""}>{value}</span>
    </div>
  );
}
