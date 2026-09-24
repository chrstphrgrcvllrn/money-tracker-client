import type { SVGProps } from "react";

// Static, filled fork-and-knife glyph (Heroicons has no food icon).
export default function FoodSolidIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true" {...props}>
      <path d="M4 2h1.4v6.5h.9V2h1.4v6.5h.9V2H10v7.5a3 3 0 0 1-2.3 2.9V22H6.3V12.4A3 3 0 0 1 4 9.5V2z" />
      <path d="M18.5 2v20h-2.3V12.5H15V8c0-3.5 1.3-6 3.5-6z" />
    </svg>
  );
}
