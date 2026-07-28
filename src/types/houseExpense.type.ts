export type HouseExpense = {
  _id: string;
  text: string;
  amount: number;
  done: boolean;
  category: string;
  createdAt: string;
  updatedAt?: string;
};