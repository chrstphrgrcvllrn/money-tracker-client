export type Expense = {
  _id?: string;
  name: string;
  amount: number;
  paid?: boolean;
  note?: string;
  category?: string;
};

// Custom income line on a salary (e.g. "13th month"), added to the budget.
export type SalaryExtra = {
  _id?: string;
  name: string;
  amount: number;
};

export type SalaryEntry = {
  _id: string;
  date: string; // frontend uses "date"
  salary: number;
  overtime?: number;
  adjustment?: number;
  extras?: SalaryExtra[];
  expenses: Expense[];
};