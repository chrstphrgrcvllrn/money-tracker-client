import { api } from "@/api/client";

export const getSubscriptions = async () => {
  const res = await api.get("/subscription");
  return res.data;
};

export const createSubscription = async (data: unknown) => {
  const res = await api.post("/subscription", data);
  return res.data;
};

export const updateSubscription = async (id: string, data: unknown) => {
  const res = await api.put(`/subscription/${id}`, data);
  return res.data;
};

export const deleteSubscription = async (id: string) => {
  const res = await api.delete(`/subscription/${id}`);
  return res.data;
};

/**
 * ✅ CREATE PAYMENT (NEW - THIS FIXES YOUR + BUTTON)
 */
export const createPayment = async (subId: string, data: unknown) => {
  const res = await api.post(`/subscription/${subId}/payment`, data);
  return res.data;
};

/**
 * ⚠️ UPDATE PAYMENT (FIXED SAFETY CHECK)
 */
export const updatePayment = async (data: {
  subId: string;
  paymentId: string;
  date?: string;
  status?: "paid" | "pending" | "prepared";
}) => {
  if (!data.subId || !data.paymentId) {
    throw new Error("Missing subId or paymentId");
  }

  const res = await api.patch("/subscription/payment", data);
  return res.data;
};
