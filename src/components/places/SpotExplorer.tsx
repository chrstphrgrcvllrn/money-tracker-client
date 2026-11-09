import { useState } from "react";
import {
  BuildingOffice2Icon,
  BuildingStorefrontIcon,
  ArrowLeftIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
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

// A spot in the list: cover, name, a one-line preview and badges. Tapping it
// opens the full spot view.
function SpotCard({ spot, onOpen }: { spot: Spot; onOpen: () => void }) {
  const mapHref = normalizeLink(spot.mapLink);
  const cover = spot.images[0];
  const preview = spot.notes || spot.whereToEat || spot.hotel;
  const badges = [
    spot.images.length > 0 && {
      Icon: PhotoIcon,
      text: String(spot.images.length),
    },
    spot.notes && { Icon: DocumentTextIcon, text: "Notes" },
    spot.whereToEat && { Icon: BuildingStorefrontIcon, text: "Eat" },
    spot.hotel && { Icon: BuildingOffice2Icon, text: "Stay" },
    mapHref && { Icon: MapPinIcon, text: "Map" },
  ].filter(Boolean) as { Icon: typeof PhotoIcon; text: string }[];

  return (
    <button
      onClick={onOpen}
      className="group text-left rounded-2xl bg-[var(--bg-input)] overflow-hidden flex flex-col hover:brightness-110 transition"
    >
      <div className="aspect-[16/10] bg-[var(--bg-surface)] flex items-center justify-center overflow-hidden">
        {cover ? (
          <img
            src={cover}
            alt=""
            className="w-full h-full object-cover group-hover:scale-105 transition-transform"
          />
        ) : (
          <MapPinIcon className="w-7 h-7 text-[var(--text-secondary)]" />
        )}
      </div>
      <div className="p-3 space-y-1.5">
        <p className="font-semibold truncate">{spot.name}</p>
        {preview && (
          <p className="text-xs text-[var(--text-secondary)] line-clamp-2">
            {preview}
          </p>
        )}
        <div className="flex flex-wrap gap-x-3 gap-y-0.5">
          {badges.map(({ Icon, text }) => (
            <span
              key={text}
              className="flex items-center gap-1 text-xs text-[var(--text-secondary)]"
            >
              <Icon className="w-3.5 h-3.5" />
              {text}
            </span>
          ))}
        </div>
      </div>
    </button>
  );
}

// Full view of one spot: gallery up top, then the practical info as cards.
function SpotDetail({
  spot,
  placeName,
  index,
  total,
  onBack,
  onStep,
  onOpenImages,
}: {
  spot: Spot;
  placeName: string;
  index: number;
  total: number;
  onBack: () => void;
  onStep: (delta: number) => void;
  onOpenImages: OpenImages;
}) {
  const mapHref = normalizeLink(spot.mapLink);
  const [hero, ...rest] = spot.images;
  const hasInfo = spot.notes || spot.whereToEat || spot.hotel;

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between gap-2">
        <button
          onClick={onBack}
          className="flex items-center gap-1.5 text-sm font-medium text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
        >
          <ArrowLeftIcon className="w-4 h-4" /> {placeName}
        </button>
        {total > 1 && (
          <div className="flex items-center gap-1 text-xs text-[var(--text-secondary)]">
            <button
              onClick={() => onStep(-1)}
              disabled={index === 0}
              aria-label="Previous spot"
              className="w-8 h-8 flex items-center justify-center rounded-full bg-[var(--bg-input)] disabled:opacity-30"
            >
              <ChevronLeftIcon className="w-4 h-4" />
            </button>
            <span className="px-1 tabular-nums">
              {index + 1} / {total}
            </span>
            <button
              onClick={() => onStep(1)}
              disabled={index === total - 1}
              aria-label="Next spot"
              className="w-8 h-8 flex items-center justify-center rounded-full bg-[var(--bg-input)] disabled:opacity-30"
            >
              <ChevronRightIcon className="w-4 h-4" />
            </button>
          </div>
        )}
      </div>

      <div className="flex items-start justify-between gap-3">
        <h3 className="text-2xl font-bold leading-tight">{spot.name}</h3>
        {mapHref && (
          <a
            href={mapHref}
            target="_blank"
            rel="noopener noreferrer"
            className="shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-[var(--accent)]/15 text-[var(--accent)] text-sm font-semibold"
          >
            <MapPinIcon className="w-4 h-4" />
            Open in Maps
          </a>
        )}
      </div>

      {hero && (
        <div className="grid grid-cols-4 gap-2">
          <button
            onClick={() => onOpenImages(spot.images, 0)}
            className={`rounded-2xl overflow-hidden bg-[var(--bg-input)] aspect-video ${
              rest.length > 0
                ? "col-span-4 md:col-span-3 md:row-span-2 md:aspect-auto md:min-h-64"
                : "col-span-4"
            }`}
          >
            <img src={hero} alt="" className="w-full h-full object-cover" />
          </button>
          {rest.map((src, i) => (
            <button
              key={i}
              onClick={() => onOpenImages(spot.images, i + 1)}
              className="rounded-xl overflow-hidden bg-[var(--bg-input)] aspect-square md:col-span-1 col-span-2"
            >
              <img
                src={src}
                alt=""
                className="w-full h-full object-cover hover:scale-105 transition-transform"
              />
            </button>
          ))}
        </div>
      )}

      {hasInfo && (
        <div className="grid gap-3 md:grid-cols-2 items-start">
          {spot.notes && (
            <div className="md:col-span-2">
              <Block icon={DocumentTextIcon} label="Notes">
                <p className="text-sm whitespace-pre-wrap">{spot.notes}</p>
              </Block>
            </div>
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
        </div>
      )}

      {spot.links.length > 0 && (
        <div className="space-y-2">
          <p className="text-xs font-medium text-[var(--text-secondary)]">
            Videos & links
          </p>
          <div className="flex flex-wrap gap-2">
            {spot.links.map((link, i) => (
              <div key={i} className="flex min-w-[8rem] flex-1 max-w-xs">
                <LinkButton link={link} />
              </div>
            ))}
          </div>
        </div>
      )}

      {!hero && !hasInfo && !mapHref && spot.links.length === 0 && (
        <p className="text-sm text-[var(--text-secondary)]">
          Nothing added to this spot yet.
        </p>
      )}
    </div>
  );
}

// The "inside this country" explorer: pills switch between the places inside
// (Sapa, Hanoi…), a card grid lists that place's spots, and a spot opens into
// its own full view.
export default function SpotExplorer({
  subPlaces,
  onOpenImages,
}: {
  subPlaces: SubPlace[];
  onOpenImages: OpenImages;
}) {
  const [active, setActive] = useState(0);
  const [spotId, setSpotId] = useState<string | null>(null);

  if (subPlaces.length === 0) return null;
  const current = subPlaces[Math.min(active, subPlaces.length - 1)];
  const spotIndex = current.spots.findIndex((s) => s._id === spotId);

  if (spotIndex >= 0) {
    return (
      <SpotDetail
        key={current.spots[spotIndex]._id}
        spot={current.spots[spotIndex]}
        placeName={current.name}
        index={spotIndex}
        total={current.spots.length}
        onBack={() => setSpotId(null)}
        onStep={(d) => setSpotId(current.spots[spotIndex + d]._id)}
        onOpenImages={onOpenImages}
      />
    );
  }

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

      <h3 className="text-sm font-semibold text-[var(--text-secondary)] mt-4 mb-3">
        {current.spots.length} {current.spots.length === 1 ? "spot" : "spots"}{" "}
        in {current.name}
      </h3>

      {current.spots.length === 0 ? (
        <p className="text-sm text-[var(--text-secondary)] py-6 text-center">
          No spots added to {current.name} yet.
        </p>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
          {current.spots.map((spot) => (
            <SpotCard
              key={spot._id}
              spot={spot}
              onOpen={() => setSpotId(spot._id)}
            />
          ))}
        </div>
      )}
    </section>
  );
}
