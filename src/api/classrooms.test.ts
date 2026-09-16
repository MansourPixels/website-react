import { beforeEach, describe, expect, it, vi } from "vitest";

const { apiFetch, ApiError } = vi.hoisted(() => {
  class TestApiError extends Error {
    status: number;
    detail: string;
    constructor(status: number, detail: string) { super(detail); this.status = status; this.detail = detail; }
  }
  return { apiFetch: vi.fn(), ApiError: TestApiError };
});

vi.mock("./client", () => ({ apiFetch, ApiError }));

import {
  createClassroomMaterialSnapshot,
  createClassroomReference,
  getClassroomMindMap,
  getClassroomMaterialSnapshot,
  getClassroomSummary,
  listClassroomFlashcards,
  listClassroomQuiz,
  listReviMaterials,
} from "./classrooms";

describe("classroom material sharing API", () => {
  beforeEach(() => apiFetch.mockReset());

  it("uses the real personal material catalogue endpoint", async () => {
    apiFetch.mockResolvedValue([{ childFolderId: "personal-1", kinds: ["mindmap"] }]);
    await expect(listReviMaterials()).resolves.toEqual([{ childFolderId: "personal-1", kinds: ["mindmap"] }]);
    expect(apiFetch).toHaveBeenCalledWith("/api/me/materials", { signal: undefined });
  });

  it("sends the reference and snapshot payloads without a mock fallback", async () => {
    apiFetch.mockResolvedValue({ id: "content-1" });
    await createClassroomReference("class-1", "folder-1", { kind: "mindmap", title: "Mapa", description: "", reviMaterialId: "personal-1" });
    expect(apiFetch).toHaveBeenLastCalledWith("/api/classrooms/class-1/folders/folder-1/contents", { method: "POST", body: { kind: "mindmap", title: "Mapa", description: "", reviMaterialId: "personal-1" } });
    await createClassroomMaterialSnapshot("class-1", "folder-1", { sourceChildFolderId: "personal-1", title: "Cópia", description: "" });
    expect(apiFetch).toHaveBeenLastCalledWith("/api/classrooms/class-1/folders/folder-1/contents/snapshots", { method: "POST", body: { sourceChildFolderId: "personal-1", title: "Cópia", description: "" } });
  });

  it("loads a snapshot by content id", async () => {
    apiFetch.mockResolvedValue({ contentId: "content-1" });
    await getClassroomMaterialSnapshot("class-1", "folder-1", "content-1");
    expect(apiFetch).toHaveBeenCalledWith("/api/classrooms/class-1/folders/folder-1/contents/content-1/snapshot", { signal: undefined });
  });

  it("loads the four shared AI artifacts using classroom endpoints", async () => {
    apiFetch
      .mockResolvedValueOnce({ markdown: "Resumo" })
      .mockResolvedValueOnce([{ front: "Pergunta", back: "Resposta" }])
      .mockResolvedValueOnce([{ question: "Questão", correctOption: "A" }])
      .mockResolvedValueOnce({ raiz: { id: "root", label: "Raiz" } });

    await expect(getClassroomSummary("class-1", "folder-1")).resolves.toEqual({ markdown: "Resumo" });
    await expect(listClassroomFlashcards("class-1", "folder-1")).resolves.toEqual([{ front: "Pergunta", back: "Resposta" }]);
    await expect(listClassroomQuiz("class-1", "folder-1")).resolves.toEqual([{ question: "Questão", correctOption: "A" }]);
    await expect(getClassroomMindMap("class-1", "folder-1")).resolves.toEqual({ raiz: { id: "root", label: "Raiz" } });

    expect(apiFetch).toHaveBeenNthCalledWith(1, "/api/classrooms/class-1/folders/folder-1/summary", { signal: undefined });
    expect(apiFetch).toHaveBeenNthCalledWith(2, "/api/classrooms/class-1/folders/folder-1/flashcards", { signal: undefined });
    expect(apiFetch).toHaveBeenNthCalledWith(3, "/api/classrooms/class-1/folders/folder-1/quiz", { signal: undefined });
    expect(apiFetch).toHaveBeenNthCalledWith(4, "/api/classrooms/class-1/folders/folder-1/mind-map", { signal: undefined });
  });

  it("preserves pending semantics for empty classroom artifacts", async () => {
    apiFetch
      .mockResolvedValueOnce(undefined)
      .mockResolvedValueOnce([])
      .mockResolvedValueOnce([])
      .mockResolvedValueOnce(undefined);

    await expect(getClassroomSummary("class-1", "folder-1")).resolves.toBeNull();
    await expect(listClassroomFlashcards("class-1", "folder-1")).resolves.toEqual([]);
    await expect(listClassroomQuiz("class-1", "folder-1")).resolves.toEqual([]);
    await expect(getClassroomMindMap("class-1", "folder-1")).resolves.toBeNull();
  });

});
