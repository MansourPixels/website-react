import { describe, expect, it } from "vitest";

import { DEFAULT_PREFERENCES, sanitizePreferences } from "./preferencesStorage";

describe("sanitizePreferences", () => {
  it("cai no default quando o valor é irreconhecível", () => {
    expect(sanitizePreferences(null)).toEqual(DEFAULT_PREFERENCES);
    expect(sanitizePreferences(undefined)).toEqual(DEFAULT_PREFERENCES);
  });

  it("respeita booleanos válidos", () => {
    expect(
      sanitizePreferences({ soundEnabled: false, hapticsEnabled: false }),
    ).toEqual({
      ...DEFAULT_PREFERENCES,
      soundEnabled: false,
      hapticsEnabled: false,
    });
  });

  it("cai no default campo a campo quando o tipo é errado", () => {
    expect(sanitizePreferences({ soundEnabled: "não" }).soundEnabled).toBe(
      DEFAULT_PREFERENCES.soundEnabled,
    );
  });

  it("não deixa um campo corrompido embaralhar o outro", () => {
    const result = sanitizePreferences({
      soundEnabled: false,
      hapticsEnabled: "corrompido",
    });

    expect(result.soundEnabled).toBe(false);
    expect(result.hapticsEnabled).toBe(DEFAULT_PREFERENCES.hapticsEnabled);
  });
});

describe("sanitizePreferences — leitura em voz alta", () => {
  it("preserva velocidade fracionária", () => {
    expect(sanitizePreferences({ speechRate: 1.25 }).speechRate).toBe(1.3);
    expect(sanitizePreferences({ speechRate: 0.8 }).speechRate).toBe(0.8);
  });

  it("clampa a velocidade nos dois extremos", () => {
    expect(sanitizePreferences({ speechRate: 9 }).speechRate).toBe(2);
    expect(sanitizePreferences({ speechRate: 0.1 }).speechRate).toBe(0.5);
    expect(sanitizePreferences({ speechRate: -3 }).speechRate).toBe(0.5);
  });

  it("cai no default quando a velocidade não é número finito", () => {
    expect(sanitizePreferences({ speechRate: "rápido" }).speechRate).toBe(
      DEFAULT_PREFERENCES.speechRate,
    );
    expect(sanitizePreferences({ speechRate: Number.NaN }).speechRate).toBe(
      DEFAULT_PREFERENCES.speechRate,
    );
    expect(
      sanitizePreferences({ speechRate: Number.POSITIVE_INFINITY }).speechRate,
    ).toBe(DEFAULT_PREFERENCES.speechRate);
  });

  it("a auto-leitura vem desligada e ignora valor inválido", () => {
    expect(sanitizePreferences(null).speechAutoPlay).toBe(false);
    expect(sanitizePreferences({ speechAutoPlay: "sim" }).speechAutoPlay).toBe(
      DEFAULT_PREFERENCES.speechAutoPlay,
    );
    expect(sanitizePreferences({ speechAutoPlay: true }).speechAutoPlay).toBe(
      true,
    );
  });

  it("velocidade corrompida não afeta a auto-leitura", () => {
    const result = sanitizePreferences({
      speechRate: "errado",
      speechAutoPlay: true,
    });

    expect(result.speechRate).toBe(DEFAULT_PREFERENCES.speechRate);
    expect(result.speechAutoPlay).toBe(true);
  });
});
