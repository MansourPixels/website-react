import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  getMedia: vi.fn(),
  getTranscript: vi.fn(),
  listMediaQuiz: vi.fn(),
  gradeMediaQuiz: vi.fn(),
  listMediaFlashcards: vi.fn(),
  getMediaMindMap: vi.fn(),
  regenerateMediaArtifacts: vi.fn(),
  getDownloadUrl: vi.fn(),
  getClassroomDownloadUrl: vi.fn(),
  getClassroomMedia: vi.fn(),
  getClassroomTranscript: vi.fn(),
  listClassroomMediaQuiz: vi.fn(),
  gradeClassroomMediaQuiz: vi.fn(),
  listClassroomMediaFlashcards: vi.fn(),
  getClassroomMediaMindMap: vi.fn(),
  regenerateClassroomMediaArtifacts: vi.fn(),
}));

vi.mock("./media", () => ({
  getMedia: mocks.getMedia,
  getTranscript: mocks.getTranscript,
  listMediaQuiz: mocks.listMediaQuiz,
  gradeMediaQuiz: mocks.gradeMediaQuiz,
  listMediaFlashcards: mocks.listMediaFlashcards,
  getMediaMindMap: mocks.getMediaMindMap,
  regenerateMediaArtifacts: mocks.regenerateMediaArtifacts,
}));
vi.mock("./content", () => ({ getDownloadUrl: mocks.getDownloadUrl }));
vi.mock("./classrooms", () => ({ getClassroomDownloadUrl: mocks.getClassroomDownloadUrl }));
vi.mock("./classroomMedia", () => ({
  getClassroomMedia: mocks.getClassroomMedia,
  getClassroomTranscript: mocks.getClassroomTranscript,
  listClassroomMediaQuiz: mocks.listClassroomMediaQuiz,
  gradeClassroomMediaQuiz: mocks.gradeClassroomMediaQuiz,
  listClassroomMediaFlashcards: mocks.listClassroomMediaFlashcards,
  getClassroomMediaMindMap: mocks.getClassroomMediaMindMap,
  regenerateClassroomMediaArtifacts: mocks.regenerateClassroomMediaArtifacts,
}));

import { classroomMediaSource, personalMediaSource } from "./mediaSource";

describe("personalMediaSource", () => {
  beforeEach(() => {
    Object.values(mocks).forEach((mock) => mock.mockReset());
  });

  it("aponta cada operação para o endpoint do material pessoal, com o id do conteúdo", async () => {
    const source = personalMediaSource("c1");
    const signal = new AbortController().signal;
    mocks.getDownloadUrl.mockResolvedValue({ url: "https://minio/x", expiresAt: "" });

    await source.getMedia(signal);
    await source.getTranscript(signal);
    await source.listQuiz(signal);
    await source.listFlashcards(signal);
    await source.getMindMap(signal);
    await source.gradeQuiz([{ questionId: "q", selectedOption: "A" }]);
    await source.regenerate?.();

    expect(mocks.getMedia).toHaveBeenCalledWith("c1", signal);
    expect(mocks.getTranscript).toHaveBeenCalledWith("c1", signal);
    expect(mocks.listMediaQuiz).toHaveBeenCalledWith("c1", signal);
    expect(mocks.listMediaFlashcards).toHaveBeenCalledWith("c1", signal);
    expect(mocks.getMediaMindMap).toHaveBeenCalledWith("c1", signal);
    expect(mocks.gradeMediaQuiz).toHaveBeenCalledWith("c1", [{ questionId: "q", selectedOption: "A" }]);
    expect(mocks.regenerateMediaArtifacts).toHaveBeenCalledWith("c1");
    await expect(source.getDownloadUrl()).resolves.toBe("https://minio/x");
  });

  it("o material pessoal sempre pode gerar de novo", () => {
    expect(personalMediaSource("c1").regenerate).toBeDefined();
  });
});

describe("classroomMediaSource", () => {
  beforeEach(() => {
    Object.values(mocks).forEach((mock) => mock.mockReset());
  });

  it("aponta cada operação para o endpoint da turma, com os três ids", async () => {
    const source = classroomMediaSource("t1", "p1", "c1", true);
    const signal = new AbortController().signal;
    mocks.getClassroomDownloadUrl.mockResolvedValue({ url: "https://minio/y", expiresAt: "" });

    await source.getMedia(signal);
    await source.getTranscript(signal);
    await source.listQuiz(signal);
    await source.listFlashcards(signal);
    await source.getMindMap(signal);
    await source.gradeQuiz([{ questionId: "q", selectedOption: "B" }]);
    await source.regenerate?.();

    expect(mocks.getClassroomMedia).toHaveBeenCalledWith("t1", "p1", "c1", signal);
    expect(mocks.getClassroomTranscript).toHaveBeenCalledWith("t1", "p1", "c1", signal);
    expect(mocks.listClassroomMediaQuiz).toHaveBeenCalledWith("t1", "p1", "c1", signal);
    expect(mocks.listClassroomMediaFlashcards).toHaveBeenCalledWith("t1", "p1", "c1", signal);
    expect(mocks.getClassroomMediaMindMap).toHaveBeenCalledWith("t1", "p1", "c1", signal);
    expect(mocks.gradeClassroomMediaQuiz).toHaveBeenCalledWith("t1", "p1", "c1", [{ questionId: "q", selectedOption: "B" }]);
    expect(mocks.regenerateClassroomMediaArtifacts).toHaveBeenCalledWith("t1", "p1", "c1");
    expect(mocks.getMedia).not.toHaveBeenCalled();
    await expect(source.getDownloadUrl()).resolves.toBe("https://minio/y");
  });

  it("sem permissão a fonte não oferece gerar de novo, e o resto continua igual", () => {
    const source = classroomMediaSource("t1", "p1", "c1", false);

    expect(source.regenerate).toBeUndefined();
    expect(source.getMedia).toBeTypeOf("function");
  });
});
