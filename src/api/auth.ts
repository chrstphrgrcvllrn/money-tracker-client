import { api, authHttp } from "@/api/client";
import type { AuthResponse, User } from "@/types/auth.type";

export type Credentials = { username: string; password: string };
export type PasswordChange = { currentPassword: string; newPassword: string };

export const register = async (data: Credentials): Promise<AuthResponse> =>
  (await authHttp.post<AuthResponse>("/auth/register", data)).data;

export const login = async (data: Credentials): Promise<AuthResponse> =>
  (await authHttp.post<AuthResponse>("/auth/login", data)).data;

export const logout = async (): Promise<void> => {
  await authHttp.post("/auth/logout");
};

export const getMe = async (): Promise<User> => (await api.get<{ user: User }>("/auth/me")).data.user;

// Returns a fresh session: this device stays signed in, every other one is
// signed out by the server.
export const changePassword = async (data: PasswordChange): Promise<AuthResponse> =>
  (await api.patch<AuthResponse>("/auth/me/password", data)).data;
