/**
 * Temporada de XP: um mês civil. O XP zera na virada do mês, e o campeão da
 * temporada encerrada vira histórico.
 *
 * Tudo aqui trabalha em horário local — o reset acontece à meia-noite do fuso
 * do aluno. Se o backend decidir usar UTC, este é o único arquivo a mudar.
 */

/** Pesos de cada atividade. Fonte única: nenhum outro arquivo soma XP. */
export const XP_PER_FLASHCARD = 10;
export const XP_PER_QUIZ = 25;

export function xpFromActivity(activity: {
  flashcards: number;
  quizzes: number;
}): number {
  return (
    activity.flashcards * XP_PER_FLASHCARD + activity.quizzes * XP_PER_QUIZ
  );
}

function pad(value: number): string {
  return value.toString().padStart(2, "0");
}

/** Id da temporada no formato `YYYY-MM`. */
export function currentSeasonId(date: Date = new Date()): string {
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}`;
}

function parseSeasonId(seasonId: string): { year: number; month: number } {
  const [year, month] = seasonId.split("-").map(Number);

  return { year, month };
}

export function previousSeasonId(seasonId: string): string {
  const { year, month } = parseSeasonId(seasonId);

  return month === 1 ? `${year - 1}-12` : `${year}-${pad(month - 1)}`;
}

export function seasonStartsAt(seasonId: string): Date {
  const { year, month } = parseSeasonId(seasonId);

  return new Date(year, month - 1, 1, 0, 0, 0, 0);
}

/** Primeiro instante da temporada seguinte: é quando o XP zera. */
export function seasonEndsAt(seasonId: string): Date {
  const { year, month } = parseSeasonId(seasonId);

  return new Date(year, month, 1, 0, 0, 0, 0);
}

function startOfDay(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate());
}

/**
 * Dias até a virada. Nunca é zero: o reset é sempre a meia-noite do primeiro
 * dia do mês seguinte, então mesmo no último dia do mês ainda falta um dia.
 */
export function daysUntilReset(date: Date = new Date()): number {
  const reset = seasonEndsAt(currentSeasonId(date));
  const diff = startOfDay(reset).getTime() - startOfDay(date).getTime();

  return Math.max(1, Math.round(diff / 86_400_000));
}

export function formatResetCountdown(date: Date = new Date()): string {
  const days = daysUntilReset(date);

  if (days === 1) return "Zera amanhã";

  return `Zera em ${days} dias`;
}

/** "1 de outubro" — a data em que o XP zera, para acompanhar a contagem. */
export function formatResetDate(date: Date = new Date()): string {
  return seasonEndsAt(currentSeasonId(date)).toLocaleDateString("pt-BR", {
    day: "numeric",
    month: "long",
  });
}

/** "agosto de 2026", usado no card de campeão da temporada anterior. */
export function formatSeasonLabel(seasonId: string): string {
  return seasonStartsAt(seasonId).toLocaleDateString("pt-BR", {
    month: "long",
    year: "numeric",
  });
}

/** "1.240 XP" — separador de milhar em pt-BR. */
export function formatXp(xp: number): string {
  return `${xp.toLocaleString("pt-BR")} XP`;
}

export function formatPosition(position: number | null): string {
  return position === null ? "–" : `${position}º`;
}
