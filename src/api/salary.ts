import axios from "axios";
import type { SalaryEntry } from "../types/salary.type";

// API URL config
const API_URL =
  import.meta.env.NODE_ENV === "production"
    ? `${import.meta.env.VITE_PROD_API_URL}/api/salary`
    : `${import.meta.env.VITE_DEV_API_URL}/api/salary`;

console.log("API_URL:", API_URL);

//
// SALARY
//

// GET
export const fetchSalaries = async (): Promise<SalaryEntry[]> => {
  const res = await axios.get(API_URL);
  return res.data;
};

// CREATE
export const createSalary = async (data: Partial<SalaryEntry>) => {
  const res = await axios.post(API_URL, data);
  return res.data;
};

// UPDATE
export const updateSalary = async (
  id: string,
  data: Partial<SalaryEntry>
) => {
  const res = await axios.put(`${API_URL}/${id}`, data);
  return res.data;
};

// DELETE
export const deleteSalary = async (id: string) => {
  const res = await axios.delete(`${API_URL}/${id}`);
  return res.data;
};

//
// EXPENSES
//

// ADD EXPENSE
export const addExpense = async (
  salaryId: string,
  data: { name: string; amount: number }
) => {
  const res = await axios.post(
    `${API_URL}/${salaryId}/expense`,
    data
  );
  return res.data;
};

// UPDATE EXPENSE
export const updateExpense = async (
  salaryId: string,
  expenseId: string,
  data: Partial<{ name: string; amount: number; paid: boolean }>
) => {
  const res = await axios.put(
    `${API_URL}/${salaryId}/expense/${expenseId}`,
    data
  );
  return res.data;
};

// DELETE EXPENSE
export const deleteExpense = async (
  salaryId: string,
  expenseId: string
) => {
  const res = await axios.delete(
    `${API_URL}/${salaryId}/expense/${expenseId}`
  );
  return res.data;
};