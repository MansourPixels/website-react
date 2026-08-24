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

export interface StudyPlan {
  discipline: string;
  focus: string;
  description: string;
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
  plans: [
    {
      discipline: "Português",
      focus: "Produção textual de redações",
      description:
        "Percebemos que a produção textual de redações precisa de um pouco mais de atenção. Com treino e dedicação, você pode evoluir bastante nessa habilidade!",
    },
    {
      discipline: "Geografia",
      focus: "Climatologia e biomas brasileiros",
      description:
        "As questões de climatologia foram as que geraram mais dúvidas. Revisar os biomas junto com os tipos de clima ajuda a fixar os dois assuntos de uma vez.",
    },
    {
      discipline: "Matemática",
      focus: "Equações do terceiro grau",
      description:
        "Você vai bem em matemática, mas as equações do terceiro grau ainda custam tempo. Um simulado curto por dia deve resolver.",
    },
  ] satisfies StudyPlan[],
};
