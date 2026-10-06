import { useEffect, useMemo, useState } from "react";
import { getOtPay, saveOtPay, type CutoffAdjustment, type CutoffRule } from "@/api/otPay";
import { useToast } from "@/components/useToast";
import Modal from "@/components/Modal";
import { SkeletonBlock, SkeletonRows } from "@/components/Skeleton";
import { estimateNetOt, summarizeCutoff, type DayType, type Holiday, type OtEntry, type OtSettings, type Weekday } from "@/lib/otPay";
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

// The rules you described: Sep 11–25 → Oct 5 pay; Sep 26–Oct 10 → Oct 20 pay.
// Sep 25 is in both ranges; it goes to the first (Oct 5) since that range is listed first.
const DEFAULT_RULES: CutoffRule[] = [
  { from: "2026-09-11", to: "2026-09-25", cutoff: "Oct 5, 2026" },
  { from: "2026-09-26", to: "2026-10-10", cutoff: "Oct 20, 2026" },
];

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
  const [activeCutoff, setActiveCutoff] = useState<string>("all");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [rules, setRules] = useState<CutoffRule[]>([]);
  const [adjustments, setAdjustments] = useState<CutoffAdjustment[]>([]);

  // Cutoffs come from the date rules; each shift's cutoff is worked out from its start date.
  const cutoffs = useMemo(() => [...new Set(rules.map((r) => r.cutoff).filter(Boolean))], [rules]);
  const cutoffFor = (startDate: string) => rules.find((r) => startDate >= r.from && startDate <= r.to)?.cutoff;
  // The holiday on a shift's start date, if the table has one.
  const holidayTypeOn = (date: string): DayType | undefined => holidays.find((h) => h.date === date)?.type;

  // A manual cutoff on the entry wins; otherwise the rule for its start date decides.
  // "" means the entry is deliberately unassigned.
  const cutoffOf = (e: OtEntry) => (e.cutoff !== undefined ? e.cutoff || undefined : cutoffFor(e.start.slice(0, 10)));

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
        // First visit: seed the default date rules so they apply automatically.
        const saved = state.cutoffRules ?? [];
        const seeded = saved.length > 0 ? saved : DEFAULT_RULES;
        setRules(seeded);
        setAdjustments(state.cutoffAdjustments ?? []);
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
    () => (activeCutoff === "all" ? entries : entries.filter((e) => (cutoffOf(e) ?? "") === activeCutoff)),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [entries, activeCutoff, rules]
  );
  // Totals for a group of shifts plus its adjustments. Actual withholding from the payslip
  // replaces the estimate when an adjustment carries it.
  const totalsOf = (group: OtEntry[], adjs: CutoffAdjustment[]) => {
    const base = summarizeCutoff(group, settings, holidays).summary;
    const expectedGross = Math.round((base.expectedGross + adjs.reduce((s, a) => s + a.gross, 0)) * 100) / 100;
    const withheld = adjs.filter((a) => a.tax !== undefined);
    const estimatedTax = withheld.length
      ? Math.round(withheld.reduce((s, a) => s + (a.tax ?? 0), 0) * 100) / 100
      : estimateNetOt(expectedGross, settings).tax;
    return {
      ...base,
      expectedGross,
      estimatedTax,
      estimatedNet: Math.round((expectedGross - estimatedTax) * 100) / 100,
    };
  };

  // Gross and net for each cutoff on its own (entries without one are "Unassigned").
  const byCutoff = useMemo(() => {
    const labels = [...cutoffs];
    if (entries.some((e) => !cutoffOf(e))) labels.push("");
    return labels.map((label) => {
      const group = entries.filter((e) => (cutoffOf(e) ?? "") === label);
      return { label, count: group.length, ...totalsOf(group, adjustments.filter((a) => a.cutoff === label)) };
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [entries, cutoffs, settings, holidays, rules, adjustments]);

  // Entries grouped under their cutoff, in rule order; unmatched shifts last.
  const groupedEntries = useMemo(
    () =>
      [...cutoffs, ""]
        .map((label) => ({
          label,
          items: visibleEntries
            .filter((e) => (cutoffOf(e) ?? "") === label)
            .sort((a, b) => a.start.localeCompare(b.start)),
        }))
        .filter((g) => g.items.length > 0),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [visibleEntries, cutoffs, rules]
  );

  const resultById = useMemo(() => new Map(results.map((r) => [r.id, r])), [results]);
  const paste = useMemo(() => (pasteText.trim() ? parsePastedEntries(pasteText, `p${Date.now()}`) : null), [pasteText]);

  const addEntry = () => {
    const start = `${startDate}T${startTime}`;
    const end = `${endDate}T${endTime}`;
    if (end <= start) {
      showToast("The end must be after the start", "error");
      return;
    }
    const entry: OtEntry = { id: `e${Date.now()}`, start, end, hoursFiled: hours };
    setEntries((prev) => [...prev, entry].sort((a, b) => a.start.localeCompare(b.start)));
    setOpenId(entry.id);
  };

  const addPasted = () => {
    if (!paste || paste.entries.length === 0) return;
    setEntries((prev) =>
      [...prev, ...paste.entries].sort((a, b) =>
        a.start.localeCompare(b.start)
      )
    );
    setPasteText("");
    showToast(`Added ${paste.entries.length} entries`, "success");
  };

  const updateEntry = (id: string, patch: Partial<OtEntry>) =>
    setEntries((prev) => prev.map((e) => (e.id === id ? { ...e, ...patch } : e)));
  const removeEntry = (id: string) => setEntries((prev) => prev.filter((e) => e.id !== id));

  const save = async () => {
    setSaving(true);
    try {
      const saved = await saveOtPay({ settings, holidays, entries, cutoffRules: rules, cutoffAdjustments: adjustments });
      setSettings(saved.settings);
      setHolidays(saved.holidays ?? []);
      setEntries(saved.entries ?? []);
      setRules(saved.cutoffRules ?? []);
      setAdjustments(saved.cutoffAdjustments ?? []);
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

      {/* BY CUTOFF — each cutoff's own gross and net */}
      {byCutoff.length > 0 && (
        <section className="bg-[var(--bg-surface)] rounded-xl p-4 space-y-2">
          <p className="font-semibold">By cutoff</p>
          <div className="grid grid-cols-[1fr_auto_auto] gap-x-4 gap-y-1 text-xs">
            <span className="text-[var(--text-secondary)]">Cutoff</span>
            <span className="text-right text-[var(--text-secondary)]">Gross</span>
            <span className="text-right text-[var(--text-secondary)]">Net</span>
            {byCutoff.map((c) => (
              <div key={c.label || "unassigned"} className="contents">
                <span className="truncate">
                  {c.label || "Unassigned"} <span className="text-[var(--text-secondary)]">({c.count})</span>
                </span>
                <span className="text-right">{money(c.expectedGross)}</span>
                <span className="text-right font-semibold">{money(c.estimatedNet)}</span>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* ADD ENTRY — four dropdowns */}
      <section className="bg-[var(--bg-surface)] rounded-xl p-4 space-y-3">
        <p className="font-semibold">Add OT</p>
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
        {groupedEntries.map((group) => (
          <div key={group.label || "unassigned"} className="space-y-2">
            <p className="text-xs font-semibold text-[var(--accent)] pt-2">{group.label || "Unassigned"}</p>
        {group.items.map((e) => {
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
                            {l.ranges.length > 0 && (
                              <span className="block text-[10px] text-[var(--text-secondary)]">
                                {l.kind === "NIGHT" ? "night " : ""}({l.ranges.join(", ")})
                              </span>
                            )}
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
                  <div className="flex items-center justify-between">
                    <button onClick={() => setEditingId(e.id)} className="text-xs text-[var(--accent)]">
                      Edit cutoff &amp; day type
                    </button>
                    <button onClick={() => removeEntry(e.id)} className="text-xs text-[var(--danger)]">
                      Remove
                    </button>
                  </div>
                </div>
              )}
            </div>
          );
        })}
          </div>
        ))}
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
                <p className="text-xs text-[var(--text-secondary)]">Automatic cutoffs (by shift start date)</p>
                <button
                  onClick={() => setRules((r) => [...r, { from: isoOf(new Date()), to: isoOf(new Date()), cutoff: "" }])}
                  className="text-xs text-[var(--accent)]"
                >
                  + Add
                </button>
              </div>
              {rules.map((r, i) => (
                <div key={i} className="grid grid-cols-2 gap-2">
                  <input
                    type="date"
                    value={r.from}
                    onChange={(e) => setRules((all) => all.map((x, j) => (j === i ? { ...x, from: e.target.value } : x)))}
                    className={SELECT}
                  />
                  <input
                    type="date"
                    value={r.to}
                    onChange={(e) => setRules((all) => all.map((x, j) => (j === i ? { ...x, to: e.target.value } : x)))}
                    className={SELECT}
                  />
                  <input
                    placeholder="Cutoff name"
                    value={r.cutoff}
                    onChange={(e) => setRules((all) => all.map((x, j) => (j === i ? { ...x, cutoff: e.target.value } : x)))}
                    className={SELECT}
                  />
                  <button onClick={() => setRules((all) => all.filter((_, j) => j !== i))} className="text-xs text-[var(--danger)]">
                    Remove
                  </button>
                </div>
              ))}
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <p className="text-xs text-[var(--text-secondary)]">Cutoff adjustments (payroll amounts not in the shift times)</p>
                <button
                  onClick={() => setAdjustments((a) => [...a, { cutoff: cutoffs[0] ?? "", label: "", gross: 0 }])}
                  className="text-xs text-[var(--accent)]"
                >
                  + Add
                </button>
              </div>
              {adjustments.map((a, i) => (
                <div key={i} className="grid grid-cols-2 gap-2">
                  <select
                    value={a.cutoff}
                    onChange={(e) => setAdjustments((all) => all.map((x, j) => (j === i ? { ...x, cutoff: e.target.value } : x)))}
                    className={SELECT}
                  >
                    {cutoffs.map((c) => (
                      <option key={c} value={c}>
                        {c}
                      </option>
                    ))}
                  </select>
                  <input
                    placeholder="Label"
                    value={a.label}
                    onChange={(e) => setAdjustments((all) => all.map((x, j) => (j === i ? { ...x, label: e.target.value } : x)))}
                    className={SELECT}
                  />
                  <input
                    type="number"
                    placeholder="Gross amount"
                    value={a.gross}
                    onChange={(e) => setAdjustments((all) => all.map((x, j) => (j === i ? { ...x, gross: Number(e.target.value) } : x)))}
                    className={SELECT}
                  />
                  <input
                    type="number"
                    placeholder="Payslip withholding (optional)"
                    value={a.tax ?? ""}
                    onChange={(e) =>
                      setAdjustments((all) =>
                        all.map((x, j) =>
                          j === i ? { ...x, tax: e.target.value === "" ? undefined : Number(e.target.value) } : x
                        )
                      )
                    }
                    className={SELECT}
                  />
                  <button onClick={() => setAdjustments((all) => all.filter((_, j) => j !== i))} className="text-xs text-[var(--danger)]">
                    Remove
                  </button>
                </div>
              ))}
            </div>

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

      {/* ENTRY SETTINGS — cutoff and day type, edited in a modal */}
      <Modal
        open={editingId !== null}
        onClose={() => setEditingId(null)}
        title="Entry settings"
      >
        {(() => {
          const e = entries.find((x) => x.id === editingId);
          if (!e) return null;
          const startDay = e.start.slice(0, 10);
          const autoCutoff = cutoffFor(startDay);
          const autoDay = holidayTypeOn(startDay);
          return (
            <div className="space-y-4 text-sm">
              <p className="text-xs text-[var(--text-secondary)]">
                {fmtDate(startDay)} · {e.start.slice(11)}–{e.end.slice(11)}
              </p>

              <label className="block text-xs text-[var(--text-secondary)]">
                Cutoff
                <select
                  value={e.cutoff === undefined ? "auto" : e.cutoff || "none"}
                  onChange={(ev) => {
                    const v = ev.target.value;
                    updateEntry(e.id, { cutoff: v === "auto" ? undefined : v === "none" ? "" : v });
                  }}
                  className={`${SELECT} mt-1`}
                >
                  <option value="auto">Auto{autoCutoff ? ` (${autoCutoff})` : " (none)"}</option>
                  {cutoffs.map((c) => (
                    <option key={c} value={c}>
                      {c}
                    </option>
                  ))}
                  <option value="none">No cutoff</option>
                </select>
              </label>

              <label className="block text-xs text-[var(--text-secondary)]">
                Day type
                <select
                  value={e.dayType ?? "auto"}
                  onChange={(ev) => {
                    const v = ev.target.value;
                    updateEntry(e.id, { dayType: v === "auto" ? undefined : (v as DayType) });
                  }}
                  className={`${SELECT} mt-1`}
                >
                  <option value="auto">Auto{autoDay ? ` (${DAY_LABEL[autoDay]})` : " (regular)"}</option>
                  <option value="regular">Regular</option>
                  <option value="special">Special holiday</option>
                  <option value="regular_holiday">Regular holiday</option>
                </select>
              </label>

              <div className="flex items-center justify-between pt-2">
                <button
                  onClick={() => {
                    removeEntry(e.id);
                    setEditingId(null);
                  }}
                  className="text-xs text-[var(--danger)]"
                >
                  Remove entry
                </button>
                <button
                  onClick={() => setEditingId(null)}
                  className="bg-[var(--btn-bg)] text-[var(--btn-text)] font-semibold px-4 py-1.5 rounded-lg"
                >
                  Done
                </button>
              </div>
            </div>
          );
        })()}
      </Modal>
    </div>
  );
}
