import type { SVGProps } from "react";

// Static, filled motorcycle glyph to sit alongside the Heroicons "solid" set
// (which has no motorbike). The animated outline MotorcycleIcon in
// TrackerIcons.tsx is a different, Tracker-page-only icon.
export default function MotorcycleSolidIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true" {...props}>
      <circle cx="5" cy="16.5" r="3.25" />
      <circle cx="19" cy="16.5" r="3.25" />
      <path
        d="M2.5 11.5H7.5L9 9H13.5L15.5 11.5V14.5H10.5L8.5 16H5Z"
        stroke="currentColor"
        strokeWidth="1"
        strokeLinejoin="round"
      />
      <path
        d="M15.5 6H18L19 16.5"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}
