import { useEffect, useRef, useState } from "react";
import {
  ChevronLeftIcon,
  ChevronRightIcon,
  LinkIcon,
  MagnifyingGlassIcon,
  MapPinIcon,
  PhotoIcon,
  XMarkIcon,
} from "@heroicons/react/24/outline";
import { MusicalNoteIcon, PlayCircleIcon } from "@heroicons/react/24/solid";
import { createPlace, deletePlace, getPlaces, updatePlace } from "@/api/places";
import type { Place } from "@/types/places.type";
import { fileToResizedDataUrl } from "@/lib/imageResize";
import { linkPlatform, normalizeLink } from "@/lib/linkPlatform";
import Modal from "@/components/Modal";
import SubPlacesEditor from "@/components/places/SubPlacesEditor";
import PlaceDetail from "@/components/places/PlaceDetail";
import { newSpot, type EditableSubPlace } from "@/components/places/spots";
import { useToast } from "@/components/useToast";
import { SkeletonCard } from "@/components/Skeleton";

const MAX_IMAGES = 6;

const INPUT =
  "w-full bg-[var(--bg-input)] px-3 py-2 rounded-lg text-sm text-[var(--text-primary)] border border-[var(--border-strong)] outline-none focus:border-[var(--accent)]/50";

const mapsUrl = (location: string) =>
  `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(location)}`;

// A pasted Google Maps link (a precise pin) wins over the text-search fallback
// built from the location field.
const mapsHrefFor = (location: string, mapLink: string): string | null =>
  normalizeLink(mapLink) || (location.trim() ? mapsUrl(location) : null);

const emptyForm = {
  title: "",
  location: "",
  details: "",
  specialty: "",
  thingsToKnow: "",
  images: [] as string[],
  foodImages: [] as string[],
  links: [] as string[],
  mapLink: "",
  subPlaces: [] as EditableSubPlace[],
};


const LINK_STYLE: Record<string, string> = {
  tiktok: "bg-black text-white",
  youtube: "bg-[#FF0000] text-white",
  other:
    "bg-[var(--bg-input)] text-[var(--text-primary)] border border-[var(--border-strong)]",
};
const LINK_LABEL: Record<string, string> = {
  tiktok: "TikTok",
  youtube: "YouTube",
  other: "Link",
};

function LinkIconFor({
  platform,
  className,
}: {
  platform: string;
  className?: string;
}) {
  if (platform === "tiktok") return <MusicalNoteIcon className={className} />;
  if (platform === "youtube") return <PlayCircleIcon className={className} />;
  return <LinkIcon className={className} />;
}

