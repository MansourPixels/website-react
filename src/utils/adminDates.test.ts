import { describe, expect, it } from "vitest";

import { saoPauloDay, saoPauloMoment } from "./adminDates";

describe("saoPauloDay", () => {
  it("is the calendar day in São Paulo, not in UTC", () => {
    // 02:30 UTC ainda é o dia anterior em São Paulo (UTC-3).
    expect(saoPauloDay(new Date("2026-09-22T02:30:00Z"))).toBe("2026-09-21");
    expect(saoPauloDay(new Date("2026-09-22T03:30:00Z"))).toBe("2026-09-22");
  });
});

describe("saoPauloMoment", () => {
  it("shows an instant in São Paulo time", () => {
    expect(saoPauloMoment("2026-09-22T13:05:00Z")).toBe("22/09/2026, 10:05");
  });

  it("shows a dash without a valid instant", () => {
    expect(saoPauloMoment(null)).toBe("—");
    expect(saoPauloMoment("x")).toBe("—");
  });
});
