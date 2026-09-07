export type TrackerCategory =
  | "medical"
  | "dental"
  | "motorcycle"
  | "crypto"
  | "digital"
  | "amilyar";

export type TrackerEntry = {
  _id: string;
  category: TrackerCategory;
  name: string;
  details: string;
  date: string;
  amount?: number;
  price?: number;
  notes?: string;
  createdAt?: string;
  updatedAt?: string;
};
