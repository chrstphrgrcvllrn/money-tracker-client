import axios from "axios";

const API_URL = import.meta.env.NODE_ENV === 'production'
  ? `${import.meta.env.VITE_PROD_API_URL}/api/expenses` // actual site
  : `${import.meta.env.VITE_DEV_API_URL}/api/expenses` ; // local/dev


// =========================
// FETCH
// =========================
export const fetchExpenses = async () => {
  const res = await axios.get(API_URL);
  console.log("Raw API response:", res.data); // <- here
  return res.data;
};

// =========================
// CREATE
// =========================
export const createExpense = async (data: {
  text: string;
  amount: number;
}) => {
  const res = await axios.post(API_URL, data);
  return res.data;
};

// =========================
// TOGGLE DONE
// =========================
export const toggleExpense = async (id: string) => {
  const res = await axios.patch(`${API_URL}/${id}/toggle`);
  return res.data;
};

// =========================
// UPDATE EXPENSE
// =========================
export const updateExpense = async (
  id: string,
  data: { text: string; amount: number }
) => {
  const res = await axios.put(`${API_URL}/${id}`, data);
  return res.data;
};

// =========================
// DELETE EXPENSE
// =========================
export const deleteExpense = async (id: string) => {
  const res = await axios.delete(`${API_URL}/${id}`);
  return res.data;
};