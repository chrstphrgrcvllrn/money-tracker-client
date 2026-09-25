import { api } from "@/api/client";

// FETCH
export const fetchExpenses = async () => {
  const res = await api.get("/expenses");
  return res.data;
};

export const createExpense = async (data: {
  text: string;
  amount: number;
  category?: string;
}) => {
  const res = await api.post("/expenses", data);
  return res.data;
};

export const updateExpense = async (
  id: string,
  data: { text: string; amount: number; category?: string }
) => {
  const res = await api.put(`/expenses/${id}`, data);
  return res.data;
};
// DELETE
export const deleteExpense = async (id: string) => {
  const res = await api.delete(`/expenses/${id}`);
  return res.data;
};

// TOGGLE
export const toggleExpense = async (id: string) => {
  const res = await api.patch(`/expenses/${id}/toggle`);
  return res.data;
};
