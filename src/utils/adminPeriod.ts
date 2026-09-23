import type { AdminPeriod } from "@/api/admin";

export type PeriodPreset = "hoje" | "7d" | "30d" | "mes";

/** O período escolhido na tela: um atalho, ou datas no fuso de São Paulo (`ate` inclui o dia). */
export type ReportPeriodChoice = { preset: PeriodPreset } | { preset: "personalizado"; de: string; ate: string };

export const PERIOD_PRESETS: { value: PeriodPreset; label: string }[] = [
  { value: "hoje", label: "Hoje" },
  { value: "7d", label: "7 dias" },
  { value: "30d", label: "30 dias" },
  { value: "mes", label: "Mês atual" },
];

export const DEFAULT_PERIOD: ReportPeriodChoice = { preset: "30d" };

const MAX_DAYS = 366;
const DATE = /^\d{4}-\d{2}-\d{2}$/;

function parseDay(value: string | null): Date | null {
  if (value === null || !DATE.test(value)) return null;
  const date = new Date(`${value}T00:00:00Z`);

  return Number.isNaN(date.getTime()) || date.toISOString().slice(0, 10) !== value ? null : date;
}

function shiftDays(day: string, days: number): string {
  const date = new Date(`${day}T00:00:00Z`);
  date.setUTCDate(date.getUTCDate() + days);

  return date.toISOString().slice(0, 10);
}

/**
 * Lê o período da URL (`?periodo=7d` ou `?de=2026-09-01&ate=2026-09-30`). Um
 * atalho ou datas inválidas (fora do formato, invertidas ou com mais de 366
 * dias) voltam para os últimos 30 dias, em vez de uma tela de erro.
 */
export function periodFromSearch(params: URLSearchParams): ReportPeriodChoice {
  const preset = params.get("periodo");
  if (preset !== null && PERIOD_PRESETS.some((option) => option.value === preset)) {
    return { preset: preset as PeriodPreset };
  }

  const de = params.get("de");
  const ate = params.get("ate");
  const from = parseDay(de);
  const to = parseDay(ate);
  if (from !== null && to !== null && from <= to) {
    const days = (to.getTime() - from.getTime()) / 86_400_000 + 1;
    if (days <= MAX_DAYS) return { preset: "personalizado", de: de as string, ate: ate as string };
  }

  return DEFAULT_PERIOD;
}

export function periodToSearch(period: ReportPeriodChoice): URLSearchParams {
  return new URLSearchParams(
    period.preset === "personalizado" ? { de: period.de, ate: period.ate } : { periodo: period.preset },
  );
}

/** As datas que a API recebe. `today` é o dia de hoje em São Paulo (`saoPauloDay()`). */
export function periodToApi(period: ReportPeriodChoice, today: string): Required<AdminPeriod> {
  switch (period.preset) {
    case "hoje":
      return { from: today, to: today };
    case "7d":
      return { from: shiftDays(today, -6), to: today };
    case "30d":
      return { from: shiftDays(today, -29), to: today };
    case "mes":
      return { from: `${today.slice(0, 8)}01`, to: today };
    case "personalizado":
      return { from: period.de, to: period.ate };
  }
}
