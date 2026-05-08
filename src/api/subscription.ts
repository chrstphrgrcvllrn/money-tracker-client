import axios from "axios";

const API = "http://localhost:5000/api/subscription";

export const getSubscriptions = async () => {
  const res = await axios.get(API);
  return res.data;
};

export const createSubscription = async (data: any) => {
  const res = await axios.post(API, data);
  return res.data;
};

export const updateSubscription = async (id: string, data: any) => {
  const res = await axios.put(`${API}/${id}`, data);
  return res.data;
};

export const deleteSubscription = async (id: string) => {
  const res = await axios.delete(`${API}/${id}`);
  return res.data;
};

// 🔥 NEW
export const updatePayment = async (data: {
  subId: string;
  paymentId: string;
  date?: string;
  status?: "paid" | "pending";
}) => {
  const res = await axios.patch(`${API}/payment`, data);
  return res.data;
};