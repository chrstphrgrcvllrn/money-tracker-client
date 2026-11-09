import { useState } from "react";
import {
  BuildingOffice2Icon,
  BuildingStorefrontIcon,
  ArrowLeftIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  LightBulbIcon,
  PlayCircleIcon,
  SparklesIcon,
  MapPinIcon,
  PhotoIcon,
} from "@heroicons/react/24/outline";
import type { Spot, SubPlace } from "@/types/places.type";
import { normalizeLink } from "@/lib/linkPlatform";
import LinkButton from "./LinkButton";

type OpenImages = (images: string[], index: number) => void;

// Multi-line text renders as a tidy list (leading "-", "•" or "*" stripped);
// a single line stays a plain paragraph.
function Lines({ text }: { text: string }) {
  const lines = text
    .split("\n")
    .map((l) => l.replace(/^\s*[-•*]\s*/, "").trim())
    .filter(Boolean);
  if (lines.length <= 1) return <p className="text-sm">{lines[0]}</p>;
  return (
    <ul className="space-y-1.5">
      {lines.map((l, i) => (
        <li key={i} className="flex gap-2 text-sm">
          <span className="mt-[7px] w-1.5 h-1.5 rounded-full bg-current opacity-40 shrink-0" />
          <span className="min-w-0 whitespace-pre-wrap">{l}</span>
        </li>
      ))}
    </ul>
  );
}

type SectionKey = "stay" | "do" | "know" | "eat" | "watch";

const SECTIONS: Record<
  SectionKey,
  { label: string; Icon: typeof PhotoIcon; tint: string }
> = {
  stay: {
    label: "Where to stay",
    Icon: BuildingOffice2Icon,
    tint: "text-indigo-400 bg-indigo-500/15",
  },
  do: {
    label: "What we can do",
    Icon: SparklesIcon,
    tint: "text-emerald-400 bg-emerald-500/15",
  },
  know: {
    label: "Things to know",
    Icon: LightBulbIcon,
    tint: "text-amber-400 bg-amber-500/15",
  },
  eat: {
    label: "Where to eat",
    Icon: BuildingStorefrontIcon,
    tint: "text-orange-400 bg-orange-500/15",
  },
  watch: {
    label: "Watch",
    Icon: PlayCircleIcon,
    tint: "text-rose-400 bg-rose-500/15",
  },
};

// Which sections a spot actually has content for, in display order.
const sectionsOf = (spot: Spot): SectionKey[] =>
  (
    [
      spot.hotel && "stay",
      spot.activities && "do",
      spot.notes && "know",
      spot.whereToEat && "eat",
      spot.links.length > 0 && "watch",
    ] as (SectionKey | "" | false)[]
  ).filter(Boolean) as SectionKey[];

// A spot in the list: cover, name, a one-line preview and badges. Tapping it
// opens the full spot view.
function SpotCard({ spot, onOpen }: { spot: Spot; onOpen: () => void }) {
  const cover = spot.images[0];
  const preview =
    spot.activities || spot.notes || spot.hotel || spot.whereToEat;
  const keys = sectionsOf(spot);

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
      <div className="p-3 space-y-2">
        <p className="font-semibold truncate">{spot.name}</p>
        {preview && (
          <p className="text-xs text-[var(--text-secondary)] line-clamp-2">
            {preview}
          </p>
        )}
        {keys.length > 0 && (
          <div className="flex gap-1.5">
            {keys.map((k) => {
              const { Icon, tint, label } = SECTIONS[k];
              return (
                <span
                  key={k}
                  title={label}
                  className={`w-6 h-6 rounded-full flex items-center justify-center ${tint}`}
                >
                  <Icon className="w-3.5 h-3.5" />
                </span>
              );
            })}
          </div>
        )}
      </div>
    </button>
  );
}

function SectionCard({
  k,
  children,
}: {
  k: SectionKey;
  children: React.ReactNode;
}) {
  const { Icon, tint, label } = SECTIONS[k];
  return (
    <section
      id={`spot-${k}`}
      className="rounded-2xl bg-[var(--bg-input)] p-4 scroll-mt-4 mb-3 break-inside-avoid"
    >
      <h4 className="flex items-center gap-2 text-sm font-semibold mb-3">
        <span
          className={`w-7 h-7 rounded-lg flex items-center justify-center ${tint}`}
        >
          <Icon className="w-4 h-4" />
        </span>
        {label}
      </h4>
      {children}
    </section>
  );
}

// Full view of one spot, laid out as a trip guide: photos, a quick-jump bar,
// then Where to stay / What we can do / Things to know / Where to eat / Watch.
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
  const keys = sectionsOf(spot);

  const jump = (k: SectionKey) =>
    document
      .getElementById(`spot-${k}`)
      ?.scrollIntoView({ behavior: "smooth", block: "start" });

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

      {keys.length > 1 && (
        <div className="flex gap-2 overflow-x-auto sticky top-0 z-[5] py-2 -my-2 bg-[var(--bg-surface)]">
          {keys.map((k) => {
            const { Icon, tint, label } = SECTIONS[k];
            return (
              <button
                key={k}
                onClick={() => jump(k)}
                className="shrink-0 flex items-center gap-1.5 pl-1.5 pr-3 py-1 rounded-full bg-[var(--bg-input)] text-sm font-medium"
              >
                <span
                  className={`w-6 h-6 rounded-full flex items-center justify-center ${tint}`}
                >
                  <Icon className="w-3.5 h-3.5" />
                </span>
                {label}
              </button>
            );
          })}
        </div>
      )}

      {keys.length > 0 && (
        <div className="xl:columns-2 gap-3">
          {spot.hotel && (
            <SectionCard k="stay">
              <Lines text={spot.hotel} />
            </SectionCard>
          )}
          {spot.activities && (
            <SectionCard k="do">
              <Lines text={spot.activities} />
            </SectionCard>
          )}
          {spot.notes && (
            <SectionCard k="know">
              <Lines text={spot.notes} />
            </SectionCard>
          )}
          {spot.whereToEat && (
            <SectionCard k="eat">
              <Lines text={spot.whereToEat} />
            </SectionCard>
          )}
          {spot.links.length > 0 && (
            <SectionCard k="watch">
              <div className="grid gap-2 sm:grid-cols-2">
                {spot.links.map((link, i) => (
                  <div key={i} className="flex">
                    <LinkButton link={link} />
                  </div>
                ))}
              </div>
            </SectionCard>
          )}
        </div>
      )}

      {!hero && keys.length === 0 && (
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
