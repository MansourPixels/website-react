import { describe, expect, it } from "vitest";

import { LANDING_META, pageMeta } from "./pageMeta";

describe("pageMeta", () => {
  it("assina o título com a marca", () => {
    expect(
      pageMeta({ title: "Tarefas", description: "As suas entregas." }),
    ).toContainEqual({ title: "Tarefas — Revi" });
  });

  it("deixa as telas de app fora dos buscadores", () => {
    const meta = pageMeta({ title: "Perfil", description: "O seu perfil." });

    expect(meta).toContainEqual({ name: "robots", content: "noindex" });
    expect(meta.some((tag) => "property" in tag)).toBe(false);
  });

  it("abre para busca e compartilhamento só o que é público", () => {
    const meta = pageMeta({
      title: "Termos de Uso",
      description: "As regras para usar o Revi.",
      indexable: true,
    });

    expect(meta.some((tag) => "name" in tag && tag.name === "robots")).toBe(
      false,
    );
    expect(meta).toContainEqual({
      property: "og:title",
      content: "Termos de Uso — Revi",
    });
    expect(meta).toContainEqual({
      property: "og:description",
      content: "As regras para usar o Revi.",
    });
  });

  it("deixa a landing indexável", () => {
    // É o `meta()` do root, e o root é o que vai dentro do `index.html` do SPA:
    // um `noindex` aqui tiraria o app inteiro dos buscadores.
    expect(LANDING_META.indexable).toBe(true);
  });
});

// A reclamação que originou tudo isto foi toda página exibir o título do root.
// Rota nova que esqueça o `meta()` volta a cair nele sem ninguém perceber — em
// tela isso é invisível, então quem repara é este teste.
describe("rotas", () => {
  const sources = import.meta.glob("../routes/**/*.tsx", {
    query: "?raw",
    import: "default",
    eager: true,
  }) as Record<string, string>;

  const pages = Object.entries(sources).filter(
    ([file]) => !file.includes("/components/") && !file.endsWith("layout.tsx"),
  );

  it("encontra as rotas", () => {
    expect(pages.length).toBeGreaterThan(30);
  });

  it.each(pages)("%s exporta meta()", (_file, source) => {
    expect(source).toContain("export function meta()");
  });
});
