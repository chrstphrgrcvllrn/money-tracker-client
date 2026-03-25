export type Bill = {
  name: string;
  amount: number;
  dueDate: string;
  paid: boolean;
};

export type BillsEntry = {
  _id: string;
  month: string; // e.g. "May 2026"
  bills: Bill[];
};