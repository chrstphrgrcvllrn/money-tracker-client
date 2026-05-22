export type Expense = {
  _id: string;
  text: string;
  amount: number;
  done: boolean;
  category: string; // ✅ NEW
  createdAt: string;
  updatedAt?: string;
};