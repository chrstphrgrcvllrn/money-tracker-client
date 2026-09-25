import { beforeEach, describe, expect, it, vi } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router-dom";
import { useAuthStore } from "@/stores/auth.store";
import { httpError, makeSession } from "@/test/helpers";

const { loginMock, showToast } = vi.hoisted(() => ({ loginMock: vi.fn(), showToast: vi.fn() }));
vi.mock("@/api/auth", () => ({ login: loginMock }));
vi.mock("@/components/useToast", () => ({ useToast: () => showToast }));

import LoginPage from "@/pages/LoginPage";

const renderPage = () =>
  render(
    <MemoryRouter>
      <LoginPage />
    </MemoryRouter>
  );

beforeEach(() => {
  loginMock.mockReset();
  showToast.mockReset();
  useAuthStore.getState().clearAuth();
});

describe("LoginPage", () => {
  it("is a real form: one h1, labelled inputs, and the right autocomplete hints", () => {
    renderPage();

    expect(screen.getAllByRole("heading", { level: 1 })).toHaveLength(1);
    expect(screen.getByLabelText("Username")).toHaveAttribute("autocomplete", "username");
    expect(screen.getByLabelText("Password")).toHaveAttribute("autocomplete", "current-password");
    expect(screen.getByRole("link", { name: /create an account/i })).toHaveAttribute("href", "/register");
  });

  it("shows inline errors and doesn't call the API when fields are empty", async () => {
    renderPage();

    await userEvent.click(screen.getByRole("button", { name: "Sign in" }));

    expect(await screen.findByText("Username is required")).toBeInTheDocument();
    expect(screen.getByText("Password is required")).toBeInTheDocument();
    expect(screen.getByLabelText("Username")).toHaveAttribute("aria-invalid", "true");
    expect(loginMock).not.toHaveBeenCalled();
  });

  it("signs in: sends the credentials and stores the session in memory", async () => {
    loginMock.mockResolvedValue(makeSession({ username: "chrstphrvllrn" }, "abc"));
    renderPage();

    await userEvent.type(screen.getByLabelText("Username"), "chrstphrvllrn");
    await userEvent.type(screen.getByLabelText("Password"), "hunter2");
    await userEvent.click(screen.getByRole("button", { name: "Sign in" }));

    await waitFor(() => expect(useAuthStore.getState().status).toBe("authenticated"));
    expect(loginMock).toHaveBeenCalledWith({ username: "chrstphrvllrn", password: "hunter2" });
    expect(useAuthStore.getState().accessToken).toBe("abc");
    expect(useAuthStore.getState().user?.username).toBe("chrstphrvllrn");
    expect(showToast).toHaveBeenCalledWith("Signed in", "success");
  });

  it("disables the button while the request is pending", async () => {
    loginMock.mockReturnValue(new Promise(() => {})); // never resolves
    renderPage();

    await userEvent.type(screen.getByLabelText("Username"), "alice");
    await userEvent.type(screen.getByLabelText("Password"), "password123");
    await userEvent.click(screen.getByRole("button", { name: "Sign in" }));

    const pending = await screen.findByRole("button", { name: /signing in/i });
    expect(pending).toBeDisabled();
  });

  it("401 shows the generic toast and leaves the user signed out", async () => {
    loginMock.mockRejectedValue(httpError(401, { error: { message: "Invalid username or password" } }));
    renderPage();

    await userEvent.type(screen.getByLabelText("Username"), "alice");
    await userEvent.type(screen.getByLabelText("Password"), "wrong-pass");
    await userEvent.click(screen.getByRole("button", { name: "Sign in" }));

    await waitFor(() => expect(showToast).toHaveBeenCalledWith("Invalid username or password", "error"));
    expect(useAuthStore.getState().status).not.toBe("authenticated");
    expect(screen.getByRole("button", { name: "Sign in" })).toBeEnabled(); // can retry
  });

  it("429 shows a friendly rate-limit toast", async () => {
    loginMock.mockRejectedValue(httpError(429, { error: { code: "RATE_LIMITED" } }));
    renderPage();

    await userEvent.type(screen.getByLabelText("Username"), "alice");
    await userEvent.type(screen.getByLabelText("Password"), "password123");
    await userEvent.click(screen.getByRole("button", { name: "Sign in" }));

    await waitFor(() =>
      expect(showToast).toHaveBeenCalledWith(expect.stringMatching(/too many attempts/i), "error")
    );
  });

  it("the show/hide toggle reveals the password and back", async () => {
    renderPage();
    const input = screen.getByLabelText("Password");
    expect(input).toHaveAttribute("type", "password");

    await userEvent.click(screen.getByRole("button", { name: "Show password" }));
    expect(input).toHaveAttribute("type", "text");

    await userEvent.click(screen.getByRole("button", { name: "Hide password" }));
    expect(input).toHaveAttribute("type", "password");
  });
});
