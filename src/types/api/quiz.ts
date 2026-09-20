export interface QuizQuestion {
  id: string;
  position: number;
  question: string;
  optionA: string;
  optionB: string;
  optionC: string;
  optionD: string;
  /** O segundo do áudio em que a resposta é explicada; só no simulado de um áudio. */
  startSeconds?: number | null;
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
  /** A alternativa certa e o momento a rever; só na correção do simulado de um áudio. */
  correctOption?: QuizOption;
  startSeconds?: number | null;
}

export interface GradeResponse {
  results: GradeResultItem[];
  correctCount: number;
  totalQuestions: number;
}
