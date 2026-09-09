import type { SVGProps } from "react";

/**
 * Shared keyframes for the animated tracker category icons below.
 * Render <TrackerIconStyles /> once per page that uses these icons.
 */
export function TrackerIconStyles() {
  return (
    <style>{`
      @keyframes tracker-pulse-draw {
        0% { stroke-dashoffset: 60; }
        50% { stroke-dashoffset: 0; }
        100% { stroke-dashoffset: -60; }
      }
      .tracker-icon-medical .pulse-path {
        stroke-dasharray: 60;
        animation: tracker-pulse-draw 2.2s ease-in-out infinite;
      }

      @keyframes tracker-sparkle {
        0%, 100% { opacity: 0; transform: scale(0.4); }
        50% { opacity: 1; transform: scale(1); }
      }
      .tracker-icon-dental .sparkle {
        transform-origin: center;
        animation: tracker-sparkle 1.8s ease-in-out infinite;
      }

      @keyframes tracker-spin {
        to { transform: rotate(360deg); }
      }
      .tracker-icon-motorcycle .spin-spokes {
        transform-origin: 12px 12px;
        animation: tracker-spin 3.5s linear infinite;
      }

      @keyframes tracker-coinflip {
        0%, 100% { transform: scaleX(1); }
        50% { transform: scaleX(0.15); }
      }
      .tracker-icon-crypto .coin-flip {
        transform-origin: 12px 12px;
        animation: tracker-coinflip 2.4s ease-in-out infinite;
      }

      @keyframes tracker-barpulse {
        0%, 100% { opacity: 0.3; }
        50% { opacity: 1; }
      }
      .tracker-icon-digital .bar1 { animation: tracker-barpulse 1.4s ease-in-out infinite; }
      .tracker-icon-digital .bar2 { animation: tracker-barpulse 1.4s ease-in-out 0.2s infinite; }
      .tracker-icon-digital .bar3 { animation: tracker-barpulse 1.4s ease-in-out 0.4s infinite; }

      @keyframes tracker-roofglow {
        0%, 100% { opacity: 0.55; }
        50% { opacity: 1; }
      }
      .tracker-icon-amilyar .roof {
        transform-origin: 12px 8px;
        animation: tracker-roofglow 2.4s ease-in-out infinite;
      }
    `}</style>
  );
}

type IconProps = SVGProps<SVGSVGElement>;

const baseProps: IconProps = {
  viewBox: "0 0 24 24",
  fill: "none",
  stroke: "currentColor",
  strokeWidth: 1.5,
  strokeLinecap: "round",
  strokeLinejoin: "round",
};

export function MedicalIcon(props: IconProps) {
  return (
    <svg {...baseProps} {...props} className={`tracker-icon-medical ${props.className || ""}`}>
      <path className="pulse-path" d="M2 12h4l2-7 4 14 2-7h4l2 3h4" />
    </svg>
  );
}

export function DentalIcon(props: IconProps) {
  return (
    <svg {...baseProps} {...props} className={`tracker-icon-dental ${props.className || ""}`}>
      <path d="M12 3c-2 0-3 1.5-4.5 1.5S5 3.5 4 4.5c-1.5 1.5-1 5 .5 8 1 2 1 6 2.5 6s1.5-4 2-5.5c.3-1 .7-1.5 1-1.5s.7.5 1 1.5c.5 1.5.5 5.5 2 5.5s1.5-4 2.5-6c1.5-3 2-6.5.5-8-1-1-2.5-.5-3.5-1.5C15 4.5 14 3 12 3z" />
      <circle className="sparkle" cx="17" cy="5.5" r="0.9" fill="currentColor" stroke="none" />
    </svg>
  );
}

export function MotorcycleIcon(props: IconProps) {
  return (
    <svg {...baseProps} {...props} className={`tracker-icon-motorcycle ${props.className || ""}`}>
      <circle cx="12" cy="12" r="7" />
      <g className="spin-spokes">
        <line x1="12" y1="5" x2="12" y2="19" />
        <line x1="5" y1="12" x2="19" y2="12" />
        <line x1="7" y1="7" x2="17" y2="17" />
        <line x1="17" y1="7" x2="7" y2="17" />
      </g>
    </svg>
  );
}

export function CryptoIcon(props: IconProps) {
  return (
    <svg {...baseProps} {...props} className={`tracker-icon-crypto ${props.className || ""}`}>
      <g className="coin-flip">
        <circle cx="12" cy="12" r="8" />
        <path d="M9 9c0-1 1.2-1.5 3-1.5s3 .6 3 1.4-1.1 1.1-3 1.6-3 .7-3 1.6 1.2 1.4 3 1.4 3-.5 3-1.5" />
        <line x1="12" y1="5.7" x2="12" y2="7.3" />
        <line x1="12" y1="16.7" x2="12" y2="18.3" />
      </g>
    </svg>
  );
}

export function DigitalIcon(props: IconProps) {
  return (
    <svg {...baseProps} {...props} className={`tracker-icon-digital ${props.className || ""}`}>
      <line className="bar1" x1="6" y1="17" x2="6" y2="14" />
      <line className="bar2" x1="12" y1="17" x2="12" y2="10" />
      <line className="bar3" x1="18" y1="17" x2="18" y2="6" />
    </svg>
  );
}

export function AmilyarIcon(props: IconProps) {
  return (
    <svg {...baseProps} {...props} className={`tracker-icon-amilyar ${props.className || ""}`}>
      <path className="roof" d="M4 11l8-6 8 6" />
      <path d="M6 10v9h12v-9" />
      <line x1="10" y1="19" x2="10" y2="14" />
      <line x1="14" y1="19" x2="14" y2="14" />
    </svg>
  );
}
