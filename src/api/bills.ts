import axios from "axios";
import type { BillsEntry } from "../types/bills.type";


const API_URL = import.meta.env.NODE_ENV === 'production'
  ? `${import.meta.env.VITE_PROD_API_URL}/api/bills` // actual site
  : `${import.meta.env.VITE_DEV_API_URL}/api/bills` ; // local/dev


// ✅ GET ALL
export const fetchBills = async (): Promise<BillsEntry[]> => {
  const res = await axios.get(API_URL);
  return res.data;
};

// ✅ CREATE MONTH ENTRY
export const createBill = async (
  data: Partial<BillsEntry>
): Promise<BillsEntry> => {
  const res = await axios.post(API_URL, data);
  return res.data;
};

// ✅ UPDATE (add/edit bills inside month)
export const updateBill = async (
  id: string,
  data: Partial<BillsEntry>
): Promise<BillsEntry> => {
  const res = await axios.put(`${API_URL}/${id}`, data);
  return res.data;
};