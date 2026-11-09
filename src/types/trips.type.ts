export type TripDay = {
  label: string; // e.g. "Day 1"
  placeIds: string[]; // ordered — ids of saved Places
};

export type Trip = {
  _id: string;
  title: string;
  days: TripDay[];
  createdAt?: string;
  updatedAt?: string;
};

export type TripInput = {
  title: string;
  days: TripDay[];
};
