import { api } from "@/api/client";

// FETCH
export const fetchHouseExpenses = async () => {
  const res = await api.get("/house-expenses");
  return res.data;
};

// CREATE
export const createHouseExpense = async (data: {
  text: string;
  amount: number;
  category?: string;
  borrowedBy?: string;
}) => {
  const res = await api.post("/house-expenses", data);
  return res.data;
};

// UPDATE
export const updateHouseExpense = async (
  id: string,
  data: {
    text: string;
    amount: number;
    category?: string;
    borrowedBy?: string;
  }
) => {
  const res = await api.put(`/house-expenses/${id}`, data);
  return res.data;
};

// DELETE
export const deleteHouseExpense = async (id: string) => {
  const res = await api.delete(`/house-expenses/${id}`);
  return res.data;
};

// TOGGLE
export const toggleHouseExpense = async (id: string) => {
  const res = await api.patch(`/house-expenses/${id}/toggle`);
  return res.data;
};
