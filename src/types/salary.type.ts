export type Expense = {
  _id?: string;
  name: string;
  amount: number;
  paid?: boolean;
};

export type SalaryEntry = {
  _id: string;
  date: string; // frontend uses "date"
  salary: number;
  expenses: Expense[];
};