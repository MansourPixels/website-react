import { describe, expect, it } from "vitest";

import { DEFAULT_SESSION_SETTINGS } from "@/types/StudySession";
import { sanitizeSettings, todayKey } from "./sessionStorage";

describe("todayKey", () => {
  it("formata como AAAA-MM-DD", () => {
    expect(todayKey(new Date(2026, 8, 1))).toBe("2026-09-01"); // mês 8 = setembro
  });

  it("preenche mês e dia com zero à esquerda", () => {
    expect(todayKey(new Date(2026, 0, 5))).toBe("2026-01-05");
  });
});

describe("sanitizeSettings", () => {
  it("cai no default quando o valor é irreconhecível", () => {
    expect(sanitizeSettings(null)).toEqual(DEFAULT_SESSION_SETTINGS);
    expect(sanitizeSettings(undefined)).toEqual(DEFAULT_SESSION_SETTINGS);
    expect(sanitizeSettings("string qualquer")).toEqual(DEFAULT_SESSION_SETTINGS);
  });

  it("respeita valores válidos dentro do limite", () => {
    const result = sanitizeSettings({
      focusMinutes: 50,
      shortBreakMinutes: 10,
      longBreakMinutes: 20,
      cyclesUntilLongBreak: 3,
      autoStart: true,
      controlsSpotify: false,
    });

    expect(result).toEqual({
      focusMinutes: 50,
      shortBreakMinutes: 10,
      longBreakMinutes: 20,
      cyclesUntilLongBreak: 3,
      autoStart: true,
      controlsSpotify: false,
    });
  });

  it("clampa valor numérico acima do máximo (focusMinutes até 90)", () => {
    expect(sanitizeSettings({ focusMinutes: 999 }).focusMinutes).toBe(90);
  });

  it("clampa valor numérico abaixo do mínimo (focusMinutes a partir de 5)", () => {
    expect(sanitizeSettings({ focusMinutes: -10 }).focusMinutes).toBe(5);
  });

  it("cai no default quando o campo não é number", () => {
    expect(sanitizeSettings({ focusMinutes: "25" }).focusMinutes).toBe(
      DEFAULT_SESSION_SETTINGS.focusMinutes,
    );
  });

  it("cai no default quando o campo boolean não é boolean", () => {
    expect(sanitizeSettings({ autoStart: "sim" }).autoStart).toBe(
      DEFAULT_SESSION_SETTINGS.autoStart,
    );
  });
});
