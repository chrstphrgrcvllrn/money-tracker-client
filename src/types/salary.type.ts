export type Expense = {
  _id?: string;
  name: string;
  amount: number;
  paid?: boolean;
};

export type SalaryEntry = {
  _id: string;
  month: string;
  salary?: number;
  expenses: Expense[];
};