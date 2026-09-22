import { describe, expect, it } from "vitest";

import { saoPauloDay } from "./adminDates";

describe("saoPauloDay", () => {
  it("is the calendar day in São Paulo, not in UTC", () => {
    // 02:30 UTC ainda é o dia anterior em São Paulo (UTC-3).
    expect(saoPauloDay(new Date("2026-09-22T02:30:00Z"))).toBe("2026-09-21");
    expect(saoPauloDay(new Date("2026-09-22T03:30:00Z"))).toBe("2026-09-22");
  });
});
