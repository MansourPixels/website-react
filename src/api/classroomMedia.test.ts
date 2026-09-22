import { beforeEach, describe, expect, it, vi } from "vitest";

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

import {
  getClassroomMedia,
  getClassroomMediaMindMap,
  getClassroomTranscript,
  gradeClassroomMediaQuiz,
  listClassroomMediaFlashcards,
  listClassroomMediaQuiz,
  regenerateClassroomMediaArtifacts,
} from "./classroomMedia";

const BASE = "/api/classrooms/t1/folders/p1/contents/c1";

describe("leituras do áudio ou vídeo de uma turma", () => {
  beforeEach(() => {
    apiFetch.mockReset();
  });

  it("consulta o detalhe e a transcrição pelos três ids, com o AbortSignal", async () => {
    const signal = new AbortController().signal;
    apiFetch.mockResolvedValue({ id: "c1", summary: null, keyMoments: [] });

    await getClassroomMedia("t1", "p1", "c1", signal);
    await getClassroomTranscript("t1", "p1", "c1", signal);

    expect(apiFetch).toHaveBeenNthCalledWith(1, `${BASE}/media`, { signal });
    expect(apiFetch).toHaveBeenNthCalledWith(2, `${BASE}/transcript`, { signal });
  });

  it("um material sem dados ainda (ou anterior aos recursos) é uma resposta válida, não um erro", async () => {
    const empty = { id: "c1", processingStatus: "COMPLETED", summary: null, keyMoments: [], durationSeconds: null };
    apiFetch.mockResolvedValue(empty);

    await expect(getClassroomMedia("t1", "p1", "c1")).resolves.toEqual(empty);
  });

  it("lista o simulado e os flashcards do material", async () => {
    apiFetch.mockResolvedValue([]);

    await listClassroomMediaQuiz("t1", "p1", "c1");
    await listClassroomMediaFlashcards("t1", "p1", "c1");

    expect(apiFetch.mock.calls.map((call) => call[0])).toEqual([`${BASE}/quiz`, `${BASE}/flashcards`]);
  });

  it("devolve o mapa normalizado, e raiz nula enquanto não foi gerado", async () => {
    apiFetch.mockResolvedValueOnce({ raiz: null, generatedAt: null });
    await expect(getClassroomMediaMindMap("t1", "p1", "c1")).resolves.toEqual({ raiz: null, generatedAt: null });

    apiFetch.mockResolvedValueOnce({
      raiz: { id: "r", label: "Tema", detalhe: null, formula: null, startSeconds: 4, children: [] },
      generatedAt: "2026-09-21T12:00:00Z",
    });
    const map = await getClassroomMediaMindMap("t1", "p1", "c1");

    expect(map.raiz).toMatchObject({ id: "r", label: "Tema", startSeconds: 4 });
    expect(map.raiz).not.toHaveProperty("detalhe", null);
  });

  it("propaga o 404 de quem não é membro ou de um conteúdo que não é mídia", async () => {
    apiFetch.mockRejectedValue(new ApiError(404, "Not found"));

    await expect(getClassroomMedia("t1", "p1", "pdf")).rejects.toMatchObject({ status: 404 });
  });
});

describe("corrigir e gerar de novo", () => {
  beforeEach(() => {
    apiFetch.mockReset();
  });

  it("corrige mandando o array de respostas como corpo", async () => {
    apiFetch.mockResolvedValue({ results: [], correctCount: 0, totalQuestions: 0 });
    const answers = [{ questionId: "q1", selectedOption: "B" as const }];

    await gradeClassroomMediaQuiz("t1", "p1", "c1", answers);

    expect(apiFetch).toHaveBeenCalledWith(`${BASE}/quiz/grade`, { method: "POST", body: answers, signal: undefined });
  });

  it("propaga o 400 de uma pergunta de outro material", async () => {
    apiFetch.mockRejectedValue(new ApiError(400, "Question does not belong to this quiz"));

    await expect(gradeClassroomMediaQuiz("t1", "p1", "c1", [])).rejects.toMatchObject({ status: 400 });
  });

  it("gera de novo com POST sem corpo e deixa passar 403, 409 e 429", async () => {
    apiFetch.mockResolvedValueOnce(undefined);
    await regenerateClassroomMediaArtifacts("t1", "p1", "c1");
    expect(apiFetch).toHaveBeenCalledWith(`${BASE}/artifacts/generate`, { method: "POST", signal: undefined });

    for (const status of [403, 409, 429]) {
      apiFetch.mockRejectedValueOnce(new ApiError(status, "no"));
      await expect(regenerateClassroomMediaArtifacts("t1", "p1", "c1")).rejects.toMatchObject({ status });
    }
  });
});
