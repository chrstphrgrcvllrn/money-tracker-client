export type Place = {
  _id: string;
  title: string;
  location: string;
  details: string;
  images: string[]; // base64 data URLs, resized/compressed client-side
  links: string[]; // video links (TikTok, YouTube, etc.), rendered as buttons
  createdAt?: string;
  updatedAt?: string;
};

export type PlaceInput = {
  title: string;
  location: string;
  details: string;
  images: string[];
  links: string[];
};
