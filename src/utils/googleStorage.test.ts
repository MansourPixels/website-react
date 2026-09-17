import { beforeEach, describe, expect, it, vi } from "vitest";

import { saveGoogleReturnTo, takeGoogleReturnTo, validGoogleReturnTo } from "./googleStorage";

describe("google return destination", () => {
  beforeEach(() => {
    const values = new Map<string, string>();
    vi.stubGlobal("sessionStorage", {
      getItem: (key: string) => values.get(key) ?? null,
      setItem: (key: string, value: string) => values.set(key, value),
      removeItem: (key: string) => values.delete(key),
    });
  });

  it("aceita somente caminhos internos", () => {
    expect(validGoogleReturnTo("/pastas?ordem=recente")).toBe("/pastas?ordem=recente");
    expect(validGoogleReturnTo("https://example.com")).toBe("/");
    expect(validGoogleReturnTo("//example.com")).toBe("/");
  });

  it("restaura e limpa o destino após o callback", () => {
    saveGoogleReturnTo("/perfil");
    expect(takeGoogleReturnTo()).toBe("/perfil");
    expect(takeGoogleReturnTo()).toBe("/");
  });
});
