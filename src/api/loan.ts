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

// ADD transaction — returns the whole updated loan (so the new entry's real
// _id, needed to delete it later, is available).
export const addTransaction = async (id: string, data: unknown): Promise<Loan> => {
  const res = await api.post(`/loans/${id}/transactions`, data);
  return res.data;
};

// UPDATE the notes on one entry. Returns the whole updated loan.
export const updateTransactionNotes = async (
  id: string,
  transactionId: string,
  notes: string
): Promise<Loan> => {
  const res = await api.patch(`/loans/${id}/transactions/${transactionId}`, { notes });
  return res.data;
};

// DELETE transaction (e.g. a mis-entered payment)
export const deleteTransaction = async (id: string, transactionId: string): Promise<Loan> => {
  const res = await api.delete(`/loans/${id}/transactions/${transactionId}`);
  return res.data;
};

// DELETE a whole loan, with all of its payments. Irreversible.
export const deleteLoan = async (id: string): Promise<void> => {
  await api.delete(`/loans/${id}`);
};
