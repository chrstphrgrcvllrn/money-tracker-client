import { useRef, useState } from "react";
import {
  ChevronDownIcon,
  ChevronUpIcon,
  PhotoIcon,
  XMarkIcon,
} from "@heroicons/react/24/outline";
import type { SpotInput } from "@/types/places.type";
import {
  MAX_SPOTS,
  MAX_SPOT_IMAGES,
  newSpot,
  type EditableSpot,
} from "./spots";
import { fileToResizedDataUrl } from "@/lib/imageResize";
import { normalizeLink } from "@/lib/linkPlatform";
import { useToast } from "@/components/useToast";
import LinkButton from "./LinkButton";

const INPUT =
  "w-full bg-[var(--bg-surface)] px-3 py-2 rounded-lg text-sm text-[var(--text-primary)] border border-[var(--border-strong)] outline-none focus:border-[var(--accent)]/50";

type SpotFormProps = {
  spot: EditableSpot;
  defaultOpen: boolean;
  onChange: (patch: Partial<SpotInput>) => void;
  onRemove: () => void;
  onOpenImages: (images: string[], index: number) => void;
};

function SpotForm({
  spot,
  defaultOpen,
  onChange,
  onRemove,
  onOpenImages,
}: SpotFormProps) {
  const showToast = useToast();
  const [open, setOpen] = useState(defaultOpen);
  const [uploading, setUploading] = useState(false);
  const [linkInput, setLinkInput] = useState("");
  const fileRef = useRef<HTMLInputElement>(null);

  const addImages = async (fileList: FileList | null) => {
    if (!fileList || fileList.length === 0) return;
    const room = MAX_SPOT_IMAGES - spot.images.length;
    if (room <= 0) {
      showToast(`Up to ${MAX_SPOT_IMAGES} images per spot`, "error");
      return;
    }
    setUploading(true);
    const next: string[] = [];
    for (const file of Array.from(fileList).slice(0, room)) {
      try {
        next.push(await fileToResizedDataUrl(file));
      } catch (err) {
        showToast(
          err instanceof Error ? err.message : "Failed to add an image",
          "error",
        );
      }
    }
    if (fileList.length > room)
      showToast(
        `Only added ${room} more — ${MAX_SPOT_IMAGES} images per spot`,
        "error",
      );
    onChange({ images: [...spot.images, ...next] });
    setUploading(false);
  };

  const addLink = () => {
    const normalized = normalizeLink(linkInput);
    if (!normalized) {
      showToast("That doesn't look like a valid link", "error");
      return;
    }
    if (!spot.links.includes(normalized))
      onChange({ links: [...spot.links, normalized] });
    setLinkInput("");
  };

  return (
    <div className="p-3 rounded-xl bg-[var(--bg-input)] space-y-3">
      <div className="flex items-center gap-2">
        <input
          value={spot.name}
          onChange={(e) => onChange({ name: e.target.value })}
          placeholder="Spot name, e.g. Mount Fansipan"
          aria-label="Spot name"
          className={INPUT}
        />
        <button
          onClick={() => setOpen((o) => !o)}
          aria-label={open ? "Collapse spot" : "Expand spot"}
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
          aria-label="Remove spot"
          className="shrink-0 w-8 h-8 flex items-center justify-center text-[var(--danger)]"
        >
          <XMarkIcon className="w-4 h-4" />
        </button>
      </div>

      {open && (
        <>
          <div>
            <p className="text-xs text-[var(--text-secondary)] mb-2">
              Images ({spot.images.length}/{MAX_SPOT_IMAGES})
            </p>
            <div className="flex flex-wrap gap-2">
              {spot.images.map((src, i) => (
                <div
                  key={i}
                  className="relative w-16 h-16 rounded-lg overflow-hidden shrink-0"
                >
                  <button
                    type="button"
                    onClick={() => onOpenImages(spot.images, i)}
                    className="w-full h-full block"
                  >
                    <img
                      src={src}
                      alt=""
                      className="w-full h-full object-cover"
                    />
                  </button>
                  <button
                    onClick={() =>
                      onChange({
                        images: spot.images.filter((_, j) => j !== i),
                      })
                    }
                    aria-label="Remove image"
                    className="absolute top-0.5 right-0.5 w-5 h-5 rounded-full bg-black/70 flex items-center justify-center"
                  >
                    <XMarkIcon className="w-3 h-3 text-white" />
                  </button>
                </div>
              ))}
              {spot.images.length < MAX_SPOT_IMAGES && (
                <button
                  onClick={() => fileRef.current?.click()}
                  disabled={uploading}
                  aria-label="Add image"
                  className="w-16 h-16 rounded-lg border border-dashed border-[var(--border-strong)] flex items-center justify-center text-[var(--text-secondary)] shrink-0 disabled:opacity-50"
                >
                  {uploading ? (
                    <span className="text-[10px]">...</span>
                  ) : (
                    <PhotoIcon className="w-5 h-5" />
                  )}
                </button>
              )}
              <input
                ref={fileRef}
                type="file"
                accept="image/*"
                multiple
                className="hidden"
                onChange={(e) => {
                  void addImages(e.target.files);
                  e.target.value = "";
                }}
              />
            </div>
          </div>

          <label className="block text-xs text-[var(--text-secondary)]">
            Google Maps link
            <input
              value={spot.mapLink}
              onChange={(e) => onChange({ mapLink: e.target.value })}
              placeholder="Paste a share link for a precise pin"
              className={`${INPUT} mt-1`}
            />
          </label>

          <label className="block text-xs text-[var(--text-secondary)]">
            Notes
            <textarea
              value={spot.notes}
              onChange={(e) => onChange({ notes: e.target.value })}
              rows={3}
              placeholder="Tips, best time to go, how to get there"
              className={`${INPUT} mt-1 resize-none`}
            />
          </label>

          <label className="block text-xs text-[var(--text-secondary)]">
            Where to eat
            <textarea
              value={spot.whereToEat}
              onChange={(e) => onChange({ whereToEat: e.target.value })}
              rows={2}
              placeholder="Restaurants or dishes nearby"
              className={`${INPUT} mt-1 resize-none`}
            />
          </label>

          <label className="block text-xs text-[var(--text-secondary)]">
            Hotel
            <textarea
              value={spot.hotel}
              onChange={(e) => onChange({ hotel: e.target.value })}
              rows={2}
              placeholder="Where to stay nearby"
              className={`${INPUT} mt-1 resize-none`}
            />
          </label>

          <div>
            <p className="text-xs text-[var(--text-secondary)] mb-2">Links</p>
            <div className="flex gap-2 mb-2">
              <input
                value={linkInput}
                onChange={(e) => setLinkInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    addLink();
                  }
                }}
                placeholder="Paste a TikTok or YouTube link"
                className={INPUT}
              />
              <button
                onClick={addLink}
                aria-label="Add link"
                className="shrink-0 w-10 rounded-lg bg-[var(--bg-surface)] border border-[var(--border-strong)] text-[var(--accent)] flex items-center justify-center"
              >
                +
              </button>
            </div>
            <div className="space-y-2">
              {spot.links.map((link, i) => (
                <div key={i} className="flex items-center gap-2">
                  <LinkButton link={link} />
                  <button
                    onClick={() =>
                      onChange({ links: spot.links.filter((_, j) => j !== i) })
                    }
                    aria-label="Remove link"
                    className="shrink-0 text-[var(--text-secondary)]"
                  >
                    <XMarkIcon className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  );
}

type Props = {
  spots: EditableSpot[];
  onChange: (spots: EditableSpot[]) => void;
  onOpenImages: (images: string[], index: number) => void;
};

export default function SpotsEditor({ spots, onChange, onOpenImages }: Props) {
  return (
    <div className="space-y-3">
      <p className="text-xs text-[var(--text-secondary)]">
        Spots ({spots.length}/{MAX_SPOTS})
      </p>
      <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-3 items-start">
        {spots.map((spot, i) => (
          <SpotForm
            key={spot.uid}
            spot={spot}
            defaultOpen={!spot.name}
            onChange={(patch) =>
              onChange(spots.map((s, j) => (j === i ? { ...s, ...patch } : s)))
            }
            onRemove={() => onChange(spots.filter((_, j) => j !== i))}
            onOpenImages={onOpenImages}
          />
        ))}
      </div>
      {spots.length < MAX_SPOTS && (
        <button
          onClick={() => onChange([...spots, newSpot()])}
          className="w-full px-3 py-2 rounded-lg border border-dashed border-[var(--border-strong)] text-sm text-[var(--text-secondary)]"
        >
          + Add spot
        </button>
      )}
    </div>
  );
}
