import { useState } from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { act, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter, Route, Routes, useLocation } from "react-router-dom";
import ProtectedRoute from "@/routes/ProtectedRoute";
import PublicOnlyRoute from "@/routes/PublicOnlyRoute";
import { useLogout } from "@/hooks/useLogout";
import { useAuthStore } from "@/stores/auth.store";
import { makeSession } from "@/test/helpers";

const { logoutMock, showToast } = vi.hoisted(() => ({ logoutMock: vi.fn(), showToast: vi.fn() }));
vi.mock("@/api/auth", () => ({ logout: logoutMock }));
vi.mock("@/components/useToast", () => ({ useToast: () => showToast }));

const LoginProbe = () => {
  const location = useLocation();
  const from = (location.state as { from?: { pathname: string } } | null)?.from?.pathname;
  return <div>login page{from ? ` (from ${from})` : ""}</div>;
};

// A "page" that holds user data in local state, like the real pages do.
const DataPage = () => {
  const [data, setData] = useState("");
  const logout = useLogout();
  return (
    <div>
      <p>data: {data || "none"}</p>
      <button onClick={() => setData("alice's private data")}>load</button>
      <button onClick={logout}>logout</button>
    </div>
  );
};

const renderApp = (initialPath = "/expenses") =>
  render(
    <MemoryRouter initialEntries={[initialPath]}>
      <Routes>
        <Route element={<PublicOnlyRoute />}>
          <Route path="/login" element={<LoginProbe />} />
        </Route>
        <Route element={<ProtectedRoute />}>
          <Route path="/" element={<div>home</div>} />
          <Route path="/expenses" element={<DataPage />} />
        </Route>
      </Routes>
    </MemoryRouter>
  );

beforeEach(() => {
  logoutMock.mockReset();
  showToast.mockReset();
  useAuthStore.setState({ user: null, accessToken: null, status: "loading" });
});

describe("ProtectedRoute", () => {
  it("shows a splash (and neither redirects nor renders the page) while the session is being checked", () => {
    renderApp();

    expect(screen.getByRole("status", { name: "Loading" })).toBeInTheDocument();
    expect(screen.queryByText(/login page/)).not.toBeInTheDocument();
    expect(screen.queryByText(/data:/)).not.toBeInTheDocument();
  });

  it("redirects a guest to /login, remembering the page they wanted", () => {
    useAuthStore.getState().clearAuth();
    renderApp("/expenses");

    expect(screen.getByText("login page (from /expenses)")).toBeInTheDocument();
    expect(screen.queryByText(/data:/)).not.toBeInTheDocument();
  });

  it("renders the page for a signed-in user", () => {
    useAuthStore.getState().setAuth(makeSession());
    renderApp("/expenses");

    expect(screen.getByText("data: none")).toBeInTheDocument();
  });

  it("after signing in, returns the user to the page they originally wanted", async () => {
    useAuthStore.getState().clearAuth();
    renderApp("/expenses");
    expect(screen.getByText("login page (from /expenses)")).toBeInTheDocument();

    act(() => useAuthStore.getState().setAuth(makeSession()));

    expect(await screen.findByText("data: none")).toBeInTheDocument();
  });

  it("a signed-in user visiting /login is sent into the app", () => {
    useAuthStore.getState().setAuth(makeSession());
    renderApp("/login");

    expect(screen.getByText("home")).toBeInTheDocument();
    expect(screen.queryByText(/login page/)).not.toBeInTheDocument();
  });
});

describe("logout and account switching clear user data", () => {
  it("logout: calls the server, wipes the in-memory session, unmounts the page, goes to /login", async () => {
    logoutMock.mockResolvedValue(undefined);
    useAuthStore.getState().setAuth(makeSession({ username: "alice" }, "alice-token"));
    renderApp("/expenses");

    await userEvent.click(screen.getByText("load"));
    expect(screen.getByText("data: alice's private data")).toBeInTheDocument();

    await userEvent.click(screen.getByText("logout"));

    await waitFor(() => expect(screen.getByText("login page")).toBeInTheDocument());
    expect(logoutMock).toHaveBeenCalledTimes(1);
    const state = useAuthStore.getState();
    expect(state.status).toBe("guest");
    expect(state.user).toBeNull();
    expect(state.accessToken).toBeNull();
    // the page (and the data it held) is gone
    expect(screen.queryByText(/alice's private data/)).not.toBeInTheDocument();
    expect(showToast).toHaveBeenCalledWith("Signed out", "success");
  });

  it("the next person to sign in on the same browser starts with a fresh page, not the previous user's data", async () => {
    logoutMock.mockResolvedValue(undefined);
    useAuthStore.getState().setAuth(makeSession({ id: "alice-id", username: "alice" }));
    renderApp("/expenses");
    await userEvent.click(screen.getByText("load"));
    await userEvent.click(screen.getByText("logout"));
    await waitFor(() => expect(screen.getByText("login page")).toBeInTheDocument());

    act(() => useAuthStore.getState().setAuth(makeSession({ id: "bob-id", username: "bob" })));

    expect(await screen.findByText("home")).toBeInTheDocument();
    expect(screen.queryByText(/alice/)).not.toBeInTheDocument();
  });

  it("still signs out locally when the logout request fails (e.g. offline)", async () => {
    logoutMock.mockRejectedValue(new Error("Network Error"));
    useAuthStore.getState().setAuth(makeSession());
    renderApp("/expenses");

    await userEvent.click(screen.getByText("logout"));

    await waitFor(() => expect(screen.getByText("login page")).toBeInTheDocument());
    expect(useAuthStore.getState().status).toBe("guest");
  });

  it("if the signed-in user changes without a logout (refresh returns someone else), the tree is rebuilt", async () => {
    useAuthStore.getState().setAuth(makeSession({ id: "alice-id", username: "alice" }));
    renderApp("/expenses");
    await userEvent.click(screen.getByText("load"));
    expect(screen.getByText("data: alice's private data")).toBeInTheDocument();

    act(() => useAuthStore.getState().setAuth(makeSession({ id: "bob-id", username: "bob" })));

    expect(await screen.findByText("data: none")).toBeInTheDocument();
  });

  it("when a token refresh fails mid-session the user is sent to /login and the page is dropped", async () => {
    useAuthStore.getState().setAuth(makeSession());
    renderApp("/expenses");
    await userEvent.click(screen.getByText("load"));

    act(() => useAuthStore.getState().clearAuth()); // what the API client does when refresh fails

    expect(await screen.findByText("login page (from /expenses)")).toBeInTheDocument();
    expect(screen.queryByText(/private data/)).not.toBeInTheDocument();
  });
});
