export type AscensionDayState = "done" | "today" | "missed" | "future";

export interface AscensionDay {
  label: string;
  state: AscensionDayState;
}

export interface AscensionMilestone {
  title: string;
  description: string;
  goal: number;
}

export interface AscensionMonth {
  label: string;
  days: number;
  totalDays: number;
}

export const ascension = {
  currentStreak: 13,
  recordStreak: 21,
  freezes: 2,
  daysThisMonth: 18,
  minutesThisWeek: 265,
  week: [
    { label: "Seg", state: "done" },
    { label: "Ter", state: "done" },
    { label: "Qua", state: "done" },
    { label: "Qui", state: "done" },
    { label: "Sex", state: "today" },
    { label: "Sáb", state: "future" },
    { label: "Dom", state: "future" },
  ] satisfies AscensionDay[],
  milestones: [
    {
      title: "Primeira chama",
      description: "3 dias seguidos de estudo",
      goal: 3,
    },
    {
      title: "Semana completa",
      description: "7 dias seguidos de estudo",
      goal: 7,
    },
    {
      title: "Duas semanas",
      description: "14 dias seguidos de estudo",
      goal: 14,
    },
    {
      title: "Mês em ascensão",
      description: "30 dias seguidos de estudo",
      goal: 30,
    },
  ] satisfies AscensionMilestone[],
  months: [
    { label: "Abril", days: 19, totalDays: 30 },
    { label: "Maio", days: 24, totalDays: 31 },
    { label: "Junho", days: 21, totalDays: 30 },
    { label: "Julho", days: 26, totalDays: 31 },
    { label: "Agosto", days: 18, totalDays: 31 },
  ] satisfies AscensionMonth[],
};
