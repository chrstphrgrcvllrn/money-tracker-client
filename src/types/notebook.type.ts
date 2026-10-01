export type NotebookNote = {
  _id: string;
  title: string;
  content: string;
  status: "open" | "closed";
  pinned: boolean;
  createdAt: string;
  updatedAt: string;
};