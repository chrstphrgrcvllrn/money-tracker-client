export type WatchItem = {
  _id: string;
  title: string;
  current: string;
  nextRelease: string;
  status: "ongoing" | "completed";
};