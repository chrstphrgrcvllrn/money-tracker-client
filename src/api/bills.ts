import type { MonthlyBills, Bill } from "../types/bills.type";

// const API_URL = "http://localhost:5000/api/bills";
// const API_URL = `${import.meta.env.VITE_API_URL}/api/bills`;


const API_URL = import.meta.env.NODE_ENV === 'production'
  ? `${import.meta.env.VITE_PROD_API_URL}/api/bills` // actual site
  : `${import.meta.env.VITE_DEV_API_URL}/api/bills` ; // local/dev


console.log("API_URL:", API_URL);
// GET all months with bills
export const getMonthlyBills = async (): Promise<MonthlyBills[]> => {
  const res = await fetch(API_URL);
  if (!res.ok) throw new Error("Failed to fetch bills");
  return res.json();
};

// ADD bill to a month
export const addBill = async (
  monthId: string,
  bill: Bill
): Promise<MonthlyBills> => {
  const res = await fetch(`${API_URL}/${monthId}/bills`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(bill),
  });

  if (!res.ok) throw new Error("Failed to add bill");
  return res.json();
};

// UPDATE bill status
export const updateBillStatus = async (
  monthId: string,
  billId: string,
  status: "Paid" | "Pending"
): Promise<MonthlyBills> => {
  const res = await fetch(`${API_URL}/${monthId}/bills/${billId}`, {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ status }),
  });

  if (!res.ok) throw new Error("Failed to update bill");
  return res.json();
};

// DELETE bill
export const deleteBill = async (
  monthId: string,
  billId: string
): Promise<MonthlyBills> => {
  const res = await fetch(`${API_URL}/${monthId}/bills/${billId}`, {
    method: "DELETE",
  });

  if (!res.ok) throw new Error("Failed to delete bill");
  return res.json();
};