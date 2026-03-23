import axios from "axios";
import type { SalaryEntry } from "../types/salary.type";

const API_URL = "http://localhost:5000/api/salary";

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