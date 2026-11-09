import { useEffect } from "react";
import { MapPinIcon, PencilSquareIcon, XMarkIcon } from "@heroicons/react/24/outline";
import type { Place } from "@/types/places.type";
import { subPlacesOf } from "./spots";
import LinkButton from "./LinkButton";
import SpotExplorer from "./SpotExplorer";

type Props = {
  place: Place;
  mapsHref: string | null;
  onClose: () => void;
  onEdit: () => void;
  onOpenImages: (images: string[], index: number) => void;
};

function Gallery({ images, onOpen }: { images: string[]; onOpen: (i: number) => void }) {
  if (images.length === 0) return null;
  return (
    <div className="flex gap-2 overflow-x-auto">
      {images.map((src, i) => (
        <button key={i} onClick={() => onOpen(i)} className="shrink-0 w-16 h-16 rounded-xl overflow-hidden">
          <img src={src} alt="" className="w-full h-full object-cover" />
        </button>
      ))}
    </div>
  );
}

// Full-size place sheet. Desktop: a wide two-pane layout — the place itself
// on the left (hero, facts, videos), the places and spots inside it on the
// right, each pane scrolling on its own. Mobile: one scrolling column.
export default function PlaceDetail({ place, mapsHref, onClose, onEdit, onOpenImages }: Props) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  const groups = subPlacesOf(place);
  const hero = place.images[0];
  const spotCount = groups.reduce((n, g) => n + g.spots.length, 0);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm sm:p-4 lg:p-6"
      onMouseDown={(e) => e.target === e.currentTarget && onClose()}
    >
      <div
        role="dialog"
        aria-label={place.title}
        className="relative w-full h-full sm:h-auto sm:max-h-[92vh] lg:h-[90vh] lg:max-w-[1400px] bg-[var(--bg-surface)] sm:rounded-3xl shadow-2xl overflow-y-auto lg:overflow-hidden lg:grid lg:grid-cols-[minmax(320px,400px)_1fr] text-[var(--text-primary)]"
      >
        <div className="absolute top-3 right-3 z-10 flex gap-2">
          <button
            onClick={onEdit}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-black/55 hover:bg-black/70 text-white text-sm font-medium backdrop-blur"
          >
            <PencilSquareIcon className="w-4 h-4" /> Edit
          </button>
          <button
            onClick={onClose}
            aria-label="Close"
            className="w-9 h-9 flex items-center justify-center rounded-full bg-black/55 hover:bg-black/70 text-white backdrop-blur"
          >
            <XMarkIcon className="w-5 h-5" />
          </button>
        </div>

        {/* LEFT — the place itself */}
        <aside className="lg:overflow-y-auto bg-[var(--bg-input)]/50">
          <div className="relative h-56 lg:h-72 bg-[var(--bg-input)]">
            {hero && (
              <button onClick={() => onOpenImages(place.images, 0)} className="absolute inset-0 w-full h-full">
                <img src={hero} alt="" className="w-full h-full object-cover" />
              </button>
            )}
            <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/10 to-transparent pointer-events-none" />
            <div className="absolute bottom-0 left-0 right-0 p-5 text-white pointer-events-none">
              <h2 className="text-2xl font-bold leading-tight">{place.title}</h2>
              <p className="text-sm opacity-80 mt-0.5">
                {groups.length > 0
                  ? `${groups.length} ${groups.length === 1 ? "place" : "places"} · ${spotCount} ${spotCount === 1 ? "spot" : "spots"}`
                  : place.location}
              </p>
            </div>
          </div>

          <div className="p-5 space-y-5">
            <Gallery images={place.images.slice(1)} onOpen={(i) => onOpenImages(place.images, i + 1)} />

            {(place.location || mapsHref) && (
              <div className="flex items-center gap-3">
                <MapPinIcon className="w-5 h-5 shrink-0 text-[var(--text-secondary)]" />
                <span className="text-sm flex-1 min-w-0">{place.location || "No address set"}</span>
                {mapsHref && (
                  <a
                    href={mapsHref}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="shrink-0 px-3 py-1.5 rounded-full bg-[var(--accent)]/15 text-[var(--accent)] text-xs font-semibold"
                  >
                    Open in Maps
                  </a>
                )}
              </div>
            )}

            {place.thingsToKnow && (
              <div className="rounded-xl bg-[var(--accent)]/10 p-3">
                <p className="text-xs font-semibold text-[var(--accent)] mb-1">Good to know</p>
                <p className="text-sm whitespace-pre-wrap">{place.thingsToKnow}</p>
              </div>
            )}

            {place.details && (
              <div>
                <p className="text-xs font-medium text-[var(--text-secondary)] mb-1">About</p>
                <p className="text-sm whitespace-pre-wrap">{place.details}</p>
              </div>
            )}

            {place.specialty && (
              <div>
                <p className="text-xs font-medium text-[var(--text-secondary)] mb-1">Worth trying</p>
                <p className="text-sm mb-2">{place.specialty}</p>
                <Gallery images={place.foodImages} onOpen={(i) => onOpenImages(place.foodImages, i)} />
              </div>
            )}

            {place.links.length > 0 && (
              <div className="space-y-2">
                <p className="text-xs font-medium text-[var(--text-secondary)]">Videos & links</p>
                {place.links.map((link, i) => (
                  <div key={i} className="flex">
                    <LinkButton link={link} />
                  </div>
                ))}
              </div>
            )}
          </div>
        </aside>

        {/* RIGHT — places and spots inside */}
        <main className="lg:overflow-y-auto p-5 lg:p-8 lg:pt-16">
          {groups.length > 0 ? (
            <SpotExplorer key={place._id} subPlaces={groups} onOpenImages={onOpenImages} />
          ) : (
            <div className="h-full min-h-40 flex flex-col items-center justify-center text-center text-[var(--text-secondary)] gap-2">
              <MapPinIcon className="w-8 h-8" />
              <p className="text-sm">No places inside yet.</p>
              <button onClick={onEdit} className="text-sm font-semibold text-[var(--accent)]">
                Add places & spots
              </button>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
