export type StudyPlanStepType =
  | "REVIEW_SUMMARY"
  | "REVIEW_FLASHCARDS"
  | "RETAKE_QUIZ"
  | "REVIEW_MIND_MAP";

export interface StudyPlanStep {
  id: string;
  stepType: StudyPlanStepType;
  motherFolderId: string;
  motherFolderName: string;
  childFolderId: string;
  childFolderName: string;
  completed: boolean;
  completedAt: string | null;
}

export interface StudyPlan {
  generatedAt: string | null;
  steps: StudyPlanStep[];
}
