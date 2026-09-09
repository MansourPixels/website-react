import { describe, expect, it } from "vitest";

import {
  currentSeasonId,
  daysUntilReset,
  formatPosition,
  formatResetCountdown,
  formatSeasonLabel,
  formatXp,
  previousSeasonId,
  seasonEndsAt,
  seasonStartsAt,
  xpFromActivity,
} from "./ranking";

describe("xpFromActivity", () => {
  it("soma flash cards e simulados com os pesos definidos", () => {
    expect(xpFromActivity({ flashcards: 10, quizzes: 4 })).toBe(200);
  });

  it("devolve zero sem atividade", () => {
    expect(xpFromActivity({ flashcards: 0, quizzes: 0 })).toBe(0);
  });
});

describe("currentSeasonId", () => {
  it("usa o formato YYYY-MM com mês de dois dígitos", () => {
    expect(currentSeasonId(new Date(2026, 8, 2))).toBe("2026-09");
    expect(currentSeasonId(new Date(2026, 0, 31))).toBe("2026-01");
  });
});

describe("previousSeasonId", () => {
  it("volta um mês", () => {
    expect(previousSeasonId("2026-09")).toBe("2026-08");
  });

  it("vira o ano em janeiro", () => {
    expect(previousSeasonId("2026-01")).toBe("2025-12");
  });
});

describe("limites da temporada", () => {
  it("começa no primeiro dia do mês", () => {
    expect(seasonStartsAt("2026-09").getTime()).toBe(
      new Date(2026, 8, 1).getTime(),
    );
  });

  it("termina no primeiro instante do mês seguinte", () => {
    expect(seasonEndsAt("2026-12").getTime()).toBe(
      new Date(2027, 0, 1).getTime(),
    );
  });
});

describe("daysUntilReset", () => {
  it("conta os dias que faltam para a virada", () => {
    // 20 de setembro até 1º de outubro: onze dias.
    expect(daysUntilReset(new Date(2026, 8, 20, 23))).toBe(11);
  });

  it("é um no último dia do mês, nunca zero", () => {
    expect(daysUntilReset(new Date(2026, 8, 30, 1))).toBe(1);
  });
});

describe("formatResetCountdown", () => {
  it("trata amanhã e plural", () => {
    expect(formatResetCountdown(new Date(2026, 8, 30))).toBe("Zera amanhã");
    expect(formatResetCountdown(new Date(2026, 8, 29))).toBe("Zera em 2 dias");
    expect(formatResetCountdown(new Date(2026, 8, 25))).toBe("Zera em 6 dias");
  });
});

describe("formatação", () => {
  it("escreve o XP com separador de milhar", () => {
    expect(formatXp(1240)).toBe("1.240 XP");
  });

  it("nomeia a temporada em português", () => {
    expect(formatSeasonLabel("2026-08")).toBe("agosto de 2026");
  });

  it("mostra traço para quem ainda não pontuou", () => {
    expect(formatPosition(null)).toBe("–");
    expect(formatPosition(7)).toBe("7º");
  });
});
