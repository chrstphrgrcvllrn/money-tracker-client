import { api } from "@/api/client";
import type { Note } from "../types/notes.type";

// Get all notes
export const getNotes = async (): Promise<Note[]> => {
  const res = await api.get("/notes");
  return res.data;
};

// Create note
export const createNote = async (
  data: Pick<Note, "text" | "category">
): Promise<Note> => {
  const res = await api.post("/notes", data);
  return res.data;
};

// Toggle done
export const toggleNote = async (id: string): Promise<Note> => {
  const res = await api.patch(`/notes/${id}`);
  return res.data;
};

// Delete note
export const deleteNote = async (id: string): Promise<void> => {
  await api.delete(`/notes/${id}`);
};
