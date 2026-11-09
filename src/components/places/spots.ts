import type {
  Place,
  Spot,
  SpotInput,
  SubPlace,
  SubPlaceInput,
} from "@/types/places.type";

export const MAX_SPOTS = 15;
export const MAX_SPOT_IMAGES = 4;

// `uid` is a client-only React key so removing a spot doesn't shuffle the
// state of the ones after it; it is stripped before saving.
export type EditableSpot = SpotInput & { uid: string };

export const newSpot = (): EditableSpot => ({
  uid: crypto.randomUUID(),
  name: "",
  images: [],
  links: [],
  mapLink: "",
  notes: "",
  activities: "",
  whereToEat: "",
  hotel: "",
});

export const MAX_SUBPLACES = 15;

export type EditableSubPlace = {
  uid: string;
  name: string;
  spots: EditableSpot[];
};

export const newSubPlace = (): EditableSubPlace => ({
  uid: crypto.randomUUID(),
  name: "",
  spots: [],
});

// Sub-places for a place, folding any legacy top-level spots into a group so
// data saved before sub-places existed still shows up.
export const subPlacesOf = (p: Place) => {
  const groups = [...(p.subPlaces ?? [])];
  if ((p.spots ?? []).length > 0)
    groups.unshift({ _id: "legacy", name: "Spots", spots: p.spots ?? [] });
  return groups;
};

export const toEditableSpot = (spot: Spot): EditableSpot => ({
  ...newSpot(),
  name: spot.name,
  images: [...spot.images],
  links: [...spot.links],
  mapLink: spot.mapLink ?? "",
  notes: spot.notes ?? "",
  activities: spot.activities ?? "",
  whereToEat: spot.whereToEat ?? "",
  hotel: spot.hotel ?? "",
});

const OBJECT_ID = /^[a-f0-9]{24}$/i;

// Saved sub-places back to the payload shape. Real ids are kept; the synthetic
// "legacy" group has none, so it becomes a regular new sub-place.
export const subPlacesToInput = (groups: SubPlace[]): SubPlaceInput[] =>
  groups.map((g) => ({
    ...(OBJECT_ID.test(g._id) ? { _id: g._id } : {}),
    name: g.name,
    spots: g.spots.map((s) => ({
      ...(OBJECT_ID.test(s._id) ? { _id: s._id } : {}),
      name: s.name,
      images: s.images,
      links: s.links,
      mapLink: s.mapLink ?? "",
      notes: s.notes ?? "",
      activities: s.activities ?? "",
      whereToEat: s.whereToEat ?? "",
      hotel: s.hotel ?? "",
    })),
  }));
