import axios from "axios";

const API_URL = import.meta.env.NODE_ENV === 'production'
  ? `${import.meta.env.VITE_PROD_API_URL}/api/expenses` // actual site
  : `${import.meta.env.VITE_DEV_API_URL}/api/expenses` ; // local/dev



export const fetchExpenses = async () => {
  const res = await axios.get(API_URL);
  return res.data;
};

export const createExpense = async (data: {
  text: string;
  amount: number;
}) => {
  const res = await axios.post(API_URL, data);
  return res.data;
};

export const toggleExpense = async (id: string) => {
  const res = await axios.put(`${API_URL}/${id}/toggle`);
  return res.data;
};