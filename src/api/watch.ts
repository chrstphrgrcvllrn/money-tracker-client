const BASE_URL =
  import.meta.env.MODE === "production"
    ? `${import.meta.env.VITE_PROD_API_URL}/api/watchlist`
    : `${import.meta.env.VITE_DEV_API_URL}/api/watchlist`;

// -------------------------
// SAFE FETCH WRAPPER
// -------------------------
const request = async (url: string, options?: RequestInit) => {
  const res = await fetch(url, options);

  const data = await res.json().catch(() => null);

  if (!res.ok) {
    throw new Error(data?.message || "Request failed");
  }

  return data;
};

// -------------------------
// GET WATCHLIST
// -------------------------
export const getWatchlist = async () => {
  return request(BASE_URL);
};

// -------------------------
// CREATE ITEM
// -------------------------
export const createWatchItem = async (item: any) => {
  return request(BASE_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(item),
  });
};

// -------------------------
// UPDATE ITEM
// -------------------------
export const updateWatchItem = async (id: string, data: any) => {
  const res = await fetch(`${BASE_URL}/${id}`, {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(data),
  });

  if (!res.ok) throw new Error("Not found");

  return res.json();
};

// -------------------------
// DELETE ITEM
// -------------------------
export const deleteWatchItem = async (id: string) => {
  return request(`${BASE_URL}/${id}`, {
    method: "DELETE",
  });
};