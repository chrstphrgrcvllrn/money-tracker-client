import { useLayoutEffect, useRef, useState } from "react";

interface SlidingTabsProps<T extends string> {
  tabs: { value: T; label: string }[];
  active: T;
  onChange: (value: T) => void;
  className?: string;
}

// A row of pill tabs with a colored background that slides (rather than
// instantly jumps) to whichever tab is active, measured off the real
// button positions so it works for any number/width of tabs.
export default function SlidingTabs<T extends string>({
  tabs,
  active,
  onChange,
  className = "",
}: SlidingTabsProps<T>) {
  const containerRef = useRef<HTMLDivElement>(null);
  const btnRefs = useRef<Record<string, HTMLButtonElement | null>>({});
  const [pillStyle, setPillStyle] = useState<{ left: number; width: number } | null>(null);

  useLayoutEffect(() => {
    const btn = btnRefs.current[active];
    const container = containerRef.current;
    if (btn && container) {
      setPillStyle({
        left: btn.offsetLeft,
        width: btn.offsetWidth,
      });
    }
  }, [active, tabs.length]);

  return (
    <div ref={containerRef} className={`relative flex gap-2 ${className}`}>
      {pillStyle && (
        <div
          className="absolute top-0 bottom-0 rounded-full bg-[var(--accent-soft)] transition-[left,width] duration-300 ease-out"
          style={{ left: pillStyle.left, width: pillStyle.width }}
        />
      )}

      {tabs.map((tab) => {
        const isActive = tab.value === active;
        return (
          <button
            key={tab.value}
            ref={(el) => {
              btnRefs.current[tab.value] = el;
            }}
            onClick={() => onChange(tab.value)}
            className={`relative z-10 px-3 py-1.5 rounded-full border text-sm transition-colors duration-300 ${
              isActive
                ? "border-transparent text-[var(--accent)] font-semibold"
                : "border-[var(--border-strong)] bg-[var(--bg-page)] text-[var(--text-primary)]"
            }`}
          >
            {tab.label}
          </button>
        );
      })}
    </div>
  );
}
