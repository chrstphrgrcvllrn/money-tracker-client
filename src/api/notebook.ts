import axios from "axios";
import type { NotebookNote } from "../types/notebook.type";

const API_URL =
  import.meta.env.NODE_ENV === "production"
    ? `${import.meta.env.VITE_PROD_API_URL}/api/notebook`
    : `${import.meta.env.VITE_DEV_API_URL}/api/notebook`;

export const getNotebookNotes = async (): Promise<NotebookNote[]> => {
  const res = await axios.get(API_URL);
  return res.data;
};

export const createNotebookNote = async (
  data: Pick<NotebookNote, "title" | "content">
): Promise<NotebookNote> => {
  const res = await axios.post(API_URL, data);
  return res.data;
};

export const updateNotebookNote = async (
  id: string,
  data: Partial<Pick<NotebookNote, "title" | "content" | "status">>
): Promise<NotebookNote> => {
  const res = await axios.patch(`${API_URL}/${id}`, data);
  return res.data;
};

export const toggleNotebookNoteStatus = async (
  id: string
): Promise<NotebookNote> => {
  const res = await axios.patch(`${API_URL}/${id}/toggle`);
  return res.data;
};

export const deleteNotebookNote = async (
  id: string
): Promise<void> => {
  await axios.delete(`${API_URL}/${id}`);
};