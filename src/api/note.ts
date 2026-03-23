import axios from "axios";
import type { Note } from "../types/notes.type";

const API_URL = "http://localhost:5000/api/notes";

// Get all notes
export const getNotes = async (): Promise<Note[]> => {
  const res = await axios.get(API_URL);
  return res.data;
};

// Create note
export const createNote = async (
  data: Pick<Note, "text" | "category">
): Promise<Note> => {
  const res = await axios.post(API_URL, data);
  return res.data;
};

// Toggle done
export const toggleNote = async (id: string): Promise<Note> => {
  const res = await axios.patch(`${API_URL}/${id}`);
  return res.data;
};

// Delete note
export const deleteNote = async (id: string): Promise<void> => {
  await axios.delete(`${API_URL}/${id}`);
};