export type Payment = {
  _id: string;
  date: string;
  amount: number;
  status: "paid" | "pending" | "prepared";
};

export type Subscription = {
  _id: string;
  name: string;
  amount: number;
  billing: "monthly" | "yearly";
  type: "auto" | "manual";
  startDate?: string; // ✅ ADD THIS
  payments?: Payment[];
};