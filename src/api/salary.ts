import { api } from "@/api/client";
import type { SalaryEntry } from "../types/salary.type";

//
// SALARY
//

// GET
export const fetchSalaries = async (): Promise<SalaryEntry[]> => {
  const res = await api.get("/salary");
  return res.data;
};

// CREATE
export const createSalary = async (data: Partial<SalaryEntry>) => {
  const res = await api.post("/salary", data);
  return res.data;
};

// UPDATE
export const updateSalary = async (
  id: string,
  data: Partial<SalaryEntry>
) => {
  const res = await api.put(`/salary/${id}`, data);
  return res.data;
};

// DELETE
export const deleteSalary = async (id: string) => {
  const res = await api.delete(`/salary/${id}`);
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
  const res = await api.post(`/salary/${salaryId}/expense`, data);
  return res.data;
};

// UPDATE EXPENSE
export const updateExpense = async (
  salaryId: string,
  expenseId: string,
  data: Partial<{ name: string; amount: number; paid: boolean }>
) => {
  const res = await api.put(`/salary/${salaryId}/expense/${expenseId}`, data);
  return res.data;
};

// DELETE EXPENSE
export const deleteExpense = async (
  salaryId: string,
  expenseId: string
) => {
  const res = await api.delete(`/salary/${salaryId}/expense/${expenseId}`);
  return res.data;
};
