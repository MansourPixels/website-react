import { beforeEach, describe, expect, it, vi } from "vitest";

const { apiFetch } = vi.hoisted(() => ({ apiFetch: vi.fn() }));

vi.mock("./client", () => ({ apiFetch }));

import {
  getNotificationPreferences,
  unsubscribeWithToken,
  updateNotificationPreferences,
} from "./notifications";

describe("notifications API", () => {
  beforeEach(() => apiFetch.mockReset());

  it("loads the preferences with an optional abort signal", async () => {
    const signal = new AbortController().signal;
    apiFetch.mockResolvedValue({
      friends: true,
      classrooms: true,
      tasks: true,
      reminders: true,
    });
    await getNotificationPreferences(signal);
    expect(apiFetch).toHaveBeenCalledWith("/api/notifications/preferences", {
      signal,
    });
  });

  it("patches only the changed key, never the full preferences", async () => {
    apiFetch.mockResolvedValue({
      friends: true,
      classrooms: true,
      tasks: false,
      reminders: true,
    });
    await updateNotificationPreferences({ tasks: false });
    expect(apiFetch).toHaveBeenCalledTimes(1);
    expect(apiFetch).toHaveBeenCalledWith("/api/notifications/preferences", {
      method: "PATCH",
      body: { tasks: false },
    });
  });

  it("returns the four booleans the server sent back", async () => {
    const response = {
      friends: false,
      classrooms: true,
      tasks: true,
      reminders: true,
    };
    apiFetch.mockResolvedValue(response);
    await expect(updateNotificationPreferences({ friends: false })).resolves.toBe(
      response,
    );
  });

  it("unsubscribes with a POST to the public route, sending no credentials", async () => {
    apiFetch.mockResolvedValue(undefined);
    await unsubscribeWithToken("abc.def");
    expect(apiFetch).toHaveBeenCalledWith(
      "/api/notifications/unsubscribe?token=abc.def",
      { method: "POST", auth: false },
    );
  });

  it("encodes a token holding +, / and = so the query string keeps it whole", async () => {
    apiFetch.mockResolvedValue(undefined);
    await unsubscribeWithToken("a+b/c==");
    expect(apiFetch).toHaveBeenCalledWith(
      "/api/notifications/unsubscribe?token=a%2Bb%2Fc%3D%3D",
      { method: "POST", auth: false },
    );
  });
});
