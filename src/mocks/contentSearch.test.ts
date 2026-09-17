import { describe, expect, it } from "vitest";

import type { Content } from "@/types/api/content";

import { mockSearchContents } from "./contentSearch";

const contents: Content[] = [
  {
    id: "a",
    name: "aula.jpg",
    contentType: "IMAGE",
    childFolderId: "f1",
    hasSummary: true,
  },
  {
    id: "b",
    name: "prova.pdf",
    contentType: "PDF",
    childFolderId: "f1",
    hasSummary: true,
  },
  {
    id: "c",
    name: "anotacoes.pdf",
    contentType: "PDF",
    childFolderId: "f1",
    hasSummary: true,
  },
  {
    id: "d",
    name: "material.jpg",
    contentType: "IMAGE",
    childFolderId: "f1",
    hasSummary: true,
  },
  {
    id: "e",
    name: "resumo.pdf",
    contentType: "PDF",
    childFolderId: "f1",
    hasSummary: true,
  },
];

describe("mockSearchContents", () => {
  it("acha pelo nome do arquivo", () => {
    expect(mockSearchContents(contents, "prova").map((c) => c.id)).toEqual([
      "b",
    ]);
  });

  it("acha por palavra que só existe dentro do texto extraído", () => {
    // É o que justifica o fallback: nenhum nome de arquivo contém esta palavra.
    expect(
      mockSearchContents(contents, "inércia").map((c) => c.id),
    ).not.toHaveLength(0);
  });

  it("ignora caixa e acento", () => {
    expect(
      mockSearchContents(contents, "INERCIA").length,
    ).toBeGreaterThan(0);
  });

  it("termo vazio devolve a lista inteira", () => {
    expect(mockSearchContents(contents, "")).toHaveLength(contents.length);
  });

  it("termo sem correspondência devolve lista vazia", () => {
    expect(mockSearchContents(contents, "zzzzqqqq")).toHaveLength(0);
  });
});
