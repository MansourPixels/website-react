import { describe, expect, it } from "vitest";

import { normalizeLatexDelimiters } from "./markdown";

describe("normalizeLatexDelimiters", () => {
  it("converte \\[ ... \\] em $$ ... $$", () => {
    expect(normalizeLatexDelimiters("\\[x^2 + y^2\\]")).toBe("$$x^2 + y^2$$");
  });

  it("converte \\( ... \\) em $ ... $", () => {
    expect(normalizeLatexDelimiters("a fórmula \\(E = mc^2\\) aqui")).toBe(
      "a fórmula $E = mc^2$ aqui",
    );
  });

  it("converte várias ocorrências no mesmo texto", () => {
    expect(normalizeLatexDelimiters("\\(a\\) e \\(b\\)")).toBe("$a$ e $b$");
  });

  it("não mexe em texto sem delimitadores LaTeX", () => {
    expect(normalizeLatexDelimiters("texto normal, sem fórmula")).toBe(
      "texto normal, sem fórmula",
    );
  });
});
