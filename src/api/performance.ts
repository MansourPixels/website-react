import type {
  PerformanceByDiscipline,
  PerformanceOverview,
} from "@/types/api/performance";

import { apiFetch } from "./client";

export function getOverview(): Promise<PerformanceOverview> {
  return apiFetch<PerformanceOverview>("/api/performance/overview");
}

export function getByDiscipline(): Promise<PerformanceByDiscipline[]> {
  return apiFetch<PerformanceByDiscipline[]>("/api/performance/by-discipline");
}
