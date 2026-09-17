import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { formatDueDate, formatDuration, formatUploadDate } from "./time";

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

describe("formatDueDate", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-09-10T12:00:00"));
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("mostra 'hoje' com o horário pra entrega ainda por vir hoje", () => {
    expect(formatDueDate("2026-09-10T23:59:00")).toBe("hoje, 23:59");
  });

  it("mostra 'amanhã' com o horário", () => {
    expect(formatDueDate("2026-09-11T14:00:00")).toBe("amanhã, 14:00");
  });

  it("usa o dia da semana dentro da semana que vem", () => {
    expect(formatDueDate("2026-09-12T18:00:00")).toBe("sáb, 12/09 · 18:00");
  });

  it("cai na data completa além de uma semana", () => {
    expect(formatDueDate("2026-10-01T08:30:00")).toBe("01/10/2026 · 08:30");
  });

  it("diz desde que horas passou quando venceu hoje", () => {
    expect(formatDueDate("2026-09-10T09:00:00")).toBe("atrasada desde 09:00");
  });

  it("diz 'desde ontem' pro prazo de ontem", () => {
    expect(formatDueDate("2026-09-09T23:59:00")).toBe("atrasada desde ontem");
  });

  it("conta os dias de atraso além de ontem", () => {
    expect(formatDueDate("2026-09-08T23:59:00")).toBe("atrasada há 2 dias");
  });

  it("devolve string vazia pra data inválida", () => {
    expect(formatDueDate("não é data")).toBe("");
  });
});
