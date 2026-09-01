import { describe, expect, it } from "vitest";

import { getInitials, normalizeText } from "./text";

describe("normalizeText", () => {
  it("remove acento, baixa a caixa e tira espaço nas pontas", () => {
    expect(normalizeText("  Ótica Geométrica  ")).toBe("otica geometrica");
  });

  it("mantém string vazia como vazia", () => {
    expect(normalizeText("")).toBe("");
  });
});

describe("getInitials", () => {
  it("pega a primeira letra do primeiro e do último nome", () => {
    expect(getInitials("Aluno Teste Avatar")).toBe("AA");
  });

  it("usa só a primeira letra pra nome de uma palavra só", () => {
    expect(getInitials("Aluno")).toBe("A");
  });

  it("devolve string vazia pra nome vazio ou só espaço", () => {
    expect(getInitials("")).toBe("");
    expect(getInitials("   ")).toBe("");
  });

  it("ignora espaços duplicados entre os nomes", () => {
    expect(getInitials("Aluno   Teste")).toBe("AT");
  });

  it("sempre devolve maiúsculo", () => {
    expect(getInitials("aluno teste")).toBe("AT");
  });
});
