// Shared loading-skeleton primitives. Kept intentionally simple —
// Tailwind's animate-pulse on a surface-colored block — so every page
// gets a consistent placeholder shape instead of a blank screen or a
// plain "Loading..." string while its first fetch is in flight.

export function SkeletonBlock({ className = "" }: { className?: string }) {
  return <div className={`animate-pulse bg-[var(--bg-surface)] rounded ${className}`} />;
}

// Mirrors the icon-box + two-line-text + trailing-value row used across
// most list pages (Loans, Buy List, Notes, Tracker entries, etc.).
export function SkeletonRow({ withValue = true }: { withValue?: boolean }) {
  return (
    <div className="w-full flex items-center gap-3 py-3">
      <SkeletonBlock className="shrink-0 w-9 h-9 rounded-lg" />
      <div className="flex-1 min-w-0 space-y-2">
        <SkeletonBlock className="h-3.5 w-2/3" />
        <SkeletonBlock className="h-2.5 w-1/3" />
      </div>
      {withValue && <SkeletonBlock className="shrink-0 h-3.5 w-12" />}
    </div>
  );
}

export function SkeletonRows({
  count = 5,
  withValue = true,
  divided = true,
}: {
  count?: number;
  withValue?: boolean;
  divided?: boolean;
}) {
  return (
    <div>
      {Array.from({ length: count }).map((_, i) => (
        <div
          key={i}
          className={divided && i !== count - 1 ? "border-b border-[var(--border-subtle)]" : ""}
        >
          <SkeletonRow withValue={withValue} />
        </div>
      ))}
    </div>
  );
}

// A bigger surface-colored block for card-shaped sections (Salary
// entries, House/Bills month cards, Notebook grid tiles).
export function SkeletonCard({ className = "h-40" }: { className?: string }) {
  return <div className={`animate-pulse bg-[var(--bg-surface)] rounded-xl ${className}`} />;
}

export function SkeletonCards({ count = 2, className = "h-40" }: { count?: number; className?: string }) {
  return (
    <div className="space-y-4">
      {Array.from({ length: count }).map((_, i) => (
        <SkeletonCard key={i} className={className} />
      ))}
    </div>
  );
}

// A chat-bubble-shaped placeholder for Thoughts, alternating sides like
// the real messages do.
export function SkeletonBubbles({ count = 4 }: { count?: number }) {
  return (
    <div className="px-4">
      {Array.from({ length: count }).map((_, i) => {
        const isRight = i % 2 === 1;
        return (
          <div key={i} className={`flex mb-3 ${isRight ? "justify-end" : "justify-start"}`}>
            <SkeletonBlock
              className={`h-9 ${i % 3 === 0 ? "w-40" : i % 3 === 1 ? "w-56" : "w-32"} ${
                isRight ? "rounded-2xl rounded-br-md" : "rounded-2xl rounded-bl-md"
              }`}
            />
          </div>
        );
      })}
    </div>
  );
}

// A single card-shaped placeholder matching the Savings swipe deck's
// 3:5 portrait card.
export function SkeletonSavingsCard() {
  return (
    <div className="flex-1 min-h-0 flex items-center justify-center px-6">
      <SkeletonBlock className="h-full aspect-[3/5] rounded-2xl" />
    </div>
  );
}
