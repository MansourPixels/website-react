export interface QuizQuestion {
  id: string;
  position: number;
  question: string;
  optionA: string;
  optionB: string;
  optionC: string;
  optionD: string;
}

export type QuizOption = "A" | "B" | "C" | "D";

export interface GradeRequestItem {
  questionId: string;
  selectedOption: QuizOption;
}

export type GradeRequest = GradeRequestItem[];

export interface GradeResultItem {
  questionId: string;
  correct: boolean;
}

export interface GradeResponse {
  results: GradeResultItem[];
  correctCount: number;
  totalQuestions: number;
}
