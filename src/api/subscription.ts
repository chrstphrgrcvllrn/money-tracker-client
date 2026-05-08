import axios from "axios";


const BASE_URL =
  import.meta.env.NODE_ENV === "production"
    ? `${import.meta.env.VITE_PROD_API_URL}/api/subscription`
    : `${import.meta.env.VITE_DEV_API_URL}/api/subscription`

export const getSubscriptions = async () => {
  const res = await axios.get(BASE_URL);
  return res.data;
};

export const createSubscription = async (data: any) => {
  const res = await axios.post(BASE_URL, data);
  return res.data;
};

export const updateSubscription = async (id: string, data: any) => {
  const res = await axios.put(`${BASE_URL}/${id}`, data);
  return res.data;
};

export const deleteSubscription = async (id: string) => {
  const res = await axios.delete(`${BASE_URL}/${id}`);
  return res.data;
};

// 🔥 NEW
export const updatePayment = async (data: {
  subId: string;
  paymentId: string;
  date?: string;
  status?: "paid" | "pending";
}) => {
  const res = await axios.patch(`${BASE_URL}/payment`, data);
  return res.data;
};