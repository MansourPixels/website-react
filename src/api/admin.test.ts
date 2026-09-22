import { beforeEach, describe, expect, it, vi } from "vitest";

const { apiFetch, ApiError } = vi.hoisted(() => {
  class ApiError extends Error {
    status: number;
    detail: string;

    constructor(status: number, detail: string) {
      super(detail);
      this.status = status;
      this.detail = detail;
    }
  }

  return { apiFetch: vi.fn(), ApiError };
});

vi.mock("./client", () => ({ apiFetch, ApiError }));

import {
  ADMIN_FORBIDDEN_EVENT,
  AdminForbiddenError,
  getUsageSummary,
  listDeadLetterQueues,
} from "./admin";

describe("admin API", () => {
  beforeEach(() => {
    apiFetch.mockReset();
  });

  it("asks for the last 30 days when no period is given", async () => {
    apiFetch.mockResolvedValue({});

    await getUsageSummary();

    expect(apiFetch).toHaveBeenCalledWith("/api/admin/usage/summary", {
      signal: undefined,
    });
  });

  it("sends the period as dates", async () => {
    const signal = new AbortController().signal;
    apiFetch.mockResolvedValue({});

    await getUsageSummary({ from: "2026-09-01", to: "2026-09-30" }, signal);

    expect(apiFetch).toHaveBeenCalledWith(
      "/api/admin/usage/summary?from=2026-09-01&to=2026-09-30",
      { signal },
    );
  });

  it("lists the dead-letter queues", async () => {
    apiFetch.mockResolvedValue({ queues: [] });

    await expect(listDeadLetterQueues()).resolves.toEqual({ queues: [] });
    expect(apiFetch).toHaveBeenCalledWith("/api/admin/dead-letters", {
      signal: undefined,
    });
  });

  it("turns a 403 into AdminForbiddenError and tells the admin area", async () => {
    // O vitest roda em node, sem `window`: um EventTarget faz o papel dele.
    const fakeWindow = new EventTarget();
    const listener = vi.fn();
    fakeWindow.addEventListener(ADMIN_FORBIDDEN_EVENT, listener);
    vi.stubGlobal("window", fakeWindow);
    apiFetch.mockRejectedValue(new ApiError(403, "Forbidden"));

    await expect(getUsageSummary()).rejects.toBeInstanceOf(AdminForbiddenError);
    expect(listener).toHaveBeenCalledOnce();

    vi.unstubAllGlobals();
  });

  it("leaves any other error as it is", async () => {
    const failure = new ApiError(503, "down");
    apiFetch.mockRejectedValue(failure);

    await expect(listDeadLetterQueues()).rejects.toBe(failure);
  });
});
