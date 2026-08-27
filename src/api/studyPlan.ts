import type { StudyPlan } from "@/types/api/studyPlan";

import { apiFetch } from "./client";

export function generateStudyPlan(): Promise<void> {
  return apiFetch<void>("/api/study-plan/generate", { method: "POST" });
}

export function getStudyPlan(): Promise<StudyPlan> {
  return apiFetch<StudyPlan>("/api/study-plan");
}

export function completeStep(stepId: string): Promise<void> {
  return apiFetch<void>(`/api/study-plan/steps/${stepId}/complete`, {
    method: "PATCH",
  });
}
