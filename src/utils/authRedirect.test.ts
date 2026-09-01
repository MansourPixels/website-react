import { describe, expect, it } from "vitest";

import { buildSignInPath, NEXT_ROUTE_PARAM, resolveNextRoute } from "./authRedirect";

describe("buildSignInPath", () => {
  it("vai pra tela de login sem parâmetro quando o alvo é a raiz", () => {
    expect(buildSignInPath("/", "")).toBe("/auth/entrar");
  });

  it("codifica o caminho + querystring de volta como próxima rota", () => {
    expect(buildSignInPath("/pastas/1", "?foo=bar")).toBe(
      `/auth/entrar?${NEXT_ROUTE_PARAM}=${encodeURIComponent("/pastas/1?foo=bar")}`,
    );
  });
});

describe("resolveNextRoute", () => {
  it("cai no default quando não há valor", () => {
    expect(resolveNextRoute(null)).toBe("/capturar");
  });

  it("aceita um caminho relativo interno", () => {
    expect(resolveNextRoute("/perfil/avatar")).toBe("/perfil/avatar");
  });

  it("rejeita um caminho que não começa com /", () => {
    expect(resolveNextRoute("https://evil.example")).toBe("/capturar");
  });

  // Um valor "//evil.example" passa em `startsWith("/")` mas o navegador
  // trata como URL protocol-relative — é exatamente o vetor de open-redirect
  // que esse guard existe pra bloquear.
  it("rejeita protocol-relative (//host) como proteção contra open-redirect", () => {
    expect(resolveNextRoute("//evil.example")).toBe("/capturar");
  });
});
