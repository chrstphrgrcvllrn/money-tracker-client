import { api } from "@/api/client";
import type { Loan } from "../types/loans.type";

// GET loans
export const getLoans = async (): Promise<Loan[]> => {
  const res = await api.get("/loans");

  const json = res.data;
  return Array.isArray(json) ? json : [json];
};

// CREATE loan
export const createLoan = async (
  loan: Omit<Loan, "_id">
): Promise<Loan> => {
  const res = await api.post("/loans", loan);
  return res.data;
};

// UPDATE loan (rename, edit amount, archive/unarchive)
export const updateLoan = async (
  id: string,
  data: Partial<Pick<Loan, "name" | "initialAmount" | "archived">>
): Promise<Loan> => {
  const res = await api.put(`/loans/${id}`, data);
  return res.data;
};

// ADD transaction
export const addTransaction = async (id: string, data: unknown) => {
  const res = await api.post(`/loans/${id}/transactions`, data);
  return res.data;
};
