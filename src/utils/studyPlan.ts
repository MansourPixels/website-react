import type { StudyPlanStep, StudyPlanStepType } from "@/types/api/studyPlan";
import { FileText, ListCheck, Zap, type LucideIcon } from "lucide-react";

interface StudyPlanStepKindMeta {
  label: string;
  goal: string;
  icon: LucideIcon;
  chip: string;
  tint: string;
  action: string;
  routeSegment: string;
}

export const studyPlanStepKinds: Record<StudyPlanStepType, StudyPlanStepKindMeta> = {
  REVIEW_SUMMARY: {
    label: "Resumo",
    goal: "Revisar o conteúdo já estudado nesta pasta.",
    icon: FileText,
    chip: "bg-purple-700",
    tint: "content-bg-purple-200",
    action: "Ler o resumo",
    routeSegment: "resumo",
  },
  REVIEW_FLASHCARDS: {
    label: "Flash Cards",
    goal: "Fixar o conteúdo com cartões de memorização.",
    icon: Zap,
    chip: "bg-emerald-500",
    tint: "content-bg-emerald-200",
    action: "Revisar os cartões",
    routeSegment: "flash-cards",
  },
  RETAKE_QUIZ: {
    label: "Simulado",
    goal: "Testar o que você aprendeu com um simulado.",
    icon: ListCheck,
    chip: "bg-orange-600",
    tint: "content-bg-orange-200",
    action: "Fazer o simulado",
    routeSegment: "simulado-prova",
  },
};

export function stepDestinationPath(step: StudyPlanStep) {
  return `/pastas/${step.motherFolderId}/assuntos/${step.childFolderId}/${studyPlanStepKinds[step.stepType].routeSegment}`;
}

export interface StudyPlanGroup {
  motherFolderId: string;
  motherFolderName: string;
  steps: StudyPlanStep[];
}

// A API não tem o conceito de "um plano por disciplina" — devolve uma lista
// única com os passos das até 3 disciplinas mais fracas, sempre agrupados.
// Reconstrói os grupos aqui para manter a UI de "um card por disciplina".
export function groupStepsByDiscipline(steps: StudyPlanStep[]): StudyPlanGroup[] {
  const groups: StudyPlanGroup[] = [];

  for (const step of steps) {
    const last = groups.at(-1);

    if (last !== undefined && last.motherFolderId === step.motherFolderId) {
      last.steps.push(step);
    } else {
      groups.push({
        motherFolderId: step.motherFolderId,
        motherFolderName: step.motherFolderName,
        steps: [step],
      });
    }
  }

  return groups;
}

export function groupProgress(steps: StudyPlanStep[]) {
  const completed = steps.filter((step) => step.completed).length;
  const total = steps.length;

  return {
    completed,
    total,
    isComplete: total > 0 && completed === total,
    isStarted: completed > 0,
    nextStep: steps.find((step) => !step.completed) ?? null,
  };
}
