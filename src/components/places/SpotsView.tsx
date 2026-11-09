import { useState } from "react";
import {
  ChevronDownIcon,
  ChevronUpIcon,
  MapPinIcon,
} from "@heroicons/react/24/outline";
import type { Spot } from "@/types/places.type";
import { normalizeLink } from "@/lib/linkPlatform";
import LinkButton from "./LinkButton";

type Props = {
  spots: Spot[];
  onOpenImages: (images: string[], index: number) => void;
};

function Section({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <p className="text-xs text-[var(--text-secondary)] mb-1">{label}</p>
      {children}
    </div>
  );
}

function SpotCard({
  spot,
  onOpenImages,
}: {
  spot: Spot;
  onOpenImages: Props["onOpenImages"];
}) {
  const [open, setOpen] = useState(false);
  const mapHref = normalizeLink(spot.mapLink);
  return (
    <div className="p-3 rounded-xl bg-[var(--bg-input)]">
      <button
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
        className="w-full flex items-center justify-between gap-2 text-left"
      >
        <span className="text-sm font-semibold">{spot.name}</span>
        {open ? (
          <ChevronUpIcon className="w-4 h-4 shrink-0 text-[var(--text-secondary)]" />
        ) : (
          <ChevronDownIcon className="w-4 h-4 shrink-0 text-[var(--text-secondary)]" />
        )}
      </button>
      {open && (
        <div className="space-y-3 mt-3">
          {spot.images.length > 0 && (
            <div className="flex gap-2 overflow-x-auto -mx-1 px-1">
              {spot.images.map((src, i) => (
                <button
                  key={i}
                  onClick={() => onOpenImages(spot.images, i)}
                  className="shrink-0 w-20 h-20 rounded-lg overflow-hidden"
                >
                  <img
                    src={src}
                    alt=""
                    className="w-full h-full object-cover"
                  />
                </button>
              ))}
            </div>
          )}

          {spot.links.length > 0 && (
            <div className="space-y-2">
              {spot.links.map((link, i) => (
                <div key={i} className="flex">
                  <LinkButton link={link} />
                </div>
              ))}
            </div>
          )}

          {mapHref && (
            <a
              href={mapHref}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 text-sm text-[var(--accent)] font-medium"
            >
              <MapPinIcon className="w-4 h-4 shrink-0" />
              Open in Maps
            </a>
          )}

          {spot.notes && (
            <Section label="Notes">
              <p className="text-sm whitespace-pre-wrap">{spot.notes}</p>
            </Section>
          )}
          {spot.whereToEat && (
            <Section label="Where to eat">
              <p className="text-sm whitespace-pre-wrap">{spot.whereToEat}</p>
            </Section>
          )}
          {spot.hotel && (
            <Section label="Hotel">
              <p className="text-sm whitespace-pre-wrap">{spot.hotel}</p>
            </Section>
          )}
        </div>
      )}
    </div>
  );
}

// Read-only list of a place's sub-locations. Empty sections are skipped so a
// spot with only notes doesn't render five blank headings.
export default function SpotsView({ spots, onOpenImages }: Props) {
  if (spots.length === 0) return null;

  return (
    <div className="space-y-3">
      <p className="text-xs text-[var(--text-secondary)]">
        Spots ({spots.length})
      </p>
      <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-3 items-start">
        {spots.map((spot) => (
          <SpotCard key={spot._id} spot={spot} onOpenImages={onOpenImages} />
        ))}
      </div>
    </div>
  );
}
