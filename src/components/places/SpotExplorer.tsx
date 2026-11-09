import { useState } from "react";
import {
  BuildingOffice2Icon,
  BuildingStorefrontIcon,
  ChevronDownIcon,
  DocumentTextIcon,
  MapPinIcon,
  PhotoIcon,
} from "@heroicons/react/24/outline";
import type { Spot, SubPlace } from "@/types/places.type";
import { normalizeLink } from "@/lib/linkPlatform";
import LinkButton from "./LinkButton";

type OpenImages = (images: string[], index: number) => void;

function Block({
  icon: Icon,
  label,
  children,
}: {
  icon: typeof DocumentTextIcon;
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="rounded-xl bg-[var(--bg-surface)] p-3">
      <p className="flex items-center gap-1.5 text-xs font-medium text-[var(--text-secondary)] mb-1">
        <Icon className="w-3.5 h-3.5" />
        {label}
      </p>
      {children}
    </div>
  );
}

// One spot: a compact header (cover thumb, name, tiny badges for what's
// inside) that opens into a photo gallery beside the practical info.
function SpotRow({
  spot,
  open,
  onToggle,
  onOpenImages,
}: {
  spot: Spot;
  open: boolean;
  onToggle: () => void;
  onOpenImages: OpenImages;
}) {
  const mapHref = normalizeLink(spot.mapLink);
  const cover = spot.images[0];
  const badges = [
    spot.images.length > 0 && { Icon: PhotoIcon, text: String(spot.images.length) },
    spot.notes && { Icon: DocumentTextIcon, text: "Notes" },
    spot.whereToEat && { Icon: BuildingStorefrontIcon, text: "Eat" },
    spot.hotel && { Icon: BuildingOffice2Icon, text: "Stay" },
    mapHref && { Icon: MapPinIcon, text: "Map" },
  ].filter(Boolean) as { Icon: typeof PhotoIcon; text: string }[];

  return (
    <div className="rounded-2xl bg-[var(--bg-input)] overflow-hidden">
      <button
        onClick={onToggle}
        aria-expanded={open}
        className="w-full flex items-center gap-3 p-2.5 text-left"
      >
        <div className="w-14 h-14 rounded-xl overflow-hidden shrink-0 bg-[var(--bg-surface)] flex items-center justify-center">
          {cover ? (
            <img src={cover} alt="" className="w-full h-full object-cover" />
          ) : (
            <MapPinIcon className="w-5 h-5 text-[var(--text-secondary)]" />
          )}
        </div>
        <div className="min-w-0 flex-1">
          <p className="font-semibold truncate">{spot.name}</p>
          <div className="flex flex-wrap gap-x-3 gap-y-0.5 mt-0.5">
            {badges.map(({ Icon, text }) => (
              <span key={text} className="flex items-center gap-1 text-xs text-[var(--text-secondary)]">
                <Icon className="w-3.5 h-3.5" />
                {text}
              </span>
            ))}
          </div>
        </div>
        <ChevronDownIcon
          className={`w-5 h-5 shrink-0 mr-1 text-[var(--text-secondary)] transition-transform ${open ? "rotate-180" : ""}`}
        />
      </button>

      {open && (
        <div className="px-2.5 pb-2.5 grid gap-3 xl:grid-cols-2">
          {spot.images.length > 0 && (
            <div className="grid grid-cols-2 gap-2 content-start">
              {spot.images.map((src, i) => (
                <button
                  key={i}
                  onClick={() => onOpenImages(spot.images, i)}
                  className={`rounded-xl overflow-hidden bg-[var(--bg-surface)] ${
                    i === 0 && spot.images.length % 2 === 1 ? "col-span-2 aspect-video" : "aspect-square"
                  }`}
                >
                  <img src={src} alt="" className="w-full h-full object-cover hover:scale-105 transition-transform" />
                </button>
              ))}
            </div>
          )}

          <div className="space-y-2 content-start">
            {mapHref && (
              <a
                href={mapHref}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-center gap-2 px-3 py-2 rounded-xl bg-[var(--accent)]/15 text-[var(--accent)] text-sm font-semibold"
              >
                <MapPinIcon className="w-4 h-4" />
                Open in Maps
              </a>
            )}
            {spot.notes && (
              <Block icon={DocumentTextIcon} label="Notes">
                <p className="text-sm whitespace-pre-wrap">{spot.notes}</p>
              </Block>
            )}
            {spot.whereToEat && (
              <Block icon={BuildingStorefrontIcon} label="Where to eat">
                <p className="text-sm whitespace-pre-wrap">{spot.whereToEat}</p>
              </Block>
            )}
            {spot.hotel && (
              <Block icon={BuildingOffice2Icon} label="Hotel">
                <p className="text-sm whitespace-pre-wrap">{spot.hotel}</p>
              </Block>
            )}
            {spot.links.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {spot.links.map((link, i) => (
                  <div key={i} className="flex min-w-[8rem] flex-1">
                    <LinkButton link={link} />
                  </div>
                ))}
              </div>
            )}
            {!spot.notes && !spot.whereToEat && !spot.hotel && !mapHref && spot.links.length === 0 && spot.images.length === 0 && (
              <p className="text-sm text-[var(--text-secondary)]">Nothing added yet.</p>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

// The "inside this country" explorer: chips to switch between the places
// inside (Sapa, Hanoi…), then an accordion of that place's spots.
export default function SpotExplorer({
  subPlaces,
  onOpenImages,
}: {
  subPlaces: SubPlace[];
  onOpenImages: OpenImages;
}) {
  const [active, setActive] = useState(0);
  const [openIds, setOpenIds] = useState<Set<string>>(() => new Set(subPlaces[0]?.spots[0] ? [subPlaces[0].spots[0]._id] : []));

  if (subPlaces.length === 0) return null;
  const current = subPlaces[Math.min(active, subPlaces.length - 1)];
  const allOpen = current.spots.length > 0 && current.spots.every((s) => openIds.has(s._id));

  const toggle = (id: string) =>
    setOpenIds((prev) => {
      const next = new Set(prev);
      if (!next.delete(id)) next.add(id);
      return next;
    });
  const setAll = (open: boolean) =>
    setOpenIds((prev) => {
      const next = new Set(prev);
      current.spots.forEach((s) => (open ? next.add(s._id) : next.delete(s._id)));
      return next;
    });

  return (
    <section>
      <div className="flex items-center gap-2 overflow-x-auto pb-1 -mx-1 px-1">
        {subPlaces.map((sp, i) => (
          <button
            key={sp._id}
            onClick={() => setActive(i)}
            className={`shrink-0 px-4 py-1.5 rounded-full text-sm font-semibold transition ${
              sp === current
                ? "bg-[var(--btn-bg)] text-[var(--btn-text)]"
                : "bg-[var(--bg-input)] text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
            }`}
          >
            {sp.name}
            <span className="ml-1.5 opacity-60">{sp.spots.length}</span>
          </button>
        ))}
      </div>

      <div className="flex items-center justify-between mt-4 mb-3">
        <h3 className="text-sm font-semibold text-[var(--text-secondary)]">
          {current.spots.length} {current.spots.length === 1 ? "spot" : "spots"} in {current.name}
        </h3>
        {current.spots.length > 1 && (
          <button onClick={() => setAll(!allOpen)} className="text-xs font-medium text-[var(--accent)]">
            {allOpen ? "Collapse all" : "Expand all"}
          </button>
        )}
      </div>

      {current.spots.length === 0 ? (
        <p className="text-sm text-[var(--text-secondary)] py-6 text-center">No spots added to {current.name} yet.</p>
      ) : (
        <div className="space-y-2.5">
          {current.spots.map((spot) => (
            <SpotRow
              key={spot._id}
              spot={spot}
              open={openIds.has(spot._id)}
              onToggle={() => toggle(spot._id)}
              onOpenImages={onOpenImages}
            />
          ))}
        </div>
      )}
    </section>
  );
}
