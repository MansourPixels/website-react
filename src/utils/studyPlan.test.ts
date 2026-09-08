import { describe, expect, it } from "vitest";

import type { StudyPlanStep } from "@/types/api/studyPlan";
import { groupProgress, groupStepsByDiscipline, stepDestinationPath } from "./studyPlan";

function step(overrides: Partial<StudyPlanStep> = {}): StudyPlanStep {
  return {
    id: "step-1",
    stepType: "REVIEW_SUMMARY",
    motherFolderId: "mae-1",
    motherFolderName: "Cálculo",
    childFolderId: "filha-1",
    childFolderName: "Limites",
    completed: false,
    completedAt: null,
    ...overrides,
  };
}

describe("stepDestinationPath", () => {
  it("monta a rota a partir do tipo de passo", () => {
    expect(stepDestinationPath(step({ stepType: "RETAKE_QUIZ" }))).toBe(
      "/pastas/mae-1/assuntos/filha-1/simulado-prova",
    );
  });
});

describe("groupStepsByDiscipline", () => {
  it("agrupa passos consecutivos da mesma disciplina", () => {
    const steps = [
      step({ id: "1", motherFolderId: "a", motherFolderName: "A" }),
      step({ id: "2", motherFolderId: "a", motherFolderName: "A" }),
      step({ id: "3", motherFolderId: "b", motherFolderName: "B" }),
    ];

    const groups = groupStepsByDiscipline(steps);

    expect(groups).toHaveLength(2);
    expect(groups[0].steps.map((s) => s.id)).toEqual(["1", "2"]);
    expect(groups[1].steps.map((s) => s.id)).toEqual(["3"]);
  });

  it("cria um novo grupo quando a mesma disciplina reaparece não-consecutiva", () => {
    // A API não garante ordenação por disciplina — passos da mesma mãe fora
    // de sequência viram grupos separados, não são mesclados.
    const steps = [
      step({ id: "1", motherFolderId: "a" }),
      step({ id: "2", motherFolderId: "b" }),
      step({ id: "3", motherFolderId: "a" }),
    ];

    expect(groupStepsByDiscipline(steps)).toHaveLength(3);
  });

  it("devolve lista vazia pra lista vazia", () => {
    expect(groupStepsByDiscipline([])).toEqual([]);
  });
});

describe("groupProgress", () => {
  it("calcula completed/total/isComplete/isStarted/nextStep", () => {
    const steps = [
      step({ id: "1", completed: true }),
      step({ id: "2", completed: false }),
    ];

    const progress = groupProgress(steps);

    expect(progress.completed).toBe(1);
    expect(progress.total).toBe(2);
    expect(progress.isComplete).toBe(false);
    expect(progress.isStarted).toBe(true);
    expect(progress.nextStep?.id).toBe("2");
  });

  it("isComplete só é true com total > 0 e tudo concluído", () => {
    expect(groupProgress([]).isComplete).toBe(false);
    expect(groupProgress([step({ completed: true })]).isComplete).toBe(true);
  });

  it("nextStep é null quando tudo já foi concluído", () => {
    expect(groupProgress([step({ completed: true })]).nextStep).toBeNull();
  });
});
