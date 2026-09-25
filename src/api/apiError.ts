import { isAxiosError } from "axios";

export type ApiError = {
  status?: number;
  code?: string;
  message: string;
  fieldErrors?: Record<string, string>;
};

// Understands both error shapes the server uses: the auth/middleware shape
// { error: { message, code, details } } and the older data-route shape { message }.
export const toApiError = (error: unknown): ApiError => {
  if (isAxiosError(error)) {
    const data = error.response?.data;
    const nested = data?.error;

    return {
      status: error.response?.status,
      code: nested?.code,
      message: nested?.message ?? data?.message ?? error.message,
      fieldErrors: nested?.details,
    };
  }

  return { message: error instanceof Error ? error.message : "Something went wrong" };
};
