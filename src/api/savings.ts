import { api } from "@/api/client";
import type { Savings, SavingsTransaction } from "../types/savings.type";

// ✅ Get all savings
export const getSavings = async (): Promise<Savings[]> => {
  const res = await api.get("/savings");
  return res.data;
};

// ✅ Create savings
export const createSavings = async (
  savings: Omit<Savings, "_id">
): Promise<Savings> => {
  const res = await api.post("/savings", savings);
  return res.data;
};

// ✅ Add transaction
export const addSavingsTransaction = async (
  savingsId: string,
  transaction: SavingsTransaction
): Promise<Savings> => {
  const res = await api.post(`/savings/${savingsId}/transactions`, transaction);
  return res.data;
};

// ✅ Delete savings
export const deleteSavings = async (savingsId: string): Promise<void> => {
  await api.delete(`/savings/${savingsId}`);
};
