import { studyPlans } from "@/mocks/studyPlans";

export interface DisciplinePerformance {
  name: string;
  accuracy: number;
  cards: number;
  delta: number;
}

export interface StudyDay {
  label: string;
  minutes: number;
}

export const performance = {
  overallAccuracy: 72,
  accuracyDelta: 6,
  studiedSubjects: 14,
  reviewedCards: 296,
  practiceTests: 6,
  minutesThisWeek: 275,
  cardsDelta: 42,
  testsDelta: 2,
  minutesDelta: -35,
  disciplines: [
    { name: "Sociologia", accuracy: 88, cards: 36, delta: 4 },
    { name: "Matemática", accuracy: 81, cards: 96, delta: 7 },
    { name: "História", accuracy: 74, cards: 58, delta: 3 },
    { name: "Geografia", accuracy: 57, cards: 42, delta: -2 },
    { name: "Português", accuracy: 48, cards: 64, delta: -5 },
  ] satisfies DisciplinePerformance[],
  week: [
    { label: "Seg", minutes: 35 },
    { label: "Ter", minutes: 50 },
    { label: "Qua", minutes: 20 },
    { label: "Qui", minutes: 65 },
    { label: "Sex", minutes: 45 },
    { label: "Sáb", minutes: 30 },
    { label: "Dom", minutes: 30 },
  ] satisfies StudyDay[],
  plans: studyPlans,
};
