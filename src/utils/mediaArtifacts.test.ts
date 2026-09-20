import { describe, expect, it } from "vitest";

import type { MindMapBranch } from "@/types/api/mindMap";
import type { GradeResultItem } from "@/types/api/quiz";

import {
  ARTIFACT_POLL_LIMIT_MS,
  artifactPhase,
  normalizeMindMapBranch,
  reviewMoments,
  seekLabel,
  shouldPollArtifact,
} from "./mediaArtifacts";

describe("artifactPhase", () => {
  it("não consulta nada enquanto o áudio ainda é processado", () => {
    for (const audioStatus of ["PENDING", "PROCESSING"] as const) {
      expect(artifactPhase({ audioStatus, isEmpty: true, elapsedMs: 0 })).toBe("waiting-audio");
    }
  });

  it("um áudio que falhou não tem de onde gerar", () => {
    expect(artifactPhase({ audioStatus: "FAILED", isEmpty: true, elapsedMs: 0 })).toBe("audio-failed");
  });

  it("vazio de um áudio pronto está sendo gerado, até o limite", () => {
    expect(artifactPhase({ audioStatus: "COMPLETED", isEmpty: true, elapsedMs: 0 })).toBe("generating");
    expect(
      artifactPhase({ audioStatus: "COMPLETED", isEmpty: true, elapsedMs: ARTIFACT_POLL_LIMIT_MS - 1 }),
    ).toBe("generating");
  });

  it("vazio além do limite é uma geração demorada (ou que falhou)", () => {
    expect(
      artifactPhase({ audioStatus: "COMPLETED", isEmpty: true, elapsedMs: ARTIFACT_POLL_LIMIT_MS }),
    ).toBe("timed-out");
  });

  it("com dados está pronto, por mais tempo que tenha levado", () => {
    expect(
      artifactPhase({ audioStatus: "COMPLETED", isEmpty: false, elapsedMs: ARTIFACT_POLL_LIMIT_MS * 3 }),
    ).toBe("ready");
  });
});

describe("shouldPollArtifact", () => {
  it("só continua consultando o que está sendo gerado", () => {
    expect(shouldPollArtifact("generating")).toBe(true);
    for (const phase of ["waiting-audio", "audio-failed", "timed-out", "ready"] as const) {
      expect(shouldPollArtifact(phase)).toBe(false);
    }
  });
});

describe("reviewMoments", () => {
  const result = (questionId: string, correct: boolean, startSeconds?: number | null): GradeResultItem => ({
    questionId,
    correct,
    startSeconds,
  });

  it("só os erros que têm momento, na ordem do áudio", () => {
    const moments = reviewMoments([
      result("q1", false, 300),
      result("q2", true, 10),
      result("q3", false, null),
      result("q4", false, 40),
      result("q5", false),
    ]);

    expect(moments.map((moment) => moment.questionId)).toEqual(["q4", "q1"]);
  });

  it("aceita o momento zero, o começo do áudio", () => {
    expect(reviewMoments([result("q1", false, 0)])).toHaveLength(1);
  });

  it("não altera a lista recebida", () => {
    const results = [result("q1", false, 300), result("q2", false, 10)];

    reviewMoments(results);

    expect(results.map((item) => item.questionId)).toEqual(["q1", "q2"]);
  });
});

describe("seekLabel", () => {
  it("formata o momento como m:ss e h:mm:ss", () => {
    expect(seekLabel(0)).toBe("Ir para 0:00");
    expect(seekLabel(754)).toBe("Ir para 12:34");
    expect(seekLabel(3723)).toBe("Ir para 1:02:03");
  });

  it("sem momento (ou um inválido) não há atalho", () => {
    expect(seekLabel(null)).toBeNull();
    expect(seekLabel(undefined)).toBeNull();
    expect(seekLabel(-1)).toBeNull();
    expect(seekLabel(Number.NaN)).toBeNull();
  });
});

describe("normalizeMindMapBranch", () => {
  it("troca os null do backend por campo ausente, em todos os níveis", () => {
    const raw = {
      id: "root",
      label: "Aula",
      detalhe: null,
      formula: null,
      startSeconds: 0,
      children: [
        { id: "a", label: "Tema", detalhe: "explicação", formula: "E=mc^2", startSeconds: 125, children: [] },
        { id: "b", label: "Outro", detalhe: " ", formula: null, startSeconds: null, children: null },
      ],
    } as unknown as MindMapBranch;

    expect(normalizeMindMapBranch(raw)).toEqual({
      id: "root",
      label: "Aula",
      startSeconds: 0,
      children: [
        { id: "a", label: "Tema", detalhe: "explicação", formula: "E=mc^2", startSeconds: 125 },
        { id: "b", label: "Outro" },
      ],
    });
  });
});
