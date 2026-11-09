import { api } from "@/api/client";
import type { Trip, TripInput } from "@/types/trips.type";

export const getTrips = async (): Promise<Trip[]> => {
  const res = await api.get("/trips");
  return res.data;
};

export const createTrip = async (data: TripInput): Promise<Trip> => {
  const res = await api.post("/trips", data);
  return res.data;
};

export const updateTrip = async (id: string, data: Partial<TripInput>): Promise<Trip> => {
  const res = await api.put(`/trips/${id}`, data);
  return res.data;
};

export const deleteTrip = async (id: string): Promise<void> => {
  await api.delete(`/trips/${id}`);
};
