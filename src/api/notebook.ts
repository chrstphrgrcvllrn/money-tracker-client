import { api } from "@/api/client";
import type { NotebookNote } from "../types/notebook.type";

export const getNotebookNotes = async (): Promise<NotebookNote[]> => {
  const res = await api.get("/notebook");
  return res.data;
};

export const createNotebookNote = async (
  data: Pick<NotebookNote, "title" | "content">
): Promise<NotebookNote> => {
  const res = await api.post("/notebook", data);
  return res.data;
};

export const updateNotebookNote = async (
  id: string,
  data: Partial<Pick<NotebookNote, "title" | "content" | "status">>
): Promise<NotebookNote> => {
  const res = await api.patch(`/notebook/${id}`, data);
  return res.data;
};

export const toggleNotebookNoteStatus = async (
  id: string
): Promise<NotebookNote> => {
  const res = await api.patch(`/notebook/${id}/toggle`);
  return res.data;
};

export const deleteNotebookNote = async (
  id: string
): Promise<void> => {
  await api.delete(`/notebook/${id}`);
};
