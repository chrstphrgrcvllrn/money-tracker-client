import axios from "axios";

const API_URL = import.meta.env.NODE_ENV === 'production'
  ? `${import.meta.env.VITE_PROD_API_URL}/api/exercise` // actual site
  : `${import.meta.env.VITE_DEV_API_URL}/api/exercise` ; // local/dev


export const getExercise = async () => {
  const res = await axios.get(API_URL);
  return res.data;
};

export const addExercise = async (date: string, minutes: number) => {
  const res = await axios.post(API_URL, { date, minutes });
  return res.data;
};

export const deleteExercise = async (date: string) => {
  await axios.delete(`${API_URL}/${date}`);
};