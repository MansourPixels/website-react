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
    ).toEqual({ soundEnabled: false, hapticsEnabled: false });
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
