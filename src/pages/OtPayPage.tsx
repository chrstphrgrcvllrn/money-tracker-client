import { useEffect, useMemo, useState } from "react";
import { getOtPay, saveOtPay } from "@/api/otPay";
import { useToast } from "@/components/useToast";
import { SkeletonBlock, SkeletonRows } from "@/components/Skeleton";
import { summarizeCutoff, type DayType, type Holiday, type OtEntry, type OtSettings, type Weekday } from "@/lib/otPay";
import { parsePastedEntries } from "@/lib/otPaste";

const WEEKDAYS: Weekday[] = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const FACTORS = [261, 262, 313, 365];
const DAY_LABEL: Record<DayType, string> = {
  regular: "Regular",
  special: "Special holiday",
  regular_holiday: "Regular holiday",
};

const money = (n: number) => n.toLocaleString("en-PH", { minimumFractionDigits: 2, maximumFractionDigits: 2 });

const pad = (n: number) => String(n).padStart(2, "0");
const isoOf = (d: Date) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;

const TIME_CHOICES = Array.from({ length: 48 }, (_, i) => `${pad(Math.floor(i / 2))}:${i % 2 ? "30" : "00"}`);
const HOUR_CHOICES = Array.from({ length: 32 }, (_, i) => (i + 1) / 2); // 0.5 … 16

const fmtDate = (iso: string) => {
  const [y, m, d] = iso.split("-").map(Number);
  return new Date(y, m - 1, d).toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" });
};

