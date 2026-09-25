import { api } from "@/api/client";

export const getThoughts = async () => {
  const res = await api.get("/thoughts");
  return res.data;
};

export const createThought = async (text: string) => {
  const res = await api.post("/thoughts", { text });
  return res.data;
};
