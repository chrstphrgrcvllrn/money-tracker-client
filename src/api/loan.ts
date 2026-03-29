import type { Loan } from "../types/loans.type";

// const API_URL = "http://localhost:5000/api/loans";
// const API_URL = `${import.meta.env.VITE_API_URL}/api/loans`;


const API_URL = import.meta.env.NODE_ENV === 'production'
  ? `${import.meta.env.VITE_PROD_API_URL}/api/loans` // actual site
  : `${import.meta.env.VITE_DEV_API_URL}/api/loans` ; // local/dev


console.log("API_URL:", API_URL);


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
export const addTransaction = async (id: string, data: any) => {
  const res = await fetch(`${API_URL}/${id}/transactions`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(data),
  });

  if (!res.ok) {
    throw new Error("Failed to add transaction");
  }

  return res.json();
};