export type Transaction = {
  date: string;
  amount: number;
  type: string;
};

export type Loan = {
  _id: string;
  name: string;
  initialAmount: number;
  transactions: Transaction[];
};