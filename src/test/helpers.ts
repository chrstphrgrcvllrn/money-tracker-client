import { AxiosError, type InternalAxiosRequestConfig } from "axios";
import type { AuthResponse, User } from "@/types/auth.type";

export const makeUser = (overrides: Partial<User> = {}): User => ({
  id: "user-1",
  username: "alice",
  role: "user",
  createdAt: "2026-01-15T00:00:00.000Z",
  ...overrides,
});

export const makeSession = (overrides: Partial<User> = {}, accessToken = "token-1"): AuthResponse => ({
  accessToken,
  user: makeUser(overrides),
});

// An error shaped like what axios throws for a non-2xx response.
export const httpError = (
  status: number,
  data: unknown = {},
  config: InternalAxiosRequestConfig = {} as InternalAxiosRequestConfig
) =>
  new AxiosError(`Request failed with status code ${status}`, "ERR_BAD_REQUEST", config, null, {
    status,
    statusText: "",
    headers: {},
    config,
    data,
  });
