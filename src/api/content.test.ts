import { beforeEach, describe, expect, it, vi } from "vitest";

import type { Content, ContentText } from "@/types/api/content";

const { apiFetch, ApiError } = vi.hoisted(() => {
  class TestApiError extends Error {
    status: number;
    detail: string;

    constructor(status: number, detail: string) {
      super(detail);
      this.status = status;
      this.detail = detail;
    }
  }

  return { apiFetch: vi.fn(), ApiError: TestApiError };
});

vi.mock("./client", () => ({ apiFetch, ApiError }));

import { getContentText, searchContent } from "./content";

const contentText: ContentText = {
  contentId: "c1",
  text: "Texto extraído do material.",
  extractedAt: "2026-09-15T12:34:56Z",
};

const contents: Content[] = [
  {
    id: "a",
    name: "anotacoes.pdf",
    contentType: "PDF",
    childFolderId: "f1",
    hasSummary: true,
  },
];

describe("getContentText", () => {
  beforeEach(() => {
    apiFetch.mockReset();
  });

  it("devolve a resposta real do endpoint", async () => {
    apiFetch.mockResolvedValue(contentText);

    await expect(getContentText("c1")).resolves.toEqual(contentText);
    expect(apiFetch).toHaveBeenCalledWith("/api/contents/c1/text", {
      signal: undefined,
    });
  });

  for (const error of [
    new ApiError(401, "Sessão expirada."),
    new ApiError(404, "Content not found."),
    new ApiError(500, "Falha interna."),
    new Error("Rede indisponível."),
  ]) {
    it(`propaga ${error.message}`, async () => {
      apiFetch.mockRejectedValue(error);

      await expect(getContentText("c1")).rejects.toBe(error);
    });
  }
});

describe("searchContent", () => {
  beforeEach(() => {
    apiFetch.mockReset();
  });

  it("mantém o fallback demonstrativo quando o endpoint de busca não existe", async () => {
    apiFetch
      .mockRejectedValueOnce(new ApiError(404, "Endpoint não existe."))
      .mockResolvedValueOnce(contents);

    await expect(searchContent("f1", "inércia")).resolves.toEqual([]);
  });
});
