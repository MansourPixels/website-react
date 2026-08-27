export interface PerformanceOverview {
  totalAttempts: number;
  totalQuestions: number;
  totalCorrectAnswers: number;
  accuracyPercentage: number;
}

export interface PerformanceByDiscipline {
  motherFolderId: string;
  motherFolderName: string;
  totalAttempts: number;
  totalQuestions: number;
  totalCorrectAnswers: number;
  accuracyPercentage: number;
}
