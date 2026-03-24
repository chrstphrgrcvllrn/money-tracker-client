export interface SavingsTransaction {
  date: string;
  amount: number; // + deposit, - withdrawal
  type: string;
}

export interface Savings {
  _id: string;
  name: string;
  initialAmount: number;
  transactions: SavingsTransaction[];
}