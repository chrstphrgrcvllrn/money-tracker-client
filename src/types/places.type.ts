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
  spots: Spot[]; // sub-locations, each with its own sections
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
};
