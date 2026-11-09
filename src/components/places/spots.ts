import type { SpotInput } from "@/types/places.type";

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
  whereToEat: "",
  hotel: "",
});
