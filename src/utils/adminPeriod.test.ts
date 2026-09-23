import { describe, expect, it } from "vitest";

import { DEFAULT_PERIOD, periodFromSearch, periodToApi, periodToSearch } from "./adminPeriod";

const search = (query: string) => new URLSearchParams(query);

describe("periodFromSearch", () => {
  it("reads a preset", () => {
    expect(periodFromSearch(search("periodo=7d"))).toEqual({ preset: "7d" });
  });

  it("reads custom dates", () => {
    expect(periodFromSearch(search("de=2026-09-01&ate=2026-09-30"))).toEqual({
      preset: "personalizado",
      de: "2026-09-01",
      ate: "2026-09-30",
    });
  });

  it("falls back to 30 days for anything invalid", () => {
    expect(periodFromSearch(search(""))).toEqual(DEFAULT_PERIOD);
    expect(periodFromSearch(search("periodo=ano"))).toEqual(DEFAULT_PERIOD);
    expect(periodFromSearch(search("de=2026-09-31&ate=2026-10-01"))).toEqual(DEFAULT_PERIOD);
    expect(periodFromSearch(search("de=2026-09-30&ate=2026-09-01"))).toEqual(DEFAULT_PERIOD);
    expect(periodFromSearch(search("de=2025-01-01&ate=2026-09-01"))).toEqual(DEFAULT_PERIOD);
    expect(periodFromSearch(search("de=ontem&ate=hoje"))).toEqual(DEFAULT_PERIOD);
  });
});

describe("periodToSearch", () => {
  it("round-trips through the URL", () => {
    for (const period of [{ preset: "mes" } as const, { preset: "personalizado", de: "2026-09-01", ate: "2026-09-02" } as const]) {
      expect(periodFromSearch(periodToSearch(period))).toEqual(period);
    }
  });
});

describe("periodToApi", () => {
  const today = "2026-09-22";

  it("turns presets into São Paulo days, today included", () => {
    expect(periodToApi({ preset: "hoje" }, today)).toEqual({ from: today, to: today });
    expect(periodToApi({ preset: "7d" }, today)).toEqual({ from: "2026-09-16", to: today });
    expect(periodToApi({ preset: "30d" }, today)).toEqual({ from: "2026-08-24", to: today });
    expect(periodToApi({ preset: "mes" }, today)).toEqual({ from: "2026-09-01", to: today });
  });

  it("starts the current month on its first day at the turn of the month", () => {
    expect(periodToApi({ preset: "mes" }, "2026-10-01")).toEqual({ from: "2026-10-01", to: "2026-10-01" });
  });

  it("passes custom dates through", () => {
    expect(periodToApi({ preset: "personalizado", de: "2026-01-01", ate: "2026-01-31" }, today)).toEqual({
      from: "2026-01-01",
      to: "2026-01-31",
    });
  });
});
