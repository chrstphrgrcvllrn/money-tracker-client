export type Expense = {
  _id: string;
  text: string;
  amount: number;
  done: boolean;
  createdAt: string; // ✅ important fix
  updatedAt?: string;
};