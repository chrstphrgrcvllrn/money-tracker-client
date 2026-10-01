import type { SVGProps } from "react";

// Static, filled thumbtack glyph (Heroicons only has MapPinIcon, a location
// marker, not a pin/tack for "pinned" items).
export default function PinSolidIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true" {...props}>
      <g transform="rotate(45 12 12)">
        <path d="M14.5 2.5a1 1 0 0 1 1 1v5.1c1.3.6 2.2 1.9 2.2 3.4H6.3c0-1.5.9-2.8 2.2-3.4V3.5a1 1 0 0 1 1-1h5Z" />
        <rect x="11" y="14.2" width="2" height="8.3" rx="1" />
      </g>
    </svg>
  );
}
