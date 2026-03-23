import axios from "axios";
import type { SalaryEntry } from "../types/salary.type";

// const API_URL = "http://localhost:5000/api/salary";
// const API_URL = `${import.meta.env.VITE_API_URL}/api/salary`;

const API_URL = import.meta.env.NODE_ENV === 'production'
  ? `${import.meta.env.VITE_PROD_API_URL}/api/salary` // actual site
  : `${import.meta.env.VITE_DEV_API_URL}/api/salary` ; // local/dev



console.log("API_URL:", API_URL);
// GET
export const fetchSalaries = async (): Promise<SalaryEntry[]> => {
  const res = await axios.get(API_URL);
  return res.data;
};

// CREATE
export const createSalary = async (data: Partial<SalaryEntry>) => {
  const res = await axios.post(API_URL, data);
  return res.data;
};

// UPDATE
export const updateSalary = async (id: string, data: Partial<SalaryEntry>) => {
  const res = await axios.put(`${API_URL}/${id}`, data);
  return res.data;
};