import { useCallback, useEffect, useRef, useState } from "react";
import { MinusIcon, PlusIcon } from "@heroicons/react/24/solid";
import Modal from "./Modal";
import DropletSolidIcon from "./icons/DropletSolidIcon";
import { SkeletonBlock } from "./Skeleton";
import { useToast } from "./useToast";
import { adjustWater, getWaterLogs } from "../api/water";
import type { WaterLog } from "../types/water.type";

const DAILY_GOAL = 8; // glasses
const ML_PER_GLASS = 250;
const HISTORY_DAYS = 7;

const toKey = (d: Date) =>
  `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;

const dayLabel = (daysAgo: number, d: Date) => {
  if (daysAgo === 0) return "Today";
  if (daysAgo === 1) return "Yesterday";
  return d.toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" });
};

function WaterBody() {
  const showToast = useToast();

  const [logs, setLogs] = useState<WaterLog[]>([]);
  const [loading, setLoading] = useState(true);

  // Taps update the UI immediately; this counts requests still in flight so
  // only the last response is applied (earlier ones would show stale totals).
  const pending = useRef(0);

  const load = useCallback(async () => {
    try {
      setLogs(await getWaterLogs());
    } catch (error) {
      console.error("Failed to load water logs:", error);
      showToast("Failed to load water log", "error");
    } finally {
      setLoading(false);
    }
  }, [showToast]);

  useEffect(() => {
    load();
  }, [load]);

  const todayKey = toKey(new Date());
  const glassesFor = (key: string) => logs.find((l) => l.date === key)?.glasses ?? 0;
  const todayGlasses = glassesFor(todayKey);

  const handleAdjust = async (delta: 1 | -1) => {
    if (delta === -1 && todayGlasses === 0) return;

    // Optimistic update.
    setLogs((prev) => {
      const exists = prev.some((l) => l.date === todayKey);
      if (!exists) return [{ date: todayKey, glasses: 1 }, ...prev];
      return prev.map((l) =>
        l.date === todayKey ? { ...l, glasses: Math.max(0, l.glasses + delta) } : l
      );
    });

    pending.current += 1;
    try {
      const saved = await adjustWater(todayKey, delta);
      pending.current -= 1;
      if (pending.current === 0) {
        setLogs((prev) => prev.map((l) => (l.date === todayKey ? { ...l, ...saved } : l)));
      }
    } catch (error) {
      pending.current -= 1;
      console.error("Failed to update water log:", error);
      showToast("Failed to update water log", "error");
      load(); // drop the optimistic change and re-sync with the server
    }
  };

  if (loading) {
    return (
      <div className="space-y-4">
        <SkeletonBlock className="h-24 w-full rounded-xl" />
        <SkeletonBlock className="h-12 w-full rounded-full" />
        <SkeletonBlock className="h-40 w-full rounded-xl" />
      </div>
    );
  }

  const history = Array.from({ length: HISTORY_DAYS }).map((_, i) => {
    const d = new Date();
    d.setDate(d.getDate() - i);
    return { label: dayLabel(i, d), glasses: glassesFor(toKey(d)) };
  });
  const average = history.reduce((sum, h) => sum + h.glasses, 0) / HISTORY_DAYS;
  const goalReached = todayGlasses >= DAILY_GOAL;

  return (
    <div className="space-y-5">
      {/* TODAY */}
      <div className="bg-[var(--bg-page)] rounded-xl p-4 text-center space-y-3">
        <div>
          <span className="text-5xl font-bold text-[var(--text-primary)]">{todayGlasses}</span>
          <span className="text-[var(--text-secondary)]"> / {DAILY_GOAL} glasses</span>
        </div>

        <div className="flex justify-center gap-1.5" aria-hidden="true">
          {Array.from({ length: DAILY_GOAL }).map((_, i) => (
            <DropletSolidIcon
              key={i}
              className={`w-6 h-6 ${
                i < todayGlasses ? "text-[var(--accent)]" : "text-[var(--avatar-bg)]"
              }`}
            />
          ))}
        </div>

        <p className="text-xs text-[var(--text-secondary)]">
          ≈ {(todayGlasses * ML_PER_GLASS).toLocaleString()} ml
          {goalReached && (
            <span className="text-[var(--accent)] font-semibold">
              {" "}
              · Goal reached{todayGlasses > DAILY_GOAL ? ` (+${todayGlasses - DAILY_GOAL})` : ""}
            </span>
          )}
        </p>
      </div>

      {/* CONTROLS */}
      <div className="flex items-center gap-3">
        <button
          onClick={() => handleAdjust(-1)}
          disabled={todayGlasses === 0}
          aria-label="Remove a glass"
          className="shrink-0 w-12 h-12 rounded-full flex items-center justify-center bg-[var(--bg-input)] text-[var(--text-primary)] disabled:opacity-40"
        >
          <MinusIcon className="w-5 h-5" />
        </button>

        <button
          onClick={() => handleAdjust(1)}
          className="flex-1 h-12 rounded-full flex items-center justify-center gap-2 bg-[var(--btn-bg)] text-[var(--btn-text)] font-semibold"
        >
          <PlusIcon className="w-5 h-5" />
          Add a glass
        </button>
      </div>

      {/* HISTORY */}
      <div>
        <div className="flex items-baseline justify-between mb-1">
          <h3 className="text-sm font-semibold text-[var(--text-primary)]">Last 7 days</h3>
          <span className="text-[11px] text-[var(--text-secondary)]">
            Avg {average.toFixed(1)} / day
          </span>
        </div>

        {history.map((h, idx) => (
          <div
            key={h.label}
            className={`flex items-center justify-between gap-3 py-2.5 ${
              idx !== history.length - 1 ? "border-b border-[var(--border-subtle)]" : ""
            }`}
          >
            <span className="text-sm text-[var(--text-primary)]">{h.label}</span>

            <div className="flex items-center gap-3">
              <div className="flex gap-[3px]" aria-hidden="true">
                {Array.from({ length: DAILY_GOAL }).map((_, i) => (
                  <span
                    key={i}
                    className={`w-1.5 h-1.5 rounded-full ${
                      i < h.glasses ? "bg-[var(--accent)]" : "bg-[var(--avatar-bg)]"
                    }`}
                  />
                ))}
              </div>
              <span
                className={`w-10 text-right text-sm ${
                  h.glasses >= DAILY_GOAL
                    ? "text-[var(--accent)] font-semibold"
                    : "text-[var(--text-secondary)]"
                }`}
              >
                {h.glasses}
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

interface WaterModalProps {
  open: boolean;
  onClose: () => void;
}

// The body is only mounted while the modal is open, so each open re-fetches.
export default function WaterModal({ open, onClose }: WaterModalProps) {
  return (
    <Modal open={open} onClose={onClose} title="Water">
      <WaterBody />
    </Modal>
  );
}
