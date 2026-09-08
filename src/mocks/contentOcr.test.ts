import { describe, expect, it } from "vitest";

import { ApiError } from "@/api/client";
import { isMissingEndpoint } from "@/api/content";
import type { Content } from "@/types/api/content";

import { mockContentText, mockSearchContents } from "./contentOcr";

const contents: Content[] = [
  {
    id: "c-fisica",
    name: "aula-de-fisica.jpg",
    contentType: "IMAGE",
    childFolderId: "f1",
    hasSummary: true,
  },
  {
    id: "c-prova",
    name: "prova-antiga.pdf",
    contentType: "PDF",
    childFolderId: "f1",
    hasSummary: true,
  },
];

describe("isMissingEndpoint", () => {
  it("reconhece endpoint ausente em 404 e 501", () => {
    expect(isMissingEndpoint(new ApiError(404, "não existe"))).toBe(true);
    expect(isMissingEndpoint(new ApiError(501, "não implementado"))).toBe(true);
  });

  it("não confunde erro de verdade com endpoint ausente", () => {
    // O que importa: um 500 não pode virar dado mockado silenciosamente.
    expect(isMissingEndpoint(new ApiError(500, "explodiu"))).toBe(false);
    expect(isMissingEndpoint(new ApiError(403, "sem permissão"))).toBe(false);
    expect(isMissingEndpoint(new Error("rede caiu"))).toBe(false);
    expect(isMissingEndpoint(null)).toBe(false);
  });
});

describe("mockContentText", () => {
  it("é estável: o mesmo id devolve sempre o mesmo texto", () => {
    expect(mockContentText("c-fisica").text).toBe(
      mockContentText("c-fisica").text,
    );
  });

  it("distribui ids diferentes entre páginas diferentes", () => {
    const textos = new Set(
      ["a", "b", "c", "d", "e", "f", "g"].map((id) => mockContentText(id).text),
    );

    expect(textos.size).toBeGreaterThan(1);
  });

  it("marca a extração como concluída", () => {
    expect(mockContentText("c-fisica").extractedAt).not.toBeNull();
  });
});

describe("mockSearchContents", () => {
  it("acha pelo nome do arquivo", () => {
    expect(mockSearchContents(contents, "prova").map((c) => c.id)).toEqual([
      "c-prova",
    ]);
  });

  it("acha por palavra que só existe dentro do texto extraído", () => {
    // É o que justifica o endpoint: o nome do arquivo não contém esta palavra.
    const palavra = mockContentText("c-fisica")
      .text.split(/\s+/)
      .find((word) => word.length > 7)!;

    expect(
      mockSearchContents(contents, palavra).map((c) => c.id),
    ).toContain("c-fisica");
  });

  it("ignora caixa e acento", () => {
    const palavra = mockContentText("c-fisica")
      .text.split(/\s+/)
      .find((word) => word.length > 7)!;

    expect(
      mockSearchContents(contents, palavra.toUpperCase()).length,
    ).toBeGreaterThan(0);
  });

  it("termo vazio devolve a lista inteira", () => {
    expect(mockSearchContents(contents, "")).toHaveLength(2);
  });

  it("termo sem correspondência devolve lista vazia", () => {
    expect(mockSearchContents(contents, "zzzzqqqq")).toHaveLength(0);
  });
});
