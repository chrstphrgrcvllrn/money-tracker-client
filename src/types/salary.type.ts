export type Expense = {
  _id?: string;
  name: string;
  amount: number;
  paid?: boolean;
  note?: string;
  category?: string;
};

export type SalaryEntry = {
  _id: string;
  date: string; // frontend uses "date"
  salary: number;
  overtime?: number;
  adjustment?: number;
  expenses: Expense[];
};