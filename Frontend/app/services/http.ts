import axios from "axios";
import type { ApiError } from "./types";

const BASE_URL = import.meta.env.VITE_API_URL ?? "http://localhost:5000/api";

export const api = axios.create({
  baseURL: BASE_URL,
  withCredentials: true,
  headers: {
    "Content-Type": "application/json",
  },
});

api.interceptors.response.use(
  (response) => response,
  (error) => Promise.reject(toApiError(error))
);

export function toApiError(error: unknown): ApiError {
  if (axios.isAxiosError(error)) {
    return (error.response?.data as ApiError) ?? { message: error.message };
  }
  return { message: "Unknown error" };
}
