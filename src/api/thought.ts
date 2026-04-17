const BASE_URL =
  import.meta.env.NODE_ENV === "production"
    ? `${import.meta.env.VITE_PROD_API_URL}/api/thoughts`
    : `${import.meta.env.VITE_DEV_API_URL}/api/thoughts`;


export const getThoughts = async () => {
  const res = await fetch(BASE_URL);
  return res.json();
};

export const createThought = async (text: string) => {
  const res = await fetch(BASE_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ text }),
  });

  return res.json();
};