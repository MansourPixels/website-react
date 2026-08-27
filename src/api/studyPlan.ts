import type { StudyPlan } from "@/types/api/studyPlan";

import { apiFetch } from "./client";

export function generateStudyPlan(motherFolderIds?: string[]): Promise<void> {
  return apiFetch<void>("/api/study-plan/generate", {
    method: "POST",
    body:
      motherFolderIds !== undefined && motherFolderIds.length > 0
        ? { motherFolderIds }
        : undefined,
  });
}

export function getStudyPlan(): Promise<StudyPlan> {
  return apiFetch<StudyPlan>("/api/study-plan");
}

export function completeStep(stepId: string): Promise<void> {
  return apiFetch<void>(`/api/study-plan/steps/${stepId}/complete`, {
    method: "PATCH",
  });
}
