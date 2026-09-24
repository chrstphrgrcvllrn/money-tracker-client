import type { SVGProps } from "react";

// Static, filled capsule-pill glyph (Heroicons has no pill).
export default function PillSolidIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true" {...props}>
      <g transform="rotate(-45 12 12)"><path d="M7 7.5h4.25v9H7a4.5 4.5 0 0 1 0-9z"/><path d="M12.75 7.5H17a4.5 4.5 0 0 1 0 9h-4.25z"/></g>
    </svg>
  );
}
