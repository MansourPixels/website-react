import { describe, expect, it } from "vitest";

import { decodeAccessTokenClaims } from "./jwt";

function fakeToken(payload: Record<string, unknown>) {
  const base64url = (value: string) =>
    btoa(value).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");

  const header = base64url(JSON.stringify({ alg: "RS256", typ: "JWT" }));
  const body = base64url(JSON.stringify(payload));

  // Assinatura não é validada por decodeAccessTokenClaims — qualquer coisa serve.
  return `${header}.${body}.assinatura-fake`;
}

describe("decodeAccessTokenClaims", () => {
  it("extrai sub, email e preferred_username do payload", () => {
    const token = fakeToken({
      sub: "user-123",
      email: "aluno@example.com",
      preferred_username: "AlunoTeste",
    });

    expect(decodeAccessTokenClaims(token)).toEqual({
      sub: "user-123",
      email: "aluno@example.com",
      preferred_username: "AlunoTeste",
    });
  });

  it("deixa email e preferred_username undefined quando ausentes", () => {
    const token = fakeToken({ sub: "user-123" });

    expect(decodeAccessTokenClaims(token)).toEqual({
      sub: "user-123",
      email: undefined,
      preferred_username: undefined,
    });
  });

  it("devolve null quando falta sub", () => {
    expect(decodeAccessTokenClaims(fakeToken({ email: "a@b.com" }))).toBeNull();
  });

  it("devolve null pra token sem 3 partes", () => {
    expect(decodeAccessTokenClaims("so-uma-parte")).toBeNull();
  });

  it("devolve null pra payload que não é JSON válido", () => {
    expect(decodeAccessTokenClaims("aGVhZGVy.não-é-base64-válido.assinatura")).toBeNull();
  });
});
