import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { AxiosAdapter, AxiosResponse, InternalAxiosRequestConfig } from "axios";
import { api, authHttp } from "@/api/client";
import { useAuthStore } from "@/stores/auth.store";
import { httpError, makeSession } from "@/test/helpers";

const ok = (config: InternalAxiosRequestConfig, data: unknown): AxiosResponse => ({
  data,
  status: 200,
  statusText: "OK",
  headers: {},
  config,
});

const originalApiAdapter = api.defaults.adapter;
const originalAuthAdapter = authHttp.defaults.adapter;

// A fake server: data requests succeed only with the "fresh" token.
let dataCalls: string[];
let refreshCalls: number;
let refreshShouldFail: boolean;

beforeEach(() => {
  dataCalls = [];
  refreshCalls = 0;
  refreshShouldFail = false;

  const dataAdapter: AxiosAdapter = async (config) => {
    const auth = String(config.headers.Authorization ?? "");
    dataCalls.push(`${config.url} ${auth}`);
    if (auth !== "Bearer fresh") throw httpError(401, { error: { code: "UNAUTHORIZED" } }, config);
    return ok(config, { url: config.url });
  };
  const authAdapter: AxiosAdapter = async (config) => {
    if (config.url === "/auth/refresh") {
      refreshCalls += 1;
      await new Promise((r) => setTimeout(r, 10));
      if (refreshShouldFail) throw httpError(401, {}, config);
      return ok(config, makeSession({}, "fresh"));
    }
    // e.g. /auth/login with wrong credentials
    throw httpError(401, { error: { code: "INVALID_CREDENTIALS" } }, config);
  };
  api.defaults.adapter = dataAdapter;
  authHttp.defaults.adapter = authAdapter;

  useAuthStore.setState({ ...makeSession({}, "stale"), status: "authenticated" });
});

afterEach(() => {
  api.defaults.adapter = originalApiAdapter;
  authHttp.defaults.adapter = originalAuthAdapter;
  useAuthStore.getState().clearAuth();
  vi.restoreAllMocks();
});

describe("api client", () => {
  it("sends the in-memory access token as a Bearer header", async () => {
    useAuthStore.setState({ accessToken: "fresh" });

    await api.get("/expenses");

    expect(dataCalls).toEqual(["/expenses Bearer fresh"]);
    expect(refreshCalls).toBe(0);
  });

  it("on a 401, refreshes once, retries with the new token, and stores the new session", async () => {
    const res = await api.get("/expenses");

    expect(res.data).toEqual({ url: "/expenses" });
    expect(refreshCalls).toBe(1);
    expect(dataCalls).toEqual(["/expenses Bearer stale", "/expenses Bearer fresh"]);
    expect(useAuthStore.getState().accessToken).toBe("fresh");
    expect(useAuthStore.getState().status).toBe("authenticated");
  });

  it("runs ONE refresh when several requests 401 at the same time, and retries them all", async () => {
    const results = await Promise.all([api.get("/a"), api.get("/b"), api.get("/c")]);

    expect(results.map((r) => r.data.url)).toEqual(["/a", "/b", "/c"]);
    expect(refreshCalls).toBe(1);
    expect(dataCalls.filter((c) => c.endsWith("Bearer fresh"))).toHaveLength(3);
  });

  it("if the refresh fails, signs the user out (status guest, token gone) and rejects", async () => {
    refreshShouldFail = true;

    await expect(api.get("/expenses")).rejects.toMatchObject({ response: { status: 401 } });

    const state = useAuthStore.getState();
    expect(state.status).toBe("guest");
    expect(state.accessToken).toBeNull();
    expect(state.user).toBeNull();
  });

  it("retries only once: a request that still 401s after refreshing is rejected, not looped", async () => {
    api.defaults.adapter = async (config) => {
      dataCalls.push(`${config.url}`);
      throw httpError(401, {}, config);
    };

    await expect(api.get("/expenses")).rejects.toBeDefined();
    expect(dataCalls).toHaveLength(2); // original + one retry
    expect(refreshCalls).toBe(1);
  });

  it("a 401 from an auth endpoint (wrong password) does not trigger a refresh", async () => {
    await expect(authHttp.post("/auth/login", {})).rejects.toBeDefined();
    expect(refreshCalls).toBe(0);
  });

  it("non-401 errors pass straight through without refreshing", async () => {
    api.defaults.adapter = async (config) => {
      throw httpError(404, {}, config);
    };

    await expect(api.get("/expenses/nope")).rejects.toMatchObject({ response: { status: 404 } });
    expect(refreshCalls).toBe(0);
  });

  it("never persists the token to browser storage", async () => {
    await api.get("/expenses");

    expect(JSON.stringify({ ...localStorage })).not.toContain("fresh");
    expect(JSON.stringify({ ...sessionStorage })).not.toContain("fresh");
  });
});
