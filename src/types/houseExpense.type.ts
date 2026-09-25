export type HouseExpense = {
  _id: string;
  text: string;
  amount: number;
  done: boolean;
  category: string;
  borrowedBy?: string; // who borrowed it from the house budget ("" = normal expense)
  createdAt: string;
  updatedAt?: string;
};