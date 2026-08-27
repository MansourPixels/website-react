import type { StreakCalendarDay, StreakStatus } from "@/types/api/streak";

import { apiFetch } from "./client";

export function getStreak(): Promise<StreakStatus> {
  return apiFetch<StreakStatus>("/api/streak");
}

// month no formato YYYY-MM; omitido, o back usa o mês corrente por padrão.
export function getStreakCalendar(
  month?: string,
): Promise<StreakCalendarDay[]> {
  const query = month !== undefined ? `?month=${encodeURIComponent(month)}` : "";

  return apiFetch<StreakCalendarDay[]>(`/api/streak/calendar${query}`);
}
