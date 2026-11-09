import type { Place, SpotInput } from "@/types/places.type";

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
