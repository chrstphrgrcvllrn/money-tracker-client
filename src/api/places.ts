import { api } from "@/api/client";
import type { Place, PlaceInput } from "@/types/places.type";

export const getPlaces = async (): Promise<Place[]> => {
  const res = await api.get("/places");
  return res.data;
};

export const createPlace = async (data: PlaceInput): Promise<Place> => {
  const res = await api.post("/places", data);
  return res.data;
};

export const updatePlace = async (id: string, data: Partial<PlaceInput>): Promise<Place> => {
  const res = await api.put(`/places/${id}`, data);
  return res.data;
};

export const deletePlace = async (id: string): Promise<void> => {
  await api.delete(`/places/${id}`);
};
