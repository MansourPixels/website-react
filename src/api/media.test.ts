import { beforeEach, describe, expect, it, vi } from "vitest";

const { apiFetch, apiUpload, ApiError } = vi.hoisted(() => {
  class TestApiError extends Error {
    status: number;
    detail: string;

    constructor(status: number, detail: string) {
      super(detail);
      this.status = status;
      this.detail = detail;
    }
  }

  return { apiFetch: vi.fn(), apiUpload: vi.fn(), ApiError: TestApiError };
});

vi.mock("./client", () => ({ apiFetch, apiUpload, ApiError }));

import {
  getMedia,
  getMediaMindMap,
  getTranscript,
  gradeMediaQuiz,
  listMediaFlashcards,
  listMediaQuiz,
  regenerateMediaArtifacts,
  uploadMedia,
} from "./media";

describe("uploadMedia", () => {
  beforeEach(() => {
    apiUpload.mockReset();
  });

  it("envia só o arquivo, por multipart, para o endpoint de mídia da pasta", async () => {
    apiUpload.mockResolvedValue({ id: "c1", processingStatus: "PENDING" });
    const file = new File(["audio"], "aula.mp3", { type: "audio/mpeg" });

    const result = await uploadMedia("pasta-1", file);

    expect(result).toEqual({ id: "c1", processingStatus: "PENDING" });
    const [path, body] = apiUpload.mock.calls[0];
    expect(path).toBe("/api/child-folders/pasta-1/media");
    expect(body).toBeInstanceOf(FormData);
    expect([...body.keys()]).toEqual(["file"]);
    expect((body.get("file") as File).name).toBe("aula.mp3");
  });

  it("repassa o progresso e o AbortSignal ao envio", async () => {
    apiUpload.mockResolvedValue({});
    const controller = new AbortController();
    const onProgress = vi.fn();

    await uploadMedia("pasta-1", new File(["a"], "a.mp3"), { signal: controller.signal, onProgress });

    expect(apiUpload.mock.calls[0][2]).toEqual({ signal: controller.signal, onProgress });
  });

  it.each([400, 404, 413, 429, 503])("propaga o erro %s sem mascarar", async (status) => {
    apiUpload.mockRejectedValue(new ApiError(status, "detalhe do servidor"));

    await expect(uploadMedia("pasta-1", new File(["a"], "a.mp3"))).rejects.toMatchObject({
      status,
      detail: "detalhe do servidor",
    });
  });

  it("propaga uma falha de rede como ela é, para a interface explicar", async () => {
    apiUpload.mockRejectedValue(new Error("Falha de rede durante o envio."));

    await expect(uploadMedia("pasta-1", new File(["a"], "a.mp3"))).rejects.toThrow("Falha de rede");
  });
});

describe("getMedia", () => {
  beforeEach(() => {
    apiFetch.mockReset();
  });

  it("consulta o detalhe do áudio e devolve a resposta como veio", async () => {
    const detail = {
      id: "c1",
      processingStatus: "COMPLETED",
      summary: { summary: "resumo", topics: ["a"], keyPoints: ["b"] },
      keyMoments: [{ startSeconds: 65, title: "Krebs", description: "ciclo" }],
    };
    apiFetch.mockResolvedValue(detail);

    await expect(getMedia("c1")).resolves.toEqual(detail);
    expect(apiFetch).toHaveBeenCalledWith("/api/contents/c1/media", { signal: undefined });
  });

  it("repassa o AbortSignal e propaga o 404 de um material que não é áudio", async () => {
    const controller = new AbortController();
    apiFetch.mockRejectedValue(new ApiError(404, "Media not found"));

    await expect(getMedia("pdf-1", controller.signal)).rejects.toMatchObject({ status: 404 });
    expect(apiFetch.mock.calls[0][1].signal).toBe(controller.signal);
  });
});

describe("getTranscript", () => {
  beforeEach(() => {
    apiFetch.mockReset();
  });

  it("consulta a transcrição do áudio", async () => {
    const transcript = {
      language: "english",
      durationSeconds: 14,
      segments: [{ startSeconds: 0, endSeconds: 2.8, text: "Olá" }],
      transcribedAt: "2026-09-20T12:00:00Z",
    };
    apiFetch.mockResolvedValue(transcript);

    await expect(getTranscript("c1")).resolves.toEqual(transcript);
    expect(apiFetch).toHaveBeenCalledWith("/api/contents/c1/transcript", { signal: undefined });
  });

  it("uma transcrição que ainda não existe é uma resposta válida, não um erro", async () => {
    apiFetch.mockResolvedValue({ language: null, durationSeconds: null, segments: [], transcribedAt: null });

    const result = await getTranscript("c1");

    expect(result.segments).toEqual([]);
    expect(result.transcribedAt).toBeNull();
  });
});

describe("artefatos do áudio", () => {
  beforeEach(() => {
    apiFetch.mockReset();
  });

  it("lista o simulado, os flashcards e o mapa do áudio pelo id do conteúdo", async () => {
    apiFetch.mockResolvedValue([]);
    const controller = new AbortController();

    await listMediaQuiz("c1", controller.signal);
    await listMediaFlashcards("c1", controller.signal);

    expect(apiFetch).toHaveBeenNthCalledWith(1, "/api/contents/c1/quiz", { signal: controller.signal });
    expect(apiFetch).toHaveBeenNthCalledWith(2, "/api/contents/c1/flashcards", { signal: controller.signal });
  });

  it("corrige mandando o array de respostas como corpo", async () => {
    apiFetch.mockResolvedValue({ results: [], correctCount: 0, totalQuestions: 0 });
    const answers = [{ questionId: "q1", selectedOption: "B" as const }];

    await gradeMediaQuiz("c1", answers);

    expect(apiFetch).toHaveBeenCalledWith("/api/contents/c1/quiz/grade", {
      method: "POST",
      body: answers,
      signal: undefined,
    });
  });

  it("devolve o mapa normalizado, e raiz nula enquanto não foi gerado", async () => {
    apiFetch.mockResolvedValueOnce({ raiz: null, generatedAt: null });
    expect(await getMediaMindMap("c1")).toEqual({ raiz: null, generatedAt: null });

    apiFetch.mockResolvedValueOnce({
      raiz: { id: "r", label: "Aula", detalhe: null, formula: null, startSeconds: 0, children: null },
      generatedAt: "2026-09-20T12:00:00Z",
    });
    expect(await getMediaMindMap("c1")).toEqual({
      raiz: { id: "r", label: "Aula", startSeconds: 0 },
      generatedAt: "2026-09-20T12:00:00Z",
    });
  });

  it("regenera com POST sem corpo e deixa passar 409 e 429", async () => {
    apiFetch.mockResolvedValueOnce(undefined);
    await regenerateMediaArtifacts("c1");
    expect(apiFetch).toHaveBeenCalledWith("/api/contents/c1/artifacts/generate", {
      method: "POST",
      signal: undefined,
    });

    apiFetch.mockRejectedValueOnce(new ApiError(409, "not ready"));
    await expect(regenerateMediaArtifacts("c1")).rejects.toMatchObject({ status: 409 });
    apiFetch.mockRejectedValueOnce(new ApiError(429, "slow down"));
    await expect(regenerateMediaArtifacts("c1")).rejects.toMatchObject({ status: 429 });
  });
});
