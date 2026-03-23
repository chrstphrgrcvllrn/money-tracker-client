export type Note = {
  _id: string;
  text: string;
  category: "work" | "personal" | "others";
  done: boolean;
};