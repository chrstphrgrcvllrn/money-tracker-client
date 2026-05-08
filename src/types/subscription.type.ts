export type Payment = {
  _id: string;
  date: string;
  amount: number;
  status: "paid" | "pending";
};

export type Subscription = {
  _id: string;
  name: string;
  amount: number;
  billing: "monthly" | "yearly";
  type: "auto" | "manual";
  payments?: Payment[];
};