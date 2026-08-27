import type {
  GradeRequestItem,
  GradeResponse,
  QuizQuestion,
} from "@/types/api/quiz";

import { apiFetch } from "./client";

export function listQuiz(childFolderId: string): Promise<QuizQuestion[]> {
  return apiFetch<QuizQuestion[]>(`/api/child-folders/${childFolderId}/quiz`);
}

export function generateQuiz(childFolderId: string): Promise<void> {
  return apiFetch<void>(`/api/child-folders/${childFolderId}/quiz/generate`, {
    method: "POST",
  });
}

export function gradeQuiz(
  childFolderId: string,
  answers: GradeRequestItem[],
): Promise<GradeResponse> {
  return apiFetch<GradeResponse>(
    `/api/child-folders/${childFolderId}/quiz/grade`,
    { method: "POST", body: answers },
  );
}
