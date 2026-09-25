import { beforeEach, describe, expect, it, vi } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router-dom";
import { useAuthStore } from "@/stores/auth.store";
import { httpError, makeSession } from "@/test/helpers";

const { registerMock, showToast } = vi.hoisted(() => ({ registerMock: vi.fn(), showToast: vi.fn() }));
vi.mock("@/api/auth", () => ({ register: registerMock }));
vi.mock("@/components/useToast", () => ({ useToast: () => showToast }));

import RegisterPage from "@/pages/RegisterPage";

const renderPage = () =>
  render(
    <MemoryRouter>
      <RegisterPage />
    </MemoryRouter>
  );

const fill = async (username: string, password: string, confirm: string) => {
  await userEvent.type(screen.getByLabelText("Username"), username);
  await userEvent.type(screen.getByLabelText("Password"), password);
  await userEvent.type(screen.getByLabelText("Confirm password"), confirm);
  await userEvent.click(screen.getByRole("button", { name: "Create account" }));
};

beforeEach(() => {
  registerMock.mockReset();
  showToast.mockReset();
  useAuthStore.getState().clearAuth();
});

describe("RegisterPage", () => {
  it("uses new-password autocomplete on both password fields", () => {
    renderPage();

    expect(screen.getByLabelText("Username")).toHaveAttribute("autocomplete", "username");
    expect(screen.getByLabelText("Password")).toHaveAttribute("autocomplete", "new-password");
    expect(screen.getByLabelText("Confirm password")).toHaveAttribute("autocomplete", "new-password");
  });

  it("validates with the same rules as the server, without calling it", async () => {
    renderPage();

    await fill("ab", "short", "short");

    expect(await screen.findByText("Username must be at least 3 characters")).toBeInTheDocument();
    expect(screen.getByText("Password must be at least 8 characters")).toBeInTheDocument();
    expect(registerMock).not.toHaveBeenCalled();
  });

  it("requires the confirmation to match", async () => {
    renderPage();

    await fill("alice", "password123", "password124");

    expect(await screen.findByText("Passwords don't match")).toBeInTheDocument();
    expect(registerMock).not.toHaveBeenCalled();
  });

  it("creates the account and signs in automatically (confirm field is not sent)", async () => {
    registerMock.mockResolvedValue(makeSession({ username: "alice" }, "new-token"));
    renderPage();

    await fill("alice", "password123", "password123");

    await waitFor(() => expect(useAuthStore.getState().status).toBe("authenticated"));
    expect(registerMock).toHaveBeenCalledWith({ username: "alice", password: "password123" });
    expect(useAuthStore.getState().user?.username).toBe("alice");
    expect(showToast).toHaveBeenCalledWith("Account created", "success");
  });

  it("maps a 409 to the username field (not a toast)", async () => {
    registerMock.mockRejectedValue(httpError(409, { error: { code: "USERNAME_TAKEN" } }));
    renderPage();

    await fill("alice", "password123", "password123");

    expect(await screen.findByText("That username is already taken")).toBeInTheDocument();
    expect(screen.getByLabelText("Username")).toHaveAttribute("aria-invalid", "true");
    expect(showToast).not.toHaveBeenCalled();
    expect(useAuthStore.getState().status).not.toBe("authenticated");
  });

  it("maps server-side validation details onto their fields", async () => {
    registerMock.mockRejectedValue(
      httpError(400, { error: { code: "VALIDATION_ERROR", details: { username: "Use only letters, numbers, underscores and dots" } } })
    );
    renderPage();

    await fill("alice", "password123", "password123");

    expect(await screen.findByText("Use only letters, numbers, underscores and dots")).toBeInTheDocument();
  });
});
