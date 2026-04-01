import axios from "axios";
import type { Savings, SavingsTransaction } from "../types/savings.type";

const BASE_URL =
  import.meta.env.NODE_ENV === "production"
    ? `${import.meta.env.VITE_PROD_API_URL}/api/savings`
    : `${import.meta.env.VITE_DEV_API_URL}/api/savings`;

// Create axios instance (optional but cleaner)
const api = axios.create({
  baseURL: BASE_URL,
});

// ✅ Get all savings
export const getSavings = async (): Promise<Savings[]> => {
  const res = await api.get("/");
  return res.data;
};

// ✅ Create savings
export const createSavings = async (
  savings: Omit<Savings, "_id">
): Promise<Savings> => {
  const res = await api.post("/", savings);
  return res.data;
};

// ✅ Add transaction
export const addSavingsTransaction = async (
  savingsId: string,
  transaction: SavingsTransaction
): Promise<Savings> => {
  const res = await api.post(`/${savingsId}/transactions`, transaction);
  return res.data;
};

// ✅ Delete savings
export const deleteSavings = async (savingsId: string): Promise<void> => {
  await api.delete(`/${savingsId}`);
};