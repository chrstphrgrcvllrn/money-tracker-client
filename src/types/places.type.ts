// A named sub-location inside a place (e.g. "Mount Fansipan" in "Sapa").
export type SpotInput = {
  name: string;
  images: string[]; // base64 data URLs
  links: string[];
  mapLink: string;
  notes: string;
  whereToEat: string;
  hotel: string;
};

export type Spot = SpotInput & { _id: string };

// A place inside the country (e.g. "Sapa" inside "Vietnam"), grouping its spots.
export type SubPlaceInput = {
  name: string;
  spots: SpotInput[];
};

export type SubPlace = { _id: string; name: string; spots: Spot[] };

export type Place = {
  _id: string;
  title: string;
  location: string;
  details: string;
  specialty: string; // standout dishes/items worth trying, free text
  thingsToKnow: string; // tips/warnings worth knowing before going, free text
  images: string[]; // base64 data URLs, resized/compressed client-side
  foodImages: string[]; // separate gallery for the `specialty` dishes/items
  links: string[]; // video links (TikTok, YouTube, etc.), rendered as buttons
  mapLink: string; // optional precise Google Maps share link
  spots?: Spot[]; // legacy: spots that used to hang directly off a place
  subPlaces: SubPlace[]; // places inside this one, each with spots
  createdAt?: string;
  updatedAt?: string;
};

export type PlaceInput = {
  title: string;
  location: string;
  details: string;
  specialty: string;
  thingsToKnow: string;
  images: string[];
  foodImages: string[];
  links: string[];
  mapLink: string;
  spots: SpotInput[];
  subPlaces: SubPlaceInput[];
};
