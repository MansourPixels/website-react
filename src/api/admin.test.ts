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
  disableUser,
  discardDeadLetters,
  enableUser,
  getTopUsers,
  getUsageBreakdown,
  getUsageSummary,
  getUserUsage,
  listAdminUsers,
  listDeadLetterQueues,
  listFailures,
  peekDeadLetters,
  replayDeadLetters,
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

  it("asks for a breakdown with its dimension", async () => {
    apiFetch.mockResolvedValue({});

    await getUsageBreakdown({ from: "2026-09-01", to: "2026-09-07" }, "day");

    expect(apiFetch).toHaveBeenCalledWith(
      "/api/admin/usage/breakdown?from=2026-09-01&to=2026-09-07&by=day",
      { signal: undefined },
    );
  });

  it("asks for the top users with a limit", async () => {
    apiFetch.mockResolvedValue({});

    await getTopUsers({}, 20);

    expect(apiFetch).toHaveBeenCalledWith("/api/admin/usage/top-users?limit=20", { signal: undefined });
  });

  it("asks for one user's usage with the id encoded", async () => {
    apiFetch.mockResolvedValue({});

    await getUserUsage("a/b", { from: "2026-09-01", to: "2026-09-30" });

    expect(apiFetch).toHaveBeenCalledWith(
      "/api/admin/usage/users/a%2Fb?from=2026-09-01&to=2026-09-30",
      { signal: undefined },
    );
  });

  it("lists every user when there is no search", async () => {
    apiFetch.mockResolvedValue({});

    await listAdminUsers({});

    expect(apiFetch).toHaveBeenCalledWith("/api/admin/users", { signal: undefined });
  });

  it("sends the search encoded, the page and the size", async () => {
    apiFetch.mockResolvedValue({});

    await listAdminUsers({ query: "ana+lu@x", page: 2, size: 20 });

    expect(apiFetch).toHaveBeenCalledWith("/api/admin/users?query=ana%2Blu%40x&page=2&size=20", {
      signal: undefined,
    });
  });

  it("disables and enables a user with a POST", async () => {
    apiFetch.mockResolvedValue(undefined);

    await disableUser("a/b");
    await enableUser("u1");

    expect(apiFetch).toHaveBeenNthCalledWith(1, "/api/admin/users/a%2Fb/disable", { method: "POST" });
    expect(apiFetch).toHaveBeenNthCalledWith(2, "/api/admin/users/u1/enable", { method: "POST" });
  });

  it("lists the dead-letter queues", async () => {
    apiFetch.mockResolvedValue({ queues: [] });

    await expect(listDeadLetterQueues()).resolves.toEqual({ queues: [] });
    expect(apiFetch).toHaveBeenCalledWith("/api/admin/dead-letters", {
      signal: undefined,
    });
  });

  it("peeks a dead-letter queue with its name encoded", async () => {
    apiFetch.mockResolvedValue({ messages: [] });

    await peekDeadLetters("revi.quiz.generation.dlq", 20);
    await peekDeadLetters("a/b c", 5);

    expect(apiFetch).toHaveBeenNthCalledWith(1, "/api/admin/dead-letters/revi.quiz.generation.dlq/messages?limit=20", {
      signal: undefined,
    });
    expect(apiFetch).toHaveBeenNthCalledWith(2, "/api/admin/dead-letters/a%2Fb%20c/messages?limit=5", {
      signal: undefined,
    });
  });

  it("replays and discards with an optional limit", async () => {
    apiFetch.mockResolvedValue({});

    await replayDeadLetters("revi.quiz.generation.dlq");
    await replayDeadLetters("revi.quiz.generation.dlq", 3);
    await discardDeadLetters("revi.quiz.generation.dlq");

    expect(apiFetch).toHaveBeenNthCalledWith(1, "/api/admin/dead-letters/revi.quiz.generation.dlq/replay", {
      method: "POST",
    });
    expect(apiFetch).toHaveBeenNthCalledWith(2, "/api/admin/dead-letters/revi.quiz.generation.dlq/replay?limit=3", {
      method: "POST",
    });
    expect(apiFetch).toHaveBeenNthCalledWith(3, "/api/admin/dead-letters/revi.quiz.generation.dlq/discard", {
      method: "POST",
    });
  });

  it("lists the failures, filtered by source and paged", async () => {
    apiFetch.mockResolvedValue({});

    await listFailures({});
    await listFailures({ source: "classroom-processing", page: 1, size: 20 });

    expect(apiFetch).toHaveBeenNthCalledWith(1, "/api/admin/failures", { signal: undefined });
    expect(apiFetch).toHaveBeenNthCalledWith(2, "/api/admin/failures?source=classroom-processing&page=1&size=20", {
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
