import { api } from "@/api/client";
import type { BillsEntry } from "../types/bills.type";

// ✅ GET ALL
export const fetchBills = async (): Promise<BillsEntry[]> => {
  const res = await api.get("/bills");
  return res.data;
};

// ✅ CREATE MONTH ENTRY
export const createBill = async (
  data: Partial<BillsEntry>
): Promise<BillsEntry> => {
  const res = await api.post("/bills", data);
  return res.data;
};

// ✅ UPDATE (add/edit bills inside month)
export const updateBill = async (
  id: string,
  data: Partial<BillsEntry>
): Promise<BillsEntry> => {
  const res = await api.put(`/bills/${id}`, data);
  return res.data;
};
