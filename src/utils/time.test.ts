import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { formatDuration, formatUploadDate } from "./time";

describe("formatUploadDate", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-09-10T12:00:00"));
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("mostra 'hoje' pra data de hoje", () => {
    expect(formatUploadDate("2026-09-10T08:00:00")).toBe("hoje");
  });

  it("mostra 'ontem' pra data de ontem", () => {
    expect(formatUploadDate("2026-09-09T23:00:00")).toBe("ontem");
  });

  it("mostra 'há N dias' pra datas dentro da semana", () => {
    expect(formatUploadDate("2026-09-05T12:00:00")).toBe("há 5 dias");
  });

  it("cai pra data formatada além de uma semana", () => {
    expect(formatUploadDate("2026-08-01T12:00:00")).toBe(
      new Date("2026-08-01T12:00:00").toLocaleDateString("pt-BR"),
    );
  });

  it("devolve string vazia pra data inválida", () => {
    expect(formatUploadDate("não é data")).toBe("");
  });
});

describe("formatDuration", () => {
  it("mostra só minutos quando não completa 1 hora", () => {
    expect(formatDuration(45)).toBe("45min");
  });

  it("mostra só horas quando é exato", () => {
    expect(formatDuration(120)).toBe("2h");
  });

  it("combina horas e minutos", () => {
    expect(formatDuration(125)).toBe("2h 5min");
  });

  it("mostra 0min pra zero", () => {
    expect(formatDuration(0)).toBe("0min");
  });
});