const FIELD = "bg-[var(--bg-input)] px-3 py-2 rounded-lg text-sm text-[var(--text-primary)] border border-[var(--border-strong)] outline-none focus:border-[var(--accent)]/50";
const SELECT = `w-full ${FIELD}`;

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
  const [cutoffs, setCutoffs] = useState<string[]>([]);
  const [activeCutoff, setActiveCutoff] = useState<string>("all");
  const [formCutoff, setFormCutoff] = useState<string>("");
  const [openId, setOpenId] = useState<string | null>(null);
  const [showSettings, setShowSettings] = useState(false);
  const [showPaste, setShowPaste] = useState(false);
  const [pasteText, setPasteText] = useState("");

  // New-entry form: start and end each have their own date and time.
  const [startDate, setStartDate] = useState(isoOf(new Date()));
  const [startTime, setStartTime] = useState("14:00");
  const [endDate, setEndDate] = useState(isoOf(new Date()));
  const [endTime, setEndTime] = useState("23:00");
  const [hours, setHours] = useState(8);

  useEffect(() => {
    let cancelled = false;
    getOtPay()
      .then((state) => {
        if (cancelled) return;
        setSettings(state.settings);
        setHolidays(state.holidays ?? []);
        setEntries(state.entries ?? []);
        setCutoffs(state.cutoffs ?? []);
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

  // Per-entry results use every entry; the summary covers only the selected cutoff.
  const { results } = useMemo(() => summarizeCutoff(entries, settings, holidays), [entries, settings, holidays]);
  const visibleEntries = useMemo(
    () => (activeCutoff === "all" ? entries : entries.filter((e) => (e.cutoff ?? "") === activeCutoff)),
    [entries, activeCutoff]
  );
  const { summary } = useMemo(() => summarizeCutoff(visibleEntries, settings, holidays), [visibleEntries, settings, holidays]);

  const addCutoff = () => {
    const label = prompt("Cutoff name (e.g. Aug 16–31, 2026)")?.trim();
    if (!label) return;
    if (!cutoffs.includes(label)) setCutoffs((prev) => [...prev, label]);
    setFormCutoff(label);
  };
  const resultById = useMemo(() => new Map(results.map((r) => [r.id, r])), [results]);
  const paste = useMemo(() => (pasteText.trim() ? parsePastedEntries(pasteText, `p${Date.now()}`) : null), [pasteText]);

  const addEntry = () => {
    const start = `${startDate}T${startTime}`;
    const end = `${endDate}T${endTime}`;
    if (end <= start) {
      showToast("The end must be after the start", "error");
      return;
    }
    const entry: OtEntry = { id: `e${Date.now()}`, start, end, hoursFiled: hours, cutoff: formCutoff || undefined };
    setEntries((prev) => [...prev, entry].sort((a, b) => a.start.localeCompare(b.start)));
    setOpenId(entry.id);
  };

  const addPasted = () => {
    if (!paste || paste.entries.length === 0) return;
    setEntries((prev) => [...prev, ...paste.entries].sort((a, b) => a.start.localeCompare(b.start)));
    setPasteText("");
    showToast(`Added ${paste.entries.length} entries`, "success");
  };

  const updateEntry = (id: string, patch: Partial<OtEntry>) =>
    setEntries((prev) => prev.map((e) => (e.id === id ? { ...e, ...patch } : e)));
  const removeEntry = (id: string) => setEntries((prev) => prev.filter((e) => e.id !== id));

  const save = async () => {
    setSaving(true);
    try {
      const saved = await saveOtPay({ settings, holidays, entries, cutoffs });
      setSettings(saved.settings);
      setHolidays(saved.holidays ?? []);
      setEntries(saved.entries ?? []);
      setCutoffs(saved.cutoffs ?? []);
      showToast("Saved", "success");
    } catch (err) {
      console.error(err);
      showToast("Failed to save", "error");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="max-w-md md:max-w-2xl mx-auto px-6 pt-8 pb-10 space-y-6">
        <SkeletonBlock className="h-8 w-32" />
        <SkeletonBlock className="h-24 w-full rounded-xl" />
        <SkeletonRows count={3} />
      </div>
    );
  }

  return (
    <div className="max-w-md md:max-w-2xl mx-auto px-6 pt-8 pb-10 space-y-5 text-[var(--text-primary)] text-sm">
      <div className="flex items-center justify-between">
        <h1 className="text-lg font-semibold">OT Pay</h1>
        <button
          onClick={save}
          disabled={saving}
          className="bg-[var(--btn-bg)] text-[var(--btn-text)] font-semibold px-4 py-1.5 rounded-lg disabled:opacity-50"
        >
          {saving ? "Saving…" : "Save"}
        </button>
      </div>

      {/* CUTOFF SELECTOR */}
      <div className="flex items-center justify-between gap-3">
        <span className="text-xs text-[var(--text-secondary)]">Cutoff</span>
        <select value={activeCutoff} onChange={(e) => setActiveCutoff(e.target.value)} className={`${SELECT} w-56`}>
          <option value="all">All cutoffs</option>
          {cutoffs.map((c) => (
            <option key={c} value={c}>
              {c}
            </option>
          ))}
        </select>
      </div>

      {/* SUMMARY — compact */}
      <section className="bg-[var(--bg-surface)] rounded-xl p-4">
        <div className="flex justify-between items-baseline">
          <span className="text-[var(--text-secondary)] text-xs">Expected net OT</span>
          <span className="text-xl font-bold">{money(summary.estimatedNet)}</span>
        </div>
        <div className="grid grid-cols-3 gap-2 mt-3 text-xs">
          <div>
            <p className="text-[var(--text-secondary)]">Gross</p>
            <p className="font-semibold">{money(summary.expectedGross)}</p>
          </div>
          <div>
            <p className="text-[var(--text-secondary)]">Paid</p>
            <p className="font-semibold">{money(summary.actualPaid)}</p>
          </div>
          <div>
            <p className="text-[var(--text-secondary)]">Variance</p>
            <p className={`font-semibold ${summary.variance < 0 ? "text-[var(--danger)]" : ""}`}>
              {summary.variance < 0 ? "−" : "+"}
              {money(Math.abs(summary.variance))}
            </p>
          </div>
        </div>
      </section>

      {/* ADD ENTRY — four dropdowns */}
      <section className="bg-[var(--bg-surface)] rounded-xl p-4 space-y-3">
        <p className="font-semibold">Add OT</p>
        <div className="flex gap-2 items-end">
          <label className="flex-1 min-w-0 text-xs text-[var(--text-secondary)]">
            Cutoff
            <select value={formCutoff} onChange={(e) => setFormCutoff(e.target.value)} className={`${SELECT} mt-1`}>
              <option value="">No cutoff</option>
              {cutoffs.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </label>
          <button type="button" onClick={addCutoff} className="shrink-0 text-xs text-[var(--accent)] py-2">
            + New
          </button>
        </div>
        <div className="space-y-3">
          <div className="flex gap-2 items-end">
            <label className="flex-1 min-w-0 text-xs text-[var(--text-secondary)]">
              Start
              <input
                type="date"
                value={startDate}
                onChange={(e) => {
                  setStartDate(e.target.value);
                  if (endDate < e.target.value) setEndDate(e.target.value);
                }}
                className={`${SELECT} mt-1`}
              />
            </label>
            <select
              value={startTime}
              onChange={(e) => setStartTime(e.target.value)}
              aria-label="Start time"
              className={`${FIELD} w-28 shrink-0`}
            >
              {TIME_CHOICES.map((t) => (
                <option key={t} value={t}>
                  {t}
                </option>
              ))}
            </select>
          </div>

          <div className="flex gap-2 items-end">
            <label className="flex-1 min-w-0 text-xs text-[var(--text-secondary)]">
              End
              <input
                type="date"
                value={endDate}
                min={startDate}
                onChange={(e) => setEndDate(e.target.value)}
                className={`${SELECT} mt-1`}
              />
            </label>
            <select
              value={endTime}
              onChange={(e) => setEndTime(e.target.value)}
              aria-label="End time"
              className={`${FIELD} w-28 shrink-0`}
            >
              {TIME_CHOICES.map((t) => (
                <option key={t} value={t}>
                  {t}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs text-[var(--text-secondary)]">
              Hours filed
              <select value={hours} onChange={(e) => setHours(Number(e.target.value))} className={`${SELECT} mt-1`}>
                {HOUR_CHOICES.map((h) => (
                  <option key={h} value={h}>
                    {h} h
                  </option>
                ))}
              </select>
            </label>
          </div>
        </div>
        <button onClick={addEntry} className="w-full bg-[var(--btn-bg)] text-[var(--btn-text)] font-semibold py-2 rounded-lg">
          Add
        </button>
      </section>

      {/* ENTRIES — one line each; tap for the breakdown */}
      <section className="space-y-2">
        <p className="font-semibold">Entries</p>
        {visibleEntries.length === 0 && <p className="text-xs text-[var(--text-secondary)]">No OT yet.</p>}
        {visibleEntries.map((e) => {
          const r = resultById.get(e.id);
          const open = openId === e.id;
          const [sd, st] = e.start.split("T");
          const [ed, et] = e.end.split("T");
          return (
            <div key={e.id} className="bg-[var(--bg-surface)] rounded-xl px-4 py-3">
              <button onClick={() => setOpenId(open ? null : e.id)} className="w-full flex justify-between items-center text-left">
                <span className="text-xs">
                  <span className="font-medium">{fmtDate(sd)}</span>{" "}
                  <span className="text-[var(--text-secondary)]">
                    {st}–{et}
                    {ed !== sd ? ` (${fmtDate(ed)})` : ""} · {e.hoursFiled} h
                    {e.cutoff ? ` · ${e.cutoff}` : ""}
                  </span>
                </span>
                <span className="font-semibold">{money(r?.gross ?? 0)}</span>
              </button>

              {open && r && (
                <div className="mt-3 space-y-3 pt-3 border-t border-[var(--border-subtle)]">
                  <table className="w-full text-xs">
                    <tbody>
                      {r.lines.map((l, i) => (
                        <tr key={i}>
                          <td className="py-0.5">
                            {fmtDate(l.date)} · {DAY_LABEL[l.dayType]}
                            {l.isRestDay ? " · rest" : ""}
                            {l.kind === "OT" ? " · OT" : l.kind === "NIGHT" ? " · night" : ""}
                          </td>
                          <td className="py-0.5 text-right">{l.hours.toFixed(2)} h</td>
                          <td className="py-0.5 text-right font-medium">{money(l.amount)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  {r.filedMismatch && (
                    <p className="text-xs text-[var(--danger)]">
                      Worked {r.workedHours.toFixed(2)} h, but filed {e.hoursFiled} h
                    </p>
                  )}
                  <label className="flex items-center justify-between gap-3 text-xs text-[var(--text-secondary)]">
                    Cutoff
                    <select
                      value={e.cutoff ?? ""}
                      onChange={(ev) => updateEntry(e.id, { cutoff: ev.target.value || undefined })}
                      className={`${SELECT} w-56`}
                    >
                      <option value="">No cutoff</option>
                      {cutoffs.map((c) => (
                        <option key={c} value={c}>
                          {c}
                        </option>
                      ))}
                    </select>
                  </label>
                  <label className="flex items-center justify-between gap-3 text-xs text-[var(--text-secondary)]">
                    Actual paid
                    <input
                      type="number"
                      inputMode="decimal"
                      value={e.actualPaid ?? ""}
                      onChange={(ev) =>
                        updateEntry(e.id, { actualPaid: ev.target.value === "" ? undefined : Number(ev.target.value) })
                      }
                      className={`${SELECT} w-32 text-right`}
                    />
                  </label>
                  <button onClick={() => removeEntry(e.id)} className="text-xs text-[var(--danger)]">
                    Remove
                  </button>
                </div>
              )}
            </div>
          );
        })}
      </section>

      {/* MORE — collapsed by default */}
      <section className="space-y-2">
        <button
          onClick={() => setShowPaste((v) => !v)}
          className="w-full text-left text-xs text-[var(--text-secondary)] py-2"
        >
          {showPaste ? "▾" : "▸"} Paste rows from a sheet
        </button>
        {showPaste && (
          <div className="bg-[var(--bg-surface)] rounded-xl p-4 space-y-3">
            <textarea
              value={pasteText}
              onChange={(e) => setPasteText(e.target.value)}
              placeholder={"5-Sep-26\t06:00\t5-Sep-26\t15:00\t8"}
              rows={4}
              className={`${SELECT} font-mono text-xs`}
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
              className="w-full bg-[var(--btn-bg)] text-[var(--btn-text)] font-semibold py-2 rounded-lg disabled:opacity-40"
            >
              Add rows
            </button>
          </div>
        )}

        <button
          onClick={() => setShowSettings((v) => !v)}
          className="w-full text-left text-xs text-[var(--text-secondary)] py-2"
        >
          {showSettings ? "▾" : "▸"} Pay settings &amp; holidays
        </button>
        {showSettings && (
          <div className="bg-[var(--bg-surface)] rounded-xl p-4 space-y-4">
            <label className="block text-xs text-[var(--text-secondary)]">
              Monthly salary
              <input
                type="number"
                value={settings.monthlySalary || ""}
                onChange={(e) => setSettings((s) => ({ ...s, monthlySalary: Number(e.target.value) }))}
                className={`${SELECT} mt-1`}
              />
            </label>
            <label className="block text-xs text-[var(--text-secondary)]">
              Work days per year
              <select
                value={settings.workDaysPerYear}
                onChange={(e) => setSettings((s) => ({ ...s, workDaysPerYear: Number(e.target.value) }))}
                className={`${SELECT} mt-1`}
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
                    onClick={() =>
                      setSettings((s) => ({
                        ...s,
                        restDays: s.restDays.includes(d) ? s.restDays.filter((x) => x !== d) : [...s.restDays, d],
                      }))
                    }
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
                className={`${SELECT} mt-1`}
              />
            </label>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <p className="text-xs text-[var(--text-secondary)]">Holidays</p>
                <button
                  onClick={() => setHolidays((h) => [...h, { date: isoOf(new Date()), name: "", type: "regular_holiday" }])}
                  className="text-xs text-[var(--accent)]"
                >
                  + Add
                </button>
              </div>
              {holidays.map((h, i) => (
                <div key={i} className="grid grid-cols-2 gap-2">
                  <input
                    type="date"
                    value={h.date}
                    onChange={(e) => setHolidays((all) => all.map((x, j) => (j === i ? { ...x, date: e.target.value } : x)))}
                    className={SELECT}
                  />
                  <select
                    value={h.type}
                    onChange={(e) =>
                      setHolidays((all) => all.map((x, j) => (j === i ? { ...x, type: e.target.value as Holiday["type"] } : x)))
                    }
                    className={SELECT}
                  >
                    <option value="regular_holiday">Regular</option>
                    <option value="special">Special</option>
                  </select>
                  <input
                    placeholder="Name"
                    value={h.name}
                    onChange={(e) => setHolidays((all) => all.map((x, j) => (j === i ? { ...x, name: e.target.value } : x)))}
                    className={SELECT}
                  />
                  <button onClick={() => setHolidays((all) => all.filter((_, j) => j !== i))} className="text-xs text-[var(--danger)]">
                    Remove
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}
      </section>
    </div>
  );
}
