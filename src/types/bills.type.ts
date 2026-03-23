export type Bill = {
  _id?: string;
  name: string;
  amount: number;
  datePaid: string;
  status: "Paid" | "Pending";
};

export type MonthlyBills = {
  _id?: string;
  month: string;
  bills: Bill[];
};