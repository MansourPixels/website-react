import { describe, expect, it } from "vitest";

import {
  MAX_RENEWALS_IN_WINDOW,
  RENEWAL_WINDOW_MS,
  URL_RENEW_MARGIN_MS,
  URL_TTL_MS,
  canRenewUrl,
  classifyMediaError,
  isUrlStale,
} from "./mediaUrl";

describe("isUrlStale", () => {
  const loadedAt = 1_000_000;

  it("uma URL recém pedida não está vencida", () => {
    expect(isUrlStale(loadedAt, loadedAt)).toBe(false);
    expect(isUrlStale(loadedAt, loadedAt + 60_000)).toBe(false);
  });

  it("renova na margem, antes de vencer de verdade", () => {
    const threshold = loadedAt + URL_TTL_MS - URL_RENEW_MARGIN_MS;

    expect(isUrlStale(loadedAt, threshold - 1)).toBe(false);
    expect(isUrlStale(loadedAt, threshold)).toBe(true);
  });

  it("uma URL já vencida está vencida", () => {
    expect(isUrlStale(loadedAt, loadedAt + URL_TTL_MS + 1)).toBe(true);
  });

  it("a margem cabe dentro do prazo de validade", () => {
    expect(URL_RENEW_MARGIN_MS).toBeLessThan(URL_TTL_MS);
  });
});

describe("canRenewUrl", () => {
  const now = 10_000_000;

  it("sem renovações anteriores pode renovar", () => {
    expect(canRenewUrl([], now)).toBe(true);
  });

  it("para depois de várias renovações seguidas", () => {
    const recent = Array.from({ length: MAX_RENEWALS_IN_WINDOW }, (_, index) => now - 1000 * index);

    expect(canRenewUrl(recent.slice(0, MAX_RENEWALS_IN_WINDOW - 1), now)).toBe(true);
    expect(canRenewUrl(recent, now)).toBe(false);
  });

  it("renovações antigas não contam", () => {
    const old = Array.from({ length: 10 }, () => now - RENEWAL_WINDOW_MS - 1);

    expect(canRenewUrl(old, now)).toBe(true);
  });
});

describe("classifyMediaError", () => {
  it("um formato que o navegador não toca, numa URL recém pedida, não é URL vencida", () => {
    expect(classifyMediaError(4, 0)).toBe("unsupported");
    expect(classifyMediaError(4, 60_000)).toBe("unsupported");
  });

  it("o mesmo erro numa URL perto de vencer ou vencida é a URL: renova", () => {
    expect(classifyMediaError(4, URL_TTL_MS - URL_RENEW_MARGIN_MS)).toBe("renew");
    expect(classifyMediaError(4, URL_TTL_MS + 1)).toBe("renew");
  });

  it("uma falha de rede ou de decodificação no meio da reprodução renova", () => {
    expect(classifyMediaError(2, 0)).toBe("renew");
    expect(classifyMediaError(3, 0)).toBe("renew");
    expect(classifyMediaError(null, 0)).toBe("renew");
    expect(classifyMediaError(undefined, 0)).toBe("renew");
  });
});
