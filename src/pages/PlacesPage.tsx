import { useEffect, useRef, useState } from "react";
import {
  CalendarDaysIcon,
  ChevronDownIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  ChevronUpIcon,
  LinkIcon,
  MagnifyingGlassIcon,
  MapPinIcon,
  PhotoIcon,
  XMarkIcon,
} from "@heroicons/react/24/outline";
import { MusicalNoteIcon, PlayCircleIcon } from "@heroicons/react/24/solid";
import { createPlace, deletePlace, getPlaces, updatePlace } from "@/api/places";
import { createTrip, deleteTrip, getTrips, updateTrip } from "@/api/trips";
import type { Place } from "@/types/places.type";
import type { Trip, TripDay } from "@/types/trips.type";
import { fileToResizedDataUrl } from "@/lib/imageResize";
import { linkPlatform, normalizeLink } from "@/lib/linkPlatform";
import Modal from "@/components/Modal";
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
};

const emptyTripForm = { title: "", days: [] as TripDay[] };

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

  // ITINERARIES — a trip is a title plus an ordered list of days, each day an
  // ordered list of ids of places already saved on this page.
  const [trips, setTrips] = useState<Trip[]>([]);
  const [tripsLoading, setTripsLoading] = useState(true);
  const [tripsSaving, setTripsSaving] = useState(false);
  const [viewingTrip, setViewingTrip] = useState<Trip | null>(null);
  const [showTripForm, setShowTripForm] = useState(false);
  const [editingTripId, setEditingTripId] = useState<string | null>(null);
  const [tripForm, setTripForm] = useState(emptyTripForm);
  const [pickerDayIndex, setPickerDayIndex] = useState<number | null>(null);
  const [pickerQuery, setPickerQuery] = useState("");

  const findPlace = (id: string) => places.find((p) => p._id === id);

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

  useEffect(() => {
    let cancelled = false;
    getTrips()
      .then((data) => {
        if (!cancelled) setTrips(data);
      })
      .catch((err) => {
        console.error(err);
        showToast("Failed to load itineraries", "error");
      })
      .finally(() => {
        if (!cancelled) setTripsLoading(false);
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

  // ITINERARIES

  const openAddTrip = () => {
    setEditingTripId(null);
    setTripForm(emptyTripForm);
    setShowTripForm(true);
  };

  const openEditTrip = (t: Trip) => {
    setEditingTripId(t._id);
    setTripForm({
      title: t.title,
      days: t.days.map((d) => ({ label: d.label, placeIds: [...d.placeIds] })),
    });
    setShowTripForm(true);
  };

  const closeTripForm = () => {
    setShowTripForm(false);
    setEditingTripId(null);
    setTripForm(emptyTripForm);
  };

  const closeTripView = () => setViewingTrip(null);

  const addDay = () =>
    setTripForm((f) => ({
      ...f,
      days: [...f.days, { label: `Day ${f.days.length + 1}`, placeIds: [] }],
    }));

  const removeDay = (dayIdx: number) =>
    setTripForm((f) => ({ ...f, days: f.days.filter((_, i) => i !== dayIdx) }));

  const moveDay = (dayIdx: number, dir: -1 | 1) =>
    setTripForm((f) => {
      const target = dayIdx + dir;
      if (target < 0 || target >= f.days.length) return f;
      const days = [...f.days];
      [days[dayIdx], days[target]] = [days[target], days[dayIdx]];
      return { ...f, days };
    });

  const updateDayLabel = (dayIdx: number, label: string) =>
    setTripForm((f) => ({
      ...f,
      days: f.days.map((d, i) => (i === dayIdx ? { ...d, label } : d)),
    }));

  const openPicker = (dayIdx: number) => {
    setPickerDayIndex(dayIdx);
    setPickerQuery("");
  };
  const closePicker = () => setPickerDayIndex(null);

  const addPlaceToDay = (placeId: string) => {
    if (pickerDayIndex === null) return;
    setTripForm((f) => ({
      ...f,
      days: f.days.map((d, i) =>
        i === pickerDayIndex ? { ...d, placeIds: [...d.placeIds, placeId] } : d,
      ),
    }));
  };

  const removePlaceFromDay = (dayIdx: number, placeIdx: number) =>
    setTripForm((f) => ({
      ...f,
      days: f.days.map((d, i) =>
        i === dayIdx
          ? { ...d, placeIds: d.placeIds.filter((_, j) => j !== placeIdx) }
          : d,
      ),
    }));

  const movePlaceInDay = (dayIdx: number, placeIdx: number, dir: -1 | 1) =>
    setTripForm((f) => ({
      ...f,
      days: f.days.map((d, i) => {
        if (i !== dayIdx) return d;
        const target = placeIdx + dir;
        if (target < 0 || target >= d.placeIds.length) return d;
        const placeIds = [...d.placeIds];
        [placeIds[placeIdx], placeIds[target]] = [
          placeIds[target],
          placeIds[placeIdx],
        ];
        return { ...d, placeIds };
      }),
    }));

  const saveTrip = async () => {
    if (!tripForm.title.trim()) {
      showToast("Please enter a title", "error");
      return;
    }

    setTripsSaving(true);
    try {
      if (editingTripId) {
        const updated = await updateTrip(editingTripId, tripForm);
        setTrips((prev) =>
          prev.map((t) => (t._id === editingTripId ? updated : t)),
        );
        showToast("Itinerary updated!", "success");
      } else {
        const created = await createTrip(tripForm);
        setTrips((prev) => [created, ...prev]);
        showToast("Itinerary saved!", "success");
      }
      closeTripForm();
    } catch (err) {
      console.error(err);
      showToast("Failed to save itinerary", "error");
    } finally {
      setTripsSaving(false);
    }
  };

  const handleDeleteTrip = async () => {
    if (!editingTripId) return;
    if (!confirm("Delete this itinerary? This can't be undone.")) return;

    try {
      await deleteTrip(editingTripId);
      setTrips((prev) => prev.filter((t) => t._id !== editingTripId));
      showToast("Itinerary deleted!", "success");
      closeTripForm();
    } catch (err) {
      console.error(err);
      showToast("Failed to delete itinerary", "error");
    }
  };

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
    const payload = { ...form, mapLink };

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
      <h1 className="text-lg font-semibold mb-6">Places</h1>

      <div className="flex items-center justify-between mb-3">
        <h2 className="text-sm font-semibold text-[var(--text-secondary)]">
          Itineraries
        </h2>
        <button
          onClick={openAddTrip}
          aria-label="Add itinerary"
          className="px-[0.7rem] py-[0.3rem] bg-[var(--btn-bg)] text-[var(--btn-text)] font-bold rounded-4xl text-sm"
        >
          +
        </button>
      </div>

      {tripsLoading ? (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3">
          {Array.from({ length: 4 }).map((_, i) => (
            <SkeletonCard key={i} className="h-40" />
          ))}
        </div>
      ) : trips.length === 0 ? (
        <p className="text-sm text-[var(--text-secondary)] text-center py-6">
          No itineraries yet.
        </p>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3">
          {trips.map((t) => {
            const totalPlaces = t.days.reduce(
              (sum, d) => sum + d.placeIds.length,
              0,
            );
            const coverPlace = t.days
              .flatMap((d) => d.placeIds)
              .map(findPlace)
              .find((p) => p?.images[0]);
            return (
              <button
                key={t._id}
                onClick={() => setViewingTrip(t)}
                className="text-left bg-[var(--bg-surface)] rounded-xl overflow-hidden"
              >
                <div className="h-36 bg-[var(--bg-input)] flex items-center justify-center">
                  {coverPlace?.images[0] ? (
                    <img
                      src={coverPlace.images[0]}
                      alt={t.title}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <CalendarDaysIcon className="w-8 h-8 text-[var(--text-secondary)]" />
                  )}
                </div>
                <div className="p-2">
                  <p className="text-sm font-medium truncate">{t.title}</p>
                  <p className="text-xs text-[var(--text-secondary)] truncate">
                    {t.days.length} {t.days.length === 1 ? "day" : "days"} ·{" "}
                    {totalPlaces} {totalPlaces === 1 ? "place" : "places"}
                  </p>
                </div>
              </button>
            );
          })}
        </div>
      )}

      <div className="flex items-center justify-between mt-8 mb-3">
        <h2 className="text-sm font-semibold text-[var(--text-secondary)]">
          Saved places
        </h2>
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
      <Modal
        open={!!viewingPlace}
        onClose={closeView}
        title={viewingPlace?.title}
      >
        {viewingPlace && (
          <div className="space-y-4">
            {viewingPlace.images.length > 0 && (
              <div className="flex gap-2 overflow-x-auto -mx-1 px-1">
                {viewingPlace.images.map((src, i) => (
                  <button
                    key={i}
                    onClick={() => openViewer(viewingPlace.images, i)}
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

            {(viewingPlace.location ||
              mapsHrefFor(viewingPlace.location, viewingPlace.mapLink)) && (
              <div className="flex items-center gap-2">
                <MapPinIcon className="w-4 h-4 text-[var(--text-secondary)] shrink-0" />
                <span className="text-sm flex-1 min-w-0 truncate">
                  {viewingPlace.location || "No address set"}
                </span>
                {mapsHrefFor(viewingPlace.location, viewingPlace.mapLink) && (
                  <a
                    href={mapsHrefFor(
                      viewingPlace.location,
                      viewingPlace.mapLink,
                    )!}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="shrink-0 text-xs text-[var(--accent)] font-medium"
                  >
                    Open in Maps
                  </a>
                )}
              </div>
            )}

            {viewingPlace.specialty && (
              <div>
                <p className="text-xs text-[var(--text-secondary)] mb-1">
                  Worth trying
                </p>
                <p className="text-sm">{viewingPlace.specialty}</p>
                {viewingPlace.foodImages.length > 0 && (
                  <div className="flex gap-2 overflow-x-auto -mx-1 px-1 mt-2">
                    {viewingPlace.foodImages.map((src, i) => (
                      <button
                        key={i}
                        onClick={() => openViewer(viewingPlace.foodImages, i)}
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
              </div>
            )}

            {viewingPlace.details && (
              <div>
                <p className="text-xs text-[var(--text-secondary)] mb-1">
                  Details
                </p>
                <p className="text-sm whitespace-pre-wrap">
                  {viewingPlace.details}
                </p>
              </div>
            )}

            {viewingPlace.thingsToKnow && (
              <div>
                <p className="text-xs text-[var(--text-secondary)] mb-1">
                  Things to know
                </p>
                <p className="text-sm whitespace-pre-wrap">
                  {viewingPlace.thingsToKnow}
                </p>
              </div>
            )}

            {viewingPlace.links.length > 0 && (
              <div className="space-y-2">
                {viewingPlace.links.map((link, i) => {
                  const platform = linkPlatform(link);
                  return (
                    <a
                      key={i}
                      href={link}
                      target="_blank"
                      rel="noopener noreferrer"
                      className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium ${LINK_STYLE[platform]}`}
                    >
                      <LinkIconFor
                        platform={platform}
                        className="w-4 h-4 shrink-0"
                      />
                      <span className="truncate">{LINK_LABEL[platform]}</span>
                    </a>
                  );
                })}
              </div>
            )}

            {!viewingPlace.location &&
              !viewingPlace.specialty &&
              !viewingPlace.details &&
              !viewingPlace.thingsToKnow &&
              viewingPlace.links.length === 0 &&
              viewingPlace.images.length === 0 &&
              viewingPlace.foodImages.length === 0 && (
                <p className="text-sm text-[var(--text-secondary)]">
                  Nothing added yet.
                </p>
              )}

            <div className="flex gap-2 pt-2">
              <button
                onClick={closeView}
                className="flex-1 px-4 py-2 text-[var(--text-secondary)] border border-[var(--border-strong)] rounded-lg text-sm"
              >
                Close
              </button>
              <button
                onClick={() => {
                  openEdit(viewingPlace);
                  closeView();
                }}
                className="flex-1 bg-[var(--btn-bg)] text-[var(--btn-text)] font-semibold px-4 py-2 rounded-lg text-sm"
              >
                Edit
              </button>
            </div>
          </div>
        )}
      </Modal>

      {/* ADD / EDIT */}
      <Modal
        open={showForm}
        onClose={closeForm}
        title={editingId ? "Edit Place" : "Add Place"}
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

      {/* ITINERARY VIEW — read-only; "Edit" hands off to the form below */}
      <Modal
        open={!!viewingTrip}
        onClose={closeTripView}
        title={viewingTrip?.title}
      >
        {viewingTrip && (
          <div className="space-y-4">
            {viewingTrip.days.length === 0 ? (
              <p className="text-sm text-[var(--text-secondary)]">
                No days added yet.
              </p>
            ) : (
              viewingTrip.days.map((day, i) => (
                <div key={i}>
                  <p className="text-xs text-[var(--text-secondary)] mb-2">
                    {day.label || `Day ${i + 1}`}
                  </p>
                  {day.placeIds.length === 0 ? (
                    <p className="text-sm text-[var(--text-secondary)]">
                      No places added.
                    </p>
                  ) : (
                    <div className="space-y-1.5">
                      {day.placeIds.map((placeId, j) => {
                        const place = findPlace(placeId);
                        if (!place) return null;
                        return (
                          <button
                            key={j}
                            onClick={() => {
                              setViewingPlace(place);
                              closeTripView();
                            }}
                            className="w-full flex items-center gap-2 p-1.5 rounded-lg bg-[var(--bg-input)] text-left"
                          >
                            <div className="w-10 h-10 rounded-md overflow-hidden shrink-0 bg-[var(--bg-surface)] flex items-center justify-center">
                              {place.images[0] ? (
                                <img
                                  src={place.images[0]}
                                  alt=""
                                  className="w-full h-full object-cover"
                                />
                              ) : (
                                <MapPinIcon className="w-4 h-4 text-[var(--text-secondary)]" />
                              )}
                            </div>
                            <div className="min-w-0 flex-1">
                              <p className="text-sm font-medium truncate">
                                {place.title}
                              </p>
                              {place.location && (
                                <p className="text-xs text-[var(--text-secondary)] truncate">
                                  {place.location}
                                </p>
                              )}
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  )}
                </div>
              ))
            )}

            <div className="flex gap-2 pt-2">
              <button
                onClick={closeTripView}
                className="flex-1 px-4 py-2 text-[var(--text-secondary)] border border-[var(--border-strong)] rounded-lg text-sm"
              >
                Close
              </button>
              <button
                onClick={() => {
                  openEditTrip(viewingTrip);
                  closeTripView();
                }}
                className="flex-1 bg-[var(--btn-bg)] text-[var(--btn-text)] font-semibold px-4 py-2 rounded-lg text-sm"
              >
                Edit
              </button>
            </div>
          </div>
        )}
      </Modal>

      {/* ITINERARY ADD / EDIT */}
      <Modal
        open={showTripForm}
        onClose={closeTripForm}
        title={editingTripId ? "Edit Itinerary" : "Add Itinerary"}
      >
        <div className="space-y-4">
          <label className="block text-xs text-[var(--text-secondary)]">
            Title
            <input
              value={tripForm.title}
              onChange={(e) =>
                setTripForm((f) => ({ ...f, title: e.target.value }))
              }
              placeholder="e.g. Japan Trip 2026"
              className={`${INPUT} mt-1`}
            />
          </label>

          <div className="space-y-3">
            {tripForm.days.map((day, dayIdx) => (
              <div
                key={dayIdx}
                className="p-3 rounded-lg bg-[var(--bg-input)] space-y-2"
              >
                <div className="flex items-center gap-2">
                  <input
                    value={day.label}
                    onChange={(e) => updateDayLabel(dayIdx, e.target.value)}
                    placeholder={`Day ${dayIdx + 1}`}
                    className={`${INPUT} flex-1`}
                  />
                  <button
                    onClick={() => moveDay(dayIdx, -1)}
                    disabled={dayIdx === 0}
                    aria-label="Move day up"
                    className="shrink-0 w-8 h-8 flex items-center justify-center text-[var(--text-secondary)] disabled:opacity-30"
                  >
                    <ChevronUpIcon className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => moveDay(dayIdx, 1)}
                    disabled={dayIdx === tripForm.days.length - 1}
                    aria-label="Move day down"
                    className="shrink-0 w-8 h-8 flex items-center justify-center text-[var(--text-secondary)] disabled:opacity-30"
                  >
                    <ChevronDownIcon className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => removeDay(dayIdx)}
                    aria-label="Remove day"
                    className="shrink-0 w-8 h-8 flex items-center justify-center text-[var(--danger)]"
                  >
                    <XMarkIcon className="w-4 h-4" />
                  </button>
                </div>

                {day.placeIds.length > 0 && (
                  <div className="space-y-1.5">
                    {day.placeIds.map((placeId, placeIdx) => {
                      const place = findPlace(placeId);
                      return (
                        <div
                          key={placeIdx}
                          className="flex items-center gap-2 p-1.5 rounded-lg bg-[var(--bg-surface)]"
                        >
                          <div className="w-8 h-8 rounded-md overflow-hidden shrink-0 bg-[var(--bg-input)] flex items-center justify-center">
                            {place?.images[0] ? (
                              <img
                                src={place.images[0]}
                                alt=""
                                className="w-full h-full object-cover"
                              />
                            ) : (
                              <MapPinIcon className="w-3.5 h-3.5 text-[var(--text-secondary)]" />
                            )}
                          </div>
                          <p className="text-sm flex-1 min-w-0 truncate">
                            {place?.title ?? "Deleted place"}
                          </p>
                          <button
                            onClick={() => movePlaceInDay(dayIdx, placeIdx, -1)}
                            disabled={placeIdx === 0}
                            aria-label="Move place up"
                            className="shrink-0 w-6 h-6 flex items-center justify-center text-[var(--text-secondary)] disabled:opacity-30"
                          >
                            <ChevronUpIcon className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => movePlaceInDay(dayIdx, placeIdx, 1)}
                            disabled={placeIdx === day.placeIds.length - 1}
                            aria-label="Move place down"
                            className="shrink-0 w-6 h-6 flex items-center justify-center text-[var(--text-secondary)] disabled:opacity-30"
                          >
                            <ChevronDownIcon className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => removePlaceFromDay(dayIdx, placeIdx)}
                            aria-label="Remove place"
                            className="shrink-0 w-6 h-6 flex items-center justify-center text-[var(--danger)]"
                          >
                            <XMarkIcon className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      );
                    })}
                  </div>
                )}

                <button
                  onClick={() => openPicker(dayIdx)}
                  className="w-full px-3 py-1.5 rounded-lg border border-dashed border-[var(--border-strong)] text-xs text-[var(--text-secondary)]"
                >
                  + Add place
                </button>
              </div>
            ))}

            <button
              onClick={addDay}
              className="w-full px-3 py-2 rounded-lg border border-dashed border-[var(--border-strong)] text-sm text-[var(--text-secondary)]"
            >
              + Add day
            </button>
          </div>

          <div className="flex items-center gap-2 pt-2">
            {editingTripId && (
              <button
                onClick={handleDeleteTrip}
                className="px-4 py-2 text-[var(--danger)] border border-[var(--danger)]/30 rounded-lg text-sm"
              >
                Delete
              </button>
            )}
            <button
              onClick={closeTripForm}
              className="flex-1 px-4 py-2 text-[var(--text-secondary)] border border-[var(--border-strong)] rounded-lg text-sm"
            >
              Cancel
            </button>
            <button
              onClick={saveTrip}
              disabled={tripsSaving}
              className="flex-1 bg-[var(--btn-bg)] text-[var(--btn-text)] font-semibold px-4 py-2 rounded-lg text-sm disabled:opacity-50"
            >
              {tripsSaving ? "Saving…" : "Save"}
            </button>
          </div>
        </div>
      </Modal>

      {/* PLACE PICKER — nested inside the itinerary form, for adding a place to a day */}
      <Modal
        open={pickerDayIndex !== null}
        onClose={closePicker}
        title="Add a place"
      >
        <div className="space-y-3">
          <div className="relative">
            <MagnifyingGlassIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--text-secondary)]" />
            <input
              value={pickerQuery}
              onChange={(e) => setPickerQuery(e.target.value)}
              placeholder="Search places"
              aria-label="Search places"
              className="w-full bg-[var(--bg-input)] pl-9 pr-3 py-2 rounded-lg text-sm text-[var(--text-primary)] border border-[var(--border-strong)] outline-none focus:border-[var(--accent)]/50"
            />
          </div>

          {places.length === 0 ? (
            <p className="text-sm text-[var(--text-secondary)] text-center py-6">
              No places saved yet — add one on the Places tab first.
            </p>
          ) : (
            <div className="space-y-1.5 max-h-80 overflow-y-auto">
              {places
                .filter(
                  (p) =>
                    !pickerQuery.trim() ||
                    p.title
                      .toLowerCase()
                      .includes(pickerQuery.trim().toLowerCase()),
                )
                .map((p) => (
                  <button
                    key={p._id}
                    onClick={() => addPlaceToDay(p._id)}
                    className="w-full flex items-center gap-2 p-1.5 rounded-lg bg-[var(--bg-input)] text-left"
                  >
                    <div className="w-9 h-9 rounded-md overflow-hidden shrink-0 bg-[var(--bg-surface)] flex items-center justify-center">
                      {p.images[0] ? (
                        <img
                          src={p.images[0]}
                          alt=""
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <MapPinIcon className="w-4 h-4 text-[var(--text-secondary)]" />
                      )}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium truncate">{p.title}</p>
                      {p.location && (
                        <p className="text-xs text-[var(--text-secondary)] truncate">
                          {p.location}
                        </p>
                      )}
                    </div>
                  </button>
                ))}
            </div>
          )}

          <button
            onClick={closePicker}
            className="w-full px-4 py-2 bg-[var(--btn-bg)] text-[var(--btn-text)] font-semibold rounded-lg text-sm"
          >
            Done
          </button>
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
