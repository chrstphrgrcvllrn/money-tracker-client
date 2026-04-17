const BASE_URL =
  import.meta.env.NODE_ENV === "production"
    ? `${import.meta.env.VITE_PROD_API_URL}/api/watchlist`
    : `${import.meta.env.VITE_DEV_API_URL}/api/watchlist`;

export const getWatchlist = async () => {
  const res = await fetch(BASE_URL);
  return res.json();
};

export const createWatchItem = async (item: any) => {
  const res = await fetch(BASE_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(item),
  });

  return res.json();
};

export const updateWatchItem = async (id: string, updated: any) => {
  const res = await fetch(`${BASE_URL}/${id}`, {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(updated),
  });

  return res.json();
};