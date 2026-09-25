import { beforeEach, describe, expect, it, vi } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router-dom";
import { useAuthStore } from "@/stores/auth.store";
import { httpError, makeSession } from "@/test/helpers";

const { changePasswordMock, logoutMock, showToast } = vi.hoisted(() => ({
  changePasswordMock: vi.fn(),
  logoutMock: vi.fn(),
  showToast: vi.fn(),
}));
vi.mock("@/api/auth", () => ({ changePassword: changePasswordMock, logout: logoutMock }));
vi.mock("@/components/useToast", () => ({ useToast: () => showToast }));

import AccountPage from "@/pages/AccountPage";

const renderPage = () =>
  render(
    <MemoryRouter>
      <AccountPage />
    </MemoryRouter>
  );

const fill = async (current: string, next: string, confirm: string) => {
  await userEvent.type(screen.getByLabelText("Current password"), current);
  await userEvent.type(screen.getByLabelText("New password"), next);
  await userEvent.type(screen.getByLabelText("Confirm new password"), confirm);
  await userEvent.click(screen.getByRole("button", { name: "Update password" }));
};

beforeEach(() => {
  changePasswordMock.mockReset();
  logoutMock.mockReset();
  showToast.mockReset();
  useAuthStore.getState().setAuth(makeSession({ username: "chrstphrvllrn", createdAt: "2026-01-15T12:00:00.000Z" }, "tok"));
});

describe("AccountPage", () => {
  it("shows the username and member-since date", () => {
    renderPage();

    expect(screen.getAllByRole("heading", { level: 1 })).toHaveLength(1);
    expect(screen.getByText("chrstphrvllrn")).toBeInTheDocument();
    expect(screen.getByText(/January 15, 2026|15 January 2026/)).toBeInTheDocument();
  });

  it("validates the new password before calling the server", async () => {
    renderPage();

    await fill("old-password", "short", "short");

    expect(await screen.findByText("Password must be at least 8 characters")).toBeInTheDocument();
    expect(changePasswordMock).not.toHaveBeenCalled();
  });

  it("changes the password, keeps this device signed in with the fresh session, and clears the form", async () => {
    changePasswordMock.mockResolvedValue(makeSession({ username: "chrstphrvllrn" }, "fresh-token"));
    renderPage();

    await fill("old-password", "brand-new-pass", "brand-new-pass");

    await waitFor(() => expect(showToast).toHaveBeenCalledWith(expect.stringMatching(/password updated/i), "success"));
    expect(changePasswordMock).toHaveBeenCalledWith({ currentPassword: "old-password", newPassword: "brand-new-pass" });
    expect(useAuthStore.getState().accessToken).toBe("fresh-token");
    expect(useAuthStore.getState().status).toBe("authenticated");
    expect(screen.getByLabelText("Current password")).toHaveValue("");
  });

  it("a wrong current password shows on that field (not as a sign-out)", async () => {
    changePasswordMock.mockRejectedValue(
      httpError(400, { error: { code: "VALIDATION_ERROR", details: { currentPassword: "Current password is incorrect" } } })
    );
    renderPage();

    await fill("wrong-current", "brand-new-pass", "brand-new-pass");

    expect(await screen.findByText("Current password is incorrect")).toBeInTheDocument();
    expect(useAuthStore.getState().status).toBe("authenticated");
  });

  it("has a Log out button that ends the session", async () => {
    logoutMock.mockResolvedValue(undefined);
    renderPage();

    await userEvent.click(screen.getByRole("button", { name: "Log out" }));

    await waitFor(() => expect(useAuthStore.getState().status).toBe("guest"));
    expect(logoutMock).toHaveBeenCalled();
  });
});
