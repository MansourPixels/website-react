export interface StreakTodayChecklist {
  upload: boolean;
  summary: boolean;
  flashcards: boolean;
  quiz: boolean;
}

export interface StreakStatus {
  currentStreak: number;
  recordStreak: number;
  daysThisMonth: number;
  daysActiveThisWeek: number;
  todayIsGold: boolean;
  today: StreakTodayChecklist;
}

export type StreakDayStatus = "NONE" | "PARTIAL" | "GOLD" | "FROZEN";

export interface StreakCalendarDay {
  date: string;
  status: StreakDayStatus;
}
