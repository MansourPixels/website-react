import { describe, expect, it } from "vitest";

import { sanitizeSeenAchievements } from "./achievementsStorage";

describe("sanitizeSeenAchievements", () => {
  it("cai em listas/valores vazios quando o valor é irreconhecível", () => {
    expect(sanitizeSeenAchievements(null)).toEqual({
      reachedMilestones: [],
      lastGoldDate: null,
    });
  });

  it("preserva números válidos em reachedMilestones", () => {
    expect(
      sanitizeSeenAchievements({ reachedMilestones: [7, 30, 100] })
        .reachedMilestones,
    ).toEqual([7, 30, 100]);
  });

  it("filtra entradas não-numéricas de reachedMilestones sem descartar a lista inteira", () => {
    expect(
      sanitizeSeenAchievements({ reachedMilestones: [7, "trinta", 100] })
        .reachedMilestones,
    ).toEqual([7, 100]);
  });

  it("cai em [] quando reachedMilestones não é array", () => {
    expect(
      sanitizeSeenAchievements({ reachedMilestones: "não é array" })
        .reachedMilestones,
    ).toEqual([]);
  });

  it("preserva lastGoldDate string e cai em null pro resto", () => {
    expect(
      sanitizeSeenAchievements({ lastGoldDate: "2026-09-01" }).lastGoldDate,
    ).toBe("2026-09-01");
    expect(sanitizeSeenAchievements({ lastGoldDate: 123 }).lastGoldDate).toBeNull();
  });
});
