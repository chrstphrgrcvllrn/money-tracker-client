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
  PencilSquareIcon,
  PhotoIcon,
  PlusIcon,
  TrashIcon,
} from "@heroicons/react/24/outline";
import type { Spot, SubPlace, SubPlaceInput } from "@/types/places.type";
import { useToast } from "@/components/useToast";
import {
  newSpot,
  subPlacesToInput,
  toEditableSpot,
  type EditableSpot,
} from "./spots";
import { SpotForm } from "./SpotsEditor";
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
  onEdit,
  onOpenImages,
}: {
  spot: Spot;
  placeName: string;
  index: number;
  total: number;
  onBack: () => void;
  onStep: (delta: number) => void;
  onEdit: () => void;
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
        <div className="shrink-0 flex items-center gap-2">
          <button
            onClick={onEdit}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-[var(--bg-input)] text-sm font-semibold"
          >
            <PencilSquareIcon className="w-4 h-4" />
            Edit
          </button>
          {mapHref && (
            <a
              href={mapHref}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-[var(--accent)]/15 text-[var(--accent)] text-sm font-semibold"
            >
              <MapPinIcon className="w-4 h-4" />
              Open in Maps
            </a>
          )}
        </div>
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
  onSave,
}: {
  subPlaces: SubPlace[];
  onOpenImages: OpenImages;
  onSave: (subPlaces: SubPlaceInput[]) => Promise<void>;
}) {
  const showToast = useToast();
  const [active, setActive] = useState(0);
  const [spotId, setSpotId] = useState<string | null>(null);
  // Editing a spot in place: `id` is null while adding a new one.
  const [editing, setEditing] = useState<{
    id: string | null;
    draft: EditableSpot;
  } | null>(null);
  const [saving, setSaving] = useState(false);

  // Adding or renaming a place inside the country, inline in the pill row.
  const [placeEdit, setPlaceEdit] = useState<{
    mode: "add" | "rename";
    value: string;
  } | null>(null);

  const activeIdx = Math.min(active, Math.max(subPlaces.length - 1, 0));
  const current: SubPlace | undefined = subPlaces[activeIdx];
  const spotIndex = current
    ? current.spots.findIndex((s) => s._id === spotId)
    : -1;

  const savePlaces = async (input: SubPlaceInput[], okMsg: string) => {
    setSaving(true);
    try {
      await onSave(input);
      showToast(okMsg, "success");
      return true;
    } catch (err) {
      console.error(err);
      showToast("Failed to save", "error");
      return false;
    } finally {
      setSaving(false);
    }
  };

  const submitPlaceEdit = async () => {
    if (!placeEdit) return;
    const name = placeEdit.value.trim();
    if (!name) return;
    const input = subPlacesToInput(subPlaces);
    if (placeEdit.mode === "add") {
      input.push({ name, spots: [] });
      if (await savePlaces(input, "Place added!")) {
        setActive(input.length - 1);
        setPlaceEdit(null);
      }
    } else {
      input[activeIdx] = { ...input[activeIdx], name };
      if (await savePlaces(input, "Place renamed!")) setPlaceEdit(null);
    }
  };

  const deletePlace = async () => {
    if (!current) return;
    const n = current.spots.length;
    if (
      !confirm(
        `Delete "${current.name}"${n ? ` and its ${n} ${n === 1 ? "spot" : "spots"}` : ""}? This can't be undone.`,
      )
    )
      return;
    const input = subPlacesToInput(subPlaces).filter((_, i) => i !== activeIdx);
    if (await savePlaces(input, "Place deleted!")) {
      setActive(0);
      setSpotId(null);
    }
  };

  // Persist the whole sub-place list with this place's spots replaced.
  const persist = async (nextSpots: SubPlaceInput["spots"]) => {
    if (!current) return false;
    const input = subPlacesToInput(subPlaces);
    input[activeIdx] = { ...input[activeIdx], spots: nextSpots };
    setSaving(true);
    try {
      await onSave(input);
      return true;
    } catch (err) {
      console.error(err);
      showToast("Failed to save spot", "error");
      return false;
    } finally {
      setSaving(false);
    }
  };

  const saveEditing = async () => {
    if (!editing) return;
    const { draft, id } = editing;
    if (!draft.name.trim()) {
      showToast("Please give the spot a name", "error");
      return;
    }
    let mapLink = "";
    if (draft.mapLink.trim()) {
      const normalized = normalizeLink(draft.mapLink);
      if (!normalized) {
        showToast("That Google Maps link doesn't look valid", "error");
        return;
      }
      mapLink = normalized;
    }
    const { uid: _uid, ...rest } = draft;
    void _uid;
    const spot = { ...rest, name: draft.name.trim(), mapLink };
    const existing = subPlacesToInput(subPlaces)[activeIdx].spots;
    const next = id
      ? existing.map((s) => (s._id === id ? { ...spot, _id: id } : s))
      : [...existing, spot];
    if (await persist(next)) {
      setEditing(null);
      if (!id) setSpotId(null);
      showToast(id ? "Spot updated!" : "Spot added!", "success");
    }
  };

  const deleteEditing = async () => {
    if (!editing?.id) {
      setEditing(null);
      return;
    }
    if (!confirm("Delete this spot? This can't be undone.")) return;
    const next = subPlacesToInput(subPlaces)[activeIdx].spots.filter(
      (s) => s._id !== editing.id,
    );
    if (await persist(next)) {
      setEditing(null);
      setSpotId(null);
      showToast("Spot deleted!", "success");
    }
  };

  if (editing && current) {
    return (
      <div className="space-y-4">
        <button
          onClick={() => setEditing(null)}
          className="flex items-center gap-1.5 text-sm font-medium text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
        >
          <ArrowLeftIcon className="w-4 h-4" /> Cancel
        </button>
        <h3 className="text-xl font-bold">
          {editing.id ? "Edit spot" : `New spot in ${current.name}`}
        </h3>
        <SpotForm
          spot={editing.draft}
          defaultOpen
          onChange={(patch) =>
            setEditing((e) => e && { ...e, draft: { ...e.draft, ...patch } })
          }
          onRemove={() => void deleteEditing()}
          onOpenImages={onOpenImages}
        />
        <div className="flex gap-2">
          <button
            onClick={() => setEditing(null)}
            className="flex-1 px-4 py-2 text-[var(--text-secondary)] border border-[var(--border-strong)] rounded-lg text-sm"
          >
            Cancel
          </button>
          <button
            onClick={() => void saveEditing()}
            disabled={saving}
            className="flex-1 bg-[var(--btn-bg)] text-[var(--btn-text)] font-semibold px-4 py-2 rounded-lg text-sm disabled:opacity-60"
          >
            {saving ? "Saving..." : "Save spot"}
          </button>
        </div>
      </div>
    );
  }

  if (current && spotIndex >= 0) {
    const spot = current.spots[spotIndex];
    return (
      <SpotDetail
        key={spot._id}
        spot={spot}
        placeName={current.name}
        index={spotIndex}
        total={current.spots.length}
        onBack={() => setSpotId(null)}
        onStep={(d) => setSpotId(current.spots[spotIndex + d]._id)}
        onEdit={() => setEditing({ id: spot._id, draft: toEditableSpot(spot) })}
        onOpenImages={onOpenImages}
      />
    );
  }

  const addTile = (
    <button
      onClick={() => setEditing({ id: null, draft: newSpot() })}
      className="min-h-32 rounded-2xl border border-dashed border-[var(--border-strong)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] flex flex-col items-center justify-center gap-1 text-sm font-medium"
    >
      <PlusIcon className="w-5 h-5" />
      Add spot
    </button>
  );

  return (
    <section>
      <div className="flex items-center gap-2 overflow-x-auto pb-1 -mx-1 px-1">
        {subPlaces.map((sp, i) => (
          <button
            key={sp._id}
            onClick={() => {
              setActive(i);
              setPlaceEdit(null);
            }}
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
        {placeEdit ? (
          <form
            className="shrink-0 flex items-center gap-1"
            onSubmit={(e) => {
              e.preventDefault();
              void submitPlaceEdit();
            }}
          >
            <input
              autoFocus
              value={placeEdit.value}
              onChange={(e) =>
                setPlaceEdit({ ...placeEdit, value: e.target.value })
              }
              onKeyDown={(e) => e.key === "Escape" && setPlaceEdit(null)}
              placeholder={
                placeEdit.mode === "add" ? "e.g. Sapa" : "Place name"
              }
              aria-label="Place name"
              className="w-36 bg-[var(--bg-input)] px-3 py-1.5 rounded-full text-sm outline-none"
            />
            <button
              type="submit"
              disabled={saving || !placeEdit.value.trim()}
              className="px-3 py-1.5 rounded-full bg-[var(--btn-bg)] text-[var(--btn-text)] text-sm font-semibold disabled:opacity-50"
            >
              {placeEdit.mode === "add" ? "Add" : "Save"}
            </button>
          </form>
        ) : (
          <button
            onClick={() => setPlaceEdit({ mode: "add", value: "" })}
            className="shrink-0 flex items-center gap-1 px-3 py-1.5 rounded-full border border-dashed border-[var(--border-strong)] text-sm font-medium text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
          >
            <PlusIcon className="w-4 h-4" />
            {subPlaces.length === 0 ? "Add a place inside" : "Place"}
          </button>
        )}
      </div>

      {!current ? (
        <p className="text-sm text-[var(--text-secondary)] py-10 text-center">
          Break this destination into places (e.g. Sapa, Hanoi), then add the
          spots to see inside each.
        </p>
      ) : (
        <>
          <div className="flex items-center justify-between mt-4 mb-3">
            <h3 className="text-sm font-semibold text-[var(--text-secondary)]">
              {current.spots.length}{" "}
              {current.spots.length === 1 ? "spot" : "spots"} in {current.name}
            </h3>
            <div className="flex items-center gap-1">
              <button
                onClick={() =>
                  setPlaceEdit({ mode: "rename", value: current.name })
                }
                aria-label={`Rename ${current.name}`}
                className="w-8 h-8 flex items-center justify-center rounded-full text-[var(--text-secondary)] hover:bg-[var(--bg-input)]"
              >
                <PencilSquareIcon className="w-4 h-4" />
              </button>
              <button
                onClick={() => void deletePlace()}
                aria-label={`Delete ${current.name}`}
                className="w-8 h-8 flex items-center justify-center rounded-full text-[var(--danger)] hover:bg-[var(--bg-input)]"
              >
                <TrashIcon className="w-4 h-4" />
              </button>
            </div>
          </div>

          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
            {current.spots.map((spot) => (
              <SpotCard
                key={spot._id}
                spot={spot}
                onOpen={() => setSpotId(spot._id)}
              />
            ))}
            {addTile}
          </div>
        </>
      )}
    </section>
  );
}