export default function PlacesPage() {
  const showToast = useToast();
  const [places, setPlaces] = useState<Place[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [query, setQuery] = useState("");



  // Full-screen image viewer, opened from a thumbnail in either the view or
  // the edit form — it holds its own copy of the images so it isn't tied to
  // either one.
  const [viewerImages, setViewerImages] = useState<string[] | null>(null);
  const [viewerIndex, setViewerIndex] = useState<number | null>(null);
  const [viewerDragX, setViewerDragX] = useState(0);
  const viewerDragging = useRef(false);
  const viewerStartX = useRef(0);

  const openViewer = (images: string[], i: number) => {
    setViewerImages(images);
    setViewerIndex(i);
  };
  const closeViewer = () => {
    setViewerImages(null);
    setViewerIndex(null);
    setViewerDragX(0);
  };

  // Tapping a card opens this read-only view; "Edit" switches to the form below.
  const [viewingPlace, setViewingPlace] = useState<Place | null>(null);
  const closeView = () => setViewingPlace(null);

  const [showForm, setShowForm] = useState(false);
  const [linkInput, setLinkInput] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState(emptyForm);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const foodFileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    let cancelled = false;
    getPlaces()
      .then((data) => {
        if (!cancelled) setPlaces(data);
      })
      .catch((err) => {
        console.error(err);
        showToast("Failed to load places", "error");
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [showToast]);

  const openAdd = () => {
    setEditingId(null);
    setForm(emptyForm);
    setShowForm(true);
  };

  const openEdit = (p: Place) => {
    setEditingId(p._id);
    setForm({
      title: p.title,
      location: p.location,
      details: p.details,
      specialty: p.specialty ?? "",
      thingsToKnow: p.thingsToKnow ?? "",
      images: [...p.images],
      foodImages: [...(p.foodImages ?? [])],
      links: [...(p.links ?? [])],
      mapLink: p.mapLink ?? "",
      subPlaces: subPlacesOf(p).map((sp) => ({
        uid: crypto.randomUUID(),
        name: sp.name,
        spots: sp.spots.map((spot) => ({
          ...newSpot(),
          name: spot.name,
          images: [...spot.images],
          links: [...spot.links],
          mapLink: spot.mapLink ?? "",
          notes: spot.notes ?? "",
          whereToEat: spot.whereToEat ?? "",
          hotel: spot.hotel ?? "",
        })),
      })),
    });
    setShowForm(true);
  };

  const closeForm = () => {
    setShowForm(false);
    setEditingId(null);
    setForm(emptyForm);
    closeViewer();
  };

  const handleFiles = async (
    field: "images" | "foodImages",
    fileList: FileList | null,
  ) => {
    if (!fileList || fileList.length === 0) return;
    const files = Array.from(fileList);
    const room = MAX_IMAGES - form[field].length;
    if (room <= 0) {
      showToast(`Up to ${MAX_IMAGES} images per place`, "error");
      return;
    }

    setUploading(true);
    const next: string[] = [];
    for (const file of files.slice(0, room)) {
      try {
        next.push(await fileToResizedDataUrl(file));
      } catch (err) {
        console.error(err);
        showToast(
          err instanceof Error ? err.message : "Failed to add an image",
          "error",
        );
      }
    }
    if (files.length > room) {
      showToast(
        `Only added ${room} more — ${MAX_IMAGES} images per place`,
        "error",
      );
    }
    setForm((f) => ({ ...f, [field]: [...f[field], ...next] }));
    setUploading(false);
  };

  const removeImage = (field: "images" | "foodImages", idx: number) =>
    setForm((f) => ({ ...f, [field]: f[field].filter((_, i) => i !== idx) }));

  const viewerGoTo = (i: number) =>
    setViewerIndex(Math.max(0, Math.min((viewerImages?.length ?? 1) - 1, i)));

  const onViewerPointerDown = (e: React.PointerEvent) => {
    viewerDragging.current = true;
    viewerStartX.current = e.clientX;
    e.currentTarget.setPointerCapture(e.pointerId);
  };
  const onViewerPointerMove = (e: React.PointerEvent) => {
    if (!viewerDragging.current) return;
    setViewerDragX(e.clientX - viewerStartX.current);
  };
  const onViewerPointerUp = () => {
    if (!viewerDragging.current || viewerIndex === null) return;
    viewerDragging.current = false;
    const THRESHOLD = 50;
    if (viewerDragX <= -THRESHOLD) viewerGoTo(viewerIndex + 1);
    else if (viewerDragX >= THRESHOLD) viewerGoTo(viewerIndex - 1);
    setViewerDragX(0);
  };

  const addLink = () => {
    const normalized = normalizeLink(linkInput);
    if (!normalized) {
      showToast("That doesn't look like a valid link", "error");
      return;
    }
    if (form.links.includes(normalized)) {
      setLinkInput("");
      return;
    }
    setForm((f) => ({ ...f, links: [...f.links, normalized] }));
    setLinkInput("");
  };
  const removeLink = (idx: number) =>
    setForm((f) => ({ ...f, links: f.links.filter((_, i) => i !== idx) }));

  const save = async () => {
    if (!form.title.trim()) {
      showToast("Please enter a title", "error");
      return;
    }

    let mapLink = "";
    if (form.mapLink.trim()) {
      const normalized = normalizeLink(form.mapLink);
      if (!normalized) {
        showToast("That Google Maps link doesn't look valid", "error");
        return;
      }
      mapLink = normalized;
    }
    const subPlaces = [];
    for (const sp of form.subPlaces) {
      if (!sp.name.trim()) {
        showToast("Every place needs a name", "error");
        return;
      }
      const spots = [];
      for (const spot of sp.spots) {
        if (!spot.name.trim()) {
          showToast(`Every spot in "${sp.name.trim()}" needs a name`, "error");
          return;
        }
        let spotMapLink = "";
        if (spot.mapLink.trim()) {
          const normalized = normalizeLink(spot.mapLink);
          if (!normalized) {
            showToast(`The Google Maps link for "${spot.name.trim()}" doesn't look valid`, "error");
            return;
          }
          spotMapLink = normalized;
        }
        spots.push({
          name: spot.name.trim(),
          images: spot.images,
          links: spot.links,
          mapLink: spotMapLink,
          notes: spot.notes,
          whereToEat: spot.whereToEat,
          hotel: spot.hotel,
        });
      }
      subPlaces.push({ name: sp.name.trim(), spots });
    }
    // Legacy top-level spots were folded into a sub-place above; clear them.
    const payload = { ...form, mapLink, subPlaces, spots: [] };

    setSaving(true);
    try {
      if (editingId) {
        const updated = await updatePlace(editingId, payload);
        setPlaces((prev) =>
          prev.map((p) => (p._id === editingId ? updated : p)),
        );
        showToast("Place updated!", "success");
      } else {
        const created = await createPlace(payload);
        setPlaces((prev) => [created, ...prev]);
        showToast("Place saved!", "success");
      }
      closeForm();
    } catch (err) {
      console.error(err);
      showToast("Failed to save place", "error");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!editingId) return;
    if (!confirm("Delete this place? This can't be undone.")) return;

    try {
      await deletePlace(editingId);
      setPlaces((prev) => prev.filter((p) => p._id !== editingId));
      showToast("Place deleted!", "success");
      closeForm();
    } catch (err) {
      console.error(err);
      showToast("Failed to delete place", "error");
    }
  };

  const q = query.trim().toLowerCase();
  const filteredPlaces = q
    ? places.filter((p) =>
        [p.title, p.location, p.details, p.specialty, p.thingsToKnow].some(
          (field) => field?.toLowerCase().includes(q),
        ),
      )
    : places;

  return (
    <div className="max-w-md md:max-w-none mx-auto px-6 md:px-8 pt-8 pb-10 text-[var(--text-primary)]">
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-lg font-semibold">Places</h1>
        <button
          onClick={openAdd}
          aria-label="Add place"
          className="px-[0.7rem] py-[0.3rem] bg-[var(--btn-bg)] text-[var(--btn-text)] font-bold rounded-4xl text-sm"
        >
          +
        </button>
      </div>

      {!loading && places.length > 0 && (
        <div className="relative mb-6">
          <MagnifyingGlassIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--text-secondary)]" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search places"
            aria-label="Search places"
            className="w-full bg-[var(--bg-input)] pl-9 pr-3 py-2 rounded-lg text-sm text-[var(--text-primary)] border border-[var(--border-strong)] outline-none focus:border-[var(--accent)]/50"
          />
        </div>
      )}

      {loading ? (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3">
          {Array.from({ length: 4 }).map((_, i) => (
            <SkeletonCard key={i} className="h-40" />
          ))}
        </div>
      ) : places.length === 0 ? (
        <p className="text-sm text-[var(--text-secondary)] text-center py-12">
          No places yet. Add one to get started!
        </p>
      ) : filteredPlaces.length === 0 ? (
        <p className="text-sm text-[var(--text-secondary)] text-center py-12">
          No places match "{query}".
        </p>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3">
          {filteredPlaces.map((p) => (
            <button
              key={p._id}
              onClick={() => setViewingPlace(p)}
              className="text-left bg-[var(--bg-surface)] rounded-xl overflow-hidden"
            >
              <div className="h-36 bg-[var(--bg-input)] flex items-center justify-center">
                {p.images[0] ? (
                  <img
                    src={p.images[0]}
                    alt={p.title}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <MapPinIcon className="w-8 h-8 text-[var(--text-secondary)]" />
                )}
              </div>
              <div className="p-2">
                <p className="text-sm font-medium truncate">{p.title}</p>
                {p.location && (
                  <p className="text-xs text-[var(--text-secondary)] truncate">
                    {p.location}
                  </p>
                )}
                {p.specialty && (
                  <p className="text-xs text-[var(--accent)] truncate">
                    {p.specialty}
                  </p>
                )}
              </div>
            </button>
          ))}
        </div>
      )}

      {/* VIEW — read-only; "Edit" hands off to the form below */}
      {viewingPlace && (
        <PlaceDetail
          place={viewingPlace}
          mapsHref={mapsHrefFor(viewingPlace.location, viewingPlace.mapLink)}
          onClose={closeView}
          onEdit={() => {
            openEdit(viewingPlace);
            closeView();
          }}
          onOpenImages={openViewer}
        />
      )}

      {/* ADD / EDIT */}
      <Modal
        open={showForm}
        onClose={closeForm}
        title={editingId ? "Edit Place" : "Add Place"}
        maxWidth="max-w-sm md:max-w-[95vw]"
      >
        <div className="space-y-4">
          <label className="block text-xs text-[var(--text-secondary)]">
            Title
            <input
              value={form.title}
              onChange={(e) =>
                setForm((f) => ({ ...f, title: e.target.value }))
              }
              placeholder="e.g. Grandma's house"
              className={`${INPUT} mt-1`}
            />
          </label>

          <label className="block text-xs text-[var(--text-secondary)]">
            Location
            <input
              value={form.location}
              onChange={(e) =>
                setForm((f) => ({ ...f, location: e.target.value }))
              }
              placeholder="Address or description"
              className={`${INPUT} mt-1`}
            />
          </label>

          <label className="block text-xs text-[var(--text-secondary)]">
            Google Maps link (optional)
            <div className="flex gap-2 mt-1">
              <input
                value={form.mapLink}
                onChange={(e) =>
                  setForm((f) => ({ ...f, mapLink: e.target.value }))
                }
                placeholder="Paste a share link for a precise pin"
                className={INPUT}
              />
              {mapsHrefFor(form.location, form.mapLink) && (
                <a
                  href={mapsHrefFor(form.location, form.mapLink)!}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label="Open in Maps"
                  className="shrink-0 flex items-center justify-center w-10 rounded-lg bg-[var(--bg-input)] border border-[var(--border-strong)] text-[var(--accent)]"
                >
                  <MapPinIcon className="w-4 h-4" />
                </a>
              )}
            </div>
          </label>

          <label className="block text-xs text-[var(--text-secondary)]">
            Details
            <textarea
              value={form.details}
              onChange={(e) =>
                setForm((f) => ({ ...f, details: e.target.value }))
              }
              rows={4}
              placeholder="Notes, directions, anything worth remembering"
              className={`${INPUT} mt-1 resize-none`}
            />
          </label>

          <label className="block text-xs text-[var(--text-secondary)]">
            Things to know
            <textarea
              value={form.thingsToKnow}
              onChange={(e) =>
                setForm((f) => ({ ...f, thingsToKnow: e.target.value }))
              }
              rows={3}
              placeholder="e.g. Cash only, closed Mondays, bring ID"
              className={`${INPUT} mt-1 resize-none`}
            />
          </label>

          <label className="block text-xs text-[var(--text-secondary)]">
            Any unique on this place?
            <input
              value={form.specialty}
              onChange={(e) =>
                setForm((f) => ({ ...f, specialty: e.target.value }))
              }
              placeholder="e.g. Carbonara, Crispy Pata"
              className={`${INPUT} mt-1`}
            />
          </label>

          <div>
            <p className="text-xs text-[var(--text-secondary)] mb-2">
              Food photos ({form.foodImages.length}/{MAX_IMAGES})
            </p>
            <div className="flex flex-wrap gap-2">
              {form.foodImages.map((src, i) => (
                <div
                  key={i}
                  className="relative w-16 h-16 rounded-lg overflow-hidden shrink-0"
                >
                  <button
                    type="button"
                    onClick={() => openViewer(form.foodImages, i)}
                    className="w-full h-full block"
                  >
                    <img
                      src={src}
                      alt=""
                      className="w-full h-full object-cover"
                    />
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      removeImage("foodImages", i);
                    }}
                    aria-label="Remove food image"
                    className="absolute top-0.5 right-0.5 w-5 h-5 rounded-full bg-black/70 flex items-center justify-center"
                  >
                    <XMarkIcon className="w-3 h-3 text-white" />
                  </button>
                </div>
              ))}
              {form.foodImages.length < MAX_IMAGES && (
                <button
                  onClick={() => foodFileInputRef.current?.click()}
                  disabled={uploading}
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
                ref={foodFileInputRef}
                type="file"
                accept="image/*"
                multiple
                className="hidden"
                onChange={(e) => {
                  handleFiles("foodImages", e.target.files);
                  e.target.value = "";
                }}
              />
            </div>
          </div>

          <div>
            <p className="text-xs text-[var(--text-secondary)] mb-2">
              Images ({form.images.length}/{MAX_IMAGES})
            </p>
            <div className="flex flex-wrap gap-2">
              {form.images.map((src, i) => (
                <div
                  key={i}
                  className="relative w-16 h-16 rounded-lg overflow-hidden shrink-0"
                >
                  <button
                    type="button"
                    onClick={() => openViewer(form.images, i)}
                    className="w-full h-full block"
                  >
                    <img
                      src={src}
                      alt=""
                      className="w-full h-full object-cover"
                    />
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      removeImage("images", i);
                    }}
                    aria-label="Remove image"
                    className="absolute top-0.5 right-0.5 w-5 h-5 rounded-full bg-black/70 flex items-center justify-center"
                  >
                    <XMarkIcon className="w-3 h-3 text-white" />
                  </button>
                </div>
              ))}
              {form.images.length < MAX_IMAGES && (
                <button
                  onClick={() => fileInputRef.current?.click()}
                  disabled={uploading}
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
                ref={fileInputRef}
                type="file"
                accept="image/*"
                multiple
                className="hidden"
                onChange={(e) => {
                  handleFiles("images", e.target.files);
                  e.target.value = "";
                }}
              />
            </div>
          </div>

          <SubPlacesEditor
            subPlaces={form.subPlaces}
            onChange={(subPlaces) => setForm((f) => ({ ...f, subPlaces }))}
            onOpenImages={openViewer}
          />

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
                className="shrink-0 w-10 rounded-lg bg-[var(--bg-input)] border border-[var(--border-strong)] text-[var(--accent)] flex items-center justify-center"
              >
                +
              </button>
            </div>
            {form.links.length > 0 && (
              <div className="space-y-2">
                {form.links.map((link, i) => {
                  const platform = linkPlatform(link);
                  return (
                    <div key={i} className="flex items-center gap-2">
                      <a
                        href={link}
                        target="_blank"
                        rel="noopener noreferrer"
                        className={`flex-1 min-w-0 flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium ${LINK_STYLE[platform]}`}
                      >
                        <LinkIconFor
                          platform={platform}
                          className="w-4 h-4 shrink-0"
                        />
                        <span className="truncate">{LINK_LABEL[platform]}</span>
                      </a>
                      <button
                        onClick={() => removeLink(i)}
                        aria-label="Remove link"
                        className="shrink-0 text-[var(--text-secondary)]"
                      >
                        <XMarkIcon className="w-4 h-4" />
                      </button>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          <div className="flex items-center gap-2 pt-2">
            {editingId && (
              <button
                onClick={handleDelete}
                className="px-4 py-2 text-[var(--danger)] border border-[var(--danger)]/30 rounded-lg text-sm"
              >
                Delete
              </button>
            )}
            <button
              onClick={closeForm}
              className="flex-1 px-4 py-2 text-[var(--text-secondary)] border border-[var(--border-strong)] rounded-lg text-sm"
            >
              Cancel
            </button>
            <button
              onClick={save}
              disabled={saving || uploading}
              className="flex-1 bg-[var(--btn-bg)] text-[var(--btn-text)] font-semibold px-4 py-2 rounded-lg text-sm disabled:opacity-50"
            >
              {saving ? "Saving…" : "Save"}
            </button>
          </div>
        </div>
      </Modal>

      {/* IMAGE VIEWER — true full-screen: the header and dots float on top of
          the photo (with a gradient scrim for contrast) instead of taking up
          their own rows, so the image itself gets the whole viewport. */}
      {viewerIndex !== null && viewerImages && viewerImages.length > 0 && (
        <div
          className="fixed inset-0 z-[60] bg-black"
          onClick={(e) => {
            if (e.target === e.currentTarget) closeViewer();
          }}
        >
          {/* Pointer/swipe handlers live only on this div, so the chevron
              buttons below (siblings, not descendants) get a clean click
              instead of one muddied by this div's pointer capture. */}
          <div
            className="absolute inset-0 touch-pan-y"
            onPointerDown={onViewerPointerDown}
            onPointerMove={onViewerPointerMove}
            onPointerUp={onViewerPointerUp}
            onPointerCancel={onViewerPointerUp}
          >
            <div
              className="flex h-full"
              style={{
                width: `${viewerImages.length * 100}%`,
                transform: `translateX(calc(${-viewerIndex * (100 / viewerImages.length)}% + ${viewerDragX}px))`,
                transition: viewerDragX === 0 ? "transform 0.25s ease" : "none",
              }}
            >
              {viewerImages.map((src, i) => (
                <div
                  key={i}
                  className="h-full flex items-center justify-center"
                  style={{ width: `${100 / viewerImages.length}%` }}
                >
                  <img
                    src={src}
                    alt=""
                    draggable={false}
                    className="w-full h-full object-cover select-none"
                  />
                </div>
              ))}
            </div>
          </div>

          {viewerIndex > 0 && (
            <button
              onClick={() => viewerGoTo(viewerIndex - 1)}
              aria-label="Previous image"
              className="absolute left-2 top-1/2 -translate-y-1/2 w-9 h-9 rounded-full bg-black/50 text-white flex items-center justify-center"
            >
              <ChevronLeftIcon className="w-5 h-5" />
            </button>
          )}
          {viewerIndex < viewerImages.length - 1 && (
            <button
              onClick={() => viewerGoTo(viewerIndex + 1)}
              aria-label="Next image"
              className="absolute right-2 top-1/2 -translate-y-1/2 w-9 h-9 rounded-full bg-black/50 text-white flex items-center justify-center"
            >
              <ChevronRightIcon className="w-5 h-5" />
            </button>
          )}

          <div className="absolute top-0 left-0 right-0 flex items-center justify-between px-4 py-3 bg-gradient-to-b from-black/70 to-transparent pointer-events-none">
            <span className="text-sm text-white/80">
              {viewerIndex + 1} / {viewerImages.length}
            </span>
            <button
              onClick={closeViewer}
              aria-label="Close"
              className="p-1.5 text-white pointer-events-auto"
            >
              <XMarkIcon className="w-6 h-6" />
            </button>
          </div>

          {viewerImages.length > 1 && (
            <div className="absolute bottom-0 left-0 right-0 flex items-center justify-center gap-1.5 py-4 bg-gradient-to-t from-black/70 to-transparent pointer-events-none">
              {viewerImages.map((_, i) => (
                <span
                  key={i}
                  className={`w-1.5 h-1.5 rounded-full ${i === viewerIndex ? "bg-white" : "bg-white/30"}`}
                />
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
