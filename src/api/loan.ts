import type { Loan } from "../types/loans.type";

const API_URL = "http://localhost:5000/api/loans";

// GET loans
export const getLoans = async (): Promise<Loan[]> => {
  const res = await fetch(API_URL);

  if (!res.ok) throw new Error("Failed to fetch loans");

  const json = await res.json();
  return Array.isArray(json) ? json : [json];
};

// CREATE loan
export const createLoan = async (
  loan: Omit<Loan, "_id">
): Promise<Loan> => {
  const res = await fetch(API_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(loan),
  });

  if (!res.ok) throw new Error("Failed to create loan");

  return res.json();
};

// ADD transaction
export const addTransaction = async (
  loanId: string,
  transaction: { date: string; amount: number; type: string }
): Promise<Loan> => {
  const res = await fetch(`${API_URL}/${loanId}/transactions`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(transaction),
  });

  if (!res.ok) throw new Error("Failed to add transaction");

  return res.json();
};