import { describe, expect, it } from "vitest";

import { adminGate } from "./adminGate";

describe("adminGate", () => {
  it("waits while the role is being read", () => {
    expect(adminGate("loading", false)).toBe("loading");
    expect(adminGate("loading", true)).toBe("loading");
  });

  it("lets an administrator in", () => {
    expect(adminGate("ready", true)).toBe("allowed");
  });

  it("keeps everyone else out, including when the role could not be read", () => {
    expect(adminGate("ready", false)).toBe("denied");
    expect(adminGate("error", true)).toBe("denied");
  });
});
