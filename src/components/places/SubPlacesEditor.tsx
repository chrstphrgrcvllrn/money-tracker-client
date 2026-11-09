import { useState } from "react";
import {
  ChevronDownIcon,
  ChevronUpIcon,
  TrashIcon,
} from "@heroicons/react/24/outline";
import { MAX_SUBPLACES, newSubPlace, type EditableSubPlace } from "./spots";
import SpotsEditor from "./SpotsEditor";

const INPUT =
  "w-full bg-[var(--bg-surface)] px-3 py-2 rounded-lg text-sm text-[var(--text-primary)] border border-[var(--border-strong)] outline-none focus:border-[var(--accent)]/50";

type Props = {
  subPlaces: EditableSubPlace[];
  onChange: (subPlaces: EditableSubPlace[]) => void;
  onOpenImages: (images: string[], index: number) => void;
};

function SubPlaceForm({
  subPlace,
  onChange,
  onRemove,
  onOpenImages,
}: {
  subPlace: EditableSubPlace;
  onChange: (patch: Partial<EditableSubPlace>) => void;
  onRemove: () => void;
  onOpenImages: (images: string[], index: number) => void;
}) {
  const [open, setOpen] = useState(!subPlace.name);
  return (
    <div className="p-3 rounded-xl bg-[var(--bg-input)] space-y-3">
      <div className="flex items-center gap-2">
        <input
          value={subPlace.name}
          onChange={(e) => onChange({ name: e.target.value })}
          placeholder="Place name, e.g. Sapa"
          aria-label="Place name"
          className={INPUT}
        />
        <button
          onClick={() => setOpen((o) => !o)}
          aria-label={open ? "Collapse place" : "Expand place"}
          className="shrink-0 w-8 h-8 flex items-center justify-center text-[var(--text-secondary)]"
        >
          {open ? (
            <ChevronUpIcon className="w-4 h-4" />
          ) : (
            <ChevronDownIcon className="w-4 h-4" />
          )}
        </button>
        <button
          onClick={onRemove}
          aria-label="Remove place"
          className="shrink-0 w-8 h-8 flex items-center justify-center text-[var(--danger)]"
        >
          <TrashIcon className="w-4 h-4" />
        </button>
      </div>
      {open && (
        <SpotsEditor
          spots={subPlace.spots}
          onChange={(spots) => onChange({ spots })}
          onOpenImages={onOpenImages}
        />
      )}
    </div>
  );
}

export default function SubPlacesEditor({
  subPlaces,
  onChange,
  onOpenImages,
}: Props) {
  return (
    <div className="space-y-3">
      <p className="text-xs text-[var(--text-secondary)]">
        Places inside ({subPlaces.length}/{MAX_SUBPLACES})
      </p>
      {subPlaces.map((sp, i) => (
        <SubPlaceForm
          key={sp.uid}
          subPlace={sp}
          onChange={(patch) =>
            onChange(
              subPlaces.map((s, j) => (j === i ? { ...s, ...patch } : s)),
            )
          }
          onRemove={() => onChange(subPlaces.filter((_, j) => j !== i))}
          onOpenImages={onOpenImages}
        />
      ))}
      {subPlaces.length < MAX_SUBPLACES && (
        <button
          onClick={() => onChange([...subPlaces, newSubPlace()])}
          className="w-full px-3 py-2 rounded-lg border border-dashed border-[var(--border-strong)] text-sm text-[var(--text-secondary)]"
        >
          + Add place
        </button>
      )}
    </div>
  );
}
