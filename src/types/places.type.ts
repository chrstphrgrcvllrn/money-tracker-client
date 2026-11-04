export type Place = {
  _id: string;
  title: string;
  location: string;
  details: string;
  specialty: string; // standout dishes/items worth trying, free text
  images: string[]; // base64 data URLs, resized/compressed client-side
  links: string[]; // video links (TikTok, YouTube, etc.), rendered as buttons
  mapLink: string; // optional precise Google Maps share link
  createdAt?: string;
  updatedAt?: string;
};

export type PlaceInput = {
  title: string;
  location: string;
  details: string;
  specialty: string;
  images: string[];
  links: string[];
  mapLink: string;
};
