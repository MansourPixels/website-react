import { describe, expect, it } from "vitest";

import {
  sanitizeOnboardingByOwner,
  sanitizeOnboardingState,
} from "./onboardingStorage";

describe("sanitizeOnboardingState", () => {
  it("cai em null quando o valor é irreconhecível", () => {
    expect(sanitizeOnboardingState(null)).toEqual({ completedAt: null });
    expect(sanitizeOnboardingState("concluído")).toEqual({ completedAt: null });
  });

  it("preserva a data de conclusão", () => {
    expect(
      sanitizeOnboardingState({ completedAt: "2026-09-16T10:00:00Z" })
        .completedAt,
    ).toBe("2026-09-16T10:00:00Z");
  });

  it("trata string vazia como não concluído", () => {
    // O back devolveria `null`; uma string vazia só pode ter vindo de escrita
    // corrompida, e lê-la como concluído trancaria o aluno fora do onboarding.
    expect(sanitizeOnboardingState({ completedAt: "" }).completedAt).toBeNull();
  });

  it("ignora tipo errado em completedAt", () => {
    expect(sanitizeOnboardingState({ completedAt: 123 }).completedAt).toBeNull();
    expect(
      sanitizeOnboardingState({ completedAt: true }).completedAt,
    ).toBeNull();
  });
});

describe("sanitizeOnboardingByOwner", () => {
  it("cai em {} quando o valor não é um objeto de usuários", () => {
    expect(sanitizeOnboardingByOwner(null)).toEqual({});
    expect(sanitizeOnboardingByOwner("nada")).toEqual({});
    // Array é `typeof "object"`: sem a checagem explícita, os índices virariam
    // ownerIds.
    expect(sanitizeOnboardingByOwner([1, 2])).toEqual({});
  });

  it("mantém os usuários separados no mesmo aparelho", () => {
    const byOwner = sanitizeOnboardingByOwner({
      ana: { completedAt: "2026-09-16T10:00:00Z" },
      bruno: { completedAt: null },
    });

    expect(byOwner.ana.completedAt).toBe("2026-09-16T10:00:00Z");
    expect(byOwner.bruno.completedAt).toBeNull();
  });

  it("uma entrada corrompida não derruba a dos outros", () => {
    const byOwner = sanitizeOnboardingByOwner({
      ana: "lixo",
      bruno: { completedAt: "2026-09-16T10:00:00Z" },
    });

    expect(byOwner.ana.completedAt).toBeNull();
    expect(byOwner.bruno.completedAt).toBe("2026-09-16T10:00:00Z");
  });
});
