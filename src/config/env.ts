// The only file that reads import.meta.env for the API.
const rawBase: string | undefined = import.meta.env.PROD
  ? import.meta.env.VITE_PROD_API_URL
  : import.meta.env.VITE_DEV_API_URL;

export const env = {
  apiBaseUrl: `${(rawBase ?? "").replace(/\/+$/, "")}/api`,
};
