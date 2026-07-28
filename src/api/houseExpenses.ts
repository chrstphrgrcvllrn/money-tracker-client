import axios from "axios";

const BASE_URL =
  import.meta.env.MODE === "production"
    ? import.meta.env.VITE_PROD_API_URL
    : import.meta.env.VITE_DEV_API_URL;

const API_URL = `${BASE_URL}/api/house-expenses`;

// FETCH
export const fetchHouseExpenses = async () => {
  const res = await axios.get(API_URL);
  return res.data;
};

// CREATE
export const createHouseExpense = async (data: {
  text: string;
  amount: number;
  category?: string;
}) => {
  const res = await axios.post(API_URL, data);
  return res.data;
};

// UPDATE
export const updateHouseExpense = async (
  id: string,
  data: {
    text: string;
    amount: number;
    category?: string;
  }
) => {
  const res = await axios.put(`${API_URL}/${id}`, data);
  return res.data;
};

// DELETE
export const deleteHouseExpense = async (id: string) => {
  const res = await axios.delete(`${API_URL}/${id}`);
  return res.data;
};

// TOGGLE
export const toggleHouseExpense = async (id: string) => {
  const res = await axios.patch(`${API_URL}/${id}/toggle`);
  return res.data;
};