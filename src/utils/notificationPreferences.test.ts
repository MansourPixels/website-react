import { describe, expect, it } from "vitest";

import { ApiError } from "@/api/client";
import type { NotificationPreferences } from "@/types/api/notifications";

import {
  CATEGORY_COPY,
  CATEGORY_KEYS,
  unsubscribeOutcomeFor,
  withChange,
} from "./notificationPreferences";

const PREFERENCES: NotificationPreferences = {
  friends: true,
  classrooms: true,
  tasks: true,
  reminders: true,
};

describe("CATEGORY_KEYS", () => {
  it("lists the four categories in screen order", () => {
    expect(CATEGORY_KEYS).toEqual(["friends", "classrooms", "tasks", "reminders"]);
  });

  it("has a label and a description for every category", () => {
    for (const key of CATEGORY_KEYS) {
      expect(CATEGORY_COPY[key].label.length).toBeGreaterThan(0);
      expect(CATEGORY_COPY[key].description.length).toBeGreaterThan(0);
    }
  });
});

describe("withChange", () => {
  it("returns a copy with only the given key changed", () => {
    expect(withChange(PREFERENCES, "tasks", false)).toEqual({
      friends: true,
      classrooms: true,
      tasks: false,
      reminders: true,
    });
  });

  it("does not mutate the original object", () => {
    const changed = withChange(PREFERENCES, "friends", false);

    expect(changed).not.toBe(PREFERENCES);
    expect(PREFERENCES.friends).toBe(true);
  });

  it("keeps the other keys at their own values, not at the default", () => {
    const start: NotificationPreferences = {
      friends: false,
      classrooms: true,
      tasks: false,
      reminders: true,
    };

    expect(withChange(start, "classrooms", false)).toEqual({
      friends: false,
      classrooms: false,
      tasks: false,
      reminders: true,
    });
  });
});

describe("unsubscribeOutcomeFor", () => {
  it("maps 400 to an invalid link, whatever detail the server sent", () => {
    expect(unsubscribeOutcomeFor(new ApiError(400, "Invalid token"))).toBe(
      "invalid-link",
    );
  });

  it("maps 429 to rate limited", () => {
    expect(unsubscribeOutcomeFor(new ApiError(429, "Too many requests"))).toBe(
      "rate-limited",
    );
  });

  it("maps a network failure to the network outcome", () => {
    expect(unsubscribeOutcomeFor(new TypeError("Failed to fetch"))).toBe(
      "network",
    );
  });

  it("maps any other status to the network outcome", () => {
    expect(unsubscribeOutcomeFor(new ApiError(500, "boom"))).toBe("network");
    expect(unsubscribeOutcomeFor(new ApiError(404, "nope"))).toBe("network");
  });
});
