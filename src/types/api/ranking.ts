import type { PublicUser } from "./social";

export type RankingScope = "global" | "friends" | "classroom";

export interface RankingEntry {
  /** Posição absoluta no escopo, começando em 1. */
  position: number;
  user: PublicUser;
  xp: number;
  flashcards: number;
  quizzes: number;
  isCurrentUser: boolean;
}

export interface RankingPage {
  entries: RankingEntry[];
  total: number;
  page: number;
  pageSize: number;
  hasMore: boolean;
}

/** Temporada de XP: um mês civil. O id é `YYYY-MM`. */
export interface RankingSeason {
  id: string;
  startsAt: string;
  endsAt: string;
}

export interface RankingSummary {
  season: RankingSeason;
  /** `null` quando o usuário ainda não pontuou no escopo. */
  position: number | null;
  xp: number;
  flashcards: number;
  quizzes: number;
  /** Total de participantes do escopo, para ler "7º de 128". */
  total: number;
}

export interface SeasonChampion {
  seasonId: string;
  scope: RankingScope;
  classroomId: string | null;
  user: PublicUser;
  xp: number;
}
