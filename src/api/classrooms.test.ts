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
  uploadClassroomContent,
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

describe("uploadClassroomContent", () => {
  beforeEach(() => apiFetch.mockReset());

  function sent() {
    return apiFetch.mock.calls[0][1].body as FormData;
  }

  it("deriva o kind da extensão e envia os campos do formulário", async () => {
    apiFetch.mockResolvedValue({ id: "c1" });

    await uploadClassroomContent("class-1", "folder-1", {
      file: new File(["a"], "aula.MP3", { type: "audio/mpeg" }),
      title: "Aula 1",
      description: "Introdução",
    });

    expect(apiFetch.mock.calls[0][0]).toBe("/api/classrooms/class-1/folders/folder-1/contents/upload");
    expect(apiFetch.mock.calls[0][1].method).toBe("POST");
    expect(sent().get("kind")).toBe("audio");
    expect(sent().get("title")).toBe("Aula 1");
    expect(sent().get("description")).toBe("Introdução");
    expect((sent().get("file") as File).name).toBe("aula.MP3");
  });

  it.each([
    ["notas.pdf", "pdf"],
    ["foto.jpg", "image"],
    ["foto.png", "image"],
    ["aula.m4a", "audio"],
    ["aula.flac", "audio"],
  ])("%s é enviado como %s", async (name, kind) => {
    apiFetch.mockResolvedValue({});

    await uploadClassroomContent("c", "f", { file: new File(["a"], name), title: "t" });

    expect(sent().get("kind")).toBe(kind);
  });

  it("não envia descrição vazia", async () => {
    apiFetch.mockResolvedValue({});

    await uploadClassroomContent("c", "f", { file: new File(["a"], "a.mp3"), title: "t", description: "" });

    expect(sent().has("description")).toBe(false);
  });

  it("recusa no cliente uma extensão que a turma não aceita, sem chamar a API", () => {
    expect(() =>
      uploadClassroomContent("c", "f", { file: new File(["a"], "clip.mp4"), title: "t" }),
    ).toThrowError(/áudio/);
    expect(apiFetch).not.toHaveBeenCalled();
  });
});
