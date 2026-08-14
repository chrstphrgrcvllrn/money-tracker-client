export type NotebookNote = {
  _id: string;
  title: string;
  content: string;
  status: "open" | "closed";
  createdAt: string;
  updatedAt: string;
};